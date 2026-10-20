"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { DEFAULT_GRAMMAR_QUESTIONS, Question } from "@/data/grammar-benchmark";
import {
  SpellCheck,
  BookA,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
} from "lucide-react";

function GrammarMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "grammar";

  const [currentTab, setCurrentTab] = useState<"grammar" | "vocab">(
    initialPart === "vocab" ? "vocab" : "grammar"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showExplanations, setShowExplanations] = useState<Record<string, boolean>>({});

  // Filter questions based on currentTab & search
  const filteredQuestions = useMemo(() => {
    return DEFAULT_GRAMMAR_QUESTIONS.filter((q) => {
      const matchType = currentTab === "grammar" ? q.type === "grammar" : q.type === "vocabulary";
      if (!matchType) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.prompt.toLowerCase().includes(term) ||
        q.options.some((opt) => opt.toLowerCase().includes(term)) ||
        (q.explanation && q.explanation.toLowerCase().includes(term))
      );
    });
  }, [currentTab, searchTerm]);

  const handleSelectOption = (qId: string | number, optIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [String(qId)]: optIdx }));
  };

  const handleCheckQuestion = (qId: string | number) => {
    setShowResults((prev) => ({ ...prev, [String(qId)]: !prev[String(qId)] }));
  };

  const handleResetAll = () => {
    setSelectedAnswers({});
    setShowResults({});
    setShowExplanations({});
  };

  // Score calculation
  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = filteredQuestions.filter(
    (q) => selectedAnswers[String(q.id)] === q.correctAnswer
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/grammar?tab=${currentTab}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Grammar &amp; Vocab
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                    Ngân Hàng 50 Câu Trắc Nghiệm Có Giải Thích
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Ngữ Pháp &amp; Từ Vựng Aptis
                </h1>
              </div>
            </div>

            {/* Quick search & reset */}
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm câu hỏi, cấu trúc..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="Làm lại tất cả"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Switcher Tabs */}
          <div className="grid grid-cols-2 gap-3 mb-6 max-w-xl">
            <button
              type="button"
              onClick={() => setCurrentTab("grammar")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentTab === "grammar"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentTab === "grammar" ? "text-primary" : "text-muted-foreground"}`}>
                  Phần 1 · 25 câu
                </span>
                <SpellCheck className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-sm text-foreground truncate">
                Grammar (Ngữ pháp)
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Thì, câu điều kiện, bị động, đảo ngữ
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCurrentTab("vocab")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentTab === "vocab"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentTab === "vocab" ? "text-primary" : "text-muted-foreground"}`}>
                  Phần 2 · 25 câu
                </span>
                <BookA className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-sm text-foreground truncate">
                Vocabulary (Từ vựng)
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                Đồng nghĩa, Collocation, Word match
              </p>
            </button>
          </div>

          {/* Banner Info */}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-6">
            <div>
              <h3 className="font-heading font-black text-foreground text-sm">
                {currentTab === "grammar"
                  ? "Ngân Hàng Trắc Nghiệm Ngữ Pháp Aptis ESOL B1–C"
                  : "Ngân Hàng Từ Vựng & Cụm Từ Cố Định (Collocations) B1–C"}
              </h3>
              <p className="text-muted-foreground mt-0.5">
                Bấm vào từng lựa chọn A, B, C để làm bài. Hệ thống kiểm tra tức thì và hiển thị giải thích chi tiết cấu trúc ngữ pháp tương ứng.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
              <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary">
                Đúng: {correctCount}/{filteredQuestions.length} câu
              </span>
            </div>
          </div>

          {/* Question List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredQuestions.map((q, qIndex) => {
              const qKey = String(q.id);
              const userChoice = selectedAnswers[qKey];
              const isChecked = showResults[qKey] || userChoice !== undefined;
              const isCorrect = userChoice === q.correctAnswer;
              const explanationOpen = showExplanations[qKey] || isChecked;

              return (
                <div key={qKey} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                          {qIndex + 1}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground">
                          {q.part}
                        </span>
                      </div>

                      {isChecked && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            isCorrect
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                          }`}
                        >
                          {isCorrect ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{isCorrect ? "Chính xác" : "Chưa đúng"}</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm font-heading font-extrabold text-foreground leading-relaxed">
                      {q.prompt}
                    </div>

                    {/* Options A, B, C */}
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = userChoice === optIdx;
                        let optStyle = "border-border bg-muted/20 hover:bg-muted text-foreground";

                        if (isChecked) {
                          if (optIdx === q.correctAnswer) {
                            optStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-950 dark:text-emerald-200 font-bold";
                          } else if (isSelected) {
                            optStyle = "border-rose-500 bg-rose-500/15 text-rose-950 dark:text-rose-200";
                          }
                        } else if (isSelected) {
                          optStyle = "border-primary bg-primary/10 text-primary font-bold";
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qKey, optIdx)}
                            className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${optStyle}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isChecked && optIdx === q.correctAnswer && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation Toggle */}
                  <div className="pt-2 border-t border-border/40 space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowExplanations((prev) => ({ ...prev, [qKey]: !prev[qKey] }))}
                      className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{explanationOpen ? "Ẩn giải thích" : "Xem giải thích ngữ pháp"}</span>
                    </button>

                    {explanationOpen && q.explanation && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/70 text-xs text-muted-foreground leading-relaxed animate-fadeIn">
                        <strong className="text-foreground">Giải thích chi tiết:</strong> {q.explanation}
                      </div>
                    )}
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

export default function GrammarMarathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <GrammarMarathonContent />
    </Suspense>
  );
}
