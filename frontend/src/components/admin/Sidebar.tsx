import React from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart2,
  Zap,
  Stethoscope,
  Users,
  Calendar,
  Grid,
  DollarSign,
  Mail,
  LogOut,
  Activity,
  X,
  Star
} from "lucide-react";
import authService from "../../services/authService";
import { toast } from "sonner";

interface SidebarProps {
  onMobileClose?: () => void;
}

const sidebarItems = [
  { label: "Dashboard", icon: BarChart2, path: "/admin/dashboard" },
  { label: "Doctor Request", icon: Zap, path: "/admin/doctor-request", hasNotification: true },
  { label: "Doctors", icon: Stethoscope, path: "/admin/doctors" },
  { label: "Patients", icon: Users, path: "/admin/patients" },
  { label: "Appointments", icon: Calendar, path: "/admin/appointments" },
  { label: "Speciality", icon: Grid, path: "/admin/speciality" },
  { label: "Earnings", icon: DollarSign, path: "/admin/earnings" },
  { label: "Reviews", icon: Star, path: "/admin/reviews" },
  { label: "Messages", icon: Mail, path: "/admin/messages" },
  // { label: "Profile Settings", icon: Settings, path: "/admin/profile-settings" },
  // { label: "Change Password", icon: Lock, path: "/admin/change-password" },
];

const Sidebar: React.FC<SidebarProps> = ({ onMobileClose }) => {
  const handleLogout = async () => {
    try {
      await authService.logout();
      toast.success("Logged out successfully");
      window.location.href = "/admin/login";
    } catch {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand Section */}
      <div className="p-6 flex items-center justify-between border-b border-slate-50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-[#00A1B0]/10 rounded-xl flex items-center justify-center text-[#00A1B0]">
            <Activity size={20} className="stroke-[2.5]" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            TakeCare
          </h1>
        </div>
        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-900"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto no-scrollbar" data-lenis-prevent>
        <div className="px-3 space-y-1">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              onClick={onMobileClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-[#00A1B0]/10 text-[#00A1B0] font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
              `}
            >
              <item.icon
                size={20}
                className={`transition-colors ${item.hasNotification && !window.location.pathname.includes(item.path) ? 'text-yellow-500' : ''}`}
              />
              <span className="text-sm">{item.label}</span>
              {item.hasNotification && (
                <span className="ml-auto w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse"></span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Logout at Bottom */}
      <div className="p-4 border-t border-slate-50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
