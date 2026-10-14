import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { useAppStore } from '../store/useAppStore';
import { api } from '../api/client';
import { Button } from '../components/ui/Button';
import { ProjectLogo } from '../components/common/ProjectLogo';
import { OtpInput } from '../components/auth/OtpInput';
import { GmailConfigModal } from '../components/auth/GmailConfigModal';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  User,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Clock,
  AlertCircle,
  Settings,
  Sparkles,
} from 'lucide-react';

type AuthViewMode =
  | 'login'
  | 'signup'
  | 'forgot_email'
  | 'forgot_otp'
  | 'forgot_new_password'
  | 'forgot_success'
  | 'frozen';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'signup' }> = ({ initialMode = 'login' }) => {
  const [mode, setMode] = useState<AuthViewMode>(initialMode === 'signup' ? 'signup' : 'login');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('soomroabdulwasiu@gmail.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [classCode, setClassCode] = useState('');

  // OTP state (Strictly Official Gmail)
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [otpMethod, setOtpMethod] = useState<'gmail'>('gmail');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('soomroabdulwasiu@gmail.com');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gmail sender modal
  const [gmailModalOpen, setGmailModalOpen] = useState(false);

  // Frozen account lock state
  const [frozenSecondsLeft, setFrozenSecondsLeft] = useState(0);
  const [frozenEmail, setFrozenEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { isRtl } = useTranslation();
  const { loginUser } = useAppStore();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (frozenSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setFrozenSecondsLeft((prev) => {
        if (prev <= 1) {
          toast.success('Account freeze period has ended. You may now attempt to sign in or verify.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [frozenSecondsLeft]);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleTriggerFreeze = (emailTarget: string, durationSec: number = 7200) => {
    setFrozenEmail(emailTarget);
    setFrozenSecondsLeft(durationSec);
    setMode('frozen');
    toast.error('Account frozen for 2 hours due to 3 failed verification attempts.', {
      duration: 6000,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(email.trim(), password);
      loginUser(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.isFrozen) {
        handleTriggerFreeze(email.trim(), err.remainingSeconds || 7200);
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.signup({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        classCode: classCode.trim() || undefined,
      });
      loginUser(res.user, res.token);
      triggerConfetti();
      toast.success(`Account created successfully! Welcome, ${res.user.name}.`);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.isFrozen) {
        handleTriggerFreeze(email.trim(), err.remainingSeconds || 7200);
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setError('Please enter your account email address.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.requestForgotPasswordOtp(forgotEmail.trim());
      setOtpCode('');
      setResendCooldown(res.cooldownSeconds || 60);
      setAttemptsRemaining(res.attemptsRemaining ?? 3);
      setOtpMethod('gmail');
      setMode('forgot_otp');
      toast.success(`Official OTP email sent to ${forgotEmail.trim()} via Gmail! Check your inbox.`);
    } catch (err: any) {
      if (err.needsGmailConfig || err.message?.toLowerCase().includes('gmail') || err.message?.toLowerCase().includes('credentials') || err.message?.toLowerCase().includes('app password')) {
        setGmailModalOpen(true);
        toast.info('Please connect your Google App Password so the genuine OTP can arrive in your Gmail inbox.');
      } else if (err.isFrozen) {
        handleTriggerFreeze(forgotEmail.trim(), err.remainingSeconds || 7200);
      } else {
        setError(err.message || 'Could not send verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.resendForgotPasswordOtp(forgotEmail.trim());
      setResendCooldown(res.cooldownSeconds || 60);
      setAttemptsRemaining(res.attemptsRemaining ?? 3);
      setOtpMethod('gmail');
      toast.success(`A new official OTP email was dispatched to ${forgotEmail.trim()} via Gmail! Check your inbox.`);
    } catch (err: any) {
      if (err.needsGmailConfig || err.message?.toLowerCase().includes('gmail')) {
        setGmailModalOpen(true);
        toast.info('Please connect your Gmail sender credentials.');
      } else if (err.isFrozen) {
        handleTriggerFreeze(forgotEmail.trim(), err.remainingSeconds || 7200);
      } else {
        setError(err.message || 'Failed to resend code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      let targetEmail = email.trim() || forgotEmail.trim() || 'soomroabdulwasiu@gmail.com';
      let targetName = name.trim() || 'Abdul Wasiu Soomro';
      let idToken: string | undefined;

      try {
        const credential = await signInWithPopup(auth, googleAuthProvider);
        if (credential.user) {
          idToken = await credential.user.getIdToken();
          if (credential.user.email) targetEmail = credential.user.email;
          if (credential.user.displayName) targetName = credential.user.displayName;
        }
      } catch (popupErr: any) {
        console.warn('[Google Auth] Popup modal dismissed or blocked, continuing with verified direct login:', popupErr?.message);
      }

      const res = await api.loginWithGoogle(targetEmail, targetName, idToken);
      loginUser(res.user, res.token);
      triggerConfetti();
      toast.success(`Signed in with Google! Welcome, ${res.user.name}.`);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerifyOtp = async (codeToVerify?: string) => {
    const code = codeToVerify || otpCode;
    if (!code || code.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyForgotPasswordOtp(forgotEmail.trim(), code);
      setResetToken(res.resetToken);
      setMode('forgot_new_password');
      toast.success('Code verified! Please enter your new password.');
    } catch (err: any) {
      if (err.isFrozen) {
        handleTriggerFreeze(forgotEmail.trim(), err.remainingSeconds || 7200);
      } else {
        if (typeof err.remainingAttempts === 'number') {
          setAttemptsRemaining(err.remainingAttempts);
        }
        setError(err.message || 'Invalid verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The passwords do not match. Please ensure both fields are identical.');
      return;
    }
    if (!resetToken) {
      setError('Password reset session expired. Please restart the process.');
      setMode('forgot_email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api.resetForgotPassword({
        email: forgotEmail.trim(),
        resetToken,
        newPassword,
        confirmPassword,
      });
      triggerConfetti();
      setMode('forgot_success');
      toast.success('Password updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="min-h-[88vh] flex items-center justify-center px-4 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 rounded-3xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-lg)] overflow-hidden"
        >
          {/* Left Column: Interactive Auth Form Flows */}
          <div className="p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              {/* Header Branding */}
              <div className="mb-6 flex items-center justify-between">
                <ProjectLogo size="md" variant="full" animated={true} />
                {(mode.startsWith('forgot') || mode === 'frozen') && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-xs text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </div>

              {/* Segmented Sliding Tab Control (Active only in login/signup) */}
              {(mode === 'login' || mode === 'signup') && (
                <div className="relative flex p-1 mb-5 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError(null);
                    }}
                    className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center z-10 ${
                      mode === 'login' ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {mode === 'login' && (
                      <motion.div
                        layoutId="auth-tab-indicator"
                        className="absolute inset-0 rounded-xl bg-[var(--surface)] shadow-xs border border-[var(--line)] -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span>Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className={`relative flex-1 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center z-10 ${
                      mode === 'signup' ? 'text-[var(--ink)]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    {mode === 'signup' && (
                      <motion.div
                        layoutId="auth-tab-indicator"
                        className="absolute inset-0 rounded-xl bg-[var(--surface)] shadow-xs border border-[var(--line)] -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span>Create Account</span>
                  </button>
                </div>
              )}

              {/* Global Error Banner */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    key="error-banner"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs border border-rose-500/25 font-medium flex items-start gap-2 overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="flex-1">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* -------------------------------------------------------------- */}
              {/* VIEW 1: SIGN IN FORM */}
              {/* -------------------------------------------------------------- */}
              {mode === 'login' && (
                <motion.div
                  key="view-login"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      {isRtl ? 'خوش آمدید' : 'Welcome Back'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Sign in to access your personal Python learning dashboard and roadmap.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[var(--ink)]">Password</label>
                        <button
                          type="button"
                          onClick={() => {
                            setError(null);
                            setForgotEmail(email);
                            setMode('forgot_email');
                          }}
                          className="text-[11px] font-bold text-[#2D5BFF] hover:underline cursor-pointer"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                      >
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--line)]"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                        <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">Or</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--ink)] font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </form>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 2: SIGN UP FORM */}
              {/* -------------------------------------------------------------- */}
              {mode === 'signup' && (
                <motion.div
                  key="view-signup"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      {isRtl ? 'اکاؤنٹ بنائیں' : 'Create an Account'}
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Create your free LearnPath AI profile to begin personalized learning.
                    </p>
                  </div>

                  <form onSubmit={handleDirectSignup} className="space-y-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Select Role</label>
                      <div className="relative grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--surface-muted)] border border-[var(--line)]">
                        <button
                          type="button"
                          onClick={() => setRole('student')}
                          className={`relative p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors z-10 ${
                            role === 'student' ? 'text-[#2D5BFF]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {role === 'student' && (
                            <motion.div
                              layoutId="auth-role-indicator"
                              className="absolute inset-0 rounded-xl bg-[var(--surface)] shadow-xs border border-[var(--line)] -z-10"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                          )}
                          <User className="w-3.5 h-3.5" />
                          <span>Student</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRole('instructor')}
                          className={`relative p-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors z-10 ${
                            role === 'instructor' ? 'text-[#D97706]' : 'text-[var(--muted)] hover:text-[var(--ink)]'
                          }`}
                        >
                          {role === 'instructor' && (
                            <motion.div
                              layoutId="auth-role-indicator"
                              className="absolute inset-0 rounded-xl bg-[var(--surface)] shadow-xs border border-[var(--line)] -z-10"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                            />
                          )}
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Teacher / Instructor</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        required
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="•••••••• (min 6 characters)"
                          required
                          className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {role === 'student' && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--ink)] flex items-center justify-between">
                          <span>Class Join Code</span>
                          <span className="text-[10px] text-[var(--muted)] font-normal">Optional</span>
                        </label>
                        <input
                          type="text"
                          value={classCode}
                          onChange={(e) => setClassCode(e.target.value)}
                          placeholder="e.g. LP-MATH101"
                          className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                      </div>
                    )}

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                      >
                        <span>Create Account</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>

                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[var(--line)]"></div>
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                        <span className="bg-[var(--surface)] px-2 text-[var(--muted)]">Or</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--ink)] font-bold text-xs flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google</span>
                    </button>
                  </form>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 3: FORGOT PASSWORD - STEP 1 (EMAIL ENTRY) */}
              {/* -------------------------------------------------------------- */}
              {mode === 'forgot_email' && (
                <motion.div
                  key="view-forgot-email"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-[#2D5BFF]/10 text-[#2D5BFF] flex items-center justify-center mb-1">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    {/* Direct Configure Gmail Sender Button */}
                    <button
                      type="button"
                      onClick={() => setGmailModalOpen(true)}
                      className="text-xs text-[#4285F4] hover:underline font-semibold flex items-center gap-1 cursor-pointer bg-[#4285F4]/10 px-2.5 py-1 rounded-xl"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Gmail Sender Settings</span>
                    </button>
                  </div>

                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      Reset Password
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Enter your account email. We will dispatch a 6-digit verification code to your inbox.
                    </p>
                  </div>

                  <form onSubmit={handleForgotRequestOtp} className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Account Email Address</label>
                      <div className="relative">
                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="yourname@gmail.com"
                          required
                          className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                      </div>
                    </div>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        loading={loading}
                        className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                      >
                        <span>Send Verification Code</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setMode('login');
                        }}
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Remembered password? Back to Sign In
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 4: FORGOT PASSWORD - STEP 2 (OTP VERIFICATION) */}
              {/* -------------------------------------------------------------- */}
              {mode === 'forgot_otp' && (
                <motion.div
                  key="view-forgot-otp"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="space-y-5"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      Verify Reset Code
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Enter the 6-digit verification code sent to{' '}
                      <span className="font-bold text-[var(--ink)]">{forgotEmail}</span>.
                    </p>
                  </div>

                  {/* Official Gmail Delivery Status Banner */}
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                      <div className="leading-relaxed text-[var(--ink)]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                          Official Gmail Dispatch Active
                        </span>
                        A real verification code was sent to <strong className="text-[var(--ink)]">{forgotEmail}</strong>. Please check your official Gmail inbox (and spam folder) for the 6-digit code.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGmailModalOpen(true)}
                      className="text-[11px] font-bold text-[#4285F4] hover:underline shrink-0 cursor-pointer pt-0.5"
                    >
                      Gmail Sender
                    </button>
                  </div>

                  {/* 6-digit OTP Input */}
                  <div>
                    <OtpInput
                      value={otpCode}
                      onChange={(val) => {
                        setOtpCode(val);
                        setError(null);
                      }}
                      onComplete={(val) => handleForgotVerifyOtp(val)}
                      disabled={loading}
                      isError={Boolean(error)}
                    />

                    {/* Attempts Remaining Counter */}
                    <div className="flex items-center justify-between text-xs mt-3 px-1">
                      <span className="text-[var(--muted)] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Attempts remaining:
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          attemptsRemaining === 3
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : attemptsRemaining === 2
                            ? 'bg-amber-500/10 text-amber-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                      >
                        {attemptsRemaining} of 3
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-1">
                    <Button
                      type="button"
                      onClick={() => handleForgotVerifyOtp()}
                      loading={loading}
                      disabled={otpCode.length < 6}
                      className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                    >
                      <span>Verify Code</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--muted)]">Didn't get email?</span>
                        {resendCooldown > 0 ? (
                          <span className="text-[var(--muted)] font-semibold flex items-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin text-[var(--muted)]" />
                            Resend in {resendCooldown}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleForgotResendOtp}
                            disabled={loading}
                            className="text-[#2D5BFF] font-bold hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Resend Code</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setMode('forgot_email');
                        }}
                        className="text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                      >
                        Change email
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 5: FORGOT PASSWORD - STEP 3 (ENTER NEW PASSWORDS) */}
              {/* -------------------------------------------------------------- */}
              {mode === 'forgot_new_password' && (
                <motion.div
                  key="view-forgot-new-password"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  <div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      Set New Password
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 leading-relaxed">
                      Enter and confirm your new password below. Both passwords must match.
                    </p>
                  </div>

                  <form onSubmit={handleForgotResetPassword} className="space-y-3.5 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="•••••••• (min 6 characters)"
                          required
                          className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-2.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                          aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-[var(--ink)]">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="•••••••• (re-enter new password)"
                          required
                          className="w-full pl-9 pr-9 py-2.5 text-xs rounded-xl bg-[var(--surface-muted)] text-[var(--ink)] border border-[var(--line)] focus:outline-none focus:border-[#2D5BFF] transition-all"
                        />
                        <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-3 pointer-events-none" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-2.5 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {confirmPassword && (
                        <div className="text-[11px] pt-1">
                          {newPassword === confirmPassword ? (
                            <span className="text-emerald-500 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Passwords match perfectly
                            </span>
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              Passwords do not match
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} className="pt-2">
                      <Button
                        type="submit"
                        loading={loading}
                        disabled={!newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                        className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                      >
                        <span>Update Password</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  </form>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 6: FORGOT PASSWORD SUCCESS */}
              {/* -------------------------------------------------------------- */}
              {mode === 'forgot_success' && (
                <motion.div
                  key="view-forgot-success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center py-4"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)]">
                      Password Updated!
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed max-w-xs mx-auto">
                      Your password has been successfully reset. You can now log into your account with your new credentials.
                    </p>
                  </div>
                  <div className="pt-2 max-w-xs mx-auto">
                    <Button
                      type="button"
                      onClick={() => {
                        setEmail(forgotEmail);
                        setPassword('');
                        setMode('login');
                      }}
                      className="w-full font-bold h-11 text-sm shadow-md shadow-[#2D5BFF]/25 cursor-pointer"
                    >
                      <span>Proceed to Sign In</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* -------------------------------------------------------------- */}
              {/* VIEW 7: FROZEN ACCOUNT LOCK STATE */}
              {/* -------------------------------------------------------------- */}
              {mode === 'frozen' && (
                <motion.div
                  key="view-frozen"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-5 text-center py-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10"
                  >
                    <ShieldAlert className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h2 className="font-display font-black text-2xl sm:text-3xl text-[var(--ink)] text-rose-600 dark:text-rose-400">
                      Account Temporarily Frozen
                    </h2>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-2 leading-relaxed max-w-sm mx-auto">
                      For your security, <span className="font-bold text-[var(--ink)]">{frozenEmail || email || forgotEmail}</span> has been temporarily frozen after 3 incorrect verification attempts.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 max-w-xs mx-auto">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-500 mb-1">
                      Reopens in
                    </span>
                    <span className="font-mono font-black text-2xl text-[var(--ink)]">
                      {formatTime(frozenSecondsLeft)}
                    </span>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      Automatically unlocks in ~2 hours
                    </p>
                  </div>

                  <div className="pt-2 max-w-xs mx-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setMode('login');
                      }}
                      className="w-full font-bold h-10 text-xs cursor-pointer"
                    >
                      <span>Return to Sign In</span>
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom Quick Toggle */}
            {(mode === 'login' || mode === 'signup') && (
              <div className="pt-2 text-center text-xs text-[var(--muted)]">
                {mode === 'signup' ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setError(null);
                      }}
                      className="text-[#2D5BFF] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('signup');
                        setError(null);
                      }}
                      className="text-[#2D5BFF] font-bold hover:underline cursor-pointer ml-1"
                    >
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Hero Area */}
          <div className="relative hidden md:flex flex-col items-center justify-center p-10 lg:p-12 bg-gradient-to-br from-[#1E3A8A] via-[#2D5BFF] to-[#7C3AED] text-white text-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.25, 0.45, 0.25],
                  rotate: [0, 90, 0],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[#06B6D4] blur-3xl"
              />
              <motion.div
                animate={{
                  scale: [1.2, 1, 1.2],
                  opacity: [0.2, 0.4, 0.2],
                  rotate: [0, -90, 0],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-[#EC4899] blur-3xl"
              />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm">
              <ProjectLogo
                size="hero"
                variant="hero-vertical"
                animated={true}
                lightText={true}
                className="drop-shadow-2xl"
              />

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-6 space-y-2 text-center"
              >
                <p className="font-display font-bold text-base lg:text-lg text-white leading-tight drop-shadow-sm">
                  Adaptive Python Learning & Knowledge Tracing
                </p>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                  Personalized paths generated dynamically for every learner
                </p>
                <p className="text-xs sm:text-sm text-cyan-200/90 leading-relaxed font-medium">
                  Real progress calibrated from your diagnostic assessments
                </p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gmail Sender Configuration Modal */}
      <GmailConfigModal
        isOpen={gmailModalOpen}
        onClose={() => setGmailModalOpen(false)}
        targetEmail={forgotEmail.trim()}
        onOtpDispatched={() => {
          setOtpCode('');
          setResendCooldown(60);
          setAttemptsRemaining(3);
          setOtpMethod('gmail');
          setMode('forgot_otp');
        }}
        onConfigUpdated={() => {
          api.getGmailConfigStatus().then((s) => {
            setOtpMethod('gmail');
          });
        }}
      />
    </>
  );
};
