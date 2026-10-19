import React from 'react';
import { Sparkles, GraduationCap, BookOpen } from 'lucide-react';
import { cn } from '../../lib/utils';

export type CurriculumTrack = 'SPM' | 'MUET';

interface CurriculumSelectorProps {
  currentTrack: CurriculumTrack;
  onSelectTrack: (track: CurriculumTrack) => void;
  className?: string;
  compact?: boolean;
}

export const CurriculumSelector: React.FC<CurriculumSelectorProps> = ({
  currentTrack,
  onSelectTrack,
  className,
  compact = false
}) => {
  return (
    <div className={cn("inline-flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md", className)}>
      <button
        type="button"
        onClick={() => onSelectTrack('SPM')}
        aria-label="Switch to SPM English track"
        className={cn(
          "flex items-center gap-2 rounded-xl transition-all duration-200 text-xs font-bold",
          compact ? "px-2.5 py-1.5" : "px-3.5 py-2",
          currentTrack === 'SPM'
            ? "bg-primary text-obsidian shadow-sm shadow-primary/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
        )}
      >
        <BookOpen size={compact ? 13 : 15} />
        <span>SPM English</span>
        {currentTrack === 'SPM' && (
          <span className="hidden sm:inline-block text-[10px] font-black uppercase px-1.5 py-0.2 bg-obsidian/20 rounded-md">
            Active
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => onSelectTrack('MUET')}
        aria-label="Switch to MUET track"
        className={cn(
          "flex items-center gap-2 rounded-xl transition-all duration-200 text-xs font-bold",
          compact ? "px-2.5 py-1.5" : "px-3.5 py-2",
          currentTrack === 'MUET'
            ? "bg-primary text-obsidian shadow-sm shadow-primary/20"
            : "text-white/60 hover:text-white hover:bg-white/5"
        )}
      >
        <GraduationCap size={compact ? 13 : 15} />
        <span>MUET</span>
        {currentTrack === 'MUET' && (
          <span className="hidden sm:inline-block text-[10px] font-black uppercase px-1.5 py-0.2 bg-obsidian/20 rounded-md">
            Active
          </span>
        )}
      </button>
    </div>
  );
};
