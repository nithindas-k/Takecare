import React from 'react';
import { FaTrash, FaEdit } from 'react-icons/fa';
import StarRating from './StarRating';
import { format } from 'date-fns';
import { API_BASE_URL } from '../../utils/constants';

interface ReviewCardProps {
    review: {
        id: string;
        patientId: {
            name: string;
            profileImage?: string;
        };
        rating: number;
        comment: string;
        createdAt: string;
        isOwnReview?: boolean;
    };
    onEdit?: () => void;
    onDelete?: () => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onEdit, onDelete }) => {
    const getAvatarUrl = (path?: string) => {
        if (!path) return `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.patientId.name}`;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}/${path.replace(/\\/g, '/')}`;
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                    <img
                        src={getAvatarUrl(review.patientId.profileImage)}
                        alt={review.patientId.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-100"
                    />
                    <div>
                        <h4 className="font-bold text-gray-800 text-sm">{review.patientId.name}</h4>
                        <div className="flex items-center gap-2">
                            <StarRating rating={review.rating} readonly size={14} />
                            <span className="text-gray-400 text-[10px]">
                                {format(new Date(review.createdAt), 'dd MMM yyyy')}
                            </span>
                        </div>
                    </div>
                </div>

                {review.isOwnReview && (
                    <div className="flex gap-2">
                        <button
                            onClick={onEdit}
                            className="p-2 text-gray-400 hover:text-[#00A1B0] hover:bg-[#00A1B0]/10 rounded-full transition-all"
                            title="Edit Review"
                        >
                            <FaEdit size={14} />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                            title="Delete Review"
                        >
                            <FaTrash size={14} />
                        </button>
                    </div>
                )}
            </div>

            <p className="text-gray-600 text-sm leading-relaxed italic">
                "{review.comment}"
            </p>
        </div>
    );
};

export default ReviewCard;
