import {readFileSync} from 'node:fs';
import {initializeExistingFirebase} from '../src/server/firebaseAdmin';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON=readFileSync('/Users/shahril/.codex/ez-academy-secrets/firebase-server.json','utf8');
const {auth,database:db}=initializeExistingFirebase();
const owner=await auth.getUserByEmail('ezacademy.my@gmail.com');
const snap=await db.collection(`users/${owner.uid}/sessions`).orderBy('timestamp','desc').limit(15).get();
console.log(snap.docs.filter(d=>d.data().type==='ReadEZ').map(d=>{const s=d.data();return {id:d.id,timestamp:s.timestamp?.toMillis?.()??s.timestamp,test:s.testSetId,total:s.readingResult?.total,correct:s.readingResult?.correct};}));
process.exit(0);
