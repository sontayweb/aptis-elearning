"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
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
} from "lucide-react";
import { ExamSyncStatus, ExamRecoveryBanner } from "@/components/exam-sync-status";

import {
  type Question,
} from "@/data/grammar-benchmark";

export default function GrammarExamRunner() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [examTitle, setExamTitle] = useState<string>("Grammar & Vocabulary");
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved" | "error" | "resumed">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isResumedSession, setIsResumedSession] = useState(false);
  const [resumedBannerDismissed, setResumedBannerDismissed] = useState(false);

  // Modals state
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [showSampleAnswers, setShowSampleAnswers] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [reportSent, setReportSent] = useState(false);

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

  // Tự động cuộn pill câu hỏi đang chọn vào giữa thanh điều hướng
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`grammar-question-pill-${currentIndex}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isSubmitted || loading || error || questions.length === 0) return;
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
  }, [isSubmitted, loading, error, questions.length]);

  // 1. Phục hồi bản nháp trắc nghiệm từ LocalStorage khi nạp câu hỏi
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted) return;
    try {
      const raw = localStorage.getItem(`aptis_draft_grammar_${examId}`);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.selectedAnswers && Object.keys(draft.selectedAnswers).length > 0) {
          setSelectedAnswers((prev) => ({ ...draft.selectedAnswers, ...prev }));
        }
      }
    } catch {}
  }, [examId, isSubmitted]);

  // 2. Tự động ghi bản nháp vào LocalStorage khi chọn đáp án
  useEffect(() => {
    if (typeof window === "undefined" || !examId || isSubmitted) return;
    if (Object.keys(selectedAnswers).length > 0) {
      try {
        localStorage.setItem(
          `aptis_draft_grammar_${examId}`,
          JSON.stringify({
            selectedAnswers,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {}
    }
  }, [selectedAnswers, examId, isSubmitted]);

  // 3. Cảnh báo beforeunload chống vô tình F5/thoát trang khi đang làm bài
  useEffect(() => {
    if (isSubmitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Bạn đang làm bài thi Grammar & Vocabulary. Rời khỏi trang có thể làm gián đoạn bài làm!";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitted]);

  // 4. Khởi tạo / Khôi phục phiên thi trên máy chủ
  useEffect(() => {
    async function initGrammarSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || questions.length === 0 || submissionId) return;
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
  }, [examId, questions.length]);

  const currentQ = questions[currentIndex];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));
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
            const optText = q?.options && q.options[optIdx] ? q.options[optIdx] : String.fromCharCode(65 + optIdx);
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
  };

  // Tính điểm
  const correctCount = questions.reduce((acc, q, idx) => {
    const chosen = selectedAnswers[idx];
    return chosen !== undefined && q.correctAnswer !== undefined && chosen === q.correctAnswer
      ? acc + 1
      : acc;
  }, 0);
  const score50 = questions.length > 0 ? Math.round((correctCount / questions.length) * 50) : 0;
  const cefrLevel =
    score50 >= 45 ? "C" : score50 >= 38 ? "B2" : score50 >= 30 ? "B1" : score50 >= 20 ? "A2" : "A1";

  return (
    <div className="notranslate exam-active exam-mode min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      {/* 0. Top thin progress bar */}
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]">
        <div
          className="h-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-500"
          style={{
            width: `${
              questions.length > 0
                ? ((currentIndex + 1) / questions.length) * 100
                : 100
            }%`,
          }}
        />
      </div>

      {/* 1. TOP HEADER (EXAM MODE) - CHUẨN HOÁ GIAO DIỆN RUNNER */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/grammar"
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
              title="Quay lại danh sách"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-primary tracking-wider uppercase block">
                GRAMMAR &amp; VOCABULARY PRACTICE
              </span>
              <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
                {examTitle}
              </h1>
            </div>
          </div>

          {/* Countdown Timer & Sync status */}
          <div className="flex items-center gap-2.5">
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
          </div>

          {/* Right Header: Progress info & Exit button */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground hidden sm:inline mr-1">
              {answeredCount}/{questions.length} câu
            </span>
            <Link
              href="/grammar"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thoát</span>
            </Link>
          </div>
        </div>
      </header>

      {isResumedSession && !resumedBannerDismissed && (
        <ExamRecoveryBanner
          remainingSeconds={timeLeft}
          answersCount={answeredCount}
          onDismiss={() => setResumedBannerDismissed(true)}
        />
      )}

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6 pb-28">
        {/* Loading State */}
        {loading && (
          <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-muted-foreground">Đang tải đề thi Grammar &amp; Vocabulary...</p>
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

        {/* Result Card Mode */}
        {!loading && isSubmitted && (
          <div className="space-y-6 animate-in zoom-in-95">
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
                  Điểm số: <span className="text-primary">{score50}</span> / 50 ({correctCount}/{questions.length} câu đúng)
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  href="/grammar"
                  className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors"
                >
                  ← Thoát về danh sách
                </Link>

                <button
                  type="button"
                  onClick={() => setShowSampleAnswers(true)}
                  className="px-4 py-2 rounded-xl border border-primary text-primary hover:bg-primary/10 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem đáp án chi tiết</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSubmitted(false);
                    setSelectedAnswers({});
                    setFlagged({});
                    setTimeLeft(durationMinutes * 60);
                    setCurrentIndex(0);
                  }}
                  className="tech-btn px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Questions Workspace */}
        {!loading && !error && currentQ && !isSubmitted && (
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm space-y-6">
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

      {/* 4. FIXED BOTTOM BAR CHUẨN RUNNER TẤT CẢ KỸ NĂNG */}
      {!isSubmitted && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border py-2.5 px-4 shadow-lg">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Hiện đáp án & Báo lỗi */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowSampleAnswers(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                title="Xem đáp án & giải thích câu hiện tại"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hiện đáp án</span>
              </button>

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

      {/* MODAL HIỆN ĐÁP ÁN & GIẢI THÍCH */}
      {showSampleAnswers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg p-6 rounded-2xl bg-card border border-border shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Đáp án &amp; Giải thích (Câu {currentIndex + 1})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSampleAnswers(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              {currentQ && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="font-semibold text-foreground text-sm">
                    {currentQ.prompt}
                  </div>
                  <div className="text-primary font-bold text-xs">
                    Đáp án đúng:{" "}
                    {currentQ.correctAnswer !== undefined && currentQ.options[currentQ.correctAnswer]
                      ? `${String.fromCharCode(65 + currentQ.correctAnswer)}. ${currentQ.options[currentQ.correctAnswer]}`
                      : "Chưa công bố"}
                  </div>
                  {currentQ.explanation ? (
                    <div className="text-muted-foreground leading-relaxed pt-1 border-t border-border/40">
                      <strong>Giải thích:</strong> {currentQ.explanation}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic">
                      Giải thích chi tiết đang được chuyên gia học thuật cập nhật.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
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
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
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
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
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
                    className="px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold hover:bg-muted"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (reportText.trim()) setReportSent(true);
                    }}
                    disabled={!reportText.trim()}
                    className="px-4 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
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
                  paletteStyle = "border-primary bg-primary text-primary-foreground font-bold shadow-sm";
                } else if (isAnswered) {
                  paletteStyle = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold";
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

      {/* MODAL THÔNG TIN BÀI THI */}
      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsInfoOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h4 className="font-bold text-sm text-foreground">Thông tin bài thi</h4>
              <button
                type="button"
                onClick={() => setIsInfoOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-foreground">
              {[
                { l: "Tên bài thi", v: examTitle },
                { l: "Kỹ năng", v: "Grammar & Vocabulary Aptis ESOL" },
                { l: "Thời lượng", v: `${durationMinutes} phút` },
                { l: "Tổng số câu", v: `${questions.length} câu` },
                { l: "Đã làm", v: `${answeredCount}/${questions.length} câu` },
                { l: "Thời gian còn lại", v: formatTime(timeLeft) },
              ].map((x) => (
                <div key={x.l} className="flex justify-between">
                  <span className="text-muted-foreground">{x.l}:</span>
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
          <div className="bg-card rounded-2xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-foreground">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{answeredCount}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập báo cáo kết quả.
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
    </div>
  );
}
