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
  LISTENING_PART2_TOPICS,
  LISTENING_PART3_TOPICS,
  LISTENING_PART4_TOPICS,
} from "@/data/listening-topics-bank";
import { getCloverConfig } from "@/lib/clover-utils";
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
  Flame,
  Star,
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
  hotLevel?: number;
}

export default function ListeningPracticePage() {
  const { user } = useAuth();
  const isProOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "TEACHER" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);
  const [activeTab, setActiveTab] = useState<"full" | "p1" | "p2" | "p3" | "p4">(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab && ["full", "p1", "p2", "p3", "p4"].includes(urlTab)) return urlTab as any;
      const saved = sessionStorage.getItem("listening_active_tab");
      if (saved && ["full", "p1", "p2", "p3", "p4"].includes(saved)) return saved as any;
    }
    return "full";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("listening_active_tab", activeTab);
      try {
        const url = new URL(window.location.href);
        if (activeTab !== "full") url.searchParams.set("tab", activeTab);
        else url.searchParams.delete("tab");
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<ListeningExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressText, setProgressText] = useState("Chưa có bài nào — hãy bắt đầu luyện tập!");
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "LISTENING", limit: 600 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const isFullListening = exam.totalParts === 4 || exam.title.includes("Full Listening");

            let hotLevel = Number(exam.hotLevel ?? exam.hot_level ?? 0);
            if (hotLevel === 0) {
              const titleLower = (exam.title || "").toLowerCase();
              const pTitle = exam.partTitle || "";
              let bank: Array<{ keywords?: string[]; title: string; hotLevel: number }> = [];
              if (pTitle.includes("Part 2") || pTitle.includes("Information Matching")) bank = LISTENING_PART2_TOPICS;
              else if (pTitle.includes("Part 3") || pTitle.includes("Opinion Matching")) bank = LISTENING_PART3_TOPICS;
              else if (pTitle.includes("Part 4") || pTitle.includes("Monologue")) bank = LISTENING_PART4_TOPICS;
              for (const item of bank) {
                if (item.keywords?.some((k) => titleLower.includes(k.toLowerCase()))) {
                  hotLevel = item.hotLevel;
                  break;
                }
              }
            }

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
              priority: (hotLevel >= 4 ? "HIGH" : hotLevel >= 3 ? "MEDIUM" : "LOW") as any,
              hotLevel,
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

  // Đồng bộ tab từ URL (?tab=p1/p2/p3/p4/full) và lắng nghe sự kiện switch tab từ Guide Modal
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      if (tabParam && ["full", "p1", "p2", "p3", "p4"].includes(tabParam)) {
        setActiveTab(tabParam as any);
        setTimeout(() => {
          const el = document.getElementById("practice-sets-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    };

    syncTabFromUrl();

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ skill: string; tab: string }>;
      if (customEvent.detail && (customEvent.detail.skill === "listening" || !customEvent.detail.skill)) {
        const targetTab = customEvent.detail.tab;
        if (["full", "p1", "p2", "p3", "p4"].includes(targetTab)) {
          setActiveTab(targetTab as any);
        }
      }
    };

    window.addEventListener("aptis:switch-skill-tab", handleSwitchTab);
    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("aptis:switch-skill-tab", handleSwitchTab);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  // 1. Lọc theo từng Tab chuẩn aptiskytich.vn
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.totalParts === 4 || e.title.includes("Full Listening");
    } else if (activeTab === "p1") {
      return (
        e.totalParts === 1 &&
        (e.title.includes("Listening Part 1") ||
          e.partTitle?.includes("Part 1") ||
          e.partTitle?.includes("Information Recognition") ||
          e.partTitle?.includes("Word Recognition"))
      );
    } else if (activeTab === "p2") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 2") ||
          e.partTitle?.includes("Information Matching"))
      );
    } else if (activeTab === "p3") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 3") ||
          e.partTitle?.includes("Opinion Matching"))
      );
    } else if (activeTab === "p4") {
      return (
        e.totalParts === 1 &&
        (e.partTitle?.includes("Part 4") ||
          e.partTitle?.includes("Monologue"))
      );
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
        ? (e.hotLevel || 0) >= 3 || e.priority === "HIGH"
        : filterPriority === "medium"
        ? (e.hotLevel || 0) === 2 || e.priority === "MEDIUM"
        : (e.hotLevel || 0) <= 1;
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "completed"
        ? e.status === "completed"
        : e.status !== "completed";
    return matchesSearch && matchesPriority && matchesStatus;
  }).sort((a, b) => {
    // Sắp xếp ưu tiên tuyệt đối theo Độ Hot (Cỏ ☘️) từ cao xuống thấp (6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)
    const hotDiff = (b.hotLevel || 0) - (a.hotLevel || 0);
    if (hotDiff !== 0) return hotDiff;
    const matchA = a.title.match(/Đề\s+(\d+)/i);
    const matchB = b.title.match(/Đề\s+(\d+)/i);
    if (matchA && matchB) {
      return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
    }
    return a.title.localeCompare(b.title, "vi");
  });

  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Full Test Listening",
          marathonText: "Tạo bộ đề của bạn",
          marathonDesc: "Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.",
          marathonBtn: "Nâng cấp để tạo →",
          marathonType: "custom",
          marathonUrl: null,
        };
      case "p1":
        return {
          title: "Part 1 – Information Recognition",
          marathonText: "Ngân Hàng Câu Hỏi Nghe Part 1",
          marathonDesc: "Luyện tập tất cả các câu hỏi nhận diện thông tin ngắn có audio thật, transcript song ngữ và giải thích chi tiết",
          marathonBtn: "Luyện 13 câu nghe Part 1 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=1",
        };
      case "p2":
        return {
          title: "Part 2 – Speaker Matching",
          marathonText: "Ngân Hàng Ghép Người Nói Part 2",
          marathonDesc: "Bộ 8 chủ đề 4 người phát biểu kèm audio bản ngữ chuẩn British Council và phân tích bẫy nghe",
          marathonBtn: "Luyện 8 đề ghép người nói Part 2 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=2",
        };
      case "p3":
        return {
          title: "Part 3 – Opinion Matching",
          marathonText: "Đàm Thoại Quan Điểm Part 3",
          marathonDesc: "Luyện nghe bắt quan điểm Man/Woman/Both agree với 6 bộ đàm thoại hay ra trong đề thi thật",
          marathonBtn: "Luyện đàm thoại Part 3 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=3",
        };
      case "p4":
        return {
          title: "Part 4 – Monologue & Lectures",
          marathonText: "Nghe Độc Thoại & Bài Giảng Part 4",
          marathonDesc: "Rèn luyện nghe hiểu sâu 6 bài thuyết trình & bản tin radio dài chuẩn format Aptis ESOL",
          marathonBtn: "Luyện bài độc thoại Part 4 →",
          marathonType: "marathon",
          marathonUrl: "/listening/marathon?part=4",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex w-full rounded-xl border border-input px-3 py-2 text-base md:text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Tìm kiếm bộ đề Listening..."
              />
            </div>
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 h-11 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-2xs shrink-0"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Cẩm nang 4 Part chi tiết</span>
            </button>
          </div>

          {/* Parts Filter Tabs */}
          <div className="inline-flex items-center justify-center rounded-xl text-muted-foreground w-full h-auto flex-wrap gap-1 bg-muted/50 p-1.5 mb-6">
            {[
              { id: "full", label: "Full Part", sub: "Tất cả các Part" },
              { id: "p1", label: "P.1", sub: "Word recognition (Câu 1 - 13)" },
              { id: "p2", label: "P.2", sub: "Matching info (Câu 14)" },
              { id: "p3", label: "P.3", sub: "Short conversations (Câu 15)" },
              { id: "p4", label: "P.4", sub: "Monologues (Câu 16 - 17)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (typeof window !== "undefined") {
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.pushState({}, "", url.toString());
                  }
                }}
                className={`inline-flex items-center justify-center rounded-lg px-3 font-medium flex-1 min-w-[120px] text-xs sm:text-sm py-2.5 transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "hover:text-foreground"
                }`}
              >
                <span className="font-semibold">{tab.label}</span>
                <span className="hidden lg:inline ml-1 opacity-80">– {tab.sub}</span>
              </button>
            ))}
          </div>

          {/* 3 Hàng Bộ lọc chuẩn: Ưu tiên, Trạng thái, Nguồn */}
          <div className="space-y-2.5 mb-8 text-xs">
            {/* Hàng 1: Lọc ưu tiên theo Độ Hot ☘️ */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-semibold w-24">Độ Hot ☘️:</span>
              {[
                { id: "all", label: `Tất cả (${currentTabExams.length})` },
                { id: "high", label: `☘️☘️☘️+ Siêu Hot (${currentTabExams.filter((e) => (e.hotLevel || 0) >= 3).length})` },
                ...(currentTabExams.some((e) => (e.hotLevel || 0) === 2)
                  ? [{ id: "medium", label: `☘️☘️ Hay ra (${currentTabExams.filter((e) => (e.hotLevel || 0) === 2).length})` }]
                  : []),
                ...(currentTabExams.some((e) => (e.hotLevel || 0) === 1)
                  ? [{ id: "low", label: `☘️ Cơ bản (${currentTabExams.filter((e) => (e.hotLevel || 0) === 1).length})` }]
                  : []),
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
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-24">
              {/* CARD 1: Marathon / Custom Card */}
              <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {tabInfo.marathonType === "custom" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                        PRO
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                          ∞ Marathon
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                          PRO
                        </span>
                      </div>
                    )}
                    {tabInfo.marathonType === "marathon" && (
                      <span className="text-[11px] font-semibold text-muted-foreground">Chưa làm</span>
                    )}
                  </div>

                  <h3 className="text-lg font-heading font-extrabold text-foreground mb-2">
                    {tabInfo.marathonText}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {tabInfo.marathonDesc}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-border/40">
                  {tabInfo.marathonUrl ? (
                    <Link
                      href={tabInfo.marathonUrl}
                      className="block w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center cursor-pointer"
                    >
                      {tabInfo.marathonBtn}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsGuideModalOpen(true)}
                      className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-colors text-center cursor-pointer"
                    >
                      {tabInfo.marathonBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2..N: Exam Cards */}
              {filteredExams.map((exam, idx) => (
                <div
                  key={exam.id}
                  className={`relative rounded-2xl border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group ${
                    exam.hotLevel && exam.hotLevel >= 5
                      ? "border-rose-500/40 shadow-rose-500/5 ring-1 ring-rose-500/20"
                      : exam.hotLevel === 4
                      ? "border-amber-500/30 ring-1 ring-amber-500/20"
                      : exam.hotLevel === 3
                      ? "border-blue-500/30 ring-1 ring-blue-500/20"
                      : exam.hotLevel && exam.hotLevel > 0
                      ? "border-emerald-500/30"
                      : "border-border"
                  }`}
                >
                  <div>
                    {/* Badges & Score */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md border border-border bg-muted/50 text-muted-foreground font-bold text-[10px]">
                          {exam.totalParts === 4 || exam.title.includes("Full Listening")
                            ? "Full Part"
                            : activeTab === "p1"
                            ? "Part 1"
                            : activeTab === "p2"
                            ? "Part 2"
                            : activeTab === "p3"
                            ? "Part 3"
                            : activeTab === "p4"
                            ? "Part 4"
                            : (exam.partTitle?.split(" - ")[0] || exam.partTitle?.split(":")[0] || "Part")}
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

                        {/* Stickers đánh giá mức độ ưu tiên theo chuẩn Clover ☘️ */}
                        {(() => {
                          const cloverLvl = exam.hotLevel;
                          if (!cloverLvl || cloverLvl <= 0) return null;
                          const cfg = getCloverConfig(cloverLvl);
                          return (
                            <span
                              className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${cfg.badgeClass}`}
                              title={`${cloverLvl} Cỏ ☘️`}
                            >
                              <span>{cfg.symbol}</span>
                            </span>
                          );
                        })()}
                      </div>

                      {exam.bestScore && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs">
                          🏆 {exam.bestScore}
                        </span>
                      )}
                    </div>

                    {/* Dynamic Title with Real Topic Name from Database */}
                    {(() => {
                      const displayTitle = (() => {
                        if (exam.title) {
                          if (activeTab === "p1" && exam.title.includes("Listening Part 1")) {
                            return exam.title.replace("Listening Part 1", "Part 1: Information Recognition");
                          }
                          return exam.title;
                        }
                        const padded = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
                        if (activeTab === "full") return `Đề ${padded} — Full Listening · 4 Parts`;
                        if (activeTab === "p1") return `Đề ${padded} - Part 1: Information Recognition`;
                        if (activeTab === "p2") {
                          const item = LISTENING_PART2_TOPICS[idx % LISTENING_PART2_TOPICS.length];
                          return `Đề ${padded} - ${item.title}`;
                        }
                        if (activeTab === "p3") {
                          const item = LISTENING_PART3_TOPICS[idx % LISTENING_PART3_TOPICS.length];
                          return `Đề ${padded} - ${item.title}`;
                        }
                        const item = LISTENING_PART4_TOPICS[idx % LISTENING_PART4_TOPICS.length];
                        return `Đề ${padded} - ${item.title}`;
                      })();

                      return (
                        <div>
                          <h3 className="text-base sm:text-lg font-heading font-extrabold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {displayTitle}
                          </h3>
                        </div>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground mb-4">
                      {exam.parts} · {exam.questionsCount} câu · {exam.duration}
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
      <UniversalSkillGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialSkill="listening"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
    </div>
  );
}
