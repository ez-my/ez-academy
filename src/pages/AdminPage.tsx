import './admin.css';
import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Activity, BookOpen, CreditCard, DollarSign, Edit2, Layout, LogOut,
  ShieldAlert, Tag, Target, TrendingUp, Users,
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { ADMIN_EMAIL } from '../constants';

import { AdminDashboard } from './AdminDashboard';
import { AffiliateClaims } from './AffiliateClaims';
import { RewardCodesPanel } from './RewardCodesPanel';
import { MarketingPanel } from './MarketingPanel';
import { OperationsPanel } from './OperationsPanel';
import { ModulesPanel } from './admin/ModulesPanel';
import { UsersPanel } from './admin/UsersPanel';
import { PaymentsPanel } from './admin/PaymentsPanel';
import { QuestionBankPanel } from './admin/QuestionBankPanel';
import { SiteEditorPanel } from './admin/SiteEditorPanel';
import { RevenueCostsPanel } from './admin/RevenueCostsPanel';

// Twelve flat tabs became five sections. The tab ids are deliberately unchanged so
// every existing ?tab= link still lands in the right place.
const SECTIONS = [
  {
    id: 'money', label: 'Money', icon: DollarSign,
    tabs: [
      { id: 'maintenance', label: 'Revenue & costs', icon: TrendingUp },
      { id: 'payments', label: 'Payments', icon: CreditCard },
      { id: 'rewards', label: 'Reward codes', icon: Tag },
      { id: 'affiliates', label: 'Affiliate claims', icon: DollarSign },
    ],
  },
  {
    id: 'learners', label: 'Learners', icon: Users,
    tabs: [
      { id: 'dashboard', label: 'Daily activity', icon: Activity },
      { id: 'users', label: 'Users', icon: Users },
    ],
  },
  {
    id: 'content', label: 'Content', icon: BookOpen,
    tabs: [
      { id: 'questions', label: 'Question bank', icon: BookOpen },
      { id: 'modules', label: 'Modules', icon: Layout },
    ],
  },
  {
    id: 'site', label: 'Site', icon: Edit2,
    tabs: [
      { id: 'ui', label: 'Appearance & pages', icon: Edit2 },
      { id: 'marketing', label: 'Marketing', icon: Target },
    ],
  },
  {
    id: 'health', label: 'Health', icon: Activity,
    tabs: [
      { id: 'operations', label: 'Operations', icon: Activity },
    ],
  },
] as const;

const ALL_TABS = SECTIONS.flatMap(section => section.tabs.map(tab => tab.id));
type AdminTab = typeof ALL_TABS[number];

// Links that predate the reorganisation. 'overview' rendered the same panel as
// 'operations'; 'system' was the tab whose controls had no handlers; 'content' is
// now called 'modules' because the Content section means something wider.
const TAB_ALIASES: Record<string, AdminTab> = {
  overview: 'operations',
  system: 'maintenance',
  content: 'modules',
};

function readTabFromUrl(): AdminTab {
  const requested = new URLSearchParams(window.location.search).get('tab') || '';
  const resolved = TAB_ALIASES[requested] ?? requested;
  return (ALL_TABS as readonly string[]).includes(resolved) ? resolved as AdminTab : 'dashboard';
}

const sectionOf = (tab: AdminTab) =>
  SECTIONS.find(section => section.tabs.some(t => t.id === tab)) ?? SECTIONS[0];

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>(readTabFromUrl);

  // Keep ?tab= in step with the open panel so a section can be linked or reloaded.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== activeTab) {
      url.searchParams.set('tab', activeTab);
      window.history.replaceState({}, '', url);
    }
  }, [activeTab]);

  if (auth.currentUser?.email !== ADMIN_EMAIL) {
    return <Navigate to="/app" replace />;
  }

  const activeSection = sectionOf(activeTab);

  return (
    <div className="admin-workspace space-y-6 pb-32 min-w-0">
      <header className="admin-header sticky top-0 z-40 bg-obsidian/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-8 py-4">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter italic uppercase text-white leading-none">
                  Admin <span className="text-primary neon-text-glow">Tools</span>
                </h2>
                <div className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border border-amber-500/20 flex items-center gap-1 italic">
                  <ShieldAlert size={12} className="pulse-primary" /> Root
                </div>
              </div>
              <p className="hidden sm:block text-white/20 uppercase tracking-[0.4em] text-[8px] font-black italic mt-1.5 underline decoration-primary/20 underline-offset-4">
                {activeSection.label}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3 pr-4 border-r border-white/5">
                <div className="text-right">
                  <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">User</div>
                  <div className="text-xs font-bold text-white truncate max-w-[150px]">{auth.currentUser?.email}</div>
                </div>
              </div>

              <button
                onClick={() => navigate('/app')}
                className="p-2.5 bg-white/5 hover:bg-blue-400/20 text-white/40 hover:text-blue-400 rounded-xl transition-all border border-white/5"
                title="Return to Student Deck"
              >
                <Target size={18} />
              </button>

              <button
                onClick={() => auth.signOut()}
                className="p-2.5 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl transition-all border border-white/5"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <label className="sm:hidden block text-sm text-white/70">
            Manage
            <select
              aria-label="Admin section"
              value={activeTab}
              onChange={event => setActiveTab(event.target.value as AdminTab)}
              className="mt-2 w-full rounded-xl border border-white/15 bg-obsidian p-3 text-white"
            >
              {SECTIONS.map(section => (
                <optgroup key={section.id} label={section.label}>
                  {section.tabs.map(tab => <option key={tab.id} value={tab.id}>{tab.label}</option>)}
                </optgroup>
              ))}
            </select>
          </label>

          <div className="hidden sm:flex flex-col gap-2">
            <nav aria-label="Admin sections" className="flex bg-white/5 p-1 rounded-2xl border border-white/10 shadow-inner">
              <div className="flex flex-wrap gap-1 min-w-0">
                {SECTIONS.map(section => {
                  const Icon = section.icon;
                  const current = section.id === activeSection.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveTab(section.tabs[0].id)}
                      aria-current={current ? 'page' : undefined}
                      className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-colors italic whitespace-nowrap ${
                        current
                          ? 'bg-primary text-obsidian shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]'
                          : 'text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Icon size={14} />
                      {section.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            {activeSection.tabs.length > 1 && (
              <nav aria-label={`${activeSection.label} pages`} className="flex flex-wrap gap-1 px-1">
                {activeSection.tabs.map(tab => {
                  const Icon = tab.icon;
                  const current = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={current ? 'page' : undefined}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-[0.12em] transition-colors whitespace-nowrap ${
                        current
                          ? 'bg-white/10 text-white border border-white/15'
                          : 'text-white/35 hover:text-white/80 border border-transparent'
                      }`}
                    >
                      <Icon size={13} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            )}
          </div>
        </div>
      </header>

      {activeTab === 'dashboard' && <AdminDashboard onOpenTab={setActiveTab} />}
      {activeTab === 'users' && <UsersPanel />}
      {activeTab === 'maintenance' && <RevenueCostsPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
      {activeTab === 'rewards' && <RewardCodesPanel />}
      {activeTab === 'affiliates' && <AffiliateClaims />}
      {activeTab === 'questions' && <QuestionBankPanel />}
      {activeTab === 'modules' && <ModulesPanel />}
      {activeTab === 'ui' && <SiteEditorPanel />}
      {activeTab === 'marketing' && <MarketingPanel />}
      {activeTab === 'operations' && <OperationsPanel />}
    </div>
  );
};
