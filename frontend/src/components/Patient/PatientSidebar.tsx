import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    FaThLarge,
    FaCalendarCheck,
    FaWallet,
    FaFileInvoice,
    FaComments,
    FaCog,
    FaLock,
    FaSignOutAlt,
    FaCheckCircle
} from "react-icons/fa";
import type { AppDispatch } from "../../redux/store";
import {
    logout,
    selectCurrentUser,
} from "../../redux/user/userSlice";
import authService from "../../services/authService";

interface SidebarLink {
    label: string;
    icon?: React.ReactNode;
    path: string;
    badge?: "notification" | "dot";
}

const sidebarLinks: SidebarLink[] = [
    { label: "Dashboard", icon: <FaThLarge />, path: "/patient/home" },
    { label: "My Appointments", icon: <FaCalendarCheck />, path: "/patient/appointments" },
    { label: "Wallet", icon: <FaWallet />, path: "/patient/wallet" },
    { label: "Invoices", icon: <FaFileInvoice />, path: "/patient/invoices" },
    { label: "Message", icon: <FaComments />, path: "/patient/chat/default", badge: "dot" },
    { label: "Settings", icon: <FaCog />, path: "/patient/profile-settings" },
    { label: "Change Password", icon: <FaLock />, path: "/patient/change-password" },
];

const PatientSidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch<AppDispatch>();
    const patient = useSelector(selectCurrentUser);



    const handleLogout = async () => {
        try {
            await authService.logout();
            dispatch(logout());
            navigate("/login");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <aside className="bg-white rounded-3xl shadow flex flex-col overflow-hidden w-full">
            {/* Profile Header */}
            <div className="relative bg-[#00A1B0] h-28 w-full">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            </div>

            <div className="flex flex-col items-center px-6 -mt-14 mb-6">
                <div className="relative">
                    <img
                        src={patient?.profileImage || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png?20150327203541"}
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

                <p className="text-xs text-gray-500 mt-1">
                    Patient ID :{patient?.customId || "NA"}
                </p>
                {(patient as any)?.gender && (
                    <p className="text-xs text-blue-800 font-medium mt-1">
                        {(patient as any).gender.charAt(0).toUpperCase() + (patient as any).gender.slice(1)}
                        {(patient as any)?.dob && (
                            <>
                                <span className="text-gray-400 mx-1">•</span>
                                {new Date().getFullYear() - new Date((patient as any).dob).getFullYear()} Years
                            </>
                        )}
                    </p>
                )}
            </div>

            <ul className="space-y-1 px-4 pb-6">
                {sidebarLinks.map((link) => (
                    <li
                        key={link.label}
                        onClick={() => navigate(link.path)}
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
                    className="group flex items-center px-4 py-3 rounded-xl text-gray-500 gap-3 hover:bg-red-50 hover:text-red-600 cursor-pointer transition font-medium mt-2"
                >
                    <span className="text-lg text-gray-400 group-hover:text-red-500 transition-colors">
                        <FaSignOutAlt />
                    </span>
                    <span className="truncate text-sm">Logout</span>
                </li>
            </ul>
        </aside>
    );
};

export default PatientSidebar;
