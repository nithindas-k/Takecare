/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ClipboardList, MessagesSquare, XCircle, Stethoscope } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { FaVideo, FaComments, FaPhone, FaTimes, FaChevronDown, FaChevronUp, FaCheck } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { API_BASE_URL } from '../../utils/constants';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import PrescriptionModal from '../../components/Doctor/PrescriptionModal';
import PrescriptionViewModal from '../../components/Patient/PrescriptionViewModal';
import RecentAppointmentModal from '../../components/Doctor/RecentAppointmentModal';
import { Skeleton } from '../../components/ui/skeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog";

const DoctorAppointmentDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const lastFetchedId = useRef<string | null>(null);

    const [appointment, setAppointment] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelOpen, setCancelOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelSubmitting, setCancelSubmitting] = useState(false);
    const [closeChatOpen, setCloseChatOpen] = useState(false);

    const [showCancelReason, setShowCancelReason] = useState(false);
    const [prescriptionOpen, setPrescriptionOpen] = useState(false);
    const [prescriptionViewOpen, setPrescriptionViewOpen] = useState(false);
    const [hasPrescription, setHasPrescription] = useState(false);
    const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

    const [recentAptModalOpen, setRecentAptModalOpen] = useState(false);
    const [selectedRecentAptId, setSelectedRecentAptId] = useState<string | null>(null);

    useEffect(() => {
        if (appointment?.patientId) {
            const patientId = appointment.patientId._id || appointment.patientId;
            appointmentService.getDoctorAppointments(undefined, 1, 5, patientId as string)
                .then(response => {
                    if (response.success && response.data?.appointments) {
                        const filtered = response.data.appointments.filter((apt: any) => apt._id !== (appointment._id || appointment.id));
                        setRecentAppointments(filtered);
                    }
                })
                .catch(err => console.error("Failed to fetch recent appointments", err));
        }
    }, [appointment]);

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/patient.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const formatTimeTo12h = (timeStr: string) => {
        if (!timeStr) return 'N/A';
        return timeStr.split('-').map(part => {
            const [hours, minutes] = part.trim().split(':');
            let h = parseInt(hours);
            const m = minutes || '00';
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h ? h : 12;
            return `${h}:${m} ${ampm}`;
        }).join(' - ');
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

        let isSessionReady = false;
        if (hasValidDate && time) {
            const now = new Date();
            const [startTimeStr] = time.split('-');
            const [hours, minutes] = startTimeStr.trim().split(':');
            const sessionStart = new Date(date);
            sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            isSessionReady = now >= sessionStart;
        }

        return {
            id: apt?.id || apt?._id,
            customId: apt?.customId || apt?.id || apt?._id,
            patientName,
            patientEmail,
            patientPhone,
            patientImage: getImageUrl(patientImage),
            appointmentType: apt?.appointmentType,
            date,
            hasValidDate,

            time: formatTimeTo12h(time),
            status,
            displayStatus,
            consultationFees: apt?.consultationFees ?? 0,
            reason: apt?.reason || '',
            paymentStatus: apt?.paymentStatus || 'N/A',
            isUpcoming,
            isSessionReady,
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

                    // Check for prescription if completed
                    if (response.data.status === 'completed') {
                        try {
                            const prescResponse = await prescriptionService.getPrescriptionByAppointment(response.data.id || response.data._id);
                            if (prescResponse.success && prescResponse.data) {
                                setHasPrescription(true);
                            }
                        } catch (prescErr) {
                            console.warn("No prescription found or failed to check:", prescErr);
                            // Not a fatal error for the whole page
                        }
                    }
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
                } catch {

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

    const handleApprove = async () => {
        const appointmentId = normalized.id;
        if (normalized.paymentStatus !== 'paid') {
            toast.warning('Payment is pending!');
            return;
        }
        try {
            const response = await appointmentService.approveAppointment(appointmentId);
            if (response?.success) {
                toast.success('Appointment approved!');
                // Refresh data
                const updated = await appointmentService.getAppointmentById(appointmentId);
                if (updated?.success) setAppointment(updated.data);
            } else {
                throw new Error(response?.message || 'Failed to approve');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        setCancelReason('');
        setShowCancelReason(true); // Reuse cancel dialog logic for rejection
        setCancelOpen(true);
    };

    const handleViewRecentDetails = (id: string) => {
        setSelectedRecentAptId(id);
        setRecentAptModalOpen(true);
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
                {loading ? (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 flex gap-4">
                                    <Skeleton className="w-20 h-20 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-6 w-48" />
                                        <div className="flex gap-4 mt-4">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-4">
                                    <Skeleton className="h-4 w-32 mb-2" />
                                    <Skeleton className="h-10 w-40 rounded-lg" />
                                </div>
                                <div className="lg:col-span-3 text-right space-y-3">
                                    <Skeleton className="h-8 w-24 rounded-full ml-auto" />
                                    <Skeleton className="h-6 w-48 ml-auto" />
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <div key={i}>
                                            <Skeleton className="h-3 w-32 mb-1" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                ) : appointment && (
                    <>
                        {/* MAIN CARD */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 flex gap-4">
                                    <img src={normalized.patientImage} alt="Patient" className="w-20 h-20 rounded-full aspect-square object-cover border-2 border-gray-200 flex-shrink-0" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Patient'; }} />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1 font-mono uppercase tracking-wider">#{normalized.customId}</p>
                                        <h3 className="text-xl font-bold text-gray-800">{normalized.patientName}</h3>
                                        <div className="flex items-center gap-3 mt-4">
                                            <div className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19h14a2 2 0 002-2V7H3v10a2 2 0 002 2z" /></svg><span className="text-sm text-gray-600">{normalized.patientEmail}</span></div>
                                            <div className="flex items-center gap-2"><FaPhone size={14} className="text-gray-400" /><span className="text-sm text-gray-600">{normalized.patientPhone}</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="lg:col-span-4">
                                    <p className="text-sm font-semibold text-gray-500 mb-2">Type of Appointment</p>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00A1B0]/10 text-[#00A1B0] font-medium">{normalized.appointmentType === 'video' ? <FaVideo size={16} /> : <FaComments size={16} />}{normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}</div>
                                </div>
                                <div className="lg:col-span-3">
                                    <div className="text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${getStatusColor(normalized.status)}`}>{normalized.displayStatus}</span>
                                        <p className="text-sm font-semibold text-gray-800">Consultation Fees: ₹{normalized.consultationFees}</p>
                                        <div className="flex justify-end gap-2 mt-3">
                                            {normalized.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={handleApprove}
                                                        className={`px-4 py-2 rounded-lg flex items-center gap-1 font-medium transition-colors ${normalized.paymentStatus === 'paid'
                                                            ? 'bg-green-50 hover:bg-green-100 text-green-600'
                                                            : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                                            }`}
                                                        title={normalized.paymentStatus !== 'paid' ? "Payment pending" : "Approve appointment"}
                                                    >
                                                        <FaCheck size={14} />Approve
                                                    </button>
                                                    <button onClick={handleReject} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 font-medium"><FaTimes size={14} />Reject</button>
                                                </>
                                            )}
                                            {normalized.isUpcoming && normalized.status !== 'pending' && normalized.status !== 'cancelled' && normalized.status !== 'rejected' && (
                                                <button onClick={handleCancelAppointment} className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 font-medium"><FaTimes size={14} />Cancel</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {appointment?.status === 'rejected' && appointment?.rejectionReason && (
                                <div className="px-6 py-4 bg-red-50 border-t border-red-200">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5"><svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg></div>
                                        <div className="flex-1"><h6 className="text-sm font-semibold text-red-800 mb-1">Rejection Reason</h6><p className="text-sm text-red-700">{appointment.rejectionReason}</p></div>
                                    </div>
                                </div>
                            )}
                            {appointment?.status === 'cancelled' && (appointment?.cancellationReason || appointment?.reason) && (
                                <div className="px-6 py-4 bg-red-50 border-t border-red-100">
                                    <button onClick={() => setShowCancelReason(!showCancelReason)} className="w-full flex items-center justify-between text-left hover:bg-red-100/50 rounded-lg p-2 -m-2 transition-colors">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0 w-5 h-5 text-red-500 mt-0.5"><svg className="w-full h-full" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div>
                                            <div><h6 className="text-sm font-semibold text-red-800">Cancellation Reason{appointment?.cancelledBy ? ` (${appointment.cancelledBy})` : ''}</h6></div>
                                        </div>
                                        <div className="flex items-center gap-2"><span className="text-sm text-red-600 font-medium">{showCancelReason ? 'Show Less' : 'Show More'}</span>{showCancelReason ? (<FaChevronUp size={14} className="text-red-600" />) : (<FaChevronDown size={14} className="text-red-600" />)}</div>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showCancelReason ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}><div className="pl-8"><p className="text-sm text-red-700 leading-relaxed">{appointment.cancellationReason || appointment.reason}</p>{appointment.cancelledAt && (<p className="text-xs text-red-600 mt-2">Cancelled on {new Date(appointment.cancelledAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>)}</div></div>
                                </div>
                            )}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    <div><h6 className="text-xs font-semibold text-gray-500 mb-1">Appointment Date & Time</h6><p className="text-sm font-medium text-gray-800">{normalized.hasValidDate ? new Date(normalized.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'} - {normalized.time || 'N/A'}</p></div>
                                    <div><h6 className="text-xs font-semibold text-gray-500 mb-1">Reason</h6><p className="text-sm font-medium text-gray-800">{normalized.reason || 'N/A'}</p></div>
                                    <div><h6 className="text-xs font-semibold text-gray-500 mb-1">Payment Status</h6><p className="text-sm font-medium text-gray-800">{normalized.paymentStatus}</p></div>
                                    <div><h6 className="text-xs font-semibold text-gray-500 mb-1">Appointment Type</h6><p className="text-sm font-medium text-gray-800">{normalized.appointmentType === 'video' ? 'Video Call' : 'Chat'}</p></div>
                                    <div className="col-span-2 md:col-span-4 lg:col-span-1 flex items-end flex-col gap-2">
                                        {normalized.isUpcoming && normalized.status === 'confirmed' && (normalized.isSessionReady ? (<button onClick={() => navigate(`/doctor/${normalized.appointmentType === 'video' ? 'call' : 'chat'}/${appointment?.id || appointment?._id}`)} className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors shadow-sm">Start Session</button>) : (<div className="w-full px-4 py-3 bg-gray-50 text-gray-500 font-medium rounded-xl border border-dashed border-gray-300 text-center text-sm">Starts at {normalized.time.split(' - ')[0]}</div>))}
                                        {normalized.status === 'completed' && (
                                            <div className="w-full flex flex-col gap-3">
                                                {!appointment?.postConsultationChatWindow?.isActive && !appointment?.TEST_NEEDED ? (
                                                    <Button onClick={async () => { try { const res = await appointmentService.enablePostConsultationChat(normalized.id); if (res.success) { toast.success("Chat enabled for 24 hours. Message sent to patient."); const response = await appointmentService.getAppointmentById(normalized.id); if (response?.success) setAppointment(response.data); } else { toast.error(res.message); } } catch (error: any) { toast.error(error.response?.data?.message || "Failed to enable chat"); } }} className="w-full px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"><ClipboardList className="h-4 w-4" />Tests Needed</Button>
                                                ) : (
                                                    <div className="w-full flex flex-col gap-2">
                                                        <Button onClick={() => navigate(`/doctor/chat/${normalized.id}`)} className="w-full px-6 py-2.5 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"><MessagesSquare className="h-4 w-4" />Go to Chat</Button>
                                                        <Button onClick={() => setCloseChatOpen(true)} variant="outline" className="w-full px-6 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"><XCircle className="h-4 w-4" />Wind Up Chat</Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {normalized.status === 'completed' && (hasPrescription ? (<Button onClick={() => setPrescriptionViewOpen(true)} className="w-full px-6 py-2.5 bg-white border border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0]/5 font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"><Stethoscope className="w-4 h-4" />View Prescription</Button>) : (<Button onClick={() => setPrescriptionOpen(true)} className="w-full px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"><ClipboardList className="w-4 h-4" />Create Prescription</Button>))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Appointments Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h5 className="text-lg font-bold text-gray-800">Recent Appointments</h5>
                            </div>
                            {recentAppointments.length > 0 ? (
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
                                    <p className="font-medium">No prior appointments found</p>
                                    <p className="text-xs text-gray-400 mt-1">This is the first appointment with this patient.</p>
                                </div>
                            )}
                        </div>

                        <RecentAppointmentModal
                            isOpen={recentAptModalOpen}
                            onClose={() => setRecentAptModalOpen(false)}
                            appointmentId={selectedRecentAptId}
                        />
                    </>
                )}
            </DoctorLayout>

            {cancelOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!cancelSubmitting) setCancelOpen(false); }} />
                    <div className="relative z-50 w-full max-w-lg mx-4">
                        <Card>
                            <CardHeader><CardTitle>Cancel Appointment</CardTitle><CardDescription>Please confirm cancellation and provide a reason. This helps the patient and our support team.</CardDescription></CardHeader>
                            <CardContent className="space-y-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-800">Reason for Cancellation</label>
                                    <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Eg: Emergency, Schedule conflict, Patient not available" rows={4} disabled={cancelSubmitting} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00A1B0]/40 disabled:opacity-50" />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2"><Button variant="secondary" onClick={() => setCancelOpen(false)} disabled={cancelSubmitting}>Close</Button><Button onClick={handleConfirmCancel} disabled={cancelSubmitting} className="bg-red-600 hover:bg-red-700">{cancelSubmitting ? 'Cancelling...' : 'Cancel Appointment'}</Button></CardFooter>
                        </Card>
                    </div>
                </div>
            )}

            <PrescriptionModal isOpen={prescriptionOpen} onClose={() => setPrescriptionOpen(false)} appointmentId={appointment?.id || appointment?._id} patientId={appointment?.patientId?._id || appointment?.patientId} onSuccess={() => { setHasPrescription(true); setPrescriptionOpen(false); }} />
            <PrescriptionViewModal isOpen={prescriptionViewOpen} onClose={() => setPrescriptionViewOpen(false)} appointmentId={appointment?.id || appointment?._id} />

            <Dialog open={closeChatOpen} onOpenChange={setCloseChatOpen}>
                <DialogContent className="sm:max-w-md bg-white border border-gray-100 shadow-xl">
                    <DialogHeader><DialogTitle className="text-xl font-bold text-gray-900">Wind Up Chat?</DialogTitle><DialogDescription className="text-gray-500">Are you sure you want to close this chat? Both you and the patient will no longer be able to send messages.</DialogDescription></DialogHeader>
                    <DialogFooter className="flex gap-2 sm:justify-end"><Button variant="secondary" onClick={() => setCloseChatOpen(false)}>Cancel</Button><Button onClick={async () => { try { const res = await appointmentService.disablePostConsultationChat(normalized.id); if (res.success) { toast.success("Chat window closed manually."); const response = await appointmentService.getAppointmentById(normalized.id); if (response?.success) setAppointment(response.data); } else { toast.error(res.message); } } catch (error: any) { toast.error(error.response?.data?.message || "Failed to close chat"); } finally { setCloseChatOpen(false); } }} className="bg-red-600 hover:bg-red-700 text-white">Confirm Wind Up</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );

};

export default DoctorAppointmentDetails;
