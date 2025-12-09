import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Bell } from "lucide-react";
import authService from "../../services/authService";

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutMenu, setShowLogoutMenu] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    navigate("/patient/login");
  };

  return (
    <nav className="w-full bg-teal-600 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between py-3 px-4">
        <div className="flex items-center space-x-2">
          <img src="/logo-takecare.png" alt="TakeCare Logo" className="h-7 w-auto mr-2" />
          <span className="text-white font-extrabold text-xl tracking-wide">TAKECARE</span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="/" className="text-white hover:text-teal-200 font-medium">HOME</a>
          <a href="/doctors" className="text-white hover:text-teal-200 font-medium">DOCTORS</a>
          <a href="/about" className="text-white hover:text-teal-200 font-medium">ABOUT</a>
          <a href="/contact" className="text-white hover:text-teal-200 font-medium">CONTACT</a>
          <a href="/blogs" className="text-white hover:text-teal-200 font-medium">BLOGS</a>
        </div>

        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <>

              <a
                href="/login"
                className="px-6 py-2 bg-white text-teal-600 rounded-full font-semibold shadow hover:bg-teal-50 transition"
              >
                LOGIN
              </a>

              <span className="inline-flex space-x-2">
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={2} />
                    <path stroke="currentColor" strokeWidth={2} d="M4 20c0-3.3137 3.134-6 7-6s7 2.6863 7 6" />
                  </svg>
                </span>
                <span className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-teal-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeWidth={2} d="M13.73 21a2 2 0 0 1-3.46 0" />
                    <path stroke="currentColor" strokeWidth={2} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  </svg>
                </span>
              </span>
            </>
          ) : (
            <>

              <button
                className="w-9 h-9 bg-white text-teal-600 rounded-full flex items-center justify-center hover:bg-teal-50 transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
              </button>


              <div className="relative">
                <button
                  onClick={() => setShowLogoutMenu(!showLogoutMenu)}
                  className="w-9 h-9 bg-white text-teal-600 rounded-full flex items-center justify-center hover:bg-teal-50 transition-colors"
                  title="Profile Menu"
                >
                  <User size={18} />
                </button>


                {showLogoutMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        setShowLogoutMenu(false);
                        navigate("/patient/profile");
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-teal-50 hover:text-teal-600 flex items-center gap-2 transition-colors"
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
    </nav>
  );
};

export default NavBar;
