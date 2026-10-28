"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { UniversalSkillGuideModal } from "@/components/skill-format-guide-modal";
import { WRITING_CLUBS_BANK } from "@/data/writing-clubs-bank";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  PenTool,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  AlertCircle,
  Trophy,
  Flame,
  Star,
} from "lucide-react";
import { getCloverConfig } from "@/lib/clover-utils";

interface WritingExam {
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
  userAttempts: number;
  partNumber?: number;
  priority?: "HIGH" | "MEDIUM" | "LOW";
  hotLevel?: number;
}

export default function WritingPracticePage() {
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
      const saved = sessionStorage.getItem("writing_active_tab");
      if (saved && ["full", "p1", "p2", "p3", "p4"].includes(saved)) return saved as any;
    }
    return "full";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("writing_active_tab", activeTab);
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

  const [exams, setExams] = useState<WritingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

function detectWritingPartNumber(title: string, partTitle?: string | null, totalParts?: number): number {
  if (totalParts === 4 || /full\s*writing/i.test(title)) return 0;
  const text = `${title} ${partTitle || ""}`.toLowerCase();
  if (/part\s*4|key\s*part\s*4|formal.*informal|viết\s*thư/i.test(text)) return 4;
  if (/part\s*3|key\s*part\s*3|three\s*responses|chat\s*clb|diễn\s*đàn/i.test(text)) return 3;
  if (/part\s*2|key\s*part\s*2|short\s*text|club\s*form|điền\s*đơn|đoạn\s*văn/i.test(text)) return 2;
  if (/part\s*1|key\s*part\s*1|word-level|short\s*answer|tin\s*nhắn/i.test(text)) return 1;
  return 1;
}

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "WRITING", limit: 600 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const pNum = detectWritingPartNumber(exam.title, exam.partTitle, exam.totalParts);
            const isFullWriting = pNum === 0;

            // Phân bổ tỷ lệ ưu tiên (Cao, Vừa, Thấp)
            let priority: "HIGH" | "MEDIUM" | "LOW" = "HIGH";
            if (exam.priority) {
              priority = exam.priority;
            } else {
              const mod = idx % 5;
              if (mod === 0 || mod === 1 || mod === 3) priority = "HIGH";
              else if (mod === 2) priority = "MEDIUM";
              else priority = "LOW";
            }

            const hotLevel = Number(exam.hotLevel ?? exam.hot_level ?? 0);

            const partSubtitles: Record<number, string> = {
              1: "Part 1 - Word-level Writing (1-5 từ)",
              2: "Part 2 - Short Text Writing (20-30 từ)",
              3: "Part 3 - Three Responses (30-40 từ/câu)",
              4: "Part 4 - Formal & Informal Emails",
            };

            return {
              id: exam.id,
              title: exam.title,
              parts: isFullWriting ? "Full Writing · 4 Parts (50 phút)" : (exam.partTitle || partSubtitles[pNum] || `Writing Part ${pNum}`),
              totalParts: isFullWriting ? 4 : 1,
              partTitle: exam.partTitle,
              partNumber: pNum,
              questionsCount: exam.totalQuestions || (pNum === 1 ? 5 : pNum === 2 ? 1 : pNum === 3 ? 3 : 2),
              duration: `${exam.durationMinutes || (isFullWriting ? 50 : pNum === 1 ? 3 : pNum === 2 ? 7 : pNum === 3 ? 10 : 30)} phút`,
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
      console.error("Failed to load writing exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setExams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
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
      if (customEvent.detail && (customEvent.detail.skill === "writing" || !customEvent.detail.skill)) {
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

  // 1. Lọc theo từng Tab chuẩn: Tách biệt hoàn toàn Full Test và Part 1 / 2 / 3 / 4
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.partNumber === 0 || e.totalParts === 4 || /full\s*writing/i.test(e.title);
    }
    if (e.partNumber === 0 || e.totalParts === 4 || /full\s*writing/i.test(e.title)) return false;

    if (activeTab === "p1") return e.partNumber === 1;
    if (activeTab === "p2") return e.partNumber === 2;
    if (activeTab === "p3") return e.partNumber === 3;
    if (activeTab === "p4") return e.partNumber === 4;
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority, source và sắp xếp theo Độ Hot (Cỏ ☘️)
  const filteredExams = currentTabExams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "completed"
        ? e.status === "completed"
        : e.status !== "completed";
    const matchesPriority =
      filterPriority === "all"
        ? true
        : filterPriority === "high"
        ? (e.hotLevel || 0) >= 3 || e.priority === "HIGH"
        : filterPriority === "medium"
        ? (e.hotLevel || 0) === 2 || e.priority === "MEDIUM"
        : (e.hotLevel || 0) <= 1 && e.priority === "LOW";
    const matchesSource = filterSource === "all" || filterSource === "web" ? true : false;
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  }).sort((a, b) => {
    // Sắp xếp ưu tiên tuyệt đối theo Độ Hot (Cỏ ☘️) từ cao xuống thấp (6 -> 5 -> 4 -> 3 -> 2 -> 1 -> 0)
    const hotDiff = (b.hotLevel || 0) - (a.hotLevel || 0);
    if (hotDiff !== 0) return hotDiff;
    return a.title.localeCompare(b.title, "vi");
  });

  // Dynamic naming based on activeTab
  const getTabInfo = () => {
    switch (activeTab) {
      case "full":
        return {
          title: "Luyện tập full part kỹ năng Writing",
          desc: "Hoàn thành tất cả các Part của kỹ năng này trong một lượt thi liên tục để đánh giá năng lực chính xác nhất.",
          badge: "Full Part",
          partQuery: "",
          marathonText: "Tạo bộ đề của bạn",
          marathonDesc: "Tự ghép các đề lẻ thành bộ full test hoặc full part của riêng bạn. Dành cho tài khoản Pro.",
          marathonBtn: "Nâng cấp để tạo →",
          marathonType: "custom",
        };
      case "p1":
        return {
          title: "Part 1 – Short answers (1-5 từ)",
          desc: "Trả lời 5 câu hỏi tin nhắn ngắn từ 1 đến 5 từ. Kiểm tra khả năng cung cấp thông tin ngắn gọn, chuẩn xác.",
          badge: "Part 1",
          partQuery: "?part=1",
          marathonText: "Ngân Hàng Câu Hỏi Lẻ Part 1",
          marathonDesc: "Luyện tập tất cả các câu hỏi tin nhắn ngắn Part 1 kèm câu trả lời mẫu B2/C1 chuẩn đếm từ",
          marathonBtn: "Luyện câu hỏi lẻ Part 1 →",
          marathonType: "marathon",
          marathonUrl: "/writing/marathon?part=1",
        };
      case "p2":
        return {
          title: "Part 2 – Form filling (20-30 từ)",
          desc: "Viết một đoạn văn ngắn 20-30 từ điền vào đơn tham gia câu lạc bộ, nêu lý do và sở thích.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 2",
          partQuery: "?part=2",
          marathonText: "Tổng Hợp Các Form Điền Đơn CLB Part 2",
          marathonDesc: "Bộ 15 chủ đề CLB sát đề thi thật British Council kèm đếm từ tự động và bài mẫu ăn điểm",
          marathonBtn: "Luyện 15 đề form CLB Part 2 →",
          marathonType: "marathon",
          marathonUrl: "/writing/marathon?part=2",
        };
      case "p3":
        return {
          title: "Part 3 – Social network interaction (3 câu)",
          desc: "Trả lời 3 câu hỏi trên mạng xã hội của câu lạc bộ, mỗi câu 30-40 từ với 3 thành viên khác nhau.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 3",
          partQuery: "?part=3",
          marathonText: "Phòng Chat Diễn Đàn CLB Part 3",
          marathonDesc: "Luyện viết phản hồi 3 thành viên liên hoàn, bám sát độ dài 30-40 từ và bài mẫu B2/C1",
          marathonBtn: "Luyện phòng chat CLB Part 3 →",
          marathonType: "marathon",
          marathonUrl: "/writing/marathon?part=3",
        };
      case "p4":
        return {
          title: "Part 4 – Formal & Informal emails",
          desc: "Viết 2 bức email: 1 email thân mật gửi bạn (khoảng 50 từ) và 1 email trang trọng gửi ban quản lý (120-150 từ).",
          badge: "Part 4",
          partQuery: "?part=4",
          marathonText: "Viết Thư Kép Thân Mật & Trang Trọng Part 4",
          marathonDesc: "Rèn luyện phân biệt phong cách Formal vs Informal, dàn ý 4 bước và bài mẫu nâng band",
          marathonBtn: "Luyện viết thư kép Part 4 →",
          marathonType: "marathon",
          marathonUrl: "/writing/marathon?part=4",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] sm:pt-[calc(var(--navbar-total-height,64px)+22px)] md:pt-[calc(var(--navbar-total-height,64px)+28px)] transition-all duration-300">
        <section className="section-container py-6 md:py-8">
          {/* Search Box & Cẩm nang */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex w-full rounded-xl border border-input px-3 py-2 text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
                placeholder="Tìm kiếm bộ đề Writing theo câu lạc bộ..."
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

          {/* Top 5 Part Tabs matching reading/listening layout */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
            {[
              { id: "full", label: "Full Part – Tất cả các Part" },
              { id: "p1", label: "Part 1 – Short answers" },
              { id: "p2", label: "Part 2 – Club form" },
              { id: "p3", label: "Part 3 – Social network" },
              { id: "p4", label: "Part 4 – Formal & Informal" },
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
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Header Description */}
          <div className="mb-6 space-y-1">
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground">
              {tabInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {tabInfo.desc}
            </p>
            {tabInfo.subDesc && (
              <p className="text-xs text-muted-foreground/80 italic pt-1">
                {tabInfo.subDesc}
              </p>
            )}
          </div>

          {/* Sub Filters - Rows */}
          <div className="space-y-2.5 mb-8 text-xs">
            {/* Row 1: Lọc ưu tiên theo Độ Hot ☘️ */}
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

            {/* Row 2: Trạng thái */}
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

            {/* Row 3: Nguồn (khi ở Full Part) */}
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
              <p className="text-sm font-medium">Đang tải danh sách đề thi Writing...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-between gap-4">
              <div>
                <p className="font-bold text-sm">Chưa thể tải dữ liệu</p>
                <p className="text-xs opacity-90">{error}</p>
              </div>
              <button
                type="button"
                onClick={loadExams}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-24">
              {/* CARD 1: Special Action Card (PRO Custom / Marathon) */}
              <div className="relative rounded-2xl border-2 border-primary/60 bg-card p-6 flex flex-col justify-between shadow-md hover:shadow-lg transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    {tabInfo.marathonType === "custom" ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                        PRO
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                          ∞ Marathon
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
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
                  {(tabInfo as any).marathonUrl ? (
                    <Link
                      href={(tabInfo as any).marathonUrl}
                      className="block w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center cursor-pointer"
                    >
                      {tabInfo.marathonBtn}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsGuideModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center cursor-pointer"
                    >
                      {tabInfo.marathonBtn}
                    </button>
                  )}
                </div>
              </div>

              {/* CARD 2..N: Practice Exam Cards */}
              {filteredExams.map((exam, idx) => {
                const targetUrl = `/writing/${exam.id}${tabInfo.partQuery}`;
                const displayTitle = exam.title;

                return (
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
                      {/* Top Badges & Score / Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-[10px]">
                            {exam.partNumber === 0 ? "Full Part" : `Part ${exam.partNumber}`}
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

                        {/* Top Right Trophy / Status */}
                        <div>
                          {exam.bestScore ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs">
                              🏆 {exam.bestScore}
                            </span>
                          ) : exam.status === "completed" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Đã làm
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-muted-foreground">
                              Chưa bắt đầu
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base sm:text-lg font-heading font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-xs text-muted-foreground mb-2">
                        {activeTab === "full" ? "Full Writing · 4 Parts (50 phút)" : (exam.parts || "Writing Practice")}
                      </p>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-end">
                      {exam.isFree || isProOrAdmin ? (
                        <Link
                          href={targetUrl}
                          className="inline-flex items-center gap-1.5 text-primary hover:text-brand-brown font-extrabold text-xs transition-colors"
                        >
                          <span>Luyện tập</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alert("Đề này thuộc gói Pro. Bạn có thể luyện tập đề Free hoàn toàn miễn phí!")}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground font-bold text-xs transition-colors"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Mở khóa</span>
                        </button>
                      )}
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
      <UniversalSkillGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        initialSkill="writing"
        onStartPractice={(_s, pIdx) => {
          const tabKey = (`p${pIdx + 1}` as "p1" | "p2" | "p3" | "p4");
          setActiveTab(tabKey);
        }}
      />
    </div>
  );
}
