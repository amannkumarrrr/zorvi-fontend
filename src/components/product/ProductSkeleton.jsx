import React from 'react';

export const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 flex flex-col justify-between animate-pulse">
      <div>
        {/* Image skeleton */}
        <div className="w-full aspect-square bg-slate-100 rounded-xl mb-3 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>

        {/* Category & Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="h-3 w-16 bg-slate-200 rounded-full" />
          <div className="h-3 w-12 bg-slate-200 rounded-full" />
        </div>

        {/* Title */}
        <div className="h-4 bg-slate-200 rounded w-11/12 mb-1.5" />
        <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="h-3.5 w-20 bg-slate-200 rounded" />
          <div className="h-3.5 w-8 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Price & Action Button */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
        <div className="space-y-1">
          <div className="h-5 w-20 bg-slate-200 rounded" />
          <div className="h-3 w-14 bg-slate-200 rounded" />
        </div>
        <div className="h-9 w-9 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
};

export default ProductSkeleton;
