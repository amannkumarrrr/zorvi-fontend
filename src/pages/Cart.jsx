import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Tag,
  Check,
  Truck,
  ArrowLeft,
  X,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatINR, toINRNumber, getOriginalPrice } from '../utils/formatters';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    subtotalINR,
    originalTotalINR,
    catalogDiscountINR,
    deliveryFeeINR,
    freeDeliveryThreshold,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponDiscountINR,
    finalTotalINR,
  } = useCart();

  const [couponCodeInput, setCouponCodeInput] = useState('');

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (applyCoupon(couponCodeInput)) {
      setCouponCodeInput('');
    }
  };

  const amountNeededForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotalINR);
  const freeDeliveryProgress = Math.min(100, (subtotalINR / freeDeliveryThreshold) * 100);

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs items={[{ label: 'Cart' }]} />

          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 sm:p-20 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Your Cart is Empty</h2>
            <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
              Looks like you haven't added anything to your cart yet. Discover trending deals and gadgets now.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl transition shadow-md shadow-teal-500/20 active:scale-95"
            >
              <span>Start Shopping</span>
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
        <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />

        {/* Page Title & Clear Cart */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-slate-200/80 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Shopping Cart</span>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Review your items and proceed to demo checkout.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="text-xs font-semibold text-slate-600 hover:text-teal-700 flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
            <span className="text-slate-300">|</span>
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Cart</span>
            </button>
          </div>
        </div>

        {/* Free Delivery Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-8 shadow-sm">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1 text-xs font-semibold mb-2">
            <div className="flex items-center gap-2 text-slate-800">
              <Truck className="w-4 h-4 text-teal-600" />
              {amountNeededForFreeDelivery > 0 ? (
                <span>
                  Add <strong className="text-teal-700">₹{amountNeededForFreeDelivery}</strong> more to unlock <strong className="text-emerald-700">FREE Express Delivery!</strong>
                </span>
              ) : (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> You've unlocked FREE Express Delivery!
                </span>
              )}
            </div>
            <span className="text-slate-400">{Math.round(freeDeliveryProgress)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${freeDeliveryProgress}%` }}
            />
          </div>
        </div>

        {/* Cart Layout: Two Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 divide-y divide-slate-100">
              {cartItems.map((item) => {
                const itemTotalINR = toINRNumber(item.price) * item.quantity;
                const unitOriginalUSD = getOriginalPrice(item.price, item.discountPercentage);

                return (
                  <div
                    key={item.id}
                    className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    {/* Image & Title */}
                    <div className="flex items-center gap-4 flex-1">
                      <Link
                        to={`/products/${item.id}`}
                        className="w-20 h-20 bg-slate-50 rounded-2xl p-2 shrink-0 border border-slate-100 flex items-center justify-center overflow-hidden"
                      >
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </Link>

                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wide bg-teal-50 px-2 py-0.5 rounded">
                          {item.brand || item.category}
                        </span>
                        <Link to={`/products/${item.id}`}>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 hover:text-teal-700 transition line-clamp-1">
                            {item.title}
                          </h3>
                        </Link>
                        <div className="flex items-baseline gap-2 text-xs">
                          <span className="font-semibold text-slate-800">
                            {formatINR(item.price)} each
                          </span>
                          {item.discountPercentage > 0 && (
                            <span className="text-slate-400 line-through">
                              {formatINR(unitOriginalUSD)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Quantity & Item Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Quantity Controls */}
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden shadow-inner">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 text-slate-600 hover:bg-slate-200 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.stock || 50)}
                          className="p-2 text-slate-600 hover:bg-slate-200 disabled:opacity-40 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right min-w-[80px]">
                        <span className="block text-base font-bold text-slate-900">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(itemTotalINR)}
                        </span>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition hover:bg-rose-50"
                        aria-label={`Remove ${item.title} from cart`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & Coupon */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-28">
              <h2 className="text-lg font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                Order Summary
              </h2>

              {/* Coupon Form */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Apply Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{appliedCoupon.code} applied</span>
                      <span className="text-[11px] font-normal text-emerald-600">
                        ({appliedCoupon.description})
                      </span>
                    </div>
                    <button
                      onClick={removeCoupon}
                      className="text-emerald-700 hover:text-rose-600 p-1"
                      aria-label="Remove coupon"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="e.g. ZORVI10"
                      className="flex-1 bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs rounded-xl outline-none focus:border-teal-500 uppercase font-semibold text-slate-800"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition"
                    >
                      Apply
                    </button>
                  </form>
                )}
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => applyCoupon('ZORVI10')}
                    className="text-[11px] text-teal-700 font-semibold underline hover:text-teal-800"
                  >
                    Try ZORVI10
                  </button>
                  <span className="text-[11px] text-slate-300">|</span>
                  <button
                    onClick={() => applyCoupon('FIRST20')}
                    className="text-[11px] text-teal-700 font-semibold underline hover:text-teal-800"
                  >
                    Try FIRST20
                  </button>
                </div>
              </div>

              {/* Price Details */}
              <div className="space-y-3 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Price ({totalItems} items)</span>
                  <span>
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(originalTotalINR)}
                  </span>
                </div>

                {catalogDiscountINR > 0 && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Catalog Discount</span>
                    <span>
                      -
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(catalogDiscountINR)}
                    </span>
                  </div>
                )}

                {couponDiscountINR > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>
                      -
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(couponDiscountINR)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span>
                    {deliveryFeeINR === 0 ? (
                      <span className="text-emerald-700 font-bold uppercase">Free</span>
                    ) : (
                      `₹${deliveryFeeINR}`
                    )}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-900">Total Payable</span>
                  <span className="text-xl font-black text-slate-950">
                    {new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0,
                    }).format(finalTotalINR)}
                  </span>
                </div>
              </div>

              {/* Total Savings Callout */}
              {(catalogDiscountINR > 0 || couponDiscountINR > 0) && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-xl text-center text-xs text-emerald-800 font-bold">
                  You will save ₹{catalogDiscountINR + couponDiscountINR} on this demo order!
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-6 py-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Safe &amp; Secure Demo Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
