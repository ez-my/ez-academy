import {useMUETBank,completeMUETTask,startMUETTask} from '../../lib/muetBank';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Volume2,
  Shuffle,
  ChevronRight,
  UserCheck,
  FileText
} from 'lucide-react';
import { MUETTopic, MUETCandidateId, MUETDigitalNotesData, MUETExaminerReport } from '../../types/muet';
import { MUET_TOPICS, getRandomMUETTopic } from '../../data/muetTopicsBank';
import { MUETDigitalNotes } from './MUETDigitalNotes';
import { MUETExaminerReportView } from './MUETExaminerReportView';
import { analyzeMUETPart1 } from '../../lib/muetService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface MUETPart1PracticeProps {
  onSaveReport?: (report: MUETExaminerReport) => Promise<void>;
  initialTopicId?: string;
}

type Phase = 'setup' | 'prep' | 'speaking' | 'analyzing' | 'report' | 'completed';

const CANDIDATES: MUETCandidateId[] = ['A', 'B', 'C', 'D'];

export const MUETPart1Practice: React.FC<MUETPart1PracticeProps> = ({
  onSaveReport,
  initialTopicId
}) => {
  const [topic, setTopic] = useState<MUETTopic>(() => {
    if (initialTopicId) {
      const found = MUET_TOPICS.find(t => t.id === initialTopicId);
      if (found) return found;
    }
    return MUET_TOPICS[0];
  });
  const bank=useMUETBank('Part1',setTopic);
  const completedTask=useRef(false);
  const practiceStartId=useRef(crypto.randomUUID());


  const [candidate, setCandidate] = useState<MUETCandidateId>('A');
  const [phase, setPhase] = useState<Phase>('setup');
  const [prepTimeLeft, setPrepTimeLeft] = useState(120); // 2:00 prep
  const [speakTimeLeft, setSpeakTimeLeft] = useState(120); // 2:00 speaking
  const [durationSpent, setDurationSpent] = useState(0);

  // Digital notes state
  const [notes, setNotes] = useState<MUETDigitalNotesData>({
    points: [
      { id: 'p1', point: '', example: '', reason: '', expansionType: 'None' },
      { id: 'p2', point: '', example: '', reason: '', expansionType: 'None' }
    ],
    freeNotes: ''
  });

  // Audio recording hook
  const {
    isRecording,
    transcript,
    setTranscript,
    audioBlob,
    startRecording,
    stopRecording,
    error: micError,
    transcriptionError
  } = useAudioRecorder();

  const [textFallback, setTextFallback] = useState('');
  const [report, setReport] = useState<MUETExaminerReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  // Audio playback
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Timers
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'prep' && prepTimeLeft > 0) {
      timer = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            handleStartSpeaking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, prepTimeLeft]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'speaking' && speakTimeLeft > 0) {
      timer = setInterval(() => {
        setSpeakTimeLeft(prev => {
          setDurationSpent(d => d + 1);
          if (prev <= 1) {
            handleStopSpeaking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, speakTimeLeft]);

  // Audio blob sync
  useEffect(() => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [audioBlob]);

  // Sync mic error
  useEffect(() => {
    if (micError && micError.includes('NotAllowedError')) {
      setMicDenied(true);
      toast.error('Microphone access was denied. You can type your speech in the text box below.');
    }
  }, [micError]);

  const handleStartPrep = () => {
    practiceStartId.current=crypto.randomUUID();
    setPrepTimeLeft(120);
    setPhase('prep');
  };

  const handleStartSpeaking = async () => {
    try {await startMUETTask(topic.id,'Part1',practiceStartId.current);}catch(e:any){toast.error(e.message);return;}
    setPhase('speaking');
    setSpeakTimeLeft(120);
    setDurationSpent(0);
    try {
      await startRecording(1, true);
    } catch (e) {
      setMicDenied(true);
    }
  };

  const handleStopSpeaking = async () => {
    if (isRecording) {
      await stopRecording();
    }
    handleAnalyze();
  };

  const handleAnalyze = async () => {
    setPhase('analyzing');
    const finalSpeech = (transcript || textFallback).trim();
    const notesSummary = notes.points.map(p => `Point: ${p.point}; Example: ${p.example}; Reason: ${p.reason}`).join(' | ');

    if (!finalSpeech || finalSpeech.split(/\s+/).length < 5) {
      toast.error('Please speak or type at least a few sentences so we can review your performance.');
      setPhase('speaking');
      return;
    }

    try {
      if(!completedTask.current){await completeMUETTask(topic.id,'Part1',finalSpeech,durationSpent||60);completedTask.current=true;}
      const result = await analyzeMUETPart1(
        topic,
        candidate,
        finalSpeech,
        durationSpent || 60,
        notesSummary
      );
      setReport(result);
      setPhase('report');
    } catch (err: any) {
      toast.error(completedTask.current?'Your task is completed. Personal feedback is unavailable.':'Could not save completion. Your answer is kept. Please try again.');
      setPhase(completedTask.current?'completed':'speaking');
    }
  };

  const handleRandomTopic = () => {
    bank.random(topic.id);
  };

  const handleReset = () => {
    if (isRecording) stopRecording();
    if(completedTask.current){completedTask.current=false;bank.reload();}
    setPhase('setup');
    setPrepTimeLeft(120);
    setSpeakTimeLeft(120);
    setDurationSpent(0);
    setTranscript('');
    setTextFallback('');
    setReport(null);
  };

  const handleSaveReport = async () => {
    if (!report || !onSaveReport) return;
    setIsSaving(true);
    try {
      await onSaveReport(report);
      toast.success('Saved to My Progress!');
    } catch (e) {
      toast.error('Failed to save session.');
    } finally {
      setIsSaving(false);
    }
  };

  // A new assessed report is persisted automatically; retries never ask AI again.
  useEffect(() => { if (report && onSaveReport) void handleSaveReport(); }, [report]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if(phase==='completed')return <section className="rounded-2xl border border-primary/20 p-5 space-y-3"><h2 className="text-lg font-semibold">Task completed</h2><p className="text-sm text-white/65">This question will not appear again. Personal feedback needs an active plan and AI credits.</p><button className="min-h-11 text-primary" onClick={handleReset}>Next question</button></section>;
  if(bank.loading)return <p role="status" className="p-4 text-sm text-white/65">Finding a new question…</p>;
  if(bank.error)return <div role="alert" className="p-4 space-y-3 text-sm"><p>{bank.error}</p><button className="min-h-11 text-primary" onClick={bank.reload}>Try again</button></div>;
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-white/10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Paper 800/2 Part 1
          </span>
          <h2 className="text-base md:text-lg font-black text-white mt-1">
            Speak on your own
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            2 minutes to prepare • 2 minutes to speak
          </p>
        </div>

        {phase !== 'setup' && phase !== 'report' && (
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl border border-white/20 text-xs font-bold text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
          >
            Exit / Change Topic
          </button>
        )}
      </div>

      {/* SETUP PHASE */}
      {phase === 'setup' && (
        <div className="space-y-4">
          {/* Topic Selector */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <label className="text-xs font-bold text-white/70 block">Topic</label>
                <p className="text-[11px] text-white/40">New questions only · Part 1 B1–B2</p>
              </div>

              <button
                type="button"
                onClick={handleRandomTopic}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Shuffle size={14} />
                <span>Random</span>
              </button>
            </div>

            <select
              value={topic.id}
              onChange={e => {
                const found = bank.topics.find(t => t.id === e.target.value);
                if (found) setTopic(found);
              }}
              aria-label="Topic" className="min-w-0 max-w-full w-full p-3 rounded-xl bg-obsidian border border-white/10 text-white text-sm focus:border-primary focus:outline-none"
            >
              {bank.topics.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  {idx + 1}. {t.title}
                </option>
              ))}
            </select>
          </div>

          {/* Candidate Selection (Speaker A, B, C, D) */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Your speaker</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Choose A, B, C or D.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {CANDIDATES.map(c => {
                const isSelected = candidate === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCandidate(c)}
                    className={cn(
                      "min-h-11 p-2 rounded-xl border text-center transition-all duration-200",
                      isSelected
                        ? "bg-primary text-obsidian border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    )}
                  >
                    <div className="text-sm font-bold">{c}</div>
                    <div className={cn("text-[10px] mt-1 font-semibold", isSelected ? "text-obsidian/80" : "text-white/40")}>
                      {isSelected ? 'You' : 'Speaker'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exam Situation and All 4 Tasks Card */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-5">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                General Situation
              </span>
              <p className="text-sm text-white font-medium mt-1 leading-relaxed">
                {topic.part1.situation}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-white/60">Speaker tasks</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CANDIDATES.map(c => {
                  const isAssigned = candidate === c;
                    return (
                    <div
                      key={c}
                      className={cn(
                        "p-4 rounded-2xl border transition-all",
                        isAssigned
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40 shadow-sm"
                          : "bg-white/5 border-white/10 opacity-60"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={cn(
                          "text-xs font-black uppercase tracking-wider",
                          isAssigned ? "text-primary" : "text-white/40"
                        )}>
                          Candidate {c} (Speaker {c})
                        </span>
                        {isAssigned && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-obsidian text-[10px] font-black uppercase">
                            Your Task
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs leading-relaxed",
                        isAssigned ? "text-white font-semibold" : "text-white/70"
                      )}>
                        {topic.part1.tasks[c]}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Start Prep CTA */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartPrep}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-obsidian font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Start 2-Minute Preparation</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREPARATION PHASE */}
      {phase === 'prep' && (
        <div className="space-y-4">
          {/* Active Prep Timer Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-obsidian flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-amber-500/20">
                {formatTimer(prepTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Preparation Time (2:00)
                </div>
                <h3 className="text-base font-bold text-white">
                  Write down your 2-3 main points using the PER notes below
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartSpeaking}
              className="px-5 py-2.5 rounded-xl bg-primary text-obsidian font-bold text-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
            >
              <span>Skip Prep & Speak Now</span>
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Assigned Task Reminder */}
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
              Your Assigned Task (Candidate {candidate})
            </span>
            <p className="text-sm font-bold text-white mt-1">
              {topic.part1.tasks[candidate]}
            </p>
          </div>

          {/* Digital Notes Component */}
          <MUETDigitalNotes
            notes={notes}
            onChange={setNotes}
          />
        </div>
      )}

      {/* SPEAKING PHASE */}
      {phase === 'speaking' && (
        <div className="space-y-4">
          {/* Speaking Timer Banner */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 transition-colors shadow-lg",
                speakTimeLeft <= 20
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-primary text-obsidian shadow-primary/20"
              )}>
                {formatTimer(speakTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                  Speaking Time (2:00 maximum)
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isRecording ? 'Recording your speech...' : 'Microphone paused'}
                </h3>
                <p className="text-xs text-white/50">
                  Speak at your own pace. Clear and calm English is better than rushing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStopSpeaking}
              className="px-6 py-3 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              <Square size={16} />
              <span>Finish & Show Feedback</span>
            </button>
          </div>

          {/* Helpful Opening Greeting & Reassurance Cues */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/20 text-primary shrink-0">
                <Volume2 size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Easy Opening Greeting</div>
                <p className="text-white/60 mt-0.5">
                  Begin naturally: <span className="text-primary font-semibold">"Good day everyone. Today I will discuss..."</span>
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="text-xs">
                <div className="font-bold text-white">Calm Pacing Tip</div>
                <p className="text-white/60 mt-0.5">
                  Pause for a breath between points. Clear pronunciation is rewarded over speed.
                </p>
              </div>
            </div>
          </div>

          {/* Digital Notes View (ReadOnly reference while speaking) */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText size={15} className="text-primary" />
                Your Preparation Notes (Reference)
              </span>
              <span className="text-[10px] text-white/40">Glance briefly to keep your place</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {notes.points.filter(p => p.point).map((p, idx) => (
                <div key={p.id} className="p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-primary font-bold">Point {idx + 1}: </span>
                  <span className="text-white/90">{p.point}</span>
                  {p.example && <div className="text-white/60 text-[11px] mt-1">Ex: {p.example}</div>}
                </div>
              ))}
              {notes.points.filter(p => p.point).length === 0 && (
                <div className="text-white/40 text-xs italic">No specific notes entered. Speak freely from your prompt.</div>
              )}
            </div>
          </div>

          {/* Live Transcript / Text Fallback Input */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-2">
                <Mic size={15} className="text-primary" />
                Spoken Transcript (Live or Type here)
              </label>
              {micDenied && (
                <span className="text-[10px] text-amber-400 font-bold">
                  Mic unavailable - Type your speech below
                </span>
              )}
            </div>

            <textarea
              rows={5}
              value={transcript || textFallback}
              onChange={e => setTextFallback(e.target.value)}
              placeholder="Your spoken words will appear here live as you talk. If microphone is not working, you can type your speech here directly..."
              className="w-full p-4 rounded-2xl bg-obsidian border border-white/10 text-white text-xs leading-relaxed focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ANALYZING PHASE */}
      {phase === 'analyzing' && (
        <div className="p-12 rounded-3xl bg-card border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-white">Analyzing Your Speech...</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Checking your task answer, flow, linking words, and grammar against MUET speaking descriptors.
          </p>
        </div>
      )}

      {/* REPORT PHASE */}
      {phase === 'report' && report && (
        <div className="space-y-4">
          {/* Audio Player if available */}
          {audioUrl && (
            <div className="p-4 rounded-2xl bg-card border border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Volume2 size={16} className="text-primary" />
                Listen Back to Your Recording
              </span>
              <audio ref={audioRef} src={audioUrl} controls className="h-9 max-w-xs" />
            </div>
          )}

          <MUETExaminerReportView
            report={report}
            onRetest={handleReset}
            onSaveToProgress={handleSaveReport}
            isSaving={isSaving}
          />
        </div>
      )}
    </div>
  );
};
