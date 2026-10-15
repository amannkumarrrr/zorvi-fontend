import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * Route protection wrapper.
 * Ensures the user is authenticated before viewing protected resources (Cart, Checkout, Orders).
 * Shows a loading indicator while session is being verified so that a page refresh
 * does NOT prematurely redirect the user or expose protected data.
 */
export const ProtectedRoute = ({
  children,
  message = 'Please log in or create an account to access this page.',
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <p className="text-xs text-slate-400 font-medium tracking-wide">
          Verifying secure session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          message,
        }}
        replace
      />
    );
  }

  return children;
};

export default ProtectedRoute;
