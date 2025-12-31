import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import PatientSidebar from '../../components/Patient/PatientSidebar';
import { FaVideo, FaComments, FaEye, FaSearch } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';
import { API_BASE_URL } from '../../utils/constants';

// Appointment interface
interface Appointment {
    id: string;
    doctorId: string;
    doctorName: string;
    doctorImage: string;
    appointmentType: 'video' | 'chat';
    date: string;
    time: string;
    status: 'upcoming' | 'cancelled' | 'completed';
}

// Mock data
const mockAppointments: Appointment[] = [
    {
        id: 'APT0001',
        doctorId: '1',
        doctorName: 'Dr. Edalin Hendry',
        doctorImage: '/doctor-placeholder.jpg',
        appointmentType: 'video',
        date: '2024-11-15',
        time: '10:45 AM',
        status: 'upcoming',
    },
    {
        id: 'APT0002',
        doctorId: '2',
        doctorName: 'Dr. Shanta Nesmith',
        doctorImage: '/doctor-placeholder.jpg',
        appointmentType: 'chat',
        date: '2024-11-12',
        time: '11:50 AM',
        status: 'upcoming',
    },
    {
        id: 'APT0003',
        doctorId: '3',
        doctorName: 'Dr. John Ewel',
        doctorImage: '/doctor-placeholder.jpg',
        appointmentType: 'video',
        date: '2024-11-05',
        time: '09:30 AM',
        status: 'completed',
    },
];

const Appointments: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'cancelled' | 'completed'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const lastFetchedPage = useRef<number | null>(null);

    const [appointments, setAppointments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState<number | null>(null);

    const limit = 12;

    const getImageUrl = (imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    };

    const getDoctorInfo = (apt: any) => {
        const doctor = apt?.doctor || apt?.doctorId;
        const name = doctor?.name || doctor?.user?.name || doctor?.userId?.name || apt?.doctorName || 'Doctor';
        const profileImage =
            doctor?.profileImage ||
            doctor?.user?.profileImage ||
            doctor?.image ||
            doctor?.userId?.profileImage ||
            apt?.doctorImage ||
            null;
        return {
            name,
            image: getImageUrl(profileImage),
        };
    };

    const mapStatusToTab = (status: string): 'upcoming' | 'cancelled' | 'completed' => {
        if (status === 'completed') return 'completed';
        if (status === 'cancelled' || status === 'rejected') return 'cancelled';
        return 'upcoming';
    };

    const formatDateShort = (value: any) => {
        if (!value) return 'N/A';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const normalizedAppointments = useMemo(() => {
        return appointments.map((apt) => {
            const id = apt?.customId || apt?._id || apt?.id;
            const doctorInfo = getDoctorInfo(apt);
            return {
                raw: apt,
                id,
                doctorName: doctorInfo.name,
                doctorImage: doctorInfo.image,
                appointmentType: apt?.appointmentType,
                date: apt?.appointmentDate || apt?.date,
                time: apt?.appointmentTime || apt?.time,
                status: apt?.status,
                tab: mapStatusToTab(apt?.status),
            };
        });
    }, [appointments]);

    useEffect(() => {
        let isMounted = true;

        const fetchAppointments = async () => {
            // Only fetch if we haven't fetched this page before or if it's page 1 with no data
            if (lastFetchedPage.current === page && appointments.length > 0) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = await appointmentService.getMyAppointments(undefined, page, limit);
                if (!response?.success) {
                    throw new Error(response?.message || 'Failed to fetch appointments');
                }

                const payload = response?.data;
                const nextAppointments = payload?.appointments || payload?.items || [];
                const nextTotal = typeof payload?.total === 'number' ? payload.total : null;

                if (!isMounted) return;
                setAppointments((prev) => (page === 1 ? nextAppointments : [...prev, ...nextAppointments]));
                setTotal(nextTotal);
                lastFetchedPage.current = page; // Mark this page as fetched
            } catch (e: any) {
                if (!isMounted) return;
                setError(e?.response?.data?.message || e?.message || 'Failed to fetch appointments');
                if (page === 1) {
                    setAppointments(mockAppointments);
                }
            } finally {
                if (!isMounted) return;
                setLoading(false);
            }
        };

        fetchAppointments();
        return () => {
            isMounted = false;
        };
    }, [page]);

    const filteredAppointments = normalizedAppointments.filter((apt) => {
        if (apt.tab !== activeTab) return false;
        return apt.doctorName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const getTabCount = (status: 'upcoming' | 'cancelled' | 'completed') => {
        return normalizedAppointments.filter((apt) => apt.tab === status).length;
    };

    const hasMore = total !== null ? normalizedAppointments.length < total : filteredAppointments.length >= limit;

    const handleViewDetails = (id: string) => {
        navigate(`/patient/appointments/${id}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <NavBar />

            {/* Breadcrumb - Smooth Minimal Design */}
            <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Breadcrumb Navigation */}
                        <nav className="flex items-center gap-2 mb-5 text-white/80 text-sm">
                            <a href="/" className="hover:text-white transition-colors">Home</a>
                            <span>/</span>
                            <span className="text-white font-medium">Appointments</span>
                        </nav>

                        {/* Title Section */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">
                                    My Appointments
                                </h1>
                                <p className="text-white/90 text-base">
                                    Manage your medical appointments
                                </p>
                            </div>

                            {/* Simple Stats */}
                            <div className="hidden md:flex items-center gap-6 text-white">
                                <div className="text-center">
                                    <div className="text-3xl font-bold">{getTabCount('upcoming')}</div>
                                    <div className="text-sm text-white/80">Upcoming</div>
                                </div>
                                <div className="w-px h-12 bg-white/20"></div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold">{getTabCount('completed')}</div>
                                    <div className="text-sm text-white/80">Completed</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto pt-8 pb-14 px-4">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Sidebar */}
                    <div className="w-full lg:w-[300px] flex-shrink-0">
                        <PatientSidebar />
                    </div>

                    {/* Appointments Content */}
                    <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>

                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 md:w-64">
                                        <input
                                            type="text"
                                            placeholder="Search appointments..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] outline-none"
                                        />
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </div>
                            </div>

                            {/* Tabs - Fixed width on mobile */}
                            <div className="flex mt-6 border-b border-gray-200">
                                <button
                                    onClick={() => setActiveTab('upcoming')}
                                    className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'upcoming'
                                        ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Upcoming
                                    <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-[#00A1B0]/10 text-[#00A1B0] text-[9px] md:text-xs rounded-full">
                                        {getTabCount('upcoming')}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('cancelled')}
                                    className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'cancelled'
                                        ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Cancelled
                                    <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-xs rounded-full">
                                        {getTabCount('cancelled')}
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('completed')}
                                    className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'completed'
                                        ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Completed
                                    <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-xs rounded-full">
                                        {getTabCount('completed')}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">
                                {error}
                            </div>
                        )}

                        {/* Appointments Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {loading && normalizedAppointments.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <div className="text-gray-400 text-lg mb-2">Loading appointments...</div>
                                </div>
                            ) : filteredAppointments.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <div className="text-gray-400 text-6xl mb-4">📅</div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointments Found</h3>
                                    <p className="text-gray-500">
                                        {activeTab === 'upcoming'
                                            ? "You don't have any upcoming appointments"
                                            : `No ${activeTab} appointments to display`}
                                    </p>
                                </div>
                            ) : (
                                filteredAppointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 overflow-hidden"
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <img
                                                        src={appointment.doctorImage}
                                                        alt={appointment.doctorName}
                                                        className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                                        onError={(e) => {
                                                            e.currentTarget.src = '/doctor.png';
                                                        }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-gray-500 font-medium mb-1">
                                                            {appointment.id}
                                                        </p>
                                                        <h3 className="font-semibold text-gray-800 mb-1 truncate">
                                                            {appointment.doctorName}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {appointment.appointmentType === 'video' ? 'Video Call' : 'Chat'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Type Icon */}
                                                <div
                                                    className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-[#00A1B0]/10 text-[#00A1B0]`}
                                                >
                                                    {appointment.appointmentType === 'video' ? (
                                                        <FaVideo size={18} />
                                                    ) : (
                                                        <FaComments size={18} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 bg-gray-50">
                                            <div className="flex items-center justify-between gap-4 text-sm mb-4">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                        />
                                                    </svg>
                                                    <span>
                                                        {formatDateShort(appointment.date)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <svg
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                        />
                                                    </svg>
                                                    <span>{appointment.time}</span>
                                                </div>
                                            </div>

                                            {/* Rejection Reason Section */}
                                            {appointment.raw?.status === 'rejected' && appointment.raw?.rejectionReason && (
                                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <div className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5">
                                                            <svg
                                                                className="w-full h-full"
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-red-800 mb-1">
                                                                Rejection Reason
                                                            </p>
                                                            <p className="text-sm text-red-700">
                                                                {appointment.raw.rejectionReason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleViewDetails(appointment.id)}
                                                    className="w-full px-4 py-2 bg-[#00A1B0] hover:bg-[#008f9c] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FaEye size={14} />
                                                    Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Load More */}
                        {filteredAppointments.length > 0 && hasMore && (
                            <div className="text-center mt-8">
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={loading}
                                    className="px-8 py-3 border-2 border-[#00A1B0] text-[#00A1B0] font-semibold rounded-full hover:bg-[#00A1B0] hover:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Appointments;
