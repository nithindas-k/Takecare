import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import authService from "../../services/authService";

interface TopNavProps {
  onMenuClick?: () => void;
}

import NotificationDropdown from "../common/NotificationDropdown";

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/admin/login");
  };

  return (
    <nav className="bg-[#00A1B0] text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <img src="/doctor.png" alt="Takecare Logo" className="h-7 w-auto" />
          <span className="text-xl sm:text-2xl font-bold tracking-wide">TAKECARE</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Notification Button */}
        <NotificationDropdown />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 bg-white text-[#00A1B0] rounded-full flex items-center justify-center hover:bg-white/90 transition-colors"
            title="Profile Menu"
          >
            <User size={18} />
          </button>

          {/* Dropdown Menu */}
          {showLogoutMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
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
      </div>

      {/* Click outside to close dropdown */}
      {showLogoutMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowLogoutMenu(false)}
        >
          {/* Empty div to fix JSX structure */}
        </div>
      )}
    </nav>
  );
};

export default TopNav;
