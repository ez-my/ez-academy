import React from 'react';
import { Calendar, Users, Briefcase, ArrowRight, Clock, Star } from 'lucide-react';
import { SEOSync } from '../../components/SEOSync';

export const MarketingPrograms = () => {
  return (
    <div className="flex flex-col">
      <SEOSync 
        title="Our Programs | MUET & SPM English Excellence Zones"
        description="Comprehensive English programs including MUET speaking workshops, SPM intensive training, and Excellence Zone physical tuition classes in Malaysia."
        keywords="SPM English tuition, MUET speaking workshop, Excellence Zone English, English programs Malaysia"
      />
      <section className="pt-24 pb-16 px-6 text-center">
        <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
          Physical & <span className="italic text-primary">Live</span> Training
        </h1>
        <p className="text-sm md:text-lg text-white/60 max-w-2xl mx-auto">
          Learn with a teacher in classes and workshops.
        </p>
      </section>

      {/* Tuition */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <Users size={24} className="text-primary" />
            <h2 className="text-2xl font-bold">Excellence Zone (Tuition)</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4 sm:space-y-8">
              <p className="text-lg text-white/60 leading-relaxed">
                Our flagship weekly coaching program for SPM and MUET candidates. We keep our classes structured, intense, and heavily focused on execution and marking rubrics.
              </p>
              
              <div className="space-y-4">
                 <h4 className="font-bold text-sm uppercase tracking-widest text-primary">What You Get:</h4>
                 <ul className="space-y-3 text-white/80">
                   <li className="flex items-start gap-3"><Star size={16} className="mt-1 text-primary shrink-0" /> Weekly intensive writing models</li>
                   <li className="flex items-start gap-3"><Star size={16} className="mt-1 text-primary shrink-0" /> Live speaking evaluations</li>
                   <li className="flex items-start gap-3"><Star size={16} className="mt-1 text-primary shrink-0" /> Free access to EZ English EZ Pro+ tier</li>
                   <li className="flex items-start gap-3"><Star size={16} className="mt-1 text-primary shrink-0" /> Comprehensive study notes and templates</li>
                 </ul>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-4 sm:p-8 rounded-[2rem] space-y-6">
              <h3 className="text-xl font-bold mb-6">Schedule & Pricing</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-white/40" />
                    <span>SPM Practice (Form 4/5)</span>
                  </div>
                  <span className="font-bold text-primary">RM 80/mo</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Clock size={16} className="text-white/40" />
                    <span>MUET Intensive</span>
                  </div>
                  <span className="font-bold text-primary">RM 150/mo</span>
                </div>
              </div>
              
              <div className="pt-6">
                <a href="https://wa.me/601110043567" target="_blank" rel="noopener noreferrer" className="w-full block text-center px-6 py-4 bg-primary text-obsidian font-bold rounded-xl uppercase tracking-widest text-sm hover:opacity-90">
                  Register via WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workshops */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <Briefcase size={24} className="text-primary" />
            <h2 className="text-2xl font-bold">EZ Workshops & Seminars</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
             <div className="order-2 md:order-1 bg-obsidian border border-primary/20 p-4 sm:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Calendar size={120} />
                </div>
                <h3 className="text-xl font-bold mb-4">Upcoming Seminars</h3>
                <p className="text-white/50 mb-8 max-w-xs">We frequently organize school tours and targeted weekend bootcamps.</p>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">June 2026</div>
                    <div className="font-bold">SPM Speaking Bootcamp</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">August 2026</div>
                    <div className="font-bold">Last-Minute Writing Arsenal</div>
                  </div>
                </div>
             </div>

             <div className="order-1 md:order-2 space-y-6">
                <p className="text-lg text-white/60 leading-relaxed">
                  Looking to invite the EZ Academy team to your school or university? We run customized, high-energy workshops ranging from basic grammatical reinforcement to advanced public speaking and debate methodologies.
                </p>
                <a href="https://wa.me/601110043567" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-sm hover:underline underline-offset-4">
                   Enquire for your school <ArrowRight size={16} />
                </a>
             </div>
          </div>
        </div>
      </section>

    </div>
  );
};
