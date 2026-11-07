// Kiểu dữ liệu dùng chung cho phòng thi Listening (tách từ listening/[id]/page.tsx)
export interface Part1Item {
  id?: string;
  num: number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  audioUrl?: string;
  transcript?: string;
  translation?: string;
}

export interface Part2Speaker {
  id?: string;
  speaker: string;
  correctAnswer: string;
  explanation: string;
  transcript?: string;
  speakerExplanation?: string;
}

export interface Part3Opinion {
  id?: string;
  statement: string;
  correctAnswer: "Man" | "Woman" | "Both";
  explanation: string;
}

export interface Part4Question {
  id?: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Part4Recording {
  recNum: number;
  title: string;
  passageText: string;
  questions: Part4Question[];
  audioUrl?: string;
  translationText?: string;
}

export interface ListeningExamData {
  title: string;
  durationMinutes: number;
  part1: Part1Item[];
  part2: {
    topic?: string;
    prompt?: string;
    instructions?: string;
    options?: string[];
    speakers: Part2Speaker[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part3: {
    prompt?: string;
    topic?: string;
    instructions?: string;
    opinions: Part3Opinion[];
    audioUrl?: string;
    passageText?: string;
    translationText?: string;
  };
  part4: Part4Recording[];
}

// DEFAULT_LISTENING_TEST được import từ benchmark dataset chuẩn tại @/data/listening-benchmark

/** Kết quả chấm điểm Listening (do calculateResults trong trang trả về). */
export interface ListeningResults {
  totalScore: number;
  maxScore: number;
  cefr: string;
  totalCorrect: number;
  totalQuestionsInExam: number;
  p1Correct: number;
  p1Score: number;
  p2Correct: number;
  p2Score: number;
  p3Correct: number;
  p3Score: number;
  p4Correct: number;
  p4Score: number;
}
