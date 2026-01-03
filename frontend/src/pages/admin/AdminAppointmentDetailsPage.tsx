import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CreditCard,
  Mail,
  Phone,
  Stethoscope,
  User,
  BadgeIndianRupee,
  ShieldCheck,
  X,
} from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { appointmentService } from "../../services/appointmentService";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStatusStyles = (status: string) => {
  const s = String(status || "").toLowerCase();
  if (s === "confirmed") return "bg-green-100 text-green-700";
  if (s === "completed") return "bg-blue-100 text-blue-700";
  if (s === "cancelled") return "bg-gray-200 text-gray-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

const formatStatus = (status: string) => {
  const s = String(status || "");
  if (!s) return "Pending";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

const AdminAppointmentDetailsPage: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();

  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!appointmentId) {
        toast.error("Missing appointment id");
        return;
      }
      setLoading(true);
      try {
        const res = await appointmentService.getAppointmentById(appointmentId);
        const payload = res?.data?.appointment ?? res?.data ?? res?.appointment;
        if (!res?.success || !payload) {
          toast.error(res?.message || "Failed to fetch appointment details");
          setAppointment(null);
          return;
        }
        setAppointment(payload);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || e?.message || "Error fetching appointment details");
        setAppointment(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [appointmentId]);

  const doctor = appointment?.doctorId ?? appointment?.doctor;
  const doctorUser = doctor?.userId ?? doctor?.user ?? doctor;
  const patient = appointment?.patientId ?? appointment?.patient;
  const patientUser = patient?.userId ?? patient?.user ?? patient;

  const appointmentDisplayId =
    appointment?.customId ||
    appointment?.id ||
    appointment?._id ||
    appointmentId ||
    "-";

  const canCancel = !!appointment && String(appointment?.status || "").toLowerCase() !== "cancelled" && String(appointment?.status || "").toLowerCase() !== "completed";
  const cancelTargetId = String(
    appointment?._id ?? appointment?.id ?? appointmentId ?? appointment?.customId ?? ""
  );

  async function handleCancel(id: string) {
    if (!cancelReason.trim()) {
      toast.error("Please enter a cancellation reason");
      return;
    }

    try {
      setCancelling(true);
      const res = await appointmentService.cancelAppointment(id, cancelReason.trim());
      if (res?.success === false) {
        toast.error(res?.message || "Failed to cancel appointment");
        return;
      }

      toast.success(res?.message || "Appointment cancelled");
      setAppointment((prev: any) =>
        prev
          ? {
            ...prev,
            status: "cancelled",
            cancellationReason: cancelReason.trim(),
          }
          : prev
      );
      setCancelDialogOpen(false);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message || e?.message || "Error cancelling appointment"
      );
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">


      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) setCancelReason("");
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader className="flex flex-row items-start justify-between gap-4">
            <div className="space-y-1.5">
              <DialogTitle>Cancel appointment</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this appointment.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => setCancelDialogOpen(false)}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </DialogHeader>

          <DialogBody>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cancellation reason
            </label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={4}
              placeholder="Enter reason..."
            />
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
              disabled={cancelling}
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => handleCancel(cancelTargetId)}
              disabled={cancelling || !cancelTargetId || !cancelReason.trim()}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {cancelling ? "Cancelling..." : "Confirm cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            {/* Sidebar Content */}
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-[#e0f7fa] to-[#f0f9ff] rounded-xl border border-gray-100 p-6 sm:p-8 md:p-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#002f33] text-center">
                Appointment Details
              </h1>
            </div>

            <div className="mt-5 sm:mt-6">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#00A1B0] transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="font-semibold">Back</span>
              </button>
            </div>

            {loading && (
              <div className="mt-6 text-center text-gray-500">Loading appointment details...</div>
            )}

            {!loading && !appointment && (
              <div className="mt-6 text-center text-gray-500">No appointment details found.</div>
            )}

            {!loading && appointment && (
              <div className="mt-5 sm:mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-12">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#00A1B0]/10 text-[#00A1B0] flex items-center justify-center font-bold flex-shrink-0">
                          #
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-gray-500">Appointment ID</div>
                          <div className="font-semibold text-gray-900 truncate font-mono">{appointmentDisplayId}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyles(
                            appointment?.status
                          )}`}
                        >
                          {formatStatus(appointment?.status)}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#00A1B0]/10 text-[#00A1B0]">
                          {String(appointment?.appointmentType || appointment?.type || "").toLowerCase() === "video" ? "Video call" : "Chat"}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-4">
                          <div className="rounded-2xl border border-gray-100 p-4 sm:p-5 h-full">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <Stethoscope size={16} className="text-[#00A1B0]" />
                                Doctor
                              </div>
                              <span className="text-xs font-semibold text-gray-400">#{doctor?.customId}</span>
                            </div>

                            <div className="flex items-center gap-4">
                              {doctorUser?.profileImage ? (
                                <img
                                  src={doctorUser.profileImage}
                                  alt={doctorUser?.name || "Doctor"}
                                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center font-bold">
                                  {getInitials(doctorUser?.name || "-")}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {doctorUser?.name || "-"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {doctor?.specialty || doctorUser?.specialty || "Doctor"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span className="truncate">{doctorUser?.email || "-"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span className="truncate">{doctorUser?.phone || "-"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-4">
                          <div className="rounded-2xl border border-gray-100 p-4 sm:p-5 h-full">
                            <div className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <ShieldCheck size={16} className="text-[#00A1B0]" />
                              Appointment Info
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <Calendar size={14} className="text-gray-400" />
                                  Date
                                </div>
                                <div className="font-semibold text-gray-900">
                                  {appointment?.appointmentDate
                                    ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    })
                                    : "-"}
                                </div>
                              </div>

                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <Clock size={14} className="text-gray-400" />
                                  Time
                                </div>
                                <div className="font-semibold text-gray-900">{appointment?.appointmentTime || appointment?.time || "-"}</div>
                              </div>

                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1">Department</div>
                                <div className="font-semibold text-gray-900">{doctor.specialty}</div>
                              </div>

                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1">Visit Type</div>
                                <div className="font-semibold text-gray-900">{appointment?.visitType || appointment?.consultationType || "-"}</div>
                              </div>

                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <BadgeIndianRupee size={14} className="text-gray-400" />
                                  Price
                                </div>
                                <div className="font-semibold text-gray-900">₹{appointment?.consultationFees ?? appointment?.fees ?? 0}</div>
                              </div>

                              <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
                                <div className="text-xs text-gray-500 mb-1 flex items-center gap-2">
                                  <CreditCard size={14} className="text-gray-400" />
                                  Payment
                                </div>
                                <div className="font-semibold text-gray-900 capitalize">
                                  {appointment?.paymentStatus || appointment?.payment?.status || "-"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <Button
                                type="button"
                                onClick={() => {
                                  setCancelReason("");
                                  setCancelDialogOpen(true);
                                }}
                                disabled={!canCancel}
                                className="w-full bg-red-500 text-white hover:bg-red-600"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-4">
                          <div className="rounded-2xl border border-gray-100 p-4 sm:p-5 h-full">
                            <div className="flex items-center justify-between mb-4">
                              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <User size={16} className="text-[#00A1B0]" />
                                Patient
                              </div>
                              <span className="text-xs font-semibold text-gray-400">#{patient?.customId || patient?.id || patient?._id || "-"}</span>
                            </div>

                            <div className="flex items-center gap-4">
                              {patientUser?.profileImage ? (
                                <img
                                  src={patientUser.profileImage}
                                  alt={patientUser?.name || "Patient"}
                                  className="w-14 h-14 rounded-2xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white flex items-center justify-center font-bold">
                                  {getInitials(patientUser?.name || "-")}
                                </div>
                              )}

                              <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate">
                                  {patientUser?.name || "-"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {"Patient"}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Mail size={14} className="text-gray-400" />
                                <span className="truncate">{patientUser?.email || "-"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <Phone size={14} className="text-gray-400" />
                                <span className="truncate">{patientUser?.phone || "-"}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-xs text-gray-500 mb-1">Appointment Date & Time</div>
                          <div className="font-semibold text-gray-900">
                            {appointment?.appointmentDate
                              ? new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                              : "-"}
                            {" · "}
                            {appointment?.appointmentTime || appointment?.time || "-"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-xs text-gray-500 mb-1">Type of Appointment</div>
                          <div className="font-semibold text-gray-900 capitalize">
                            {appointment?.appointmentType || appointment?.type || "-"}
                          </div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-xs text-gray-500 mb-1">Department</div>
                          <div className="font-semibold text-gray-900">{doctor?.specialty || appointment?.department || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAppointmentDetailsPage;
