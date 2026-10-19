import React, { useState } from 'react';
import { 
  Trophy, 
  Clock, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  Mic, 
  Users,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { MUETExaminerReport } from '../../types/muet';
import { MUETExaminerReportView } from './MUETExaminerReportView';
import { cn } from '../../lib/utils';

interface MUETProgressProps {
  sessions: MUETExaminerReport[];
  onStartPracticePart1: () => void;
  onStartPracticePart2: () => void;
  onStartMockTest: () => void;
}

export const MUETProgress: React.FC<MUETProgressProps> = ({
  sessions,
  onStartPracticePart1,
  onStartPracticePart2,
  onStartMockTest
}) => {
  const [selectedReport, setSelectedReport] = useState<MUETExaminerReport | null>(null);

  // Stats calculation
  const totalSessions = sessions.length;
  const avgBand = totalSessions > 0
    ? (sessions.reduce((acc, s) => acc + (s.bandScoreNumber || 3.0), 0) / totalSessions).toFixed(1)
    : '0.0';

  const part1Count = sessions.filter(s => s.testType === 'Part1').length;
  const part2Count = sessions.filter(s => s.testType === 'Part2').length;
  const mockCount = sessions.filter(s => s.testType === 'Mock').length;

  if (selectedReport) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedReport(null)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5"
        >
          <span>← Back to All Saved Sessions</span>
        </button>

        <MUETExaminerReportView
          report={selectedReport}
          onRetest={() => setSelectedReport(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Total Sessions</div>
          <div className="text-lg md:text-xl font-black text-white mt-1">{totalSessions}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Completed practices</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Average Band</div>
          <div className="text-lg md:text-xl font-black text-primary mt-1">
            {totalSessions > 0 ? `Band ${avgBand}` : '—'}
          </div>
          <div className="text-[10px] text-white/40 mt-0.5">Practice estimate</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Part 1 Practices</div>
          <div className="text-lg md:text-xl font-black text-white mt-1">{part1Count}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Speaking on your own</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Group & Mocks</div>
          <div className="text-lg md:text-xl font-black text-white mt-1">{part2Count + mockCount}</div>
          <div className="text-[10px] text-white/40 mt-0.5">{part2Count} Part 2 • {mockCount} Mocks</div>
        </div>
      </div>

      {/* History List or Empty State */}
      {sessions.length === 0 ? (
        <div className="p-10 md:p-14 rounded-3xl bg-card border border-white/10 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Mic size={28} />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-bold text-white">No Speaking Sessions Saved Yet</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Complete your first Part 1 presentation, Part 2 group discussion, or full mock exam to see your speaking progress and band estimates here.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onStartPracticePart1}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-obsidian text-xs font-bold hover:bg-primary/90 transition-all"
            >
              Start Part 1 Practice (2:00)
            </button>
            <button
              type="button"
              onClick={onStartPracticePart2}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              Start Part 2 Discussion (10:00)
            </button>
            <button
              type="button"
              onClick={onStartMockTest}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-primary/40 text-primary hover:bg-primary/10 text-xs font-bold transition-all"
            >
              Start Full Mock Test
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Recent Speaking Sessions ({sessions.length})
          </h3>

          <div className="space-y-3">
            {sessions.map(s => {
              const formattedDate = new Date(s.date).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedReport(s)}
                  className="p-5 rounded-2xl bg-card border border-white/10 hover:border-primary/40 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-md",
                        s.testType === 'Mock'
                          ? "bg-purple-500/20 text-purple-300"
                          : s.testType === 'Part2'
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-primary/20 text-primary"
                      )}>
                        {s.testType === 'Mock' ? 'Full Mock Test' : s.testType === 'Part2' ? 'Part 2 Group' : 'Part 1 Individual'}
                      </span>
                      <span className="text-[11px] text-white/40">Speaker {s.candidate}</span>
                      <span className="text-[11px] text-white/40">• {formattedDate}</span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                      {s.topicTitle}
                    </h4>

                    <div className="text-[11px] text-white/50">
                      {s.wordCount} words spoken • {Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s • Pace: {s.speechPaceEstimate}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-base font-black text-primary">
                        {s.overallBandEstimate.split('-')[0].trim()}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {s.overallBandEstimate.split('-')[1]?.trim() || 'Practice'}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
