import React from 'react';
import {TRIAL_RIGHTS_MESSAGE} from '../lib/trialPaperRights';

export function TrialPaperRightsNotice({skill}:{skill:'Reading'|'Listening'}) {
 return <section aria-labelledby="trial-rights-heading" role="status" className="min-w-0 space-y-4 rounded-2xl border border-amber-300/30 bg-amber-300/5 p-4 sm:p-6">
  <p className="text-sm font-semibold text-amber-200">{skill} trial asset · unavailable</p>
  <h1 id="trial-rights-heading" className="break-words text-xl font-bold sm:text-2xl">Materials pending rights verification</h1>
  <p className="max-w-2xl text-sm leading-7 text-white/80">{TRIAL_RIGHTS_MESSAGE}</p>
  <p className="max-w-2xl text-sm leading-7 text-white/65">Questions, scans, original-paper downloads, answer keys and linked recordings are not available here until permission to use and redistribute them has been confirmed. Your saved practice history has not been changed.</p>
  <a href="/app" className="inline-flex min-h-11 items-center rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">Back to dashboard</a>
 </section>;
}
// This notice remains the fallback for assets outside the explicit authorization.
