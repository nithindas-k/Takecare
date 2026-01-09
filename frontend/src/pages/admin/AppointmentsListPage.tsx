import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { appointmentService } from "../../services/appointmentService";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

type Gender = "male" | "female" | "other";

interface PopulatedUser {
  id?: string;
  customId?: string;
  name?: string;
  email?: string;
  phone?: string;
  profileImage?: string | null;
  gender?: Gender | null;
  dob?: string | null;
}

interface PopulatedDoctor {
  id?: string;
  customId?: string;
  specialty?: string;
  userId?: {
    name?: string;
    email?: string;
    phone?: string;
    profileImage?: string | null;
  } | null;
}

interface Appointment {
  id?: string;
  customId?: string;
  patientId?: PopulatedUser | null;
  doctorId?: PopulatedDoctor | null;
  appointmentDate?: string;
  appointmentTime?: string;
  consultationFees?: number;
  status?: string;
}

const calcAge = (dob?: string | null): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDt = new Date(diff);
  return Math.abs(ageDt.getUTCFullYear() - 1970);
};

const getInitials = (name?: string) => {
  if (!name) return "??";
  return name
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const getStatusBadgeClasses = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "confirmed") return "bg-green-100 text-green-700";
  if (s === "completed") return "bg-blue-100 text-blue-700";
  if (s === "cancelled") return "bg-gray-200 text-gray-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-yellow-100 text-yellow-700";
};

const formatStatus = (status?: string) => {
  if (!status) return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const AdminAppointmentsListPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 5;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const navigateToAppointmentDetails = (apt: Appointment) => {
    const appointmentId = apt.id || apt.customId;
    if (!appointmentId) {
      toast.error("Missing appointment id");
      return;
    }
    navigate(`/admin/appointment/${appointmentId}`);
  };

  const fetchAppointments = async (currentPage: number) => {
    setLoading(true);
    try {
      const filters: any = {};
      if (debouncedSearch) filters.search = debouncedSearch;
      if (status !== "all") filters.status = status;

      const res = await appointmentService.getAllAppointments(currentPage, limit, filters);
      if (res?.success && res?.data) {
        const data = res.data;
        setAppointments(data.appointments || []);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error(res?.message || "Failed to fetch appointments");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Error fetching appointments");
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchAppointments(page);
  }, [page, debouncedSearch, status]);

  const pagesToShow = useMemo(() => {
    const items: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) items.push(p);
    return items;
  }, [page, totalPages]);

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
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

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
                  <p className="text-sm text-gray-500">Manage all patient appointments</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Search patient, doctor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm"
                  />

                  <select
                    value={status}
                    onChange={(e) => {
                      setStatus(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">Loading appointments...</div>
              ) : appointments.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No appointments found.</div>
              ) : (
                <>
                  <div className="lg:hidden p-3 sm:p-4 space-y-3">
                    {appointments.map((apt, idx) => {
                      const patient = apt.patientId || null;
                      const doctor = apt.doctorId || null;

                      const patientName = patient?.name || "-";
                      const patientEmail = patient?.email || "-";
                      const age = calcAge(patient?.dob);
                      const gender = patient?.gender ? String(patient.gender) : "-";
                      const department = doctor?.specialty || "-";
                      const doctorName = doctor?.userId?.name || "-";
                      const fees = typeof apt.consultationFees === "number" ? `₹${apt.consultationFees}` : "-";
                      const statusLabel = formatStatus(apt.status);
                      const serial = (page - 1) * limit + (idx + 1);

                      return (
                        <div
                          key={apt.id || apt.customId || idx}
                          className="border border-gray-100 rounded-xl p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              {patient?.profileImage ? (
                                <img
                                  src={patient.profileImage}
                                  alt={patientName}
                                  className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0 aspect-square"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 aspect-square">
                                  {getInitials(patientName)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-400">#{serial}</span>
                                  <h3 className="font-semibold text-gray-800 text-sm truncate">{patientName}</h3>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{patientEmail}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => navigateToAppointmentDetails(apt)}
                                className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center hover:bg-cyan-200 transition-colors"
                                title="View details"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Status</span>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(
                                apt.status
                              )}`}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="text-xs text-gray-500">Age</div>
                            <div className="text-xs text-gray-800 text-right">{age ?? "-"}</div>

                            <div className="text-xs text-gray-500">Gender</div>
                            <div className="text-xs text-gray-800 text-right capitalize">{gender}</div>

                            <div className="text-xs text-gray-500">Department</div>
                            <div className="text-xs text-gray-800 text-right">{department}</div>

                            <div className="text-xs text-gray-500">Date</div>
                            <div className="text-xs text-gray-800 text-right">{formatDate(apt.appointmentDate)}</div>

                            <div className="text-xs text-gray-500">Time</div>
                            <div className="text-xs text-gray-800 text-right">{apt.appointmentTime || "-"}</div>

                            <div className="text-xs text-gray-500">Doctor</div>
                            <div className="text-xs text-gray-800 text-right">{doctorName}</div>

                            <div className="text-xs text-gray-500">Fees</div>
                            <div className="text-xs text-gray-800 text-right">{fees}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden lg:block overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase text-gray-500 font-semibold">
                          <th className="px-3 py-4 w-[40px]">#</th>
                          <th className="px-3 py-4 w-[180px]">Patient</th>
                          <th className="px-3 py-4 w-[50px]">Age</th>
                          <th className="px-3 py-4 w-[70px]">Gender</th>
                          <th className="px-3 py-4 w-[100px]">Date</th>
                          <th className="px-3 py-4 w-[90px]">Time</th>
                          <th className="px-3 py-4 w-[160px]">Doctor</th>
                          <th className="px-3 py-4 w-[70px]">Fees</th>
                          <th className="px-3 py-4 w-[110px]">Status</th>
                          <th className="px-3 py-4 w-[60px] text-center">Details</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {appointments.map((apt, idx) => {
                          const patient = apt.patientId || null;
                          const doctor = apt.doctorId || null;

                          const patientName = patient?.name || "-";
                          const patientEmail = patient?.email || "-";
                          const age = calcAge(patient?.dob);
                          const gender = patient?.gender ? String(patient.gender) : "-";
                          const department = doctor?.specialty || "-";
                          const doctorName = doctor?.userId?.name || "-";
                          const fees =
                            typeof apt.consultationFees === "number" ? `₹${apt.consultationFees}` : "-";
                          const statusLabel = formatStatus(apt.status);

                          return (
                            <tr key={apt.id || apt.customId || idx} className="hover:bg-gray-50 transition-colors">
                              <td className="px-3 py-4 text-xs text-gray-600">
                                {(page - 1) * limit + (idx + 1)}
                              </td>

                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2">
                                  {patient?.profileImage ? (
                                    <img
                                      src={patient.profileImage}
                                      alt={patientName}
                                      className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 aspect-square"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 aspect-square">
                                      {getInitials(patientName)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 text-xs truncate">{patientName}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{patientEmail}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-4 text-xs text-gray-600">{age ?? "-"}</td>
                              <td className="px-3 py-4 text-xs text-gray-600 capitalize">{gender}</td>
                              <td className="px-3 py-4 text-xs text-gray-600">{formatDate(apt.appointmentDate)}</td>
                              <td className="px-3 py-4 text-xs text-gray-600">{apt.appointmentTime || "-"}</td>

                              <td className="px-3 py-4">
                                <div className="flex items-center gap-2">
                                  {doctor?.userId?.profileImage ? (
                                    <img
                                      src={doctor.userId.profileImage}
                                      alt={doctorName}
                                      className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 aspect-square"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 aspect-square">
                                      {getInitials(doctorName)}
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-medium text-gray-800 text-xs truncate">{doctorName}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{department}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-3 py-4 text-xs text-gray-600">{fees}</td>

                              <td className="px-3 py-4">
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClasses(
                                    apt.status
                                  )}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>

                              <td className="px-3 py-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => navigateToAppointmentDetails(apt)}
                                    className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center hover:bg-cyan-200 transition-colors"
                                    title="View details"
                                  >
                                    <Eye size={14} />
                                  </button>

                                
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!loading && totalPages > 1 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-white flex items-center justify-center">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-colors ${page === 1
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-[#00A1B0] border-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                        }`}
                      title="Previous"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {pagesToShow.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-semibold transition-colors ${p === page
                          ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-white shadow"
                          : "bg-white text-[#00A1B0] border border-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                          }`}
                        title={`Page ${p}`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-colors ${page === totalPages
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : "bg-white text-[#00A1B0] border-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                        }`}
                      title="Next"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminAppointmentsListPage;
