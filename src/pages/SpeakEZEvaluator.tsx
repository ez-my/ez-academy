import React, { useState } from 'react';
import { evaluateSpeechTranscript } from '../lib/gemini';
import { motion } from 'motion/react';
import { ChevronLeft, Loader2, PlayCircle, Terminal, BarChart2, CheckCircle2, ChevronRight, Mic } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getFriendlyErrorMessage } from '../lib/apiUtils';

export default function SpeakEZEvaluator() {
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleEvaluate = async () => {
    if (!transcript.trim()) return;
    setIsLoading(true);
    setError(null);
    setResults(null);
    try {
      const evaluation = await evaluateSpeechTranscript(transcript);
      setResults(evaluation);
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans pb-24">
      {/* Background blur */}
      <div className="fixed inset-0 z-0 flex items-center justify-center opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] sm:top-[-20%] left-[-10%] w-[50vw] sm:w-[500px] h-[50vw] sm:h-[500px] rounded-full bg-indigo-600/30 blur-[100px] sm:blur-[120px] mix-blend-screen mix-blend-plus-lighter pointer-events-none"></div>
        <div className="absolute bottom-[-10%] sm:bottom-[-20%] right-[-10%] w-[40vw] sm:w-[400px] h-[40vw] sm:h-[400px] rounded-full bg-purple-600/20 blur-[80px] sm:blur-[100px] mix-blend-screen mix-blend-plus-lighter pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-12">
        <button
          onClick={() => navigate('/app/speakez')}
          className="flex items-center text-white/50 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-black mb-8"
        >
          <ChevronLeft size={14} className="mr-1" /> Back to SpeakEZ
        </button>

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-4">
            <Mic className="w-4 h-4 text-indigo-400 mr-2" />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Speaking feedback</span>
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-tighter uppercase mb-4 neon-text-glow">
            SpeakEZ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Evaluator</span>
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto font-medium text-lg leading-relaxed">
            Paste a speaking transcript for a practice estimate of its grammar, vocabulary and content. A transcript alone cannot assess pronunciation or delivery.
          </p>
        </div>

        {!results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 md:p-8"
          >
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-bold tracking-widest uppercase text-white/70">
                Speech Transcript
              </label>
              <span className="text-xs font-mono text-white/40">{transcript.length} chars</span>
            </div>
            
            <textarea
              className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-white placeholder-white/30 font-medium focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
              placeholder="Paste the transcript of your speech here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
            />

            {error && (
              <div role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error} No score has been assigned to this response.
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleEvaluate}
                disabled={isLoading || !transcript.trim()}
                className="group relative inline-flex items-center justify-center bg-white text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5 mr-3" />
                    Get feedback
                  </>
                )}
                {!isLoading && (
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {results && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Summary Header */}
            <div className="glass-card p-4 sm:p-8 bg-gradient-to-br from-indigo-900/40 to-black border-indigo-500/20 relative overflow-hidden">
               <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none transform rotate-12">
                 <BarChart2 size={240} />
               </div>
               
               <div className="flex flex-col md:flex-row items-center justify-between relative z-10 gap-8">
                 <div>
                   <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 mb-2">Your feedback</h2>
                   <h3 className="text-3xl font-bold tracking-tight">Feedback ready</h3>
                 </div>
                 
                 <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-indigo-500/20 border-2 border-indigo-500 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                      <span className="text-2xl sm:text-4xl font-black text-white">{results.averageScore}</span>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Practice score / 6</span>
                 </div>
               </div>
            </div>

            {/* Detailed Scores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: "Grammar", data: results.grammar },
                { title: "Vocabulary", data: results.vocabulary },
                { title: "Communicative Competence", data: results.communicativeCompetence },
                { title: "Overall Spoken Performance", data: results.overallSpokenPerformance }
              ].map((item, idx) => (
                <div key={idx} className="glass-panel p-6 border-white/5 hover:border-white/10 transition-colors">
                   <div className="flex justify-between items-start mb-4">
                     <h4 className="font-bold uppercase tracking-wider text-sm text-white/90">{item.title}</h4>
                     <span className="bg-white/10 text-white font-mono text-xs px-2 py-1 rounded-md border border-white/10">BAND {item.data?.score || 0}</span>
                   </div>
                   <p className="text-sm text-white/70 leading-relaxed mb-4">{item.data?.feedback}</p>
                   {item.data?.quote && (
                     <div className="mt-auto bg-black/40 rounded-lg p-3 border-l-2 border-indigo-500">
                       <p className="text-xs text-white/50 italic">"{item.data.quote}"</p>
                     </div>
                   )}
                </div>
              ))}
            </div>

            {/* How to Improve */}
            {results.howToImprove && results.howToImprove.length > 0 && (
              <div className="glass-card p-4 sm:p-8 border-purple-500/20 bg-purple-900/10">
                <h3 className="text-lg font-black uppercase tracking-widest text-purple-400 mb-6 flex items-center">
                  <PlayCircle className="w-5 h-5 mr-3" /> ACTIONABLE INTELLIGENCE
                </h3>
                <ul className="space-y-4">
                  {results.howToImprove.map((tip: string, idx: number) => (
                    <li key={idx} className="flex items-start">
                      <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center mr-4">
                        <CheckCircle2 className="w-3 h-3 text-purple-400" />
                      </div>
                      <p className="text-white/80 font-medium leading-relaxed">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center pt-8">
              <button
                onClick={() => { setResults(null); setTranscript(''); }}
                className="flex items-center text-white/50 hover:text-white transition-colors uppercase text-[10px] tracking-widest font-black"
              >
                <ChevronLeft size={14} className="mr-1" /> Try another answer
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
