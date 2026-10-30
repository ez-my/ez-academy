import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, AlertCircle, DollarSign, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';
import { collection, getDocs, query, where, Timestamp, collectionGroup } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db } from '../../lib/firebase';
import { ModuleFlagsGrid } from './ModulesPanel';
import { TooltipHelp } from './TooltipHelp';
import { useUsers } from './UsersPanel';

// Cost Configuration (Standard Rates for calculation - USD converted to MYR approx 4.5)
const PRICING = {
  GEMINI_FLASH: { input: 0.075 / 1000000, output: 0.30 / 1000000 },
  GEMINI_PRO: { input: 3.50 / 1000000, output: 10.50 / 1000000 },
  FIRESTORE: { reads: 0.36 / 1000000, writes: 1.08 / 1000000 },
  HOSTING_FIXED: 5.00, // Fixed monthly cost USD
  CONVERSION_RATE: 4.5, // USD to MYR
};

// Revenue, running costs, margin and the per-skill feature flags.
// This was the "Maintenance" tab; the profit-and-loss numbers are its real subject.
export const RevenueCostsPanel: React.FC = () => {
  // Counts come from the shared user list rather than a stats object some other tab
  // had to populate first, which is why these figures used to read zero.
  const { totalUsers, activeSubscribers } = useUsers();
  const [costBreakdown, setCostBreakdown] = useState<any[]>([]);
  const [usageByDay, setUsageByDay] = useState<any[]>([]);
  const [isCostsLoading, setIsCostsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscribers: 0,
    monthlyRevenue: 0,
    activeTasks: 18,
    estMonthlyCost: 0,
    totalSessions: 0,
    geminiCost: 0,
    firestoreCost: 0,
  });

  const fetchMaintenanceCosts = async () => {
    setIsCostsLoading(true);
    try {
      // 1. Fetch total sessions using collectionGroup
      // Note: In production, you'd want to aggregate this server-side or use a counter
      const sessionsSnapshot = await getDocs(collectionGroup(db, 'sessions'));
      const totalSessions = sessionsSnapshot.size;
      
      // 2. Estimate Gemini costs
      // Assumption: Each session has ~1000 input tokens and ~500 output tokens
      // SpeakEZ uses Flash, but some pro features use Pro
      const avgFlashCostPerSession = (1000 * PRICING.GEMINI_FLASH.input) + (500 * PRICING.GEMINI_FLASH.output);
      const geminiCostUSD = totalSessions * avgFlashCostPerSession;
      
      // 3. Estimate Firestore costs
      // Assumption: 10 reads, 2 writes per session
      const firestoreCostUSD = (totalSessions * 10 * PRICING.FIRESTORE.reads) + (totalSessions * 2 * PRICING.FIRESTORE.writes);
      
      // 4. Fixed Hosting Costs (Cloud Run, DB Storage base)
      const fixedCostUSD = PRICING.HOSTING_FIXED;
      
      const totalCostUSD = geminiCostUSD + firestoreCostUSD + fixedCostUSD;
      const totalCostMYR = totalCostUSD * PRICING.CONVERSION_RATE;
      
      setStats(prev => ({
        ...prev,
        totalSessions,
        geminiCost: geminiCostUSD * PRICING.CONVERSION_RATE,
        firestoreCost: firestoreCostUSD * PRICING.CONVERSION_RATE,
        estMonthlyCost: totalCostMYR
      }));

      // Create breakdown for charts
      setCostBreakdown([
        { name: 'AI Models', value: geminiCostUSD * PRICING.CONVERSION_RATE, color: '#f59e0b' },
        { name: 'Database', value: firestoreCostUSD * PRICING.CONVERSION_RATE, color: '#10b981' },
        { name: 'Hosting', value: fixedCostUSD * PRICING.CONVERSION_RATE, color: '#3b82f6' },
      ]);

      // Simple mock usage by day based on last 7 days from sessions
      const days: Record<string, number> = {};
      const now = Date.now();
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date(now - i * 24 * 60 * 60 * 1000);
        return d.toISOString().split('T')[0];
      }).reverse();

      last7Days.forEach(day => days[day] = 0);
      
      sessionsSnapshot.forEach(doc => {
        const data = doc.data();
        if (!data.timestamp) return;
        
        const timestamp = (data.timestamp as any) instanceof Timestamp ? (data.timestamp as any).toMillis() : data.timestamp;
        const date = new Date(timestamp).toISOString().split('T')[0];
        if (days[date] !== undefined) {
          days[date]++;
        }
      });

      setUsageByDay(last7Days.map(day => ({
        date: day.split('-').slice(1).join('/'),
        sessions: days[day],
        cost: days[day] * avgFlashCostPerSession * PRICING.CONVERSION_RATE
      })));

    } catch (error) {
      console.error("Error fetching costs:", error);
      try {
        const { handleFirestoreError, OperationType } = await import('../../lib/firebase');
        handleFirestoreError(error, OperationType.LIST, 'sessions_group');
      } catch (e) {}
    } finally {
      setIsCostsLoading(false);
    }
  };



  useEffect(() => { fetchMaintenanceCosts(); }, []);

  useEffect(() => {
    setStats(prev => ({ ...prev, totalUsers, activeSubscribers, monthlyRevenue: activeSubscribers * 10 }));
  }, [totalUsers, activeSubscribers]);

  return (
    <>
      {(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center">
                Total Usage
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-white mb-2">{stats.totalSessions}</div>
              <p className="text-xs text-white/40">Total practice sessions logged across all modules.</p>
            </div>
            <div className="glass-card p-6 flex flex-col justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center">
                Cost Efficiency
                <TooltipHelp text="Calculation: (Active Subscribers × RM10) ÷ (Est. Monthly Cost). Shows how sustainable the current operation is." />
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-green-400 mb-2">
                {stats.monthlyRevenue > 0 ? Math.round((stats.monthlyRevenue / (stats.estMonthlyCost || 1)) * 100) : 0}%
              </div>
              <p className="text-xs text-white/40">Revenue to Maintenance cost ratio (RoI).</p>
            </div>
            <div className="glass-card p-6 flex flex-col justify-between border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center">
                Est. Burn Rate
                <TooltipHelp text="Projected monthly total. Includes AI costs, Database ops, and $5.00 fixed hosting. Rates: 4.5 MYR/USD." />
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-white mb-2">RM {Math.round(stats.estMonthlyCost)}</div>
              <p className="text-xs text-white/40">Total projected infrastructure & AI cost per month.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card p-4 sm:p-8">
              <h3 className="text-lg font-bold mb-8 tracking-tight flex items-center">
                Cost Breakdown (MYR)
                <TooltipHelp text="Assumes Gemini 1.5 Flash (~1500 tokens/session) and Firestore (10 reads/2 writes per session)." />
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={costBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {costBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`RM ${parseFloat(value).toFixed(2)}`, 'Cost']}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                {costBreakdown.map((item, i) => (
                  <div key={i}>
                    <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">{item.name}</div>
                    <div className="text-sm font-bold" style={{ color: item.color }}>RM {item.value.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-4 sm:p-8">
              <h3 className="text-lg font-bold mb-8 tracking-tight">Usage Growth (7 Days)</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#0f1115', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="sessions" fill="#ffffff20" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="mt-4 text-[10px] text-center text-white/30 uppercase tracking-widest font-bold">
                Sessions (Grey) vs. AI Cost in RM (Orange)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-4 sm:p-8 flex flex-col justify-between border-primary/10">
              <div>
                <h3 className="text-lg font-bold mb-2 tracking-tight flex items-center gap-2">
                  <TrendingUp className="text-primary" size={20} />
                  Tier Profitability Analysis
                </h3>
                <p className="text-xs text-white/40 mb-8">Maintenance cost vs revenue per user tier (Calculated in MYR)</p>
                
                <div className="space-y-6">
                  {/* Pro Tier */}
                  <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1 italic">Pro Membership</div>
                      <div className="text-xl font-bold text-white">RM 10.00 / head</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Est. Profit</div>
                      <div className={`text-xl font-bold ${stats.monthlyRevenue > stats.estMonthlyCost ? 'text-green-400' : 'text-red-400'}`}>
                        +RM {(10 - (stats.estMonthlyCost / Math.max(stats.totalUsers, 1))).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Free Tier */}
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Free Learner</div>
                      <div className="text-xl font-bold text-white">RM 0.00 / head</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Est. Burn</div>
                      <div className="text-xl font-bold text-red-500/80">
                        -RM {(stats.estMonthlyCost / Math.max(stats.totalUsers, 1)).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cost Per Head</div>
                  <div className="text-lg font-bold text-white">RM {(stats.estMonthlyCost / Math.max(stats.totalUsers, 1)).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Sustainability Threshold</div>
                  <div className="text-lg font-bold text-primary">
                    {Math.ceil((stats.estMonthlyCost / 10))} Subscribers
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 sm:p-8 bg-primary/[0.03] border-primary/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <DollarSign size={120} className="text-primary rotate-12" />
              </div>
              
              <div>
                <h3 className="text-lg font-bold mb-2 tracking-tight flex items-center gap-2">
                  <Activity className="text-primary" size={20} />
                  Net Operating Margin
                </h3>
                <p className="text-xs text-white/40 mb-8 italic uppercase tracking-widest font-black">Monthly Financial Snapshot</p>
                
                <div className="flex flex-col gap-1 justify-center min-h-[140px]">
                  <div className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Estimated Monthly Profit</div>
                  <div className={`text-2xl sm:text-6xl font-black italic tracking-tighter ${stats.monthlyRevenue >= stats.estMonthlyCost ? 'text-white' : 'text-red-500'}`}>
                    RM {(stats.monthlyRevenue - stats.estMonthlyCost).toFixed(2)}
                  </div>
                  <div className={`flex items-center gap-2 mt-4 text-xs font-bold ${stats.monthlyRevenue >= stats.estMonthlyCost ? 'text-green-400' : 'text-red-400'}`}>
                     {stats.monthlyRevenue >= stats.estMonthlyCost ? (
                       <><TrendingUp size={14} /> POSITIVE CASH FLOW</>
                     ) : (
                       <><TrendingDown size={14} /> OPERATING AT LOSS</>
                     )}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                <div className="flex -space-x-3">
                  {Array.from({length: 5}).map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-obsidian bg-white/5 flex items-center justify-center text-[8px] font-bold text-white/20">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-obsidian bg-primary text-obsidian flex items-center justify-center text-[8px] font-black">
                    +{stats.totalUsers > 5 ? stats.totalUsers - 5 : 0}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Monthly Rev</div>
                  <div className="text-xl font-bold text-white italic">RM {stats.monthlyRevenue.toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-4 sm:p-8 bg-amber-500/5 border-amber-500/20">
            <h3 className="text-lg font-bold mb-4 tracking-tight flex items-center gap-2">
              <AlertCircle className="text-amber-500" />
              Optimization Recommendations
            </h3>
            {/* ... recommendations */}
          </div>

          <ModuleFlagsGrid/>
        </motion.div>
      )}
    </>
  );
};
