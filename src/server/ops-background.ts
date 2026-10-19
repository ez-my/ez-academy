import {timingSafeEqual} from 'node:crypto';
import {initializeExistingFirebase} from './firebaseAdmin';
import {runOperations,sendOpsEmail} from './operations';
export default async function handler(request:Request){
 const expected=process.env.OPS_RUN_SECRET||'',actual=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(!expected||Buffer.byteLength(actual)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(actual),Buffer.from(expected)))return new Response('Forbidden',{status:403});
 if(process.env.MIGRATION_MODE!=='production')return new Response('Production only',{status:403});
 try{const payload=await request.json().catch(()=>({}));await runOperations(initializeExistingFirebase().database,{force:payload.force===true});return new Response('OK');}
 catch{if(new Date().getUTCMinutes()<15)await sendOpsEmail('EZ Academy: monitor gagal','Pemeriksaan operasi tidak dapat diselesaikan. Sila semak Netlify Functions dan Firebase. https://ez-academy.my/app/admin/monitor?tab=operations').catch(()=>{});return new Response('Check failed',{status:500});}
}
