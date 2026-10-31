import React, { useEffect, useState } from 'react';
import { Share2, Check, Gift } from 'lucide-react';
import { practiceRequest } from '../lib/practice';
import { SHARE_PLATFORMS, SHARE_REWARD_MAX_PER_ACCOUNT, type SharePlatform } from '../profileFields';

const SHARE_URL = 'https://ez-academy.my';

interface ShareRewardProps {
  /** Something true about what they just did, e.g. "I scored 82% on SpeakEZ". */
  achievement?: string;
}

interface Status {
  canClaim: boolean;
  remaining: number;
  reason: 'available' | 'claimed-today' | 'all-used';
}

const PLATFORM_LABELS: Record<SharePlatform, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  other: 'Somewhere else',
};

/**
 * Share a finished exercise for one extra practice.
 *
 * Nothing here can confirm that a share happened: no platform reports it back to
 * the page, and navigator.share resolves even when the sheet is dismissed. The
 * learner tells us where they shared and the server decides, holding the real
 * limits -- one a day, seven per account.
 */
export const ShareReward: React.FC<ShareRewardProps> = ({ achievement }) => {
  const [status, setStatus] = useState<Status | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await practiceRequest('share/status');
      setStatus({ canClaim: data.canClaim, remaining: data.remaining, reason: data.reason });
    } catch {
      setStatus(null);
    }
  };

  useEffect(() => { void load(); }, []);

  const text = achievement
    ? `${achievement} on EZ Academy. Practise SPM and MUET English free:`
    : 'I am practising my English on EZ Academy. Try it free:';

  const openShareSheet = async () => {
    const payload = { title: 'EZ Academy', text, url: SHARE_URL };
    if (navigator.share) {
      try { await navigator.share(payload); } catch { /* dismissed; they may still have shared another way */ }
    } else {
      try { await navigator.clipboard.writeText(`${text} ${SHARE_URL}`); setMessage('Link copied. Paste it in your post.'); }
      catch { setMessage(`Copy this link: ${SHARE_URL}`); }
    }
    setChoosing(true);
  };

  const claim = async (platform: SharePlatform) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const data = await practiceRequest('share/claim', { platform });
      setMessage(data.message);
      setChoosing(false);
      await load();
      // The practice allowance changed, so anything showing it should re-read.
      window.dispatchEvent(new Event('ez-practice-update'));
    } catch (err: any) {
      setError(err?.message || 'Could not add your reward. Please try again.');
      setChoosing(false);
      await load();
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  return (
    <section className="glass-card p-4 sm:p-5 space-y-3 border-primary/20 bg-primary/[0.04]" aria-labelledby="share-reward-title">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
          <Gift size={18} />
        </div>
        <div className="min-w-0">
          <h3 id="share-reward-title" className="text-base font-semibold">Share and get a free practice</h3>
          <p className="text-xs text-white/60 mt-1">
            Post your progress on social media and get one extra practice. Once a day, up to {SHARE_REWARD_MAX_PER_ACCOUNT} times.
          </p>
        </div>
      </div>

      {status.reason === 'all-used' ? (
        <p className="text-xs text-white/50 flex items-center gap-2">
          <Check size={14} className="text-primary" /> You have used all {SHARE_REWARD_MAX_PER_ACCOUNT} share rewards on this account.
        </p>
      ) : status.reason === 'claimed-today' ? (
        <p className="text-xs text-white/50 flex items-center gap-2">
          <Check size={14} className="text-primary" /> Claimed today. Come back tomorrow — {status.remaining} left.
        </p>
      ) : !choosing ? (
        <button
          type="button"
          onClick={openShareSheet}
          className="w-full min-h-11 rounded-xl bg-primary text-obsidian text-sm font-semibold inline-flex items-center justify-center gap-2"
        >
          <Share2 size={16} /> Share my progress
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-white/70">Where did you share it?</p>
          <div className="grid grid-cols-2 gap-2">
            {SHARE_PLATFORMS.map(platform => (
              <button
                key={platform}
                type="button"
                disabled={busy}
                onClick={() => claim(platform)}
                className="min-h-11 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/85 disabled:opacity-40"
              >{PLATFORM_LABELS[platform]}</button>
            ))}
          </div>
          <button type="button" onClick={() => setChoosing(false)} className="text-xs text-white/45 underline min-h-11">Not now</button>
        </div>
      )}

      {message && <p role="status" className="text-xs text-primary">{message}</p>}
      {error && <p role="alert" className="text-xs text-amber-200">{error}</p>}
    </section>
  );
};
