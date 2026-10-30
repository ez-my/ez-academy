// Run: node --import tsx scripts/audit-trial-paper-rights.ts <private-work-dir>
// Read-only inspection: never modifies source documents. Outputs contain no question text.
import {readFileSync,readdirSync,mkdirSync,writeFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {TRIAL_READING_TESTS} from '../src/data/trialReadingTests';
import {TRIAL_LISTENING_TESTS} from '../src/data/trialListeningTests';
import {READABLE_TRIAL_PARTS} from '../src/data/trialListeningParts';
const out=process.argv[2];if(!out)throw Error('Pass a private working directory outside public/.');
mkdirSync(join(out,'images'),{recursive:true});
const sha=(b:Buffer|string)=>createHash('sha256').update(b).digest('hex');
const originals=readdirSync('src/data').filter(n=>/^trial(?:Reading|Listening)|^(readingTextLayout|listeningLayout)\.ts$/.test(n)).map(n=>'src/data/'+n).filter(n=>!n.endsWith('Papers'));
const reading=TRIAL_READING_TESTS.map(test=>{
 const file=`src/data/readingPapers/${test.id}.json`; originals.push(file);
 const paper=JSON.parse(readFileSync(file,'utf8'));
 const pages=Object.entries(paper).flatMap(([part,items]:[string,any])=>items.map((p:any)=>{
  const [,mime,b64]=p.image.match(/^data:(.*?);base64,(.*)$/s)||[];if(!b64)throw Error(`Unexpected image: ${file}`);
  const bytes=Buffer.from(b64,'base64'),hash=sha(bytes),imagePath=join(out,'images',hash+'.'+mime.split('/')[1]);
  if(!existsSync(imagePath))writeFileSync(imagePath,bytes);
  return {part:Number(part),page:p.number,imageSha256:hash,imagePath,textLabelHits:[...p.text.matchAll(/\b(?:SULIT|TERHAD)\b/gi)].map(m=>m[0]),hasCorrection:!!p.correction,hasFigure:!!p.figure};
 }));
 return {...test,file,rights:'unverified',blockedPages:[...new Set(pages.map(p=>p.page))].sort((a,b)=>Number(a)-Number(b)),pages};
});
const listening=TRIAL_LISTENING_TESTS.map(test=>({...test,rights:'unverified',blockedScope:'all pages, all readable parts, answer key and entire recording',remotePageCount:null,remotePageInspection:'not fetched; full asset blocked, not asserted label-free',readableParts:Object.entries(READABLE_TRIAL_PARTS[test.questionFileId]||{}).map(([part,text])=>({part:Number(part),textLabelHits:[...text.matchAll(/\b(?:SULIT|TERHAD)\b/gi)].map(m=>m[0])}))}));
const fingerprints=[...new Set(originals)].sort().map(file=>({file,sha256:sha(readFileSync(file))}));
const report={decision:'block-pending-rights-verification',evidence:'Catalog comments identify supplied Drive trial banks; no release/redistribution license or permission records located. A public link is not authorization.',reading,listening,fingerprints};
writeFileSync(join(out,'inventory.json'),JSON.stringify(report,null,2));
const pages=reading.flatMap(t=>t.pages.map(p=>({testId:t.id,...p})));
writeFileSync(join(out,'ocr-input.json'),JSON.stringify([...new Map(pages.map(p=>[p.imageSha256,p])).values()]));
console.log(JSON.stringify({reading:reading.length,listening:listening.length,pageInstances:pages.length,uniqueNumberedPages:reading.reduce((n,t)=>n+t.blockedPages.length,0),uniqueImages:new Set(pages.map(p=>p.imageSha256)).size,fingerprints:fingerprints.length,output:out}));
