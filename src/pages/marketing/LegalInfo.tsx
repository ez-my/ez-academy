import { Link } from 'react-router-dom';

export function LegalInfo({ kind }: { kind: 'privacy' | 'terms' }) {
  const privacy = kind === 'privacy';
  return <article className="w-full max-w-3xl mx-auto px-6 py-12 sm:py-16 text-white/75">
    <h1 className="text-3xl font-bold text-white">{privacy ? 'Privacy' : 'Terms'}</h1>
    {privacy ? <div className="mt-6 space-y-4 leading-relaxed">
      <p>EZ Academy uses account details, profile information and learning activity to provide practice, progress tracking and support. Payment and reward records are used to manage access and credits.</p>
      <p>For questions about your information, or to request access, correction or deletion, contact EZ Academy through <Link to="/app/support" className="text-primary underline">Help &amp; Support</Link>.</p>
    </div> : <div className="mt-6 space-y-4 leading-relaxed">
      <p>EZ Academy provides English practice and learning feedback. Plan access, credits and validity are shown when you choose a plan. Use the service responsibly and respect the rights of other users and content owners.</p>
      <p>If you have a question about access, a purchase or these terms, contact EZ Academy through <Link to="/app/support" className="text-primary underline">Help &amp; Support</Link>.</p>
    </div>}
  </article>;
}
