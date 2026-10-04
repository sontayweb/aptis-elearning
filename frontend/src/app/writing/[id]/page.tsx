"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Eye,
  Flag,
  Menu,
  Info,
  ArrowUp,
  LogOut,
  X,
  PenTool,
} from "lucide-react";

interface WritingQuestion {
  id?: string;
  questionNumber: number;
  prompt: string;
  sampleAnswer?: string;
}

interface WritingPart {
  partNumber: number;
  partName: string;
  partSubtitle: string;
  minWords: number;
  maxWords: number;
  instructions: string;
  passageText?: string;
  recommendedMinutes: number;
  questions: WritingQuestion[];
}

// Fallback Default Art Club data chuẩn Aptis Kỳ Tích
const DEFAULT_ART_CLUB_PARTS: WritingPart[] = [
  {
    partNumber: 1,
    partName: "Part 1 – Short Answers",
    partSubtitle: "Part 1 - Short Answers",
    minWords: 1,
    maxWords: 5,
    recommendedMinutes: 3,
    instructions:
      "You want to join an art club. You have 5 messages from a member of the club. Write short answers (1-5 words) to each message. Recommended time: 3 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "1. What do you like doing with your friends?",
        sampleAnswer: "Going to art exhibitions together.",
      },
      {
        questionNumber: 2,
        prompt: "2. Which sport do you like playing the most?",
        sampleAnswer: "Playing badminton and swimming.",
      },
      {
        questionNumber: 3,
        prompt: "3. What did you do last night?",
        sampleAnswer: "I watched an art documentary.",
      },
      {
        questionNumber: 4,
        prompt: "4. Do you like shopping?",
        sampleAnswer: "Yes, especially for painting supplies.",
      },
      {
        questionNumber: 5,
        prompt: "5. What is your favorite season of the year?",
        sampleAnswer: "Autumn, because of colorful leaves.",
      },
    ],
  },
  {
    partNumber: 2,
    partName: "Part 2 – Social Media Response",
    partSubtitle: "Part 2 - Social Media Response",
    minWords: 20,
    maxWords: 30,
    recommendedMinutes: 7,
    instructions:
      "You are a new member of the art club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt: "Tell us about a painting or photo you like.",
        sampleAnswer:
          "I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.",
      },
    ],
  },
  {
    partNumber: 3,
    partName: "Part 3 – Three Questions",
    partSubtitle: "Part 3 - Three Questions",
    minWords: 30,
    maxWords: 40,
    recommendedMinutes: 10,
    instructions:
      "You are a member of the art club. You are talking to three other members in the club chat room. Talk to them using sentences. Use 30-40 words per answer. Recommended time: 10 minutes.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "1. I have kept a painting for a long time. Tell me about something that you have had for a long time.",
        sampleAnswer:
          "I have kept an oil painting created by my grandfather for over ten years. It hangs gracefully in my living room and always brings back warm memories of our time together.",
      },
      {
        questionNumber: 2,
        prompt:
          "2. I would like to learn painting, but I have not found an effective way. Should I take a course at my local college? Please give me some advice.",
        sampleAnswer:
          "Enrolling in a course at your local college is definitely a great choice because you receive structured lessons and immediate professional feedback. Moreover, studying with peers will motivate your artistic growth.",
      },
      {
        questionNumber: 3,
        prompt:
          "3. Street art, where people paint on buildings, is becoming popular. However, some people say it is bad. What is your opinion?",
        sampleAnswer:
          "In my view, street art brings vibrant energy and modern cultural charm to dull urban walls when done legally. However, unauthorized graffiti damaging heritage sites should certainly be discouraged.",
      },
    ],
  },
  {
    partNumber: 4,
    partName: "Part 4 – Formal & Informal Email",
    partSubtitle: "Part 4 - Formal & Informal Email",
    minWords: 50,
    maxWords: 150,
    recommendedMinutes: 20,
    instructions:
      "You are a member of the art club. You received an email from the club secretary stating that the annual art gallery visit has been canceled due to budget constraints.",
    questions: [
      {
        questionNumber: 1,
        prompt:
          "Write an email to a friend who is also an art club member. Write about your feelings and what you think the club should do. Write about 50 words.",
        sampleAnswer:
          "Hi Mark,\n\nDid you see the notice about our gallery excursion being called off? I was really looking forward to seeing the new modern art collection. Maybe we can suggest members contribute a small extra fee so the trip can still take place.\n\nBest,\nHiep",
      },
      {
        questionNumber: 2,
        prompt:
          "Write an email to the club secretary. Explain how you feel about the cancellation and suggest alternative ways the club could organize the trip or raise funds. Write 120-150 words.",
        sampleAnswer:
          "Dear Mr. Davis,\n\nI am writing to express my disappointment upon learning about the cancellation of our anticipated annual visit to the National Art Gallery. This excursion is one of the most enriching activities of the club year.\n\nWhile I appreciate the budgetary hurdles currently facing the committee, I would like to respectfully propose several constructive alternatives. Firstly, members could contribute a modest personal fee to cover transportation expenses. Secondly, we could organize a student art auction or reach out to local sponsors to bridge the deficit.\n\nI believe these solutions would enable us to proceed without placing an excessive burden on club finances. I hope the committee will favorably review these thoughts.\n\nYours sincerely,\nHoang Hiep",
      },
    ],
  },
];

function WritingExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id as string;

  const [examTitle, setExamTitle] = useState("Writing Test");
  const [parts, setParts] = useState<WritingPart[]>(DEFAULT_ART_CLUB_PARTS);
  const [currentPartIdx, setCurrentPartIdx] = useState(0);

  // answers: key = `${partIdx}_${qIdx}`
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(3 * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  // AI Quota & Submission state
  const [aiQuota, setAiQuota] = useState(2);
  const [showPart2Result, setShowPart2Result] = useState(false);
  const [showAiWaitingScreen, setShowAiWaitingScreen] = useState(false);
  const [showSampleAnswersModal, setShowSampleAnswersModal] = useState(false);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const totalQuestionsCount = parts.reduce((acc, p) => acc + p.questions.length, 0);
  const totalAnsweredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  // Khởi tạo Quota từ localStorage (hoặc 2 lượt như hệ thống gốc)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedQuota = localStorage.getItem("aptis_writing_ai_quota");
      if (savedQuota !== null) {
        setAiQuota(Number(savedQuota));
      } else {
        localStorage.setItem("aptis_writing_ai_quota", "2");
      }
    }
  }, []);

  // Xử lý tab part từ URL nếu có (?part=p1, ?part=p2, etc.)
  useEffect(() => {
    const partQuery = searchParams?.get("part");
    if (partQuery === "p1") setCurrentPartIdx(0);
    else if (partQuery === "p2") setCurrentPartIdx(1);
    else if (partQuery === "p3") setCurrentPartIdx(2);
    else if (partQuery === "p4") setCurrentPartIdx(3);
  }, [searchParams]);

  // Load Exam Data từ Backend
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      if (res.success && res.data && res.data.parts?.length > 0) {
        setExamTitle(res.data.title || "Writing Test");

        const loadedParts: WritingPart[] = (res.data.parts || []).map(
          (p: any, idx: number) => {
            const partNum = p.part_number || idx + 1;
            const subTitle =
              partNum === 1
                ? "Part 1 - Short Answers"
                : partNum === 2
                ? "Part 2 - Social Media Response"
                : partNum === 3
                ? "Part 3 - Three Questions"
                : "Part 4 - Formal & Informal Email";

            const defaultP = DEFAULT_ART_CLUB_PARTS[idx] || DEFAULT_ART_CLUB_PARTS[0];

            const questions: WritingQuestion[] =
              p.questions && p.questions.length > 0
                ? p.questions.map((q: any, qIdx: number) => ({
                    id: q.id,
                    questionNumber: q.question_number || qIdx + 1,
                    prompt: q.prompt || defaultP.questions[qIdx]?.prompt || `Question ${qIdx + 1}`,
                    sampleAnswer: q.explanation || defaultP.questions[qIdx]?.sampleAnswer,
                  }))
                : defaultP.questions;

            return {
              partNumber: partNum,
              partName: p.title || defaultP.partName,
              partSubtitle: subTitle,
              minWords: defaultP.minWords,
              maxWords: defaultP.maxWords,
              recommendedMinutes: defaultP.recommendedMinutes,
              instructions: p.instructions || defaultP.instructions,
              passageText: p.passage_text,
              questions,
            };
          }
        );

        setParts(loadedParts);
      } else {
        setParts(DEFAULT_ART_CLUB_PARTS);
      }
    } catch (err: any) {
      console.warn("Fallback to default writing exam:", err);
      setParts(DEFAULT_ART_CLUB_PARTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamData();
  }, [examId]);

  // Cập nhật lại thời gian theo từng Part khi đổi Part
  useEffect(() => {
    const currentP = parts[currentPartIdx];
    if (currentP) {
      setTimeLeft(currentP.recommendedMinutes * 60);
    }
  }, [currentPartIdx, parts]);

  // Timer Countdown
  useEffect(() => {
    if (loading || isPaused || showPart2Result || showAiWaitingScreen) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isPaused, showPart2Result, showAiWaitingScreen]);

  // Khởi tạo submission ở backend
  useEffect(() => {
    async function initWritingSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
        }
      } catch (err) {
        console.warn("Writing offline mode:", err);
      }
    }
    initWritingSubmission();
  }, [examId, submissionId]);

  const currentPart = parts[currentPartIdx] || parts[0];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getWordCount = (text?: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // NỘP BÀI (SUBMIT LOGIC: Part 2 miễn phí trả ngay; Part 1, 3, 4 trừ lượt AI & chờ)
  const handleSubmit = async () => {
    // Lưu các câu trả lời vào database nếu có submissionId
    if (submissionId) {
      try {
        const answersPayload = currentPart.questions.map((q, qIdx) => ({
          questionId: q.id || `writing-p${currentPart.partNumber}-q${qIdx + 1}`,
          textAnswer: answers[`${currentPartIdx}_${qIdx}`] || "",
        }));
        await api.submissions.autosave(submissionId, answersPayload);
      } catch (err) {
        console.warn("Autosave error:", err);
      }
    }

    if (currentPart.partNumber === 2) {
      // PART 2: KHÔNG CHẤM AI - KHÔNG TRỪ LƯỢT AI - TRẢ KẾT QUẢ NGAY
      setShowPart2Result(true);
      setShowAiWaitingScreen(false);
    } else {
      // PART 1, 3, 4: CHẤM AI - TRỪ 1 LƯỢT CHẤM - HIỆN MÀN HÌNH CHỜ 1-3 PHÚT
      const newQuota = Math.max(0, aiQuota - 1);
      setAiQuota(newQuota);
      if (typeof window !== "undefined") {
        localStorage.setItem("aptis_writing_ai_quota", String(newQuota));
      }
      setShowAiWaitingScreen(true);
      setShowPart2Result(false);
    }
  };

  // =========================================================================
  // MÀN HÌNH CHỜ CHẤM AI (PART 1, 3, 4 - THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  if (showAiWaitingScreen) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Top Header Bar theo theme hệ thống */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Writing Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả đánh giá AI
              </span>
            </div>
          </div>
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Centered Waiting Card theo theme hệ thống */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-sm p-10 text-center space-y-6 animate-in fade-in">
            {/* Circular Spinner theo màu primary của hệ thống */}
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>

            {/* Waiting Text */}
            <div className="space-y-2">
              <h3 className="font-heading font-bold text-base text-foreground">
                AI PREMIER đang chấm bài viết
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                Quá trình phân tích CEFR thường mất từ 1-3 phút. Bạn có thể thoát ra làm đề khác, bài chấm hoàn tất sẽ tự động lưu trong Lịch sử làm bài.
              </p>
            </div>

            {/* Thoát Button */}
            <div className="pt-2">
              <Link
                href="/writing"
                className="tech-btn inline-flex items-center justify-center px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
              >
                Thoát về danh sách đề
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH KẾT QUẢ PART 2 (THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  if (showPart2Result) {
    const part2Answer = answers["1_0"] || answers[`${currentPartIdx}_0`] || "";
    const hasAnswer = part2Answer.trim().length > 0;

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
        {/* Top Header Bar theo theme hệ thống */}
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Writing Test
              </span>
              <span className="text-sm font-bold text-foreground">
                Kết quả Part 2 — Form Filling
              </span>
            </div>
          </div>
          <Link
            href="/writing"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </header>

        {/* Content Container */}
        <main className="flex-1 py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Card 1: Điểm */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-center space-y-3">
              <div className="text-3xl">🍰</div>
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                Kết quả Writing — Part 2
              </h2>
              <div className="inline-block px-5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
                Điểm: 0/30
              </div>
            </div>

            {/* Card 2: Nhận xét của AI PREMIER */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Nhận xét của AI PREMIER
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                  0/30
                </span>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {hasAnswer
                  ? "Đã ghi nhận bài làm — phần này không được chấm và không bị trừ lượt chấm AI."
                  : "Chưa làm bài — phần này không được chấm và không bị trừ lượt chấm AI"}
              </p>
            </div>

            {/* Card 3: Lỗi cần sửa */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-2">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <span className="text-primary">✕</span>
                <span>Lỗi cần sửa</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Không phát hiện lỗi ngữ pháp/chính tả
              </p>
            </div>

            {/* Card 4: Bài band B1 của đề này */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  <span className="text-accent">🏆</span>
                  <span>Bài band B1 của đề này</span>
                </h3>
                <button
                  type="button"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Xem Bảng Kỳ Tích
                </button>
              </div>

              {/* 3 Thẻ bài mẫu B1 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I&apos;d like to talk about a photo that I really like. It&apos;s a photo of my family taken during a trip to...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I really like a photo of my family. We took it together during a family trip...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-muted/30 space-y-2 flex flex-col justify-between">
                  <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 shrink-0 text-muted-foreground mt-0.5" />
                    <p className="line-clamp-4 leading-relaxed">
                      I have a lot of pictures, but the favorite picture is the picture that have my family. My family...
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-primary">
                    Học văn án danh
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Đề bài, bài làm & bài viết mẫu */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <span>📝</span>
                <span>Đề bài, bài làm &amp; bài viết mẫu</span>
              </h3>

              <div className="space-y-2 text-xs md:text-sm">
                <span className="font-bold text-primary">Đề 1</span>
                <p className="text-muted-foreground leading-relaxed">
                  You are a new member of the art club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes.
                </p>
                <p className="font-medium text-foreground">
                  Tell us about a painting or photo you like.
                </p>
              </div>

              {/* Bài làm của bạn */}
              <div className="space-y-1 text-xs">
                <span className="font-semibold text-muted-foreground">Bài làm của bạn:</span>
                <div className="p-3 rounded-xl bg-muted/40 border border-border text-foreground font-sans min-h-[48px]">
                  {hasAnswer ? (
                    <p className="leading-relaxed">{part2Answer}</p>
                  ) : (
                    <span className="text-muted-foreground italic">(không có nội dung)</span>
                  )}
                </div>
              </div>

              {/* Bài mẫu tham khảo của đề */}
              <div className="space-y-1.5 text-xs">
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>💡</span>
                  <span>Bài mẫu tham khảo của đề</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans">
                  I took a photo last weekend in the park when the sun was setting. The light was soft, so the picture looked very nice.
                </div>
              </div>
            </div>

            {/* Action Buttons theo theme hệ thống */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPart2Result(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <span>👁️</span>
                <span>Xem lại từng câu →</span>
              </button>
              <Link
                href="/writing"
                className="tech-btn inline-flex items-center justify-center px-8 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all"
              >
                Quay lại danh sách đề
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // =========================================================================
  // MÀN HÌNH LÀM BÀI PHÒNG THI (THEO THEME CHUẨN CỦA HỆ THỐNG MÌNH)
  // =========================================================================
  return (
    <div className="notranslate exam-active exam-mode min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans select-none">
      {/* 0. Top thin progress bar */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{ width: `${((currentPartIdx + 1) / parts.length) * 100}%` }}
        />
      </div>

      {/* 1. TOP HEADER (EXAM MODE) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-exam-surface/95 backdrop-blur border-b border-exam-border">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold text-exam-text truncate hidden sm:block">
              {examTitle}
            </span>
            <span className="text-[10px] text-exam-text-muted hidden md:inline">
              Writing Aptis ESOL
            </span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`font-mono text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              timeLeft < 300
                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                : "bg-exam-bg border-exam-border text-exam-text"
            }`}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-exam-text-muted">
              Phần {currentPart.partNumber} / {parts.length}
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 pt-16 pb-24 px-3 md:px-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card Context & Header Banner */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    Phần {currentPart.partNumber} / 4
                  </span>
                  <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                    {currentPart.partName}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {currentPart.instructions}
                </p>
              </div>

              {/* Pause control */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted font-medium transition-colors flex items-center gap-1.5"
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                </button>
              </div>
            </div>

            {/* Part 2 Specific Prompt */}
            {currentPart.partNumber === 2 && (
              <div className="text-xs md:text-sm font-semibold text-foreground pt-1">
                Tell us about a painting or photo you like.
              </div>
            )}
          </div>

          {/* 3. INPUT QUESTION CARDS */}
          {/* =========================================================================
              PART 1: 5 SHORT ANSWER QUESTIONS
              ========================================================================= */}
          {currentPart.partNumber === 1 && (
            <div className="space-y-4">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <label className="text-xs md:text-sm font-semibold text-foreground block">
                      {q.prompt}
                    </label>
                    <textarea
                      rows={2}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder="Type your answer..."
                      className="w-full p-3 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / 10
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              PART 2: FORM RESPONSE
              ========================================================================= */}
          {currentPart.partNumber === 2 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <textarea
                rows={5}
                value={answers[`${currentPartIdx}_0`] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [`${currentPartIdx}_0`]: e.target.value,
                  }))
                }
                placeholder="Type your answer here"
                className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
              />
              <div className="flex justify-end text-xs text-muted-foreground font-mono">
                Words {getWordCount(answers[`${currentPartIdx}_0`])} / 45
              </div>
            </div>
          )}

          {/* =========================================================================
              PART 3: 3 CHAT QUESTIONS
              ========================================================================= */}
          {currentPart.partNumber === 3 && (
            <div className="space-y-4">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                      {q.prompt}
                    </label>
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder="Write your answer here (30-40 words)..."
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / 60
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              PART 4: 2 EMAILS (INFORMAL & FORMAL)
              ========================================================================= */}
          {currentPart.partNumber === 4 && (
            <div className="space-y-6">
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);
                const isFormal = qIdx === 1;

                return (
                  <div
                    key={q.questionNumber}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-3"
                  >
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-primary uppercase">
                        {isFormal ? "Task 2 — Formal Email" : "Task 1 — Informal Email"}
                      </span>
                      <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                        {q.prompt}
                      </label>
                    </div>

                    <textarea
                      rows={isFormal ? 8 : 4}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder={
                        isFormal
                          ? "Write your formal letter to the secretary (120-150 words)..."
                          : "Write your informal note to your friend (~50 words)..."
                      }
                      className="w-full p-3.5 rounded-xl border border-input bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all"
                    />
                    <div className="flex justify-end text-xs text-muted-foreground font-mono">
                      Words {words} / {isFormal ? 220 : 75}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* 4. FIXED BOTTOM BAR CHUẨN EXAM MODE */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-exam-surface/95 backdrop-blur border-t border-exam-border h-14">
        <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Left: Drawer & Info & Sample Modal */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPartsDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
              title="Danh sách Parts"
            >
              <Menu className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Phần ({currentPartIdx + 1}/{parts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-exam-border/40 transition-colors cursor-pointer"
              title="Thông tin bài thi"
            >
              <Info className="w-4 h-4 text-exam-text-muted" />
            </button>

            <button
              type="button"
              onClick={() => setShowSampleAnswersModal(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
            >
              <span>💡 Bài mẫu</span>
            </button>
          </div>

          {/* Right: AI Quota & Exit, Previous, Next / Submit */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 mr-1">
              <span>⚡</span>
              <span>{aiQuota} lượt AI</span>
            </div>

            <Link
              href="/writing"
              title="Thoát"
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={() => setCurrentPartIdx((p) => Math.max(0, p - 1))}
              disabled={currentPartIdx === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-sm font-medium hover:bg-exam-border/40 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentPartIdx === parts.length - 1) {
                  setIsSubmitModalOpen(true);
                } else {
                  setCurrentPartIdx((p) => Math.min(parts.length - 1, p + 1));
                }
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-brand-brown text-sm font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>{currentPartIdx === parts.length - 1 ? "Nộp bài" : "Next"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL THÔNG TIN BÀI THI */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-exam-border">
              <h4 className="font-bold text-sm text-exam-text">Thông tin bài thi Writing</h4>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-exam-text-muted hover:text-exam-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-exam-text">
              {[
                { l: "Tên bài thi", v: examTitle },
                { l: "Kỹ năng", v: "Writing Aptis ESOL (4 Parts)" },
                { l: "Phần hiện tại", v: `${currentPart.partSubtitle}` },
                { l: "Đã điền", v: `${totalAnsweredCount}/${totalQuestionsCount} câu` },
                { l: "Thời gian còn lại", v: formatTime(timeLeft) },
              ].map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="text-exam-text-muted">{x.l}:</span>
                  <span className="font-bold">{x.v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-exam-surface rounded-2xl border border-exam-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-exam-text">Xác nhận nộp bài thi Writing?</h3>
            <p className="text-sm text-exam-text-muted leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{totalAnsweredCount}/{totalQuestionsCount}</strong> câu hỏi. Hệ thống AI sẽ chấm điểm chi tiết 4 tiêu chí CEFR cho bài viết của bạn.
            </p>
            {totalAnsweredCount < totalQuestionsCount && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                ⚠️ Lưu ý: Bạn vẫn còn {totalQuestionsCount - totalAnsweredCount} câu chưa điền nội dung!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
              >
                Tiếp tục viết bài
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSubmitModalOpen(false);
                  handleSubmit();
                }}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO */}
      {showSampleAnswersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <span>💡</span>
                <span>Bài mẫu tham khảo — {currentPart.partSubtitle}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed">
              {currentPart.questions.map((q, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1.5">
                  <div className="font-semibold text-foreground">{q.prompt}</div>
                  <div className="text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                    {q.sampleAnswer || "Chưa có bài mẫu cho câu hỏi này."}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSampleAnswersModal(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH PARTS */}
      {showPartsDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Chuyển Part bài thi
              </h3>
              <button
                type="button"
                onClick={() => setShowPartsDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {parts.map((p, idx) => (
                <button
                  key={p.partNumber}
                  type="button"
                  onClick={() => {
                    setCurrentPartIdx(idx);
                    setShowPartsDrawer(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors ${
                    currentPartIdx === idx
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/40 hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{p.partSubtitle}</span>
                  <span className="text-[10px] opacity-80">
                    {p.recommendedMinutes} phút
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          BACKUP CODE UI CŨ (GENERIC 2-COLUMN VIEW)
          Được comment lại theo yêu cầu của user để có thể phục hồi/backup bất cứ lúc nào:
          =========================================================================
      {false && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="p-4 rounded-xl bg-muted/40 border border-border mb-6">
                <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
                  Ngữ cảnh đề bài:
                </span>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                  {currentPart.instructions}
                </p>
              </div>
              <h3 className="text-base md:text-lg font-heading font-bold text-foreground mb-4">
                {currentPart.questions[0]?.prompt}
              </h3>
              <textarea
                rows={8}
                value={answers[`${currentPartIdx}_0`] || ""}
                placeholder="Gõ bài viết tiếng Anh của bạn tại đây..."
                className="w-full p-4 rounded-xl border border-input bg-card text-foreground text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-sans leading-relaxed resize-y"
              />
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-accent" />
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Kết quả đánh giá AI (CEFR)
                </h3>
              </div>
              <div className="space-y-2 text-xs">
                <div>Mức độ hoàn thành đề bài (Task Response)</div>
                <div>Ngữ pháp & Cấu trúc câu (Grammar)</div>
                <div>Độ phong phú từ vựng (Lexical)</div>
              </div>
            </div>
          </div>
        </div>
      )}
      ========================================================================= */}
    </div>
  );
}

export default function WritingExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      }
    >
      <WritingExamRunnerContent />
    </Suspense>
  );
}
