import React, { useState, useEffect, useCallback } from 'react';
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import { FaHistory, FaMoneyBillWave, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { walletService } from '../../services/walletService';
import { Skeleton } from '../../components/ui/skeleton';

interface Transaction {
    _id: string;
    type: string;
    description: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    createdAt: string;
    appointmentId?: string;
}

const DoctorWallet: React.FC = () => {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(10);
    const [sessionEarnings, setSessionEarnings] = useState(0);
    const [sessionDeductions, setSessionDeductions] = useState(0);

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
                setSessionEarnings(response.data.earnings || 0);
                setSessionDeductions(response.data.deductions || 0);
            }
        } catch (error) {
            console.error("Error fetching doctor wallet data:", error);
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

    // Removed frontend-only calculations that were causing the pagination bug
    // const filteredEarnings = ...
    // const filteredDeductions = ...

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <DoctorNavbar />
            <Breadcrumbs items={[{ label: 'Wallet' }]} title="Earnings Ledger" subtitle="Overview of your practice revenue and settlements" />

            <DoctorLayout>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {loading ? (
                            <>
                                <Skeleton className="h-20 sm:h-24 w-full rounded-2xl sm:rounded-3xl" />
                                <Skeleton className="h-20 sm:h-24 w-full rounded-2xl sm:rounded-3xl" />
                                <Skeleton className="h-20 sm:h-24 w-full rounded-2xl sm:rounded-3xl" />
                            </>
                        ) : (
                            <>
                                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm flex items-center gap-3 sm:gap-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#00A1B0]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#00A1B0]"><FaMoneyBillWave size={16} /></div>
                                    <div>
                                        <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Balance</p>
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">₹{balance.toLocaleString()}</h2>
                                    </div>
                                </div>
                                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Earnings</p>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">+₹{sessionEarnings.toLocaleString()}</h2>
                                </div>
                                <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-rose-500">
                                    <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Session Deductions</p>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">-₹{sessionDeductions.toLocaleString()}</h2>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-balance">
                        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <FaHistory className="text-[#00A1B0]" />
                                Revenue Ledger
                            </h3>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Date:</span>
                                <div className="relative flex-1 sm:flex-none">
                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full sm:w-auto px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#00A1B0] focus:ring-1 focus:ring-[#00A1B0] transition-all cursor-pointer" />
                                    {selectedDate && (<button onClick={() => setSelectedDate('')} className="absolute -right-2 -top-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm hover:bg-rose-600 transition-colors">×</button>)}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                                        <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                                        <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                                        <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                        <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-bold text-[#00A1B0] uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        [1, 2, 3, 4, 5].map(i => (
                                            <tr key={i}>
                                                <td className="px-4 sm:px-8 py-4 sm:py-6"><Skeleton className="h-3 w-16 sm:w-20" /></td>
                                                <td className="px-4 sm:px-8 py-4 sm:py-6"><div className="space-y-1 sm:space-y-2"><Skeleton className="h-3 w-24 sm:w-32" /><Skeleton className="h-2 w-20 sm:w-32" /></div></td>
                                                <td className="px-4 sm:px-8 py-4 sm:py-6"><Skeleton className="h-3 w-16 sm:w-24" /></td>
                                                <td className="px-4 sm:px-8 py-4 sm:py-6 text-center"><Skeleton className="h-4 sm:h-6 w-12 sm:w-16 rounded-full mx-auto" /></td>
                                                <td className="px-4 sm:px-8 py-4 sm:py-6 text-right"><Skeleton className="h-3 w-12 sm:w-16 ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : transactions.length === 0 ? (
                                        <tr><td colSpan={5} className="px-4 sm:px-8 py-8 sm:py-10 text-center text-gray-500 text-xs sm:text-sm">No transactions found for the selected criteria.</td></tr>
                                    ) : (
                                        transactions.map((txn) => {
                                            const { date, time } = formatDate(txn.createdAt);
                                            return (
                                                <tr key={txn._id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 sm:px-8 py-4 sm:py-6"><span className="text-xs sm:text-sm font-black text-gray-300 uppercase tracking-widest">#{txn._id.slice(-8).toUpperCase()}</span></td>
                                                    <td className="px-4 sm:px-8 py-4 sm:py-6"><div className="flex flex-col"><span className="text-xs sm:text-sm font-bold text-gray-800 tracking-tight">{txn.description}</span><p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">{date} • {time}</p></div></td>
                                                    <td className="px-4 sm:px-8 py-4 sm:py-6"><p className="text-xs sm:text-sm font-bold text-gray-600 truncate max-w-[100px] sm:max-w-[150px]">{txn.type}</p></td>
                                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-center"><span className={`inline-flex items-center px-1.5 sm:px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(txn.status)}`}>{txn.status}</span></td>
                                                    <td className="px-4 sm:px-8 py-4 sm:py-6 text-right whitespace-nowrap"><span className={`text-xs sm:text-sm font-bold tracking-tight ${txn.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{txn.amount >= 0 ? '+' : '-'}₹{Math.abs(txn.amount).toLocaleString()}</span></td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-gray-50 bg-gray-50/20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                                <p className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</p>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#00A1B0] hover:text-[#00A1B0] transition-colors"><FaChevronLeft size={8} /></button>
                                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#00A1B0] hover:text-[#00A1B0] transition-colors"><FaChevronRight size={8} /></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DoctorLayout>
        </div>
    );
};

export default DoctorWallet;
