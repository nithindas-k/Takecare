import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import NavBar from '../../components/common/NavBar';
import Footer from '../../components/common/Footer';
import { Button } from '../../components/ui/button';
import { ChevronRight } from "lucide-react";
import {
    Dialog,
    DialogBody,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { appointmentService } from '../../services/appointmentService';
import { paymentService } from '../../services/paymentService';
import { toast } from 'sonner';

const PaymentPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [policyOpen, setPolicyOpen] = useState(false);
    const [bookingData, setBookingData] = useState<any>(null);
    const [processing, setProcessing] = useState(false);
    const [existingAppointmentId, setExistingAppointmentId] = useState<string | null>(
        location.state?.appointmentId || sessionStorage.getItem('tempAppointmentId') || null
    );

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error('Please login to continue');
            navigate('/patient/login');
            return;
        }

        const stored = sessionStorage.getItem('bookingData');
        if (stored) {
            setBookingData(JSON.parse(stored));
        } else {
            navigate('/');
        }
    }, [navigate]);

    const handleRazorpayPay = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            toast.error('Session expired. Please login again');
            navigate('/patient/login');
            return;
        }

        if (!acceptedTerms) {
            toast.error('Please accept the terms and conditions');
            return;
        }

        if (!bookingData) {
            toast.error('Booking data not found');
            navigate('/');
            return;
        }

        if (!(window as any).Razorpay) {
            toast.error('Razorpay SDK not loaded. Please refresh the page.');
            return;
        }

        setProcessing(true);
        try {
            let appointmentId = existingAppointmentId;

            if (!appointmentId) {
                const appointmentPayload = {
                    doctorId: bookingData.doctorId,
                    appointmentDate: bookingData.appointmentDate,
                    appointmentTime: bookingData.appointmentTime,
                    slotId: bookingData.slotId,
                    appointmentType: bookingData.appointmentType,
                    reason: bookingData.patientDetails?.reason || bookingData.patientDetails?.symptoms || ''
                };

                console.log('PaymentPage: Creating appointment with payload:', appointmentPayload);
                const appointmentResponse = await appointmentService.createAppointment(appointmentPayload);
                console.log('PaymentPage: Appointment creation response:', appointmentResponse);
                if (!appointmentResponse || !appointmentResponse.success) {
                    throw new Error(appointmentResponse?.message || 'Failed to create appointment');
                }

                appointmentId = appointmentResponse.data?.id || appointmentResponse.data?._id;
                if (!appointmentId) {
                    throw new Error('Appointment ID missing');
                }

                setExistingAppointmentId(appointmentId);
                sessionStorage.setItem('tempAppointmentId', appointmentId);
            }

            const orderResponse = await paymentService.createRazorpayOrder({
                appointmentId,
                amount: total,
                currency: 'INR'
            });

            if (!orderResponse || !orderResponse.success) {
                throw new Error(orderResponse?.message || 'Failed to create Razorpay order');
            }

            const { keyId, orderId, amount, currency } = orderResponse.data;

            const options = {
                key: keyId,
                amount,
                currency,
                name: 'TakeCare',
                description: 'Appointment booking payment',
                order_id: orderId,
                handler: async (response: any) => {
                    try {
                        const verifyResponse = await paymentService.verifyRazorpayPayment({
                            appointmentId: appointmentId!,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });

                        if (!verifyResponse || !verifyResponse.success) {
                            throw new Error(verifyResponse?.message || 'Payment verification failed');
                        }

                        sessionStorage.setItem('appointmentId', appointmentId!);
                        sessionStorage.removeItem('bookingData');
                        sessionStorage.removeItem('tempAppointmentId');

                        toast.success('Payment successful! Appointment booked.');
                        navigate('/booking-success');
                    } catch (err: any) {
                        console.error('Verify payment error:', err);
                        toast.error(err?.response?.data?.message || err?.message || 'Payment verification failed');
                    } finally {
                        setProcessing(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setProcessing(false);
                        toast.info("Payment cancelled. Redirecting to appointment details...");
                        navigate(`/patient/appointments/${appointmentId}`);
                    },
                },
                theme: {
                    color: '#00A1B0'
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on('payment.failed', (resp: any) => {
                console.error('Razorpay payment failed:', resp);
                toast.error(resp?.error?.description || 'Payment failed');
                setProcessing(false);
                navigate(`/patient/appointments/${appointmentId}`);
            });

            rzp.open();
        } catch (error: any) {
            console.error('Razorpay payment error:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Payment failed. Please try again.';
            toast.error(errorMessage);
            setProcessing(false);


        }
    };

    const consultationFee = (bookingData && (bookingData.appointmentType?.toLowerCase() === 'video' || bookingData.type?.toLowerCase() === 'video'))
        ? (bookingData.doctor.videoFees || bookingData.doctor.fees || 0)
        : (bookingData ? (bookingData.doctor.chatFees || bookingData.doctor.fees || 0) : 0);

    const total = consultationFee;

    useEffect(() => {
        if (bookingData) {
            console.log("Fee Calculation Debug:", {
                type: bookingData.appointmentType,
                videoFees: bookingData.doctor?.videoFees,
                chatFees: bookingData.doctor?.chatFees,
                fee: consultationFee,
                total: total
            });
        }
    }, [bookingData, consultationFee, total]);

    if (!bookingData) {
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <NavBar />

            <Dialog open={policyOpen} onOpenChange={setPolicyOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader className="relative bg-gradient-to-r from-[#e0f7fa] to-[#f0f9ff]">
                        <DialogClose
                            className="absolute right-4 top-4 w-9 h-9 rounded-full bg-white/80 text-gray-700 border border-gray-200 flex items-center justify-center hover:bg-white transition"
                            aria-label="Close"
                        >
                            <ChevronRight size={18} />
                        </DialogClose>

                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 w-10 h-10 rounded-xl bg-[#00A1B0]/10 text-[#00A1B0] flex items-center justify-center font-bold">
                                TC
                            </div>
                            <div>
                                <DialogTitle className="text-[#002f33]">Terms & Refund Policy</DialogTitle>
                                <DialogDescription className="text-gray-600">
                                    Please review these rules before confirming payment.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <DialogBody className="p-5">
                        <div className="space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Refund Rules</h3>

                                <div className="space-y-3 text-sm text-gray-700">
                                    <div className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                            1
                                        </span>
                                        <p>
                                            <span className="font-semibold">Doctor/Admin cancels or rejects:</span>{" "}
                                            You will get a <span className="font-semibold">full refund (100%)</span>.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold">
                                            2
                                        </span>
                                        <p>
                                            <span className="font-semibold">Patient cancels:</span>{" "}
                                            A <span className="font-semibold">30%</span> cancellation fee applies. You will receive a <span className="font-semibold">70% refund</span>.
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs font-bold">
                                            3
                                        </span>
                                        <p>
                                            <span className="font-semibold">No-show (didn’t attend the session):</span>{" "}
                                            Refund is <span className="font-semibold">not possible</span>.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
                                <p className="text-sm text-gray-600">
                                    Refunds (if applicable) will be processed to the original payment method.
                                </p>
                            </div>
                        </div>
                    </DialogBody>

                    <DialogFooter className="justify-end">
                        <DialogClose className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            Okay
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Breadcrumb Section */}
            <div className="relative bg-gradient-to-r from-[#e0f7fa] to-[#f0f9ff] py-16">
                <div className="container mx-auto px-4 text-center relative z-10">
                    <nav className="flex justify-center items-center text-sm font-medium text-gray-500 mb-2">
                        <a href="/" className="hover:text-[#00A1B0]">Home</a>
                        <span className="mx-2">/</span>
                        <span className="text-[#00A1B0]">Doctors</span>
                    </nav>
                    <h1 className="text-4xl font-bold text-[#002f33]">Payment</h1>
                </div>
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute -top-10 -left-10 w-64 h-64 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="absolute top-10 right-10 w-96 h-96 bg-[#00A1B0]/5 rounded-full blur-3xl"></div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-[#00A1B0] transition-colors text-sm"
                    >
                        <FaArrowLeft /> Back
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Payment Method */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-[#002f33] text-lg font-bold mb-6 flex items-center gap-2">
                                <FaCreditCard className="text-[#00A1B0]" />
                                Payment Method
                            </h2>

                            {/* Razorpay (Dummy) */}
                            <div
                                className={`border rounded-md p-4 flex items-center justify-between cursor-pointer mb-6 transition-all shadow-sm border-[#00A1B0] bg-[#f0f9ff]`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center border-[#00A1B0]`}>
                                        <div className="w-2.5 h-2.5 rounded-full bg-[#00A1B0]"></div>
                                    </div>
                                    <span className="font-semibold text-gray-800">Online Payment</span>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-gray-600 text-sm">Consultation Fee</span>
                                    <span className="text-gray-800 font-semibold">₹{consultationFee.toFixed(2)}</span>
                                </div>
                                <div className="border-t border-gray-200 my-2"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[#002f33] font-bold">Total Amount</span>
                                    <span className="text-[#00A1B0] font-bold text-lg">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="flex items-start gap-2 mb-6">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    className="mt-1 w-4 h-4 text-[#00A1B0] border-gray-300 rounded focus:ring-[#00A1B0] cursor-pointer"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-500 leading-relaxed cursor-pointer">
                                    I have read and accept the{' '}
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPolicyOpen(true);
                                        }}
                                        className="text-[#00A1B0] hover:underline"
                                    >
                                        Terms & Conditions
                                    </a>{' '}
                                    and{' '}
                                    <a
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setPolicyOpen(true);
                                        }}
                                        className="text-[#00A1B0] hover:underline"
                                    >
                                        Privacy Policy
                                    </a>
                                    .
                                </label>
                            </div>

                            {/* Pay Button */}
                            <Button
                                onClick={handleRazorpayPay}
                                disabled={!acceptedTerms || processing}
                                className="w-full"
                            >
                                {processing
                                    ? 'Processing...'
                                    : existingAppointmentId
                                        ? 'Retry Payment'
                                        : 'Pay with Online Payment'
                                }
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Booking Summary */}
                    <div className="lg:col-span-1">
                        <h2 className="text-[#002f33] text-lg font-bold mb-4">Booking Summary</h2>

                        {/* Doctor Card */}
                        {bookingData?.doctor && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-100">
                                            <img
                                                src={bookingData.doctor.image || 'https://via.placeholder.com/150'}
                                                alt={bookingData.doctor.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-gray-800 font-bold text-sm">{bookingData.doctor.name}</h3>
                                            <p className="text-gray-500 text-xs">{bookingData.doctor.speciality || 'Doctor'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-[#00A1B0]/10 rounded-full p-1">
                                        <FaCheckCircle className="text-[#008f9c] w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Date & Time Card */}
                        {bookingData && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Booking Date:</span>
                                        <span className="text-gray-500">
                                            {new Date(bookingData.appointmentDate).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Booking Time:</span>
                                        <span className="text-gray-500">{bookingData.appointmentTime}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 font-medium">Consultation Type:</span>
                                        <span className="text-gray-500">
                                            {bookingData.appointmentType === 'video' ? 'Video Consulting' : 'Chat Consulting'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PaymentPage;
