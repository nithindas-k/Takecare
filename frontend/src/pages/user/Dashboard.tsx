// src/pages/user/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../../redux/store";
import {
    FaCalendarCheck,
    FaWallet,
    FaUserMd,
    FaRegCalendarAlt,
    FaClipboardList,
    FaArrowRight,
    FaHistory
} from "react-icons/fa";


import NavBar from "../../components/common/NavBar";
import Footer from "../../components/common/Footer";
import PatientLayout from "../../components/Patient/PatientLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import { appointmentService } from "../../services/appointmentService";
import { walletService } from "../../services/walletService";
import { Skeleton } from "../../components/ui/skeleton";
import { Button } from "../../components/ui/button";
import { API_BASE_URL } from "../../utils/constants";
import type { PopulatedAppointment } from "../../types/appointment.types";

const PatientDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentUser } = useSelector((state: RootState) => state.user);
    const [stats, setStats] = useState({
        upcoming: 0,
        total: 0,
        balance: 0
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState<PopulatedAppointment[]>([]);
    const [recentAppointments, setRecentAppointments] = useState<PopulatedAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const getDoctorInfo = (node: PopulatedAppointment) => {
        if (!node) return { name: 'Doctor', image: '/doctor.png', speciality: 'Medical Specialist' };

        // Handle cases where node might be 'app' or directly the doctor object
        const doctor = (node.doctor || node.doctorId) as {
            name?: string;
            user?: { name?: string; profileImage?: string };
            userId?: { name?: string; profileImage?: string };
            profileImage?: string;
            image?: string;
            speciality?: string;
            specialization?: string;
            specialty?: string;
        } | undefined;
        const isObj = doctor && typeof doctor === 'object';

        let name = '';
        if (isObj) {
            name = doctor.name || doctor.user?.name || doctor.userId?.name || '';
        }

        // Fallback to top-level fields
        if (!name) {
            name = node.doctorName || 'Doctor';
        }

        let profileImage = '';
        if (isObj) {
            profileImage = doctor.profileImage || doctor.image || doctor.user?.profileImage || doctor.userId?.profileImage || '';
        }

        if (!profileImage) {
            profileImage = node.doctorImage || '';
        }

        let speciality = '';
        if (isObj) {
            speciality = doctor.speciality || doctor.specialization || doctor.specialty || '';
        }

        if (!speciality) {
            speciality = node.specialty || 'Medical Specialist';
        }

        return {
            name: name.startsWith('Dr.') ? name.replace('Dr.', '').trim() : name.trim(),
            image: getImageUrl(profileImage),
            speciality: speciality
        };
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [appointmentsRes, walletRes] = await Promise.all([
                    appointmentService.getMyAppointments(),
                    walletService.getMyWallet(1, 4)
                ]);

                if (appointmentsRes.success) {
                    const allApps = appointmentsRes.data.appointments || [];
                    const upcoming = allApps.filter((app: PopulatedAppointment) =>
                        ['scheduled', 'pending', 'confirmed', 'TEST_NEEDED'].includes(app.status)
                    );
                    setUpcomingAppointments(upcoming);
                    setRecentAppointments(allApps.slice(0, 4));
                    setStats(prev => ({
                        ...prev,
                        upcoming: upcoming.length,
                        total: allApps.length
                    }));
                }

                if (walletRes.success) {
                    setStats(prev => ({
                        ...prev,
                        balance: walletRes.data.balance || 0
                    }));
                }
            } catch (error: unknown) {
                console.error("Dashboard data fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);


    useEffect(() => {

    }, [loading]);

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'scheduled':
            case 'confirmed': return 'bg-sky-50 text-sky-600 border-sky-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'test_needed': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'cancelled': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            <NavBar />

            <Breadcrumbs
                items={[{ label: 'Home', path: '/' }, { label: 'Dashboard' }]}
                title="My Dashboard"
                subtitle={`Welcome back, ${currentUser?.name || 'Patient'}`}
            />

            <PatientLayout>
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)
                        ) : (
                            <>
                                <StatCard
                                    label="Upcoming Sessions"
                                    value={stats.upcoming}
                                    icon={<FaCalendarCheck size={22} />}
                                    trend="Next 7 days"
                                    color="sky"
                                />
                                <StatCard
                                    label="Total Consultations"
                                    value={stats.total}
                                    icon={<FaClipboardList size={22} />}
                                    trend="Lifetime record"
                                    color="purple"
                                />
                                <StatCard
                                    label="Wallet Balance"
                                    value={`₹${stats.balance.toLocaleString()}`}
                                    icon={<FaWallet size={22} />}
                                    trend="Available credit"
                                    color="teal"
                                    onClick={() => navigate('/patient/wallet')}
                                />
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-[#00A1B0] rounded-full"></span>
                                Primary Appointment
                            </h3>

                            {loading ? (
                                <Skeleton className="h-64 rounded-3xl" />
                            ) : upcomingAppointments.length > 0 ? (
                                <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00A1B0]/5 rounded-full -mr-16 -mt-16 group-hover:bg-[#00A1B0]/10 transition-colors"></div>

                                    <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
                                        <div className="relative flex-shrink-0">
                                            <img
                                                src={getDoctorInfo(upcomingAppointments[0]).image}
                                                className="w-24 h-24 rounded-full aspect-square object-cover border-4 border-slate-50 shadow-sm flex-shrink-0"
                                                alt="Doctor"
                                                onError={(e) => { e.currentTarget.src = '/doctor.png'; }}
                                            />
                                            <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-5 h-5 rounded-full border-2 border-white shadow-sm"></div>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${getStatusStyles(upcomingAppointments[0].status)}`}>
                                                    {upcomingAppointments[0].status}
                                                </span>
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-900">Dr. {getDoctorInfo(upcomingAppointments[0]).name}</h4>
                                            <p className="text-[#00A1B0] text-sm font-medium mb-3">{getDoctorInfo(upcomingAppointments[0]).speciality}</p>

                                            <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-2 text-slate-500 text-xs">
                                                <div className="flex items-center gap-1.5">
                                                    <FaRegCalendarAlt className="text-[#00A1B0]" />
                                                    {new Date(upcomingAppointments[0].appointmentDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <FaHistory className="text-[#00A1B0]" />
                                                    {upcomingAppointments[0].appointmentTime}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => navigate(`/patient/appointments/${upcomingAppointments[0]._id}`)}
                                            className="flex-1 border-slate-200 text-slate-700 rounded-xl h-11 font-bold hover:bg-slate-50"
                                        >
                                            Details
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <EmptyState message="No scheduled appointments found." actionLabel="Explore Doctors" onAction={() => navigate('/doctors')} />
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-slate-200 rounded-full"></span>
                                    Recent Activity
                                </h3>
                                {!loading && recentAppointments.length > 0 && (
                                    <button onClick={() => navigate('/patient/appointments')} className="text-xs font-bold text-[#00A1B0] hover:underline flex items-center gap-1">
                                        View History <FaArrowRight size={10} />
                                    </button>
                                )}
                            </div>

                            <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                {loading ? (
                                    <div className="p-6 space-y-4">
                                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                                    </div>
                                ) : recentAppointments.length > 0 ? (
                                    <div className="divide-y divide-slate-50">
                                        {recentAppointments.map((app) => (
                                            <div
                                                key={app._id}
                                                onClick={() => navigate(`/patient/appointments/${app._id}`)}
                                                className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-11 h-11 rounded-xl bg-slate-50 overflow-hidden border border-slate-100 flex-shrink-0">
                                                        <img
                                                            src={getDoctorInfo(app).image}
                                                            className="w-full h-full aspect-square object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
                                                            alt="Doctor"
                                                            onError={(e) => { e.currentTarget.src = '/doctor.png'; }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800 text-sm">Dr. {getDoctorInfo(app).name}</p>
                                                        <p className="text-xs text-slate-400 font-normal">
                                                            {new Date(app.appointmentDate).toLocaleDateString()} • {app.appointmentType || 'Consultation'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize border ${getStatusStyles(app.status)}`}>
                                                        {app.status}
                                                    </span>
                                                    <FaArrowRight size={12} className="text-slate-200 group-hover:text-[#00A1B0] transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-16 text-center text-slate-400 italic text-sm">No activity recorded.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <QuickAction
                            icon={<FaUserMd size={20} />}
                            label="Find Doctors"
                            desc="Book a session"
                            onClick={() => navigate('/doctors')}
                        />
                        <QuickAction
                            icon={<FaWallet size={20} />}
                            label="Wallet"
                            desc="Transactions"
                            onClick={() => navigate('/patient/wallet')}
                        />
                        <QuickAction
                            icon={<FaHistory size={20} />}
                            label="Medical Hub"
                            desc="Your records"
                            onClick={() => navigate('/patient/appointments')}
                        />
                        <QuickAction
                            icon={<FaClipboardList size={20} />}
                            label="Active Chat"
                            desc="Contact doctor"
                            onClick={() => navigate('/patient/chat/default')}
                        />
                    </div>
                </div>
            </PatientLayout>

            <Footer />
        </div>
    );
};

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    trend: string;
    color: string;
    onClick?: () => void;
}

const StatCard = ({ label, value, icon, trend, color, onClick }: StatCardProps) => {
    const shadowMap: Record<string, string> = {
        sky: 'hover:shadow-sky-200',
        purple: 'hover:shadow-purple-200',
        teal: 'hover:shadow-teal-200',
    };

    const colorMap: Record<string, string> = {
        sky: 'text-sky-600 bg-sky-100',
        purple: 'text-purple-600 bg-purple-100',
        teal: 'text-[#00A1B0] bg-[#00A1B0]/20',
    };

    return (
        <div
            onClick={onClick}
            className={`stat-card-entry bg-white border border-slate-200 p-6 rounded-2xl shadow-md transition-all hover:scale-[1.02] cursor-default flex items-center gap-5 ${onClick ? 'cursor-pointer' : ''} ${shadowMap[color] || ''}`}
        >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${colorMap[color] || 'bg-slate-100'}`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-slate-900 truncate">{value}</span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-1">{trend}</p>
            </div>
        </div>
    );
};

interface QuickActionProps {
    icon: React.ReactNode;
    label: string;
    desc: string;
    onClick: () => void;
}

const QuickAction = ({ icon, label, desc, onClick }: QuickActionProps) => (
    <button
        onClick={onClick}
        className="bg-white border border-slate-100 p-6 rounded-2xl text-center flex flex-col items-center justify-center gap-3 transition-all hover:border-[#00A1B0]/30 hover:shadow-md group"
    >
        <div className="text-slate-300 group-hover:text-[#00A1B0] transition-colors">{icon}</div>
        <div>
            <span className="block text-xs font-bold text-slate-800 group-hover:text-[#00A1B0] transition-colors">{label}</span>
            <span className="block text-[10px] text-slate-400 font-medium">{desc}</span>
        </div>
    </button>
);

interface EmptyStateProps {
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => (
    <div className="bg-white border-2 border-dashed border-slate-100 rounded-3xl p-16 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <FaClipboardList size={30} />
        </div>
        <div>
            <p className="text-slate-500 font-medium italic">{message}</p>
        </div>
        {actionLabel && (
            <Button onClick={onAction} className="bg-[#00A1B0] hover:bg-[#008f9c] text-white px-8 rounded-xl font-bold">
                {actionLabel}
            </Button>
        )}
    </div>
);

export default PatientDashboard;

