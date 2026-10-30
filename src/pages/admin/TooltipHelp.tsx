import React from 'react';
import { Info } from 'lucide-react';

// Small inline explainer used by the site editor and the revenue panel.
export const TooltipHelp = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <Info size={14} className="text-white/20 hover:text-primary cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-obsidian border border-white/10 rounded-xl text-[10px] font-medium leading-relaxed text-white/60 opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 shadow-2xl">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-obsidian" />
    </div>
  </div>
);
