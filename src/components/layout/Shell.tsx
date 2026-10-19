import React, { useState, useEffect } from 'react';
import { ADMIN_EMAIL } from '../../constants';
import { Navigation } from '../Navigation';
import { CurriculumSelector, CurriculumTrack } from '../muet/CurriculumSelector';
import { cn } from '../../lib/utils';

interface ShellProps {
  children: React.ReactNode;
  activeTab: string;
  onNavigate: (tab: string) => void;
  onLogout: () => void;
  userEmail?: string;
  credits?: number;
}

export const Shell: React.FC<ShellProps> = ({ children, activeTab, onNavigate, onLogout, userEmail, credits }) => {
  const isAdmin = userEmail === ADMIN_EMAIL;
  const [isMobileHidden, setIsMobileHidden] = useState(false);
  
  const [currentTrack, setCurrentTrack] = useState<CurriculumTrack>(() => {
    try {
      const stored = localStorage.getItem('ez_active_track');
      if (stored === 'MUET' || stored === 'SPM') return stored;
    } catch {}
    return activeTab === 'muet' ? 'MUET' : 'SPM';
  });

  useEffect(() => {
    if (activeTab === 'muet') {
      setCurrentTrack('MUET');
    }
  }, [activeTab]);

  const handleTrackChange = (track: CurriculumTrack) => {
    setCurrentTrack(track);
    try {
      localStorage.setItem('ez_active_track', track);
    } catch {}
    if (track === 'MUET') {
      onNavigate('muet');
    } else {
      if (activeTab === 'muet') {
        onNavigate('dashboard');
      }
    }
  };

  return (
    <div className={cn("flex min-h-screen bg-obsidian overflow-x-hidden transition-colors duration-300",activeTab==='dashboard'&&'ez-dashboard-shell')}>
      <Navigation 
        activeId={activeTab}
        onChange={onNavigate}
        onLogout={onLogout}
        isMobileHidden={isMobileHidden}
        setIsMobileHidden={setIsMobileHidden}
        userEmail={userEmail}
        isAdmin={isAdmin}
        credits={credits}
      />

      {/* Main Content */}
      <main 
        id="main-content"
        tabIndex={-1}
        className={cn(
          "min-w-0 w-full flex-1 lg:pl-20 xl:pl-72 transition-all duration-500 focus:outline-none",
          "pb-3 lg:pb-0"
        )}
      >
        <div className="p-4 md:p-8 md:pt-6">
          <div className="min-w-0 max-w-6xl mx-auto space-y-4">
            {/* Top Quick Bar with Track Switcher */}
            {!['dashboard','pricing'].includes(activeTab) && <div className="flex items-center justify-between pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-white/40 hidden sm:inline-block">
                  Course:
                </span>
                <CurriculumSelector
                  currentTrack={currentTrack}
                  onSelectTrack={handleTrackChange}
                  compact
                />
              </div>

              <div className="flex items-center gap-3 text-xs text-white/50">
                <span className="hidden md:inline-block">
                  {currentTrack === 'MUET' ? 'For university entry' : 'Form 4 & 5 SPM Course'}
                </span>
              </div>
            </div>}

            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
