import type {Plugin} from 'vite';
import express from 'express';
import { getApps, initializeApp, applicationDefault, getApp } from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json';
import {registerListeningRoutes} from './listeningRoutes';

// Studio can retain the outer Express process between manual edits. Vite reloads
// its config, so the preview also mounts the same current listening handlers here.
// Production uses server.ts; keys and Firestore access remain on the server.
export function listeningPreviewPlugin():Plugin {
  return {
    name:'listening-preview-api',apply:'serve',
    configureServer(server) {
      if(!getApps().length)initializeApp({credential:applicationDefault(),projectId:config.projectId});
      const databaseId=config.firestoreDatabaseId==='(default)'?undefined:config.firestoreDatabaseId;
      const router=express.Router();
      registerListeningRoutes(router,getFirestore(getApp(),databaseId));
      server.middlewares.use(router);
    },
  };
}
