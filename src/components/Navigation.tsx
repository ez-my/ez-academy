import {Info} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Mic, 
  PenTool, 
  BookOpen, 
  Headset, 
  Headphones,
  GraduationCap,
  History as HistoryIcon, 
  User, 
  ShieldAlert,
  ChevronDown, 
  ChevronUp, 
  LogOut,
  Zap,
  Plus,
  Layout
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { AppModule } from '../types';
import { cn } from '../lib/utils';
import { OfficialSocialLinks } from './social/OfficialSocialLinks';

// Helper to render lucide icon from string.
// Module iconNames come from config, so the lookup has to stay dynamic. The names
// our own config ships are bundled here and render immediately; anything an admin
// picks outside that set is fetched from the full icon set on demand. Importing
// the whole barrel eagerly instead put ~800 kB of unused icons on every page.
const STATIC_ICONS: Record<string, React.ComponentType<any>> = {
  LayoutDashboard, Mic, PenTool, BookOpen, Headset, Headphones, GraduationCap,
  History: HistoryIcon, User, ShieldAlert, ChevronDown, ChevronUp, LogOut, Zap, Plus, Layout,
};

const LucideIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const [resolved, setResolved] = useState<React.ComponentType<any> | null>(() => STATIC_ICONS[name] ?? null);
  useEffect(() => {
    const staticIcon = STATIC_ICONS[name];
    if (staticIcon) { setResolved(() => staticIcon); return; }
    let cancelled = false;
    import('lucide-react').then(all => {
      if (!cancelled) setResolved(() => (all as any)[name] ?? Layout);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [name]);
  const Icon = resolved ?? Layout;
  return <Icon size={size} className={className} />;
};

interface NavItem {
  id: string;
  label: string;
  icon: any; // Using any for lucide icons consistency
  onClick?: () => void;
}

interface NavigationProps {
  activeId: string;
  onChange: (id: string) => void;
  onLogout: () => void;
  isMobileHidden: boolean;
  setIsMobileHidden: (hidden: boolean) => void;
  userEmail?: string;
  isAdmin?: boolean;
  credits?: number;
  className?: string;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  activeId, 
  onChange, 
  onLogout, 
  isMobileHidden,
  setIsMobileHidden,
  userEmail, 
  isAdmin, 
  credits,
  className 
}) => {
  const [modules, setModules] = useState<AppModule[]>([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const q = query(
          collection(db, 'modules'), 
          where('isActive', '==', true),
          orderBy('order', 'asc')
        );
        const snapshot = await getDocs(q);
        const modulesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppModule));
        setModules(modulesData);
      } catch (error) {
        console.error("Error fetching navigation modules:", error);
        try {
          const { handleFirestoreError, OperationType } = await import('../lib/firebase');
          handleFirestoreError(error, OperationType.LIST, 'modules');
        } catch (e) {}
      }
    };
    fetchModules();
  }, []);

  const CORE_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'speakez', label: 'SpeakEZ', iconName: 'Mic', description: 'Speaking Practice' },
    { id: 'muet', label: 'MUET Home', iconName: 'GraduationCap', description: 'MUET Speaking Practice' },
    { id: 'writeez', label: 'WriteEZ', iconName: 'PenTool', description: 'Writing Practice' },
    { id: 'readez', label: 'ReadEZ', iconName: 'BookOpen', description: 'Reading Practice' },
    { id: 'listenez', label: 'ListenEZ', iconName: 'Headset', description: 'Listening Practice' },
  ];

  const UTILITY_ITEMS = [
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'support', label: 'Help & Support', icon: Info },
  ];

  // Prevent dynamic modules from clashing with reserved IDs
  const RESERVED_IDS = new Set(['dashboard', 'speakez', 'muet', 'writeez', 'readez', 'listenez', 'history', 'profile', 'admin', 'pricing', 'onboarding', 'login']);

  const NAV_ITEMS = [
    ...CORE_ITEMS,
    ...modules
      .filter(m => {
        const slug = (m.slug || '').toLowerCase();
        const id = (m.id || '').toLowerCase();
        return !RESERVED_IDS.has(slug) && !RESERVED_IDS.has(id);
      })
      .map(mod => ({
        id: mod.slug,
        label: mod.name,
        iconName: mod.iconName,
        description: mod.description
      })),
    ...UTILITY_ITEMS
  ];

  if (isAdmin) {
    NAV_ITEMS.push({ id: 'admin', label: 'Admin', iconName: 'ShieldAlert', description: 'System Management' } as any);
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed left-0 top-0 h-screen w-20 xl:w-72 bg-card border-r border-white/5 z-50 transition-all duration-300",
        className
      )}>
        <button 
          onClick={() => onChange('dashboard')}
          className="p-5 flex w-full items-center justify-center xl:justify-start gap-3 hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-primary text-left"
          aria-label="Return to Dashboard"
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.5)] shrink-0">
            <img src="/images/dashboard/ez-emblem-v1.webp" alt="" className="w-full h-full object-contain rounded-xl"/>
          </div>
          <span className="hidden xl:block font-semibold tracking-tight text-lg truncate">
            EZ Academy
          </span>
        </button>

        <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item: any) => {
            const isActive = activeId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "w-full flex items-center justify-center xl:justify-start gap-3 px-3 py-3 rounded-xl transition-all group relative",
                  isActive 
                    ? "bg-primary text-obsidian shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)] font-semibold" 
                    : "text-white/70 hover:text-white hover:bg-white/5"
                )}
              >
                {item.icon ? (
                  <item.icon size={20} className={cn(
                    "transition-transform group-hover:scale-110 shrink-0",
                    isActive && "text-obsidian"
                  )} />
                ) : (
                  <LucideIcon name={item.iconName || 'Layout'} size={20} className={cn(
                    "transition-transform group-hover:scale-110 shrink-0",
                    isActive && "text-obsidian"
                  )} />
                )}
                <div className="hidden xl:block text-left overflow-hidden">
                  <div className={cn(
                    "text-sm tracking-wide transition-opacity truncate",
                    "opacity-100"
                  )}>
                    {item.label}
                  </div>

                </div>

                {/* Tooltip for desktop collapsed */}
                <div className="lg:xl:hidden absolute left-full ml-4 px-3 py-2 bg-obsidian border border-white/10 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50">
                  {item.label}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-3 xl:px-6 py-3 border-t border-white/5">
          <p className="hidden xl:block mb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40">Follow EZ Academy</p>
          <div className="flex xl:justify-start justify-center"><OfficialSocialLinks variant="sidebar" /></div>
        </div>
        <div className="p-6 border-t border-white/5 pb-20 lg:pb-6 space-y-4">
          <div className="xl:flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/40 to-blue-500/40 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0">
               {userEmail?.[0].toUpperCase()}
             </div>
             <div className="hidden xl:block truncate">
               <div className="text-[10px] font-black uppercase text-white/40 mb-0.5">Account</div>
               <div className="text-xs font-bold text-white truncate">{userEmail}</div>
             </div>
          </div>
          
          <button
            type="button"
            onClick={() => onChange('pricing')}
            aria-label={`${credits || 0} credits. Open plans to top up`}
            className="w-full min-h-11 xl:flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl group cursor-pointer hover:bg-primary/5 hover:border-primary/20 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-primary animate-pulse" />
              <div className="hidden xl:block">
                <div className="text-[10px] font-black uppercase text-white/40 tracking-wider">Credits</div>
                <div className="text-xs font-black italic text-primary leading-none mt-0.5">{credits || 0} Credits</div>
              </div>
            </div>
            <Plus size={12} className="hidden xl:block text-white/20 group-hover:text-primary transition-colors" />
          </button>

          <button 
            onClick={onLogout}
            className="w-full min-h-11 flex items-center justify-center xl:justify-start gap-4 px-4 py-2 rounded-xl text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-colors group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="hidden xl:block text-xs font-bold uppercase tracking-widest">Log out</span>
          </button>
        </div>
      </aside>

      {/* The mobile bar is PersistentNavigation, rendered app-wide from App.tsx. */}
    </>
  );
};
