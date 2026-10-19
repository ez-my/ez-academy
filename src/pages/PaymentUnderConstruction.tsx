import { Link } from 'react-router-dom';
import { Construction } from 'lucide-react';

export default function PaymentUnderConstruction() {
  return <main className="min-h-screen bg-obsidian text-white flex items-center justify-center p-6">
    <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
      <Construction className="mx-auto mb-6 h-12 w-12 text-primary" aria-hidden="true" />
      <p className="text-xs font-bold uppercase tracking-widest text-primary">EZ Academy · Payments</p>
      <h1 className="mt-4 text-3xl font-display font-bold">Under construction</h1>
      <p className="mt-4 text-white/70">Payments and plan upgrades are temporarily unavailable while we prepare this service.</p>
      <p className="mt-3 text-sm text-white/60">Your existing account, credits and learning progress are preserved.</p>
      <Link to="/app" className="mt-8 inline-block rounded-xl bg-primary px-6 py-3 font-bold text-obsidian">Back to EZ Academy</Link>
    </section>
  </main>;
}
