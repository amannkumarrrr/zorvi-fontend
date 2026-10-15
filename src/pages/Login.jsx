import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const getDestination = () => {
    const from = location.state?.from;
    if (!from) return '/';
    if (typeof from === 'string') return from;
    if (from.pathname) {
      return `${from.pathname}${from.search || ''}${from.hash || ''}`;
    }
    return '/';
  };

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  const validate = () => {
    const newErrors = {};
    const emailVal = formData.email.trim();
    if (!emailVal) {
      newErrors.email = 'Email address or username is required.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError('');

    const res = await login({
      email: formData.email.trim(),
      password: formData.password.trim(),
    });

    setSubmitting(false);

    if (res.success) {
      if (res.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(getDestination(), { replace: true });
      }
    } else {
      setServerError(res.message || 'Invalid email or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Sign In' }]} />

        <div className="max-w-md mx-auto my-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 p-1 shadow-sm">
                <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome Back
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Sign in to your ZORVI account to access your orders, cart, and wishlist.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    className={`w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border text-xs rounded-xl outline-none transition text-slate-800 ${
                      errors.email ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                    }`}
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.email}</p>}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    state={location.state}
                    className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline transition"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full pl-9 pr-10 py-2.5 bg-slate-50 border text-xs rounded-xl outline-none transition text-slate-800 ${
                      errors.password ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200 focus:border-teal-500 focus:bg-white'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              Don't have an account yet?{' '}
              <Link to="/register" state={location.state} className="text-teal-700 font-bold hover:underline">
                Create one now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
