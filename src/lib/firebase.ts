import { withoutRecordingData } from './recordingPrivacy';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, onSnapshot, serverTimestamp, getDocFromServer, Timestamp, orderBy, limit, increment, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, PracticeSession, SiteConfig, AppModule, TaskReminder, Feedback, ActivityLog } from '../types';

// ... (other imports)

export async function getActivityLogs(userId: string): Promise<ActivityLog[]> {
  try {
    const q = query(
      collection(db, 'activity_logs'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp
      } as ActivityLog;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'activity_logs');
    return [];
  }
}

export async function updateDailyGoal(userId: string, minutes: number): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { dailyGoalMinutes: minutes });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
  }
}

const app = initializeApp(firebaseConfig);
export { app };
export const db = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
setLogLevel('silent'); // Suppress long polling idle warnings
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function submitFeedback(feedback: Omit<Feedback, 'id' | 'createdAt' | 'status'>): Promise<void> {
  try {
    const feedbackRef = doc(collection(db, 'feedback'));
    await setDoc(feedbackRef, {
      ...feedback,
      id: feedbackRef.id,
      status: 'PENDING',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'feedback');
  }
}

export async function testConnection() {
  try {
    // Attempt to get a dummy doc to verify connectivity
    await getDocFromServer(doc(db, 'system', 'connection_test'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();

export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const loginWithEmail = async (email: string, password: string) => {
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const registerWithEmail = async (email: string, password: string) => {
  const { createUserWithEmailAndPassword, sendEmailVerification } = await import('firebase/auth');
  const result = await createUserWithEmailAndPassword(auth, email, password);
  try { await sendEmailVerification(result.user); }
  catch { throw new Error("Your account was created, but the email could not be sent. Use Send email again."); }
  return result.user;
};

export const sendVerification = async () => {
  const { sendEmailVerification } = await import('firebase/auth');
  if (!auth.currentUser) throw new Error('Please log in again.');
  await sendEmailVerification(auth.currentUser);
};

export const resetPassword = async (email: string) => {
  const { sendPasswordResetEmail } = await import('firebase/auth');
  await sendPasswordResetEmail(auth, email);
};

export const logout = () => auth.signOut();

export const getUserProfile = async (uid: string): Promise<UserProfile | null | undefined> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt
    } as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    return undefined; // Indicates a fetch error, not "not-found"
  }
};

export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null | undefined) => void) => {
  return onSnapshot(doc(db, 'users', uid), (doc) => {
    if (!doc.exists()) {
      callback(null);
      return;
    }
    const data = doc.data();
    callback({
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : data.createdAt
    } as UserProfile);
  }, (error) => {
    console.error("Error subscribing to profile:", error);
    try {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    } catch (e) {}
    callback(undefined);
  });
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  try {
    const userRef = doc(db, 'users', profile.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // Don't overwrite existing profile completely, just update fields
      const { createdAt, plan, credits, ...rest } = profile;
      await updateDoc(userRef, {
        ...rest,
        updatedAt: serverTimestamp()
      });
    } else {
      // Create new
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
};

export const updateProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
};

export function subscribeToModules(callback: (modules: AppModule[]) => void) {
  const q = query(collection(db, 'modules'), orderBy('order', 'asc'));
  const path = 'modules';
  return onSnapshot(q, (snapshot) => {
    const modules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AppModule);
    callback(modules);
  }, (error) => {
    console.error("Error subscribing to modules:", error);
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (e) {
      // Shhh, the error is already logged and thrown if needed
    }
    callback([]);
  });
}

export async function updateModuleActiveStatus(moduleId: string, isActive: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'modules', moduleId), { 
      isActive,
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `modules/${moduleId}`);
  }
}

const CONFIG_DOC_ID = 'main';

export async function getSiteConfig(): Promise<SiteConfig | null> {
  const path = `settings/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, 'settings', CONFIG_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SiteConfig;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function updateSiteConfig(config: Partial<SiteConfig>): Promise<void> {
  const path = `settings/${CONFIG_DOC_ID}`;
  try {
    const docRef = doc(db, 'settings', CONFIG_DOC_ID);
    await setDoc(docRef, {
      ...config,
      id: CONFIG_DOC_ID,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export const saveSession = async (userId: string, session: PracticeSession): Promise<void> => {
  // Funnel: practice_completed (dynamic import avoids a firebase<->analytics cycle).
  try { const { trackEvent } = await import('./analytics'); trackEvent('practice_completed', { skill: (session as any).type || (session as any).skill, score: session.score ?? undefined }); } catch {}
  try {
    const { timestamp, ...rest } = withoutRecordingData(session);
    const sessionRef = doc(db, 'users', userId, 'sessions', session.id);
    
    // Save the session
    await setDoc(sessionRef, {
      ...rest,
      timestamp: timestamp ? (typeof timestamp === 'number' ? Timestamp.fromMillis(timestamp) : timestamp) : serverTimestamp()
    });

    // Update user stats and rewards
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const earnedPoints = session.score ? Math.round(session.score / 10) : 5; // e.g., 85 score -> 9 points
      
      let creditReward = 0;
      let rewardMessage = '';
      
      // Reward logic for achievers (score >= 80) who are subscribers
      if (session.score && session.score >= 80) {
        const isSubscriber = userData.plan && userData.plan !== 'free';
        if (isSubscriber) {
          creditReward = 1; // Reward 1 credit as rebate so we are not at a loss
          rewardMessage = 'Achiever Bonus: +1 Credit earned!';
        }
      }

      // Calculate Streak
      const today = new Date().toISOString().split('T')[0];
      const lastActiveDate = userData.usage?.date;
      let newStreak = userData.streak || 0;
      
      if (lastActiveDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActiveDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1; // Reset streak
        }
      }

      // Prepare updates
      const updates: any = {
        points: increment(earnedPoints),
        streak: newStreak,
        'usage.date': today,
        updatedAt: serverTimestamp()
      };
      
      // Paid credits are maintained by the trusted payment server.
      creditReward = 0; rewardMessage = '';
      
      await updateDoc(userRef, updates);
      
      if (rewardMessage && typeof window !== 'undefined') {
        // Optional: show a small toast or log (the user will see updated credits)
        console.log(rewardMessage);
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/sessions/${session.id}`);
    throw new Error("Your result could not be synced. Please check your connection and try saving again.");
  }
};

export const getSessions = async (userId: string): Promise<PracticeSession[]> => {
  const q = query(collection(db, 'users', userId, 'sessions'), orderBy('timestamp', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp
    } as PracticeSession;
  });
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('Firestore Error Detailed: ', JSON.stringify(errInfo));
  
  // Only throw if it's a permission denied error as explicitly mandated,
  // or a quota error. Otherwise, just return to allow graceful degradation (e.g. offline).
  const lowerError = errorMessage.toLowerCase();
  if (lowerError.includes('permission') || lowerError.includes('quota') || lowerError.includes('missing or insufficient')) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export function getFriendlyFirebaseError(error: any): string {
  try {
    const errInfo = JSON.parse(error.message);
    const rawError = errInfo.error || "";
    
    if (rawError.includes('permission-denied') || rawError.includes('Missing or insufficient permissions')) {
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        return "Access denied. Please verify your email first.";
      }
      return "You don't have permission to perform this action. Your account level might be restricted.";
    }
    
    if (rawError.includes('quota-exceeded')) {
      return "Daily system limit reached. Please try again tomorrow.";
    }

    if (rawError.includes('unavailable') || rawError.includes('network')) {
      return "The connection is unstable. Please check your internet.";
    }

    return "A database communication error occurred. Please try again.";
  } catch (e) {
    const msg = error?.message || String(error);
    if (msg.includes('permission')) return "Access restricted. Your account may need verification.";
    return "Something went wrong with the database connection.";
  }
}
