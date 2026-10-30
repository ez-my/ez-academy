import React from '/Users/shahril/Projects/ez-academy/node_modules/react/index.js';
import {createRoot} from '/Users/shahril/Projects/ez-academy/node_modules/react-dom/client.js';
import {TrialPaperRightsNotice} from '/Users/shahril/Projects/ez-academy/src/components/TrialPaperRightsNotice';
const skill=new URLSearchParams(location.search).get('skill')==='Listening'?'Listening':'Reading';
createRoot(document.getElementById('root')!).render(<main className="mx-auto max-w-5xl p-4 sm:p-8"><TrialPaperRightsNotice skill={skill}/></main>);
