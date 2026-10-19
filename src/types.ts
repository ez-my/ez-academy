import type {ListeningResult} from './types/listening';
export type PlanType = 'free' | 'basic' | 'pro' | 'pro_plus' | 'lite' | 'plus' | 'max' | 'focus';

export interface UserUsage {
  date: string; // YYYY-MM-DD format
  speak: number;
  write: number;
  read: number;
  listen: number;
  aiListen?: number;
  deep: number;
}

export interface TaskReminder {
  id: string;
  title: string;
  date: number; // timestamp
  type: 'SpeakEZ' | 'WriteEZ' | 'ReadEZ' | 'ListenEZ' | 'General';
  completed: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  goal: 'SPM' | 'MUET' | 'PROFESSIONAL' | string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | string;
  onboardingCompleted: boolean;
  streak: number;
  streakGoal?: number;
  points: number;
  weeklyGoalProgress: number; // 0-100
  weeklyGoalMinutes?: number;
  createdAt: number;
  plan?: PlanType;
  fullTestAccess?: boolean;
  credits?: number;
  usage?: UserUsage;
  reminders?: TaskReminder[];
  achievements?: string[];
  dailyGoalMinutes?: number;
  micEnabled?: boolean;
  soundEnabled?: boolean;
  aiEngine?: 'gemini' | 'chatgpt';
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'PRACTICE' | 'LEVEL_UP' | 'ACHIEVEMENT' | 'INFO';
  message: string;
  timestamp: number;
}

export interface PracticeSession {
  muetReport?: import('./types/muet').MUETExaminerReport;
  listeningResult?: ListeningResult;
  readingResult?: ListeningResult;
  id: string;
  userId: string;
  type: 'SpeakEZ' | 'WriteEZ' | 'ReadEZ' | 'ListenEZ';
  timestamp: number;
  duration: number; // seconds
  score: number; // 0-100
  feedback: string; // Markdown
  transcript?: string;
  testSetId?: string;
  answers?: Record<string, string>;
  metrics: {
    fluency: number;
    grammar: number;
    vocabulary: number;
    comprehension: number;
    pronunciation: number;
    structure: number;
  };
  userEvaluation?: {
    xp: number;
    coins: number;
    achievement: string;
    shareableSnippet: string;
  };
}

export interface ReadStimulus {
  id: string;
  title?: string;
  content: string;
}

export interface ReadQuestion {
  id: string;
  number: number;
  type: 'MCQ' | 'GAPPED_TEXT' | 'MATCHING' | 'SHORT_ANSWER';
  text: string;
  options?: string[];
  stimulusId?: string; 
}

export interface ReadPart {
  partNumber: number;
  instruction: string;
  passage?: string;
  stimuli?: ReadStimulus[];
  questions: ReadQuestion[];
}

export interface ReadTestSet {
  id: string;
  title: string;
  parts: ReadPart[];
  answers: Record<string, string>;
}

export interface ListenQuestion {
  id: string;
  part: number; // 1, 2, 3, 4 (SPM layout)
  type: 'MCQ' | 'SHORT_ANSWER';
  text: string;
  options?: string[]; // For MCQ [A, B, C, D]
  placeholder?: string; // For Short Answer
}

export interface ListenTestSet {
  id: string;
  name: string;
  audioUrl: string;
  questions: ListenQuestion[];
  answers: Record<string, string>; // Maps question ID to correct answer
}

export interface DailyActivity {
  day: string;
  score: number;
}

export interface SiteConfig {
  id: string;
  hero: {
    title: string;
    subtitle: string;
    ctaText: string;
    secondaryCtaText: string;
    imageUrl?: string;
    videoUrl?: string;
  };
  features: {
    title: string;
    subtitle: string;
    items: {
      id: string;
      title: string;
      desc: string;
      iconName: string;
      highlight: boolean;
    }[];
  };
  media?: {
    promoVideo?: string;
    backgroundAudio?: string;
    audioTitle?: string;
  };
  colors: {
    primary: string;
    obsidian: string;
  };
  contact: {
    email: string;
    whatsapp: string;
    address: string;
  };
  seo?: {
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    keywords: string;
  };
  sectionLayout?: {
    id: string;
    label: string;
    enabled: boolean;
  }[];
  contentSections?: {
    id: string;
    title: string;
    content: string; // Rich text HTML
    showInNav: boolean;
  }[];
  updatedAt: number;
}

export interface QuestionBankItem {
  id: string;
  type: 'Writing' | 'Speaking' | 'Reading' | 'Listening';
  part: 1 | 2 | 3 | 4 | 5 | 'Full';
  data: any; 
  isPublic?: boolean;
  createdBy?: string;
  createdAt: number;
}

export interface AppModule {
  id: string;
  name: string;
  description: string;
  iconName: string; // lucide icon name
  slug: string;
  order: number;
  isActive: boolean;
  category: 'core' | 'bonus' | 'exam';
  difficulty?: 'Easy' | 'Intermediate' | 'Advanced' | string;
  updatedAt: number;
}

export interface Feedback {
  id?: string;
  userId: string;
  userEmail: string;
  type: 'FEEDBACK' | 'COMPLAINT' | 'SUGGESTION' | 'OTHER';
  subject: string;
  message: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  createdAt: number;
}
