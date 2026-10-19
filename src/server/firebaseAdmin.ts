import { getApps, getApp, initializeApp, cert, applicationDefault, type Credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json';

export function initializeExistingFirebase() {
  if (!getApps().length) {
    let credential: Credential;
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      if (serviceAccount.project_id !== config.projectId) throw new Error('Firebase project mismatch');
      credential = cert(serviceAccount);
    } else {
      // Keep local/Google credential support, but never switch identity projects.
      credential = applicationDefault();
    }
    initializeApp({ projectId: config.projectId, credential });
  }
  if (getApp().options.projectId !== config.projectId) throw new Error('Firebase project mismatch');
  const databaseId = config.firestoreDatabaseId === '(default)' ? undefined : config.firestoreDatabaseId;
  return { auth: getAuth(), database: getFirestore(getApp(), databaseId) };
}
