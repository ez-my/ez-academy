import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft, Loader2, Mail, Lock, CheckCircle2, AlertCircle, RefreshCw, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { loginWithEmail, registerWithEmail, resetPassword, auth, sendVerification, logout, getFriendlyFirebaseError } from '../lib/firebase';
import { toast } from 'react-hot-toast';

interface AuthProps {
  onLogin: () => Promise<void>;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verifyingStatus, setVerifyingStatus] = useState(false);

  const [verificationEmail, setVerificationEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [resendWait, setResendWait] = useState(0);

  useEffect(() => onAuthStateChanged(auth, user => {
    setVerificationEmail(user?.email || '');
    setNeedsVerification(!!user && !user.emailVerified && !user.isAnonymous);
  }), []);
  useEffect(() => {
    if (!resendWait) return;
    const timer = setTimeout(() => setResendWait(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [resendWait]);

  const validateEmail = (email: string) => {
    return email.length <= 254 && /^\S+@\S+\.\S+$/.test(email.trim());
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoggingIn(true);
    try {
      await resetPassword(email.trim());
      setSuccess("If you have an account, check your inbox or spam folder for the reset link.");
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        setSuccess("If you have an account, check your inbox or spam folder for the reset link.");
        return;
      }
      console.error("Reset failed:", err);
      const friendlyMsg = err?.code === 'auth/too-many-requests' ? "Too many requests. Please wait and try again." : "Could not send the email. Please try again.";
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isResetting) return handlePasswordReset(e);
    
    setError(null);
    setSuccess(null);
    
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isResetting && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoggingIn(true);
    try {
      if (isRegistering) {
        await registerWithEmail(email.trim(), password);
        setSuccess("Check your inbox or spam folder for the verification email.");
        setResendWait(60);
        setNeedsVerification(true);
      } else {
        const user = await loginWithEmail(email.trim(), password);
        if (user && !user.emailVerified) {
          setNeedsVerification(true);
        }
      }
    } catch (err: any) {
      console.error("Auth attempt failed:", err);
      let friendlyMsg = "";
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        setNeedsVerification(true);
        setVerificationEmail(auth.currentUser.email || email.trim());
      }
      if (err?.code === 'auth/operation-not-allowed') {
        friendlyMsg = "Email/Password authentication is disabled.";
      } else if (err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        friendlyMsg = "Invalid email or password.";
      } else if (err?.code === 'auth/email-already-in-use') {
        friendlyMsg = "An account with this email already exists.";
      } else {
        friendlyMsg = err?.message?.startsWith("Your account was created") ? err.message : getFriendlyFirebaseError(err);
      }
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleResend = async () => {
    if (sendingEmail || resendWait) return;
    setSendingEmail(true);setError(null);setSuccess(null);
    try {
      await sendVerification();
      setSuccess("Email sent. Check your inbox or spam folder.");
      setResendWait(60);
    } catch {
      setError("Could not send the email. Wait 1 minute and try again.");
      setResendWait(60);
    } finally {setSendingEmail(false);}
  };

  const checkVerification = async () => {
    setVerifyingStatus(true);
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          await auth.currentUser.getIdToken(true);
          // Refresh both Firebase claims and the app after verification.
          window.location.reload(); 
        } else {
          setError("Email not verified yet. Please click the link in the email we sent you.");
        }
      }
    } catch (err) {
      setError("Error checking status. Please refresh the page.");
    } finally {
      setVerifyingStatus(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (err: any) {
      console.error("Login attempt failed:", err);
      if (err?.code === 'auth/unauthorized-domain' || err?.message?.includes('unauthorized-domain')) {
        setError(`Domain not authorized. Please add "${window.location.hostname}" to 'Authorized domains' in your Firebase Auth settings (Auth > Settings > Authorized domains).`);
      } else if (err?.code === 'auth/popup-blocked') {
        setError("Login popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setError("Login process was cancelled or timed out. Please try again.");
      } else if (err?.code === 'auth/network-request-failed') {
        setError("Network error detected. Please check your internet connection or third-party cookie settings.");
      } else {
        setError(err?.message || "Login failed. Please ensure Google Sign-In is enabled in your Firebase Console.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (needsVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-obsidian relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md glass-card p-4 sm:p-12 text-center space-y-8 relative z-10 border-primary/30"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-3xl mx-auto flex items-center justify-center text-primary animate-pulse">
            <Mail size={40} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-white/50 leading-relaxed">
              Verify your account using the email for <span className="text-white font-bold">{verificationEmail}</span>. 
              Check your inbox or spam folder, then open the link.
            </p>
          </div>

          <div className="space-y-3">
            <button 
              onClick={checkVerification}
              disabled={verifyingStatus}
              className="w-full py-3 bg-primary text-obsidian rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {verifyingStatus ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
              I verified my email
            </button>
            <button 
              onClick={handleResend}
              disabled={sendingEmail || resendWait > 0}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-50"
            >
              {sendingEmail ? "Sending…" : resendWait ? `Send again in ${resendWait}s` : "Send email again"}
            </button>
          </div>

          <div className="pt-6 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Wrong email? or having trouble?</p>
            <button 
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="text-primary hover:underline text-sm font-bold flex items-center gap-2 mx-auto"
            >
              <LogOut size={14} /> LOG OUT
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-obsidian relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors z-20 text-sm font-bold uppercase tracking-widest">
        <ArrowLeft size={16} />
        Back to Home
      </Link>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          boxShadow: isLoggingIn ? "0 0 40px rgba(var(--primary-rgb), 0.1)" : "0 0 0px rgba(0,0,0,0)"
        }}
        className={`w-full max-w-md glass-card p-4 sm:p-8 md:p-12 text-center space-y-8 relative z-10 transition-all duration-500 ${isLoggingIn ? 'border-primary/30 ring-1 ring-primary/20 bg-primary/[0.02]' : ''}`}
      >
        <header className="space-y-4">
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-primary rounded-[1.5rem] mx-auto flex items-center justify-center text-obsidian"
          >
            <Sparkles size={32} />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight font-display">EZ <span className="text-primary italic">Academy</span></h1>
            <p className="text-white/40 uppercase tracking-[0.3em] font-bold text-[10px] underline decoration-primary underline-offset-4 decoration-2">Learn English with Confidence</p>
          </div>
        </header>

        <div className="space-y-6">
          {!isResetting && (
            <>
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-4 bg-white text-obsidian font-bold py-4 rounded-xl hover:bg-primary transition-all group overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                {isLoggingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                ) : (
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 relative z-10" />
                )}
                <span className="relative z-10">{isLoggingIn ? "Logging in…" : "Login with Google"}</span>
              </button>
              
              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-xs uppercase tracking-widest text-white/30 font-bold">Or Email</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>
            </>
          )}

          {isResetting && (
            <div className="text-left space-y-2">
              <h2 className="text-lg font-bold text-white">Reset Password</h2>
              <p className="text-sm text-white/50">Enter your email address and we'll send you a link to reset your password.</p>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
            <div className="space-y-2">
              <label htmlFor="auth-email" className="text-xs font-bold text-white/60">Email</label>
              <div className="relative">
                <input 
                  type="email"
                  id="auth-email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@ezacademy.my"
                  className="w-full bg-obsidian border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              </div>
            </div>
            
            {!isResetting && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="text-xs font-bold text-white/60">Password</label>
                  {!isRegistering && (
                    <button 
                      type="button"
                      onClick={() => { setIsResetting(true); setError(null); setSuccess(null); }}
                      className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline hover:text-primary/80 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="password"
                    id="auth-password"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-obsidian border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                    required
                    minLength={6}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                </div>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all border border-primary/20 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : isResetting ? (
                "Send Reset Link"
              ) : isRegistering ? (
                "Register Account"
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="text-xs text-white/50 text-center space-y-4">
            {!isResetting ? (
              <p>
                {isRegistering ? "Already have an account?" : "Don't have an account?"}
                <button 
                  type="button"
                  onClick={() => { setIsRegistering(!isRegistering); setError(null); setSuccess(null); }} 
                  className="ml-2 text-primary font-bold hover:underline underline-offset-4"
                >
                  {isRegistering ? "Log In" : "Register"}
                </button>
              </p>
            ) : (
              <button 
                type="button"
                onClick={() => { setIsResetting(false); setError(null); setSuccess(null); }}
                className="text-primary font-bold hover:underline underline-offset-4 uppercase tracking-widest text-[10px]"
              >
                Back to Login
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center animate-shake">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs font-medium text-left flex gap-3">
              <CheckCircle2 className="shrink-0" size={16} />
              <p>{success}</p>
            </div>
          )}
        </div>

        <footer className="pt-6 border-t border-white/10">
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-bold">
            Trusted by EZ Academy students nationwide
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

