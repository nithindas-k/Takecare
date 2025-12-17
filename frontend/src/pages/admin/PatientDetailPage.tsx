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
  UserCircle,
  X,
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import AlertDialog from "../../components/common/AlertDialog";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (!patient) return null;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />

      <AlertDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={patient.isActive ? "Block patient?" : "Unblock patient?"}
        description={
          patient.isActive
            ? "This patient will be blocked and won’t be able to access the app."
            : "This patient will be unblocked and will be able to access the app again."
        }
        confirmText={patient.isActive ? "Block" : "Unblock"}
        cancelText="Cancel"
        variant={patient.isActive ? "destructive" : "default"}
        onConfirm={handleBlockToggle}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <div className="flex justify-end p-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto">

            {/* Back */}
            <button
              onClick={() => navigate("/admin/patients")}
              className="flex items-center text-gray-500 hover:text-cyan-600 mb-6"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Patients
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-5">
                  {patient.profileImage ? (
                    <img
                      src={patient.profileImage}
                      alt={patient.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                      {patient.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                      {patient.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                      <UserCircle className="w-4 h-4 text-cyan-500" />
                      Patient · {patient.gender}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setConfirmOpen(true)}
                  disabled={processing}
                  className={`w-full md:w-auto px-6 py-3 rounded-xl font-semibold text-white transition ${
                    patient.isActive
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-green-500 hover:bg-green-600"
                  }`}
                >
                  {processing
                    ? "Processing..."
                    : patient.isActive
                    ? "Block Patient"
                    : "Unblock Patient"}
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Contact Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <User className="w-5 h-5 text-cyan-500" />
                  Contact Information
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Mail className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium break-all">{patient.email}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Phone className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Calendar className="text-gray-400 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {patient.dob
                          ? new Date(patient.dob).toLocaleDateString()
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h3 className="font-bold text-gray-800 mb-5 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  Account Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-medium">
                      {new Date(patient.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {new Date(patient.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <p
                      className={`font-bold ${
                        patient.isActive
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {patient.isActive ? "Active" : "Blocked"}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientDetailPage;
