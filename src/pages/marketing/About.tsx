import React from 'react';
import { Target, Flag, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOSync } from '../../components/SEOSync';
import { VisionVideo } from '../../components/marketing/VisionVideo';

export const MarketingAbout = React.memo(() => {
  return (
    <div className="flex flex-col">
      <SEOSync 
        title="About Us | EZ Academy - The Future of English Education"
        description="Learn about EZ Academy's mission to empower Malaysian students with AI-powered English proficiency tools. Our story, vision, and commitment to excellence."
        keywords="EZ Academy story, English education Malaysia, AI English learning vision"
      />
      {/* Hero */}
      <section className="pt-24 pb-16 px-6 relative text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight">
            Our <span className="italic text-primary">Story</span>
          </h1>
          <p className="text-sm md:text-lg text-white/60 leading-relaxed">
            Helping students learn English with teachers and technology.
          </p>
        </div>
      </section>

      {/* NEW: MISSION VIDEO SECTION */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <VisionVideo
            badge="Origin Story AI"
            title="A Mission in Motion"
            description="From a classroom vision to a nationwide digital ecosystem. See how EZ Academy is transforming linguistic education for the next generation of Malaysian students."
            videoUrl="https://player.vimeo.com/external/494252666.hd.mp4?s=2f5d513b051259da2f170f05856a46cd40939a9c&profile_id=175"
            posterUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"
          />
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="p-4 sm:p-8 md:p-12 bg-white/5 border border-white/10 rounded-[2rem]">
            <Target size={32} className="text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-white/60 leading-relaxed md:text-lg">
              To democratize high-level English coaching by providing accessible, structured, and intelligent tools that build genuine confidence in students across the nation.
            </p>
          </div>
          <div className="p-4 sm:p-8 md:p-12 bg-primary/5 border border-primary/20 rounded-[2rem]">
            <Flag size={32} className="text-primary mb-6" />
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-white/60 leading-relaxed md:text-lg">
              To be the premier ecosystem for educational excellence where every student has the blueprint to master communication and critical thinking.
            </p>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 space-y-6">
            <h2 className="text-[10px] font-black uppercase text-primary tracking-widest">The Founder</h2>
            <h3 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight">Mohamad Shahrilniza</h3>
            <p className="text-white/60 text-lg leading-relaxed">
              Before EZ Academy became a digital platform, it started as a vision to improve the broken methods of language learning in schools. As a debate coach and senior English educator, I realized that students were being taught how to pass exams, not how to speak and write with actual conviction.
            </p>
            <p className="text-white/60 text-lg leading-relaxed">
              Combining a deep understanding of CEFR evaluation rubrics and the latest advancements in AI, EZ Academy was born—not just as a tuition center, but as an EdTech ecosystem designed to scale educational excellence.
            </p>
            <div className="pt-6">
               <h4 className="font-bold text-white mb-4">Credentials & Background</h4>
               <ul className="space-y-3 test-sm text-white/50">
                 <li className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Specialist in SPM & MUET prep
                 </li>
                 <li className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" /> National-level Debate Coach
                 </li>
                 <li className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Educational Technologist
                 </li>
               </ul>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-white/5 border border-white/10 relative">
               <img src="/founder.jpg" alt="Founder" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop"; }} />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center px-6">
         <h3 className="text-3xl font-bold mb-8">Join the EZ Ecosystem</h3>
         <Link to="/programs" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm hover:text-white transition-colors">
            View Our Programs <ArrowRight size={16} />
         </Link>
      </section>
    </div>
  );
});
