export type MUETCandidateId = 'A' | 'B' | 'C' | 'D';

export interface MUETPart1CandidateTask {
  candidate: MUETCandidateId;
  prompt: string;
  perHints?: {
    point: string;
    example: string;
    reason: string;
  };
}

export interface MUETPart1Data {
  situation: string;
  tasks: Record<MUETCandidateId, string>;
  hints?: Record<MUETCandidateId, { point: string; example: string; reason: string }>;
}

export interface MUETPart2Data {
  situation: string;
  centralQuestion: string;
  points: string[]; // 5 suggested mind map points
  decisionPrompt: string; // "At the end of the discussion, decide..."
}

export interface MUETTopic {
  id: string;
  spmReferenceId?: string;
  title: string;
  theme: string;
  part1: MUETPart1Data;
  part2: MUETPart2Data;
}

export interface MUETNotesPoint {
  id: string;
  point: string;
  example: string;
  reason: string;
  expansionType?: 'Comparison' | 'Situation' | 'Facts/Figures' | 'News' | 'None';
  expansionDetail?: string;
}

export interface MUETDigitalNotesData {
  points: MUETNotesPoint[];
  freeNotes: string;
}

export interface MUETDiscussionTurn {
  id: string;
  speaker: MUETCandidateId;
  speakerName: string;
  isAI: boolean;
  content: string;
  timestamp: number;
  skillType?: 'Initiate' | 'Respond' | 'Develop' | 'Conclude' | 'Question' | 'Agreement';
}

export interface MUETFeedbackCriteria {
  score: number; // 1-5 or 1-6 scale
  maxScore: number;
  cefrLevel: 'A2' | 'B1' | 'B2' | 'C1' | 'C1+';
  observations: string[];
  suggestions: string[];
}

export interface MUETExaminerReport {
  id: string;
  testType: 'Part1' | 'Part2' | 'Mock';
  topicId: string;
  topicTitle: string;
  candidate: MUETCandidateId;
  date: number;
  durationSeconds: number;
  overallBandEstimate: string; // e.g. "Band 4.0 - B2"
  bandScoreNumber: number; // e.g. 4.0
  wordCount: number;
  fillerCount: number;
  fillerWordsDetected: string[];
  speechPaceEstimate: 'Calm & Measured' | 'Natural Flow' | 'Slightly Rushed' | 'Hesitant';
  disclaimer: string;
  
  // Specific criteria
  taskFulfilment: MUETFeedbackCriteria;
  fluencyAndCoherence: MUETFeedbackCriteria;
  languageAndGrammar: MUETFeedbackCriteria;
  interactionAndCommunicativeCompetence: MUETFeedbackCriteria;
  
  // Part specific notes
  part1Evaluation?: {
    usedPERStructure: boolean;
    mainPointsIdentified: string[];
    openingGreetingDetected: boolean;
    conclusionDetected: boolean;
  };
  
  part2Evaluation?: {
    interactionTurnsCount: number;
    initiatingCount: number;
    respondingCount: number;
    politeDisagreementCount: number;
    invitedOthersCount: number;
    finalConsensusReached: boolean;
  };
  
  transcriptEvidence: {
    strongQuote: string;
    whyStrong: string;
    upgradeQuote: string;
    suggestedAlternative: string;
  };
  
  // Self reflection reminders (never claimed to be observed from audio/text)
  selfReflectionReminders: {
    eyeContactNote: string;
    notesDependenceNote: string;
    bodyLanguageNote: string;
  };
  
  strengths: string[];
  actionableSteps: string[];
  rawTranscript: string;
}
