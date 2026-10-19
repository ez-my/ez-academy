export function cleanPaperText(text: string) {
 return text.replace(/(?:^|\n)\s*(?:CS?\s*)?CamScanner[^\n]*/gi,'').replace(/(?:\d+\s*)?SULIT(?:\s*\d+)?/g,'').replace(/KERTAS TAMAT|KERTAS PEPERIKSAAN TAMAT/g,'').replace(/^\d+(?=PART|Part)/,'').replace(/\u0002/g,'-').replace(/(?:SULIT|TERHAD)\s*1119\/4[^\n]*/g,'').replace(/1119\/4[^\n]*/g,'').replace(/\n\s*\d+\s*$/,'').replace(/\.[1-9]$/,'.').trim();
}
export function organiseChoiceQuestions(text: string, first: number, last: number) {
 const clean=cleanPaperText(text);
 const starts=[...clean.matchAll(/(?:^|\n)\s*(\d{1,2})[.)]?\s+|[ \t](\d{1,2})\.[ \t]+/g)].filter(m=>Number(m[1]||m[2])>=first && Number(m[1]||m[2])<=last && !/^to\s+\d/.test(clean.slice(m.index!+m[0].length)));
 if(starts.length!==last-first+1 || starts.some((m,i)=>Number(m[1]||m[2])!==first+i)) return null;
 const questions=starts.map((m,i)=>{
  const body=clean.slice(m.index!+m[0].length,starts[i+1]?.index??clean.length);
  const options=[...body.matchAll(/(?:\n[ \t]*|(?<=[.!?])[ \t]+)([ABC])\.?[ \t]+/g)];
  const a=options.find(x=>x[1]==='A'),b=options.find(x=>x[1]==='B' && x.index!>(a?.index??Infinity)),c=options.find(x=>x[1]==='C'&&x.index!>(b?.index??Infinity));
  if(!a||!b||!c)return null;
  return {number:first+i,stem:body.slice(0,a.index).replace(/\s+/g,' ').trim(),choices:[a,b,c].map((x,n)=>({letter:x[1],text:body.slice(x.index!+x[0].length,[a,b,c][n+1]?.index??body.length).replace(/\s+/g,' ').trim()}))};
 });
 if(questions.some(x=>!x))return null;
 return {instructions:clean.slice(0,starts[0].index).replace(/\s+/g,' ').trim(),questions:questions.filter(x=>x!==null)};
}

export function organiseMatching(text: string) {
 const clean=cleanPaperText(text).replace(/Speaker\s+[1-5]\s+(?:16|17|18|19|20)|(?:16|17|18|19|20)\s+Speaker\s+[1-5]/g,'');
 const matches=[...clean.matchAll(/(?:^|\n|[.!?]\s+)([A-H])\.?\s+/g)];
 const seen=new Set<string>();
 const starts=matches.filter(m=>{if(seen.has(m[1]))return false;seen.add(m[1]);return true;});
 if(starts.length!==7 || starts[0][1]!=='A')return null;
 const options=starts.map((m,i)=>({letter:m[1],text:clean.slice(m.index!+m[0].length,starts[i+1]?.index??clean.length).replace(/\s+/g,' ').trim()}));
 options[6].text=options[6].text.replace(/(?:\s+R\s+R\s+S\s+S\s+T|SULIT).*$/,'').trim();
 return {instructions:clean.slice(0,starts[0].index).replace(/\s+/g,' ').trim(),options};
}

export function organisePassage(text: string) {
 const clean=cleanPaperText(text).replace(/\[(2[1-9]|30)\]/g,'($1)')
  .replace(/_{2,}\s*\((2[1-9]|30)\)/g,'($1) ______')
  .replace(/\((2[1-9]|30)\)\s*_*/g,'($1) ______ ');
 const numbers=[...clean.matchAll(/\((2[1-9]|30)\) ______/g)].map(m=>Number(m[1]));
 const lines=clean.split('\n');
 const firstBlank=lines.findIndex(line=>/\(21\)/.test(line));
 let endInstructions=-1;
 for(let i=0;i<firstBlank;i++)if(/twice|Answer all (?:the )?questions/i.test(lines[i]))endInstructions=i;
 let bodyLines=lines.slice(endInstructions+1).filter(l=>l.trim());
 let title='';
 if(bodyLines[0]?.length<85 && !/[.!?]$/.test(bodyLines[0]) && !/\(21\)/.test(bodyLines[0]) && !/\b(?:is|was|began|the age of|listens to)\b/i.test(bodyLines[0]))title=bodyLines.shift()!;
 return {numbers,instructions:lines.slice(0,endInstructions+1).join(' ').replace(/\s+/g,' '),title,body:bodyLines.join('\n')};
}
