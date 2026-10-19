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
  ChevronRight,
  ShieldAlert,
  Send,
  Users,
  FileText
} from 'lucide-react';
import { MUETTopic, MUETCandidateId, MUETDigitalNotesData, MUETExaminerReport, MUETDiscussionTurn } from '../../types/muet';
import { MUET_TOPICS, getRandomMUETTopic } from '../../data/muetTopicsBank';
import { MUETMindMap } from './MUETMindMap';
import { MUETDigitalNotes } from './MUETDigitalNotes';
import { MUETExaminerReportView } from './MUETExaminerReportView';
import { analyzeMUETPart1, generateMUETPeerTurn, analyzeMUETPart2, analyzeMUETMockTest } from '../../lib/muetService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface MUETMockTestProps {
  onSaveReport?: (report: MUETExaminerReport) => Promise<void>;
  initialTopicId?: string;
}

type MockPhase = 
  | 'intro'
  | 'part1_prep'
  | 'part1_speaking'
  | 'part1_analyzing'
  | 'transition'
  | 'part2_prep'
  | 'part2_discussion'
  | 'part2_consensus'
  | 'final_analyzing'
  | 'report';

const CANDIDATES: MUETCandidateId[] = ['A', 'B', 'C', 'D'];

export const MUETMockTest: React.FC<MUETMockTestProps> = ({
  onSaveReport,
  initialTopicId
}) => {
  const [topic, setTopic] = useState<MUETTopic>(() => {
    if (initialTopicId) {
      const found = MUET_TOPICS.find(t => t.id === initialTopicId);
      if (found) return found;
    }
    return getRandomMUETTopic();
  });
  const bank=useMUETBank('Mock',setTopic);
  const completedTask=useRef(false);
  const practiceStartId=useRef(crypto.randomUUID());


  const [candidate, setCandidate] = useState<MUETCandidateId>('B');
  const [phase, setPhase] = useState<MockPhase>('intro');
  const [showExitModal, setShowExitModal] = useState(false);

  // Timers
  const [prepTimeLeft, setPrepTimeLeft] = useState(120); // 2:00 for Part 1, 3:00 for Part 2
  const [speakTimeLeft, setSpeakTimeLeft] = useState(120); // 2:00 for Part 1
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(600); // 10:00 for Part 2

  // Part 1 Notes & Transcript
  const [part1Notes, setPart1Notes] = useState<MUETDigitalNotesData>({
    points: [
      { id: 'p1', point: '', example: '', reason: '', expansionType: 'None' },
      { id: 'p2', point: '', example: '', reason: '', expansionType: 'None' }
    ],
    freeNotes: ''
  });
  const [part1Transcript, setPart1Transcript] = useState('');
  const [part1Report, setPart1Report] = useState<MUETExaminerReport | null>(null);

  // Part 2 Discussion
  const [history, setHistory] = useState<MUETDiscussionTurn[]>([]);
  const [studentInputText, setStudentInputText] = useState('');
  const [isAITurnGenerating, setIsAITurnGenerating] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [part2Report, setPart2Report] = useState<MUETExaminerReport | null>(null);

  // Final Combined Report
  const [finalReport, setFinalReport] = useState<MUETExaminerReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Audio Recorder
  const {
    isRecording,
    transcript,
    setTranscript,
    startRecording,
    stopRecording,
    error: micError
  } = useAudioRecorder();

  const [micDenied, setMicDenied] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll discussion chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, isAITurnGenerating]);

  // Audio state machine: stop mic if AI starts speaking
  useEffect(() => {
    if (isAISpeaking && isRecording) {
      stopRecording();
    }
  }, [isAISpeaking, isRecording]);

  // Sync mic error
  useEffect(() => {
    if (micError && micError.includes('NotAllowedError')) {
      setMicDenied(true);
    }
  }, [micError]);

  // Part 1 Prep Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'part1_prep' && prepTimeLeft > 0) {
      timer = setInterval(() => {
        setPrepTimeLeft(prev => {
          return Math.max(0, prev - 1);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, prepTimeLeft]);

  // Part 1 Speaking Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'part1_speaking' && speakTimeLeft > 0) {
      timer = setInterval(() => {
        setSpeakTimeLeft(prev => {
          return Math.max(0, prev - 1);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, speakTimeLeft]);

  // Part 2 Prep Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'part2_prep' && prepTimeLeft > 0) {
      timer = setInterval(() => {
        setPrepTimeLeft(prev => {
          return Math.max(0, prev - 1);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, prepTimeLeft]);

  // Part 2 Discussion Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((phase === 'part2_discussion' || phase === 'part2_consensus') && discussionTimeLeft > 0) {
      timer = setInterval(() => {
        setDiscussionTimeLeft(prev => {
          return Math.max(0, prev - 1);
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, discussionTimeLeft]);

  useEffect(() => {
    if (phase === 'part1_prep' && prepTimeLeft === 0) handleStartPart1Speaking();
    else if (phase === 'part1_speaking' && speakTimeLeft === 0 && !part1Transcript) handleStopPart1Speaking();
    else if (phase === 'part2_prep' && prepTimeLeft === 0) handleStartPart2Discussion();
    else if (phase === 'part2_discussion' && discussionTimeLeft === 0) setPhase('part2_consensus');
  }, [phase,prepTimeLeft,speakTimeLeft,discussionTimeLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) stopRecording();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const handleStartMockTest = async () => {
    practiceStartId.current=crypto.randomUUID();
    try {await startMUETTask(topic.id,'Mock',practiceStartId.current);}catch(e:any){toast.error(e.message);return;}
    setPrepTimeLeft(120); // 2:00
    setPhase('part1_prep');
  };

  const handleStartPart1Speaking = async () => {
    setPhase('part1_speaking');
    setSpeakTimeLeft(120); // 2:00
    try {
      await startRecording(1, true);
    } catch (e) {
      setMicDenied(true);
    }
  };

  const handleStopPart1Speaking = async () => {
    if (isRecording) await stopRecording();
    const finalSpeech = (transcript || part1Transcript).trim();
    setPart1Transcript(finalSpeech);

    setPhase('part1_analyzing');
    try {
      const p1NotesSummary = part1Notes.points.map(p => `P: ${p.point}; E: ${p.example}; R: ${p.reason}`).join(' | ');
      const p1Report = await analyzeMUETPart1(
        topic,
        candidate,
        finalSpeech,
        120 - speakTimeLeft || 60,
        p1NotesSummary
      );
      setPart1Report(p1Report);
      setPhase('transition');
    } catch (e) {
      toast.error('We could not get Part 1 feedback. Your response is still here. Please try again.');
      setPhase('part1_speaking');
    }
  };

  const handleStartPart2Prep = () => {
    setPrepTimeLeft(180); // 3:00 prep for Part 2
    setPhase('part2_prep');
  };

  const handleStartPart2Discussion = () => {
    setPhase('part2_discussion');
    setDiscussionTimeLeft(600); // 10 minutes

    // If student is not Candidate A, trigger Candidate A to open
    if (candidate !== 'A') {
      setTimeout(() => {
        triggerPeerTurn('A', 'start');
      }, 600);
    }
  };

  const triggerPeerTurn = async (
    peer: MUETCandidateId,
    action: 'start' | 'respond' | 'invite' | 'agree' | 'conclude' = 'respond'
  ) => {
    if (isAITurnGenerating) return;
    if (isRecording) await stopRecording();
    setIsAITurnGenerating(true);

    try {
      const res = await generateMUETPeerTurn(topic, peer, candidate, history, action);
      const newTurn: MUETDiscussionTurn = {
        id: 'turn_' + Date.now(),
        speaker: peer,
        speakerName: `Candidate ${peer}`,
        isAI: true,
        content: res.text,
        timestamp: Date.now(),
        skillType: res.skillType
      };

      setHistory(prev => [...prev, newTurn]);

      if ('speechSynthesis' in window) {
        setIsAISpeaking(true);
        const utterance = new SpeechSynthesisUtterance(res.text);
        utterance.rate = 0.95;
        utterance.onend = () => setIsAISpeaking(false);
        utterance.onerror = () => setIsAISpeaking(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      toast.error('The AI speaker is unavailable. Please try again.');
    } finally {
      setIsAITurnGenerating(false);
    }
  };

  const handleSendStudentTurn = async () => {
    const textToSend = (transcript || studentInputText).trim();
    if (!textToSend) return;

    if (isRecording) await stopRecording();

    const newTurn: MUETDiscussionTurn = {
      id: 'turn_' + Date.now(),
      speaker: candidate,
      speakerName: `You (Candidate ${candidate})`,
      isAI: false,
      content: textToSend,
      timestamp: Date.now(),
      skillType: 'Respond'
    };

    setHistory(prev => [...prev, newTurn]);
    setTranscript('');
    setStudentInputText('');

    const peers = CANDIDATES.filter(c => c !== candidate);
    const chosen = peers[Math.floor(Math.random() * peers.length)];

    setTimeout(() => {
      triggerPeerTurn(chosen, 'respond');
    }, 1200);
  };

  const handleFinishPart2Discussion = async () => {
    if (isRecording) await stopRecording();
    const latestText=(transcript || studentInputText).trim();
    const discussionHistory=latestText ? [...history, {id:'final_'+Date.now(),speaker:candidate,speakerName:'You',isAI:false,content:latestText,timestamp:Date.now()}] : history;
    if (latestText) {setHistory(discussionHistory);setTranscript('');setStudentInputText('');}
    setPhase('final_analyzing');
    const studentTurns = discussionHistory.filter(t => !t.isAI).map(t => t.content);

    try {
      if(!completedTask.current){await completeMUETTask(topic.id,'Mock',studentTurns.join(' '),600-discussionTimeLeft||300);completedTask.current=true;}
      const p2Report = await analyzeMUETPart2(
        topic,
        candidate,
        studentTurns,
        discussionHistory,
        600 - discussionTimeLeft || 300
      );
      setPart2Report(p2Report);

      if (part1Report) {
        const combined = await analyzeMUETMockTest(topic, candidate, part1Report, p2Report);
        setFinalReport(combined);
      } else {
        setFinalReport(p2Report);
      }
      setPhase('report');
    } catch (e) {
      toast.error('We could not get feedback. Your discussion is still here. Please try again.');
      setPhase('part2_consensus');
    }
  };

  const handleConfirmExit = () => {
    if (isRecording) stopRecording();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setShowExitModal(false);
    if(completedTask.current){completedTask.current=false;bank.reload();}
    setPhase('intro');
    setPrepTimeLeft(120);
    setSpeakTimeLeft(120);
    setDiscussionTimeLeft(600);
    setHistory([]);
    setPart1Transcript('');
    setFinalReport(null);
  };

  const handleSaveFinalReport = async () => {
    if (!finalReport || !onSaveReport) return;
    setIsSaving(true);
    try {
      await onSaveReport(finalReport);
      toast.success('Full Mock Report saved to My Progress!');
    } catch (e) {
      toast.error('Failed to save session.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if(bank.loading)return <p role="status" className="p-4 text-sm text-white/65">Finding a new test…</p>;
  if(bank.error)return <div role="alert" className="p-4 space-y-3 text-sm"><p>{bank.error}</p><button className="min-h-11 text-primary" onClick={bank.reload}>Try again</button></div>;
  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-white/10">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            Full Exam Simulation
          </span>
          <h2 className="text-base md:text-lg font-black text-white mt-1">
            MUET Full Mock Speaking Test (Paper 800/2)
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            Part 1 (Individual) + Part 2 (Group Discussion) • MPM Standard Timings
          </p>
        </div>

        {phase !== 'intro' && phase !== 'report' && (
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="px-4 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors self-start sm:self-auto"
          >
            End Test Early
          </button>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 max-w-sm w-full space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-lg font-bold text-white">Leave Mock Exam?</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Are you sure you want to exit? Your current test progress and speaking turns will be lost.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5"
              >
                Keep Testing
              </button>
              <button
                type="button"
                onClick={handleConfirmExit}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
              >
                Exit Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTRO PHASE */}
      {phase === 'intro' && (
        <div className="p-8 rounded-3xl bg-card border border-white/10 space-y-4">
          <div className="max-w-2xl space-y-3">
            <h3 className="text-xl font-bold text-white">
              How This Practice Test Works
            </h3>
            <p className="text-xs text-white/70 leading-relaxed">
              This full simulation takes approximately 18 to 20 minutes and guides you through both parts of the MUET Speaking test in one continuous session:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Stage 1</span>
              <h4 className="text-sm font-bold text-white">Part 1: Individual Presentation</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                2:00 preparation to jot notes, followed by 2:00 speaking on your own.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">Stage 2</span>
              <h4 className="text-sm font-bold text-white">Part 2: Group Discussion</h4>
              <p className="text-xs text-white/60 leading-relaxed">
                3:00 preparation with the mind map, followed by 8 to 12 minutes talking with AI peers to agree on an answer.
              </p>
            </div>
          </div>

          {/* Candidate Selection */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <label className="text-xs font-bold text-white block">Your speaker</label>
            <div className="grid grid-cols-4 gap-3">
              {CANDIDATES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCandidate(c)}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-bold transition-all",
                    candidate === c
                      ? "bg-primary text-obsidian border-primary"
                      : "bg-white/5 text-white/70 border-white/10"
                  )}
                >
                  Candidate {c}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartMockTest}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-obsidian font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Begin Full Mock Test</span>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* PART 1 PREP */}
      {phase === 'part1_prep' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-obsidian flex items-center justify-center font-black text-2xl shrink-0">
                {formatTimer(prepTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-amber-300">Stage 1 of 2 • Preparation (2:00)</div>
                <h3 className="text-base font-bold text-white">Write down your 2-3 points using the PER digital notes</h3>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
            <span className="text-[10px] font-black uppercase text-primary">Your Task (Candidate {candidate})</span>
            <p className="text-sm font-bold text-white mt-1">{topic.part1.tasks[candidate]}</p>
          </div>

          <MUETDigitalNotes notes={part1Notes} onChange={setPart1Notes} />
        </div>
      )}

      {/* PART 1 SPEAKING */}
      {phase === 'part1_speaking' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0",
                speakTimeLeft <= 20 ? "bg-red-500 text-white animate-pulse" : "bg-primary text-obsidian"
              )}>
                {formatTimer(speakTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-primary">Stage 1 of 2 • Speaking (2:00)</div>
                <h3 className="text-base font-bold text-white">Speak clearly and steadily</h3>
                <p className="text-xs text-white/50">"Good day everyone. Today I will discuss..."</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStopPart1Speaking}
              className="px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold"
            >
              Finish Part 1
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-2">
            <label className="text-xs font-bold text-white">Your Spoken Transcript</label>
            <textarea
              rows={4}
              value={transcript || part1Transcript}
              onChange={e => setPart1Transcript(e.target.value)}
              placeholder="Recording your speech... (Or type here if mic is denied)"
              className="w-full p-4 rounded-2xl bg-obsidian border border-white/10 text-white text-xs leading-relaxed focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TRANSITION TO PART 2 */}
      {phase === 'transition' && (
        <div className="p-8 rounded-3xl bg-card border border-white/10 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="text-xl font-bold text-white">Part 1 Completed!</h3>
          <p className="text-xs text-white/60 max-w-md mx-auto">
            Now transitioning to Part 2: Group Discussion. You will have 3 minutes to study the mind map before discussion starts.
          </p>
          <button
            type="button"
            onClick={handleStartPart2Prep}
            className="px-8 py-3 rounded-2xl bg-primary text-obsidian font-bold text-xs hover:bg-primary/90 shadow-md shadow-primary/20"
          >
            Start Part 2 Preparation (3:00)
          </button>
        </div>
      )}

      {/* PART 2 PREP */}
      {phase === 'part2_prep' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-obsidian flex items-center justify-center font-black text-2xl shrink-0">
                {formatTimer(prepTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-amber-300">Stage 2 of 2 • Preparation (3:00)</div>
                <h3 className="text-base font-bold text-white">Review the mind map and prepare ideas for discussion</h3>
              </div>
            </div>
          </div>

          <MUETMindMap
            situation={topic.part2.situation}
            centralQuestion={topic.part2.centralQuestion}
            points={topic.part2.points}
            decisionPrompt={topic.part2.decisionPrompt}
          />
        </div>
      )}

      {/* PART 2 DISCUSSION */}
      {(phase === 'part2_discussion' || phase === 'part2_consensus') && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-card border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-obsidian flex items-center justify-center font-black text-xl shrink-0">
                {formatTimer(discussionTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-primary">Stage 2 of 2 • Group Discussion</div>
                <h3 className="text-sm font-bold text-white">Exchange viewpoints and reach consensus</h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinishPart2Discussion}
              className="px-5 py-2.5 rounded-xl bg-primary text-obsidian text-xs font-bold hover:bg-primary/90"
            >
              Finish Mock Exam
            </button>
          </div>

          <MUETMindMap
            situation={topic.part2.situation}
            centralQuestion={topic.part2.centralQuestion}
            points={topic.part2.points}
            decisionPrompt={topic.part2.decisionPrompt}
          />

          {/* Group turns */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <div
              ref={chatScrollRef}
              className="min-h-[200px] max-h-[340px] overflow-y-auto space-y-3 p-2 custom-scrollbar"
            >
              {history.map(turn => (
                <div
                  key={turn.id}
                  className={cn(
                    "p-4 rounded-2xl border text-xs max-w-xl",
                    !turn.isAI ? "ml-auto bg-primary/10 border-primary text-white" : "mr-auto bg-white/5 border-white/10 text-white/90"
                  )}
                >
                  <div className="font-bold text-primary mb-1">{turn.speakerName}</div>
                  <p>{turn.content}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
              <input
                type="text"
                value={transcript || studentInputText}
                onChange={e => setStudentInputText(e.target.value)}
                placeholder="Speak or type your turn here..."
                className="flex-1 p-3 rounded-xl bg-obsidian border border-white/10 text-white text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSendStudentTurn}
                className="px-4 py-3 bg-primary text-obsidian rounded-xl font-bold text-xs"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL ANALYZING */}
      {(phase === 'part1_analyzing' || phase === 'final_analyzing') && (
        <div className="p-12 rounded-3xl bg-card border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-white">Generating Complete Mock Speaking Feedback...</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Evaluating both Part 1 and Part 2 according to CEFR and Malaysian Examinations Council criteria.
          </p>
        </div>
      )}

      {/* FINAL REPORT */}
      {phase === 'report' && finalReport && (
        <MUETExaminerReportView
          report={finalReport}
          onRetest={()=>{completedTask.current=false;bank.reload();setPhase('intro');}}
          onSaveToProgress={handleSaveFinalReport}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
