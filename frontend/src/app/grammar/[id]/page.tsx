"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
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
  const [showExplanation, setShowExplanation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

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

            loadedQuestions.push({
              id: q.id,
              part: p.title || `Phần ${p.part_number}`,
              type: p.title?.toLowerCase().includes("vocab") ? "vocabulary" : "grammar",
              prompt: q.prompt,
              options: parsedOpts,
              correctAnswer: q.correct_answer,
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
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, loading, error, questions.length]);

  // Tạo phiên thi (submission) khi vào phòng Grammar — lưu kết quả vào Database
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16 pb-12">
        <div className="section-container pt-4 md:pt-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/grammar"
                className="w-9 h-9 rounded-lg border border-border hover:bg-muted flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="font-heading font-bold text-base md:text-lg">
                  {examTitle}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {questions.length} câu hỏi · Thời gian làm bài {durationMinutes} phút
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Timer */}
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono font-bold text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatTime(timeLeft)}</span>
              </div>

              {/* Submit Button */}
              {!isSubmitted && questions.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    if (
                      answeredCount < questions.length &&
                      !confirm(
                        `Bạn mới làm ${answeredCount}/${questions.length} câu. Bạn có chắc muốn nộp bài?`
                      )
                    ) {
                      return;
                    }
                    // Gửi đáp án lên Database trước khi nộp
                    if (submissionId) {
                      try {
                        const answers = Object.entries(selectedAnswers)
                          .map(([qIdx, optIdx]) => {
                            const q = questions[Number(qIdx)];
                            return {
                              questionId: String(q?.id || ""),
                              selectedOption: String.fromCharCode(65 + optIdx),
                            };
                          })
                          .filter((a) => a.questionId);
                        if (answers.length > 0) {
                          await api.submissions.autosave(submissionId, answers);
                        }
                        await api.submissions.submit(submissionId);
                      } catch (err) {
                        console.error("Grammar submit error:", err);
                      }
                    }
                    setIsSubmitted(true);
                  }}
                  className="tech-btn inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow text-xs font-bold shadow-md transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Nộp bài</span>
                </button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center rounded-2xl border border-border bg-card animate-pulse">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-semibold text-muted-foreground">Đang tải câu hỏi từ cơ sở dữ liệu đề thi...</p>
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

          {/* Empty State */}
          {!loading && !error && questions.length === 0 && (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 max-w-lg mx-auto">
              <AlertCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h2 className="font-heading font-bold text-base text-foreground mb-1">
                Đề thi chưa có câu hỏi
              </h2>
              <p className="text-xs text-muted-foreground mb-4">
                Hiện tại chưa có dữ liệu câu hỏi nào được gán cho đề thi này trong hệ thống.
              </p>
              <Link
                href="/grammar"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold inline-block"
              >
                Chọn đề khác
              </Link>
            </div>
          )}

          {/* Exam Questions Workspace */}
          {!loading && !error && currentQ && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left 3 cols: Question Area */}
              <div className="lg:col-span-3 space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  {/* Question Meta */}
                  <div className="flex items-center justify-between pb-4 border-b border-border/60 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md">
                        {currentQ.part}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Câu {currentIndex + 1} / {questions.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={toggleFlag}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                        flagged[currentIndex]
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>{flagged[currentIndex] ? "Đã gắn cờ" : "Gắn cờ"}</span>
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div className="text-base md:text-lg font-medium text-foreground mb-8 leading-relaxed">
                    {currentQ.prompt}
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
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
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${optionStyle}`}
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

                  {/* Question Navigation Footer */}
                  <div className="flex items-center justify-between pt-5 border-t border-border/60">
                    <button
                      type="button"
                      disabled={currentIndex === 0}
                      onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Câu trước</span>
                    </button>

                    <button
                      type="button"
                      disabled={currentIndex === questions.length - 1}
                      onClick={() =>
                        setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow disabled:opacity-40 transition-colors"
                    >
                      <span>Câu tiếp theo</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Right 1 col: Question Palette */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading font-bold text-sm text-foreground mb-3">
                    Danh sách câu hỏi
                  </h3>
                  <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto p-1">
                    {questions.map((q, idx) => {
                      const isAnswered = selectedAnswers[idx] !== undefined;
                      const isCurrent = currentIndex === idx;
                      const isFlag = flagged[idx];

                      let paletteStyle = "bg-muted/50 text-muted-foreground border-border";
                      if (isCurrent) {
                        paletteStyle = "ring-2 ring-primary border-primary font-bold text-primary";
                      } else if (isAnswered) {
                        paletteStyle = "bg-primary text-primary-foreground border-primary font-bold";
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`relative h-10 rounded-lg border text-xs flex items-center justify-center transition-all ${paletteStyle}`}
                        >
                          {idx + 1}
                          {isFlag && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-background" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border/60 mt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-primary" />
                      <span>Đã làm ({answeredCount}/{questions.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-muted/60 border border-border" />
                      <span>Chưa làm ({questions.length - answeredCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
