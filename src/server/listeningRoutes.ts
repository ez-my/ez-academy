import express from 'express';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';
import { FieldValue, Timestamp, type Firestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import {createListeningAudioHandler} from './listeningAudio';
import {createListeningCheckHandler} from './listeningResults';

// Used by both the app server and the Studio development middleware.
export function registerListeningRoutes(router:express.Router, database:Firestore) {
  router.get('/api/listening/audio/:testId',createListeningAudioHandler());
  router.post('/api/listening/check',express.json({limit:'16kb'}),createListeningCheckHandler({
    verifyToken:token=>getAuth().verifyIdToken(token),
    upsert:(uid,id,build)=>database.runTransaction(async transaction=>{
      const ref=database.doc(`users/${uid}/sessions/${id}`);
      const snapshot=await transaction.get(ref);
      const session=build(snapshot.exists?snapshot.data():undefined);
      transaction.set(ref,{...session,timestamp:Timestamp.fromMillis(session.timestamp)});
      return session;
    }),
  }));
}
