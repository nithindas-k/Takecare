
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import NavBar from '../../components/common/NavBar';
import PatientLayout from '../../components/Patient/PatientLayout';
import { FaVideo, FaComments, FaEye, FaSearch, FaCalendarAlt, FaExclamationCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { appointmentService } from '../../services/appointmentService';

import { API_BASE_URL } from '../../utils/constants';
import { Skeleton } from '../../components/ui/skeleton';
import type { PopulatedAppointment } from '../../types/appointment.types';
import { Button } from '../../components/ui/button';

import { Card, CardContent, CardHeader } from "../../components/ui/card"

interface NormalizedAppointment {
    raw: PopulatedAppointment;
    id: string;
    displayId?: string;
    doctorName: string;
    doctorImage: string;
    appointmentType?: string;
    date?: string;
    time?: string;
    status: string;
    tab: 'upcoming' | 'cancelled' | 'completed';
    fees?: number;
}

const AppointmentCard: React.FC<{
    appointment: NormalizedAppointment;
    handleViewDetails: (id: string) => void;
    formatDateShort: (date: string | Date | undefined) => string
}> = ({ appointment, handleViewDetails, formatDateShort }) => {
    const [showReason, setShowReason] = useState(false);
    const reason = appointment.raw?.rejectionReason || appointment.raw?.cancellationReason || appointment.raw?.reason;
    const hasReason = !!reason && (appointment.status === 'rejected' || appointment.status === 'cancelled');

    return (
        <Card key={appointment.id} className="overflow-hidden border-gray-100 hover:shadow-md transition-shadow">
            <CardHeader className="p-4 border-b border-gray-100 space-y-0">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                        <div className="relative">
                            <img
                                src={appointment.doctorImage}
                                alt={appointment.doctorName}
                                className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => { e.currentTarget.src = '/doctor.png'; }}
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${appointment.appointmentType === 'video' ? 'bg-[#00A1B0]' : 'bg-emerald-500'}`}>
                                {appointment.appointmentType === 'video' ? <FaVideo /> : <FaComments />}
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 font-medium tracking-wider mb-0.5">{appointment.displayId}</p>
                            <h3 className="font-bold text-gray-900 leading-tight truncate">{appointment.doctorName}</h3>
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${appointment.status === 'confirmed' ? 'bg-emerald-500' : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                                    <span className="text-[11px] font-medium text-gray-500 capitalize">{appointment.status.replace('_', ' ')}</span>
                                </div>
                                {appointment.fees && (
                                    <span className="text-[11px] font-bold text-[#00A1B0] bg-[#00A1B0]/10 px-2 py-0.5 rounded-full">
                                        ₹{appointment.fees}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 bg-gray-50/50 space-y-4">
                <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                        <FaCalendarAlt className="w-3.5 h-3.5 text-[#00A1B0]" />
                        <span className="text-xs font-semibold">{formatDateShort(appointment.date)}</span>
                    </div>
                    <div className="w-px h-3 bg-gray-200" />
                    <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-3.5 h-3.5 text-[#00A1B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-xs font-semibold">{appointment.time}</span>
                    </div>
                </div>

                {appointment.raw?.status === 'reschedule_requested' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-tight">Action Required: Reschedule Proposed</p>
                    </div>
                )}

                {hasReason && (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowReason(!showReason)}
                            className="w-full flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <FaExclamationCircle className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                    {appointment.status === 'rejected' ? 'Rejection' : 'Cancellation'} Reason
                                </span>
                            </div>
                            {showReason ? <FaChevronUp className="w-3 h-3" /> : <FaChevronDown className="w-3 h-3" />}
                        </button>

                        {showReason && (
                            <div className="p-3 bg-white border border-rose-100 rounded-xl animate-in slide-in-from-top-1 duration-200">
                                <p className="text-xs text-rose-800 leading-relaxed italic">"{reason}"</p>
                            </div>
                        )}
                    </div>
                )}

                <Button
                    onClick={() => handleViewDetails(appointment.id)}
                    className="w-full h-10 bg-[#D2F1F4] hover:bg-[#b8e9ed] text-[#00A1B0] font-bold rounded-xl border-none shadow-none gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
                >
                    <FaEye className="w-4 h-4" />
                    <span className="text-sm">View Full Details</span>
                </Button>
            </CardContent>
        </Card>
    );
};

const Appointments: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'cancelled' | 'completed'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const lastFetchedPage = useRef<number | null>(null);

    const [appointments, setAppointments] = useState<PopulatedAppointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState<number | null>(null);
    const [counts, setCounts] = useState<{ upcoming: number; completed: number; cancelled: number }>({ upcoming: 0, completed: 0, cancelled: 0 });


    const limit = 12;

    const getImageUrl = useCallback((imagePath: string | null | undefined) => {
        if (!imagePath) return '/doctor.png';
        if (imagePath.startsWith('http')) return imagePath;
        const cleanPath = imagePath.replace(/\\/g, '/');
        return `${API_BASE_URL}/${cleanPath}`;
    }, []);

    const getDoctorInfo = useCallback((apt: PopulatedAppointment) => {
        const doctor = (apt?.doctor || apt?.doctorId) as {
            name?: string;
            user?: { name: string; profileImage?: string };
            userId?: { name: string; profileImage?: string };
            profileImage?: string;
            image?: string;
        } | undefined;
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
    }, [getImageUrl]);

    const mapStatusToTab = (status: string): 'upcoming' | 'cancelled' | 'completed' => {
        if (status === 'completed') return 'completed';
        if (status === 'cancelled' || status === 'rejected') return 'cancelled';
        if (status === 'reschedule_requested') return 'upcoming';
        return 'upcoming';
    };

    const formatDateShort = (value: string | Date | undefined) => {
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
        return appointments.map((apt: PopulatedAppointment): NormalizedAppointment => {
            const id = apt._id;
            const displayId = apt.customId || apt.id;
            const doctorInfo = getDoctorInfo(apt);
            return {
                raw: apt,
                id,
                displayId,
                doctorName: doctorInfo.name,
                doctorImage: doctorInfo.image,
                appointmentType: apt?.appointmentType,
                date: apt?.appointmentDate || apt?.date,
                time: apt?.appointmentTime || apt?.time,
                status: apt?.status,
                tab: mapStatusToTab(apt?.status),
                fees: apt?.consultationFees,
            };
        });
    }, [appointments, getDoctorInfo]);

    const fetchAppointments = useCallback(async (isMounted: boolean) => {
        setLoading(true);
        setError('');
        try {
            const status = activeTab === 'upcoming' ? 'confirmed,pending,reschedule_requested' : activeTab;

            const response = await appointmentService.getMyAppointments(status, page, limit, debouncedSearch);
            if (!response?.success) {
                throw new Error(response?.message || 'Failed to fetch appointments');
            }
            const payload = response?.data;
            const nextAppointments = payload?.appointments || payload?.items || [];
            const nextTotal = typeof payload?.total === 'number' ? payload.total : null;
            if (!isMounted) return;
            setAppointments((prev) => (page === 1 ? nextAppointments : [...prev, ...nextAppointments]));
            setTotal(nextTotal);
            if (payload.counts) {
                setCounts(payload.counts);
            }
            lastFetchedPage.current = page;
        } catch (e: unknown) {
            if (!isMounted) return;
            const err = e as { response?: { data?: { message?: string } }; message?: string };
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch appointments');
        } finally {
            if (isMounted) {
                setLoading(false);
            }
        }
    }, [page, limit, debouncedSearch, activeTab]);


    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);


    useEffect(() => {
        let isMounted = true;
        fetchAppointments(isMounted);
        return () => {
            isMounted = false;
        };
    }, [fetchAppointments]);


    const filteredAppointments = normalizedAppointments;

    const getTabCount = (status: 'upcoming' | 'cancelled' | 'completed') => {
        return counts[status] || 0;
    };

    const hasMore = total !== null ? normalizedAppointments.length < total : filteredAppointments.length >= limit;

    const handleViewDetails = (id: string) => {
        navigate(`/patient/appointments/${id}`);
    };



    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <NavBar />

            <div className="bg-gradient-to-r from-[#00A1B0] to-[#008f9c] py-10">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <nav className="flex items-center gap-2 mb-5 text-white/80 text-sm">
                            <a href="/" className="hover:text-white transition-colors">Home</a>
                            <span>/</span>
                            <span className="text-white font-medium">Appointments</span>
                        </nav>
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">My Appointments</h1>
                                <p className="text-white/90 text-base">Manage your medical appointments</p>
                            </div>
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

            <PatientLayout>
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

                    <div className="flex mt-6 border-b border-gray-200">
                        <button
                            onClick={() => {
                                if (activeTab !== 'upcoming') {
                                    setActiveTab('upcoming');
                                    setPage(1);
                                }
                            }}
                            className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'upcoming'
                                ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Upcoming
                            <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-[#00A1B0]/10 text-[#00A1B0] text-[9px] md:text-xs rounded-full">{getTabCount('upcoming')}</span>
                        </button>
                        <button
                            onClick={() => {
                                if (activeTab !== 'cancelled') {
                                    setActiveTab('cancelled');
                                    setPage(1);
                                }
                            }}
                            className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'cancelled'
                                ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Cancelled
                            <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-xs rounded-full">{getTabCount('cancelled')}</span>
                        </button>
                        <button
                            onClick={() => {
                                if (activeTab !== 'completed') {
                                    setActiveTab('completed');
                                    setPage(1);
                                }
                            }}
                            className={`flex-1 px-2 md:px-6 py-3 font-semibold transition-all relative whitespace-nowrap text-[11px] sm:text-xs md:text-sm lg:text-base ${activeTab === 'completed'
                                ? 'text-[#00A1B0] border-b-2 border-[#00A1B0]'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Completed
                            <span className="ml-1 md:ml-2 px-1.5 md:px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] md:text-xs rounded-full">{getTabCount('completed')}</span>
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading && appointments.length === 0 ? (
                        <>
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 border-b border-gray-100 flex items-start gap-3">
                                        <Skeleton className="w-14 h-14 rounded-full" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-3 w-16" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50 space-y-4">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-10 w-full rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <div className="text-gray-400 text-6xl mb-4">📅</div>
                            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Appointments Found</h3>
                            <p className="text-gray-500">{activeTab === 'upcoming' ? "You don't have any upcoming appointments" : `No ${activeTab} appointments to display`}</p>
                        </div>
                    ) : (
                        filteredAppointments.map((appointment) => (
                            <AppointmentCard
                                key={appointment.id}
                                appointment={appointment}
                                handleViewDetails={handleViewDetails}
                                formatDateShort={formatDateShort}
                            />
                        ))
                    )}
                </div>

                {filteredAppointments.length > 0 && hasMore && (
                    <div className="text-center mt-8">
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={loading}
                            className="group relative inline-flex items-center justify-center px-10 py-3 font-bold text-[#00A1B0] transition-all duration-300 bg-[#D2F1F4] hover:bg-[#b8e9ed] rounded-xl shadow-sm hover:shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                            {loading ? (
                                <div className="flex items-center gap-2.5">
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    <span className="tracking-wide text-sm">Fetching More...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <span className="tracking-wide text-sm">Load More Appointments</span>
                                    <FaChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-y-1" />
                                </div>
                            )}
                        </button>
                    </div>
                )}
            </PatientLayout>


        </div>
    );
};

export default Appointments;

