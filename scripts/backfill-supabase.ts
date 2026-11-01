// One time copy of older Firestore activity into Supabase, for the admin daily report.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... FIREBASE_SERVICE_ACCOUNT_JSON=... \
//   npx tsx scripts/backfill-supabase.ts --days 30
//
// This reads each Firestore record once, so it uses part of your daily read quota.
// Run it right after the quota resets (3:00 PM Malaysia time), and start with a small --days.
import {initializeExistingFirebase} from '../src/server/firebaseAdmin';
import {mirrorFromEnv} from '../src/server/supabaseMirror';
import {dayKey,dayStart,MY_DAY} from '../src/server/dailyReport';

const argDays=Number(process.argv[process.argv.indexOf('--days')+1]);
const days=Number.isFinite(argDays)&&argDays>0?Math.min(Math.floor(argDays),90):30;
const mirror=mirrorFromEnv();
if(!mirror){console.error('Set SUPABASE_URL (https) and SUPABASE_SERVICE_ROLE_KEY first.');process.exit(1);}

const {database:db}=initializeExistingFirebase();
const today=dayStart(dayKey(Date.now()));
const first=today-(days-1)*MY_DAY;
let complete=true;

// 1. Learner profiles, one page at a time.
let cursor:string|undefined,profiles=0;
for(;;){
  let q=db.collection('users').orderBy('__name__').limit(500);
  if(cursor)q=q.startAfter(cursor);
  const page=await q.get();
  if(!page.size)break;
  await mirror.copyUserPage(page.docs.map(d=>({id:d.id,data:d.data()})));
  profiles+=page.size;cursor=page.docs[page.size-1].id;
}
console.log(`Copied ${profiles} learner profiles.`);

// 2. Activity, one week at a time, oldest first.
for(let start=first;start<=today;start+=7*MY_DAY){
  const end=Math.min(start+7*MY_DAY,today+MY_DAY);
  try{
    const r=await mirror.copyWindow(db,start,end,dayKey(end-1));
    console.log(`${dayKey(start)} to ${dayKey(end-1)}: ${r.tasks} tasks, ${r.visits} visits`);
    if(r.warnings.length){complete=false;console.warn('  Warning:',r.warnings.join(' '));}
  }catch(error){complete=false;console.error(`${dayKey(start)}: failed`,(error as Error).message);break;}
}

// 3. Only mark the history as copied when every week succeeded without warnings.
if(complete){await mirror.setState('backfilled_from',first);console.log(`Done. History is copied from ${dayKey(first)}.`);}
else console.log('Not marked as complete. Fix the problem above and run it again; repeats are safe.');
