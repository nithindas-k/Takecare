import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { Mail, Clock, User, Phone, MessageSquare } from "lucide-react";
import { contactService } from "../../services/contactService";
import { toast } from "sonner";

interface ContactSubmission {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    status: 'pending' | 'responded' | 'closed';
    createdAt: string;
}

const ContactMessages: React.FC = () => {
    const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Reply Modal State
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedMsg, setSelectedMsg] = useState<ContactSubmission | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await contactService.getAllSubmissions();
            if (res.success) {
                setSubmissions(res.data);
            } else {
                toast.error(res.message || "Failed to fetch messages");
            }
        } catch (error: any) {
            toast.error(error.message || "Error fetching messages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleReplyClick = (msg: ContactSubmission) => {
        setSelectedMsg(msg);
        setReplyText("");
        setReplyModalOpen(true);
    };

    const handleSendReply = async () => {
        if (!selectedMsg || !replyText.trim()) return;

        setIsSending(true);
        try {
            const res = await contactService.replyToMessage(selectedMsg._id, replyText);
            if (res.success) {
                toast.success("Reply sent successfully!");
                setReplyModalOpen(false);
                fetchSubmissions(); // Refresh to show 'responded' status
            } else {
                toast.error(res.message || "Failed to send reply");
            }
        } catch (error: any) {
            toast.error(error.message || "Error sending reply");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar - Desktop */}
            <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
                <Sidebar />
            </div>

            {/* Sidebar - Mobile Overlay */}
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

                <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-6 md:mb-8">
                            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Contact Messages</h1>
                            <p className="text-sm md:text-base text-slate-500 mt-1 md:mt-2">Manage incoming inquiries from the contact form</p>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-4"></div>
                                <p className="text-slate-400 font-medium">Loading inbox...</p>
                            </div>
                        ) : submissions.length === 0 ? (
                            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-50 rounded-full mb-4">
                                    <Mail className="text-slate-300" size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No messages yet</h3>
                                <p className="text-slate-500 mt-2">When users contact you, their messages will appear here.</p>
                            </div>
                        ) : (
                            <div className="space-y-4 md:space-y-6">
                                {submissions.map((msg) => (
                                    <motion.div
                                        key={msg._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                                            <div className="flex items-start gap-3 md:gap-4 min-w-0">
                                                <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <User size={20} className="md:w-6 md:h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">{msg.name}</h3>
                                                    <div className="flex flex-col gap-1 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1.5 truncate">
                                                            <Mail size={12} className="text-slate-400" />
                                                            {msg.email}
                                                        </span>
                                                        {msg.phone && (
                                                            <span className="flex items-center gap-1.5">
                                                                <Phone size={12} className="text-slate-400" />
                                                                {msg.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center self-start sm:self-auto gap-2 px-3 py-1 bg-slate-50 text-slate-400 group-hover:text-slate-500 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors">
                                                <Clock size={12} />
                                                {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 rounded-xl p-4 md:p-5 border border-slate-50 transition-colors group-hover:bg-slate-50">
                                            <div className="flex items-center gap-2 text-slate-900 font-bold mb-2 text-sm md:text-base">
                                                <MessageSquare size={16} className="text-cyan-500" />
                                                {msg.subject}
                                            </div>
                                            <p className="text-sm md:text-base text-slate-600 leading-relaxed whitespace-pre-wrap break-words italic">
                                                "{msg.message}"
                                            </p>
                                        </div>

                                        <div className="mt-4 flex flex-col xs:flex-row items-center justify-between gap-4 pt-2">
                                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${msg.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                msg.status === 'responded' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {msg.status}
                                            </span>

                                            {msg.status === 'pending' && (
                                                <button
                                                    onClick={() => handleReplyClick(msg)}
                                                    className="w-full xs:w-auto px-6 py-2 bg-[#00A1B0] text-white rounded-xl font-bold text-sm hover:bg-[#008a96] transition-all shadow-lg shadow-cyan-500/10 active:scale-95"
                                                >
                                                    Send Reply
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {replyModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setReplyModalOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900">Reply to {selectedMsg?.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Subject: {selectedMsg?.subject}</p>
                            </div>

                            <div className="p-6">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Your Message</label>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="w-full h-40 md:h-52 p-4 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/5 focus:border-[#00A1B0] outline-none transition-all resize-none text-slate-700 leading-relaxed shadow-inner"
                                />
                            </div>

                            <div className="p-6 bg-slate-50/50 flex flex-col-reverse xs:flex-row items-center justify-end gap-3 px-6 py-4">
                                <button
                                    onClick={() => setReplyModalOpen(false)}
                                    className="w-full xs:w-auto px-6 py-2.5 text-slate-500 font-bold hover:text-slate-900 transition-colors text-sm"
                                >
                                    Cancel Request
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim() || isSending}
                                    className="w-full xs:w-auto px-10 py-3 bg-[#00A1B0] text-white rounded-2xl font-bold hover:bg-[#008a96] transition-all shadow-xl shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Dispatching...
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={18} />
                                            Post Reply
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ContactMessages;
