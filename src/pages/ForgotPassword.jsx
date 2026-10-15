import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Eye,
  EyeOff,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import authApi from '../services/authApi';
import { useToast } from '../context/ToastContext';
import Breadcrumbs from '../components/common/Breadcrumbs';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  // Step state: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  // Form Fields
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI & Validation States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timers: Expiry (5 mins = 300s) & Resend Cooldown (60s)
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

  // ---------------- STEP 1: REQUEST OTP ----------------
  const handleRequestOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.forgotPassword(trimmedEmail);
      setLoading(false);

      if (res.success) {
        addToast('Verification code has been sent to your email.', 'success');
        setCooldownSeconds(res.cooldownSeconds || 60);
        setExpirySeconds(res.expiresSeconds || 300);
        setAttemptsRemaining(5);
        setStep(2);
      } else {
        setErrorMessage(res.message || 'Unable to process request.');
      }
    } catch (err) {
      setLoading(false);
      if (err.remainingSeconds) {
        setCooldownSeconds(err.remainingSeconds);
      }
      const fullMsg = err.hint ? `${err.message} — ${err.hint}` : (err.message || 'Failed to send verification code. Please try again.');
      setErrorMessage(fullMsg);
    }
  };

  // ---------------- STEP 2: VERIFY OTP ----------------
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMessage('');

    // Auto-advance to next input
    if (value && index < 5) {
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
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMessage('');

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (expirySeconds === 0) {
      setErrorMessage('Verification code has expired. Please click "Resend Code".');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.verifyResetOtp(email.trim().toLowerCase(), fullOtp);
      setLoading(false);

      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        addToast('Code verified successfully! Now choose your new password.', 'success');
        setStep(3);
      } else {
        setErrorMessage(res.message || 'Invalid verification code.');
      }
    } catch (err) {
      setLoading(false);
      if (typeof err.attemptsRemaining === 'number') {
        setAttemptsRemaining(err.attemptsRemaining);
      }
      setErrorMessage(err.message || 'Failed to verify code.');
    }
  };

  const handleResendOtp = async () => {
    if (cooldownSeconds > 0 || loading) return;
    setErrorMessage('');

    try {
      setLoading(true);
      const res = await authApi.forgotPassword(email.trim().toLowerCase());
      setLoading(false);

      if (res.success) {
        addToast('A new 6-digit code has been sent to your email.', 'success');
        setOtp(['', '', '', '', '', '']);
        setCooldownSeconds(res.cooldownSeconds || 60);
        setExpirySeconds(res.expiresSeconds || 300);
        setAttemptsRemaining(5);
        otpInputRefs.current[0]?.focus();
      }
    } catch (err) {
      setLoading(false);
      if (err.remainingSeconds) {
        setCooldownSeconds(err.remainingSeconds);
      }
      setErrorMessage(err.message || 'Failed to resend code.');
    }
  };

  // ---------------- STEP 3: RESET PASSWORD ----------------
  const handleResetPassword = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!newPassword) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.resetPassword(email.trim().toLowerCase(), resetToken, newPassword);
      setLoading(false);

      if (res.success) {
        addToast('Password reset successfully! You can now log in.', 'success');
        setStep(4);
      } else {
        setErrorMessage(res.message || 'Failed to reset password.');
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to reset password. Session may have expired.');
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Breadcrumbs
          items={[
            { label: 'Sign In', path: '/login' },
            { label: 'Reset Password' },
          ]}
        />

        <div className="max-w-md mx-auto my-8">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-8 shadow-sm">
            {/* Step Progress Indicators */}
            {step < 4 && (
              <div className="flex items-center justify-between mb-8 px-2">
                {[
                  { num: 1, label: 'Email' },
                  { num: 2, label: 'Verify' },
                  { num: 3, label: 'Password' },
                ].map((s, idx) => (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                          step === s.num
                            ? 'bg-teal-600 text-white shadow-md shadow-teal-500/20'
                            : step > s.num
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {step > s.num ? '✓' : s.num}
                      </div>
                      <span className={`text-[10px] mt-1 font-semibold ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 -mt-4 transition-colors ${
                          step > s.num ? 'bg-emerald-400' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* ================= STEP 1: ENTER EMAIL ================= */}
            {step === 1 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-slate-200 flex items-center justify-center mx-auto mb-3 p-1 shadow-sm">
                    <img src="/zorvi-logo.jpg" alt="ZORVI Logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Forgot Password?</h1>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                    Enter your registered email address and we'll send a 6-digit verification code to reset your password.
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500 focus:bg-white transition text-slate-800"
                        autoFocus
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Send 6-Digit OTP</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <Link
                    to="/login"
                    state={location.state}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ================= STEP 2: VERIFY OTP ================= */}
            {step === 2 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Enter Verification Code</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    We sent a 6-digit code to <strong className="text-slate-800">{email}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setErrorMessage('');
                    }}
                    className="text-[11px] text-teal-600 hover:underline font-semibold mt-1"
                  >
                    Change email address
                  </button>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  {/* 6 Digit Input Boxes */}
                  <div className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-9 h-11 sm:w-12 sm:h-14 text-center font-mono text-lg sm:text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition shadow-xs"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>

                  {/* Expiration and Attempts Info */}
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="text-slate-500 flex items-center gap-1.5">
                      <span className="font-medium">Code expires in:</span>
                      <strong className={`font-mono font-bold ${expirySeconds < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {formatTime(expirySeconds)}
                      </strong>
                    </div>
                    <div className="text-slate-400">
                      Attempts left: <strong className="text-slate-700">{attemptsRemaining}</strong>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.join('').length !== 6 || expirySeconds === 0}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Resend Cooldown Action */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldownSeconds > 0 || loading}
                    className="text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>{cooldownSeconds > 0 ? `Resend Code (${cooldownSeconds}s)` : 'Resend Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: NEW PASSWORD ================= */}
            {step === 3 && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create New Password</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a strong password containing at least 6 characters.
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500 focus:bg-white transition text-slate-800"
                        autoFocus
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="Re-enter your new password"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none focus:border-teal-500 focus:bg-white transition text-slate-800"
                      />
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">Passwords do not match.</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                    className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* ================= STEP 4: SUCCESS ================= */}
            {step === 4 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm animate-bounce-slow">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Password Reset Complete!</h2>
                <p className="text-xs text-slate-500 mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
                  Your password has been securely updated. You can now sign in with your new credentials.
                </p>

                <Link
                  to="/login"
                  className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-teal-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Sign In with New Password</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
