import React from 'react';
import { BookText, Mic2, Cpu, ArrowRight } from 'lucide-react';
import { SEOSync } from '../../components/SEOSync';

export const MarketingResources = () => {
  const categories = [
    { id: 'english', title: 'English Learning', icon: BookText, color: 'text-blue-400' },
    { id: 'debate', title: 'Debate & Speaking', icon: Mic2, color: 'text-primary' },
    { id: 'ai', title: 'AI for Students', icon: Cpu, color: 'text-purple-400' }
  ];

  const articles = [
    { title: 'How to structure a Band 5 MUET Essay', category: 'english', readTime: '5 min' },
    { title: 'Feeling Nervous When Speaking: The 3-Second Rule', category: 'debate', readTime: '4 min' },
    { title: 'Using ChatGPT Ethically for SPM Essay Prep', category: 'ai', readTime: '7 min' },
    { title: 'Understanding English Levels', category: 'english', readTime: '6 min' },
    { title: 'How to Reply to an Opposing Idea', category: 'debate', readTime: '8 min' },
    { title: 'Top 5 AI Tools Every University Student Needs', category: 'ai', readTime: '5 min' }
  ];

  return (
    <div className="flex flex-col">
      <SEOSync 
        title="Learning Resources | MUET Tips & SPM Essay Prep"
        description="Access free MUET Essay tips, SPM prep guides, and AI learning resources for Malaysian students. Expert advice on English mastery, debate, and speaking."
        keywords="MUET essay tips, SPM essay prep, English learning resources, AI for students Malaysia"
      />
      <section className="pt-24 pb-16 px-6 text-center border-b border-white/5">
        <h1 className="text-2xl sm:text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
          Study <span className="italic text-primary">guides</span>
        </h1>
        <p className="text-sm md:text-lg text-white/60 max-w-2xl mx-auto">
          Simple guides for learning English, speaking in public, and using AI to study.
        </p>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
          
          {/* Sidebar / Categories */}
          <div className="w-full md:w-64 shrink-0 space-y-4 sm:space-y-8">
             <div>
               <h3 className="text-[10px] uppercase font-black text-white/40 tracking-widest mb-4">Topics</h3>
               <div className="space-y-2">
                 {categories.map(c => (
                   <button key={c.id} className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 transition-colors flex items-center justify-between group">
                     <span className="font-bold text-sm text-white/70 group-hover:text-white transition-colors">{c.title}</span>
                     <c.icon size={16} className={c.color} />
                   </button>
                 ))}
               </div>
             </div>

             <div className="p-6 bg-primary/10 rounded-2xl border border-primary/20 text-center space-y-4">
                <h4 className="font-bold text-primary">Stay Updated</h4>
                <p className="text-xs text-white/60">Get new study tips.</p>
                <input type="email" placeholder="Email address" className="w-full bg-obsidian border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors" />
                <button className="w-full bg-primary text-obsidian font-bold text-xs uppercase tracking-widest py-2 rounded-lg hover:scale-105 transition-transform">Subscribe</button>
             </div>
          </div>

          {/* Grid of articles */}
          <div className="flex-1">
             <div className="grid sm:grid-cols-2 gap-6">
                {articles.map((article, i) => {
                  const cat = categories.find(c => c.id === article.category);
                  return (
                    <div key={i} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/20 transition-colors group cursor-pointer flex flex-col justify-between aspect-square md:aspect-auto md:h-64">
                       <div className="space-y-4">
                         <div className="flex items-center justify-between">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${cat?.color}`}>{cat?.title}</span>
                           <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{article.readTime}</span>
                         </div>
                         <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">{article.title}</h3>
                       </div>
                       
                       <div className="flex justify-end pt-4">
                         <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-obsidian group-hover:bg-primary transition-all">
                           <ArrowRight size={18} />
                         </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>

        </div>
      </section>

    </div>
  );
};
