"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  BookA,
  History,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface GrammarExam {
  id: string;
  title: string;
  questionsCount: number;
  partsCount: number;
  isFree: boolean;
  status: "not_started" | "in_progress" | "completed";
  bestScore?: string | null;
  bestScoreNumber?: number | null;
  userAttempts?: number;
}

export default function GrammarPracticePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [exams, setExams] = useState<GrammarExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Chưa có bài nào — hãy bắt đầu luyện tập!");

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "GRAMMAR_VOCABULARY", limit: 50 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            return {
              id: exam.id,
              title: exam.title,
              questionsCount: exam.totalQuestions,
              partsCount: exam.totalParts,
              isFree: !exam.isPro,
              status,
              bestScore: exam.bestScore,
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts,
            };
          })
        );
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi từ máy chủ (Vui lòng kiểm tra CSDL).");
        setExams([]);
      }
    } catch (err: any) {
      console.error("Failed to load grammar exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // Tải tiến độ Grammar của học viên
    api.submissions.getMyHistory({ skill: "GRAMMAR_VOCABULARY", limit: 50 }).then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const completed = res.data.filter((h: any) => h.status === "GRADED" || h.status === "SUBMITTED").length;
        const scores = res.data
          .filter((h: any) => h.scoreNumber && h.scoreNumber > 0)
          .map((h: any) => h.scoreNumber as number);
        const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;
        if (completed > 0) {
          setProgressText(`Đã hoàn thành ${completed} bài · Điểm trung bình: ${avg}/50`);
        }
      }
    }).catch(() => {});
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ? true : exam.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "rgba(171, 48, 232, 0.28)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -bottom-40 -left-20 opacity-70"
            style={{ width: "320px", height: "320px", background: "hsl(var(--primary) / 0.35)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookA className="w-6 h-6 text-primary" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                Grammar &amp; Vocabulary
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Luyện ngữ pháp và từ vựng thường gặp trong bài thi Aptis. Mỗi đề gồm 25 câu ngữ pháp + 25 câu từ vựng, đúng cấu trúc Aptis.
              </p>
              <Link
                className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap border dark:text-primary-foreground bg-background py-2 mt-4 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary h-9 px-4 text-sm font-medium transition-colors"
                href="/meo-thi-aptis/meo-hoc-grammar-aptis"
                data-discover="true"
              >
                💡 Xem ngay - Mẹo làm bài Grammar &amp; Vocabulary
              </Link>
            </div>
          </div>
        </section>

        {/* Progress Tracker Strip */}
        <section className="section-container pt-6 md:pt-8">
          <div className="mb-6 rounded-xl border border-border bg-card/60 px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-sm md:text-base leading-tight">
                Tiến độ học tập của bạn
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
                {progressText}
              </p>
            </div>
            <Link className="shrink-0" href="/history?skill=grammar" data-discover="true">
              <button
                type="button"
                className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-primary text-primary dark:text-primary-foreground bg-background hover:bg-primary/10 h-9 rounded-md px-3 gap-1.5 transition-colors"
              >
                <span className="hidden sm:inline">Xem lịch sử</span>
                <span className="sm:hidden">Lịch sử</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </section>

        {/* Search, Filter & Exam List */}
        <section className="section-container py-8 md:py-10">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-md border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm pl-10 h-11 bg-card"
              placeholder="Tìm kiếm bộ đề Grammar &amp; Vocabulary..."
            />
          </div>

          {/* Heading & count */}
          <div className="mb-6">
            <h2 className="text-lg font-heading font-semibold text-foreground">
              Bộ đề Grammar &amp; Vocabulary
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {exams.length} bộ đề
            </p>
          </div>

          {/* Status filters */}
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground mr-1">
              Trạng thái:
            </span>
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              Tất cả <span className="ml-1 opacity-70">({exams.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("not_started")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === "not_started"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              Chưa làm <span className="ml-1 opacity-70">({exams.filter((e) => e.status === "not_started").length})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus("completed")}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                filterStatus === "completed"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              Đã làm <span className="ml-1 opacity-70">({exams.filter((e) => e.status === "completed").length})</span>
            </button>
          </div>

          {/* Real state handling */}
          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải danh sách đề thi từ hệ thống...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Chưa thể tải dữ liệu thực tế</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadExams}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 shrink-0"
              >
                Thử lại
              </button>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
              <BookA className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-base text-foreground">Không có đề thi nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Cơ sở dữ liệu hiện tại chưa có đề thi nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {filteredExams.map((exam) => (
                <div key={exam.id}>
                  <div className="group relative tech-card bg-card border border-border rounded-xl p-5 flex flex-col h-full hover:border-primary/50 hover:shadow-glow-soft transition-all">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="inline-flex items-center rounded-full px-2.5 py-0.5 w-fit text-[11px] font-medium bg-primary/10 text-primary dark:text-accent border-0">
                        Grammar &amp; Vocab
                      </div>
                      {exam.isFree ? (
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">
                          FREE
                        </div>
                      ) : (
                        <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0">
                          PRO
                        </div>
                      )}
                    </div>

                    <h3 className="text-xl font-heading font-bold text-foreground mb-2">
                      {exam.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {exam.questionsCount} câu · {exam.partsCount} phần
                    </p>

                    <div className="mb-4 flex items-center gap-2 flex-wrap">
                      {exam.status === "completed" ? (
                        <>
                          <span className="text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Đã làm
                          </span>
                          {exam.bestScore && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                              Điểm cao nhất: {exam.bestScore}
                            </span>
                          )}
                        </>
                      ) : exam.status === "in_progress" ? (
                        <span className="text-xs font-medium bg-amber-500/15 text-amber-600 px-2.5 py-0.5 rounded-full">
                          Đang làm dở
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                          Chưa bắt đầu
                        </span>
                      )}
                    </div>

                    <div className="flex-1" />

                    <div className="flex justify-end pt-2 border-t border-border/40">
                      <Link
                        href={`/grammar/${exam.id}`}
                        className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm h-9 rounded-md px-3 text-primary hover:text-primary hover:bg-primary/10 font-semibold gap-1 group-hover:gap-2 transition-all"
                      >
                        <span>{exam.status === "completed" ? "Luyện lại" : "Luyện tập"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
