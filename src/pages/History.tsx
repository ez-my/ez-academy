import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { History as HistoryIcon, Play, ExternalLink, Calendar, Trophy, Trash2, Clock, X } from 'lucide-react';
import { PracticeSession } from '../types';
import { audioStorage } from '../lib/storage';
import { auth, getSessions } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

export const History: React.FC = () => {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<PracticeSession | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      if (!auth.currentUser) return;
      try {
        const data = await getSessions(auth.currentUser.uid);
        // Sort by most recent
        setSessions(data.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchSessions();
  }, []);

  const openSession = async (session: PracticeSession) => {
    setSelectedSession(session);
    const blob = await audioStorage.getAudio(session.id);
    if (blob) {
      setAudioUrl(URL.createObjectURL(blob));
    } else {
      setAudioUrl(null);
    }
  };

  const closeSession = () => {
    setSelectedSession(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
          <HistoryIcon className="text-primary" /> History
        </h2>
        <p className="text-white/40 uppercase tracking-widest text-xs font-bold">Your past practice</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {sessions.map((session, i) => (
          <motion.button
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => openSession(session)}
            className="glass-card p-4 sm:p-6 flex items-center gap-3 sm:gap-6 text-left group hover:bg-white/10 transition-all border-l-4 border-primary"
          >
            <div className="w-16 h-16 shrink-0 bg-white/5 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-primary font-bold text-xl">{(session.readingResult || session.listeningResult) ? `${(session.readingResult || session.listeningResult).correct}/${(session.readingResult || session.listeningResult).total}` : session.score === null ? 'Not scored' : session.score}</span>
              <span className="text-[10px] text-white/40 font-bold uppercase">{(session.readingResult || session.listeningResult) ? 'Marks' : session.score === null ? 'Completed' : 'Score'}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                 <h3 className="font-bold text-base sm:text-lg">{session.type} Practice</h3>
                 <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] text-white/40 font-bold uppercase tracking-widest">
                   {new Date(session.timestamp).toLocaleDateString()}
                 </span>
              </div>
              <p className="text-white/40 text-sm truncate max-w-md">{session.transcript || 'No transcript available'}</p>
            </div>

            <div className="flex items-center gap-6 text-white/20">
               {!(session.readingResult || session.listeningResult) && <div className="text-right">
                  <p className="text-xs font-bold uppercase">Duration</p>
                  <p className="text-sm text-white/60">{(session.duration / 1000).toFixed(1)}s</p>
               </div>}
               <div className="w-10 h-10 rounded-full border border-current flex items-center justify-center group-hover:bg-primary group-hover:text-obsidian group-hover:border-primary transition-all">
                  <Play size={16} fill="currentColor" />
               </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-obsidian/90 backdrop-blur-sm"
            onClick={closeSession}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 sm:p-8 border-b border-white/10 flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold">{selectedSession.type} Report</h3>
                  <p className="break-all text-white/40 text-[10px] font-bold uppercase tracking-widest">Session ID: {selectedSession.id}</p>
                </div>
                <button onClick={closeSession} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
                {/* Audio Playback */}
                {audioUrl && (
                  <div className="bg-white/5 p-6 rounded-3xl flex items-center gap-6">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-obsidian">
                       <Clock size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-white/40 font-bold uppercase mb-2">Voice Recording</p>
                      <audio controls src={audioUrl} className="w-full h-8" />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries((selectedSession.readingResult || selectedSession.listeningResult) ? {} : selectedSession.metrics || {}).map(([key, value]) => (
                    <div key={key} className="bg-white/5 p-4 rounded-2xl">
                      <p className="text-[10px] text-white/30 uppercase font-bold mb-1">{key}</p>
                      <div className="flex items-end justify-between">
                        <span className="text-xl font-bold">{value}%</span>
                        <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Analysis */}
                <div className="prose prose-invert max-w-none text-white/70 text-sm leading-relaxed">
                  <ReactMarkdown>{selectedSession.feedback}</ReactMarkdown>
                </div>
              </div>

              <div className="p-4 sm:p-8 border-t border-white/10 flex gap-4">
                 <button className="flex-1 py-4 rounded-2xl bg-white/5 text-sm font-bold text-white/40 hover:bg-white/10 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                   <Trash2 size={16} /> Delete Data
                 </button>
                 <button className="flex-1 btn-primary uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                   <ExternalLink size={16} /> Share Report
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
