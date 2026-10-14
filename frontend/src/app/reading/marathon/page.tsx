"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  READING_PART1_SETS,
  ReadingPart1Set,
  ReadingPart1Question,
} from "@/data/reading-part1-bank";
import {
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function ReadingMarathonContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string>("all");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});

  const filteredSets = useMemo(() => {
    return READING_PART1_SETS.filter((set) => {
      if (selectedSetId !== "all" && set.id !== selectedSetId) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchTitle = set.title.toLowerCase().includes(term);
      const matchKeywords = set.keyWords.some((k) => k.toLowerCase().includes(term));
      const matchQuestions = set.questions.some(
        (q) =>
          q.prompt.toLowerCase().includes(term) ||
          q.fullSentence.toLowerCase().includes(term) ||
          (q.translation && q.translation.toLowerCase().includes(term))
      );
      return matchTitle || matchKeywords || matchQuestions;
    });
  }, [selectedSetId, searchTerm]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleCheckSet = (setId: string) => {
    setShowResults((prev) => ({ ...prev, [setId]: true }));
  };

  const handleResetSet = (setId: string) => {
    const setToReset = READING_PART1_SETS.find((s) => s.id === setId);
    if (!setToReset) return;
    setAnswers((prev) => {
      const updated = { ...prev };
      setToReset.questions.forEach((q) => delete updated[q.id]);
      return updated;
    });
    setShowResults((prev) => ({ ...prev, [setId]: false }));
  };

  const toggleTranslation = (setId: string) => {
    setShowTranslations((prev) => ({ ...prev, [setId]: !prev[setId] }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/reading"
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Reading
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Part 1 Gap Fill Chuyên Sâu
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Tổng Hợp Tất Cả Bộ Đề Reading Part 1 (Tách Câu Lẻ Rõ Ràng)
                </h1>
              </div>
            </div>
          </div>

          {/* Search & Set Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo từ khóa (window, station, market...) hoặc nội dung câu..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              />
            </div>

            <select
              value={selectedSetId}
              onChange={(e) => setSelectedSetId(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-input bg-card text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
            >
              <option value="all">Tất cả đề ({READING_PART1_SETS.length} bộ đề)</option>
              {READING_PART1_SETS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Question Sets List */}
          <div className="space-y-8">
            {filteredSets.map((set) => {
              const isChecked = Boolean(showResults[set.id]);
              const showTrans = Boolean(showTranslations[set.id]);

              // Calculate score
              let correctCount = 0;
              set.questions.forEach((q) => {
                if (answers[q.id]?.toLowerCase() === q.correctAnswer.toLowerCase()) {
                  correctCount++;
                }
              });

              return (
                <div
                  key={set.id}
                  className="rounded-2xl border-2 border-border bg-card p-5 md:p-7 shadow-xs space-y-6"
                >
                  {/* Set Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                          Part 1 · Đề 0{set.setNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 font-extrabold text-xs">
                          {set.sticker}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-heading font-extrabold text-foreground">
                        {set.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTranslation(set.id)}
                        className="px-3 py-1.5 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{showTrans ? "Ẩn dịch nghĩa" : "Xem dịch nghĩa"}</span>
                      </button>

                      {isChecked ? (
                        <button
                          type="button"
                          onClick={() => handleResetSet(set.id)}
                          className="px-3.5 py-1.5 rounded-xl border border-border bg-muted/60 text-foreground font-bold text-xs hover:bg-muted transition-all flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Làm lại</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCheckSet(set.id)}
                          className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all shadow-xs"
                        >
                          Chấm điểm đề này
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Score Alert when checked */}
                  {isChecked && (
                    <div
                      className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                        correctCount === set.questions.length
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Award className="w-5 h-5 shrink-0" />
                        <span className="font-bold text-sm">
                          Kết quả: {correctCount}/{set.questions.length} câu đúng (
                          {((correctCount / set.questions.length) * 10).toFixed(1)}/10 điểm)
                        </span>
                      </div>
                      <span className="text-xs font-semibold">
                        {correctCount === set.questions.length ? "Xuất sắc! Đạt chuẩn B2+" : "Xem lại các từ khóa màu đỏ"}
                      </span>
                    </div>
                  )}

                  {/* Individual Sentences List (Tách rời từng câu riêng biệt, không dính liền) */}
                  <div className="space-y-4">
                    {set.questions.map((q) => {
                      const userVal = answers[q.id] || "";
                      const isCorrect = userVal.toLowerCase() === q.correctAnswer.toLowerCase();
                      const parts = q.prompt.split(/\[(?:gap|blank)\]/i);

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                            isChecked
                              ? isCorrect
                                ? "border-emerald-500/40 bg-emerald-500/5"
                                : "border-rose-500/40 bg-rose-500/5"
                              : "border-border/80 bg-background hover:border-primary/40"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2.5 text-sm md:text-base leading-relaxed">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                              {q.qNumber}
                            </span>

                            <span>{parts[0]}</span>

                            {/* Gap Selector */}
                            <select
                              value={userVal}
                              disabled={isChecked}
                              onChange={(e) => handleSelectOption(q.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all cursor-pointer outline-none ${
                                isChecked
                                  ? isCorrect
                                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold"
                                    : "border-rose-500 bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold"
                                  : userVal
                                  ? "border-primary bg-primary/10 text-primary font-bold"
                                  : "border-border bg-card text-muted-foreground hover:border-primary/60"
                              }`}
                            >
                              <option value="">— Chọn từ khuyết —</option>
                              {q.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>

                            <span>{parts[1] || ""}</span>

                            {/* Correct Indicator */}
                            {isChecked && (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold">
                                {isCorrect ? (
                                  <span className="text-emerald-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Chính xác
                                  </span>
                                ) : (
                                  <span className="text-rose-600 flex items-center gap-1">
                                    <XCircle className="w-4 h-4" /> Đáp án: <u>{q.correctAnswer}</u>
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          {/* Vietnamese Translation (nếu bật) */}
                          {showTrans && q.translation && (
                            <div className="pt-2 border-t border-border/40 text-xs text-muted-foreground italic flex items-start gap-1.5">
                              <span className="font-semibold text-foreground/70 not-italic shrink-0">Dịch nghĩa:</span>
                              <span>{q.translation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}

export default function ReadingMarathonPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <ReadingMarathonContent />
    </Suspense>
  );
}
