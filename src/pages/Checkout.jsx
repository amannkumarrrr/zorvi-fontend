import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Loader2,
  AlertCircle,
  QrCode,
  RefreshCw,
  Clock,
  XCircle,
  Copy,
  Check,
  Tag,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import orderApi from '../services/orderApi';
import { formatINR, toINRNumber } from '../utils/formatters';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const Checkout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const {
    cartItems,
    totalItems,
    subtotalINR,
    couponDiscountINR,
    deliveryFeeINR,
    finalTotalINR,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCart();

  // Form Fields State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    paymentMethod: 'demo_upi_qr', // 'demo_upi_qr' | 'cod' | 'razorpay'
  });

  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Dynamic UPI QR Code & Demo States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrOrderData, setQrOrderData] = useState(null); // { order, qrCode }
  const [qrStatus, setQrStatus] = useState('pending'); // 'pending' | 'checking' | 'paid' | 'expired' | 'closed' | 'failed'
  const [qrCountdown, setQrCountdown] = useState(900); // 15 mins (seconds)
  const [isCheckingQrStatus, setIsCheckingQrStatus] = useState(false);
  const [isCancellingQr, setIsCancellingQr] = useState(false);
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);
  const [isSimulatingFailure, setIsSimulatingFailure] = useState(false);
  const [demoSimulationMessage, setDemoSimulationMessage] = useState(null);
  const [qrUnavailableNotice, setQrUnavailableNotice] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const qrPollingTimerRef = useRef(null);
  const qrCountdownTimerRef = useRef(null);

  // Coupon code state for Checkout
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!couponInput.trim()) {
      addToast('Please enter a coupon code', 'warning');
      return;
    }
    setApplyingCoupon(true);
    await applyCoupon(couponInput.trim());
    setApplyingCoupon(false);
    setCouponInput('');
  };

  // Update prefill if user logs in while on page
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Polling and Countdown for Dynamic UPI QR Code
  useEffect(() => {
    if (!isQrModalOpen || !qrOrderData?.order?._id) {
      if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
      if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
      return;
    }

    // Countdown interval (1s ticks)
    qrCountdownTimerRef.current = setInterval(() => {
      setQrCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(qrCountdownTimerRef.current);
          if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
          setQrStatus('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Polling interval (every 4s)
    const pollStatus = async () => {
      try {
        const orderId = qrOrderData.order._id;
        const res = await orderApi.checkQrStatus(orderId);
        if (res.paid || res.data?.order?.paymentStatus === 'paid') {
          if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
          if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
          setQrStatus('paid');
          setConfirmedOrder(res.data?.order || qrOrderData.order);
          clearCart();
          addToast('Payment verified successfully!', 'success');
          setTimeout(() => {
            setIsQrModalOpen(false);
            setIsSubmittedModalOpen(true);
          }, 1500);
        } else if (res.status === 'closed' || res.status === 'expired') {
          setQrStatus(res.status);
          if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
          if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
        }
      } catch (err) {
        console.error('Error polling QR status:', err);
      }
    };

    qrPollingTimerRef.current = setInterval(pollStatus, 4000);

    return () => {
      if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
      if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
    };
  }, [isQrModalOpen, qrOrderData]);

  const handleManualCheckStatus = async () => {
    if (!qrOrderData?.order?._id || isCheckingQrStatus) return;
    setIsCheckingQrStatus(true);
    try {
      const res = await orderApi.checkQrStatus(qrOrderData.order._id);
      if (res.paid || res.data?.order?.paymentStatus === 'paid') {
        if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
        if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
        setQrStatus('paid');
        setConfirmedOrder(res.data?.order || qrOrderData.order);
        clearCart();
        addToast('Payment verified and order confirmed!', 'success');
        setTimeout(() => {
          setIsQrModalOpen(false);
          setIsSubmittedModalOpen(true);
        }, 1200);
      } else {
        addToast('Payment is still pending. Please approve the payment on your UPI app.', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Failed to check payment status.', 'error');
    } finally {
      setIsCheckingQrStatus(false);
    }
  };

  const handleCancelQrPayment = async () => {
    if (!qrOrderData?.order?._id || isCancellingQr) return;
    setIsCancellingQr(true);
    try {
      if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
      if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
      await orderApi.cancelQrPayment(qrOrderData.order._id);
      addToast('Payment cancelled. Your cart items are preserved.', 'info');
      setIsQrModalOpen(false);
      setQrOrderData(null);
      setDemoSimulationMessage(null);
    } catch (err) {
      addToast(err.message || 'Failed to cancel payment.', 'error');
    } finally {
      setIsCancellingQr(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!qrOrderData?.order?._id || isSimulatingSuccess) return;
    setIsSimulatingSuccess(true);
    setDemoSimulationMessage(null);
    try {
      if (qrPollingTimerRef.current) clearInterval(qrPollingTimerRef.current);
      if (qrCountdownTimerRef.current) clearInterval(qrCountdownTimerRef.current);
      const res = await orderApi.simulateDemoSuccess(qrOrderData.order._id);
      if (res.success && res.data?.order) {
        setQrStatus('paid');
        setConfirmedOrder(res.data.order);
        clearCart();
        addToast('College Demo: Payment simulated successfully! Status is Paid (Demo).', 'success');
        setTimeout(() => {
          setIsQrModalOpen(false);
          setIsSubmittedModalOpen(true);
        }, 1200);
      }
    } catch (err) {
      addToast(err.message || 'Simulation failed.', 'error');
    } finally {
      setIsSimulatingSuccess(false);
    }
  };

  const handleSimulateFailure = async () => {
    if (!qrOrderData?.order?._id || isSimulatingFailure) return;
    setIsSimulatingFailure(true);
    try {
      const res = await orderApi.simulateDemoFailure(qrOrderData.order._id);
      if (res.success) {
        setQrStatus('failed');
        setDemoSimulationMessage('Simulated payment failure recorded. Your shopping cart has been preserved and you can retry.');
        addToast('College Demo: Payment failure simulated. Cart preserved.', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Simulation failed.', 'error');
    } finally {
      setIsSimulatingFailure(false);
    }
  };

  const handleRetryDemoPayment = () => {
    setQrStatus('pending');
    setDemoSimulationMessage(null);
    setQrCountdown(900);
  };

  const handleCopyOrderId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2000);
  };

  const formatCountdown = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full Name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please provide a valid email format.';
    }

    const digitsOnly = formData.phone.trim().replace(/\D/g, '');
    if (!digitsOnly) {
      newErrors.phone = 'Mobile number is required.';
    } else if (digitsOnly.length !== 10) {
      newErrors.phone = 'Please provide a valid 10-digit mobile number.';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required.';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required.';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required.';
    }

    const pinDigits = formData.pincode.trim().replace(/\D/g, '');
    if (!pinDigits) {
      newErrors.pincode = 'PIN code is required.';
    } else if (pinDigits.length !== 6) {
      newErrors.pincode = 'PIN code must be exactly 6 digits.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      addToast('Please log in or create an account to proceed to checkout.', 'warning');
      navigate('/login', {
        state: {
          from: '/checkout',
          message: 'Please log in or create an account to proceed to checkout.',
        },
      });
      return;
    }

    if (!validateForm()) {
      addToast('Please correct the highlighted form errors.', 'warning');
      return;
    }

    setIsProcessing(true);

    try {
      const shippingAddress = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim(),
        country: 'India',
      };

      // 1. CASH ON DELIVERY
      if (formData.paymentMethod === 'cod') {
        const response = await orderApi.createOrder({
          shippingAddress,
          paymentMethod: 'cod',
          couponCode: appliedCoupon?.code || null,
        });

        if (response.success && response.data?.order) {
          setConfirmedOrder(response.data.order);
          clearCart();
          setIsSubmittedModalOpen(true);
          addToast('Order placed successfully with Cash on Delivery!', 'success');
        }
        setIsProcessing(false);
        return;
      }

      // 2. RAZORPAY PAYMENT
      if (formData.paymentMethod === 'razorpay') {
        const response = await orderApi.createOrder({
          shippingAddress,
          paymentMethod: 'razorpay',
          couponCode: appliedCoupon?.code || null,
        });

        if (!response.success || !response.data?.razorpayOrder) {
          throw new Error(response.message || 'Failed to initialize payment gateway.');
        }

        const { razorpayOrder, order, keyId } = response.data;

        // Ensure Razorpay script is available
        if (typeof window.Razorpay === 'undefined') {
          throw new Error('Razorpay payment gateway script not loaded. Please refresh the page.');
        }

        const options = {
          key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency || 'INR',
          name: 'ZORVI',
          description: `Order ${order.orderNumber}`,
          image: '/zorvi-logo.jpg',
          order_id: razorpayOrder.id,
          prefill: {
            name: shippingAddress.fullName,
            email: shippingAddress.email,
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#0d9488', // ZORVI Teal
          },
          handler: async function (paymentResponse) {
            try {
              setIsProcessing(true);
              const verifyRes = await orderApi.verifyPayment({
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature,
              });

              if (verifyRes.success && verifyRes.data?.order) {
                setConfirmedOrder(verifyRes.data.order);
                clearCart();
                setIsSubmittedModalOpen(true);
                addToast('Payment verified and order confirmed!', 'success');
              }
            } catch (verErr) {
              addToast(verErr.message || 'Payment signature verification failed.', 'error');
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              addToast('Payment popup cancelled.', 'info');
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (resp) {
          setIsProcessing(false);
          addToast(`Payment failed: ${resp.error?.description || 'Transaction declined'}`, 'error');
        });
        rzpInstance.open();
        return;
      }

      // 3. DEMO UPI QR CODE (College Demonstration)
      if (formData.paymentMethod === 'demo_upi_qr' || formData.paymentMethod === 'upi_qr') {
        setQrUnavailableNotice(null);
        setDemoSimulationMessage(null);
        try {
          const response = await orderApi.createOrder({
            shippingAddress,
            paymentMethod: 'demo_upi_qr',
            couponCode: appliedCoupon?.code || null,
          });

          if (response.success && response.data?.qrCode) {
            setQrOrderData(response.data);
            setQrStatus('pending');
            setQrCountdown(900); // 15 mins
            setIsQrModalOpen(true);
          } else {
            throw new Error(response.message || 'Failed to generate Demo UPI QR code');
          }
        } catch (qrErr) {
          addToast(qrErr.message || 'Failed to initiate Demo UPI QR payment.', 'error');
        } finally {
          setIsProcessing(false);
        }
        return;
      }
    } catch (err) {
      setIsProcessing(false);
      addToast(err.message || 'An error occurred during checkout.', 'error');
    }
  };

  const handleFinishCheckout = () => {
    setIsSubmittedModalOpen(false);
    navigate('/orders');
  };

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50/50 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 sm:p-20 text-center max-w-xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Your Cart is Empty</h2>
            <p className="text-xs text-slate-500 mb-6">
              Add some items to your shopping cart to complete your order.
            </p>
            <Link
              to="/products"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs rounded-xl transition"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />

        {/* Guest Authentication Prompt Banner */}
        {!isAuthenticated && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm flex items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs sm:text-sm">
                <span className="font-bold">Account required:</span> Please sign in or register to place your order and track delivery.
              </p>
            </div>
            <Link
              to="/login?redirect=/checkout"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition shrink-0"
            >
              Sign In
            </Link>
          </div>
        )}

        {/* Demo Store Disclaimer Banner */}
        <div className="bg-sky-50 border border-sky-200 text-sky-950 rounded-2xl p-4 sm:p-5 mb-6 shadow-sm flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold text-sky-950">
              Demo Store — Orders are for demonstration only. No real purchases or deliveries will occur.
            </p>
            <p className="text-sky-700 text-xs mt-0.5">
              Orders are securely recorded in our database for demonstration. All checkout calculations and order workflows are fully interactive.
            </p>
          </div>
        </div>

        {/* Page Heading */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Secure Checkout
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Complete your delivery address and choose your payment method.
            </p>
          </div>
          <Link
            to="/cart"
            className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Cart</span>
          </Link>
        </div>

        {/* Form and Summary Grid */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Cols: Form Inputs */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Contact Information */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                  <span>Contact Information</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="e.g. Rahul Sharma"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.fullName && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Address (for order receipt) *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="rahul@example.com"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.email && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number (10 digits) *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      maxLength={10}
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.phone && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.phone}</p>}
                  </div>
                </div>
              </div>

              {/* 2. Shipping Address */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                  <span>Delivery Address</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Street Address &amp; House No. *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Flat / House No., Colony / Apartment, Street"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.address ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.address && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.address}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Mumbai, New Delhi"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.city ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.city && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      State *
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="e.g. Maharashtra, Karnataka"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.state ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.state && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      PIN Code (6 digits) *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength={6}
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="e.g. 400001"
                      className={`w-full bg-slate-50 border px-3.5 py-2.5 text-xs rounded-xl outline-none transition text-slate-800 ${
                        errors.pincode ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                      }`}
                    />
                    {errors.pincode && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.pincode}</p>}
                  </div>
                </div>
              </div>

              {/* 3. Payment Method Selection */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                    <span>Payment Method</span>
                  </div>
                  <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200/50">
                    Razorpay Test Mode
                  </span>
                </h2>

                <div className="space-y-3">
                  {/* Demo UPI QR Code (College Demonstration) */}
                  <label
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${
                      formData.paymentMethod === 'demo_upi_qr'
                        ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="demo_upi_qr"
                        checked={formData.paymentMethod === 'demo_upi_qr'}
                        onChange={handleChange}
                        className="accent-teal-600 w-4 h-4"
                      />
                      <div className="flex items-center gap-2.5">
                        <QrCode className="w-5 h-5 text-teal-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 flex items-center gap-2">
                            <span>Demo UPI QR Payment</span>
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              College Demo
                            </span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Dynamic QR with payment success &amp; failure simulator
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200/50 w-fit">
                      Recommended for Demo
                    </span>
                  </label>

                  {/* Razorpay Online Payment */}
                  <label
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${
                      formData.paymentMethod === 'razorpay'
                        ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={formData.paymentMethod === 'razorpay'}
                        onChange={handleChange}
                        className="accent-teal-600 w-4 h-4"
                      />
                      <div className="flex items-center gap-2.5">
                        <CreditCard className="w-5 h-5 text-teal-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Online Payment (Cards / UPI / NetBanking)
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Powered by Razorpay (Official Sandbox)
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded w-fit">
                      Instant Confirmation
                    </span>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition ${
                      formData.paymentMethod === 'cod'
                        ? 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={formData.paymentMethod === 'cod'}
                        onChange={handleChange}
                        className="accent-teal-600 w-4 h-4"
                      />
                      <div className="flex items-center gap-2.5">
                        <Banknote className="w-5 h-5 text-teal-700" />
                        <div>
                          <p className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</p>
                          <p className="text-[11px] text-slate-500">Pay in cash when package arrives at your door</p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded w-fit">
                      Pay on Delivery
                    </span>
                  </label>
                </div>

                {/* QR Gateway Notice Banner */}
                {qrUnavailableNotice && (
                  <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs animate-fade-in">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1.5 flex-1">
                        <p className="font-bold text-amber-900">
                          Razorpay Dynamic UPI QR Notice
                        </p>
                        <p className="text-amber-800 text-[11px] leading-relaxed">
                          {qrUnavailableNotice.message}
                        </p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, paymentMethod: 'razorpay' }));
                              setQrUnavailableNotice(null);
                            }}
                            className="px-3 py-1.5 bg-teal-600 text-white rounded-lg font-bold text-[11px] hover:bg-teal-700 transition cursor-pointer"
                          >
                            Use Online Payment (Cards/UPI)
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({ ...prev, paymentMethod: 'cod' }));
                              setQrUnavailableNotice(null);
                            }}
                            className="px-3 py-1.5 bg-slate-200 text-slate-800 rounded-lg font-bold text-[11px] hover:bg-slate-300 transition cursor-pointer"
                          >
                            Use Cash on Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setQrUnavailableNotice(null)}
                            className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 text-[11px] cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Cols: Order Review & Submit */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm sticky top-28">
                <h2 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
                  Review Order ({totalItems} items)
                </h2>

                {/* Items preview */}
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100 mb-4 pr-1">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-10 h-10 object-contain rounded-lg bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-semibold text-slate-800 truncate max-w-[170px]">
                            {item.title}
                          </p>
                          <p className="text-slate-400 text-[11px]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-slate-900 shrink-0">
                        {new Intl.NumberFormat('en-IN', {
                          style: 'currency',
                          currency: 'INR',
                          maximumFractionDigits: 0,
                        }).format(toINRNumber(item.price) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coupon Code Section */}
                <div className="border-t border-slate-100 pt-3 pb-2">
                  {!appliedCoupon ? (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="Promo code (e.g. ZORVI10)"
                            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500 font-mono uppercase text-slate-800"
                          />
                          <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                          type="submit"
                          disabled={applyingCoupon || !couponInput.trim()}
                          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          {applyingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">Try:</span>
                        {['ZORVI10', 'FIRST20', 'FREESHIP', 'FESTIVE500'].map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setCouponInput(code)}
                            className="px-1.5 py-0.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold rounded border border-teal-200 transition cursor-pointer"
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                    </form>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-bold text-xs">{appliedCoupon.code} Applied</p>
                          <p className="text-[10px] text-emerald-700">{appliedCoupon.description || 'Promotional Discount'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs border-t border-slate-100 pt-3">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(subtotalINR)}
                    </span>
                  </div>

                  {couponDiscountINR > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
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
                        <span className="text-emerald-700 font-bold uppercase">FREE</span>
                      ) : (
                        `₹${deliveryFeeINR}`
                      )}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-slate-900">Total Amount</span>
                    <span className="text-xl font-black text-slate-950">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        maximumFractionDigits: 0,
                      }).format(finalTotalINR)}
                    </span>
                  </div>
                </div>

                {/* Place Order CTA Button */}
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full mt-6 py-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-sm rounded-2xl transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {formData.paymentMethod === 'razorpay'
                          ? 'Proceed to Razorpay'
                          : formData.paymentMethod === 'demo_upi_qr' || formData.paymentMethod === 'upi_qr'
                          ? 'Place Order & Pay via Demo UPI QR'
                          : 'Confirm COD Order'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>256-Bit SSL Encrypted &amp; Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Dedicated UPI QR Payment Modal */}
      {isQrModalOpen && qrOrderData && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-7 shadow-2xl border border-slate-200 text-center animate-slide-up relative my-4 sm:my-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/60 flex items-center justify-center text-teal-700">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    Scan to Pay via UPI
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      {qrOrderData.order?.orderNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyOrderId(qrOrderData.order?.orderNumber)}
                      className="text-slate-400 hover:text-teal-600 transition p-0.5"
                      title="Copy Order ID"
                    >
                      {copiedOrderId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Close / Cancel Button */}
              <button
                type="button"
                onClick={handleCancelQrPayment}
                disabled={isCancellingQr}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer disabled:opacity-50"
                title="Cancel Payment"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Payable Amount Highlight */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/70 rounded-2xl p-3.5 mb-3 text-center">
              <span className="text-[11px] uppercase tracking-wider font-bold text-teal-800">
                Exact Demo Amount Payable
              </span>
              <div className="text-2xl font-black text-slate-950 mt-0.5">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(qrOrderData.order?.totalAmountINR || (qrOrderData.qrCode?.amountPaise / 100))}
              </div>
              <p className="text-[10px] text-teal-700/80 mt-0.5">
                Dynamic Single-Use QR • College Demo Simulation
              </p>
            </div>

            {/* Prominent Demo Payment Banner */}
            <div className="mb-3.5 p-3 bg-amber-50 border border-amber-300 rounded-2xl text-left flex items-start gap-2.5 shadow-xs">
              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-amber-500 text-slate-950 shrink-0 mt-0.5 tracking-wider">
                Demo Payment — Not Real
              </span>
              <div className="text-[11px] text-amber-900 leading-tight">
                <p className="font-bold">College Project Demonstration</p>
                <p className="text-amber-800 text-[10px] mt-0.5">
                  No real bank transaction or Razorpay API call is made. Use the simulation buttons below to test success and failure workflows.
                </p>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3.5 rounded-2xl border-2 border-dashed border-teal-300 shadow-inner inline-block mx-auto mb-2 max-w-[240px]">
              {qrOrderData.qrCode?.imageUrl ? (
                <img
                  src={qrOrderData.qrCode.imageUrl}
                  alt="Dynamic Demo UPI QR Code"
                  className="w-52 h-52 object-contain mx-auto rounded-lg"
                />
              ) : (
                <div className="w-52 h-52 bg-slate-50 rounded-lg flex flex-col items-center justify-center text-slate-400 p-4">
                  <QrCode className="w-16 h-16 text-teal-600 mb-2 animate-pulse" />
                  <span className="text-xs font-semibold text-slate-700">QR Code Active</span>
                  <span className="text-[10px] text-slate-400 text-center mt-1">
                    Demo Ref: {qrOrderData.order?.orderNumber}
                  </span>
                </div>
              )}
            </div>

            {/* Encoded Demo Payload Reference */}
            <div className="mb-3 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-left font-mono text-[10px] text-slate-600">
              <span className="font-sans font-bold text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">
                Encoded Demo URI Reference:
              </span>
              <p className="truncate text-teal-800 font-semibold select-all">
                {qrOrderData.qrCode?.payload || `upi://pay-demo?tr=${qrOrderData.order?.orderNumber}&am=${qrOrderData.order?.totalAmountINR}`}
              </p>
            </div>

            {/* Status & Validity Timer Bar */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 mb-3 text-xs">
              <div className="flex items-center gap-2">
                {qrStatus === 'paid' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="font-bold text-emerald-700">Paid (Demo) — Verified!</span>
                  </>
                ) : qrStatus === 'failed' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="font-bold text-rose-600">Payment Failed (Demo)</span>
                  </>
                ) : qrStatus === 'expired' ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span className="font-bold text-rose-600">QR Code Expired</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-600"></span>
                    </span>
                    <span className="font-semibold text-slate-700">Awaiting demo simulation...</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500 font-bold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatCountdown(qrCountdown)}</span>
              </div>
            </div>

            {/* Demo Payment Failure Feedback Banner */}
            {qrStatus === 'failed' && (
              <div className="mb-3.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-left space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Payment Failed (Simulated)</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRetryDemoPayment}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Demo Payment</span>
                  </button>
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  {demoSimulationMessage || 'Simulated payment failure occurred. Your cart has been preserved.'}
                </p>
              </div>
            )}

            {/* College Project Demonstration Controls */}
            <div className="p-3.5 bg-slate-900 text-white rounded-2xl mb-4 text-left space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-teal-300" />
                  <span>College Demo Simulation Controls</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Interactive</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  disabled={isSimulatingSuccess || isSimulatingFailure || qrStatus === 'paid'}
                  className="px-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSimulatingSuccess ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>Simulate Success</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  disabled={isSimulatingSuccess || isSimulatingFailure || qrStatus === 'paid'}
                  className="px-3 py-2.5 bg-rose-600/90 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSimulatingFailure ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Simulate Failure</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleManualCheckStatus}
                disabled={isCheckingQrStatus || qrStatus === 'expired'}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isCheckingQrStatus ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Checking Status...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCancelQrPayment}
                disabled={isCancellingQr}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isCancellingQr ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cancelling Payment...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cancel Payment &amp; Return</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 mt-3">
              Your cart items will remain safely in your bag if you cancel or retry.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {isSubmittedModalOpen && confirmedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-slide-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
              Order Confirmed
            </span>

            <h3 className="text-2xl font-black text-slate-900 mt-3 mb-2">
              Thank You for Your Order!
            </h3>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              We've received your order and an automated email confirmation has been sent to{' '}
              <span className="font-semibold text-slate-800">{confirmedOrder.shippingAddress?.email}</span>.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Order Number:</span>
                <span className="font-mono font-bold text-slate-900">{confirmedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Recipient:</span>
                <span className="font-semibold text-slate-800">{confirmedOrder.shippingAddress?.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Delivery Address:</span>
                <span className="font-semibold text-slate-800 text-right truncate max-w-[200px]">
                  {confirmedOrder.shippingAddress?.address}, {confirmedOrder.shippingAddress?.city}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-semibold text-slate-800 uppercase">
                  {confirmedOrder.paymentMethod} ({confirmedOrder.paymentStatus})
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Total Paid / Payable:</span>
                <span>
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 0,
                  }).format(confirmedOrder.totalAmountINR)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleFinishCheckout}
                className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20"
              >
                View My Orders
              </button>
              <Link
                to="/products"
                onClick={() => setIsSubmittedModalOpen(false)}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
