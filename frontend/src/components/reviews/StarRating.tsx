import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    size?: number;
    readonly?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
    rating,
    onRatingChange,
    size = 20,
    readonly = false
}) => {
    const [hover, setHover] = useState<number | null>(null);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const ratingValue = star;
                return (
                    <label key={star} className={readonly ? "cursor-default" : "cursor-pointer"}>
                        <input
                            type="radio"
                            className="hidden"
                            value={ratingValue}
                            onClick={() => !readonly && onRatingChange?.(ratingValue)}
                        />
                        <FaStar
                            size={size}
                            className={`transition-colors duration-200 ${ratingValue <= (hover || rating)
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                            onMouseEnter={() => !readonly && setHover(ratingValue)}
                            onMouseLeave={() => !readonly && setHover(null)}
                        />
                    </label>
                );
            })}
        </div>
    );
};

export default StarRating;
