
import { ListenTestSet, ListenQuestion } from '../types';

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const MAIN_FOLDER_ID = '1lTtIYnctcofkEiPviLunxdJftTT3HDEu';

/**
 * Service to interact with Google Drive for ListenEZ test sets.
 * This implementation relies on the Google Identity Services (GIS) library 
 * which should be loaded in index.html.
 */
export class GoogleDriveService {
  private static accessToken: string | null = null;
  private static clientId: string = import.meta.env.VITE_CLIENT_ID || '';

  /**
   * Triggers the OAuth flow to get an access token.
   */
  static async getAccessToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    if (!this.clientId) {
      throw new Error('Google Client ID is not configured. Please set VITE_CLIENT_ID in your environment variables.');
    }

    return new Promise((resolve, reject) => {
      try {
        // @ts-ignore
        const client = google.accounts.oauth2.initTokenClient({
          client_id: this.clientId,
          scope: 'https://www.googleapis.com/auth/drive.readonly',
          callback: (response: any) => {
            if (response.access_token) {
              this.accessToken = response.access_token;
              resolve(response.access_token);
            } else {
              reject(new Error('Failed to get access token: ' + (response.error || 'Unknown error')));
            }
          },
        });
        client.requestAccessToken();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Fetches the contents of the main test sets folder.
   */
  static async listTestSets(): Promise<{ id: string; name: string }[]> {
    const token = await this.getAccessToken();
    
    let folderId = MAIN_FOLDER_ID;
    
    // First, verify access to MAIN_FOLDER_ID. If it fails, search for a folder named "ListenEZ"
    try {
      const checkRes = await fetch(`${DRIVE_API_URL}/files/${folderId}?fields=id`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!checkRes.ok) throw new Error('Root folder not accessible');
    } catch (e) {
      console.warn('Root folder not accessible, searching for "ListenEZ" folder...');
      const searchRes = await fetch(`${DRIVE_API_URL}/files?q=name='ListenEZ' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
        } else {
          throw new Error('Could not find a "ListenEZ" folder in your Google Drive. Please create one and add subfolders for each test set.');
        }
      }
    }

    const query = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    
    const response = await fetch(`${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id, name)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Drive API Error:', errorData);
      throw new Error(`Failed to fetch test sets from Drive: ${response.status} ${errorData.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.files || [];
  }

  /**
   * Loads a complete test set from a subfolder.
   */
  static async loadTestSet(folderId: string): Promise<ListenTestSet> {
    const token = await this.getAccessToken();
    
    // 1. List files in the folder
    const query = `'${folderId}' in parents and trashed = false`;
    const response = await fetch(`${DRIVE_API_URL}/files?q=${encodeURIComponent(query)}&fields=files(id, name, mimeType)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Failed to connect to Google Drive. Please check your internet connection and permissions.');
    const data = await response.json();
    const files = (data.files || []) as any[];

    if (files.length === 0) {
      throw new Error(`The folder "${folderId}" is empty. Please ensure it contains an audio file, a questions file, and an answer key.`);
    }

    // 2. Identify files using Process of Elimination and multi-level diving
    const audioFiles = files.filter(f => 
      f.mimeType.startsWith('audio/') || 
      /\.(mp3|wav|m4a|aac|ogg|opus|flac)$/i.test(f.name)
    );
    
    const docFiles = files.filter(f => 
      !audioFiles.find(af => af.id === f.id) && 
      f.mimeType !== 'application/vnd.google-apps.folder' &&
      !f.name.startsWith('.') && // Ignore hidden files
      !f.mimeType.includes('shortcut') // Ignore shortcuts
    );

    const subFolders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');

    let audioFile = audioFiles[0];
    let questionsFile: any = null;
    let answersFile: any = null;

    // Filter docFiles for potential questions/answers
    const candidateDocs = docFiles.filter(f => 
      f.mimeType === 'application/vnd.google-apps.document' || 
      f.name.toLowerCase().includes('doc') || 
      f.name.toLowerCase().includes('pdf') ||
      f.name.toLowerCase().includes('txt')
    );

    // Try finding by name first
    questionsFile = candidateDocs.find(f => {
      const name = f.name.toLowerCase();
      return (name.includes('question') || name.includes('task') || name.includes('sheet') || name.match(/^q\d/) || name.includes('soalan')) && !name.includes('answer');
    });
    
    answersFile = candidateDocs.find(f => {
      const name = f.name.toLowerCase();
      return name.includes('answer') || name.includes('key') || name.match(/^a\d/) || name.includes('jawapan') || name.includes('skema');
    });

    // Guessing if ambiguous or missing
    if (candidateDocs.length >= 2) {
      if (!questionsFile && answersFile) questionsFile = candidateDocs.find(f => f.id !== answersFile.id);
      if (!answersFile && questionsFile) answersFile = candidateDocs.find(f => f.id !== questionsFile.id);
      if (!questionsFile && !answersFile) {
        const sorted = [...candidateDocs].sort((a, b) => a.name.localeCompare(b.name));
        questionsFile = sorted[0];
        answersFile = sorted[1];
      }
    } else if (candidateDocs.length === 1 && !questionsFile) {
      questionsFile = candidateDocs[0];
    }

    // Auto-dive: If we have NO files but HAVE subfolders, or if we're missing crucial components
    if (subFolders.length > 0 && (audioFiles.length === 0 || !questionsFile)) {
      console.log(`Missing components in folder ${folderId}, checking subfolders...`);
      // Strategy: Try the first subfolder, or search for one with a name like "Set" or "Trial"
      const targetFolder = subFolders.find(f => /set|trial|spm|exam|practice|kertas/i.test(f.name)) || subFolders[0];
      return this.loadTestSet(targetFolder.id);
    }

    if (!audioFile || !questionsFile || !answersFile) {
      // If we found some but not all, and there are subfolders, maybe the missing parts are there? (Unlikely but worth a try if the error is blocking)
      if (subFolders.length > 0 && (!audioFile || !questionsFile)) {
         // Only dive if we found NOTHING usable, or we're missing something critical
         // Already handled the "nothing found" case above.
      }

      const missing = [];
      if (!audioFile) missing.push('Audio file (mp3/wav)');
      if (!questionsFile) missing.push('Questions document');
      if (!answersFile) missing.push('Answer Key document');
      
      const foundNames = files.map(f => `${f.name} (${f.mimeType === 'application/vnd.google-apps.folder' ? 'Folder' : 'File'})`).join(', ');
      throw new Error(`Missing components: ${missing.join(', ')}. Found in current folder: [${foundNames}]. Ensure your files are named clearly (e.g., "Questions.docx", "Answers.docx"). If using nested folders, please select the specific folder containing the files.`);
    }

    // 3. Fetch content
    console.log(`Loading test set: "${audioFile.name}"`);
    const questionsRaw = await this.fetchFileContent(questionsFile.id, questionsFile.mimeType, token);
    const answersRaw = await this.fetchFileContent(answersFile.id, answersFile.mimeType, token);

    if (typeof questionsRaw === 'string' && questionsRaw.startsWith('Error:')) {
      throw new Error(`Could not read the questions file: ${questionsRaw}`);
    }
    if (typeof answersRaw === 'string' && answersRaw.startsWith('Error:')) {
      throw new Error(`Could not read the answer key: ${answersRaw}`);
    }

    // 4. Handle Audio URL
    const audioBlob = await this.fetchAudioBlob(audioFile.id, token);
    const audioUrl = URL.createObjectURL(audioBlob);

    const parsedQuestions = Array.isArray(questionsRaw) ? questionsRaw : this.parseQuestionsFromText(questionsRaw);
    const parsedAnswers = typeof answersRaw === 'object' && !Array.isArray(answersRaw) ? answersRaw : this.parseAnswersFromText(answersRaw);

    if (parsedQuestions.length === 0) {
      throw new Error('No questions could be parsed from the questions file. Please ensure it uses standard numbering (1. 2. 3.) and that the text is readable.');
    }

    return {
      id: folderId,
      name: audioFile.name.replace(/\.[^/.]+$/, "") || 'SPM Listening Practice',
      audioUrl: audioUrl,
      questions: parsedQuestions,
      answers: parsedAnswers
    };
  }

  private static async fetchAudioBlob(fileId: string, token: string): Promise<Blob> {
    console.log(`Downloading audio: ${fileId}`);
    try {
      const response = await fetch(`${DRIVE_API_URL}/files/${fileId}?alt=media`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(`Failed to download audio: ${err.error?.message || response.statusText}`);
      }
      
      return await response.blob();
    } catch (e) {
      console.error('Audio download failed:', e);
      throw e;
    }
  }

  private static async fetchFileContent(fileId: string, mimeType: string, token: string): Promise<any> {
    let url = `${DRIVE_API_URL}/files/${fileId}?alt=media`;
    
    // Handle Google Docs by exporting to text
    if (mimeType === 'application/vnd.google-apps.document') {
      url = `${DRIVE_API_URL}/files/${fileId}/export?mimeType=text/plain`;
    }

    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        return `Error: ${response.status} ${response.statusText}. ${errorText}`;
      }
  
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      return await response.text();
    } catch (e) {
      return `Error: ${e instanceof Error ? e.message : 'Unknown network error'}`;
    }
  }

  private static parseQuestionsFromText(text: string): ListenQuestion[] {
    let questions: ListenQuestion[] = [];
    
    // Normalize text: handle different line endings and weird characters
    const normalizedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\u200B/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\t/g, ' ');
    
    const sections = normalizedText.split(/PART\s+(\d)/i);
    
    // If we have PART splits, use them
    if (sections.length > 1) {
      for (let i = 1; i < sections.length; i += 2) {
        const partNum = parseInt(sections[i]);
        const partContent = sections[i + 1];
        this.parsePartContent(partContent, partNum, questions);
      }
    } else {
      // Fallback to global parse
      this.parsePartContent(normalizedText, 0, questions);
    }

    // Deduplicate questions by ID (keep first occurrence)
    const seenIds = new Set<string>();
    questions = questions.filter(q => {
      if (seenIds.has(q.id)) return false;
      seenIds.add(q.id);
      return true;
    });

    // Sort by numeric ID
    questions.sort((a, b) => {
      const aNum = parseInt(a.id.replace(/\D/g, '')) || 0;
      const bNum = parseInt(b.id.replace(/\D/g, '')) || 0;
      return aNum - bNum;
    });

    // Placeholder generation removed to force error if parsing fails, 
    // ensuring user knows their document format is unsupported.
    return questions;
  }

  private static parsePartContent(text: string, forcePart: number, questions: ListenQuestion[]) {
    // Split by lines but keep track of context
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    let currentQuestion: Partial<ListenQuestion> | null = null;

    // Improved Regex for Question Numbers:
    // Matches: 1. , 1) , (1) , [1] , Question 1. , Q1. , Task 1, etc.
    // Also handles cases where the number might have some leading whitespace or prefix
    // Relaxed to handle variations in spacing and punctuation
    const qNumRegex = /^\s*(?:(?:Question|Q|Task|T|Unit|No\.?|Item)?\s*[\(\[]?(\d+)[.\)\-\]:]*\s*)(.*)/i;

    // Improved Regex for Options:
    // A. (matches A. A) A- (A) [A] A:) 
    // And handle potential leading whitespace better
    const optRegex = /^\s*[(\[]?([A-Ga-g])[.\)\-\]:]*\s*(.*)/;

    lines.forEach((line) => {
      // Try to find a question match
      const qMatch = line.match(qNumRegex);
      
      if (qMatch) {
        const qNumStr = qMatch[1];
        const qNum = parseInt(qNumStr);
        const qText = qMatch[2]?.trim() || "";
        
        // Validation: Realistic SPM question range + avoids matching years
        if (qNum > 0 && qNum <= 40) {
          if (currentQuestion && currentQuestion.id) {
            questions.push({ ...currentQuestion } as ListenQuestion);
          }
          
          let part = forcePart;
          if (part === 0) {
            if (qNum <= 8) part = 1;
            else if (qNum <= 15) part = 2;
            else if (qNum <= 20) part = 3;
            else part = 4;
          }

          currentQuestion = {
            id: `q${qNum}`,
            text: qText,
            type: part <= 3 ? 'MCQ' : 'SHORT_ANSWER',
            part: part,
            options: []
          };
          return;
        }
      }

      const optMatch = line.match(optRegex);
      if (optMatch && currentQuestion) {
        currentQuestion.options = currentQuestion.options || [];
        currentQuestion.options.push(optMatch[2].trim());
        currentQuestion.type = 'MCQ';
        return;
      }

      // Append multi-line content
      if (currentQuestion) {
        if (currentQuestion.options && currentQuestion.options.length > 0) {
          const lastIdx = currentQuestion.options.length - 1;
          currentQuestion.options[lastIdx] = (currentQuestion.options[lastIdx] + " " + line).trim();
        } else {
          currentQuestion.text = (currentQuestion.text + " " + line).trim();
        }
      }
    });

    if (currentQuestion && currentQuestion.id) {
      questions.push(currentQuestion as ListenQuestion);
    }
  }

  private static parseAnswersFromText(text: string): Record<string, string> {
    const answers: Record<string, string> = {};
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\u200B/g, '');
    
    // First try a global regex match to catch multiple answers per line (e.g. "1. A 2. B 3. C")
    // Match question number followed by answer (one or few letters/numbers)
    const globalAnswerRegex = /(?:Q|q)?(\d+)\s*[:.)\-\s\]]+\s*([A-Za-z0-9]+)(?:\s+|$)/g;
    let match;
    while ((match = globalAnswerRegex.exec(normalizedText)) !== null) {
      const qNum = match[1];
      const val = match[2].trim().toUpperCase();
      // Ensure it's not a huge word that happened to match
      if (val.length > 0 && val.length <= 15) {
        answers[`q${qNum}`] = val;
      }
    }

    // If still empty, fallback to line-by-line analysis
    if (Object.keys(answers).length === 0) {
      const lines = normalizedText.split('\n').map(l => l.trim()).filter(l => l);
      lines.forEach((line, idx) => {
        const val = line.trim().toUpperCase();
        // Skip if it looks like a header or multiple words
        if (val.length > 0 && val.length <= 15 && !val.includes('PART') && !val.includes('ANSWER')) {
          answers[`q${idx + 1}`] = val;
        }
      });
    }

    return answers;
  }
}
