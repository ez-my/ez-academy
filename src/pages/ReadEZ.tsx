import {TrialReadingLibrary} from '../components/TrialReadingLibrary';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  Trophy, 
  Clock, 
  Loader2,
  AlertCircle,
  Download
} from 'lucide-react';
import { GeminiService } from '../services/geminiService';
import { toast } from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../lib/apiUtils';
import { getFriendlyFirebaseError } from '../lib/firebase';
import { useDailyLimits } from '../lib/limits';
import { UserProfile, ReadTestSet, ReadPart, ReadQuestion } from '../types';
import { db, saveSession } from '../lib/firebase';
import { getRandomReadQuestion, saveReadQuestionToBank, markQuestionAsCompleted } from '../services/questionBankService';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';
import { SuccessFeedback } from '../components/layout/SuccessFeedback';
import { saveReadTestOffline, getOfflineReadTests } from '../lib/offlineStorage';

interface ReadEZProps {
  profile: UserProfile;
}

type TestState = 'IDLE' | 'LOADING' | 'PLAYING' | 'SUBMITTING' | 'RESULT';

export const ReadEZ: React.FC<ReadEZProps> = ({ profile }) => {
  const { getRemaining, isLimitReached, incrementUsage } = useDailyLimits(profile.plan || 'free', profile.email);
  const [showTrialBank,setShowTrialBank]=useState(true);
  const [state, setState] = useState<TestState>('IDLE');
  const [selectedMode, setSelectedMode] = useState<'FULL' | 1 | 2 | 3 | 4 | 5>('FULL');
  const [testSet, setTestSet] = useState<ReadTestSet | null>(null);
  const [currentPartIndex, setCurrentPartIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [isSavingOffline, setIsSavingOffline] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state === 'PLAYING') {
        e.preventDefault();
        e.returnValue = 'Test in progress. Leaving now will reset your attempt.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state]);

  const startTest = async () => {
    if (selectedMode === 'FULL' && (profile.plan === 'free'||profile.fullTestAccess===false)) {
      alert("Full Mock Paper is locked for free users. Please upgrade your plan to access this feature.");
      setErrorHeader("Full Mock Paper is a premium feature.");
      return;
    }
    if (isLimitReached('read')) {
      setErrorHeader("Daily read limit reached for your current plan.");
      return;
    }
    setState('LOADING');
    setErrorHeader(null);
    try {
      await incrementUsage('read',selectedMode==='FULL');
      const themes = [
        "People and Culture",
        "Science and Technology",
        "Health and Environment",
        "Financial and Consumer Awareness"
      ];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      
      let test;
      if (isOfflineMode) {
        const offlineTests = await getOfflineReadTests();
        const available = offlineTests.filter(t => selectedMode === 'FULL' || t.parts?.some(p => p.partNumber === selectedMode));
        if (available.length > 0) {
          test = available[Math.floor(Math.random() * available.length)];
        }
      }
      
      if (!test) {
        test = await getRandomReadQuestion(selectedMode, profile.uid, randomTheme, isOfflineMode);
      }
      
      if (!test && !isOfflineMode) {
        test = await GeminiService.generateReadTest(randomTheme, selectedMode);
        // Save to bank for future users
        await saveReadQuestionToBank(selectedMode, test, randomTheme, profile.uid);
      }

      setTestSet(test);
      setState('PLAYING');
      setStartTime(Date.now());
      setCurrentPartIndex(0);
      setAnswers({});
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error(err);
      const friendlyMsg = getFriendlyErrorMessage(err);
      setErrorHeader(friendlyMsg);
      toast.error(friendlyMsg);
      setState('IDLE');
    }
  };

  const handleSaveForOffline = async () => {
    if (isSavingOffline) return;
    setIsSavingOffline(true);
    const toastId = toast.loading('Downloading module for offline use...');
    try {
      const themes = [
        "People and Culture",
        "Science and Technology",
        "Health and Environment",
        "Financial and Consumer Awareness"
      ];
      const randomTheme = themes[Math.floor(Math.random() * themes.length)];
      
      let test = await getRandomReadQuestion(selectedMode, profile.uid, randomTheme, false);
      if (!test) {
         test = await GeminiService.generateReadTest(randomTheme, selectedMode);
         await saveReadQuestionToBank(selectedMode, test, randomTheme, profile.uid);
      }
      
      await saveReadTestOffline(test);
      toast.success('Module saved for offline practice!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save module offline.', { id: toastId });
    } finally {
      setIsSavingOffline(false);
    }
  };

  const handleAnswerSelect = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const submitTest = async () => {
    if (!testSet || !startTime) return;
    setState('SUBMITTING');
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate score
    let correctCount = 0;
    let totalQuestions = 0;
    
    if (testSet.parts) {
      testSet.parts.forEach(part => {
        if (part.questions) {
          part.questions.forEach(q => {
            totalQuestions++;
            const correct = testSet.answers[q.id];
            const userA = answers[q.id];
            
            // for short answer check case insensitive
            if (q.type === 'SHORT_ANSWER') {
               if (userA && correct && userA.trim().toLowerCase() === correct.trim().toLowerCase()) {
                 correctCount++;
               }
            } else {
               // For MCQ/GAPPED_TEXT usually looking like "A" or "A. text..."
               // Let's just compare the first character (A, B, C, D) just in case
               const userOption = userA ? userA.charAt(0).toUpperCase() : '';
               const correctOption = correct ? correct.charAt(0).toUpperCase() : '';
               if (userOption === correctOption) {
                 correctCount++;
               }
            }
          });
        }
      });
    }

    const finalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    setScore(finalScore);

    // Mark as completed for rotation
    if (testSet.id && !testSet.id.startsWith('blob:')) {
      await markQuestionAsCompleted(profile.uid, testSet.id, finalScore);
    }

    try {
      await saveSession(profile.uid, {
        id: Date.now().toString(),
        userId: profile.uid,
        type: 'ReadEZ',
        timestamp: Date.now(),
        duration,
        score: finalScore,
        feedback: `You answered ${correctCount} out of ${totalQuestions} correctly.`,
        metrics: {
          fluency: 0,
          grammar: 0,
          vocabulary: 0,
          comprehension: finalScore,
          pronunciation: 0,
          structure: 0
        }
      });
      toast.success('Test results synchronized!');
    } catch (err: any) {
      console.error("Error saving session", err);
      toast.error(getFriendlyFirebaseError(err));
    }
    setState('RESULT');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const renderPartUI = () => {
    if (!testSet) return null;
    const currentPart = testSet.parts[currentPartIndex];
    if (!currentPart) return null;

    return (
      <motion.div
        key={currentPart.partNumber}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between">
           <div>
             <h3 className="text-xl font-bold text-white mb-2">Part {currentPart.partNumber}</h3>
             <p className="text-white/60 italic">{currentPart.instruction}</p>
           </div>
        </div>

        {/* Render Passages / Stimuli */}
        <div className="space-y-6">
          {currentPart.passage && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 text-white/80 leading-relaxed font-serif text-lg">
               <ReactMarkdown>{currentPart.passage}</ReactMarkdown>
            </div>
          )}

          {currentPart.stimuli && currentPart.stimuli.length > 0 && (
             <div className={cn("grid gap-6", currentPart.partNumber === 1 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-2")}>
               {currentPart.stimuli.map(st => (
                 <div key={st.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                   {st.title && <h4 className="font-bold text-primary">{st.title}</h4>}
                   <div className="text-white/80 whitespace-pre-wrap"><ReactMarkdown>{st.content}</ReactMarkdown></div>
                 </div>
               ))}
             </div>
          )}
        </div>

        {/* Render Questions */}
        <div className="space-y-8 mt-12">
          {currentPart && currentPart.questions && currentPart.questions.map((q, idx) => {
            return (
              <div key={q.id} className="bg-obsidian border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
                 <div className="flex gap-4">
                   <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                     {q.number}
                   </div>
                   <div className="flex-1 space-y-6">
                     {q.text && <p className="text-lg font-medium text-white">{q.text}</p>}
                     
                     {q.type === 'SHORT_ANSWER' ? (
                       <input 
                         type="text" 
                         value={answers[q.id] || ''}
                         onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
                         className="w-full bg-white/5 border-b-2 border-white/20 focus:border-primary px-4 py-3 text-white outline-none rounded-t-lg transition-colors"
                         placeholder="Type one word answer..."
                       />
                     ) : (
                       <div className="grid gap-3">
                         {q.options?.map((opt, optIdx) => {
                           const letter = opt.charAt(0);
                           const isSelected = answers[q.id] && answers[q.id].charAt(0) === letter;
                           return (
                             <button
                               key={optIdx}
                               onClick={() => handleAnswerSelect(q.id, opt)}
                               className={cn(
                                 "text-left px-6 py-4 rounded-xl border transition-all duration-200 flex gap-4",
                                 isSelected 
                                   ? "bg-primary/20 border-primary text-white" 
                                   : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:border-white/20 hover:text-white"
                               )}
                             >
                               <span className="font-bold w-6">{letter}.</span>
                               <span>{opt.substring(2).trim()}</span>
                             </button>
                           )
                         })}
                       </div>
                     )}
                   </div>
                 </div>
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-white/10">
          <button 
             onClick={() => setCurrentPartIndex(prev => Math.max(0, prev - 1))}
             disabled={currentPartIndex === 0}
             className="px-6 py-3 rounded-full border border-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
          >
             <ChevronLeft size={18} /> Previous Part
          </button>
          
          {currentPartIndex < testSet.parts.length - 1 ? (
             <button 
               onClick={() => setCurrentPartIndex(prev => prev + 1)}
               className="btn-primary flex items-center gap-2"
             >
               Next Part <ChevronRight size={18} />
             </button>
          ) : (
             <button 
               onClick={submitTest}
               className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold flex items-center gap-2 transition-all hover:scale-105"
             >
               Submit Test <Send size={18} />
             </button>
          )}
        </div>
      </motion.div>
    );
  };

  if(showTrialBank)return <TrialReadingLibrary uid={profile.uid} onOtherPractice={()=>setShowTrialBank(false)}/>;

  return (
    <div className="min-h-screen bg-obsidian text-white pt-24 pb-12 px-6">
      <SuccessFeedback show={showSuccess} onComplete={() => setShowSuccess(false)} />
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tighter uppercase">Read<span className="text-primary neon-text-glow">EZ</span> Practice</h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto font-medium">Practise SPM reading.</p>
        </header>

        {errorHeader && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
            <AlertCircle size={20} />
            <p>{errorHeader}</p>
          </div>
        )}

        {state === 'IDLE' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 md:p-12 text-center space-y-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
            <h2 className="text-2xl font-bold tracking-tight">Ready to begin?</h2>
            
            <div className="flex bg-black/40 border border-white/10 rounded-2xl p-1 mb-8">
              <button 
                onClick={() => setIsOfflineMode(false)}
                className={cn("flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", !isOfflineMode ? "bg-primary text-obsidian" : "text-white/40 hover:text-white/60")}
              >
                Online AI
              </button>
              <button 
                onClick={() => setIsOfflineMode(true)}
                className={cn("flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isOfflineMode ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/60")}
              >
                Offline Bank
              </button>
              <button 
                onClick={handleSaveForOffline}
                disabled={isSavingOffline}
                className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-white/40 hover:text-white/60", isSavingOffline && "opacity-50 cursor-not-allowed")}
              >
                {isSavingOffline ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} Save
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm uppercase tracking-widest text-white/50 font-black">Select Practice Mode</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                 <button 
                   onClick={() => setSelectedMode('FULL')}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 'FULL' ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Full Paper (40 Qs)
                 </button>
                 <button 
                   onClick={() => setSelectedMode(1)}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 1 ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Part 1: Short Texts
                 </button>
                 <button 
                   onClick={() => setSelectedMode(2)}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 2 ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Part 2: Cloze Text
                 </button>
                 <button 
                   onClick={() => setSelectedMode(3)}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 3 ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Part 3: Reading Comprehension
                 </button>
                 <button 
                   onClick={() => setSelectedMode(4)}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 4 ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Part 4: Gapped Text
                 </button>
                 <button 
                   onClick={() => setSelectedMode(5)}
                   className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all border", selectedMode === 5 ? "bg-primary text-obsidian border-primary" : "bg-white/5 border-white/10 text-white/60 hover:border-white/30")}
                 >
                   Part 5: Matching
                 </button>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 text-left border-t border-white/10 pt-8 mt-8">
              <div className="bg-obsidian/50 p-6 rounded-2xl border border-white/5 space-y-3">
                <CheckCircle2 className="text-primary" size={24} />
                <h3 className="font-bold text-lg">{selectedMode === 'FULL' ? 'Full Mock Paper' : `Part ${selectedMode} Practice`}</h3>
                <p className="text-sm text-white/50">{selectedMode === 'FULL' ? '40 SPM-style questions.' : 'Practise this part.'}</p>
              </div>
              <div className="bg-obsidian/50 p-6 rounded-2xl border border-white/5 space-y-3">
                <Clock className="text-primary" size={24} />
                <h3 className="font-bold text-lg">Time Management</h3>
                <p className="text-sm text-white/50">Practise with a timer.</p>
              </div>
              <div className="bg-obsidian/50 p-6 rounded-2xl border border-white/5 space-y-3">
                <Trophy className="text-primary" size={24} />
                <h3 className="font-bold text-lg">Instant Scoring</h3>
                <p className="text-sm text-white/50">See and save your results.</p>
              </div>
            </div>

            <button onClick={startTest} className="btn-primary text-lg px-12 py-4">
              Generate & Start Test
            </button>
            <p className="text-white/40 text-sm mt-4">Remaining tests today: {getRemaining('read')} (Updates daily)</p>
          </motion.div>
        )}

        {state === 'LOADING' && (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-white/10 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                <Loader2 className="animate-spin" size={24} />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-white animate-pulse">Generating your custom test...</h3>
              <p className="text-white/40">EZ AI is assembling a balanced SPM-format paper.</p>
            </div>
          </div>
        )}

        {state === 'PLAYING' && testSet && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 md:px-8 md:py-6 border border-white/10 flex flex-col md:flex-row justify-between items-center sticky top-20 z-40 shadow-xl gap-6">
               <div className="flex-1 w-full">
                 <div className="flex items-center justify-between mb-3">
                   <div>
                     <h2 className="font-bold text-white text-lg tracking-tight">{testSet.title}</h2>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 italic">SPM Reading Diagnostic</p>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] font-black uppercase tracking-widest text-primary italic bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
                       Part {testSet.parts[currentPartIndex].partNumber} / {testSet.parts.length}
                     </span>
                   </div>
                 </div>
                 
                 <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden relative">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${((currentPartIndex + 1) / testSet.parts.length) * 100}%` }}
                     className="h-full bg-primary shadow-[0_0_15px_rgba(240,185,11,0.3)] transition-all duration-500 ease-out relative"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                   </motion.div>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                 <div className="flex items-center gap-3 px-4 py-2 bg-obsidian rounded-xl border border-white/10 font-mono">
                   <Clock className="text-primary" size={16} />
                   <span className="text-white font-bold">{formatTime(duration)}</span>
                 </div>
                 
                 <div className="flex items-center gap-3 px-4 py-2 bg-obsidian rounded-xl border border-white/10">
                   <div className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Answers</div>
                   <span className="text-white font-bold">{Object.keys(answers).length}</span>
                 </div>
               </div>
            </div>

            {/* Part Content */}
            <AnimatePresence mode='wait'>
              {renderPartUI()}
            </AnimatePresence>
          </div>
        )}
        
        {state === 'SUBMITTING' && (
           <div className="flex flex-col items-center justify-center py-24 space-y-6">
             <div className="w-16 h-16 border-4 border-white/10 border-t-green-500 rounded-full animate-spin"></div>
             <h3 className="text-xl font-bold text-white animate-pulse">Analyzing Responses...</h3>
           </div>
        )}

        {state === 'RESULT' && score !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-8 md:p-12 text-center space-y-8">
            <div className="w-32 h-32 rounded-full border-4 border-primary/20 flex flex-col items-center justify-center mx-auto bg-obsidian shadow-2xl shadow-primary/20">
               <span className="text-2xl sm:text-5xl font-black text-primary">{score}</span>
               <span className="text-white/40 font-bold uppercase text-xs tracking-widest mt-1">Score</span>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Test Complete</h2>
              <p className="text-white/50">You completed the test in {formatTime(duration)}.</p>
            </div>
            
            <div className="pt-8 border-t border-white/10">
               <button onClick={() => window.location.reload()} className="btn-primary">Return to Dashboard</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

