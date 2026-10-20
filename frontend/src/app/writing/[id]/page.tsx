"use client";

import { useState, useEffect, useRef, Suspense } from "react";
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
  Trophy,
  FileText,
  Zap,
  Award,
} from "lucide-react";

import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import {
  type WritingQuestion,
  type WritingPart,
  DEFAULT_ART_CLUB_PARTS,
  getBenchmarkWritingParts,
} from "@/data/writing-benchmark";

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
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);
  const isStartingSubmissionRef = useRef(false);

  // AI Quota & Submission state
  const [aiQuota, setAiQuota] = useState(2);
  const [showPart2Result, setShowPart2Result] = useState(false);
  const [showAiWaitingScreen, setShowAiWaitingScreen] = useState(false);
  const [showSampleAnswersModal, setShowSampleAnswersModal] = useState(false);
  const [showPartsDrawer, setShowPartsDrawer] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("Lỗi đề bài hoặc câu hỏi");
  const [reportNote, setReportNote] = useState("");
  const [reportSent, setReportSent] = useState(false);

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

  // Xử lý tab part từ URL nếu có (?part=p1, ?part=p2, ?part=1, etc.)
  useEffect(() => {
    const partQuery = searchParams?.get("part")?.toLowerCase();
    if (!partQuery || parts.length === 0) return;

    // Nếu là bài thi lẻ (chỉ có 1 Part duy nhất), luôn giữ currentPartIdx = 0
    if (parts.length === 1) {
      setCurrentPartIdx(0);
      return;
    }

    let targetPartNum = 1;
    if (partQuery === "p1" || partQuery === "1") targetPartNum = 1;
    else if (partQuery === "p2" || partQuery === "2") targetPartNum = 2;
    else if (partQuery === "p3" || partQuery === "3") targetPartNum = 3;
    else if (partQuery === "p4" || partQuery === "4") targetPartNum = 4;

    const matchedIdx = parts.findIndex((p) => p.partNumber === targetPartNum);
    if (matchedIdx !== -1) {
      setCurrentPartIdx(matchedIdx);
    } else {
      setCurrentPartIdx(0);
    }
  }, [searchParams, parts]);

  // Điều hướng chuyển Part mượt mà, cuộn êm dịu lên đầu bài
  const handleSelectPart = (idx: number) => {
    if (idx === currentPartIdx) return;
    setCurrentPartIdx(idx);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Load Exam Data từ Backend
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      const title = res.data?.title || "Writing Test";
      setExamTitle(title);

      const benchmarkParts = getBenchmarkWritingParts(title || examId);

      if (res.success && res.data && res.data.parts?.length > 0) {
        const loadedParts: WritingPart[] = (res.data.parts || []).map(
          (p: any, idx: number) => {
            // Single Source of Truth: Ưu tiên partType chuẩn từ Backend DTO
            let partNum = idx + 1;
            if (p.partType === 'PART_4' || p.part_number === 4) partNum = 4;
            else if (p.partType === 'PART_3' || p.part_number === 3) partNum = 3;
            else if (p.partType === 'PART_2' || p.part_number === 2) partNum = 2;
            else if (p.partType === 'PART_1' || p.part_number === 1) partNum = 1;
            else {
              const combinedTitle = `${p.title || ""} ${title} ${p.part_number || ""}`.toLowerCase();
              if (/part\s*4|email/i.test(combinedTitle)) partNum = 4;
              else if (/part\s*3|three\s*response|chat/i.test(combinedTitle)) partNum = 3;
              else if (/part\s*2|short\s*text|social/i.test(combinedTitle)) partNum = 2;
              else partNum = 1;
            }

            const defaultP = benchmarkParts[partNum - 1] || benchmarkParts[0];
            const subTitle = p.partSubtitle || (
              partNum === 1
                ? "Part 1 - Short Answers"
                : partNum === 2
                ? "Part 2 - Social Media Response"
                : partNum === 3
                ? "Part 3 - Three Questions"
                : "Part 4 - Formal & Informal Email"
            );

            let questions: WritingQuestion[] = [];
            if (p.questions && p.questions.length > 0) {
              questions = p.questions.map((q: any, qIdx: number) => {
                let promptText = q.prompt || defaultP.questions[qIdx]?.prompt || `Question ${qIdx + 1}`;
                if (partNum === 2) {
                  // Làm sạch nếu prompt còn chứa đoạn chỉ dẫn thừa
                  const m = promptText.match(/^(?:.*?(?:fill in the form|write in sentences|use 20[–-]30 words|recommended time:[^.]*)[.\s]+)(.+)$/i);
                  if (m && m[1].trim().length > 5) {
                    promptText = m[1].trim();
                  }
                }
                return {
                  id: q.id,
                  questionNumber: q.question_number || qIdx + 1,
                  prompt: promptText,
                  sampleAnswer: q.explanation || defaultP.questions[qIdx]?.sampleAnswer,
                };
              });
            } else {
              questions = defaultP.questions;
            }

            // Đảm bảo Part 4 luôn luôn có đủ 2 email chuẩn Aptis ESOL:
            // 1. Email thân mật gửi bạn (khoảng 50 từ)
            // 2. Email trang trọng gửi Quản lý CLB / Club Manager (120 - 150 từ)
            if (partNum === 4 && questions.length === 1) {
              const q1 = questions[0];
              const isManager = /manager|secretary|president|formal/i.test(q1.prompt);
              if (isManager) {
                questions = [
                  {
                    questionNumber: 1,
                    prompt: "Write an email to a friend who is also a member of the club. Tell them about your feelings regarding this notice and discuss what you should do next. Write about 50 words.",
                    sampleAnswer: "Hi there,\n\nDid you see the recent announcement from our club? I was quite disappointed to hear about this sudden decision. What do you think we should do about it? Let me know soon.\n\nBest,\nYour friend",
                  },
                  {
                    ...q1,
                    questionNumber: 2,
                  },
                ];
              } else {
                questions = [
                  q1,
                  {
                    questionNumber: 2,
                    prompt: "Write an email to the Club Manager. Explain how you feel about the announcement, outline how this decision impacts club members, and suggest practical alternatives or solutions. Write 120–150 words.",
                    sampleAnswer: "Dear Club Manager,\n\nI am writing to express my concern regarding the recent announcement communicated to our club members. While I appreciate the operational challenges that the management is currently addressing, I feel this sudden change will negatively impact many dedicated members.\n\nFirstly, many members have arranged their personal commitments around the existing schedule. Secondly, this change causes substantial inconvenience and dissatisfaction among regular participants. Therefore, I would respectfully propose that the club committee consider alternative measures, such as organizing a member survey or exploring flexible compromise solutions.\n\nThank you for taking the time to consider our perspective on this important matter. I look forward to hearing your response.\n\nYours sincerely,\nClub Member",
                  },
                ];
              }
            }

            let instructions = p.instructions || defaultP.instructions;
            if (partNum === 2 && (!instructions || instructions === "Write your response in English.")) {
              const cleanClub = title.replace(/\s*—.*$/, '').replace(/\s*-.*$/, '').trim();
              instructions = `You are a new member of the ${cleanClub}. Fill in the form. Write in sentences. Use 20–30 words. Recommended time: 7 minutes.`;
            }

            return {
              partNumber: partNum,
              partName: p.title || defaultP.partName,
              partSubtitle: subTitle,
              minWords: defaultP.minWords,
              maxWords: defaultP.maxWords,
              recommendedMinutes: defaultP.recommendedMinutes,
              instructions,
              passageText: p.passage_text,
              questions,
            };
          }
        );

        // Hiển thị chính xác các Part có trong đề thi, KHÔNG tự ý chèn Part của CLB khác
        setParts(loadedParts);
      } else {
        setParts(benchmarkParts);
      }
    } catch (err: any) {
      console.warn("Fallback to default writing exam:", err);
      const fallback = getBenchmarkWritingParts(examId);
      setParts(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) loadExamData();
  }, [examId]);

  // Tự động cuộn pill part đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`writing-part-pill-${currentPartIdx}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentPartIdx]);

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

  // 1. Phục hồi bản nháp bài viết từ LocalStorage khi vào phòng thi (Zero data loss)
  useEffect(() => {
    if (typeof window === "undefined" || !examId) return;
    try {
      const raw = localStorage.getItem(`aptis_draft_writing_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.answers && Object.keys(draft.answers).length > 0) {
          setAnswers((prev) => ({ ...draft.answers, ...prev }));
        }
      }
    } catch {}
  }, [examId]);

  // 2. Tự động lưu bản nháp vào LocalStorage mỗi khi gõ phím
  useEffect(() => {
    if (typeof window === "undefined" || !examId) return;
    if (Object.keys(answers).length > 0) {
      try {
        localStorage.setItem(
          `aptis_draft_writing_${examId}`,
          JSON.stringify({
            answers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [answers, examId]);

  // 3. Cảnh báo beforeunload chống vô tình F5/thoát trang làm mất bài viết
  useEffect(() => {
    if (showPart2Result || showAiWaitingScreen) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Writing. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showPart2Result, showAiWaitingScreen]);

  // 4. Khởi tạo / Khôi phục submission ở backend
  useEffect(() => {
    async function initWritingSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || submissionId || isStartingSubmissionRef.current || parts.length === 0) return;
      isStartingSubmissionRef.current = true;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          const subData = res.data;
          setSubmissionId(subData.submissionId || subData.id);
          if (subData.serverTimeRemaining !== undefined) {
            setTimeLeft(subData.serverTimeRemaining);
          }

          if (subData.isResumed) {
            let loadedCount = 0;
            if (subData.savedAnswers && typeof subData.savedAnswers === "object") {
              const loaded: Record<string, string> = {};
              parts.forEach((p, pIdx) => {
                p.questions.forEach((q, qIdx) => {
                  if (q.id) {
                    const text = (subData.savedAnswers as Record<string, any>)[q.id]?.textAnswer;
                    if (typeof text === "string" && text.trim().length > 0) {
                      loaded[`${pIdx}_${qIdx}`] = text;
                    }
                  }
                });
              });
              loadedCount = Object.keys(loaded).length;
              if (loadedCount > 0) {
                setAnswers((prev) => ({ ...loaded, ...prev }));
              }
            }

            // CHỈ kích hoạt khôi phục nếu thực sự có câu trả lời được phục hồi
            if (loadedCount > 0) {
              setIsResumedSession(true);
              setSyncStatus("resumed");
              setTimeout(() => setSyncStatus("idle"), 4000);
            }
          }
        }
      } catch (err) {
        isStartingSubmissionRef.current = false;
        console.warn("Writing offline mode:", err);
      }
    }
    initWritingSubmission();
  }, [examId, submissionId, parts]);

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
        const answersPayload = currentPart.questions
          .filter((q) => q.id && q.id.length > 10)
          .map((q, qIdx) => ({
            questionId: q.id!,
            textAnswer: answers[`${currentPartIdx}_${qIdx}`] || "",
          }));
        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        if (currentPart.partNumber === 4 || currentPartIdx === parts.length - 1) {
          await api.submissions.submit(submissionId);
        }
      } catch (err) {
        console.warn("Writing autosave/submit error:", err);
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
                AI Kỳ Tích đang chấm bài viết
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
    const part2Idx = parts.findIndex((p) => p.partNumber === 2);
    const pIdxToUse = part2Idx !== -1 ? part2Idx : currentPartIdx;
    const part2Answer = answers[`${pIdxToUse}_0`] || answers["1_0"] || answers["0_0"] || "";
    const hasAnswer = part2Answer.trim().length > 0;
    const part2Obj = parts.find((p) => p.partNumber === 2) || currentPart;

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
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                Kết quả Writing — Part 2
              </h2>
              <div className="inline-block px-5 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-sm">
                Điểm: 0/30
              </div>
            </div>

            {/* Card 2: Nhận xét của AI Kỳ Tích */}
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-foreground">
                  Nhận xét của AI Kỳ Tích
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
                <AlertCircle className="w-4 h-4 text-primary" />
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
                  <Trophy className="w-4 h-4 text-amber-500" />
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
                <FileText className="w-4 h-4 text-primary" />
                <span>Đề bài, bài làm &amp; bài viết mẫu</span>
              </h3>

              <div className="space-y-2 text-xs md:text-sm">
                <span className="font-bold text-primary">{examTitle || "Writing Test"}</span>
                <p className="text-muted-foreground leading-relaxed">
                  {part2Obj?.instructions || "You are a new member of the club. Fill in the form. Write in sentences. Use 20-30 words. Recommended time: 7 minutes."}
                </p>
                <p className="font-medium text-foreground">
                  {part2Obj?.questions[0]?.prompt || "Tell us about your interests and why you want to join this club."}
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
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Bài mẫu tham khảo của đề</span>
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 leading-relaxed font-sans">
                  {part2Obj?.questions[0]?.sampleAnswer || "I really enjoy participating in club activities because it helps me learn new things and meet great people."}
                </div>
              </div>
            </div>

            {/* Action Buttons theo theme hệ thống */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => setShowPart2Result(false)}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
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
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* 1. TOP HEADER (THEO DESIGN SYSTEM CỦA DỰ ÁN) */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/writing"
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Writing Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {currentPart.partSubtitle}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược & Sync status */}
        <div className="flex items-center gap-2.5">
          <ExamSyncStatus
            status={syncStatus}
            lastSavedAt={lastSavedAt}
            isResumed={isResumedSession}
          />
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/writing"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </Link>
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={Object.values(answers).filter(Boolean).length}
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Card Context & Header Banner */}
          <div key={`part-header-${currentPart.partNumber}`} className="part-transition bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {parts.length > 1 ? `Phần ${currentPart.partNumber} / ${parts.length}` : `Part ${currentPart.partNumber} · Đề luyện lẻ`}
                  </span>
                  <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                    {currentPart.partName}
                  </h2>
                </div>
                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans pt-1">
                  {currentPart.instructions}
                </p>
              </div>

              {/* Bookmark, Pause, Timer */}
              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                <button
                  type="button"
                  className="flex items-center gap-1 px-3 py-1 rounded-xl border border-border text-xs text-muted-foreground hover:bg-muted font-medium transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Bookmark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className="p-1.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                  title={isPaused ? "Tiếp tục" : "Tạm dừng"}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>

                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. INPUT QUESTION CARDS WITH SMOOTH PART TRANSITION */}
          <div key={`part-questions-container-${currentPart.partNumber}`} className="part-transition space-y-4">
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
              PART 2: FORM RESPONSE (20–30 WORDS)
              ========================================================================= */}
          {currentPart.partNumber === 2 && (
            <div className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-primary text-primary-foreground shadow-sm">
                    Câu hỏi điền đơn (Form Field)
                  </span>
                  <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                    Mục tiêu: 20 – 30 từ · Thời gian gợi ý: ~7 phút
                  </span>
                </div>

                {/* Word status badge */}
                {(() => {
                  const val = answers[`${currentPartIdx}_0`] || "";
                  const words = getWordCount(val);
                  let wordStatusText = "Chưa nhập bài";
                  let wordStatusColor = "text-muted-foreground bg-muted border-border";
                  if (words > 0) {
                    if (words < 20) {
                      wordStatusText = `Chưa đủ dung lượng (${words}/20–30 từ)`;
                      wordStatusColor = "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
                    } else if (words <= 35) {
                      wordStatusText = `Đạt chuẩn dung lượng (${words}/20–30 từ)`;
                      wordStatusColor = "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
                    } else {
                      wordStatusText = `Vượt số từ khuyến nghị (${words}/30 từ)`;
                      wordStatusColor = "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
                    }
                  }
                  return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}>
                      {wordStatusText}
                    </span>
                  );
                })()}
              </div>

              {/* Hộp hiển thị câu hỏi nổi bật rõ ràng */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <div className="text-[11px] font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Câu hỏi cần trả lời:</span>
                </div>
                <div className="text-sm md:text-base font-bold text-foreground leading-relaxed">
                  {currentPart.questions[0]?.prompt || "Please tell us about yourself and your reasons for joining this club."}
                </div>
              </div>

              <textarea
                rows={5}
                value={answers[`${currentPartIdx}_0`] || ""}
                onChange={(e) =>
                  setAnswers((prev) => ({
                    ...prev,
                    [`${currentPartIdx}_0`]: e.target.value,
                  }))
                }
                placeholder="Write in sentences (20–30 words). Type your answer here..."
                className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all shadow-inner"
              />

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
                    {(() => {
                      const words = getWordCount(answers[`${currentPartIdx}_0`] || "");
                      return (
                        <div
                          className={`h-full transition-all duration-300 ${
                            words >= 20 && words <= 35
                              ? "bg-emerald-500"
                              : words > 35
                              ? "bg-blue-500"
                              : "bg-primary"
                          }`}
                          style={{
                            width: `${Math.min(100, (words / 30) * 100)}%`,
                          }}
                        />
                      );
                    })()}
                  </div>
                  <span className="font-mono font-medium">
                    {getWordCount(answers[`${currentPartIdx}_0`]) || 0} / 30 từ
                  </span>
                </div>
                <span className="text-[11px] italic">
                  Khuyến nghị: Viết 2–3 câu hoàn chỉnh có chủ vị
                </span>
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
              PART 4: 2 EMAILS (INFORMAL & FORMAL DUAL-FORM WORKSPACE)
              ========================================================================= */}
          {currentPart.partNumber === 4 && (
            <div className="space-y-6">
              {/* Thông báo tình huống Part 4 nếu có */}
              {currentPart.passageText && (
                <div className="bg-card rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 md:p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                    <FileText className="w-4 h-4" />
                    <span>Thông báo từ Ban Quản lý Câu lạc bộ (Club Announcement)</span>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs md:text-sm text-foreground/90 leading-relaxed font-sans whitespace-pre-line">
                    {currentPart.passageText}
                  </div>
                </div>
              )}
              {currentPart.questions.map((q, qIdx) => {
                const answerKey = `${currentPartIdx}_${qIdx}`;
                const val = answers[answerKey] || "";
                const words = getWordCount(val);
                const isFormal = qIdx === 1;

                // Chuẩn độ dài theo British Council
                const targetMin = isFormal ? 120 : 40;
                const targetMax = isFormal ? 150 : 60;
                const recommendedWords = isFormal ? "120 – 150 từ" : "40 – 60 từ (khuyến nghị 50 từ)";
                const recommendedTime = isFormal ? "20 phút" : "10 phút";

                // Đánh giá trạng thái số lượng từ
                let wordStatusText = "Chưa nhập bài";
                let wordStatusColor = "text-muted-foreground bg-muted border-border";
                if (words > 0) {
                  if (words < targetMin) {
                    wordStatusText = `Chưa đủ dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
                    wordStatusColor = "text-amber-700 bg-amber-500/10 border-amber-300 dark:text-amber-400";
                  } else if (words <= targetMax) {
                    wordStatusText = `Đạt chuẩn dung lượng (${words}/${isFormal ? 150 : 50} từ)`;
                    wordStatusColor = "text-emerald-700 bg-emerald-500/10 border-emerald-300 dark:text-emerald-400";
                  } else {
                    wordStatusText = `Vượt số từ khuyến nghị (${words}/${isFormal ? 150 : 50} từ)`;
                    wordStatusColor = "text-blue-700 bg-blue-500/10 border-blue-300 dark:text-blue-400";
                  }
                }

                return (
                  <div
                    key={q.questionNumber}
                    className={`bg-card rounded-2xl border transition-all shadow-sm ${
                      isFormal
                        ? "border-primary/30 ring-1 ring-primary/10"
                        : "border-sky-300/40 ring-1 ring-sky-400/10"
                    } p-5 md:p-6 space-y-4`}
                  >
                    {/* Header thông tin từng email */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                            isFormal
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-sky-600 text-white shadow-sm"
                          }`}
                        >
                          {isFormal ? "Task 2 — Formal Email (Trang trọng)" : "Task 1 — Informal Email (Thân mật)"}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                          Thời gian gợi ý: ~{recommendedTime}
                        </span>
                      </div>

                      {/* Word Status Badge */}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${wordStatusColor}`}>
                        {wordStatusText}
                      </span>
                    </div>

                    {/* Đề bài */}
                    <div className="space-y-1.5">
                      <label className="text-xs md:text-sm font-semibold text-foreground block leading-relaxed">
                        {q.prompt}
                      </label>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-semibold text-foreground">Yêu cầu chuẩn:</span>
                        <span className="px-2 py-0.5 rounded-md bg-muted font-medium">Mục tiêu: {recommendedWords}</span>
                        <span className="px-2 py-0.5 rounded-md bg-muted font-medium">
                          {isFormal
                            ? "Văn phong: Lịch sự, dùng Dear Mr/Ms..., không viết tắt, kết Yours sincerely"
                            : "Văn phong: Tự nhiên, thân thiện, dùng Hi/Hey, được viết tắt, kết Best/Cheers"}
                        </span>
                      </div>
                    </div>

                    {/* Vùng nhập bài viết */}
                    <textarea
                      rows={isFormal ? 9 : 5}
                      value={val}
                      onChange={(e) =>
                        setAnswers((prev) => ({
                          ...prev,
                          [answerKey]: e.target.value,
                        }))
                      }
                      placeholder={
                        isFormal
                          ? "Dear Mr./Ms. [Tên quản lý],\n\nI am writing to express my view regarding the recent notice...\n\n[Giải thích cảm nghĩ và đề xuất 2-3 giải pháp cụ thể (120 - 150 từ)]\n\nI look forward to hearing from you soon.\n\nYours sincerely,\n[Tên của bạn]"
                          : "Hi [Tên bạn],\n\nDid you see the recent announcement about our club? I feel really...\n\n[Viết về cảm xúc và gợi ý câu lạc bộ nên làm gì (~50 từ)]\n\nTalk to you soon,\n[Tên của bạn]"
                      }
                      className="w-full p-4 rounded-xl border border-input bg-background text-foreground text-sm md:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans resize-y leading-relaxed transition-all shadow-inner"
                    />

                    {/* Thống kê số từ & độ tiến độ */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-2">
                        <div className="w-24 sm:w-36 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              words >= targetMin && words <= targetMax
                                ? "bg-emerald-500"
                                : words > targetMax
                                ? "bg-blue-500"
                                : "bg-primary"
                            }`}
                            style={{
                              width: `${Math.min(100, (words / (isFormal ? 150 : 50)) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono font-medium">
                          {words} / {isFormal ? "150" : "50"} từ
                        </span>
                      </div>

                      <span className="text-[11px] italic">
                        {isFormal ? "Thang điểm chiếm 60% Part 4" : "Thang điểm chiếm 40% Part 4"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* 4. BOTTOM BAR (THEO DESIGN SYSTEM CỦA DỰ ÁN) */}
      <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
        {/* Left: Hiện đáp án & Báo lỗi */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSampleAnswersModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện đáp án</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowReportModal(true);
              setReportSent(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>Báo lỗi</span>
          </button>
        </div>

        {/* Center: Quick Part Pills & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
              {parts.map((p, idx) => {
                const isCurrent = currentPartIdx === idx;
                const isAnswered = p.questions.some((_, qIdx) => {
                  const val = answers[`${idx}_${qIdx}`];
                  return val && val.trim().length > 0;
                });

                return (
                  <button
                    key={p.partNumber}
                    id={`writing-part-pill-${idx}`}
                    type="button"
                    onClick={() => handleSelectPart(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-300 ease-out active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                      isCurrent
                        ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                        : isAnswered
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                        : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                    }`}
                    title={p.partSubtitle}
                  >
                    {isAnswered && !isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                    <span>Part {p.partNumber}</span>
                  </button>
                );
              })}
            </div>

            <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

            <button
              type="button"
              onClick={() => setShowPartsDrawer(true)}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
              title="Danh sách Parts"
              aria-label="Danh sách Parts"
            >
              <Menu className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0 hidden sm:flex"
              title="Cuộn lên đầu trang"
              aria-label="Cuộn lên đầu trang"
            >
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Right: Previous & Next / Submit */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Còn {aiQuota} lượt chấm AI</span>
          </div>

          <button
            type="button"
            disabled={currentPartIdx === 0}
            onClick={() => handleSelectPart(Math.max(0, currentPartIdx - 1))}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
          >
            ← Previous
          </button>

          {currentPartIdx < parts.length - 1 ? (
            <button
              type="button"
              onClick={() => handleSelectPart(Math.min(parts.length - 1, currentPartIdx + 1))}
              className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="tech-btn inline-flex items-center gap-1.5 px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <span>Submit & Chấm AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO */}
      {showSampleAnswersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
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

      {/* MODAL BÁO LỖI */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>Báo lỗi câu hỏi Writing</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {reportSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-foreground">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-[11px] text-muted-foreground">
                  Ban chuyên môn sẽ kiểm tra ngữ cảnh và bài tập viết trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-muted-foreground">Vui lòng chọn loại lỗi bạn gặp phải:</p>
                <div className="space-y-2">
                  {[
                    "Lỗi đề bài hoặc câu hỏi không rõ nghĩa",
                    "Lỗi bài viết mẫu tham khảo",
                    "Lỗi đếm số từ / giao diện gõ chữ",
                    "Khác",
                  ].map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="writingReportType"
                        value={t}
                        checked={reportType === t}
                        onChange={() => setReportType(t)}
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-foreground">{t}</span>
                    </label>
                  ))}
                </div>
                <textarea
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề (tùy chọn)..."
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs resize-none h-20 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportSent(true)}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90"
                  >
                    Gửi báo lỗi
                  </button>
                </div>
              </div>
            )}
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
