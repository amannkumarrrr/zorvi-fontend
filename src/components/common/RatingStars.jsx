import React from 'react';
import { Star } from 'lucide-react';

export const RatingStars = ({ rating = 0, reviewCount = null, size = 'sm', showNumber = true }) => {
  const numericRating = Math.min(5, Math.max(0, Number(rating) || 0));
  const starSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-1.5" aria-label={`Rating: ${numericRating.toFixed(1)} out of 5 stars`}>
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = numericRating >= star;
          const half = !filled && numericRating >= star - 0.5;

          return (
            <div key={star} className="relative">
              <Star
                className={`${starSize} ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : half
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'text-slate-200 fill-slate-100'
                }`}
              />
            </div>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-xs font-semibold text-slate-700 ml-0.5">
          {numericRating.toFixed(1)}
        </span>
      )}

      {reviewCount !== null && (
        <span className="text-xs text-slate-400 font-normal">
          ({reviewCount})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
