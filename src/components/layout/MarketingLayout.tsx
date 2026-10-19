import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import {ArrowRight} from 'lucide-react';
import { useSiteConfig } from '../../context/SiteConfigContext';

export const MarketingLayout: React.FC<{ isLoggedIn?: boolean }> = ({ isLoggedIn }) => {
  const pathname=useLocation().pathname;const home=pathname==='/';
  const { config } = useSiteConfig();
  const whatsapp = `https://wa.me/${config?.contact.whatsapp.replace(/\D/g, '') || '601110043567'}`;
  return <div className={`public-layout min-w-0 min-h-screen bg-obsidian flex flex-col font-sans ${home?'is-reference-home':''}`}>
    <header className="sticky top-0 z-50 bg-obsidian/95 backdrop-blur-xl border-b border-white/10">
      <nav aria-label="Main navigation" className={`max-w-[1120px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3 ${home?'hp-top-nav':''}`}>
        <Link to="/" className={`${home?'hp-menu-brand':''} inline-flex items-center gap-2 text-lg font-semibold tracking-tight whitespace-nowrap`}>{home?<svg viewBox="0 0 60 60" role="img" aria-label="EZ"><path d="M14 49L5 55l3-15A25 25 0 1 1 12 47" fill="none" stroke="#eff6e9" strokeWidth="4"/><path d="M31 5A25 25 0 0 1 47 49" fill="none" stroke="#96e300" strokeWidth="4"/><text x="12" y="38" fill="white" fontSize="25" fontWeight="800" fontStyle="italic">EZ</text></svg>:<img src="/images/dashboard/ez-emblem-v1.webp" alt="EZ" className="w-10 h-10 object-contain shrink-0"/>}<span>Academy</span></Link>
        <div className={`${home?'hp-desktop-links':''} hidden md:flex items-center gap-6 text-sm text-white/70`}><a href="/#home">Home</a><Link to="/about">About</Link><a href="/#features">Features</a><Link to="/plans">Pricing</Link><Link to="/resources">Resources</Link><a href="/#faq" >FAQ</a></div>
        <div className={`${home?'hp-header-actions':''} flex items-center gap-2`}><details className="relative md:hidden"><summary className="cursor-pointer text-xs p-2 min-h-11 flex items-center">Menu</summary><div className="absolute right-0 top-full w-44 p-2 bg-[#141610] rounded-xl border border-white/10 shadow-xl text-sm">{[['/#home','Home'],['/about','About'],['/#features','Features'],['/plans','Pricing'],['/resources','Resources'],['/#faq','FAQ']].map(([to,text]) => <a key={to} href={to} className="block p-3" onClick={e=>{e.currentTarget.closest('details')?.removeAttribute('open');}}>{text}</a>)}</div></details><Link to={isLoggedIn ? '/app' : '/login'} className={`${home?'hp-open-app':''} inline-flex items-center gap-2 bg-primary text-obsidian px-3 sm:px-4 py-3 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap`}>Open App <ArrowRight size={15}/></Link></div>
      </nav>
    </header>
    <main id="main-content" className="flex-1 min-w-0"><Outlet /></main>
    {pathname!=='/plans'&&<footer className="border-t border-white/10 mt-8"><div className="max-w-[1120px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-6 text-xs text-white/60"><div><p className="text-white text-sm font-semibold mb-2">EZ Academy</p><p>English practice for SPM & MUET.</p></div><nav aria-label="More links" className="flex flex-wrap gap-x-5 gap-y-4"><Link to="/about">About</Link><Link to="/resources">Resources</Link><Link to="/programs">Programs</Link><Link to="/ecosystem">Our tools</Link><a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></nav></div></footer>}
  </div>;
};
