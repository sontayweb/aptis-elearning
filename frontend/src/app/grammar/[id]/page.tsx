"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { ExamExitConfirmModal } from "@/components/exam-exit-confirm-modal";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Send,
  Flag,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Menu,
  Info,
  LogOut,
  X,
  Award,
  Eye,
  Loader2,
  Check,
} from "lucide-react";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";
import { type Question } from "@/data/grammar-benchmark";

function GrammarExamRunnerContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = (params.id as string) || "";
  const submissionIdParam = searchParams.get("submissionId") || "";
  const modeParam = searchParams.get("mode") || "";
  const isReviewUrl = modeParam === "review" && Boolean(submissionIdParam);

  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState<string>("Grammar & Vocabulary");
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Review mode filter state
  const [onlyShowWrong, setOnlyShowWrong] = useState(false);
  const [reviewFilterTab, setReviewFilterTab] = useState<"all" | "grammar" | "vocabulary">("all");

  const isStartingSubmissionRef = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

  // 1. Tải dữ liệu đề thi từ Database
  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      if (res.success && res.data && res.data.parts?.length > 0) {
        setExamTitle(res.data.title || "Grammar & Vocabulary");
        const mins = res.data.duration_minutes || 25;
        setDurationMinutes(mins);
        setTimeLeft(mins * 60);

        const parts = res.data.parts || [];
        const loadedQuestions: Question[] = [];

        parts.forEach((p: any) => {
          (p.questions || []).forEach((q: any) => {
            let parsedOpts: string[] = [];
            if (Array.isArray(q.options)) {
              parsedOpts = q.options;
            } else if (typeof q.options === "string") {
              try {
                parsedOpts = JSON.parse(q.options);
              } catch {
                parsedOpts = [];
              }
            }

            let corIdx: number | undefined = undefined;
            if (q.correct_answer !== undefined && q.correct_answer !== null) {
              const corStr = String(q.correct_answer).trim();
              const matchIdx = parsedOpts.findIndex(
                (opt) => opt.trim().toLowerCase() === corStr.toLowerCase()
              );
              if (matchIdx >= 0) {
                corIdx = matchIdx;
              } else if (/^[A-D]$/i.test(corStr)) {
                corIdx = corStr.toUpperCase().charCodeAt(0) - 65;
              } else if (!isNaN(Number(corStr)) && Number(corStr) >= 0 && Number(corStr) < parsedOpts.length) {
                corIdx = Number(corStr);
              }
            }

            loadedQuestions.push({
              id: q.id,
              part: p.title || `Phần ${p.part_number}`,
              type: p.title?.toLowerCase().includes("vocab") ? "vocabulary" : "grammar",
              prompt: q.prompt,
              options: parsedOpts,
              correctAnswer: corIdx,
              explanation: q.explanation,
            });
          });
        });

        if (loadedQuestions.length > 0) {
          setQuestions(loadedQuestions);
          setCurrentIndex(0);
        } else {
          setError("Bộ đề này hiện chưa có câu hỏi nào được cập nhật.");
        }
      } else {
        setError(res?.message || "Không thể tải danh sách câu hỏi cho đề thi này.");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi tải đề thi. Vui lòng kiểm tra lại đường truyền.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  // Cuộn pill câu hỏi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`grammar-question-pill-${currentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentIndex]);

  // Bộ đếm thời gian làm bài
  useEffect(() => {
    if (isSubmitted || isReviewMode || loading || error || questions.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, isReviewMode, loading, error, questions.length]);

  // Phục hồi bản nháp trắc nghiệm từ LocalStorage
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted || isReviewUrl) return;
    try {
      const raw = localStorage.getItem(`aptis_draft_grammar_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.selectedAnswers && Object.keys(draft.selectedAnswers).length > 0) {
          setSelectedAnswers((prev) => ({ ...draft.selectedAnswers, ...prev }));
        }
      }
    } catch {}
  }, [examId, isSubmitted, isReviewUrl]);

  // Cảnh báo beforeunload chống vô tình F5/thoát trang khi đang làm bài
  useEffect(() => {
    if (isSubmitted || isReviewMode) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Grammar & Vocabulary. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted, isReviewMode]);

  // Debounced Autosave lên máy chủ
  const performAutosave = useCallback(
    async (answersToSave: Record<number, number>) => {
      if (!submissionId || isSubmitted || isReviewMode) return;
      const formatted = Object.entries(answersToSave)
        .map(([qIdx, optIdx]) => {
          const q = questions[Number(qIdx)];
          const optText =
            q?.options && q.options[optIdx]
              ? q.options[optIdx]
              : String.fromCharCode(65 + optIdx);
          return {
            questionId: String(q?.id || ""),
            selectedOption: optText,
          };
        })
        .filter((a) => a.questionId);

      if (formatted.length === 0) return;

      try {
        setSyncStatus("saving");
        await api.submissions.autosave(submissionId, formatted);
        setSyncStatus("saved");
        setLastSavedAt(new Date());
      } catch (err) {
        console.warn("Grammar autosave warning:", err);
        setSyncStatus("error");
      }
    },
    [submissionId, isSubmitted, isReviewMode, questions]
  );

  const scheduleAutosave = useCallback(
    (answersToSave: Record<number, number>) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        performAutosave(answersToSave);
      }, 2500);
    },
    [performAutosave]
  );

  // Khởi tạo phiên thi trên Server hoặc Nạp bài cũ để Xem lại (Review Mode)
  useEffect(() => {
    async function initGrammarSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || questions.length === 0 || isStartingSubmissionRef.current) return;

      // NHÁNH 1: XEM LẠI TỪ LỊCH SỬ (/history) VỚI submissionId & mode=review
      if (isReviewUrl && submissionIdParam) {
        isStartingSubmissionRef.current = true;
        try {
          setLoading(true);
          const res = await api.submissions.getResult(submissionIdParam);
          if (res.success && res.data) {
            const sub = res.data;
            setSubmissionId(submissionIdParam);
            setIsSubmitted(true);
            setIsReviewMode(true);

            // Phục hồi câu trả lời của thí sinh
            const loadedSel: Record<number, number> = {};
            (sub.answers || []).forEach((ans: any) => {
              const qIdx = questions.findIndex(
                (q) => String(q.id) === String(ans.question_id || ans.questionId)
              );
              if (qIdx >= 0) {
                const optText = ans.selected_option || ans.selectedOption;
                if (optText) {
                  const cleanOpt = String(optText).trim();
                  const q = questions[qIdx];
                  const matchIdx = q.options.findIndex(
                    (o) => o.trim().toLowerCase() === cleanOpt.toLowerCase()
                  );
                  if (matchIdx >= 0) {
                    loadedSel[qIdx] = matchIdx;
                  } else if (/^[A-D]$/i.test(cleanOpt)) {
                    loadedSel[qIdx] = cleanOpt.toUpperCase().charCodeAt(0) - 65;
                  }
                }
              }
            });
            if (Object.keys(loadedSel).length > 0) {
              setSelectedAnswers(loadedSel);
            }
          }
        } catch (err) {
          console.error("Lỗi nạp bài thi Grammar cũ:", err);
        } finally {
          setLoading(false);
        }
        return;
      }

      // NHÁNH 2: BẮT ĐẦU HOẶC TIẾP TỤC PHIÊN THI
      if (submissionId) return;
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
            setIsResumedSession(true);
            setSyncStatus("resumed");
            setTimeout(() => setSyncStatus("idle"), 4000);

            if (subData.savedAnswers && typeof subData.savedAnswers === "object") {
              const loadedSel: Record<number, number> = {};
              Object.entries(subData.savedAnswers).forEach(([qId, ans]: [string, any]) => {
                const qIdx = questions.findIndex((q) => q.id === qId);
                if (qIdx >= 0 && ans.selectedOption) {
                  const optChar = ans.selectedOption.trim().toUpperCase();
                  const optIdx = optChar.charCodeAt(0) - 65;
                  if (optIdx >= 0) loadedSel[qIdx] = optIdx;
                }
              });
              if (Object.keys(loadedSel).length > 0) {
                setSelectedAnswers((prev) => ({ ...loadedSel, ...prev }));
              }
            }
          }
        }
      } catch (err) {
        console.warn("Grammar offline mode:", err);
      }
    }
    initGrammarSubmission();
  }, [examId, questions.length, isReviewUrl, submissionIdParam]);

  const currentQ = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted || isReviewMode) return;
    setSelectedAnswers((prev) => {
      const updated = {
        ...prev,
        [currentIndex]: optionIndex,
      };
      scheduleAutosave(updated);
      try {
        localStorage.setItem(
          `aptis_draft_grammar_${examId}`,
          JSON.stringify({
            selectedAnswers: updated,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
      return updated;
    });
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  const handleSubmitExam = async () => {
    setIsSubmitModalOpen(false);
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    if (typeof window !== "undefined" && examId) {
      try {
        localStorage.removeItem(`aptis_draft_grammar_${examId}`);
      } catch {}
    }
    if (submissionId) {
      try {
        const formatted = Object.entries(selectedAnswers)
          .map(([qIdx, optIdx]) => {
            const q = questions[Number(qIdx)];
            const optText =
              q?.options && q.options[optIdx]
                ? q.options[optIdx]
                : String.fromCharCode(65 + optIdx);
            return {
              questionId: String(q?.id || ""),
              selectedOption: optText,
            };
          })
          .filter((a) => a.questionId);
        if (formatted.length > 0) {
          await api.submissions.autosave(submissionId, formatted);
        }
        await api.submissions.submit(submissionId);
      } catch (err) {
        console.error("Grammar submit error:", err);
      }
    }
    setIsSubmitted(true);
    setIsReviewMode(true);
  };

  // Làm lại bài thi mới (forceNew = true)
  const handleRestartExam = async () => {
    try {
      setIsRestarting(true);
      await api.submissions.start(examId, true);
      router.push(`/grammar/${examId}`);
      router.refresh();
    } catch (err) {
      console.error("Lỗi khi tạo lượt thi Grammar mới:", err);
      router.push(`/grammar/${examId}`);
    } finally {
      setIsRestarting(false);
    }
  };

  // Tính điểm và thống kê đúng/sai
  const correctCount = useMemo(() => {
    return questions.reduce((acc, q, idx) => {
      const chosen = selectedAnswers[idx];
      return chosen !== undefined && q.correctAnswer !== undefined && chosen === q.correctAnswer
        ? acc + 1
        : acc;
    }, 0);
  }, [questions, selectedAnswers]);

  const score50 = questions.length > 0 ? Math.round((correctCount / questions.length) * 50) : 0;
  const cefrLevel =
    score50 >= 45 ? "C" : score50 >= 38 ? "B2" : score50 >= 30 ? "B1" : score50 >= 20 ? "A2" : "A1";

  // Phân loại danh sách câu hỏi cho Bộ lọc Xem lại
  const grammarQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "grammar").length,
    [questions]
  );
  const vocabQuestionsCount = useMemo(
    () => questions.filter((q) => q.type === "vocabulary").length,
    [questions]
  );

  return (
    <div className="notranslate exam-active exam-mode min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      {/* 0. Top progress bar */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{
            width: `${
              questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 100
            }%`,
          }}
        />
      </div>

      {/* 1. TOP HEADER */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (isSubmitted || isReviewMode) {
                  router.push("/grammar");
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">
                GRAMMAR &amp; VOCABULARY PRACTICE
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {examTitle}
              </h1>
            </div>
          </div>

          {/* Right Header: Review status & Countdown Timer */}
          <div className="flex items-center gap-2.5">
            {isReviewMode ? (
              <>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 font-bold text-xs">
                  <Eye className="w-3.5 h-3.5" />
                  Xem lại bài thi
                </span>
                <span className="px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono font-bold text-xs">
                  {score50}/50 điểm ({cefrLevel})
                </span>
                <button
                  type="button"
                  onClick={handleRestartExam}
                  disabled={isRestarting}
                  className="tech-btn px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isRestarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Làm lại đề mới</span>
                </button>
              </>
            ) : (
              <>
                <ExamSyncStatus
                  status={syncStatus}
                  lastSavedAt={lastSavedAt}
                  isResumed={isResumedSession}
                />
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border font-mono text-xs font-bold transition-all ${
                    timeLeft < 300 && !isSubmitted
                      ? "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 animate-pulse"
                      : "bg-primary/10 border-primary/20 text-primary"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{isSubmitted ? "Đã nộp bài" : formatTime(timeLeft)}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground hidden sm:inline mr-1">
                  {answeredCount}/{questions.length} câu
                </span>
              </>
            )}

            <button
              type="button"
              onClick={() => {
                if (isSubmitted || isReviewMode) {
                  router.push("/grammar");
                } else {
                  setShowExitConfirm(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              title="Thoát về danh sách đề"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && !isReviewMode && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={answeredCount}
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-28">
        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse max-w-2xl mx-auto">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">
              Đang tải đề thi Grammar &amp; Vocabulary...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-8 text-center rounded-2xl border border-destructive/30 bg-destructive/10 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h2 className="font-heading font-bold text-base text-foreground mb-1">
              Không thể tải đề thi
            </h2>
            <p className="text-xs text-muted-foreground mb-4">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/grammar"
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
              >
                Quay lại danh sách
              </Link>
              <button
                type="button"
                onClick={loadExamData}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          </div>
        )}

        {/* NHÁNH A: CHẾ ĐỘ XEM LẠI BÀI THI (REVIEW MODE) - 2 CỘT CHUẨN DESIGN SYSTEM */}
        {!loading && !error && isReviewMode && currentQ && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* CỘT TRÁI (8 cols): Chi tiết câu hỏi và đáp án đối chiếu */}
            <div className="lg:col-span-8 space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
                {/* Header câu hỏi review */}
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                      {currentQ.part}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      Câu {currentIndex + 1} / {questions.length}
                    </span>
                  </div>

                  {/* Trạng thái đúng/sai của câu hiện tại */}
                  {(() => {
                    const chosen = selectedAnswers[currentIndex];
                    const isCorrect =
                      chosen !== undefined &&
                      currentQ.correctAnswer !== undefined &&
                      chosen === currentQ.correctAnswer;
                    if (chosen === undefined) {
                      return (
                        <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                          Chưa làm
                        </span>
                      );
                    }
                    return isCorrect ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đúng (+1)
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Sai
                      </span>
                    );
                  })()}
                </div>

                {/* Prompt */}
                <div className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                  {currentQ.prompt}
                </div>

                {/* Options đối chiếu */}
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIdx) => {
                    const isUserSelected = selectedAnswers[currentIndex] === optIdx;
                    const isCorrectOption = currentQ.correctAnswer === optIdx;

                    let optionBorder = "border-border bg-card/60 text-foreground";
                    let badge = null;

                    if (isCorrectOption) {
                      optionBorder =
                        "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold shadow-xs";
                      badge = (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Đáp án đúng
                        </span>
                      );
                    } else if (isUserSelected && !isCorrectOption) {
                      optionBorder =
                        "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 font-semibold shadow-xs";
                      badge = (
                        <span className="text-[11px] font-bold text-red-600 dark:text-red-400 bg-red-500/15 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Bạn đã chọn
                        </span>
                      );
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${optionBorder}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg border border-border/80 flex items-center justify-center font-bold text-xs shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="text-sm md:text-base">{opt}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Giải thích chi tiết */}
                <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Giải thích chi tiết &amp; Kiến thức cần nhớ</span>
                  </div>
                  {currentQ.explanation ? (
                    <p className="text-xs md:text-sm text-foreground/90 leading-relaxed">
                      {currentQ.explanation}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Giải thích ngữ pháp &amp; ngữ nghĩa đang được chuyên gia học thuật hoàn thiện.
                    </p>
                  )}
                </div>

                {/* Navigation nút chuyển câu trong Review Mode */}
                <div className="flex items-center justify-between pt-4 border-t border-border/60">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    ← Câu trước
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsReviewMode(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    Xem lại Báo cáo tổng quan
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    Câu tiếp theo →
                  </button>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI (4 cols): Sticky Right Review Panel ("Mục lục xem lại") */}
            <aside className="lg:col-span-4">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4 sticky top-20">
                {/* Header */}
                <div className="border-b border-border pb-3">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>Mục lục xem lại</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {score50}/50 điểm
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {correctCount} đúng
                      </span>
                      <span>•</span>
                      <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {questions.length - correctCount} sai
                      </span>
                    </div>
                    <span className="font-bold text-accent">Band {cefrLevel}</span>
                  </div>
                </div>

                {/* Filter Checkbox */}
                <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border/60">
                  <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyShowWrong}
                      onChange={(e) => setOnlyShowWrong(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                    />
                    <span>Chỉ hiện câu sai</span>
                  </label>
                  {onlyShowWrong && (
                    <span className="text-[11px] text-red-600 dark:text-red-400 font-bold">
                      {questions.length - correctCount} câu
                    </span>
                  )}
                </div>

                {/* Filter Tabs (Tất cả / Ngữ pháp / Từ vựng) */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-xs">
                  {[
                    { id: "all", label: `Tất cả (${questions.length})` },
                    { id: "grammar", label: `Ngữ pháp (${grammarQuestionsCount})` },
                    { id: "vocabulary", label: `Từ vựng (${vocabQuestionsCount})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setReviewFilterTab(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-colors cursor-pointer ${
                        reviewFilterTab === tab.id
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "bg-muted hover:bg-muted/80 text-muted-foreground"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Question Grid Pills */}
                <div className="grid grid-cols-5 gap-2 max-h-[46vh] overflow-y-auto p-1">
                  {questions
                    .map((q, idx) => {
                      const chosen = selectedAnswers[idx];
                      const isCorrect =
                        chosen !== undefined &&
                        q.correctAnswer !== undefined &&
                        chosen === q.correctAnswer;
                      return { q, idx, isCorrect, isAnswered: chosen !== undefined };
                    })
                    .filter(({ q, isCorrect }) => {
                      if (reviewFilterTab !== "all" && q.type !== reviewFilterTab) return false;
                      if (onlyShowWrong && isCorrect) return false;
                      return true;
                    })
                    .map(({ idx, isCorrect, isAnswered }) => {
                      const isCurrent = currentIndex === idx;
                      let colorClass =
                        "bg-red-500/15 border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/25";
                      if (isCorrect) {
                        colorClass =
                          "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25";
                      } else if (!isAnswered) {
                        colorClass = "bg-muted border-border text-muted-foreground hover:bg-muted/80";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`relative h-9 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${colorClass} ${
                            isCurrent
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105"
                              : ""
                          }`}
                          title={`Câu ${idx + 1}: ${isCorrect ? "Đúng" : isAnswered ? "Sai" : "Chưa làm"}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={handleRestartExam}
                    disabled={isRestarting}
                    className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isRestarting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>Làm lại đề mới</span>
                  </button>

                  <Link
                    href="/grammar"
                    className="w-full py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs text-foreground transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Danh sách đề</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* NHÁNH B: BẢNG BÁO CÁO KẾT QUẢ TỔNG QUAN (KHI SUBMIT XONG & CHƯA BẬT REVIEW MODE) */}
        {!loading && !error && isSubmitted && !isReviewMode && (
          <div className="space-y-6 animate-in zoom-in-95 max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-md text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Kết Quả Kỹ Năng Grammar &amp; Vocabulary
                </span>
                <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground mt-1">
                  BÁO CÁO ĐIỂM NGỮ PHÁP &amp; TỪ VỰNG
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Mã đề: {examId.toUpperCase()} · Đã làm: {answeredCount}/{questions.length} câu
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/30 max-w-sm mx-auto">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Đánh giá theo khung CEFR
                </span>
                <div className="text-5xl font-heading font-black text-primary my-1">{cefrLevel}</div>
                <p className="text-sm font-bold text-foreground">
                  Điểm số: <span className="text-primary">{score50}</span> / 50 ({correctCount}/
                  {questions.length} câu đúng)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/grammar"
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  ← Thoát về danh sách
                </Link>

                <button
                  type="button"
                  onClick={() => setIsReviewMode(true)}
                  className="px-4 py-2.5 rounded-xl border border-primary text-primary hover:bg-primary/10 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem đáp án chi tiết &amp; Mục lục</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestartExam}
                  disabled={isRestarting}
                  className="tech-btn px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isRestarting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3.5 h-3.5" />
                  )}
                  <span>Làm lại đề mới</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NHÁNH C: PHÒNG THI ĐANG LÀM BÀI (EXAM WORKSPACE) */}
        {!loading && !error && currentQ && !isSubmitted && !isReviewMode && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6 max-w-4xl mx-auto">
            {/* Question Meta */}
            <div className="flex items-center justify-between pb-4 border-b border-border/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                  {currentQ.part}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  Câu {currentIndex + 1} / {questions.length}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleFlag}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  flagged[currentIndex]
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentIndex] ? "Đã gắn cờ" : "Gắn cờ"}</span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="text-base md:text-lg font-medium text-foreground leading-relaxed">
              {currentQ.prompt}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[currentIndex] === optIdx;
                let optionStyle =
                  "border-border bg-card hover:border-primary/50 hover:bg-muted/30 text-foreground";

                if (isSelected) {
                  optionStyle =
                    "border-primary bg-primary/10 text-primary font-semibold shadow-sm";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    disabled={isSubmitted}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg border border-border/80 flex items-center justify-center font-bold text-xs">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm md:text-base">{opt}</span>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* 4. FIXED BOTTOM BAR KHI ĐANG LÀM BÀI */}
      {!isSubmitted && !isReviewMode && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border py-2.5 px-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Báo lỗi & Thông tin */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Báo cáo lỗi câu hỏi"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Báo lỗi</span>
              </button>
            </div>

            {/* Center: Question pills carousel + Drawer trigger + ArrowUp */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="bg-muted/40 dark:bg-slate-800/60 p-1 rounded-2xl border border-border/80 shadow-2xs flex items-center gap-1 backdrop-blur-sm">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scrollbar-none scroll-smooth max-w-[200px] sm:max-w-xs md:max-w-md py-0.5 px-0.5">
                  {questions.map((q, idx) => {
                    const isCurrent = currentIndex === idx;
                    const isAnswered = selectedAnswers[idx] !== undefined;

                    return (
                      <button
                        key={q.id || idx}
                        id={`grammar-question-pill-${idx}`}
                        type="button"
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold shrink-0 flex items-center justify-center transition-all duration-150 cursor-pointer select-none ${
                          isCurrent
                            ? "bg-primary text-primary-foreground font-black shadow-sm border border-primary"
                            : isAnswered
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/35 hover:bg-emerald-500/25"
                            : "bg-background/80 dark:bg-slate-900/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 hover:border-border"
                        }`}
                        title={`Câu ${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="h-4 w-px bg-border/70 shrink-0 mx-0.5 hidden sm:block" />

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center bg-background/80 dark:bg-slate-900/60 hover:bg-primary/10 hover:text-primary text-muted-foreground border border-border/70 hover:border-primary/30 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-2xs shrink-0"
                  title="Danh sách tất cả câu hỏi"
                  aria-label="Danh sách tất cả câu hỏi"
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
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted disabled:opacity-40 transition-colors cursor-pointer"
              >
                ← Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                  className="tech-btn px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="tech-btn px-5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Nộp bài
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* MODAL BÁO LỖI */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span>Báo lỗi câu {currentIndex + 1}</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowReportModal(false);
                  setReportSent(false);
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSent ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="text-sm font-bold text-foreground">Cảm ơn bạn đã phản hồi!</p>
                <p className="text-xs text-muted-foreground">
                  Đội ngũ học thuật sẽ đối soát và cập nhật lại câu hỏi sớm nhất.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportSent(false);
                    setReportText("");
                  }}
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold cursor-pointer"
                >
                  Xong
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Vui lòng mô tả vấn đề bạn gặp phải với câu hỏi này (sai chính tả, sai đáp án, v.v.):
                </p>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  placeholder="Mô tả chi tiết nội dung cần chỉnh sửa..."
                  className="w-full h-28 p-3 rounded-xl border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (reportText.trim()) setReportSent(true);
                    }}
                    disabled={!reportText.trim()}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi báo lỗi</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DRAWER DANH SÁCH CÂU HỎI */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-heading font-bold text-xs uppercase text-muted-foreground tracking-wider">
                Danh sách câu hỏi ({questions.length} câu)
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 p-1">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIndex === idx;
                const isFlg = flagged[idx];

                let paletteStyle = "bg-muted/40 border-border text-foreground hover:border-primary/40";
                if (isCurrent) {
                  paletteStyle =
                    "border-primary bg-primary text-primary-foreground font-bold shadow-sm";
                } else if (isAnswered) {
                  paletteStyle =
                    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold";
                }

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsDrawerOpen(false);
                    }}
                    className={`relative h-10 rounded-lg border text-xs flex items-center justify-center transition-all cursor-pointer ${paletteStyle}`}
                  >
                    {idx + 1}
                    {isFlg && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-background" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-muted border border-border" />
                <span>Chưa làm ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN NỘP BÀI */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-foreground">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bạn đã hoàn thành{" "}
              <strong className="text-primary font-black">
                {answeredCount}/{questions.length}
              </strong>{" "}
              câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập báo cáo kết quả.
            </p>
            {answeredCount < questions.length && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Lưu ý: Bạn vẫn còn {questions.length - answeredCount} câu chưa trả lời!</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border text-foreground text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown transition-colors shadow-sm cursor-pointer"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      <ExamExitConfirmModal
        isOpen={showExitConfirm}
        title="Rời khỏi bài thi Grammar?"
        message="Bạn đang trong quá trình làm bài thi Ngữ pháp & Từ vựng. Nếu quay lại lúc này, bài thi chưa nộp sẽ không được lưu điểm. Bạn có chắc chắn muốn rời khỏi không?"
        confirmText="Xác nhận rời khỏi"
        cancelText="Tiếp tục làm bài"
        onConfirm={() => {
          setShowExitConfirm(false);
          router.push("/grammar");
        }}
        onCancel={() => setShowExitConfirm(false)}
      />
    </div>
  );
}

export default function GrammarExamRunner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-muted-foreground">
              Đang tải phòng thi Grammar &amp; Vocabulary...
            </p>
          </div>
        </div>
      }
    >
      <GrammarExamRunnerContent />
    </Suspense>
  );
}
