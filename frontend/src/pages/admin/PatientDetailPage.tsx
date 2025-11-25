import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    User,
    Ban,
    CheckCircle,
    UserCircle
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";

interface PatientDetail {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string | null;
    gender: string;
    dob: string | null;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
}

const PatientDetailPage: React.FC = () => {
    const { patientId } = useParams<{ patientId: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<PatientDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchPatientDetail = async () => {
        if (!patientId) return;
        setLoading(true);
        const res = await adminService.getPatientById(patientId);
        if (res.success && res.data) {
            setPatient(res.data);
        } else {
            toast.error(res.message || "Failed to fetch patient details");
            navigate("/admin/patients");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPatientDetail();
    }, [patientId]);

    const handleBlockToggle = async () => {
        if (!patient || !patientId) return;
        const isBlocking = patient.isActive !== false;
        setProcessing(true);
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-gray-800">
                    Are you sure you want to {isBlocking ? "block" : "unblock"} this patient?
                </p>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const res = isBlocking
                                ? await adminService.blockPatient(patientId)
                                : await adminService.unblockPatient(patientId);
                            if (res.success) {
                                toast.success(res.message);
                                fetchPatientDetail();
                            } else {
                                toast.error(res.message);
                            }
                            setProcessing(false);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                        Yes, {isBlocking ? "Block" : "Unblock"}
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            setProcessing(false);
                        }}
                        className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        ), { duration: 5000 });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen bg-gray-50">
                <Sidebar />
                <div className="flex-1 flex flex-col">
                    <TopNav />
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
                    </div>
                </div>
            </div>
        );
    }

    if (!patient) return null;

    return (
        <div className="flex min-h-screen bg-gray-50 font-sans">
            <Toaster position="top-center" />
            <Sidebar />
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <TopNav />
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {/* Header & Navigation */}
                    <div className="max-w-6xl mx-auto mb-8">
                        <button
                            onClick={() => navigate("/admin/patients")}
                            className="flex items-center text-gray-500 hover:text-cyan-600 transition-colors mb-6 group"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Patients List</span>
                        </button>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    {patient.profileImage ? (
                                        <img
                                            src={patient.profileImage}
                                            alt={patient.name}
                                            className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-gray-100"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-md ring-2 ring-gray-100">
                                            <span className="text-3xl font-bold text-white">
                                                {patient.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-4 border-white ${patient.isActive === false ? "bg-red-500" : "bg-green-500"}`}>
                                        {patient.isActive === false ? (
                                            <Ban className="w-4 h-4 text-white" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-1">{patient.name}</h1>
                                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                            <UserCircle className="w-4 h-4 text-cyan-500" />
                                            Patient
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md capitalize">
                                            {patient.gender}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBlockToggle}
                                    disabled={processing}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${patient.isActive === false ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30"}`}
                                >
                                    {processing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    ) : patient.isActive === false ? (
                                        <>
                                            <CheckCircle className="w-5 h-5" />
                                            Unblock Patient
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="w-5 h-5" />
                                            Block Patient
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Personal Info */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-500" />
                                    Contact Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                                            <p className="text-gray-700 font-medium break-all">{patient.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                                            <p className="text-gray-700 font-medium">{patient.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date of Birth</p>
                                            <p className="text-gray-700 font-medium">
                                                {patient.dob ? new Date(patient.dob).toLocaleDateString() : "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Account Info */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-cyan-500" />
                                    Account Information
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                                            <span className="text-sm">📅</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Joined Date</p>
                                            <p className="text-gray-700 font-medium">
                                                {new Date(patient.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                                            <span className="text-sm">🔄</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Last Updated</p>
                                            <p className="text-gray-700 font-medium">
                                                {new Date(patient.updatedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="w-5 h-5 text-gray-400 mt-0.5 flex items-center justify-center">
                                            {patient.isActive ? (
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                            ) : (
                                                <Ban className="w-5 h-5 text-red-500" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Account Status</p>
                                            <p className={`font-bold ${patient.isActive ? "text-green-600" : "text-red-600"}`}>
                                                {patient.isActive ? "Active" : "Blocked"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailPage;
