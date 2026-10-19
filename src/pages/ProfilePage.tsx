import {practiceRequest} from '../lib/practice';
import {Achievements} from '../components/dashboard/Achievements';
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Edit2, Save, X, User, Target, CheckCircle2, AlertCircle, Settings, Moon, Upload, Type, Eye, Clock, Activity, ChevronRight, History, Download, Smartphone, Mic, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserProfile, ActivityLog } from '../types';
import { updateProfile, submitFeedback, getActivityLogs, updateDailyGoal } from '../lib/firebase';
import { useAccessibility } from '../lib/AccessibilityContext';
import { MessageSquare, Send } from 'lucide-react';


import { useTheme } from '../context/ThemeContext';

interface ProfilePageProps {
  profile: UserProfile;
  onLogout: () => void;
}

function GoalSetter({ userId, initialGoal }: { userId: string; initialGoal: number }) {
  const [goal, setGoal] = useState(initialGoal || 15);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (newGoal: number) => {
    setGoal(newGoal);
    setIsUpdating(true);
    try {
      await updateDailyGoal(userId, newGoal);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target size={20} className="text-primary" />
          <h3 className="text-base font-semibold">Daily goal</h3>
        </div>
        <span className="text-2xl font-black italic text-primary">{goal}m</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[15, 30, 45, 60].map((mins) => (
          <button
            key={mins}
            onClick={() => handleUpdate(mins)}
            disabled={isUpdating}
            className={`py-2 rounded-lg text-xs font-semibold min-h-11 transition-all ${
              goal === mins 
                ? 'bg-primary text-obsidian' 
                : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
            }`}
          >
            {mins} min
          </button>
        ))}
      </div>
      <p className="text-[10px] text-white/40 uppercase tracking-widest text-center">
        
      </p>
    </div>
  );
}

function ActivityTimeline({ userId }: { userId: string }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      const data = await getActivityLogs(userId);
      setLogs(data);
      setLoading(false);
    }
    loadLogs();
  }, [userId]);

  return (
    <div className="glass-card p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History size={20} className="text-primary" />
          <h3 className="text-base font-semibold">Recent Activity</h3>
        </div>
        <Activity size={16} className="text-white/20" />
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">No activity yet</p>
          </div>
        ) : (
          logs.slice(0, 5).map((log) => (
            <div key={log.id} className="flex gap-4 group">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  log.type === 'ACHIEVEMENT' ? 'bg-primary shadow-[0_0_8px_rgba(207,255,0,0.5)]' :
                  log.type === 'LEVEL_UP' ? 'bg-blue-400' : 'bg-white/20'
                }`} />
                <div className="w-px flex-1 bg-white/10 my-1 group-last:hidden" />
              </div>
              <div className="pb-4">
                <p className="text-[11px] font-bold text-white/90">{log.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock size={10} className="text-white/30" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LevelIndicator({ level, points }: { level: string; points: number }) {
  return <div className="glass-card p-4 sm:p-5 space-y-2">
    <h3 className="text-base font-semibold">Your level</h3>
    <p className="text-sm capitalize">{level.toLowerCase()}</p>
    <p className="text-sm text-white/60">{points || 0} points earned</p>
  </div>;
}

function FeedbackForm({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [type, setType] = useState<'FEEDBACK' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER'>('FEEDBACK');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await submitFeedback({
        userId,
        userEmail,
        type,
        subject: subject.trim(),
        message: message.trim()
      });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-card p-4 sm:p-5 space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={20} className="text-primary" />
        <h3 className="text-base font-semibold">Send feedback</h3>
      </div>
      
      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 sm:p-5 text-center space-y-4 bg-primary/10 border border-primary/20 rounded-2xl"
        >
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
            <CheckCircle2 size={32} />
          </div>
          <h4 className="text-xl font-black uppercase italic text-primary">Message sent</h4>
          <p className="text-sm text-white/60">Thank you for your feedback. Our team will review your message shortly.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="text-xs font-black uppercase tracking-widest text-primary underline underline-offset-4"
          >
            Send Another Message
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Category</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-colors uppercase tracking-widest appearance-none"
              >
                <option value="FEEDBACK" className="bg-obsidian">Feedback</option>
                <option value="COMPLAINT" className="bg-obsidian">Problem</option>
                <option value="SUGGESTION" className="bg-obsidian">Suggestion</option>
                <option value="OTHER" className="bg-obsidian">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Subject</label>
              <input 
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short title"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-colors"
                maxLength={200}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Message</label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-primary/50 transition-colors resize-none"
              maxLength={5000}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg text-red-400 text-[10px] font-bold uppercase tracking-widest">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-white/10 border border-white/10 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary hover:text-obsidian hover:border-primary transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} />
                Send feedback
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function AppInstallWidget() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const installPwa = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        alert("To install on iOS: tap the Share button at the bottom of your Safari menu and select 'Add to Home Screen'.");
      } else {
         alert("App is already installed, or not supported by your current browser.");
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
  };

  if (isStandalone) return null;

  return (
    <div className="glass-card p-4 sm:p-5 space-y-6 bg-primary/5 border-primary/20">
      <div className="flex items-center gap-2 mb-2">
         <Smartphone size={20} className="text-primary" />
         <h3 className="text-base font-semibold text-primary">Add to home screen</h3>
      </div>
      <p className="text-xs text-white/60">Add EZ Academy to your home screen.</p>
      <button 
        onClick={installPwa}
        className="w-full py-4 bg-primary text-obsidian rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
      >
        <Download size={16} />
        Add to Home Screen
      </button>
    </div>
  );
}

export function ProfilePage({ profile, onLogout }: ProfilePageProps) {
  const [currentPlanLabel,setCurrentPlanLabel]=useState('Loading plan…');
  useEffect(()=>{let active=true;const refresh=()=>practiceRequest('practice/status').then(d=>{if(active)setCurrentPlanLabel(d.planLabel||'Free')}).catch(()=>{if(active)setCurrentPlanLabel('Check your plan')});void refresh();const timer=setInterval(refresh,60000);return()=>{active=false;clearInterval(timer)}},[profile.uid]);
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize, highContrast, setHighContrast } = useAccessibility();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile.displayName);
  const [editedGoal, setEditedGoal] = useState(profile.goal);
  const [editedStreakGoal, setEditedStreakGoal] = useState(profile.streakGoal || 7);
  const [editedPhotoUrl, setEditedPhotoUrl] = useState(profile.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [section, setSection] = useState<'account' | 'progress' | 'settings' | 'help'>(() => new URLSearchParams(window.location.search).get('section') === 'progress' ? 'progress' : 'account');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      setError('Image must be less than 500KB to save to profile');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setEditedPhotoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const goals = [
    { id: 'SPM', label: 'SPM Examination', icon: '📝' },
    { id: 'MUET', label: 'MUET (University Entrance)', icon: '🎓' },
    { id: 'PROFESSIONAL', label: 'Professional English', icon: '👔' }
  ];

const AVATAR_OPTIONS = [
    'https://api.dicebear.com/7.x/bottts/svg?seed=Felix',
    'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
  ];

  const handleSave = async () => {
    // Validation
    if (!editedName.trim()) {
      setError('Display name cannot be empty');
      return;
    }
    if (editedName.length < 2) {
      setError('Display name is too short');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateProfile(profile.uid, {
        displayName: editedName.trim(),
        goal: editedGoal as any,
        streakGoal: editedStreakGoal,
        photoURL: editedPhotoUrl.trim() || undefined
      });
      setIsEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Update profile failed:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedName(profile.displayName);
    setEditedGoal(profile.goal);
    setEditedPhotoUrl(profile.photoURL || '');
    setIsEditing(false);
    setError(null);
  };


  return (
    <div className="profile-page space-y-4 max-w-4xl min-w-0 mx-auto pb-8">
      <header className="flex justify-between items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Profile</h2>
          
        </div>
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-primary text-sm font-semibold group"
          >
            <Edit2 size={14} className="group-hover:rotate-12 transition-transform" />
            Edit profile
          </button>
        )}
      </header>

      {/* Profile Header Card */}
      <div className="glass-card p-4 sm:p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px] pointer-events-none" />
        
        <div className="flex items-start sm:items-center gap-4 relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-obsidian border-2 border-primary/20 flex items-center justify-center text-primary text-2xl font-black italic shadow-2xl shadow-primary/10 shrink-0 group hover:border-primary transition-colors overflow-hidden relative">
             <div className="absolute inset-2 rounded-xl border border-primary/10 pointer-events-none" />
             {profile.photoURL ? (
               <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
             ) : (
               profile.displayName[0]
             )}
          </div>
          
          <div className="flex-1 min-w-0 text-left space-y-3">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label htmlFor="display-name" className="block text-[10px] font-black uppercase tracking-[0.3em] text-primary italic mb-3">Name</label>
                  <input 
                    id="display-name"
                    type="text" 
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-base font-medium text-white focus:outline-none focus:border-primary/50 transition-colors shadow-inner"
                    placeholder="Enter your name"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold text-white break-words">{profile.displayName}</h3>
                <p className="text-white/60 text-sm break-all mb-2">{profile.email}</p>
                
                <p className="text-sm text-white/60">{profile.streak || 0}-day streak</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <span className="px-4 py-1.5 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                {profile.goal}
              </span>
              <span className="px-4 py-1.5 bg-white/5 rounded-full text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10">
                {profile.level.toLowerCase()}
              </span>
            </div>
          </div>
        </div>

        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 gap-8"
          >
            <div className="space-y-6">
               <h4 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <User size={16} />
                Profile picture
              </h4>
              <div className="flex flex-wrap gap-4">
                 {AVATAR_OPTIONS.map((url, i) => (
                   <button
                     key={i}
                     onClick={() => setEditedPhotoUrl(url)}
                     className={`w-16 h-16 rounded-full overflow-hidden border-2 transition-all ${
                       editedPhotoUrl === url ? 'border-primary ring-2 ring-primary/30 scale-110' : 'border-white/10 hover:border-white/30 hover:scale-105'
                     }`}
                   >
                     <img src={url} alt={`Avatar ${i+1}`} className="w-full h-full object-cover bg-white/5" />
                   </button>
                 ))}
                 <button
                   onClick={() => setEditedPhotoUrl('')}
                   className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all font-bold text-xs ${
                     !editedPhotoUrl ? 'border-primary text-primary bg-primary/10 ring-2 ring-primary/30 scale-110' : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white hover:scale-105'
                   }`}
                 >
                   NONE
                 </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Upload a picture</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors font-bold text-xs uppercase tracking-widest"
                  >
                    <Upload size={16} />
                    Upload Profile Picture
                  </button>
                </div>
                <div>
                  <label htmlFor="avatar-url" className="block text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-3">Picture link</label>
                  <input 
                    id="avatar-url"
                    type="text" 
                    value={editedPhotoUrl}
                    onChange={(e) => setEditedPhotoUrl(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-black uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Target size={16} />
                Study goal
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setEditedGoal(g.id as any)}
                    className={`p-6 rounded-2xl border-2 text-left transition-all relative group ${
                      editedGoal === g.id 
                        ? 'bg-primary/10 border-primary text-white' 
                        : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-3">{g.icon}</div>
                    <div className={`font-bold transition-colors ${editedGoal === g.id ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                      {g.id}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest font-medium opacity-60 mt-1">
                      {g.label.split(' ')[0]}
                    </div>
                    {editedGoal === g.id && (
                      <div className="absolute top-4 right-4 text-primary">
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 py-4 bg-primary text-obsidian rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-obsidian/20 border-t-obsidian rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} />
                    Save changes
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                aria-label="Cancel changes" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-sm"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-green-400 text-xs font-bold uppercase tracking-widest"
          >
            <CheckCircle2 size={14} />
            Profile Updated
          </motion.div>
        )}
      </div>

      <nav aria-label="Profile sections" className="grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {(['account', 'progress', 'settings', 'help'] as const).map(item => <button key={item} type="button" aria-current={section === item ? 'page' : undefined} onClick={() => setSection(item)} className={`min-h-11 min-w-0 rounded-lg px-1 text-sm font-semibold capitalize ${section === item ? 'bg-primary text-obsidian' : 'text-white/70 hover:bg-white/10'}`}>{item}</button>)}
      </nav>
      <section aria-label={`${section} details`} className="space-y-4 min-w-0">
        {section === 'account' && <div className="glass-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
          <div><h3 className="text-base font-semibold">Your plan</h3><p className="text-sm text-white/60 mt-1">{currentPlanLabel} · {profile.credits || 0} credits</p></div>
          <Link to="/app/pricing" className="min-h-11 inline-flex items-center rounded-lg bg-primary px-4 text-sm font-semibold text-obsidian">Upgrade account</Link>
        </div>}
        {section === 'progress' && <>
          <div className="grid sm:grid-cols-2 gap-4"><LevelIndicator level={profile.level} points={profile.points} /><GoalSetter userId={profile.uid} initialGoal={profile.dailyGoalMinutes || 15} /></div>
          <Achievements profile={profile} compact />
          <ActivityTimeline userId={profile.uid} />
        </>}
        {section === 'settings' && <div>
          {/* Practice Settings */}
          <div className="glass-card p-4 sm:p-5 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Settings size={20} className="text-primary" />
              <h3 className="text-base font-semibold">Settings</h3>
            </div>
            
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center min-w-0 gap-3">
                  <Moon size={18} className="text-white/60"/>
                  <span className="font-medium text-sm">Dark mode</span>
                </div>
                <button 
                  aria-label="Dark mode" aria-pressed={theme === 'dark'} onClick={toggleTheme}
                  className={`shrink-0 w-14 h-7 rounded-full transition-all relative flex items-center px-1 ${theme === 'dark' ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <motion.div 
                    layout
                    className="w-5 h-5 bg-white rounded-full shadow-lg"
                    animate={{ x: theme === 'dark' ? 24 : 0 }}
                  />

                </button>
              </div>

              {/* Microphone Toggle */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center min-w-0 gap-3">
                  <Mic size={18} className="text-white/60"/>
                  <span className="font-medium text-sm">Microphone</span>
                </div>
                <button 
                  aria-label="Microphone" aria-pressed={profile.micEnabled !== false} onClick={() => updateProfile(profile.uid, { micEnabled: profile.micEnabled === undefined ? false : !profile.micEnabled })}
                  className={`shrink-0 w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${profile.micEnabled !== false ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: profile.micEnabled !== false ? 24 : 0 }}
                  />
                </button>
              </div>

              {/* Sound Toggle */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center min-w-0 gap-3">
                  <Volume2 size={18} className="text-white/60"/>
                  <span className="font-medium text-sm">App sounds</span>
                </div>
                <button 
                  aria-label="App sounds" aria-pressed={profile.soundEnabled !== false} onClick={() => updateProfile(profile.uid, { soundEnabled: profile.soundEnabled === undefined ? true : !profile.soundEnabled })}
                  className={`shrink-0 w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${profile.soundEnabled !== false ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: profile.soundEnabled !== false ? 24 : 0 }}
                  />
                </button>
              </div>

              {/* High contrast Toggle */}
              <div className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center min-w-0 gap-3">
                  <Eye size={18} className="text-white/60"/>
                  <span className="font-medium text-sm">High contrast</span>
                </div>
                <button 
                  aria-label="High contrast" aria-pressed={highContrast} onClick={() => setHighContrast(!highContrast)}
                  className={`shrink-0 w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${highContrast ? 'bg-primary' : 'bg-white/10'}`}
                >
                  <motion.div 
                    layout
                    className="w-4 h-4 bg-white rounded-full"
                    animate={{ x: highContrast ? 24 : 0 }}
                  />
                </button>
              </div>

              {/* Font Size Adjuster */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                <div className="flex items-center min-w-0 gap-3">
                  <Type size={18} className="text-white/60"/>
                  <span className="font-medium text-sm">Text size</span>
                </div>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <button
                      key={size}
                      aria-label={`${size} text`} aria-pressed={fontSize === size} onClick={() => setFontSize(size)}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        fontSize === size 
                          ? 'bg-primary text-obsidian shadow-[0_0_10px_rgba(207,255,0,0.4)]' 
                          : 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
                      }`}
                    >
                      {size === 'small' ? 'S' : size === 'medium' ? 'M' : size === 'large' ? 'L' : 'XL'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>}
        {section === 'help' && <>
          <a href="https://wa.me/601110043567" target="_blank" rel="noopener noreferrer" className="glass-card p-4 flex items-center justify-between text-sm font-semibold">WhatsApp support <ChevronRight size={18} /></a>
          <details className="glass-card p-4"><summary className="cursor-pointer min-h-11 flex items-center text-sm font-semibold">Send feedback</summary><FeedbackForm userId={profile.uid} userEmail={profile.email} /></details>
          <AppInstallWidget />
        </>}
      </section>

      {/* Logout Action */}
      <div className="flex justify-center pt-2">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-white/40 hover:text-red-400 hover:bg-red-400/5 hover:border-red-400/20 transition-all font-black uppercase tracking-widest text-sm group"
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          LOG OUT
        </button>
      </div>
    </div>
  );
}

