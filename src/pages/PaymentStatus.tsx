import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Loader2, Home, RefreshCw } from 'lucide-react';
import { auth, getUserProfile } from '../lib/firebase';

export const PaymentStatus: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const statusId = searchParams.get('status_id');
  const billCode = searchParams.get('billcode') || searchParams.get('billCode');
  const orderId = searchParams.get('order_id') || searchParams.get('orderId');

  const [isVerifying, setIsVerifying] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'FAILED' | 'PENDING'>('PENDING');
  const [message, setMessage] = useState('Checking your payment with the bank...');
  const [planName, setPlanName] = useState<string>('');

  const verifyPayment = async () => {
    setIsVerifying(true);
    try {
      const currentUser = auth.currentUser;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          headers['Authorization'] = `Bearer ${idToken}`;
        } catch (e) {
          console.warn("Could not get idToken:", e);
        }
      }

      const res = await fetch('/api/payment/reconcile', {
        method: 'POST',
        headers,
        body: JSON.stringify({ billCode, orderId })
      });

      const data = await res.json();

      if (data.success && data.status === 'SUCCESS') {
        setStatus('SUCCESS');
        setPlanName(data.planName || data.plan || '');
        setMessage(data.message || `Payment received. Your ${data.planName || 'plan'} is ready!`);

        // Refresh user profile in background
        if (currentUser) {
          try {
            await getUserProfile(currentUser.uid);
            // Trigger storage event so App.tsx listeners can refresh
            window.dispatchEvent(new Event('ez_profile_updated'));
          } catch (e) {
            console.warn("Profile refresh error:", e);
          }
        }
      } else if (data.status === 'FAILED' || data.status === 'REJECTED') {
        setStatus('FAILED');
        setMessage(data.message || 'Payment was cancelled or could not be completed.');
      } else {
        // Pending
        setStatus('PENDING');
        setMessage(data.message || 'Your payment is still being processed by the bank. Please check again in a moment.');
      }
    } catch (err: any) {
      console.error("Reconciliation error:", err);
      setStatus('PENDING');
      setMessage('We could not confirm your payment yet. Please sign in and check again.');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyPayment();
  }, [billCode, orderId, statusId]);

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-6 text-white">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-4 sm:p-8 sm:p-10 text-center space-y-8 border border-white/10"
      >
        {isVerifying ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Checking Your Payment</h2>
            <p className="text-white/50 text-sm max-w-xs mx-auto">
              Please wait while we check your payment with your bank...
            </p>
          </div>
        ) : status === 'SUCCESS' ? (
          <>
            <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Payment Received!</h1>
              <p className="text-white/60 text-sm">{message}</p>
              {planName && (
                <div className="inline-block px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-full border border-primary/20 mt-2">
                  {planName} Active
                </div>
              )}
            </div>

            {(billCode || orderId) && (
              <div className="p-4 bg-white/5 rounded-2xl text-left space-y-1.5 border border-white/5 text-xs">
                {billCode && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Bill Code</span>
                    <span className="font-mono text-white/80">{billCode}</span>
                  </div>
                )}
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Order Ref</span>
                    <span className="font-mono text-white/80">{orderId}</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : status === 'FAILED' ? (
          <>
            <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <XCircle size={48} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Payment Not Completed</h1>
              <p className="text-white/60 text-sm">{message}</p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-4 bg-primary text-obsidian font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary/90 transition-all"
              >
                Try Again
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={48} />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold">Payment Processing</h1>
              <p className="text-white/60 text-sm">{message}</p>
            </div>
            <button
              onClick={verifyPayment}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
            >
              <RefreshCw size={14} />
              Check Again
            </button>
          </>
        )}

        <div className="pt-4 space-y-3">
          <Link 
            to="/app" 
            className="w-full py-4 bg-primary text-obsidian font-bold uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-md"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </Link>
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 text-white/40 hover:text-white transition-colors text-xs"
          >
            <Home size={14} />
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
