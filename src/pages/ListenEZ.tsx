import React from 'react';
import {TrialListeningLibrary} from '../components/TrialListeningLibrary';
import {UserProfile} from '../types';
// Retain the original trial-paper library; the obsolete Drive-picker route was removed.
export const ListenEZ:React.FC<{profile:UserProfile}>=({profile})=><div className="min-w-0 space-y-6"><TrialListeningLibrary uid={profile.uid}/></div>;
