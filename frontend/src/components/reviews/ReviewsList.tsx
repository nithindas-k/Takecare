import React, { useState, useEffect, useCallback } from 'react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';
import { Button } from '../ui/button';
import { Plus, MessageSquare, Star } from 'lucide-react';
import { toast } from 'sonner';
import { reviewService } from '../../services/reviewService';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/user/userSlice';
import AlertDialog from '../../components/common/AlertDialog';

interface ReviewsListProps {
    doctorId: string;
    isCompletedAppointment?: boolean;
    appointmentId?: string;
}

interface Review {
    id: string;
    _id: string;
    patientId: {
        id?: string;
        _id?: string;
        name: string;
        profileImage?: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
    isOwnReview?: boolean;
}

const ReviewsList: React.FC<ReviewsListProps> = ({ doctorId, isCompletedAppointment, appointmentId }) => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingReview, setEditingReview] = useState<Review | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
    const user = useSelector(selectCurrentUser);
    const currentUserId = user?.id || user?._id;

    const fetchReviews = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await reviewService.getDoctorReviews(doctorId);
            setReviews(data || []);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to load reviews:", error);
            setIsLoading(false);
        }
    }, [doctorId]);

    useEffect(() => {
        if (doctorId) {
            fetchReviews();
        }
    }, [doctorId, fetchReviews]);

    const handleAddReview = async (data: { rating: number; comment: string }) => {
        if (!appointmentId) {
            toast.error("Appointment reference missing");
            return;
        }
        try {
            await reviewService.addReview({
                ...data,
                appointmentId,
                doctorId
            });
            toast.success("Review added successfully!");
            fetchReviews();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add review");
        }
    };

    const handleEditReview = async (data: { rating: number; comment: string }) => {
        if (!editingReview) return;
        try {
            await reviewService.updateReview(editingReview.id || editingReview._id, data);
            toast.success("Review updated successfully!");
            setEditingReview(null);
            fetchReviews();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update review");
        }
    };

    const handleDeleteClick = (id: string) => {
        setReviewToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!reviewToDelete) return;
        try {
            await reviewService.deleteReview(reviewToDelete);
            toast.success("Review deleted successfully!");
            fetchReviews();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to delete review");
        } finally {
            setDeleteDialogOpen(false);
            setReviewToDelete(null);
        }
    };

    const stats = {
        average: reviews.length > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : "0.0",
        total: reviews.length,
        distribution: [5, 4, 3, 2, 1].map(star => {
            if (reviews.length === 0) return 0;
            const count = reviews.filter(r => Math.round(r.rating) === star).length;
            return Math.round((count / reviews.length) * 100);
        })
    };

    return (
        <div className="space-y-8">
            {/* Review Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        Patient Feedback
                        <span className="text-sm font-normal text-gray-400">({stats.total} reviews)</span>
                    </h3>
                </div>

                {isCompletedAppointment && (
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#00A1B0] hover:bg-[#008f9c] text-white rounded-full px-6 flex items-center gap-2 shadow-lg shadow-cyan-100 transition-all hover:scale-105"
                    >
                        <Plus size={18} />
                        Write a Review
                    </Button>
                )}
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex flex-col items-center justify-center text-center space-y-2 lg:border-r border-gray-200">
                    <span className="text-5xl font-black text-[#00A1B0]">{stats.average}</span>
                    <div className="flex text-yellow-400 gap-1">
                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={18} fill={i <= Math.round(Number(stats.average)) ? "currentColor" : "none"} />)}
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Doctor Rating</p>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    {[5, 4, 3, 2, 1].map((star, idx) => (
                        <div key={star} className="flex items-center gap-4">
                            <span className="text-sm font-bold text-gray-600 w-12">{star} Star</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full"
                                    style={{ width: `${stats.distribution[idx]}%` }}
                                />
                            </div>
                            <span className="text-sm font-medium text-gray-400 w-12">{stats.distribution[idx]}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
                    ))
                ) : reviews.length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="p-4 bg-white rounded-full w-fit mx-auto shadow-sm mb-4">
                            <MessageSquare className="h-8 w-8 text-gray-300" />
                        </div>
                        <h4 className="text-gray-900 font-bold">No reviews yet</h4>
                        <p className="text-gray-500 text-sm">Be the first to share your experience!</p>
                    </div>
                ) : (
                    reviews.map((review) => (
                        <ReviewCard
                            key={review.id || review._id}
                            review={{
                                ...review,
                                id: review.id || review._id,
                                isOwnReview: (() => {
                                    const reviewPatId = typeof review.patientId === 'object'
                                        ? (review.patientId._id || review.patientId.id)
                                        : review.patientId;
                                    return String(reviewPatId) === String(currentUserId);
                                })()
                            }}
                            onEdit={() => {
                                setEditingReview(review);
                                setIsFormOpen(true);
                            }}
                            onDelete={() => handleDeleteClick(review.id || review._id)}
                        />
                    ))
                )}
            </div>

            {/* Review Form Modal */}
            <ReviewForm
                isOpen={isFormOpen}
                onClose={() => {
                    setIsFormOpen(false);
                    setEditingReview(null);
                }}
                onSubmit={editingReview ? handleEditReview : handleAddReview}
                initialData={editingReview ? { rating: editingReview.rating, comment: editingReview.comment } : undefined}
                title={editingReview ? "Edit Your Feedback" : "Add Your Feedback"}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Review"
                description="Are you sure you want to delete this review? This action cannot be undone."
                onConfirm={confirmDelete}
                confirmText="Delete"
                cancelText="Cancel"
                variant="destructive"
            />
        </div>
    );
};

export default ReviewsList;
