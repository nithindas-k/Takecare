import React, { useState, useEffect } from 'react';
import NavBar from '../../components/common/NavBar';
import PatientSidebar from '../../components/Patient/PatientSidebar';
import { FaHistory, FaWallet } from 'react-icons/fa';
import { walletService } from '../../services/walletService';

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

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                const response = await walletService.getMyWallet();
                if (response.success) {
                    setBalance(response.data.balance);
                    setTransactions(response.data.transactions);
                }
            } catch (error) {
                console.error("Error fetching wallet data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
    }, []);

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
        <div className="min-h-screen bg-[#F8FAFC]">
            <NavBar />

            <main className="max-w-7xl mx-auto py-12 px-4">
                <div className="flex flex-col lg:flex-row gap-8">
                    <aside className="w-full lg:w-72 flex-shrink-0">
                        <PatientSidebar />
                    </aside>

                    <div className="flex-1 space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Wallet</h1>
                                <p className="text-sm text-gray-500 font-medium">Transaction history and available balance</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-[#00A1B0]/5 rounded-bl-full group-hover:bg-[#00A1B0]/10 transition-all"></div>
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-14 h-14 bg-[#00A1B0] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#00A1B0]/20">
                                    <FaWallet size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available Funds</p>
                                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                                        {loading ? "..." : `₹${balance.toLocaleString()}`}
                                    </h2>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-balance">
                            <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                    <FaHistory className="text-[#00A1B0]" />
                                    Transaction Ledger
                                </h3>
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
                                            <tr>
                                                <td colSpan={5} className="px-8 py-10 text-center text-gray-500">Loading transactions...</td>
                                            </tr>
                                        ) : transactions.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-10 text-center text-gray-500">No transactions found.</td>
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
                                                                {txn.amount >= 0 ? '+' : ''}₹{txn.amount.toLocaleString()}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserWallet;
