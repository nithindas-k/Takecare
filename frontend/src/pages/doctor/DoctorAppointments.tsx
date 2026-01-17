import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorNavbar from '../../components/Doctor/DoctorNavbar';
import DoctorLayout from '../../components/Doctor/DoctorLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { appointmentService } from '../../services/appointmentService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { PopulatedAppointment } from '../../types/appointment.types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from "../../components/ui/card"
import { FaCalendarAlt, FaComments, FaEye, FaSearch, FaVideo, FaChevronDown } from 'react-icons/fa';



const DoctorAppointments: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'cancelled' | 'completed'>('upcoming');
    const [searchQuery, setSearchQuery] = useState('');
    const [appointments, setAppointments] = useState<PopulatedAppointment[]>([]);
    const [tabCounts, setTabCounts] = useState<{ upcoming: number; cancelled: number; completed: number }>({
        upcoming: 0,
        cancelled: 0,
        completed: 0,
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchCounts = useCallback(async () => {
        try {
            const [upcomingRes, cancelledRes, completedRes] = await Promise.all([
                appointmentService.getDoctorAppointments('confirmed', 1, 1),
                appointmentService.getDoctorAppointments('cancelled', 1, 1),
                appointmentService.getDoctorAppointments('completed', 1, 1),
            ]);

            setTabCounts({
                upcoming: upcomingRes?.success ? upcomingRes?.data?.total || 0 : 0,
                cancelled: cancelledRes?.success ? cancelledRes?.data?.total || 0 : 0,
                completed: completedRes?.success ? completedRes?.data?.total || 0 : 0,
            });
        } catch (err) {
            console.warn('Failed to fetch counts:', err);
        }
    }, []);

    const fetchAppointments = useCallback(async (isAppending: boolean = false) => {
        try {
            if (!isAppending) {
                if (!hasLoadedOnce) setLoading(true);
                else setRefreshing(true);
            }

            setError('');
            const status = activeTab === 'upcoming' ? 'confirmed' : activeTab;
            const response = await appointmentService.getDoctorAppointments(status, isAppending ? page : 1, limit);

            if (response?.success) {
                const nextAppointments = response.data.appointments || [];
                if (isAppending) {
                    setAppointments(prev => [...prev, ...nextAppointments]);
                } else {
                    setAppointments(nextAppointments);
                }

                if (typeof response?.data?.total === 'number') {
                    setTotal(response.data.total);
                    setTabCounts((prev) => {
                        if (activeTab === 'upcoming') return { ...prev, upcoming: response.data.total };
                        if (activeTab === 'cancelled') return { ...prev, cancelled: response.data.total };
                        return { ...prev, completed: response.data.total };
                    });
                }
            } else {
                throw new Error(response?.message || 'Failed to fetch appointments');
            }
        } catch (err: any) {
            console.error('Failed to fetch appointments:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to fetch appointments');
            toast.error('Failed to load appointments');
        } finally {
            setLoading(false);
            setRefreshing(false);
            setHasLoadedOnce(true);
        }
    }, [activeTab, hasLoadedOnce, page, limit]);

    useEffect(() => {
        setPage(1);
    }, [activeTab]);

    useEffect(() => {
        fetchCounts();
        fetchAppointments(page > 1);
    }, [fetchCounts, fetchAppointments, page]);

    const filteredAppointments = appointments.filter(
        (apt) => apt.patientId?.name && apt.patientId.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getTabCount = (status: string) => {
        if (status === 'upcoming') return tabCounts.upcoming;
        if (status === 'cancelled') return tabCounts.cancelled;
        return tabCounts.completed;
    };

    const handleViewDetails = (id: string) => {
        navigate(`/doctor/appointments/${id}`);
    };

    const breadcrumbItems = [
        { label: 'Home', path: '/doctor/dashboard' },
        { label: 'Appointments' },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />

            <Breadcrumbs
                items={breadcrumbItems}
                title="My Appointments"
                subtitle="Manage your patient appointments"
            />

            <DoctorLayout>
                {/* Loading State */}
                {loading && !hasLoadedOnce && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A1B0]"></div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {(!loading || hasLoadedOnce) && !error && (
                    <>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Upcoming</p>
                                        <h3 className="text-2xl font-bold text-[#00A1B0]">{getTabCount('upcoming')}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                                        <FaVideo className="text-blue-600" size={20} />
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Completed</p>
                                        <h3 className="text-2xl font-bold text-green-600">{getTabCount('completed')}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                                        <h3 className="text-2xl font-bold text-red-600">{getTabCount('cancelled')}</h3>
                                    </div>
                                    <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A1B0] focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                            <div className="border-b border-gray-100">
                                <div className="flex gap-1 p-2 bg-gray-50/50">
                                    <button
                                        onClick={() => setActiveTab('upcoming')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'upcoming'
                                            ? 'bg-white text-[#00A1B0] shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                            }`}
                                    >
                                        Upcoming ({getTabCount('upcoming')})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('completed')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'completed'
                                            ? 'bg-white text-[#00A1B0] shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                            }`}
                                    >
                                        Completed ({getTabCount('completed')})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('cancelled')}
                                        className={`flex-1 px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${activeTab === 'cancelled'
                                            ? 'bg-white text-[#00A1B0] shadow-sm border border-gray-100'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
                                            }`}
                                    >
                                        Cancelled ({getTabCount('cancelled')})
                                    </button>
                                </div>
                            </div>

                            {/* Appointments List */}
                            <div className="p-4">
                                {refreshing && (
                                    <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Updating...
                                    </div>
                                )}
                                {filteredAppointments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                            <FaVideo className="text-gray-400" size={32} />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                            No {activeTab} appointments
                                        </h3>
                                        <p className="text-gray-600 text-sm">
                                            You don't have any {activeTab} appointments at the moment.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {filteredAppointments.map((appointment) => (
                                            <Card key={appointment.customId || appointment._id} className="overflow-hidden border-gray-100 hover:shadow-md transition-shadow">
                                                <CardHeader className="p-4 border-b border-gray-100 space-y-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            <div className="relative">
                                                                <img
                                                                    src={appointment.patientId?.profileImage || '/patient-placeholder.jpg'}
                                                                    alt={appointment.patientId?.name || 'Patient'}
                                                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-200"
                                                                    onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/100x100?text=Patient'; }}
                                                                />
                                                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] ${appointment.appointmentType === 'video' ? 'bg-[#00A1B0]' : 'bg-emerald-500'}`}>
                                                                    {appointment.appointmentType === 'video' ? <FaVideo /> : <FaComments />}
                                                                </div>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-[10px] text-gray-400 font-medium tracking-wider mb-0.5">{appointment.customId || appointment._id}</p>
                                                                <h3 className="font-bold text-gray-900 leading-tight truncate">{appointment.patientId?.name || 'Unknown Patient'}</h3>
                                                                <div className="flex items-center justify-between mt-1">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`w-1.5 h-1.5 rounded-full ${appointment.status === 'confirmed' ? 'bg-emerald-500' : appointment.status === 'cancelled' || appointment.status === 'rejected' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                                                                        <span className="text-[11px] font-medium text-gray-500 capitalize">{appointment.status.replace('_', ' ')}</span>
                                                                    </div>
                                                                    <span className="text-[11px] font-bold text-[#00A1B0] bg-[#00A1B0]/10 px-2 py-0.5 rounded-full">
                                                                        ₹{appointment.consultationFees}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="p-4 bg-gray-50/50 space-y-4">
                                                    <div className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-gray-100 shadow-sm">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <FaCalendarAlt className="w-3.5 h-3.5 text-[#00A1B0]" />
                                                            <span className="text-xs font-semibold">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="w-px h-3 bg-gray-200" />
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <svg className="w-3.5 h-3.5 text-[#00A1B0]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            <span className="text-xs font-semibold">{appointment.appointmentTime}</span>
                                                        </div>
                                                    </div>

                                                    <Button
                                                        onClick={() => handleViewDetails(appointment._id)}
                                                        className="w-full h-10 bg-[#D2F1F4] hover:bg-[#b8e9ed] text-[#00A1B0] font-bold rounded-xl border-none shadow-none gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
                                                    >
                                                        <FaEye className="w-4 h-4" />
                                                        <span className="text-sm">View Full Details</span>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {filteredAppointments.length > 0 && appointments.length < total && (
                                    <div className="text-center mt-10 mb-4">
                                        <button
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={loading || refreshing}
                                            className="group relative inline-flex items-center justify-center px-10 py-3 font-bold text-[#00A1B0] transition-all duration-300 bg-[#D2F1F4] hover:bg-[#b8e9ed] rounded-xl shadow-sm hover:shadow-md focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
                                            {loading || refreshing ? (
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
                            </div>
                        </div>
                    </>
                )}
            </DoctorLayout>
        </div>
    );
};

export default DoctorAppointments;
