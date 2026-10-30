import React from 'react';
import {ArrowRight,Share2,ShoppingBag,Wallet} from 'lucide-react';
import {Link} from 'react-router-dom';
import {SEOSync} from '../../components/SEOSync';
import {AFFILIATE_TERMS,affiliatePlans,COMMISSION_CENTS,money} from '../../affiliate';
import '../../components/affiliate/affiliate.css';
const steps=[{icon:Share2,title:'Copy & share',text:'Your code is in Profile.'},{icon:ShoppingBag,title:'Student buys',text:'Confirmed payment → commission.'},{icon:Wallet,title:'Claim RM10+',text:'Submit your claim in Profile.'}];
export const MarketingAbout=React.memo(()=> <div className="affiliate-page">
  <SEOSync title="Affiliate Programme | EZ Academy" description="Share EZ Academy. Earn RM1–RM3 per confirmed purchase. Claim from RM10." keywords="EZ Academy affiliate programme, referral code, commission"/>
  <section className="affiliate-surface affiliate-hero">
    <div className="affiliate-hero-copy"><p className="affiliate-eyebrow">Affiliate Programme</p><h1>Share. <span>Earn.</span></h1><p>Every user is an affiliate. Your code is ready.</p><Link to="/app/profile" className="affiliate-primary">Get my code <ArrowRight size={17}/></Link></div>
    <img className="affiliate-duta" src="/images/home/buddy-sharp-v3-600.webp" alt="EZ Academy Duta giving a thumbs up" width="600" height="800"/>
  </section>
  <ol className="affiliate-steps" aria-label="How it works">{steps.map((s,i)=><li key={s.title}><s.icon aria-hidden="true"/><div><h2>{i+1}. {s.title}</h2><p>{s.text}</p></div></li>)}</ol>
  <div className="affiliate-info-grid">
    <section className="affiliate-surface affiliate-rates"><h2>Your commission</h2><table className="affiliate-table"><caption className="sr-only">Commission per confirmed purchase</caption><thead><tr><th scope="col">Package</th><th scope="col">Price</th><th scope="col">You earn</th></tr></thead><tbody>{affiliatePlans.filter(p=>p.type==='subscription').map(p=><tr key={p.id}><td>{p.name}</td><td>RM{p.price}</td><td>{money(COMMISSION_CENTS[p.id])}</td></tr>)}<tr><td>Skill Focus <span className="text-xs text-blue-200/70">(each)</span></td><td>RM5–8</td><td>RM1.00</td></tr></tbody></table></section>
    <section className="affiliate-surface affiliate-payout"><h2><Wallet size={19}/> Get paid</h2><p className="affiliate-terms">{AFFILIATE_TERMS}</p><p className="affiliate-methods">DuitNow<br/>Touch n Go eWallet QR</p><div className="affiliate-status-flow" aria-label="Claim status">Submitted <ArrowRight size={12}/> Processing <ArrowRight size={12}/> Paid</div><details className="affiliate-details"><summary>Details</summary><p>Skill Focus prices: Speak RM8 · Write RM8 · Read RM5 · Listen RM6. Each earns RM1.</p><p>No separate sign-up. Share your link or let students enter your code at checkout.</p><p>Only confirmed purchases earn commission. No self-referrals or credit top-ups.</p><p>Track your code, balance and claims in Profile. Submitted claims are reserved from your available balance.</p></details></section>
  </div>
</div>);
