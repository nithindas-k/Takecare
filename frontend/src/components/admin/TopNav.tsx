import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, User } from "lucide-react";
import authService from "../../services/authService";

const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/admin/login");
  };

  return (
    <nav className="bg-primary text-white px-6 py-4 flex items-center justify-between shadow">
      <span className="text-2xl font-bold tracking-wide">TAKECARE</span>
      <div className="flex items-center gap-3">
        {/* Notification Button */}
        <button
          className="w-9 h-9 bg-white text-primary rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLogoutMenu(!showLogoutMenu)}
            className="w-9 h-9 bg-white text-primary rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
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
        />
      )}
    </nav>
  );
};

export default TopNav;
