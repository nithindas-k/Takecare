import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  User,
  UserCircle,
  Shield,
  Clock,
  CheckCircle,
  Ban,
  Unlock,
  Activity,
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

interface PatientDetail {
  id: string;
  customId?: string;
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchPatientDetail = useCallback(async () => {
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
  }, [patientId, navigate]);

  useEffect(() => {
    fetchPatientDetail();
  }, [fetchPatientDetail]);

  const handleBlockToggle = async () => {
    if (!patient || !patientId) return;
    const isBlocking = patient.isActive;
    setProcessing(true);

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

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={patient?.isActive ? "Block patient?" : "Unblock patient?"}
        description={
          patient?.isActive
            ? "This patient will be blocked and won't be able to access the app."
            : "This patient will be unblocked and will be able to access the app again."
        }
        confirmText={patient?.isActive ? "Block" : "Unblock"}
        cancelText="Cancel"
        variant={patient?.isActive ? "destructive" : "default"}
        onConfirm={handleBlockToggle}
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
                      <Skeleton className="w-24 h-24 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-8 w-64" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Content Skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </div>
          ) : patient ? (
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => navigate("/admin/patients")}
                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 -ml-2"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Patients List
              </Button>

              {/* Patient Header Card */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar with Badge */}
                      <Avatar className="w-20 h-20 md:w-24 md:h-24">
                        <AvatarImage src={patient.profileImage || undefined} alt={patient.name} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-2xl md:text-3xl font-bold">
                          {getInitials(patient.name)}
                        </AvatarFallback>
                        <AvatarBadge className={patient.isActive ? "bg-green-600" : "bg-red-600"} />
                      </Avatar>

                      {/* Patient Info */}
                      <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                          {patient.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200">
                            <UserCircle className="w-3 h-3 mr-1" />
                            Patient
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            {patient.gender}
                          </Badge>
                          {patient.dob && calculateAge(patient.dob) && (
                            <Badge variant="secondary" className="bg-cyan-50 text-cyan-700 border-cyan-200">
                              <Calendar className="w-3 h-3 mr-1" />
                              {calculateAge(patient.dob)} years old
                            </Badge>
                          )}
                          <Badge
                            variant={patient.isActive ? "default" : "destructive"}
                            className={patient.isActive ? "bg-green-600" : ""}
                          >
                            {patient.isActive ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3 mr-1" />
                                Blocked
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() => setConfirmOpen(true)}
                      disabled={processing}
                      variant={patient.isActive ? "destructive" : "default"}
                      className={!patient.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {processing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : patient.isActive ? (
                        <>
                          <Ban className="w-4 h-4 mr-2" />
                          Block Patient
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Unblock Patient
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-cyan-600" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>Personal contact details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-4 h-4" />
                        <span className="font-medium">Email Address</span>
                      </div>
                      <p className="text-gray-900 pl-6 break-all">{patient.email}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">Phone Number</span>
                      </div>
                      <p className="text-gray-900 pl-6">{patient.phone}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Date of Birth</span>
                      </div>
                      <p className="text-gray-900 pl-6">
                        {patient.dob
                          ? new Date(patient.dob).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                          : "Not provided"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-cyan-600" />
                      Account Information
                    </CardTitle>
                    <CardDescription>Account status and activity</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">Member Since</span>
                      </div>
                      <p className="text-gray-900 pl-6">
                        {new Date(patient.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">Last Updated</span>
                      </div>
                      <p className="text-gray-900 pl-6">
                        {new Date(patient.updatedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4" />
                        <span className="font-medium">Account Status</span>
                      </div>
                      <div className="pl-6">
                        <Badge
                          variant={patient.isActive ? "default" : "destructive"}
                          className={patient.isActive ? "bg-green-600" : ""}
                        >
                          {patient.isActive ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active & Accessible
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3 mr-1" />
                              Blocked
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="w-5 h-5 text-cyan-600" />
                    Patient ID
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
                    {patient.customId || "Not assigned"}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default PatientDetailPage;
