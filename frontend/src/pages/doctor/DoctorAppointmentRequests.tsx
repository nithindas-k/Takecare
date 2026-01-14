import React, { useState, useEffect } from 'react';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { FaVideo, FaComments, FaCheck, FaTimes, FaSearch, FaCalendarAlt, FaExclamationCircle } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import RescheduleModal from '../../components/common/RescheduleModal';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../components/ui/dialog"
import { Textarea } from "../../components/ui/textarea"
import { Card, CardContent, CardHeader } from "../../components/ui/card"

const DoctorAppointmentRequests: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);


    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                const cached = sessionStorage.getItem('doctor_requests_cache');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (Array.isArray(parsed)) {
                            setRequests(parsed);
                            setError('');
                        } else {
                            sessionStorage.removeItem('doctor_requests_cache');
                        }
                    } catch {
                        sessionStorage.removeItem('doctor_requests_cache');
                    }
                }

                const response = await appointmentService.getDoctorRequests(1, 100);

                if (response?.success) {
                    const nextRequests = response.data.appointments || [];
                    setRequests(nextRequests);
                    sessionStorage.setItem('doctor_requests_cache', JSON.stringify(nextRequests));
                } else {
                    throw new Error(response?.message || 'Failed to fetch appointment requests');
                }
            } catch (err: any) {
                console.error('Failed to fetch appointment requests:', err);
                setError(err?.response?.data?.message || err?.message || 'Failed to fetch appointment requests');
                toast.error('Failed to load appointment requests');
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);


    const filteredRequests = requests.filter((req) =>
        (req?.status === 'pending' || req?.status === 'reschedule_requested') &&
        req?.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApprove = async (id: string) => {
        const appointment = requests.find(req => (req.id === id || req._id === id));
        if (appointment && appointment.paymentStatus !== 'paid') {
            toast.warning('Payment is pending!');
            return;
        }
        try {
            const response = await appointmentService.approveAppointment(id);
            if (response?.success) {
                const next = requests.filter((req) => (req.id !== id && req._id !== id));
                setRequests(next);
                sessionStorage.setItem('doctor_requests_cache', JSON.stringify(next));
                toast.success('Appointment approved!');
            } else {
                throw new Error(response?.message || 'Failed to approve');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || err?.message || 'Failed to approve');
        }
    };

    const handleReject = async (id: string) => {
        const appointment = requests.find(req => (req.id === id || req._id === id));
        if (appointment) {
            setSelectedAppointment(appointment);
            setRejectDialogOpen(true);
            setRejectionReason('');
        }
    };

    const confirmReject = async () => {
        if (!selectedAppointment || !rejectionReason.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }

        try {
            const response = await appointmentService.rejectAppointment(
                selectedAppointment.id || selectedAppointment._id,
                rejectionReason
            );
            if (response?.success) {
                const next = requests.filter((req) => (req.id !== selectedAppointment.id && req._id !== selectedAppointment._id));
                setRequests(next);
                sessionStorage.setItem('doctor_requests_cache', JSON.stringify(next));
                toast.success(`Appointment rejected: ${rejectionReason}`);
                setRejectDialogOpen(false);
                setSelectedAppointment(null);
                setRejectionReason('');
            } else {
                throw new Error(response?.message || 'Failed to reject');
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || err?.message || 'Failed to reject');
        }
    };

    const handleReschedule = (request: any) => {
        setSelectedAppointment(request);
        setRescheduleModalOpen(true);
    };

    const onRescheduleConfirm = async (slot: any, date: Date) => {
        try {
            const response = await appointmentService.rescheduleAppointment(selectedAppointment.id || selectedAppointment._id, {
                appointmentDate: date,
                appointmentTime: `${slot.startTime} - ${slot.endTime}`,
                slotId: slot.customId || slot.slotId
            });

            if (response.success) {
                toast.success('Reschedule request sent to patient!');
                // Update local state
                const updatedRequests = requests.map(req =>
                    (req.id === selectedAppointment.id || req._id === selectedAppointment._id) ? { ...req, status: 'reschedule_requested' } : req
                );
                setRequests(updatedRequests);
                sessionStorage.setItem('doctor_requests_cache', JSON.stringify(updatedRequests));
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to reschedule');
        } finally {
            setRescheduleModalOpen(false);
            setSelectedAppointment(null);
        }
    };

    const cancelReject = () => {
        setRejectDialogOpen(false);
        setSelectedAppointment(null);
        setRejectionReason('');
    };

    const breadcrumbItems = [
        { label: 'Home', path: '/doctor/dashboard' },
        { label: 'Appointment Requests' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />

            <Breadcrumbs
                items={breadcrumbItems}
                title="Appointment Requests"
                subtitle="Review and manage patient appointment requests"
            />

            <DoctorLayout>
                {loading ? (
                    <div className="space-y-6">
                        <Skeleton className="h-28 w-full rounded-xl" />
                        <Skeleton className="h-16 w-full rounded-xl" />
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b">
                                <Skeleton className="h-6 w-64" />
                            </div>
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                    <Skeleton key={i} className="h-56 w-full rounded-xl" />
                                ))}
                            </div>
                        </div>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                            <div className="flex items-center justify-between">
                                <div><p className="text-sm text-gray-600 mb-1">Pending Requests</p><h3 className="text-3xl font-bold text-[#00A1B0]">{filteredRequests.length}</h3></div>
                                <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center"><FaVideo className="text-blue-600" size={32} /></div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search patients..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#00A1B0]" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-800">Pending Appointment Requests</h3></div>
                            <div className="p-4">
                                {filteredRequests.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center"><FaVideo className="text-gray-400" size={32} /></div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No pending requests</h3>
                                        <p className="text-gray-600 text-sm">You don't have any appointment requests at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredRequests.map((request) => (
                                            <Card key={request._id} className="overflow-hidden border-gray-100 hover:shadow-md transition-shadow">
                                                <CardHeader className="p-4 border-b border-gray-100 space-y-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-4 flex-1">
                                                            <div className="relative">
                                                                <img
                                                                    src={request.patientId?.profileImage || '/patient-placeholder.jpg'}
                                                                    alt={request.patientId?.name || 'Patient'}
                                                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Patient'; }}
                                                                />
                                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${request.appointmentType === 'video' ? 'bg-[#00A1B0]' : 'bg-emerald-500'}`}>
                                                                    {request.appointmentType === 'video' ? <FaVideo /> : <FaComments />}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] text-gray-400 font-medium tracking-wider mb-0.5">{request.customId || request.id}</p>
                                                                <h3 className="font-bold text-gray-900 leading-tight truncate">{request.patientId?.name || 'Unknown Patient'}</h3>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${request.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                                                        <span className={`text-[11px] font-medium capitalize ${request.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                            {request.paymentStatus || 'pending'}
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-[#00A1B0] bg-[#00A1B0]/10 px-2 py-0.5 rounded-full">
                                                                        ₹{request.consultationFees}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 bg-gray-50/50 space-y-4">
                                                    <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <FaCalendarAlt className="w-3.5 h-3.5 text-[#00A1B0]" />
                                                            <span className="text-xs font-semibold">{new Date(request.appointmentDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="w-px h-3 bg-gray-200" />
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <svg className="w-3.5 h-3.5 text-[#00A1B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <span className="text-xs font-semibold">{request.appointmentTime}</span>
                                                        </div>
                                                    </div>

                                                    {request.status === 'reschedule_requested' && (
                                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                                                <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Reschedule Sent</p>
                                                            </div>
                                                            <p className="text-[10px] text-amber-800 mt-1">Waiting for patient to accept proposed time.</p>
                                                        </div>
                                                    )}

                                                    {request.reason && (
                                                        <div className="p-3 bg-white border border-gray-100 rounded-xl">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Note from Patient</p>
                                                            <p className="text-xs text-gray-700 leading-relaxed italic">"{request.reason}"</p>
                                                        </div>
                                                    )}

                                                    {request.rescheduleRejectReason && (
                                                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                                                            <div className="flex items-center gap-1.5 text-rose-700">
                                                                <FaExclamationCircle className="w-3.5 h-3.5" />
                                                                <p className="text-[11px] font-bold uppercase tracking-wider">Patient Rejected Reschedule</p>
                                                            </div>
                                                            <p className="text-xs text-rose-800 leading-relaxed italic">"{request.rescheduleRejectReason}"</p>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleApprove(request.id || request._id)}
                                                            disabled={request.status === 'reschedule_requested'}
                                                            className={`h-9 gap-1.5 border-none shadow-none font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${request.status === 'reschedule_requested'
                                                                ? 'bg-gray-100 text-gray-400 opacity-50'
                                                                : request.paymentStatus === 'paid'
                                                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                                                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                                                }`}
                                                            title={request.status === 'reschedule_requested' ? "Waiting for patient response" : request.paymentStatus !== 'paid' ? "Payment pending" : "Approve appointment"}
                                                        >
                                                            <FaCheck className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] xs:text-xs">Approve</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReschedule(request)}
                                                            className="h-9 gap-1.5 border-none shadow-none bg-[#00A1B0]/10 hover:bg-[#00A1B0]/20 text-[#00A1B0] font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                            title="Propose new time"
                                                        >
                                                            <FaCalendarAlt className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] xs:text-xs">Reschedule</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleReject(request.id || request._id)}
                                                            className="col-span-2 sm:col-span-1 h-9 gap-1.5 border-none shadow-none bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                                                            title="Reject appointment"
                                                        >
                                                            <FaTimes className="w-3.5 h-3.5" />
                                                            <span className="text-[10px] xs:text-xs">Reject</span>
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DoctorLayout>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600">
                            <FaExclamationCircle />
                            Reject Appointment
                        </DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this appointment request.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAppointment && (
                        <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-sm text-gray-600">
                            <p><span className="font-semibold">Patient:</span> {selectedAppointment.patientId?.name || 'Unknown Patient'}</p>
                            <p><span className="font-semibold">Date:</span> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
                            <p><span className="font-semibold">Time:</span> {selectedAppointment.appointmentTime}</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                        <Textarea
                            placeholder="Type your reason here..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[100px] resize-none"
                        />
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-0">
                        <Button
                            variant="ghost"
                            onClick={cancelReject}
                            className="flex-1 sm:flex-none"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmReject}
                            disabled={!rejectionReason.trim()}
                            className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white"
                        >
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {rescheduleModalOpen && selectedAppointment && (
                <RescheduleModal
                    isOpen={rescheduleModalOpen}
                    onClose={() => { setRescheduleModalOpen(false); setSelectedAppointment(null); }}
                    onConfirm={onRescheduleConfirm}
                    doctorId={selectedAppointment.doctorId?._id || selectedAppointment.doctorId}
                    doctorName="You"
                    currentDate={new Date(selectedAppointment.appointmentDate)}
                />
            )}
        </div>
    );
};

export default DoctorAppointmentRequests;
