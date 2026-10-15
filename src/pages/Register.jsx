import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronLeft,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authApi from '../services/authApi';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();
  const { addToast } = useToast();

  const getDestination = () => {
    const from = location.state?.from;
    if (!from) return '/';
    if (typeof from === 'string') return from;
    if (from.pathname) {
      return `${from.pathname}${from.search || ''}${from.hash || ''}`;
    }
    return '/';
  };

  // Step state: 1 = Email, 2 = OTP, 3 = Profile & Password
  const [step, setStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [signupToken, setSignupToken] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [emailExistsError, setEmailExistsError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timers: 5-minute expiry (300s) & 60-second Resend Cooldown
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const otpInputRefs = useRef([]);

  // Countdown timer for 5-minute OTP expiration
  useEffect(() => {
    let timer;
    if (step === 2 && expirySeconds > 0) {
      timer = setInterval(() => {
        setExpirySeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, expirySeconds]);

  // Countdown timer for 60-second Resend OTP cooldown
  useEffect(() => {
    let timer;
    if (cooldownSeconds > 0) {
      timer = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // ---------------- STEP 1: SEND SIGNUP OTP ----------------
  const handleSendOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMessage('');
    setEmailExistsError(false);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.sendSignupOtp(trimmedEmail);
      setLoading(false);

      if (res.success) {
        setStep(2);
        setExpirySeconds(300);
        setCooldownSeconds(res.cooldownSeconds || 60);
        setAttemptsRemaining(5);
        setOtp(['', '', '', '', '', '']);
        addToast('Verification code sent to your email!', 'success');
        setTimeout(() => otpInputRefs.current[0]?.focus(), 150);
      }
    } catch (err) {
      setLoading(false);
      if (err.status === 409) {
        setEmailExistsError(true);
        setErrorMessage(err.message || 'An account with this email already exists.');
      } else if (err.status === 429 && err.remainingSeconds) {
        setCooldownSeconds(err.remainingSeconds);
        setErrorMessage(err.message);
      } else {
        const fullMsg = err.hint ? `${err.message} — ${err.hint}` : (err.message || 'Failed to send verification code. Please try again.');
        setErrorMessage(fullMsg);
      }
    }
  };

  // ---------------- STEP 2: VERIFY OTP ----------------
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage('');

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMessage('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    if (expirySeconds <= 0) {
      setErrorMessage('Verification code has expired. Please request a new code.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.verifySignupOtp(email.trim().toLowerCase(), fullOtp);
      setLoading(false);

      if (res.success && res.data?.signupToken) {
        setSignupToken(res.data.signupToken);
        setStep(3);
        addToast('Email verified successfully! Complete your profile.', 'success');
      } else {
        setErrorMessage(res.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      if (err.attemptsRemaining !== undefined) {
        setAttemptsRemaining(err.attemptsRemaining);
      }
      setErrorMessage(err.message || 'Invalid verification code.');
    }
  };

  // ---------------- STEP 3: COMPLETE REGISTRATION ----------------
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!signupToken) {
      setErrorMessage('Email verification session expired. Please verify your email again.');
      setStep(1);
      return;
    }

    try {
      setLoading(true);
      const res = await register({
        name: trimmedName,
        email: email.trim().toLowerCase(),
        password,
        signupToken,
      });
      setLoading(false);

      if (res.success) {
        navigate(getDestination(), { replace: true });
      } else {
        setErrorMessage(res.message || 'Registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to complete registration.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs items={[{ label: 'Create Account' }]} />

        <div className="max-w-md mx-auto my-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-sm">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 p-1 shadow-sm">
                <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Create an Account
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Join ZORVI with secure email OTP verification
              </p>
            </div>

            {/* Stepper Progress Indicator */}
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > 1
                      ? 'bg-teal-600 text-white shadow-sm'
                      : step === 1
                      ? 'bg-slate-900 text-white ring-4 ring-teal-500/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="w-4 h-4 text-white" /> : '1'}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:inline ${step === 1 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  Email
                </span>
              </div>

              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 1 ? 'bg-teal-500' : 'bg-slate-200'}`} />

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step > 2
                      ? 'bg-teal-600 text-white shadow-sm'
                      : step === 2
                      ? 'bg-slate-900 text-white ring-4 ring-teal-500/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {step > 2 ? <CheckCircle2 className="w-4 h-4 text-white" /> : '2'}
                </div>
                <span className={`text-[11px] font-semibold hidden sm:inline ${step === 2 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  Verify OTP
                </span>
              </div>

              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > 2 ? 'bg-teal-500' : 'bg-slate-200'}`} />

              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === 3
                      ? 'bg-slate-900 text-white ring-4 ring-teal-500/20'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  3
                </div>
                <span className={`text-[11px] font-semibold hidden sm:inline ${step === 3 ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
                  Profile
                </span>
              </div>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                  {emailExistsError && (
                    <div className="mt-2 pt-2 border-t border-rose-200/80">
                      <Link
                        to="/login"
                        state={location.state}
                        className="inline-flex items-center gap-1 font-bold text-rose-900 hover:underline text-[11px]"
                      >
                        Sign in with your existing account &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Authentication Required Notice */}
            {location.state?.message && step === 1 && (
              <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-2xl text-xs text-teal-950 flex items-start gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-sm text-teal-950">Authentication Required</p>
                  <p className="text-teal-800 leading-relaxed">{location.state.message}</p>
                </div>
              </div>
            )}

            {/* ================= STEP 1: ENTER EMAIL ================= */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} noValidate className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMessage('');
                        setEmailExistsError(false);
                      }}
                      placeholder="e.g. name@example.com"
                      className="w-full pl-9 pr-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-800 transition focus:border-teal-500 focus:bg-white"
                      disabled={loading}
                      autoFocus
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    We'll send a 6-digit security code to verify you own this address.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= STEP 2: VERIFY OTP ================= */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMessage('');
                    }}
                    className="text-teal-700 hover:text-teal-900 font-bold text-[11px] underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Enter 6-Digit Code
                    </label>
                    <span
                      className={`text-[11px] font-semibold ${
                        expirySeconds < 60 ? 'text-rose-600 font-bold' : 'text-slate-500'
                      }`}
                    >
                      Expires in: {formatTime(expirySeconds)}
                    </span>
                  </div>

                  {/* 6 Digit Inputs */}
                  <div className="flex gap-1.5 sm:gap-2.5 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className={`w-9 sm:w-12 h-11 sm:h-13 text-center text-lg sm:text-xl font-bold font-mono rounded-xl border bg-slate-50/80 outline-none transition ${
                          digit
                            ? 'border-teal-500 bg-teal-50/20 text-slate-900'
                            : 'border-slate-200 text-slate-700 focus:border-teal-500 focus:bg-white'
                        }`}
                        disabled={loading}
                      />
                    ))}
                  </div>

                  {attemptsRemaining < 5 && (
                    <p className="text-[11px] text-amber-700 text-center mt-2 font-medium">
                      {attemptsRemaining} verification attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.join('').length !== 6 || expirySeconds <= 0}
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>Verify Code</span>
                    </>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="pt-2 text-center">
                  {cooldownSeconds > 0 ? (
                    <p className="text-xs text-slate-400">
                      Resend code available in <span className="font-bold text-slate-600">{cooldownSeconds}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold inline-flex items-center gap-1.5 transition"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resend Verification Code</span>
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* ================= STEP 3: NAME & PASSWORD ================= */}
            {step === 3 && (
              <form onSubmit={handleCompleteRegistration} noValidate className="space-y-4">
                {/* Verified Email Banner */}
                <div className="p-3 bg-teal-50 border border-teal-200/90 rounded-2xl flex items-center justify-between text-xs text-teal-950">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span className="font-semibold text-teal-900 truncate">{email}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-200/60 text-teal-900 shrink-0">
                    Verified
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="e.g. Priya Patel"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-800 transition focus:border-teal-500 focus:bg-white"
                      disabled={loading}
                      autoFocus
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Create Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Create a strong password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-800 transition focus:border-teal-500 focus:bg-white"
                      disabled={loading}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrorMessage('');
                      }}
                      placeholder="Repeat your password"
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs text-slate-800 transition focus:border-teal-500 focus:bg-white"
                      disabled={loading}
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" state={location.state} className="text-teal-700 font-bold hover:underline">
                Sign In &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
