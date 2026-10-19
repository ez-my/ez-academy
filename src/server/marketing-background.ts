import {timingSafeEqual} from 'node:crypto';
import {initializeExistingFirebase} from './firebaseAdmin';
import {generateCampaign} from './marketing';
export const config={};
export default async function(request:Request){
 const key=process.env.OPS_RUN_SECRET,provided=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';
 if(request.method!=='POST'||!key||provided.length!==key.length||!timingSafeEqual(Buffer.from(key),Buffer.from(provided))||process.env.MIGRATION_MODE!=='production')return new Response('',{status:403});
 let body;try{body=await request.json();}catch{return new Response('',{status:400});}
 if(typeof body.id!=='string'||!/^[a-f0-9-]{36}$/.test(body.id))return new Response('',{status:400});
 await generateCampaign(initializeExistingFirebase().database,body.id);return new Response('',{status:200});
}
