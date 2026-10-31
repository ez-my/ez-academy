import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, AlertCircle, DollarSign, TrendingDown, TrendingUp, Users, Zap } from 'lucide-react';
import { collection, getDocs, orderBy, query, where, Timestamp, collectionGroup } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { db } from '../../lib/firebase';
import { PLAN_NAMES } from '../../packages';
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

const MS_PER_DAY = 86400000;
const REVENUE_WINDOW_DAYS = 30;

// createdAt turns up as a Firestore Timestamp, a millis number or an ISO string
// depending on which code path wrote the record.
const toMillis = (value: any): number => {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

// Revenue from money that actually settled, rather than a headcount multiplied by a
// flat RM10. The catalogue is nine products between RM5 and RM15, so that flat rate
// made the margin, the break-even point and the cash-flow verdict all wrong.
function useRevenue() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isRevenueLoading, setIsRevenueLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getDocs(query(collection(db, 'transactions'), orderBy('createdAt', 'desc')))
      .then(snapshot => { if (alive) setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as any))); })
      .catch(error => console.error('Could not load transactions for revenue:', error))
      .finally(() => { if (alive) setIsRevenueLoading(false); });
    return () => { alive = false; };
  }, []);

  const since = Date.now() - REVENUE_WINDOW_DAYS * MS_PER_DAY;
  const recent = transactions.filter(tx => tx.status === 'SUCCESS' && toMillis(tx.createdAt) >= since);

  const monthlyRevenue = recent.reduce((total, tx) => total + (Number(tx.amount) || 0), 0);
  const payingCustomers = new Set(recent.map(tx => tx.userEmail || tx.userId || tx.id)).size;
  const revenuePerCustomer = payingCustomers ? monthlyRevenue / payingCustomers : 0;

  const grouped: Record<string, { id: string; name: string; orders: number; revenue: number }> = {};
  for (const tx of recent) {
    const id = tx.planId || 'unknown';
    grouped[id] ??= { id, name: tx.planName || PLAN_NAMES[id] || id, orders: 0, revenue: 0 };
    grouped[id].orders += 1;
    grouped[id].revenue += Number(tx.amount) || 0;
  }
  const byProduct = Object.values(grouped).sort((a, b) => b.revenue - a.revenue);

  const awaitingApproval = transactions.filter(tx =>
    !tx.archived && tx.status !== 'SUCCESS' && tx.status !== 'REJECTED' && tx.status !== 'FAILED').length;

  return { isRevenueLoading, monthlyRevenue, payingCustomers, revenuePerCustomer, byProduct, awaitingApproval };
}

// Revenue, running costs, margin and the per-skill feature flags.
// This was the "Maintenance" tab; the profit-and-loss numbers are its real subject.
export const RevenueCostsPanel: React.FC<{ onOpenTab?: (tab: string) => void }> = ({ onOpenTab }) => {
  // Counts come from the shared user list rather than a stats object some other tab
  // had to populate first, which is why these figures used to read zero.
  const { totalUsers, activeSubscribers } = useUsers();
  const { monthlyRevenue, payingCustomers, revenuePerCustomer, byProduct, awaitingApproval } = useRevenue();
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
    setStats(prev => ({ ...prev, totalUsers, activeSubscribers, monthlyRevenue }));
  }, [totalUsers, activeSubscribers, monthlyRevenue]);

  return (
    <>
      {(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {awaitingApproval > 0 && (
            <button
              type="button"
              onClick={() => onOpenTab?.('payments')}
              className="w-full glass-card p-5 flex items-center justify-between gap-4 text-left border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <AlertCircle size={20} className="text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white">
                    {awaitingApproval} {awaitingApproval === 1 ? 'payment is' : 'payments are'} waiting for you
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">Nothing is credited to a learner until you approve it.</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400 italic whitespace-nowrap">Review →</span>
            </button>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div className="glass-card p-6 flex flex-col justify-between border-primary/20">
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary mb-4 flex items-center">
                Revenue · {REVENUE_WINDOW_DAYS} days
                <TooltipHelp text="Sum of successful transactions over the period. Pending and rejected payments are excluded." />
              </h4>
              <div className="text-2xl sm:text-4xl font-black text-white mb-2 tabular-nums">RM {monthlyRevenue.toFixed(2)}</div>
              <p className="text-xs text-white/40">{payingCustomers} paying {payingCustomers === 1 ? 'customer' : 'customers'}.</p>
            </div>
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
                <TooltipHelp text={`Settled revenue over the last ${REVENUE_WINDOW_DAYS} days ÷ estimated monthly cost. Taken from successful transactions, not an assumed price per head.`} />
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
              <div className="glass-card p-4 sm:p-10">
                <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center">
                  Revenue by product
                  <TooltipHelp text={`Successful transactions over the last ${REVENUE_WINDOW_DAYS} days, grouped by what was bought.`} />
                </h3>
                <p className="text-xs text-white/40 mb-8">What people actually paid for, last {REVENUE_WINDOW_DAYS} days (MYR)</p>

                {byProduct.length === 0 ? (
                  <p className="text-sm text-white/40 py-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                    No settled payments in the last {REVENUE_WINDOW_DAYS} days.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {byProduct.map(product => (
                      <div key={product.id}>
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="font-bold text-white truncate">{product.name}</span>
                          <span className="text-white/60 tabular-nums whitespace-nowrap">
                            RM {product.revenue.toFixed(2)} · {product.orders} {product.orders === 1 ? 'order' : 'orders'}
                          </span>
                        </div>
                        <div className="my-2 h-1.5 rounded bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded bg-primary"
                            style={{ width: `${monthlyRevenue ? (product.revenue / monthlyRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 mt-2 border-t border-white/10 grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Paying customers</div>
                        <div className="text-xl font-bold text-white tabular-nums">{payingCustomers}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1 italic">Average per customer</div>
                        <div className="text-xl font-bold text-white tabular-nums">RM {revenuePerCustomer.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Cost Per Head</div>
                  <div className="text-lg font-bold text-white">RM {(stats.estMonthlyCost / Math.max(stats.totalUsers, 1)).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Sustainability Threshold</div>
                  <div className="text-lg font-bold text-primary">
                    {revenuePerCustomer > 0 ? `${Math.ceil(stats.estMonthlyCost / revenuePerCustomer)} customers` : 'No sales yet'}
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
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-obsidian bg-white/5 flex items-center justify-center text-[10px] font-bold text-white/20">
                      U{i}
                    </div>
                  ))}
                  <div className="w-8 h-8 rounded-full border-2 border-obsidian bg-primary text-obsidian flex items-center justify-center text-[10px] font-black">
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
