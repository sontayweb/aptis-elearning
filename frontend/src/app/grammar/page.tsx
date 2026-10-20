"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { UniversalSkillGuideModal } from "@/components/skill-format-guide-modal";
import {
  BookA,
  History,
  Search,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  Flame,
  Star,
  Trophy,
} from "lucide-react";

interface GrammarExam {
  id: string;
  title: string;
  questionsCount: number;
  partsCount: number;
  durationMinutes: number;
  isFree: boolean;
  status: "not_started" | "in_progress" | "completed";
  bestScore?: string | null;
  bestScoreNumber?: number | null;
  userAttempts?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  hotLevel?: number;
}

export default function GrammarPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium">("all");
  const [exams, setExams] = useState<GrammarExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Chưa có bài nào — hãy bắt đầu luyện tập!");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "GRAMMAR_VOCABULARY", limit: 60 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const hotLevel = Number(exam.hotLevel ?? exam.hot_level ?? 0);
            const priority: "HIGH" | "MEDIUM" | "LOW" =
              hotLevel >= 2 ? "HIGH" : idx % 3 === 0 ? "HIGH" : idx % 3 === 1 ? "MEDIUM" : "LOW";

            return {
              id: exam.id,
              title: exam.title,
              questionsCount: exam.totalQuestions || 50,
              partsCount: exam.totalParts || 2,
              durationMinutes: exam.durationMinutes || 25,
              isFree: !exam.isPro,
              status,
              bestScore: exam.bestScore,
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts || 0,
              priority,
              hotLevel,
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

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkScroll = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab")) {
        setTimeout(() => {
          const el = document.getElementById("practice-sets-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    };

    checkScroll();

    const handleSwitchTab = () => {
      setTimeout(() => {
        const el = document.getElementById("practice-sets-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    };

    window.addEventListener("aptis:switch-skill-tab", handleSwitchTab);
    return () => {
      window.removeEventListener("aptis:switch-skill-tab", handleSwitchTab);
    };
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" ? true : exam.status === filterStatus;
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? exam.priority === "HIGH"
        : exam.priority === "MEDIUM";
    return matchesSearch && matchesFilter && matchesPriority;
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
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                    Aptis ESOL Core Component
                  </span>
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                Grammar &amp; Vocabulary Practice
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Luyện trắc nghiệm ngữ pháp và từ vựng chuẩn cấu trúc British Council. Mỗi đề gồm 25 câu ngữ pháp (Part 1) + 25 câu từ vựng (Part 2), thời gian làm bài 25 phút.
              </p>

              <div className="flex items-center gap-3 flex-wrap mt-5">
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Hướng dẫn định dạng đề thi</span>
                </button>

                <Link
                  className="inline-flex items-center gap-2 border bg-card py-2 rounded-full border-border text-foreground hover:bg-muted text-xs font-semibold px-4 transition-colors"
                  href="/meo-thi-aptis/meo-hoc-grammar-aptis"
                >
                  <span>💡 Xem ngay - Mẹo làm bài Grammar &amp; Vocabulary</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Progress Tracker Strip */}
        <section className="section-container pt-6 md:pt-8">
          <div className="mb-6 rounded-xl border border-border bg-card/60 px-4 py-3.5 md:px-5 md:py-4 flex items-center gap-3 md:gap-4 shadow-xs">
            <div className="w-10 h-10 md:w-11 md:h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <History className="w-5 h-5 text-foreground/70" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground text-sm md:text-base leading-tight">
                Tiến độ luyện tập Grammar của bạn
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5 truncate">
                {progressText}
              </p>
            </div>
            <Link className="shrink-0" href="/history?skill=grammar">
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
        <section className="section-container py-6 md:py-8">
          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-xl border border-input px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm pl-10 h-11 bg-card shadow-xs"
              placeholder="Tìm kiếm bộ đề Grammar &amp; Vocabulary..."
            />
          </div>

          {/* Heading & count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg font-heading font-bold text-foreground">
                Danh sách bộ đề Grammar &amp; Vocabulary
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hiển thị {filteredExams.length} / {exams.length} bộ đề thi
              </p>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground mr-1">
                Lọc:
              </span>
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  filterStatus === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Tất cả ({exams.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("not_started")}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  filterStatus === "not_started"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Chưa làm ({exams.filter((e) => e.status === "not_started").length})
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus("completed")}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  filterStatus === "completed"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                Đã làm ({exams.filter((e) => e.status === "completed").length})
              </button>
            </div>
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
              <h3 className="font-heading font-bold text-base text-foreground">Không có đề thi nào phù hợp</h3>
              <p className="text-xs text-muted-foreground mt-1">Vui lòng thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc.</p>
            </div>
          ) : (
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 scroll-mt-24">
              {/* CARD 1: Marathon Card */}
              <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                        ∞ Marathon
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                        PRO
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">Chưa làm</span>
                  </div>

                  <h3 className="text-lg font-heading font-extrabold text-foreground mb-2">
                    Ngân Hàng Marathon Ngữ Pháp &amp; Từ Vựng
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Luyện tập 50 câu trắc nghiệm chuyên sâu (25 câu Ngữ pháp + 25 câu Từ vựng) phân theo chủ điểm kèm giải thích chi tiết tiếng Việt.
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-border/40 grid grid-cols-2 gap-2">
                  <Link
                    href="/grammar/marathon?part=grammar"
                    className="py-2.5 px-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center cursor-pointer truncate"
                  >
                    Luyện Ngữ pháp →
                  </Link>
                  <Link
                    href="/grammar/marathon?part=vocab"
                    className="py-2.5 px-2 rounded-xl border border-primary text-primary hover:bg-primary/10 font-bold text-xs transition-colors text-center cursor-pointer truncate"
                  >
                    Luyện Từ vựng →
                  </Link>
                </div>
              </div>

              {filteredExams.map((exam) => {
                const isLocked = !exam.isFree && !isProOrAdmin;

                return (
                  <div key={exam.id} className="group relative">
                    <div className="bg-card border border-border rounded-2xl p-5 flex flex-col h-full hover:border-primary/50 hover:shadow-md transition-all">
                      {/* Card Header Tags */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                            Grammar &amp; Vocab
                          </span>

                          {exam.hotLevel && exam.hotLevel >= 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <Flame className="w-3 h-3 text-rose-500 fill-rose-500" />
                              <span>HOT</span>
                            </span>
                          ) : null}

                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground">
                            CEFR B1–C
                          </span>
                        </div>

                        {exam.isFree ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            FREE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>PRO</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-heading font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                        {exam.title}
                      </h3>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <BookA className="w-3.5 h-3.5 text-primary" />
                          <span>{exam.questionsCount} câu</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>{exam.durationMinutes} phút</span>
                        </span>
                      </div>

                      {/* Status pill & score */}
                      <div className="mb-4 flex items-center gap-2 flex-wrap">
                        {exam.status === "completed" ? (
                          <>
                            <span className="text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã làm
                            </span>
                            {exam.bestScore && (
                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                                Điểm: {exam.bestScore}
                              </span>
                            )}
                          </>
                        ) : exam.status === "in_progress" ? (
                          <span className="text-xs font-semibold bg-amber-500/15 text-amber-600 px-2.5 py-0.5 rounded-full">
                            Đang làm dở
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full">
                            Chưa làm
                          </span>
                        )}
                      </div>

                      <div className="flex-1" />

                      {/* Action Button */}
                      <div className="pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {exam.userAttempts ? `${exam.userAttempts} lần làm` : "Chưa làm lần nào"}
                        </span>

                        {isLocked ? (
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition-colors border border-amber-500/30"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Mở khóa PRO</span>
                          </Link>
                        ) : (
                          <Link
                            href={`/grammar/${exam.id}`}
                            className="tech-btn inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-glow shadow-xs transition-all"
                          >
                            <span>{exam.status === "completed" ? "Luyện lại" : "Làm bài ngay"}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />

      {/* Universal Skill Format Guide Modal */}
      <UniversalSkillGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialSkill="grammar"
        onStartPractice={() => {
          setTimeout(() => {
            const el = document.getElementById("practice-sets-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 150);
        }}
      />
    </div>
  );
}
