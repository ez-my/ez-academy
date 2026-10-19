import {operationsAudioCanary} from './operationsAudio';
import type {Express} from 'express';
import type {Firestore} from 'firebase-admin/firestore';
import {authenticateFirebaseUser,isAuthorizedAdmin} from './payments';
import {opsConfig,runOperations,diagnoseSnapshot,sendOpsEmail} from './operations';
export const SUPPORT_FAQ=[
 {id:'credits',title:'Kredit AI & refund',answer:'Pengguna free boleh guna bank soalan dan feedback umum. Kredit AI digunakan untuk feedback peribadi, suara atau transkripsi mengikut pakej. Permintaan AI yang gagal dipulangkan secara automatik; jika baki masih salah, laporkan masalah di bawah.'},
 {id:'payment',title:'Bayaran & pakej',answer:'ToyyibPay mengaktifkan pakej selepas bukti bayaran disahkan. QR Maybank memerlukan semakan pemilik. Hantar resit melalui WhatsApp +6011-10043567; jangan bayar semula jika status masih pending.'},
 {id:'audio',title:'Mikrofon, suara & rakaman',answer:'Benarkan mikrofon dalam tetapan browser. Gunakan HTTPS dan cuba Chrome/Safari terkini. Rakaman kekal pada gadget ini, bukan disimpan oleh aplikasi. Audio dihantar sementara untuk analisis apabila anda memilih AI.'},
 {id:'login',title:'Akaun sedia ada',answer:'Gunakan akaun dan kaedah login asal. Anda tidak perlu daftar semula. Cuba log keluar dan masuk semula jika sesi tamat. Jangan hantar kata laluan atau API key dalam laporan.'},
 {id:'sharing',title:'Achievement & perkongsian',answer:'Ganjaran perkongsian hanya sekali sehari. Gunakan butang share achievement dan ikut pengesahan yang dipaparkan. Pautan WhatsApp bukan pengesahan bayaran.'},
];
export function registerOperationsRoutes(app:Express,db:Firestore){
 app.get('/api/operations/audio-check',(_req,res)=>res.set('Cache-Control','no-store').type('audio/wav').send(operationsAudioCanary()));
 app.get('/api/support/faq',(_req,res)=>res.json(SUPPORT_FAQ));
 app.post('/api/support/report',async(req,res)=>{
  try{const user=await authenticateFirebaseUser(req);if(!user)return res.sendStatus(401);
   const category=String(req.body?.category||'');if(!SUPPORT_FAQ.some(f=>f.id===category))return res.sendStatus(400);
   const note=typeof req.body?.note==='string'?req.body.note.trim():'';if(note.length<10||note.length>1000)return res.status(400).json({error:'Please describe the issue in 10–1000 characters. Do not include passwords or payment details.'});
   const day=new Date().toISOString().slice(0,10),ref=db.doc(`support_limits/${user.uid}-${day}`),report=db.collection('support_reports').doc();
   await db.runTransaction(async t=>{const old=await t.get(ref);if(Number(old.data()?.count||0)>=2)throw new Error('LIMIT');t.set(ref,{count:Number(old.data()?.count||0)+1});t.create(report,{uid:user.uid,category,note,status:'open',createdAt:Date.now()});});
   return res.json({ok:true,message:'Report saved for the owner. Please do not submit it again.'});
  }catch(e:any){return res.status(e.message==='LIMIT'?429:503).json({error:e.message==='LIMIT'?'Daily report limit reached':'Could not save report. Please try later.'});}
 });
 app.use('/api/admin/operations',async(req,res,next)=>{try{if(!isAuthorizedAdmin(await authenticateFirebaseUser(req)))return res.sendStatus(403);res.set('Cache-Control','no-store');return next();}catch{return res.sendStatus(403);}});
 app.get('/api/admin/operations',async(_req,res)=>{
  try{const [latest,config,reports]=await Promise.all([db.doc('operations/latest').get(),opsConfig(db),db.collection('support_reports').where('status','==','open').limit(40).get()]);
   const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0);
   const txs=await db.collection('transactions').where('status','==','SUCCESS').get();
   const revenueRM=txs.docs.filter(d=>(d.data().reconciledAt?.toMillis?.()||d.data().paidAt?.toMillis?.()||d.data().createdAt?.toMillis?.()||0)>=monthStart.getTime()).reduce((s,d)=>s+Number(d.data().amountInCents||Number(d.data().amount||0)*100)/100,0);
   return res.json({latest:latest.data()||null,config,revenueRM,reports:reports.docs.map(d=>({id:d.id,...d.data()})).sort((a:any,b:any)=>b.createdAt-a.createdAt)});
  }catch{return res.status(503).json({error:'Operations status unavailable'});}
 });
 app.post('/api/admin/operations/run',async(_req,res)=>{try{if(!process.env.OPS_RUN_SECRET)throw new Error();const response=await fetch('https://ez-academy-2-preview.netlify.app/.netlify/functions/ops-background',{method:'POST',headers:{authorization:`Bearer ${process.env.OPS_RUN_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({force:true}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();return res.json({message:'Check queued. Status refreshes automatically within 30 seconds.'});}catch{return res.status(503).json({error:'Check could not be queued. View Netlify Functions.'});}});
 app.post('/api/admin/operations/diagnose',async(_req,res)=>{
  try{const latest=(await db.doc('operations/latest').get()).data();if(!latest)return res.status(400).json({error:'Run a check first'});const report=await diagnoseSnapshot(db,latest);await db.doc('operations/latest').set({report},{merge:true});return res.json({report});}catch(e:any){return res.status(503).json({error:e.code==='operations_budget'?'Operations AI budget reached. Checks continue without AI.':'AI investigation unavailable. Checks remain available.'});}
 });
 app.post('/api/admin/operations/config',async(req,res)=>{
  const {monthlyBudgetRM,hardLimit,enabled,openaiKeyExpiresAt}=req.body||{};
  if(typeof hardLimit!=='boolean'||typeof enabled!=='boolean'||!Number.isFinite(monthlyBudgetRM)||monthlyBudgetRM<10||monthlyBudgetRM>5000||typeof openaiKeyExpiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(openaiKeyExpiresAt)||!Number.isFinite(Date.parse(openaiKeyExpiresAt)))return res.sendStatus(400);
  try{await db.doc('operations/config').set({monthlyBudgetRM,hardLimit,enabled,openaiKeyExpiresAt},{merge:true});return res.json({ok:true});}catch{return res.sendStatus(503);}
 });
 app.post('/api/admin/operations/email-test',async(_req,res)=>{try{const ref=db.doc('operations/email-test');const old=await ref.get();if(Date.now()-Number(old.data()?.at||0)<3600000)return res.status(429).json({error:'Please wait an hour before another test'});await ref.set({at:Date.now()});await sendOpsEmail('EZ Academy: ujian amaran operasi','Pemantauan EZ Academy sudah disediakan. Ini e-mel ujian sahaja; tiada masalah dikesan oleh ujian ini. https://ez-academy.my/app/admin/monitor?tab=operations');return res.json({ok:true,message:'Test submitted to Netlify email notifications. Check inbox and spam.'});}catch{return res.status(503).json({error:'Email test failed'});}});
 app.post('/api/admin/operations/reports/:id/resolve',async(req,res)=>{if(!/^[A-Za-z0-9_-]{1,100}$/.test(req.params.id))return res.sendStatus(400);try{await db.doc(`support_reports/${req.params.id}`).update({status:'resolved',resolvedAt:Date.now()});return res.json({ok:true});}catch{return res.sendStatus(503);}});
}
