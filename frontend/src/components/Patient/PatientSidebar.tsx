import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    FaThLarge,
    FaRobot,
    FaCalendarCheck,
    FaWallet,
    FaComments,
    FaCog,

    FaSignOutAlt,
    FaCheckCircle,
    FaTimes,
    FaLock
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
    { label: "Dashboard", icon: <FaThLarge />, path: "/patient/dashboard" },
    { label: "My Appointments", icon: <FaCalendarCheck />, path: "/patient/appointments" },
    { label: "Wallet", icon: <FaWallet />, path: "/patient/wallet" },
    { label: "AI Health Assistant", icon: <FaRobot />, path: "/patient/ai-assistant" },
    { label: "Message", icon: <FaComments />, path: "/patient/chat/default", badge: "dot" },
    { label: "Settings", icon: <FaCog />, path: "/patient/profile-settings" },
    { label: "Change Password", icon: <FaLock />, path: "/patient/change-password" },
];

interface PatientSidebarProps {
    isMobileMenuOpen?: boolean;
    onMobileMenuClose?: () => void;
}

const PatientSidebar: React.FC<PatientSidebarProps> = ({
    isMobileMenuOpen = false,
    onMobileMenuClose
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const patient = useSelector(selectCurrentUser);

    const handleLogout = async () => {
        try {
            await authService.logout();
            dispatch(logout());
            navigate("/patient/login");
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
        <div className="flex flex-col h-full overflow-hidden">
            {/* Profile Header */}
            <div className="relative bg-[#00A1B0] h-28 w-full flex-shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                {onMobileMenuClose && (
                    <button
                        onClick={onMobileMenuClose}
                        className="absolute top-4 right-4 lg:hidden w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors z-10"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-col items-center px-6 -mt-14 mb-6 flex-shrink-0">
                <div className="relative">
                    <img
                        src={getImageUrl(patient?.profileImage)}
                        alt="Patient Profile"
                        className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-sm bg-white"
                    />
                    <div className="absolute bottom-1 right-2 bg-white rounded-full p-0.5 shadow-sm border border-white">
                        <FaCheckCircle className="text-[#00A1B0] text-xl bg-white rounded-full" />
                    </div>
                </div>

                <h3 className="mt-3 font-bold text-lg text-gray-800 text-center">
                    {patient?.name || "Patient"}
                </h3>

                <p className="text-xs text-gray-500 mt-1 uppercase tracking-tighter font-black">
                    ID: {patient?.customId || "NA"}
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6">
                <ul className="space-y-1">
                    {sidebarLinks.map((link) => (
                        <li
                            key={link.path}
                            onClick={() => handleNavigation(link.path)}
                            className={`group flex items-center px-4 py-3 rounded-xl gap-3 cursor-pointer transition font-medium ${isActive(link.path)
                                ? "bg-[#00A1B0] text-white font-bold shadow-md shadow-[#00A1B0]/20"
                                : "text-gray-500 hover:bg-gray-50 hover:text-[#00A1B0]"
                                }`}
                        >
                            {link.icon && (
                                <span
                                    className={`text-lg ${isActive(link.path) ? "text-white" : "text-gray-400 group-hover:text-[#00A1B0] transition-colors"
                                        }`}
                                >
                                    {link.icon}
                                </span>
                            )}
                            <span className="truncate text-sm">{link.label}</span>
                            {link.badge === "notification" && (
                                <span className="ml-auto flex h-2 w-2 relative">
                                    <span className="animate-ping absolute h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-full w-full bg-yellow-400"></span>
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
                        <span className="text-lg text-gray-400 group-hover:text-red-500 transition-colors">
                            <FaSignOutAlt />
                        </span>
                        <span className="truncate text-sm">Logout</span>
                    </li>
                </ul>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden w-full lg:w-[280px] h-fit sticky top-24">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar */}
            <>
                {isMobileMenuOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
                        onClick={onMobileMenuClose}
                    />
                )}
                <aside
                    className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                        }`}
                >
                    <SidebarContent />
                </aside>
            </>
        </>
    );
};

export default PatientSidebar;
