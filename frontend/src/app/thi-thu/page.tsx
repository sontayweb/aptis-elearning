"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  GraduationCap,
  Clock,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Key,
  AlertCircle,
  Flame,
  Star,
} from "lucide-react";

interface MockTest {
  id: string;
  name: string;
  code: string;
  totalTime: string;
  skills: string;
  difficulty: string;
  isFree: boolean;
  attempts: number;
  hotLevel: number;
  forecastTag?: string | null;
}

export default function MockExamListPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string>("ALL");
  const [hotOnly, setHotOnly] = useState(false);

  const loadExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParam: any = { limit: 50 };
      if (selectedSkill !== "ALL") {
        queryParam.skill = selectedSkill;
      }
      const res = await api.exams.getAll(queryParam);
      if (res.success && Array.isArray(res.data)) {
        const mapped = res.data.map((exam: any) => ({
          id: exam.id,
          name: exam.title,
          code: exam.code || `APT-${exam.id.slice(0, 6).toUpperCase()}`,
          totalTime: `${exam.durationMinutes || 162} phút`,
          skills: exam.skill === "FULL_TEST" ? "5 Phần: Speaking, Listening, Reading, Writing, Grammar" : (exam.skill || "Kỹ năng"),
          difficulty: "B1 - B2 Target",
          isFree: !exam.isPro,
          attempts: exam.attemptCount || 0,
          hotLevel: exam.hotLevel ?? exam.hot_level ?? 0,
          forecastTag: exam.forecastTag ?? exam.forecast_tag ?? null,
        }));
        setTests(mapped);
      } else {
        setError(res.error?.message || "Không thể tải danh sách đề thi thử từ máy chủ (Vui lòng kiểm tra CSDL).");
        setTests([]);
      }
    } catch (err: any) {
      console.error("Failed to load exams:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [selectedSkill]);

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;
    window.location.href = `/thi-thu/${roomCode.trim().toLowerCase()}`;
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
                Thi thử Aptis Online Miễn Phí
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                Đầy đủ cả 5 cấu phần bài thi chính thức: Grammar &amp; Vocabulary, Listening, Reading, Speaking và Writing. Có đồng hồ đếm ngược và AI chấm điểm tức thì.
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
                    Tham gia phòng thi thử bằng Mã Phòng
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Nhập mã phòng thi 7 ký tự (VD: APT-2026) do giảng viên hoặc trung tâm cấp phát.
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinByCode} className="flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="MÃ PHÒNG (VD: DE-1)"
                  className="px-3.5 py-2 rounded-xl border border-input bg-background font-mono font-bold text-sm tracking-wider uppercase h-10 w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="submit"
                  disabled={!roomCode.trim()}
                  className="tech-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs h-10 shadow-sm disabled:opacity-50 transition-colors"
                >
                  Vào thi
                </button>
              </form>
            </div>
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
                Chọn đề để bước vào phòng thi chuẩn hoá với áp lực thời gian thật
              </p>
            </div>

            {/* Filter Tabs & Hot Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border">
                {[
                  { id: "ALL", label: "Tất cả" },
                  { id: "FULL_TEST", label: "Full Test (4 kỹ năng)" },
                  { id: "READING", label: "📖 Reading" },
                  { id: "LISTENING", label: "🔊 Listening" },
                  { id: "WRITING", label: "✏️ Writing" },
                  { id: "SPEAKING", label: "🎙️ Speaking" },
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
                    ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white border-transparent shadow-glow-soft scale-102"
                    : "bg-card border-border text-foreground hover:border-rose-500/50 hover:text-rose-500"
                }`}
                title="Lọc nhanh các đề có mức độ hot cao nhất"
              >
                <Flame className={`w-3.5 h-3.5 ${hotOnly ? "fill-white text-white" : "text-rose-500 fill-rose-500"}`} />
                <span>Đề tủ &amp; Đề Hot ({tests.filter((t) => t.hotLevel > 0).length})</span>
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
              <p className="text-xs text-muted-foreground mt-1">Cơ sở dữ liệu hiện tại chưa có đề thi Full Test nào.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(hotOnly ? tests.filter((t) => t.hotLevel > 0) : tests)
              .slice()
              .sort((a, b) => (b.hotLevel || 0) - (a.hotLevel || 0))
              .map((test) => (
              <div
                key={test.id}
                className={`group relative rounded-2xl border bg-card p-6 shadow-sm transition-all flex flex-col justify-between hover:shadow-glow-soft ${
                  test.hotLevel === 3
                    ? "border-rose-500/50 bg-gradient-to-b from-rose-500/5 via-card to-card hover:border-rose-500"
                    : test.hotLevel === 2
                    ? "border-amber-500/40 hover:border-amber-500"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {test.code}
                      </span>
                      {test.isFree ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          MIỄN PHÍ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white">
                          VIP PRO
                        </span>
                      )}

                      {/* Hot Level Badges */}
                      {test.hotLevel === 3 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-2xs">
                          <Flame className="w-3 h-3 fill-white" />
                          <span>ĐỀ TỦ KỲ NÀY (3⭐)</span>
                        </span>
                      )}
                      {test.hotLevel === 2 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>ĐỀ HOT (2⭐)</span>
                        </span>
                      )}
                      {test.hotLevel === 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                          <Star className="w-3 h-3 text-blue-500 fill-blue-500" />
                          <span>ÔN TRỌNG TÂM</span>
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

                  <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span>Thời lượng: {test.totalTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" />
                      <span>{test.skills}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    Mục tiêu: {test.difficulty}
                  </span>
                  <Link
                    href={`/thi-thu/${test.id}`}
                    className="tech-btn inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-md transition-all"
                  >
                    <span>Vào phòng thi</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
