import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import { ChevronLeft, ChevronRight, Eye, Search, Check, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

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
  const [search, setSearch] = useState("");
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

  const fetchPatients = useCallback(async (currentPage: number) => {
    setLoading(true);
    try {
      const filters: { search?: string; isActive?: string } = {};
      if (debouncedSearch) filters.search = debouncedSearch;
      if (isActive !== "all") filters.isActive = isActive;

      const res = await adminService.getAllPatients(currentPage, limit, filters);
      if (res?.success && res?.data) {
        setPatients(res.data.patients || []);
        setTotalPages(res.data.totalPages || 1);
      } else {
        toast.error(res?.message || "Failed to fetch patients");
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error?.message || "Error fetching patients");
    }
    setLoading(false);
  }, [debouncedSearch, isActive, limit]);

  useEffect(() => {
    fetchPatients(page);
  }, [page, fetchPatients]);

  const pagesToShow = useMemo(() => {
    const pages: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [page, totalPages]);

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

        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">

            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
                  <p className="text-sm text-gray-500">Manage all registered patients</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search name, email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400 transition-all"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full sm:w-auto h-10 border-gray-200 text-gray-700 flex justify-between gap-2 px-4 font-normal hover:bg-white hover:border-cyan-400 transition-all">
                        {isActive === "all" ? "All Status" : isActive === "true" ? "Active" : "Blocked"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40" align="end">
                      {[
                        { label: "All Status", value: "all" },
                        { label: "Active", value: "true" },
                        { label: "Blocked", value: "false" }
                      ].map((item) => (
                        <DropdownMenuItem
                          key={item.value}
                          onClick={() => { setIsActive(item.value); setPage(1); }}
                          className="flex justify-between items-center cursor-pointer"
                        >
                          {item.label}
                          {isActive === item.value && <Check className="h-4 w-4 text-cyan-600" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
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
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="border border-gray-100 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {patient.profileImage ? (
                              <img
                                src={patient.profileImage}
                                className="w-10 h-10 rounded-full object-cover border flex-shrink-0 aspect-square"
                                alt={patient.name}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 aspect-square">
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
                            className={`text-right font-semibold ${patient.isActive
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
                  <div className="hidden lg:block overflow-x-auto no-scrollbar">
                    <table className="w-full text-left table-fixed">
                      <thead className="bg-gray-50 border-b">
                        <tr className="text-[11px] uppercase text-gray-500 font-semibold">
                          <th className="px-4 py-4 w-[250px]">Patient</th>
                          <th className="px-4 py-4 w-[120px]">Phone</th>
                          <th className="px-4 py-4 w-[100px]">Gender</th>
                          <th className="px-4 py-4 w-[120px]">Status</th>
                          <th className="px-4 py-4 w-[80px] text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {patients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                {patient.profileImage ? (
                                  <img
                                    src={patient.profileImage}
                                    className="w-9 h-9 rounded-full object-cover border flex-shrink-0 aspect-square"
                                    alt={patient.name}
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 aspect-square">
                                    {getInitials(patient.name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 text-sm truncate">{patient.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{patient.email}</p>
                                </div>
                              </div>
                            </td>

                            <td className="px-4 py-4 text-sm text-gray-600">
                              {patient.phone}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-600 capitalize">
                              {patient.gender}
                            </td>
                            <td className="px-4 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${patient.isActive
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                                  }`}
                              >
                                {patient.isActive ? "Active" : "Blocked"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <button
                                onClick={() => navigate(`/admin/patients/${patient.id}`)}
                                className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 inline-flex items-center justify-center hover:bg-cyan-200 transition-colors"
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
                      className={`w-8 h-8 rounded-full text-sm font-semibold ${p === page
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
