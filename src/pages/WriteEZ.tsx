import React, { useState, useEffect, useRef } from 'react';
import { usePracticeProgress, usePracticeDraft } from '../hooks/usePracticeProgress';
import { ProgressSaveStatus } from '../components/ProgressSaveStatus';
import { useNavigate } from 'react-router-dom';
import { PenTool, Send, Trash2, Loader2, Sparkles, AlertCircle, CheckCircle2, Mail, RefreshCw, ChevronRight, MessageSquare, BookOpen, User, FileText, X, Info, Zap, Trophy, Gamepad2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { analyzeSpeech, generateSPMEmailTask, SPMTask, generateSPMPart2Task, analyzeSPMEmail, analyzeSPMPart2, analyzeSPMFullEssay, generateSPMPart3Task, analyzeSPMPart3, modularizeSPMTask } from '../lib/gemini';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db, auth, saveSession, updateProfile } from '../lib/firebase';
import { PART1_QUESTION_BANK, PART2_QUESTION_BANK, PART3_QUESTION_BANK } from '../data/questionBank';
import { useDailyLimits } from '../lib/limits';
import { canUseAIFeedback, incrementFreeFeedbackCount } from '../lib/feedbackLimits';
import { PaywallModal } from '../components/paywall/PaywallModal';
import { PlanType, UserProfile } from '../types';
import { getRandomQuestion, markQuestionAsCompleted, saveQuestionToBank } from '../services/questionBankService';
import { SuccessFeedback } from '../components/layout/SuccessFeedback';
import { toast } from 'react-hot-toast';
import { getFriendlyErrorMessage } from '../lib/apiUtils';
import { getFriendlyFirebaseError } from '../lib/firebase';

interface WriteEZProps {
  userGoal?: string;
  userLevel?: string;
  plan?: PlanType;
  profile?: UserProfile;
}

interface EssayComponents {
  intro: string;
  body1: string;
  body2: string;
  body3: string;
  conclusion: string;
}

const RubricCard: React.FC<{ title: string; marks: string; desc: string; bullets: string[] }> = ({ title, marks, desc, bullets }) => (
  <div className="glass-card p-6 bg-white/[0.02] border-white/10 hover:border-primary/40 transition-colors group">
    <div className="flex justify-between items-start mb-4">
      <h4 className="text-xl font-black italic tracking-tighter text-white group-hover:text-primary transition-colors">{title}</h4>
      <div className="text-right">
        <span className="text-2xl font-black italic">{marks}</span>
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest ml-1">Marks</span>
      </div>
    </div>
    <p className="text-xs font-bold text-white/60 leading-relaxed mb-4">{desc}</p>
    <ul className="space-y-2">
      {bullets.map((b, i) => (
        <li key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/30">
          <div className="w-1 h-1 bg-primary rounded-full" />
          {b}
        </li>
      ))}
    </ul>
  </div>
);

const PART3_STRUCTURES: Record<string, string[]> = {
  Article: [
    'Title required',
    'Introduction to attract reader interest',
    'Body paragraph 1: main point with explanation and example',
    'Body paragraph 2: main point with explanation and example',
    'Body paragraph 3: main point with explanation and example',
    'Conclusion with summary and closing thought'
  ],
  Email: [
    'Subject provided by system',
    'Greeting appropriate to recipient',
    'Introduction stating purpose',
    'Body paragraph 1: first point with detail',
    'Body paragraph 2: second point with detail',
    'Body paragraph 3: third point with detail',
    'Closing statement',
    'Sign off appropriate to tone'
  ],
  Story: [
    'Introduction: setting and characters',
    'Rising event: problem introduction',
    'Climax: main conflict',
    'Resolution of problem',
    'Ending with lesson or reflection'
  ],
  Review: [
    'Introduction of item or event',
    'Brief description',
    'Positive points',
    'Negative points',
    'Recommendation',
    'Conclusion with final opinion'
  ],
  Speech: [
    'Greeting to audience',
    'Hook or opening statement',
    'Main point 1: with explanation and example',
    'Main point 2: with explanation and example',
    'Main point 3: with explanation and example',
    'Conclusion summary',
    'Call to action or closing remark'
  ],
  Report: [
    'Title required',
    'Introduction stating purpose of report',
    'Findings section 1',
    'Findings section 2',
    'Findings section 3',
    'Conclusion',
    'Recommendation (if needed)'
  ]
};

export const WriteEZ: React.FC<WriteEZProps> = ({ userGoal, userLevel, plan = 'free', profile }) => {
  const navigate = useNavigate();
  const { isLimitReached, incrementUsage } = useDailyLimits(profile?.plan || plan, profile?.email);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallProps, setPaywallProps] = useState<{ title?: string; subtext?: string; cost: number } | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  
  const executeUseCredits = async () => {
    const cost = paywallProps?.cost ?? 2; // default write tasks cost 2 credits
    if (!profile) return;
    if ((profile.credits || 0) < cost) {
      alert("You don't have enough credits. Please purchase more.");
      return;
    }
    try {
      // Writing feedback is charged by handleAnalyze only after valid feedback arrives.
      if (!pendingFeedback) await updateProfile(profile.uid, { credits: increment(-cost) as any });
      setShowPaywall(false);

      // Execute the action immediately after closing the paywall
      if (pendingAction) {
        
        pendingAction();
        setPendingAction(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to deduct credits. Please check your connection.");
    }
  };

  const [useDeepFeedback, setUseDeepFeedback] = useState(false);

  const progress = usePracticeProgress(profile?.uid, 'WriteEZ');
  const [text, setText] = useState(progress.attempt?.draft?.text || '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);
  const [activePart, setActivePart] = useState<'PART 1' | 'PART 2' | 'PART 3'>(progress.attempt?.draft?.activePart || 'PART 1');
  const [showSuccess, setShowSuccess] = useState(false);
  const [spmTask, setSpmTask] = useState<SPMTask | null>(progress.attempt?.draft?.task || null);
  const [isGeneratingTask, setIsGeneratingTask] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [showRubric, setShowRubric] = useState(false);
  const [showStructures, setShowStructures] = useState(true);
  const [part2SubMode, setPart2SubMode] = useState<'AUTO' | 'Full' | 'Introduction' | 'Body' | 'Conclusion'>('AUTO');
  const [part3SubMode, setPart3SubMode] = useState<'AUTO' | 'Full' | 'Introduction' | 'Body' | 'Conclusion'>('AUTO');
  const [part3Type, setPart3Type] = useState<'Article' | 'Email' | 'Story' | 'Review' | 'Speech' | 'Report' | null>(null);
  const [selectedPointIdx, setSelectedPointIdx] = useState<number | null>(progress.attempt?.draft?.selectedPointIdx ?? null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'warning' | 'danger';
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  const [justSavedPart, setJustSavedPart] = useState<string | null>(null);
  const [essayComponents, setEssayComponents] = useState<EssayComponents>(progress.attempt?.draft?.essayComponents || {
    intro: '',
    body1: '',
    body2: '',
    body3: '',
    conclusion: ''
  });
  const [part3EssayComponents, setPart3EssayComponents] = useState<EssayComponents>(progress.attempt?.draft?.part3EssayComponents || {
    intro: '',
    body1: '',
    body2: '',
    body3: '',
    conclusion: ''
  });
  const [isFullEssayMode, setIsFullEssayMode] = useState(progress.attempt?.draft?.isFullEssayMode || false);
  const [assemblyMode, setAssemblyMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string>('People and Culture');
  const [usedPart1Indices, setUsedPart1Indices] = useState<number[]>(() => {
    const saved = localStorage.getItem('usedPart1Indices');
    return saved ? JSON.parse(saved) : [];
  });
  const [usedPart2Indices, setUsedPart2Indices] = useState<number[]>(() => {
    const saved = localStorage.getItem('usedPart2Indices');
    return saved ? JSON.parse(saved) : [];
  });
  const [usedPart3Indices, setUsedPart3Indices] = useState<number[]>(() => {
    const saved = localStorage.getItem('usedPart3Indices');
    return saved ? JSON.parse(saved) : [];
  });
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('usedQuestionIds');
    return saved ? JSON.parse(saved) : [];
  });

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const isSPM = userGoal === 'SPM';

  const handleGenerateTaskWithLimit = () => {
    if (assessmentInFlight.current) return;
    if (isLimitReached('write')) {
      setPaywallProps(null);
      setPendingFeedback(false);
      setPendingAction(() => () => handleGenerateTask(true));
      setShowPaywall(true);
      return;
    }
    handleGenerateTask(false);
  };

  const handleGenerateTask = async (skipLimitCheck = false) => {
    if (assessmentInFlight.current) return;
    if (progress.attempt?.status === 'not-synced' || progress.attempt?.status === 'saving') { setError('Sync this completion before starting another task.'); return; }
    if (!skipLimitCheck && isLimitReached('write')) {
      setPaywallProps(null);
      setPendingFeedback(false);
      setPendingAction(() => () => handleGenerateTask(true));
      setShowPaywall(true);
      return;
    }
    setIsGeneratingTask(true);
    try {await incrementUsage('write',(activePart==='PART 2'&&part2SubMode==='Full')||(activePart==='PART 3'&&part3SubMode==='Full'));} catch(e:any){setError(e.message);setIsGeneratingTask(false);return;}
    setFeedback(null);
    setError(null);
    setText('');
    setSelectedPointIdx(null);
    setEssayComponents({
      intro: '',
      body1: '',
      body2: '',
      body3: '',
      conclusion: ''
    });
    setPart3EssayComponents({
      intro: '',
      body1: '',
      body2: '',
      body3: '',
      conclusion: ''
    });
    setIsFullEssayMode(false);
    setAssemblyMode(false);
    try {
      let task;
    if (activePart === 'PART 2' || activePart === 'PART 3') {
      const modes: ('Introduction' | 'Body' | 'Conclusion')[] = ['Introduction', 'Body', 'Conclusion'];
      const currentSubMode = activePart === 'PART 2' ? part2SubMode : part3SubMode;
      const selectedMode = currentSubMode === 'AUTO' 
        ? modes[Math.floor(Math.random() * modes.length)] 
        : currentSubMode;
      
      // Try to fetch from bank (Firestore or Local)
      const partNum = activePart === 'PART 2' ? 2 : 3;
      const bankTask = await getRandomQuestion('Writing', partNum as 1 | 2 | 3, profile?.uid, selectedTheme, isOfflineMode);

      if (bankTask) {
        if (selectedMode !== 'Full') {
          task = await modularizeSPMTask(bankTask, selectedMode as 'Introduction' | 'Body' | 'Conclusion');
        } else {
          task = { ...bankTask, practiceMode: 'Full' };
        }
        
        // Track ID for completion
        if (bankTask.id) (task as any).dbId = bankTask.id;

      } else {
        if (isOfflineMode) {
          throw new Error("No offline questions found for this part/theme. Please try another theme or disable Offline Mode.");
        }
        // AI Fallback
        if (activePart === 'PART 2') {
           task = await generateSPMPart2Task(selectedMode as any, selectedTheme);
        } else {
           task = await generateSPMPart3Task(part3Type!, selectedTheme, selectedMode as any);
        }
        // Save generated tasks
        await saveQuestionToBank('Writing', partNum as 1 | 2 | 3, task, profile?.uid);
      }
    } else if (activePart === 'PART 1') {
      const bankTask = await getRandomQuestion('Writing', 1, profile?.uid, selectedTheme, isOfflineMode);
      
      if (bankTask) {
        task = bankTask;
        if (bankTask.id) (task as any).dbId = bankTask.id;
      } else {
        if (isOfflineMode) {
          throw new Error("No offline questions found for Part 1. Please try another theme or disable Offline Mode.");
        }
        task = await generateSPMEmailTask(selectedTheme);
        await saveQuestionToBank('Writing', 1, task, profile?.uid);
      }
    }
    progress.attempt?.newAttempt();
    setSpmTask(task || null);

  } catch (err: any) {
    console.error('Failed to generate task:', err);
    if (skipLimitCheck && profile) {
      try { await updateProfile(profile.uid, { credits: increment(2) as any }); } catch (e) {}
    }
    const msg = err?.message || '';
    if (msg.includes('Quota Exceeded') || msg.includes('429') || msg.includes('quota')) {
      setError('Gemini AI Quota Exceeded. The AI is overwhelmed! Please try again in 60 seconds or upgrade your plan for higher limits.');
    } else if (msg.includes('invalid response format') || msg.includes('could not be understood')) {
      setError('The AI returned an invalid response format. This sometimes happens with complex tasks. Please try generating again.');
    } else {
      setError('Failed to generate task. Please check your internet connection and try again.');
    }
  } finally {
    setIsGeneratingTask(false);
  }
};

  useEffect(() => {
    // Initial task generation removed in favor of manual theme selection
  }, []);

  useEffect(() => {
    if (spmTask && spmTask.practiceMode === 'Conclusion' && text.length < 5 && !isFullEssayMode) {
      const sampleContent = `    [Sample Introduction - ${spmTask.theme || 'Topic'}]\n    This is where your introduction would normally go, hooking the reader and introducing the main topic.\n\n    [Sample Body Paragraphs]\n    This section represents the main arguments or points you have elaborated on using PEEL. They provide the necessary context and justification for your final thoughts.\n\n`;
      setText(sampleContent);
    }
  }, [spmTask?.practiceMode]);

  const draftOwner = useRef(profile?.uid);
  useEffect(() => {
    if (draftOwner.current !== profile?.uid) {
      draftOwner.current = profile?.uid; setText(progress.attempt?.draft?.text || ''); setSpmTask(progress.attempt?.draft?.task || null); setFeedback(null);
      setActivePart(progress.attempt?.draft?.activePart || 'PART 1'); setIsFullEssayMode(progress.attempt?.draft?.isFullEssayMode || false); setSelectedPointIdx(progress.attempt?.draft?.selectedPointIdx ?? null);
      const empty = { intro: '', body1: '', body2: '', body3: '', conclusion: '' };
      setEssayComponents(progress.attempt?.draft?.essayComponents || empty); setPart3EssayComponents(progress.attempt?.draft?.part3EssayComponents || empty);
    }
  }, [profile?.uid]);
  usePracticeDraft(progress, draftOwner.current === profile?.uid ? { text, task: spmTask, activePart, essayComponents, part3EssayComponents, isFullEssayMode, selectedPointIdx } : progress.attempt?.draft);
  const finishPractice = async (answer = text, analysis?: any) => {
    const learnerAnswer = answer.replace(/\s*\[Sample Introduction[^\]]*\][\s\S]*?justification for your final thoughts\.\s*/g, '');
    if (!spmTask || learnerAnswer.replace(/[^a-zA-Z]/g, '').length < 10) { setError('Write your own answer before finishing practice.'); return false; }
    return progress.complete({ transcript: answer, score: analysis?.score ?? null, feedback: analysis?.rawFeedback || analysis?.feedback || '', metrics: analysis?.metrics });
  };

  const handleAnalyzeWithLimit = (overrideText?: string) => {
    if ((plan || 'free') === 'free') {window.dispatchEvent(new CustomEvent('ez-general-feedback',{detail:{skill:'write'}}));return;}
    if (isLimitReached('write')) {
      setPendingFeedback(true);
      setPaywallProps({ title: 'More feedback', subtext: 'Use credits to get feedback on your writing.', cost: useDeepFeedback ? 4 : 2 });
      setPendingAction(() => () => handleAnalyze(overrideText, true, useDeepFeedback ? 4 : 2));
      setShowPaywall(true);
      return;
    }
    handleAnalyze(overrideText, false);
  };

  const assessmentInFlight = useRef(false);
  const handleAnalyze = async (overrideText?: string, skipLimitCheck = false, paidFeedbackCost = 0) => {
    if (assessmentInFlight.current || isGeneratingTask) return;
    if ((plan || 'free') === 'free') {window.dispatchEvent(new CustomEvent('ez-general-feedback',{detail:{skill:'write'}}));return;}
    if (!skipLimitCheck && isLimitReached('write')) {
      setPendingFeedback(true);
      setPaywallProps({ title: 'More feedback', subtext: 'Use credits to get feedback on your writing.', cost: useDeepFeedback ? 4 : 2 });
      setPendingAction(() => () => handleAnalyze(overrideText, true, useDeepFeedback ? 4 : 2));
      setShowPaywall(true);
      return;
    }
    const textToAnalyze = overrideText || text;
    if (!textToAnalyze || textToAnalyze.length < 5) return;
    
    const feedbackCreditCost = skipLimitCheck ? paidFeedbackCost : 0;
    if (feedbackCreditCost > 0 && (!profile || (profile.credits || 0) < feedbackCreditCost)) {
      setError('You need more credits for feedback. Your writing is still here.');
      return;
    }
    const isFree = plan === 'free';
    if (isFree && !skipLimitCheck && !canUseAIFeedback(plan)) {
      setError('Your free AI feedback allowance has been used. Your writing is still here. Get more feedback access to receive a score.');
      return;
    }
    if (!isFullEssayMode && !overrideText && activePart === 'PART 2' && spmTask?.practiceMode === 'Body' && selectedPointIdx === null) {
      setError('Please select a bullet point below to elaborate on using the PEEL method.'); return;
    }
    if (progress.attempt && !progress.attempt.acceptsAnswer(textToAnalyze)) {
      setError('Sync the previous answer first before requesting feedback on an edited answer.'); return;
    }
    assessmentInFlight.current = true;
    setIsAnalyzing(true);
    const completed = await finishPractice(textToAnalyze);
    if (!completed && progress.attempt?.status !== 'not-synced') { assessmentInFlight.current = false; setIsAnalyzing(false); return; }
    if (auth.currentUser?.uid !== profile?.uid) { assessmentInFlight.current = false; setIsAnalyzing(false); return; }
    setError(null);
    setFeedback(null);

    if (isFullEssayMode || (overrideText && (activePart === 'PART 2' || activePart === 'PART 3'))) {
      setIsAnalyzing(true);
      try {
        let analysis;
        {
          analysis = await analyzeSPMFullEssay(spmTask!, textToAnalyze, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
          if (auth.currentUser?.uid !== profile?.uid) return;
          if (feedbackCreditCost > 0 && profile) await updateProfile(profile.uid, { credits: increment(-feedbackCreditCost) as any });
          if (isFree) incrementFreeFeedbackCount();
        }
        // Feedback belongs to the practice already counted at task creation.
        setFeedback(analysis);
        const synced = await finishPractice(textToAnalyze, analysis);
        setShowSuccess(synced && progress.attempt?.status !== 'draft');
        if (!synced) setError('Feedback is ready but not synced. Retry sync to save it without another AI call.');
        setTimeout(() => setShowSuccess(false), 2000);
      } catch (err: any) {
        console.warn('Feedback unavailable');
        const friendlyMsg = getFriendlyErrorMessage(err);
        setError(friendlyMsg);
        toast.error(friendlyMsg);
      } finally {
        assessmentInFlight.current = false;
        setIsAnalyzing(false);
      }
      return;
    }

    if (activePart === 'PART 2' && spmTask?.practiceMode === 'Body' && selectedPointIdx === null) {
      setError('Please select a bullet point below to elaborate on using the PEEL method.');
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      let analysis;
      {
        if (isSPM && spmTask) {
          if (activePart === 'PART 1') {
            analysis = await analyzeSPMEmail(spmTask, textToAnalyze, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
            if (auth.currentUser?.uid !== profile?.uid) return;
          } else if (activePart === 'PART 2') {
            // Identify which body paragraph this is for
            let contextPrefix = '';
            if (spmTask.practiceMode === 'Body') {
               contextPrefix = `STUDENT HAS SELECTED TO ELABORATE ON POINT ${selectedPointIdx! + 1}: "${spmTask.bulletPoints?.[selectedPointIdx!]}"`;
            }

            const focusedTask = {
              ...spmTask,
              context: `${spmTask.context}\n\n${contextPrefix}`
            };
            analysis = await analyzeSPMPart2(focusedTask, textToAnalyze, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
            if (auth.currentUser?.uid !== profile?.uid) return;
            
            // Auto-save component if it's a "good" try or user wants to keep it
            if (analysis.score >= 50) {
              updateEssayComponent(spmTask.practiceMode, textToAnalyze, selectedPointIdx);
              setJustSavedPart(`${spmTask.practiceMode}${selectedPointIdx !== null ? ` (Point ${selectedPointIdx + 1})` : ''}`);
              setTimeout(() => setJustSavedPart(null), 5000);
            }
          } else if (activePart === 'PART 3') {
            analysis = await analyzeSPMPart3(spmTask, textToAnalyze, part3Type!, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
            if (auth.currentUser?.uid !== profile?.uid) return;
            
            if (analysis.score >= 50) {
              setPart3EssayComponents(prev => {
                const next = { ...prev };
                if (spmTask.practiceMode === 'Introduction') next.intro = textToAnalyze;
                else if (spmTask.practiceMode === 'Conclusion') next.conclusion = textToAnalyze;
                else if (spmTask.practiceMode === 'Body') {
                  if (selectedPointIdx === 0) next.body1 = textToAnalyze;
                  if (selectedPointIdx === 1) next.body2 = textToAnalyze;
                  if (selectedPointIdx === 2) next.body3 = textToAnalyze;
                }
                return next;
              });
              setJustSavedPart(`Part 3 ${spmTask.practiceMode}${selectedPointIdx !== null ? ` (Point ${selectedPointIdx + 1})` : ''}`);
              setTimeout(() => setJustSavedPart(null), 5000);
            }
          } else {
            analysis = await analyzeSpeech(textToAnalyze, `${userGoal} Writing Task - ${activePart}`, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
            if (auth.currentUser?.uid !== profile?.uid) return;
          }
        } else {
          analysis = await analyzeSpeech(textToAnalyze, `${userGoal} Writing Task - ${activePart}`, { useDeepFeedback, wordCount: textToAnalyze.length, isProPlus: plan === 'pro_plus', aiEngine: profile?.aiEngine });
        }
        if (auth.currentUser?.uid !== profile?.uid) return;
        if (feedbackCreditCost > 0 && profile) await updateProfile(profile.uid, { credits: increment(-feedbackCreditCost) as any });
        if (isFree) incrementFreeFeedbackCount();
      }

      if (analysis.userEvaluation && auth.currentUser) {
        try {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
            xp: increment(analysis.userEvaluation.xp || 0),
            coins: increment(analysis.userEvaluation.coins || 0)
          });
        } catch (e: any) {
          console.warn("Failed to update gamification stats:", e?.message || e);
        }
      }

      // Feedback belongs to the practice already counted at task creation.
      setFeedback(analysis);
      const synced = await finishPractice(textToAnalyze, analysis);
      setShowSuccess(synced && progress.attempt?.status !== 'draft');
      if (!synced) setError('Feedback is ready but not synced. Retry sync to save it without another AI call.');
      setTimeout(() => setShowSuccess(false), 2000);

      // Track completion for rotation
      if (spmTask && (spmTask as any).dbId && profile?.uid) {
        await markQuestionAsCompleted(profile.uid, (spmTask as any).dbId, analysis.score || 0);
      }
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

  const handleManualSaveComponent = () => {
    if ((activePart !== 'PART 2' && activePart !== 'PART 3') || !spmTask) return;
    
    if (activePart === 'PART 2') {
      updateEssayComponent(spmTask.practiceMode, text, selectedPointIdx);
      setJustSavedPart(`Manual Save: ${spmTask.practiceMode}${selectedPointIdx !== null ? ` (Point ${selectedPointIdx + 1})` : ''}`);
    } else {
      setPart3EssayComponents(prev => {
        const next = { ...prev };
        if (spmTask.practiceMode === 'Introduction') next.intro = text;
        else if (spmTask.practiceMode === 'Conclusion') next.conclusion = text;
        else if (spmTask.practiceMode === 'Body') {
          if (selectedPointIdx === 0) next.body1 = text;
          if (selectedPointIdx === 1) next.body2 = text;
          if (selectedPointIdx === 2) next.body3 = text;
        }
        return next;
      });
      setJustSavedPart(`Manual Save: Part 3 ${spmTask.practiceMode}${selectedPointIdx !== null ? ` (Point ${selectedPointIdx + 1})` : ''}`);
    }
    setTimeout(() => setJustSavedPart(null), 5000);
  };

  const updateEssayComponent = (mode: string, content: string, pointIdx: number | null) => {
    setEssayComponents(prev => {
      const next = { ...prev };
      if (mode === 'Introduction') next.intro = content;
      else if (mode === 'Conclusion') next.conclusion = content;
      else if (mode === 'Body') {
        if (pointIdx === 0) next.body1 = content;
        if (pointIdx === 1) next.body2 = content;
        if (pointIdx === 2) next.body3 = content;
      }
      return next;
    });
  };

  const handleBuildFullEssay = () => {
    if(profile?.fullTestAccess===false){setShowPaywall(true);return '';}
    // Basic auto-smoothing
    const fullEssay = [
      essayComponents.intro,
      essayComponents.body1,
      essayComponents.body2,
      essayComponents.body3,
      essayComponents.conclusion
    ].filter(Boolean).join('\n\n');
    
    setText(fullEssay);
    setIsFullEssayMode(true);
    setFeedback(null);
    return fullEssay;
  };

  const handleBuildPart3FullEssay = () => {
    const fullEssay = [
      part3EssayComponents.intro,
      part3EssayComponents.body1,
      part3EssayComponents.body2,
      part3EssayComponents.body3,
      part3EssayComponents.conclusion
    ].filter(Boolean).join('\n\n');
    
    setText(fullEssay);
    setIsFullEssayMode(true);
    setFeedback(null);
    return fullEssay;
  };

  const handleSave = async () => { await finishPractice(text, feedback); };

  const PART_INFO = {
    'PART 1': { label: 'Message/Email', desc: 'Short Communicative Task' },
    'PART 2': { label: 'Guided Essay', desc: 'Modular Writing Practice' },
    'PART 3': { label: 'Extended Writing', desc: 'Article, Report, or Review' }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 relative">
      <SuccessFeedback show={showSuccess} onComplete={() => setShowSuccess(false)} />
      <PaywallModal 
        isOpen={showPaywall}
        freeDailyLimit={(profile?.plan || 'free') === 'free'} dailyPracticeLimit={isLimitReached('write')} 
        onClose={() => setShowPaywall(false)} 
        skill="write"
        onUpgrade={() => { navigate('/app/pricing'); setShowPaywall(false); }}
        onUseCredits={executeUseCredits}
        customTitle={paywallProps?.title}
        customSubtext={paywallProps?.subtext}
      />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-2 flex items-center gap-3 italic">
            <PenTool className="text-primary" /> WRITE<span className="text-primary italic">EZ</span>
          </h2>
          <p className="text-white/40 uppercase tracking-[0.3em] text-xs font-bold">
            {PART_INFO[activePart].desc}
          </p>
        </div>

        <div className="grid grid-cols-3 bg-white/5 p-1 rounded-xl border border-white/10 max-w-full">
          {(['PART 1', 'PART 2', 'PART 3'] as const).map((part) => (
            <button
              key={part}
              disabled={(!!spmTask && !feedback && text.length > 50) || isGeneratingTask || isAnalyzing}
              onClick={() => {
                if (assessmentInFlight.current) return;
                const proceed = () => {
                  setConfirmDialog(null);
                  setActivePart(part);
                  setSpmTask(null);
                  setFeedback(null);
                  setText('');
                  setError(null);
                  setIsFullEssayMode(false);
                };

                if (text.length > 50 && !feedback) {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Switch Part?',
                    message: 'Switching parts will clear your current draft. Continue?',
                    type: 'warning',
                    confirmText: 'Switch Part',
                    onConfirm: proceed
                  });
                } else {
                  proceed();
                }
              }}
              className={`px-3 py-2 md:px-6 md:py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:grayscale flex flex-col items-center min-w-0 min-h-11 ${
                activePart === part 
                ? 'bg-primary text-obsidian shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] italic' 
                : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-[10px] md:text-[10px] font-black uppercase tracking-tighter leading-none">{part}</span>
              <span className={`text-[8px] md:text-[8px] font-bold uppercase tracking-widest mt-0.5 opacity-60 ${activePart === part ? 'text-obsidian' : 'text-white/30'}`}>
                {PART_INFO[part].label}
              </span>
            </button>
          ))}
        </div>
      </header>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4 pointer-events-none"
          >
            <div className="bg-obsidian/90 backdrop-blur-xl border border-red-500/50 p-5 rounded-3xl shadow-[0_20px_50px_-10px_rgba(239,68,68,0.3)] flex items-center gap-4 pointer-events-auto">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="text-red-500" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-1">System Notice</h4>
                <p className="text-xs font-bold text-white leading-snug">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Task Area */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
            <div className="glass-card p-4 sm:p-8 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Mail size={120} />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-primary font-black italic text-xl tracking-tight leading-none mb-1">
                      {activePart} [20 marks]
                    </h3>
                    <div className="flex items-center gap-2">
                       <p className="text-white/40 text-[11px] md:text-[10px] font-bold uppercase tracking-widest leading-none">You must answer this question.</p>
                       <div className="flex items-center gap-2 flex-wrap">
                         <span className="text-[9px] md:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-white/40">
                           {activePart === 'PART 1' && !isGeneratingTask && spmTask && PART1_QUESTION_BANK.some(q => q.emailBody === spmTask.emailBody) 
                             ? `Bank: ${PART1_QUESTION_BANK.filter(q => q.theme === spmTask.theme && usedPart1Indices.includes(PART1_QUESTION_BANK.indexOf(q))).length}/20` 
                             : activePart === 'PART 2' && !isGeneratingTask && spmTask && PART2_QUESTION_BANK.some(q => q.title === spmTask.title)
                               ? `Bank: ${PART2_QUESTION_BANK.filter(q => q.theme === spmTask.theme && usedPart2Indices.includes(PART2_QUESTION_BANK.indexOf(q))).length}/20`
                               : 'AI Generated'}
                         </span>
                         <button 
                           onClick={() => setShowRubric(true)}
                           className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors border-b border-primary/20 pb-0.5"
                         >
                           <Info size={8} /> Examiner Rubric
                         </button>
                       </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsOfflineMode(!isOfflineMode)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all ${isOfflineMode ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 text-white/30 hover:text-white'}`}
                      title={isOfflineMode ? "Running in Offline Mode (Using local question bank)" : "Online Mode (Gemini AI enabled)"}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${isOfflineMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`} />
                      <span className="text-[8px] font-black uppercase tracking-widest">{isOfflineMode ? 'Offline' : 'Online'}</span>
                    </button>
                    <button 
                      onClick={handleGenerateTaskWithLimit}
                      disabled={isGeneratingTask || isAnalyzing}
                      className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white/50"
                      title="New Scenario"
                    >
                      <RefreshCw size={16} className={isGeneratingTask ? 'animate-spin' : ''} />
                    </button>
                  </div>
                </div>

                {activePart === 'PART 2' && (spmTask || isGeneratingTask) && !feedback && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Practice focus</p>
                    <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 max-w-full">
                      {(['AUTO', 'Full', 'Introduction', 'Body', 'Conclusion'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            if (mode === 'Full' && (plan === 'free'||profile?.fullTestAccess===false)) {
                              alert("Full Essay Analysis is locked for free users. Please upgrade your plan to access this feature.");
                              return;
                            }
                            setPart2SubMode(mode);
                          }}
                          className={`shrink-0 min-w-[70px] md:min-w-0 flex-1 py-2 md:py-1.5 rounded-lg text-[9px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all ${
                            part2SubMode === mode 
                            ? 'bg-primary text-obsidian shadow-lg italic' 
                            : 'text-white/30 hover:text-white'
                          }`}
                        >
                          {mode === 'AUTO' ? 'RAND' : mode === 'Introduction' ? 'INTRO' : mode.substring(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePart === 'PART 3' && (spmTask || isGeneratingTask) && !feedback && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">Practice step</p>
                    <div className="flex flex-wrap bg-white/5 p-1 rounded-xl border border-white/5 max-w-full">
                      {(['AUTO', 'Full', 'Introduction', 'Body', 'Conclusion'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => {
                            if (mode === 'Full' && (plan === 'free'||profile?.fullTestAccess===false)) {
                              alert("Full Essay Analysis is locked for free users. Please upgrade your plan to access this feature.");
                              return;
                            }
                            setPart3SubMode(mode);
                          }}
                          className={`shrink-0 min-w-[70px] md:min-w-0 flex-1 py-2 md:py-1.5 rounded-lg text-[9px] md:text-[8px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all ${
                            part3SubMode === mode 
                            ? 'bg-primary text-obsidian shadow-lg italic' 
                            : 'text-white/30 hover:text-white'
                          }`}
                        >
                          {mode === 'AUTO' ? 'RAND' : mode === 'Introduction' ? 'INTRO' : mode.substring(0, 4)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activePart === 'PART 2' && (
                  <div className="pt-6 border-t border-white/5 space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <FileText size={10} className="text-primary" />
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Part 2 Blueprint</p>
                      </div>
                      <p className="text-[10px] font-black text-primary italic">
                        {Math.round((Object.values(essayComponents).filter(Boolean).length / 5) * 100)}%
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        { id: 'intro', label: 'Introduction', mode: 'Introduction' as const },
                        { id: 'body1', label: 'Body P1 (Point 1)', mode: 'Body' as const, pIdx: 0 },
                        { id: 'body2', label: 'Body P2 (Point 2)', mode: 'Body' as const, pIdx: 1 },
                        { id: 'body3', label: 'Body P3 (Point 3)', mode: 'Body' as const, pIdx: 2 },
                        { id: 'conclusion', label: 'Conclusion', mode: 'Conclusion' as const }
                      ].map((part) => {
                        const isDone = !!essayComponents[part.id as keyof EssayComponents];
                        const isActive = part2SubMode === part.mode && (part.pIdx === undefined || selectedPointIdx === part.pIdx);
                        
                        return (
                          <button
                            key={part.id}
                            onClick={() => {
                              setPart2SubMode(part.mode);
                              if (part.pIdx !== undefined) setSelectedPointIdx(part.pIdx);
                              setSpmTask(prev => prev ? { ...prev, practiceMode: part.mode } : null);
                              setIsFullEssayMode(false);
                              setFeedback(null);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              isActive
                              ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                              : isDone
                                ? 'bg-white/5 border-primary/20 text-white/80'
                                : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg border ${
                                isDone ? 'bg-primary border-primary text-obsidian' : 'bg-white/5 border-white/10'
                              }`}>
                                {isDone ? <CheckCircle2 size={12} /> : <FileText size={12} />}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{part.label}</span>
                            </div>
                            {isDone && <span className="text-[8px] font-black text-primary/60 italic uppercase tracking-widest">Saved</span>}
                          </button>
                        );
                      })}
                    </div>

                    {Object.values(essayComponents).filter(Boolean).length >= 1 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setAssemblyMode(true)}
                          className={`w-full py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-2 ${
                            Object.values(essayComponents).filter(Boolean).length === 5
                            ? 'bg-primary text-obsidian shadow-[0_15px_30px_-10px_rgba(var(--primary-rgb),0.5)] hover:scale-[1.02]'
                            : 'bg-white/10 text-white/40 border border-white/10 hover:bg-white/20'
                          }`}
                        >
                          <Sparkles size={14} />
                          {Object.values(essayComponents).filter(Boolean).length === 5 ? 'Review Full Essay & Grade' : 'Preview My Assembly'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activePart === 'PART 3' && (
                  <div className="pt-6 border-t border-white/5 space-y-5">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={10} className="text-primary" />
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.2em]">Part 3 Blueprint</p>
                      </div>
                      <p className="text-[10px] font-black text-primary italic">
                        {Math.round((Object.values(part3EssayComponents).filter(Boolean).length / 5) * 100)}%
                      </p>
                    </div>

                    <div className="space-y-3">
                       {[
                        { id: 'intro', label: 'Introduction', mode: 'Introduction' as const },
                        { id: 'body1', label: 'First Supporting Para', mode: 'Body' as const, pIdx: 0 },
                        { id: 'body2', label: 'Second Supporting Para', mode: 'Body' as const, pIdx: 1 },
                        { id: 'body3', label: 'Third Supporting Para', mode: 'Body' as const, pIdx: 2 },
                        { id: 'conclusion', label: 'Concluding Sentiment', mode: 'Conclusion' as const }
                      ].map((part) => {
                        const isDone = !!part3EssayComponents[part.id as keyof EssayComponents];
                        const isActive = part3SubMode === part.mode && (part.pIdx === undefined || selectedPointIdx === part.pIdx);
                        
                        return (
                          <button
                            key={part.id}
                            onClick={() => {
                              setPart3SubMode(part.mode);
                              if (part.pIdx !== undefined) setSelectedPointIdx(part.pIdx);
                              setSpmTask(prev => prev ? { ...prev, practiceMode: part.mode } : null);
                              setIsFullEssayMode(false);
                              setFeedback(null);
                            }}
                            className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                              isActive
                              ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                              : isDone
                                ? 'bg-white/5 border-primary/20 text-white/80'
                                : 'bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg border ${
                                isDone ? 'bg-primary border-primary text-obsidian' : 'bg-white/5 border-white/10'
                              }`}>
                                {isDone ? <CheckCircle2 size={12} /> : <MessageSquare size={12} />}
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest">{part.label}</span>
                            </div>
                            {isDone && <span className="text-[8px] font-black text-primary/60 italic uppercase tracking-widest">Saved</span>}
                          </button>
                        );
                      })}
                    </div>

                    {Object.values(part3EssayComponents).filter(Boolean).length >= 1 && (
                      <div className="pt-2">
                        <button
                          onClick={() => setAssemblyMode(true)}
                          className={`w-full py-4 rounded-3xl text-[11px] font-black uppercase tracking-[0.2em] italic transition-all flex items-center justify-center gap-2 ${
                            Object.values(part3EssayComponents).filter(Boolean).length === 5
                            ? 'bg-primary text-obsidian shadow-[0_15px_30px_-10px_rgba(var(--primary-rgb),0.5)] hover:scale-[1.02]'
                            : 'bg-white/10 text-white/40 border border-white/10 hover:bg-white/20'
                          }`}
                        >
                          <Sparkles size={14} />
                          {Object.values(part3EssayComponents).filter(Boolean).length === 5 ? 'Review Full Essay & Grade' : 'Preview My Assembly'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                {(activePart === 'PART 1' || activePart === 'PART 2' || activePart === 'PART 3') && !spmTask && !isGeneratingTask && (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-6 bg-white/[0.02] rounded-3xl border border-dashed border-white/10 px-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                       {activePart === 'PART 1' ? <Mail size={32} /> : <FileText size={32} />}
                    </div>
                    <div>
                      <h4 className="text-lg font-black italic text-white tracking-tight">Ready to Practice {activePart}?</h4>
                      <p className="text-[9px] font-black uppercase text-white/20 tracking-widest mt-1 italic text-center">Step 1: Select Theme</p>
                    </div>

                    <div className="w-full space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          'People and Culture', 
                          'Health and Environment', 
                          'Science and Technology', 
                          'Spending and Financial Awareness'
                        ].map(theme => (
                          <button
                            key={theme}
                            disabled={!!spmTask && !feedback}
                            onClick={() => setSelectedTheme(theme)}
                            className={`px-4 py-5 rounded-xl text-[10px] md:text-[8px] font-black uppercase tracking-[0.15em] border transition-all leading-tight text-center flex items-center justify-center min-h-[60px] ${
                              selectedTheme === theme 
                              ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]' 
                              : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'
                            }`}
                          >
                            {theme}
                          </button>
                        ))}
                      </div>
                      
                      {activePart === 'PART 3' && (
                        <div className="space-y-3 pt-4 border-t border-white/5 text-left">
                          <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1 italic">Step 2: Choose Essay Format</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {(['Article', 'Story', 'Review', 'Speech', 'Report'] as const).map(type => (
                              <button
                                key={type}
                                disabled={!!spmTask && !feedback}
                                onClick={() => setPart3Type(type)}
                                className={`px-3 py-4 rounded-lg text-[10px] md:text-[8px] font-black uppercase tracking-widest border transition-all ${
                                  part3Type === type 
                                  ? 'bg-primary/20 border-primary text-primary shadow-lg italic' 
                                  : 'bg-white/5 border-transparent text-white/20 hover:text-white/40 hover:bg-white/[0.08]'
                                }`}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 py-2">
                        <div className="h-[1px] flex-1 bg-white/5" />
                        <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.3em]">Theme Rotation Engine</span>
                        <div className="h-[1px] flex-1 bg-white/5" />
                      </div>

                      <button 
                        onClick={handleGenerateTaskWithLimit}
                        disabled={isGeneratingTask || (activePart === 'PART 3' && !part3Type)}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-3 animate-pulse hover:animate-none disabled:opacity-50"
                      >
                        {isGeneratingTask ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        {activePart === 'PART 3' && part3Type 
                          ? `Generate ${selectedTheme.split(' ')[0]} ${part3Type}` 
                          : `Generate ${selectedTheme.split(' ')[0]} Task`
                        }
                      </button>
                    </div>
                  </div>
                )}

                {activePart === 'PART 1' && (spmTask || isGeneratingTask) && (
                  <>
                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase text-white/40 tracking-widest leading-none">Question 1</p>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-sm font-bold leading-relaxed">
                          <span className="text-primary italic">Situation:</span> You received an email from your friend, <span className="text-white uppercase"> {spmTask?.friendName || '...'}</span>, who needs help with <span className="text-white">"{spmTask?.theme || '...'}"</span>.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-black uppercase text-white/40 tracking-widest leading-none">Email Stimulus</p>
                      <div className="glass-card bg-card p-6 rounded-2xl border border-white/10 italic text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {isGeneratingTask ? (
                          <div className="flex items-center gap-3 py-4">
                            <Loader2 className="animate-spin text-primary" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Checking your writing...</span>
                          </div>
                        ) : (
                          spmTask?.emailBody
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-dashed border-white/10">
                      <p className="text-[11px] font-bold text-white/60 leading-relaxed italic">
                        Now write an email to your friend in about <span className="text-primary font-black text-xs">80 words</span>. Write your answer below.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <div className="flex flex-col gap-1">
                        <span>To:</span>
                        <span className="text-white/60 lowercase font-bold font-mono">{spmTask?.friendEmail || '...'}</span>
                      </div>
                      <div className="flex flex-col gap-1 relative">
                        <span>Subject:</span>
                        <span className="text-white/60 font-bold">{spmTask?.subject || '...'}</span>
                        {/* Hidden Fill Button for Quick Testing */}
                        <button 
                          onClick={() => {
                            if (spmTask && spmTask.practiceMode === 'Full') {
                              setText(`To: ${spmTask.friendEmail}\nSubject: ${spmTask.subject}\n\nHi ${spmTask.friendName},\n\nIt's great to hear from you! Regarding your questions about ${spmTask.theme}, here is my advice.\n\nFirst, I think you should definitely try to spend more time practicing every day. Maybe you can set a schedule to stay focused? \n\nAlso, for your second question, I would suggest asking your teacher for help. They know the syllabus best and can give you great tips!\n\nI hope this helps you feel more prepared. Good luck with everything!\n\nBye for now!`);
                            }
                          }}
                          className="absolute -bottom-8 right-0 w-8 h-8 opacity-0 hover:opacity-10 cursor-pointer flex items-center justify-center text-[8px] border border-white/20 rounded-full"
                          title="Debug: Fill Sample"
                        >
                          FILL
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {activePart === 'PART 2' && (
                  <div className="space-y-6">
                    <div className="border-b border-white/5 pb-4">
                      <h4 className="text-primary font-black italic text-lg tracking-tight leading-none mb-1">PART 2</h4>
                      <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-none">[20 marks]</p>
                    </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">Question 2</p>
                        <div className="glass-card bg-card/50 p-6 rounded-2xl border border-white/10 italic text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {isGeneratingTask ? (
                            <div className="flex items-center gap-3 py-4">
                              <Loader2 className="animate-spin text-primary" size={20} />
                              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Rendering Modular Scope...</span>
                            </div>
                          ) : (
                            <>
                              {spmTask?.context?.split('\n\nPractice Task:')[0]}
                              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl shadow-lg neon-glow">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Practice Task:</p>
                                <p className="text-sm font-black text-white mt-1 italic">
                                  {spmTask?.context?.includes('Practice Task:') 
                                    ? spmTask.context.split('Practice Task:')[1].trim()
                                    : `Write the ${spmTask?.practiceMode} for this essay.`}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <MessageSquare size={12} className="text-primary" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">In your essay, write about:</p>
                           </div>
                           {spmTask?.practiceMode === 'Body' && (
                             <span className="text-[8px] font-black bg-primary text-obsidian px-2 py-0.5 rounded-full border border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]">PEEL METHOD</span>
                           )}
                        </div>
                        {spmTask?.practiceMode !== 'Body' ? (
                          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                             {(spmTask?.bulletPoints || ['Point 1', 'Point 2', 'Point 3']).map((point, idx) => (
                                <div key={idx} className="flex gap-3 text-[11px] font-bold text-white/60">
                                   <span className="text-primary opacity-50">-</span>
                                   <span>{point}</span>
                                </div>
                             ))}
                          </div>
                        ) : (
                          <ul className="space-y-3">
                            {(spmTask?.bulletPoints || ['Point 1', 'Point 2', 'Point 3']).map((point, idx) => (
                              <li key={idx} className="relative group">
                                <button
                                  onClick={() => setSelectedPointIdx(idx)}
                                  className={`w-full flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all text-left ${
                                    selectedPointIdx === idx 
                                    ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] scale-[1.02]' 
                                    : 'bg-white/5 border-white/5 group-hover:border-white/10'
                                  } cursor-pointer`}
                                >
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black italic border shrink-0 ${
                                    selectedPointIdx === idx 
                                    ? 'bg-primary border-primary text-obsidian' 
                                    : 'bg-white/5 border-white/10 text-white/40 group-hover:border-white/30'
                                  }`}>
                                    {idx + 1}
                                  </div>
                                  <div className="space-y-1">
                                    {selectedPointIdx === idx && (
                                      <p className="text-[8px] font-black uppercase text-primary tracking-widest italic animate-pulse">Now Elaborating</p>
                                    )}
                                    <span className={`text-sm font-bold leading-relaxed ${selectedPointIdx === idx ? 'text-white' : 'text-white/80'}`}>
                                      {point}
                                    </span>
                                  </div>
                                  {selectedPointIdx === idx && (
                                    <CheckCircle2 size={16} className="text-primary ml-auto flex-shrink-0 mt-1" />
                                  )}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                        {spmTask?.practiceMode === 'Body' && selectedPointIdx === null && (
                          <div className="flex items-center gap-2 mt-3 p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                            <Info size={12} className="text-orange-400" />
                            <p className="text-[9px] font-black uppercase text-orange-400 tracking-widest leading-none">
                              Pick a point to expand
                            </p>
                          </div>
                        )}
                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 group hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-primary transition-colors">
                            <BookOpen size={12} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Exam Guidance</p>
                          </div>
                          <p className="text-[10px] font-bold text-white/40 leading-relaxed italic group-hover:text-white/60">
                            Write your essay in <span className="text-primary">125–150 words</span>. Ensure you use an appropriate style and address the task prompt accurately.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activePart === 'PART 3' && (spmTask || isGeneratingTask) && (
                    <div className="space-y-6">
                      <div className="border-b border-white/5 pb-4">
                        <h4 className="text-primary font-black italic text-lg tracking-tight leading-none mb-1">PART 3: EXTENDED WRITING</h4>
                        <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest leading-none">[20 marks]</p>
                      </div>

                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none">Task Prompt ({spmTask?.essayType})</p>
                        <div className="glass-card bg-card/50 p-6 rounded-2xl border border-white/10 italic text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                          {isGeneratingTask ? (
                            <div className="flex items-center gap-3 py-4">
                              <Loader2 className="animate-spin text-primary" size={20} />
                              <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Designing Challenge...</span>
                            </div>
                          ) : (
                            <>
                              {spmTask?.context?.split('\n\nPractice Task:')[0]}
                              {spmTask?.practiceMode && spmTask.practiceMode !== 'Full' && (
                                <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl shadow-lg neon-glow">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Practice Task:</p>
                                  <p className="text-sm font-black text-white mt-1 italic">
                                    {spmTask?.context?.includes('Practice Task:') 
                                      ? spmTask.context.split('Practice Task:')[1].trim()
                                      : `Write the ${spmTask?.practiceMode} for this ${spmTask?.essayType || 'essay'}.`}
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3 pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <MessageSquare size={12} className="text-primary" />
                              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 italic">Writer's Guide:</p>
                           </div>
                           <button 
                             onClick={() => setShowStructures(!showStructures)}
                             className="text-[10px] md:text-[8px] font-black bg-white/5 text-white/40 px-3 py-2 md:px-2 md:py-1 rounded border border-white/10 hover:text-white transition-colors"
                           >
                             {showStructures ? 'HIDE STRUCTURE' : 'SHOW STRUCTURE'}
                           </button>
                        </div>

                        {showStructures && spmTask?.essayType && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-white/5 p-5 rounded-2xl border border-white/5"
                          >
                             <ul className="space-y-3">
                                {PART3_STRUCTURES[spmTask.essayType]?.map((step, i) => (
                                  <li key={i} className="flex gap-3 text-[11px] font-bold text-white/60">
                                     <span className="text-primary shrink-0 opacity-50">{i + 1}.</span>
                                     <span>{step}</span>
                                  </li>
                                ))}
                             </ul>
                          </motion.div>
                        )}

                        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 group hover:border-primary/30 transition-colors">
                          <div className="flex items-center gap-2 mb-2 text-white/40 group-hover:text-primary transition-colors">
                            <BookOpen size={12} />
                            <p className="text-[9px] font-black uppercase tracking-widest">Extended Writing Guide</p>
                          </div>
                          <p className="text-[10px] font-bold text-white/40 leading-relaxed italic group-hover:text-white/60">
                            Write your response in <span className="text-primary uppercase tracking-tighter">200–250 words</span>. Use an appropriate style and structure for a {spmTask?.essayType}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Sheet moved to feedback section */}
          </div>

        {/* Editor Area */}
        <div className="lg:col-span-7 space-y-6 relative">
          {assemblyMode ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="glass-card p-4 sm:p-8 space-y-6">
                <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-white">Full Essay <span className="text-primary italic">Assembly</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Review your component integration</p>
                  </div>
                  <button 
                    onClick={() => setAssemblyMode(false)}
                    className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors text-white/40 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                  {(activePart === 'PART 2' ? [
                    { id: 'intro', label: 'Introduction' },
                    { id: 'body1', label: 'Body P1' },
                    { id: 'body2', label: 'Body P2' },
                    { id: 'body3', label: 'Body P3' },
                    { id: 'conclusion', label: 'Conclusion' }
                  ] : [
                    { id: 'intro', label: 'Introduction' },
                    { id: 'body1', label: 'Point 1' },
                    { id: 'body2', label: 'Point 2' },
                    { id: 'body3', label: 'Point 3' },
                    { id: 'conclusion', label: 'Conclusion' }
                  ]).map((part) => {
                    const content = activePart === 'PART 2' 
                      ? essayComponents[part.id as keyof EssayComponents]
                      : part3EssayComponents[part.id as keyof EssayComponents];
                    
                    return (
                      <div key={part.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-1 h-1 rounded-full ${content ? 'bg-primary' : 'bg-white/10'}`} />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white/30">{part.label}</span>
                        </div>
                        <p className={`text-lg leading-relaxed ${content ? 'text-white/90' : 'text-white/10 italic'}`}>
                          {content || 'Section not yet drafted.'}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Expected Length</span>
                    <span className="text-xl font-black italic text-primary">
                      {activePart === 'PART 2' ? '125-150' : '200-250'} <span className="text-white/20 not-italic ml-1">Words</span>
                    </span>
                  </div>
                  
                  <div className="flex gap-4 w-full md:w-auto">
                    <button
                      onClick={() => setAssemblyMode(false)}
                      className="flex-1 md:flex-none px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                    >
                      Refine Drafts
                    </button>
                    <button
                      onClick={() => {
                        if (plan === 'free') {
                          alert("Full Essay Grading is locked for free users. Please upgrade your plan to access this feature.");
                          return;
                        }
                        const assembledText = activePart === 'PART 2' ? handleBuildFullEssay() : handleBuildPart3FullEssay();
                        setAssemblyMode(false);
                        handleAnalyze(assembledText);
                      }}
                      className="flex-1 md:flex-none px-8 py-4 bg-primary text-obsidian rounded-2xl font-black uppercase tracking-widest text-xs italic shadow-[0_15px_30px_-10px_rgba(var(--primary-rgb),0.5)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={18} />
                      Grade Full Essay
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
          <div className="glass-card p-2 overflow-hidden border-white/10 ring-1 ring-white/5">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                {isFullEssayMode ? 'FULL ESSAY COMPOSITION' : 'EZ Simulator Output (Manuscript)'}
              </span>
              <div className="flex gap-4 items-center">
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  isFullEssayMode 
                    ? (wordCount >= 125 && wordCount <= 150 ? 'text-primary' : 'text-orange-400')
                    : activePart === 'PART 1'
                      ? (wordCount >= 70 && wordCount <= 100 ? 'text-primary' : 'text-orange-400')
                      : (wordCount < (isSPM ? 30 : 150) ? 'text-orange-400' : 'text-primary')
                }`}>
                  Words: {wordCount} {
                    isFullEssayMode ? '/ 125-150' : 
                    activePart === 'PART 1' ? '/ ~80' :
                    (isSPM ? '/ ~40' : '/ 350')
                  }
                </span>
                {isFullEssayMode && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/20 rounded border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${Object.values(essayComponents).filter(Boolean).length === 5 ? 'bg-green-400' : 'bg-orange-400'}`} />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/40">
                      {Object.values(essayComponents).filter(Boolean).length === 5 ? 'Complete' : 'Incomplete'}
                    </span>
                  </div>
                )}
                {activePart === 'PART 1' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/20 rounded border border-white/10">
                    <span className={`w-1.5 h-1.5 rounded-full ${wordCount >= 70 && wordCount <= 100 ? 'bg-green-400' : wordCount > 100 ? 'bg-red-400' : 'bg-orange-400'}`} />
                    <span className="text-[8px] font-black uppercase tracking-tighter text-white/40">
                      {wordCount >= 70 && wordCount <= 100 ? 'Optimal' : wordCount > 100 ? 'Too Long' : 'Drafting'}
                    </span>
                  </div>
                )}
                <button 
                  onClick={() => setText('')}
                  className="text-white/20 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {spmTask?.partialEssay && !isFullEssayMode && (
              <div className="px-8 pt-8 pb-0">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative">
                  <div className="absolute top-0 right-0 p-3 flex items-center gap-2">
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-primary italic">Draft In Progress</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  </div>
                  <div className="prose prose-invert max-w-none text-white/60 text-sm leading-relaxed whitespace-pre-wrap italic">
                    {spmTask.partialEssay}
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-primary text-obsidian rounded-full text-[8px] font-black uppercase tracking-widest italic shadow-lg">
                    <ChevronRight size={10} />
                    Continue writing from here
                  </div>
                </div>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                isSPM 
                  ? activePart === 'PART 1' 
                    ? "To: [Recipient]\nSubject: [Subject]\n\nHi [Name],\n..." 
                    : `Continue writing your ${spmTask?.practiceMode || 'essay'} here...`
                  : "Begin your essay here... (Minimum 30 words for AI analysis)"
              }
              className="w-full min-h-[300px] h-[45vh] md:h-[600px] p-6 md:p-8 bg-transparent text-white/90 focus:outline-none resize-none font-sans text-base md:text-lg leading-relaxed placeholder:text-white/10"
            />
          </div>

          {isFullEssayMode && (
             <div className="absolute top-0 right-0 p-4 animate-pulse pointer-events-none">
               <Sparkles className="text-primary opacity-20" size={40} />
             </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-2xl">
              <div>
                <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles size={14} className={useDeepFeedback ? "text-primary" : "text-white/40"} />
                  Deep Feedback Mode
                </h4>
                <p className="text-xs text-white/40 mt-1">Get comprehensive analysis, advanced vocabulary suggestions, and detailed structural rewrite using AI.</p>
              </div>
              <button
                onClick={() => {
                  if (plan === 'free') {
                    setShowPaywall(true);
                  } else {
                    setUseDeepFeedback(!useDeepFeedback);
                  }
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${useDeepFeedback ? 'bg-primary' : 'bg-white/20'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${useDeepFeedback ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <ProgressSaveStatus progress={progress} />
            <button type="button" disabled={isAnalyzing || progress.attempt?.status === 'saving'} onClick={() => finishPractice()} className="btn-secondary min-h-12">Finish practice</button>
            <div className="flex gap-4">
               <button 
                onClick={() => {
                  if (isOfflineMode && plan !== 'free') {
                    toast.error("AI Analysis requires Internet Connection.", {
                      icon: '🌐',
                      style: {
                        background: '#1a1a1a',
                        color: '#fff',
                        border: '1px solid #f97316'
                      }
                    });
                    return;
                  }
                  handleAnalyze();
                }}
                disabled={isAnalyzing || text.length < 5}
                className={`flex-1 btn-primary flex items-center justify-center gap-3 ${text.length < 5 ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {plan === 'free' ? 'View General Feedback' : isAnalyzing ? 'Decoding Structures...' : isFullEssayMode ? 'Grade Final Essay' : 'Analyze Component'}
              </button>
              {!isFullEssayMode && (activePart === 'PART 2' || activePart === 'PART 3') && spmTask && !assemblyMode && (
                <button
                  onClick={handleManualSaveComponent}
                  disabled={text.length < 5 || isAnalyzing}
                  className="btn-secondary flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Save Component
                </button>
              )}
              {isFullEssayMode && (
                <button 
                  onClick={() => setIsFullEssayMode(false)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <X size={16} /> Return to Parts
                </button>
              )}
              {feedback && feedback.score !== undefined && (
                <button 
                  onClick={handleSave}
                  className="btn-secondary flex items-center gap-2"
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Sync Log
                </button>
              )}
            </div>
          </div>
          
          {text.length < 5 && !assemblyMode && (
            <div className="flex items-center gap-2 text-white/30 text-xs px-2 italic font-bold tracking-tight">
              <AlertCircle size={14} className="text-orange-400" /> Please provide some text to begin the evaluation process.
            </div>
          )}

          {/* Assembly Mode Action Bar for Conclusion Section */}
          {!isFullEssayMode && !assemblyMode && spmTask?.practiceMode === 'Conclusion' && text.length > 20 && !feedback && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Conclusion Drafted!</p>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setAssemblyMode(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/20 transition-all"
                >
                  Review Full Essay
                </button>
                <button
                  onClick={() => {
                     const assembledText = activePart === 'PART 2' ? handleBuildFullEssay() : handleBuildPart3FullEssay();
                     handleAnalyze(assembledText);
                  }}
                  className="flex-1 md:flex-none px-4 py-2 bg-primary text-obsidian text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-all italic flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  Quick Grade
                </button>
              </div>
            </div>
          )}

          {/* Feedback Display */}
          {feedback && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 pt-8 border-t border-white/5"
              >
                {/* Success Notification for Saved Parts */}
                <AnimatePresence>
                  {justSavedPart && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, scale: 0.95 }}
                      animate={{ opacity: 1, height: 'auto', scale: 1 }}
                      exit={{ opacity: 0, height: 0, scale: 0.95 }}
                      className="bg-primary/20 border border-primary/40 rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.3)] mb-6 overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-obsidian shadow-lg">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none mb-1">Component Mastered</p>
                          <h4 className="text-sm font-black text-white">{justSavedPart} saved to Blueprint!</h4>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
                         <p className="text-[8px] font-black uppercase tracking-widest text-primary animate-pulse">Blueprint: {Object.values(essayComponents).filter(Boolean).length}/5</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                 {/* SPM Official Assessment Report */}
                 {isSPM && feedback.marks && (
                    <motion.div 
                      key={isFullEssayMode ? 'full' : 'part'}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass-card p-4 sm:p-10 border-primary/40 bg-primary/[0.03] relative overflow-hidden ring-1 ring-primary/20 shadow-[0_0_50px_-12px_rgba(var(--primary-rgb),0.1)]"
                    >
                       <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none rotate-12">
                         <BookOpen size={200} />
                       </div>

                       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-10 border-b border-white/5 pb-10 relative z-10">
                          <div>
                             <div className="flex items-center gap-3 text-primary mb-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <BookOpen size={24} />
                                </div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">
                                {isFullEssayMode ? 'Official SPM Grade' : 'Component Evaluation'}
                             </h3>
                             </div>
                             <p className="text-[11px] font-black uppercase tracking-[0.4em] text-white/30">
                                {isFullEssayMode ? 'Full Essay Assessment Matrix' : 'Modular Scoring Analysis'}
                             </p>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="text-right">
                               <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Assessment Level</p>
                               <p className={`text-xl font-black italic uppercase tracking-tighter ${
                                 feedback.level === 'Excellent' ? 'text-primary' : 
                                 feedback.level === 'Average' ? 'text-blue-400' : 'text-red-400'
                               }`}>
                                 {feedback.level === 'Excellent' ? 'Band 5 (Strong English)' : 
                                  feedback.level === 'Average' ? 'Band 3 (Standard)' : 'Band 1 (Developing)'}
                               </p>
                            </div>
                            <div className="flex items-end gap-2 bg-primary text-obsidian px-8 py-4 rounded-3xl shadow-[0_10px_30px_-10px_rgba(var(--primary-rgb),0.5)] transform -rotate-2">
                               <span className="text-2xl sm:text-5xl font-black italic tracking-tighter leading-none">{feedback.marks.total}</span>
                               <span className="text-sm font-bold uppercase tracking-widest opacity-60 mb-1">/ 20</span>
                            </div>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 relative z-10">
                          {[
                            { label: 'Content', val: feedback.marks.content, max: 5, color: 'text-primary' },
                            { label: 'Comm. Achievement', val: feedback.marks.commAchievement, max: 5, color: 'text-blue-400' },
                            { label: 'Organisation', val: feedback.marks.organisation, max: 5, color: 'text-purple-400' },
                            { label: 'Language', val: feedback.marks.language, max: 5, color: 'text-orange-400' },
                          ].map((m) => (
                            <div key={m.label} className="bg-white/[0.03] p-6 rounded-2xl border border-white/5 group hover:border-primary/20 transition-all hover:translate-y-[-2px]">
                              <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 group-hover:text-white/40 transition-colors">{m.label}</p>
                              <div className="flex items-end gap-1.5">
                                 <span className={`text-3xl font-black italic tracking-tighter ${m.color}`}>{m.val}</span>
                                 <span className="text-xs font-bold text-white/10 mb-1">/ {m.max}</span>
                              </div>
                              <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(m.val / m.max) * 100}%` }}
                                  className={`h-full ${
                                    m.val >= 4 ? 'bg-primary' : 
                                    m.val >= 3 ? 'bg-blue-400' : 'bg-red-400'
                                  }`}
                                />
                              </div>
                            </div>
                          ))}
                       </div>

                       <div className="p-5 bg-white/5 rounded-2xl border border-white/5 border-dashed relative z-10 flex flex-col items-center gap-3">
                          <p className="text-[10px] font-bold text-white/40 leading-relaxed italic text-center">
                            Marks are awarded based on the official <span className="text-primary">SPM Paper 2 Scoring Standards</span>. 
                            {isFullEssayMode ? ' This is a full-essay evaluation including point development.' : ' This is a modular component check.'}
                          </p>
                          {isFullEssayMode && (
                             <div className="flex gap-4">
                               <div className="flex items-center gap-1.5">
                                 <div className={`w-1.5 h-1.5 rounded-full ${wordCount >= 125 && wordCount <= 150 ? 'bg-green-400' : 'bg-red-400'}`} />
                                 <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Length: {wordCount} words</span>
                               </div>
                               <div className="flex items-center gap-1.5">
                                 <div className={`w-1.5 h-1.5 rounded-full ${Object.values(essayComponents).filter(Boolean).length === 5 ? 'bg-green-400' : 'bg-orange-400'}`} />
                                 <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Coverage: {Object.values(essayComponents).filter(Boolean).length}/5 Parts</span>
                               </div>
                             </div>
                          )}
                       </div>
                    </motion.div>
                 )}

                 {/* Candidate Logic Guard */}
                 {!isSPM && (
                   <div className={`glass-card p-6 border-none flex flex-col justify-between ${
                     feedback.score >= 80 ? 'bg-primary text-obsidian' : 
                     feedback.score >= 50 ? 'bg-blue-500 text-white' : 
                     'bg-red-500 text-white'
                   }`}>
                      <div className="flex items-center gap-2 mb-2">
                         <User size={16} className="opacity-60" />
                         <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Analysis Mode</span>
                      </div>
                      <h4 className="text-3xl font-black italic tracking-tighter mb-4">
                        {feedback.score >= 80 ? 'Strong English Skills' : 
                         feedback.score >= 50 ? 'Intermediate Fluency' : 
                         'Foundational Skills'}
                      </h4>
                      <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase tracking-widest">
                        We checked how you organised your ideas and used words.
                      </p>
                   </div>
                 )}

                 {/* Secondary Feedback Metrics */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 glass-card p-4 sm:p-8 bg-white/5 border-white/10 flex flex-col justify-center">
                       <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                          <MessageSquare size={14} /> {isFullEssayMode ? 'Full Essay Checklist' : 'Criterion Verification'}
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {feedback.bulletCheck?.map((check: any, idx: number) => (
                             <div key={idx} className="flex items-start gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 text-xl font-bold">
                                   {check.status === '✅' ? '✓' : '✗'}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-black uppercase text-white/40 tracking-widest leading-none mb-2">{check.question}</p>
                                   <p className="text-xs font-bold text-white/80 leading-relaxed">{check.comment}</p>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Corrections & Feedback */}
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="glass-card p-4 sm:p-8 space-y-6">
                          <h4 className="text-xs font-black uppercase tracking-widest text-primary italic border-b border-white/5 pb-4">Analytical Feedback</h4>
                          <div className="space-y-6">
                             <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-2 italic">Strengths</h5>
                                <ul className="space-y-2">
                                   {feedback.feedback?.strengths?.map((s: string, idx: number) => (
                                      <li key={idx} className="text-sm font-bold text-white/70 flex items-start gap-2">
                                         <ChevronRight size={14} className="mt-0.5 text-primary" /> {s}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                             <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2 italic">Growth Points</h5>
                                <ul className="space-y-2">
                                   {feedback.feedback?.improvements?.map((i: string, idx: number) => (
                                      <li key={idx} className="text-sm font-bold text-white/70 flex items-start gap-2">
                                         <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" /> {i}
                                      </li>
                                   ))}
                                </ul>
                             </div>
                          </div>
                       </div>

                       {feedback.bonusTip && (
                          <div className="glass-card p-4 sm:p-8 bg-primary/10 border-primary/20">
                             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-2 italic">Memorisation Anchor</h4>
                             <p className="text-lg font-black italic text-white tracking-tight leading-tight">"{feedback.bonusTip}"</p>
                          </div>
                       )}

                       {feedback.userEvaluation && (
                          <div className="glass-card p-4 sm:p-8 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-indigo-500/30 overflow-hidden relative">
                             <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none transform rotate-12">
                                <Trophy size={180} />
                             </div>
                             <h4 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300 mb-6 flex items-center gap-2">
                                <Gamepad2 size={16} /> BATTLE RESULTS
                             </h4>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                                 <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold uppercase text-white/50 mb-1">XP Earned</span>
                                    <span className="text-2xl font-black text-indigo-400">+{feedback.userEvaluation.xp}</span>
                                 </div>
                                 <div className="glass-panel p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold uppercase text-white/50 mb-1">EZ Coins</span>
                                    <span className="text-2xl font-black text-yellow-400">+{feedback.userEvaluation.coins}</span>
                                 </div>
                                 <div className="glass-panel p-4 sm:col-span-2 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold uppercase text-white/50 mb-1">Badge Unlocked</span>
                                    <span className="text-lg font-black text-pink-400 neon-text-glow leading-tight">{feedback.userEvaluation.achievement}</span>
                                 </div>
                             </div>
                             <div className="bg-black/30 rounded-xl p-4 border border-white/5 relative">
                                <span className="absolute -top-3 left-4 bg-indigo-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Shareable Flex</span>
                                <p className="text-sm font-medium text-white/90 italic">{feedback.userEvaluation.shareableSnippet}</p>
                             </div>
                          </div>
                       )}
                    </div>

                    <div className="glass-card p-4 sm:p-8 border-white/10 bg-card relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                          <Sparkles size={120} />
                       </div>
                       <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-6 border-b border-white/5 pb-4 italic">
                          {isFullEssayMode ? 'The Ideal Band 5 Essay' : 'Band 5: Example Answer'}
                       </h4>
                       <div className="prose prose-invert max-w-none text-white/80 text-sm italic font-medium leading-relaxed bg-white/5 p-6 rounded-2xl border border-white/5 min-h-[300px]">
                          <ReactMarkdown>{feedback.corrections}</ReactMarkdown>
                       </div>
                    </div>
                 </div>
              </motion.div>
            </AnimatePresence>
          )}
          </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRubric && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-obsidian/95 backdrop-blur-xl"
            onClick={() => setShowRubric(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-4xl p-4 sm:p-12 border-primary/20 space-y-12 max-h-[90vh] overflow-y-auto scrollbar-hide"
              onClick={e => e.stopPropagation()}
            >
              <header className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl sm:text-5xl font-black italic tracking-tighter text-primary leading-none">SPM {activePart} <span className="text-white">RUBRIC</span></h2>
                  <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Official Assessment Matrix // Band 5 Execution</p>
                </div>
                <button 
                  onClick={() => setShowRubric(false)}
                  className="p-4 hover:bg-white/10 rounded-2xl transition-colors text-white/40 hover:text-white"
                >
                  <X size={32} />
                </button>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 <RubricCard 
                   title="Content" 
                   marks="5" 
                   desc={activePart === 'PART 3' ? "Full completion of the task, meeting all content points for the specific essay type." : "Relevant ideas and fulfillment of all task requirements."}
                   bullets={activePart === 'PART 3' ? ['All bullet points covered', 'Relevant details', 'Subject development'] : ['Answered all questions', 'Relevant ideas', 'Subject development']}
                 />
                 <RubricCard 
                   title="Comm. Achievement" 
                   marks="5" 
                   desc={activePart === 'PART 3' ? `Command of ${spmTask?.essayType} conventions and suitable register.` : "Use of appropriate tone and email format conventions."} 
                   bullets={activePart === 'PART 3' ? ['Register & Tone', 'Complex ideas used', 'Natural flow'] : ['Informal/Friendly tone', 'Standard format', 'Natural reply']}
                 />
                 <RubricCard 
                   title="Organisation" 
                   marks="5" 
                   desc={activePart === 'PART 3' ? `Clear ${spmTask?.essayType} structure with smooth linking words.` : "Smooth flow, logical order, and clear linking words."} 
                   bullets={activePart === 'PART 3' ? ['Clear paragraphs', 'Linking words', 'Logical progression'] : ['Logical flow', 'Use of linkers', 'Clear linking words']}
                 />
                 <RubricCard 
                   title="Language" 
                   marks="5" 
                   desc="Vocabulary range, grammar accuracy, and different sentence types." 
                   bullets={['Grammar control', 'Good vocabulary', 'Different sentence types']}
                 />
              </div>

              <footer className="pt-8 border-t border-white/5 text-center">
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">
                   Note: Candidates must answer ALL questions in the stimulus email to achieve full marks in Content.
                 </p>
              </footer>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Confirm Dialog Overlay */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-md w-full p-4 sm:p-8 border-white/10 space-y-6"
          >
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${
              confirmDialog.type === 'danger' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
            }`}>
              <AlertCircle size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">{confirmDialog.title}</h3>
              <p className="text-white/60 text-sm mt-2 leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-white/5 transition-all italic"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDialog.onConfirm}
                className={`flex-1 px-6 py-4 text-obsidian text-xs font-black uppercase tracking-widest rounded-2xl transition-all italic shadow-2xl ${
                  confirmDialog.type === 'danger' ? 'bg-red-500 shadow-red-500/20' : 'bg-primary shadow-primary/20'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
