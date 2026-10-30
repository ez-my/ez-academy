import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

// The confirmation flow several admin panels share. The state shape is kept exactly
// as it was so existing `setConfirmDialog({isOpen: true, ...})` call sites are unchanged
// by the split; only the rendering moved out of AdminPage.
export interface ConfirmRequest {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'warning' | 'danger';
  confirmText: string;
  onConfirm: () => void;
}

export const ConfirmDialog: React.FC<{ request: ConfirmRequest; onCancel: () => void }> = ({ request, onCancel }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-4 sm:p-8 border-white/10 space-y-6"
          >
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
              request.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{request.title}</h3>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">{request.message}</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => onCancel()}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all italic"
              >
                Cancel
              </button>
              <button 
                onClick={request.onConfirm}
                className={`flex-1 px-6 py-4 text-obsidian text-xs font-black uppercase tracking-widest rounded-2xl transition-all italic shadow-2xl ${
                  request.type === 'danger' ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'
                }`}
              >
                {request.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
);

export function useConfirmDialog() {
  const [confirmDialog, setConfirmDialog] = useState<ConfirmRequest | null>(null);
  const confirmDialogElement = confirmDialog && confirmDialog.isOpen
    ? <ConfirmDialog request={confirmDialog} onCancel={() => setConfirmDialog(null)} />
    : null;
  return { confirmDialog, setConfirmDialog, confirmDialogElement };
}
