export type ExamSkillType =
  | "FULL_TEST"
  | "LISTENING"
  | "READING"
  | "WRITING"
  | "SPEAKING"
  | "GRAMMAR_VOCABULARY";

export type QuestionTypeValue =
  | "MULTIPLE_CHOICE"
  | "GAP_FILL"
  | "SENTENCE_ORDER"
  | "MATCHING"
  | "ESSAY"
  | "SHORT_TEXT"
  | "SPEAKING_AUDIO";

export interface CrawledQuestion {
  question_number: number;
  question_type: QuestionTypeValue;
  prompt: string;
  options?: any;
  correct_answer?: string;
  explanation?: string;
  max_score?: number;
}

export interface CrawledExamPart {
  part_number: number;
  title: string;
  instructions?: string;
  passage_text?: string;
  audio_url?: string;
  image_url?: string;
  questions: CrawledQuestion[];
}

export interface CrawledExam {
  id?: string;
  title: string;
  description?: string;
  skill: ExamSkillType;
  duration_minutes: number;
  is_pro: boolean;
  parts: CrawledExamPart[];
}

export interface CrawledDictationSentence {
  level: "FOUNDATION" | "MOMENTUM" | "MASTERY";
  topic: string;
  originalText: string;
  hints?: string;
  audioUrl?: string;
  durationSeconds?: number;
}

export interface CrawledVocabItem {
  word: string;
  phonetic?: string;
  meaning_vi: string;
  example_sentence?: string;
  cefr_level: "B1" | "B2" | "C";
  audio_url?: string;
}

export interface CrawledVocabSet {
  title: string;
  category: string;
  words: CrawledVocabItem[];
}
