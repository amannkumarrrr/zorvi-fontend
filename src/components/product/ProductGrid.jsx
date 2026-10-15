import React from 'react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import { PackageX, RotateCcw } from 'lucide-react';

export const ProductGrid = ({
  products = [],
  loading = false,
  error = null,
  onRetry = null,
  skeletonCount = 8,
  emptyTitle = 'No products found',
  emptyMessage = 'We could not find any products matching your criteria.',
  onClearFilters = null,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
        {Array.from({ length: skeletonCount }).map((_, idx) => (
          <ProductSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50/50 border border-rose-200/60 rounded-2xl p-8 sm:p-12 text-center my-6 max-w-lg mx-auto">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <PackageX className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Unable to load products</h3>
        <p className="text-sm text-slate-600 mb-6">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 sm:p-16 text-center my-8 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <PackageX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{emptyTitle}</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
          {emptyMessage}
        </p>
        {onClearFilters && (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition shadow-sm"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
