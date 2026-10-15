import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  X,
  Search,
  RotateCcw,
  ChevronDown,
  Star,
  Check,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import productApi from '../services/productApi';
import ProductGrid from '../components/product/ProductGrid';
import Breadcrumbs from '../components/common/Breadcrumbs';
import { toINRNumber, formatINR } from '../utils/formatters';

export const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const categoryFromUrl = searchParams.get('category') || 'all';
  const searchFromUrl = searchParams.get('search') || '';

  // Local component states
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Sort states
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl);
  const [searchQuery, setSearchQuery] = useState(searchFromUrl);
  const [selectedRating, setSelectedRating] = useState(0); // 0 = all
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 });
  const [sortBy, setSortBy] = useState('default');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Sync with URL params
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
    setCurrentPage(1);
  }, [searchParams]);

  // Load categories
  useEffect(() => {
    productApi
      .getCategories()
      .then((cats) => {
        setCategories(cats || []);
      })
      .catch(console.error);
  }, []);

  // Fetch product dataset from API (DummyJSON)
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      let data;
      if (searchQuery.trim()) {
        // If searching
        data = await productApi.searchProducts(searchQuery.trim(), { limit: 0 });
      } else if (selectedCategory && selectedCategory !== 'all') {
        // If category selected
        data = await productApi.getProductsByCategory(selectedCategory, { limit: 0 });
      } else {
        // All products (limit: 0 retrieves all products)
        data = await productApi.getAllProducts(0);
      }

      setProducts(data.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      setError('Failed to retrieve products from the catalog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  // Client-side filtering & sorting for price, rating, and sort order
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // Filter by Rating
    if (selectedRating > 0) {
      result = result.filter((p) => (p.rating || 0) >= selectedRating);
    }

    // Filter by Price Range (INR)
    result = result.filter((p) => {
      const priceINR = toINRNumber(p.price);
      return priceINR >= priceRange.min && priceINR <= priceRange.max;
    });

    // Sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => toINRNumber(a.price) - toINRNumber(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => toINRNumber(b.price) - toINRNumber(a.price));
        break;
      case 'rating-desc':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title-asc':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      default:
        // Default API order
        break;
    }

    return result;
  }, [products, selectedRating, priceRange, sortBy]);

  // Paginated slice
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);

  // Clear all filters
  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedRating(0);
    setPriceRange({ min: 0, max: 200000 });
    setSortBy('default');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleCategorySelect = (slug) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', slug);
    }
    setSearchParams(newParams);
    setIsMobileFilterOpen(false);
  };

  const activeFilterCount =
    (selectedCategory !== 'all' ? 1 : 0) +
    (searchQuery ? 1 : 0) +
    (selectedRating > 0 ? 1 : 0) +
    (priceRange.min > 0 || priceRange.max < 200000 ? 1 : 0);

  // Filter Sidebar Content Component
  const FilterSidebarContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center justify-between">
          <span>Categories</span>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => handleCategorySelect('all')}
              className="text-teal-700 text-[11px] font-semibold hover:underline"
            >
              Reset
            </button>
          )}
        </h4>
        <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
          <button
            onClick={() => handleCategorySelect('all')}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
              selectedCategory === 'all'
                ? 'bg-teal-50 text-teal-800 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
            {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-teal-700" />}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between ${
                selectedCategory === cat.slug
                  ? 'bg-teal-50 text-teal-800 font-bold'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{cat.name}</span>
              {selectedCategory === cat.slug && <Check className="w-3.5 h-3.5 text-teal-700" />}
            </button>
          ))}
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Price Range Filter */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Price Range
          </h4>
          <span className="text-xs text-slate-500 font-medium">
            {formatINR(priceRange.max / 80)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="200000"
          step="1000"
          value={priceRange.max}
          onChange={(e) => setPriceRange((prev) => ({ ...prev, max: Number(e.target.value) }))}
          className="w-full accent-teal-600 cursor-pointer"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>₹0</span>
          <span>₹2,00,000</span>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* Customer Rating Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
          Customer Rating
        </h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((stars) => (
            <button
              key={stars}
              onClick={() => setSelectedRating(selectedRating === stars ? 0 : stars)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition ${
                selectedRating === stars
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-200'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-100'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium text-slate-700">&amp; up</span>
              </div>
              {selectedRating === stars && <Check className="w-3.5 h-3.5 text-teal-700" />}
            </button>
          ))}
        </div>
      </div>

      {/* Reset All Button */}
      {activeFilterCount > 0 && (
        <button
          onClick={handleClearFilters}
          className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            ...(selectedCategory !== 'all'
              ? [{ label: selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1) }]
              : []),
          ]}
        />

        {/* Catalog Banner & Demo Store Disclaimer */}
        <div className="my-4 bg-sky-50/80 border border-sky-100 rounded-2xl p-4 text-xs text-sky-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <p className="font-bold text-sky-950">ZORVI Product Catalog</p>
              <p className="text-sky-700 text-[11px] mt-0.5">
                Authentic product dataset powered by DummyJSON. Interactive demo checkout simulation.
              </p>
            </div>
          </div>
          <span className="bg-sky-100 text-sky-800 font-semibold px-3 py-1 rounded-full text-[11px] w-fit shrink-0">
            {products.length} Products Available
          </span>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200/80 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {searchQuery
                ? `Results for "${searchQuery}"`
                : selectedCategory !== 'all'
                ? categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory
                : 'All Products'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Showing {filteredAndSortedProducts.length} curated products
            </p>
          </div>

          {/* Controls: Sort Dropdown & Mobile Filter Trigger */}
          <div className="flex items-center gap-3">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-sm hover:bg-slate-50"
            >
              <SlidersHorizontal className="w-4 h-4 text-teal-600" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Sorting Dropdown */}
            <div className="relative flex items-center">
              <span className="text-xs text-slate-400 mr-2 hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3.5 py-2.5 outline-none focus:border-teal-500 shadow-sm cursor-pointer"
              >
                <option value="default">Featured / Popular</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="title-asc">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs text-slate-400 font-medium">Active filters:</span>
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                Category: {selectedCategory}
                <button
                  onClick={() => handleCategorySelect('all')}
                  className="hover:text-teal-900"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200 rounded-full text-xs font-medium">
                Search: "{searchQuery}"
                <button
                  onClick={() => {
                    setSearchQuery('');
                    const np = new URLSearchParams(searchParams);
                    np.delete('search');
                    setSearchParams(np);
                  }}
                  className="hover:text-teal-900"
                  aria-label="Remove search filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedRating > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-medium">
                {selectedRating}★ &amp; up
                <button
                  onClick={() => setSelectedRating(0)}
                  className="hover:text-amber-950"
                  aria-label="Remove rating filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={handleClearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Main Products Grid with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-28 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-100">
                <Filter className="w-4 h-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">Filter Products</h3>
              </div>
              <FilterSidebarContent />
            </div>
          </aside>

          {/* Product Listing Area */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={paginatedProducts}
              loading={loading}
              error={error}
              onRetry={fetchProducts}
              emptyTitle="No matching products found"
              emptyMessage="We couldn't find any products matching your selected filters. Try broadening your criteria or reset filters."
              onClearFilters={handleClearFilters}
              skeletonCount={12}
            />

            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-slide-up">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900 text-base">Filters</h3>
                </div>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <FilterSidebarContent />
            </div>

            <div className="pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
