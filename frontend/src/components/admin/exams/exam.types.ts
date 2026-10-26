export interface ExamPartItem {
  id: string;
  partNumber: number;
  title: string;
  questionsCount: number;
}

export interface ExamItem {
  id: string;
  title: string;
  description?: string | null;
  skill: string;
  durationMinutes: number;
  isPro: boolean;
  isPublished: boolean;
  hotLevel?: number;
  forecastTag?: string | null;
  partsCount: number;
  questionsCount: number;
  attemptsCount: number;
  createdAt: string;
  parts?: ExamPartItem[];
}

export interface QuestionItem {
  id: string;
  partId: string;
  questionNumber: number;
  questionType: string;
  prompt: string;
  options?: any;
  correctAnswer?: string | null;
  explanation?: string | null;
  maxScore: number;
  createdAt: string;
  part: {
    id: string;
    partNumber: number;
    title: string;
    passageText?: string | null;
    audioUrl?: string | null;
    imageUrl?: string | null;
    exam: {
      id: string;
      title: string;
      skill: string;
      isPro: boolean;
      isPublished: boolean;
    };
  };
}

export type ExamSortKey =
  | "title"
  | "skill"
  | "hotLevel"
  | "durationMinutes"
  | "questionsCount"
  | "isPublished"
  | "isPro"
  | "attemptsCount"
  | "createdAt";

// Aptis CEFR Standard Parts Specification mapping
export const SKILL_PARTS_INFO: Record<
  string,
  { partNumber: number; name: string; desc: string; badge: string }[]
> = {
  LISTENING: [
    { partNumber: 1, name: "Part 1: Thông tin ngắn", desc: "13 câu hỏi độc thoại / đối thoại ngắn chọn 1 trong 4", badge: "13 Qs" },
    { partNumber: 2, name: "Part 2: Nối quan điểm", desc: "4 người nói & ghép với 6 nhận định quan điểm", badge: "4 Qs" },
    { partNumber: 3, name: "Part 3: Hội thoại Nam & Nữ", desc: "Phân biệt ai đồng ý / ai phản đối (Nam, Nữ, Cả hai)", badge: "4 Qs" },
    { partNumber: 4, name: "Part 4: Bài độc thoại", desc: "2 bài nói học thuật / tin tức dài mở rộng", badge: "4 Qs" },
  ],
  READING: [
    { partNumber: 1, name: "Part 1: Điền từ câu ngắn", desc: "Hoàn thành 5 câu ngắn với từ vựng/ngữ pháp thích hợp", badge: "5 Qs" },
    { partNumber: 2, name: "Part 2: Sắp xếp đoạn văn", desc: "Sắp xếp 5-6 câu lộn xộn thành câu chuyện hoàn chỉnh", badge: "5 Qs" },
    { partNumber: 3, name: "Part 3: Nối văn bản ngắn", desc: "4 đoạn văn ngắn & 7 phát biểu tương ứng người nói", badge: "7 Qs" },
    { partNumber: 4, name: "Part 4: Tiêu đề đoạn văn dài", desc: "Ghép tiêu đề phù hợp cho 7 đoạn văn trong bài đọc dài", badge: "7 Qs" },
  ],
  SPEAKING: [
    { partNumber: 1, name: "Part 1: Thông tin cá nhân", desc: "Trả lời 3 câu hỏi cơ bản về bản thân (30s / câu)", badge: "3 Qs" },
    { partNumber: 2, name: "Part 2: Miêu tả 1 bức tranh", desc: "Mô tả ảnh + 2 câu hỏi mở rộng chủ đề (45s / câu)", badge: "3 Qs" },
    { partNumber: 3, name: "Part 3: So sánh 2 bức tranh", desc: "Đối chiếu 2 bức ảnh & 2 câu hỏi tình huống (45s / câu)", badge: "3 Qs" },
    { partNumber: 4, name: "Part 4: Trải nghiệm & Thảo luận", desc: "1 bức ảnh trừu tượng + 3 câu hỏi (1p chuẩn bị, 2p nói)", badge: "3 Qs" },
  ],
  WRITING: [
    { partNumber: 1, name: "Part 1: Mẫu đơn cá nhân", desc: "Điền 5 câu ngắn (1 - 5 từ mỗi câu)", badge: "5 Qs" },
    { partNumber: 2, name: "Part 2: Đơn gia nhập CLB", desc: "Viết đoạn văn ngắn 20 - 30 từ giải thích lý do", badge: "1 Q" },
    { partNumber: 3, name: "Part 3: Chat mạng xã hội", desc: "Trả lời 3 tin nhắn thảo luận trên diễn đàn CLB (30-40 từ)", badge: "3 Qs" },
    { partNumber: 4, name: "Part 4: Email Thân mật & Trang trọng", desc: "Email 1 cho bạn (50 từ) & Email 2 cho Quản trị viên (120-150 từ)", badge: "2 Qs" },
  ],
  FULL_TEST: [
    { partNumber: 1, name: "Phần 1: Listening", desc: "Trọn bộ 25 câu hỏi Listening 4 Parts chuẩn Aptis", badge: "Listening" },
    { partNumber: 2, name: "Phần 2: Reading", desc: "Trọn bộ 35 phút Reading 4 Parts chuẩn Aptis", badge: "Reading" },
    { partNumber: 3, name: "Phần 3: Writing", desc: "Trọn bộ 50 phút Writing 4 Parts chuẩn Aptis", badge: "Writing" },
    { partNumber: 4, name: "Phần 4: Speaking", desc: "Trọn bộ 12 phút Speaking 4 Parts chuẩn Aptis", badge: "Speaking" },
  ],
};

export const QUESTION_TYPES = [
  { value: "ALL", label: "Tất cả dạng câu" },
  { value: "MULTIPLE_CHOICE", label: "Trắc nghiệm (Multiple Choice)" },
  { value: "GAP_FILL", label: "Điền từ vào chỗ trống (Gap Fill)" },
  { value: "SENTENCE_ORDER", label: "Sắp xếp câu (Sentence Order)" },
  { value: "MATCHING", label: "Nối thông tin (Matching)" },
  { value: "ESSAY", label: "Viết luận / Email (Essay)" },
  { value: "SHORT_TEXT", label: "Trả lời ngắn (Short Text)" },
  { value: "SPEAKING_AUDIO", label: "Ghi âm nói (Speaking Audio)" },
];

export interface EditExamFormData {
  title: string;
  description: string;
  skill: string;
  durationMinutes: number;
  isPro: boolean;
  isPublished: boolean;
  hotLevel: number;
}

export interface QuestionEditFormData {
  prompt: string;
  questionNumber: number;
  questionType: string;
  maxScore: number;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface NewExamWizardData {
  title: string;
  description: string;
  skill: string;
  durationMinutes: number;
  isPro: boolean;
  hotLevel: number;
  parts: {
    partNumber: number;
    title: string;
    instructions: string;
    passageText: string;
    questions: {
      questionNumber: number;
      questionType: string;
      prompt: string;
      options: string[];
      correctAnswer: string;
      explanation: string;
      maxScore: number;
    }[];
  }[];
}
