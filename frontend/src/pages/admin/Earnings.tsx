import React, { useState, useEffect } from 'react';
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { DollarSign, TrendingUp, Users, Calendar, Download } from "lucide-react";
import { walletService } from '../../services/walletService';

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

const AdminEarnings: React.FC = () => {
    const [filterPeriod, setFilterPeriod] = useState('Month');
    const [stats, setStats] = useState<any>(null);
    const [transactions, setTransactions] = useState<TransactionReport[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const [statsRes, transRes] = await Promise.all([
                    walletService.getAdminOverview(),
                    walletService.getAdminTransactions()
                ]);

                if (statsRes.success) setStats(statsRes.data);
                if (transRes.success) setTransactions(transRes.data.transactions);
            } catch (error) {
                console.error("Error fetching admin earnings data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

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
            <div className="hidden lg:block sticky top-0 h-screen">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <TopNav onMenuClick={() => { }} />

                <main className="flex-1 p-6 lg:p-10">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Earnings</h1>
                                <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Platform performance tracking</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-white border border-gray-100 rounded-2xl p-1 flex items-center shadow-sm">
                                    {['Week', 'Month', 'Year'].map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setFilterPeriod(p)}
                                            className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filterPeriod === p ? 'bg-[#00A1B0] text-white shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}
                                        >
                                            {p}
                                        </button>
                                    ))}
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
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {s.trend}
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{s.label}</p>
                                    <h2 className="text-xl font-bold text-gray-900 mt-2 tracking-tight">{loading ? "..." : s.value}</h2>
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
                                            <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-500">Loading commission data...</td></tr>
                                        ) : transactions.length === 0 ? (
                                            <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-500">No commissions recorded yet.</td></tr>
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
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-sm text-gray-500">
                                                        {new Date(r.createdAt).toLocaleDateString()}
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
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminEarnings;
