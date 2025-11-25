import React from "react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
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

const Dashboard = () => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    <div className="flex-1 flex flex-col">
      <TopNav />
      <main className="flex-1 px-8 py-6">
        {/* Header */}
        <div className="bg-primary/10 rounded-lg py-10 mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        </div>
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map(({ icon, value, label }) => (
            <StatCard icon={icon} value={value} label={label} key={label} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard />
          <DepartmentDonut />
        </div>
        <div className="mt-8">
          <AppointmentCard appointments={appointments} />
        </div>
      </main>
    </div>
  </div>
);

export default Dashboard;
