import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import { ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  gender: string;
  dob: string | null;
  createdAt: string;
  isActive: boolean;
}

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

const PatientsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const limit = 10;

  const fetchPatients = async (currentPage: number) => {
    setLoading(true);
    try {
      const res = await adminService.getAllPatients(currentPage, limit);
      if (res?.success && res?.data) {
        setPatients(res.data.patients || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        toast.error(res?.message || "Failed to fetch patients");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error fetching patients");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients(page);
  }, [page]);

  const pagesToShow = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />

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

        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                Patients
              </h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">
                  Loading patients...
                </div>
              ) : patients.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No patients found.
                </div>
              ) : (
                <>
                  {/* ================= MOBILE VIEW ================= */}
                  <div className="lg:hidden p-4 space-y-3">
                    {patients.map((patient, idx) => (
                      <div
                        key={patient.id}
                        className="border border-gray-100 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {patient.profileImage ? (
                              <img
                                src={patient.profileImage}
                                className="w-10 h-10 rounded-full object-cover border"
                                alt={patient.name}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                                {getInitials(patient.name)}
                              </div>
                            )}
                            <div>
                              <h3 className="font-semibold text-gray-800 text-sm">
                                {patient.name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">
                                {patient.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => navigate(`/admin/patients/${patient.id}`)}
                            className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center"
                          >
                            <Eye size={16} />
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-y-2 text-xs">
                          <span className="text-gray-500">Phone</span>
                          <span className="text-right">{patient.phone}</span>

                          <span className="text-gray-500">Gender</span>
                          <span className="text-right capitalize">{patient.gender}</span>

                          <span className="text-gray-500">Status</span>
                          <span
                            className={`text-right font-semibold ${
                              patient.isActive
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {patient.isActive ? "Active" : "Blocked"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ================= DESKTOP VIEW ================= */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 border-b">
                        <tr className="text-xs uppercase text-gray-500">
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Phone</th>
                          <th className="px-6 py-4">Gender</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {patients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {patient.profileImage ? (
                                  <img
                                    src={patient.profileImage}
                                    className="w-9 h-9 rounded-full object-cover border"
                                    alt={patient.name}
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                                    {getInitials(patient.name)}
                                  </div>
                                )}
                                <span className="font-medium text-gray-800">
                                  {patient.name}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4 text-sm text-gray-600">
                              {patient.email}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {patient.phone}
                            </td>
                            <td className="px-6 py-4 text-sm capitalize">
                              {patient.gender}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  patient.isActive
                                    ? "bg-green-100 text-green-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {patient.isActive ? "Active" : "Blocked"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => navigate(`/admin/patients/${patient.id}`)}
                                className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 inline-flex items-center justify-center"
                              >
                                <Eye size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Pagination */}
              {!loading && totalPages > 1 && (
                <div className="px-6 py-4 border-t flex justify-center gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {pagesToShow.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-full text-sm font-semibold ${
                        p === page
                          ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-white"
                          : "border"
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PatientsListPage;
