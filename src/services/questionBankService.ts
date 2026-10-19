import { withoutRecordingData } from '../lib/recordingPrivacy';
import { normalizeReadTest } from '../lib/readTestCompatibility';
import { collection, query, where, getDocs, limit, orderBy, doc, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { QuestionBankItem } from '../types';

async function getLocalDataBank(type: 'Writing' | 'Speaking', part: 1 | 2 | 3 | 'Full') {
  if (type === 'Writing') {
    const { PART1_QUESTION_BANK, PART2_QUESTION_BANK, PART3_QUESTION_BANK } = await import('../data/questionBank');
    return part === 1 ? PART1_QUESTION_BANK : part === 2 ? PART2_QUESTION_BANK : PART3_QUESTION_BANK;
  } else {
    // Speaking
    const [speakingBank, questionBank] = await Promise.all([
      import('../data/speakingBank'),
      import('../data/speakingQuestionBank')
    ]);
    
    if (part === 1) return speakingBank.PART1_SPEAKING_BANK;
    if (part === 2) return [...speakingBank.PART2_SPEAKING_BANK, ...questionBank.SPEAKING_PART2_BANK];
    if (part === 3) return [...speakingBank.PART3_SPEAKING_BANK, ...questionBank.SPEAKING_PART3_BANK];
    return [];
  }
}

export async function markQuestionAsCompleted(userId: string, questionId: string, score: number = 0) {
  try {
    const ref = doc(db, 'users', userId, 'completed_questions', questionId);
    await setDoc(ref, {
      taskId: questionId,
      timestamp: Date.now(),
      score
    });
  } catch (err) {
    console.error('Error marking question as completed:', err);
  }
}

export async function getAttemptedQuestionIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  try {
    const ref = collection(db, 'users', userId, 'completed_questions');
    try {
      const snap = await getDocs(ref);
      return snap.docs.map(doc => doc.id);
    } catch (err: any) {
      if (err?.code === 'permission-denied') {
        console.warn(`Permission denied for getAttemptedQuestionIds. User: ${userId}, Current Auth: ${db.app.options.projectId}`);
      }
      throw err;
    }
  } catch (err) {
    console.error('Error fetching attempted questions:', err);
    return [];
  }
}

export async function getRandomReadQuestion(
  part: 1 | 2 | 3 | 4 | 5 | 'FULL',
  userId?: string,
  theme?: string,
  isOffline: boolean = false
): Promise<any | null> {
  try {
    const excludeIds = (userId && !isOffline) ? await getAttemptedQuestionIds(userId) : [];

    if (!isOffline) {
      const questionsRef = collection(db, 'questions');
      let dbQuery;
      
      // For specific part
      try {
        if (part !== 'FULL') {
          dbQuery = query(questionsRef, where('type', '==', 'Reading'), where('part', '==', part), limit(100));
          const snapshot = await getDocs(dbQuery);
          let results = snapshot.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QuestionBankItem, 'id'>) } as QuestionBankItem))
            .map(item => ({ ...item, data: normalizeReadTest(item.data, part) }))
            .filter(item => item.data && !excludeIds.includes(item.id));
          
          if (theme) {
            const themedResults = results.filter(r => r.data.theme === theme);
            if (themedResults.length > 0) results = themedResults;
          }
          
          if (results.length > 0) {
            const randomItem = results[Math.floor(Math.random() * results.length)];
            return { ...randomItem.data, id: randomItem.id };
          }
        } else {
          // For FULL paper
          dbQuery = query(questionsRef, where('type', '==', 'Reading'), where('part', '==', 'Full'), limit(100));
          const snapshot = await getDocs(dbQuery);
          let results = snapshot.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QuestionBankItem, 'id'>) } as QuestionBankItem))
            .map(item => ({ ...item, data: normalizeReadTest(item.data, part) }))
            .filter(item => item.data && !excludeIds.includes(item.id));
          
          if (theme) {
            const themedResults = results.filter(r => r.data.theme === theme);
            if (themedResults.length > 0) results = themedResults;
          }
          
          if (results.length > 0) {
            const randomItem = results[Math.floor(Math.random() * results.length)];
            return { ...randomItem.data, id: randomItem.id };
          }
        }
      } catch (e) {
        console.warn("Firestore Read query failed, likely offline:", e);
      }
    }
    
    // 2. Fallback to local
    try {
      const { LOCAL_READING_BANK } = await import('../data/readingBank');
      let filtered = LOCAL_READING_BANK;
      if (part !== 'FULL') {
        filtered = LOCAL_READING_BANK.filter(t => t.parts.some(p => p.partNumber === part));
      }
      
      if (filtered.length > 0) {
        const random = filtered[Math.floor(Math.random() * filtered.length)];
        return normalizeReadTest(random, part);
      }
    } catch (importErr) {
      console.warn("Could not load local reading bank:", importErr);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Read question from bank:', error);
    return null;
  }
}

export async function saveListenQuestionToBank(data: any, audioUrl?: string, createdBy?: string) {
  // User-uploaded audio is private to this device and cannot become a shared recording.
  if (typeof data?.audioUrl === 'string' && /^(blob:|data:audio\/)/i.test(data.audioUrl)) return;
  try {
    const questionsRef = collection(db, 'questions');
    const newDocRef = doc(questionsRef);
    const docData: QuestionBankItem = {
      id: newDocRef.id,
      type: 'Listening',
      part: 'Full',
      data: withoutRecordingData(data),
      createdAt: Date.now(),
      isPublic: true,
      createdBy: createdBy || 'AI'
    };
    await setDoc(newDocRef, docData);
  } catch (err) {
    console.error('Error saving listen question:', err);
  }
}

export async function getRandomListenQuestion(userId?: string, isOffline: boolean = false): Promise<any | null> {
  try {
    if (!isOffline) {
      const questionsRef = collection(db, 'questions');
      const excludeIds = userId ? await getAttemptedQuestionIds(userId) : [];

      const dbQuery = query(questionsRef, where('type', '==', 'Listening'), limit(50));
      const snapshot = await getDocs(dbQuery);
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QuestionBankItem, 'id'>) } as QuestionBankItem))
        .filter(item => !excludeIds.includes(item.id));

      if (results.length > 0) {
        const randomItem = results[Math.floor(Math.random() * results.length)];
        return { ...randomItem.data, id: randomItem.id };
      }
    }
    return null;
  } catch (err) {
    console.error('Error fetching listen question:', err);
    return null;
  }
}

export async function saveReadQuestionToBank(part: 1 | 2 | 3 | 4 | 5 | 'FULL', data: any, theme: string, createdBy?: string) {
  try {
    const questionsRef = collection(db, 'questions');
    const newDocRef = doc(questionsRef);
    const docData: QuestionBankItem = {
      id: newDocRef.id,
      type: 'Reading',
      part: part === 'FULL' ? 'Full' : part,
      data: { ...data, theme },
      createdAt: Date.now(),
      isPublic: true,
      createdBy: createdBy || 'AI'
    };
    await setDoc(newDocRef, docData);
  } catch (err) {
    console.error('Error saving read question:', err);
  }
}

export async function saveQuestionToBank(type: 'Writing' | 'Speaking', part: 1 | 2 | 3 | 'Full', data: any, createdBy?: string) {
  try {
    const questionsRef = collection(db, 'questions');
    const newDocRef = doc(questionsRef);
    const docData: QuestionBankItem = {
      id: newDocRef.id,
      type,
      part,
      data,
      createdAt: Date.now(),
      isPublic: true,
      createdBy: createdBy || 'AI'
    };
    await setDoc(newDocRef, docData);
  } catch (err) {
    console.error('Error saving question:', err);
  }
}

export async function bulkSaveQuestionsToBank(questions: Omit<QuestionBankItem, 'id' | 'createdAt'>[]) {
  try {
    const { writeBatch, doc, collection } = await import('firebase/firestore');
    const batch = writeBatch(db);
    const questionsRef = collection(db, 'questions');
    
    questions.forEach(q => {
      const newDocRef = doc(questionsRef);
      const docData: QuestionBankItem = {
        ...q,
        id: newDocRef.id,
        createdAt: Date.now(),
        isPublic: q.isPublic ?? true,
        createdBy: q.createdBy || 'Bulk Upload'
      };
      batch.set(newDocRef, docData);
    });
    
    await batch.commit();
    return true;
  } catch (err) {
    console.error('Error bulk saving questions:', err);
    throw err;
  }
}

export async function getRandomQuestion(
  type: 'Writing' | 'Speaking',
  part: 1 | 2 | 3 | 'Full',
  userId?: string,
  theme?: string,
  isOffline: boolean = false,
  localExcludeIds: string[] = []
): Promise<any | null> {
  try {
    const dbExcludeIds = (userId && !isOffline) ? await getAttemptedQuestionIds(userId) : [];
    const excludeIds = [...new Set([...dbExcludeIds, ...localExcludeIds])];
    
    if (!isOffline) {
      // 1. Try to fetch from Firestore first, prioritizing the theme
      const questionsRef = collection(db, 'questions');
      
      // First attempt: Match type, part and EXACT theme/topic in Firestore
      if (theme) {
        const themeQueries = [
          query(questionsRef, where('type', '==', type), where('part', '==', part), where('data.theme', '==', theme), limit(20)),
          query(questionsRef, where('type', '==', type), where('part', '==', part), where('data.topic', '==', theme), limit(20))
        ];

        for (const tq of themeQueries) {
          try {
            const snapshot = await getDocs(tq);
            const results = snapshot.docs
              .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QuestionBankItem, 'id'>) } as QuestionBankItem))
              .filter(item => !excludeIds.includes(item.id));
            
            if (results.length > 0) {
              const randomItem = results[Math.floor(Math.random() * results.length)];
              return { ...randomItem.data, id: randomItem.id };
            }
          } catch (e) {
            console.warn("Firestore theme query failed, likely offline:", e);
            break; // Fallback to generic or local
          }
        }
      }

      // Second attempt: Generic from Firestore
      try {
        const genericQuery = query(
          questionsRef,
          where('type', '==', type),
          where('part', '==', part),
          limit(100)
        );

        const genericSnapshot = await getDocs(genericQuery);
        let firestoreResults = genericSnapshot.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<QuestionBankItem, 'id'>) } as QuestionBankItem))
          .filter(item => !excludeIds.includes(item.id));
        
        if (firestoreResults.length > 0) {
          if (theme) {
            const themeMatch = firestoreResults.filter(item => 
              (item.data as any).theme === theme || (item.data as any).topic === theme
            );
            if (themeMatch.length > 0) {
              const randomItem = themeMatch[Math.floor(Math.random() * themeMatch.length)];
              return { ...randomItem.data, id: randomItem.id };
            }
          }
          // If no theme match among these, just pick one that isn't excluded
          const randomItem = firestoreResults[Math.floor(Math.random() * firestoreResults.length)];
          return { ...randomItem.data, id: randomItem.id };
        }
      } catch (e) {
        console.warn("Firestore generic query failed, likely offline:", e);
      }
    }

    // 2. Fallback to local data banks as last resort or if offline
    const bank = await getLocalDataBank(type, part);
    if (type === 'Writing') {
      let filtered = bank;
      if (theme) {
        filtered = (bank as any[]).filter(q => q.theme === theme);
      }
      if (filtered.length === 0) filtered = bank;
      
      const random = { ...(filtered[Math.floor(Math.random() * filtered.length)] as any) };
      if (!random.id) {
        random.id = `local_w${part}_${(random.title || '').replace(/\s+/g, '_').toLowerCase()}`;
      }
      return random;
    } else {
      let filtered = bank;
      if (theme) {
        filtered = (bank as any[]).filter(q => q.theme === theme || q.topic === theme);
      }
      // Apply excludeIds for local bank too
      const available = (filtered as any[]).filter((item, index) => {
        const id = item.id || `local_s${part}_${((item.topic || item.theme || '') as string).replace(/\s+/g, '_').toLowerCase()}_${index}`;
        return !excludeIds.includes(id);
      });

      const finalSource = available.length > 0 ? available : filtered;
      const bankItem = finalSource[Math.floor(Math.random() * finalSource.length)];
      
      const random = typeof bankItem === 'string' ? { questions: [bankItem] } : { ...bankItem };
      
      if (!random.id) {
        // Ensure index is preserved in the ID if we picked from finalSource which maps to available
        const originalIndex = filtered.indexOf(bankItem);
        random.id = `local_s${part}_${(random.topic || random.theme || 'generic').replace(/\s+/g, '_').toLowerCase()}_${originalIndex === -1 ? Math.floor(Math.random()*1000) : originalIndex}`;
      }
      return random;
    }
  } catch (error) {
    console.error('Error fetching question from bank:', error);
    return null;
  }
}
