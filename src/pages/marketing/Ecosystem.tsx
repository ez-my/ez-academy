import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MarketingEcosystem = () => {
  const products = [
    {
      title: "EZ English",
      category: "Digital Platform",
      desc: "Our flagship AI-powered platform for SPM, MUET, and general English mastery. Features simulated speaking exams, automated writing correction, and comprehensive progress tracking.",
      users: "SPM & MUET Candidates, University Students, Professionals",
      cta: "Try EZ English",
      link: "/ez-english",
      highlight: true
    },
    {
      title: "Take It EZ",
      category: "Media & Podcast",
      desc: "The official EZ Academy podcast exploring language learning tips, educational psychology, industry interviews, and the reality of continuous self-improvement.",
      users: "Language Learners, Educators, Commuters",
      cta: "Listen Now",
      link: "#",
      highlight: false
    },
    {
      title: "Excellence Zone",
      category: "Tuition Center",
      desc: "Premium physical and online tuition classes providing structured syllabus coverage, rigorous drills, and direct mentoring from subject matter experts.",
      users: "Secondary School Students",
      cta: "View Classes",
      link: "/programs",
      highlight: false
    },
    {
      title: "EZ Workshop",
      category: "Seminars & Events",
      desc: "Practical workshops to help you prepare for exams, discuss ideas, and speak confidently.",
      users: "Schools, Teachers, Student Associations",
      cta: "Book a Workshop",
      link: "/programs",
      highlight: false
    },
    {
      title: "EZ Check",
      category: "Professional Services",
      desc: "Specialized viva and presentation simulator designed for university students and professionals defending theses, pitching ideas, or facing high-pressure Q&A.",
      users: "University Students, Corporate Professionals",
      cta: "Learn More",
      link: "#",
      highlight: false
    },
    {
      title: "EZ Design",
      category: "Merchandise",
      desc: "The official EZ Academy lifestyle brand. Premium apparel and stationery designed to keep you motivated on your learning journey.",
      users: "EZ Community, Students",
      cta: "Shop Now",
      link: "#",
      highlight: false
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <section className="pt-24 pb-12 px-6 relative overflow-hidden text-center">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="max-w-3xl mx-auto relative z-10 space-y-6">
          <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight">
            Our <span className="italic text-primary">tools</span>
          </h1>
          <p className="text-sm md:text-lg text-white/60 leading-relaxed">
            Explore our learning apps, classes and workshops.
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => (
             <div key={i} className={`flex flex-col justify-between p-4 sm:p-8 rounded-[2rem] border transition-all duration-300 ${p.highlight ? 'bg-primary/5 border-primary/30 shadow-lg shadow-primary/10' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
               <div>
                  <div className="text-[10px] uppercase tracking-widest font-bold text-primary mb-4">{p.category}</div>
                  <h3 className="text-2xl font-bold tracking-tight mb-4">{p.title}</h3>
                  <p className="text-white/50 leading-relaxed mb-6">
                    {p.desc}
                  </p>
                  <div className="space-y-2 mb-8">
                    <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Built For:</span>
                    <p className="text-sm font-medium text-white/80">{p.users}</p>
                  </div>
               </div>
               
               {p.link.startsWith('/') ? (
                 <Link to={p.link} className={`inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest transition-colors ${p.highlight ? 'text-primary' : 'text-white/40 hover:text-white'}`}>
                   {p.cta} <ArrowRight size={16} />
                 </Link>
               ) : (
                 <a href={p.link} className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-not-allowed opacity-50">
                   {p.cta} (Coming Soon)
                 </a>
               )}
             </div>
          ))}
        </div>
      </section>
    </div>
  );
};
