import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Truck,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Clock,
  ChevronRight,
  PackageCheck,
  PackageX,
  Star,
  Trash2,
  Send,
  MessageSquare,
} from 'lucide-react';
import productApi, { NEUTRAL_FALLBACK_IMAGE } from '../services/productApi';
import { formatINR, getOriginalPrice, toINRNumber, formatDate } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage';
import RatingStars from '../components/common/RatingStars';
import Breadcrumbs from '../components/common/Breadcrumbs';
import ProductCard from '../components/product/ProductCard';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // MongoDB reviews state
  const [mongoReviews, setMongoReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0, ratingDistribution: {} });
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [hoverRating, setHoverRating] = useState(0);
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadReviews = async () => {
    try {
      const res = await productApi.getProductReviews(id);
      if (res && res.success && res.data) {
        setMongoReviews(res.data.reviews || []);
        setReviewStats(res.data.stats || { totalReviews: 0, averageRating: 0, ratingDistribution: {} });
      }
    } catch (err) {
      console.warn('Could not load MongoDB reviews:', err);
    }
  };

  useEffect(() => {
    if (id) loadReviews();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Please sign in to write a review.', 'info');
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }

    if (!reviewForm.comment.trim() || reviewForm.comment.trim().length < 5) {
      addToast('Please write a review comment with at least 5 characters.', 'warning');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await productApi.submitReview(id, reviewForm);
      if (res.success) {
        addToast(res.message || 'Review published successfully!', 'success');
        setReviewForm({ rating: 5, title: '', comment: '' });
        setIsReviewFormOpen(false);
        loadReviews();
      }
    } catch (err) {
      addToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await productApi.deleteReview(reviewId);
      if (res.success) {
        addToast('Review deleted', 'info');
        loadReviews();
      }
    } catch (err) {
      addToast(err.message || 'Failed to delete review', 'error');
    }
  };

  // Delivery pin code check mockup state
  const [pinCode, setPinCode] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState(null);

  // Added to cart visual feedback
  const [isAdded, setIsAdded] = useState(false);

  // Fetch product data
  useEffect(() => {
    let mounted = true;

    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        setQuantity(1);

        const data = await productApi.getProductById(id);
        if (!mounted) return;

        setProduct(data);
        setSelectedImage(data.thumbnail || data.images?.[0] || '');

        // Save to Recently Viewed in LocalStorage
        const existingRecent = getFromStorage(STORAGE_KEYS.RECENTLY_VIEWED, []);
        const filtered = existingRecent.filter((item) => item.id !== data.id);
        saveToStorage(STORAGE_KEYS.RECENTLY_VIEWED, [data, ...filtered].slice(0, 8));

        // Fetch related products from the same category
        if (data.category) {
          productApi
            .getProductsByCategory(data.category, { limit: 5 })
            .then((res) => {
              if (mounted) {
                const others = (res.products || []).filter((p) => p.id !== data.id).slice(0, 4);
                setRelatedProducts(others);
              }
            })
            .catch(console.error);
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
        if (mounted) {
          setError('Product not found or unavailable. Please return to the store catalog.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchProductDetails();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 rounded mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6 space-y-4">
            <div className="aspect-square w-full bg-slate-200 rounded-3xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-slate-200 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-8 w-3/4 bg-slate-200 rounded" />
            <div className="h-4 w-32 bg-slate-200 rounded" />
            <div className="h-10 w-44 bg-slate-200 rounded" />
            <div className="h-24 bg-slate-200 rounded" />
            <div className="h-12 w-full bg-slate-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'The product you are looking for does not exist.'}</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm rounded-xl transition"
        >
          Return to All Products
        </Link>
      </div>
    );
  }

  const {
    title,
    description,
    price,
    discountPercentage,
    rating,
    stock,
    brand,
    category,
    images = [],
    sku,
    weight,
    dimensions,
    warrantyInformation,
    shippingInformation,
    availabilityStatus,
    reviews = [],
  } = product;

  const originalPriceUSD = getOriginalPrice(price, discountPercentage);
  const savedInWishlist = isInWishlist(product.id);
  const isOutOfStock = stock <= 0;
  const maxStock = Math.min(stock || 20, 10);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      addToast('Please log in or create an account to access your cart.', 'warning');
      navigate('/login', {
        state: {
          from: `/products/${id}`,
          message: 'Please log in or create an account to add items to your cart.',
        },
      });
      return;
    }

    const res = await addToCart(product, quantity);
    if (res?.success !== false) {
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      addToast('Please log in or create an account to proceed to checkout.', 'warning');
      navigate('/login', {
        state: {
          from: `/products/${id}`,
          message: 'Please log in or create an account to proceed to checkout.',
        },
      });
      return;
    }

    addToCart(product, quantity);
    navigate('/checkout');
  };

  const handlePinCodeCheck = (e) => {
    e.preventDefault();
    if (pinCode.trim().length === 6 && /^\d+$/.test(pinCode.trim())) {
      setDeliveryStatus({
        success: true,
        message: `Delivery available for ${pinCode}! Estimated arrival in 2 business days.`,
      });
    } else {
      setDeliveryStatus({
        success: false,
        message: 'Please enter a valid 6-digit Indian PIN code.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Breadcrumb Trail */}
        <Breadcrumbs
          items={[
            { label: 'Products', to: '/products' },
            {
              label: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Catalog',
              to: `/products?category=${category}`,
            },
            { label: title },
          ]}
        />

        {/* Main Product Container */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 lg:p-10 shadow-sm mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
            
            {/* Left: Gallery Section */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center p-6 group">
                {discountPercentage > 0 && (
                  <span className="absolute top-4 left-4 z-10 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm">
                    {Math.round(discountPercentage)}% OFF
                  </span>
                )}

                <button
                  onClick={() => toggleWishlist(product)}
                  className={`absolute top-4 right-4 z-10 p-3 rounded-full transition-all duration-200 shadow-md ${
                    savedInWishlist
                      ? 'bg-rose-50 text-rose-500 border border-rose-200'
                      : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-100'
                  }`}
                  aria-label="Wishlist toggle"
                >
                  <Heart
                    className={`w-5 h-5 transition-transform active:scale-125 ${
                      savedInWishlist ? 'fill-rose-500 text-rose-500' : ''
                    }`}
                  />
                </button>

                <img
                  src={selectedImage}
                  alt={title}
                  onError={(e) => {
                    e.target.src = NEUTRAL_FALLBACK_IMAGE;
                  }}
                  className="w-full h-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Thumbnails Gallery */}
              {images && images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-50 p-1.5 border-2 transition shrink-0 ${
                        selectedImage === img
                          ? 'border-teal-600 shadow-sm'
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${title} view ${idx + 1}`}
                        onError={(e) => {
                          e.target.src = NEUTRAL_FALLBACK_IMAGE;
                        }}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Info & Actions */}
            <div className="lg:col-span-6 flex flex-col justify-between">
              <div>
                {/* Brand & Stock Status */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-1 rounded-md">
                    {brand || 'ZORVI Selected'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {isOutOfStock ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <PackageX className="w-3.5 h-3.5" /> Out of stock
                      </span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md">
                        <PackageCheck className="w-3.5 h-3.5" />
                        {availabilityStatus || `${stock} in stock`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug mb-3">
                  {title}
                </h1>

                {/* Rating & Reviews Bar */}
                <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
                  <RatingStars rating={rating} reviewCount={reviews.length || 38} size="md" />
                  <span className="text-slate-300">|</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Category: <strong className="text-slate-800 capitalize">{category}</strong>
                  </span>
                </div>

                {/* Price Display */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100/80">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                      {formatINR(price)}
                    </span>
                    {discountPercentage > 0 && (
                      <>
                        <span className="text-base text-slate-400 line-through font-medium">
                          {formatINR(originalPriceUSD)}
                        </span>
                        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                          Save {Math.round(discountPercentage)}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Free shipping on eligible orders. Fast delivery within 2-4 business days.
                  </p>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Description
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Quantity Selector */}
                {!isOutOfStock && (
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <button
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-slate-800">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                        disabled={quantity >= maxStock}
                        className="p-2.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-xs text-slate-400">
                      (Max {maxStock} per order)
                    </span>
                  </div>
                )}

                {/* Add to Cart & Buy Now Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-500/20'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-white" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={isOutOfStock}
                    className="flex-1 py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Instant Checkout</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* PIN Code Delivery Checker Placeholder */}
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Check Delivery Availability</span>
                  </div>
                  <form onSubmit={handlePinCodeCheck} className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="Enter 6-digit PIN (e.g. 110001)"
                      className="flex-1 bg-white border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:border-teal-500 text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl transition"
                    >
                      Check
                    </button>
                  </form>
                  {deliveryStatus && (
                    <p
                      className={`text-xs mt-2 font-medium flex items-center gap-1.5 ${
                        deliveryStatus.success ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {deliveryStatus.success ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{deliveryStatus.message}</span>
                    </p>
                  )}
                </div>

                {/* Trust Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4 border-t border-slate-100 text-slate-600 text-xs sm:text-[11px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{warrantyInformation || '1 Year Brand Warranty'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>7-Day Replacement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>{shippingInformation || 'Standard 2-4 Days'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Specifications Table */}
          <div className="mt-14 pt-10 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              Product Specifications &amp; Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex justify-between p-3.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Brand</span>
                  <span className="font-semibold text-slate-800">{brand || 'ZORVI'}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Category</span>
                  <span className="font-semibold text-slate-800 capitalize">{category}</span>
                </div>
                <div className="flex justify-between p-3.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">SKU</span>
                  <span className="font-semibold text-slate-800">{sku || `ZORVI-${product.id}`}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Weight</span>
                  <span className="font-semibold text-slate-800">{weight ? `${weight} kg` : 'Standard packaging'}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="flex justify-between p-3.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Warranty</span>
                  <span className="font-semibold text-slate-800">{warrantyInformation || '12-Month Guarantee'}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Shipping Info</span>
                  <span className="font-semibold text-slate-800">{shippingInformation || 'Ships within 24 hours'}</span>
                </div>
                <div className="flex justify-between p-3.5 bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Availability</span>
                  <span className="font-semibold text-slate-800">{availabilityStatus || 'Ready to dispatch'}</span>
                </div>
                <div className="flex justify-between p-3.5">
                  <span className="text-slate-500 font-medium">Dimensions</span>
                  <span className="font-semibold text-slate-800">
                    {dimensions ? `${dimensions.width} x ${dimensions.height} x ${dimensions.depth} cm` : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Reviews & Ratings Section */}
          <div className="mt-14 pt-10 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-teal-600" />
                  <span>Customer Reviews &amp; Ratings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mongoReviews.length + (reviews?.length || 0)} customer rating{mongoReviews.length + (reviews?.length || 0) === 1 ? '' : 's'} &bull; Verified store reviews
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      addToast('Please sign in to write a review.', 'info');
                      navigate('/login', { state: { from: `/products/${id}` } });
                    } else {
                      setIsReviewFormOpen(!isReviewFormOpen);
                    }
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-teal-200 fill-teal-200" />
                  <span>{isReviewFormOpen ? 'Close Form' : 'Write a Review'}</span>
                </button>
              </div>
            </div>

            {/* Review Submission Form Modal / Box */}
            {isReviewFormOpen && (
              <form onSubmit={handleSubmitReview} className="mt-6 p-6 bg-slate-50/80 border border-teal-100 rounded-3xl space-y-4 animate-fade-in shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900">Share Your Experience</h4>
                  <span className="text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                    Posting as {user?.name || 'Customer'}
                  </span>
                </div>

                {/* Star rating selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Overall Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || reviewForm.rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                          className="p-1 hover:scale-110 transition"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              active ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {reviewForm.rating} Star{reviewForm.rating > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Review Headline/Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Review Headline (Optional)</label>
                  <input
                    type="text"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Excellent quality, fast delivery!"
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500"
                    maxLength={100}
                  />
                </div>

                {/* Review Comment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Written Review</label>
                  <textarea
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                    placeholder="What did you like or dislike about this product? How was the fit and performance?"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-teal-500 resize-none"
                    minLength={5}
                    maxLength={1000}
                    required
                  />
                  <span className="text-[10px] text-slate-400 block text-right">
                    {reviewForm.comment.length}/1000 characters
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview || reviewForm.comment.trim().length < 5}
                    className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-sm"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish Review</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Combined Reviews Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Verified MongoDB User Reviews */}
              {mongoReviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-5 rounded-3xl bg-white border border-teal-100 shadow-sm flex flex-col justify-between hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <RatingStars rating={rev.rating} showNumber={false} size="xs" />
                      <span className="text-[10px] text-slate-400">
                        {formatDate(rev.createdAt)}
                      </span>
                    </div>

                    {rev.title && (
                      <h5 className="text-xs font-bold text-slate-900 mb-1">{rev.title}</h5>
                    )}

                    <p className="text-xs text-slate-700 leading-relaxed mb-3">"{rev.comment}"</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {rev.userName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 block leading-tight">
                          {rev.userName}
                        </span>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>

                    {(user?._id === rev.userId || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteReview(rev._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition"
                        title="Delete Review"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* 2. DummyJSON Catalog Baseline Reviews */}
              {reviews && reviews.map((rev, index) => (
                <div
                  key={`dummy-${index}`}
                  className="p-5 rounded-3xl bg-slate-50/80 border border-slate-200/80 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <RatingStars rating={rev.rating} showNumber={false} size="xs" />
                      <span className="text-[10px] text-slate-400">
                        {formatDate(rev.date)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic mb-3">"{rev.comment}"</p>
                  </div>
                  <div className="pt-3 border-t border-slate-200/60 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                      {rev.reviewerName?.charAt(0) || 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {rev.reviewerName}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {mongoReviews.length === 0 && (!reviews || reviews.length === 0) && (
              <div className="text-center py-10 text-slate-400 text-xs">
                No reviews yet. Be the first to share your review for this product!
              </div>
            )}
          </div>
        </div>

        {/* Related Products Carousel / Grid */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Related Products in {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Store'}
              </h3>
              <Link
                to={`/products?category=${category}`}
                className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
              >
                <span>View More</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel.id} product={rel} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
