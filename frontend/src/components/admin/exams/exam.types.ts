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
  forecastTag?: string | null;
}

export interface QuestionEditFormData {
  prompt: string;
  questionNumber: number;
  questionType: string;
  maxScore: number;
  options: any;
  correctAnswer: string;
  explanation: string;
}

export interface AptisTaskMeta {
  taskId: string;
  skill: string;
  logicalPart: number;
  taskLabel: string;
  canonicalPartTitle: string;
  defaultQuestionType: string;
  guideText: string;
  partContextRequirement: string;
  promptLabel: string;
  promptPlaceholder: string;
  quickPrompts?: string[];
  quickOptionPresets?: { label: string; options: string[] }[];
}

export function detectLogicalPartNumber(
  skill?: string,
  partNumber?: number,
  partTitle?: string | null,
  questionType?: string | null
): number {
  if (partTitle) {
    const m = partTitle.match(/Part\s*([1-4])/i);
    if (m) return Number(m[1]);
    const t = partTitle.toLowerCase();
    if (t.includes("gap fill") || t.includes("personal") || t.includes("word-level") || t.includes("information recognition")) return 1;
    if (t.includes("cohesion") || t.includes("describe") || t.includes("short text")) return 2;
    if (t.includes("compare") || t.includes("three responses")) return 3;
    if (t.includes("long text") || t.includes("abstract") || t.includes("club email") || t.includes("monologue")) return 4;
  }
  if (skill === "READING") {
    if (questionType === "GAP_FILL") return 1;
    if (questionType === "SENTENCE_ORDER") return 2;
  }
  if (skill === "WRITING" && questionType === "SHORT_TEXT") {
    return 1;
  }
  if (partNumber && partNumber >= 1 && partNumber <= 4) {
    return partNumber;
  }
  return 1;
}

export function detectAptisTaskMeta(
  skill?: string,
  partNumber?: number,
  partTitle?: string | null,
  questionType?: string | null
): AptisTaskMeta {
  const normSkill = (skill || "READING").toUpperCase();
  const logicalPart = detectLogicalPartNumber(normSkill, partNumber, partTitle, questionType);
  const key = `${normSkill}_P${logicalPart}`;

  const MAP: Record<string, AptisTaskMeta> = {
    LISTENING_P1: {
      taskId: "LISTENING_P1",
      skill: "LISTENING",
      logicalPart: 1,
      taskLabel: "Listening Part 1 · Nhận diện thông tin ngắn",
      canonicalPartTitle: "Part 1 - Information Recognition",
      defaultQuestionType: "MULTIPLE_CHOICE",
      guideText: "Đoạn hội thoại/độc thoại ngắn. Học viên nghe Audio của Part và chọn 1 đáp án đúng (A, B, C hoặc D).",
      partContextRequirement: "Cần gắn link Audio (MP3) ở cấp độ Phần thi (ExamPart) và Transcript (nếu có) ở Bài đọc/Ngữ cảnh.",
      promptLabel: "Câu hỏi nghe (Question Prompt)",
      promptPlaceholder: "VD: What time does the train leave? / Where will they meet?",
    },
    LISTENING_P2: {
      taskId: "LISTENING_P2",
      skill: "LISTENING",
      logicalPart: 2,
      taskLabel: "Listening Part 2 · Nối quan điểm 4 người nói (Speaker A–D)",
      canonicalPartTitle: "Part 2 - Opinion Matching",
      defaultQuestionType: "MATCHING",
      guideText: "4 người nói (Speaker A, B, C, D) chia sẻ về cùng 1 chủ đề. Mỗi câu là 1 người nói, học viên chọn quan điểm đúng trong danh sách 6 lựa chọn.",
      partContextRequirement: "Gắn Audio cả bài vào ExamPart. Mỗi câu hỏi đại diện cho Speaker 1..4 (hoặc A..D) cùng chung bộ 6 lựa chọn.",
      promptLabel: "Người nói / Câu hỏi cần nối (Speaker Prompt)",
      promptPlaceholder: "VD: Speaker A (Person 1) expresses the opinion that...",
      quickPrompts: ["Speaker A", "Speaker B", "Speaker C", "Speaker D"],
    },
    LISTENING_P3: {
      taskId: "LISTENING_P3",
      skill: "LISTENING",
      logicalPart: 3,
      taskLabel: "Listening Part 3 · Hội thoại Nam & Nữ (Man / Woman / Both)",
      canonicalPartTitle: "Part 3 - Opinion Matching",
      defaultQuestionType: "MATCHING",
      guideText: "Cuộc thảo luận giữa 1 người đàn ông (Man) và 1 người phụ nữ (Woman). Học viên xác định nhận định thuộc về Man, Woman hay Both.",
      partContextRequirement: "Gắn Audio hội thoại vào ExamPart. Các lựa chọn chuẩn gồm: [Man, Woman, Both].",
      promptLabel: "Nhận định / Quan điểm trong cuộc hội thoại",
      promptPlaceholder: "VD: Who thinks universities should focus more on practical skills?",
      quickOptionPresets: [
        { label: "Chuẩn Listening Part 3 (Man / Woman / Both)", options: ["Man", "Woman", "Both"] },
      ],
    },
    LISTENING_P4: {
      taskId: "LISTENING_P4",
      skill: "LISTENING",
      logicalPart: 4,
      taskLabel: "Listening Part 4 · Bài độc thoại dài (Monologue Comprehension)",
      canonicalPartTitle: "Part 4 - Monologue Comprehension",
      defaultQuestionType: "MULTIPLE_CHOICE",
      guideText: "Bài độc thoại chuyên sâu, mỗi bài gồm 2 câu hỏi trắc nghiệm (3 lựa chọn A, B, C).",
      partContextRequirement: "Gắn Audio bài độc thoại vào ExamPart và đặt Transcript vào phần Ngữ cảnh.",
      promptLabel: "Câu hỏi độc thoại (Question Prompt)",
      promptPlaceholder: "VD: What is the speaker's main criticism of the new policy?",
    },
    READING_P1: {
      taskId: "READING_P1",
      skill: "READING",
      logicalPart: 1,
      taskLabel: "Reading Part 1 · Điền từ vào chỗ trống (Gap Fill [gap])",
      canonicalPartTitle: "Part 1 - Gap Fill",
      defaultQuestionType: "GAP_FILL",
      guideText: "5 câu văn ngắn thuộc bức thư/email thân mật. Mỗi câu có 1 vị trí khuyết đánh dấu bằng [gap] và 3 từ lựa chọn.",
      partContextRequirement: "Mỗi câu hỏi bắt buộc chứa ký hiệu [gap] tại vị trí cần điền từ và có 3 phương án lựa chọn.",
      promptLabel: "Câu văn chứa vị trí khuyết [gap]",
      promptPlaceholder: "VD: The weather here is [gap] and sunny every day.",
    },
    READING_P2: {
      taskId: "READING_P2",
      skill: "READING",
      logicalPart: 2,
      taskLabel: "Reading Part 2 · Sắp xếp câu thành đoạn văn (Text Cohesion)",
      canonicalPartTitle: "Part 2 - Text Cohesion",
      defaultQuestionType: "SENTENCE_ORDER",
      guideText: "Cấu trúc chuẩn Database: Danh sách 5 câu văn được lưu theo ĐÚNG THỨ TỰ CHUẨN (Câu 1 là câu mở đầu cố định trên giao diện thi, Câu 2 → 5 hệ thống sẽ tự động xáo trộn để học viên kéo thả).",
      partContextRequirement: "Chỉ cần nhập 5 câu theo đúng thứ tự mạch lạc từ Câu 1 đến Câu 5.",
      promptLabel: "Tiêu đề đoạn văn sắp xếp (Topic / Story Title)",
      promptPlaceholder: "VD: Delivery instructions / A famous football player",
    },
    READING_P3: {
      taskId: "READING_P3",
      skill: "READING",
      logicalPart: 3,
      taskLabel: "Reading Part 3 · Nối quan điểm 4 người (Opinion Matching A–D)",
      canonicalPartTitle: "Part 3 - Opinion Matching",
      defaultQuestionType: "MATCHING",
      guideText: "Bài đọc gồm 4 đoạn ngắn của 4 người (Person A, B, C, D) đặt tại phần Bài đọc (Passage Text) của Part. Bên dưới là 7 câu hỏi 'Who...?' chọn A, B, C hoặc D.",
      partContextRequirement: "Đặt nội dung 4 đoạn văn (A, B, C, D) vào Bài đọc (Passage Text) của Phần thi (ExamPart).",
      promptLabel: "Câu hỏi nhận định (Who...?)",
      promptPlaceholder: "VD: Who prefers reading printed books to e-books?",
      quickOptionPresets: [
        { label: "Chuẩn Reading Part 3 (A / B / C / D)", options: ["A", "B", "C", "D"] },
        { label: "Chuẩn Reading Part 3 (Person A–D)", options: ["Person A", "Person B", "Person C", "Person D"] },
      ],
    },
    READING_P4: {
      taskId: "READING_P4",
      skill: "READING",
      logicalPart: 4,
      taskLabel: "Reading Part 4 · Ghép tiêu đề cho 7 đoạn văn dài (Long Text Headings)",
      canonicalPartTitle: "Part 4 - Long Text Comprehension",
      defaultQuestionType: "MATCHING",
      guideText: "Bài đọc dài 7 đoạn văn. Mỗi câu hỏi đại diện cho 1 đoạn văn (Paragraph 1..7), học viên chọn 1 tiêu đề (Heading) đúng trong danh sách 8 tiêu đề.",
      partContextRequirement: "Đặt toàn bộ bài đọc dài vào Passage Text của Part (hoặc đặt nội dung từng đoạn vào Prompt của câu hỏi 1..7).",
      promptLabel: "Đoạn văn cần gắn tiêu đề (Paragraph 1..7)",
      promptPlaceholder: "VD: Paragraph 1: Nội dung đoạn 1...",
    },
    WRITING_P1: {
      taskId: "WRITING_P1",
      skill: "WRITING",
      logicalPart: 1,
      taskLabel: "Writing Part 1 · Điền đơn thông tin ngắn (1–5 từ / câu)",
      canonicalPartTitle: "Part 1 - Word-level Writing",
      defaultQuestionType: "SHORT_TEXT",
      guideText: "5 câu hỏi thông tin cơ bản khi đăng ký thành viên CLB. Học viên trả lời ngắn gọn từ 1 đến 5 từ mỗi câu.",
      partContextRequirement: "Không cần bài đọc dài. Nhập từng câu hỏi ngắn và câu trả lời mẫu vào phần Bài mẫu.",
      promptLabel: "Câu hỏi ngắn trong mẫu đơn (Short Question)",
      promptPlaceholder: "VD: What is your favourite season? / How do you travel to work?",
    },
    WRITING_P2: {
      taskId: "WRITING_P2",
      skill: "WRITING",
      logicalPart: 2,
      taskLabel: "Writing Part 2 · Viết đoạn văn ngắn cho CLB (20–30 từ)",
      canonicalPartTitle: "Part 2 - Short Text Writing",
      defaultQuestionType: "ESSAY",
      guideText: "1 câu hỏi yêu cầu học viên viết đoạn văn ngắn (20–30 từ) trả lời mẫu đơn của CLB.",
      partContextRequirement: "Nhập câu hỏi tình huống vào Prompt và bài viết mẫu chuẩn B2 vào phần Bài mẫu (Explanation).",
      promptLabel: "Đề bài Writing Part 2 (20–30 words)",
      promptPlaceholder: "VD: Please tell us about the last time you visited a museum and why you went there. (20–30 words)",
    },
    WRITING_P3: {
      taskId: "WRITING_P3",
      skill: "WRITING",
      logicalPart: 3,
      taskLabel: "Writing Part 3 · Trả lời 3 tin nhắn phòng Chat CLB (30–40 từ / câu)",
      canonicalPartTitle: "Part 3 - Three Responses",
      defaultQuestionType: "ESSAY",
      guideText: "3 câu hỏi liên tiếp từ các thành viên trong phòng Chat của CLB. Mỗi câu trả lời dài 30–40 từ.",
      partContextRequirement: "Gồm đúng 3 câu hỏi (Câu 1, Câu 2, Câu 3) tương ứng 3 thành viên CLB hỏi.",
      promptLabel: "Tin nhắn của thành viên CLB (Chat Prompt 30–40 words)",
      promptPlaceholder: "VD: Sam: Hi! Welcome to the club. Why did you decide to join our club? (30–40 words)",
    },
    WRITING_P4: {
      taskId: "WRITING_P4",
      skill: "WRITING",
      logicalPart: 4,
      taskLabel: "Writing Part 4 · Viết 2 Email Thân mật & Trang trọng (50 từ & 120–150 từ)",
      canonicalPartTitle: "Part 4 - Club Email Writing",
      defaultQuestionType: "ESSAY",
      guideText: "Dựa trên thông báo từ CLB (đặt ở Passage Text của Part), học viên viết 2 bức thư: Câu 1 gửi người bạn thân (khoảng 50 từ) và Câu 2 gửi Quản lý CLB (120–150 từ).",
      partContextRequirement: "Đặt Thông báo của Câu lạc bộ (Dear Member...) vào phần Bài đọc / Ngữ cảnh (Passage Text) của ExamPart.",
      promptLabel: "Yêu cầu viết Email (Câu 1: Informal 50 từ / Câu 2: Formal 120–150 từ)",
      promptPlaceholder: "VD: Write an email to your friend explaining your feelings about the change and suggesting what to do next. (About 50 words)",
      quickPrompts: [
        "Write an email to your friend who is also a member of the club. Explain your feelings about the notice and suggest what you can do together. Write about 50 words.",
        "Write an email to the president of the club. Explain your feelings about the notice and suggest ways to improve the situation. Write 120-150 words.",
      ],
    },
    SPEAKING_P1: {
      taskId: "SPEAKING_P1",
      skill: "SPEAKING",
      logicalPart: 1,
      taskLabel: "Speaking Part 1 · Thông tin cá nhân (3 câu × 30s — Không dùng ảnh)",
      canonicalPartTitle: "Part 1 - Personal Information",
      defaultQuestionType: "SPEAKING_AUDIO",
      guideText: "3 câu hỏi cá nhân ngắn gọn về bản thân, sở thích, thói quen hàng ngày (30 giây ghi âm / câu). Không có hình ảnh.",
      partContextRequirement: "Không gắn ảnh ở Part 1 (để trống Image URL).",
      promptLabel: "Câu hỏi phỏng vấn cá nhân (Personal Question)",
      promptPlaceholder: "VD: Please tell me about your family. / What do you like doing in your free time?",
    },
    SPEAKING_P2: {
      taskId: "SPEAKING_P2",
      skill: "SPEAKING",
      logicalPart: 2,
      taskLabel: "Speaking Part 2 · Mô tả 1 bức tranh & Mở rộng (3 câu × 45s — Cần 1 ảnh)",
      canonicalPartTitle: "Part 2 - Describe & Opinion",
      defaultQuestionType: "SPEAKING_AUDIO",
      guideText: "Học viên quan sát 1 bức tranh (gắn ở ExamPart) và trả lời 3 câu hỏi (Câu 1: Describe this picture, Câu 2 & 3: Mở rộng trải nghiệm/quan điểm — 45s / câu).",
      partContextRequirement: "Bắt buộc gắn ĐÚNG 1 bức ảnh vào trường Hình ảnh (Image URL) của Phần thi (ExamPart).",
      promptLabel: "Câu hỏi Nói dựa trên bức tranh (45s / câu)",
      promptPlaceholder: "VD: Describe this picture. / Tell me about a time when you...",
      quickPrompts: ["Describe this picture."],
    },
    SPEAKING_P3: {
      taskId: "SPEAKING_P3",
      skill: "SPEAKING",
      logicalPart: 3,
      taskLabel: "Speaking Part 3 · So sánh 2 bức tranh đối lập (3 câu × 45s — Cần 2 ảnh)",
      canonicalPartTitle: "Part 3 - Compare & Explain",
      defaultQuestionType: "SPEAKING_AUDIO",
      guideText: "Học viên quan sát 2 bức tranh đối chiếu Picture 1 & Picture 2 (gắn ở ExamPart) và trả lời 3 câu hỏi (Câu 1: Describe the two pictures, Câu 2 & 3: So sánh & lựa chọn — 45s / câu).",
      partContextRequirement: "Bắt buộc gắn ĐÚNG 2 bức ảnh (JSON array hoặc ngăn cách dấu phẩy) vào trường Hình ảnh (Image URL) của ExamPart.",
      promptLabel: "Câu hỏi So sánh 2 bức tranh (45s / câu)",
      promptPlaceholder: "VD: Describe the two pictures. / Which of these two places would you prefer to visit?",
      quickPrompts: ["Describe the two pictures."],
    },
    SPEAKING_P4: {
      taskId: "SPEAKING_P4",
      skill: "SPEAKING",
      logicalPart: 4,
      taskLabel: "Speaking Part 4 · Thảo luận chủ đề trừu tượng (3 câu — 1p chuẩn bị, 2p nói)",
      canonicalPartTitle: "Part 4 - Abstract Discussion",
      defaultQuestionType: "SPEAKING_AUDIO",
      guideText: "3 câu hỏi xoay quanh 1 chủ đề trừu tượng / trải nghiệm cá nhân. Học viên có 1 phút chuẩn bị ghi chú và 2 phút trình bày liên tục cho cả 3 câu.",
      partContextRequirement: "Theo chuẩn DB hiện tại: 3 câu hỏi hiển thị cùng lúc (không bắt buộc gắn ảnh).",
      promptLabel: "Câu hỏi thảo luận Part 4",
      promptPlaceholder: "VD: Tell me about a time when you achieved a difficult goal. How did you feel?",
    },
  };

  return (
    MAP[key] || {
      taskId: key,
      skill: normSkill,
      logicalPart,
      taskLabel: `${normSkill} · Part ${logicalPart}`,
      canonicalPartTitle: partTitle || `Part ${logicalPart}`,
      defaultQuestionType: questionType || "MULTIPLE_CHOICE",
      guideText: "Nhập đầy đủ nội dung câu hỏi, đáp án chuẩn và lời giải thích chi tiết.",
      partContextRequirement: "Kiểm tra ngữ cảnh Bài đọc / Audio / Hình ảnh của Phần thi (ExamPart).",
      promptLabel: "Nội dung câu hỏi (Prompt)",
      promptPlaceholder: "Nhập nội dung câu hỏi...",
    }
  );
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
