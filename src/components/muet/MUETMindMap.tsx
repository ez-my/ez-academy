import React, { useState } from 'react';
import { HelpCircle, CheckCircle2, MessageSquare, ArrowRight, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MUETMindMapProps {
  situation: string;
  centralQuestion: string;
  points: string[];
  decisionPrompt: string;
  highlightedIndex?: number | null;
  onSelectPoint?: (index: number) => void;
  className?: string;
}

export const MUETMindMap: React.FC<MUETMindMapProps> = ({
  situation,
  centralQuestion,
  points,
  decisionPrompt,
  highlightedIndex,
  onSelectPoint,
  className
}) => {
  const [activePoint, setActivePoint] = useState<number | null>(highlightedIndex ?? null);

  const handlePointClick = (idx: number) => {
    const next = activePoint === idx ? null : idx;
    setActivePoint(next);
    if (onSelectPoint) onSelectPoint(idx);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Situation Banner */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Lightbulb size={18} />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              Discussion Situation (Read this first)
            </div>
            <p className="text-sm font-medium text-white/90 mt-1 leading-relaxed">
              {situation}
            </p>
          </div>
        </div>
      </div>

      {/* Responsive Mind Map Container */}
      <div className="relative p-4 md:p-8 rounded-3xl bg-card border border-white/10 overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            Discussion ideas
          </span>
          <p className="text-xs text-white/50 mt-1">
            Tap an idea to discuss.
          </p>
        </div>

        {/* Question Bubble */}
        <div className="relative z-10 max-w-xl mx-auto mb-4 p-5 rounded-2xl bg-gradient-to-b from-primary/25 to-primary/10 border-2 border-primary/40 shadow-lg shadow-primary/10 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary text-obsidian text-[10px] font-black uppercase tracking-wider mb-2">
            <HelpCircle size={12} />
            Question
          </div>
          <h3 className="text-base md:text-lg font-bold text-white leading-snug">
            {centralQuestion}
          </h3>
        </div>

        {/* Suggested Points Grid / Orbit Nodes */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {points.map((point, idx) => {
            const isSelected = activePoint === idx || highlightedIndex === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePointClick(idx)}
                aria-pressed={isSelected}
                className={cn(
                  "p-4 rounded-2xl text-left transition-all duration-200 border flex items-start gap-3 relative group",
                  isSelected
                    ? "bg-primary text-obsidian border-primary shadow-md shadow-primary/20 scale-[1.02]"
                    : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 mt-0.5",
                  isSelected
                    ? "bg-obsidian text-primary"
                    : "bg-white/10 text-white/70 group-hover:bg-primary/20 group-hover:text-primary"
                )}>
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "text-xs font-semibold leading-relaxed",
                    isSelected ? "text-obsidian" : "text-white"
                  )}>
                    {point}
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 size={16} className="text-obsidian shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Final Decision Prompt */}
        <div className="relative z-10 mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-obsidian flex items-center justify-center font-black text-sm shrink-0">
            !
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
              Final decision
            </div>
            <p className="text-xs md:text-sm font-bold text-white mt-0.5">
              {decisionPrompt}
            </p>
          </div>
        </div>

        {/* Accessibility Helper for Screen Readers */}
        <div className="sr-only">
          <h4>All points for group discussion:</h4>
          <ol>
            {points.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
