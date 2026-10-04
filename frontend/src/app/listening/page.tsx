"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  Headphones,
  Clock,
  History,
  Search,
  ArrowRight,
  Play,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
} from "lucide-react";

interface ListeningExam {
  id: string;
  title: string;
  parts: string;
  totalParts: number;
  partTitle?: string | null;
  questionsCount: number;
  duration: string;
  isFree: boolean;
  status: "not_started" | "in_progress" | "completed";
  bestScore?: string | null;
  bestScoreNumber?: number | null;
  userAttempts?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
}

export default function ListeningPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);
  const [activeTab, setActiveTab] = useState<"full" | "p1" | "p2" | "p3" | "p4">("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<ListeningExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Chưa có bài nào — hãy bắt đầu luyện tập!");

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "LISTENING", limit: 250 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const isFullListening = exam.totalParts === 4 || exam.title.includes("Full Listening");

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullListening ? "Full Listening · 4 Parts" : (exam.partTitle || "Listening Part"),
              totalParts: exam.totalParts || 1,
              partTitle: exam.partTitle,
              questionsCount: exam.totalQuestions || 25,
              duration: `${exam.durationMinutes || 40} phút`,
              isFree: !exam.isPro,
              status,
              bestScore: exam.bestScore || (status === "completed" ? "A0" : null),
              bestScoreNumber: exam.bestScoreNumber,
              userAttempts: exam.userAttempts || 0,
              priority: "HIGH",
            };
          })
        );
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi từ máy chủ.");
        setExams([]);
      }
    } catch (err: any) {
      console.error("Failed to load listening exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
    // Tải tiến độ Listening của học viên
    api.submissions.getMyHistory({ skill: "LISTENING", limit: 50 }).then((res) => {
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

  // 1. Lọc theo từng Tab chuẩn aptiskytich.vn
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.title.includes("Full Listening") || e.totalParts === 4;
    } else if (activeTab === "p1") {
      // Part 1: Word recognition / Information recognition
      if (e.totalParts === 4 || e.title.includes("Full Listening")) return false;
      return e.title.includes("Listening Part 1") || e.partTitle?.includes("Part 1");
    } else if (activeTab === "p2") {
      // Part 2: Information Matching
      if (e.totalParts === 4 || e.title.includes("Full Listening")) return false;
      return e.partTitle?.includes("Part 2") || e.partTitle?.includes("Information Matching");
    } else if (activeTab === "p3") {
      // Part 3: Opinion Matching
      if (e.totalParts === 4 || e.title.includes("Full Listening")) return false;
      return e.partTitle?.includes("Part 3") || e.partTitle?.includes("Opinion Matching");
    } else if (activeTab === "p4") {
      // Part 4: Monologues / Monologue Comprehension
      if (e.totalParts === 4 || e.title.includes("Full Listening")) return false;
      return e.partTitle?.includes("Part 4") || e.partTitle?.includes("Monologue");
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority từ currentTabExams
  const filteredExams = currentTabExams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? e.priority === "HIGH"
        : e.priority === "MEDIUM";
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "completed"
        ? e.status === "completed"
        : e.status !== "completed";
    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "hsl(var(--primary) / 0.35)" }}
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
                  <Headphones className="w-6 h-6 text-primary" />
                </div>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 border-transparent bg-secondary text-secondary-foreground text-xs font-medium gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span>40 phút · 25 câu</span>
                </div>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
                Luyện tập full part kỹ năng Listening
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Hoàn thành tất cả các Part của kỹ năng này trong một lượt thi liên tục để đánh giá năng lực chính xác nhất. Mỗi đoạn audio được nghe tối đa 2 lần.
              </p>
              <Link
                className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap border dark:text-primary-foreground bg-background py-2 mt-4 rounded-full border-primary text-primary hover:bg-primary/10 hover:text-primary h-9 px-4 text-sm font-medium transition-colors"
                href="/meo-thi-aptis/meo-hoc-listening-aptis"
                data-discover="true"
              >
                💡 Xem ngay - Mẹo làm bài Listening
              </Link>
            </div>
          </div>
        </section>

        {/* Progress Strip */}
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
            <Link className="shrink-0" href="/history?skill=listening" data-discover="true">
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

        {/* Search, Filter & Parts */}
        <section className="section-container py-8 md:py-10">
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-md border border-input px-3 py-2 text-base md:text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Tìm kiếm bộ đề Listening..."
            />
          </div>

          {/* Parts Filter Tabs */}
          <div className="inline-flex items-center justify-center rounded-xl text-muted-foreground w-full h-auto flex-wrap gap-1 bg-muted/50 p-1.5 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("full")}
              className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                activeTab === "full"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:text-foreground"
              }`}
            >
              <span className="font-semibold">Full Part</span>
              <span className="hidden lg:inline ml-1 opacity-80">– Tất cả các Part</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("p1")}
              className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                activeTab === "p1"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:text-foreground"
              }`}
            >
              <span className="font-semibold">P.1</span>
              <span className="hidden lg:inline ml-1 opacity-80">– Word recognition (Câu 1 - 13)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("p2")}
              className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                activeTab === "p2"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:text-foreground"
              }`}
            >
              <span className="font-semibold">P.2</span>
              <span className="hidden lg:inline ml-1 opacity-80">– Matching info (Câu 14)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("p3")}
              className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                activeTab === "p3"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:text-foreground"
              }`}
            >
              <span className="font-semibold">P.3</span>
              <span className="hidden lg:inline ml-1 opacity-80">– Short conversations (Câu 15)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("p4")}
              className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                activeTab === "p4"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "hover:text-foreground"
              }`}
            >
              <span className="font-semibold">P.4</span>
              <span className="hidden lg:inline ml-1 opacity-80">– Monologues (Câu 16 - 17)</span>
            </button>
          </div>

          {/* 3 Hàng Bộ lọc chuẩn: Ưu tiên, Trạng thái, Nguồn */}
          <div className="space-y-2.5 mb-8 text-xs">
            {/* Hàng 1: Lọc ưu tiên */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-semibold w-24">Lọc ưu tiên:</span>
              {[
                { id: "all", label: `Tất cả (${currentTabExams.length})` },
                { id: "high", label: `Ưu tiên cao (${currentTabExams.filter((e) => e.priority === "HIGH").length})` },
                { id: "medium", label: `Ưu tiên vừa (${currentTabExams.filter((e) => e.priority === "MEDIUM").length})` },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterPriority(item.id as any)}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${
                    filterPriority === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Hàng 2: Trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-semibold w-24">Trạng thái:</span>
              {[
                { id: "all", label: `Tất cả (${currentTabExams.length})` },
                { id: "not_started", label: `Chưa làm (${currentTabExams.filter((e) => e.status !== "completed").length})` },
                { id: "completed", label: `Đã làm (${currentTabExams.filter((e) => e.status === "completed").length})` },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilterStatus(item.id as any)}
                  className={`px-3 py-1 rounded-full font-bold transition-all ${
                    filterStatus === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Hàng 3: Nguồn (ở Full Part) */}
            {activeTab === "full" && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground font-semibold w-24">Nguồn:</span>
                {[
                  { id: "all", label: `Tất cả (${currentTabExams.length})` },
                  { id: "web", label: `Đề web (${currentTabExams.length})` },
                  { id: "my", label: `Bộ đề của tôi (0)` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFilterSource(item.id as any)}
                    className={`px-3 py-1 rounded-full font-bold transition-all ${
                      filterSource === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards Grid */}
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
                  <p className="font-bold text-sm">Chưa thể tải dữ liệu</p>
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
              <Headphones className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-base text-foreground">Không có đề thi nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Cơ sở dữ liệu hiện tại chưa có đề thi nào trong danh mục này.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* CARD 1: Tạo bộ đề của bạn (PRO) */}
              <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                      PRO
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-extrabold text-foreground mb-2">
                    Tạo bộ đề của bạn
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => alert("Tính năng ghép đề Pro. Bạn có thể luyện tập các đề Free bên cạnh!")}
                    className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-colors text-center"
                  >
                    Nâng cấp để tạo →
                  </button>
                </div>
              </div>

              {/* CARD 2..N: Exam Cards */}
              {filteredExams.map((exam, idx) => (
                <div
                  key={exam.id}
                  className="relative rounded-2xl border border-border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
                >
                  <div>
                    {/* Badges & Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md border border-border bg-muted/50 text-muted-foreground font-bold text-[10px]">
                          Full Part
                        </span>
                        {exam.isFree ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                            FREE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                            PRO
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                          Ưu tiên cao
                        </span>
                      </div>

                      {exam.bestScore && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs">
                          🏆 {exam.bestScore}
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-heading font-bold text-foreground mb-1">
                      {exam.title.includes("—") ? exam.title.split("—")[0].trim() : `Đề 0${idx + 1}`}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {exam.parts} · 25 câu · 40 phút
                    </p>

                    <div className="text-xs">
                      {exam.status === "completed" ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã hoàn thành tất cả 4 Part</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Chưa bắt đầu</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border/40 flex justify-end">
                    {exam.isFree || isProOrAdmin ? (
                      <Link
                        href={`/listening/${exam.id}${activeTab !== "full" ? `?part=${activeTab}` : ""}`}
                        className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-xs font-bold h-9 rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary-glow shadow-sm gap-1 group-hover:gap-2 transition-all"
                      >
                        <span>Bắt đầu luyện tập</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert("Đề thi Pro. Vui lòng nâng cấp tài khoản để mở khóa!")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/10 transition-colors"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Mở khóa</span>
                      </button>
                    )}
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
