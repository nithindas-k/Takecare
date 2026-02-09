/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Pill, Stethoscope, Calendar, FileText, FlaskConical } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { prescriptionService } from '../../services/prescriptionService';
import { appointmentService } from '../../services/appointmentService';
import { BookOpen } from 'lucide-react';

interface PrescriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    patientId: string;
    onSuccess?: () => void;
}

interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}




const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ isOpen, onClose, appointmentId, patientId, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [diagnosis, setDiagnosis] = useState('');
    const [notes, setNotes] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [medicines, setMedicines] = useState<Medicine[]>([
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
    ]);
    const [labTests, setLabTests] = useState<string[]>(['']);
    const signatureCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const [appointment, setAppointment] = useState<any>(null);





    React.useEffect(() => {
        const fetchAppointment = async () => {
            try {
                const res = await appointmentService.getAppointmentById(appointmentId);
                if (res.success) {
                    setAppointment(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch appointment for prescription", err);
            }
        };

        const loadDoctorSignature = async () => {
            try {
                // Import doctorService dynamically to avoid circular dependencies
                const { default: doctorService } = await import('../../services/doctorService');
                const response = await doctorService.getDoctorProfile();
                if (response?.success && response.data?.signature) {
                    // Load the saved signature onto the canvas
                    const canvas = signatureCanvasRef.current;
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            const img = new Image();
                            img.onload = () => {
                                ctx.clearRect(0, 0, canvas.width, canvas.height);
                                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                                setHasSignature(true);
                            };
                            img.src = response.data.signature;
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load doctor signature", err);
            }
        };

        if (isOpen && appointmentId) {
            fetchAppointment();
            loadDoctorSignature();
        }
    }, [isOpen, appointmentId]);


    // Signature functions
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setHasSignature(true);
        const rect = canvas.getBoundingClientRect();
        const offsetX = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const offsetY = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const offsetX = 'touches' in e ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const offsetY = 'touches' in e ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = signatureCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleMedicineChange = (index: number, field: keyof Medicine, value: string) => {
        const newMedicines = [...medicines];
        newMedicines[index][field] = value;
        setMedicines(newMedicines);
    };

    const addMedicine = () => {
        setMedicines([...medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
    };

    const removeMedicine = (index: number) => {
        if (medicines.length > 1) {
            const newMedicines = medicines.filter((_, i) => i !== index);
            setMedicines(newMedicines);
        }
    };

    const handleLabTestChange = (index: number, value: string) => {
        const newLabTests = [...labTests];
        newLabTests[index] = value;
        setLabTests(newLabTests);
    };

    const addLabTest = () => {
        setLabTests([...labTests, '']);
    };

    const removeLabTest = (index: number) => {
        if (labTests.length > 1) {
            const newLabTests = labTests.filter((_, i) => i !== index);
            setLabTests(newLabTests);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!diagnosis.trim()) {
            toast.error("Diagnosis is required");
            return;
        }

        const validMedicines = medicines.filter(m => m.name.trim() !== '');
        if (validMedicines.length === 0) {
            toast.error("At least one medicine is required");
            return;
        }

        if (!hasSignature) {
            toast.error("Doctor's signature is required");
            return;
        }

        const validLabTests = labTests.filter(t => t.trim() !== '');

        try {
            setIsSubmitting(true);
            const signatureData = signatureCanvasRef.current?.toDataURL();

            const prescriptionData = {
                appointmentId,
                patientId,
                diagnosis,
                medicines: validMedicines,
                labTests: validLabTests,
                instructions: notes,
                followUpDate: followUpDate || undefined,
                doctorSignature: signatureData || ''
            };

            const response = await prescriptionService.createPrescription(prescriptionData);
            if (response.success) {
                toast.success("Prescription created successfully");
                onSuccess?.();
                onClose();
            } else {
                toast.error(response.message || "Failed to create prescription");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#00A1B0]/5">
                        <div className="flex items-center gap-2 text-[#00A1B0]">
                            <Pill className="w-5 h-5" />
                            <h2 className="text-xl font-bold bg-gradient-to-r from-[#00A1B0] to-teal-500 bg-clip-text text-transparent">
                                Create Prescription
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-red-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content Area */}
                    <div
                        className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 p-4 md:p-8"
                        data-lenis-prevent
                    >

                        {/* THE "PRESCRIPTION SHEET" CONTAINER */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto">

                            {/* Paper Header */}
                            <div className="bg-gradient-to-r from-[#00A1B0] to-teal-500 px-8 py-6 text-white text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold">TakeCare Digital Prescription</h1>
                                    <p className="text-white/80 text-sm">Empowering healthcare through technology</p>
                                </div>
                                <div className="text-4xl font-bold tracking-wider opacity-30 select-none">℞</div>
                            </div>

                            {/* Section: Patient & Appointment Info bar */}
                            <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                <div>
                                    <span className="text-gray-400 block uppercase mb-0.5">Patient ID</span>
                                    <span className="font-bold text-gray-700">{patientId.slice(-8).toUpperCase()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block uppercase mb-0.5">Appt ID</span>
                                    <span className="font-bold text-gray-700">{appointmentId.slice(-8).toUpperCase()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block uppercase mb-0.5">Date</span>
                                    <span className="font-bold text-gray-700">{new Date().toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400 block uppercase mb-0.5">Time</span>
                                    <span className="font-bold text-gray-700">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>

                            <div className="p-8 space-y-8">
                                {/* Doctor's Consultation Notes Reference */}
                                {appointment?.doctorNotes && appointment.doctorNotes.length > 0 && (
                                    <div className="p-6 rounded-3xl bg-teal-50/50 border border-teal-100 space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-200 shrink-0">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-widest truncate">Session Highlights</h3>
                                                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-tighter truncate">Clinical observations & suggestions</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const relevant = appointment.doctorNotes.filter((n: any) => n.category === 'diagnosis' || n.category === 'observation' || !n.category);
                                                        const text = relevant.map((n: any) => `• ${n.title}: ${n.description}`).join('\n');
                                                        setDiagnosis(prev => prev ? `${prev}\n${text}` : text);
                                                        toast.success("Diagnosis notes copied");
                                                    }}
                                                    className="flex-1 sm:flex-none text-[9px] font-black border-teal-200 text-teal-700 hover:bg-teal-100 rounded-xl px-4 h-9 min-w-[120px]"
                                                >
                                                    COPY DIAGNOSIS
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        const meds = appointment.doctorNotes.filter((n: any) => n.category === 'medicine');
                                                        if (meds.length === 0) {
                                                            toast.error("No medicine notes found");
                                                            return;
                                                        }
                                                        const existingEmpty = medicines.length === 1 && !medicines[0].name;
                                                        const newMeds = meds.map((n: any) => ({
                                                            name: n.title,
                                                            dosage: n.dosage || "",
                                                            frequency: n.frequency || "",
                                                            duration: n.duration || "",
                                                            instructions: ""
                                                        }));
                                                        setMedicines(prev => existingEmpty ? newMeds : [...prev, ...newMeds]);
                                                        toast.success(`Imported ${meds.length} medicines`);
                                                    }}
                                                    className="flex-1 sm:flex-none text-[9px] font-black bg-teal-600 text-white hover:bg-teal-700 rounded-xl px-4 h-9 shadow-sm min-w-[120px]"
                                                >
                                                    IMPORT ALL MEDS
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {appointment.doctorNotes.map((note: any, idx: number) => (
                                                <div key={idx} className="group p-4 bg-white rounded-2xl border border-teal-100 shadow-sm hover:shadow-md transition-all relative">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[7px] font-black uppercase tracking-tighter ${note.category === 'medicine' ? 'bg-amber-100 text-amber-700' :
                                                            note.category === 'lab_test' ? 'bg-indigo-100 text-indigo-700' :
                                                                note.category === 'diagnosis' ? 'bg-red-100 text-red-700' :
                                                                    'bg-teal-100 text-teal-700'
                                                            }`}>
                                                            {note.category || 'observation'}
                                                        </span>
                                                        <span className="text-[8px] text-gray-400 font-bold ml-auto">
                                                            {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-[11px] font-bold text-gray-800 mb-1 truncate">
                                                        {typeof note.title === 'string' ? note.title : JSON.stringify(note.title)}
                                                    </h4>
                                                    {note.category === 'medicine' ? (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            <div className="bg-teal-50 text-[8px] font-black text-teal-600 px-1.5 py-0.5 rounded border border-teal-100">
                                                                {note.dosage}
                                                            </div>
                                                            <div className="bg-teal-50 text-[8px] font-black text-teal-600 px-1.5 py-0.5 rounded border border-teal-100">
                                                                {note.frequency}
                                                            </div>
                                                            <div className="bg-teal-50 text-[8px] font-black text-teal-600 px-1.5 py-0.5 rounded border border-teal-100">
                                                                {note.duration}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[11px] text-gray-500 line-clamp-2 font-medium leading-relaxed">
                                                            {typeof note.description === 'string' ? note.description : (note.description?.text || note.description?.content || JSON.stringify(note.description))}
                                                        </p>
                                                    )}

                                                    {/* Contextual Copy Button */}
                                                    <button
                                                        onClick={() => {
                                                            if (note.category === 'medicine') {
                                                                const existingEmpty = medicines.length === 1 && !medicines[0].name;
                                                                const newMed = {
                                                                    name: note.title,
                                                                    dosage: note.dosage || "",
                                                                    frequency: note.frequency || "",
                                                                    duration: note.duration || "",
                                                                    instructions: ""
                                                                };
                                                                setMedicines(prev => existingEmpty ? [newMed] : [...prev, newMed]);
                                                                toast.success(`Added ${note.title} to medicines`);
                                                            } else if (note.category === 'lab_test') {
                                                                const existingEmpty = labTests.length === 1 && !labTests[0];
                                                                setLabTests(prev => existingEmpty ? [note.title] : [...prev, note.title]);
                                                                toast.success(`Added ${note.title} to lab tests`);
                                                            } else {
                                                                const desc = typeof note.description === 'string' ? note.description : (note.description?.text || note.description?.content || JSON.stringify(note.description));
                                                                setDiagnosis(prev => prev ? `${prev}\n• ${note.title}: ${desc}` : `${note.title}: ${desc}`);
                                                                toast.success(`Ported to diagnosis`);
                                                            }
                                                        }}
                                                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-lg border border-teal-100 text-teal-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-teal-600 hover:text-white transform group-hover:scale-110"
                                                        title="Copy to respective field"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Diagnosis Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between border-b border-[#00A1B0]/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Stethoscope className="w-4 h-4 text-[#00A1B0]" />
                                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Diagnosis & Findings</h3>
                                        </div>
                                    </div>
                                    <textarea
                                        value={diagnosis}
                                        onChange={(e) => setDiagnosis(e.target.value)}
                                        placeholder="What are the patient's symptoms and your diagnosis?"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A1B0] focus:ring-2 focus:ring-[#00A1B0]/10 min-h-[100px] text-sm transition-all placeholder:text-gray-300"
                                    />
                                </div>

                                {/* Medicines Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border-b border-[#00A1B0]/20 pb-2">
                                        <div className="flex items-center gap-2">
                                            <Pill className="w-4 h-4 text-[#00A1B0]" />
                                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Medicines (℞)</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addMedicine}
                                            className="text-xs font-bold text-[#00A1B0] hover:text-[#008f9c] flex items-center gap-1 transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> ADD MEDICINE
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {medicines.map((med, index) => (
                                            <div key={index} className="flex flex-col md:flex-row gap-3 p-4 rounded-xl bg-gray-50/50 border border-gray-50 hover:border-[#00A1B0]/30 transition-all relative group">
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[10px] text-gray-400 block uppercase mb-1">Name</label>
                                                    <input
                                                        placeholder="e.g. Paracetamol"
                                                        value={med.name}
                                                        onChange={(e) => handleMedicineChange(index, 'name', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white rounded border border-gray-200 text-sm focus:border-[#00A1B0] outline-none"
                                                    />
                                                </div>
                                                <div className="w-full md:w-24">
                                                    <label className="text-[10px] text-gray-400 block uppercase mb-1">Dosage</label>
                                                    <input
                                                        placeholder="500mg"
                                                        value={med.dosage}
                                                        onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white rounded border border-gray-200 text-sm focus:border-[#00A1B0] outline-none"
                                                    />
                                                </div>
                                                <div className="w-full md:w-24">
                                                    <label className="text-[10px] text-gray-400 block uppercase mb-1">Freq</label>
                                                    <input
                                                        placeholder="1-0-1"
                                                        value={med.frequency}
                                                        onChange={(e) => handleMedicineChange(index, 'frequency', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white rounded border border-gray-200 text-sm focus:border-[#00A1B0] outline-none"
                                                    />
                                                </div>
                                                <div className="w-full md:w-24">
                                                    <label className="text-[10px] text-gray-400 block uppercase mb-1">Duration</label>
                                                    <input
                                                        placeholder="5 days"
                                                        value={med.duration}
                                                        onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white rounded border border-gray-200 text-sm focus:border-[#00A1B0] outline-none"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-[150px]">
                                                    <label className="text-[10px] text-gray-400 block uppercase mb-1">Instructions</label>
                                                    <input
                                                        placeholder="Before food"
                                                        value={med.instructions}
                                                        onChange={(e) => handleMedicineChange(index, 'instructions', e.target.value)}
                                                        className="w-full px-2 py-1.5 bg-white rounded border border-gray-200 text-sm focus:border-[#00A1B0] outline-none"
                                                    />
                                                </div>
                                                {medicines.length > 1 && (
                                                    <button
                                                        onClick={() => removeMedicine(index)}
                                                        className="absolute -right-2 -top-2 md:static md:mt-6 p-1.5 bg-white shadow-sm md:shadow-none rounded-full text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Lab Tests */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between border-b border-[#00A1B0]/20 pb-2">
                                            <div className="flex items-center gap-2">
                                                <FlaskConical className="w-4 h-4 text-[#00A1B0]" />
                                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Lab Tests</h3>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addLabTest}
                                                className="text-[10px] font-bold text-[#00A1B0] hover:text-[#008f9c] flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" /> ADD TEST
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {labTests.map((test, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <input
                                                        placeholder="e.g. CBC, Blood Sugar..."
                                                        value={test}
                                                        onChange={(e) => handleLabTestChange(index, e.target.value)}
                                                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:border-[#00A1B0] outline-none transition-all"
                                                    />
                                                    {labTests.length > 1 && (
                                                        <button
                                                            onClick={() => removeLabTest(index)}
                                                            className="p-1.5 text-gray-300 hover:text-red-500"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Detailed Notes & Follow up */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between border-b border-[#00A1B0]/20 pb-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-[#00A1B0]" />
                                                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Additional Notes</h3>
                                                </div>
                                            </div>

                                            <textarea
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                placeholder="Advice on diet, lifestyle, etc."
                                                className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A1B0] text-sm min-h-[80px] resize-none outline-none"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 border-b border-[#00A1B0]/20 pb-2">
                                                <Calendar className="w-4 h-4 text-[#00A1B0]" />
                                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Follow-up Date</h3>
                                            </div>
                                            <input
                                                type="date"
                                                value={followUpDate}
                                                onChange={(e) => setFollowUpDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#00A1B0] text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Section */}
                                <div className="pt-8 flex justify-center md:justify-end">
                                    <div className="w-full md:w-64 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Authorized Signature</label>
                                            <button
                                                type="button"
                                                onClick={clearSignature}
                                                className="text-[10px] text-red-400 hover:text-red-600 font-bold"
                                            >
                                                CLEAR
                                            </button>
                                        </div>
                                        <div className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-all ${hasSignature ? 'border-[#00A1B0] bg-teal-50/20' : 'border-gray-200 bg-gray-50'}`}>
                                            <canvas
                                                ref={signatureCanvasRef}
                                                width={400}
                                                height={120}
                                                className="w-full h-[100px] cursor-crosshair touch-none"
                                                onMouseDown={startDrawing}
                                                onMouseMove={draw}
                                                onMouseUp={stopDrawing}
                                                onMouseLeave={stopDrawing}
                                                onTouchStart={startDrawing}
                                                onTouchMove={draw}
                                                onTouchEnd={stopDrawing}
                                            />
                                            {!hasSignature && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300 text-[10px] uppercase font-bold tracking-widest">
                                                    Sign Here
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-center pt-2 border-t border-gray-100">
                                            <p className="text-xs font-bold text-gray-600">Digital Verification Active</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Watermark Footer */}
                            <div className="px-8 py-4 bg-gray-50 flex justify-between items-center opacity-50">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded bg-[#00A1B0] flex items-center justify-center">
                                        <span className="text-white text-[8px] font-bold">TC</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Verified by TakeCare</span>
                                </div>
                                <span className="text-[10px] text-gray-400">Electronic Record ID: APP-{appointmentId.slice(-6).toUpperCase()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Modal Footer Controls */}
                    <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-[#00A1B0] hover:bg-[#008f9c] text-white px-8 font-bold shadow-lg shadow-[#00A1B0]/20 transition-all active:scale-95"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating Prescription...
                                </div>
                            ) : (
                                "Send Prescription"
                            )}
                        </Button>
                    </div>
                </motion.div>

            </div>
        </AnimatePresence>
    );
};

export default PrescriptionModal;

