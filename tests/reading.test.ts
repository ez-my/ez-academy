import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {TRIAL_READING_TESTS,READING_PARTS,readingChoices,parseReadingDraft,type ReadingPaper} from '../src/data/trialReadingTests';
import {TRIAL_READING_KEYS} from '../src/data/trialReadingKeys';
import {gradeReadingPart,buildReadingSession} from '../src/data/readingScoring';
const folder=new URL('../src/data/readingPapers/',import.meta.url);
const paper=(id:string):ReadingPaper=>JSON.parse(readFileSync(new URL(id+'.json',folder),'utf8'));
const correctAnswers=(id:string)=>Object.fromEntries(Object.entries(TRIAL_READING_KEYS[id].answers).map(([n,v])=>[n,v[0]]));
test('51 distinct sourced Reading tests cover three years and all 40 questions',()=>{
 assert.equal(TRIAL_READING_TESTS.length,51);
 assert.equal(TRIAL_READING_TESTS.filter(t=>t.year===2026).length,17);
 assert.equal(TRIAL_READING_TESTS.filter(t=>t.year===2025).length,14);
 assert.equal(TRIAL_READING_TESTS.filter(t=>t.year===2024).length,20);
 for(const field of ['id','label','questionFileId'] as const)assert.equal(new Set(TRIAL_READING_TESTS.map(t=>t[field])).size,51);
 assert.deepEqual(READING_PARTS.flatMap(p=>Array.from({length:p.last-p.first+1},(_,i)=>p.first+i)),Array.from({length:40},(_,i)=>i+1));
 assert.deepEqual(readdirSync(folder).filter(f=>f.endsWith('.json')).sort(),TRIAL_READING_TESTS.map(t=>t.id+'.json').sort());
 for(const t of TRIAL_READING_TESTS){
  assert.match(t.questionFileId,/^[\w-]+$/);
  const key=TRIAL_READING_KEYS[t.id];assert.equal(Object.keys(key.answers).length,40);
  const pages=paper(t.id);assert.deepEqual(Object.keys(pages),['1','2','3','4','5']);
  for(const part of Object.values(pages)){
   assert.ok(part.length);for(const page of part){assert.match(page.image,/^data:image\/webp;base64,/);assert.ok(page.text.length>10);assert.doesNotMatch(page.text,/Answer Key and Detailed Explanations|KERTAS JAWAPAN CALON|ANSWER BOX FOR LETTERS|ANSWER SHEET FOR PAPER/i);}
  }
  for(let n=1;n<=40;n++){assert.ok(key.answers[n]?.length);if(n<=36)assert.ok(key.answers[n].every(v=>readingChoices(n).includes(v)),`${t.id} invalid choice ${n}`);}
 }
});
test('all 51 papers can be marked part by part and finish at 40/40',()=>{
 for(const t of TRIAL_READING_TESTS){let session;const answers=correctAnswers(t.id);for(let part=1;part<=5;part++)session=buildReadingSession('learner','attempt',t.id,part,answers,session);assert.equal(session?.readingResult.correct,40);assert.equal(session?.readingResult.total,40);assert.equal(session?.score,100);}
});
test('mixed-length parts use question totals rather than an average of percentages',()=>{
 const id='kedah-2026',answers=correctAnswers(id);answers['1']='A';answers['9']='A';
 let session=buildReadingSession('learner','same',id,1,answers);session=buildReadingSession('learner','same',id,2,answers,session);
 assert.equal(session.id,'read_trial_same');assert.equal(session.readingResult.correct,16);assert.equal(session.readingResult.total,18);assert.equal(session.score,89);
 assert.match(session.feedback,/checked parts only/);assert.equal(session.type,'ReadEZ');
});
test('changed earlier answers remove stale marks until that part is checked again',()=>{
 const id='kedah-2026',answers=correctAnswers(id);const old=buildReadingSession('learner','same',id,1,answers);answers['1']='A';
 const next=buildReadingSession('learner','same',id,2,answers,old);assert.equal(next.readingResult.parts[1],undefined);assert.equal(next.readingResult.total,10);
 assert.throws(()=>buildReadingSession('other','same',id,2,answers,old));
 assert.throws(()=>buildReadingSession('learner','same','perak-2026',1,correctAnswers('perak-2026'),old));
});
test('missing answers and unknown parts cannot save a fabricated score',()=>{
 assert.throws(()=>gradeReadingPart('kedah-2026',1,{}));assert.throws(()=>gradeReadingPart('unknown',1,{}));assert.throws(()=>gradeReadingPart('kedah-2026',6,{}));
 assert.deepEqual(parseReadingDraft('{bad'),{});assert.deepEqual(parseReadingDraft(JSON.stringify({'1':'A','40':'word','41':'B','2':4,'3':'x'.repeat(101)})),{'1':'A','40':'word'});
});
test('word marking accepts supported spellings and hyphens while respecting lower-case instructions',()=>{
 const perak=correctAnswers('perak-2025');perak['38']='organized';assert.equal(gradeReadingPart('perak-2025',5,perak).correct,8);
 const n9=correctAnswers('negeri-sembilan-2026');n9['38']='pre‑loved';assert.equal(gradeReadingPart('negeri-sembilan-2026',5,n9).correct,8);
 const perlis=correctAnswers('perlis-2026');perlis['37']=perlis['37'].toUpperCase();assert.equal(gradeReadingPart('perlis-2026',5,perlis).correct,7);
});
test('known scheme errors and replacement questions use the reviewed keys',()=>{
 assert.deepEqual(TRIAL_READING_KEYS['kedah-2026'].answers[7],['C']);
 assert.deepEqual(TRIAL_READING_KEYS['johor-batu-pahat-2026'].answers[5],['B']);
 assert.deepEqual(TRIAL_READING_KEYS['negeri-sembilan-2026'].answers[21],['B']);
 assert.deepEqual(TRIAL_READING_KEYS['kedah-2025'].answers[36],['D']);
 assert.deepEqual(TRIAL_READING_KEYS['sabk-set-2-2025'].answers[37],['farmers']);
 assert.deepEqual(TRIAL_READING_KEYS['sabk-set-2-2025'].answers[38],['fuel']);
 assert.deepEqual(TRIAL_READING_KEYS['sabk-set-2-2025'].answers[40],['scraps']);
 assert.equal(TRIAL_READING_KEYS['kuala-lumpur-2026'].editorialKey,true);
 assert.notEqual(TRIAL_READING_KEYS['kuala-lumpur-2026'].sourceFileId,'1Cy6Suz9VmOwhf45wbLJoNo4rY2ztM-w1');
 assert.match(paper('sabk-set-2-2025')[1][0].text,/Applications are closed until June 2025/);
 assert.match(paper('johor-2025')[1].find(p=>p.number===4)!.text,/International flights and hotel breakfast/);
});
test('shared pages and formerly unreadable choice pages are retained in the proper parts',()=>{
 assert.ok(paper('sarawak-2026')[2].some(p=>p.number===6));assert.ok(paper('sarawak-2026')[3].some(p=>p.number===6));
 assert.ok(paper('sabah-lahad-datu-2026')[1].some(p=>p.number===3));
 assert.ok(paper('putrajaya-2025')[2].some(p=>p.number===7));
 assert.ok(paper('putrajaya-2025')[3].some(p=>p.number===10));
 assert.ok(paper('sbp-2026')[2].some(p=>p.number===6));
 assert.ok(paper('terengganu-2025')[2].some(p=>p.number===7));
 assert.match(paper('selangor-set-2-2026')[3][0].text,/The Climb/);
 assert.ok(paper('pahang-2025')[1].find(p=>p.number===5)?.figure);
});

test('2024 mismatched schemes and official Melaka corrections are handled',()=>{
 for(const id of ['johor-kluang-set-a-2024','johor-kluang-set-b-2024']){assert.equal(TRIAL_READING_KEYS[id].editorialKey,true);assert.equal(TRIAL_READING_TESTS.find(t=>t.id===id)?.answerFileId,null);assert.ok(paper(id)['2'].some(p=>p.correction));assert.ok(paper(id)['5'].some(p=>p.correction));}
 const melaka=paper('melaka-2024')['4'].map(p=>p.text).join('\n');assert.match(melaka,/H Plastics which normally take up to 1,000 years/);assert.equal(TRIAL_READING_KEYS['melaka-2024'].answers['27'][0],'H');
});

test('new 2024 copies keep every MCQ option and the Penang shared cloze page',()=>{
 for(const t of TRIAL_READING_TESTS.filter(t=>t.year===2024)){
  const content=paper(t.id);
  for(const [part,total] of [['1',24],['2',40],['3',32]] as const){const choices=content[part].flatMap(p=>p.text.match(/^[A-Da-d][.)]?\s+/gm)||[]);assert.ok(choices.length>=total,`${t.id} part ${part} lost option labels`);}
 }
 const penang=paper('penang-2024');assert.ok(penang['2'].some(p=>p.number===5&&p.text.includes('Question 18')));assert.ok(penang['3'][0].text.startsWith('Part 3'));
});
