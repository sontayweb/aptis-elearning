"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  History,
  Info,
  Clock,
  Target,
  Award,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";

interface ExamHistoryEntry {
  id: string;
  examId?: string;
  examTitle: string;
  skill: string;
  date: string;
  durationSpent: string;
  score: string;
  band: string;
  status?: string;
}

export default function HistoryPage() {
  const { isAuthenticated, quickLogin } = useAuth();
  const [filterSkill, setFilterSkill] = useState("all");
  const [historyItems, setHistoryItems] = useState<ExamHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    avgAccuracyPercent: 0,
    estimatedLevel: "Chưa có bài thi",
  });

  const loadHistory = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.submissions.getMyHistory({
        skill: filterSkill === "all" ? undefined : filterSkill,
        limit: 50,
      });

      if (res.success && Array.isArray(res.data)) {
        setHistoryItems(res.data);
        if (res.meta?.summary) {
          setStats(res.meta.summary);
        }
      } else {
        setError(res.error?.message || "Không thể tải lịch sử làm bài (Vui lòng kiểm tra CSDL).");
        setHistoryItems([]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải lịch sử làm bài:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setHistoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [isAuthenticated, filterSkill]);

  const filtered = historyItems.filter((item) =>
    filterSkill === "all" ? true : item.skill.toLowerCase() === filterSkill.toLowerCase()
  );

  const getExamLink = (item: ExamHistoryEntry) => {
    if (!item.examId) return "/dashboard";
    const skill = (item.skill || "").toLowerCase();
    const query = `?submissionId=${encodeURIComponent(item.id)}&mode=review`;
    if (skill.includes("speaking")) return `/speaking/${item.examId}${query}`;
    if (skill.includes("writing")) return `/writing/${item.examId}${query}`;
    if (skill.includes("reading")) return `/reading/${item.examId}${query}`;
    if (skill.includes("listening")) return `/listening/${item.examId}${query}`;
    if (skill.includes("full") || skill.includes("thi thử")) return `/thi-thu/${item.examId}${query}`;
    return `/grammar/${item.examId}${query}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Compact Header Web App */}
        <section className="relative overflow-hidden bg-card/60 backdrop-blur-xs border-b border-border/80">
          <div className="section-container py-3.5 sm:py-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <History className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
                Lịch sử làm bài &amp; Tiến độ
              </h1>
              <div className="relative group/info inline-flex items-center">
                <button
                  type="button"
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-help"
                  aria-label="Thông tin lịch sử và tiến độ"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 w-72 max-w-xs rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 shadow-xl border border-slate-700 opacity-0 group-hover/info:opacity-100 group-hover/info:pointer-events-auto group-focus-within/info:opacity-100 group-focus-within/info:pointer-events-auto transition-all transform origin-top-left leading-relaxed">
                  Theo dõi chi tiết quá trình cải thiện điểm số qua từng bài luyện tập và thi thử. Xem lại đáp án, lời giải thích và nhận xét chi tiết của AI.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Summary Bar - Kéo sát lên trên */}
        <section className="section-container pt-4 sm:pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-5">
            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Tổng số bài đã hoàn thành</div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mt-0.5">
                  {stats.totalCompleted} bài
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Tỷ lệ chính xác trung bình</div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mt-0.5">
                  {stats.avgAccuracyPercent}%
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs flex items-center gap-3.5 sm:gap-4">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Ước tính trình độ hiện tại</div>
                <div className="text-xl sm:text-2xl font-extrabold font-heading text-foreground mt-0.5">
                  {stats.estimatedLevel}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap mb-6">
            <button
              type="button"
              onClick={() => setFilterSkill("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Tất cả ({historyItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSkill("grammar")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "grammar"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Grammar &amp; Vocab
            </button>
            <button
              type="button"
              onClick={() => setFilterSkill("listening")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "listening"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Listening
            </button>
            <button
              type="button"
              onClick={() => setFilterSkill("reading")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "reading"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Reading
            </button>
            <button
              type="button"
              onClick={() => setFilterSkill("writing")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "writing"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Writing
            </button>
            <button
              type="button"
              onClick={() => setFilterSkill("speaking")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors shrink-0 whitespace-nowrap min-h-[34px] sm:min-h-0 ${
                filterSkill === "speaking"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              Speaking
            </button>
          </div>

          {/* History List */}
          {!isAuthenticated ? (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 text-center mb-12">
              <Lock className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="text-base font-bold text-foreground">Bạn chưa đăng nhập</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Vui lòng đăng nhập để hệ thống đồng bộ và hiển thị lịch sử làm bài thi của bạn.
              </p>
              <button
                type="button"
                onClick={() => quickLogin("student")}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all inline-flex items-center gap-1.5"
              >
                <span>Đăng nhập ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : loading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm">Đang tải lịch sử làm bài...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-bold text-sm">Chưa thể tải dữ liệu thực tế</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadHistory}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 shrink-0"
              >
                Thử lại
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-border bg-card/50 text-center mb-12">
              <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="text-base font-bold text-foreground">Chưa có bài thi nào</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Bạn chưa hoàn thành bài thi nào trong mục này. Hãy bắt đầu luyện tập ngay!
              </p>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-110 transition-all inline-flex items-center gap-1.5"
              >
                <span>Vào phòng luyện thi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3 mb-12">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {item.skill}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5" />
                        {item.date}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base text-foreground break-words">
                      {item.examTitle}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Thời gian làm bài: {item.durationSpent}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-muted-foreground block">Điểm số</span>
                      <span className="text-lg font-heading font-extrabold text-primary">
                        {item.score}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 block">
                        {item.band}
                      </span>
                    </div>

                    <Link
                      href={getExamLink(item)}
                      className="tech-btn px-4 py-2 min-h-[40px] rounded-xl border border-border hover:bg-muted text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 shrink-0"
                    >
                      <span>Xem lại</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
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
