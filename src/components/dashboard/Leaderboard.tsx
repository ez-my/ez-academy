import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, Crown, Star, TrendingUp, TrendingDown, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LeaderboardUser {
  uid: string;
  displayName: string;
  points: number;
  level: string;
  email?: string;
  photoURL?: string;
}

// Pseudo-random number generator for stable trend based on uid
const getTrend = (uid: string) => {
  const hash = uid.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const isUp = hash % 2 === 0;
  const percentage = (hash % 15) + 1; // 1-15%
  return { isUp, percentage };
};

export const Leaderboard: React.FC = () => {
  const [topUsers, setTopUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  } as const;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        // Add a timeout to the fetch to avoid hanging on slow queries
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
          const response = await fetch('/api/leaderboard', { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.leaderboard) {
              setTopUsers(data.leaderboard);
              return;
            } else if (data.error) {
              console.warn('Leaderboard API returned error:', data.error);
            }
          } else {
            console.warn('Leaderboard API responded with status:', response.status);
          }
        } catch (fetchErr) {
          console.warn('API fetch failed, falling back to direct Firestore:', fetchErr);
        }
        
        // Never query the full users collection from a browser: profiles contain
        // private fields, and only the server may read and redact them.
        setTopUsers([]);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-4 sm:p-8 animate-pulse bg-white/5 h-96">
        <div className="h-6 w-48 bg-white/10 rounded mb-8"></div>
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-12 w-full bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy size={24} className="text-yellow-400" />
          Top Learners
        </h3>
        <div className="px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full text-[10px] font-black uppercase text-yellow-500 tracking-[0.2em] italic">
          Leaderboard
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
      >
        {/* Top 3 Spotlight */}
        <div className="lg:col-span-1 space-y-4">
          {topUsers.slice(0, 3).map((user, idx) => {
            const trend = (user as any).trend || { isUp: true, percentage: 5 };
            return (
              <motion.div
                key={user.uid}
                variants={itemVariants}
                className={cn(
                  "glass-card p-6 border-l-4 relative overflow-hidden",
                  idx === 0 ? "border-l-yellow-400 bg-yellow-400/5" : 
                  idx === 1 ? "border-l-slate-400 bg-slate-400/5" : 
                  "border-l-amber-600 bg-amber-600/5"
                )}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  {idx === 0 ? <Crown size={40} /> : <Medal size={40} />}
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-2xl object-cover shadow-lg border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg border border-white/10 backdrop-blur-sm">
                        <User size={24} className="text-white/50" />
                      </div>
                    )}
                    <div className={cn(
                      "absolute -bottom-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black italic shadow-lg z-10 border-2 border-obsidian",
                      idx === 0 ? "bg-yellow-400 text-obsidian" : 
                      idx === 1 ? "bg-slate-400 text-obsidian" : 
                      "bg-amber-600 text-white"
                    )}>
                      {idx + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black italic uppercase tracking-tight text-white mb-0.5 truncate">
                      {user.displayName}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/40">
                        <Star size={10} className="text-primary" />
                        Lvl {user.level || 'Novice'}
                      </div>
                      <div className={cn("flex items-center gap-1 text-[10px] font-black italic", trend.isUp ? "text-primary" : "text-red-400")}>
                        {trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {trend.percentage}%
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Points</span>
                  <span className="text-xl font-black italic text-primary">{user.points?.toLocaleString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Ranking List */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 glass-card p-2 sm:p-4 overflow-hidden border border-white/5"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[400px]">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/30">Rank</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/30">User</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Points</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Trend</th>
                </tr>
              </thead>
              <motion.tbody
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {topUsers.slice(3).map((user, idx) => {
                  const trend = (user as any).trend || { isUp: true, percentage: 5 };
                  return (
                    <motion.tr 
                      key={user.uid}
                      variants={itemVariants}
                      className="group hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/60 group-hover:text-primary transition-colors">
                          {idx + 4}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-lg object-cover border border-white/10" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/10 backdrop-blur-sm">
                              <User size={14} className="text-white/50" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-white group-hover:text-primary transition-colors truncate max-w-[150px]">
                              {user.displayName}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-black italic">
                              {user.level || 'Beginner'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono font-black text-white/80">{user.points?.toLocaleString()}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className={cn("flex items-center justify-end gap-1 text-[10px] font-black italic", trend.isUp ? "text-primary" : "text-red-400")}>
                          {trend.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          <span>{trend.percentage}%</span>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
                {topUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 sm:p-12 text-center text-white/20 font-black uppercase tracking-[0.3em] italic">
                      Leaderboard sequence initializing...
                    </td>
                  </tr>
                )}
              </motion.tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};
