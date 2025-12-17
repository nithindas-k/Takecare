import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import doctorService from "../../services/doctorService";
import Button from "../../components/Button";

import {
  FaUserInjured,
  FaCalendarCheck,
  FaVideo,
  FaComments,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
  FaTimes,
  FaEye,
  FaBell,
  FaStar,
  FaMoneyBillWave,
} from "react-icons/fa";

interface DoctorProfile {
  name: string;
  email: string;
  specialty?: string;
  qualifications: string[];
  profileImage?: string;
  verificationStatus: string;
  rejectionReason?: string;
}

// Mock data for dashboard
const mockAppointments = [
  { id: "Apt0001", name: "Adrian Marshall", date: "11 Nov 2024 10:45 AM", type: "General", avatar: "AM" },
  { id: "Apt0002", name: "Kelly Stevens", date: "10 Nov 2024 11:00 AM", type: "Clinic Consulting", avatar: "KS" },
  { id: "Apt0003", name: "Samuel Anderson", date: "03 Nov 2024 02:00 PM", type: "General", avatar: "SA" },
  { id: "Apt0004", name: "Catherine Griffin", date: "01 Nov 2024 04:00 PM", type: "Clinic Consulting", avatar: "CG" },
  { id: "Apt0005", name: "Robert Hutchinson", date: "28 Oct 2024 05:30 PM", type: "General", avatar: "RH" },
];

const mockInvoices = [
  { id: "Apt0001", name: "Adrian", amount: 450, date: "11 Nov 2024", avatar: "A" },
  { id: "Apt0002", name: "Kelly", amount: 500, date: "10 Nov 2024", avatar: "K" },
  { id: "Apt0003", name: "Samuel", amount: 320, date: "03 Nov 2024", avatar: "S" },
  { id: "Apt0004", name: "Catherine", amount: 240, date: "01 Nov 2024", avatar: "C" },
];

const mockNotifications = [
  { icon: <FaBell />, message: "Booking Confirmed on 21 Mar 2024 10:30 AM", time: "Just Now", color: "bg-purple-500" },
  { icon: <FaStar />, message: "You have a New Review for your Appointment", time: "5 Days ago", color: "bg-blue-500" },
  { icon: <FaCalendarCheck />, message: "You have Appointment with Ahmed by 01:20 PM", time: "12:55 PM", color: "bg-red-500" },
  { icon: <FaMoneyBillWave />, message: "Sent an amount of $200 for an Appointment", time: "2 Days ago", color: "bg-yellow-500" },
];

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const response = await doctorService.getDoctorProfile();
        if (response.success && response.data) {
          setProfile(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleReVerify = () => {
    navigate("/doctor/verification");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A1B0]"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [{ label: 'Dashboard' }];

  // Pending Verification State
  if (profile?.verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <Breadcrumbs
          items={breadcrumbItems}
          title="Dashboard"
          subtitle="Welcome to your dashboard"
        />
        <DoctorLayout>
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
              <div className="mb-6 w-20 h-20 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Verification Pending</h2>
              <p className="text-gray-600 mb-6">
                Your account verification is in process. Please wait for admin approval. This usually takes 24-48 hours.
              </p>

            </div>
          </div>
        </DoctorLayout>
      </div>
    );
  }

  // Rejected Verification State  
  if (profile?.verificationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <Breadcrumbs
          items={breadcrumbItems}
          title="Dashboard"
          subtitle="Welcome to your dashboard"
        />
        <DoctorLayout>
          <div className="flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-auto">
              <div className="mb-6 w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Rejected</h2>
              <p className="text-gray-600 mb-4">
                Your verification request has been rejected by the admin.
              </p>
              {profile.rejectionReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                  <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
                  <p className="text-sm text-red-700">{profile.rejectionReason}</p>
                </div>
              )}
              <Button onClick={handleReVerify} className="w-full py-3">
                Re-Submit Verification
              </Button>
            </div>
          </div>
        </DoctorLayout>
      </div>
    );
  }

  // Approved - Full Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />

      <Breadcrumbs
        items={breadcrumbItems}
        title="Dashboard"
        subtitle="Welcome to your dashboard"
      />
      <DoctorLayout>
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Patients Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Patient</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">978</h3>
                <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                  <FaArrowUp className="w-3 h-3" />
                  15% From Last Week
                </p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <FaUserInjured className="w-7 h-7 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Patients Today Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Patients Today</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">80</h3>
                <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                  <FaArrowDown className="w-3 h-3" />
                  15% From Yesterday
                </p>
              </div>
              <div className="w-14 h-14 bg-[#00A1B0]/10 rounded-xl flex items-center justify-center">
                <FaUserInjured className="w-7 h-7 text-[#00A1B0]" />
              </div>
            </div>
          </div>

          {/* Appointments Today Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Appointments Today</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-1">50</h3>
                <p className="text-green-500 text-sm mt-2 flex items-center gap-1">
                  <FaArrowUp className="w-3 h-3" />
                  20% From Yesterday
                </p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <FaCalendarCheck className="w-7 h-7 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Appointment</h3>
            <select className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00A1B0]">
              <option>Last 7 Days</option>
              <option>Today</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {mockAppointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00A1B0]/80 to-[#00A1B0] flex items-center justify-center text-white font-semibold text-sm">
                          {apt.avatar}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">#{apt.id}</p>
                          <p className="font-medium text-gray-800">{apt.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-800">{apt.date}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                        {apt.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors flex items-center justify-center">
                          <FaCheck className="w-3 h-3" />
                        </button>
                        <button className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors flex items-center justify-center">
                          <FaTimes className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="bg-gradient-to-r from-[#00A1B0]/80 to-[#00A1B0] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>

          <h3 className="text-lg font-semibold mb-4 relative z-10">Upcoming Appointment</h3>
          <div className="flex items-center gap-4 mb-4 relative z-10">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
              AM
            </div>
            <div className="flex-1">
              <p className="text-white/70 text-sm">#Apt0001</p>
              <h4 className="font-semibold text-lg">Adrian Marshall</h4>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-sm">General visit</p>
              <p className="font-semibold">Today, 10:45 AM</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-white/20 relative z-10">
            <div className="flex items-center gap-2">
              <FaVideo className="w-4 h-4" />
              <span className="text-sm">Video Appointment</span>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                <FaComments className="inline mr-2" />
                Chat Now
              </button>
              <button className="px-4 py-2 bg-white text-[#00A1B0] hover:bg-white/90 rounded-lg text-sm font-medium transition-colors">
                Start Appointment
              </button>
            </div>
          </div>
        </div>

        {/* Recent Invoices & Notifications Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Recent Invoices</h3>
              <button
                type="button"
                onClick={() => navigate("/doctor/invoices")}
                className="text-sm text-[#00A1B0] hover:text-[#00A1B0]"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {mockInvoices.map((invoice) => (
                <div key={invoice.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                    {invoice.avatar}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{invoice.name}</p>
                    <p className="text-xs text-gray-400">#{invoice.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">${invoice.amount}</p>
                    <p className="text-xs text-gray-400">{invoice.date}</p>
                  </div>
                  <button className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-[#00A1B0]/10 hover:text-[#00A1B0] transition-colors flex items-center justify-center">
                    <FaEye className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <button
                type="button"
                className="text-sm text-[#00A1B0] hover:text-[#00A1B0]"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {mockNotifications.map((notif, idx) => (
                <div key={idx} className="px-6 py-4 flex items-start gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full ${notif.color} flex items-center justify-center text-white`}>
                    {notif.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">{notif.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DoctorLayout>
    </div>
  );
};

export default DoctorDashboard;