import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    Award,
    FileText,
    MapPin,
    IndianRupee,
    User,
    Shield,
    AlertTriangle,
    CheckCircle,
    Ban,
    Unlock
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";

interface DoctorDetail {
    id: string;
    name: string;
    email: string;
    phone: string;
    department: string;
    profileImage: string | null;
    gender: string | null;
    dob: string | null;
    qualifications: string[];
    experienceYears: number;
    specialties: string[];
    biography: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        zipCode?: string;
    } | null;
    fees: number;
    documents: string[];
    status: string;
    createdAt: string;
    isActive?: boolean;
}

const DoctorDetailPage: React.FC = () => {
    const { doctorId } = useParams<{ doctorId: string }>();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    const fetchDoctorDetail = async () => {
        if (!doctorId) return;
        setLoading(true);
        const res = await adminService.fetchDoctorRequestDetails(doctorId);
        if (res.success && res.data) {
            setDoctor(res.data);
        } else {
            toast.error(res.message || "Failed to fetch doctor details");
            navigate("/admin/doctors");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchDoctorDetail();
    }, [doctorId]);

    const handleBanToggle = async () => {
        if (!doctor || !doctorId) return;
        const isBanning = doctor.isActive !== false; // true means we will ban, false means unban
        setProcessing(true);
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p className="font-medium text-gray-800">
                    Are you sure you want to {isBanning ? "ban" : "unban"} this doctor?
                </p>
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const res = isBanning
                                ? await adminService.banDoctor(doctorId)
                                : await adminService.unbanDoctor(doctorId);
                            if (res.success) {
                                toast.success(res.message);
                                fetchDoctorDetail();
                            } else {
                                toast.error(res.message);
                            }
                            setProcessing(false);
                        }}
                        className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                    >
                        Yes, {isBanning ? "Ban" : "Unban"}
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

    if (!doctor) return null;

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
                            onClick={() => navigate("/admin/doctors")}
                            className="flex items-center text-gray-500 hover:text-cyan-600 transition-colors mb-6 group"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Doctors List</span>
                        </button>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    {doctor.profileImage ? (
                                        <img
                                            src={doctor.profileImage}
                                            alt={doctor.name}
                                            className="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-gray-100"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-md ring-2 ring-gray-100">
                                            <span className="text-3xl font-bold text-white">
                                                {doctor.name.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-full border-4 border-white ${doctor.isActive === false ? "bg-red-500" : "bg-green-500"}`}>
                                        {doctor.isActive === false ? (
                                            <Ban className="w-4 h-4 text-white" />
                                        ) : (
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-800 mb-1">{doctor.name}</h1>
                                    <div className="flex items-center gap-3 text-gray-500 text-sm">
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                            <Award className="w-4 h-4 text-cyan-500" />
                                            {doctor.department}
                                        </span>
                                        <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-md">
                                            <Calendar className="w-4 h-4 text-cyan-500" />
                                            {doctor.experienceYears} Years Exp.
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={handleBanToggle}
                                    disabled={processing}
                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg transition-all transform hover:scale-105 active:scale-95 ${doctor.isActive === false ? "bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30" : "bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30"}`}
                                >
                                    {processing ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                    ) : doctor.isActive === false ? (
                                        <>
                                            <Unlock className="w-5 h-5" />
                                            Unban Doctor
                                        </>
                                    ) : (
                                        <>
                                            <Ban className="w-5 h-5" />
                                            Ban Doctor
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Personal Info */}
                        <div className="lg:col-span-1 space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <User className="w-5 h-5 text-cyan-500" />
                                    Contact Info
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Email</p>
                                            <p className="text-gray-700 font-medium break-all">{doctor.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                                            <p className="text-gray-700 font-medium">{doctor.phone}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Address</p>
                                            <p className="text-gray-700 font-medium">
                                                {doctor.address ? (
                                                    <>
                                                        {doctor.address.street && <>{doctor.address.street}, </>}
                                                        {doctor.address.city && <>{doctor.address.city}, </>}
                                                        {doctor.address.state && <>{doctor.address.state} </>}
                                                        {doctor.address.zipCode && <>{doctor.address.zipCode}</>}
                                                    </>
                                                ) : "Not provided"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Qualifications & Specialties */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-cyan-500" />
                                    Qualifications & Specialties
                                </h3>
                                <div className="mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Qualifications</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.qualifications.map((qual, index) => (
                                            <span key={index} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100">
                                                {qual}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Specialties</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {doctor.specialties?.map((spec, index) => (
                                            <span key={index} className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-sm font-medium border border-teal-100">
                                                {spec}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Consultation Fees */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <IndianRupee className="w-5 h-5 text-cyan-500" />
                                    Consultation Fees
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Video Consultation</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><IndianRupee className="inline w-4 h-4 mr-1" />{doctor.fees}</td>
                                            </tr>
                                            <tr>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Chat Consultation</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><IndianRupee className="inline w-4 h-4 mr-1" />{doctor.fees}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Documents */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-cyan-500" />
                                    Verification Documents
                                </h3>
                                {doctor.documents.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {doctor.documents.map((doc, index) => {
                                            const isPdf = doc.toLowerCase().endsWith(".pdf");
                                            return (
                                                <a
                                                    key={index}
                                                    href={doc}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="group relative block"
                                                >
                                                    {isPdf ? (
                                                        <div className="w-full h-32 bg-red-50 border-2 border-red-100 rounded-xl flex flex-col items-center justify-center text-red-500 hover:border-red-300 hover:bg-red-100 transition-all">
                                                            <FileText className="w-8 h-8 mb-2" />
                                                            <span className="text-xs font-medium">PDF Document</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden border-2 border-gray-100 group-hover:border-cyan-400 transition-all relative">
                                                            <img
                                                                src={doc}
                                                                alt={`Document ${index + 1}`}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                                                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-xs bg-black/50 px-2 py-1 rounded">
                                                                    View
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </a>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                        <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-500">No documents available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetailPage;
