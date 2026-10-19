import React, { useState } from 'react';
import { BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: (data: { goal: 'SPM' | 'MUET' }) => Promise<void> | void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [goal, setGoal] = useState<'SPM' | 'MUET' | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const finish = async () => {
    if (!goal || saving) return;
    setSaving(true);
    setError('');
    try { await onComplete({ goal }); }
    catch { setError('Could not save your course. Please try again.'); }
    finally { setSaving(false); }
  };
  return <main className="min-h-screen bg-obsidian text-white flex items-center justify-center p-4">
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 space-y-5" aria-labelledby="choose-course">
      <p className="text-xs text-primary">EZ Academy</p>
      <div><h1 id="choose-course" className="text-2xl font-semibold">Choose your course</h1><p className="text-sm text-white/60 mt-2">You can change this later.</p></div>
      <fieldset disabled={saving} className="space-y-3">
        <legend className="sr-only">SPM or MUET</legend>
        {([{id:'SPM',label:'SPM English',Icon:BookOpen},{id:'MUET',label:'MUET',Icon:GraduationCap}] as const).map(({id,label,Icon})=><label key={id} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${goal===id?'border-primary bg-primary/10':'border-white/15 hover:border-white/40'}`}>
          <Icon size={22} className={goal===id?'text-primary':'text-white/65'}/><span className="text-sm font-medium flex-1">{label}</span><input type="radio" name="course" value={id} checked={goal===id} onChange={()=>setGoal(id)} className="h-4 w-4 accent-primary"/>
        </label>)}
      </fieldset>
      {error&&<p role="alert" className="text-sm text-amber-100">{error}</p>}
      <button onClick={finish} disabled={!goal||saving} className="w-full min-h-11 rounded-xl bg-primary text-black text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">{saving?'Saving…':'Start learning'}{!saving&&<ArrowRight size={16}/>}</button>
    </section>
  </main>;
};
