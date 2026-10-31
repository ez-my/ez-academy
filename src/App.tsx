import {captureReferral,affiliateRequest} from './lib/affiliate';
captureReferral();
import {PersistentNavigation} from './components/PersistentNavigation';
import { GeneralFeedbackPanel, GeneralFeedbackDialog } from './components/GeneralFeedback';
import { PaywallGate } from './components/paywall/PaywallGate';
import { useSkillPackages } from './lib/useSkillPackages';
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom';
// Lazily load heavy pages.
// lazyWithPreload keeps the import factory reachable so a route's chunk can be
// warmed on hover/focus. Without that, the first click on a link paid the full
// network round trip for the chunk with nothing on screen in the meantime.
type Preloadable = { preload: () => void; readonly isLoaded: boolean };
function lazyWithPreload<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  let started: Promise<{ default: T }> | undefined;
  let loaded = false;
  const load = () => (started ??= factory().then(mod => { loaded = true; return mod; }));
  const Component = lazy(load) as React.LazyExoticComponent<T> & Preloadable;
  Component.preload = () => { void load(); };
  Object.defineProperty(Component, 'isLoaded', { get: () => loaded });
  return Component;
}

const SupportPage = lazyWithPreload(()=>import('./pages/SupportPage').then(m=>({default:m.SupportPage})));
const Auth = lazyWithPreload(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const Onboarding = lazyWithPreload(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
import type { OnboardingData } from './pages/Onboarding';
const StudyTools = lazyWithPreload(()=>import('./pages/StudyTools').then(m=>({default:m.StudyTools})));
const Dashboard = lazyWithPreload(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SpeakEZ = lazyWithPreload(() => import('./pages/SpeakEZ').then(m => ({ default: m.SpeakEZ })));
const WriteEZ = lazyWithPreload(() => import('./pages/WriteEZ').then(m => ({ default: m.WriteEZ })));
const ReadEZ = lazyWithPreload(() => import('./pages/ReadEZ').then(m => ({ default: m.ReadEZ })));
const ListenEZ = lazyWithPreload(() => import('./pages/ListenEZ').then(m => ({ default: m.ListenEZ })));
const History = lazyWithPreload(() => import('./pages/History').then(m => ({ default: m.History })));
const SpeakEZEvaluator = lazyWithPreload(() => import('./pages/SpeakEZEvaluator'));
const Shell = lazyWithPreload(() => import('./components/layout/Shell').then(m => ({ default: m.Shell })));
const MarketingHome = lazyWithPreload(() => import('./pages/marketing/Home').then(m => ({ default: m.MarketingHome })));
const MarketingAbout = lazyWithPreload(() => import('./pages/marketing/About').then(m => ({ default: m.MarketingAbout })));
const MarketingEcosystem = lazyWithPreload(() => import('./pages/marketing/Ecosystem').then(m => ({ default: m.MarketingEcosystem })));
const MarketingEZEnglish = lazyWithPreload(() => import('./pages/marketing/EZEnglish').then(m => ({ default: m.MarketingEZEnglish })));
const MarketingPrograms = lazyWithPreload(() => import('./pages/marketing/Programs').then(m => ({ default: m.MarketingPrograms })));
const MarketingResources = lazyWithPreload(() => import('./pages/marketing/Resources').then(m => ({ default: m.MarketingResources })));
const ContentPage = lazyWithPreload(() => import('./pages/marketing/ContentPage').then(m => ({ default: m.ContentPage })));
const LegalInfo = lazyWithPreload(() => import('./pages/marketing/LegalInfo').then(m => ({ default: m.LegalInfo })));
const PaymentGate = lazyWithPreload(() => import('./pages/PaymentGate'));
const AdminPage = lazyWithPreload(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const ProfilePage = lazyWithPreload(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const PricingPage = lazyWithPreload(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })));
const MUETPage = lazyWithPreload(() => import('./pages/MUETPage').then(m => ({ default: m.MUETPage })));

// Which chunk to warm for a given in-app href. Longest/most specific first.
const PREFETCH_ROUTES: Array<[RegExp, Preloadable[]]> = [
  [/^\/$/,            [MarketingHome]],
  [/^\/plans$/,       [PricingPage]],
  [/^\/affiliate$/,   [MarketingAbout]],
  [/^\/ez-english$/,  [MarketingEZEnglish]],
  [/^\/ecosystem$/,   [MarketingEcosystem]],
  [/^\/programs$/,    [MarketingPrograms]],
  [/^\/resources$/,   [MarketingResources]],
  [/^\/(privacy|terms)$/, [LegalInfo]],
  [/^\/section\//,    [ContentPage]],
  [/^\/login$/,       [Auth]],
  [/^\/(checkout|payment-status)$/, [PaymentGate]],
  [/^\/app\/speakez/, [Shell, SpeakEZ]],
  [/^\/app\/writeez/, [Shell, WriteEZ]],
  [/^\/app\/readez/,  [Shell, ReadEZ]],
  [/^\/app\/listenez/,[Shell, ListenEZ]],
  [/^\/app/,          [Shell, Dashboard]],
];

// Warm a route's chunk as soon as the user shows intent, rather than on click.
// touchstart is included because on a phone it lands ~100ms before the click.
const useRoutePrefetch = () => {
  useEffect(() => {
    const warmed = new Set<string>();
    const onIntent = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const anchorEl = target && typeof target.closest === 'function'
        ? target.closest('a[href]') as HTMLAnchorElement | null
        : null;
      if (!anchorEl) return;
      const href = anchorEl.getAttribute('href') || '';
      if (!href.startsWith('/') || warmed.has(href)) return;
      warmed.add(href);
      const path = href.split('#')[0].split('?')[0] || '/';
      for (const [pattern, modules] of PREFETCH_ROUTES) {
        if (pattern.test(path)) { modules.forEach(m => m.preload()); return; }
      }
    };
    const opts = { passive: true } as const;
    document.addEventListener('mouseover', onIntent, opts);
    document.addEventListener('focusin', onIntent, opts);
    document.addEventListener('touchstart', onIntent, opts);
    return () => {
      document.removeEventListener('mouseover', onIntent);
      document.removeEventListener('focusin', onIntent);
      document.removeEventListener('touchstart', onIntent);
    };
  }, []);
};

// A click used to leave the old page on screen with no feedback at all while the
// next chunk downloaded. This is that missing feedback.
//
// It is driven from the click rather than from render state on purpose: react-router
// wraps navigation in startTransition, so useDeferredValue/Suspense never surface a
// pending state here — React just keeps the old page committed until the chunk lands.
const useNavProgress = () => {
  const location = useLocation();
  const [pending, setPending] = useState(false);

  // The new route has committed, so whatever we were waiting for has arrived.
  useEffect(() => { setPending(false); }, [location.pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const anchorEl = target && typeof target.closest === 'function'
        ? target.closest('a[href]') as HTMLAnchorElement | null
        : null;
      if (!anchorEl || anchorEl.target === '_blank') return;
      const href = anchorEl.getAttribute('href') || '';
      if (!href.startsWith('/')) return;
      const path = href.split('#')[0].split('?')[0] || '/';
      if (path === window.location.pathname) return;
      const match = PREFETCH_ROUTES.find(([pattern]) => pattern.test(path));
      // Already warmed by the hover prefetch: the swap will be instant, so a bar
      // flashing for one frame would be worse than no bar at all.
      if (match && match[1].every(mod => mod.isLoaded)) return;
      setPending(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // Never let the bar outlive the navigation that started it.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => setPending(false), 10000);
    return () => clearTimeout(timer);
  }, [pending]);

  return pending;
};

const NavProgress = ({ active }: { active: boolean }) =>
  active ? <div className="nav-progress" role="progressbar" aria-label="Loading page" /> : null;

import { MarketingLayout } from './components/layout/MarketingLayout';
import { UserProfile, AppModule } from './types';
import { auth, getUserProfile, saveUserProfile, updateProfile, loginWithGoogle, logout as firebaseLogout, subscribeToUserProfile, subscribeToModules } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { GlobalAudioPlayer } from './components/GlobalAudioPlayer';
import { SEOSync } from './components/SEOSync';
import { Server, Zap } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { ADMIN_EMAIL } from './constants';
import { playNavSound } from './lib/audio';

// Run non-urgent work after the browser is done with the important frames.
const deferIdle = (fn: () => void) => {
  const ric = (window as any).requestIdleCallback;
  if (typeof ric === 'function') ric(() => fn(), { timeout: 3000 });
  else setTimeout(fn, 1200);
};

const AuthSpinner = () => (
  <div className="h-screen bg-card flex items-center justify-center">
    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
);

const ModuleGuard = ({ children, slug, modules, isAdmin, onNavigate }: { children: React.ReactNode, slug: string, modules: AppModule[], isAdmin: boolean, onNavigate: (path: string) => void }) => {
  const module = modules.find(m => m.slug === slug);
  
  // If module not found in DB (initial state), we allow it by default or wait for load?
  // Usually default modules are in the DB. If missing, we don't block.
  if (!module) return <>{children}</>;
  
  if (!module.isActive && !isAdmin) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-8 bg-card/50 rounded-[3rem] border border-white/5 backdrop-blur-xl">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary relative z-10">
            <Server size={40} className="animate-pulse" />
          </div>
          <div className="absolute inset-0 bg-primary/20 blur-[40px] rounded-full animate-pulse" />
          <div className="absolute -top-2 -right-2 bg-amber-500 text-obsidian p-2 rounded-xl z-20 shadow-xl border-2 border-obsidian">
            <Zap size={16} />
          </div>
        </div>
        
        <div className="space-y-4 max-w-md">
          <h3 className="text-3xl font-black italic tracking-tighter uppercase">
            Module <span className="text-primary">Optimizing</span>
          </h3>
          <p className="text-sm font-medium text-white/60 leading-relaxed">
            The <span className="text-white font-bold">{module.name}</span> engine is currently undergoing performance tuning and linguistic updates. Stay tuned!
          </p>
        </div>

        <button 
          onClick={() => onNavigate('/app')}
          className="px-8 py-4 bg-primary text-obsidian rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all"
        >
          Go to My Dashboard
        </button>
        
        <div className="pt-4">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/20">EZ Academy Engineering Division</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Protected App component to wrap shell and internal routes
const ProtectedApp = ({ 
  user, 
  profile, 
  profileLoading, 
  profileError, 
  modules, 
  handleOnboardingComplete, 
  handleLogout,
  currentTab,
  authLoading
}: { 
  user: User | null, 
  profile: UserProfile | null, 
  profileLoading: boolean, 
  profileError: string | null,
  modules: AppModule[],
  handleOnboardingComplete: (data: OnboardingData) => Promise<void>,
  handleLogout: () => Promise<void>,
  currentTab: string,
  authLoading: boolean
}) => {
  const navigate = useNavigate();
  const skillProfile = useSkillPackages(profile);
  
  // Auth state is not known yet — waiting is correct here, redirecting is not:
  // bouncing to /login would log out anyone hard-refreshing a protected page.
  if (authLoading) return <AuthSpinner />;

  if (!user) return <Navigate to="/login" replace />;
  if (!user.emailVerified) return <Navigate to="/login" replace />;
  
  if (profileLoading) return <AuthSpinner />;

  if (profileError) {
    return (
      <div className="h-screen bg-card flex flex-col items-center justify-center text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h2 className="text-2xl font-bold">Connection Issue</h2>
        <p className="text-gray-400 max-w-md">{profileError}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 bg-primary text-obsidian font-bold rounded-md mt-4 hover:bg-primary/90 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }
  
  if (!profile || !profile.onboardingCompleted) return <Onboarding uid={user.uid} suggestedName={user.displayName || ''} onComplete={handleOnboardingComplete} />;

  const isAdmin = user.email === ADMIN_EMAIL;

  return (
    <Shell 
      activeTab={currentTab === 'app' ? 'dashboard' : currentTab} 
      onNavigate={(id) => {
        if (profile?.soundEnabled !== false) playNavSound();
        navigate(id === 'dashboard' ? '/app' : `/app/${id}`);
      }} 
      onLogout={handleLogout}
      userEmail={user.email || ''}
      credits={profile.credits}
    >
      <GeneralFeedbackDialog/>
      <PaywallGate/>
      <Routes>
        <Route path="/" element={<Dashboard profile={profile} onSelectModule={(id) => navigate(`/app/${id}`)} />} />
        <Route path="/study-tools" element={<StudyTools profile={profile} onSelectModule={(id)=>navigate(`/app/${id}`)}/>} />
        <Route path="/muet" element={<MUETPage profile={skillProfile('speak')!} onTrackChange={(track) => { if (user?.uid) updateProfile(user.uid, { goal: track }).catch(() => {}); }} />} />
        <Route path="/speakez" element={<ModuleGuard slug="speakez" modules={modules} isAdmin={isAdmin} onNavigate={navigate}><>{skillProfile('speak')?.plan === 'free' && <GeneralFeedbackPanel skill="speak"/>}<SpeakEZ profile={skillProfile('speak')!} /></></ModuleGuard>} />
        <Route path="/evaluator" element={<SpeakEZEvaluator />} />
        <Route path="/writeez" element={<ModuleGuard slug="writeez" modules={modules} isAdmin={isAdmin} onNavigate={navigate}><>{skillProfile('write')?.plan === 'free' && <GeneralFeedbackPanel skill="write"/>}<WriteEZ userGoal={profile.goal} userLevel={profile.level} plan={skillProfile('write')?.plan} profile={skillProfile('write')!} /></></ModuleGuard>} />
        <Route path="/readez" element={<ModuleGuard slug="readez" modules={modules} isAdmin={isAdmin} onNavigate={navigate}><>{skillProfile('read')?.plan === 'free' && <GeneralFeedbackPanel skill="read"/>}<ReadEZ profile={skillProfile('read')!} /></></ModuleGuard>} />
        <Route path="/listenez" element={<ModuleGuard slug="listenez" modules={modules} isAdmin={isAdmin} onNavigate={navigate}><>{skillProfile('listen')?.plan === 'free' && <GeneralFeedbackPanel skill="listen"/>}<ListenEZ profile={skillProfile('listen')!} /></></ModuleGuard>} />
        <Route path="/support" element={<SupportPage/>} />
        <Route path="/history" element={<History />} />
        {/* One admin workspace. /admin/monitor was the second entry point; it now
            redirects, carrying its ?tab= through so old links still land correctly. */}
        <Route path="/admin" element={
          isAdmin ? <AdminPage /> : <Navigate to="/app" replace />
        } />
        <Route path="/admin/monitor" element={
          <Navigate to={`/app/admin${window.location.search}`} replace />
        } />
        <Route path="/profile" element={<ProfilePage profile={profile} onLogout={handleLogout} />} />
        <Route path="/pricing" element={<PricingPage profile={profile} />} />
        <Route path="*" element={
          <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-white/20">
              <div className="animate-pulse">🚧</div>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight">Module in Construction</h3>
              <p className="text-white/40 max-w-sm mx-auto">This specialized learning unit is currently being optimized by EZ Academy linguistic engineers.</p>
            </div>
            <button onClick={() => navigate('/app')} className="btn-primary">Return to My Dashboard</button>
          </div>
        } />
      </Routes>
    </Shell>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [modules, setModules] = useState<AppModule[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();
  useRoutePrefetch();
  const routeChanging = useNavProgress();
  useEffect(()=>{if(!user?.emailVerified||!location.pathname.startsWith('/app'))return;const day=new Date(Date.now()+8*3600000).toISOString().slice(0,10),key=`ez-visit:${user.uid}:${day}`;try{if(sessionStorage.getItem(key))return;}catch{}let cancelled=false;user.getIdToken().then(token=>fetch('/api/usage/visit',{method:'POST',headers:{Authorization:`Bearer ${token}`}})).then(r=>{if(r.ok&&!cancelled)try{sessionStorage.setItem(key,'1');}catch{}}).catch(()=>{});return()=>{cancelled=true;};},[user,location.pathname]);


  useEffect(() => {
    let unsubscribeProfile: () => void;
    let unsubscribeModules: (() => void) | undefined;
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setProfileError(null);
      try {
        if (firebaseUser) {
          setProfileLoading(true);
          // Module flags only gate the signed-in app, so this listener does not
          // belong on the public pages — it was opening a Firestore channel for
          // every anonymous visitor to the marketing site.
          if (!unsubscribeModules) unsubscribeModules = subscribeToModules(setModules);
          // Initial fetch to decide if we need onboarding
          const initialProfile = await getUserProfile(firebaseUser.uid);
          // Fire-and-forget account sync. A cold Netlify function can take over a
          // second, so keep it off the critical path instead of racing first paint.
          if (initialProfile) deferIdle(() => { affiliateRequest("affiliate/account",{}).catch(() => {}); });
          
          if (initialProfile === undefined) {
             setProfileError("Could not retrieve your profile due to a network or server issue. Please try again later.");
          } else {
             setProfile(initialProfile);
          }
          
          unsubscribeProfile = subscribeToUserProfile(firebaseUser.uid, (data) => {
            if (data !== undefined) {
              setProfile(data);
              setProfileError(null);
            }
            setProfileLoading(false);
          });
        } else {
          setProfile(null);
          if (unsubscribeProfile) {
            unsubscribeProfile();
          }
          if (unsubscribeModules) {
            unsubscribeModules();
            unsubscribeModules = undefined;
          }
          setModules([]);
        }
      } catch (err) {
        setProfileError("An unexpected error occurred during profile initialization.");
        console.error("Profile initialization failed:", err);
      } finally {
        setProfileLoading(false);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
      if (unsubscribeModules) unsubscribeModules();
    };
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // Redirect happens via useEffect or protected routes
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await firebaseLogout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleOnboardingComplete = async (data: OnboardingData) => {
    if (!user) return;
    // Registration now collects these too; normaliseDetails has already trimmed
    // them and dropped anything the form does not own.
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: data.displayName || user.displayName || 'EZ Master',
      school: data.school || undefined,
      referralSource: data.referralSource || undefined,
      referralNote: data.referralNote || undefined,
      leaderboardOptOut: data.leaderboardOptOut,
      goal: data.goal,
      level: profile?.level || 'INTERMEDIATE', // Existing profile default; no diagnostic score is assigned.
      weeklyGoalMinutes: profile?.weeklyGoalMinutes || 15,
      onboardingCompleted: true,
      streak: 1,
      points: 100,
      credits: 3, // Base credits for starting
      weeklyGoalProgress: 0,
      createdAt: profile?.createdAt || Date.now()
    };
    try {
      await saveUserProfile(newProfile);
      affiliateRequest("affiliate/account",{}).catch(() => {});
      setProfile(newProfile);
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      try {
        const errInfo = JSON.parse(error.message);
        toast.error(`Failed to save profile: ${errInfo.error}. Please ensure your account is verified.`);
      } catch (e) {
        toast.error("Failed to save profile. Please check your connection.");
      }
      throw error;
    }
  };

  // Derived active tab from pathname for Shell highlighting
  const currentTab = location.pathname.split('/').pop() || 'dashboard';

  return (
    <Suspense fallback={
      <div className="h-screen bg-card flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    }>
      <Toaster position="top-center" reverseOrder={false} />
      <PersistentNavigation isLoggedIn={!!user} isAdmin={user?.email===ADMIN_EMAIL} goal={profile?.goal}/>
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-6 focus:py-3 focus:bg-primary focus:text-obsidian focus:font-black focus:rounded-xl focus:shadow-2xl focus:ring-0"
      >
        Skip to content
      </a>
      <SEOSync />
      <GlobalAudioPlayer />
      {/* Global Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[100] scanline opacity-30 mix-blend-overlay"></div>
      <NavProgress active={routeChanging} />
      <Routes>
      {/* Public Marketing Routes */}
      <Route element={<MarketingLayout isLoggedIn={!!user} />}>
        <Route path="/" element={<MarketingHome isLoggedIn={!!user} />} />
        <Route path="/plans" element={<div className="px-4 py-6"><PricingPage profile={profile||undefined}/></div>} />
        <Route path="/about" element={<Navigate to="/affiliate" replace />} />
        <Route path="/affiliate" element={<MarketingAbout />} />
        <Route path="/ez-english" element={<MarketingEZEnglish />} />
        <Route path="/ecosystem" element={<MarketingEcosystem />} />
        <Route path="/programs" element={<MarketingPrograms />} />
        <Route path="/resources" element={<MarketingResources />} />
        <Route path="/privacy" element={<LegalInfo kind="privacy" />} />
        <Route path="/terms" element={<LegalInfo kind="terms" />} />
        <Route path="/section/:slug" element={<ContentPage />} />
      </Route>

      {/* Auth Route */}
      <Route path="/login" element={loading ? <AuthSpinner /> : ((user && user.emailVerified) ? <Navigate to="/app" replace /> : <Auth onLogin={handleLogin} />)} />

      {/* Payment Routes */}
      <Route path="/checkout" element={<PaymentGate />} />
      <Route path="/payment-status" element={<PaymentGate status />} />

      {/* Protected App Routes */}
      <Route path="/app/*" element={
        <ProtectedApp 
          user={user} 
          profile={profile} 
          profileLoading={profileLoading} 
          authLoading={loading} 
          profileError={profileError} 
          modules={modules}
          handleOnboardingComplete={handleOnboardingComplete}
          handleLogout={handleLogout}
          currentTab={currentTab}
        />
      } />
      
      {/* Catch-all redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}
