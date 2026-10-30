import {savedReferral,saveReferral} from '../lib/affiliate';
import { PACKAGES } from '../packages';
import { usePublishedPackages } from '../lib/publishedPrices';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  MessageCircle,
  AlertCircle,
  UploadCloud,
  FileCheck,
  ExternalLink,
  Info
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { trackEvent } from '../lib/analytics';
import { cn } from '../lib/utils';

interface PlanOption {
  id: keyof typeof PACKAGES;
  name: string;
  price: number;
  description: string;
  badge?: string;
  aiUnits: number;
  creditsGrant?:number;
}


type PaymentMethodType = 'fpx' | 'bank_transfer' | 'duitnow_qr';

export function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState(auth.currentUser);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('fpx');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentPhone, setPaymentPhone] = useState('');
  const [channelsLoading, setChannelsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Channels & Bank Info from server
  const [channels, setChannels] = useState<{
    fpx: boolean;
    duitnow_qr: boolean;
    bank_transfer: boolean;
    isQrAvailable: boolean;
    isAccountTransferAvailable: boolean;
    bankDetails: {
      bankName: string;
      accountHolder: string;
      accountNumber: string;
      bankQrImageUrl?: string;
      whatsappNumber?: string;
      instructions?: string;
    };
  }>({
    fpx: false,
    duitnow_qr: false,
    bank_transfer: false,
    isQrAvailable: false,
    isAccountTransferAvailable: false,
    bankDetails: {
      bankName: 'Maybank',
      accountHolder: 'Mohamad Shahrilniza',
      accountNumber: '',
      whatsappNumber: '601110043567'
    }
  });

  // Manual Bank Order State
  const [manualOrder, setManualOrder] = useState<{
    txId: string;
    orderReference: string;
    amount: number;
    planName: string;
  } | null>(null);

  // Receipt submission state
  const [receiptRefNumber, setReceiptRefNumber] = useState('');
  const [receiptImageBase64, setReceiptImageBase64] = useState<string>('');
  const [receiptFileName, setReceiptFileName] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [receiptSubmitted, setReceiptSubmitted] = useState(false);
  const orderKey = user ? `ez_manual_order_v3_${user.uid}_${searchParams.get('plan') || 'plus'}` : '';
  useEffect(() => {
    if (!orderKey) return;
    try {const saved=localStorage.getItem(orderKey); if (saved) {const data=JSON.parse(saved); setManualOrder(data.order); setReceiptSubmitted(Boolean(data.submitted));}} catch {}
  }, [orderKey]);
  useEffect(() => {
    if (orderKey && manualOrder) localStorage.setItem(orderKey, JSON.stringify({order:manualOrder,submitted:receiptSubmitted}));
  }, [orderKey,manualOrder,receiptSubmitted]);

  const requestedPlan=searchParams.get('plan')||'plus';
  const [referralCode,setReferralCode]=useState(savedReferral);
  const planId=({basic:'lite',pro:'plus',pro_plus:'max',credits:'boost_plus'} as Record<string,string>)[requestedPlan]||requestedPlan;
  // The price shown on the checkout screen must match what the server will bill.
  const PLANS: PlanOption[] = Object.values(usePublishedPackages());
  const selectedPlan = PLANS.find(p => p.id === planId) || PLANS.find(p => p.id === 'plus')!;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });

    // Fetch payment channels
    fetch('/api/payment/channels')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setChannels(data);
        }
      })
      .catch(err => {
        console.warn("Could not fetch payment channels:", err);
      })
      .finally(() => {
        setChannelsLoading(false);
      });

    return () => unsubscribe();
  }, []);

  // Handle Online Banking (FPX) Checkout
  const handleFpxCheckout = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent('/checkout?plan=' + selectedPlan.id));
      return;
    }

    if (!/^(?:0|60)[0-9]{8,12}$/.test(paymentPhone.replace(/[^0-9]/g, ''))) {setError('Enter your Malaysian phone number for the payment.');return;}
    setIsLoading(true);
    setError(null);

    const paymentWindow = window.open('about:blank', '_blank');

    trackEvent('checkout_started', { plan: selectedPlan.id, method: selectedMethod === 'duitnow_qr' ? 'duitnow_qr' : 'fpx', source: 'checkout_page' });

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          referralCode,
          channel: selectedMethod === 'duitnow_qr' ? 'duitnow_qr' : 'fpx',
          userPhone: paymentPhone,
          userEmail: user.email,
          userName: user.displayName || 'EZ Academy Student'
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (paymentWindow) paymentWindow.close();
        throw new Error(data.message || 'Could not start payment. Please try again.');
      }

      if (data.redirectUrl) {
        if (paymentWindow) {
          paymentWindow.location.href = data.redirectUrl;
        } else {
          window.location.href = data.redirectUrl;
        }
      } else {
        if (paymentWindow) paymentWindow.close();
        throw new Error('Payment gateway did not return a valid payment link.');
      }
    } catch (err: any) {
      if (paymentWindow) paymentWindow.close();
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Bank Transfer Order Creation
  const handleCreateBankOrder = async () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent('/checkout?plan=' + selectedPlan.id));
      return;
    }

    setIsLoading(true);
    setError(null);

    trackEvent('checkout_started', { plan: selectedPlan.id, method: 'bank_transfer', source: 'checkout_page' });

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/payment/manual/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          referralCode
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not create bank payment order.');
      }

      setManualOrder({
        txId: data.txId,
        orderReference: data.orderReference,
        amount: data.amount,
        planName: data.planName
      });
    } catch (err: any) {
      console.error("Bank order error:", err);
      setError(err.message || 'Could not start bank payment.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Receipt Upload File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024 || !['image/png','image/jpeg','image/webp'].includes(file.type)) {
      setError("Use a PNG, JPG or WebP receipt smaller than 3 MB.");
      return;
    }

    setReceiptFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Receipt Submission
  const handleSubmitReceipt = async () => {
    if (!user || !manualOrder) return;
    if (!receiptImageBase64 && !receiptRefNumber.trim()) {
      setError("Please add your bank reference number or upload a screenshot of your receipt.");
      return;
    }

    setIsSubmittingReceipt(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/payment/manual/submit-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          txId: manualOrder.txId,
          receiptUrl: receiptImageBase64 || null,
          transactionReference: receiptRefNumber.trim(),
          notes: receiptNotes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit receipt.');
      }

      setReceiptSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Could not submit receipt. Please try again.');
    } finally {
      setIsSubmittingReceipt(false);
    }
  };

  const whatsappPhone = channels.bankDetails?.whatsappNumber || '601110043567';
  const whatsappMessage = manualOrder 
    ? encodeURIComponent(`Hi EZ Academy, Please verify my QR payment and approve my upgrade. Order: ${manualOrder.orderReference}. Plan: ${selectedPlan.name}. Amount: RM${selectedPlan.price}. Account: ${user?.email || user?.uid}. I will attach my receipt here.`)
    : encodeURIComponent(`Hi EZ Academy, I would like to pay for ${selectedPlan.name} (RM${selectedPlan.price}).`);
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`;

  return (
    <div className="responsive-surface min-w-0 min-h-screen bg-obsidian text-white flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full space-y-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to plans
        </button>

        <div className="glass-card p-6 sm:p-8 border border-white/10 rounded-3xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Confirm Your Order
              </span>
              <h1 className="text-2xl font-black text-white">{selectedPlan.name}</h1>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-primary">RM{selectedPlan.price}</span>
              <span className="text-[10px] text-white/40 block">{['boost','boost_plus'].includes(selectedPlan.id) ? `${selectedPlan.aiUnits} AI + ${selectedPlan.creditsGrant} practice credits · no expiry` : `${'durationDays' in selectedPlan ? selectedPlan.durationDays : 0} days of access`}</span>
            </div>
          </div>

          <p className="text-xs text-white/60">
            {selectedPlan.description}{selectedPlan.id!=='boost'&&selectedPlan.id!=='boost_plus'&&<span className="block mt-2 text-xs text-white/60">If this subscription is already active, your new plan period starts after the current period ends. No automatic charges.</span>}
          </p>

          <label className="block text-sm text-white/80">Referral code (optional)
            <input aria-label="Referral code" className="mt-2 w-full rounded-xl border border-blue-300/30 bg-[#102b52] p-3 text-white" value={referralCode} maxLength={14} disabled={!!manualOrder} placeholder="Enter a friend’s code" onChange={e=>{const value=e.target.value.toUpperCase().trim();setReferralCode(value);saveReferral(value);}} />
            <span className="block text-xs text-white/50 mt-2">Your friend earns commission once this payment is confirmed.</span>
          </label>
          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/80 block">
              Choose payment method:
            </label>

            <div className="grid grid-cols-1 gap-3">
              {/* Option 1: FPX */}
              <button
                type="button"
                onClick={() => setSelectedMethod('fpx')}
                className={cn(
                  "p-4 rounded-2xl border text-left flex items-start gap-3 transition-all",
                  selectedMethod === 'fpx'
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  selectedMethod === 'fpx' ? "bg-primary text-obsidian" : "bg-white/10 text-white"
                )}>
                  <CreditCard size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">ToyyibPay (Online Banking)</span>
                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold">
                      Instant
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Pay securely using your Malaysian bank account (Maybank2u, CIMB Clicks, etc.).
                  </p>
                </div>
              </button>

              {/* Option 2: Bank transfer / Bank QR */}
              <button
                type="button"
                onClick={() => setSelectedMethod('bank_transfer')}
                className={cn(
                  "p-4 rounded-2xl border text-left flex items-start gap-3 transition-all",
                  selectedMethod === 'bank_transfer'
                    ? "bg-primary/10 border-primary shadow-sm"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  selectedMethod === 'bank_transfer' ? "bg-primary text-obsidian" : "bg-white/10 text-white"
                )}>
                  <Building2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">Manual QR + WhatsApp</span>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded-full font-bold">
                      Manual check
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    Scan the Maybank QR, then send your receipt on WhatsApp. Your upgrade starts after owner approval.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* METHOD SPECIFIC CONTENT */}

          {/* 1. FPX PAYMENT BUTTON */}
          {selectedMethod === 'fpx' && (
            <div className="space-y-4 pt-2">
              <label className="block text-sm text-white/70">Your phone number
                <input type="tel" autoComplete="tel" value={paymentPhone} onChange={e => setPaymentPhone(e.target.value)} placeholder="e.g. 0123456789" className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 p-3 text-white" />
              </label>
              <button
                disabled={isLoading}
                onClick={handleFpxCheckout}
                className="w-full py-4 bg-primary text-obsidian font-bold text-sm uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Pay RM{selectedPlan.price} with FPX
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-white/40">
                <ShieldCheck size={14} className="text-primary" />
                <span>Review the payment details before confirming with your bank.</span>
              </div>
            </div>
          )}

          {/* 2. BANK TRANSFER / BANK QR FLOW */}
          {selectedMethod === 'bank_transfer' && (
            <div className="space-y-4 pt-2">
              {/* Check if Bank Transfer is currently configured */}
              {!channels.bank_transfer && !channels.isQrAvailable && !channels.isAccountTransferAvailable ? (
                <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle size={16} />
                    <span>Bank payments are not ready yet</span>
                  </div>
                  <p className="text-yellow-200/80 leading-relaxed">
                    We cannot accept bank payment requests right now. Please contact us on WhatsApp, or use <strong>Online Banking (FPX)</strong> to activate your plan right now, or message us on WhatsApp.
                  </p>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-primary hover:underline font-bold mt-1"
                  >
                    <MessageCircle size={14} />
                    Contact support on WhatsApp ({channels.bankDetails.whatsappNumber})
                  </a>
                </div>
              ) : !manualOrder ? (
                /* Step A: Create Order */
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <img src="/payments/maybank-qr.png" alt="Maybank payment QR for Mohamad Shahrilniza" className="w-full max-w-sm h-auto mx-auto rounded-xl bg-white" />
                  <p className="text-sm text-white/70">Continue below to get your payment reference. After paying, send the receipt on WhatsApp for owner approval.</p>
                  <div className="text-xs space-y-1">
                    <div className="text-white/50">Bank: <strong className="text-white">{channels.bankDetails.bankName}</strong></div>
                    <div className="text-white/50">Account Holder: <strong className="text-white">{channels.bankDetails.accountHolder}</strong></div>
                    {channels.bankDetails.accountNumber && (
                      <div className="text-white/50">Account Number: <strong className="text-white font-mono">{channels.bankDetails.accountNumber}</strong></div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateBankOrder}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-primary text-obsidian font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Continue with QR payment"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm">
                  <div className="flex justify-between gap-3"><span>Order reference</span><strong className="text-primary font-mono">{manualOrder.orderReference}</strong></div>
                  <div className="flex justify-between gap-3"><span>Amount to pay</span><strong>RM{manualOrder.amount.toFixed(2)}</strong></div>
                  <img src="/payments/maybank-qr.png" alt="Maybank payment QR for Mohamad Shahrilniza" className="w-full max-w-sm h-auto mx-auto rounded-xl bg-white" />
                  <a href="/payments/maybank-qr.png" download="EZ-Academy-Maybank-QR.png" className="block text-center text-primary underline">Download QR image</a>
                  <p className="text-white/70">Pay the exact amount with your banking app. Tap below, attach your receipt in WhatsApp, and send it to the owner. Your upgrade waits for manual approval.</p>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full py-3.5 bg-[#25D366] text-white font-bold rounded-xl flex items-center justify-center gap-2"><MessageCircle size={16} />Send receipt on WhatsApp</a>
                  <p className="text-xs text-white/50">Opening WhatsApp prepares your message. Attach your receipt and press Send there.</p>
                  <button onClick={() => navigate('/payment-status?order_id=' + encodeURIComponent(manualOrder.txId))} className="text-primary underline">Check upgrade status</button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
