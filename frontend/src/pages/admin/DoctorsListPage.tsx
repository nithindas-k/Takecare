import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { Eye, ChevronLeft, ChevronRight } from "lucide-react";
import adminService from "../../services/adminService";

interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  profileImage: string | null;
  createdAt: string;
  experienceYears: number;
  isActive: boolean;
}

const DoctorsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [isActive, setIsActive] = useState<string>("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const limit = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDoctors = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const filters: { search?: string; specialty?: string; isActive?: string } = {};
      if (debouncedSearch) filters.search = debouncedSearch;
      if (specialty) filters.specialty = specialty;
      if (isActive !== "all") filters.isActive = isActive;

      const res = await adminService.getAllDoctors(currentPage, limit, filters);
      if (res.success && res.data) {
        setDoctors(res.data.doctors || []);
        setTotalPages(res.data.totalPages || 1);
        setTotalDoctors(res.data.total || 0);
      } else {
        toast.error(res.message || "Failed to fetch doctors");
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error.message || "Error fetching doctors");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, specialty, isActive, limit]);

  useEffect(() => {
    fetchDoctors(page);
  }, [page, fetchDoctors]);

  const pagesToShow = useMemo(() => {
    const items: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let p = start; p <= end; p++) items.push(p);
    return items;
  }, [page, totalPages]);

  const getInitials = (name?: string) =>
    name
      ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
      : "??";

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

        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Doctors</h1>
                  <p className="text-sm text-gray-500">Manage all registered doctors ({totalDoctors})</p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                  <input
                    type="text"
                    placeholder="Search name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Specialty..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    className="w-full sm:w-40 pl-4 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm"
                  />

                  <select
                    value={isActive}
                    onChange={(e) => {
                      setIsActive(e.target.value);
                      setPage(1);
                    }}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-400 focus:outline-none text-sm bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Blocked</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">
                  Loading doctors...
                </div>
              ) : doctors.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No doctors found.
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="lg:hidden p-4 space-y-4">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className="border rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {doctor.profileImage ? (
                              <img
                                src={doctor.profileImage}
                                alt={doctor.name}
                                className="w-10 h-10 rounded-full object-cover border flex-shrink-0 aspect-square"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 aspect-square">
                                {getInitials(doctor.name)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">
                                {doctor.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {doctor.email}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              navigate(`/admin/doctors/${doctor.id}`)
                            }
                            className="w-9 h-9 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center"
                          >
                            <Eye size={16} />
                          </button>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
                          <span className="text-gray-500">Department</span>
                          <span className="text-right">
                            {doctor.specialty}
                          </span>

                          <span className="text-gray-500">Experience</span>
                          <span className="text-right">
                            {doctor.experienceYears} yrs
                          </span>

                          <span className="text-gray-500">Status</span>
                          <span
                            className={`text-right font-semibold ${doctor.isActive
                              ? "text-green-600"
                              : "text-yellow-600"
                              }`}
                          >
                            {doctor.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-gray-50 border-b text-[11px] uppercase text-gray-500 font-semibold">
                          <th className="px-4 py-4 w-[220px]">Doctor</th>
                          <th className="px-4 py-4 w-[130px]">Department</th>
                          <th className="px-4 py-4 w-[100px]">Experience</th>
                          <th className="px-4 py-4 w-[100px]">Status</th>
                          <th className="px-4 py-4 w-[110px]">Joined</th>
                          <th className="px-4 py-4 w-[70px] text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {doctors.map((doctor) => (
                          <tr
                            key={doctor.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {doctor.profileImage ? (
                                  <img
                                    src={doctor.profileImage}
                                    alt={doctor.name}
                                    className="w-9 h-9 rounded-full object-cover border flex-shrink-0 aspect-square"
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 aspect-square">
                                    {getInitials(doctor.name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 text-sm truncate">
                                    {doctor.name}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {doctor.email}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600 truncate">
                              {doctor.specialty}
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600">
                              {doctor.experienceYears} Years
                            </td>

                            <td className="px-4 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${doctor.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                                  }`}
                              >
                                {doctor.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600">
                              {new Date(
                                doctor.createdAt
                              ).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() =>
                                  navigate(`/admin/doctors/${doctor.id}`)
                                }
                                className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center hover:bg-cyan-200 transition-colors"
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
                <div className="px-4 py-4 border-t bg-gray-50 flex justify-center">
                  <div className="flex gap-2">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {pagesToShow.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-full text-sm font-semibold ${p === page
                          ? "bg-cyan-500 text-white"
                          : "border hover:bg-gray-100"
                          }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50"
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

export default DoctorsListPage;
