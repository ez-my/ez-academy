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
  MessageSquare,
  Users,
  Send,
  ThumbsUp,
  ThumbsDown,
  Hand
} from 'lucide-react';
import { MUETTopic, MUETCandidateId, MUETDiscussionTurn, MUETExaminerReport } from '../../types/muet';
import { MUET_TOPICS, getRandomMUETTopic } from '../../data/muetTopicsBank';
import { MUETMindMap } from './MUETMindMap';
import { MUETExaminerReportView } from './MUETExaminerReportView';
import { generateMUETPeerTurn, analyzeMUETPart2 } from '../../lib/muetService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { cn } from '../../lib/utils';
import { toast } from 'react-hot-toast';

interface MUETPart2PracticeProps {
  onSaveReport?: (report: MUETExaminerReport) => Promise<void>;
  initialTopicId?: string;
}

type Phase = 'setup' | 'prep' | 'discussion' | 'consensus' | 'analyzing' | 'report' | 'completed';

const CANDIDATES: MUETCandidateId[] = ['A', 'B', 'C', 'D'];

export const MUETPart2Practice: React.FC<MUETPart2PracticeProps> = ({
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
  const bank=useMUETBank('Part2',setTopic);
  const completedTask=useRef(false);
  const practiceStartId=useRef(crypto.randomUUID());


  const [studentCandidate, setStudentCandidate] = useState<MUETCandidateId>('B'); // B is default
  const [phase, setPhase] = useState<Phase>('setup');
  const [prepTimeLeft, setPrepTimeLeft] = useState(180); // 3:00 prep
  const [discussionTimeLeft, setDiscussionTimeLeft] = useState(600); // 10:00 default (8-12m)
  const [durationSpent, setDurationSpent] = useState(0);

  // Discussion state
  const [history, setHistory] = useState<MUETDiscussionTurn[]>([]);
  const [studentInputText, setStudentInputText] = useState('');
  const [isAITurnGenerating, setIsAITurnGenerating] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // Audio recording hook
  const {
    isRecording,
    transcript,
    setTranscript,
    startRecording,
    stopRecording,
    error: micError
  } = useAudioRecorder();

  const [report, setReport] = useState<MUETExaminerReport | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [micDenied, setMicDenied] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat turns
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [history, isAITurnGenerating]);

  // Prep Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phase === 'prep' && prepTimeLeft > 0) {
      timer = setInterval(() => {
        setPrepTimeLeft(prev => {
          if (prev <= 1) {
            handleStartDiscussion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, prepTimeLeft]);

  // Discussion Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if ((phase === 'discussion' || phase === 'consensus') && discussionTimeLeft > 0) {
      timer = setInterval(() => {
        setDiscussionTimeLeft(prev => {
          setDurationSpent(d => d + 1);
          if (prev <= 1) {
            handleMoveToConsensus();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase, discussionTimeLeft]);

  // Mic error check
  useEffect(() => {
    if (micError && micError.includes('NotAllowedError')) {
      setMicDenied(true);
    }
  }, [micError]);

  // Stop mic when AI is speaking to enforce audio state machine (no simultaneous playback & mic)
  useEffect(() => {
    if (isAISpeaking && isRecording) {
      stopRecording();
    }
  }, [isAISpeaking, isRecording]);

  const handleStartPrep = () => {
    practiceStartId.current=crypto.randomUUID();
    setPrepTimeLeft(180);
    setPhase('prep');
  };

  const handleStartDiscussion = async () => {
    try {await startMUETTask(topic.id,'Part2',practiceStartId.current);}catch(e:any){toast.error(e.message);return;}
    setPhase('discussion');
    setDiscussionTimeLeft(600); // 10 minutes default
    setDurationSpent(0);

    // If student is NOT candidate A, let Candidate A open the discussion
    if (studentCandidate !== 'A') {
      setTimeout(() => {
        triggerAIPeerTurn('A', 'start');
      }, 600);
    }
  };

  const triggerAIPeerTurn = async (
    peer: MUETCandidateId,
    action: 'start' | 'respond' | 'invite' | 'agree' | 'conclude' = 'respond',
    discussionHistory: MUETDiscussionTurn[] = history
  ) => {
    if (isAITurnGenerating) return;
    setIsAITurnGenerating(true);

    try {
      const res = await generateMUETPeerTurn(topic, peer, studentCandidate, discussionHistory, action);
      const newTurn: MUETDiscussionTurn = {
        id: 'turn_' + Date.now(),
        speaker: peer,
        speakerName: `Speaker ${peer}`,
        isAI: true,
        content: res.text,
        timestamp: Date.now(),
        skillType: res.skillType
      };

      setHistory(prev => [...prev, newTurn]);

      // Play audio via speech synthesis if available and supported
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

  const handleSendStudentTurn = async (skillType: 'Initiate' | 'Respond' | 'Develop' | 'Conclude' | 'Question' | 'Agreement' = 'Respond') => {
    const textToSend = (transcript || studentInputText).trim();
    if (!textToSend) {
      toast.error('Please speak or type your response before sending your turn.');
      return;
    }

    if (isRecording) {
      await stopRecording();
    }

    const newTurn: MUETDiscussionTurn = {
      id: 'turn_' + Date.now(),
      speaker: studentCandidate,
      speakerName: `You (Speaker ${studentCandidate})`,
      isAI: false,
      content: textToSend,
      timestamp: Date.now(),
      skillType
    };

    const nextHistory = [...history, newTurn];
    setHistory(nextHistory);
    setTranscript('');
    setStudentInputText('');

    // Pick an AI peer who hasn't spoken recently
    const peers = CANDIDATES.filter(c => c !== studentCandidate);
    const lastSpeaker = history[history.length - 1]?.speaker;
    const availablePeers = peers.filter(p => p !== lastSpeaker);
    const chosenPeer = availablePeers[Math.floor(Math.random() * availablePeers.length)] || peers[0];

    // AI peer responds after a natural short pause
    setTimeout(() => {
      const action = textToSend.toLowerCase().includes('decide') || textToSend.toLowerCase().includes('agree')
        ? 'agree'
        : Math.random() > 0.5 ? 'respond' : 'invite';
      triggerAIPeerTurn(chosenPeer, action, nextHistory);
    }, 1200);
  };

  const handleToggleMic = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      try {
        await startRecording(1, true);
      } catch (e) {
        setMicDenied(true);
      }
    }
  };

  const handleMoveToConsensus = () => {
    setPhase('consensus');
  };

  const handleFinishAndAnalyze = async () => {
    setPhase('analyzing');
    const latestText=(transcript||studentInputText).trim();
    const finalHistory=latestText?[...history,{id:'final_'+Date.now(),speaker:studentCandidate,speakerName:'You',isAI:false,content:latestText,timestamp:Date.now()}]:history;
    if(latestText){setHistory(finalHistory);setTranscript('');setStudentInputText('');}
    const studentTurns = finalHistory.filter(t => !t.isAI).map(t => t.content);

    if (studentTurns.length === 0) {
      toast.error('You have not spoken or sent any turns yet. Please participate in the discussion first.');
      setPhase('discussion');
      return;
    }

    try {
      if(!completedTask.current){await completeMUETTask(topic.id,'Part2',studentTurns.join(' '),durationSpent||300);completedTask.current=true;}
      const res = await analyzeMUETPart2(
        topic,
        studentCandidate,
        studentTurns,
        finalHistory,
        durationSpent || 300
      );
      setReport(res);
      setPhase('report');
    } catch (e: any) {
      toast.error(completedTask.current?'Your task is completed. Personal feedback is unavailable.':'Could not save completion. Your answer is kept. Please try again.');
      setPhase(completedTask.current?'completed':'discussion');
    }
  };

  const handleReset = () => {
    if (isRecording) stopRecording();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if(completedTask.current){completedTask.current=false;bank.reload();}
    setPhase('setup');
    setPrepTimeLeft(180);
    setDiscussionTimeLeft(600);
    setDurationSpent(0);
    setHistory([]);
    setTranscript('');
    setStudentInputText('');
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
            Paper 800/2 Part 2
          </span>
          <h2 className="text-base md:text-lg font-black text-white mt-1">
            Talk together
          </h2>
          <p className="text-xs text-white/50 mt-0.5">
            3 min prep · 8–12 min discussion
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
                <p className="text-[11px] text-white/40">New questions only · Part 2 B2</p>
              </div>

              <button
                type="button"
                onClick={() => bank.random(topic.id)}
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

          {/* Student Candidate Selection (B default) */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Your speaker</h3>
              <p className="text-xs text-white/50 mt-0.5">
                Practise with 3 AI speakers.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {CANDIDATES.map(c => {
                const isSelected = studentCandidate === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setStudentCandidate(c)}
                    className={cn(
                      "min-h-11 p-2 rounded-xl border text-center transition-all duration-200",
                      isSelected
                        ? "bg-primary text-obsidian border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                        : "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
                    )}
                  >
                    <div className="text-xl font-black">{c}</div>
                    <div className={cn("text-[10px] mt-1 font-semibold", isSelected ? "text-obsidian/80" : "text-white/40")}>
                      {isSelected ? 'You' : 'AI'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mind Map Preview */}
          <MUETMindMap
            situation={topic.part2.situation}
            centralQuestion={topic.part2.centralQuestion}
            points={topic.part2.points}
            decisionPrompt={topic.part2.decisionPrompt}
          />

          {/* Start Button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleStartPrep}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-primary text-obsidian font-black text-sm uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Start 3-Minute Preparation</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* PREPARATION PHASE */}
      {phase === 'prep' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-obsidian flex items-center justify-center font-black text-2xl shrink-0 shadow-lg shadow-amber-500/20">
                {formatTimer(prepTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                  Preparation Time (3:00)
                </div>
                <h3 className="text-base font-bold text-white">
                  Examine the mind map points and plan what to say
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartDiscussion}
              className="px-5 py-2.5 rounded-xl bg-primary text-obsidian font-bold text-xs hover:bg-primary/90 flex items-center justify-center gap-1.5 shadow-md shadow-primary/20 transition-all self-start sm:self-auto"
            >
              <span>Skip Prep & Discuss Now</span>
              <ChevronRight size={15} />
            </button>
          </div>

          <MUETMindMap
            situation={topic.part2.situation}
            centralQuestion={topic.part2.centralQuestion}
            points={topic.part2.points}
            decisionPrompt={topic.part2.decisionPrompt}
          />
        </div>
      )}

      {/* DISCUSSION PHASE */}
      {(phase === 'discussion' || phase === 'consensus') && (
        <div className="space-y-4">
          {/* Discussion Timer Bar */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary text-obsidian flex items-center justify-center font-black text-xl shrink-0 shadow-lg shadow-primary/20">
                {formatTimer(discussionTimeLeft)}
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-wider text-primary">
                  {phase === 'consensus' ? 'Final Agreement Phase' : 'Group Discussion (10:00)'}
                </div>
                <h3 className="text-sm md:text-base font-bold text-white">
                  {phase === 'consensus' ? 'Agree on the final choice together' : 'Discussion in progress (Share, respond, add details)'}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {phase === 'discussion' ? (
                <button
                  type="button"
                  onClick={handleMoveToConsensus}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/30 transition-colors"
                >
                  Move to Final Agreement
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishAndAnalyze}
                  className="px-5 py-2.5 rounded-xl bg-primary text-obsidian text-xs font-bold hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
                >
                  Finish & View Feedback
                </button>
              )}
            </div>
          </div>

          {/* Compact Mind Map for Quick Reference */}
          <MUETMindMap
            situation={topic.part2.situation}
            centralQuestion={topic.part2.centralQuestion}
            points={topic.part2.points}
            decisionPrompt={topic.part2.decisionPrompt}
          />

          {/* Group Turns Transcript / Chat Area */}
          <div className="p-4 rounded-2xl bg-card border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-primary" />
                <span className="text-xs font-bold text-white">Active Discussion Turns</span>
              </div>
              <span className="text-[11px] text-white/50">
                You are Candidate {studentCandidate}
              </span>
            </div>

            {/* Turns Box */}
            <div
              ref={chatScrollRef}
              className="min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 p-2 pr-3 custom-scrollbar"
            >
              {history.length === 0 && (
                <div className="p-6 text-center text-xs text-white/40">
                  Discussion starting... Candidate A or you can open the conversation.
                </div>
              )}

              {history.map(turn => {
                const isStudent = !turn.isAI;
                  return (
                  <div
                    key={turn.id}
                    className={cn(
                      "p-4 rounded-2xl border text-xs max-w-xl transition-all",
                      isStudent
                        ? "ml-auto bg-primary/10 border-primary text-white"
                        : "mr-auto bg-white/5 border-white/10 text-white/90"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className={cn(
                        "font-black text-[11px] uppercase tracking-wider",
                        isStudent ? "text-primary" : "text-amber-400"
                      )}>
                        {turn.speakerName}
                      </span>
                      {turn.skillType && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50 font-bold uppercase">
                          {turn.skillType}
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed font-normal">{turn.content}</p>
                  </div>
                );
              })}

              {isAITurnGenerating && (
                <div className="mr-auto p-3 rounded-2xl bg-white/5 border border-white/10 text-xs text-white/50 flex items-center gap-2 italic">
                  <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span>An AI group member is speaking...</span>
                </div>
              )}
            </div>

            {/* Student Response Controls */}
            <div className="space-y-3 pt-3 border-t border-white/5">
              {/* Quick skill guidance buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px]">
                <span className="text-white/40 shrink-0 font-medium">Quick Phrases:</span>
                <button
                  type="button"
                  onClick={() => setStudentInputText(prev => prev ? prev + ' I agree with that point because...' : 'I agree with that point because...')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 shrink-0"
                >
                  Agree politely
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInputText(prev => prev ? prev + ' That is a fair point, however from another angle...' : 'That is a fair point, however from another angle...')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 shrink-0"
                >
                  Disagree politely
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInputText(prev => prev ? prev + ' Candidate C, what are your thoughts on this?' : 'Candidate C, what are your thoughts on this?')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 shrink-0"
                >
                  Invite another peer
                </button>
                <button
                  type="button"
                  onClick={() => setStudentInputText(prev => prev ? prev + ' Shall we agree that this is the best choice?' : 'Shall we agree that this is the best choice?')}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 shrink-0"
                >
                  Agree on final decision
                </button>
              </div>

              {/* Input Area */}
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  onClick={handleToggleMic}
                  disabled={isAISpeaking}
                  className={cn(
                    "p-3 rounded-2xl border transition-all shrink-0 flex items-center justify-center",
                    isRecording
                      ? "bg-red-500 text-white border-red-500 animate-pulse"
                      : isAISpeaking
                        ? "bg-white/5 text-white/30 border-white/10 cursor-not-allowed"
                        : "bg-white/10 hover:bg-white/20 text-primary border-white/10"
                  )}
                  aria-label={isAISpeaking ? "The examiner is speaking, your microphone is paused" : isRecording ? "Stop recording" : "Start recording"} title={isAISpeaking ? "AI is speaking, mic paused" : isRecording ? "Stop recording speech" : "Speak your turn"}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                <textarea
                  rows={2}
                  value={transcript || studentInputText}
                  onChange={e => setStudentInputText(e.target.value)}
                  placeholder={
                    isRecording
                      ? "Listening to your speech live..."
                      : isAISpeaking
                        ? "Peer is speaking. Listen or type your response here..."
                        : "Type or speak your turn to the group..."
                  }
                  className="flex-1 p-3 rounded-2xl bg-obsidian border border-white/10 text-white text-xs leading-relaxed focus:border-primary focus:outline-none resize-none"
                />

                <button
                  type="button"
                  onClick={() => handleSendStudentTurn('Respond')}
                  disabled={isAITurnGenerating || (!transcript && !studentInputText.trim())}
                  className="p-3 rounded-2xl bg-primary hover:bg-primary/90 text-obsidian font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  title="Send turn to group"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ANALYZING PHASE */}
      {phase === 'analyzing' && (
        <div className="p-12 rounded-3xl bg-card border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
          <h3 className="text-xl font-bold text-white">Analyzing Group Discussion...</h3>
          <p className="text-xs text-white/50 max-w-md mx-auto">
            Reviewing your turn-taking, answering points, polite agreement/disagreement, and collaboration skills.
          </p>
        </div>
      )}

      {/* REPORT PHASE */}
      {phase === 'report' && report && (
        <MUETExaminerReportView
          report={report}
          onRetest={handleReset}
          onSaveToProgress={handleSaveReport}
          isSaving={isSaving}
        />
      )}
    </div>
  );
};
