import { useState } from "react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { X } from "lucide-react";
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
    <div className="flex min-h-screen bg-gray-50">
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
          <div className="absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white shadow-2xl">
            <div className="flex justify-end p-3">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center hover:bg-gray-200 transition-colors"
                title="Close"
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
