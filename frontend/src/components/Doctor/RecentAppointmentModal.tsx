import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Loader2, Calendar, Clock, FileText, Pill, Video, MessageSquare, X, User } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { prescriptionService } from '../../services/prescriptionService';
import { toast } from 'sonner';
import type { PopulatedAppointment } from '../../types/appointment.types';
import type { Prescription, Medicine } from '../../types/prescription.types';

interface RecentAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string | null;
    role?: 'doctor' | 'patient';
}

const RecentAppointmentModal: React.FC<RecentAppointmentModalProps> = ({ isOpen, onClose, appointmentId, role = 'doctor' }) => {
    const [appointment, setAppointment] = useState<PopulatedAppointment | null>(null);
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchDetails();
        } else {
            setAppointment(null);
            setPrescription(null);
        }
    }, [isOpen, appointmentId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const aptResponse = await appointmentService.getAppointmentById(appointmentId!);
            if (aptResponse.success) {
                setAppointment(aptResponse.data);

                if (aptResponse.data.status === 'completed') {
                    const prescResponse = await prescriptionService.getPrescriptionByAppointment(appointmentId!);
                    if (prescResponse.success) {
                        setPrescription(prescResponse.data);
                    }
                }
            } else {
                toast.error("Failed to fetch appointment details");
                onClose();
            }
        } catch (error) {
            console.error("Error fetching details:", error);
            toast.info("prescription not provided");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-blue-100/50 text-blue-700 border-blue-200';
            case 'confirmed': return 'bg-emerald-100/50 text-emerald-700 border-emerald-200';
            case 'completed': return 'bg-green-100/50 text-green-700 border-green-200';
            case 'cancelled': return 'bg-red-100/50 text-red-700 border-red-200';
            case 'rejected': return 'bg-red-100/50 text-red-700 border-red-200';
            default: return 'bg-gray-100/50 text-gray-700 border-gray-200';
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl bg-white border-0 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-[#00A1B0] p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold">Appointment Details</h2>
                            <p className="text-white/80 text-sm mt-1">
                                {loading ? 'Loading details...' : `ID: #${appointment?.customId || appointment?.id?.slice(-8)}`}
                            </p>
                        </div>
                        <Button
                            onClick={onClose}
                            variant="ghost"
                            className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 h-auto"
                        >
                            <X size={18} />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#00A1B0] animate-spin mb-3" />
                            <p className="text-gray-500 text-sm">Retrieving information...</p>
                        </div>
                    ) : appointment ? (
                        <>
                            {/* Key Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <Calendar size={12} /> Date
                                    </div>
                                    <p className="font-semibold text-gray-800">
                                        {new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        <Clock size={12} /> Time
                                    </div>
                                    <p className="font-semibold text-gray-800">{appointment.appointmentTime}</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                                    <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
                                        {appointment.appointmentType === 'video' ? <Video size={12} /> : <MessageSquare size={12} />} Type
                                    </div>
                                    <p className="font-semibold text-gray-800 capitalize">
                                        {appointment.appointmentType === 'video' ? 'Video Consultation' : 'Chat Consultation'}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl border space-y-1 ${getStatusColor(appointment.status)}`}>
                                    <div className="flex items-center gap-2 opacity-70 text-xs font-bold uppercase tracking-wider">
                                        Status
                                    </div>
                                    <p className="font-bold capitalize">{appointment.status}</p>
                                </div>
                            </div>

                            {/* Payment & Reason */}
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                        <FileText size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Reason for Visit</p>
                                        <p className="text-gray-700 text-sm leading-relaxed">
                                            {appointment.reason || "No reason provided."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <span className='text-gray-400' >₹</span>
                                        <span className="text-gray-500">Fees:</span>
                                        <span className="font-semibold text-gray-800">₹{appointment.consultationFees}</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                                        <User size={14} className="text-gray-400" />
                                        <span className="text-gray-500">{role === 'doctor' ? 'Patient:' : 'Doctor:'}</span>
                                        <span className="font-semibold text-gray-800">
                                            {role === 'doctor'
                                                ? (appointment.patientName || (typeof appointment.patientId === 'object' ? appointment.patientId?.name : null) || "Patient")
                                                : (appointment.doctorName || (typeof appointment.doctorId === 'object' ? appointment.doctorId?.name : null) || "Doctor")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Prescription Section */}
                            {appointment.status === 'completed' && (
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                                            <Pill size={16} />
                                        </div>
                                        <h3 className="font-bold text-gray-800">Prescription Details</h3>
                                    </div>

                                    {prescription ? (
                                        <div className="space-y-4">
                                            {prescription.medicines && prescription.medicines.length > 0 ? (
                                                <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm">
                                                    <table className="w-full text-sm text-left">
                                                        <thead className="bg-gray-50 text-gray-500 font-medium">
                                                            <tr>
                                                                <th className="px-4 py-3">Medicine</th>
                                                                <th className="px-4 py-3">Dosage</th>
                                                                <th className="px-4 py-3">Freq</th>
                                                                <th className="px-4 py-3 text-right">Days</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {prescription.medicines.map((med: Medicine, i: number) => (
                                                                <tr key={i}>
                                                                    <td className="px-4 py-3 font-medium text-gray-800">{med.name}</td>
                                                                    <td className="px-4 py-3 text-gray-600">{med.dosage}</td>
                                                                    <td className="px-4 py-3 text-gray-600">{med.frequency}</td>
                                                                    <td className="px-4 py-3 text-gray-600 text-right">{med.duration}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">No medicines prescribed.</p>
                                            )}

                                            {prescription.instructions && (
                                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-sm">
                                                    <strong>Note:</strong> {prescription.instructions}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <p className="text-gray-400 text-sm">No prescription record found for this appointment.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            Failed to load appointment details.
                        </div>
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <Button onClick={onClose} variant="secondary">Close Details</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default RecentAppointmentModal;
