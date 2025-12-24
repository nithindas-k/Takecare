import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { FaVideo, FaComments, FaPhone, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import { API_BASE_URL } from '../../utils/constants';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

const DoctorAppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const lastFetchedId = useRef<string | null>(null);

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [showCancelReason, setShowCancelReason] = useState(false);

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/patient.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const normalized = useMemo(() => {
        const apt = appointment;
        const patient = apt?.patientId;

        const patientName = patient?.name || apt?.patientName || 'Unknown Patient';
        const patientEmail = patient?.email || apt?.patientEmail || 'N/A';
        const patientPhone = patient?.phone || apt?.patientPhone || 'N/A';
        const patientImage = patient?.profileImage || apt?.patientImage;

        const status = apt?.status;
        const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

        const date = apt?.appointmentDate || apt?.date;
        const time = apt?.appointmentTime || apt?.time;

        const dateObj = date ? new Date(date) : null;
        const hasValidDate = !!dateObj && !Number.isNaN(dateObj.getTime());

        const isUpcoming = status === 'pending' || status === 'confirmed' || status === 'upcoming';

        return {
            id: apt?.customId || apt?._id || apt?.id,
            patientName,
            patientEmail,
            patientPhone,
            patientImage: getImageUrl(patientImage),
            appointmentType: apt?.appointmentType,
            date,
            hasValidDate,
            time,
            status,
            displayStatus,
            consultationFees: apt?.consultationFees ?? 0,
            reason: apt?.reason || '',
            paymentStatus: apt?.paymentStatus || 'N/A',
            isUpcoming,
        };
    }, [appointment]);

    useEffect(() => {
        const fetchAppointment = async () => {
            if (!id) {
                setLoading(false);
                return;
            }


            if (lastFetchedId.current === id && appointment) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await appointmentService.getAppointmentById(id!);
                if (response?.success) {
                    setAppointment(response.data);
                    lastFetchedId.current = id;
                } else {
                    throw new Error(response?.message);
                }
            } catch (err: any) {
                setError(err?.message || 'Failed to load appointment details');
                toast.error('Failed to load appointment details');
            } finally {
                setLoading(false);
            }
        };

        fetchAppointment();
    }, [id]);

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

    const handleCancelAppointment = async () => {

        const appointmentId = normalized.id;

        if (!appointmentId) {
            toast.error('Appointment ID not found');
            return;
        }


        setCancelOpen(true);
    };

    const handleConfirmCancel = async () => {
        const appointmentId = normalized.id;
        const reason = cancelReason.trim();

        if (!reason) {
            toast.error('Cancellation reason is required');
            return;
        }

        try {
            setCancelSubmitting(true);


            const response = await appointmentService.cancelAppointment(appointmentId, reason);

            if (response?.success) {
                toast.success('Appointment cancelled successfully');
                setCancelOpen(false);
                setCancelReason('');

                try {
                    const updatedAppointment = await appointmentService.getAppointmentById(appointmentId);
                    if (updatedAppointment?.success && updatedAppointment?.data) {
                        setAppointment(updatedAppointment.data);
                    }
                } catch (refreshError) {

                    setAppointment((prev: any) => ({
                        ...prev,
                        status: 'cancelled',
                        cancellationReason: reason,
                        cancelledAt: new Date().toISOString()
                    }));
                }
            } else {
                throw new Error(response?.message || 'Failed to cancel appointment');
            }
        } catch (err: any) {
            console.error('Cancel appointment error:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Failed to cancel appointment';
            toast.error(errorMessage);
        } finally {
            setCancelSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { label: 'Home', path: '/doctor/dashboard' },
        { label: 'Appointments', path: '/doctor/appointments' },
        { label: 'Appointment Details' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />

            <Breadcrumbs
                items={breadcrumbItems}
                title="Appointment Details"
                subtitle="View patient appointment information"
            />

            <DoctorLayout>

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A1B0]" />
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Appointment Loaded */}
                {!loading && !error && appointment && (
                    <>
                        {/* MAIN CARD */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">

                            {/* Top Section */}
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                                {/* Patient Info */}
                                <div className="lg:col-span-5 flex gap-4">
                                    <img
                                        src={normalized.patientImage}
                                        alt="Patient"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Patient';
                                        }}
                                    />

                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">
                                            {normalized.id}
                                        </p>

                                        <h3 className="text-xl font-bold text-gray-800">
                                            {normalized.patientName}
                                        </h3>

                                        <div className="text-sm text-gray-600 mt-2 space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14a2 2 0 002-2V7H3v10a2 2 0 002 2z" />
                                                </svg>
                                                {normalized.patientEmail}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <FaPhone size={14} className="text-gray-400" />
                                                {normalized.patientPhone}
                                            </div>
                                        </div>


                                    </div>
                                </div>

                                {/* Appointment Type */}
                                <div className="lg:col-span-4">
                                    <p className="text-sm font-semibold text-gray-500 mb-2">Type of Appointment</p>

                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00A1B0]/10 text-[#00A1B0] font-medium">
                                        {normalized.appointmentType === 'video'
                                            ? <FaVideo size={16} />
                                            : <FaComments size={16} />}
                                        {normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}
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
                                                <button
                                                    onClick={handleCancelAppointment}
                                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1"
                                                >
                                                    <FaTimes size={14} />
                                                    Cancel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                            {appointment?.status === 'cancelled' && (appointment?.cancellationReason || appointment?.reason) && (
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
                                                    Cancellation Reason{appointment?.cancelledBy ? ` (${appointment.cancelledBy})` : ''}
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
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showCancelReason ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                                        <div className="pl-8">
                                            <p className="text-sm text-red-700 leading-relaxed">
                                                {appointment.cancellationReason || appointment.reason}
                                            </p>
                                            {appointment.cancelledAt && (
                                                <p className="text-xs text-red-600 mt-2">
                                                    Cancelled on {new Date(appointment.cancelledAt).toLocaleDateString('en-US', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Bottom Section */}
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
                                        <p className="text-sm font-medium text-gray-800">{normalized.paymentStatus}</p>
                                    </div>
                                    <div>
                                        <h6 className="text-xs font-semibold text-gray-500 mb-1">Appointment Type</h6>
                                        <p className="text-sm font-medium text-gray-800">
                                            {normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}
                                        </p>
                                    </div>
                                    <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-end">
                                        {normalized.isUpcoming && (
                                            <button className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors">
                                                Start Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* MEDICAL HISTORY */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <h5 className="text-lg font-bold text-gray-800 mb-4">Patient Medical History</h5>
                            <p className="text-gray-500 text-sm">No medical history available.</p>
                        </div>

                        {/* PREVIOUS CONSULTATIONS */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h5 className="text-lg font-bold text-gray-800 mb-4">Previous Consultations</h5>
                            <p className="text-gray-500 text-sm">No previous consultations to display.</p>
                        </div>
                    </>
                )}
            </DoctorLayout>

            {/* Cancel Appointment Dialog */}
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
                                <CardTitle>Cancel Appointment</CardTitle>
                                <CardDescription>
                                    Please confirm cancellation and provide a reason. This helps the patient and our support team.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-800">
                                        Reason for Cancellation
                                    </label>
                                    <textarea
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Eg: Emergency, Schedule conflict, Patient not available"
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
                                    disabled={cancelSubmitting}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {cancelSubmitting ? 'Cancelling...' : 'Cancel Appointment'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );

};

export default DoctorAppointmentDetails;
