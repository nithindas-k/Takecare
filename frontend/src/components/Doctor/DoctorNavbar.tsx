
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
    <nav className="w-full bg-[#00A1B0] shadow-md relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
        <div
          className="flex flex-col cursor-pointer group select-none transition-all duration-300 transform group-hover:scale-[1.02]"
          onClick={() => navigate("/doctor/dashboard")}
        >
          <div className="flex items-baseline leading-none">
            <span className="text-2xl font-black text-[#0f172a] tracking-tighter transition-colors duration-300">
              Take
            </span>
            <span className="text-2xl font-black text-white tracking-tighter transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              Care
            </span>
          </div>
          <span className="text-[9px] font-medium text-white/70 tracking-[0.2em] uppercase mt-0.5 ml-0.5 transition-all duration-300 group-hover:text-white group-hover:tracking-[0.22em]">
            Healthcare Platform
          </span>
        </div>

        <div className="flex items-center gap-4 relative">
          <NotificationDropdown />
          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="w-9 h-9 bg-white text-[#00A1B0] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-sm"
              title="Profile Menu"
            >
              <User size={18} />
            </button>

            {/* Dropdown Menu */}
            {showLogoutMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
      </div>
    </nav>
  );
};

export default DoctorNavbar;
