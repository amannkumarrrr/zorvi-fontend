import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ShoppingBag } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-sm">
        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Compass className="w-10 h-10 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight block mb-2">
          404
        </span>

        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Page Not Found
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 mb-8 leading-relaxed">
          The page you are looking for might have been moved, deleted, or does not exist in our catalog.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>

          <Link
            to="/products"
            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
