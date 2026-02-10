import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
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
    Ban,
    Unlock,
    Briefcase,
    GraduationCap,
    Stethoscope
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import AlertDialog from "../../components/common/AlertDialog";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage, AvatarBadge } from "../../components/ui/avatar";

interface DoctorDetail {
    id: string;
    customId?: string;
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
    VideoFees: number;
    ChatFees: number;
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
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const fetchDoctorDetail = useCallback(async () => {
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
    }, [doctorId, navigate]);

    useEffect(() => {
        fetchDoctorDetail();
    }, [fetchDoctorDetail]);

    const handleBanToggle = async () => {
        if (!doctor || !doctorId) return;
        const isBanning = doctor.isActive !== false;

        try {
            setProcessing(true);
            const res = isBanning
                ? await adminService.banDoctor(doctorId)
                : await adminService.unbanDoctor(doctorId);

            if (res.success) {
                toast.success(res.message);
                fetchDoctorDetail();
            } else {
                toast.error(res.message);
            }
        } finally {
            setProcessing(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .filter(Boolean)
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <div className="flex min-h-screen bg-gray-50 no-scrollbar">
            <AlertDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title={doctor?.isActive === false ? "Unban doctor?" : "Ban doctor?"}
                description={
                    doctor?.isActive === false
                        ? "This doctor will be unbanned and can access the platform again."
                        : "This doctor will be banned and won't be able to access the platform."
                }
                confirmText={doctor?.isActive === false ? "Unban" : "Ban"}
                cancelText="Cancel"
                variant={doctor?.isActive === false ? "default" : "destructive"}
                onConfirm={handleBanToggle}
            />

            {/* Sidebar - Desktop */}
            <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
                <Sidebar />
            </div>

            {/* Sidebar - Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ type: "spring", damping: 30, stiffness: 450 }}
                            className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
                        >
                            <Sidebar onMobileClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
                    {loading ? (
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Header Skeleton */}
                            <div className="space-y-4">
                                <Skeleton className="h-10 w-48" />
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row items-start gap-6">
                                            <Skeleton className="w-24 h-24 rounded-xl" />
                                            <div className="flex-1 space-y-3">
                                                <Skeleton className="h-8 w-64" />
                                                <div className="flex gap-2">
                                                    <Skeleton className="h-6 w-32" />
                                                    <Skeleton className="h-6 w-32" />
                                                </div>
                                            </div>
                                            <Skeleton className="h-10 w-32" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Content Skeleton */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <Skeleton className="h-6 w-32" />
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="space-y-2">
                                                    <Skeleton className="h-4 w-20" />
                                                    <Skeleton className="h-5 w-full" />
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="lg:col-span-2 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <Skeleton className="h-6 w-48" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[1, 2, 3, 4].map(i => (
                                                    <Skeleton key={i} className="h-32 w-full" />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    ) : doctor && (
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Back Button */}
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/admin/doctors")}
                                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 -ml-2"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Doctors List
                            </Button>

                            {/* Doctor Header Card */}
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4">
                                            {/* Profile Image */}
                                            <Avatar className="w-20 h-20 md:w-24 md:h-24">
                                                <AvatarImage src={doctor.profileImage || undefined} alt={doctor.name} />
                                                <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-2xl md:text-3xl font-bold">
                                                    {getInitials(doctor.name)}
                                                </AvatarFallback>
                                                <AvatarBadge className={doctor.isActive === false ? "bg-red-600" : "bg-green-600"} />
                                            </Avatar>

                                            {/* Doctor Info */}
                                            <div>
                                                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                                                    Dr. {doctor.name}
                                                </h1>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                                                        <Award className="w-3 h-3 mr-1" />
                                                        {doctor.department}
                                                    </Badge>
                                                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {doctor.experienceYears} Years Exp.
                                                    </Badge>
                                                    <Badge
                                                        variant={doctor.isActive === false ? "destructive" : "default"}
                                                        className={doctor.isActive === false ? "" : "bg-green-600"}
                                                    >
                                                        {doctor.isActive === false ? "Banned" : "Active"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Button
                                            onClick={() => setConfirmOpen(true)}
                                            disabled={processing}
                                            variant={doctor.isActive === false ? "default" : "destructive"}
                                            className={doctor.isActive === false ? "bg-green-600 hover:bg-green-700" : ""}
                                        >
                                            {processing ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                            ) : doctor.isActive === false ? (
                                                <>
                                                    <Unlock className="w-4 h-4 mr-2" />
                                                    Unban Doctor
                                                </>
                                            ) : (
                                                <>
                                                    <Ban className="w-4 h-4 mr-2" />
                                                    Ban Doctor
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Main Content Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Left Column */}
                                <div className="space-y-6">
                                    {/* Contact Information */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-cyan-600" />
                                                Contact Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Mail className="w-4 h-4" />
                                                    <span className="font-medium">Email</span>
                                                </div>
                                                <p className="text-gray-900 pl-6 break-all">{doctor.email}</p>
                                            </div>
                                            <Separator />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <Phone className="w-4 h-4" />
                                                    <span className="font-medium">Phone</span>
                                                </div>
                                                <p className="text-gray-900 pl-6">{doctor.phone}</p>
                                            </div>
                                            <Separator />
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="font-medium">Address</span>
                                                </div>
                                                <p className="text-gray-900 pl-6">
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
                                        </CardContent>
                                    </Card>

                                    {/* Qualifications & Specialties */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <GraduationCap className="w-5 h-5 text-cyan-600" />
                                                Qualifications
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex flex-wrap gap-2">
                                                {doctor.qualifications.map((qual, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        {qual}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Specialties */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Stethoscope className="w-5 h-5 text-cyan-600" />
                                                Specialties
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-wrap gap-2">
                                                {doctor.specialties?.map((spec, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-teal-50 text-teal-700 border-teal-200">
                                                        {spec}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Consultation Fees */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <IndianRupee className="w-5 h-5 text-cyan-600" />
                                                Consultation Fees
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">Video Consultation</span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    ₹{doctor.VideoFees}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                <span className="text-sm font-medium text-gray-700">Chat Consultation</span>
                                                <span className="text-lg font-bold text-gray-900">
                                                    ₹{doctor.ChatFees}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Right Column */}
                                <div className="lg:col-span-2 space-y-6">
                                    {/* Verification Documents */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Shield className="w-5 h-5 text-cyan-600" />
                                                Verification Documents
                                            </CardTitle>
                                            <CardDescription>
                                                Professional certificates and identification documents
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            {doctor.documents.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                                                                    <div className="w-full h-40 bg-red-50 border-2 border-red-200 rounded-xl flex flex-col items-center justify-center text-red-600 hover:border-red-400 hover:bg-red-100 transition-all">
                                                                        <FileText className="w-10 h-10 mb-2" />
                                                                        <span className="text-sm font-medium">PDF Document</span>
                                                                        <span className="text-xs text-red-500 mt-1">Click to view</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-cyan-400 transition-all relative">
                                                                        <img
                                                                            src={doc}
                                                                            alt={`Document ${index + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                                                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black/60 px-3 py-1.5 rounded-lg">
                                                                                View Full Size
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </a>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-gray-500 font-medium">No documents available</p>
                                                    <p className="text-sm text-gray-400 mt-1">No verification documents have been uploaded</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Biography Section (if available) */}
                                    {doctor.biography && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <Briefcase className="w-5 h-5 text-cyan-600" />
                                                    Biography
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-700 leading-relaxed">{doctor.biography}</p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Doctor ID Card */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-cyan-600" />
                                                Doctor ID
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                                                {doctor.customId || "Not assigned"}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default DoctorDetailPage;
