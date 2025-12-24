import React, { useState, useEffect } from 'react';
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import { FaHistory, FaMoneyBillWave } from 'react-icons/fa';
import { walletService } from '../../services/walletService';

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

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                const response = await walletService.getMyWallet();
                if (response.success) {
                    setBalance(response.data.balance);
                    setTransactions(response.data.transactions);
                }
            } catch (error) {
                console.error("Error fetching doctor wallet data:", error);
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

    // Calculate MTD stats (simplified)
    const earningsMTD = transactions
        .filter(t => t.amount > 0 && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    const refundsMTD = transactions
        .filter(t => t.amount < 0 && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <DoctorNavbar />
            <Breadcrumbs items={[{ label: 'Wallet' }]} title="Earnings Ledger" subtitle="Overview of your practice revenue and settlements" />

            <DoctorLayout>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#00A1B0]/10 rounded-2xl flex items-center justify-center text-[#00A1B0]">
                                <FaMoneyBillWave size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Balance</p>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                    {loading ? "..." : `₹${balance.toLocaleString()}`}
                                </h2>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-emerald-500">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Earnings</p>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {loading ? "..." : `+₹${earningsMTD.toLocaleString()}`}
                            </h2>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm border-l-4 border-l-rose-500">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Deductions</p>
                            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                                {loading ? "..." : `-₹${refundsMTD.toLocaleString()}`}
                            </h2>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden text-balance">
                        <div className="px-8 py-5 border-b border-gray-50 bg-gray-50/20 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
                                <FaHistory className="text-[#00A1B0]" />
                                Revenue Ledger
                            </h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Transaction ID</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Details</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Type</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap text-center">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-bold text-[#00A1B0] uppercase tracking-widest whitespace-nowrap text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-10 text-center text-gray-500">Loading revenue records...</td>
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
                                                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest">
                                                            #{txn._id.slice(-8).toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-gray-800 tracking-tight">
                                                                {txn.description}
                                                            </span>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
                                                                {date} • {time}
                                                            </p>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-6">
                                                        <p className="text-xs font-bold text-gray-600 truncate max-w-[150px]">{txn.type}</p>
                                                    </td>
                                                    <td className="px-8 py-6 text-center">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(txn.status)}`}>
                                                            {txn.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-6 text-right whitespace-nowrap">
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
            </DoctorLayout>
        </div>
    );
};

export default DoctorWallet;
