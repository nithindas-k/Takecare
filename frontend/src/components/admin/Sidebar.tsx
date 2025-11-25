import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Zap,
  Stethoscope,
  Users,
  Calendar,
  Hospital,
  DollarSign,
  Settings,
  Lock,
  LogOut,
  UserCircle
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Doctor Request", icon: Zap, path: "/admin/doctor-request", hasNotification: true },
  { label: "Doctors", icon: Stethoscope, path: "/admin/doctors" },
  { label: "Patients", icon: Users, path: "/admin/patients" },
  { label: "Appointments", icon: Calendar, path: "/admin/appointments" },
  { label: "Speciality", icon: Hospital, path: "/admin/speciality" },
  { label: "Earnings", icon: DollarSign, path: "/admin/earnings" },
  { label: "Profile Settings", icon: Settings, path: "/admin/profile-settings" },
  { label: "Change Password", icon: Lock, path: "/admin/change-password" },
  { label: "Logout", icon: LogOut, path: "/admin/logout" },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 min-h-screen bg-white flex flex-col shadow-xl border-r border-gray-200">
      {/* Profile Section */}
      <div className="text-center py-8 px-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shadow-lg">
            <UserCircle className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="font-bold text-lg text-gray-800 tracking-wide">ADMIN</h2>
        <span className="text-xs text-gray-500">* Takecare</span>
      </div>

      {/* Menu Items - Scrollable */}
      <nav className="flex-1 pt-6 px-4 space-y-1.5 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 relative group
                ${isActive
                  ? "bg-gradient-to-r from-cyan-400 to-teal-500 text-white shadow-md shadow-cyan-500/20"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`
              }
              end
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={2} />
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.hasNotification && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full shadow-lg shadow-yellow-400/50 animate-pulse"></span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
