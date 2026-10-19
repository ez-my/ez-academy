export const config={schedule:'0 */8 * * *'};
export default async function handler(){
 if(process.env.MIGRATION_MODE!=='production'||!process.env.OPS_RUN_SECRET)return new Response('Production only');
 const result=await fetch('https://ez-academy-2-preview.netlify.app/.netlify/functions/ops-background',{method:'POST',headers:{authorization:`Bearer ${process.env.OPS_RUN_SECRET}`},signal:AbortSignal.timeout(15000)});
 if(!result.ok)throw new Error('Operations dispatch failed');
 return new Response('Dispatched');
}
