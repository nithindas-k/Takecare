import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import StarRating from './StarRating';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

interface ReviewFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { rating: number; comment: string }) => void;
    initialData?: { rating: number; comment: string };
    title?: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    title = "Add Your Review"
}) => {
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [comment, setComment] = useState(initialData?.comment || "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (initialData) {
            setRating(initialData.rating);
            setComment(initialData.comment);
        }
    }, [initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }
        if (comment.trim().length < 10) {
            setError("Comment must be at least 10 characters");
            return;
        }
        setError("");
        onSubmit({ rating, comment });
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">How would you rate your experience?</label>
                                <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
                                    <StarRating rating={rating} onRatingChange={setRating} size={32} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700">Share your thoughts</label>
                                <Textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Tell others about your consultation..."
                                    className="min-h-[120px] resize-none focus-visible:ring-[#00A1B0]/20 rounded-xl"
                                />
                            </div>

                            {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1 rounded-xl h-11 text-gray-500"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-[#00A1B0] hover:bg-[#008f9c] rounded-xl h-11"
                                >
                                    Submit Review
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReviewForm;
