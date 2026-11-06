"use client";

import { useState, useEffect, useRef } from "react";
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
import { useSkillHubTabSync } from "@/hooks/use-skill-hub";
import { SkillPartTabs } from "@/components/skills/skill-part-tabs";
import { SkillFilterBar } from "@/components/skills/skill-filter-bar";
import {
  SkillMarathonCard,
  SkillExamCard,
  SkillEmptyState,
} from "@/components/skills/skill-exam-card";

interface WritingExam {
  id: string;
  title: string;
  parts: string;
  totalParts: number;
  completedParts?: number;
  correctQuestions?: number | null;
  answeredQuestions?: number | null;
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
  const { activeTab, setActiveTab, selectTab } = useSkillHubTabSync("writing");
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
            let completedParts = Number(exam.completedParts || 0);
            let correctQuestions: number | null =
              exam.correctQuestions !== undefined && exam.correctQuestions !== null
                ? Number(exam.correctQuestions)
                : null;
            let answeredQuestions: number | null =
              exam.answeredQuestions !== undefined && exam.answeredQuestions !== null
                ? Number(exam.answeredQuestions)
                : null;
            let questionsCount = Number(
              exam.totalQuestions || (pNum === 1 ? 5 : pNum === 2 ? 1 : pNum === 3 ? 3 : pNum === 4 ? 2 : 11)
            );
            if (pNum === 4 && questionsCount === 1) questionsCount = 2;
            let bestScore = exam.bestCefr || exam.bestScore || null;

            if (typeof window !== "undefined") {
              try {
                const localProgStr = localStorage.getItem(`aptis_exam_progress_${exam.id}`);
                if (localProgStr) {
                  const localProg = JSON.parse(localProgStr);
                  if (localProg.status === "completed") {
                    status = "completed";
                    completedParts = isFullWriting ? 4 : 1;
                  } else if (
                    localProg.status === "in_progress" &&
                    status === "not_started" &&
                    ((localProg.answeredQuestions && localProg.answeredQuestions > 0) ||
                      (localProg.correctQuestions !== undefined && localProg.correctQuestions !== null))
                  ) {
                    status = "in_progress";
                    completedParts = localProg.completedParts || 1;
                  }
                  if (localProg.correctQuestions !== undefined && localProg.correctQuestions !== null) {
                    correctQuestions = Number(localProg.correctQuestions);
                  }
                  if (localProg.answeredQuestions !== undefined && localProg.answeredQuestions !== null) {
                    answeredQuestions = Number(localProg.answeredQuestions);
                  }
                  if (localProg.totalQuestions && Number(localProg.totalQuestions) > 0) {
                    questionsCount = Number(localProg.totalQuestions);
                  }
                  if ((localProg.bestCefr || localProg.bestScore) && !bestScore) {
                    bestScore = localProg.bestCefr || localProg.bestScore;
                  }
                }
              } catch {}
            }

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
              completedParts,
              correctQuestions,
              answeredQuestions,
              partTitle: exam.partTitle,
              partNumber: pNum,
              questionsCount,
              duration: `${exam.durationMinutes || (isFullWriting ? 50 : pNum === 1 ? 3 : pNum === 2 ? 7 : pNum === 3 ? 10 : 30)} phút`,
              isFree: !exam.isPro,
              status,
              bestScore,
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
        ? e.status === "completed" || e.status === "in_progress"
        : e.status === "not_started";
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
          <SkillPartTabs
            activeTab={activeTab}
            onSelectTab={selectTab}
            tabs={[
              { id: "full", label: "Full Part", sub: "Tất cả các Part" },
              { id: "p1", label: "Part 1", sub: "Word-level (1–5 từ)" },
              { id: "p2", label: "Part 2", sub: "Short text (20–30 từ)" },
              { id: "p3", label: "Part 3", sub: "Three responses (30–40 từ)" },
              { id: "p4", label: "Part 4", sub: "Formal & informal emails" },
            ]}
          />

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
          <SkillFilterBar
            exams={currentTabExams}
            activeTab={activeTab}
            filterPriority={filterPriority}
            setFilterPriority={setFilterPriority}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterSource={filterSource}
            setFilterSource={setFilterSource}
          />

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
          ) : filteredExams.length === 0 ? (
            <SkillEmptyState
              icon={<Sparkles className="w-10 h-10" />}
              title="Không có đề thi nào"
              description="Không tìm thấy đề thi Writing nào khớp với bộ lọc hiện tại."
              onResetFilters={() => {
                setSearchTerm("");
                setFilterPriority("all");
                setFilterStatus("all");
              }}
            />
          ) : (
            <div id="practice-sets-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 scroll-mt-24">
              <SkillMarathonCard
                marathonType={tabInfo.marathonType}
                marathonText={tabInfo.marathonText}
                marathonDesc={tabInfo.marathonDesc}
                marathonBtn={tabInfo.marathonBtn}
                marathonUrl={(tabInfo as any).marathonUrl}
                onActionClick={() => setIsGuideModalOpen(true)}
              />

              {filteredExams.map((exam) => {
                const targetUrl = `/writing/${exam.id}${tabInfo.partQuery}`;
                return (
                  <SkillExamCard
                    key={exam.id}
                    id={exam.id}
                    title={exam.title}
                    subtitle={activeTab === "full" ? "Full Writing · 4 Parts (50 phút)" : exam.parts || "Writing Practice"}
                    partBadge={exam.partNumber === 0 ? "Full Part" : `Part ${exam.partNumber}`}
                    isFree={exam.isFree}
                    isProOrAdmin={isProOrAdmin}
                    cloverLevel={exam.hotLevel}
                    trophyText={exam.bestScore}
                    status={exam.status}
                    completedParts={exam.completedParts}
                    totalParts={exam.totalParts || 1}
                    correctQuestions={exam.correctQuestions}
                    answeredQuestions={exam.answeredQuestions}
                    questionsCount={exam.questionsCount}
                    targetUrl={targetUrl}
                  />
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
