/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import PatientLayout from '../../components/Patient/PatientLayout';
import { FaVideo, FaComments, FaArrowLeft, FaTimes, FaChevronDown, FaChevronUp, FaStethoscope, FaCalendarAlt, FaStar, FaCreditCard, FaExclamationTriangle, FaCheck, FaClock } from 'react-icons/fa';
import ReviewForm from '../../components/reviews/ReviewForm';
import { reviewService } from '../../services/reviewService';
import { appointmentService } from '../../services/appointmentService';
import { API_BASE_URL } from '../../utils/constants';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';
import PrescriptionViewModal from '../../components/Patient/PrescriptionViewModal';
import RecentAppointmentModal from '../../components/Doctor/RecentAppointmentModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import type { PopulatedAppointment, Slot } from '../../types/appointment.types';
import RescheduleModal from '../../components/common/RescheduleModal';
import { ClipboardList } from 'lucide-react';
import { Progress } from '../../components/ui/progress';
import { Field, FieldLabel } from '../../components/ui/field';
import { Skeleton } from '../../components/ui/skeleton';
import { Spinner } from '../../components/ui/spinner';


const AppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const lastFetchedId = useRef<string | null>(null);

    const [appointment, setAppointment] = useState<PopulatedAppointment | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentLoading, setRecentLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [showCancelReason, setShowCancelReason] = useState(false);
    const [showRescheduleDetail, setShowRescheduleDetail] = useState(true);


    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [reviewFormOpen, setReviewFormOpen] = useState(false);
    const [prescriptionViewOpen, setPrescriptionViewOpen] = useState(false);
    const [rejectRescheduleOpen, setRejectRescheduleOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectSubmitting, setRejectSubmitting] = useState(false);
    const [selectedRescheduleId, setSelectedRescheduleId] = useState<string | null>(null);

    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);
    const [recentAptModalOpen, setRecentAptModalOpen] = useState(false);
    const [selectedRecentAptId, setSelectedRecentAptId] = useState<string | null>(null);


    useEffect(() => {
        let isMounted = true;

        const fetchAppointment = async () => {
            if (!id) {
                setLoading(false);
                return;
            }

            if (lastFetchedId.current === id && appointment) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = await appointmentService.getAppointmentById(id);
                if (!response?.success) {
                    throw new Error(response?.message || 'Failed to fetch appointment');
                }
                if (!isMounted) return;
                setAppointment(response.data);
                lastFetchedId.current = id;
            } catch (e: any) {
                if (!isMounted) return;
                setError(e?.response?.data?.message || e?.message || 'Failed to fetch appointment');

            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        const fetchRecentAppointments = async () => {
            setRecentLoading(true);
            try {
                const response = await appointmentService.getMyAppointments(undefined, 1, 5);
                if (response.success && response.data?.appointments && isMounted) {
                    // Filter out current appointment
                    const filtered = response.data.appointments.filter((apt: any) => apt._id !== id);
                    setRecentAppointments(filtered);
                }
            } catch (error) {
                console.error("Failed to fetch recent appointments", error);
            } finally {
                if (isMounted) setRecentLoading(false);
            }
        };

        fetchAppointment();
        fetchRecentAppointments();

        return () => {
            isMounted = false;
        };
    }, [id, appointment]); // appointment dependency might cause loops if not careful, but looks ok as we check lastFetchedId. Ideally remove appointment from dep if possible.

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const normalized = useMemo(() => {
        const apt = appointment
        const doctor: any = apt?.doctor || apt?.doctorId;

        const doctorName = doctor?.name || doctor?.user?.name || doctor?.userId?.name || apt?.doctorName;
        const doctorEmail = doctor?.email || doctor?.user?.email || doctor?.userId?.email || apt?.doctorEmail;
        const doctorPhone = doctor?.phone || doctor?.user?.phone || doctor?.userId?.phone || apt?.doctorPhone;
        const department = doctor?.specialty || doctor?.department || apt?.specialty;
        const doctorImage =
            doctor?.profileImage ||
            doctor?.user?.profileImage ||
            doctor?.image ||
            doctor?.userId?.profileImage ||
            apt?.doctorImage;

        const status = apt?.status;
        const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

        const dateStr = apt?.appointmentDate || apt?.date || '';
        const timeStr = apt?.appointmentTime || apt?.time || '';

        const dateObj = dateStr ? new Date(dateStr) : null;
        const hasValidDate = !!dateObj && !Number.isNaN(dateObj.getTime());

        const isUpcoming = status === 'pending' || status === 'confirmed' || status === 'upcoming';

        let isSessionReady = false;
        if (hasValidDate && timeStr) {
            const now = new Date();
            const [startTimeStr] = timeStr.split('-');
            const [hours, minutes] = startTimeStr.trim().split(':');
            const sessionStart = new Date(dateStr);
            sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            isSessionReady = now >= sessionStart;
        }

        return {
            id: apt?.customId || apt?._id || apt?.id,
            doctorName: doctorName || 'Doctor',
            doctorEmail: doctorEmail || 'N/A',
            doctorPhone: doctorPhone || 'N/A',
            department: department || 'N/A',
            doctorImage: getImageUrl(doctorImage),
            appointmentType: apt?.appointmentType,
            date: dateStr,
            hasValidDate,
            time: appointment?.appointmentTime || '',
            status: status || 'unknown',
            displayStatus,
            consultationFees: apt?.consultationFees ?? 0,
            reason: apt?.reason || '',
            isUpcoming,
            isSessionReady,
        };
    }, [appointment]);

    useEffect(() => {
        const fetchReview = async () => {
            if (id && normalized.status === 'completed') {
                try {
                    const review = await reviewService.getReviewByAppointmentId(id);
                    if (review) {
                        setExistingReview(review);
                    }
                } catch (error) {
                    console.error("Failed to fetch review for appointment:", error);
                }
            }
        };
        fetchReview();
    }, [id, normalized.status]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
            case 'confirmed':
            case 'upcoming':
                return 'bg-blue-100 text-blue-600';
            case 'completed':
                return 'bg-green-100 text-green-600';
            case 'cancelled':
            case 'rejected':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const openCancelDialog = () => {
        setCancelError('');
        setCancelReason('');
        setCancelOpen(true);
    };

    const handleConfirmCancel = async () => {
        if (!id) return;
        const reason = cancelReason.trim();
        if (!reason) {
            setCancelError('Please enter a reason for cancellation.');
            return;
        }

        try {
            setCancelSubmitting(true);
            setCancelError('');


            const appointmentId = appointment?.id || id;
            console.log('Cancelling appointment with ID:', appointmentId);
            const response = await appointmentService.cancelAppointment(appointmentId, reason);
            console.log('Cancel response:', response);
            if (!response?.success) {
                throw new Error(response?.message || 'Failed to cancel appointment');
            }


            try {
                const updatedAppointment = await appointmentService.getAppointmentById(id);
                if (updatedAppointment?.success && updatedAppointment?.data) {
                    setAppointment(updatedAppointment.data);
                } else {

                    setAppointment((prev: any) => ({
                        ...prev,
                        status: 'cancelled',
                        cancellationReason: reason,
                    }));
                }
            } catch {
                console.warn('Failed to refetch appointment, using local update');

                setAppointment((prev: any) => ({
                    ...prev,
                    status: 'cancelled',
                    cancellationReason: reason,
                }));
            }

            setCancelOpen(false);


            toast.success('Appointment cancelled successfully!');
        } catch (e: any) {
            console.error('Cancel error:', e);
            console.error('Error response:', e?.response);
            setCancelError(e?.response?.data?.message || e?.message || 'Failed to cancel appointment');
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handleRescheduleConfirm = async (selectedSlot: Slot, selectedDay: Date) => {
        if (!id || !selectedSlot || !selectedDay) return;

        try {
            const response = await appointmentService.rescheduleAppointment(appointment?.id || id, {
                appointmentDate: selectedDay.toISOString(),
                appointmentTime: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
                slotId: selectedSlot.slotId || selectedSlot.customId,
            });

            if (response?.success) {
                toast.success('Appointment rescheduled successfully! Awaiting doctor approval.');
                setRescheduleOpen(false);

                const updated = await appointmentService.getAppointmentById(id);
                if (updated?.success) setAppointment(updated.data);
            } else {
                toast.error(response?.message || 'Failed to reschedule');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'An error occurred');
        }
    };

    const [existingReview, setExistingReview] = useState<any>(null);

    const handleOpenReview = async () => {
        if (!appointment) return;

        const appointmentId = id || appointment._id || appointment.id;
        if (!appointmentId) {
            toast.error("Appointment ID missing");
            return;
        }

        setReviewFormOpen(true);

        try {
            // Fetch review specifically for this appointment
            const response = await reviewService.getReviewByAppointmentId(appointmentId);
            if (response) {
                setExistingReview(response);
            } else {
                setExistingReview(null);
            }
        } catch (error) {
            console.error("Failed to fetch existing review:", error);
            setExistingReview(null);
        }
    };

    const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
        if (!appointment) return;
        try {
            const docObj: any = appointment.doctor || appointment.doctorId;
            const doctorId = docObj?._id || docObj?.id || (typeof docObj === 'string' ? docObj : null);

            const appointmentId = appointment._id || appointment.id || '';

            if (!doctorId) {
                toast.error("Doctor information missing");
                return;
            }

            if (!appointmentId) {
                toast.error("Appointment information missing");
                return;
            }

            if (existingReview) {
                await reviewService.updateReview(existingReview._id || existingReview.id, data);
                toast.success("Review updated successfully!");

                setExistingReview({ ...existingReview, ...data });
            } else {
                await reviewService.addReview({
                    ...data,
                    appointmentId,
                    doctorId
                });
                toast.success("Review submitted successfully!");

            }
            setReviewFormOpen(false);
        } catch (error: any) {
            console.error("Review submit error:", error);
            toast.error(error.response?.data?.message || "Failed to submit review");
        }
    };

    const handleRetryPayment = () => {
        if (!appointment) return;

        const doctorObj: any = appointment.doctorId || appointment.doctor || {};

        const userObj: any = doctorObj.userId || doctorObj.user || {};


        const videoFees = doctorObj.VideoFees || doctorObj.videoFees || appointment.consultationFees || 0;
        const chatFees = doctorObj.ChatFees || doctorObj.chatFees || appointment.consultationFees || 0;

        const bookingData = {
            doctorId: (typeof doctorObj === 'object' ? doctorObj._id || doctorObj.id : doctorObj) || (typeof appointment.doctorId === 'object' ? appointment.doctorId._id : appointment.doctorId),
            doctor: {
                name: userObj.name || doctorObj.name || normalized.doctorName,
                image: userObj.profileImage || userObj.image || doctorObj.image || normalized.doctorImage,
                speciality: doctorObj.specialty || doctorObj.department || normalized.department,
                videoFees,
                chatFees,
                fees: appointment.consultationFees
            },
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            slotId: appointment.slotId,
            appointmentType: appointment.appointmentType,
            patientDetails: {
                reason: appointment.reason
            }
        };

        sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
        sessionStorage.setItem('tempAppointmentId', appointment._id || appointment.id || '');
        navigate('/payment', { state: { appointmentId: appointment._id || appointment.id || '' } });
    };

    const handleAcceptReschedule = async (appointmentId: string) => {
        try {
            const response = await appointmentService.acceptReschedule(appointmentId);
            if (response.success) {
                toast.success('Appointment rescheduled successfully!');
                const updated = await appointmentService.getAppointmentById(id!);
                if (updated?.success) setAppointment(updated.data);
            } else {
                toast.error(response.message || 'Failed to accept reschedule');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to accept reschedule');
        }
    };

    const handleRejectRescheduleClick = (appointmentId: string) => {
        setSelectedRescheduleId(appointmentId);
        setRejectionReason('');
        setRejectRescheduleOpen(true);
    };

    const handleConfirmRejectReschedule = async () => {
        if (!selectedRescheduleId || !rejectionReason.trim()) return;
        setRejectSubmitting(true);
        try {
            const response = await appointmentService.rejectReschedule(selectedRescheduleId, rejectionReason.trim());
            if (response.success) {
                toast.success('Reschedule request rejected');
                setRejectRescheduleOpen(false);
                const updated = await appointmentService.getAppointmentById(id!);
                if (updated?.success) setAppointment(updated.data);
            } else {
                toast.error(response.message || 'Failed to reject reschedule');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reject reschedule');
        } finally {
            setRejectSubmitting(false);
        }
    };

    const handleViewRecentDetails = (id: string) => {
        setSelectedRecentAptId(id);
        setRecentAptModalOpen(true);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 overflow-x-hidden">
                <NavBar />
                <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-6">
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <Skeleton className="h-4 w-48 mb-5 bg-white/20" />
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-lg bg-white/20" />
                                <div>
                                    <Skeleton className="h-8 w-64 mb-2 bg-white/20" />
                                    <Skeleton className="h-5 w-48 bg-white/20" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <PatientLayout>
                    <div className="space-y-6">
                        {/* Progress Tracker Skeleton */}
                        <Card className="border-none shadow-sm bg-white">
                            <CardContent className="p-3">
                                <Skeleton className="h-4 w-32 mb-4" />
                                <Skeleton className="h-2.5 w-full mb-2 animate-glow-sweep" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Details Skeleton */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 flex gap-4">
                                    <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-6 w-32 rounded-full" />
                                    </div>
                                </div>
                                <div className="lg:col-span-4 space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-10 w-40 rounded-lg" />
                                </div>
                                <div className="lg:col-span-3 flex flex-col items-end gap-3">
                                    <Skeleton className="h-6 w-24 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex gap-2 mt-2">
                                        <Skeleton className="h-9 w-24 rounded-md" />
                                        <Skeleton className="h-9 w-24 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Appointments Skeleton */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <Skeleton className="h-6 w-48" />
                            </div>
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 opacity-40">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-8 w-24 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Overlay Spinner */}
                            <div className="absolute inset-0 flex items-center justify-center pt-10">
                                <div className="flex flex-col items-center gap-2">
                                    <Spinner size="lg" />
                                    <span className="text-xs font-medium text-gray-400">Loading history...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </PatientLayout>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <NavBar />

            {/* Breadcrumb - Smooth Minimal Design */}
            <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-6">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Breadcrumb Navigation */}
                        <nav className="flex items-center gap-2 mb-5 text-white/80 text-sm">
                            <a href="/" className="hover:text-white transition-colors">Home</a>
                            <span>/</span>
                            <a href="/patient/appointments" className="hover:text-white transition-colors">Appointments</a>
                            <span>/</span>
                            <span className="text-white font-medium">Appointment Details</span>
                        </nav>

                        {/* Title Section */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/patient/appointments')}
                                className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                            >
                                <FaArrowLeft size={20} />
                            </button>
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    Appointment Details
                                </h1>
                                <p className="text-white/90 text-base">
                                    View your appointment information
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <PatientLayout>
                {/* Progress Tracker - Ultra Compact */}
                <Card className="mb-3 border-none shadow-sm transition-all duration-500 overflow-hidden bg-white group hover:shadow-md">
                    <CardContent className="p-2 md:p-3">
                        <Field className="w-full">
                            <FieldLabel className="mb-2">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${normalized.status === 'completed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                        normalized.status === 'active' ? 'bg-[#00A1B0] shadow-[0_0_8px_rgba(0,161,176,0.4)]' :
                                            normalized.status === 'cancelled' || normalized.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                                    <span className="text-[10px] font-black tracking-[0.1em] uppercase text-gray-500">Status Trace</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black tracking-tight uppercase px-2 py-0.5 rounded-md ${normalized.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                                        normalized.status === 'active' ? 'bg-[#00A1B0]/10 text-[#00A1B0]' :
                                            normalized.status === 'cancelled' || normalized.status === 'rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                        {normalized.status === 'completed' ? '100% COMPLETED' :
                                            normalized.status === 'active' ? '75% ACTIVE' :
                                                normalized.status === 'confirmed' ? '50% READY' :
                                                    normalized.status === 'pending' ? '25% PENDING' :
                                                        normalized.status === 'reschedule_requested' ? '35% ON HOLD' : '0%'}
                                    </span>
                                </div>
                            </FieldLabel>
                            <Progress
                                value={normalized.status === 'completed' ? 100 :
                                    normalized.status === 'active' ? 75 :
                                        normalized.status === 'confirmed' ? 50 :
                                            normalized.status === 'pending' ? 25 :
                                                normalized.status === 'reschedule_requested' ? 35 : 0}
                                className="h-2 bg-gray-50 border border-gray-100 animate-glow-sweep shadow-[0_0_15px_rgba(0,161,176,0.2)]"
                            />
                            <div className="flex justify-between mt-1.5 px-0.5">
                                {['Booking', 'Confirmed', 'Consultation', 'Completed'].map((step, idx) => {
                                    const steps = ['pending', 'confirmed', 'active', 'completed'];
                                    const currentIdx = steps.indexOf(normalized.status);
                                    const isActive = idx <= currentIdx;
                                    return (
                                        <div key={step} className="flex flex-col items-center">
                                            <span className={`text-[10px] font-black uppercase tracking-tight transition-all duration-500 ${isActive ? 'text-[#00A1B0] opacity-100' : 'text-gray-400 opacity-60'}`}>
                                                {step}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </Field>
                    </CardContent>
                </Card>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                        {error}
                    </div>
                )}


                {/* Payment Pending Warning */}
                {
                    normalized.status === 'pending' && (appointment?.paymentStatus === 'pending' || appointment?.paymentStatus === 'failed') && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                            <FaExclamationTriangle className="text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-semibold text-amber-800 text-sm">Action Required: Payment Pending</h4>
                                <p className="text-sm text-amber-700 mt-1">
                                    Please complete the payment within <strong>5 minutes</strong> to confirm your booking.
                                    If payment is not received, this appointment will be automatically cancelled.
                                </p>
                            </div>
                        </div>
                    )
                }
                {/* Appointment Detail Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
                    {/* Main Appointment Info */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Doctor Info */}
                            <div className="lg:col-span-5">
                                <div className="flex items-start gap-4">
                                    <img
                                        src={normalized.doctorImage}
                                        alt={normalized.doctorName}
                                        className="w-20 h-20 rounded-full aspect-square object-cover border-2 border-gray-200 flex-shrink-0"
                                        onError={(e) => {
                                            e.currentTarget.src = '/doctor.png';
                                        }}
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500 font-medium mb-1">
                                            {normalized.id}
                                        </p>
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {normalized.doctorName}
                                        </h3>
                                        <div className="space-y-1.5">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#00A1B0]/10 text-[#00A1B0] border border-[#00A1B0]/20 text-xs font-semibold">
                                                <FaStethoscope className="text-[#00A1B0]" size={12} />
                                                {normalized.department}
                                            </div>


                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Appointment Type */}
                            <div className="lg:col-span-4">
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Type of Appointment</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00A1B0]/10 text-[#00A1B0]">
                                            {normalized.appointmentType === 'video' ? (
                                                <FaVideo size={16} />
                                            ) : (
                                                <FaComments size={16} />
                                            )}
                                            <span className="font-medium">
                                                {normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Status & Fees */}
                            <div className="lg:col-span-3">
                                <div className="text-right">
                                    <span
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${getStatusColor(
                                            normalized.status
                                        )}`}
                                    >
                                        {normalized.displayStatus}
                                    </span>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Consultation Fees: ₹{normalized.consultationFees}
                                    </p>
                                    <div className="flex justify-end gap-2 mt-3">
                                        {normalized.isUpcoming && (
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setRescheduleOpen(true)}
                                                    className="border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0]/10"
                                                >
                                                    <FaCalendarAlt className="mr-1" size={14} />
                                                    Reschedule
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={openCancelDialog}
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                >
                                                    <FaTimes className="text-red-600" size={14} />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reschedule Request Section */}
                    {normalized.status === 'reschedule_requested' && appointment?.rescheduleRequest && (
                        <div className="px-5 py-3 bg-amber-50/50 border-t border-amber-100">
                            <button
                                onClick={() => setShowRescheduleDetail(!showRescheduleDetail)}
                                className="w-full flex items-center justify-between text-left hover:bg-amber-100/50 rounded-lg p-1.5 -m-1.5 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 text-amber-600 mt-0.5">
                                        <FaExclamationTriangle className="w-full h-full" />
                                    </div>

                                    <div>
                                        <h6 className="text-sm font-semibold text-amber-900">
                                            Action Required: New Time Proposed
                                        </h6>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-amber-700 font-medium">
                                        {showRescheduleDetail ? 'Show Less' : 'Show More'}
                                    </span>
                                    {showRescheduleDetail ? (
                                        <FaChevronUp size={14} className="text-amber-600" />
                                    ) : (
                                        <FaChevronDown size={14} className="text-amber-600" />
                                    )}
                                </div>
                            </button>

                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${showRescheduleDetail ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="pl-0 md:pl-8 space-y-3.5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <Card className="border-amber-200/50 bg-white shadow-none hover:border-amber-300 transition-colors">
                                            <CardHeader className="p-3 pb-1">
                                                <CardTitle className="text-[9px] font-black text-amber-600/80 uppercase tracking-widest flex items-center gap-2">
                                                    <FaCalendarAlt size={10} className="opacity-60" />
                                                    Proposed Date
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                <p className="text-base font-bold text-[#5c3d1e]">
                                                    {new Date(appointment.rescheduleRequest.appointmentDate).toLocaleDateString('en-US', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                            </CardContent>
                                        </Card>

                                        <Card className="border-amber-200/50 bg-white shadow-none hover:border-amber-300 transition-colors">
                                            <CardHeader className="p-3 pb-1">
                                                <CardTitle className="text-[9px] font-black text-amber-600/80 uppercase tracking-widest flex items-center gap-2">
                                                    <FaClock size={10} className="opacity-60" />
                                                    Proposed Time
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                <p className="text-base font-bold text-[#5c3d1e]">
                                                    {appointment.rescheduleRequest.appointmentTime}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                                        <Button
                                            onClick={() => handleAcceptReschedule(id!)}
                                            className="flex-1 h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm hover:shadow-emerald-100 gap-2 transition-all active:scale-[0.98] text-xs"
                                        >
                                            <FaCheck size={12} /> Accept & Update
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRejectRescheduleClick(id!)}
                                            className="flex-1 h-10 bg-white text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-lg shadow-none gap-2 transition-all active:scale-[0.98] text-xs"
                                        >
                                            <FaTimes size={12} /> Reject Proposal
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason Section */}
                    {appointment?.status === 'rejected' && appointment?.rejectionReason && (
                        <div className="px-6 py-4 bg-red-50 border-t border-red-200">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
                                    <svg
                                        className="w-full h-full"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h6 className="text-sm font-semibold text-red-800 mb-1">
                                        Rejection Reason
                                    </h6>
                                    <p className="text-sm text-red-700">
                                        {appointment.rejectionReason}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Cancellation Reason Section */}
                    {/* Cancellation Reason Section */}
                    {appointment?.status === 'cancelled' &&
                        (appointment?.cancellationReason || appointment?.reason) &&
                        (appointment?.cancelledBy === 'doctor' || appointment?.cancelledBy === 'admin') && (
                            <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                                <button
                                    onClick={() => setShowCancelReason(!showCancelReason)}
                                    className="w-full flex items-center justify-between text-left hover:bg-red-100/50 rounded-lg p-2 -m-2 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5">
                                            <svg
                                                className="w-full h-full"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </div>

                                        <div>
                                            <h6 className="text-sm font-semibold text-red-800">
                                                Cancellation Reason ({appointment?.cancelledBy})
                                            </h6>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-red-600 font-medium">
                                            {showCancelReason ? 'Show Less' : 'Show More'}
                                        </span>
                                        {showCancelReason ? (
                                            <FaChevronUp size={14} className="text-red-600" />
                                        ) : (
                                            <FaChevronDown size={14} className="text-red-600" />
                                        )}
                                    </div>
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-in-out ${showCancelReason ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
                                        }`}
                                >
                                    <div className="pl-8">
                                        <p className="text-sm text-red-700 leading-relaxed">
                                            {appointment.cancellationReason || appointment.reason}
                                        </p>

                                        {appointment.cancelledAt && (
                                            <p className="text-xs text-red-600 mt-2">
                                                Cancelled on{' '}
                                                {new Date(appointment.cancelledAt).toLocaleDateString('en-US', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}


                    {/* Review & Doctor Response Section */}
                    {normalized.status === 'completed' && existingReview && (
                        <div className="px-6 py-5 bg-emerald-50/30 border-t border-emerald-100/50">
                            <div className="flex items-center gap-2 mb-4">
                                <h6 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                                    <FaStar className="text-amber-400" /> Your Review
                                </h6>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} size={14} className={i < existingReview.rating ? "text-amber-400" : "text-gray-200"} />
                                    ))}
                                </div>
                            </div>

                            <div className="pl-6 border-l-2 border-emerald-100 ml-1.5 space-y-4">
                                <div>
                                    <p className="text-sm text-gray-700 italic leading-relaxed">"{existingReview.comment}"</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                        Submitted {new Date(existingReview.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {existingReview.response && (
                                    <div className="bg-white/80 rounded-xl p-4 border border-emerald-100 shadow-sm relative mt-4">
                                        <div className="absolute -top-3 left-4 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-emerald-200">
                                            Doctor's Response
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs border border-emerald-100">
                                                DR
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-800 font-medium leading-relaxed">
                                                    {existingReview.response}
                                                </p>
                                                {existingReview.responseDate && (
                                                    <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                                        Responded {new Date(existingReview.responseDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Bottom Details Section */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            <div>
                                <h6 className="text-xs font-semibold text-gray-500 mb-1">
                                    Appointment Date & Time
                                </h6>
                                <p className="text-sm font-medium text-gray-800">
                                    {normalized.hasValidDate
                                        ? new Date(normalized.date).toLocaleDateString('en-US', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                        })
                                        : 'N/A'}{' '}
                                    - {normalized.time || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <h6 className="text-xs font-semibold text-gray-500 mb-1">Reason</h6>
                                <p className="text-sm font-medium text-gray-800">{normalized.reason || 'N/A'}</p>
                            </div>
                            <div>
                                <h6 className="text-xs font-semibold text-gray-500 mb-1">Payment Status</h6>
                                <p className="text-sm font-medium text-gray-800">{appointment?.paymentStatus || 'N/A'}</p>
                            </div>
                            <div>
                                <h6 className="text-xs font-semibold text-gray-500 mb-1">Appointment Type</h6>
                                <p className="text-sm font-medium text-gray-800">
                                    {normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}
                                </p>
                            </div>
                            <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-end">
                                {normalized.isUpcoming && normalized.status === 'confirmed' && (
                                    normalized.isSessionReady ? (
                                        <button
                                            onClick={() => navigate(`/patient/${normalized.appointmentType === 'video' ? 'call' : 'chat'}/${appointment?._id || appointment?.id}`)}
                                            className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors shadow-sm"
                                        >
                                            Start Session
                                        </button>
                                    ) : (
                                        <div className="w-full px-4 py-3 bg-gray-50 text-gray-500 font-medium rounded-xl border border-dashed border-gray-300 text-center text-sm">
                                            Starts at {normalized.time.split(' - ')[0]}
                                        </div>
                                    )
                                )}
                                {normalized.status === 'completed' && (
                                    <div className="flex flex-col gap-2 w-full">
                                        {!existingReview ? (
                                            <button
                                                onClick={handleOpenReview}
                                                className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaStar /> Rate Doctor
                                            </button>
                                        ) : (
                                            <button
                                                onClick={handleOpenReview}
                                                className="w-full px-6 py-2.5 bg-emerald-50 border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-100 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                            >
                                                <FaStar className="text-emerald-500" /> Update Review
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setPrescriptionViewOpen(true)}
                                            className="w-full px-3 py-2.5 bg-white border-2 border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0]/10 font-bold rounded-lg transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 whitespace-nowrap text-sm"
                                        >
                                            <FaStethoscope className="text-lg" /> View Prescription
                                        </button>
                                    </div>
                                )}
                                {/* Pending Payment Action */}
                                {normalized.status === 'pending' && (appointment?.paymentStatus === 'pending' || appointment?.paymentStatus === 'failed') && (
                                    <button
                                        onClick={handleRetryPayment}
                                        className="w-full px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        <FaCreditCard /> Complete Payment
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Appointments Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h5 className="text-lg font-bold text-gray-800">Recent Appointments</h5>
                    </div>
                    {recentLoading ? (
                        <div className="relative min-h-[240px]">
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 opacity-40">
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                            <Skeleton className="h-8 w-24 rounded-md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {/* Overlay Spinner */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Spinner size="lg" />
                                    <span className="text-xs font-medium text-gray-400">Loading history...</span>
                                </div>
                            </div>
                        </div>
                    ) : recentAppointments.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-3">Date & Time</th>
                                            <th className="px-6 py-3">Type</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recentAppointments.map((apt) => (
                                            <tr key={apt._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {new Date(apt.appointmentDate).toLocaleDateString()}
                                                    <span className="text-gray-400 mx-2">•</span>
                                                    {apt.appointmentTime}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 capitalize">
                                                    <div className="flex items-center gap-2">
                                                        {apt.appointmentType === 'video' ? <FaVideo className="text-blue-500" /> : <FaComments className="text-[#00A1B0]" />}
                                                        {apt.appointmentType}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewRecentDetails(apt._id)}
                                                        className="h-8 text-xs border-gray-200 hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        View Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden flex flex-col divide-y divide-gray-100">
                                {recentAppointments.map((apt) => (
                                    <div key={apt._id} className="p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {new Date(apt.appointmentDate).toLocaleDateString()}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">{apt.appointmentTime}</p>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getStatusColor(apt.status)}`}>
                                                {apt.status}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs text-gray-600 capitalize">
                                                {apt.appointmentType === 'video' ? <FaVideo className="text-blue-500" /> : <FaComments className="text-[#00A1B0]" />}
                                                {apt.appointmentType} Consultation
                                            </div>

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewRecentDetails(apt._id)}
                                                className="h-7 text-xs text-[#00A1B0] hover:text-[#008f9c] hover:bg-[#00A1B0]/10 px-2"
                                            >
                                                Details & Prescription &rarr;
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-gray-500">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <ClipboardList className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="font-medium">No recent appointments found</p>
                        </div>
                    )}
                </div>
            </PatientLayout>

            {cancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                            if (!cancelSubmitting) setCancelOpen(false);
                        }}
                    />

                    <div className="relative z-50 w-full max-w-lg mx-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Cancel appointment</CardTitle>
                                <CardDescription>
                                    Please confirm cancellation and provide a reason. This helps the doctor and our support team.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {cancelError && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
                                        {cancelError}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-800">
                                        Reason
                                    </label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Eg: Not feeling well / schedule changed"
                                        rows={4}
                                        disabled={cancelSubmitting}
                                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A1B0]/40 disabled:opacity-50"
                                    />
                                </div>
                            </CardContent>

                            <CardFooter className="justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setCancelOpen(false)}
                                    disabled={cancelSubmitting}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={handleConfirmCancel}
                                    disabled={cancelSubmitting || !cancelReason.trim()}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {cancelSubmitting ? 'Cancelling...' : 'Confirm Cancel'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}

            <RescheduleModal
                isOpen={rescheduleOpen}
                onClose={() => setRescheduleOpen(false)}
                onConfirm={handleRescheduleConfirm}
                doctorId={typeof appointment?.doctorId === 'object' ? appointment.doctorId._id! : (appointment?.doctorId || '')}
                doctorName={normalized.doctorName}
            />

            <ReviewForm
                isOpen={reviewFormOpen}
                onClose={() => setReviewFormOpen(false)}
                onSubmit={handleReviewSubmit}
                title={existingReview ? "Update Your Review" : "Rate Your Experience"}
                initialData={existingReview ? { rating: existingReview.rating, comment: existingReview.comment } : undefined}
            />

            <PrescriptionViewModal
                isOpen={prescriptionViewOpen}
                onClose={() => setPrescriptionViewOpen(false)}
                appointmentId={(appointment?._id || appointment?.id || id || '') as string}
            />

            <RecentAppointmentModal
                isOpen={recentAptModalOpen}
                onClose={() => setRecentAptModalOpen(false)}
                appointmentId={selectedRecentAptId}
                role="patient"
            />

            <Dialog open={rejectRescheduleOpen} onOpenChange={setRejectRescheduleOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800">Reject Reschedule Request</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Please provide a reason for rejecting the doctor's proposed time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            placeholder="I'm not available at this time..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[120px] rounded-xl border-gray-200 focus:ring-[#00A1B0]"
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={() => setRejectRescheduleOpen(false)}
                            className="font-bold text-gray-500"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRejectReschedule}
                            disabled={rejectSubmitting || !rejectionReason.trim()}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-8"
                        >
                            {rejectSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default AppointmentDetails;
