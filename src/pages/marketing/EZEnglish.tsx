import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, CheckCircle2, Play, Lock, Brain, Award, Zap, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOSync } from '../../components/SEOSync';
import { VisionVideo } from '../../components/marketing/VisionVideo';

export const MarketingEZEnglish = () => {
  return (
    <div className="flex flex-col">
      <SEOSync 
        title="EZ English | AI-Powered MUET & SPM Practice"
        description="Access the flagship EZ English platform. Get instant AI feedback on SPM essays and practice MUET speaking with our advanced AI tools."
        keywords="EZ English practice, MUET AI speaking, SPM AI essay feedback, English study tools Malaysia"
      />
      {/* Hero */}
      <section className="pt-24 pb-16 px-6 relative overflow-hidden text-center border-b border-white/5">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-primary/20 blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-4 sm:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-widest text-primary">
            <Zap size={14} fill="currentColor" /> English practice
          </div>
          <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight">
            Meet <span className="italic text-primary">EZ English</span>
          </h1>
          <p className="text-sm md:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto">
            Practise English and get tips to improve.
          </p>
          <div className="flex justify-center gap-4 pt-4">
            <Link to="/login" className="px-8 py-4 bg-primary text-obsidian rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-lg shadow-primary/20">
              Try It Free
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center gap-3 pt-6 opacity-80"
          >
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-obsidian flex items-center justify-center text-xs font-bold text-blue-200">MH</div>
              <div className="w-10 h-10 rounded-full bg-green-500/20 border-2 border-obsidian flex items-center justify-center text-xs font-bold text-green-200">SK</div>
              <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-obsidian flex items-center justify-center text-xs font-bold text-purple-200">AJ</div>
              <div className="w-10 h-10 rounded-full bg-orange-500/20 border-2 border-obsidian flex items-center justify-center text-xs font-bold text-orange-200">TY</div>
              <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-obsidian flex items-center justify-center text-xs font-bold text-primary">+2k</div>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Star size={14} className="fill-current" />
              <Star size={14} className="fill-current" />
              <Star size={14} className="fill-current" />
              <Star size={14} className="fill-current" />
              <Star size={14} className="fill-current" />
            </div>
            <p className="text-sm font-medium text-white/70">Join 2,000+ SPM & MUET students</p>
          </motion.div>
        </div>
        
        {/* NEW: APP VISION VIDEO */}
        <div className="mt-20 max-w-5xl mx-auto px-4 md:px-0">
          <VisionVideo
            badge="App Vision Output"
            title="The Future of Practice"
            description="A visual journey through the SpeakEZ interface, showcasing real-time fluency analysis and the immersive examination environment."
            videoUrl="https://player.vimeo.com/external/370467553.hd.mp4?s=ce7b20a7732a933215903b415a772c72b21c60f2&profile_id=172"
            posterUrl="https://images.unsplash.com/photo-1610484826967-09c5720778c7?q=80&w=2670&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Feature Drilldown */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto space-y-32">
          
          {/* SpeakEZ */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
             <div className="order-2 md:order-1 aspect-square rounded-[3rem] bg-white/5 border border-white/10 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden">
               <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/20 blur-[60px] rounded-full" />
               <div className="z-10 w-full max-w-xs space-y-4">
                 <div className="w-full bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                   <div className="h-2 w-1/3 bg-white/20 rounded-full mb-3" />
                   <div className="h-2 w-2/3 bg-white/20 rounded-full" />
                 </div>
                 <div className="w-full bg-primary/20 p-4 rounded-2xl backdrop-blur-md border border-primary/20 flex gap-3">
                   <div className="w-6 h-6 rounded-full bg-primary/50" />
                   <div className="flex-1 space-y-2">
                     <div className="h-2 w-1/2 bg-primary/40 rounded-full" />
                     <div className="h-2 w-full bg-primary/20 rounded-full" />
                   </div>
                 </div>
               </div>
             </div>
             <div className="order-1 md:order-2 space-y-6">
                <h3 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">SpeakEZ</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  Practise SPM and MUET speaking with AI feedback.
                </p>
                <ul className="space-y-4 text-white/80">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Exam-style feedback</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Feedback on your speech</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Pronunciation error spotting</li>
                </ul>
             </div>
          </div>

          {/* WriteEZ */}
          <div className="grid md:grid-cols-2 gap-12 lg:gap-24 items-center">
             <div className="space-y-6">
                <h3 className="text-2xl sm:text-4xl font-display font-bold tracking-tight">WriteEZ</h3>
                <p className="text-white/60 text-sm md:text-base leading-relaxed">
                  Get tips on grammar, word choice and essay structure.
                </p>
                <ul className="space-y-4 text-white/80">
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Structure and linking words</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Word suggestions</li>
                  <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-primary" /> Estimated language level</li>
                </ul>
             </div>
             <div className="aspect-square rounded-[3rem] bg-white/5 border border-white/10 p-4 sm:p-8 flex items-center justify-center relative overflow-hidden">
               <div className="absolute top-1/4 right-1/4 w-1/2 h-1/2 bg-emerald-500/20 blur-[60px] rounded-full" />
               <div className="z-10 w-full bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                 <div className="flex gap-2 mb-4">
                   <div className="w-2 h-2 rounded-full bg-red-500" />
                   <div className="w-2 h-2 rounded-full bg-yellow-500" />
                   <div className="w-2 h-2 rounded-full bg-green-500" />
                 </div>
                 <div className="space-y-3">
                   <p className="text-xs text-white/40 font-mono line-through">He don't know the answer.</p>
                   <p className="text-xs text-emerald-400 font-mono">He does not know the answer.</p>
                 </div>
               </div>
             </div>
          </div>

        </div>
      </section>

      {/* Security & Data */}
      <section className="py-24 bg-white/5 border-y border-white/5 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-8">
          <Brain size={48} className="text-primary mx-auto opacity-50" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Learn at your level</h2>
          <p className="text-lg text-white/50 leading-relaxed">
            Choose practice that fits your level.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-8">
          <h2 className="text-2xl sm:text-5xl font-display font-bold tracking-tight">Ready to score?</h2>
          <p className="text-white/50 text-xl">Start your English practice today.</p>
          <div className="pt-8 flex flex-col items-center gap-4">
             <Link to="/login" className="inline-block px-12 py-5 bg-white text-obsidian rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-2xl shadow-white/10">
               Access EZ English
             </Link>
             <p className="text-white/40 text-[9px] uppercase tracking-[0.3em] font-black">
               Free plan available — no credit card needed
             </p>
          </div>
        </div>
      </section>

    </div>
  );
};
