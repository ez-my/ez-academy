import React from 'react';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Clock, 
  FileText, 
  Sparkles, 
  Volume2, 
  RotateCcw,
  Eye,
  Info,
  Lightbulb
} from 'lucide-react';
import { MUETExaminerReport } from '../../types/muet';
import { cn } from '../../lib/utils';

interface MUETExaminerReportViewProps {
  report: MUETExaminerReport;
  onRetest?: () => void;
  onSaveToProgress?: () => void;
  isSaving?: boolean;
}

export const MUETExaminerReportView: React.FC<MUETExaminerReportViewProps> = ({
  report,
  onRetest,
  onSaveToProgress,
  isSaving = false
}) => {
  return (
    <div className="space-y-4">
      {/* Top Hero Banner with Band Estimate */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-primary/10 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-black uppercase tracking-wider">
              <Sparkles size={14} />
              Speaking Practice Feedback
            </div>
            <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
              {report.topicTitle}
            </h2>
            <p className="text-xs text-white/60">
              Speaker {report.candidate} • {report.testType === 'Part1' ? 'Part 1: Speaking on your own' : report.testType === 'Part2' ? 'Part 2: Talking together' : 'Full Mock Speaking Test'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 text-center shrink-0 min-w-[200px]">
            <div className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-1">
              Estimated Band Score
            </div>
            <div className="text-3xl md:text-4xl font-black text-primary tracking-tight">
              {report.overallBandEstimate.split('-')[0].trim()}
            </div>
            <div className="text-xs font-semibold text-white/80 mt-1">
              {report.overallBandEstimate.split('-')[1]?.trim() || 'Practice Estimate'}
            </div>
          </div>
        </div>

        {/* Official Disclaimer Banner */}
        <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
          <Info size={16} className="shrink-0" />
          <span>{report.disclaimer}</span>
        </div>
      </div>

      {/* Speaking Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Speaking Time</div>
          <div className="text-xl font-bold text-white mt-1">
            {Math.floor(report.durationSeconds / 60)}m {report.durationSeconds % 60}s
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Words Spoken</div>
          <div className="text-xl font-bold text-white mt-1">{report.wordCount} words</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Speech Pace</div>
          <div className="text-xl font-bold text-primary mt-1">{report.speechPaceEstimate}</div>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-wider text-white/50">Hesitation Fillers</div>
          <div className="text-xl font-bold text-white mt-1">
            {report.fillerCount} {report.fillerCount === 1 ? 'word' : 'words'}
          </div>
          {report.fillerWordsDetected.length > 0 && (
            <div className="text-[10px] text-white/40 truncate mt-0.5">
              {report.fillerWordsDetected.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* 4 Core Criteria Feedback Cards */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <CheckCircle2 size={18} className="text-primary" />
          Feedback by Exam Skill
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Answering the Question / Answering the question */}
          <div className="p-5 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Answering the Question</h4>
                <p className="text-[10px] text-white/50">Addressing your assigned points and staying on topic</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                {report.taskFulfilment.score}/5 ({report.taskFulfilment.cefrLevel})
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-white/80 font-medium">
                {report.taskFulfilment.observations[0]}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-primary text-[11px] leading-relaxed">
                <strong>Tip:</strong> {report.taskFulfilment.suggestions[0]}
              </div>
            </div>
          </div>

          {/* Fluency & Coherence / Linking words and flow */}
          <div className="p-5 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Flow & Linking Words</h4>
                <p className="text-[10px] text-white/50">Speaking smoothly and using connectors like 'moreover'</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                {report.fluencyAndCoherence.score}/5 ({report.fluencyAndCoherence.cefrLevel})
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-white/80 font-medium">
                {report.fluencyAndCoherence.observations[0]}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-primary text-[11px] leading-relaxed">
                <strong>Tip:</strong> {report.fluencyAndCoherence.suggestions[0]}
              </div>
            </div>
          </div>

          {/* Language & Grammar / Clear everyday sentences */}
          <div className="p-5 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Grammar & Vocabulary</h4>
                <p className="text-[10px] text-white/50">Accurate sentences and appropriate words</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                {report.languageAndGrammar.score}/5 ({report.languageAndGrammar.cefrLevel})
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-white/80 font-medium">
                {report.languageAndGrammar.observations[0]}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-primary text-[11px] leading-relaxed">
                <strong>Tip:</strong> {report.languageAndGrammar.suggestions[0]}
              </div>
            </div>
          </div>

          {/* Interaction & Communicative Competence */}
          <div className="p-5 rounded-2xl bg-card border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white">Interaction & Confidence</h4>
                <p className="text-[10px] text-white/50">Clear greeting, turn-taking, and polite listening</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold">
                {report.interactionAndCommunicativeCompetence.score}/5 ({report.interactionAndCommunicativeCompetence.cefrLevel})
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="text-white/80 font-medium">
                {report.interactionAndCommunicativeCompetence.observations[0]}
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 text-primary text-[11px] leading-relaxed">
                <strong>Tip:</strong> {report.interactionAndCommunicativeCompetence.suggestions[0]}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Evidence Highlight */}
      {report.transcriptEvidence && (
        <div className="p-5 rounded-2xl bg-card border border-white/10 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Lightbulb size={16} className="text-primary" />
            Transcript Examples from Your Speaking
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                What you did well:
              </div>
              <p className="text-xs text-white/90 italic font-medium">
                "{report.transcriptEvidence.strongQuote}"
              </p>
              <p className="text-[11px] text-white/60">
                {report.transcriptEvidence.whyStrong}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Sentence to Upgrade:
              </div>
              <p className="text-xs text-white/80 italic">
                "{report.transcriptEvidence.upgradeQuote}"
              </p>
              <div className="p-2 rounded-lg bg-black/40 text-amber-300 text-xs">
                <strong>Try instead:</strong> "{report.transcriptEvidence.suggestedAlternative}"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Self-Reflection Reminders (Never claimed as observed from audio) */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-white">
          <Eye size={16} className="text-primary" />
          <span>Real Exam Habits (Self-Check Reminders)</span>
        </div>
        <p className="text-[11px] text-white/50">
          The examiner cannot observe your eyes or notes through online practice, so keep these self-checks in mind for the real exam room:
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-white/80">
          <li className="p-3 rounded-xl bg-card border border-white/5">
            <strong className="block text-primary text-[11px] mb-1">Eye Contact</strong>
            {report.selfReflectionReminders.eyeContactNote}
          </li>
          <li className="p-3 rounded-xl bg-card border border-white/5">
            <strong className="block text-primary text-[11px] mb-1">Looking at Notes</strong>
            {report.selfReflectionReminders.notesDependenceNote}
          </li>
          <li className="p-3 rounded-xl bg-card border border-white/5">
            <strong className="block text-primary text-[11px] mb-1">Body Posture</strong>
            {report.selfReflectionReminders.bodyLanguageNote}
          </li>
        </ul>
      </div>

      {/* Spoken Transcript Drawer */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <details className="text-xs">
          <summary className="font-bold text-white/80 cursor-pointer hover:text-white flex items-center justify-between">
            <span>View Full Spoken Transcript</span>
            <span className="text-[10px] text-primary">Expand</span>
          </summary>
          <div className="mt-3 p-3 rounded-xl bg-obsidian text-white/70 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {report.rawTranscript}
          </div>
        </details>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        {onRetest && (
          <button
            type="button"
            onClick={onRetest}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/20 text-white hover:bg-white/5 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw size={14} />
            <span>Try Another Topic</span>
          </button>
        )}

        {onSaveToProgress && (
          <button
            type="button"
            disabled={isSaving}
            onClick={onSaveToProgress}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-primary text-obsidian font-bold text-xs hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-transform active:scale-95"
          >
            <CheckCircle2 size={15} />
            <span>{isSaving ? 'Saving...' : 'Save to My Progress'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
