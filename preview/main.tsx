// Local UI preview. Mounts the real page components against stub data so the
// signed-in screens can be inspected without an account. Never part of the
// production build: `npm run build` uses vite.config.ts and index.html only.
import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AccessibilityProvider } from '../src/lib/AccessibilityContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import { SiteConfigProvider } from '../src/context/SiteConfigContext';
import { PREVIEW_PROFILE } from './stubs/firebase';
import '../src/index.css';

const Dashboard = React.lazy(() => import('../src/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const ProfilePage = React.lazy(() => import('../src/pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const History = React.lazy(() => import('../src/pages/History').then(m => ({ default: m.History })));
const Leaderboard = React.lazy(() => import('../src/components/dashboard/Leaderboard').then(m => ({ default: m.Leaderboard })));
const PricingPage = React.lazy(() => import('../src/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const StudyTools = React.lazy(() => import('../src/pages/StudyTools').then(m => ({ default: m.StudyTools })));
const ShareReward = React.lazy(() => import('../src/components/ShareReward').then(m => ({ default: m.ShareReward })));
const Onboarding = React.lazy(() => import('../src/pages/Onboarding').then(m => ({ default: m.Onboarding })));

const noop = () => {};

const PAGES: Record<string, () => React.ReactNode> = {
  dashboard: () => <Dashboard profile={PREVIEW_PROFILE} onSelectModule={noop} />,
  profile: () => <ProfilePage profile={PREVIEW_PROFILE} onLogout={noop as any} />,
  history: () => <History />,
  leaderboard: () => <Leaderboard />,
  pricing: () => <PricingPage profile={PREVIEW_PROFILE} />,
  studytools: () => <StudyTools profile={PREVIEW_PROFILE} onSelectModule={noop} />,
  share: () => <div className="max-w-md mx-auto"><ShareReward achievement="I scored 78% on ReadEZ" /></div>,
  onboarding: () => <Onboarding uid="preview-learner" suggestedName="Nur Aisyah" onComplete={noop as any} />,
};

function Harness() {
  const page = new URLSearchParams(location.search).get('page') || 'dashboard';
  const render = PAGES[page];
  return (
    <div className="min-h-screen bg-obsidian text-white">
      {!render ? (
        <div className="p-8">
          <h1 className="text-xl font-bold mb-4">Preview harness</h1>
          <ul className="space-y-1 text-sm text-primary">
            {Object.keys(PAGES).map(p => <li key={p}><a href={`?page=${p}`}>{p}</a></li>)}
          </ul>
        </div>
      ) : (
        <main id="main-content" className="p-4 md:p-8 md:pt-6 min-w-0">
          <Suspense fallback={<p className="p-8 text-white/50">Loading preview…</p>}>{render()}</Suspense>
        </main>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <SiteConfigProvider>
      <AccessibilityProvider>
        <ThemeProvider>
          <Harness />
        </ThemeProvider>
      </AccessibilityProvider>
    </SiteConfigProvider>
  </BrowserRouter>,
);
