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
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
                        >
                            <Sidebar onMobileClose={() => setSidebarOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                <TopNav onMenuClick={() => setSidebarOpen(true)} />

                <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-slate-900">Contact Messages</h1>
                            <p className="text-slate-500 mt-2">Manage incoming inquiries from the contact form</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
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
                            <div className="space-y-6">
                                {submissions.map((msg) => (
                                    <motion.div
                                        key={msg._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
                                                    <User size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-lg">{msg.name}</h3>
                                                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Mail size={14} />
                                                            {msg.email}
                                                        </span>
                                                        {msg.phone && (
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={14} />
                                                                {msg.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-xs font-medium">
                                                <Clock size={14} />
                                                {new Date(msg.createdAt).toLocaleString()}
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
                                                <MessageSquare size={18} className="text-cyan-500" />
                                                {msg.subject}
                                            </div>
                                            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                                                {msg.message}
                                            </p>
                                        </div>

                                        <div className="mt-4 flex items-center justify-between">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${msg.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                                    msg.status === 'responded' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {msg.status}
                                            </span>

                                            {msg.status === 'pending' && (
                                                <button
                                                    onClick={() => handleReplyClick(msg)}
                                                    className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors shadow-sm"
                                                >
                                                    Reply
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
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-900">Reply to {selectedMsg?.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">Subject: {selectedMsg?.subject}</p>
                            </div>

                            <div className="p-6">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Your Message</label>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type your response here..."
                                    className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
                                <button
                                    onClick={() => setReplyModalOpen(false)}
                                    className="px-6 py-2 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendReply}
                                    disabled={!replyText.trim() || isSending}
                                    className="px-8 py-2 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSending ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Sending...
                                        </>
                                    ) : "Send Reply"}
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
