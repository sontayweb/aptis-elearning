"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
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
  const [activeTab, setActiveTab] = useState<"full" | "p1" | "p2" | "p3" | "p4">("full");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "not_started" | "completed">("all");
  const [filterSource, setFilterSource] = useState<"all" | "web" | "my">("all");

  const [exams, setExams] = useState<WritingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.exams.getAll({ skill: "WRITING", limit: 350 });
      if (res.success && Array.isArray(res.data)) {
        setExams(
          res.data.map((exam: any, idx: number) => {
            let status: "not_started" | "in_progress" | "completed" = "not_started";
            if (exam.userStatus === "COMPLETED") status = "completed";
            else if (exam.userStatus === "IN_PROGRESS") status = "in_progress";

            const isFullWriting = exam.totalParts === 4 || exam.title.includes("Full Writing");

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

              return {
                id: exam.id,
                title: exam.title,
                parts: isFullWriting ? "Full Writing · 4 Parts" : (exam.partTitle || "Writing Part"),
                totalParts: exam.totalParts || 1,
                partTitle: exam.partTitle,
                questionsCount: exam.totalQuestions || 4,
                duration: `${exam.durationMinutes || 50} phút`,
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

  // 1. Lọc theo từng Tab chuẩn aptiskytich.vn
  const currentTabExams = exams.filter((e) => {
    if (activeTab === "full") {
      return e.title.includes("Full Writing") || e.totalParts === 4;
    } else if (activeTab === "p1") {
      // Part 1: Word-level Writing (Form thông tin ngắn)
      if (e.totalParts === 4 || e.title.includes("Full Writing")) return false;
      return e.partTitle?.includes("Part 1") || e.title.includes("Writing Part 1");
    } else if (activeTab === "p2") {
      // Part 2: Short Text Writing (Đoạn văn ngắn 20-30 từ)
      if (e.totalParts === 4 || e.title.includes("Full Writing")) return false;
      return e.partTitle?.includes("Part 2") || e.title.includes("Writing Part 2");
    } else if (activeTab === "p3") {
      // Part 3: Three Responses (Chat CLB)
      if (e.totalParts === 4 || e.title.includes("Full Writing")) return false;
      return e.partTitle?.includes("Part 3") || e.title.includes("Writing Part 3");
    } else if (activeTab === "p4") {
      // Part 4: Formal & Informal Emails
      if (e.totalParts === 4 || e.title.includes("Full Writing")) return false;
      return e.partTitle?.includes("Part 4") || e.title.includes("Writing Part 4");
    }
    return true;
  });

  // 2. Lọc tiếp theo search, status, priority, source từ currentTabExams
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
        ? e.priority === "HIGH"
        : filterPriority === "medium"
        ? e.priority === "MEDIUM"
        : e.priority === "LOW";
    const matchesSource = filterSource === "all" || filterSource === "web" ? true : false;
    return matchesSearch && matchesStatus && matchesPriority && matchesSource;
  }).sort((a, b) => (b.hotLevel || 0) - (a.hotLevel || 0));

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
          marathonText: "Luyện tất cả đề Part 1",
          marathonDesc: "Làm liên tục các câu hỏi Part 1 — Rèn luyện phản xạ từ vựng cơ bản",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p2":
        return {
          title: "Part 2 – Form filling (20-30 từ)",
          desc: "Viết một đoạn văn ngắn 20-30 từ điền vào đơn tham gia câu lạc bộ, nêu lý do và sở thích.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 2",
          partQuery: "?part=2",
          marathonText: "Luyện tất cả đề Part 2",
          marathonDesc: "Luyện tập các chủ đề CLB sát đề thi thật British Council",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p3":
        return {
          title: "Part 3 – Social network interaction (3 câu)",
          desc: "Trả lời 3 câu hỏi trên mạng xã hội của câu lạc bộ, mỗi câu 30-40 từ với 3 thành viên khác nhau.",
          subDesc: "Nhãn ưu tiên là các đề hay thi vào gần đây — Ưu tiên cao là đề nên luyện trước.",
          badge: "Part 3",
          partQuery: "?part=3",
          marathonText: "Luyện tất cả đề Part 3",
          marathonDesc: "Luyện viết đoạn văn trao đổi ý kiến, biểu đạt cảm xúc và quan điểm",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
      case "p4":
        return {
          title: "Part 4 – Formal & Informal emails",
          desc: "Viết 2 bức email: 1 email thân mật gửi bạn (khoảng 50 từ) và 1 email trang trọng gửi ban quản lý (120-150 từ).",
          badge: "Part 4",
          partQuery: "?part=4",
          marathonText: "Luyện tất cả đề Part 4",
          marathonDesc: "Rèn luyện phong cách trang trọng (Formal) và nâng band CEFR B2/C1",
          marathonBtn: "Mở khóa",
          marathonType: "marathon",
        };
    }
  };

  const tabInfo = getTabInfo();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] sm:pt-[calc(var(--navbar-total-height,64px)+22px)] md:pt-[calc(var(--navbar-total-height,64px)+28px)] transition-all duration-300">
        <section className="section-container py-6 md:py-8">
          {/* Search Box */}
          <div className="relative mb-6">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex w-full rounded-xl border border-input px-3 py-2 text-sm pl-10 h-11 bg-card placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
              placeholder="Tìm kiếm bộ đề Writing theo câu lạc bộ..."
            />
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
                onClick={() => setActiveTab(tab.id as any)}
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
            {/* Row 1: Lọc ưu tiên */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground font-semibold w-24">Lọc ưu tiên:</span>
              {[
                { id: "all", label: `Tất cả (${currentTabExams.length})` },
                { id: "high", label: `Ưu tiên cao (${currentTabExams.filter((e) => e.priority === "HIGH").length})` },
                { id: "medium", label: `Ưu tiên vừa (${currentTabExams.filter((e) => e.priority === "MEDIUM").length})` },
                ...(currentTabExams.some((e) => e.priority === "LOW")
                  ? [{ id: "low", label: `Ưu tiên thấp (${currentTabExams.filter((e) => e.priority === "LOW").length})` }]
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                  <button
                    type="button"
                    onClick={() => alert("Tính năng dành riêng cho gói Pro. Bạn có thể làm ngay các đề Free miễn phí bên cạnh!")}
                    className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm transition-colors text-center"
                  >
                    {tabInfo.marathonBtn}
                  </button>
                </div>
              </div>

              {/* CARD 2..N: Practice Exam Cards */}
              {filteredExams.map((exam, idx) => {
                const targetUrl = `/writing/${exam.id}${tabInfo.partQuery}`;
                const displayTitle =
                  activeTab === "full"
                    ? exam.title
                    : activeTab === "p1"
                    ? `Đề 0${idx + 1} - Writing Part 1 (Short Answers)`
                    : activeTab === "p2"
                    ? `Đề 0${idx + 1} - Writing Part 2 (Club Form)`
                    : activeTab === "p3"
                    ? `Đề 0${idx + 1} - Writing Part 3 (Social Network)`
                    : `Đề 0${idx + 1} - Writing Part 4 (Formal & Informal)`;

                return (
                  <div
                    key={exam.id}
                    className={`relative rounded-2xl border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group ${
                      exam.hotLevel === 3
                        ? "border-rose-500/40 shadow-rose-500/5 ring-1 ring-rose-500/20"
                        : exam.hotLevel === 2
                        ? "border-amber-500/30"
                        : "border-border"
                    }`}
                  >
                    <div>
                      {/* Top Badges & Score / Status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-[10px]">
                            {tabInfo.badge}
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
                          {exam.hotLevel === 3 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] animate-pulse border border-rose-500/30">
                              <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                              ĐỀ TỦ KỲ NÀY
                            </span>
                          ) : exam.hotLevel === 2 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px] border border-amber-500/30">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              ĐỀ HOT
                            </span>
                          ) : exam.hotLevel === 1 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 font-semibold text-[10px]">
                              <Star className="w-3 h-3 text-orange-500" />
                              Trọng tâm
                            </span>
                          ) : exam.priority === "HIGH" ? (
                            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px]">
                              Ưu tiên cao
                            </span>
                          ) : exam.priority === "MEDIUM" ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold text-[10px]">
                              Ưu tiên vừa
                            </span>
                          ) : null}
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
                      <h3 className="text-lg font-heading font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors">
                        {displayTitle}
                      </h3>

                      {/* Subtitle */}
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "full" ? "Full Writing · 4 Parts (50 phút)" : "✍️ Đề luyện tập AI chấm Writing"}
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
    </div>
  );
}
