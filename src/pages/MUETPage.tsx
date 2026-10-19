import React, { useState, useEffect } from 'react';
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
import { saveSession } from '../lib/firebase';
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

  const handleSaveReport = async (report: MUETExaminerReport) => {
    const updated = [report, ...savedSessions];
    setSavedSessions(updated);
    try {
      localStorage.setItem(`ez_muet_sessions_${profile?.uid || 'guest'}`, JSON.stringify(updated));
    } catch (e) {}

    // Save to Firebase practice sessions if logged in
    if (profile?.uid) {
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
      } catch (err) {
        console.warn('Firebase session save notice:', err);
      }
    }
  };

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
            <MUETPart1Practice onSaveReport={handleSaveReport} />
          ) : (
            <MUETPart2Practice onSaveReport={handleSaveReport} />
          )}
        </div>
      )}

      {/* 2. MOCK TEST TAB */}
      {activeTab === 'mock' && (
        (profile?.plan === 'free'||profile?.fullTestAccess===false) ? <div className="rounded-xl border border-white/15 p-5 text-sm"><p>Full tests are for paid plans.</p><button className="mt-3 text-primary" onClick={()=>navigate('/app/pricing')}>View plans</button></div> : <MUETMockTest onSaveReport={handleSaveReport} />
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
