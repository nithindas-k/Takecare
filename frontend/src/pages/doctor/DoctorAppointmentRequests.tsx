/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { FaVideo, FaComments, FaCheck, FaTimes, FaSearch } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import { toast } from 'sonner';
import { Skeleton } from '../../components/ui/skeleton';

const DoctorAppointmentRequests: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState('');


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
        req?.status === 'pending' && req?.patientId?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApprove = async (id: string) => {
        const appointment = requests.find(req => req.id === id);
        if (appointment && appointment.paymentStatus !== 'paid') {
            toast.warning('Payment is pending!');
            return;
        }
        try {
            const response = await appointmentService.approveAppointment(id);
            if (response?.success) {
                const next = requests.filter((req) => req.id !== id);
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
        const appointment = requests.find(req => req.id === id);
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
                selectedAppointment.id,
                rejectionReason
            );
            if (response?.success) {
                const next = requests.filter((req) => req.id !== selectedAppointment.id);
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredRequests.map((request) => (
                                            <div key={request._id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition overflow-hidden">
                                                <div className="p-4 border-b flex gap-3">
                                                    <img src={request.patientId?.profileImage || '/patient-placeholder.jpg'} alt={request.patientId?.name || 'Patient'} className="w-14 h-14 rounded-full border" onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Patient'; }} />
                                                    <div className="flex-1"><p className="text-xs text-gray-500">{request.customId || request.id}</p><h3 className="font-semibold text-gray-800">{request.patientId?.name || 'Unknown Patient'}</h3><p className="text-sm text-gray-600">{request.appointmentType === 'video' ? 'Video Call' : 'Chat'}</p>{request.reason && (<p className="text-xs italic text-gray-500">Reason: {request.reason}</p>)}</div>
                                                    <div className="w-10 h-10 bg-[#00A1B0]/10 text-[#00A1B0] rounded-lg flex items-center justify-center">{request.appointmentType === 'video' ? (<FaVideo size={18} />) : (<FaComments size={18} />)}</div>
                                                </div>
                                                <div className="p-4 bg-gray-50">
                                                    <div className="grid grid-cols-2 text-sm mb-4">
                                                        <div><p className="text-xs text-gray-500">Date</p><p className="font-medium text-gray-800">{new Date(request.appointmentDate).toLocaleDateString()}</p></div>
                                                        <div><p className="text-xs text-gray-500">Time</p><p className="font-medium text-gray-800">{request.appointmentTime}</p></div>
                                                        <div><p className="text-xs text-gray-500">Fees</p><p className="font-bold text-[#00A1B0]">₹{request.consultationFees}</p></div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Payment</p>
                                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${request.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                                {request.paymentStatus || 'pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleApprove(request.id)}
                                                            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${request.paymentStatus === 'paid'
                                                                    ? 'bg-green-50 hover:bg-green-100 text-green-600'
                                                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-600'
                                                                }`}
                                                            title={request.paymentStatus !== 'paid' ? "Payment pending" : "Approve appointment"}
                                                        >
                                                            <FaCheck />Approve
                                                        </button>
                                                        <button onClick={() => handleReject(request.id)} className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg flex items-center justify-center gap-2"><FaTimes />Reject</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </DoctorLayout>

            {rejectDialogOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Appointment Request</h3>
                        {selectedAppointment && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600"><span className="font-medium">Patient:</span> {selectedAppointment.patientId?.name || 'Unknown Patient'}</p>
                                <p className="text-sm text-gray-600"><span className="font-medium">Date:</span> {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
                                <p className="text-sm text-gray-600"><span className="font-medium">Time:</span> {selectedAppointment.appointmentTime}</p>
                            </div>
                        )}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason *</label>
                            <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Please provide a reason for rejecting this appointment request..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent resize-none" rows={4} />
                        </div>
                        <div className="flex gap-3"><button onClick={confirmReject} disabled={!rejectionReason.trim()} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors">Confirm Reject</button><button onClick={cancelReject} className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors">Cancel</button></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorAppointmentRequests;

