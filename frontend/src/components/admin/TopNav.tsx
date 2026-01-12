import React, { useState } from "react";
import { LogOut, User, Menu } from "lucide-react";
import authService from "../../services/authService";
import NotificationDropdown from "../common/NotificationDropdown";

interface TopNavProps {
  onMenuClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ onMenuClick }) => {
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    window.location.href = "/admin/login";
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden w-10 h-10 rounded-lg text-slate-500 hover:bg-slate-50 flex items-center justify-center transition-colors"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>


      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notification */}
        <div className="relative">
          <NotificationDropdown color="text-[#000000]" />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100 ml-2">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold text-slate-900 leading-none">Admin</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1 text-right">Super Admin</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowLogoutMenu(!showLogoutMenu)}
              className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-100 hover:text-[#00A1B0] transition-all"
            >
              <User size={18} />
            </button>

            {showLogoutMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLogoutMenu(false)} />
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Account Details</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors font-semibold text-sm"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;
