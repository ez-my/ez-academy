import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, RefreshCcw, School as SchoolIcon, TrendingUp, Users } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { REFERRAL_SOURCES, referralSourceLabel, tidyText, MAX_SCHOOL_LENGTH } from '../../profileFields';
import { TooltipHelp } from './TooltipHelp';

interface Tally { id: string; label: string; count: number; share: number; }

/**
 * Where learners are coming from, and which schools they cluster in.
 *
 * Counted from the user documents the admin can already list, so there is no new
 * collection to keep in step. Everything is derived on read: a learner who edits
 * their answer on the profile page is reflected the next time this is refreshed.
 */
export const GrowthPanel: React.FC<{ onOpenTab?: (tab: string) => void }> = ({ onOpenTab }) => {
  const [users, setUsers] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setIsLoading(true);
    setError('');
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => doc.data() as Record<string, unknown>));
    } catch {
      setError('Could not load learners. Check your admin sign-in and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const { sources, answered, schools, optOuts } = useMemo(() => {
    const counts = new Map<string, number>();
    const schoolCounts = new Map<string, number>();
    let answered = 0;
    let optOuts = 0;

    for (const user of users) {
      const source = typeof user.referralSource === 'string' ? user.referralSource : '';
      if (source) { answered += 1; counts.set(source, (counts.get(source) || 0) + 1); }
      else counts.set('', (counts.get('') || 0) + 1);

      const school = tidyText(user.school, MAX_SCHOOL_LENGTH);
      if (school) schoolCounts.set(school, (schoolCounts.get(school) || 0) + 1);
      if (user.leaderboardOptOut === true) optOuts += 1;
    }

    const total = users.length || 1;
    const sources: Tally[] = [...REFERRAL_SOURCES.map(s => s.id), ''].map(id => {
      const count = counts.get(id) || 0;
      return { id: id || 'unanswered', label: id ? referralSourceLabel(id) : 'Not answered', count, share: (count / total) * 100 };
    }).sort((a, b) => b.count - a.count);

    const schools = [...schoolCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 15);

    return { sources, answered, schools, optOuts };
  }, [users]);

  const notes = useMemo(
    () => users.map(u => tidyText(u.referralNote, 80)).filter(Boolean).slice(0, 25),
    [users],
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="glass-card p-4 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold tracking-tight flex items-center">
              Where learners come from
              <TooltipHelp text="Answered during registration, and editable by the learner on their profile page. Counted live from the learner records, so it always matches what they last chose." />
            </h3>
            <p className="text-xs text-white/40 mt-1">
              {isLoading ? 'Counting…' : `${users.length} learners · ${answered} answered the question · ${optOuts} hidden from the leaderboard`}
            </p>
          </div>
          <button onClick={load} disabled={isLoading} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50">
            <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {error && (
          <div role="alert" className="mb-5 p-4 rounded-2xl border border-red-500/30 bg-red-500/5 text-sm text-red-300 flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-white/50 py-8 text-center">Loading learners…</p>
        ) : users.length === 0 ? (
          <p className="text-sm text-white/50 py-8 text-center">No learners yet.</p>
        ) : (
          <div className="space-y-2.5">
            {sources.map(source => (
              <div key={source.id} className="flex items-center gap-4">
                <span className="w-32 sm:w-40 shrink-0 text-sm text-white/75 truncate">{source.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={source.id === 'unanswered' ? 'h-full bg-white/20' : 'h-full bg-primary'}
                    style={{ width: `${Math.max(source.count > 0 ? 2 : 0, source.share)}%` }}
                  />
                </div>
                <span className="w-24 text-right text-xs tabular-nums text-white/55 shrink-0">
                  {source.count} · {source.share.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        )}

        {notes.length > 0 && (
          <div className="mt-6 pt-5 border-t border-white/10">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-white/35 mb-3">&ldquo;Somewhere else&rdquo; answers</h4>
            <div className="flex flex-wrap gap-2">
              {notes.map((note, index) => (
                <span key={`${note}-${index}`} className="text-xs text-white/60 border border-white/10 rounded-lg px-2.5 py-1.5">{note}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-4 sm:p-8">
        <h3 className="text-sm font-bold tracking-tight mb-1 flex items-center gap-2">
          <SchoolIcon size={15} className="text-primary" /> Schools with the most learners
        </h3>
        <p className="text-xs text-white/40 mb-4">A school with several learners is worth approaching directly.</p>
        {schools.length === 0 ? (
          <p className="text-sm text-white/50 py-4">No schools recorded yet.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {schools.map(school => (
              <div key={school.name} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                <span className="text-white/80 truncate">{school.name}</span>
                <span className="flex items-center gap-1.5 text-xs text-white/50 tabular-nums shrink-0">
                  <Users size={12} /> {school.count}
                </span>
              </div>
            ))}
          </div>
        )}
        {onOpenTab && (
          <button onClick={() => onOpenTab('users')} className="mt-5 text-xs font-semibold text-primary inline-flex items-center gap-2 min-h-11">
            <TrendingUp size={14} /> Open the full learner list
          </button>
        )}
      </div>
    </motion.div>
  );
};
