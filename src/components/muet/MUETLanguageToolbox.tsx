import React, { useState } from 'react';
import { 
  BookOpen, 
  Sparkles, 
  MessageSquare, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Copy, 
  Check,
  Lightbulb,
  Users
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

export const MUETLanguageToolbox: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'per' | 'expansion' | 'interaction' | 'pauses' | 'consensus'>('per');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyPhrase = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success('Copied phrase!');
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-6 md:p-8 rounded-3xl bg-card border border-white/10 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-wider">
          <BookOpen size={14} />
          Language Toolbox
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">
          Useful Speaking Phrases and Tips
        </h2>
        <p className="text-xs text-white/60 max-w-2xl leading-relaxed">
          Learn useful phrases for the MUET speaking test. Try them in your own words.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('per')}
          className={cn(
            "px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all border",
            activeTab === 'per'
              ? "bg-primary text-obsidian border-primary shadow-sm"
              : "bg-card hover:bg-white/5 text-white/70 border-white/10"
          )}
        >
          1. The PER Formula
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('expansion')}
          className={cn(
            "px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all border",
            activeTab === 'expansion'
              ? "bg-primary text-obsidian border-primary shadow-sm"
              : "bg-card hover:bg-white/5 text-white/70 border-white/10"
          )}
        >
          2. Adding Details (Expansion)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interaction')}
          className={cn(
            "px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all border",
            activeTab === 'interaction'
              ? "bg-primary text-obsidian border-primary shadow-sm"
              : "bg-card hover:bg-white/5 text-white/70 border-white/10"
          )}
        >
          3. Four Discussion Skills
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pauses')}
          className={cn(
            "px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all border",
            activeTab === 'pauses'
              ? "bg-primary text-obsidian border-primary shadow-sm"
              : "bg-card hover:bg-white/5 text-white/70 border-white/10"
          )}
        >
          4. Speak Calmly and Pause
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('consensus')}
          className={cn(
            "px-4 py-2.5 rounded-2xl font-bold whitespace-nowrap transition-all border",
            activeTab === 'consensus'
              ? "bg-primary text-obsidian border-primary shadow-sm"
              : "bg-card hover:bg-white/5 text-white/70 border-white/10"
          )}
        >
          5. Reaching Agreement
        </button>
      </div>

      {/* TAB 1: PER FORMULA */}
      {activeTab === 'per' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              What is the PER Formula?
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              When speaking in Part 1 or Part 2, do not just give a single sentence and stop. Use <strong>PER</strong> to build a strong 3-part point:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-obsidian flex items-center justify-center font-black text-sm">
                  P
                </div>
                <div className="text-sm font-bold text-white">Point (Main Idea)</div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Say your main thought clearly in one sentence.
                </p>
                <div className="p-2.5 rounded-xl bg-obsidian text-[11px] text-primary italic">
                  "First, taking public transport saves money on daily fuel..."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-obsidian flex items-center justify-center font-black text-sm">
                  E
                </div>
                <div className="text-sm font-bold text-white">Example (Story / Situation)</div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Give a real-life situation or everyday story to show it in action.
                </p>
                <div className="p-2.5 rounded-xl bg-obsidian text-[11px] text-primary italic">
                  "For example, college students who ride the LRT spend only RM2 per day..."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-primary text-obsidian flex items-center justify-center font-black text-sm">
                  R
                </div>
                <div className="text-sm font-bold text-white">Reason (Why it matters)</div>
                <p className="text-xs text-white/60 leading-relaxed">
                  Explain why this idea is important or how it helps people.
                </p>
                <div className="p-2.5 rounded-xl bg-obsidian text-[11px] text-primary italic">
                  "This is because saved money can be used for textbooks and emergency funds."
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPANSION TECHNIQUES */}
      {activeTab === 'expansion' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">
              4 Ways to Add Details to Any Point
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              If you have 30 seconds left on the timer and need to keep speaking smoothly, use one of these simple expansion methods:
            </p>

            <div className="space-y-3">
              {[
                {
                  title: '1. Comparison (Compare with something else)',
                  phrase: 'Unlike sitting in stressful highway jams, train passengers can relax or read a book.',
                  why: 'Shows you can examine both sides of an issue.'
                },
                {
                  title: '2. Situation (Describe a real situation)',
                  phrase: 'In a situation where sudden floods strike a town, community volunteers are the first to help.',
                  why: 'Paints a memorable picture in the listener’s mind.'
                },
                {
                  title: '3. Facts & Figures (General knowledge numbers)',
                  phrase: 'According to surveys, over 70% of teenagers use mobile payment apps daily.',
                  why: 'Lends weight to your argument (approximate numbers are fine in speaking).'
                },
                {
                  title: '4. News & Current Events',
                  phrase: 'Recently in the news, we have seen numerous reports about online shopping scams.',
                  why: 'Connects your answer to the real world.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian border border-white/5 text-xs text-primary font-medium">
                    <span>"{item.phrase}"</span>
                    <button
                      type="button"
                      onClick={() => copyPhrase(item.phrase)}
                      className="text-white/40 hover:text-white p-1"
                      title="Copy phrase"
                    >
                      {copiedText === item.phrase ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-white/50">{item.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FOUR INTERACTION SKILLS */}
      {activeTab === 'interaction' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-primary" />
              The Four Discussion Skills in Group Discussion
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              MUET Part 2 is a discussion, not a debate. The examiner awards high marks for candidates who help the conversation flow naturally:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Skill 1</span>
                <h4 className="text-sm font-bold text-white">Start (Start)</h4>
                <p className="text-xs text-white/60">Opening the discussion or introducing a new point from the mind map.</p>
                <div className="p-2.5 rounded-xl bg-obsidian text-xs text-primary">
                  "Good day everyone. Shall we begin by discussing the central question?"
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Skill 2</span>
                <h4 className="text-sm font-bold text-white">Add Details (Develop)</h4>
                <p className="text-xs text-white/60">Building upon a point another candidate just mentioned.</p>
                <div className="p-2.5 rounded-xl bg-obsidian text-xs text-primary">
                  "Building on what Candidate A shared, we can also see that..."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Skill 3</span>
                <h4 className="text-sm font-bold text-white">Respond (Agree / Disagree Politely)</h4>
                <p className="text-xs text-white/60">Showing you listened carefully before sharing your view.</p>
                <div className="p-2.5 rounded-xl bg-obsidian text-xs text-primary">
                  "I see your point, however from another angle..."
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <span className="text-[10px] font-black uppercase text-primary">Skill 4</span>
                <h4 className="text-sm font-bold text-white">Agree & Finish (Agree and Finish)</h4>
                <p className="text-xs text-white/60">Summarizing and guiding the team to the final decision.</p>
                <div className="p-2.5 rounded-xl bg-obsidian text-xs text-primary">
                  "To conclude, do we all agree that Point 2 is the most effective choice?"
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CALM PACING & PAUSES */}
      {activeTab === 'pauses' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Calm English Beats Rushing
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Many students believe speaking fast equals fluency. In reality, examiners deduct marks for unintelligible, rushed speech.
            </p>

            <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 space-y-2 text-xs">
              <div className="font-bold text-primary">Golden Rule of Pacing:</div>
              <p className="text-white/90 leading-relaxed">
                Aim for <strong>120 to 140 words per minute</strong>. Pause naturally between sentences. A 1-second silent breath sounds confident and gives you time to think!
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="font-bold text-white">How to replace filler words ("um", "ah", "like"):</div>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instead of "um...", close your mouth, take a calm breath, and speak the next word.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Use thinking connectors: <strong className="text-white">"That is an interesting question..."</strong> or <strong className="text-white">"Looking at the situation..."</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REACHING CONSENSUS */}
      {activeTab === 'consensus' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <h3 className="text-base font-bold text-white">
              How to Reach Agreement in Part 2
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Every MUET Part 2 question ends with: <em>"At the end of the discussion, decide..."</em>. If your group does not state a final agreement before the 10 minutes end, you lose marks on task completion.
            </p>

            <div className="space-y-3">
              {[
                {
                  label: 'Inviting a quiet candidate',
                  phrase: 'Candidate C, we would love to hear your thoughts on this point. What do you think?'
                },
                {
                  label: 'Moving toward a decision in minute 8',
                  phrase: 'Since we only have a few minutes left, shall we decide on our final choice?'
                },
                {
                  label: 'Proposing a consensus',
                  phrase: 'Looking at our discussion, it seems most of us agree that Point 1 is the most practical. Does everyone agree?'
                },
                {
                  label: 'Handling a friendly split',
                  phrase: 'While Candidate A and I prefer Point 1, Candidate B and C made strong points for Point 3. In the interest of time, shall we choose Point 1 as our primary recommendation?'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
                  <span className="text-[11px] font-bold text-white/50">{item.label}</span>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-obsidian border border-white/5 text-xs text-primary font-medium">
                    <span>"{item.phrase}"</span>
                    <button
                      type="button"
                      onClick={() => copyPhrase(item.phrase)}
                      className="text-white/40 hover:text-white p-1"
                    >
                      {copiedText === item.phrase ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
