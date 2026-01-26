import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Menu, X } from "lucide-react";
import { FaCalendarCheck, FaHeart } from "react-icons/fa";
import authService from "../../services/authService";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "../../redux/store";
import { logout } from "../../redux/user/userSlice";

import NotificationDropdown from "./NotificationDropdown";

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser } = useSelector((state: RootState) => state.user);
  const isAuthenticated = !!currentUser;

  const dispatch = useDispatch();

  const handleLogout = async () => {
    await authService.logout();
    dispatch(logout());
    navigate("/patient/login");
  };

  const navLinks = [
    { label: "HOME", path: "/" },
    { label: "DOCTORS", path: "/doctors" },
    { label: "ABOUT", path: "/about" },
    { label: "CONTACT", path: "/contact" },

  ];

  return (
    <nav className="w-full bg-[#00A1B0] shadow-md relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
        <div
          className="flex flex-col cursor-pointer group select-none transition-all duration-300 transform group-hover:scale-[1.02]"
          onClick={() => navigate('/')}
        >
          <div className="flex items-baseline leading-none">
            <span className="text-2xl font-bold text-[#0f172a] tracking-tight transition-colors duration-300">
              Take
            </span>
            <span className="text-2xl font-bold text-white tracking-tight transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">
              Care
            </span>
          </div>
          <span className="text-[9px] font-medium text-white/70 tracking-[0.2em] uppercase mt-0.5 ml-0.5 transition-all duration-300 group-hover:text-white group-hover:tracking-[0.22em]">
            Healthcare Platform
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <span
              key={link.label}
              onClick={() => navigate(link.path)}
              className="text-white hover:text-[#d1fcfd] font-medium cursor-pointer"
            >
              {link.label}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/patient/login')}
                className="hidden md:block px-6 py-2 bg-white text-[#00A1B0] rounded-full font-semibold shadow hover:bg-gray-100 transition"
              >
                LOGIN
              </button>

              <span className="hidden md:inline-flex space-x-2">
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#00A1B0]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={2} />
                    <path stroke="currentColor" strokeWidth={2} d="M4 20c0-3.3137 3.134-6 7-6s7 2.6863 7 6" />
                  </svg>
                </span>
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#00A1B0]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path stroke="currentColor" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  </svg>
                </span>
              </span>

              {/* Mobile Menu Toggle (Unauthenticated) */}
              <button
                className="md:hidden text-white p-1"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          ) : (
            <>
              <NotificationDropdown />

              <div className="relative">
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="w-9 h-9 bg-white text-[#00A1B0] rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  title="Profile Menu"
                >
                  <User size={18} />
                </button>

                {showLogoutMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false);
                        navigate("/patient/dashboard");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-[#00A1B0]/10 hover:text-[#00A1B0] flex items-center gap-2 transition-colors"
                    >
                      <FaCalendarCheck size={18} />
                      <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false);
                        navigate("/patient/profile-settings");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-[#00A1B0]/10 hover:text-[#00A1B0] flex items-center gap-2 transition-colors"
                    >
                      <User size={18} />
                      <span className="font-medium">Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false);
                        navigate("/patient/favorites");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-[#00A1B0]/10 hover:text-[#00A1B0] flex items-center gap-2 transition-colors"
                    >
                      <FaHeart size={18} className="text-red-500" />
                      <span className="font-medium">Favorites</span>
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

              {/* Mobile Menu Toggle (Authenticated) */}
              <button
                className="md:hidden text-white p-1 ml-2"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              {showLogoutMenu && (
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowLogoutMenu(false)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`absolute top-full left-0 w-full bg-[#00A1B0] border-t border-[#008f9c] shadow-lg z-40 px-4 flex flex-col space-y-4 md:hidden transition-all duration-300 ease-in-out origin-top overflow-hidden ${isMobileMenuOpen
          ? "max-h-[400px] opacity-100 py-6 translate-y-0"
          : "max-h-0 opacity-0 py-0 -translate-y-4 pointer-events-none"
          }`}
      >
        {navLinks.map((link) => (
          <span
            key={link.label}
            onClick={() => {
              navigate(link.path);
              setIsMobileMenuOpen(false);
            }}
            className="text-white hover:text-[#d1fcfd] font-medium cursor-pointer text-lg border-b border-white/10 pb-2 transition-colors"
          >
            {link.label}
          </span>
        ))}

        {!isAuthenticated && (
          <button
            onClick={() => {
              navigate('/patient/login');
              setIsMobileMenuOpen(false);
            }}
            className="w-full px-6 py-3 bg-white text-[#00A1B0] rounded-xl font-bold shadow-lg hover:bg-gray-100 transition text-center"
          >
            LOGIN
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
