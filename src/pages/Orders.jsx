import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  ShoppingBag,
  RotateCcw,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import orderApi from '../services/orderApi';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Breadcrumbs from '../components/common/Breadcrumbs';

const TRACKING_STEPS = [
  { key: 'pending', label: 'Order Placed', desc: 'Received & logged' },
  { key: 'confirmed', label: 'Confirmed', desc: 'Payment verified' },
  { key: 'processing', label: 'Processing', desc: 'Packed at hub' },
  { key: 'shipped', label: 'Shipped', desc: 'On the way' },
  { key: 'delivered', label: 'Delivered', desc: 'Package arrived' },
];

const getStepIndex = (status) => {
  switch (status) {
    case 'pending':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'shipped':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
};

/**
 * Visual Tracking Timeline Component
 */
const OrderTrackingTimeline = ({ order }) => {
  const isCancelled = order.orderStatus === 'cancelled';
  const isFailed = order.paymentStatus === 'failed' || order.paymentStatus === 'failed_demo';
  const currentStep = getStepIndex(order.orderStatus);

  if (isCancelled) {
    return (
      <div className="bg-rose-50/80 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3 my-4">
        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
          <XCircle className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h5 className="font-bold text-rose-900 text-sm">Order Cancelled</h5>
          <p className="text-rose-700 mt-0.5">
            This order was cancelled. Any reserved stock has been returned to inventory.
          </p>
          <span className="text-[11px] text-rose-500 font-medium mt-1 inline-block">
            Updated: {new Date(order.updatedAt || order.createdAt).toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="my-5 bg-slate-50/60 rounded-2xl p-4 sm:p-6 border border-slate-100">
      {isFailed && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Payment attempt failed. The order remains recorded, but items won't ship until paid.
          </span>
        </div>
      )}

      <div className="relative">
        {/* Background connector line */}
        <div className="absolute top-4 left-[10%] right-[10%] h-1 bg-slate-200 rounded-full hidden sm:block" />

        {/* Active progress connector line */}
        <div
          className="absolute top-4 left-[10%] h-1 bg-teal-500 rounded-full transition-all duration-500 hidden sm:block"
          style={{ width: `${(Math.min(currentStep, 4) / 4) * 80}%` }}
        />

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isCurrent = idx === currentStep;
            const isUpcoming = idx > currentStep;

            return (
              <div
                key={step.key}
                className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-0 relative z-10"
              >
                {/* Step Circle Indicator */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 shadow-sm ${
                    isCompleted
                      ? 'bg-teal-600 text-white'
                      : isCurrent
                      ? 'bg-white border-2 border-teal-600 text-teal-700 ring-4 ring-teal-100 font-extrabold'
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Labels */}
                <div className="sm:mt-2 text-left sm:text-center">
                  <div className="flex items-center gap-1.5 sm:justify-center">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-teal-900 font-extrabold'
                          : isCompleted
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="inline-block sm:hidden px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
                    {step.desc}
                  </p>
                  {isCurrent && (
                    <span className="hidden sm:inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 animate-pulse">
                      In Progress
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Courier & Tracking Details Callout if present */}
      {order.trackingInformation && (
        <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center gap-2 text-xs text-teal-900">
          <Truck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            Tracking ID / Courier:{' '}
            <strong className="font-mono bg-white px-2 py-0.5 rounded border border-teal-200 text-teal-800 ml-1">
              {order.trackingInformation}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export const Orders = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToast } = useToast();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getMyOrders();
      if (res.success && res.data?.orders) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      addToast(err.message || 'Failed to load order history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored.')) {
      return;
    }

    try {
      setCancellingId(orderId);
      const res = await orderApi.cancelOrder(orderId);
      if (res.success) {
        addToast('Order cancelled successfully.', 'success');
        fetchOrders();
      }
    } catch (err) {
      addToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Confirmed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Placed (Pending)
          </span>
        );
    }
  };

  if (!isAuthenticated && !authLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs items={[{ label: 'Orders' }]} />
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 sm:p-20 text-center max-w-lg mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Sign in to View Orders</h2>
            <p className="text-xs text-slate-500 mb-6">
              Track your deliveries, review purchase history, and manage active orders.
            </p>
            <Link
              to="/login"
              state={{
                from: '/orders',
                message: 'Please log in or create an account to view your orders.',
              }}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Orders' }]} />

        {/* Page Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Orders &amp; Tracking
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live tracking timeline, purchase history, and order management.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-sm w-fit"
          >
            <ShoppingBag className="w-4 h-4 text-teal-600" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-4 max-w-4xl mx-auto">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                <div className="h-4 bg-slate-100 rounded w-1/4"></div>
                <div className="h-20 bg-slate-50 rounded"></div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && orders.length === 0 && (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 sm:p-20 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No Orders Yet</h2>
            <p className="text-xs text-slate-500 mb-6">
              You haven't placed any orders yet. Discover our curated collections today!
            </p>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Start Shopping
            </Link>
          </div>
        )}

        {/* Order Cards List */}
        {!loading && orders.length > 0 && (
          <div className="space-y-6 max-w-4xl mx-auto">
            {orders.map((order) => {
              const canCancel = ['pending', 'confirmed', 'processing'].includes(order.orderStatus);

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Order Header */}
                  <div className="bg-slate-50/80 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {order.orderNumber}
                        </span>
                        {getStatusBadge(order.orderStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                          <span>Payment:</span>
                          <strong className="text-slate-800 font-semibold">
                            {order.paymentMethod === 'demo_upi_qr' ? 'Demo UPI QR' : (order.paymentMethod || '').toUpperCase()}
                          </strong>
                          {order.isDemoPayment && (
                            <span className="bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                              Demo
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              order.paymentStatus === 'Paid (Demo)' || order.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.paymentStatus === 'failed_demo' || order.paymentStatus === 'failed'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Total Amount</span>
                      <span className="text-base font-black text-slate-900">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(order.totalAmountINR)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Tracking Timeline */}
                  <div className="px-4 sm:px-6 pt-2">
                    <OrderTrackingTimeline order={order} />
                  </div>

                  {/* Order Items List */}
                  <div className="p-4 sm:p-6 divide-y divide-slate-100">
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.imageSnapshot || 'https://via.placeholder.com/60'}
                            alt={item.titleSnapshot}
                            className="w-12 h-12 rounded-xl object-contain bg-slate-50 border border-slate-100 shrink-0"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">
                              {item.titleSnapshot}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Qty: {item.quantity} ×{' '}
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(item.unitPriceINR)}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-slate-900 shrink-0">
                          {new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            maximumFractionDigits: 0,
                          }).format(item.lineTotalINR)}
                        </span>
                      </div>
                    ))}

                    {/* Order Financial Breakdown (Subtotal, Coupon Discount, Total) */}
                    {(order.discountINR > 0 || order.couponCode) && (
                      <div className="pt-3 mt-3 flex flex-col gap-1 text-xs text-slate-500">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>
                            {new Intl.NumberFormat('en-IN', {
                              style: 'currency',
                              currency: 'INR',
                              maximumFractionDigits: 0,
                            }).format(order.subtotalINR)}
                          </span>
                        </div>
                        {order.discountINR > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3.5 h-3.5" />
                              <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}:</span>
                            </span>
                            <span>
                              -
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                maximumFractionDigits: 0,
                              }).format(order.discountINR)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer with Shipping details & Actions */}
                  <div className="bg-slate-50/50 px-4 sm:px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-xs">
                    <div className="text-slate-500 text-[11px]">
                      Delivering to: <strong className="text-slate-700">{order.shippingAddress?.fullName}</strong>,{' '}
                      {order.shippingAddress?.city} ({order.shippingAddress?.pincode})
                    </div>

                    {canCancel && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        className="px-3 py-1.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === order._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        <span>Cancel Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
