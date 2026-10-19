import React, { useState } from 'react';
import { Edit3, Plus, Trash2, HelpCircle, ChevronDown, ChevronUp, Sparkles, BookOpen } from 'lucide-react';
import { MUETDigitalNotesData, MUETNotesPoint } from '../../types/muet';
import { cn } from '../../lib/utils';

interface MUETDigitalNotesProps {
  notes: MUETDigitalNotesData;
  onChange: (notes: MUETDigitalNotesData) => void;
  readOnly?: boolean;
  className?: string;
}

const EXPANSION_OPTIONS: Array<{ type: 'Comparison' | 'Situation' | 'Facts/Figures' | 'News' | 'None'; label: string; placeholder: string }> = [
  { type: 'None', label: 'No extra details', placeholder: '' },
  { type: 'Comparison', label: 'Comparison (Compare with something else)', placeholder: 'e.g. Unlike sitting in traffic, taking the train gives you time to read...' },
  { type: 'Situation', label: 'Situation (Describe a real situation)', placeholder: 'e.g. When a sudden flood occurs, community volunteers are the first to help...' },
  { type: 'Facts/Figures', label: 'Facts/Figures (Facts you know)', placeholder: 'e.g. Over 70% of youths spend more than 3 hours on their phones daily...' },
  { type: 'News', label: 'News (Recent news)', placeholder: 'e.g. We frequently see reports in the news about digital scams...' }
];

export const MUETDigitalNotes: React.FC<MUETDigitalNotesProps> = ({
  notes,
  onChange,
  readOnly = false,
  className
}) => {
  const [showHelper, setShowHelper] = useState(false);

  const handleUpdatePoint = (id: string, field: keyof MUETNotesPoint, value: any) => {
    if (readOnly) return;
    const updated = notes.points.map(p => p.id === id ? { ...p, [field]: value } : p);
    onChange({ ...notes, points: updated });
  };

  const handleAddPoint = () => {
    if (readOnly || notes.points.length >= 3) return;
    const newPoint: MUETNotesPoint = {
      id: 'pt_' + Date.now(),
      point: '',
      example: '',
      reason: '',
      expansionType: 'None',
      expansionDetail: ''
    };
    onChange({ ...notes, points: [...notes.points, newPoint] });
  };

  const handleRemovePoint = (id: string) => {
    if (readOnly) return;
    const updated = notes.points.filter(p => p.id !== id);
    onChange({ ...notes, points: updated });
  };

  return (
    <div className={cn("p-4 rounded-2xl bg-card border border-white/10 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/20 text-primary">
            <Edit3 size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Digital Speaking Notes</h4>
            <p className="text-[11px] text-white/50">Plan 2-3 points using the PER formula (Point, Example, Reason)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHelper(!showHelper)}
          className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
        >
          <HelpCircle size={14} />
          <span>{showHelper ? 'Hide PER Guide' : 'What is PER?'}</span>
        </button>
      </div>

      {/* PER Guide Banner */}
      {showHelper && (
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xs space-y-2">
          <div className="font-bold text-primary flex items-center gap-1.5">
            <Sparkles size={14} />
            The PER Formula (Point, Example, Reason)
          </div>
          <p className="text-white/80 leading-relaxed">
            In MUET, examiner feedback rewards clear explanations. For each point you make:
          </p>
          <ul className="space-y-1.5 pl-2 text-white/90">
            <li><strong className="text-primary">P (Point):</strong> State your main idea clearly in 1 sentence.</li>
            <li><strong className="text-primary">E (Example):</strong> Share a real-life example or everyday story to show it in action.</li>
            <li><strong className="text-primary">R (Reason):</strong> Explain why this point matters or how it helps people.</li>
          </ul>
        </div>
      )}

      {/* Points List */}
      <div className="space-y-4">
        {notes.points.map((pt, idx) => (
          <div key={pt.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-primary uppercase tracking-wider">
                Point {idx + 1}
              </span>
              {!readOnly && notes.points.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePoint(pt.id)}
                  className="text-white/40 hover:text-red-400 p-1 rounded-lg transition-colors"
                  title="Remove this point"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            {/* Point Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                P - Point (What is your main idea?)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={pt.point}
                onChange={e => handleUpdatePoint(pt.id, 'point', e.target.value)}
                placeholder="e.g. Taking public transport saves money on daily fuel..."
                className="w-full px-3 py-2 rounded-xl bg-obsidian/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Example Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                E - Example (Give a real-life story or situation)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={pt.example}
                onChange={e => handleUpdatePoint(pt.id, 'example', e.target.value)}
                placeholder="e.g. For example, riding the LRT to campus costs only RM2 with a student pass..."
                className="w-full px-3 py-2 rounded-xl bg-obsidian/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Reason Field */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                R - Reason (Why is this important?)
              </label>
              <input
                type="text"
                disabled={readOnly}
                value={pt.reason}
                onChange={e => handleUpdatePoint(pt.id, 'reason', e.target.value)}
                placeholder="e.g. This leaves more allowance for healthy food and study books..."
                className="w-full px-3 py-2 rounded-xl bg-obsidian/60 border border-white/10 text-white text-xs placeholder:text-white/30 focus:border-primary focus:outline-none"
              />
            </div>

            {/* Optional Expansion Field */}
            <div className="pt-2 border-t border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                  Optional Detail (Comparison / Situation / Facts / News)
                </label>
                <select
                  disabled={readOnly}
                  value={pt.expansionType || 'None'}
                  onChange={e => handleUpdatePoint(pt.id, 'expansionType', e.target.value)}
                  className="bg-obsidian border border-white/10 text-white/80 text-[10px] rounded-lg px-2 py-0.5 focus:outline-none"
                >
                  {EXPANSION_OPTIONS.map(opt => (
                    <option key={opt.type} value={opt.type}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {pt.expansionType && pt.expansionType !== 'None' && (
                <input
                  type="text"
                  disabled={readOnly}
                  value={pt.expansionDetail || ''}
                  onChange={e => handleUpdatePoint(pt.id, 'expansionDetail', e.target.value)}
                  placeholder={EXPANSION_OPTIONS.find(o => o.type === pt.expansionType)?.placeholder || 'Add details here...'}
                  className="w-full px-3 py-1.5 rounded-xl bg-obsidian/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:border-primary focus:outline-none"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Point Button */}
      {!readOnly && notes.points.length < 3 && (
        <button
          type="button"
          onClick={handleAddPoint}
          className="w-full py-2.5 rounded-xl border border-dashed border-white/20 hover:border-primary/50 text-white/60 hover:text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <Plus size={14} />
          <span>Add Another Point ({notes.points.length}/3)</span>
        </button>
      )}

      {/* Freeform Quick Jotting */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
          Quick Extra Keywords (Optional jotting pad)
        </label>
        <textarea
          rows={2}
          disabled={readOnly}
          value={notes.freeNotes}
          onChange={e => onChange({ ...notes, freeNotes: e.target.value })}
          placeholder="Write down keywords or linking words like: furthermore, in addition, consequently..."
          className="w-full px-3 py-2 rounded-xl bg-obsidian/40 border border-white/10 text-white text-xs placeholder:text-white/30 focus:border-primary focus:outline-none resize-none"
        />
      </div>
    </div>
  );
};
