import React, { useEffect } from 'react';
import { PACKAGES } from '../../packages';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, PenTool, BookOpen, Headphones, Zap, Check, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export type SkillType = 'speak' | 'write' | 'read' | 'listen' | 'aiListen';

interface PaywallModalProps {
  isOpen: boolean;
  freeDailyLimit?: boolean;
  dailyPracticeLimit?: boolean;
  onClose: () => void;
  skill: SkillType;
  onUpgrade?: () => void;
  onUseCredits?: () => void;
  onBuyCredits?: () => void;
  customTitle?: string;
  customSubtext?: string;
}

const skillConfig = {
  speak: {
    icon: Mic,
    title: "Daily Speaking Practice Completed",
    subtext: "You've completed your daily free speaking practices",
    valueMsg: "Speaking improves fastest with repetition. Continue practicing to build unbreakable confidence.",
    color: "text-blue-400",
    bgIcon: "bg-blue-400/10",
    progress: "✔✔",
    limit: 2
  },
  write: {
    icon: PenTool,
    title: "Writing Session Limit Reached",
    subtext: "You've completed your daily free writing practice",
    valueMsg: "Writing improves with precise feedback. Unlock more corrections to refine your structure faster.",
    color: "text-emerald-400",
    bgIcon: "bg-emerald-400/10",
    progress: "✔",
    limit: 1
  },
  read: {
    icon: BookOpen,
    title: "Great job on today's Reading Practice",
    subtext: "You've completed your daily free reading practices",
    valueMsg: "Daily exposure improves comprehension and fluency. Expand your vocabulary by unlocking more texts.",
    color: "text-purple-400",
    bgIcon: "bg-purple-400/10",
    progress: "✔✔",
    limit: 2
  },
  listen: {
    icon: Headphones,
    title: "Listening Routine Completed",
    subtext: "You've completed your daily free listening practices",
    valueMsg: "Consistent daily exposure is key to listening accuracy. Keep your ear tuned by continuing your training.",
    color: "text-amber-400",
    bgIcon: "bg-amber-400/10",
    progress: "✔✔",
    limit: 2
  },
  aiListen: {
    icon: Zap,
    title: "AI Generation Limit Reached",
    subtext: "You've reached your daily limit for AI-powered tests",
    valueMsg: "AI-generated tests provide infinite practice tailored to your materials. Keep generating to master any topic.",
    color: "text-primary",
    bgIcon: "bg-primary/10",
    progress: "⚡",
    limit: 1
  }
};

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, freeDailyLimit=false, dailyPracticeLimit=false, onClose, skill, onUpgrade, onUseCredits, onBuyCredits, customTitle, customSubtext }) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    if (onBuyCredits) {
      onBuyCredits();
    } else {
      navigate('/checkout?plan=boost_plus');
    }
  };
  const config = skillConfig[skill];
  const Icon = config.icon;

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  if(freeDailyLimit||dailyPracticeLimit)return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><section role="dialog" aria-modal="true" aria-label="Daily free limit" className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#141610] p-6 text-white"><h2 className="text-lg font-semibold">{freeDailyLimit?"Today's free practice is used":"Today's practice limit is used"}</h2><p className="mt-3 text-sm leading-6 text-white/70">{freeDailyLimit?'Free includes 2 practices a day across all skills. Come back tomorrow or choose a paid plan.':'Come back tomorrow. Extra credits do not increase your daily practice limit.'}</p><div className="mt-5 flex flex-wrap gap-3"><button className="min-h-11 rounded-lg bg-primary px-4 text-sm font-semibold text-black" onClick={()=>{onClose();if(onUpgrade)onUpgrade();else navigate('/app/pricing');}}>View plans</button><button className="min-h-11 rounded-lg border border-white/20 px-4 text-sm" onClick={onClose}>Close</button></div></section></div>;


  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-white font-sans selection:bg-primary selection:text-obsidian">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] shadow-2xl shadow-primary/5 overflow-hidden flex flex-col z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Accent glow behind modal content */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="p-8 sm:p-10 flex flex-col items-center text-center">
            {/* Header */}
            <div className={`w-16 h-16 rounded-2xl ${config.bgIcon} ${config.color} flex items-center justify-center mb-6`}>
              <Icon size={32} />
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight leading-tight mb-2">{customTitle || config.title}</h2>
            <p className="text-white/50 text-sm mb-8">{customSubtext || config.subtext}</p>

            {/* Progress visual */}
            <div className="w-full bg-white/5 rounded-2xl p-4 mb-6 border border-white/5 flex flex-col items-center justify-center gap-2">
              <div className="flex gap-2 text-primary mb-1">
                {Array.from({ length: config.limit }).map((_, i) => (
                  <Check key={i} size={24} />
                ))}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Today's Progress</p>
            </div>

            {/* Value Message */}
            <div className="mb-8 w-full">
              <p className="text-white/80 leading-relaxed text-sm italic">
                "{config.valueMsg}"
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={onUpgrade}
                className="w-full py-4 px-6 bg-primary text-obsidian rounded-xl font-bold uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                Upgrade Subscription <ArrowRight size={16} />
              </button>
              
              <button
                onClick={onUseCredits}
                className="w-full py-4 px-6 bg-white/5 border border-white/10 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors"
              >
                Use Available Credits
              </button>

              <button
                onClick={handleBuyCredits}
                className="w-full py-3 px-6 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-orange-500/20 transition-colors"
              >
                Buy {PACKAGES.boost_plus.aiUnits} AI credits + {PACKAGES.boost_plus.creditsGrant} practice credits for RM{PACKAGES.boost_plus.price}
              </button>
              
              <div className="pt-4 space-y-2">
                <button
                  onClick={() => { onClose(); navigate('/app'); }}
                  className="w-full py-2 text-center text-white/50 text-xs font-medium hover:text-white transition-colors"
                >
                  Continue with other skills
                </button>
                
                <button
                  onClick={onClose}
                  className="w-full py-2 text-center text-white/30 text-[10px] uppercase font-bold tracking-widest hover:text-white/60 transition-colors"
                >
                  Not now, continue tomorrow
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
