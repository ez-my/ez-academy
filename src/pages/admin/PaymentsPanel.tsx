import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, CreditCard, FileText, RefreshCcw, Save, Trash2, Upload, X } from 'lucide-react';
import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, updateDoc, serverTimestamp, where, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import { useConfirmDialog } from './ConfirmDialog';
import { useUsers } from './UsersPanel';

// Bank transfer setup, receipt review, plan approval and the transaction ledger.
export const PaymentsPanel: React.FC = () => {
  const { setConfirmDialog, confirmDialogElement } = useConfirmDialog();
  // Approving a payment changes someone's plan, so the user list is refreshed after.
  const { fetchUsers } = useUsers({ auto: false });
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showArchivedPayments, setShowArchivedPayments] = useState(false);
  const [isSavingBankConfig, setIsSavingBankConfig] = useState(false);
  const [receiptModal, setReceiptModal] = useState<{ isOpen: boolean; imageUrl: string; orderRef: string; studentName: string } | null>(null);
  const [bankConfig, setBankConfig] = useState({
    bankName: 'Maybank',
    accountHolder: 'Mohamad Shahrilniza',
    accountNumber: '',
    bankQrImageUrl: '',
    instructions: 'Transfer the exact amount using your bank app. After paying, send your receipt. Your plan starts after we check your payment.',
    isConfigured: false
  });
  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const txData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txData);

      // Fetch bank transfer config
      const idToken = await auth.currentUser?.getIdToken();
      if (idToken) {
        try {
          const configRes = await fetch('/api/admin/bank-transfer-config', {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          const configData = await configRes.json();
          if (configData.success && configData.config) {
            setBankConfig(configData.config);
          }
        } catch (e) {
          console.warn("Could not fetch bank config:", e);
        }
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'transactions');
      } catch (e) {
        // Fallback
      }
    } finally {
      setIsLoading(false);
    }
  };


  const openPaymentReceipt = async (tx: any) => {
    try {
      let url = tx.receiptUrl;
      if (url.startsWith('/api/payment/receipt/')) {
        const token = await auth.currentUser!.getIdToken();
        const response = await fetch(url, {headers:{Authorization:`Bearer ${token}`}});
        if (!response.ok) throw new Error('Could not open this receipt.');
        url = URL.createObjectURL(await response.blob());
      }
      setReceiptModal({isOpen:true,imageUrl:url,orderRef:tx.orderReference || tx.id,studentName:tx.userName || 'Student'});
    } catch { alert('Could not open the receipt. Please try again.'); }
  };

  const handleApprovePayment = async (txId: string) => {
    const manual = transactions.find(tx => tx.id === txId)?.paymentMethod === 'manual_bank_transfer';
    setConfirmDialog({
      isOpen: true,
      title: manual ? 'Approve Payment & Activate Plan?' : 'Check ToyyibPay payment?',
      message: manual ? 'Did you check your bank account and verify the funds were received? This will activate the student\'s plan immediately.' : 'We will check the original bill with ToyyibPay. The package is activated only after a successful payment is confirmed.',
      type: 'warning',
      confirmText: manual ? 'Yes, Approve Plan' : 'Check payment',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const idToken = await auth.currentUser?.getIdToken();
          const res = await fetch('/api/admin/payments/review', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              txId,
              action: 'APPROVE',
              adminNote: 'Manually verified by admin in bank account'
            })
          });
          const data = await res.json();
          if (data.success) {
            alert(data.message || "Payment approved and plan activated!");
            fetchTransactions();
            fetchUsers();
          } else {
            alert(data.message || 'Payment could not be confirmed.');
          }
        } catch (error: any) {
          console.error("Manual approval error:", error);
          alert("Error approving payment: " + error.message);
        }
      }
    });
  };


  const handleRejectPayment = async (txId: string) => {
    const reason = prompt("Enter a brief reason for rejecting this receipt (optional):", "Receipt could not be verified in bank statement");
    if (reason === null) return;
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/payments/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          txId,
          action: 'REJECT',
          adminNote: reason
        })
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment marked as rejected.");
        fetchTransactions();
      } else {
        alert("Error rejecting payment: " + data.message);
      }
    } catch (error: any) {
      alert("Error rejecting payment: " + error.message);
    }
  };


  const handleSaveBankConfig = async () => {
    setIsSavingBankConfig(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/bank-transfer-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(bankConfig)
      });
      const data = await res.json();
      if (data.success) {
        alert("Bank transfer settings saved!");
        if (data.config) setBankConfig(data.config);
      } else {
        alert("Error saving settings: " + data.message);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsSavingBankConfig(false);
    }
  };


  const handleDeletePayment = async (txId: string, restore = false) => {
    setConfirmDialog({isOpen:true, title:restore ? 'Restore payment?' : 'Archive payment?',
      message:restore ? 'Show this payment in the active history again.' : 'Hide this payment from the active history. Its payment status and audit record are preserved; you can restore it later.',
      type:'warning',confirmText:restore ? 'Restore' : 'Archive',onConfirm:async()=>{
        setConfirmDialog(null);
        try {
          const token=await auth.currentUser?.getIdToken();
          const response=await fetch('/api/admin/payments/review',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({txId,action:restore ? 'RESTORE' : 'ARCHIVE'})});
          const data=await response.json();if(!data.success) throw new Error(data.message || 'Unable to update payment');
          await fetchTransactions();
        } catch(error:any){alert(error.message);}
      }});
  };


  useEffect(() => { fetchTransactions(); }, []);

  // The ledger refreshes itself while this panel is open. It used to run off a tab
  // check in AdminPage; mounting is now the signal, so it stops when you leave.
  useEffect(() => {
    const timer = window.setInterval(fetchTransactions, 30000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <>
      {(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* 1. Pending Approvals Banner & Inbox */}
          {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).length > 0 && (
            <div className="p-6 rounded-3xl bg-yellow-500/10 border-2 border-yellow-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-yellow-500 text-obsidian flex items-center justify-center font-black">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">
                      {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).length} Payment Receipt(s) Waiting for Your Review
                    </h3>
                    <p className="text-xs text-yellow-200/80">
                      Check your Maybank account statement first to confirm the funds before approving.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={fetchTransactions}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-xl text-xs font-bold hover:bg-yellow-500/30 transition"
                >
                  Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {transactions.filter(t => t.status === 'PENDING_REVIEW' && !t.archived).map(tx => (
                  <div key={tx.id} className="p-5 rounded-2xl bg-black/40 border border-yellow-500/20 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono text-yellow-400 font-bold uppercase tracking-wider block">
                          Ref: {tx.orderReference || tx.id}
                        </span>
                        <h4 className="font-bold text-white text-base">{tx.userName}</h4>
                        <p className="text-xs text-white/50">{tx.userEmail}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">RM{tx.amount?.toFixed(2)}</span>
                        <span className="text-[10px] text-white/40 block font-bold uppercase">{tx.planId}</span>
                      </div>
                    </div>

                    <div className="text-xs bg-white/5 p-3 rounded-xl space-y-1 text-white/70">
                      {tx.userBankReference && (
                        <div>Bank Ref: <strong className="text-white font-mono">{tx.userBankReference}</strong></div>
                      )}
                      {tx.userNotes && (
                        <div>Notes: <em>{tx.userNotes}</em></div>
                      )}
                      <div className="text-[10px] text-white/40">
                        Submitted: {tx.receiptSubmittedAt ? new Date(tx.receiptSubmittedAt.seconds ? tx.receiptSubmittedAt.seconds * 1000 : tx.receiptSubmittedAt).toLocaleString() : 'Just now'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      {tx.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => openPaymentReceipt(tx)}
                          className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                        >
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-[11px] text-white/40 italic flex-1 py-2 text-center">{tx.receiptDelivery === 'whatsapp' ? 'Check receipt on WhatsApp and verify bank funds before approving' : 'No image attached'}</span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleApprovePayment(tx.id)}
                        className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-obsidian rounded-xl text-xs font-black uppercase tracking-wider transition shadow-md"
                      >
                        Approve Plan
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRejectPayment(tx.id)}
                        className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold transition"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Bank Details & QR Settings Card */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Bank Transfer / Bank QR Setup</h3>
                <p className="text-xs text-white/50">
                  Set up the bank account and bank QR image shown to students at checkout.
                </p>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                bankConfig.isConfigured 
                  ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              )}>
                {bankConfig.isConfigured ? 'Checkout Active' : 'Bank QR Unavailable at Checkout'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">Bank Name</label>
                <input
                  type="text"
                  value={bankConfig.bankName}
                  onChange={e => setBankConfig({...bankConfig, bankName: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">Account Holder</label>
                <input
                  type="text"
                  value={bankConfig.accountHolder}
                  onChange={e => setBankConfig({...bankConfig, accountHolder: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">
                  Bank Account Number (Leave blank if QR-only)
                </label>
                <input
                  type="text"
                  placeholder="Optional: Enter Maybank account number"
                  value={bankConfig.accountNumber}
                  onChange={e => setBankConfig({...bankConfig, accountNumber: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs font-mono"
                />
                <span className="text-[10px] text-white/40 mt-1 block">
                  Plain account transfer stays unavailable at checkout unless this is filled.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white/60 block mb-1">
                  Bank QR image
                </label>
                <input
                  type="text"
                  placeholder="Paste bank-issued QR image URL (e.g. /maybank-qr.png or image URL)"
                  value={bankConfig.bankQrImageUrl}
                  onChange={e => setBankConfig({...bankConfig, bankQrImageUrl: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
                <input type="file" aria-label="Upload bank QR image" accept="image/png,image/jpeg,image/webp" onChange={e => {
                  const file=e.target.files?.[0]; if (!file) return;
                  if (file.size > 512000 || !['image/png','image/jpeg','image/webp'].includes(file.type)) { alert('Use a bank QR image smaller than 500 KB.'); return; }
                  const reader=new FileReader(); reader.onload=() => setBankConfig({...bankConfig,bankQrImageUrl:String(reader.result)}); reader.readAsDataURL(file);
                }} className="mt-2 w-full" />
                <span className="text-[10px] text-white/40 mt-1 block">
                  Bank QR stays unavailable at checkout until this actual bank-issued QR is configured.
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-white/60 block mb-1">Instructions for Students</label>
                <input
                  type="text"
                  value={bankConfig.instructions}
                  onChange={e => setBankConfig({...bankConfig, instructions: e.target.value})}
                  className="w-full px-3 py-2.5 bg-obsidian border border-white/10 rounded-xl text-white text-xs"
                />
              </div>

              <div className="flex items-center gap-3 md:col-span-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={bankConfig.isConfigured}
                    onChange={e => setBankConfig({...bankConfig, isConfigured: e.target.checked})}
                    className="w-4 h-4 accent-primary rounded"
                  />
                  <span>Enable Bank transfer / QR at checkout (requires account number or QR image)</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSaveBankConfig}
              disabled={isSavingBankConfig}
              className="px-6 py-3 bg-primary text-obsidian font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-primary/90 transition shadow-md disabled:opacity-50"
            >
              {isSavingBankConfig ? 'Saving...' : 'Save Bank Settings'}
            </button>
          </div>

          {/* 3. All Transactions Ledger */}
          <div className="glass-card p-6 sm:p-8 space-y-6 border border-white/10 rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Payment History</h3>
                <label className="flex items-center gap-2 mt-3 text-sm text-white/70"><input type="checkbox" checked={showArchivedPayments} onChange={e=>setShowArchivedPayments(e.target.checked)} /> Show archived payments</label>
                <p className="text-xs text-white/40">Complete log of all online and manual payment transactions.</p>
              </div>
              <button 
                onClick={fetchTransactions}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-primary transition-all"
                title="Refresh"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table className="admin-records w-full text-left min-w-[900px]">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.2em] text-white/20 border-b border-white/5 italic">
                    <th className="pb-4 px-2">Timestamp</th>
                    <th className="pb-4 px-2">Merchant Ref</th>
                    <th className="pb-4 px-2">User / Email</th>
                    <th className="pb-4 px-2">Plan</th>
                    <th className="pb-4 px-2">Amount</th>
                    <th className="pb-4 px-2">Status</th>
                    <th className="pb-4 text-right px-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {isLoading ? (
                    <tr><td colSpan={7} className="py-12 text-center text-white/40 font-bold uppercase tracking-widest italic animate-pulse">Scanning Ledger...</td></tr>
                  ) : transactions.filter(tx => showArchivedPayments ? tx.archived : !tx.archived).length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-white/20 font-bold uppercase tracking-widest italic">No transactions found</td></tr>
                  ) : transactions.filter(tx => showArchivedPayments ? tx.archived : !tx.archived).map(tx => (
                    <tr key={tx.id} className="hover:bg-white-[0.02] transition-colors group">
                      <td data-label="Date" className="py-4 px-2">
                        <div className="text-[10px] text-white font-mono">{tx.createdAt ? new Date(tx.createdAt.seconds ? tx.createdAt.seconds * 1000 : tx.createdAt).toLocaleString() : 'Pending...'}</div>
                      </td>
                      <td data-label="Reference" className="py-4 px-2">
                        <div className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">{tx.orderReference || tx.id}</div>
                        {tx.billCode && (
                          <div className="text-[8px] text-primary font-mono mt-0.5">BC: {tx.billCode}</div>
                        )}
                        {tx.paymentMethod && (
                          <div className="text-[8px] text-white/30 uppercase mt-0.5">{tx.paymentMethod}</div>
                        )}
                      </td>
                      <td data-label="User / Email" className="py-4 px-2">
                        <div className="font-bold text-white">{tx.userName}</div>
                        <div className="text-[10px] text-white/40">{tx.userEmail}</div>
                      </td>
                      <td data-label="Plan" className="py-4 px-2">
                         <span className="text-[10px] font-black uppercase tracking-wider text-primary">{tx.planName || tx.planId}</span>
                      </td>
                      <td data-label="Amount" className="py-4 px-2">
                        <div className="font-bold text-white">RM {tx.amount?.toFixed(2)}</div>
                      </td>
                      <td data-label="Status" className="py-4 px-2">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                          tx.status === 'SUCCESS' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                          tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          tx.status === 'PENDING_REVIEW' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse' :
                          'bg-white/5 text-amber-500 border border-amber-500/20'
                        )}>
                          <span className={cn(
                            "w-1 h-1 rounded-full",
                            tx.status === 'SUCCESS' ? 'bg-green-500' :
                            tx.status === 'FAILED' || tx.status === 'REJECTED' ? 'bg-red-500' :
                            'bg-yellow-400'
                          )} />
                          {tx.status}
                        </span>
                      </td>
                      <td data-label="Actions" className="py-4 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {tx.receiptUrl && (
                            <button
                              onClick={() => openPaymentReceipt(tx)}
                              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-white rounded-lg text-[9px] font-bold"
                            >
                              Receipt
                            </button>
                          )}
                          {!tx.archived && ((tx.paymentMethod === 'manual_bank_transfer' && tx.status === 'PENDING_REVIEW') || (tx.paymentMethod !== 'manual_bank_transfer' && !['SUCCESS','REJECTED'].includes(tx.status))) && (
                            <button 
                              onClick={() => handleApprovePayment(tx.id)}
                              className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-primary hover:text-obsidian transition-all"
                            >
                              {tx.paymentMethod === 'manual_bank_transfer' ? 'Approve' : 'Check payment'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeletePayment(tx.id, Boolean(tx.archived))} 
                            className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[9px] font-bold hover:bg-red-500 hover:text-white transition-all"
                          >
                            {tx.archived ? 'Restore' : 'Archive'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Receipt Modal */}
          {receiptModal?.isOpen && (
            <div 
              className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
              onClick={() => setReceiptModal(null)}
            >
              <div 
                className="bg-card border border-white/10 p-6 rounded-3xl max-w-lg w-full space-y-4"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h4 className="font-bold text-white text-sm">Receipt Proof</h4>
                    <p className="text-xs text-white/40">{receiptModal.studentName} ({receiptModal.orderRef})</p>
                  </div>
                  <button 
                    onClick={() => setReceiptModal(null)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50"
                  >
                    ✕
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-2">
                  <img 
                    src={receiptModal.imageUrl} 
                    alt="Receipt" 
                    className="max-w-full h-auto mx-auto rounded-lg object-contain"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setReceiptModal(null)}
                    className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
      {confirmDialogElement}
    </>
  );
};
