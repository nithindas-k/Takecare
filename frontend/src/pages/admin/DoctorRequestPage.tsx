import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import type { DoctorRequestListItem } from "../../types/admin.types";

const DoctorRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<DoctorRequestListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
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
        .map(s => s[0])
        .join("")
        .slice(0, 2)}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 md:px-8 py-6 md:py-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-cyan-50 to-teal-50 rounded-xl py-6 md:py-8 text-center mb-6 md:mb-8 border border-cyan-100">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Requests</h1>
            </div>

            {/* Main Content Card */}
            <div className="bg-white shadow-lg rounded-xl px-4 md:px-6 py-6 md:py-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
                <h2 className="text-lg md:text-xl font-semibold text-gray-700">Doctor Requests</h2>
                <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>All</option>
                </select>
              </div>

              {/* Desktop Table Header - Hidden on mobile */}
              <div className="hidden lg:grid grid-cols-12 gap-4 py-3 px-4 bg-gray-50 rounded-lg font-semibold text-gray-600 text-sm mb-3">
                <div className="col-span-3">Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Department</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Details</div>
              </div>

              {/* Requests List */}
              <div className="space-y-3">
                {loading && <div className="py-10 text-center text-gray-400">Loading...</div>}
                {error && <div className="py-10 text-center text-red-500">{error}</div>}
                {!loading && requests.length === 0 && (
                  <div className="py-10 text-center text-gray-400">No requests found.</div>
                )}
                {!loading &&
                  requests.map(req => (
                    <div
                      className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                      key={req.id}
                    >
                      {/* Desktop Layout */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-3 flex items-center gap-3">
                          {req.profileImage ? (
                            <img
                              src={req.profileImage}
                              alt={req.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-cyan-400"
                              onError={e => ((e.target as HTMLImageElement).style.display = "none")}
                            />
                          ) : (
                            dummyAvatar(req.name)
                          )}
                          <span className="font-semibold text-gray-800 truncate">{req.name}</span>
                        </div>
                        <div className="col-span-3 text-gray-700 text-sm truncate">{req.email}</div>
                        <div className="col-span-2">
                          <span className="inline-block bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium">
                            {req.department}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                              req.status === 'rejected' ? 'bg-red-100 text-red-800 cursor-help' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            title={req.status === 'rejected' && req.rejectionReason ? `Reason: ${req.rejectionReason}` : ''}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                            onClick={() => navigate(`/admin/doctor-requests/${req.id}`)}
                          >
                            Details
                          </button>
                        </div>
                      </div>

                      {/* Mobile/Tablet Layout */}
                      <div className="lg:hidden space-y-3">
                        <div className="flex items-center gap-3">
                          {req.profileImage ? (
                            <img
                              src={req.profileImage}
                              alt={req.name}
                              className="w-14 h-14 rounded-full object-cover border-2 border-cyan-400"
                              onError={e => ((e.target as HTMLImageElement).style.display = "none")}
                            />
                          ) : (
                            dummyAvatar(req.name)
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 text-base">{req.name}</h3>
                            <p className="text-sm text-gray-600">{req.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="inline-block bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-sm font-medium">
                            {req.department}
                          </span>
                          <button
                            className="bg-gradient-to-r from-cyan-400 to-teal-500 text-white px-5 py-2 rounded-lg hover:shadow-lg transition-all font-medium text-sm"
                            onClick={() => navigate(`/admin/doctor-requests/${req.id}`)}
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorRequestPage;
