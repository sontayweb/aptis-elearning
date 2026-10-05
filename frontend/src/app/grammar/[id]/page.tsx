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
} from "lucide-react";

interface Question {
  id: string | number;
  part: string;
  type: "grammar" | "vocabulary";
  prompt: string;
  options: string[];
  correctAnswer?: number;
  explanation?: string;
}

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

  // Modals state
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const loadExamData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getQuestions(examId);
      if (res.success && res.data) {
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

        setQuestions(loadedQuestions);
        setCurrentIndex(0);
      } else {
        setError(res.error?.message || "Không thể tải đề thi từ máy chủ.");
        setQuestions([]);
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối khi tải câu hỏi đề thi.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

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

  // Tạo phiên thi (submission) khi vào phòng Grammar
  useEffect(() => {
    async function initGrammarSubmission() {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token || !examId || questions.length === 0 || submissionId) return;
      try {
        const res = await api.submissions.start(examId);
        if (res.success && res.data) {
          setSubmissionId(res.data.submissionId || res.data.id);
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
    <div className="notranslate exam-active exam-mode min-h-screen bg-exam-bg text-exam-text flex flex-col font-sans select-none">
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

      {/* 1. TOP HEADER (EXAM MODE) */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-exam-surface/95 backdrop-blur border-b border-exam-border">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-bold text-exam-text truncate hidden sm:block">
              {examTitle}
            </span>
            <span className="text-[10px] text-exam-text-muted hidden md:inline">
              Grammar &amp; Vocabulary Aptis ESOL
            </span>
          </div>

          {/* Countdown Timer */}
          <div
            className={`font-mono text-base font-black px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
              timeLeft < 300 && !isSubmitted
                ? "bg-red-500/20 border-red-500 text-red-500 animate-pulse"
                : "bg-exam-bg border-exam-border text-exam-text"
            }`}
          >
            <Clock className="w-4 h-4 text-primary" />
            <span>{isSubmitted ? "Đã nộp bài" : formatTime(timeLeft)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-exam-text-muted">
              {answeredCount}/{questions.length} câu
            </span>
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 pt-16 pb-24 px-3 md:px-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
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
        </div>
      </main>

      {/* 4. FIXED BOTTOM BAR CHUẨN EXAM MODE */}
      {!isSubmitted && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-exam-surface/95 backdrop-blur border-t border-exam-border h-14">
          <div className="max-w-6xl mx-auto px-4 h-full flex items-center justify-between">
            {/* Left: Palette & Info */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
                title="Danh sách câu hỏi"
              >
                <Menu className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">Danh sách ({answeredCount}/{questions.length})</span>
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
                onClick={toggleFlag}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors cursor-pointer ${
                  flagged[currentIndex]
                    ? "border-amber-500/40 bg-amber-500/10 text-amber-600"
                    : "border-exam-border bg-exam-surface text-exam-text hover:bg-exam-border/40"
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentIndex] ? "Đã gắn cờ" : "Gắn cờ"}</span>
              </button>
            </div>

            {/* Right: Exit, Previous, Next / Submit */}
            <div className="flex items-center gap-2">
              <Link
                href="/grammar"
                title="Thoát"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-exam-surface border border-exam-border text-exam-text hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-exam-surface border border-exam-border text-exam-text text-sm font-medium hover:bg-exam-border/40 transition-colors disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (currentIndex === questions.length - 1) {
                    setIsSubmitModalOpen(true);
                  } else {
                    setCurrentIndex((p) => Math.min(questions.length - 1, p + 1));
                  }
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-brand-brown text-sm font-bold shadow-sm transition-all cursor-pointer"
              >
                <span>{currentIndex === questions.length - 1 ? "Nộp bài" : "Next"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </footer>
      )}

      {/* DRAWER DANH SÁCH CÂU HỎI */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-exam-border">
              <h3 className="font-heading font-bold text-xs uppercase text-exam-text-muted tracking-wider">
                Danh sách câu hỏi ({questions.length} câu)
              </h3>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1 rounded-lg hover:bg-exam-border/40 text-exam-text-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2 p-1">
              {questions.map((q, idx) => {
                const isAnswered = selectedAnswers[idx] !== undefined;
                const isCurrent = currentIndex === idx;
                const isFlg = flagged[idx];

                let paletteStyle = "bg-exam-surface border-exam-border text-exam-text hover:border-primary/40";
                if (isCurrent) {
                  paletteStyle = "border-primary bg-primary text-primary-foreground font-bold shadow-sm";
                } else if (isAnswered) {
                  paletteStyle = "bg-primary/15 text-primary border-primary/30 font-bold";
                }

                return (
                  <button
                    key={q.id}
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

            <div className="pt-3 border-t border-exam-border flex items-center justify-between text-xs text-exam-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-primary" />
                <span>Đã làm ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-exam-surface border border-exam-border" />
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
            className="bg-exam-surface border border-exam-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-exam-border">
              <h4 className="font-bold text-sm text-exam-text">Thông tin bài thi</h4>
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
                { l: "Kỹ năng", v: "Grammar & Vocabulary Aptis ESOL" },
                { l: "Thời lượng", v: `${durationMinutes} phút` },
                { l: "Tổng số câu", v: `${questions.length} câu` },
                { l: "Đã làm", v: `${answeredCount}/${questions.length} câu` },
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
            <h3 className="text-lg font-black text-exam-text">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-exam-text-muted leading-relaxed">
              Bạn đã hoàn thành <strong className="text-primary font-black">{answeredCount}/{questions.length}</strong> câu hỏi. Hệ thống sẽ tiến hành chấm điểm và lập báo cáo kết quả.
            </p>
            {answeredCount < questions.length && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                ⚠️ Lưu ý: Bạn vẫn còn {questions.length - answeredCount} câu chưa trả lời!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-exam-border text-exam-text text-xs font-bold hover:bg-exam-border/40 transition-colors cursor-pointer"
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
