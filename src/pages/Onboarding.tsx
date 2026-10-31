import React, { useState } from 'react';
import { BookOpen, GraduationCap, ArrowRight, ArrowLeft, School, User } from 'lucide-react';
import { DevicePhotoPicker } from '../components/profile/DevicePhotoPicker';
import {
  EMPTY_DETAILS,
  MAX_NAME_LENGTH,
  MAX_SCHOOL_LENGTH,
  MAX_REFERRAL_NOTE_LENGTH,
  REFERRAL_SOURCES,
  normaliseDetails,
  validateDetails,
  type ProfileDetails,
} from '../profileFields';

export interface OnboardingData extends ProfileDetails {
  goal: 'SPM' | 'MUET';
}

interface OnboardingProps {
  uid: string;
  suggestedName?: string;
  onComplete: (data: OnboardingData) => Promise<void> | void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ uid, suggestedName, onComplete }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [goal, setGoal] = useState<'SPM' | 'MUET' | null>(null);
  const [details, setDetails] = useState<ProfileDetails>({ ...EMPTY_DETAILS, displayName: suggestedName || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string[]>([]);

  const set = <K extends keyof ProfileDetails>(key: K, value: ProfileDetails[K]) =>
    setDetails(prev => ({ ...prev, [key]: value }));

  const finish = async () => {
    if (saving || !goal) return;
    const clean = normaliseDetails(details);
    const found = validateDetails(clean, { requireAll: true });
    setProblems(found);
    if (found.length) return;

    setSaving(true);
    setError('');
    try { await onComplete({ ...clean, goal }); }
    catch { setError('Could not save your details. Please try again.'); }
    finally { setSaving(false); }
  };

  return <main className="min-h-screen bg-obsidian text-white flex items-center justify-center p-4">
    <section className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7 space-y-5" aria-labelledby="onboarding-title">
      <div className="flex items-center justify-between">
        <p className="text-xs text-primary">EZ Academy</p>
        <p className="text-xs text-white/45" aria-live="polite">Step {step} of 2</p>
      </div>

      {step === 1 ? (
        <>
          <div>
            <h1 id="onboarding-title" className="text-2xl font-semibold">Choose your course</h1>
            <p className="text-sm text-white/60 mt-2">You can change this later.</p>
          </div>
          <fieldset className="space-y-3">
            <legend className="sr-only">SPM or MUET</legend>
            {([{ id: 'SPM', label: 'SPM English', Icon: BookOpen }, { id: 'MUET', label: 'MUET', Icon: GraduationCap }] as const).map(({ id, label, Icon }) =>
              <label key={id} className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${goal === id ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-white/40'}`}>
                <Icon size={22} className={goal === id ? 'text-primary' : 'text-white/65'} />
                <span className="text-sm font-medium flex-1">{label}</span>
                <input type="radio" name="course" value={id} checked={goal === id} onChange={() => setGoal(id)} className="h-4 w-4 accent-primary" />
              </label>)}
          </fieldset>
          <button
            onClick={() => setStep(2)}
            disabled={!goal}
            className="w-full min-h-11 rounded-xl bg-primary text-black text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
          >Continue <ArrowRight size={16} /></button>
        </>
      ) : (
        <>
          <div>
            <h1 id="onboarding-title" className="text-2xl font-semibold">Tell us about you</h1>
            <p className="text-sm text-white/60 mt-2">Your name and school appear on the leaderboard. You can change or hide them later.</p>
          </div>

          <fieldset disabled={saving} className="space-y-4">
            <legend className="sr-only">Your details</legend>

            <div>
              <label htmlFor="ob-name" className="block text-sm font-medium mb-1.5">Your name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input
                  id="ob-name" type="text" autoComplete="name" maxLength={MAX_NAME_LENGTH}
                  value={details.displayName} onChange={e => set('displayName', e.target.value)}
                  placeholder="e.g. Nur Aisyah"
                  className="w-full min-h-11 rounded-xl border border-white/15 bg-black/30 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label htmlFor="ob-school" className="block text-sm font-medium mb-1.5">Your school</label>
              <div className="relative">
                <School size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" aria-hidden="true" />
                <input
                  id="ob-school" type="text" maxLength={MAX_SCHOOL_LENGTH}
                  value={details.school} onChange={e => set('school', e.target.value)}
                  placeholder="e.g. SMK Taman Desa"
                  className="w-full min-h-11 rounded-xl border border-white/15 bg-black/30 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-xs text-white/40 mt-1.5">Shown beside your name on the leaderboard.</p>
            </div>

            <div>
              <span className="block text-sm font-medium mb-1.5">Photo <span className="text-white/40 font-normal">(optional)</span></span>
              <p className="text-xs text-white/40 mb-2">Stays on this phone or computer. The leaderboard shows the first letter of your name instead.</p>
              <DevicePhotoPicker uid={uid} />
            </div>

            <div>
              <span id="ob-heard" className="block text-sm font-medium mb-1.5">Where did you hear about us?</span>
              <div role="radiogroup" aria-labelledby="ob-heard" className="grid grid-cols-2 gap-2">
                {REFERRAL_SOURCES.map(source => (
                  <label key={source.id} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer text-sm transition-colors ${details.referralSource === source.id ? 'border-primary bg-primary/10' : 'border-white/15 hover:border-white/40'}`}>
                    <input
                      type="radio" name="referral" value={source.id}
                      checked={details.referralSource === source.id}
                      onChange={() => set('referralSource', source.id)}
                      className="h-4 w-4 accent-primary shrink-0"
                    />
                    <span className="min-w-0 truncate">{source.label}</span>
                  </label>
                ))}
              </div>
              {details.referralSource === 'other' && (
                <input
                  type="text" maxLength={MAX_REFERRAL_NOTE_LENGTH} aria-label="Where did you hear about us?"
                  value={details.referralNote} onChange={e => set('referralNote', e.target.value)}
                  placeholder="Tell us where"
                  className="mt-2 w-full min-h-11 rounded-xl border border-white/15 bg-black/30 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-primary"
                />
              )}
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 cursor-pointer">
              <input
                type="checkbox" checked={details.leaderboardOptOut}
                onChange={e => set('leaderboardOptOut', e.target.checked)}
                className="h-4 w-4 accent-primary mt-0.5 shrink-0"
              />
              <span className="text-xs text-white/60">Keep me off the public leaderboard. Your practice still counts.</span>
            </label>
          </fieldset>

          {problems.length > 0 && (
            <ul role="alert" className="text-sm text-amber-100 space-y-1">
              {problems.map(problem => <li key={problem}>{problem}</li>)}
            </ul>
          )}
          {error && <p role="alert" className="text-sm text-amber-100">{error}</p>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)} disabled={saving}
              className="min-h-11 px-4 rounded-xl border border-white/20 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40"
            ><ArrowLeft size={16} /> Back</button>
            <button
              onClick={finish} disabled={saving}
              className="flex-1 min-h-11 rounded-xl bg-primary text-black text-sm font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >{saving ? 'Saving…' : 'Start learning'}{!saving && <ArrowRight size={16} />}</button>
          </div>
        </>
      )}
    </section>
  </main>;
};
