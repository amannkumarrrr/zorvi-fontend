import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatINR, getOriginalPrice } from '../utils/formatters';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const Wishlist = () => {
  const navigate = useNavigate();
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const handleMoveToCart = async (product) => {
    if (!isAuthenticated) {
      addToast('Please log in or create an account to access your cart.', 'warning');
      navigate('/login', {
        state: {
          from: '/wishlist',
          message: 'Please log in or create an account to add items to your cart.',
        },
      });
      return;
    }

    const res = await addToCart(product, 1);
    if (res?.success !== false) {
      removeFromWishlist(product.id);
    }
  };

  const handleAddAllToCart = async () => {
    if (!isAuthenticated) {
      addToast('Please log in or create an account to access your cart.', 'warning');
      navigate('/login', {
        state: {
          from: '/wishlist',
          message: 'Please log in or create an account to add items to your cart.',
        },
      });
      return;
    }

    for (const product of wishlistItems) {
      await addToCart(product, 1);
    }
  };

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs items={[{ label: 'Wishlist' }]} />

          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 sm:p-20 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Heart className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Your Wishlist is Empty</h2>
            <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Explore our curated collections and save your favorite electronics, beauty essentials, and home decor items.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-teal-500/20 active:scale-95"
            >
              <span>Explore Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Wishlist' }]} />

        {/* Wishlist Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200/80 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Saved Items</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Items saved here are stored in your browser LocalStorage and will persist across sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddAllToCart}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Add All to Cart</span>
            </button>
            <button
              onClick={clearWishlist}
              className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Wishlist</span>
            </button>
          </div>
        </div>

        {/* Saved Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {wishlistItems.map((item) => {
            const originalUSD = getOriginalPrice(item.price, item.discountPercentage);

            return (
              <div
                key={item.id}
                className="group bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:shadow-lg transition-all duration-200 relative"
              >
                <div>
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="absolute top-3 right-3 z-10 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-full border border-slate-200 shadow-sm transition"
                    aria-label={`Remove ${item.title} from wishlist`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Thumbnail */}
                  <Link to={`/products/${item.id}`} className="block">
                    <div className="aspect-square w-full bg-slate-50 rounded-xl overflow-hidden mb-3 p-3 flex items-center justify-center">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform"
                      />
                    </div>
                  </Link>

                  {/* Category & Title */}
                  <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded">
                    {item.category || 'Item'}
                  </span>
                  <Link to={`/products/${item.id}`}>
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition line-clamp-2 mt-1 mb-2">
                      {item.title}
                    </h3>
                  </Link>
                </div>

                {/* Price & Action */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-base font-bold text-slate-900">
                      {formatINR(item.price)}
                    </span>
                    {item.discountPercentage > 0 && (
                      <span className="text-xs text-slate-400 line-through">
                        {formatINR(originalUSD)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleMoveToCart(item)}
                    className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
