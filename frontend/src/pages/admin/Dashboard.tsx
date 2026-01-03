import { useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { motion, AnimatePresence } from "framer-motion";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import DepartmentDonut from "../../components/admin/DepartmentDonut";
import AppointmentCard from "../../components/admin/AppointmentCard";

const statCards = [
  { icon: "🛏️", value: 558, label: "Patients" },
  { icon: "💰", value: "₹9635", label: "Earnings" },
  { icon: "👨‍⚕️", value: 112, label: "Doctors" },
  { icon: "📅", value: 220, label: "Appointment" }
];
const appointments = [
  { name: "Calvin Carlo", date: "Booking on 19th Sep, 2023", avatar: "https://i.pravatar.cc/100?img=1" },
  { name: "Calvin Carlo", date: "Booking on 20th Nov, 2023", avatar: "https://i.pravatar.cc/100?img=2" },
  { name: "Calvin Carlo", date: "Booking on 28th Dec, 2023", avatar: "https://i.pravatar.cc/100?img=3" },
  { name: "Calvin Carlo", date: "Booking on 13th March, 2023", avatar: "https://i.pravatar.cc/100?img=4" },
  { name: "Calvin Carlo", date: "Booking on 5th May, 2023", avatar: "https://i.pravatar.cc/100?img=5" },
];

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h1>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {statCards.map(({ icon, value, label }) => (
                <StatCard key={label} icon={icon} value={value} label={label} />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <ChartCard />
              <DepartmentDonut />
            </div>

            <div className="mt-6 sm:mt-8">
              <AppointmentCard appointments={appointments} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
