import React,{lazy,Suspense} from 'react';
import {UserProfile} from '../types';
const TrialListeningLibrary = lazy(() => import('../components/TrialListeningLibrary').then(module => ({default:module.TrialListeningLibrary})));
export const ListenEZ:React.FC<{profile:UserProfile}>=({profile})=><div className="min-w-0 space-y-6"><Suspense fallback={<p role="status">Loading listening tests…</p>}><TrialListeningLibrary uid={profile.uid}/></Suspense></div>;
