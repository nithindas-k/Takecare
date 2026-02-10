import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { DollarSign, TrendingUp, Users, Calendar, Download, ChevronLeft, ChevronRight, X } from "lucide-react";
import { walletService } from '../../services/walletService';
import { Skeleton } from '../../components/ui/skeleton';
import { motion, AnimatePresence } from "framer-motion";

interface TransactionReport {
    _id: string;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
    appointmentId?: {
        customId: string;
    };
    userId?: {
        name: string;
        email: string;
    };
}

interface EarningsStats {
    revenue: number;
    commission: number;
    users: number;
    bookings: number;
    trends: {
        revenue: string;
        commission: string;
        users: string;
        bookings: string;
    };
}

const AdminEarnings: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [stats, setStats] = useState<EarningsStats | null>(null);
    const [transactions, setTransactions] = useState<TransactionReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate]);

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        try {
            const [statsRes, transRes] = await Promise.all([
                walletService.getAdminOverview(),
                walletService.getAdminTransactions(currentPage, limit, selectedDate)
            ]);

            if (statsRes.success) setStats(statsRes.data);
            if (transRes.success) {
                setTransactions(transRes.data.transactions);
                setTotalPages(transRes.data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching admin earnings data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, selectedDate]);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'failed': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const statCards = [
        { label: 'Revenue', value: stats ? `₹${stats.revenue.toLocaleString()}` : '₹0', trend: stats?.trends?.revenue || '0%', icon: <DollarSign size={20} />, color: 'text-[#00A1B0]', bg: 'bg-[#00A1B0]/10' },
        { label: 'Commission', value: stats ? `₹${stats.commission.toLocaleString()}` : '₹0', trend: stats?.trends?.commission || '0%', icon: <TrendingUp size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Users', value: stats ? stats.users.toLocaleString() : '0', trend: stats?.trends?.users || '0%', icon: <Users size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Bookings', value: stats ? stats.bookings.toLocaleString() : '0', trend: stats?.trends?.bookings || '0%', icon: <Calendar size={20} />, color: 'text-amber-600', bg: 'bg-amber-50' }
    ];

    return (
        <div className="flex min-h-screen bg-[#F8FAFC]">
            {/* Desktop Sidebar */}
            <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
                <Sidebar />
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: -256 }}
                            animate={{ x: 0 }}
                            exit={{ x: -256 }}
                            transition={{ type: "spring", damping: 30, stiffness: 450 }}
                            className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
                        >
                            <Sidebar onMobileClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Earnings</h1>
                                <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Platform performance tracking</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white border border-gray-100 rounded-2xl p-2 flex items-center shadow-sm gap-3">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-2">Filter by Date</span>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#00A1B0]/20 cursor-pointer"
                                        />
                                        {selectedDate && (
                                            <button
                                                onClick={() => setSelectedDate('')}
                                                className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-rose-600"
                                            >
                                                <X size={10} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <button className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm text-gray-400 hover:text-[#00A1B0] transition-colors">
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {statCards.map((s, idx) => (
                                <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center`}>
                                            {s.icon}
                                        </div>
                                        {loading && !stats ? <Skeleton className="h-5 w-12" /> : (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                {s.trend}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{s.label}</p>
                                    <div className="mt-2">
                                        {loading && !stats ? <Skeleton className="h-7 w-24" /> : <h2 className="text-xl font-bold text-gray-900 tracking-tight">{s.value}</h2>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                <h3 className="text-[10px] font-bold text-gray-800 uppercase tracking-widest">Commission Audit</h3>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50">
                                        <tr>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Description</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Commission</th>
                                            <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <tr key={i}>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-20" /></td>
                                                    <td className="px-8 py-5"><div className="space-y-1.5"><Skeleton className="h-4 w-48" /><Skeleton className="h-3 w-32" /></div></td>
                                                    <td className="px-8 py-5"><Skeleton className="h-4 w-24" /></td>
                                                    <td className="px-8 py-5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                                    <td className="px-8 py-5 text-center"><Skeleton className="h-6 w-16 rounded-full mx-auto" /></td>
                                                </tr>
                                            ))
                                        ) : transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-500 text-sm italic">No commissions recorded for the selected criteria.</td></tr>
                                        ) : (
                                            transactions.map((r) => (
                                                <tr key={r._id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-8 py-5">
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                                                            #{r.appointmentId?.customId || r._id.slice(-8).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-800 tracking-tight">{r.description}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium tracking-tight">by {r.userId?.name || 'System'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm font-medium text-gray-500">
                                                        {new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </td>
                                                    <td className={`px-8 py-5 text-right font-bold text-sm tracking-tight ${r.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                        {r.amount >= 0 ? `+₹${r.amount.toLocaleString()}` : `-₹${Math.abs(r.amount).toLocaleString()}`}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex justify-center">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest border px-3 py-1 rounded-full ${getStatusStyles(r.status)}`}>
                                                                {r.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {totalPages > 1 && (
                                <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 disabled:opacity-30 hover:text-[#00A1B0] hover:border-[#00A1B0] transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="w-10 h-10 flex items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 disabled:opacity-30 hover:text-[#00A1B0] hover:border-[#00A1B0] transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};


export default AdminEarnings;
