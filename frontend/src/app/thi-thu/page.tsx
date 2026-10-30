"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  GraduationCap,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Key,
  AlertCircle,
  Loader2,
  RotateCcw,
  PlayCircle,
  Sparkles,
  Lock,
  Crown,
  X,
} from "lucide-react";

const VALID_SKILLS = [
  "FULL_TEST",
  "ALL",
  "GRAMMAR_VOCABULARY",
  "READING",
  "LISTENING",
  "WRITING",
  "SPEAKING",
];

interface MockTest {
  id: string;
  name: string;
  code: string;
  totalTime: string;
  skills: string;
  difficulty: string;
  isFree: boolean;
  hasProAccess?: boolean;
  isLocked?: boolean;
  attempts: number;
  hotLevel: number;
  forecastTag?: string | null;
  totalQuestions: number;
  totalParts: number;
  userStatus: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  bestScore: string | null;
  bestCefr: string | null;
  userAttempts: number;
}

function formatSkillSummary(skill?: string, totalParts?: number, totalQuestions?: number): string {
  const qText = totalQuestions ? ` (${totalQuestions} câu)` : "";
  switch (skill) {
    case "FULL_TEST":
      return `4 Kỹ năng (16 Parts): Listening, Reading, Writing, Speaking${qText}`;
    case "GRAMMAR_VOCABULARY":
      return `Grammar & Vocabulary${qText}`;
    case "READING":
      return `Reading · ${totalParts || 4} Parts${qText}`;
    case "LISTENING":
      return `Listening · ${totalParts || 4} Parts${qText}`;
    case "WRITING":
      return `Writing · ${totalParts || 4} Parts${qText}`;
    case "SPEAKING":
      return `Speaking · ${totalParts || 4} Parts${qText}`;
    default:
      return `${skill || "Kỹ năng Aptis"}${qText}`;
  }
}

export default function MockExamListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const userHasPro = Boolean(
    user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "TEACHER" ||
        (user.subscription?.code && user.subscription.code !== "FREE"))
  );

  const [tests, setTests] = useState<MockTest[]>([]);
  const [lockedExamModal, setLockedExamModal] = useState<MockTest | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Khôi phục bộ lọc từ URL hoặc sessionStorage, mặc định mở tab "FULL_TEST" (20 đề thi thử Full Test)
  const [selectedSkill, setSelectedSkill] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlSkill = new URLSearchParams(window.location.search).get("skill");
      if (urlSkill && VALID_SKILLS.includes(urlSkill)) {
        return urlSkill;
      }
      const saved = sessionStorage.getItem("thi_thu_selected_skill_v2");
      if (saved && VALID_SKILLS.includes(saved)) {
        return saved;
      }
    }
    return "FULL_TEST";
  });

  const [hotOnly, setHotOnly] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const urlHot = new URLSearchParams(window.location.search).get("hot");
      if (urlHot === "true") return true;
      return sessionStorage.getItem("thi_thu_hot_only") === "true";
    }
    return false;
  });

  // Tự động lưu bộ lọc vào sessionStorage & URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("thi_thu_selected_skill_v2", selectedSkill);
      sessionStorage.setItem("thi_thu_hot_only", String(hotOnly));

      try {
        const url = new URL(window.location.href);
        if (selectedSkill !== "FULL_TEST") {
          url.searchParams.set("skill", selectedSkill);
        } else {
          url.searchParams.delete("skill");
        }
        if (hotOnly) {
          url.searchParams.set("hot", "true");
        } else {
          url.searchParams.delete("hot");
        }
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
  }, [selectedSkill, hotOnly]);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParam: any = { limit: 100 };
      if (selectedSkill !== "ALL") {
        queryParam.skill = selectedSkill;
      }
      const res = await api.exams.getAll(queryParam);
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const mapped: MockTest[] = res.data.map((exam: any) => ({
          id: exam.id,
          name: exam.title,
          code: exam.code || `APT-${exam.id.slice(0, 6).toUpperCase()}`,
          totalTime: `${exam.durationMinutes || 137} phút`,
          skills: formatSkillSummary(exam.skill, exam.totalParts, exam.totalQuestions),
          difficulty: exam.skill === "FULL_TEST" ? "Chuẩn CEFR A1 – C" : "B1 - B2 Target",
          isFree: !exam.isPro,
          hasProAccess: Boolean(exam.hasProAccess),
          isLocked:
            exam.isLocked !== undefined
              ? Boolean(exam.isLocked)
              : Boolean(exam.isPro && !exam.hasProAccess),
          attempts: exam.attemptCount || 0,
          hotLevel: exam.hotLevel ?? exam.hot_level ?? 0,
          forecastTag: exam.forecastTag ?? exam.forecast_tag ?? null,
          totalQuestions: exam.totalQuestions || 0,
          totalParts: exam.totalParts || 1,
          userStatus: exam.userStatus || "NOT_STARTED",
          bestScore: exam.bestScore || null,
          bestCefr: exam.bestCefr || null,
          userAttempts: exam.userAttempts || 0,
        }));
        setTests(mapped);
      } else {
        setTests([]);
      }
    } catch (err: any) {
      console.warn("Failed to load mock tests:", err);
      setError("Không thể tải danh sách đề thi thử từ máy chủ.");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [selectedSkill]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim();
    if (!cleanCode || joiningRoom) return;

    setJoiningRoom(true);
    setRoomError(null);
    try {
      // Kiểm tra trong danh sách đã tải trước để chuyển hướng tức thì nếu khớp mã
      const localMatch = tests.find(
        (t) =>
          t.code.toUpperCase() === cleanCode.toUpperCase() ||
          t.id.toLowerCase() === cleanCode.toLowerCase()
      );
      if (localMatch) {
        const locked = !localMatch.isFree && !userHasPro && !localMatch.hasProAccess;
        if (locked) {
          setLockedExamModal(localMatch);
          return;
        }
        router.push(`/thi-thu/${localMatch.id}`);
        return;
      }

      // Xác thực mã đề với Backend trước khi vào phòng thi
      const res = await api.exams.getById(cleanCode);
      if (res.success && res.data?.id) {
        const examData = res.data as any;
        const locked = Boolean(examData.isPro && !userHasPro && !examData.hasProAccess);
        if (locked) {
          setLockedExamModal({
            id: examData.id,
            name: examData.title || `Đề thi ${cleanCode.toUpperCase()}`,
            code: examData.code || cleanCode.toUpperCase(),
            totalTime: `${examData.durationMinutes || 137} phút`,
            skills: formatSkillSummary(examData.skill, examData.parts?.length, examData.totalQuestions),
            difficulty: "Chuẩn CEFR A1 – C",
            isFree: false,
            hasProAccess: false,
            isLocked: true,
            attempts: examData.attemptCount || 0,
            hotLevel: examData.hotLevel || 0,
            totalQuestions: examData.totalQuestions || 0,
            totalParts: examData.parts?.length || 16,
            userStatus: "NOT_STARTED",
            bestScore: null,
            bestCefr: null,
            userAttempts: 0,
          });
          return;
        }
        router.push(`/thi-thu/${res.data.id}`);
      } else {
        setRoomError(
          res.error?.message ||
            `Không tìm thấy đề thi ứng với mã "${cleanCode.toUpperCase()}". Vui lòng kiểm tra lại mã trên thẻ đề (VD: APT-01 đến APT-20).`
        );
      }
    } catch {
      setRoomError("Không thể kiểm tra mã đề lúc này. Vui lòng thử lại.");
    } finally {
      setJoiningRoom(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "hsl(var(--primary) / 0.3)" }}
          />

          <div className="section-container py-12 md:py-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit text-xs font-bold mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Mô phỏng 100% phần mềm thi máy tính British Council</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
                Hệ Thống 20 Bộ Đề Thi Thử Aptis ESOL Full Test
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Mỗi bộ đề thi thử (<span className="font-mono font-bold text-foreground">APT-01</span> đến <span className="font-mono font-bold text-foreground">APT-20</span>) được tổng hợp chuẩn 4 kỹ năng chính thức (Listening, Reading, Writing, Speaking — 16 Parts) để bạn luyện full đề bất kỳ lúc nào, làm quen áp lực thời gian và kiểm tra tổng kiến thức trước kỳ thi.
              </p>
            </div>
          </div>
        </section>

        {/* Join by Room Code Box (SRS 3.4) */}
        <section className="section-container pt-8">
          <div className="rounded-2xl border border-primary/30 bg-card p-5 md:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base md:text-lg text-foreground">
                    Vào nhanh đề thi thử bằng Mã Đề riêng
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Nhập mã đề thi thử (VD: <span className="font-mono font-bold text-foreground">APT-01</span> miễn phí hoặc <span className="font-mono font-bold text-foreground">APT-02</span> → <span className="font-mono font-bold text-foreground">APT-20</span> dành cho tài khoản VIP PRO).
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinByCode} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    if (roomError) setRoomError(null);
                  }}
                  placeholder="MÃ ĐỀ (VD: APT-01)"
                  className="px-3.5 py-2 rounded-xl border border-input bg-background font-mono font-bold text-sm tracking-wider uppercase h-10 w-52 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!roomCode.trim() || joiningRoom}
                  className="tech-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs h-10 shadow-sm disabled:opacity-50 transition-colors inline-flex items-center gap-1.5"
                >
                  {joiningRoom ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang tìm...</span>
                    </>
                  ) : (
                    <span>Vào thi</span>
                  )}
                </button>
              </form>
            </div>

            {roomError && (
              <div className="mt-3 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{roomError}</span>
              </div>
            )}
          </div>
        </section>

        {/* Mock Exam Cards Grid */}
        <section className="section-container py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-heading font-bold text-foreground">
                Danh sách đề thi Aptis ESOL 2026
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Đề <span className="font-mono font-bold text-foreground">APT-01</span> mở miễn phí cho mọi học viên · Đề <span className="font-mono font-bold text-foreground">APT-02</span> đến <span className="font-mono font-bold text-foreground">APT-20</span> tự động mở khóa khi đăng nhập tài khoản VIP PRO
              </p>
            </div>

            {/* Filter Tabs & Hot Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
                {[
                  { id: "FULL_TEST", label: "🔥 Full Test (20 Đề chuẩn)" },
                  { id: "ALL", label: "Tất cả" },
                  { id: "LISTENING", label: "🔊 Listening" },
                  { id: "READING", label: "📖 Reading" },
                  { id: "WRITING", label: "✏️ Writing" },
                  { id: "SPEAKING", label: "🎙️ Speaking" },
                  { id: "GRAMMAR_VOCABULARY", label: "🔤 Grammar & Vocab" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedSkill(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedSkill === tab.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Nút lọc Đề Hot / Đề Tủ */}
              <button
                type="button"
                onClick={() => setHotOnly(!hotOnly)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
                  hotOnly
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20 scale-102"
                    : "bg-card border-border text-foreground hover:border-emerald-500/50 hover:text-emerald-600"
                }`}
                title="Lọc nhanh các đề có mức độ hot cao nhất"
              >
                <span>☘️ Đề Hot ({tests.filter((t) => t.hotLevel > 0).length})</span>
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-muted-foreground space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Đang tải danh sách đề thi thử từ hệ thống...</p>
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
          ) : tests.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
              <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="font-heading font-bold text-base text-foreground">Không có đề thi thử nào</h3>
              <p className="text-xs text-muted-foreground mt-1">Chưa tìm thấy đề thi tương ứng với bộ lọc đã chọn.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(hotOnly ? tests.filter((t) => t.hotLevel > 0) : tests)
              .slice()
              .sort((a, b) => {
                if (hotOnly) {
                  return (b.hotLevel || 0) - (a.hotLevel || 0);
                }
                if (selectedSkill === "FULL_TEST") {
                  return a.code.localeCompare(b.code, undefined, { numeric: true });
                }
                return (b.hotLevel || 0) - (a.hotLevel || 0);
              })
              .map((test) => {
                const isExamLocked = !test.isFree && !userHasPro && !test.hasProAccess;
                return (
              <div
                key={test.id}
                className={`group relative rounded-2xl border bg-card p-6 shadow-sm transition-all flex flex-col justify-between hover:shadow-glow-soft ${
                  test.hotLevel >= 4
                    ? "border-emerald-500/50 bg-gradient-to-b from-emerald-500/5 via-card to-card hover:border-emerald-500"
                    : test.hotLevel >= 2
                    ? "border-teal-500/40 hover:border-teal-500"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-foreground bg-muted px-2.5 py-0.5 rounded border border-border">
                        {test.code}
                      </span>
                      {test.isFree ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          MIỄN PHÍ · ĐỀ MẪU
                        </span>
                      ) : isExamLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30">
                          <Lock className="w-2.5 h-2.5" />
                          <span>VIP PRO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white">
                          <Crown className="w-2.5 h-2.5" />
                          <span>VIP PRO · ĐÃ MỞ</span>
                        </span>
                      )}

                      {/* Hot Level Badges: Pure Clovers */}
                      {test.hotLevel > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                          {"☘️".repeat(Math.min(5, test.hotLevel))}
                        </span>
                      )}

                      {test.forecastTag && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Sparkles className="w-3 h-3" />
                          <span>{test.forecastTag}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {test.attempts} lượt thi
                    </span>
                  </div>

                  <h3 className="font-heading font-extrabold text-xl text-foreground mb-3 group-hover:text-primary transition-colors">
                    {test.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 mb-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary shrink-0" />
                      <span>Thời lượng: {test.totalTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent shrink-0" />
                      <span className="truncate" title={test.skills}>{test.skills}</span>
                    </div>
                  </div>

                  {/* User Progress Status Badge */}
                  {test.userStatus === "IN_PROGRESS" && (
                    <div className="mb-4 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <PlayCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Đang có bài thi làm dở</span>
                      </span>
                      <span className="text-[11px] opacity-85">Tự động khôi phục khi vào</span>
                    </div>
                  )}

                  {test.userStatus === "COMPLETED" && (
                    <div className="mb-4 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Đã hoàn thành ({test.userAttempts} lần)</span>
                      </span>
                      {test.bestScore && (
                        <span>
                          Điểm cao nhất: <strong>{test.bestScore}</strong>
                          {test.bestCefr ? ` · Band ${test.bestCefr}` : ""}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    Mục tiêu: {test.difficulty}
                  </span>
                  {isExamLocked ? (
                    <button
                      type="button"
                      onClick={() => setLockedExamModal(test)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/30 cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Mở khóa đề PRO</span>
                    </button>
                  ) : (
                    <Link
                      href={`/thi-thu/${test.id}`}
                      className={`tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
                        test.userStatus === "IN_PROGRESS"
                          ? "bg-amber-600 text-white hover:bg-amber-700"
                          : "bg-primary text-primary-foreground hover:bg-brand-brown"
                      }`}
                    >
                      {test.userStatus === "IN_PROGRESS" ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Tiếp tục làm bài</span>
                        </>
                      ) : test.userStatus === "COMPLETED" ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Thi lại đề này</span>
                        </>
                      ) : (
                        <>
                          <span>Vào phòng thi</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </Link>
                  )}
                </div>
              </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Modal thông báo quyền riêng tư VIP PRO cho các đề APT-02 -> APT-20 */}
      {lockedExamModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setLockedExamModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center mb-4">
              <Crown className="w-6 h-6" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted font-mono text-xs font-bold text-foreground mb-2">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Mã đề: {lockedExamModal.code}</span>
            </div>

            <h3 className="font-heading font-extrabold text-xl text-foreground mb-2">
              Đề thi dành riêng cho tài khoản VIP PRO
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              Bộ đề <strong>{lockedExamModal.name}</strong> được thiết lập quyền riêng tư chỉ mở cho học viên đã đăng ký gói <strong>VIP PRO</strong>. Bạn có thể thi thử miễn phí <strong>Đề mẫu số 01 (APT-01)</strong> hoặc nâng cấp tài khoản để mở khóa toàn bộ 20 bộ đề Full Test.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {!user ? (
                <Link
                  href="/login"
                  className="flex-1 text-center px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:opacity-95 transition-opacity"
                >
                  Đăng nhập tài khoản PRO
                </Link>
              ) : null}
              <Link
                href="/bang-gia"
                className="flex-1 text-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold text-xs hover:opacity-95 transition-opacity"
              >
                Nâng cấp gói VIP PRO
              </Link>
              <button
                type="button"
                onClick={() => setLockedExamModal(null)}
                className="px-4 py-2.5 rounded-xl border border-border bg-muted/50 text-foreground font-bold text-xs hover:bg-muted transition-colors"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}
