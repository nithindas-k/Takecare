
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import { LogOut, User } from "lucide-react";
import authService from "../../services/authService";

import NotificationDropdown from "../common/NotificationDropdown";

const DoctorNavbar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/doctor/login");
  };

  return (
    <nav className="w-full bg-[#00A1B0] shadow-md flex items-center px-6 py-3 justify-between">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => navigate("/doctor/dashboard")}
      >
        <img src="/doctor.png" alt="Takecare Logo" className="h-7 w-auto" />
        <span className="text-white font-extrabold text-xl tracking-wide">TAKECARE</span>
      </div>

      <div className="flex items-center gap-4 relative">
        <NotificationDropdown />
        <div className="relative">
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="cursor-pointer transition"
            title="Profile Menu"
          >
            <FaUserCircle className="w-10 h-10 text-white transition" />
          </button>

          {/* Dropdown Menu */}
          {showLogoutMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => {
                  setShowLogoutMenu(false);
                  navigate("/doctor/profile");
                }}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-[#00A1B0]/10 hover:text-[#00A1B0] flex items-center gap-2 transition-colors"
              >
                <User size={18} />
                <span className="font-medium">Profile</span>
              </button>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2 transition-colors"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>

        {/* Click outside to close dropdown */}
        {showLogoutMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowLogoutMenu(false)}
          />
        )}
      </div>
    </nav>
  );
};

export default DoctorNavbar;
