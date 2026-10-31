import { usePracticeProgress, usePracticeDraft } from '../hooks/usePracticeProgress';
import { ProgressSaveStatus } from '../components/ProgressSaveStatus';
import {startPractice} from '../lib/practice';
import { primeExaminerAudio } from '../lib/examinerPlayback';
import { WARMUP_INTRO, parseWarmupHistory, selectWarmupQuestions } from '../speakingWarmup';
import { getExaminerVoice } from '../lib/examinerVoice';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Trash2, Save, Play, Pause, Loader2, Sparkles, ChevronLeft, ChevronRight, Clock, MessageCircle, User, Users, PlayCircle, AlertCircle, RefreshCw, BookOpen, Volume2, Search, Terminal, Binary, Trophy, Gamepad2, Key, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { generateSPMSpeakingTask, analyzeSPMSpeaking, SPMSpeakingTask } from '../lib/gemini';
import { audioStorage } from '../lib/storage';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, saveSession, updateProfile } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';
import { useDailyLimits, CREDIT_COSTS } from '../lib/limits';
import { PaywallModal } from '../components/paywall/PaywallModal';
import { UserProfile, PlanType } from '../types';
import { getRandomQuestion, markQuestionAsCompleted, saveQuestionToBank } from '../services/questionBankService';
import { SuccessFeedback } from '../components/layout/SuccessFeedback';
import { toast } from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../lib/apiUtils';
import { getFriendlyFirebaseError } from '../lib/firebase';

interface SpeakEZProps {
  profile: UserProfile;
}

type ViewState = 'selection' | 'intro' | 'task' | 'preparation' | 'recording' | 'review' | 'feedback';

type SavedPractice = {
  id: string;
  userId: string;
  part: 1 | 2 | 3 | 'Full';
  fullPart: 1 | 2 | 3;
  task: SPMSpeakingTask;
  transcript: string;
  createdAt: number;
};

const TEACHER_AUDIO_BY_LINE: Record<string, string> = {};

const TypewriterText = ({ text, delay = 0, speed = 20, onComplete }: { text: string; delay?: number; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayedText(text.slice(0, i + 1));
        i++;
        if (i === text.length) {
          clearInterval(interval);
          onComplete?.();
        }
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, delay, speed, onComplete]);
  return (
    <div className="markdown-body text-white/80">
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <h1 className="text-xl font-black text-white mt-6 mb-2 uppercase tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-lg font-black text-primary mt-5 mb-2 uppercase tracking-wide" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mt-4 mb-2" {...props} />,
          p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
          ul: ({node, ...props}) => <ul className="list-none space-y-2 mb-4" {...props} />,
          li: ({node, ...props}) => (
            <li className="flex gap-3 text-sm md:text-base leading-relaxed items-start" {...props}>
              <span className="text-primary mt-1 shrink-0">•</span>
              <span className="opacity-90">{props.children}</span>
            </li>
          ),
          strong: ({node, ...props}) => <strong className="font-black text-white" {...props} />,
        }}
      >
        {displayedText}
      </ReactMarkdown>
    </div>
  );
};

const VoicePulse = ({ active }: { active: boolean }) => (
  <div className="relative w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
    <AnimatePresence>
      {active && (
        <>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 bg-primary/20 rounded-full blur-xl"
          />
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className="absolute inset-0 bg-primary/30 rounded-full blur-lg"
          />
        </>
      )}
    </AnimatePresence>
    <div className={`relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-700 ${active ? 'bg-red-500 shadow-[0_0_50px_rgba(239,68,68,0.4)] scale-110' : 'bg-white/5 border border-white/10'}`}>
      {active ? <Square className="text-white w-6 h-6 md:w-8 md:h-8" fill="currentColor" /> : <Mic className="text-white/20 w-6 h-6 md:w-8 md:h-8" />}
    </div>
  </div>
);

export const SpeakEZ: React.FC<SpeakEZProps> = ({ profile }) => {
  const navigate = useNavigate();
  const { isLimitReached, incrementUsage, getRemaining } = useDailyLimits(profile.plan || 'free', profile.email);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleSelectPartWithLimit = (part: 1 | 2 | 3 | 'Full') => {
    if (part === 'Full' && (profile.plan === 'free'||profile.fullTestAccess===false)) {
      alert("Full Mock Paper is locked for free users. Please upgrade your plan to access this feature.");
      navigate('/app/pricing');
      return;
    }
    if (isLimitReached('speak')) {
      setPendingAction(() => () => handleSelectPart(part, true));
      setShowPaywall(true);
      return;
    }
    handleSelectPart(part, false);
  };

  const handleSelectPart = (part: 1 | 2 | 3 | 'Full', skipLimitCheck = false) => {
    if (!skipLimitCheck && isLimitReached('speak')) {
      setPendingAction(() => () => handleSelectPart(part, true));
      setShowPaywall(true);
      return;
    }
    setSelectedPart(part);
    setError(null);
    setMessages([]);
    setView('intro');
  };

  const executeUseCredits = async () => {
    const cost = analysisType === 'deep' ? CREDIT_COSTS.speak.deep : CREDIT_COSTS.speak.basic;
    if ((profile.credits || 0) < cost) {
      alert("You don't have enough credits. Please purchase more.");
      return;
    }
    try {
      await updateProfile(profile.uid, { credits: increment(-cost) as any });
      setShowPaywall(false);
      
      // Execute the action immediately after closing the paywall
      if (pendingAction) {
        console.log("Executing pending action after credit deduction");
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to deduct credits. Please check your connection.");
    }
  };
  
  const progress = usePracticeProgress(profile.uid, 'SpeakEZ');
  const [view, setView] = useState<ViewState>(progress.attempt?.draft?.task ? 'review' : 'selection');
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPart, setSelectedPart] = useState<1 | 2 | 3 | 'Full' | null>(progress.attempt?.draft?.selectedPart || null);
  const [currentFullPart, setCurrentFullPart] = useState<1 | 2 | 3>(progress.attempt?.draft?.currentFullPart || 1);
  const [task, setTask] = useState<SPMSpeakingTask | null>(progress.attempt?.draft?.task || null);
  const activePart = selectedPart === 'Full' ? currentFullPart : selectedPart;
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

  const [prepTimer, setPrepTimer] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sensitivity, setSensitivity] = useState(1.0);
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', text: string }[]>([]);
  const [showEarlier, setShowEarlier] = useState(false);
  const [difficulty, setDifficulty] = useState<'normal' | 'expert'>(localStorage.getItem('preferred_difficulty') as 'normal' | 'expert' || 'normal');
  const [source, setSource] = useState<'ai' | 'bank'>(localStorage.getItem('preferred_source') as 'ai' | 'bank' || 'bank');
  const warmupHistoryRef = useRef<string[]>([]);
  const nextQuestionBusyRef = useRef(false);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(localStorage.getItem('preferred_voice'));
  const [naturalVoiceEnabled, setNaturalVoiceEnabled] = useState(localStorage.getItem('speakez_natural_voice') !== 'off');
  const [usedThemes, setUsedThemes] = useState<string[]>(JSON.parse(localStorage.getItem('used_speak_themes') || '[]').slice(-10));
  const [usedPart1Ids, setUsedPart1Ids] = useState<string[]>(JSON.parse(localStorage.getItem('used_part1_ids') || '[]').slice(-10));
  const [usedPart2Ids, setUsedPart2Ids] = useState<string[]>(JSON.parse(localStorage.getItem('used_part2_ids') || '[]').slice(-10));
  const [usedPart3Ids, setUsedPart3Ids] = useState<string[]>(JSON.parse(localStorage.getItem('used_part3_ids') || '[]').slice(-10));
  const [part3Step, setPart3Step] = useState<1 | 2 | 3>(1); // 1: Talk, 2: Decision, 3: HOT
  const [analysisType, setAnalysisType] = useState<'basic' | 'deep'>(
    localStorage.getItem('preferred_analysis') as 'basic' | 'deep' || 
    (profile.plan === 'pro' || profile.plan === 'pro_plus' ? 'deep' : 'basic')
  );
  const [showSettings, setShowSettings] = useState(false);
  
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [teacherAudioByLine, setTeacherAudioByLine] = useState<Record<string, string>>(TEACHER_AUDIO_BY_LINE);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [micStatus, setMicStatus] = useState<'untested' | 'checking' | 'ready' | 'blocked'>('untested');
  const [reviewTranscript, setReviewTranscript] = useState(progress.attempt?.draft?.transcript || '');
  const [answerDraft, setAnswerDraft] = useState<string | null>(null);
  const [previousAttempt, setPreviousAttempt] = useState<{ score: number; transcript: string } | null>(null);
  const [savedPractices, setSavedPractices] = useState<SavedPractice[]>([]);
  const [activeSavedPracticeId, setActiveSavedPracticeId] = useState<string | null>(null);

  useEffect(() => {
    const syncConnection = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', syncConnection);
    window.addEventListener('offline', syncConnection);
    return () => {
      window.removeEventListener('online', syncConnection);
      window.removeEventListener('offline', syncConnection);
    };
  }, []);

  // Global audio unlocking on first gesture
  useEffect(() => {
    const unlockAudio = () => {
      try {
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance('');
          utterance.volume = 0;
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {}
      
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  useEffect(() => {
    let active = true;
    void fetch('/speakez-voices/manifest.json')
      .then(response => response.ok ? response.json() : {})
      .then((manifest: Record<string, unknown>) => {
        if (!active || !manifest || typeof manifest !== 'object') return;
        const safeEntries = Object.entries(manifest).filter((entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string' && entry[1].startsWith('/speakez-voices/')
        );
        setTeacherAudioByLine(Object.fromEntries(safeEntries));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);
  
  useEffect(() => {
    localStorage.setItem('used_speak_themes', JSON.stringify(usedThemes));
  }, [usedThemes]);

  useEffect(() => {
    localStorage.setItem('used_part1_ids', JSON.stringify(usedPart1Ids));
  }, [usedPart1Ids]);

  useEffect(() => {
    localStorage.setItem('used_part2_ids', JSON.stringify(usedPart2Ids));
  }, [usedPart2Ids]);

  useEffect(() => {
    localStorage.setItem('used_part3_ids', JSON.stringify(usedPart3Ids));
  }, [usedPart3Ids]);

  useEffect(() => {
    localStorage.setItem('preferred_difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    localStorage.setItem('preferred_source', source);
  }, [source]);

  useEffect(() => {
    if (selectedVoiceName) {
      localStorage.setItem('preferred_voice', selectedVoiceName);
    }
  }, [selectedVoiceName]);

  useEffect(() => {
    localStorage.setItem('speakez_natural_voice', naturalVoiceEnabled ? 'on' : 'off');
  }, [naturalVoiceEnabled]);

  useEffect(() => {
    localStorage.setItem('preferred_analysis', analysisType);
  }, [analysisType]);

  const speakSessionIdRef = useRef(0);
  const pendingSpeechResolveRef = useRef<(() => void) | null>(null);
  const practiceSessionRef = useRef(0);
  const teacherAudioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedAudioRef = useRef<HTMLAudioElement | null>(null);
  const generatedVoiceUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => () => {
    for (const url of generatedVoiceUrlsRef.current.values()) URL.revokeObjectURL(url);
    generatedVoiceUrlsRef.current.clear();
  }, []);

  const savedPracticeKey = `speakez_saved_practice_${profile.uid}`;
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(savedPracticeKey) || '[]');
      setSavedPractices(Array.isArray(saved) ? saved.filter((item: SavedPractice) => item.userId === profile.uid) : []);
    } catch {
      setSavedPractices([]);
    }
  }, [savedPracticeKey, profile.uid]);

  const cancelExaminerSpeech = () => {
    speakSessionIdRef.current += 1;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (teacherAudioRef.current) {
      teacherAudioRef.current.pause();
      teacherAudioRef.current.src = '';
      teacherAudioRef.current = null;
    }
    pendingSpeechResolveRef.current?.();
    pendingSpeechResolveRef.current = null;
    setIsAiSpeaking(false);
  };

  // Human recordings take priority, then a shared AI clip, then the device voice.
  const speak = async (text: string): Promise<void> => {
    if (!('speechSynthesis' in window)) {
      setError('This browser does not support spoken examiner prompts. Please read the prompt on screen.');
      return;
    }

    const resumeAfterSpeech = isRecording && !isPaused;
    if (resumeAfterSpeech) pauseRecording();
    cancelExaminerSpeech();
    const cancellationToken = speakSessionIdRef.current;
    // Allow speech recognition to stop before sound comes out of the speakers.
    if (resumeAfterSpeech) await new Promise(resolve => window.setTimeout(resolve, 250));
    if (speakSessionIdRef.current !== cancellationToken) return;

    const sessionId = ++speakSessionIdRef.current;
    const utterance = new SpeechSynthesisUtterance(text);
    const currentVoices = voices.length ? voices : window.speechSynthesis.getVoices();
    const englishVoices = currentVoices.filter(voice => voice.lang.toLowerCase().startsWith('en'));
    const chosenVoice = englishVoices.find(voice => voice.name === selectedVoiceName) ||
      [...englishVoices].sort((a, b) => {
        const rank = (voice: SpeechSynthesisVoice) =>
          (voice.localService ? 10 : 0) +
          (/en-GB/i.test(voice.lang) ? 5 : 0) +
          (/\b(Flo|Reed|Sandy|Shelley|Eddy)\b/i.test(voice.name) ? 30 : 0) +
          (/\b(Samantha|Daniel|Karen|Moira)\b/i.test(voice.name) ? 15 : 0) -
          (/Bad News|Boing|Bubbles|Jester|Whisper|Zarvox/i.test(voice.name) ? 100 : 0);
        return rank(b) - rank(a);
      })[0];
    if (chosenVoice) utterance.voice = chosenVoice;
    utterance.lang = chosenVoice?.lang || 'en-GB';
    const warmupVoice = selectedPart === 1 || (selectedPart === 'Full' && currentFullPart === 1);
    utterance.rate = warmupVoice ? 0.88 : 0.93;
    utterance.pitch = warmupVoice ? 1.06 : 1;
    setIsAiSpeaking(true);

    await new Promise<void>(resolve => {
      let finished = false;
      const complete = () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(watchdog);
        if (teacherAudioRef.current?.ended) teacherAudioRef.current = null;
        if (pendingSpeechResolveRef.current === complete) pendingSpeechResolveRef.current = null;
        if (speakSessionIdRef.current === sessionId) {
          setIsAiSpeaking(false);
          if (resumeAfterSpeech) {
            window.setTimeout(() => {
              if (speakSessionIdRef.current === sessionId) resumeRecording();
            }, 400);
          }
        }
        resolve();
      };
      const watchdog = window.setTimeout(() => {
        if (speakSessionIdRef.current === sessionId) {
          window.speechSynthesis.cancel();
          teacherAudioRef.current?.pause();
          teacherAudioRef.current = null;
        }
        complete();
      }, 95000);
      pendingSpeechResolveRef.current = complete;
      utterance.onend = complete;
      utterance.onerror = complete;
      const playClip = (url: string, fallback: () => void) => {
        if (finished || speakSessionIdRef.current !== sessionId) return;
        const clip = unlockedAudioRef.current || new Audio();
        unlockedAudioRef.current = clip;
        clip.src = url;
        teacherAudioRef.current = clip;
        clip.onended = complete;
        clip.onerror = () => {
          teacherAudioRef.current = null;
          fallback();
        };
        void clip.play().then(() => {
          if (speakSessionIdRef.current === sessionId) setError(previous => previous?.startsWith('The natural voice') || previous?.startsWith('Your browser paused') ? null : previous);
        }).catch((playError) => {
          if (finished || speakSessionIdRef.current !== sessionId) return;
          if (playError?.name === 'NotAllowedError') {
            setError('Your browser paused the examiner audio. Tap Listen again to play the question.');
            complete();
            return;
          }
          teacherAudioRef.current = null;
          fallback();
        });
      };
      const deviceVoice = () => {
        if (speakSessionIdRef.current !== sessionId) return;
        if (warmupVoice && naturalVoiceEnabled) {
          setError('The natural voice is unavailable right now. Read the question on screen, or choose device voice in Practice Settings.');
          complete();
          return;
        }
        window.speechSynthesis.speak(utterance);
      };
      const voiceCacheKey = `${warmupVoice ? 'warmup-coral-v2' : 'examiner'}:${text.trim()}`;
      const clipPath = warmupVoice ? undefined : teacherAudioByLine[text.trim()];
      if (clipPath) {
        playClip(clipPath, deviceVoice);
      } else if (naturalVoiceEnabled && isOnline && !isOfflineMode && auth.currentUser) {
        const cachedUrl = generatedVoiceUrlsRef.current.get(voiceCacheKey);
        if (cachedUrl) {
          playClip(cachedUrl, deviceVoice);
        } else {
          void (async () => {
            const controller = new AbortController();
            const timeout = window.setTimeout(() => controller.abort(), 50000);
            try {
              const token = await auth.currentUser!.getIdToken();
              const response = await getExaminerVoice(text, token, controller.signal, undefined, selectedPart === 1 || (selectedPart === 'Full' && currentFullPart === 1));
              if (!response.ok) throw new Error('Natural voice unavailable');
              const blob = await response.blob();
              if (!blob.size) throw new Error('Empty audio');
              const url = URL.createObjectURL(blob);
              generatedVoiceUrlsRef.current.set(voiceCacheKey, url);
              playClip(url, deviceVoice);
            } catch {
              deviceVoice();
            } finally {
              window.clearTimeout(timeout);
            }
          })();
        }
      } else {
        deviceVoice();
      }
    });
  };

  const { isRecording, isPaused, isTranscribing, duration, audioBlob, transcript, error: recordingError, transcriptionError, transcriptionAvailable, startRecording, pauseRecording, resumeRecording, stopRecording, reset, clearTranscript, loadRecording } = useAudioRecorder();
  
  useEffect(() => {
    if (recordingError) {
      setError(recordingError);
      // If we're in recording view but failed to start, go back or show error
      if (view === 'recording') {
        setIsAnalyzing(false);
      }
    }
  }, [recordingError, view]);
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const audioUrlRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const checkMicrophone = async (): Promise<boolean> => {
    if (profile.micEnabled === false) {
      setMicStatus('blocked');
      setError('Microphone access is disabled in your profile settings.');
      return false;
    }
    setMicStatus('checking');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot access a microphone.');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicStatus('ready');
      setError(null);
      return true;
    } catch (err: any) {
      setMicStatus('blocked');
      setError(err?.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow it in your browser, then try again.'
        : err?.name === 'NotFoundError'
          ? 'No microphone was found. Connect one and try again.'
          : 'Microphone check failed. Check your browser and device settings.');
      return false;
    }
  };

  const persistSavedPractices = (items: SavedPractice[]) => {
    localStorage.setItem(savedPracticeKey, JSON.stringify(items));
    setSavedPractices(items);
  };

  const savePracticeForLater = async () => {
    if (!audioBlob || !task || !selectedPart) return;
    const id = activeSavedPracticeId || `draft-${Date.now()}`;
    try {
      await audioStorage.saveAudio(id, audioBlob);
      const item: SavedPractice = {
        id, userId: profile.uid, part: selectedPart, fullPart: currentFullPart,
        task, transcript: reviewTranscript.trim(), createdAt: Date.now()
      };
      persistSavedPractices([item, ...savedPractices.filter(saved => saved.id !== id)].slice(0, 10));
      setActiveSavedPracticeId(id);
      toast.success('Practice saved on this device. Open it here when you are online.');
    } catch {
      setError('Could not save this recording on this device. Please keep this page open and try again.');
    }
  };

  const openSavedPractice = async (item: SavedPractice) => {
    const blob = await audioStorage.getAudio(item.id);
    if (!blob) {
      setError('This saved recording is no longer available on this device.');
      return;
    }
    setSelectedPart(item.part);
    setCurrentFullPart(item.fullPart);
    setTask(item.task);
    setIsOfflineMode(!navigator.onLine);
    setReviewTranscript(item.transcript);
    setActiveSavedPracticeId(item.id);
    loadRecording(blob, item.transcript);
    setFeedback(null);
    setError(null);
    setView('review');
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
      audio.src = '';
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  useEffect(() => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setIsPlaying(false);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, [audioBlob]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    // Deliberately not keyed on `transcript`. It changes on every recognised word,
    // and scrolling the history on each one fought the user while they spoke.
  }, [messages]);

  // The question being answered is the last thing the examiner said. It is pinned
  // above the scroller rather than living inside it, so the answer box and the
  // earlier turns can never push it out of view.
  const lastExaminerIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i].role === 'ai') return i;
    }
    return -1;
  })();
  const currentQuestion = lastExaminerIdx >= 0 ? messages[lastExaminerIdx].text : '';
  const earlierMessages = lastExaminerIdx >= 0 ? messages.slice(0, lastExaminerIdx) : messages;

  const handleSelectPartDupe = (part: 1 | 2 | 3 | 'Full') => {
    handleSelectPartWithLimit(part);
  };

  const startTask = async () => {
    const player = unlockedAudioRef.current || new Audio();
    unlockedAudioRef.current = player;
    primeExaminerAudio(player);
    if (!(await checkMicrophone())) return;
    // Prime the audio engine on initial user interaction to avoid autoplay restrictions
    // This is a common pattern to unlock audio playback after async operations
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('');
        utterance.volume = 0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn("Failed to prime audio engine:", e);
    }

    setIsGenerating(true);
    const sessionToken = ++practiceSessionRef.current;
    reset();
    setFeedback(null);
    setPreviousAttempt(null);
    setActiveSavedPracticeId(null);
    setReviewTranscript('');
    setAnswerDraft(null);
    setError(null);
    setMessages([]);
    const partToGen = selectedPart === 'Full' ? currentFullPart : selectedPart!;
    const themes = [
      "Digital Citizenship", "Zero-Waste Lifestyle", "Youth Entrepreneurship", 
      "Traditional Malaysian Games", "Cyber-Safety for Students", "Volunteerism", 
      "The Future of Work", "Local Ecotourism", "Mental Health Awareness",
      "Sustainable Fashion", "Smart Living", "Cultural Heritage Preservation",
      "Public Transport Innovations", "E-sports and Education", "Healthy Eating Habits",
      "Social Media Influence", "Animal Welfare", "Space Exploration and Youth",
      "Modern Learning Methods", "Community Gardening", "Money Skills for Teens"
    ];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];
    const filteredTheme = usedThemes.includes(randomTheme) 
      ? themes.find(t => !usedThemes.includes(t)) || randomTheme 
      : randomTheme;
    
    setUsedThemes(prev => [...prev, filteredTheme].slice(-10));
    const timestampSeed = Date.now() + Math.random();

    try {
      if(selectedPart==='Full')await startPractice('speak',true);else await incrementUsage('speak');
      if (partToGen === 1) {
        const historyKey = `speakez-warmup-v1:${profile.uid}`;
        let history = warmupHistoryRef.current;
        try { history = parseWarmupHistory(localStorage.getItem(historyKey)); } catch {}
        const selection = selectWarmupQuestions(history);
        if (!selection) throw new Error("You've tried all 48 warm-up questions on this device. Well done! Try Part 2 for your next practice.");
        warmupHistoryRef.current = selection.history;
        try { localStorage.setItem(historyKey, JSON.stringify(selection.history)); } catch {}
        const part1Task: SPMSpeakingTask = { part: 1, topic: 'Everyday student life', introduction: WARMUP_INTRO, questions: selection.questions };
        setTask(part1Task);
        const firstQuestion = selection.questions[0];
        const introText = WARMUP_INTRO;
        setCurrentQuestionIdx(0);
        setMessages([{ role: 'ai', text: introText }, { role: 'ai', text: firstQuestion }]);
        setView('task');
        void (async () => {
          await speak(introText);
          if (practiceSessionRef.current === sessionToken) await speak(firstQuestion);
        })();
      } else if (partToGen === 2) {
        let bankTask = source === 'ai' ? null : await getRandomQuestion('Speaking', 2, profile.uid, undefined, isOfflineMode, usedPart2Ids);
        
        let finalIntro = "";
        if (bankTask) {
          const newTask = {
            ...bankTask,
            part: 2,
            dbId: bankTask.id
          } as any;
          setTask(newTask);
          if (bankTask.id) setUsedPart2Ids(prev => [...prev, bankTask.id].slice(-20));
          finalIntro = newTask.introduction;
        } else {
          const generatedTask = await generateSPMSpeakingTask(2, `${filteredTheme} - ${timestampSeed}`, usedThemes);
          setTask(generatedTask);
          if (generatedTask.fallback) toast('AI questions are unavailable. Using sample practice questions.');
          else await saveQuestionToBank('Speaking', 2, generatedTask, profile.uid);
          finalIntro = generatedTask.introduction;
        }

        const introText = finalIntro || "In this part of the test, I’m going to give you a topic and I’d like you to talk about it on your own for about one minute. Please look at your task card.";
        setMessages([{ role: 'ai', text: introText }]);
        const prepSeconds = difficulty === 'expert' ? 10 : 20;
        setPrepTimer(prepSeconds);
        setView('preparation');
        void speak(introText).then(() => {
          if (practiceSessionRef.current === sessionToken) startPrepTimer(prepSeconds);
        });
      } else if (partToGen === 3) {
        let bankTask = source === 'ai' ? null : await getRandomQuestion('Speaking', 3, profile.uid, undefined, isOfflineMode, usedPart3Ids);
        
        let finalIntro = "";
        if (bankTask) {
          const newTask = {
            ...bankTask,
            part: 3,
            dbId: bankTask.id
          } as any;
          setTask(newTask);
          if (bankTask.id) setUsedPart3Ids(prev => [...prev, bankTask.id].slice(-20));
          finalIntro = newTask.introduction;
        } else {
          const generatedTask = await generateSPMSpeakingTask(3, `${filteredTheme} - ${timestampSeed}`, usedThemes);
          setTask(generatedTask);
          if (generatedTask.fallback) toast('AI questions are unavailable. Using sample practice questions.');
          else await saveQuestionToBank('Speaking', 3, generatedTask, profile.uid);
          finalIntro = generatedTask.introduction;
        }

        setPart3Step(1);
        const introText = finalIntro || "Now I’d like you to talk about something for about three minutes. You have 20 seconds to think about your ideas.";
        setMessages([{ role: 'ai', text: introText }]);
        const prepSeconds = difficulty === 'expert' ? 10 : 20;
        setPrepTimer(prepSeconds);
        setView('preparation');
        void speak(introText).then(() => {
          if (practiceSessionRef.current === sessionToken) startPrepTimer(prepSeconds);
        });
      } else {
        const generatedTask = await generateSPMSpeakingTask(partToGen);
        setTask(generatedTask);
        setView('task');
      }


    } catch (err: any) {
      console.error('Generation error:', err);
      const msg = err?.message || '';
      if (msg.includes('Quota Exceeded') || msg.includes('429') || msg.includes('quota') || msg.includes('upgrading the system') || msg.includes('RESOURCE_EXHAUSTED')) {
        setError('We are in the process of upgrading the system. Please try again in the next few hours. Sorry for the difficulty.');
      } else if (msg.includes('invalid response format') || msg.includes('could not be understood')) {
        setError('The AI returned an invalid response format. Please try generating again.');
      } else if (msg.includes('free practices') || msg.includes('paid plans')) {setError(msg);
      } else if (msg.startsWith("You've tried all 48")) {
        setError(msg);
      } else {
        setError('Failed to generate speaking task. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextQuestion = async () => {
    if (selectedPart !== 1 && currentFullPart !== 1) return;
    if (nextQuestionBusyRef.current) return;
    const confirmedAnswer = (answerDraft ?? transcript).trim();
    if (!confirmedAnswer) {
      setError("We couldn't hear an answer. Please speak before moving to the next question.");
      return;
    }
    setError(null);

    const defaultQuestions = ["Tell me about your school.", "What do you like to do in your free time?", "Do you have any hobbies?", "What are your future plans?"];
    let questions = task?.questions || [];
    if (questions.length < 4) {
      questions = [...questions, ...defaultQuestions.slice(questions.length, 4)];
    }
    nextQuestionBusyRef.current = true;
    const userMessage = confirmedAnswer;
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    clearTranscript();
    setAnswerDraft(null);
    cancelExaminerSpeech();
    
    // AI "thinking" simulation
    setIsAiThinking(true);
    
    // Award points for participating
    if (userMessage.length > 5 && userMessage !== '(No response captured)') {
      try {
        await updateProfile(profile.uid, { points: increment(2) as any });
      } catch(e) {}
    }

    try {
      // Move to next primary question
      const nextIdx = currentQuestionIdx + 1;
      
      if (nextIdx < questions.length) {
        const nextQuestion = questions[nextIdx];
        setMessages(prev => [...prev, { role: 'ai', text: nextQuestion }]);
        setCurrentQuestionIdx(nextIdx);
        setIsAiThinking(false);
        await speak(nextQuestion);
      } else {
        setIsAiThinking(false);
        stopRecordingSession();
      }
    } catch (err) {
      console.error("Error asking next question:", err);
      setIsAiThinking(false);
      stopRecordingSession();
    } finally {
      nextQuestionBusyRef.current = false;
    }
  };

  const startPrepTimer = (seconds: number) => {
    setPrepTimer(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPrepTimer(prev => Math.max(0, prev - 1));
    }, 1000);
  };

  const startingPhaseRef = useRef(false);
  useEffect(() => {
    if (view === 'preparation' && prepTimer === 0 && !startingPhaseRef.current) {
      startingPhaseRef.current = true;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      const sessionToken = practiceSessionRef.current;
      let startText = '';
      if (selectedPart === 2 || (selectedPart === 'Full' && currentFullPart === 2)) {
        startText = "All right. You may start now.";
      } else if (selectedPart === 3 || (selectedPart === 'Full' && currentFullPart === 3)) {
        startText = "Now, talk about the aspects one by one.";
      }
      if (startText) setMessages(m => [...m, { role: 'ai', text: startText }]);
      void (async () => {
        if (startText) await speak(startText);
        if (practiceSessionRef.current !== sessionToken) return;
        setView('recording');
        await startRecordingSession();
        startingPhaseRef.current = false;
      })();
    }
  }, [prepTimer, view]);

  const startRecordingSession = async () => {
    if (profile.micEnabled === false) {
      toast.error("Microphone is disabled in your Profile Settings.");
      return;
    }
    const success = await startRecording(sensitivity, !isOfflineMode);
    if (success) {
      if (selectedPart !== 1 && (selectedPart !== 'Full' || currentFullPart !== 1)) {
        setView('recording');
      }
      setRecordingTimer(0);
    } else {
      // Error is already handled by the useEffect watching recordingError
      console.warn("Recording failed to start");
    }
  };

  useEffect(() => {
    if (!isRecording || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setRecordingTimer(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (!isRecording || isPaused) return;

    const isPart2 = selectedPart === 2 || (selectedPart === 'Full' && currentFullPart === 2);
    const isPart3 = selectedPart === 3 || (selectedPart === 'Full' && currentFullPart === 3);

    if (isPart2 && recordingTimer === 60) {
      stopRecordingSession();
    }

    if (isPart3 && recordingTimer === 60) {
      if (part3Step === 1) {
        setRecordingTimer(0);
        handlePart3Transition(2);
      } else if (part3Step === 2) {
        setRecordingTimer(0);
        handlePart3Transition(3);
      } else {
        stopRecordingSession();
      }
    }
  }, [recordingTimer, isRecording, isPaused, selectedPart, currentFullPart, part3Step]);

  const handlePart3Transition = (nextStep: 2 | 3) => {
    if (!task?.discussion) return;
    
    if (nextStep === 2) {
      const text = `Thank you. Let me stop you there. Now, for the second part. ${task.discussion.decisionQuestion}`;
      setMessages(m => [...m, { role: 'ai', text: "Thank you. Let me stop you there." }, { role: 'ai', text: task.discussion!.decisionQuestion }]);
      speak(text);
      setPart3Step(2);
    } else if (nextStep === 3) {
       const text = `Thank you. Now, I'd like to ask you a further question. ${task.discussion.hotQuestion}`;
       setMessages(m => [...m, { role: 'ai', text: "Thank you." }, { role: 'ai', text: task.discussion!.hotQuestion }]);
       speak(text);
       setPart3Step(3);
    }
  };

  const handleManualSubmit = () => {
    const isPart3 = selectedPart === 3 || (selectedPart === 'Full' && currentFullPart === 3);
    if (isPart3) {
      if (part3Step === 1) {
        setRecordingTimer(0);
        handlePart3Transition(2);
      } else if (part3Step === 2) {
        setRecordingTimer(0);
        handlePart3Transition(3);
      } else {
        stopRecordingSession();
      }
    } else {
      stopRecordingSession();
    }
  };

  const stopRecordingSession = () => {
    stopRecording();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    const isPart1 = selectedPart === 1 || (selectedPart === 'Full' && currentFullPart === 1);
    if (!isRecording && !isTranscribing && audioBlob && (view === 'recording' || (isPart1 && view === 'task'))) {
      const capturedText = isPart1
        ? messages.filter(message => message.role === 'user').map(message => message.text).join('\n').trim()
        : transcript.trim();
      setReviewTranscript(capturedText);
      setView('review');
    }
  }, [isRecording, isTranscribing, audioBlob, transcript]);

  const draftOwner = useRef(profile.uid);
  useEffect(() => {
    if (draftOwner.current !== profile.uid) {
      draftOwner.current = profile.uid; stopRecording(); reset(); setFeedback(null); setMessages([]);
      setReviewTranscript(progress.attempt?.draft?.transcript || ''); setTask(progress.attempt?.draft?.task || null);
      setSelectedPart(progress.attempt?.draft?.selectedPart || null); setCurrentFullPart(progress.attempt?.draft?.currentFullPart || 1);
      setView(progress.attempt?.draft?.task ? 'review' : 'selection');
    }
  }, [profile.uid]);
  usePracticeDraft(progress, draftOwner.current === profile.uid ? { task, transcript: reviewTranscript, selectedPart, currentFullPart } : progress.attempt?.draft);
  const finishPractice = async (analysis?: any, answer = reviewTranscript.trim() || analysis?.transcript || '') => {
    if (!task || answer.replace(/[^a-zA-Z]/g, '').length < 10) { setError('Add your spoken answer before finishing. No score has been assigned.'); return false; }
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
    if (messages.filter(m => m.role === 'ai').some(m => normalize(m.text).length > 12 && normalize(m.text).includes(normalize(answer)))) { setError('The recording captured the examiner, not your answer.'); return false; }
    return progress.complete({ transcript: answer, duration: Math.round(duration), score: analysis?.score ?? null, metrics: analysis?.metrics, feedback: analysis?.feedback || '' });
  };

  const assessmentInFlight = useRef(false);
  const handleAnalyze = async () => {
    if (assessmentInFlight.current) return;
    if ((profile.plan || 'free') === 'free') {window.dispatchEvent(new CustomEvent('ez-general-feedback',{detail:{skill:'speak'}}));return;}
    if (isOfflineMode || !isOnline) {
      setError('Feedback needs an internet connection. Save this practice on your device and return when you are online.');
      return;
    }
    if (!audioBlob) return;
    setError(null);
    try {
      const finalTranscript = reviewTranscript.trim();

      // Robust check for empty or non-English responses
      const meaningfulLength = finalTranscript.replace(/[^a-zA-Z]/g, '').length;
      if (!finalTranscript || meaningfulLength < 10) {
        setError('Add what you said to the transcript, or record your answer again. No score has been assigned.');
        return;
      }
      
      const normalizeSpeech = (value: string) => value.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
      const normalizedAnswer = normalizeSpeech(finalTranscript);
      const examinerOnly = messages
        .filter(message => message.role === 'ai')
        .map(message => normalizeSpeech(message.text))
        .some(prompt => prompt.length > 12 && (prompt.includes(normalizedAnswer) || normalizedAnswer === prompt));
      if (examinerOnly) {
        setError('The microphone captured the examiner instead of your answer. Please try the recording again.');
        return;
      }

      const plan = profile.plan || 'free';
      const isFree = plan === 'free';
      const freeCount = parseInt(localStorage.getItem('ez_free_feedback_count') || '0', 10);
      if (isFree && freeCount >= 3 && analysisType === 'basic') {
        setError('Your free AI feedback allowance has been used. You can keep practising, but a score requires more feedback access.');
        return;
      }

      const creditCost = isFree && analysisType === 'deep' ? CREDIT_COSTS.speak.deep : 0;
      if (creditCost > 0 && (profile.credits || 0) < creditCost) {
        setError('There are not enough credits for deep feedback. Your answer was not scored.');
        return;
      }

      if (progress.attempt && !progress.attempt.acceptsAnswer(finalTranscript)) {
        setError('Sync the previous answer first before requesting feedback on an edited answer.'); return;
      }
      assessmentInFlight.current = true;
      const completed = await finishPractice(undefined, finalTranscript);
      if (!completed && progress.attempt?.status !== 'not-synced') return;
      if (auth.currentUser?.uid !== profile.uid) return;
      setFeedback(null);
      setError(null);
      setView('feedback');
      setIsAnalyzing(true);
      const analysis = await analyzeSPMSpeaking(
        selectedPart === 'Full' ? currentFullPart : selectedPart as number,
        task!,
        finalTranscript,
        { useDeepFeedback: analysisType === 'deep', aiEngine: profile.aiEngine }
      );
      if (auth.currentUser?.uid !== profile.uid) return;
      analysis.isDeep = analysisType === 'deep';

      // Charge only after feedback has been produced; failed model requests remain free.
      if (creditCost > 0) {
        await updateProfile(profile.uid, { credits: increment(-creditCost) as any });
      }
      if (isFree) {
        localStorage.setItem('ez_free_feedback_count', (freeCount + 1).toString());
      }

      setFeedback(analysis);
      const synced = await finishPractice(analysis, finalTranscript);
      if (!synced) setError('Feedback is ready but not synced. Retry sync to save it without another AI call.');
      if (activeSavedPracticeId && synced) {
        // Optional device cleanup must not invalidate an acknowledged cloud result.
        try {
          persistSavedPractices(savedPractices.filter(item => item.id !== activeSavedPracticeId));
          setActiveSavedPracticeId(null);
          void audioStorage.deleteAudio(activeSavedPracticeId).catch(() => {});
        } catch { /* Keep the device copy if browser storage is unavailable. */ }
      }
      setShowSuccess(synced && progress.attempt?.status !== 'draft');
      setTimeout(() => setShowSuccess(false), 2000);

      // Track completion for rotation
      if ((task as any)?.dbId) {
        await markQuestionAsCompleted(profile.uid, (task as any).dbId, analysis.score);
      }
      
      // Completion rewards are applied once, atomically with the session.

    } catch (err: any) {
      console.warn('Analysis notice:', err?.message || err);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      assessmentInFlight.current = false;
      setIsAnalyzing(false);
    }
  };

  const handlePlayToggle = () => {
    if (!audioBlob) return;
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src || audio.src === '') {
      audioUrlRef.current = URL.createObjectURL(audioBlob);
      audio.src = audioUrlRef.current;
    }
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error("Recording play blocked:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleSave = async () => {
    // Device recording storage cannot block cloud text/result persistence.
    await finishPractice(feedback);
  };

  const resetToSelection = () => {
    if (progress.attempt?.newAttempt() === false) { setError('Retry syncing this completion before starting another task.'); return; }
    practiceSessionRef.current += 1;
    startingPhaseRef.current = false;
    cancelExaminerSpeech();
    stopRecording();
    setView('selection');
    setSelectedPart(null);
    setCurrentFullPart(1);
    setCurrentQuestionIdx(0);
    setTask(null);
    setFeedback(null);
    setReviewTranscript('');
    setAnswerDraft(null);
    setActiveSavedPracticeId(null);
    setError(null);
    reset();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleRetry = () => {
    if (progress.attempt?.newAttempt() === false) { setError('Retry syncing this completion before starting another attempt.'); return; }
    if (feedback && typeof feedback.score === 'number') {
      setPreviousAttempt({ score: feedback.score, transcript: reviewTranscript });
    }
    const sessionToken = ++practiceSessionRef.current;
    startingPhaseRef.current = false;
    cancelExaminerSpeech();
    stopRecording();
    setFeedback(null);
    setReviewTranscript('');
    setAnswerDraft(null);
    setError(null);
    reset();
    setMessages([]);
    
    const partToGen = selectedPart === 'Full' ? currentFullPart : selectedPart!;
    
    if (partToGen === 1) {
      void startTask();
    } else if (partToGen === 2) {
      const introText = "Let's try this topic again. You have 20 seconds to prepare.";
      setMessages([{ role: 'ai', text: introText }]);
      setPrepTimer(20);
      setView('preparation');
      void speak(introText).then(() => {
        if (practiceSessionRef.current === sessionToken) startPrepTimer(20);
      });
    } else if (partToGen === 3) {
      setPart3Step(1);
      const introText = "Let's restart Part 3. You have 20 seconds to think about your ideas.";
      setMessages([{ role: 'ai', text: introText }]);
      setPrepTimer(20);
      setView('preparation');
      void speak(introText).then(() => {
        if (practiceSessionRef.current === sessionToken) startPrepTimer(20);
      });
    } else {
      setView('task');
    }
    
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 min-h-screen relative">
      <SuccessFeedback show={showSuccess} onComplete={() => setShowSuccess(false)} />
      <PaywallModal 
        isOpen={showPaywall}
        freeDailyLimit={(profile?.plan || 'free') === 'free'} dailyPracticeLimit={isLimitReached('speak')} 
        onClose={() => setShowPaywall(false)} 
        skill="speak"
        onUpgrade={() => { navigate('/app/pricing'); setShowPaywall(false); }}
        onUseCredits={executeUseCredits}
      />
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          >
            <div 
              className="w-full max-w-md bg-obsidian border border-white/10 rounded-[2.5rem] p-4 sm:p-8 space-y-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-black italic text-white flex items-center gap-3">
                  <Sparkles className="text-primary" /> Practice Settings
                </h2>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest italic">Customize your exam environment</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/40 italic">Examiner Voice</label>
                  <label className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 p-4 cursor-pointer">
                    <span>
                      <span className="block text-sm font-bold text-white">Natural examiner voice</span>
                      <span className="block text-xs text-white/60 mt-1">AI-generated audio, saved on this device and reused. Part 1 stays text-only if natural audio is unavailable. Turn this off only if you prefer the device voice.</span>
                    </span>
                    <input type="checkbox" checked={naturalVoiceEnabled} onChange={event => setNaturalVoiceEnabled(event.target.checked)} className="size-5 shrink-0 accent-primary" aria-label="Use natural examiner voice" />
                  </label>
                  <p className="text-xs text-white/60">Teacher recordings will play first when they are added later.</p>
                  <select
                    value={voices.some(voice => voice.name === selectedVoiceName) ? selectedVoiceName || '' : ''}
                    onChange={event => {
                      const name = event.target.value || null;
                      setSelectedVoiceName(name);
                      if (name) localStorage.setItem('preferred_voice', name);
                      else localStorage.removeItem('preferred_voice');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-primary"
                  >
                    <option value="">Recommended voice for this device</option>
                    {voices.filter(voice => voice.lang.toLowerCase().startsWith('en')).map(voice => (
                      <option key={`${voice.name}-${voice.lang}`} value={voice.name}>
                        {voice.name} ({voice.lang}){voice.localService ? ' · on device' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void speak('Hello. I am your examiner today. Take a breath, and answer in your own words.')}
                    className="w-full rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/20"
                  >
                    Preview examiner voice
                  </button>
                  <p className="text-[10px] text-white/40">Device voice is available when Natural examiner voice is turned off. It may sound less natural.</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] uppercase font-black tracking-widest text-white/20 italic">Exam Difficulty</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['normal', 'expert'] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          difficulty === d 
                          ? 'bg-primary border-primary text-obsidian shadow-lg shadow-primary/20' 
                          : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-4 rounded-2xl bg-white text-obsidian font-black uppercase tracking-widest text-xs hover:bg-primary transition-all active:scale-95 shadow-xl"
              >
                Done
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3"
          >
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="text-sm font-bold text-red-200">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-[10px] uppercase font-black tracking-widest text-red-500/60 hover:text-red-500 mt-2 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(view === 'preparation' || view === 'task' || view === 'recording') && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-8 right-8 z-50"
          >
            <button 
              onClick={resetToSelection}
              className="p-3 bg-white/5 border border-white/10 rounded-full text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center gap-2"
              title="Exit Session"
            >
              <Trash2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest mr-2">Exit</span>
            </button>
          </motion.div>
        )}

        {view === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6 sm:space-y-10"
          >
            <header className="text-center space-y-3 relative">
              <div className="flex items-center justify-center sm:justify-end gap-2 sm:absolute sm:top-0 sm:right-0">
                <button 
                  onClick={() => navigate('/app/evaluator')}
                  className="min-h-11 px-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-200 hover:bg-indigo-500/20 transition-colors text-sm font-semibold flex items-center gap-2"
                  title="Evaluator"
                >
                  <Terminal size={14} /> Evaluator
                </button>
                <button 
                  onClick={() => setShowSettings(true)}
                  aria-label="Voice and practice settings"
                  className="min-h-11 min-w-11 p-3 bg-white/5 border border-white/10 rounded-full text-white/80 hover:text-primary transition-colors group"
                  title="Settings"
                >
                  <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                </button>
              </div>
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary font-black text-[10px] uppercase tracking-widest border border-primary/20">
                <Mic size={14} /> SPM English 1119/3
              </div>
              <h1 className="text-2xl sm:text-4xl sm:text-6xl font-black tracking-tight text-white">SpeakEZ</h1>
              <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">Choose a part, answer aloud, and see what to improve next.</p>
              <p className="text-white/45 text-xs max-w-xl mx-auto">Examiner voice may be AI-generated. You can change it in Practice Settings.</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[
                { id: 1 as const, title: 'Part 1: Interview', icon: MessageCircle, desc: 'A friendly warm-up about your school day, food, friends and hobbies.' },
                { id: 2 as const, title: 'Part 2: Long Turn', icon: User, desc: 'Speak for 1 minute based on a prompt card.' },
                { id: 3 as const, title: 'Part 3: Discussion', icon: Users, desc: 'Decision-making task with a complex situation.' },
                { id: 'Full' as const, title: 'Full Mock Test', icon: PlayCircle, desc: 'The complete Part 1-3 examiner experience.' }
              ].map((part) => (
                <button
                  key={part.title}
                  onClick={() => handleSelectPartWithLimit(part.id as 1 | 2 | 3 | 'Full')}
                  className="group relative min-h-36 bg-white/5 border border-white/15 p-5 sm:p-6 rounded-2xl hover:bg-primary/5 hover:border-primary/50 transition-all text-left space-y-3 overflow-hidden active:scale-[0.98]"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                    <part.icon size={80} className="md:size-[120px]" />
                  </div>
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white group-hover:bg-primary group-hover:text-obsidian transition-colors">
                    <part.icon size={24} className="md:size-[28px]" />
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-black italic text-white group-hover:text-primary transition-colors">{part.title}</h3>
                    <p className="text-white/65 text-sm font-medium mt-2 leading-relaxed">{part.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            {savedPractices.length > 0 && (
              <section className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-6" aria-label="Saved practice recordings">
                <h2 className="text-lg font-bold text-white mb-1">Continue a saved practice</h2>
                <p className="text-sm text-white/60 mb-4">These recordings stay on this device. Open one to review it or request feedback when online.</p>
                <div className="space-y-2">
                  {savedPractices.map(item => (
                    <button key={item.id} onClick={() => void openSavedPractice(item)} className="w-full min-h-12 rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-left text-sm text-white hover:border-primary/60 flex items-center justify-between gap-3">
                      <span>Part {item.part === 'Full' ? item.fullPart : item.part}: {item.task.topic || 'Speaking practice'}</span>
                      <span className="text-primary shrink-0">Open</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {view === 'intro' && (
          <motion.div 
            key="intro"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="max-w-2xl mx-auto p-5 sm:p-8 md:p-10 glass-card space-y-6 text-center"
          >
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="w-16 h-16 md:w-20 md:h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary"
            >
              <Mic size={32} className="md:size-[40px]" />
            </motion.div>
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tight">Ready for {selectedPart === 'Full' ? 'Full Test' : `Part ${selectedPart}`}?</h2>
              <p className="text-white/70 text-base leading-relaxed">
                {selectedPart === 1 || selectedPart === 'Full' ? 'Take a breath. These are four easy questions about everyday student life. Short, natural answers are welcome. You can review your recording before feedback.' : 'Check your microphone, listen to the question, then answer in your own words. You can review your recording before feedback.'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5 text-left space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-base font-bold text-white">Microphone check</p>
                  <p className="text-sm text-white/60">Your browser will ask for access if needed.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void checkMicrophone()}
                  disabled={micStatus === 'checking'}
                  className="min-h-12 rounded-xl bg-white/10 border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                >
                  {micStatus === 'checking' ? 'Checking...' : micStatus === 'ready' ? 'Check again' : 'Test microphone'}
                </button>
              </div>
              <p role="status" className={`text-sm ${micStatus === 'ready' ? 'text-green-300' : micStatus === 'blocked' ? 'text-red-300' : 'text-white/60'}`}>
                {micStatus === 'ready' ? 'Microphone is ready.' : micStatus === 'blocked' ? 'Microphone needs attention.' : 'You can also check it when you start.'}
              </p>
              <p className="text-sm text-white/60">On some browsers, transcription needs internet. Your voice can still be recorded if transcription is unavailable.</p>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvancedOptions(value => !value)}
              aria-expanded={showAdvancedOptions}
              className="w-full min-h-12 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-semibold text-white/80 hover:bg-white/10"
            >
              {showAdvancedOptions ? 'Hide more options' : 'More options: difficulty, feedback and question source'}
            </button>
            {showAdvancedOptions && <div className="space-y-4 text-left">

            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-white/60 font-black uppercase text-[10px] md:text-[10px] tracking-widest italic">
                  <Sparkles size={12} className="text-primary" /> Mic Sensitivity
                </div>
                <span className="text-primary font-black italic text-xs md:text-sm">{Math.round(sensitivity * 100)}%</span>
              </div>
              <input 
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                className="w-full h-1 md:h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] md:text-[10px] font-bold text-white/20 uppercase tracking-tighter">
                <span>Lower (Quiet Env)</span>
                <span>Normal</span>
                <span>Higher (Noisy)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-3xl p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <AlertCircle size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Challenge Level</p>
                  <p className="text-xs font-bold text-white capitalize">{difficulty} Mode</p>
                </div>
              </div>
              <div className="flex bg-black/20 p-1 rounded-xl">
                {(['normal', 'expert'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${difficulty === d ? 'bg-primary text-obsidian shadow-lg shadow-primary/20 scale-105' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-3xl p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Play size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Connection Mode</p>
                  <p className="text-xs font-bold text-white capitalize">{isOfflineMode ? 'Practice Offline' : 'Online Practice'}</p>
                </div>
              </div>
              <div className="flex bg-black/20 p-1 rounded-xl">
                {([false, true] as const).map(off => (
                  <button
                    key={off ? 'off' : 'on'}
                    onClick={() => {
                      setIsOfflineMode(off);
                      if (off) setSource('bank');
                    }}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isOfflineMode === off ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 scale-105' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {off ? 'Offline' : 'Online'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-3xl p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">AI Evaluation Level</p>
                  <p className="text-xs font-bold text-white capitalize">{analysisType} Mode</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex bg-black/20 p-1 rounded-xl">
                  {(['basic', 'deep'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => {
                        if (a === 'deep' && profile.plan === 'free') {
                          setPendingAction(() => () => setAnalysisType('deep'));
                          setShowPaywall(true);
                          return;
                        }
                        setAnalysisType(a);
                      }}
                      className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${analysisType === a ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-105' : 'text-white/40 hover:text-white/60'}`}
                    >
                      {a === 'deep' && profile.plan === 'free' && <Key size={10} className="inline mr-1 mb-0.5" />}
                      {a}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-white/30 font-medium px-2 italic">
                  {analysisType === 'basic' 
                    ? "Standard SPM speaking practice feedback." 
                    : "Detailed speaking feedback (2 credits for free users)."}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center bg-white/5 border border-white/10 rounded-3xl p-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <BookOpen size={16} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Question Source</p>
                  <p className="text-xs font-bold text-white capitalize">{selectedPart === 1 || selectedPart === 'Full' ? 'Everyday warm-up bank · No AI generation' : source === 'ai' ? 'AI Generated' : 'Question Bank'}</p>
                </div>
              </div>
              <div className="flex bg-black/20 p-1 rounded-xl">
                {(['ai', 'bank'] as const).map(s => (
                  <button
                    key={s}
                    disabled={(isOfflineMode || selectedPart === 1 || selectedPart === 'Full') && s === 'ai'}
                    onClick={() => setSource(s)}
                    className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${source === s ? 'bg-primary text-obsidian shadow-lg shadow-primary/20 scale-105' : (isOfflineMode && s === 'ai') ? 'text-white/10 cursor-not-allowed' : 'text-white/40 hover:text-white/60'}`}
                  >
                    {s === 'ai' ? 'AI Gen' : 'Bank'}
                  </button>
                ))}
              </div>
            </div>

            </div>}

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button 
                onClick={resetToSelection}
                className="flex-1 min-h-12 px-6 rounded-2xl bg-white/5 border border-white/10 font-semibold text-sm text-white/80 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={16} /> Go Back
              </button>
              <button 
                onClick={startTask}
                disabled={isGenerating}
                className="flex-[2] min-h-14 px-6 rounded-2xl bg-primary text-obsidian font-bold text-base shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                {isGenerating ? 'Preparing...' : 'Start practice'}
              </button>
            </div>
          </motion.div>
        )}

        {view === 'preparation' && (
          <motion.div 
            key="preparation"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto px-2"
          >
            <div className="p-6 md:p-10 bg-black/40 border border-white/10 rounded-[2.5rem] space-y-6 md:space-y-8 backdrop-blur-xl">
              <div className="flex justify-between items-center pb-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                    <Clock size={16} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Preparation Phase</span>
                </div>
                <span className="inline-flex items-center gap-2 text-xl md:text-2xl font-black italic text-white bg-white/5 px-5 py-2 rounded-2xl shadow-inner">
                  {formatTime(prepTimer)}
                </span>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/20 italic">Topic Situation</p>
                  <h3 className="text-xl md:text-2xl font-black italic text-white leading-tight">{task?.promptCard?.topic || task?.topic}</h3>
                </div>

                {task?.promptCard && (
                  <div className="grid grid-cols-1 gap-3">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/20 italic">Discussion Points</p>
                    {(task?.promptCard?.prompts || []).map((p, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="flex items-center gap-4 p-4 md:p-5 bg-white/5 rounded-[1.5rem] border border-white/5 text-white/80 font-bold italic text-sm md:text-base group hover:bg-white/10 transition-all"
                      >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs shrink-0 group-hover:bg-primary group-hover:text-obsidian transition-colors">{i+1}</div>
                        {p}
                      </motion.div>
                    ))}
                    
                    {task.promptCard.prepTip && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-start gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                          <BookOpen size={16} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase font-black tracking-widest text-primary italic">Bonus Prep Tip</p>
                          <p className="text-xs md:text-sm font-bold text-white/90 italic italic">{task.promptCard.prepTip}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
                {task?.discussion && (
                  <div className="space-y-6 flex flex-col items-center">
                    <div className="w-full bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 rounded-2xl md:rounded-[2rem] p-4 md:p-8 text-center shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)] relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--primary-rgb),0.2)_0%,transparent_70%)] opacity-50" />
                      <p className="text-[10px] md:text-[10px] uppercase font-black text-primary tracking-[0.4em] mb-1 md:mb-2 relative z-10">Central Topic</p>
                      <h5 className="text-sm md:text-xl font-black text-white italic leading-tight tracking-tight relative z-10">
                        {task.discussion.situation}
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4 w-full">
                      {(task?.discussion?.points || []).map((p, i) => (
                        <div key={i} className="flex flex-col items-center justify-center p-3 md:p-6 bg-white/5 border border-white/10 rounded-xl md:rounded-3xl text-center text-[10px] md:text-sm font-bold text-white/80 group hover:bg-white/10 hover:border-white/20 transition-all cursor-default relative overflow-hidden shadow-sm">
                          <span className="text-primary/40 mb-1 md:mb-2 font-display text-base md:text-lg opacity-50 absolute top-1 left-2 md:top-2 md:left-3">0{i+1}</span>
                          <span className="group-hover:opacity-0 transition-opacity z-10 mt-1 md:mt-2">{p}</span>
                          {task.discussion?.guides?.[i] && (
                            <div className="absolute inset-0 bg-primary/10 backdrop-blur-md p-2 md:p-4 flex items-center justify-center text-[10px] md:text-xs text-white font-bold italic translate-y-full group-hover:translate-y-0 transition-transform duration-300 ring-1 ring-primary/30 z-20">
                              <div className="space-y-1 w-full h-full flex flex-col justify-center">
                                <p className="text-[10px] md:text-[10px] uppercase text-primary/60 mb-0.5 md:mb-1">Guiding Tip</p>
                                <span className="drop-shadow-md leading-tight">{task.discussion.guides[i]}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (profile.micEnabled === false) {
                    toast.error("Microphone is disabled in your Profile Settings.");
                    return;
                  }
                  if (prepTimer > 0) {
                    setPrepTimer(0);
                  }
                }}
                className={`w-full py-5 md:py-6 rounded-3xl font-black italic text-lg md:text-xl flex items-center justify-center gap-4 shadow-2xl transition-all ${profile.micEnabled === false ? 'bg-white/10 text-white/40 cursor-not-allowed' : 'bg-primary text-obsidian shadow-primary/20'}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                  <Mic size={24} />
                </div>
                {profile.micEnabled === false ? 'Microphone Disabled' : 'I\'m Ready to Speak'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {view === 'task' && (
          <motion.div 
            key="task"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto space-y-8"
          >
            {/* Part 1 Experience - Conversation Bubbles */}
            {(selectedPart === 1 || (selectedPart === 'Full' && currentFullPart === 1)) && (
              <div className="flex flex-col w-full max-w-3xl mx-auto border border-white/15 rounded-2xl sm:rounded-3xl bg-obsidian-subtle/40 overflow-hidden relative">
                {/* Chat Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary overflow-hidden">
                        <User size={24} />
                      </div>
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-obsidian rounded-full" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-black italic text-white uppercase tracking-tight">
                        {isAiSpeaking ? 'Examiner speaking' : isAiThinking ? 'Next question' : 'Your examiner'}
                      </h3>
                      <p className="text-xs font-medium text-white/60">Part 1 · Friendly warm-up</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isAiSpeaking ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(202,255,0,0.5)]' : 'bg-green-500'} `} />
                      <span className="text-[10px] md:text-[10px] font-black uppercase text-primary italic">
                        {isAiSpeaking ? 'Speaking' : isPaused ? 'Paused' : isRecording ? 'Recording' : 'Ready'}
                      </span>
                    </div>
                    <div className="text-[10px] md:text-xs font-mono font-bold text-white/50">{formatTime(recordingTimer)}</div>
                  </div>
                </div>

                {/* Current question -- pinned, never scrolls away */}
                <div className="shrink-0 px-4 py-4 md:px-6 md:py-5 border-b border-white/10 bg-black/25">
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-primary italic">
                      Question {Math.max(1, currentQuestionIdx + 1)} of {Math.max(task?.questions?.length || 0, 4)}
                    </span>
                    <button
                      type="button"
                      onClick={() => { if (currentQuestion) void speak(currentQuestion); }}
                      disabled={isAiSpeaking || isAiThinking || !currentQuestion}
                      className="min-h-11 px-3 rounded-xl border border-white/15 bg-white/5 text-xs font-semibold text-white/80 flex items-center gap-2 shrink-0 disabled:opacity-40"
                    ><Volume2 size={15} /> Listen again</button>
                  </div>

                  <p className="text-lg md:text-2xl font-semibold leading-snug tracking-tight text-white">
                    {isAiThinking ? 'Preparing your next question…' : currentQuestion}
                  </p>

                  <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(Math.max(0, currentQuestionIdx + 1) / Math.max(task?.questions?.length || 0, 4)) * 100}%` }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(202,255,0,0.5)]"
                    />
                  </div>
                </div>

                {/* Earlier turns, folded away. Open on request only, so the card
                    shows the question, the answer and the controls at once and
                    there is nothing to scroll past to find any of them. */}
                {earlierMessages.length > 0 && (
                  <div className="shrink-0 border-b border-white/10 bg-black/10">
                    <button
                      type="button"
                      onClick={() => setShowEarlier(open => !open)}
                      aria-expanded={showEarlier}
                      className="w-full min-h-11 px-4 md:px-6 flex items-center justify-between gap-3 text-xs font-semibold text-white/55"
                    >
                      <span>Earlier in this conversation ({earlierMessages.length})</span>
                      <ChevronRight size={15} className={showEarlier ? 'rotate-90 transition-transform' : 'transition-transform'} />
                    </button>
                    {showEarlier && (
                      <div className="max-h-44 overflow-y-auto px-4 md:px-6 pb-4 space-y-2.5 custom-scrollbar">
                        {earlierMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              m.role === 'ai'
                              ? 'bg-white/5 border border-white/10 rounded-tl-none text-white/70'
                              : 'bg-primary/15 border border-primary/20 rounded-tr-none text-white/85'
                            }`}>
                              {m.role === 'ai' && (
                                <span className="block text-[10px] uppercase tracking-widest text-primary font-black italic mb-1">Examiner</span>
                              )}
                              {m.text}
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} className="h-px" />
                      </div>
                    )}
                  </div>
                )}

                {/* The answer. Sits between the question and the controls instead of
                    inside a scroller, so it can never push the question off screen. */}
                {isRecording && (
                  <div className="shrink-0 px-4 py-3 md:px-6 md:py-4 bg-primary text-obsidian border-t border-black/10">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <motion.span
                          animate={isPaused ? { scale: 1, opacity: 1 } : { scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                          transition={isPaused ? undefined : { repeat: Infinity, duration: 1.5 }}
                          className={`w-2 h-2 rounded-full ${isPaused ? 'bg-orange-600' : 'bg-red-600'}`}
                        />
                        <label htmlFor="part1-answer-text" className="text-[10px] uppercase tracking-widest font-black text-obsidian/70">
                          {isPaused ? 'Paused · what the app heard' : 'What the app heard'}
                        </label>
                      </div>
                      <div className="flex items-end gap-[2px] h-3" aria-hidden="true">
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={isPaused ? { height: 4 } : { height: [4, 12, 4] }}
                            transition={isPaused ? undefined : { repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: i * 0.1 }}
                            className="w-[3px] bg-obsidian/40 rounded-full"
                          />
                        ))}
                      </div>
                    </div>
                    <textarea
                      id="part1-answer-text"
                      rows={2}
                      value={answerDraft ?? transcript}
                      onChange={event => setAnswerDraft(event.target.value)}
                      placeholder="Your words appear here. If they do not, type your answer."
                      className="w-full min-h-[76px] md:min-h-[92px] rounded-xl bg-black/10 border border-obsidian/20 p-3 text-base leading-relaxed text-obsidian placeholder:text-obsidian/50 focus:outline-none focus:border-obsidian"
                    />
                    {transcriptionError && <p className="mt-2 text-sm text-obsidian/80">{transcriptionError}</p>}
                  </div>
                )}

                {/* Examiner is composing the next question */}
                {isAiThinking && !isRecording && (
                  <div className="shrink-0 px-4 md:px-6 pb-4 flex gap-1" aria-hidden="true">
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  </div>
                )}

                {/* Chat Controls */}
                <div className="shrink-0 p-4 md:px-6 md:py-5 bg-white/5 backdrop-blur-xl border-t border-white/5">
                  <div className="max-w-md mx-auto">
                    {!isRecording ? (
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={startRecordingSession}
                        disabled={isAiSpeaking || isAiThinking}
                        className="w-full flex items-center justify-between p-4 md:p-6 rounded-3xl bg-primary text-obsidian shadow-2xl shadow-primary/20 transition-all font-black disabled:opacity-50 disabled:cursor-wait"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-black/10 flex items-center justify-center">
                            <Mic size={24} />
                          </div>
                          <div className="text-left">
                            <p className="text-[10px] uppercase tracking-widest opacity-60">
                              {isAiSpeaking ? 'Listen to the examiner' : 'Tap to respond'}
                            </p>
                            <p className="text-sm italic uppercase tracking-tighter">
                              {isAiSpeaking ? 'Speaking...' : 'Start Recording'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight size={24} />
                      </motion.button>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className={`flex-1 p-4 rounded-2xl border flex items-center justify-between gap-3 ${isPaused ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-orange-500' : 'bg-red-500 animate-pulse'}`} />
                              <span className={`text-[10px] uppercase font-black tracking-widest italic ${isPaused ? 'text-orange-500' : 'text-red-500'}`}>
                                {isPaused ? 'Paused' : 'Recording...'}
                              </span>
                            </div>
                            <button
                              onClick={isPaused ? resumeRecording : pauseRecording}
                              aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
                              className={`min-h-11 px-3 rounded-xl transition-colors flex items-center gap-2 text-sm font-semibold ${isPaused ? 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30' : 'bg-red-500/20 text-red-200 hover:bg-red-500/30'}`}
                            >
                              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                              <span>{isPaused ? 'Resume' : 'Pause'}</span>
                            </button>
                          </div>
                          
                          <motion.button 
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNextQuestion}
                            disabled={isAiThinking || isAiSpeaking}
                            className={`min-h-12 w-full sm:w-auto px-4 md:px-8 rounded-2xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-colors ${
                              isAiThinking || isAiSpeaking ? 'bg-primary/50 text-obsidian/50 cursor-not-allowed shadow-none' : 'bg-primary text-obsidian shadow-primary/20 hover:scale-105'
                            }`}
                          >
                            {currentQuestionIdx < Math.max(task?.questions?.length || 0, 4) - 1 ? (
                              <>Next question <ChevronRight size={18} /></>
                            ) : (
                              <>Finish & review <Square size={16} fill="currentColor" /></>
                            )}
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'recording' && (
          <motion.div 
            key="recording"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto flex flex-col items-center justify-center space-y-5 sm:space-y-8 min-h-[65vh] px-2 sm:px-4 pb-20"
          >
            <div className="flex flex-col items-center justify-center gap-6 mb-4 md:mb-8">
              <VoicePulse active={!isPaused} />
              <div className="text-center pointer-events-none">
                <h2 className="text-2xl sm:text-4xl sm:text-6xl font-bold tracking-tight text-white tabular-nums leading-none">
                  {formatTime(recordingTimer)}
                </h2>
              </div>
            </div>
            
            <div className="w-full max-w-2xl grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-3">
              <div className={`flex items-center gap-2 px-4 py-2 border rounded-full ${isPaused ? 'bg-orange-500/10 border-orange-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-orange-500' : 'bg-red-500 animate-pulse'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest italic ${isPaused ? 'text-orange-500' : 'text-red-500'}`}>
                  {isPaused ? 'Paused' : 'Recording'}
                </span>
              </div>
              <button
                onClick={isPaused ? resumeRecording : pauseRecording}
                className={`min-h-12 rounded-xl px-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all ${isPaused ? 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play fill="currentColor" size={14} className="ml-0.5" /> : <Pause fill="currentColor" size={14} />}
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const line = messages.filter(message => message.role === 'ai').slice(-1)[0]?.text || task?.topic;
                  if (line) void speak(line);
                }}
                disabled={isAiSpeaking}
                className="min-h-12 rounded-xl bg-white/10 px-4 text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40"
              ><Volume2 size={17} /> Repeat prompt</button>
              <button 
                onClick={handleManualSubmit}
                className="min-h-12 rounded-xl bg-primary text-obsidian px-4 text-sm font-bold hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                {((selectedPart === 3 || (selectedPart === 'Full' && currentFullPart === 3)) && part3Step < 3) ? (
                  <>Next part <ChevronRight size={14} /></>
                ) : (
                  <><Square fill="currentColor" size={12} /> Finish & review</>
                )}
              </button>
            </div>

            <div className="w-full max-w-3xl glass-card p-6 md:p-10 space-y-6 md:space-8 scanline">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-4 md:pb-6 gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Terminal size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-white/80">Your speaking prompt</h4>
                    <p className="text-primary font-semibold text-sm">Part {selectedPart === 'Full' ? currentFullPart : selectedPart}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6 italic">
                {activePart !== 3 && (
                  <p className="text-xl md:text-3xl font-black italic text-white leading-tight uppercase tracking-tighter italic">"{task?.topic || task?.promptCard?.topic}"</p>
                )}
                
                <div>
                  {activePart === 2 && (
                    <div className="grid grid-cols-1 gap-3">
                      {task?.promptCard?.prompts?.map((p, i) => (
                        <div key={i} className="text-sm md:text-base font-bold text-white/60 flex items-center gap-4 bg-white/5 p-4 md:p-5 rounded-2xl border border-white/5 italic">
                          <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-[10px] font-black italic shrink-0">0{i+1}</span>
                          {p}
                        </div>
                      ))}
                    </div>
                  )}

                  {activePart === 3 && task?.discussion && (
                    <div className="w-full flex flex-col items-center justify-center gap-4 md:gap-6">
                      {/* Mind Map / Central Topic - compact in later steps */}
                      <div className={`relative w-full flex flex-col items-center gap-3 transition-all duration-500`}>
                        <div className={`w-full bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl text-center shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)] relative overflow-hidden ${part3Step > 1 ? 'p-3 md:p-4' : 'p-5 md:p-6 border-2 border-primary/30'}`}>
                          <p className={`text-[10px] uppercase font-black text-primary tracking-[0.4em] relative z-10 ${part3Step > 1 ? 'mb-1 opacity-60' : 'mb-2'}`}>Central Topic</p>
                          <h5 className={`${part3Step > 1 ? 'text-sm md:text-base opacity-80' : 'text-lg md:text-xl'} font-black text-white italic leading-tight tracking-tight relative z-10`}>
                            {task.discussion.situation}
                          </h5>
                        </div>
                        
                        {(part3Step === 1 || part3Step === 2) && (
                          <div className={`grid ${part3Step > 1 ? 'grid-cols-3 gap-1.5 md:gap-2 opacity-50' : 'grid-cols-2 md:grid-cols-3 gap-3'} w-full transition-all duration-500`}>
                            {(task.discussion.points || []).map((p, i) => (
                              <div key={i} className={`bg-white/5 border border-white/10 rounded-xl text-center flex items-center justify-center ${part3Step > 1 ? 'p-2' : 'p-3 md:p-4 hover:bg-white/10 hover:border-white/20'}`}>
                                <p className={`${part3Step > 1 ? 'text-[10px] leading-tight' : 'text-xs md:text-sm'} font-bold text-white/80`}>{p}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {part3Step === 2 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="w-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-2 border-blue-500/40 rounded-2xl p-5 md:p-6 text-center shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden"
                        >
                          <p className="text-[10px] uppercase font-black text-blue-400 tracking-[0.4em] mb-2">Decision Question</p>
                          <h5 className="text-lg md:text-2xl font-black text-white italic leading-tight tracking-tight flex items-center justify-center gap-3">
                             <ChevronRight className="text-blue-500 shrink-0" size={24} />
                            {task.discussion.decisionQuestion}
                          </h5>
                        </motion.div>
                      )}

                      {part3Step === 3 && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="w-full bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-2 border-purple-500/40 rounded-2xl p-5 md:p-6 text-center shadow-[0_0_50px_rgba(168,85,247,0.15)] relative overflow-hidden"
                        >
                          <p className="text-[10px] uppercase font-black text-purple-400 tracking-[0.4em] mb-2">Extended Discussion</p>
                          <h5 className="text-lg md:text-2xl font-black text-white italic leading-tight tracking-tight flex items-center justify-center gap-3">
                             <ChevronRight className="text-purple-500 shrink-0" size={24} />
                            {task.discussion.hotQuestion}
                          </h5>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 md:mt-8 p-4 md:p-6 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-semibold text-primary">What the app heard</span>
                  </div>
                  <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                    {transcript || transcriptionError || 'Your words will appear here if live transcription is available.'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'review' && (
          <motion.section
            key="review"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-3xl space-y-5 px-1 pb-24"
            aria-label="Review your speaking practice"
          >
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8 space-y-3">
              <p className="text-sm font-semibold text-primary">Step 2 of 3 · Review</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Review your answer</h2>
              <p className="text-sm sm:text-base text-white/70">Listen to your recording and check what the app heard. Feedback is based on the text you confirm below.</p>
              <button type="button" onClick={handlePlayToggle} className="min-h-12 w-full sm:w-auto rounded-xl bg-white/10 border border-white/20 px-5 text-base font-semibold text-white flex items-center justify-center gap-2 hover:bg-white/20">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                {isPlaying ? 'Pause recording' : 'Play my recording'}
              </button>
            </div>
            <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8 space-y-3">
              <label htmlFor="speakez-review-transcript" className="block text-lg font-bold text-white">What did you say?</label>
              <p className="text-sm text-white/65">Correct any transcription mistakes. If no text appeared, type your spoken answer so the app can assess its language and content.</p>
              {(transcriptionError || !transcriptionAvailable) && <p role="status" className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3 text-sm text-amber-100">{transcriptionError || 'Live transcription was unavailable.'}</p>}
              <textarea
                id="speakez-review-transcript"
                value={reviewTranscript}
                onChange={event => setReviewTranscript(event.target.value)}
                rows={7}
                placeholder="Your spoken answer appears here. You can correct it before feedback."
                className="w-full rounded-xl bg-black/30 border border-white/20 p-4 text-base leading-relaxed text-white placeholder:text-white/35 focus:outline-none focus:border-primary"
              />
              <p className="text-sm text-white/55">A transcript cannot measure pronunciation, accent, or vocal delivery.</p>
            </div>
            <ProgressSaveStatus progress={progress} />
            <button type="button" onClick={() => finishPractice()} disabled={progress.attempt?.status === 'saving'} className="btn-secondary min-h-12 w-full">Finish practice</button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" onClick={handleRetry} className="min-h-13 rounded-xl border border-white/20 bg-white/5 px-5 text-base font-semibold text-white hover:bg-white/10 flex items-center justify-center gap-2"><RefreshCw size={18} /> Try this task again</button>
              <button type="button" onClick={() => void savePracticeForLater()} className="min-h-13 rounded-xl border border-white/20 bg-white/5 px-5 text-base font-semibold text-white hover:bg-white/10 flex items-center justify-center gap-2"><Save size={18} /> Save on this device</button>
            </div>
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={profile.plan !== 'free' && (!isOnline || isOfflineMode || !reviewTranscript.trim() || isAnalyzing)}
              className="min-h-14 w-full rounded-xl bg-primary px-5 text-base font-bold text-obsidian disabled:opacity-45 disabled:cursor-not-allowed"
            >
              {profile.plan === 'free' ? 'View general feedback' : isOnline && !isOfflineMode ? 'Get feedback on my answer' : 'Feedback is available when online'}
            </button>
            {isOnline && isOfflineMode && <button type="button" onClick={() => setIsOfflineMode(false)} className="w-full min-h-12 text-sm font-semibold text-primary underline">I am online now</button>}
            <button type="button" onClick={resetToSelection} className="w-full min-h-12 text-sm font-semibold text-white/70 underline">Back to practice parts</button>
          </motion.section>
        )}

        {view === 'feedback' && (
          <motion.section
            key="feedback"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl space-y-5 px-1 pb-24"
            aria-label="Speaking feedback"
          >
            <ProgressSaveStatus progress={progress} />
            <header className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-8">
              <p className="text-sm font-semibold text-primary">Step 3 of 3 · Improve</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
                {isAnalyzing ? 'Preparing your feedback' : feedback ? 'Your practice feedback' : 'Feedback unavailable'}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-white/70">
                This is a practice estimate based on your confirmed transcript. It does not assess pronunciation or vocal delivery.
              </p>
            </header>

            {isAnalyzing ? (
              <div role="status" className="rounded-3xl border border-white/15 bg-white/5 p-4 sm:p-8 text-center">
                <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={32} />
                <p className="text-base text-white">Checking your language and content...</p>
              </div>
            ) : error || !feedback ? (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-8 space-y-4">
                <h3 className="text-xl font-bold text-white">Your answer has not been scored</h3>
                <p className="text-base text-white/80">{error || 'Feedback could not be completed.'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setError(null); setView('review'); }} className="min-h-12 rounded-xl bg-primary px-4 font-semibold text-obsidian">Review answer</button>
                  <button type="button" onClick={() => void savePracticeForLater()} className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-4 font-semibold text-white">Save on this device</button>
                  <button type="button" onClick={handleRetry} className="min-h-12 rounded-xl border border-white/20 bg-white/10 px-4 font-semibold text-white">Record again</button>
                </div>
              </div>
            ) : (
              <>
                <div className="rounded-3xl border border-primary/30 bg-primary/10 p-5 sm:p-8">
                  <p className="text-sm font-semibold text-primary">Transcript-based practice estimate</p>
                  <p className="mt-2 text-2xl sm:text-4xl sm:text-5xl font-bold text-white">{feedback.score}<span className="text-xl text-white/60"> / 100</span></p>
                  {previousAttempt && <p className="mt-3 text-sm sm:text-base text-white/75">Previous attempt: {previousAttempt.score}/100. Current attempt: {feedback.score}/100.</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-7">
                    <h3 className="text-xl font-bold text-white mb-3">What worked</h3>
                    {Array.isArray(feedback.strengths) && feedback.strengths.length > 0 ? (
                      <ul className="space-y-3 text-base text-white/80">
                        {feedback.strengths.slice(0, 2).map((item: string, index: number) => <li key={index} className="flex gap-2"><Check size={19} className="shrink-0 text-primary mt-1" />{item}</li>)}
                      </ul>
                    ) : <p className="text-base text-white/70">See the detailed feedback below for strengths found in your answer.</p>}
                  </div>
                  <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-7">
                    <h3 className="text-xl font-bold text-white mb-3">One thing to improve</h3>
                    {feedback.nextStep?.quote && <p className="text-sm text-white/60 mb-2">You said: “{feedback.nextStep.quote}”</p>}
                    {feedback.nextStep?.tryInstead && <p className="text-base text-white/90 mb-3">Try: “{feedback.nextStep.tryInstead}”</p>}
                    <p className="text-base text-primary">{feedback.nextStep?.practice || 'Review the detailed feedback, then answer this task again.'}</p>
                  </div>
                </div>

                <details className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-7">
                  <summary className="cursor-pointer text-lg font-bold text-white min-h-11">See full feedback</summary>
                  <div className="mt-5 prose prose-invert max-w-none text-base leading-relaxed"><ReactMarkdown>{feedback.feedback || ''}</ReactMarkdown></div>
                </details>

                <div className="rounded-3xl border border-white/15 bg-white/5 p-5 sm:p-7 space-y-3">
                  <h3 className="text-lg font-bold text-white">Listen to your answer</h3>
                  <button type="button" onClick={handlePlayToggle} className="min-h-12 rounded-xl bg-white/10 border border-white/20 px-5 text-base font-semibold text-white flex items-center gap-2">
                    {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                    {isPlaying ? 'Pause recording' : 'Play recording'}
                  </button>
                  <p className="text-sm text-white/55">Feedback was based on the text you confirmed, not the audio.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button type="button" onClick={handleRetry} className="min-h-14 rounded-xl bg-primary px-4 font-bold text-obsidian flex items-center justify-center gap-2"><RefreshCw size={18} /> Try same task again</button>
                  <button type="button" onClick={() => void handleSave()} className="min-h-14 rounded-xl border border-white/20 bg-white/10 px-4 font-semibold text-white flex items-center justify-center gap-2"><Save size={18} /> Save result</button>
                  <button type="button" onClick={() => {
                    if (selectedPart === 'Full' && currentFullPart < 3) {
                      if (progress.attempt?.newAttempt() === false) { setError('Retry syncing this part before continuing.'); return; }
                      setCurrentFullPart(prev => (prev + 1) as 1 | 2 | 3);
                      setView('intro');
                      setFeedback(null);
                      setTask(null);
                    } else {
                      resetToSelection();
                    }
                  }} className="min-h-14 rounded-xl border border-white/20 bg-white/10 px-4 font-semibold text-white">
                    {selectedPart === 'Full' && currentFullPart < 3 ? `Go to Part ${currentFullPart + 1}` : 'Choose another part'}
                  </button>
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
};
