"use client";

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Clock,
  Play,
  Pause,
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
  Loader2,
} from "lucide-react";
import { ReadingSentenceOrder } from "@/components/reading-components";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";
import {
  ReadingResultScreen,
  ReadingPart1Card,
  ReadingPart2Card,
  ReadingPart3Card,
  ReadingPart4Card,
} from "@/components/reading/reading-part-cards";
import {
  ReadingReviewSidebar,
  ReadingBottomDock,
  ReadingModalsAndDrawer,
} from "@/components/reading/reading-bottom-dock";

import {
  type Part1Gap,
  type Part2Story,
  type Part3Review,
  type Part3Question,
  type Part4Paragraph,
  type ReadingExamData,
} from "@/data/reading-benchmark";

const EMPTY_READING_EXAM: ReadingExamData = {
  id: "",
  title: "",
  durationMinutes: 35,
  part1: { instructions: "", exampleText: { prefix: "", word: "", suffix: "" }, gaps: [] },
  part2: { instructions: "", stories: [] },
  part3: { title: "", instructions: "", reviews: [], questions: [] },
  part4: { title: "", instructions: "", allHeadings: [], paragraphs: [] },
};

function stripHtml(text: string | null | undefined): string {
  if (!text) return "";
  return text.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

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
  const [examData, setExamData] = useState<ReadingExamData>(EMPTY_READING_EXAM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Time & Submission State
  const [timeLeft, setTimeLeft] = useState(35 * 60);
  const [isPaused, setIsPaused] = useState(false);
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

  const maxTotalScore = useMemo(() => {
    if (partScores.length > 0) {
      return Math.round(partScores.reduce((sum, item) => sum + item.maxScore, 0));
    }
    return 50;
  }, [partScores]);

  // Review state & helper calculations
  const [reviewOnlyWrong, setReviewOnlyWrong] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const handleRestartExam = useCallback(() => {
    setIsRestarting(true);
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
    router.replace(`/reading/${examId}`);
    setTimeout(() => setIsRestarting(false), 400);
  }, [examData, examId, router]);

  // Thống kê kết quả chi tiết từng câu hỏi phục vụ Sidebar Mục lục xem lại
  const readingReviewStats = useMemo(() => {
    let totalQuestions = 0;
    let totalCorrect = 0;

    // Part 1
    const p1Items: Array<{ id: string; label: string; isCorrect: boolean; userAns: string; corAns: string }> = [];
    examData.part1.gaps.forEach((g, idx) => {
      const user = p1Answers[g.id] || "";
      const cor = g.correctAnswer || "";
      const isCor = Boolean(user && user.toLowerCase() === cor.toLowerCase());
      p1Items.push({ id: g.id, label: `Câu ${idx + 1}`, isCorrect: isCor, userAns: user, corAns: cor });
      totalQuestions++;
      if (isCor) totalCorrect++;
    });

    // Part 2 stories
    const p2Stories: Array<{
      storyId: string;
      title: string;
      items: Array<{ id: string; label: string; isCorrect: boolean; sentenceText: string }>;
      correctCount: number;
      totalCount: number;
    }> = [];

    examData.part2.stories.forEach((st, sIdx) => {
      const userOrder = p2Orders[st.id] || [];
      const corOrder = st.correctOrder || [];
      const items: Array<{ id: string; label: string; isCorrect: boolean; sentenceText: string }> = [];
      let corCount = 0;

      corOrder.forEach((corId, idx) => {
        const userPlacedId = userOrder[idx];
        const isCor = userPlacedId === corId;
        const sentence = st.sentences.find((s) => s.id === (userPlacedId || corId));
        items.push({
          id: `${st.id}_slot_${idx}`,
          label: `Vị trí ${idx + 1}`,
          isCorrect: isCor,
          sentenceText: sentence?.text || "",
        });
        totalQuestions++;
        if (isCor) {
          corCount++;
          totalCorrect++;
        }
      });

      p2Stories.push({
        storyId: st.id,
        title: st.title || `Câu chuyện ${sIdx + 1}`,
        items,
        correctCount: corCount,
        totalCount: corOrder.length,
      });
    });

    // Part 3
    const p3Items: Array<{ id: string; label: string; isCorrect: boolean; userAns: string; corAns: string }> = [];
    examData.part3.questions.forEach((q, idx) => {
      const user = p3Answers[q.id] || "";
      const cor = q.correctAnswer || "";
      const isCor = Boolean(user && user.toLowerCase() === cor.toLowerCase());
      p3Items.push({ id: q.id, label: `Câu ${idx + 1}`, isCorrect: isCor, userAns: user, corAns: cor });
      totalQuestions++;
      if (isCor) totalCorrect++;
    });

    // Part 4
    const p4Items: Array<{ id: string; label: string; isCorrect: boolean; userAns: string; corAns: string }> = [];
    examData.part4.paragraphs.forEach((p, idx) => {
      const user = p4Answers[p.id] || "";
      const cor = p.correctHeading || "";
      const isCor = Boolean(user && user.toLowerCase() === cor.toLowerCase());
      p4Items.push({ id: p.id, label: `Đoạn ${idx + 1}`, isCorrect: isCor, userAns: user, corAns: cor });
      totalQuestions++;
      if (isCor) totalCorrect++;
    });

    const totalWrong = Math.max(0, totalQuestions - totalCorrect);

    return {
      totalQuestions,
      totalCorrect,
      totalWrong,
      p1: {
        items: p1Items,
        correctCount: p1Items.filter((i) => i.isCorrect).length,
        totalCount: p1Items.length,
      },
      p2: p2Stories,
      p3: {
        items: p3Items,
        correctCount: p3Items.filter((i) => i.isCorrect).length,
        totalCount: p3Items.length,
      },
      p4: {
        items: p4Items,
        correctCount: p4Items.filter((i) => i.isCorrect).length,
        totalCount: p4Items.length,
      },
    };
  }, [examData, p1Answers, p2Orders, p3Answers, p4Answers]);

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

                // Nạp lại cấu trúc đề kèm đáp án đúng & giải thích thực tế từ Submission
                let activeData = parsed;
                if (sub.exam) {
                  activeData = parseApiToReadingData(sub.exam);
                  setExamData(activeData);
                } else if (sub.answers && Array.isArray(sub.answers)) {
                  const ansMap = new Map(sub.answers.map((a: any) => [String(a.question_id || a.questionId), a]));
                  activeData.part1.gaps.forEach((g) => {
                    const ans: any = ansMap.get(g.id);
                    if (ans?.correct_answer) g.correctAnswer = ans.correct_answer;
                    if (ans?.question?.explanation) g.explanation = ans.question.explanation;
                  });
                  activeData.part2.stories.forEach((st) => {
                    const ans: any = ansMap.get(st.id);
                    if (ans?.correct_answer) {
                      try {
                        const cor = JSON.parse(ans.correct_answer);
                        if (Array.isArray(cor)) st.correctOrder = cor;
                      } catch {}
                    }
                    if (ans?.question?.explanation) st.explanation = ans.question.explanation;
                  });
                  activeData.part3.questions.forEach((q) => {
                    const ans: any = ansMap.get(q.id);
                    if (ans?.correct_answer) q.correctAnswer = ans.correct_answer;
                    if (ans?.question?.explanation) q.explanation = ans.question.explanation;
                  });
                  activeData.part4.paragraphs.forEach((p) => {
                    const ans: any = ansMap.get(p.id);
                    if (ans?.correct_answer) p.correctHeading = ans.correct_answer;
                    if (ans?.question?.explanation) p.explanation = ans.question.explanation;
                  });
                  setExamData({ ...activeData });
                }

                const loadedP1: Record<string, string> = {};
                const loadedP2: Record<string, string[]> = {};
                const loadedP3: Record<string, string> = {};
                const loadedP4: Record<string, string> = {};

                (sub.answers || []).forEach((ans: any) => {
                  const qId = String(ans.question_id || ans.questionId);
                  const opt = ans.selected_option || ans.selectedOption || ans.text_answer || ans.textAnswer || "";
                  if (activeData.part1.gaps.some((g) => g.id === qId)) {
                    loadedP1[qId] = opt;
                  } else if (activeData.part2.stories.some((s) => s.id === qId)) {
                    try {
                      loadedP2[qId] = JSON.parse(opt);
                    } catch {
                      loadedP2[qId] = [];
                    }
                  } else if (activeData.part3.questions.some((q) => q.id === qId)) {
                    loadedP3[qId] = opt;
                  } else if (activeData.part4.paragraphs.some((p) => p.id === qId)) {
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
                  (activeData.part1.gaps.length > 0 ? 1 : 0) +
                  (activeData.part2.stories.length > 0 ? 1 : 0) +
                  (activeData.part3.questions.length > 0 ? 1 : 0) +
                  (activeData.part4.paragraphs.length > 0 ? 1 : 0);

                // 1. Part 1: 2.0 điểm / câu, max 10 điểm
                if (activeData.part1.gaps.length > 0) {
                  let p1Correct = 0;
                  activeData.part1.gaps.forEach((g) => {
                    if (loadedP1[g.id] && loadedP1[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
                      p1Correct++;
                    }
                  });
                  const p1Max = 10;
                  const p1Score = p1Correct * 2.0;
                  calculatedPartScores.push({
                    name: "Part 1 – Sentence comprehension",
                    score: Math.round(p1Score * 10) / 10,
                    maxScore: p1Max,
                    correct: p1Correct,
                    total: activeData.part1.gaps.length,
                  });
                }

                // 2. Part 2: 1.0 điểm / câu đúng vị trí, 5 điểm / đoạn, tổng 10 điểm
                if (activeData.part2.stories.length > 0) {
                  let p2CorrectMatches = 0;
                  let p2TotalMatches = 0;
                  activeData.part2.stories.forEach((st) => {
                    const userOrder = loadedP2[st.id] || [];
                    const corOrder = st.correctOrder || [];
                    p2TotalMatches += corOrder.length;
                    userOrder.forEach((item, idx) => {
                      if (corOrder[idx] === item) p2CorrectMatches++;
                    });
                  });
                  const p2Max = activeData.part2.stories.length * 5;
                  const p2Score = p2CorrectMatches * 1.0;
                  calculatedPartScores.push({
                    name: "Part 2 – Text cohesion",
                    score: Math.round(p2Score * 10) / 10,
                    maxScore: p2Max,
                    correct: p2CorrectMatches,
                    total: p2TotalMatches,
                  });
                }

                // 3. Part 3
                if (activeData.part3.questions.length > 0) {
                  let p3Correct = 0;
                  activeData.part3.questions.forEach((q) => {
                    if (loadedP3[q.id] && loadedP3[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
                      p3Correct++;
                    }
                  });
                  const p3Max = activePartsCount === 1 ? 14 : 14;
                  const p3Score = (p3Correct / activeData.part3.questions.length) * p3Max;
                  calculatedPartScores.push({
                    name: "Part 4 – Opinion matching",
                    score: Math.round(p3Score * 10) / 10,
                    maxScore: p3Max,
                    correct: p3Correct,
                    total: activeData.part3.questions.length,
                  });
                }

                // 4. Part 4 (Part 5 - Long reading)
                if (activeData.part4.paragraphs.length > 0) {
                  let p4Correct = 0;
                  activeData.part4.paragraphs.forEach((p) => {
                    if (loadedP4[p.id] && loadedP4[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
                      p4Correct++;
                    }
                  });
                  const p4Max = activePartsCount === 1 ? 16 : 16;
                  const p4Score = (p4Correct / activeData.part4.paragraphs.length) * p4Max;
                  calculatedPartScores.push({
                    name: "Part 5 – Long reading",
                    score: Math.round(p4Score * 10) / 10,
                    maxScore: p4Max,
                    correct: p4Correct,
                    total: activeData.part4.paragraphs.length,
                  });
                }

                setPartScores(calculatedPartScores);

                if (sub.total_score == null) {
                  const calculatedSum = Math.round(
                    calculatedPartScores.reduce((sum, item) => sum + item.score, 0)
                  );
                  const calculatedMax = Math.round(
                    calculatedPartScores.reduce((sum, item) => sum + item.maxScore, 0)
                  );
                  setResultScore(calculatedSum);
                  const scaledCefr = calculatedMax > 0 ? (calculatedSum / calculatedMax) * 50 : calculatedSum;
                  let calculatedCefr = "A1";
                  if (scaledCefr >= 46) calculatedCefr = "C";
                  else if (scaledCefr >= 38) calculatedCefr = "B2";
                  else if (scaledCefr >= 26) calculatedCefr = "B1";
                  else if (scaledCefr >= 16) calculatedCefr = "A2";
                  else if (scaledCefr > 5) calculatedCefr = "A1";
                  else calculatedCefr = "A0";
                  setCefrBand(calculatedCefr);
                }

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
          const msg = res.message || res.error?.message || "Không thể tải đề thi từ máy chủ";
          setError(msg);
        }
      } catch (err: any) {
        console.warn("Error loading reading exam:", err);
        setError(err?.message || "Không thể tải đề thi từ máy chủ");
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
    if (examData.part3.questions.length > 0) {
      const p3CleanTitle = stripHtml(examData.part3.title)
        .replace(/^Part\s*\d+\s*[-–—:]?\s*/i, "")
        .replace(/^[-–—:\s]+/g, "")
        .replace(/^-?\s*gap fill/i, "")
        .trim();
      list.push({
        stageKey: "p3",
        title: "Part 4",
        label: "Part 4 – " + (p3CleanTitle || "Opinion Matching"),
        count: examData.part3.questions.length,
      });
    }
    if (examData.part4.paragraphs.length > 0) {
      const p4CleanTitle = stripHtml(examData.part4.title)
        .replace(/^Part\s*\d+\s*[-–—:]?\s*/i, "")
        .replace(/^[-–—:\s]+/g, "")
        .replace(/^-?\s*gap fill/i, "")
        .trim();
      list.push({
        stageKey: "p4",
        title: "Part 5",
        label: "Part 5 – " + (p4CleanTitle || "Long Reading"),
        count: examData.part4.paragraphs.length,
      });
    }

    return list;
  }, [examData]);

  const hasHandledPartParam = useRef<string | null>(null);

  // Adjust activeStage if URL contains ?part= (chỉ chạy sau khi examData thực tế đã tải xong)
  useEffect(() => {
    if (loading) return;
    if (stages.length === 0) return;
    if (stages.length === 1) {
      setActiveStage(0);
      return;
    }
    if (!partParam) {
      setActiveStage(0);
      return;
    }
    const p = partParam.toLowerCase();
    const handleKey = `${examId}_${p}`;
    if (hasHandledPartParam.current === handleKey) return;

    let targetKey: string | null = null;
    if (p === "1" || p === "p1" || p === "part1") {
      targetKey = stages.some((s) => s.stageKey === "p1") ? "p1" : stages[0]?.stageKey;
    } else if (p === "2" || p === "p2" || p === "part2" || p === "2-1" || p === "p2-1") {
      targetKey = stages.some((s) => s.stageKey === "p2-1") ? "p2-1" : stages[0]?.stageKey;
    } else if (p === "2-2" || p === "p2-2") {
      targetKey = stages.some((s) => s.stageKey === "p2-2") ? "p2-2" : stages[0]?.stageKey;
    } else if (p === "3" || p === "p3" || p === "part3") {
      targetKey = stages.some((s) => s.stageKey === "p3")
        ? "p3"
        : stages.some((s) => s.stageKey === "p2-2")
        ? "p2-2"
        : stages[0]?.stageKey;
    } else if (p === "4" || p === "p4" || p === "part4") {
      // Ưu tiên Part 4 – Opinion matching (p3). Nếu đề lẻ Long reading chỉ có p4 thì chọn p4.
      targetKey = stages.some((s) => s.stageKey === "p3")
        ? "p3"
        : stages.some((s) => s.stageKey === "p4")
        ? "p4"
        : stages[0]?.stageKey;
    } else if (p === "5" || p === "p5" || p === "part5") {
      // Part 5 – Long reading (p4)
      targetKey = stages.some((s) => s.stageKey === "p4")
        ? "p4"
        : stages[0]?.stageKey;
    }

    if (targetKey) {
      const idx = stages.findIndex((s) => s.stageKey === targetKey);
      if (idx !== -1) {
        setActiveStage(idx);
      } else {
        setActiveStage(0);
      }
    } else {
      setActiveStage(0);
    }
    hasHandledPartParam.current = handleKey;
  }, [loading, partParam, stages, examId]);

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
    if (isSubmitted || loading || isReviewMode || isPaused) return;
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
  }, [isSubmitted, loading, isReviewMode, isPaused]);

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

    // 1. Part 1 Score: 2.0 điểm / câu, max 10 điểm
    let p1Correct = 0;
    if (examData.part1.gaps.length > 0) {
      examData.part1.gaps.forEach((g) => {
        if (p1Answers[g.id] && p1Answers[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
          p1Correct++;
        }
      });
      const p1Max = 10;
      const p1Score = p1Correct * 2.0;
      calculatedPartScores.push({
        name: "Part 1 – Sentence comprehension",
        score: Math.round(p1Score * 10) / 10,
        maxScore: p1Max,
        correct: p1Correct,
        total: examData.part1.gaps.length,
      });
    }

    // 2. Part 2 Score: Mỗi câu đúng vị trí được 1 điểm, 5 điểm / đoạn, tổng 10 điểm
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
      const p2Max = examData.part2.stories.length * 5;
      const p2Score = p2CorrectMatches * 1.0;
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
      const p3Max = activePartsCount === 1 ? 14 : 14;
      const p3Score = (p3Correct / examData.part3.questions.length) * p3Max;
      calculatedPartScores.push({
        name: "Part 4 – Opinion matching",
        score: Math.round(p3Score * 10) / 10,
        maxScore: p3Max,
        correct: p3Correct,
        total: examData.part3.questions.length,
      });
    }

    // 4. Part 4 Score (Part 5 - Long reading)
    let p4Correct = 0;
    if (examData.part4.paragraphs.length > 0) {
      examData.part4.paragraphs.forEach((p) => {
        if (p4Answers[p.id] && p4Answers[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
          p4Correct++;
        }
      });
      const p4Max = activePartsCount === 1 ? 16 : 16;
      const p4Score = (p4Correct / examData.part4.paragraphs.length) * p4Max;
      calculatedPartScores.push({
        name: "Part 5 – Long reading",
        score: Math.round(p4Score * 10) / 10,
        maxScore: p4Max,
        correct: p4Correct,
        total: examData.part4.paragraphs.length,
      });
    }

    const totalCalculated = Math.round(calculatedPartScores.reduce((sum, item) => sum + item.score, 0));
    const totalMax = Math.round(calculatedPartScores.reduce((sum, item) => sum + item.maxScore, 0));
    const scaledCefr = totalMax > 0 ? (totalCalculated / totalMax) * 50 : totalCalculated;

    let cefr = "A1";
    if (scaledCefr >= 46) cefr = "C";
    else if (scaledCefr >= 38) cefr = "B2";
    else if (scaledCefr >= 26) cefr = "B1";
    else if (scaledCefr >= 16) cefr = "A2";
    else if (scaledCefr > 5) cefr = "A1";
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

        // Nạp kết quả chính thức từ máy chủ để hiển thị đúng đáp án và thang điểm
        try {
          const resultRes = await api.submissions.getResult(submissionId);
          if (resultRes.success && resultRes.data) {
            const sub = resultRes.data;
            let activeExam = examData;
            if (sub.exam) {
              activeExam = parseApiToReadingData(sub.exam);
              setExamData(activeExam);
            }
            if (sub.total_score != null) {
              setResultScore(Math.round(sub.total_score * 10) / 10);
            }
            if (sub.cefr_level) {
              setCefrBand(sub.cefr_level);
            }

            // Tính lại chuẩn xác partScores từ activeExam đã nạp đáp án chuẩn từ máy chủ
            const updatedPartScores: { name: string; score: number; maxScore: number; correct: number; total: number }[] = [];

            // 1. Part 1
            if (activeExam.part1.gaps.length > 0) {
              let p1Cor = 0;
              activeExam.part1.gaps.forEach((g) => {
                if (p1Answers[g.id] && p1Answers[g.id].toLowerCase() === g.correctAnswer.toLowerCase()) {
                  p1Cor++;
                }
              });
              const p1Max = 10;
              const p1Score = p1Cor * 2.0;
              updatedPartScores.push({
                name: "Part 1 – Sentence comprehension",
                score: Math.round(p1Score * 10) / 10,
                maxScore: p1Max,
                correct: p1Cor,
                total: activeExam.part1.gaps.length,
              });
            }

            // 2. Part 2
            if (activeExam.part2.stories.length > 0) {
              let p2Cor = 0;
              let p2Tot = 0;
              activeExam.part2.stories.forEach((st) => {
                const userOrder = p2Orders[st.id] || [];
                const corOrder = st.correctOrder || [];
                p2Tot += corOrder.length;
                userOrder.forEach((item, idx) => {
                  if (corOrder[idx] === item) p2Cor++;
                });
              });
              const p2Max = activeExam.part2.stories.length * 5;
              const p2Score = p2Cor * 1.0;
              updatedPartScores.push({
                name: "Part 2 – Text cohesion",
                score: Math.round(p2Score * 10) / 10,
                maxScore: p2Max,
                correct: p2Cor,
                total: p2Tot,
              });
            }

            // 3. Part 3
            if (activeExam.part3.questions.length > 0) {
              let p3Cor = 0;
              activeExam.part3.questions.forEach((q) => {
                if (p3Answers[q.id] && p3Answers[q.id].toLowerCase() === q.correctAnswer.toLowerCase()) {
                  p3Cor++;
                }
              });
              const p3Max = 14;
              const p3Score = (p3Cor / activeExam.part3.questions.length) * p3Max;
              updatedPartScores.push({
                name: "Part 4 – Opinion matching",
                score: Math.round(p3Score * 10) / 10,
                maxScore: p3Max,
                correct: p3Cor,
                total: activeExam.part3.questions.length,
              });
            }

            // 4. Part 4 (Part 5 - Long reading)
            if (activeExam.part4.paragraphs.length > 0) {
              let p4Cor = 0;
              activeExam.part4.paragraphs.forEach((p) => {
                if (p4Answers[p.id] && p4Answers[p.id].toLowerCase() === p.correctHeading.toLowerCase()) {
                  p4Cor++;
                }
              });
              const p4Max = 16;
              const p4Score = (p4Cor / activeExam.part4.paragraphs.length) * p4Max;
              updatedPartScores.push({
                name: "Part 5 – Long reading",
                score: Math.round(p4Score * 10) / 10,
                maxScore: p4Max,
                correct: p4Cor,
                total: activeExam.part4.paragraphs.length,
              });
            }

            if (updatedPartScores.length > 0) {
              setPartScores(updatedPartScores);
            }
          }
        } catch (subErr) {
          console.warn("Could not reload graded result:", subErr);
        }
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
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted) {
                router.push("/reading");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="w-9 h-9 rounded-xl border border-border hover:bg-muted flex items-center justify-center transition-colors text-foreground cursor-pointer"
            title={isReviewMode ? "Quay lại Lịch sử làm bài" : "Quay lại danh sách đề"}
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
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                    isPaused
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                  title={isPaused ? "Tiếp tục làm bài (Resume)" : "Tạm dừng làm bài (Pause)"}
                >
                  {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
                </button>
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
              if (isReviewMode) {
                router.push("/history");
              } else if (isSubmitted) {
                router.push("/reading");
              } else {
                setShowExitConfirm(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title={isReviewMode ? "Quay lại Lịch sử làm bài" : "Thoát về danh sách đề"}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{isReviewMode ? "Về Lịch sử" : "Thoát"}</span>
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
      <main className={`flex-1 py-6 px-3 md:px-6 ${isReviewMode ? "pb-12" : "pb-28"}`} data-no-global-selection="true">
        <div className={`mx-auto ${isReviewMode && !isSubmitted ? "max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" : "max-w-4xl space-y-6"}`}>
          <div className={`${isReviewMode && !isSubmitted ? "lg:col-span-8 space-y-6" : "space-y-6"}`}>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Reading...</p>
            </div>
          )}

          {/* Result Card Mode */}
          {!loading && isSubmitted && (
            <ReadingResultScreen
              userFullName={user?.full_name}
              examId={examId}
              cefrBand={cefrBand}
              resultScore={resultScore}
              maxTotalScore={maxTotalScore}
              partScores={partScores}
              isRestarting={isRestarting}
              onReviewDetails={() => {
                setIsSubmitted(false);
                setIsReviewMode(true);
                setActiveStage(0);
              }}
              onRestartExam={handleRestartExam}
            />
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
                      onClick={() => setIsPaused((prev) => !prev)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        isPaused
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                      title={isPaused ? "Tiếp tục làm bài" : "Tạm dừng làm bài"}
                    >
                      {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                      <span>{isPaused ? "Tiếp tục" : "Tạm dừng"}</span>
                    </button>
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
                  {currentStage.stageKey === "p1" && stripHtml(examData.part1.instructions)}
                  {currentStage.stageKey === "p2-1" && stripHtml(examData.part2.instructions)}
                  {currentStage.stageKey === "p2-2" && stripHtml(examData.part2.instructions)}
                  {currentStage.stageKey === "p3" && stripHtml(examData.part3.instructions)}
                  {currentStage.stageKey === "p4" && stripHtml(examData.part4.instructions)}
                </p>
              </div>

              {/* Main Questions Content Card */}
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
                {currentStage.stageKey === "p1" && (
                  <ReadingPart1Card
                    part1={examData.part1}
                    p1Answers={p1Answers}
                    setP1Answers={setP1Answers}
                    isReviewMode={isReviewMode}
                  />
                )}
                {currentStage.stageKey === "p2-1" && (
                  <ReadingPart2Card
                    story={examData.part2.stories[0]}
                    p2Orders={p2Orders}
                    setP2Orders={setP2Orders}
                    isReviewMode={isReviewMode}
                  />
                )}
                {currentStage.stageKey === "p2-2" && (
                  <ReadingPart2Card
                    story={examData.part2.stories[1]}
                    p2Orders={p2Orders}
                    setP2Orders={setP2Orders}
                    isReviewMode={isReviewMode}
                  />
                )}
                {currentStage.stageKey === "p3" && (
                  <ReadingPart3Card
                    part3={examData.part3}
                    stageLabel={currentStage.label}
                    p3Answers={p3Answers}
                    setP3Answers={setP3Answers}
                    isReviewMode={isReviewMode}
                    onTextSelection={handleTextSelection}
                    onClearHighlights={clearHighlightsForStage}
                    renderHighlightedContent={renderHighlightedContent}
                  />
                )}
                {currentStage.stageKey === "p4" && (
                  <ReadingPart4Card
                    part4={examData.part4}
                    stageLabel={currentStage.label}
                    p4Answers={p4Answers}
                    setP4Answers={setP4Answers}
                    isReviewMode={isReviewMode}
                    onTextSelection={handleTextSelection}
                    onClearHighlights={clearHighlightsForStage}
                    renderHighlightedContent={renderHighlightedContent}
                  />
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
                title="Đánh dấu đoạn văn Highlight (Màu vàng)"
              >
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                <span>Highlight</span>
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

          {/* Điều hướng nhanh giữa các phần khi ở Review Mode (trong trang, không bị che bởi bottom bar) */}
          {isReviewMode && !isSubmitted && !loading && (
            <div className="flex items-center justify-between pt-5 border-t border-border">
              <button
                type="button"
                disabled={activeStage === 0}
                onClick={() => {
                  setActiveStage((p) => Math.max(0, p - 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Phần trước</span>
              </button>
              <span className="text-xs font-bold text-muted-foreground">
                Phần {activeStage + 1} / {stages.length} : {stages[activeStage]?.title}
              </span>
              <button
                type="button"
                disabled={activeStage === stages.length - 1}
                onClick={() => {
                  setActiveStage((p) => Math.min(stages.length - 1, p + 1));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="tech-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Phần kế tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: MỤC LỤC XEM LẠI CHUẨN KHI Ở REVIEW MODE */}
        {isReviewMode && !isSubmitted && !loading && (
          <ReadingReviewSidebar
            resultScore={resultScore}
            maxTotalScore={maxTotalScore}
            cefrBand={cefrBand}
            readingReviewStats={readingReviewStats}
            reviewOnlyWrong={reviewOnlyWrong}
            setReviewOnlyWrong={setReviewOnlyWrong}
            stages={stages}
            activeStage={activeStage}
            setActiveStage={setActiveStage}
            onShowScoreReport={() => setIsSubmitted(true)}
            onRestartExam={handleRestartExam}
            isRestarting={isRestarting}
            onBackToHistory={() => router.push("/history")}
          />
        )}
      </div>
    </main>

    {/* 3. STICKY BOTTOM RUNNER BAR CHUẨN (ẨN KHI REVIEW) */}
    {!loading && !isSubmitted && !isReviewMode && (
      <ReadingBottomDock
        stages={stages}
        activeStage={activeStage}
        setActiveStage={setActiveStage}
        flagged={flagged}
        examData={examData}
        p1Answers={p1Answers}
        p2Orders={p2Orders}
        p3Answers={p3Answers}
        p4Answers={p4Answers}
        isReviewMode={isReviewMode}
        onOpenSampleAnswers={() => setShowSampleAnswers(true)}
        onOpenDrawer={() => setShowDrawer(true)}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onShowScoreReport={() => setIsSubmitted(true)}
      />
    )}

    <ReadingModalsAndDrawer
      showDrawer={showDrawer}
      setShowDrawer={setShowDrawer}
      showSampleAnswers={showSampleAnswers}
      setShowSampleAnswers={setShowSampleAnswers}
      stages={stages}
      currentStage={currentStage}
      activeStage={activeStage}
      setActiveStage={setActiveStage}
      flagged={flagged}
      examData={examData}
      p1Answers={p1Answers}
      p2Orders={p2Orders}
      p3Answers={p3Answers}
      p4Answers={p4Answers}
      onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
    />
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
      ((p.title && /heading|long|part 5/i.test(p.title)) || p.part_number === 5 || (p.part_number === 4 && (!p.title || !/opinion/i.test(p.title))) || (p.questions && p.questions.some((q: any) => /paragraph\s*\d+/i.test(q.prompt || ""))) ? 'PART_4' :
       (p.title && /opinion/i.test(p.title)) || p.part_number === 3 || (p.questions && p.questions.some((q: any) => Array.isArray(q.options) && q.options.includes("Person A"))) ? 'PART_3' :
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
          correctAnswer: String(q.correct_answer || ""),
          explanation: q.explanation || null,
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

            const st1HasFixed = st1Sentences.length < 5;
            const st2HasFixed = st2Sentences.length < 5;

            stories.push({
              id: `${q.id}-1`,
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : "Đoạn văn 1",
              fixedSentence: st1HasFixed ? st1Sentences[0] : null,
              sentences: (st1HasFixed ? st1Sentences.slice(1) : st1Sentences).map((text, sIdx) => ({ id: `s${sIdx + (st1HasFixed ? 2 : 1)}`, text })),
              correctOrder: (st1HasFixed ? st1Sentences.slice(1) : st1Sentences).map((_, sIdx) => `s${sIdx + (st1HasFixed ? 2 : 1)}`),
              explanation: q.explanation || null,
            });

            stories.push({
              id: `${q.id}-2`,
              title: "Đoạn văn 2",
              fixedSentence: st2HasFixed ? st2Sentences[0] : null,
              sentences: (st2HasFixed ? st2Sentences.slice(1) : st2Sentences).map((text, sIdx) => ({ id: `s${mid + sIdx + (st2HasFixed ? 2 : 1)}`, text })),
              correctOrder: (st2HasFixed ? st2Sentences.slice(1) : st2Sentences).map((_, sIdx) => `s${mid + sIdx + (st2HasFixed ? 2 : 1)}`),
              explanation: q.explanation || null,
            });
            return;
          } else if (rawArr.length >= 4) {
            const hasFixed = rawArr.length < 5;
            stories.push({
              id: String(q.id),
              title: q.prompt && q.prompt !== "Put the sentences in the correct order." ? q.prompt : `Đoạn văn ${idx + 1}`,
              fixedSentence: hasFixed ? rawArr[0] : null,
              sentences: (hasFixed ? rawArr.slice(1) : rawArr).map((text, sIdx) => ({ id: `s${sIdx + (hasFixed ? 2 : 1)}`, text })),
              correctOrder: (hasFixed ? rawArr.slice(1) : rawArr).map((_, sIdx) => `s${sIdx + (hasFixed ? 2 : 1)}`),
              explanation: q.explanation || null,
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

        const rawSentences = optsObj.sentences || [];
        const isDummy = Boolean(optsObj.fixedSentence && /sentence 1 is fixed/i.test(optsObj.fixedSentence));
        const finalFixed = (rawSentences.length >= 5 || isDummy) ? null : (optsObj.fixedSentence || null);

        stories.push({
          id: String(q.id),
          title: optsObj.title || q.prompt || `Đoạn văn ${idx + 1}`,
          fixedSentence: finalFixed,
          sentences: rawSentences,
          correctOrder: corArr.length > 0 ? corArr : rawSentences.map((s: any) => s.id),
          explanation: q.explanation || null,
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

      const isInstructionQ = (text: string) =>
        /here is the perspective of four people|read the content and answer the question|choose the correct person/i.test(text);

      const questions: Part3Question[] = (p.questions || [])
        .filter((q: any) => !isInstructionQ(q.prompt || ""))
        .map((q: any) => {
          let opts: string[] = ["Person A", "Person B", "Person C", "Person D"];
          if (Array.isArray(q.options) && q.options.length > 0) opts = q.options;
          return {
            id: String(q.id),
            prompt: stripHtml(q.prompt),
            options: opts,
            correctAnswer: String(q.correct_answer || ""),
            explanation: q.explanation || null,
          };
        });
      if (questions.length > 0) {
        result.part3.questions = questions;
        if (p.instructions) result.part3.instructions = stripHtml(p.instructions);
        if (p.title) result.part3.title = stripHtml(p.title);
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
          explanation: q.explanation || null,
        };
      });
      if (paragraphs.length > 0) {
        result.part4.paragraphs = paragraphs;
        if (headingsSet.size > 0) {
          result.part4.allHeadings = Array.from(headingsSet);
        }
        if (p.instructions) result.part4.instructions = stripHtml(p.instructions);
        result.part4.title = stripHtml(p.passage_text || p.title || "Long reading");
      }
    }
  });

  return result;
}
