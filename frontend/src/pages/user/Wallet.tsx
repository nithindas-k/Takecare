import React, { useState, useEffect, useCallback } from 'react';
import PatientLayout from '../../components/Patient/PatientLayout';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { FaHistory, FaWallet, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { walletService } from '../../services/walletService';
import { Skeleton } from '../../components/ui/skeleton';
import NavBar from '../../components/common/NavBar';

interface Transaction {
    _id: string;
    type: string;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
    appointmentId?: {
        customId: string;
    };
}

const UserWallet: React.FC = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);

    // Reset to page 1 when date changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate]);

    const fetchWalletData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await walletService.getMyWallet(currentPage, limit, undefined, undefined, selectedDate);
            if (response.success) {
                setBalance(response.data.balance);
                setTransactions(response.data.transactions);
                setTotalPages(response.data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching wallet data:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, limit, selectedDate]);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'failed': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
    };

    return (
        <div className="min-h-screen bg-gray-50 overflow-x-hidden">
            <NavBar />

            <Breadcrumbs
                items={[{ label: 'Home', path: '/' }, { label: 'Wallet' }]}
                title="My Wallet"
                subtitle="Manage your balance and transaction history"
            />

            <PatientLayout>
                <div className="flex-1 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wallet Overview</h1>
                            <p className="text-sm text-gray-500 font-medium">Available balance and recent activity</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-[#00A1B0]/5 rounded-bl-full group-hover:bg-[#00A1B0]/10 transition-all"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="w-14 h-14 bg-[#00A1B0] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00A1B0]/20">
                                <FaWallet size={20} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Funds</p>
                                {loading && balance === 0 ? (
                                    <Skeleton className="h-9 w-32" />
                                ) : (
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        ₹{balance.toLocaleString()}
                                    </h2>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-balance">
                        {/* Header with Date Picker */}
                        <div className="px-6 py-5 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <FaHistory className="text-[#00A1B0]" />
                                Transaction Ledger
                            </h3>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Date:</span>
                                <div className="relative flex-1 sm:flex-none">
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#00A1B0] focus:ring-1 focus:ring-[#00A1B0] transition-all cursor-pointer"
                                    />
                                    {selectedDate && (
                                        <button
                                            onClick={() => setSelectedDate('')}
                                            className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-rose-600 transition-colors"
                                            title="Clear date"
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-gray-50/50 text-left">
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i}>
                                                <td className="px-8 py-6"><Skeleton className="h-4 w-20" /></td>
                                                <td className="px-8 py-6">
                                                    <div className="space-y-2">
                                                        <Skeleton className="h-4 w-40" />
                                                        <Skeleton className="h-3 w-24" />
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6"><Skeleton className="h-4 w-16" /></td>
                                                <td className="px-8 py-6 text-center"><Skeleton className="h-6 w-20 rounded-full mx-auto" /></td>
                                                <td className="px-8 py-6 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-10 text-center text-gray-500 text-sm">No transactions found matching your criteria.</td>
                                        </tr>
                                    ) : (
                                        transactions.map((txn) => {
                                            const { date, time } = formatDate(txn.createdAt);
                                            return (
                                                <tr key={txn._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-8 py-6">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                            #{txn.appointmentId?.customId || txn._id.slice(-8).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-800 tracking-tight">{txn.description}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5 uppercase tracking-wide">{date} • {time}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-bold text-gray-600">{txn.type}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(txn.status)}`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right">
                                                        <span className={`text-sm font-bold tracking-tight ${txn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {txn.amount >= 0 ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="px-8 py-5 border-t border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#00A1B0] hover:text-[#00A1B0] transition-colors"
                                    >
                                        <FaChevronLeft size={10} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#00A1B0] hover:text-[#00A1B0] transition-colors"
                                    >
                                        <FaChevronRight size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </PatientLayout>
        </div>
    );
};

export default UserWallet;
