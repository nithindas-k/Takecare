import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import type { DoctorRequestListItem } from "../../types/admin.types";
import { X } from "lucide-react";
import { Skeleton } from "../../components/ui/skeleton";

const DoctorRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<DoctorRequestListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      const res = await adminService.fetchDoctorRequests();
      if (res.success && res.data) {
        setRequests(res.data);
      } else {
        setError(res.message || "Could not fetch requests.");
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const dummyAvatar = (name: string) => (
    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-lg text-white font-bold uppercase shadow-md">
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-2xl">
            <div className="flex justify-end p-3">
              <button onClick={() => setSidebarOpen(false)} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8">
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl py-6 md:py-8 text-center mb-6 md:mb-8 border border-cyan-100">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Requests</h1>
            </div>

            <div className="bg-white shadow-lg rounded-xl px-4 md:px-6 py-6 md:py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-gray-700">Doctor Requests</h2>
                <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>All</option>
                </select>
              </div>

              <div className="hidden lg:grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 rounded-lg font-semibold text-gray-600 text-sm mb-3">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Details</div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 flex items-center gap-3">
                          <Skeleton className="w-12 h-12 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="col-span-3"><Skeleton className="h-4 w-48" /></div>
                        <div className="col-span-2"><Skeleton className="h-6 w-24 rounded-full" /></div>
                        <div className="col-span-2"><Skeleton className="h-6 w-20 rounded-full" /></div>
                        <div className="col-span-2 flex justify-end"><Skeleton className="h-9 w-24 rounded-lg" /></div>
                      </div>
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-14 h-14 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-9 w-24 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : error ? (
                  <div className="py-10 text-center text-red-500">{error}</div>
                ) : requests.length === 0 ? (
                  <div className="py-10 text-center text-gray-400">No requests found.</div>
                ) : (
                  requests.map((req) => (
                    <div key={req.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 flex items-center gap-3">
                          {req.profileImage ? (<img src={req.profileImage} alt={req.name} className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400" />) : (dummyAvatar(req.name))}
                          <span className="font-semibold text-gray-800 truncate">{req.name}</span>
                        </div>
                        <div className="col-span-3 text-gray-700 text-sm truncate">{req.email}</div>
                        <div className="col-span-2"><span className="inline-block bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium">{req.department}</span></div>
                        <div className="col-span-2"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${req.status === "approved" ? "bg-green-100 text-green-800" : req.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></div>
                        <div className="col-span-2 flex justify-end"><button onClick={() => navigate(`/admin/doctor-requests/${req.id}`)} className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm">Details</button></div>
                      </div>
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          {req.profileImage ? (<img src={req.profileImage} alt={req.name} className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400" />) : (dummyAvatar(req.name))}
                          <div className="flex-1"><h3 className="font-semibold text-gray-800">{req.name}</h3><p className="text-sm text-gray-600">{req.email}</p></div>
                        </div>
                        <div className="flex items-center justify-between"><span className="inline-block bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium">{req.department}</span><button onClick={() => navigate(`/admin/doctor-requests/${req.id}`)} className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm">Details</button></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRequestPage;