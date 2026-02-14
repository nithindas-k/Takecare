import React, { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Star, MessageCircle, User, Clock, MessageSquare, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorLayout from "../../components/Doctor/DoctorLayout";
import Breadcrumbs from "../../components/common/Breadcrumbs";
import doctorService from "../../services/doctorService";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../redux/user/userSlice";

interface Review {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        profileImage: string;
        email?: string;
    };
    rating: number;
    comment: string;
    response?: string;
    responseDate?: string;
    createdAt: string;
}

const DoctorReviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    // Reply Modal State
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const doctor = useSelector(selectCurrentUser);

    const fetchReviews = useCallback(async () => {
        const docId = doctor?.doctorProfileId || doctor?.id || doctor?._id;
        if (!docId) return;

        setLoading(true);
        try {
            const res = await doctorService.getReviews(docId);
            if (res.success) {
                setReviews(res.data || []);
            } else {
                toast.error(res.message || "Failed to fetch reviews");
            }
        } catch (e: any) {
            toast.error(e.message || "Error fetching reviews");
        } finally {
            setLoading(false);
        }
    }, [doctor]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleReplyClick = (review: Review) => {
        setSelectedReview(review);
        setReplyText(review.response || "");
        setReplyModalOpen(true);
    };

    const handleSendReply = async () => {
        if (!selectedReview || !replyText.trim()) return;

        setIsSending(true);
        try {
            const res = await doctorService.respondToReview(selectedReview._id, replyText);
            if (res.success) {
                toast.success("Response sent successfully!");
                setReplyModalOpen(false);
                fetchReviews();
            } else {
                toast.error(res.message || "Failed to send response");
            }
        } catch (error) {
            toast.error("Error sending response");
        } finally {
            setIsSending(false);
        }
    };

    const breadcrumbItems = [{ label: 'Reviews' }];

    return (
        <div className="min-h-screen bg-gray-50">
            <DoctorNavbar />
            <Breadcrumbs items={breadcrumbItems} title="Patient Reviews" subtitle="Manage and respond to your patient feedback" />

            <DoctorLayout>
                <main className="max-w-4xl mx-auto py-6 px-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00A1B0]"></div>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-slate-100">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-50 rounded-full mb-3">
                                <MessageCircle className="text-slate-300" size={28} />
                            </div>
                            <h3 className="text-base font-semibold text-slate-900">No reviews yet</h3>
                            <p className="text-slate-500 text-sm mt-1">When patients leave feedback, it will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {reviews.map((review) => (
                                <motion.div
                                    key={review._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-lg flex items-center justify-center overflow-hidden">
                                                {review.patientId?.profileImage ? (
                                                    <img src={review.patientId.profileImage} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User size={20} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-base">{review.patientId?.name || "Patient"}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                                key={star}
                                                                size={12}
                                                                className={`${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 text-slate-400 rounded-full text-[10px] font-medium border border-slate-100">
                                            <Clock size={12} />
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-lg p-4 border border-slate-100/50">
                                        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1.5 text-xs">
                                            <MessageSquare size={14} className="text-[#00A1B0]" />
                                            Patient Feedback
                                        </div>
                                        <p className="text-slate-600 leading-relaxed italic text-xs">
                                            "{review.comment}"
                                        </p>
                                    </div>

                                    {review.response && (
                                        <div className="mt-3 pl-4 border-l-4 border-[#00A1B0]/30 transition-all">
                                            <div className="flex items-center gap-2 mb-1.5 text-[#00A1B0]">
                                                <span className="font-bold text-[10px] uppercase tracking-wider">Your Response</span>
                                                <span className="text-[9px] text-gray-400">
                                                    {review.responseDate && new Date(review.responseDate).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 text-xs leading-relaxed">
                                                {review.response}
                                            </p>
                                        </div>
                                    )}

                                    <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${!review.response ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {review.response ? 'Responded' : 'Pending'}
                                        </span>

                                        <button
                                            onClick={() => handleReplyClick(review)}
                                            className="px-4 py-1.5 bg-[#00A1B0] text-white rounded-lg font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/10 text-xs active:scale-95"
                                        >
                                            {review.response ? 'Edit Reply' : 'Reply'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </main>

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
                                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                                className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
                            >
                                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Reply to Review</h3>
                                            <p className="text-xs text-slate-500">Patient: {selectedReview?.patientId?.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setReplyModalOpen(false)}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <div className="mb-6 bg-slate-50 p-4 rounded-2xl text-sm italic text-slate-600 border border-slate-100">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <Clock size={10} />
                                            Original Feedback
                                        </div>
                                        "{selectedReview?.comment}"
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Your Response</label>
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write a thoughtful response to your patient..."
                                            className="w-full h-40 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#00A1B0]/20 focus:border-[#00A1B0] outline-none transition-all resize-none text-sm bg-slate-50/30"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 bg-slate-50/50 border-t border-slate-50 flex items-center justify-end gap-3 backdrop-blur-sm">
                                    <button
                                        onClick={() => setReplyModalOpen(false)}
                                        className="px-6 py-2 text-slate-500 font-bold hover:text-slate-900 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || isSending}
                                        className="px-8 py-2.5 bg-[#00A1B0] text-white rounded-xl font-bold hover:bg-teal-600 transition-all shadow-xl shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm active:scale-95"
                                    >
                                        {isSending ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Response
                                                <X className="rotate-45" size={14} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </DoctorLayout>
        </div>
    );
};

export default DoctorReviews;
