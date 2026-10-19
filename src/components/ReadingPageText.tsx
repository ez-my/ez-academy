import React from 'react';
import {readingTextBlocks} from '../data/readingTextLayout';
export function ReadingPageText({text}:{text:string}){
 const blocks=readingTextBlocks(text);
 return <div className="min-w-0 text-sm leading-7 text-white/90">{blocks.map((b,i)=>b.kind==='choice'?
  <div key={i} className={`flex min-w-0 items-start gap-3 ${blocks[i-1]?.kind==='choice'?'mt-3':'mt-5'}`}><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-xs font-bold">{b.label}</span><p className="min-w-0 whitespace-pre-line break-words">{b.text}</p></div>:
  <p key={i} className={`whitespace-pre-line break-words ${b.kind==='question'?'mt-7 border-t border-white/10 pt-5 font-semibold':'mt-5 first:mt-0'}`}>{b.text}</p>)}</div>;
}
