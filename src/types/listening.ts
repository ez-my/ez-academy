export interface ListeningQuestionResult {
  number: number;
  answer: string;
  accepted: string[];
  correct: boolean;
}
export interface ListeningPartResult {
  part: number;
  correct: number;
  total: number;
  answers: Record<string, string>;
  questions: ListeningQuestionResult[];
}
export interface ListeningResult {
  parts: Record<string, ListeningPartResult>;
  correct: number;
  total: number;
  percent: number;
}
