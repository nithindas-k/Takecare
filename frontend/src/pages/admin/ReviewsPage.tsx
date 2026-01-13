import React, { useEffect, useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import { Trash2, ChevronLeft, ChevronRight, Star } from "lucide-react";
import adminService from "../../services/adminService";
import AlertDialog from "../../components/common/AlertDialog";

interface Review {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        email: string;
        profileImage: string;
    };
    doctorId: {
        _id: string;
        specialty: string;
        userId: {
            name: string;
            profileImage: string;
        }
    };
    rating: number;
    comment: string;
    createdAt: string;
}

const ReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const limit = 10;

    const fetchReviews = useCallback(async (currentPage: number) => {
        setLoading(true);
        try {
            const res = await adminService.getAllReviews(currentPage, limit);
            if (res.success && res.data) {
                setReviews(res.data.reviews || []);
                setTotalPages(res.data.totalPages || 1);
                setTotalReviews(res.data.total || 0);
            } else {
                toast.error(res.message || "Failed to fetch reviews");
            }
        } catch (e: unknown) {
            const error = e as { message?: string };
            toast.error(error.message || "Error fetching reviews");
        } finally {
            setLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        fetchReviews(page);
    }, [page, fetchReviews]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            const res = await adminService.deleteReview(deleteId);
            if (res.success) {
                toast.success("Review deleted successfully");
                fetchReviews(page);
            } else {
                toast.error(res.message || "Failed to delete review");
            }
        } catch (error) {
            toast.error("Error deleting review");
        } finally {
            setDeleteId(null);
        }
    };

    const pagesToShow = useMemo(() => {
        const items: number[] = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);
        for (let p = start; p <= end; p++) items.push(p);
        return items;
    }, [page, totalPages]);

    const getInitials = (name?: string) =>
        name
            ? name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "??";

    return (
        <div className="flex min-h-screen bg-gray-50 no-scrollbar">
            {/* Sidebar - Desktop */}
            <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
                <Sidebar />
            </div>

            {/* Sidebar - Mobile Overlay */}
            <AnimatePresence>
                {sidebarOpen && (
                    <div className="fixed inset-0 z-[60] lg:hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSidebarOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        {/* Sidebar Content */}
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

                <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-6">
                    <div className="max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-800">Reviews</h1>
                                    <p className="text-sm text-gray-500">Manage patient reviews ({totalReviews})</p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500">
                                    Loading reviews...
                                </div>
                            ) : reviews.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">
                                    No reviews found.
                                </div>
                            ) : (
                                <>
                                    {/* Mobile Cards */}
                                    <div className="lg:hidden p-4 space-y-4">
                                        {reviews.map((review) => (
                                            <div
                                                key={review._id}
                                                className="border rounded-xl p-4 shadow-sm"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        {review.patientId?.profileImage ? (
                                                            <img src={review.patientId.profileImage} alt={review.patientId.name} className="w-10 h-10 rounded-full object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs">
                                                                {getInitials(review.patientId?.name)}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="font-semibold text-gray-800">{review.patientId?.name || "Unknown Patient"}</p>
                                                            <p className="text-xs text-gray-500">For Dr. {review.doctorId?.userId?.name || "Unknown Doctor"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                                        <Star size={14} className="text-yellow-500 fill-yellow-500" />
                                                        <span className="font-semibold text-sm text-yellow-700">{review.rating}</span>
                                                    </div>
                                                </div>

                                                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                                                    <p className="text-sm text-gray-600 line-clamp-3 italic">"{review.comment}"</p>
                                                </div>

                                                <div className="flex justify-between items-center mt-2">
                                                    <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                    <button
                                                        onClick={() => setDeleteId(review._id)}
                                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop Table */}
                                    <div className="hidden lg:block overflow-x-auto no-scrollbar">
                                        <table className="w-full text-left border-collapse table-fixed">
                                            <thead>
                                                <tr className="bg-gray-50 border-b text-[11px] uppercase text-gray-500 font-semibold">
                                                    <th className="px-6 py-4 w-[250px]">Patient</th>
                                                    <th className="px-6 py-4 w-[250px]">Doctor</th>
                                                    <th className="px-6 py-4 w-[120px]">Rating</th>
                                                    <th className="px-6 py-4">Comment</th>
                                                    <th className="px-6 py-4 w-[150px]">Date</th>
                                                    <th className="px-6 py-4 w-[80px] text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {reviews.map((review) => (
                                                    <tr key={review._id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {review.patientId?.profileImage ? (
                                                                    <img src={review.patientId.profileImage} alt={review.patientId.name} className="w-9 h-9 rounded-full object-cover border" />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white flex items-center justify-center text-xs font-bold">
                                                                        {getInitials(review.patientId?.name)}
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="font-medium text-gray-800 text-sm">{review.patientId?.name || "Unknown"}</p>
                                                                    <p className="text-xs text-gray-500">{review.patientId?.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                {review.doctorId?.userId?.profileImage ? (
                                                                    <img src={review.doctorId.userId.profileImage} alt={review.doctorId.userId.name} className="w-8 h-8 rounded-full object-cover border" />
                                                                ) : (
                                                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                                                                        {getInitials(review.doctorId?.userId?.name)}
                                                                    </div>
                                                                )}
                                                                <div className="min-w-0">
                                                                    <p className="font-medium text-gray-800 text-sm truncate">Dr. {review.doctorId?.userId?.name || "Unknown"}</p>
                                                                    <p className="text-xs text-gray-500 truncate">{review.doctorId?.specialty}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                                                <span className="font-semibold text-gray-700">{review.rating}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <p className="text-sm text-gray-600 truncate max-w-[300px]">
                                                                {review.comment}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-500">
                                                            {new Date(review.createdAt).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button
                                                                onClick={() => setDeleteId(review._id)}
                                                                className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}

                            {/* Pagination */}
                            {!loading && totalPages > 1 && (
                                <div className="px-4 py-4 border-t bg-gray-50 flex justify-center">
                                    <div className="flex gap-2">
                                        <button
                                            disabled={page === 1}
                                            onClick={() => setPage(page - 1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {pagesToShow.map((p) => (
                                            <button
                                                key={p}
                                                onClick={() => setPage(p)}
                                                className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${p === page
                                                    ? "bg-cyan-500 text-white"
                                                    : "border hover:bg-gray-100"
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        ))}

                                        <button
                                            disabled={page === totalPages}
                                            onClick={() => setPage(page + 1)}
                                            className="w-8 h-8 rounded-full border flex items-center justify-center disabled:opacity-50 hover:bg-gray-100"
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

            <AlertDialog
                open={!!deleteId}
                onOpenChange={() => setDeleteId(null)}
                title="Are you sure?"
                description="This action cannot be undone. This will permanently delete the review."
                confirmText="Delete"
                cancelText="Cancel"
                onConfirm={handleDelete}
                variant="destructive"
            />
        </div>
    );
};

export default ReviewsPage;
