import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { formatINR, getOriginalPrice } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { NEUTRAL_FALLBACK_IMAGE } from '../../services/productApi';
import RatingStars from '../common/RatingStars';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [imageError, setImageError] = useState(false);
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  if (!product) return null;

  const {
    id,
    title,
    price,
    discountPercentage,
    thumbnail,
    images,
    category,
    brand,
    rating,
    reviews,
  } = product;

  const savedInWishlist = isInWishlist(id);
  const originalPriceUSD = getOriginalPrice(price, discountPercentage);
  const hasDiscount = discountPercentage && Number(discountPercentage) > 0;
  const reviewCount = reviews ? reviews.length : Math.round((rating || 4.2) * 18);

  const displayImage = !imageError && (thumbnail || images?.[0]) 
    ? (thumbnail || images?.[0])
    : NEUTRAL_FALLBACK_IMAGE;

  const handleCardClick = () => {
    navigate(`/products/${id}`);
  };

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      addToast('Please log in or create an account to access your cart.', 'warning');
      navigate('/login', {
        state: {
          from: location.pathname + location.search,
          message: 'Please log in or create an account to add items to your cart.',
        },
      });
      return;
    }

    const res = await addToCart(product, 1);
    if (res?.success !== false) {
      setIsAddedFeedback(true);
      setTimeout(() => {
        setIsAddedFeedback(false);
      }, 1200);
    }
  };

  const handleToggleWishlist = (e) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl border border-slate-200/80 hover:border-teal-500/30 p-3.5 sm:p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 cursor-pointer"
      role="article"
      aria-label={title}
    >
      <div>
        {/* Top Badges & Wishlist Button */}
        <div className="relative aspect-square w-full bg-slate-50 rounded-xl overflow-hidden mb-3.5 flex items-center justify-center p-3">
          {/* Discount Badge */}
          {hasDiscount && (
            <span className="absolute top-2.5 left-2.5 z-10 bg-rose-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md shadow-sm tracking-wide">
              {Math.round(discountPercentage)}% OFF
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            aria-label={savedInWishlist ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
            className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full transition-all duration-200 shadow-sm ${
              savedInWishlist
                ? 'bg-rose-50 text-rose-500 border border-rose-200'
                : 'bg-white/90 text-slate-400 hover:text-rose-500 hover:bg-white border border-slate-100'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform active:scale-125 ${
                savedInWishlist ? 'fill-rose-500 text-rose-500' : ''
              }`}
            />
          </button>

          {/* Product Image */}
          <img
            src={displayImage}
            alt={title}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300 ease-out"
          />
        </div>

        {/* Brand & Category Info */}
        <div className="flex items-center justify-between gap-2 mb-1.5 text-xs text-slate-400">
          <span className="font-medium text-teal-700 uppercase tracking-wider text-[10px] bg-teal-50 px-2 py-0.5 rounded">
            {category || 'Collection'}
          </span>
          {brand && (
            <span className="truncate max-w-[120px] text-slate-400 font-medium text-[11px]">
              {brand}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-sm sm:text-base text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug mb-2">
          {title}
        </h3>

        {/* Rating Stars & Stock info */}
        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={rating} reviewCount={reviewCount} size="xs" />
          {product.stock === 0 || product.isInStock === false ? (
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              Out of Stock
            </span>
          ) : product.stock <= 5 ? (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Only {product.stock} left
            </span>
          ) : null}
        </div>
      </div>

      {/* Pricing & Add To Cart */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
        <div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {formatINR(price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through">
                {formatINR(originalPriceUSD)}
              </span>
            )}
          </div>
          <p className="text-[10px] text-emerald-600 font-medium">Free Delivery eligible</p>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || product.isInStock === false}
          aria-label={`Add ${title} to cart`}
          className={`shrink-0 p-2.5 sm:p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
            isAddedFeedback
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 hover:bg-teal-700 text-white'
          }`}
          title={product.stock === 0 || product.isInStock === false ? 'Out of stock' : 'Add to cart'}
        >
          {isAddedFeedback ? (
            <>
              <Check className="w-4 h-4 text-white" />
              <span className="text-xs font-medium hidden sm:inline">Added</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4 text-white" />
              <span className="text-xs font-medium hidden sm:inline">Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
