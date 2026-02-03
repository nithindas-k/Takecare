
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FaRegCalendarCheck,
  FaMoneyBillWave,
  FaComments,
  FaCog,
  FaSignOutAlt,
  FaClock,
  FaCheckCircle,
  FaTimes,
  FaLock,
} from "react-icons/fa";

import type { AppDispatch } from "../../redux/store";
import {
  logout,
  selectCurrentUser,
} from "../../redux/user/userSlice";
import authService from "../../services/authService";
import { API_BASE_URL } from "../../utils/constants";

interface SidebarLink {
  label: string;
  icon?: React.ReactNode;
  path: string;
  badge?: "notification" | "dot";
}

const sidebarLinks: SidebarLink[] = [
  { label: "Dashboard", icon: <FaRegCalendarCheck />, path: "/doctor/dashboard" },
  { label: "Appointment Requests", icon: <FaClock />, path: "/doctor/appointment-requests" },
  { label: "Appointments", icon: <FaRegCalendarCheck />, path: "/doctor/appointments" },
  { label: "Available Timings", icon: <FaClock />, path: "/doctor/schedule" },
  // { label: "My Patients", icon: <FaUserMd />, path: "/doctor/patients" },
  { label: "Wallet", icon: <FaMoneyBillWave />, path: "/doctor/wallet" },
  { label: "Profile Settings", icon: <FaCog />, path: "/doctor/profile-settings" },
  { label: "Reviews", icon: <FaCheckCircle />, path: "/doctor/reviews" },
  { label: "Messages", icon: <FaComments />, path: "/doctor/chat/default", badge: "dot" },
  { label: "Change Password", icon: <FaLock />, path: "/doctor/change-password" },
];

interface DoctorSidebarProps {
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
}

const DoctorSidebar: React.FC<DoctorSidebarProps> = ({
  isMobileMenuOpen = false,
  onMobileMenuClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();

  const doctor = useSelector(selectCurrentUser);

  const handleLogout = async () => {
    try {
      await authService.logout();
      dispatch(logout());
      navigate("/doctor/login");
      if (onMobileMenuClose) onMobileMenuClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) {
      return "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    }
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_BASE_URL}/${imagePath.replace(/\\/g, "/")}`;
  };

  const isActive = (path: string) => location.pathname === path;

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onMobileMenuClose) onMobileMenuClose();
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="relative bg-[#00A1B0] h-28 w-full">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

        {/* Mobile Close Button */}
        {onMobileMenuClose && (
          <button
            onClick={onMobileMenuClose}
            className="absolute top-4 right-4 lg:hidden w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-10"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Profile */}
      <div className="flex flex-col items-center px-6 -mt-14 mb-6">
        <div className="relative">
          <img
            src={getImageUrl(doctor?.profileImage)}
            alt="Doctor Profile"
            className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-sm bg-white"
          />
          <div className="absolute bottom-1 right-2 bg-white rounded-full p-0.5 shadow-sm border">
            <FaCheckCircle className="text-blue-500 text-xl" />
          </div>
        </div>

        <h3 className="mt-3 font-bold text-lg text-gray-800 text-center">
          {doctor?.name || "Doctor"}
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Doctor ID: {doctor?.customId || "NA"}
        </p>
        {doctor?.specialty && (
          <div className="mt-1 bg-white border border-gray-200 px-3 py-1 rounded-full flex items-center shadow-sm">
            <span className="text-blue-800 font-semibold text-xs">
              {doctor.specialty}
            </span>
          </div>
        )}
      </div>

      {/* Menu */}
      <div className="px-4 pb-6 flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {sidebarLinks.map((link) => (
            <li
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              className={`group flex items-center px-4 py-3 rounded-xl gap-3 cursor-pointer transition font-medium
                ${isActive(link.path)
                  ? "bg-[#00A1B0] text-white"
                  : "text-gray-500 hover:bg-gray-50 hover:text-[#00A1B0]"
                }`}
            >
              {link.icon && (
                <span
                  className={`text-lg ${isActive(link.path)
                    ? "text-white"
                    : "text-gray-400 group-hover:text-[#00A1B0]"
                    }`}
                >
                  {link.icon}
                </span>
              )}

              <span className="truncate text-sm">{link.label}</span>

              {link.badge === "notification" && (
                <span className="ml-auto flex h-3 w-3 relative">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
                </span>
              )}

              {link.badge === "dot" && (
                <span className="ml-auto h-2 w-2 rounded-full bg-yellow-400"></span>
              )}



            </li>
          ))}

          {/* Logout */}
          <li
            onClick={handleLogout}
            className="group flex items-center px-4 py-3 rounded-xl text-gray-500 gap-3 hover:bg-red-50 hover:text-red-600 cursor-pointer transition font-medium mt-2"
          >
            <span className="text-lg text-gray-400 group-hover:text-red-500">
              <FaSignOutAlt />
            </span>
            <span className="truncate text-sm">Logout</span>
          </li>
        </ul>
      </div>
    </>
  );


  const DesktopSidebar = () => (
    <aside className="hidden lg:flex col-span-12 lg:col-span-3 bg-white rounded-3xl shadow flex-col h-fit lg:min-w-[265px] max-w-xs sticky top-4 overflow-hidden">
      <SidebarContent />
    </aside>
  );

  const MobileSidebar = () => (
    <>
      {/* Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <SidebarContent />
      </aside>
    </>
  );

  return (
    <>
      <DesktopSidebar />
      <MobileSidebar />
    </>
  );
};

export default DoctorSidebar;
