import {summarizePractice} from '../lib/dashboardSummary';
import React, { useEffect, useState } from 'react';
import { Zap, Mic, PenTool, BookOpen, Headset, Plus, Bell, Calendar as CalendarIcon, CheckCircle2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, orderBy, getDocs, addDoc, deleteDoc, updateDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, getFriendlyFirebaseError } from '../lib/firebase';
import { toast } from 'react-hot-toast';
import { TaskReminder, UserProfile } from '../types';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { Achievements } from '../components/dashboard/Achievements';
import { PracticeSession } from '../types';
import { SuccessFeedback } from '../components/layout/SuccessFeedback';
import { useAccessibility } from '../lib/AccessibilityContext';
import { GeminiService } from '../services/geminiService';
import { ChevronRight } from 'lucide-react';
import { playMilestoneSound } from '../lib/audio';
import { CurriculumTrack } from '../components/muet/CurriculumSelector';
import { updateProfile } from '../lib/firebase';

const LANGUAGE_TIPS = [
  { type: 'Grammar', fact: 'Use "who" for the subject of a sentence, and "whom" for the object.' },
  { type: 'Vocabulary', fact: '"Literally" is often misused. Use it only when something actually happened, not as an exaggeration.' },
  { type: 'Grammar', fact: 'Its is a possessive pronoun, while it\'s is a contraction of "it is".' },
  { type: 'Vocabulary', fact: 'A "plethora" means a large or excessive amount of something.' },
  { type: 'Grammar', fact: 'The subjunctive mood is used to explore conditions that are contrary to fact (e.g., "If I were a rich man").' },
  { type: 'Vocabulary', fact: '"Ubiquitous" means present, appearing, or found everywhere.' },
  { type: 'Grammar', fact: 'Use "fewer" for countable things (fewer calories) and "less" for singular mass nouns (less sand).' },
  { type: 'Vocabulary', fact: '"Ennui" is a feeling of listlessness and dissatisfaction arising from a lack of occupation or excitement.' },
  { type: 'Idiom', fact: '"Bite the bullet" means to decide to do something difficult or unpleasant that one has been putting off.' },
  { type: 'Grammar', fact: 'A dangling participle modifies the wrong noun (e.g., "Walking down the street, the trees were beautiful").' },
];

interface DashboardProps {
  profile: UserProfile;
  onSelectModule: (module: string) => void;
}

export const StudyTools: React.FC<DashboardProps> = ({ profile, onSelectModule }) => {
  const { screenReaderOptimized } = useAccessibility();
  const userName = profile.displayName.split(' ')[0];
  const [isModulesLoading, setIsModulesLoading] = useState(true);
  
  const [dailyTip, setDailyTip] = useState(LANGUAGE_TIPS[0]);

  // Analytics Filters
  const [dateRange, setDateRange] = useState<number>(30);
  const [rawSessions, setRawSessions] = useState<PracticeSession[]>([]);

  // AI Recommendation State
  const [aiRecommendation, setAiRecommendation] = useState<{
    analysis: string;
    recommendations: { title: string; desc: string; type: string }[];
  } | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Reminders state
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(() => {
    try {
      const stored = localStorage.getItem('ez_active_track');
      if (stored === 'MUET' || stored === 'SPM') return stored;
    } catch {}
    return profile?.goal === 'MUET' ? 'MUET' : 'SPM';
  });

  const handleTrackSwitch = (newTrack: CurriculumTrack) => {
    setCurrentTrack(newTrack);
    try {
      localStorage.setItem('ez_active_track', newTrack);
    } catch {}
    if (profile?.uid) {
      updateProfile(profile.uid, { goal: newTrack }).catch(() => {});
    }
  };
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');
  const [newReminderType, setNewReminderType] = useState<TaskReminder['type']>('General');
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'warning' | 'danger';
    confirmText?: string;
  } | null>(null);

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    // Generate random daily tip
    const tipIndex = Math.floor(Math.random() * LANGUAGE_TIPS.length);
    setDailyTip(LANGUAGE_TIPS[tipIndex]);

    const handleOnline = () => {
      setIsOffline(false);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check for milestone streak confetti
    const milestoneStreaks = [5, 7, 14, 30, 50, 100];
    if (profile && profile.streak > 0 && milestoneStreaks.includes(profile.streak)) {
      const storageKey = `hasSeenConfetti_${profile.uid}_${profile.streak}`;
      if (!localStorage.getItem(storageKey)) {
        if (profile?.soundEnabled !== false) {
          playMilestoneSound();
        }
        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
      
        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;
      
        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
      
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
      
          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults, particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
          });
          confetti({
            ...defaults, particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
          });
        }, 250);

        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [profile?.streak, profile?.uid]);

  useEffect(() => {
    let unsubscribeReminders: (() => void) | null = null;
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        // Match the longest available date filter.
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid) {
          const userId = currentUser.uid;
          const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
          const qSessions = query(
            collection(db, `users/${userId}/sessions`),
            where('timestamp', '>=', Timestamp.fromMillis(ninetyDaysAgo)),
            orderBy('timestamp', 'asc')
          );
          // Earlier imports may use numeric dates; current saved practices use Firestore timestamps.
          const legacyQuery = query(collection(db, `users/${userId}/sessions`), where('timestamp', '>=', ninetyDaysAgo), orderBy('timestamp', 'asc'));
          const snapshots = await Promise.all([getDocs(qSessions), getDocs(legacyQuery)]);
          const sessionSnapshot = {docs: [...new Map(snapshots.flatMap(snapshot => snapshot.docs).map(document => [document.id, document])).values()]};
          
          if (!isMounted) return;
          const sessions = sessionSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp
            } as PracticeSession;
          });
          setRawSessions(sessions);

          // Listen directly to reminders subcollection
          const qReminders = query(
            collection(db, `users/${userId}/reminders`),
            orderBy('date', 'asc')
          );
          
          unsubscribeReminders = onSnapshot(qReminders, (snapshot) => {
            if (!isMounted) return;
            const rems = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as TaskReminder));
            setReminders(rems);
          }, (error) => {
            if (!isMounted) return;
            // Silent error for reminders if it's a permission issue or the user is logging out
            if (error.message.includes('permission') || error.code === 'permission-denied') {
              console.warn("Reminders access restricted or session expired.");
              return;
            }
            console.error("Reminders listener error:", error);
            try {
              handleFirestoreError(error, OperationType.LIST, `users/${userId}/reminders`);
            } catch (e) {
              toast.error(getFriendlyFirebaseError(e));
            }
          });
        } else {
          
        }
      } catch (error) {
        if (!isMounted) return;
        console.error("Error fetching dashboard data:", error);
        try {
          handleFirestoreError(error, OperationType.GET, 'dashboard_data');
        } catch (e) {
          toast.error(getFriendlyFirebaseError(e));
        }
      } finally {
        if (isMounted) setIsModulesLoading(false);
      }
    };
    
    fetchDashboardData();
    return () => {
      isMounted = false;
      if (unsubscribeReminders) unsubscribeReminders();
    };
  }, []);

  const generateDiagnostic = async () => {
    if (isGeneratingAI || rawSessions.length < 3) return;
    setIsGeneratingAI(true);
    try {
      // Aggregate data for AI analysis
      const skillAverages: any = { SpeakEZ: 0, WriteEZ: 0, ReadEZ: 0, ListenEZ: 0 };
      const skillCounts: any = { SpeakEZ: 0, WriteEZ: 0, ReadEZ: 0, ListenEZ: 0 };
      const metricsAcc = { fluency: 0, grammar: 0, vocabulary: 0, comprehension: 0, pronunciation: 0, structure: 0 };
      
      rawSessions.forEach(s => {
        if (skillAverages[s.type] !== undefined) {
          skillAverages[s.type] += s.score || 0;
          skillCounts[s.type]++;
        }
        if (s.metrics) {
          Object.keys(metricsAcc).forEach(k => {
            (metricsAcc as any)[k] += (s.metrics as any)[k] || 0;
          });
        }
      });

      const finalScores: any = {};
      Object.keys(skillAverages).forEach(k => {
        finalScores[k] = skillCounts[k] > 0 ? Math.round(skillAverages[k] / skillCounts[k]) : 0;
      });

      const finalMetrics: any = {};
      Object.keys(metricsAcc).forEach(k => {
        finalMetrics[k] = rawSessions.length > 0 ? Math.round((metricsAcc as any)[k] / rawSessions.length) : 0;
      });

      const rec = await GeminiService.generateStudyRecommendation({
        name: profile.displayName,
        level: profile.level,
        goal: profile.goal,
        scores: finalScores,
        metrics: finalMetrics,
        recentSessions: rawSessions.slice(-5)
      });
      setAiRecommendation(rec);
    } catch (error) {
      console.error("AI Diagnostic error:", error);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderTitle || !newReminderDate || !newReminderTime) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsAddingReminder(true);
    try {
      const dateObj = new Date(`${newReminderDate}T${newReminderTime}`);
      
      await addDoc(collection(db, `users/${userId}/reminders`), {
        title: newReminderTitle,
        date: dateObj.getTime(),
        type: newReminderType,
        completed: false
      });
      
      toast.success("Reminder added!");
      setNewReminderTitle('');
      setShowReminderForm(false);
    } catch (error) {
      console.error("Error adding reminder:", error);
      try {
        handleFirestoreError(error, OperationType.CREATE, `users/${userId}/reminders`);
      } catch (e) {
        toast.error(getFriendlyFirebaseError(e));
      }
    } finally {
      setIsAddingReminder(false);
    }
  };

  const handleToggleReminder = async (id: string, completed: boolean) => {
    setConfirmDialog({
      isOpen: true,
      title: completed ? 'Unmark Task?' : 'Complete Task?',
      message: completed 
        ? 'Are you sure you want to mark this task as incomplete?' 
        : 'Are you sure you want to mark this task as completed?',
      type: 'warning',
      confirmText: completed ? 'Unmark' : 'Mark Complete',
      onConfirm: () => executeToggleReminder(id, completed)
    });
  };

  const executeToggleReminder = async (id: string, completed: boolean) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      const newStatus = !completed;
      await updateDoc(doc(db, `users/${userId}/reminders`, id), { completed: newStatus });
      if (newStatus) {
        setShowSuccess(true);
        toast.success("Task completed!", { id: 'task-complete' });
        setTimeout(() => setShowSuccess(false), 1500);
      }
      setConfirmDialog(null);
    } catch (error) {
      console.error("Error toggling reminder:", error);
      try {
        handleFirestoreError(error, OperationType.UPDATE, `users/${userId}/reminders`);
      } catch (e) {
        toast.error(getFriendlyFirebaseError(e));
      }
    }
  };

  const handleDeleteReminder = async (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task?',
      message: 'This action cannot be undone. Are you sure you want to delete this reminder?',
      type: 'danger',
      confirmText: 'Delete Task',
      onConfirm: () => executeDeleteReminder(id)
    });
  };

  const executeDeleteReminder = async (id: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;
    try {
      await deleteDoc(doc(db, `users/${userId}/reminders`, id));
      toast.success("Reminder deleted");
      setConfirmDialog(null);
    } catch (error) {
      console.error("Error deleting reminder:", error);
      try {
        handleFirestoreError(error, OperationType.DELETE, `users/${userId}/reminders`);
      } catch (e) {
        toast.error(getFriendlyFirebaseError(e));
      }
    }
  };

  const summary = summarizePractice(rawSessions, dateRange);
  const skillProgress = summary.skills;
  const measuredSkills = summary.skills.filter(skill=>skill.count > 0);
  const overallScore = summary.overall;

  const practiceTiles = [
    {name:'Reading', module:'readez', icon:BookOpen, color:'reading'},
    {name:'Writing', module:'writeez', icon:PenTool, color:'writing'},
    {name:'Speaking', module:currentTrack === 'MUET' ? 'muet' : 'speakez', icon:Mic, color:'speaking'},
    {name:'Listening', module:'listenez', icon:Headset, color:'listening'},
  ];
  const recentPractice = summary.recent;
  const skillNames: Record<string,string> = {ReadEZ:'Reading',WriteEZ:'Writing',SpeakEZ:'Speaking',ListenEZ:'Listening'};

  return (
    <div className="dashboard-home space-y-4 max-w-5xl mx-auto min-w-0 pb-4">
      <SuccessFeedback show={showSuccess} onComplete={() => setShowSuccess(false)} />
      {isOffline && <p role="status" className="dashboard-card text-sm">Offline. Some features may be unavailable.</p>}
      <header><button className="text-sm text-primary min-h-11" onClick={()=>onSelectModule('')}>← Dashboard</button><h1 className="text-xl font-semibold">Study tools</h1></header>
      <details className="dashboard-card"><summary className="min-h-11 flex items-center justify-between cursor-pointer text-sm font-semibold">Reminders <span className="text-xs text-white/60">{reminders.filter(r=>!r.completed).length} upcoming</span></summary><div className="pt-3">
    {/* Your reminders */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-primary" />
            Your reminders
          </h3>
          <button 
            onClick={() => setShowReminderForm(!showReminderForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <Plus size={14} /> Add Reminder
          </button>
        </div>

        {showReminderForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-6 border border-primary/20"
          >
            <form onSubmit={handleAddReminder} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="reminder-title" className="text-xs font-bold uppercase text-white/40 tracking-widest">Task Title</label>
                  <input 
                    id="reminder-title"
                    type="text" 
                    required
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                    placeholder="e.g. Complete SPM Past Year Set 1" 
                    className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reminder-type" className="text-xs font-bold uppercase text-white/40 tracking-widest">Module / Type</label>
                  <select 
                    id="reminder-type"
                    value={newReminderType}
                    onChange={(e) => setNewReminderType(e.target.value as any)}
                    className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white"
                  >
                    <option value="General">General Practice</option>
                    <option value="SpeakEZ">SpeakEZ</option>
                    <option value="WriteEZ">WriteEZ</option>
                    <option value="ListenEZ">ListenEZ</option>
                    <option value="ReadEZ">ReadEZ</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="reminder-date" className="text-xs font-bold uppercase text-white/40 tracking-widest">Date</label>
                  <input 
                    id="reminder-date"
                    type="date" 
                    required
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="reminder-time" className="text-xs font-bold uppercase text-white/40 tracking-widest">Time</label>
                  <input 
                    id="reminder-time"
                    type="time" 
                    required
                    value={newReminderTime}
                    onChange={(e) => setNewReminderTime(e.target.value)}
                    className="w-full bg-obsidian border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors text-white [color-scheme:dark]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowReminderForm(false)}
                  className="px-6 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-colors font-bold uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isAddingReminder}
                  className="px-6 py-3 rounded-xl bg-primary text-obsidian hover:bg-primary/90 transition-colors font-bold uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  {isAddingReminder ? 'Saving...' : 'Save Reminder'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.length === 0 && !showReminderForm && (
            <div className="col-span-full py-4 text-center text-white/20 font-bold uppercase tracking-widest border border-white/5 rounded-2xl glass-card">
              No reminders yet.
            </div>
          )}
          
          {reminders.map(reminder => (
            <motion.div 
              layout
              initial={{ scale: 1 }}
              animate={{ scale: showSuccess && !reminder.completed ? [1, 1.02, 1] : 1 }}
              key={reminder.id} 
              className={cn(
                "glass-card p-4 sm:p-5 flex items-start gap-4 transition-all duration-300",
                reminder.completed ? "opacity-50" : "hover:border-primary/30"
              )}
            >
              <button 
                onClick={() => handleToggleReminder(reminder.id, reminder.completed)}
                className="mt-1 flex-shrink-0"
              >
                <div className="relative">
                  <CheckCircle2 size={24} className={reminder.completed ? "text-primary" : "text-white/20 hover:text-white/40"} />
                  {showSuccess && !reminder.completed && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      className="absolute inset-0 bg-primary/20 rounded-full"
                    />
                  )}
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <h4 className={cn("font-bold text-sm sm:text-base truncate", reminder.completed && "line-through text-white/40")}>
                  {reminder.title}
                </h4>
                <div className="flex items-center flex-wrap gap-2 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-white/40 uppercase tracking-widest font-bold">
                    <CalendarIcon size={12} />
                    {new Date(reminder.date).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-white/60 font-bold uppercase tracking-widest border border-white/10">
                    {reminder.type}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteReminder(reminder.id)}
                aria-label={`Delete reminder: ${reminder.title}`} className="text-white/60 hover:text-red-400 transition-colors p-2"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      </div></details>
      <details className="dashboard-card"><summary className="min-h-11 flex items-center cursor-pointer text-sm font-semibold">Study tips</summary><div className="pt-3 space-y-3"><p className="text-sm text-white/70">{dailyTip.fact}</p>
        {rawSessions.length >= 3 && <button onClick={generateDiagnostic} disabled={isGeneratingAI} className="min-h-11 px-3 rounded-lg border border-white/10 text-sm">{isGeneratingAI ? 'Loading…' : 'Get personal tips (AI credits)'}</button>}
        {aiRecommendation && <><p className="text-sm text-white/70">{aiRecommendation.analysis}</p>{aiRecommendation.recommendations.map((rec,i)=><button key={i} onClick={()=>onSelectModule(rec.type.toLowerCase())} className="w-full text-left rounded-lg border border-white/10 p-3"><span className="block text-sm font-semibold">{rec.title}</span><span className="block text-xs text-white/60 mt-1">{rec.desc}</span></button>)}</>}
      </div></details>
      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog?.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(null)}
              className="absolute inset-0 bg-obsidian/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              role="dialog" aria-modal="true" aria-label={confirmDialog.title} className="relative w-full max-w-md max-h-[85dvh] overflow-y-auto glass-card p-4 sm:p-6 border-primary/20 shadow-2xl overflow-hidden scanline"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className={cn(
                  "p-3 rounded-2xl border",
                  confirmDialog.type === 'danger' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-primary/10 border-primary/20 text-primary"
                )}>
                  {confirmDialog.type === 'danger' ? <Trash2 size={24} /> : <CheckCircle2 size={24} />}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white mb-1">{confirmDialog.title}</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Please confirm</p>
                </div>
              </div>
              
              <p className="text-white/70 mb-8 leading-relaxed font-medium">
                {confirmDialog.message}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="flex-1 px-6 py-4 rounded-xl border border-white/10 text-white/40 font-black uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all italic"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={cn(
                    "flex-1 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all italic scale-100 active:scale-95 shadow-lg",
                    confirmDialog.type === 'danger' 
                      ? "bg-red-500 text-white shadow-red-500/20" 
                      : "bg-primary text-obsidian shadow-primary/20"
                  )}
                >
                  {confirmDialog.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
