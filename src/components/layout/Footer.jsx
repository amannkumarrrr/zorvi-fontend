import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Send,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  CheckCircle2,
} from 'lucide-react';

export const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    setError('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    setSubscribed(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setSubscribed(false);
    }, 4000);
  };

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-900 mt-20">
      {/* 1. Value Proposition Pillars */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 pb-12 border-b border-slate-900">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-950/60 text-teal-400 border border-teal-800/40 rounded-2xl shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base">Free Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">On all orders over ₹999 across India</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-950/60 text-teal-400 border border-teal-800/40 rounded-2xl shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base">100% Genuine</h4>
              <p className="text-xs text-slate-400 mt-1">Directly sourced brand verified items</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-950/60 text-teal-400 border border-teal-800/40 rounded-2xl shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base">7-Day Returns</h4>
              <p className="text-xs text-slate-400 mt-1">Hassle-free replacement guarantee</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-950/60 text-teal-400 border border-teal-800/40 rounded-2xl shrink-0">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm sm:text-base">Dedicated Support</h4>
              <p className="text-xs text-slate-400 mt-1">24/7 customer care assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-16">
          {/* Brand Info & Newsletter */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-white border border-slate-700 flex items-center justify-center p-0.5 shadow-md">
                <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                ZORVI<span className="text-teal-400">.</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Curating modern lifestyle, high-performance electronics, luxury fragrances, and home decor for contemporary living.
            </p>

            {/* Newsletter Form */}
            <div className="pt-2">
              <h5 className="text-sm font-semibold text-white mb-2">
                Subscribe to our Newsletter
              </h5>
              <p className="text-xs text-slate-400 mb-3">
                Get ₹200 off on your first order and exclusive access to flash drops.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="max-w-sm">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-teal-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shrink-0"
                    aria-label="Subscribe to newsletter"
                  >
                    <span>Join</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                {error && <p className="text-rose-400 text-xs mt-1.5">{error}</p>}
                {subscribed && (
                  <p className="text-emerald-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Thank you! You have been subscribed with demo code: <strong>FIRST20</strong>.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Categories
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/products?category=laptops" className="hover:text-teal-400 transition-colors">
                  Laptops & PC
                </Link>
              </li>
              <li>
                <Link to="/products?category=smartphones" className="hover:text-teal-400 transition-colors">
                  Smartphones
                </Link>
              </li>
              <li>
                <Link to="/products?category=fragrances" className="hover:text-teal-400 transition-colors">
                  Fragrances
                </Link>
              </li>
              <li>
                <Link to="/products?category=beauty" className="hover:text-teal-400 transition-colors">
                  Beauty & Skincare
                </Link>
              </li>
              <li>
                <Link to="/products?category=furniture" className="hover:text-teal-400 transition-colors">
                  Modern Furniture
                </Link>
              </li>
              <li>
                <Link to="/products?category=groceries" className="hover:text-teal-400 transition-colors">
                  Groceries & Organics
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Customer Care
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/cart" className="hover:text-teal-400 transition-colors">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-teal-400 transition-colors">
                  My Wishlist
                </Link>
              </li>
              <li>
                <Link to="/checkout" className="hover:text-teal-400 transition-colors">
                  Demo Checkout
                </Link>
              </li>
              <li>
                <a href="#support" onClick={(e) => { e.preventDefault(); alert("Customer Support: support@zorvi.com | Mon-Sat 9AM-8PM"); }} className="hover:text-teal-400 transition-colors">
                  Help & FAQs
                </a>
              </li>
              <li>
                <a href="#shipping" onClick={(e) => { e.preventDefault(); alert("Standard Delivery: 2-4 business days. Free shipping over ₹999."); }} className="hover:text-teal-400 transition-colors">
                  Shipping Policies
                </a>
              </li>
            </ul>
          </div>

          {/* Policies & Company */}
          <div>
            <h5 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Legal & Trust
            </h5>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Terms of Service: This is a Phase 1 Frontend prototype using DummyJSON."); }} className="hover:text-teal-400 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Privacy Policy: No personal data or payments are collected in Phase 1."); }} className="hover:text-teal-400 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#security" onClick={(e) => { e.preventDefault(); alert("Security: Demo catalog powered by DummyJSON public API."); }} className="hover:text-teal-400 transition-colors">
                  Security Guarantee
                </a>
              </li>
              <li>
                <span className="inline-block mt-2 px-2.5 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-semibold">
                  Phase 1 Verified
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Strip: Payment Icons & Copyright */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} ZORVI. Demo store built with React, Vite & Tailwind CSS.
          </p>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-400">Accepted Demo Payments:</span>
            <div className="flex items-center gap-2 text-slate-300 font-bold text-[11px]">
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">UPI</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">COD</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">RuPay</span>
              <span className="px-2 py-0.5 bg-slate-900 rounded border border-slate-800">VISA / MC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
