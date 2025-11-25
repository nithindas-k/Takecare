// src/components/Doctor/DoctorSidebar.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaRegCalendarCheck,
  FaMoneyBillWave,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaUserMd,
  FaClock,
} from "react-icons/fa";

interface SidebarLink {
  label: string;
  icon?: React.ReactNode;
  path: string;
  badge?: "notification" | "dot";
}

const sidebarLinks: SidebarLink[] = [
  { label: "Dashboard", icon: <FaRegCalendarCheck />, path: "/doctor/dashboard" },
  { label: "Requests", path: "/doctor/requests", badge: "notification" },
  { label: "Appointments", path: "/doctor/appointments" },
  { label: "Available Timings", icon: <FaClock />, path: "/doctor/timings" },
  { label: "My Patients", icon: <FaUserMd />, path: "/doctor/patients" },
  { label: "Specialties & Services", path: "/doctor/services" },
  { label: "Reviews", path: "/doctor/reviews" },
  { label: "Accounts", path: "/doctor/accounts" },
  { label: "Invoices", path: "/doctor/invoices" },
  { label: "Payout Settings", icon: <FaMoneyBillWave />, path: "/doctor/payout" },
  { label: "Message", icon: <FaComments />, path: "/doctor/messages", badge: "dot" },
  { label: "Profile Settings", icon: <FaCog />, path: "/doctor/profile" },
  { label: "Social Media", path: "/doctor/social" },
  { label: "Change Password", path: "/doctor/change-password" },
];

const DoctorSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("doctor");
    navigate("/doctor/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="col-span-4 xl:col-span-3 bg-white rounded-3xl shadow p-6 flex flex-col gap-1 h-fit min-w-[265px] max-w-xs sticky top-4">
      <ul className="space-y-1">
        {sidebarLinks.map((link) => (
          <li
            key={link.label}
            onClick={() => navigate(link.path)}
            className={`group flex items-center px-4 py-3 rounded-xl gap-3 cursor-pointer transition font-medium ${
              isActive(link.path)
                ? "bg-teal-500 text-white font-bold"
                : "text-gray-700 hover:bg-teal-100"
            }`}
          >
            {link.icon && (
              <span
                className={`text-lg ${
                  isActive(link.path) ? "text-white" : "text-teal-500 group-hover:text-teal-600"
                }`}
              >
                {link.icon}
              </span>
            )}
            <span className="truncate">{link.label}</span>
            {link.badge === "notification" && (
              <span className="ml-auto flex h-3 w-3">
                <span className="animate-ping absolute h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </span>
            )}
            {link.badge === "dot" && (
              <span className="ml-auto flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
              </span>
            )}
          </li>
        ))}
        
        {/* Logout */}
        <li
          onClick={handleLogout}
          className="group flex items-center px-4 py-3 rounded-xl text-gray-700 gap-3 hover:bg-red-100 hover:text-red-600 cursor-pointer transition font-medium"
        >
          <span className="text-lg text-red-500 group-hover:text-red-600">
            <FaSignOutAlt />
          </span>
          <span className="truncate">Logout</span>
        </li>
      </ul>
    </aside>
  );
};

export default DoctorSidebar;
