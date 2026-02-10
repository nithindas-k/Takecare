import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import type { DoctorRequestListItem } from "../../types/admin.types";
import { Eye, Search, ChevronDown, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

const DoctorRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<DoctorRequestListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.fetchDoctorRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        toast.error(res.message || "Failed to fetch doctor requests");
      }
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error(error.message || "Error fetching doctor requests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const matchesSearch =
        !debouncedSearch ||
        req.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        req.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        req.department.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || req.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [requests, debouncedSearch, statusFilter]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusBadgeClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  const formatStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
          <div className="w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Doctor Requests</h1>
                  <p className="text-sm text-gray-500">
                    Review and manage doctor registration requests ({filteredRequests.length})
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search name, email, dept..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10 border-gray-200 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto h-10 border-gray-200 text-gray-700 flex justify-between gap-2 px-4 font-normal hover:bg-white hover:border-cyan-400"
                      >
                        {statusFilter === "all"
                          ? "All Status"
                          : formatStatus(statusFilter)}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-44" align="end">
                      {["all", "pending", "approved", "rejected"].map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => setStatusFilter(s)}
                          className="flex justify-between items-center cursor-pointer"
                        >
                          {s === "all" ? "All Status" : formatStatus(s)}
                          {statusFilter === s && (
                            <Check className="h-4 w-4 text-cyan-600" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {loading ? (
                <div className="p-12 text-center text-gray-500">
                  Loading doctor requests...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No doctor requests found.
                </div>
              ) : (
                <>
                  {/* Mobile Cards */}
                  <div className="lg:hidden p-3 sm:p-4 space-y-3">
                    {filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        className="border border-gray-100 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {req.profileImage ? (
                              <img
                                src={req.profileImage}
                                alt={req.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0 aspect-square"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 aspect-square">
                                {getInitials(req.name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-800 text-sm truncate">
                                {req.name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate">
                                {req.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/admin/doctor-requests/${req.id}`)
                              }
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
                              req.status
                            )}`}
                          >
                            {formatStatus(req.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="text-xs text-gray-500">Department</div>
                          <div className="text-xs text-gray-800 text-right">
                            {req.department}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden lg:block overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-[10px] uppercase text-gray-500 font-semibold">
                          <th className="px-3 py-4 w-[200px]">Doctor</th>
                          <th className="px-3 py-4 w-[180px]">Email</th>
                          <th className="px-3 py-4 w-[140px]">Department</th>
                          <th className="px-3 py-4 w-[110px]">Status</th>
                          <th className="px-3 py-4 w-[80px] text-center">
                            Details
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-50">
                        {filteredRequests.map((req) => (
                          <tr
                            key={req.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-3 py-4">
                              <div className="flex items-center gap-2">
                                {req.profileImage ? (
                                  <img
                                    src={req.profileImage}
                                    alt={req.name}
                                    className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0 aspect-square"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 aspect-square">
                                    {getInitials(req.name)}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-800 text-xs truncate">
                                    {req.name}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-3 py-4 text-xs text-gray-600 truncate">
                              {req.email}
                            </td>

                            <td className="px-3 py-4 text-xs text-gray-600 truncate">
                              {req.department}
                            </td>

                            <td className="px-3 py-4">
                              <span
                                className={`px-3 py-1 rounded-full text-[10px] font-semibold ${getStatusBadgeClasses(
                                  req.status
                                )}`}
                              >
                                {formatStatus(req.status)}
                              </span>
                            </td>

                            <td className="px-3 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/admin/doctor-requests/${req.id}`)
                                  }
                                  className="w-7 h-7 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center hover:bg-cyan-200 transition-colors"
                                  title="View details"
                                >
                                  <Eye size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DoctorRequestPage;
