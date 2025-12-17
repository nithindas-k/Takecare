import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import PatientSidebar from '../../components/Patient/PatientSidebar';
import { FaVideo, FaComments, FaArrowLeft, FaTimes, FaChevronDown, FaChevronUp, FaStethoscope } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import { API_BASE_URL } from '../../utils/constants';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'react-hot-toast';


const AppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const lastFetchedId = useRef<string | null>(null);

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [showCancelReason, setShowCancelReason] = useState(false);


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
                if (!isMounted) return;
                setLoading(false);
            }
        };

        fetchAppointment();
        return () => {
            isMounted = false;
        };
    }, [id]);

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const normalized = useMemo(() => {
        const apt = appointment
        const doctor = apt?.doctor || apt?.doctorId;

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

        const status = apt?.status || apt?.status;
        const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

        const date = apt?.appointmentDate || apt?.date;
        const time = apt?.appointmentTime || apt?.time;

        const dateObj = date ? new Date(date) : null;
        const hasValidDate = !!dateObj && !Number.isNaN(dateObj.getTime());

        const isUpcoming = status === 'pending' || status === 'confirmed' || status === 'upcoming';

        return {
            id: apt?.customId || apt?._id || apt?.id,
            doctorName: doctorName || 'Doctor',
            doctorEmail: doctorEmail || 'N/A',
            doctorPhone: doctorPhone || 'N/A',
            department: department || 'N/A',
            doctorImage: getImageUrl(doctorImage),
            appointmentType: apt?.appointmentType,
            date,
            hasValidDate,
            time,
            status,
            displayStatus,
            consultationFees: apt?.consultationFees ?? apt?.consultationFees ?? 0,
            reason: apt?.reason || '',
            isUpcoming,
        };
    }, [appointment]);

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
            } catch (fetchError) {
                console.warn('Failed to refetch appointment, using local update:', fetchError);
                // Fallback to local state update
                setAppointment((prev: any) => ({
                    ...prev,
                    status: 'cancelled',
                    cancellationReason: reason,
                }));
            }

            setCancelOpen(false);

            // Show success toast message
            toast.success('Appointment cancelled successfully!');
        } catch (e: any) {
            console.error('Cancel error:', e);
            console.error('Error response:', e?.response);
            setCancelError(e?.response?.data?.message || e?.message || 'Failed to cancel appointment');
        } finally {
            setCancelSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00A1B0]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <NavBar />

            {/* Breadcrumb - Smooth Minimal Design */}
            <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-10">
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
            <main className="max-w-7xl mx-auto pt-8 pb-14 px-4">
                <div className="grid grid-cols-12 gap-6">
                    {/* Sidebar */}
                    <div className="col-span-12 xl:col-span-3">
                        <PatientSidebar />
                    </div>

                    {/* Appointment Details Content */}
                    <div className="col-span-12 xl:col-span-9">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                                {error}
                            </div>
                        )}
                        {/* Appointment Detail Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                            {/* Main Appointment Info */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    {/* Doctor Info */}
                                    <div className="lg:col-span-5">
                                        <div className="flex items-start gap-4">
                                            <img
                                                src={normalized.doctorImage}
                                                alt={normalized.doctorName}
                                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
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
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={openCancelDialog}
                                                        className="border-red-200 text-red-600 hover:bg-red-50"
                                                    >
                                                        <FaTimes className="text-red-600" size={14} />
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
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
                                        {normalized.isUpcoming && (
                                            <button className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors">
                                                Start Session
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Appointments Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h5 className="text-lg font-bold text-gray-800 mb-4">Recent Appointments</h5>
                            <p className="text-gray-500 text-sm">No recent appointments to display.</p>
                        </div>
                    </div>
                </div>
            </main>

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
        </div>
    );
};

export default AppointmentDetails;
