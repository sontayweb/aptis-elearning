import { ExamSkill, QuestionType } from '@prisma/client';

export interface IngestedQuestion {
  questionNumber: number;
  questionType: QuestionType;
  prompt: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  maxScore?: number;
}

export interface IngestedPart {
  partNumber: number;
  title: string;
  instructions?: string;
  passageText?: string;
  audioUrl?: string;
  imageUrl?: string;
  questions: IngestedQuestion[];
}

export interface IngestedExam {
  title: string;
  description?: string;
  skill: ExamSkill;
  durationMinutes: number;
  isPro?: boolean;
  isPublished?: boolean; // Mặc định false: đưa vào Hàng chờ duyệt (Draft)
  hotLevel?: number;
  forecastTag?: string;
  source?: string;
  parts: IngestedPart[];
}

export interface IngestionResult {
  examId: string;
  title: string;
  skill: ExamSkill;
  totalParts: number;
  totalQuestions: number;
  mediaExtracted: {
    images: string[];
    audioFiles: string[];
  };
}

export interface FullTestAssemblyInput {
  title: string;
  description?: string;
  isPro?: boolean;
  hotLevel?: number;
  forecastTag?: string;
  readingExamId?: string;
  listeningExamId?: string;
  writingExamId?: string;
  speakingExamId?: string;
  grammarExamId?: string;
}
