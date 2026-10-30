import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Users, 
  Trophy, 
  BookOpen, 
  Clock, 
  Sparkles, 
  GraduationCap, 
  Layers, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { UserProfile } from '../types';
import { MUETExaminerReport } from '../types/muet';
import { CurriculumSelector, CurriculumTrack } from '../components/muet/CurriculumSelector';
import { MUETPart1Practice } from '../components/muet/MUETPart1Practice';
import { MUETPart2Practice } from '../components/muet/MUETPart2Practice';
import { MUETMockTest } from '../components/muet/MUETMockTest';
import { MUETLanguageToolbox } from '../components/muet/MUETLanguageToolbox';
import { MUETProgress } from '../components/muet/MUETProgress';
import { withoutRecordingData } from '../lib/recordingPrivacy';
import { auth, saveSession } from '../lib/firebase';
import { cn } from '../lib/utils';
import { toast } from 'react-hot-toast';

interface MUETPageProps {
  profile: UserProfile | null;
  onTrackChange?: (track: CurriculumTrack) => void;
}

export const MUETPage: React.FC<MUETPageProps> = ({ profile, onTrackChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'practice';
  const subTabParam = searchParams.get('sub') || 'part1';

  const [activeTab, setActiveTab] = useState<'practice' | 'mock' | 'toolbox' | 'progress'>(
    (tabParam as any) || 'practice'
  );
  const [practiceSubTab, setPracticeSubTab] = useState<'part1' | 'part2'>(
    subTabParam === 'part2' ? 'part2' : 'part1'
  );

  // Saved MUET Sessions state
  const [savedSessions, setSavedSessions] = useState<MUETExaminerReport[]>(() => {
    try {
      const stored = localStorage.getItem(`ez_muet_sessions_${profile?.uid || 'guest'}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync tab with URL
  useEffect(() => {
    setSearchParams({ tab: activeTab, sub: practiceSubTab });
  }, [activeTab, practiceSubTab, setSearchParams]);

  const [syncStatus, setSyncStatus] = useState('');
  const [localDurable, setLocalDurable] = useState(true);
  const pendingMemory = useRef(new Map<string, MUETExaminerReport[]>());
  const pendingKey = `ez_muet_pending_${profile?.uid || 'guest'}`;
  const pendingReports = (): MUETExaminerReport[] => {
    if (!pendingMemory.current.has(pendingKey)) {
      try { pendingMemory.current.set(pendingKey, JSON.parse(localStorage.getItem(pendingKey) || '[]')); }
      catch { pendingMemory.current.set(pendingKey, []); }
    }
    return pendingMemory.current.get(pendingKey)!;
  };
  const retainPending = (reports: MUETExaminerReport[]) => {
    pendingMemory.current.set(pendingKey, reports);
    try { localStorage.setItem(pendingKey, JSON.stringify(reports)); setLocalDurable(true); }
    catch { setLocalDurable(false); }
  };
  const handleSaveReport = async (report: MUETExaminerReport) => {
    if (!profile?.uid) throw new Error('Sign in to sync your report.');
    report = withoutRecordingData(report);
    // Retain unsynced reports separately: they must not appear as cloud-saved progress.
    retainPending([report, ...pendingReports().filter(r => r.id !== report.id)]);
    setSyncStatus('Saving report…');
    try {
        await saveSession(profile.uid, {
          id: report.id,
          muetReport: report,
          userId: profile.uid,
          type: 'SpeakEZ',
          timestamp: report.date,
          duration: report.durationSeconds,
          score: Math.round((report.bandScoreNumber / 5.0) * 100),
          feedback: `### MUET Speaking Assessment\n- Band Estimate: ${report.overallBandEstimate}\n- Words: ${report.wordCount}\n- Pace: ${report.speechPaceEstimate}`,
          transcript: report.rawTranscript,
          metrics: {
            fluency: report.fluencyAndCoherence.score * 20,
            grammar: report.languageAndGrammar.score * 20,
            vocabulary: report.languageAndGrammar.score * 20,
            comprehension: report.taskFulfilment.score * 20,
            pronunciation: 80,
            structure: report.taskFulfilment.score * 20
          }
        });
      if (auth.currentUser?.uid !== profile.uid) return;
      setSavedSessions(previous => {
        const updated = [report, ...previous.filter(r => r.id !== report.id)];
        try { localStorage.setItem(`ez_muet_sessions_${profile.uid}`, JSON.stringify(updated)); } catch {}
        return updated;
      });
      retainPending(pendingReports().filter(r => r.id !== report.id));
      setSyncStatus('Report saved to your account.');
    } catch (err) {
      setSyncStatus('Report not synced. Retry without requesting AI feedback again.');
      throw err;
    }
  };
  const retryReports = async () => {
    for (const report of pendingReports()) { try { await handleSaveReport(report); } catch { break; } }
  };
  useEffect(() => {
    try { setSavedSessions(JSON.parse(localStorage.getItem(`ez_muet_sessions_${profile?.uid || 'guest'}`) || '[]')); } catch { setSavedSessions([]); }
    setSyncStatus('');
    void retryReports();
  }, [profile?.uid]);

  const handleTrackSelect = (track: CurriculumTrack) => {
    if (track === 'SPM') {
      if (onTrackChange) onTrackChange('SPM');
      navigate('/app/speakez');
    } else {
      if (onTrackChange) onTrackChange('MUET');
    }
  };

  return (
    <div className="muet-page min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white">MUET practice</h1>
          <p className="mt-1 text-sm text-white/60">New questions each time. Completed tasks stay completed.</p>
        </div>
        <button type="button" onClick={()=>navigate('/app/listenez')} className="min-h-11 rounded-xl border border-primary/30 bg-primary/10 px-3 text-sm font-semibold text-primary">ListenEZ →</button>
      </header>

      {!localDurable && <p role="status" className="text-sm text-amber-200">Device storage unavailable. Unsynced reports are only in memory; keep this page open until synced.</p>}
      {syncStatus && <div role="status" className="text-sm text-white/65">{syncStatus}{syncStatus.includes('not synced') && <button type="button" className="min-h-11 underline ml-3" onClick={() => void retryReports()}>Retry report sync</button>}</div>}
      {/* Main MUET Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          className={cn(
            "min-w-0 min-h-11 px-2 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
            activeTab === 'practice'
              ? "bg-primary text-obsidian shadow-md shadow-primary/20"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Mic size={16} />
          <span>Practice</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mock')}
          className={cn(
            "min-w-0 min-h-11 px-2 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
            activeTab === 'mock'
              ? "bg-primary text-obsidian shadow-md shadow-primary/20"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Clock size={16} />
          <span>Mock test</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('toolbox')}
          className={cn(
            "min-w-0 min-h-11 px-2 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all",
            activeTab === 'toolbox'
              ? "bg-primary text-obsidian shadow-md shadow-primary/20"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <BookOpen size={16} />
          <span>Tips</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('progress')}
          className={cn(
            "min-w-0 min-h-11 px-2 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all relative",
            activeTab === 'progress'
              ? "bg-primary text-obsidian shadow-md shadow-primary/20"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Trophy size={16} />
          <span>Progress</span>
          {savedSessions.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-black flex items-center justify-center ml-1">
              {savedSessions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. PRACTICE TAB */}
      {activeTab === 'practice' && (
        <div className="space-y-6">
          {/* Practice Sub-toggle */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-card border border-white/10 w-full">
            <button
              type="button"
              onClick={() => setPracticeSubTab('part1')}
              className={cn(
                "min-w-0 min-h-11 px-2 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                practiceSubTab === 'part1'
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              )}
            >
              <Mic size={14} />
              <span>Part 1 · Solo</span>
            </button>

            <button
              type="button"
              onClick={() => setPracticeSubTab('part2')}
              className={cn(
                "min-w-0 min-h-11 px-2 py-2 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2",
                practiceSubTab === 'part2'
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-white/50 hover:text-white"
              )}
            >
              <Users size={14} />
              <span>Part 2 · Group</span>
            </button>
          </div>

          {practiceSubTab === 'part1' ? (
            <MUETPart1Practice key={profile?.uid} onSaveReport={handleSaveReport} />
          ) : (
            <MUETPart2Practice key={profile?.uid} onSaveReport={handleSaveReport} />
          )}
        </div>
      )}

      {/* 2. MOCK TEST TAB */}
      {activeTab === 'mock' && (
        (profile?.plan === 'free'||profile?.fullTestAccess===false) ? <div className="rounded-xl border border-white/15 p-5 text-sm"><p>Full tests are for paid plans.</p><button className="mt-3 text-primary" onClick={()=>navigate('/app/pricing')}>View plans</button></div> : <MUETMockTest key={profile?.uid} onSaveReport={handleSaveReport} />
      )}

      {/* 3. LANGUAGE TOOLBOX TAB */}
      {activeTab === 'toolbox' && (
        <MUETLanguageToolbox />
      )}

      {/* 4. MY PROGRESS TAB */}
      {activeTab === 'progress' && (
        <MUETProgress
          sessions={savedSessions}
          onStartPracticePart1={() => {
            setActiveTab('practice');
            setPracticeSubTab('part1');
          }}
          onStartPracticePart2={() => {
            setActiveTab('practice');
            setPracticeSubTab('part2');
          }}
          onStartMockTest={() => setActiveTab('mock')}
        />
      )}
    </div>
  );
};
