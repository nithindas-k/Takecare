import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Pill, Calendar, User, Stethoscope, FlaskConical, FileText, Clock } from 'lucide-react';
import { prescriptionService } from '../../services/prescriptionService';
import { API_BASE_URL } from '../../utils/constants';
import type { Prescription, Medicine } from '../../types/prescription.types';

interface PrescriptionViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
}

const PrescriptionViewModal: React.FC<PrescriptionViewModalProps> = ({ isOpen, onClose, appointmentId }) => {
    const [prescription, setPrescription] = useState<Prescription | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPrescription = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const response = await prescriptionService.getPrescriptionByAppointment(appointmentId);
            if (response.success && response.data) {
                setPrescription(response.data);
            } else {
                setError('Prescription not found');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to load prescription');
        } finally {
            setLoading(false);
        }
    }, [appointmentId]);

    useEffect(() => {
        if (isOpen && appointmentId) {
            fetchPrescription();
        }
    }, [isOpen, appointmentId, fetchPrescription]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return undefined;
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/60 backdrop-blur-sm print:bg-white print:p-0 print:block print:static print-page">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @media print {
                        @page { margin: 1cm; size: auto; }
                        
                        /* Hide entire page content */
                        body {
                            visibility: hidden !important;
                            background: white !important;
                        }

                        /* Target ONLY the modal and its children to be visible */
                        .print-page,
                        .print-page-inner,
                        .print-page-inner * {
                            visibility: visible !important;
                        }

                        /* Position the modal at the top of the physical page */
                        .print-page {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            display: block !important;
                            background: white !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        .print-page-inner {
                            width: 100% !important;
                            max-width: none !important;
                            box-shadow: none !important;
                            border: none !important;
                            background: white !important;
                            opacity: 1 !important;
                            transform: none !important;
                            margin: 0 !important;
                            display: block !important;
                        }

                        /* Ensure scrollable containers don't clip content */
                        div {
                            overflow: visible !important;
                            height: auto !important;
                            max-height: none !important;
                        }

                        /* Hide UI buttons and unnecessary overlays */
                        button, .print\\:hidden, .print-hidden {
                            display: none !important;
                            visibility: hidden !important;
                        }

                        /* Layout fixes for clinical sheet */
                        .print-grid { 
                            display: grid !important; 
                            grid-template-columns: repeat(2, 1fr) !important; 
                            gap: 1.5rem !important; 
                        }
                        
                        table { width: 100% !important; border-collapse: collapse !important; }
                        th, td { border-bottom: 1px solid #eee !important; }

                        /* Force background colors/images to print */
                        * { 
                            -webkit-print-color-adjust: exact !important; 
                            print-color-adjust: exact !important; 
                            color-adjust: exact !important;
                        }

                        .bg-\\[\\#00A1B0\\] { 
                            background-color: #00A1B0 !important; 
                            print-color-adjust: exact !important; 
                        }
                    }
                `}} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none print:static print:block print:m-0 print-page-inner"
                >
                    {/* Professional Toolbar */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white print:hidden">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                                <Stethoscope className="w-5 h-5 text-[#00A1B0]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Medical Prescription</h2>
                                <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                                    Digital Record Verified
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-[#00A1B0]/20 active:scale-95"
                            >
                                <Printer className="w-4 h-4" /> Print PDF
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100/50 p-4 md:p-8 print:bg-white print:p-0"
                        data-lenis-prevent
                    >
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                                <div className="w-12 h-12 border-4 border-[#00A1B0]/20 border-t-[#00A1B0] rounded-full animate-spin mb-4" />
                                <p className="text-gray-500 font-bold tracking-tight">Retrieving Medical Record...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
                                <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                                    <FileText className="w-10 h-10 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2 font-mono">RECORD_NOT_FOUND</h3>
                                <p className="text-gray-400 text-sm max-w-xs text-center">{error}</p>
                            </div>
                        ) : prescription ? (
                            /* THE CLINICAL SHEET */
                            <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none max-w-3xl mx-auto min-h-[1000px]">

                                {/* Subtle Watermark */}
                                {/* Subtle Watermark */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden z-0">
                                    <img
                                        src={'/doctor.png'}
                                        alt="Watermark"
                                        className="w-[500px] h-[500px] object-contain opacity-10 "
                                    />
                                </div>

                                {/* Clinical Header */}
                                <div className="relative bg-[#00A1B0] px-8 py-10 overflow-hidden">
                                    {/* Decorator background */}
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>

                                    <div className="relative flex flex-col md:flex-row justify-between items-center gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-2xl relative">
                                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                                                </div>
                                                <img
                                                    src={getImageUrl(prescription.doctor?.profileImage) || '/doctor.png'}
                                                    alt="Doctor"
                                                    className="w-full h-full object-cover rounded-xl"
                                                />
                                            </div>
                                            <div className="text-white text-center md:text-left">
                                                <h1 className="text-3xl font-black tracking-tight leading-none mb-1">
                                                    Dr. {prescription.doctor?.name || 'Doctor'}
                                                </h1>
                                                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-sm font-bold text-white/90">
                                                    <span className="bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20">
                                                        {prescription.doctor?.specialty || 'Medical Specialist'}
                                                    </span>
                                                    <span className="opacity-60">Reg No: {prescription.doctor?.registrationNumber || 'XXXXX'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-center md:text-right">
                                            <div className="text-6xl font-black text-white/20 leading-none select-none mb-2">℞</div>
                                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 inline-block">
                                                <p className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mb-0.5 leading-none">Record ID</p>
                                                <p className="text-lg font-black text-white leading-none">
                                                    #{prescription.appointmentCustomId || prescription.id?.slice(-8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Vital Info Bar */}
                                <div className="bg-gray-50 border-b border-gray-100 px-8 py-5 grid grid-cols-2 lg:grid-cols-4 gap-6 print-grid">
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Consult Date</p>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Calendar className="w-3.5 h-3.5 text-[#00A1B0]" />
                                            <span className="text-sm font-bold">{formatDate(prescription.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Consult Time</p>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <Clock className="w-3.5 h-3.5 text-[#00A1B0]" />
                                            <span className="text-sm font-bold">
                                                {prescription.createdAt ? new Date(prescription.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Patient Name</p>
                                        <div className="flex items-center gap-2 text-gray-800">
                                            <User className="w-3.5 h-3.5 text-[#00A1B0]" />
                                            <span className="text-sm font-bold truncate">{prescription.patient?.name}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Demographics</p>
                                        <div className="flex items-center gap-2 text-gray-800 font-bold text-sm">
                                            <span className="bg-gray-200 px-2 py-0.5 rounded text-[10px] uppercase">{prescription.patient?.gender || 'N/A'}</span>
                                            <span>{prescription.patient?.age || 'N/A'} Years</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-10">

                                    {/* Diagnosis & Findings */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-2">
                                            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                                                <Stethoscope className="w-4 h-4 text-[#00A1B0]" />
                                            </div>
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Clinical Diagnosis</h3>
                                        </div>
                                        <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                            <p className="text-gray-700 text-lg font-medium italic leading-relaxed">
                                                “{prescription.diagnosis || 'General clinical assessment and management provided.'}”
                                            </p>
                                        </div>
                                    </div>

                                    {/* Medical Prescription Table */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-2">
                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                <Pill className="w-4 h-4 text-blue-500" />
                                            </div>
                                            <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Medical Prescription (Rx)</h3>
                                            <span className="ml-auto text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">
                                                {prescription.medicines?.length || 0} ITEMS
                                            </span>
                                        </div>

                                        <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                            <table className="w-full text-left">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Medicine Name</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Dosage</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Frequency</th>
                                                        <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Duration</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {prescription?.medicines?.map((med: Medicine, idx: number) => (
                                                        <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-5">
                                                                <div className="font-bold text-gray-900">{med.name}</div>
                                                                {med.instructions && <div className="text-[10px] text-gray-400 font-medium mt-1 italic uppercase tracking-tighter">Note: {med.instructions}</div>}
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="bg-teal-50 text-[#00A1B0] px-2 py-1 rounded text-xs font-black uppercase">{med.dosage}</span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="text-gray-600 font-bold text-sm tracking-widest">{med.frequency}</span>
                                                            </td>
                                                            <td className="px-6 py-5">
                                                                <span className="font-bold text-gray-800 text-sm whitespace-nowrap">{med.duration}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Tests and Notes Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2">
                                        {/* Lab Investigations */}
                                        {prescription.labTests && prescription.labTests.length > 0 && (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-2">
                                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                                                        <FlaskConical className="w-4 h-4 text-purple-500" />
                                                    </div>
                                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Lab Testing</h3>
                                                </div>
                                                <div className="space-y-2">
                                                    {prescription.labTests.map((test: string, i: number) => (
                                                        <div key={i} className="flex items-center gap-3 p-3 bg-purple-50/30 rounded-xl border border-purple-100 group">
                                                            <div className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-[10px] font-black text-purple-600">0{i + 1}</div>
                                                            <span className="text-sm font-bold text-gray-700">{test}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* General Advice */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 border-b-2 border-gray-50 pb-2">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                    <FileText className="w-4 h-4 text-amber-500" />
                                                </div>
                                                <h3 className="text-xs font-black text-gray-800 uppercase tracking-[0.2em]">Medical Advice</h3>
                                            </div>
                                            <div className="p-4 bg-amber-50/30 rounded-2xl border border-amber-100 h-full">
                                                <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                                                    {prescription.instructions || 'Continue current medications, maintain healthy hydration, and monitor symptoms daily. Contact clinic if condition changes significantly.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Final Section with Follow-up & Seal */}
                                    <div className="pt-10 flex flex-col md:flex-row justify-between items-end gap-10">
                                        {/* Follow Up Card */}
                                        {prescription.followUpDate && (
                                            <div className="w-full md:w-auto p-5 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white shadow-xl">
                                                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50 mb-3">Next Required Visit</p>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white/10 flex flex-col items-center justify-center border border-white/10">
                                                        <span className="text-[10px] font-black uppercase leading-none opacity-60">
                                                            {new Date(prescription.followUpDate).toLocaleDateString([], { month: 'short' })}
                                                        </span>
                                                        <span className="text-lg font-black leading-none mt-1">
                                                            {new Date(prescription.followUpDate).getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-lg font-black tracking-tight">{formatDate(prescription.followUpDate)}</p>
                                                        <p className="text-[10px] font-medium opacity-60">Scheduled Check-up</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Authorized Signature Area */}
                                        <div className="text-center print-signature-area">
                                            <div className="inline-block relative">
                                                {/* Digital Seal Watermark */}
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-4 border-emerald-500/10 rounded-full flex items-center justify-center rotate-12 -z-10 select-none">
                                                    <span className="text-[8px] font-black text-emerald-500/20 text-center uppercase">DIGITALLY SIGNED<br />TAKECARE VERIFIED</span>
                                                </div>

                                                <div className="min-h-[100px] flex items-center justify-center px-4">
                                                    {prescription.doctorSignature ? (
                                                        <img
                                                            src={prescription.doctorSignature}
                                                            alt="Signature"
                                                            className="h-20 w-auto object-contain transition-all hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="font-handwriting text-5xl text-gray-300 opacity-20 select-none">
                                                            {prescription.doctor?.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-2 border-t-2 border-gray-900 pt-3">
                                                    <p className="text-sm font-black text-gray-900 uppercase tracking-tighter">Dr. {prescription.doctor?.name}</p>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Authorized Signature</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Micro-footer */}
                                <div className="mt-auto px-8 py-6 bg-gray-50 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-[#00A1B0] flex items-center justify-center font-black text-white text-xs">TC</div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-800 uppercase tracking-tight">Verified Digital Record</p>
                                            <p className="text-[9px] text-gray-400 font-medium">Blockchain Secured Electronic Health Record</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-center md:items-end">
                                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">Doc Generated On</p>
                                        <p className="text-[10px] font-bold text-gray-600">
                                            {new Date(prescription.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PrescriptionViewModal;
