"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Send,
  Flag,
  RotateCcw,
  Sparkles,
  BookOpen,
  Trophy,
  Award,
  HelpCircle,
  X,
  RefreshCw,
  Check,
  LogOut,
  Pin,
  Highlighter,
  Trash2,
  Eye,
  Menu,
  Info,
  ArrowUp,
  Languages,
} from "lucide-react";
import { ReadingSentenceOrder } from "@/components/reading-components";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";

import {
  type Part1Gap,
  type Part2Story,
  type Part3Review,
  type Part3Question,
  type Part4Paragraph,
  type ReadingExamData,
  DEFAULT_READING_TEST,
} from "@/data/reading-benchmark";

export default function ReadingExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Reading...</p>
          </div>
        </div>
      }
    >
      <ReadingExamRunner />
    </Suspense>
  );
}

function ReadingExamRunner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const examId = (params.id as string) || "reading-01";
  const partParam = searchParams.get("part"); // "1" | "2" | "4" | "5" | null
  const modeParam = searchParams.get("mode"); // "review" | null
  const submissionIdParam = searchParams.get("submissionId");

  const [isReviewMode, setIsReviewMode] = useState(modeParam === "review");

  const { isAuthenticated, user } = useAuth();

  // Active Stage: 0 (Part 1), 1 (Part 2 - Story 1), 2 (Part 2 - Story 2), 3 (Part 4 - Opinions), 4 (Part 5 - Long Reading)
  const [activeStage, setActiveStage] = useState(0);

  // Exam Data
  const [examData, setExamData] = useState<ReadingExamData>(DEFAULT_READING_TEST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time & Submission State
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);

  // Answers State
  const [p1Answers, setP1Answers] = useState<Record<string, string>>({});
  const [p2Orders, setP2Orders] = useState<Record<string, string[]>>({});
  const [p3Answers, setP3Answers] = useState<Record<string, string>>({});
  const [p4Answers, setP4Answers] = useState<Record<string, string>>({});

  // Flagged questions
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});

  // Result state
  const [resultScore, setResultScore] = useState<number>(0);
  const [cefrBand, setCefrBand] = useState<string>("B1");
  const [partScores, setPartScores] = useState<
    { name: string; score: number; maxScore: number; correct: number; total: number }[]
  >([]);

  // Bộ quản lý Highlight cho bài đọc
  const [highlights, setHighlights] = useState<
    Record<string, Array<{ text: string; color: "yellow" | "green" }>>
  >({});
  const [selectionMenu, setSelectionMenu] = useState<{
    targetId: string;
    selectedText: string;
    x: number;
    y: number;
  } | null>(null);
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);
  const [translateText, setTranslateText] = useState("");

  const handleOpenTranslate = (customText?: string) => {
    if (typeof window !== "undefined") {
      const selected = window.getSelection()?.toString().trim();
      setTranslateText(customText || selected || "");
    }
    setIsTranslateOpen(true);
  };

  const handleTextSelection = (targetId: string) => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) {
      setSelectionMenu(null);
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 2) {
      setSelectionMenu(null);
      return;
    }

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectionMenu({
        targetId,
        selectedText: text,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 44),
      });
    } catch {
      setSelectionMenu(null);
    }
  };

  const addHighlight = (color: "yellow" | "green") => {
    if (!selectionMenu) return;
    const { targetId, selectedText } = selectionMenu;
    setHighlights((prev) => {
      const current = prev[targetId] || [];
      if (current.some((h) => h.text === selectedText && h.color === color)) {
        return prev;
      }
      return {
        ...prev,
        [targetId]: [...current, { text: selectedText, color }],
      };
    });
    setSelectionMenu(null);
    if (typeof window !== "undefined") {
      window.getSelection()?.removeAllRanges();
    }
  };

  const clearHighlightsForStage = (targetIds: string[]) => {
    setHighlights((prev) => {
      const copy = { ...prev };
      targetIds.forEach((id) => delete copy[id]);
      return copy;
    });
  };

  const renderHighlightedContent = (rawText: string, targetId: string) => {
    const list = highlights[targetId];
    if (!list || list.length === 0) return rawText;

    const sorted = [...list].sort((a, b) => b.text.length - a.text.length);
    const escaped = sorted.map((h) => h.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    const regex = new RegExp(`(${escaped.join("|")})`, "gi");

    const parts = rawText.split(regex);
    return parts.map((part, i) => {
      const match = sorted.find((h) => h.text.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <mark
            key={i}
            className={`px-0.5 rounded cursor-pointer transition-colors ${
              match.color === "yellow"
                ? "bg-amber-300/40 text-amber-950 dark:text-amber-200 border-b border-amber-400"
                : "bg-emerald-300/40 text-emerald-950 dark:text-emerald-200 border-b border-emerald-400"
            }`}
            title="Đoạn văn đã được đánh dấu"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  };

  // 1. Initial Load: Fetch questions from API or use Benchmark
  useEffect(() => {
    async function loadReadingExam() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.exams.getQuestions(examId);
        if (res.success && res.data) {
          const apiData = res.data;
          const parsed = parseApiToReadingData(apiData);
          setExamData(parsed);
          setTimeLeft((apiData.duration_minutes || 35) * 60);

          // Initialize Part 2 sentences default order (empty slots, ready for drag & drop)
          const initialP2Orders: Record<string, string[]> = {};
          parsed.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = [];
          });
          setP2Orders(initialP2Orders);

          // Nếu có submissionId & mode=review, tải bài nộp cũ để review
          if (submissionIdParam) {
            try {
              const subRes = await api.submissions.getResult(submissionIdParam);
              if (subRes.success && subRes.data) {
                const sub = subRes.data;
                setSubmissionId(submissionIdParam);
                if (sub.total_score != null) setResultScore(Math.round(sub.total_score * 10) / 10);
                if (sub.cefr_level) setCefrBand(sub.cefr_level);

                const loadedP1: Record<string, string> = {};
                const loadedP2: Record<string, string[]> = {};
                const loadedP3: Record<string, string> = {};
                const loadedP4: Record<string, string> = {};

                (sub.answers || []).forEach((ans: any) => {
                  const qId = String(ans.question_id || ans.questionId);
                  const opt = ans.selected_option || ans.selectedOption || ans.text_answer || ans.textAnswer || "";
                  if (parsed.part1.gaps.some((g) => g.id === qId)) {
                    loadedP1[qId] = opt;
                  } else if (parsed.part2.stories.some((s) => s.id === qId)) {
                    try {
                      loadedP2[qId] = JSON.parse(opt);
                    } catch {
                      loadedP2[qId] = [];
                    }
                  } else if (parsed.part3.questions.some((q) => q.id === qId)) {
                    loadedP3[qId] = opt;
                  } else if (parsed.part4.paragraphs.some((p) => p.id === qId)) {
                    loadedP4[qId] = opt;
                  }
                });

                setP1Answers(loadedP1);
                if (Object.keys(loadedP2).length > 0) {
                  setP2Orders((prev) => ({ ...prev, ...loadedP2 }));
                }
                setP3Answers(loadedP3);
                setP4Answers(loadedP4);

                // Tính toán điểm chi tiết từng phần từ bài nộp
                const calculatedPartScores: { name: string; score: number; maxScore: number; correct: number; total: number }[] = [];
                const activePartsCount =
                  (parsed.part1.gaps.length > 0 ? 1 : 0) +
                  (parsed.part2.stories.length > 0 ? 1 : 0) +
                  (parsed.part3.questions.length > 0 ? 1 : 0) +
                  (parsed.part4.paragraphs.length > 0 ? 1 : 0);

                if (parsed.part1.gaps.length > 0) {
                  let p1Correct = 0;
                  parsed.part1.gaps.forEach((g) => {
                    if (loadedP1[g.id] && loadedP1[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
                      p1Correct++;
                    }
                  });
                  const p1Max = activePartsCount === 1 ? 50 : 7;
                  const p1Score = (p1Correct / parsed.part1.gaps.length) * p1Max;
                  calculatedPartScores.push({
                    name: "Part 1 – Sentence comprehension",
                    score: Math.round(p1Score * 10) / 10,
                    maxScore: p1Max,
                    correct: p1Correct,
                    total: parsed.part1.gaps.length,
                  });
                }
                setPartScores(calculatedPartScores);

                if (modeParam === "review") {
                  setIsReviewMode(true);
                  setIsSubmitted(false);
                }
              }
            } catch (err) {
              console.warn("Could not load submission for review:", err);
            }
          }
        } else {
          // Xử lý khi yêu cầu quyền VIP / PRO
          const msg = res.message || "";
          if (msg.includes("VIP") || msg.includes("PRO") || res.error?.code === "FORBIDDEN") {
            setError(msg || "Đề thi PRO yêu cầu đăng nhập tài khoản VIP để truy cập");
            return;
          }
          // Dùng benchmark mặc định nếu không tìm thấy đề
          setExamData(DEFAULT_READING_TEST);
          const initialP2Orders: Record<string, string[]> = {};
          DEFAULT_READING_TEST.part2.stories.forEach((st) => {
            initialP2Orders[st.id] = [];
          });
          setP2Orders(initialP2Orders);
        }
      } catch (err: any) {
        if (err?.status === 403 || err?.message?.includes("VIP") || err?.message?.includes("PRO")) {
          setError(err?.message || "Đề thi PRO yêu cầu đăng nhập tài khoản VIP để truy cập");
          return;
        }
        console.warn("Using offline benchmark reading data:", err);
        setExamData(DEFAULT_READING_TEST);
        const initialP2Orders: Record<string, string[]> = {};
        DEFAULT_READING_TEST.part2.stories.forEach((st) => {
          initialP2Orders[st.id] = [];
        });
        setP2Orders(initialP2Orders);
      } finally {
        setLoading(false);
      }
    }

    loadReadingExam();
  }, [examId, submissionIdParam, modeParam]);

  // Dynamic Stage list for navigation based on actually loaded questions
  const stages = useMemo(() => {
    const list: Array<{
      stageKey: "p1" | "p2-1" | "p2-2" | "p3" | "p4";
      title: string;
      label: string;
      count: number;
    }> = [];

    if (examData.part1.gaps.length > 0) {
      list.push({
        stageKey: "p1",
        title: "Part 1",
        label: "Part 1 – Gap Fill",
        count: examData.part1.gaps.length,
      });
    }
    if (examData.part2.stories.length > 0) {
      list.push({
        stageKey: "p2-1",
        title: "Part 2 (Bài 1)",
        label: "Part 2 – " + (examData.part2.stories[0]?.title || "Story 1"),
        count: examData.part2.stories[0]?.sentences.length || 4,
      });
      if (examData.part2.stories.length > 1) {
        list.push({
          stageKey: "p2-2",
          title: "Part 2 (Bài 2)",
          label: "Part 2 – " + (examData.part2.stories[1]?.title || "Story 2"),
          count: examData.part2.stories[1]?.sentences.length || 4,
        });
      }
    }
    const isFullExam = examData.part1.gaps.length > 0 && examData.part4.paragraphs.length > 0;
    if (examData.part3.questions.length > 0) {
      list.push({
        stageKey: "p3",
        title: isFullExam ? "Part 3" : (examData.part3.title?.includes("Part 3") ? "Part 3" : "Part 4"),
        label: (isFullExam ? "Part 3 – " : "Part 4 – ") + (examData.part3.title?.replace(/^Part\s*\d+\s*–?\s*/i, "") || "Opinion Matching"),
        count: examData.part3.questions.length,
      });
    }
    if (examData.part4.paragraphs.length > 0) {
      list.push({
        stageKey: "p4",
        title: isFullExam ? "Part 4" : (examData.part4.title?.includes("Part 4") ? "Part 4" : "Part 5"),
        label: (isFullExam ? "Part 4 – " : "Part 5 – ") + (examData.part4.title?.replace(/^Part\s*\d+\s*–?\s*/i, "") || "Long Reading"),
        count: examData.part4.paragraphs.length,
      });
    }

    if (list.length === 0) {
      list.push({
        stageKey: "p1",
        title: "Part 1",
        label: "Part 1 – Gap Fill",
        count: 0,
      });
    }
    return list;
  }, [examData]);

  const hasHandledPartParam = useRef<string | null>(null);

  // Adjust activeStage if URL contains ?part= (chỉ chạy 1 lần khi khởi tạo)
  useEffect(() => {
    if (stages.length === 0) return;
    if (stages.length === 1) {
      setActiveStage(0);
      return;
    }
    if (!partParam) return;
    const p = partParam.toLowerCase();
    if (hasHandledPartParam.current === p) return;

    const targetKey =
      p === "1" || p === "p1" || p === "part1"
        ? "p1"
        : p === "2" || p === "p2" || p === "part2"
        ? "p2-1"
        : p === "3" || p === "p3" || p === "part3"
        ? (stages.some((s) => s.stageKey === "p2-2") ? "p2-2" : "p3")
        : p === "4" || p === "p4" || p === "part4"
        ? (stages.some((s) => s.stageKey === "p4") ? "p4" : "p3")
        : p === "5" || p === "p5" || p === "part5"
        ? "p4"
        : null;
    if (targetKey) {
      const idx = stages.findIndex((s) => s.stageKey === targetKey);
      if (idx !== -1) {
        setActiveStage(idx);
        hasHandledPartParam.current = p;
      }
    }
  }, [partParam, stages]);

  // Tự động cuộn pill phần thi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`reading-stage-pill-${activeStage}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeStage]);

  // 2. Countdown Timer
  useEffect(() => {
    if (isSubmitted || loading || isReviewMode) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, loading, isReviewMode]);

  // 3. Khôi phục bản nháp LocalStorage ngay khi vào phòng thi Reading (Zero-latency recovery)
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted || isReviewMode || modeParam === "review") return;
    try {
      const raw = localStorage.getItem(`aptis_draft_reading_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.p1Answers && Object.keys(draft.p1Answers).length > 0) {
          setP1Answers((prev) => ({ ...draft.p1Answers, ...prev }));
        }
        if (draft.p2Orders && Object.keys(draft.p2Orders).length > 0) {
          setP2Orders((prev) => ({ ...draft.p2Orders, ...prev }));
        }
        if (draft.p3Answers && Object.keys(draft.p3Answers).length > 0) {
          setP3Answers((prev) => ({ ...draft.p3Answers, ...prev }));
        }
        if (draft.p4Answers && Object.keys(draft.p4Answers).length > 0) {
          setP4Answers((prev) => ({ ...draft.p4Answers, ...prev }));
        }
      }
    } catch {}
  }, [examId, isSubmitted, isReviewMode, modeParam]);

  // 4. Tự động ghi bản nháp vào LocalStorage khi câu trả lời thay đổi
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted || isReviewMode || modeParam === "review") return;
    const hasAnswers =
      Object.keys(p1Answers).length > 0 ||
      Object.keys(p2Orders).length > 0 ||
      Object.keys(p3Answers).length > 0 ||
      Object.keys(p4Answers).length > 0;

    if (hasAnswers) {
      try {
        localStorage.setItem(
          `aptis_draft_reading_${examId}`,
          JSON.stringify({
            p1Answers,
            p2Orders,
            p3Answers,
            p4Answers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [p1Answers, p2Orders, p3Answers, p4Answers, examId, isSubmitted, isReviewMode, modeParam]);

  // 5. Cảnh báo beforeunload chống vô tình F5/thoát trang khi đang thi
  useEffect(() => {
    if (isSubmitted || isReviewMode) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Reading. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted, isReviewMode]);

  // 6. Khởi tạo / Khôi phục Database Submission từ máy chủ
  useEffect(() => {
    async function initSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || submissionId || isReviewMode || modeParam === "review" || submissionIdParam) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          const subData = res.data;
          setSubmissionId(subData.submissionId || subData.id);
          if (subData.serverTimeRemaining !== undefined) {
            setTimeLeft(subData.serverTimeRemaining);
          }

          if (subData.isResumed) {
            if (subData.savedAnswers && typeof subData.savedAnswers === "object") {
              const p1: Record<string, string> = {};
              const p2: Record<string, string[]> = {};
              const p3: Record<string, string> = {};
              const p4: Record<string, string> = {};

              Object.entries(subData.savedAnswers).forEach(([qId, ans]: [string, any]) => {
                if (ans.selectedOption) {
                  try {
                    const parsed = JSON.parse(ans.selectedOption);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      p2[qId] = parsed;
                      return;
                    }
                  } catch {}
                  p1[qId] = ans.selectedOption;
                  p3[qId] = ans.selectedOption;
                  p4[qId] = ans.selectedOption;
                }
              });

              const totalRecovered =
                Object.keys(p1).length +
                Object.keys(p2).length +
                Object.keys(p3).length +
                Object.keys(p4).length;

              if (totalRecovered > 0) {
                setP1Answers((prev) => ({ ...p1, ...prev }));
                setP2Orders((prev) => ({ ...p2, ...prev }));
                setP3Answers((prev) => ({ ...p3, ...prev }));
                setP4Answers((prev) => ({ ...p4, ...prev }));

                setIsResumedSession(true);
                setSyncStatus("resumed");
                setTimeout(() => setSyncStatus("idle"), 4000);
              }
            }
          }
        }
      } catch (e) {
        console.warn("Offline reading session:", e);
      }
    }
    initSubmission();
  }, [examId]);

  // Helper format time
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Reorder sentences helper in Part 2
  const handleMoveSentence = (storyId: string, index: number, direction: "up" | "down") => {
    if (isSubmitted) return;
    const currentOrder = [...(p2Orders[storyId] || [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentOrder.length) return;

    const temp = currentOrder[index];
    currentOrder[index] = currentOrder[targetIdx];
    currentOrder[targetIdx] = temp;

    setP2Orders((prev) => ({
      ...prev,
      [storyId]: currentOrder,
    }));
  };

  const handleResetStoryOrder = (storyId: string) => {
    if (isSubmitted) return;
    const story = examData.part2.stories.find((s) => s.id === storyId);
    if (!story) return;
    setP2Orders((prev) => ({
      ...prev,
      [storyId]: story.sentences.map((s) => s.id),
    }));
  };

  // Total questions count calculation
  const totalQuestionsCount =
    examData.part1.gaps.length +
    examData.part2.stories.length +
    examData.part3.questions.length +
    examData.part4.paragraphs.length;

  const totalAnsweredCount =
    Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length +
    Object.keys(p2Orders).length +
    Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length +
    Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length;

  // Grade & Submit calculation
  const handleSubmitExam = useCallback(async () => {
    setIsSubmitModalOpen(false);
    if (typeof window !== "undefined" && examId) {
      try {
        localStorage.removeItem(`aptis_draft_reading_${examId}`);
      } catch {}
    }

    const activePartsCount =
      (examData.part1.gaps.length > 0 ? 1 : 0) +
      (examData.part2.stories.length > 0 ? 1 : 0) +
      (examData.part3.questions.length > 0 ? 1 : 0) +
      (examData.part4.paragraphs.length > 0 ? 1 : 0);

    const calculatedPartScores: { name: string; score: number; maxScore: number; correct: number; total: number }[] = [];

    // 1. Part 1 Score
    let p1Correct = 0;
    if (examData.part1.gaps.length > 0) {
      examData.part1.gaps.forEach((g) => {
        if (p1Answers[g.id] && p1Answers[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
          p1Correct++;
        }
      });
      const p1Max = activePartsCount === 1 ? 50 : 7;
      const p1Score = (p1Correct / examData.part1.gaps.length) * p1Max;
      calculatedPartScores.push({
        name: "Part 1 – Sentence comprehension",
        score: Math.round(p1Score * 10) / 10,
        maxScore: p1Max,
        correct: p1Correct,
        total: examData.part1.gaps.length,
      });
    }

    // 2. Part 2 Score
    let p2CorrectMatches = 0;
    let p2TotalMatches = 0;
    if (examData.part2.stories.length > 0) {
      examData.part2.stories.forEach((st) => {
        const userOrder = p2Orders[st.id] || [];
        const corOrder = st.correctOrder || [];
        p2TotalMatches += corOrder.length;
        userOrder.forEach((item, idx) => {
          if (corOrder[idx] === item) p2CorrectMatches++;
        });
      });
      const p2Max = activePartsCount === 1 ? 50 : 17;
      const p2Score = p2TotalMatches > 0 ? (p2CorrectMatches / p2TotalMatches) * p2Max : 0;
      calculatedPartScores.push({
        name: "Part 2 – Text cohesion",
        score: Math.round(p2Score * 10) / 10,
        maxScore: p2Max,
        correct: p2CorrectMatches,
        total: p2TotalMatches,
      });
    }

    // 3. Part 3 Score
    let p3Correct = 0;
    if (examData.part3.questions.length > 0) {
      examData.part3.questions.forEach((q) => {
        if (p3Answers[q.id] && p3Answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
          p3Correct++;
        }
      });
      const p3Max = activePartsCount === 1 ? 50 : 13;
      const p3Score = (p3Correct / examData.part3.questions.length) * p3Max;
      calculatedPartScores.push({
        name: "Part 3 – Opinion matching",
        score: Math.round(p3Score * 10) / 10,
        maxScore: p3Max,
        correct: p3Correct,
        total: examData.part3.questions.length,
      });
    }

    // 4. Part 4 Score
    let p4Correct = 0;
    if (examData.part4.paragraphs.length > 0) {
      examData.part4.paragraphs.forEach((p) => {
        if (p4Answers[p.id] && p4Answers[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
          p4Correct++;
        }
      });
      const p4Max = activePartsCount === 1 ? 50 : 13;
      const p4Score = (p4Correct / examData.part4.paragraphs.length) * p4Max;
      calculatedPartScores.push({
        name: "Part 4 – Long reading",
        score: Math.round(p4Score * 10) / 10,
        maxScore: p4Max,
        correct: p4Correct,
        total: examData.part4.paragraphs.length,
      });
    }

    const totalCalculated = Math.min(50, Math.round(calculatedPartScores.reduce((sum, item) => sum + item.score, 0)));

    let cefr = "A1";
    if (totalCalculated >= 46) cefr = "C";
    else if (totalCalculated >= 38) cefr = "B2";
    else if (totalCalculated >= 26) cefr = "B1";
    else if (totalCalculated >= 16) cefr = "A2";
    else if (totalCalculated > 5) cefr = "A1";
    else cefr = "A0";

    setResultScore(totalCalculated);
    setCefrBand(cefr);
    setPartScores(calculatedPartScores);

    // Save to backend submission
    if (submissionId) {
      try {
        const answersPayload: any[] = [];
        // Part 1
        examData.part1.gaps.forEach((g) => {
          if (g.id && p1Answers[g.id]) {
            answersPayload.push({
              questionId: String(g.id),
              selectedOption: p1Answers[g.id],
            });
          }
        });
        // Part 2
        examData.part2.stories.forEach((st) => {
          if (st.id && p2Orders[st.id]) {
            answersPayload.push({
              questionId: String(st.id),
              selectedOption: JSON.stringify(p2Orders[st.id]),
            });
          }
        });
        // Part 3
        examData.part3.questions.forEach((q) => {
          if (q.id && p3Answers[q.id]) {
            answersPayload.push({
              questionId: String(q.id),
              selectedOption: p3Answers[q.id],
            });
          }
        });
        // Part 4
        examData.part4.paragraphs.forEach((p) => {
          if (p.id && p4Answers[p.id]) {
            answersPayload.push({
              questionId: String(p.id),
              selectedOption: p4Answers[p.id],
            });
          }
        });

        if (answersPayload.length > 0) {
          await api.submissions.autosave(submissionId, answersPayload);
        }
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Submit reading error:", err);
      }
    }

    setIsSubmitted(true);
  }, [examData, p1Answers, p2Orders, p3Answers, p4Answers, submissionId]);

  const currentStage = stages[activeStage] || stages[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans">
      {/* 1. TOP HEADER PHÒNG THI CHUẨN */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (isSubmitted) {
                router.push("/reading");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer"
            title="Quay lại danh sách đề"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Reading Practice
            </span>
            <span className="text-sm md:text-base font-bold text-foreground">
              {examData.title}
            </span>
          </div>
        </div>

        {/* Căn giữa: Đồng hồ đếm ngược & Sync status */}
        <div className="flex items-center gap-2.5">
          {isReviewMode ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs">
                <Eye className="w-3.5 h-3.5" />
                <span>Chế độ xem lại bài làm</span>
              </div>
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                title="Bấm để xem lại bảng điểm tổng quan"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Báo cáo điểm</span>
              </button>
            </div>
          ) : (
            <>
              <ExamSyncStatus
                status={syncStatus}
                lastSavedAt={lastSavedAt}
                isResumed={isResumedSession}
              />
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenTranslate()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 text-xs font-bold transition-colors cursor-pointer"
            title="Tra từ điển & dịch câu bằng Google Dịch"
          >
            <Languages className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Google Dịch</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isSubmitted) {
                router.push("/reading");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Thoát về danh sách đề"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Thoát</span>
          </button>
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={totalAnsweredCount}
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 py-6 px-3 md:px-6 pb-28">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Reading...</p>
            </div>
          )}

          {/* Result Card Mode */}
          {!loading && isSubmitted && (
            <div className="max-w-3xl mx-auto space-y-6 animate-in zoom-in-95">
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-md text-center space-y-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>

                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kết Quả Kỹ Năng Reading
                  </span>
                  <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground mt-1">
                    BÁO CÁO ĐIỂM BÀI THI READING
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Thí sinh: {user?.full_name || "Thí sinh Aptis"} · Mã đề: {examId.toUpperCase()}
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-sm mx-auto">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Đánh giá theo khung CEFR
                  </span>
                  <div className="text-5xl font-heading font-black text-primary my-1">{cefrBand}</div>
                  <p className="text-sm font-bold text-foreground">
                    Điểm số: <span className="text-primary">{resultScore}</span> / 50
                  </p>
                </div>

                {/* Part Breakdown Table */}
                <div className="space-y-3 text-left">
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Chi tiết điểm từng phần:
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {partScores.map((ps, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border bg-muted/20 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-foreground">{ps.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Đúng {ps.correct}/{ps.total} mục
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-extrabold text-primary">
                            {ps.score} / {ps.maxScore}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">Điểm</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setIsReviewMode(true);
                      setActiveStage(0);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:bg-brand-brown transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem lại chi tiết bài làm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsSubmitted(false);
                      setIsReviewMode(false);
                      setP1Answers({});
                      setP3Answers({});
                      setP4Answers({});
                      const resetOrders: Record<string, string[]> = {};
                      examData.part2.stories.forEach((st) => {
                        resetOrders[st.id] = st.sentences.map((s) => s.id);
                      });
                      setP2Orders(resetOrders);
                      setTimeLeft(examData.durationMinutes * 60);
                      setActiveStage(0);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề này</span>
                  </button>

                  <Link
                    href="/history"
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Lịch sử làm bài
                  </Link>

                  <Link
                    href="/reading"
                    className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                  >
                    Về danh sách đề Reading
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Error / VIP Access Required State */}
          {!loading && error && (
            <div className="p-8 md:p-12 text-center rounded-2xl border border-border bg-card max-w-xl mx-auto space-y-4 shadow-sm animate-in zoom-in-95">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-lg text-foreground">
                Yêu cầu quyền truy cập VIP
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {error}
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <Link
                  href="/login"
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-sm hover:bg-primary-glow transition-all"
                >
                  Đăng nhập tài khoản
                </Link>
                <Link
                  href="/reading"
                  className="px-5 py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs transition-all"
                >
                  Chọn đề thi khác
                </Link>
              </div>
            </div>
          )}

          {/* Exam Questions Workspace */}
          {!loading && !isSubmitted && !error && (
            <div key={`reading-stage-wrap-${currentStage.stageKey}`} className="part-transition space-y-6">
              {/* Card Context & Header Banner */}
              <div className="bg-card rounded-2xl border border-border p-5 md:p-6 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                      Phần {activeStage + 1} / {stages.length}
                    </span>
                    <h2 className="font-heading font-bold text-base md:text-lg text-foreground">
                      {stages[activeStage]?.label}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setFlagged((prev) => ({
                          ...prev,
                          [activeStage]: !prev[activeStage],
                        }))
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        flagged[activeStage]
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[activeStage] ? "Đã gắn cờ" : "Gắn cờ"}</span>
                    </button>
                  </div>
                </div>

                <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                  {currentStage.stageKey === "p1" && examData.part1.instructions}
                  {currentStage.stageKey === "p2-1" && examData.part2.instructions}
                  {currentStage.stageKey === "p2-2" && examData.part2.instructions}
                  {currentStage.stageKey === "p3" && examData.part3.instructions}
                  {currentStage.stageKey === "p4" && examData.part4.instructions}
                </p>
              </div>

              {/* Main Questions Content Card */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">

                  {/* ============================================================== */}
                  {/* PART 1: GAP FILL (Sentence Comprehension)                       */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p1" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80">
                        <p className="text-xs md:text-sm text-foreground font-semibold flex items-center gap-1.5">
                          <Pin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{examData.part1.instructions}</span>
                        </p>
                      </div>

                      {/* Example Sentence */}
                      {Boolean(examData.part1.exampleText?.word) && (
                        <div className="p-4 rounded-xl border border-border/70 bg-card/60 flex items-center gap-2 flex-wrap text-sm md:text-base">
                          <span>{examData.part1.exampleText.prefix}</span>
                          <span className="px-3 py-1 rounded-md border border-border bg-muted/60 text-muted-foreground font-bold text-xs select-none">
                            {examData.part1.exampleText.word}
                          </span>
                          <span>{examData.part1.exampleText.suffix}</span>
                          <span className="text-[11px] text-muted-foreground italic ml-2">
                            (Câu ví dụ mẫu)
                          </span>
                        </div>
                      )}

                      {/* Gaps List - Tách rời từng câu riêng biệt, không dính liền */}
                      <div className="space-y-4">
                        {examData.part1.gaps.map((gap, gIdx) => {
                          const cleanPrompt = gap.prompt || "";
                          const hasGapMarker = /\[(?:gap|blank|\.\.\.)\]/i.test(cleanPrompt);
                          let beforeGap = cleanPrompt;
                          let afterGap = "";

                          if (hasGapMarker) {
                            const split = cleanPrompt.split(/\[(?:gap|blank|\.\.\.)\]/i);
                            beforeGap = split[0];
                            afterGap = split[1] || "";
                          } else if (gap.correctAnswer && cleanPrompt.toLowerCase().includes(gap.correctAnswer.toLowerCase())) {
                            const regex = new RegExp(`\\b${gap.correctAnswer}\\b`, "i");
                            const split = cleanPrompt.split(regex);
                            beforeGap = split[0];
                            afterGap = split[1] || "";
                          }

                          const userVal = p1Answers[gap.id] || "";
                          const isCorrect = userVal && userVal.toLowerCase() === gap.correctAnswer.toLowerCase();

                          return (
                            <div
                              key={gap.id}
                              className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-wrap items-center gap-3 text-sm md:text-base leading-relaxed shadow-2xs ${
                                isReviewMode
                                  ? isCorrect
                                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                                    : "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
                                  : "border-border bg-card hover:border-primary/50"
                              }`}
                            >
                              <span className="font-extrabold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-lg shrink-0">
                                Câu {gIdx + 1}
                              </span>
                              <span>{beforeGap}</span>
                              <select
                                value={userVal}
                                disabled={isReviewMode}
                                onChange={(e) =>
                                  setP1Answers((prev) => ({
                                    ...prev,
                                    [gap.id]: e.target.value,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-xl border text-sm font-semibold transition-all outline-none shadow-2xs ${
                                  isReviewMode
                                    ? isCorrect
                                      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                                      : "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold"
                                    : userVal
                                    ? "border-primary bg-primary/10 text-primary font-bold cursor-pointer"
                                    : "border-border bg-background text-muted-foreground hover:border-primary/60 cursor-pointer"
                                }`}
                              >
                                <option value="">— Chọn từ khuyết —</option>
                                {gap.options.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <span>{afterGap}</span>

                              {/* Review Mode Answer Feedback */}
                              {isReviewMode && (
                                <div className="w-full flex items-center gap-2 pt-2 border-t border-border/50 text-xs">
                                  {userVal ? (
                                    isCorrect ? (
                                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                                        <Check className="w-3.5 h-3.5" /> Bạn đã chọn đúng
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                                        <X className="w-3.5 h-3.5" /> Bạn chọn: <span className="line-through">{userVal}</span> · Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm underline">{gap.correctAnswer}</strong>
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                                      <AlertCircle className="w-3.5 h-3.5" /> Chưa chọn đáp án · Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm underline">{gap.correctAnswer}</strong>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 1)             */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p2-1" && (() => {
                    const story = examData.part2.stories[0];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || [];

                    return (
                      <ReadingSentenceOrder
                        key={story.id}
                        title={story.title}
                        fixedSentence={story.fixedSentence}
                        sentences={story.sentences}
                        currentOrder={currentOrder}
                        isReviewMode={isReviewMode}
                        correctOrder={story.correctOrder}
                        onChangeOrder={(newOrder) =>
                          setP2Orders((prev) => ({
                            ...prev,
                            [story.id]: newOrder,
                          }))
                        }
                      />
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 2: TEXT COHESION (Sentence Ordering - Story 2)             */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p2-2" && (() => {
                    const story = examData.part2.stories[1];
                    if (!story) return null;
                    const currentOrder = p2Orders[story.id] || [];

                    return (
                      <ReadingSentenceOrder
                        key={story.id}
                        title={story.title}
                        fixedSentence={story.fixedSentence}
                        sentences={story.sentences}
                        currentOrder={currentOrder}
                        isReviewMode={isReviewMode}
                        correctOrder={story.correctOrder}
                        onChangeOrder={(newOrder) =>
                          setP2Orders((prev) => ({
                            ...prev,
                            [story.id]: newOrder,
                          }))
                        }
                      />
                    );
                  })()}

                  {/* ============================================================== */}
                  {/* PART 3: OPINION MATCHING (4 Reviews, 7 Questions)              */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p3" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-primary block">
                            {examData.part3.title}
                          </span>
                          <p className="text-xs text-foreground">
                            {examData.part3.instructions}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => clearHighlightsForStage(examData.part3.reviews.map((r) => r.person))}
                            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                            <span>Xóa highlight</span>
                          </button>
                        </div>
                      </div>

                      {/* 4 Review Cards in 2 columns (or 1 column if single passage) */}
                      <div className={`grid gap-4 ${examData.part3.reviews.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
                        {examData.part3.reviews.map((rev) => (
                          <div
                            key={rev.person}
                            className="p-4 rounded-xl border border-border bg-card space-y-2 shadow-2xs select-text"
                            onMouseUp={() => handleTextSelection(rev.person)}
                            onTouchEnd={() => handleTextSelection(rev.person)}
                          >
                            <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs inline-block">
                              {rev.name || rev.person}
                            </span>
                            <p className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans">
                              {renderHighlightedContent(rev.review, rev.person)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* 7 Questions */}
                      <div className="space-y-4 pt-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Chọn người có ý kiến tương ứng:
                        </h4>
                        {examData.part3.questions.map((q, qIdx) => {
                          const userVal = p3Answers[q.id];
                          const isCorrect = userVal && userVal.toLowerCase() === q.correctAnswer.toLowerCase();

                          return (
                            <div
                              key={q.id}
                              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
                                isReviewMode
                                  ? isCorrect
                                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20"
                                    : "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <div>
                                  <p className="text-xs md:text-sm font-semibold text-foreground">
                                    {q.prompt}
                                  </p>
                                  {isReviewMode && (
                                    <div className="pt-1.5 text-xs">
                                      {userVal ? (
                                        isCorrect ? (
                                          <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                                            <Check className="w-3.5 h-3.5" /> Bạn chọn đúng ({q.correctAnswer})
                                          </span>
                                        ) : (
                                          <span className="text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1.5">
                                            <X className="w-3.5 h-3.5" /> Bạn chọn: {userVal} · Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400 underline">{q.correctAnswer}</strong>
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                                          Chưa trả lời · Đáp án đúng: <strong className="text-emerald-600 dark:text-emerald-400 underline">{q.correctAnswer}</strong>
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* 4 Pill Options */}
                              <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                                {["Person A", "Person B", "Person C", "Person D"].map((opt) => {
                                  const isSelected = userVal === opt;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      disabled={isReviewMode}
                                      onClick={() =>
                                        setP3Answers((prev) => ({
                                          ...prev,
                                          [q.id]: opt,
                                        }))
                                      }
                                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                        isSelected
                                          ? isReviewMode
                                            ? isCorrect
                                              ? "bg-emerald-600 text-white shadow-xs"
                                              : "bg-rose-600 text-white shadow-xs"
                                            : "bg-primary text-primary-foreground shadow-xs scale-105"
                                          : "border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground"
                                      }`}
                                    >
                                      {opt.replace("Person ", "")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* PART 4: LONG READING (Paragraphs & Headings Dropdowns)          */}
                  {/* ============================================================== */}
                  {currentStage.stageKey === "p4" && (
                    <div className="space-y-6">
                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>{examData.part4.title}</span>
                          </span>
                          <p className="text-xs text-foreground">
                            {examData.part4.instructions}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                            <span className="hidden sm:inline">Bôi đen chữ để highlight</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => clearHighlightsForStage(examData.part4.paragraphs.map((p) => p.id))}
                            className="px-2 py-1 rounded-lg border border-border hover:bg-muted text-[11px] font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                            <span>Xóa highlight</span>
                          </button>
                        </div>
                      </div>

                      {/* Reference Headings List */}
                      <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Danh sách tiêu đề Heading có sẵn:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-foreground/80">
                          {examData.part4.allHeadings.map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="font-bold text-primary shrink-0">•</span>
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 7 Paragraphs with Selects */}
                      <div className="space-y-5">
                        {examData.part4.paragraphs.map((p) => {
                          const userVal = p4Answers[p.id] || "";
                          const isCorrect = userVal && userVal.toLowerCase() === p.correctHeading.toLowerCase();

                          return (
                            <div
                              key={p.id}
                              className={`p-5 rounded-xl border space-y-3 shadow-2xs ${
                                isReviewMode
                                  ? isCorrect
                                    ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20"
                                    : "border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/20"
                                  : "border-border bg-card"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                                <span className="font-bold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-md inline-block">
                                  Đoạn văn {p.paragraphNumber}
                                </span>

                                <select
                                  value={userVal}
                                  disabled={isReviewMode}
                                  onChange={(e) =>
                                    setP4Answers((prev) => ({
                                      ...prev,
                                      [p.id]: e.target.value,
                                    }))
                                  }
                                  className={`w-full sm:max-w-md px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all outline-none truncate ${
                                    isReviewMode
                                      ? isCorrect
                                        ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold"
                                        : "border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 font-bold"
                                      : userVal
                                      ? "border-primary bg-primary/10 text-primary cursor-pointer"
                                      : "border-border bg-card text-muted-foreground hover:border-primary/60 cursor-pointer"
                                  }`}
                                >
                                  <option value="">— Chọn tiêu đề phù hợp —</option>
                                  {examData.part4.allHeadings.map((h, hIdx) => (
                                    <option key={hIdx} value={h}>
                                      {h}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {isReviewMode && (
                                <div className="text-xs font-semibold pb-1">
                                  {userVal ? (
                                    isCorrect ? (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Đúng tiêu đề: {p.correctHeading}
                                      </span>
                                    ) : (
                                      <span className="text-rose-600 dark:text-rose-400 font-bold inline-flex items-center gap-1.5">
                                        <X className="w-3.5 h-3.5" /> Bạn chọn: {userVal} · Tiêu đề đúng: <strong className="text-emerald-600 dark:text-emerald-400 underline">{p.correctHeading}</strong>
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-amber-600 dark:text-amber-400 font-bold inline-flex items-center gap-1.5">
                                      Chưa chọn tiêu đề · Tiêu đề đúng: <strong className="text-emerald-600 dark:text-emerald-400 underline">{p.correctHeading}</strong>
                                    </span>
                                  )}
                                </div>
                              )}

                              <p
                                className="text-xs md:text-sm text-foreground/90 leading-relaxed font-sans select-text"
                                onMouseUp={() => handleTextSelection(p.id)}
                                onTouchEnd={() => handleTextSelection(p.id)}
                              >
                                {renderHighlightedContent(p.text, p.id)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

              </div>
            </div>
          )}

          {/* Submit Confirmation Modal */}
          {isSubmitModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
              <div className="bg-card rounded-2xl border border-border p-6 max-w-sm w-full space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-foreground">
                    Xác nhận nộp bài thi
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bạn đã hoàn thành{" "}
                  <span className="font-bold text-foreground">
                    {totalAnsweredCount}/{totalQuestionsCount}
                  </span>{" "}
                  câu hỏi. Bạn có chắc chắn muốn kết thúc bài thi Reading và xem điểm ngay bây giờ?
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Làm tiếp
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitExam}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary-glow shadow-sm"
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Floating Highlight Menu khi bôi đen chữ trên bài đọc */}
          {selectionMenu && (
            <div
              className="fixed z-50 -translate-x-1/2 flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 select-none"
              style={{ top: selectionMenu.y, left: selectionMenu.x }}
            >
              <button
                type="button"
                onClick={() => addHighlight("yellow")}
                className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 text-amber-900 dark:text-amber-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đánh dấu đoạn văn dẫn chứng (Màu vàng)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                <span>Dẫn chứng</span>
              </button>
              <button
                type="button"
                onClick={() => addHighlight("green")}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Đánh dấu từ khóa đối chiếu (Màu xanh)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                <span>Từ khóa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = selectionMenu.selectedText;
                  setSelectionMenu(null);
                  handleOpenTranslate(text);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-900 dark:text-blue-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Dịch câu này bằng Google Dịch"
              >
                <Languages className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Dịch nhanh</span>
              </button>
              <div className="w-px h-4 bg-border/60 mx-0.5" />
              <button
                type="button"
                onClick={() => setSelectionMenu(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Đóng menu"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. STICKY BOTTOM RUNNER BAR CHUẨN */}
      {!loading && !isSubmitted && (
        <footer className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border px-4 md:px-8 py-3 flex items-center justify-between z-40 shadow-lg">
          {/* Left: Hiện đáp án & Báo lỗi */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSampleAnswers(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hiện đáp án</span>
            </button>

            <button
              type="button"
              onClick={() => alert("Đã gửi phản hồi báo lỗi đề thi Reading.")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:bg-muted text-xs font-medium transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Báo lỗi</span>
            </button>
          </div>

          {/* Center: Quick Stage Pills & Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[42vw] sm:max-w-[44vw] md:max-w-[50vw] lg:max-w-[56vw] py-0.5 px-0.5">
                {stages.map((stg, idx) => {
                  const isCurrent = activeStage === idx;
                  let isComplete = false;
                  if (stg.stageKey === "p1") {
                    isComplete =
                      Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length ===
                      examData.part1.gaps.length;
                  } else if (stg.stageKey === "p2-1") {
                    const stId = examData.part2.stories[0]?.id;
                    isComplete = !!(stId && p2Orders[stId] && p2Orders[stId].filter(Boolean).length === 4);
                  } else if (stg.stageKey === "p2-2") {
                    const stId = examData.part2.stories[1]?.id;
                    isComplete = !!(stId && p2Orders[stId] && p2Orders[stId].filter(Boolean).length === 4);
                  } else if (stg.stageKey === "p3") {
                    isComplete =
                      Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length ===
                      examData.part3.questions.length;
                  } else if (stg.stageKey === "p4") {
                    isComplete =
                      Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length ===
                      examData.part4.paragraphs.length;
                  }

                  return (
                    <button
                      key={stg.stageKey}
                      id={`reading-stage-pill-${idx}`}
                      type="button"
                      onClick={() => setActiveStage(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap select-none ${
                        isCurrent
                          ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                          : isComplete
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                          : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                      }`}
                      title={stg.label}
                    >
                      {isComplete && !isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      )}
                      <span>{stg.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

              <button
                type="button"
                onClick={() => setShowDrawer(true)}
                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                title="Danh sách tất cả phần thi Reading"
                aria-label="Danh sách tất cả phần thi Reading"
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
            <button
              type="button"
              disabled={activeStage === 0}
              onClick={() => setActiveStage((p) => Math.max(0, p - 1))}
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
            >
              ← Previous
            </button>

            {activeStage < stages.length - 1 ? (
              <button
                type="button"
                onClick={() => setActiveStage((p) => Math.min(stages.length - 1, p + 1))}
                className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : isReviewMode ? (
              <button
                type="button"
                onClick={() => setIsSubmitted(true)}
                className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Xem báo cáo điểm</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(true)}
                className="tech-btn px-6 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Nộp bài
              </button>
            )}
          </div>
        </footer>
      )}

      {/* DRAWER DANH SÁCH BÀI THI READING */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-5 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách bài thi Reading ({stages.length} phần)
              </h3>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {stages.map((stg, stgIdx) => {
                const isActive = activeStage === stgIdx;
                const isFlg = flagged[stgIdx];

                let isComplete = false;
                let progressText = "";
                if (stg.stageKey === "p1") {
                  const count = Object.keys(p1Answers).filter((k) => !!p1Answers[k]).length;
                  isComplete = count === examData.part1.gaps.length;
                  progressText = `${count}/${examData.part1.gaps.length}`;
                } else if (stg.stageKey === "p2-1") {
                  const stId = examData.part2.stories[0]?.id;
                  const placed = (stId && p2Orders[stId]?.filter(Boolean).length) || 0;
                  isComplete = placed === 4;
                  progressText = placed === 4 ? "Đã xếp đủ 4 câu" : `${placed}/4 câu`;
                } else if (stg.stageKey === "p2-2") {
                  const stId = examData.part2.stories[1]?.id;
                  const placed = (stId && p2Orders[stId]?.filter(Boolean).length) || 0;
                  isComplete = placed === 4;
                  progressText = placed === 4 ? "Đã xếp đủ 4 câu" : `${placed}/4 câu`;
                } else if (stg.stageKey === "p3") {
                  const count = Object.keys(p3Answers).filter((k) => !!p3Answers[k]).length;
                  isComplete = count === examData.part3.questions.length;
                  progressText = `${count}/${examData.part3.questions.length}`;
                } else if (stg.stageKey === "p4") {
                  const count = Object.keys(p4Answers).filter((k) => !!p4Answers[k]).length;
                  isComplete = count === examData.part4.paragraphs.length;
                  progressText = `${count}/${examData.part4.paragraphs.length}`;
                }

                return (
                  <button
                    key={stg.stageKey}
                    type="button"
                    onClick={() => {
                      setActiveStage(stgIdx);
                      setShowDrawer(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary"
                        : isComplete
                        ? "border-border/60 bg-muted/20 text-foreground hover:bg-muted/40"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] shrink-0">
                        {stgIdx + 1}
                      </span>
                      <span className="truncate">{stg.label}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-normal text-muted-foreground font-mono">
                        {progressText}
                      </span>
                      {isFlg && <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowDrawer(false);
                  setIsSubmitModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HIỆN ĐÁP ÁN THAM KHẢO & GIẢI THÍCH */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Hướng dẫn giải ({stages[activeStage]?.label})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentStage.stageKey === "p1" && (
                <div className="space-y-2">
                  {examData.part1.gaps.map((g, idx) => (
                    <div key={g.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {g.prompt.replace(/\[(?:gap|blank|\.\.\.)\]/i, "___")}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{g.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(currentStage.stageKey === "p2-1" || currentStage.stageKey === "p2-2") && (() => {
                const storyIdx = currentStage.stageKey === "p2-1" ? 0 : 1;
                const story = examData.part2.stories[storyIdx];
                if (!story) return null;
                return (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                    <div className="font-bold text-primary">{story.title}</div>
                    <div className="text-foreground">
                      <span className="font-bold">1 (Mở đầu cố định):</span> {story.fixedSentence}
                    </div>
                    {story.correctOrder.map((sId, idx) => {
                      const sObj = story.sentences.find((s) => s.id === sId);
                      return (
                        <div key={sId} className="text-foreground">
                          <span className="font-bold">{idx + 2}:</span> {sObj?.text || sId}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {currentStage.stageKey === "p3" && (
                <div className="space-y-2">
                  {examData.part3.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Câu {idx + 1}: {q.prompt}
                      </div>
                      <div className="text-primary font-bold">
                        Đáp án đúng: <span className="underline">{q.correctAnswer}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentStage.stageKey === "p4" && (
                <div className="space-y-2">
                  {examData.part4.paragraphs.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
                      <div className="font-semibold text-foreground">
                        Đoạn văn {p.paragraphNumber}
                      </div>
                      <div className="text-primary font-bold">
                        Tiêu đề phù hợp: <span className="underline">{p.correctHeading}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      <ReadingGoogleTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
        initialText={translateText}
      />

      <ExamExitConfirmModal
        isOpen={showExitConfirm}
        title="Rời khỏi bài thi Reading?"
        message="Bạn đang trong quá trình làm bài đọc. Nếu quay lại lúc này, bài thi chưa nộp sẽ không được lưu điểm. Bạn có chắc chắn muốn rời khỏi không?"
        confirmText="Xác nhận rời khỏi"
        cancelText="Tiếp tục làm bài"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/reading");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

// Parser: Turns backend API getQuestions payload into structured ReadingExamData
function parseApiToReadingData(apiData: any): ReadingExamData {
  const parts = apiData.parts || [];

  const result: ReadingExamData = {
    id: apiData.id || "reading-01",
    title: apiData.title || "Bài thi Reading",
    durationMinutes: apiData.duration_minutes || (parts.length <= 1 ? 15 : 35),
    part1: {
      instructions: "Choose the word that fits in the gap. The first one is done for you.",
      exampleText: { prefix: "", word: "", suffix: "" },
      gaps: [],
    },
    part2: {
      instructions: "The sentences below make a complete text. Put them in the correct order.",
      stories: [],
    },
    part3: {
      title: "Opinion matching",
      instructions: "Read the texts and answer the questions.",
      reviews: [],
      questions: [],
    },
    part4: {
      title: "Long reading",
      instructions: "Read the passage quickly. Choose a heading for each numbered paragraph from the drop-down box.",
      allHeadings: [],
      paragraphs: [],
    },
  };

  parts.forEach((p: any) => {
    const pTitle = (p.title || "").toLowerCase();
    const pNum = p.part_number;
    // Single Source of Truth: Ưu tiên partType chuẩn hóa từ Backend DTO
    const partType = p.partType || 
      ((p.title && /heading|long|part 5/i.test(p.title)) || p.part_number === 5 || (p.part_number === 4 && (!p.title || !/opinion/i.test(p.title))) ? 'PART_4' :
       (p.title && /opinion/i.test(p.title)) || p.part_number === 3 ? 'PART_3' :
       (p.title && /cohesion|order|part 2/i.test(p.title)) || p.part_number === 2 ? 'PART_2' : 'PART_1');

    const isP1 = partType === 'PART_1';
    const isP2 = partType === 'PART_2';
    const isP3 = partType === 'PART_3';
    const isP4 = partType === 'PART_4';

    // Part 1: Gap Fill
    if (isP1) {
      const gaps: Part1Gap[] = (p.questions || []).map((q: any) => {
        let opts: string[] = [];
        if (Array.isArray(q.options)) opts = q.options;
        else if (typeof q.options === "string") {
          try {
            opts = JSON.parse(q.options);
          } catch {
            opts = [];
          }
        }
        return {
          id: String(q.id),
          prompt: q.prompt,
          options: opts,
          correctAnswer: String(q.correct_answer || opts[0] || ""),
        };
      });
      if (gaps.length > 0) {
        result.part1.gaps = gaps;
        if (p.instructions) result.part1.instructions = p.instructions;
      }
    }

    // Part 2: Sentence Order
    if (isP2) {
      const stories: Part2Story[] = [];
      (p.questions || []).forEach((q: any, idx: number) => {
        let optsObj: any = {};
        if (typeof q.options === "string") {
          try {
            optsObj = JSON.parse(q.options);
          } catch {
            optsObj = {};
          }
        } else if (typeof q.options === "object" && q.options !== null) {
          optsObj = q.options;
        }

        // Trường hợp 1: options là mảng chuỗi (dữ liệu thô từ crawler)
        if (Array.isArray(q.options) || Array.isArray(optsObj)) {
          const rawArr: string[] = Array.isArray(q.options) ? q.options : optsObj;
          if (rawArr.length >= 8) {
            const mid = Math.ceil(rawArr.length / 2);
            const st1Sentences = rawArr.slice(0, mid);
            const st2Sentences = rawArr.slice(mid);

            stories.push({
              id: `${q.id}-1`,
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : "Đoạn văn 1",
              fixedSentence: st1Sentences[0] || "Sentence 1 is fixed.",
              sentences: st1Sentences.slice(1).map((text, sIdx) => ({ id: `s${sIdx + 2}`, text })),
              correctOrder: st1Sentences.slice(1).map((_, sIdx) => `s${sIdx + 2}`),
            });

            stories.push({
              id: `${q.id}-2`,
              title: "Đoạn văn 2",
              fixedSentence: st2Sentences[0] || "Sentence 1 is fixed.",
              sentences: st2Sentences.slice(1).map((text, sIdx) => ({ id: `s${mid + sIdx + 2}`, text })),
              correctOrder: st2Sentences.slice(1).map((_, sIdx) => `s${mid + sIdx + 2}`),
            });
            return;
          } else if (rawArr.length >= 4) {
            stories.push({
              id: String(q.id),
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : `Đoạn văn ${idx + 1}`,
              fixedSentence: rawArr.length === 5 ? rawArr[0] : "Sentence 1 is fixed.",
              sentences: (rawArr.length === 5 ? rawArr.slice(1) : rawArr).map((text, sIdx) => ({ id: `s${sIdx + 2}`, text })),
              correctOrder: (rawArr.length === 5 ? rawArr.slice(1) : rawArr).map((_, sIdx) => `s${sIdx + 2}`),
            });
            return;
          }
        }

        // Trường hợp 2: options là object chuẩn { title, fixedSentence, sentences }
        let corArr: string[] = [];
        if (Array.isArray(q.correct_answer)) corArr = q.correct_answer;
        else if (typeof q.correct_answer === "string") {
          try {
            corArr = JSON.parse(q.correct_answer);
          } catch {
            corArr = [];
          }
        }

        stories.push({
          id: String(q.id),
          title: optsObj.title || q.prompt || `Đoạn văn ${idx + 1}`,
          fixedSentence: optsObj.fixedSentence || "Sentence 1 is fixed here.",
          sentences: optsObj.sentences || [],
          correctOrder: corArr.length > 0 ? corArr : (optsObj.sentences || []).map((s: any) => s.id),
        });
      });

      if (stories.length > 0) {
        result.part2.stories = stories;
        if (p.instructions) result.part2.instructions = p.instructions;
      }
    }

    // Part 3/4: Opinion Matching
    if (isP3) {
      if (p.passage_text) {
        const cleanText = p.passage_text.replace(/\r\n/g, "\n").replace(/<[^>]+>/g, "\n");

        // 1. Thử match theo định dạng Person A/B/C/D
        let matches = Array.from(
          cleanText.matchAll(/(?:^|\n)\s*(?:Person\s*)?([A-D])\s*[:.-]?\s*([\s\S]*?)(?=(?:\n\s*(?:Person\s*)?[A-D]\s*[:.-]?)|$)/gi)
        );

        // 2. Nếu không có Person A-D, match theo Person <Tên>: hoặc <Tên>: (ví dụ: Person Nadia:, Person Cora:)
        if (!matches || matches.length < 4) {
          const namedMatches = Array.from(
            cleanText.matchAll(/(?:^|\n)\s*(?:Person\s+)?([A-Za-z]+)\s*[:.-]\s*([\s\S]*?)(?=(?:\n\s*(?:Person\s+)?[A-Za-z]+\s*[:.-])|$)/gi)
          );
          if (namedMatches && namedMatches.length >= 4) {
            matches = namedMatches;
          }
        }

        // 3. Nếu vẫn chưa match được, thử tách theo 4 đoạn văn cách nhau bởi 2 dấu xuống dòng (\n\n)
        if (!matches || matches.length < 4) {
          const paragraphs = cleanText.split(/\n\s*\n/).map((s: string) => s.trim()).filter((s: string) => s.length > 30);
          if (paragraphs.length >= 4) {
            matches = paragraphs.slice(0, 4).map((para: string, idx: number) => {
              const letter = String.fromCharCode(65 + idx);
              return [para, letter, para];
            });
          }
        }

        const letters = ["A", "B", "C", "D"];
        if (matches && matches.length >= 4) {
          result.part3.reviews = matches.slice(0, 4).map((m: any, idx: number) => {
            const letter = letters[idx];
            const rawName = (m[1] || "").trim();
            const displayName = /^[A-D]$/i.test(rawName)
              ? `Person ${rawName.toUpperCase()}`
              : `Person ${letter} (${rawName})`;
            return {
              person: `Person ${letter}`,
              name: displayName,
              review: m[2]?.trim() || "",
            };
          });
        } else {
          result.part3.reviews = [
            {
              person: "Passage",
              name: "Nội dung bài đọc",
              review: cleanText.trim(),
            },
          ];
        }
      }

      const questions: Part3Question[] = (p.questions || []).map((q: any) => {
        let opts: string[] = ["Person A", "Person B", "Person C", "Person D"];
        if (Array.isArray(q.options) && q.options.length > 0) opts = q.options;
        return {
          id: String(q.id),
          prompt: q.prompt,
          options: opts,
          correctAnswer: String(q.correct_answer || "Person A"),
        };
      });
      if (questions.length > 0) {
        result.part3.questions = questions;
        if (p.instructions) result.part3.instructions = p.instructions;
        if (p.title) result.part3.title = p.title;
      }
    }

    // Part 4/5: Long Reading / Heading Matching
    if (isP4) {
      const headingsSet = new Set<string>();
      const paragraphs: Part4Paragraph[] = (p.questions || []).map((q: any, idx: number) => {
        if (Array.isArray(q.options)) {
          q.options.forEach((h: string) => headingsSet.add(h));
        }
        return {
          id: String(q.id),
          paragraphNumber: q.question_number || (idx + 1),
          text: q.prompt ? q.prompt.replace(/^Paragraph\s*\d+\s*:\s*/i, "") : "",
          correctHeading: String(q.correct_answer || ""),
        };
      });
      if (paragraphs.length > 0) {
        result.part4.paragraphs = paragraphs;
        if (headingsSet.size > 0) {
          result.part4.allHeadings = Array.from(headingsSet);
        }
        if (p.instructions) result.part4.instructions = p.instructions;
        result.part4.title = p.passage_text || p.title || "Long reading";
      }
    }
  });

  return result;
}
