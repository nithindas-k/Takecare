import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  FaUserInjured,
  FaCalendarCheck,
  FaVideo,
  FaComments,
  FaArrowUp,
  FaMoneyBillWave
} from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import doctorService from "../../services/doctorService";
import { walletService } from "../../services/walletService";
import { Button } from "../../components/ui/button";
import { DatePickerWithRange } from "../../components/ui/date-range-picker";

interface DoctorProfile {
  name: string;
  email: string;
  verificationStatus: string;
  rejectionReason?: string;
}

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    async function fetchData() {
      // Don't set loading true on every date change to avoid flicker, or do if preferred.
      // setLoading(true); 
      try {
        const startDate = dateRange?.from?.toISOString();
        const endDate = dateRange?.to?.toISOString();

        const [profileRes, statsRes, walletRes] = await Promise.all([
          doctorService.getDoctorProfile(),
          doctorService.getDashboardStats(startDate, endDate),
          walletService.getMyWallet(1, 1)
        ]);

        console.log("DoctorDashboard statsRes:", statsRes);
        console.log("DoctorDashboard walletRes:", walletRes);
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (statsRes && statsRes.success && statsRes.data) {
          console.log("Setting stats to:", statsRes.data);
          setStats(statsRes.data);
        }
        if (walletRes && walletRes.success && walletRes.data) {
          setWalletBalance(walletRes.data.balance);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [dateRange]);

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

  if (profile?.verificationStatus === "pending") {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <Breadcrumbs items={breadcrumbItems} title="Dashboard" subtitle="Welcome to your dashboard" />
        <DoctorLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-yellow-600">Verification Pending</h2>
              <p className="text-gray-600">Your profile is under review. Please check back later.</p>
            </div>
          </div>
        </DoctorLayout>
      </div>
    )
  }

  if (profile?.verificationStatus === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50">
        <DoctorNavbar />
        <Breadcrumbs items={breadcrumbItems} title="Dashboard" subtitle="Welcome to your dashboard" />
        <DoctorLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
              <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Rejected</h2>
              <p className="text-gray-600 mb-4">{profile.rejectionReason}</p>
              <Button onClick={handleReVerify}>Re-submit Verification</Button>
            </div>
          </div>
        </DoctorLayout>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
      <Breadcrumbs items={breadcrumbItems} title="Dashboard" subtitle={`Welcome back, Dr. ${profile?.name || ''}`} />
      <DoctorLayout>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Patients</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalPatients || 0}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl text-blue-600"><FaUserInjured size={24} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-500">
              <FaArrowUp className="mr-1" />
              <span>Lifetime Count</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Appointments Today</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">{stats?.appointmentsToday || 0}</h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl text-purple-600"><FaCalendarCheck size={24} /></div>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              Scheduled for today
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Available Balance</p>
                <h3 className="text-3xl font-bold text-gray-800 mt-2">₹{walletBalance.toLocaleString()}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-xl text-green-600"><FaMoneyBillWave size={24} /></div>
            </div>
            <div className="mt-4 flex items-center text-sm text-green-500">
              <FaArrowUp className="mr-1" />
              <span>Net Income</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="text-lg font-bold text-gray-800">Earnings Overview</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={!dateRange ? "default" : "outline"}
                    onClick={() => setDateRange(undefined)}
                    className="text-xs h-8"
                  >
                    Overall
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDateRange({ from: startOfDay(new Date()), to: endOfDay(new Date()) })}
                    className="text-xs h-8"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDateRange({ from: startOfWeek(new Date()), to: endOfWeek(new Date()) })}
                    className="text-xs h-8"
                  >
                    This Week
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}
                    className="text-xs h-8"
                  >
                    This Month
                  </Button>
                </div>
                <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-auto" />
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.revenueGraph || []}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#00A1B0" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming Appointment Widget */}
          <div>
            {stats?.nextAppointment ? (
              <div className="bg-gradient-to-br from-[#00A1B0] to-teal-600 rounded-2xl p-6 text-white h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-4">Up Next</h3>
                  <div className="flex items-center gap-4 mb-6">
                    <img
                      src={stats.nextAppointment.patientId?.profileImage || "https://i.pravatar.cc/150"}
                      alt="Patient"
                      className="w-16 h-16 rounded-full border-2 border-white/30"
                    />
                    <div>
                      <p className="font-semibold text-xl">{stats.nextAppointment.patientId?.name}</p>
                      <p className="text-white/80 text-sm">#{stats.nextAppointment.customId}</p>
                    </div>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4 mb-6">
                    <div className="flex justify-between mb-2">
                      <span className="text-white/80 text-sm">Time</span>
                      <span className="font-medium">{stats.nextAppointment.appointmentTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/80 text-sm">Date</span>
                      <span className="font-medium">{new Date(stats.nextAppointment.appointmentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => navigate(`/doctor/consultation/video/${stats.nextAppointment.customId}`)} className="flex-1 bg-white text-teal-600 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                      <FaVideo /> Join Call
                    </button>
                    <button onClick={() => navigate(`/doctor/consultation/chat/${stats.nextAppointment.customId}`)} className="flex-1 bg-white/20 text-white py-2.5 rounded-lg font-medium hover:bg-white/30 transition-colors flex items-center justify-center gap-2">
                      <FaComments /> Chat
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm p-6 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <FaCalendarCheck className="text-gray-400 text-2xl" />
                </div>
                <h3 className="font-bold text-gray-800">No Upcoming Appointments</h3>
                <p className="text-gray-500 text-sm mt-2">You don't have any pending appointments scheduled for today.</p>
              </div>
            )}
          </div>
        </div>


      </DoctorLayout>
    </div>
  );
};

export default DoctorDashboard;
