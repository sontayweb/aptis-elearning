"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { GlowCard } from "@/components/glow-card";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  LineChart as LucideLineChart,
  Calendar,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type SkillKey = "all" | "grammar" | "reading" | "listening" | "speaking" | "writing";
type TimeRange = "7d" | "30d" | "3m" | "all";

interface SkillConfig {
  key: SkillKey;
  label: string;
  color: string;
}

const SKILLS: SkillConfig[] = [
  { key: "grammar", label: "Grammar", color: "hsl(var(--primary))" },
  { key: "listening", label: "Listening", color: "hsl(217 91% 60%)" },
  { key: "reading", label: "Reading", color: "hsl(142 70% 45%)" },
  { key: "speaking", label: "Speaking", color: "hsl(280 80% 55%)" },
  { key: "writing", label: "Writing", color: "hsl(340 75% 55%)" },
];

/** Parse chuỗi ngày từ API history: "DD/MM/YYYY HH:MM" → Date */
function parseHistoryDate(datePart: string): Date | null {
  const [dd, mm, yyyy] = datePart.split("/");
  if (!dd || !mm || !yyyy) return null;
  return new Date(parseInt(yyyy), parseInt(mm) - 1, parseInt(dd));
}

export default function ProgressPage() {
  const { isAuthenticated } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<SkillKey>("all");
  const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number } | null>(null);

  // State khởi tạo rỗng — sẽ được điền bằng data thực từ API
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [skillsComparison, setSkillsComparison] = useState<any[]>([]);
  const [activityMap, setActivityMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProgressData() {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const [historyRes, statsRes] = await Promise.all([
          api.submissions.getMyHistory({ limit: 200 }).catch(() => null),
          api.student.getDashboardStats().catch(() => null),
        ]);

        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // Accumulators cho so sánh tháng này vs tháng trước (điểm dưới dạng %)
        const SKILL_LABELS = ["Grammar", "Listening", "Reading", "Speaking", "Writing"];
        const thisMonthScores: Record<string, number[]> = {
          Grammar: [], Listening: [], Reading: [], Speaking: [], Writing: [],
        };
        const prevMonthScores: Record<string, number[]> = {
          Grammar: [], Listening: [], Reading: [], Speaking: [], Writing: [],
        };

        if (historyRes?.success && Array.isArray(historyRes.data) && historyRes.data.length > 0) {
          const act: Record<string, number> = {};
          const grouped: Record<string, any> = {};

          historyRes.data.forEach((sub: any) => {
            // datePart: "DD/MM/YYYY" (lấy phần ngày từ "DD/MM/YYYY HH:MM")
            const datePart = sub.date ? sub.date.split(" ")[0] : "";
            if (datePart) {
              act[datePart] = (act[datePart] || 0) + 1;
            }

            // Khoá timeline: "DD/MM" (5 ký tự đầu)
            const dateKey = datePart ? datePart.slice(0, 5) : "Nay";
            if (!grouped[dateKey]) {
              grouped[dateKey] = { date: dateKey, grammar: 0, listening: 0, reading: 0, speaking: 0, writing: 0 };
            }

            const sk = (sub.skill || "").toLowerCase();
            // Chuyển raw score (0–50) → phần trăm (0–100) để vẽ biểu đồ thống nhất
            const rawScore = typeof sub.scoreNumber === "number" ? sub.scoreNumber : 0;
            const scorePct = Math.round((rawScore / 50) * 100);

            let skLabel: string | null = null;
            if (sk.includes("grammar")) { grouped[dateKey].grammar = scorePct; skLabel = "Grammar"; }
            else if (sk.includes("listening")) { grouped[dateKey].listening = scorePct; skLabel = "Listening"; }
            else if (sk.includes("reading")) { grouped[dateKey].reading = scorePct; skLabel = "Reading"; }
            else if (sk.includes("speaking")) { grouped[dateKey].speaking = scorePct; skLabel = "Speaking"; }
            else if (sk.includes("writing")) { grouped[dateKey].writing = scorePct; skLabel = "Writing"; }

            // Phân loại vào tháng này / tháng trước để tính điểm trung bình
            if (skLabel && scorePct > 0 && datePart) {
              const subDate = parseHistoryDate(datePart);
              if (subDate) {
                if (subDate >= thisMonthStart) {
                  thisMonthScores[skLabel].push(scorePct);
                } else if (subDate >= prevMonthStart) {
                  prevMonthScores[skLabel].push(scorePct);
                }
              }
            }
          });

          setActivityMap(act);

          // Sắp xếp timeline theo ngày tăng dần (DD/MM)
          const entries = Object.values(grouped).sort((a: any, b: any) => {
            const [ad, am] = a.date.split("/").map(Number);
            const [bd, bm] = b.date.split("/").map(Number);
            return am !== bm ? am - bm : ad - bd;
          });
          if (entries.length > 0) setTimelineData(entries as any);

          // Xây dựng so sánh tháng từ lịch sử thực tế
          const comparison = SKILL_LABELS.map((label) => {
            const currArr = thisMonthScores[label];
            const prevArr = prevMonthScores[label];
            const curr = currArr.length > 0
              ? Math.round(currArr.reduce((a, b) => a + b, 0) / currArr.length)
              : 0;
            const prev = prevArr.length > 0
              ? Math.round(prevArr.reduce((a, b) => a + b, 0) / prevArr.length)
              : 0;
            return { skill: label, current: curr, previous: prev, delta: curr - prev };
          });

          if (comparison.some((c) => c.current > 0 || c.previous > 0)) {
            setSkillsComparison(comparison);
            return; // Đã có data thực — không cần fallback
          }
        }

        // Fallback: dùng avgScore từ dashboard-stats nếu history rỗng
        if (statsRes?.success && statsRes.data?.skillProgress) {
          const fallback = statsRes.data.skillProgress.map((sp: any) => ({
            skill: sp.skill,
            // avgScore (0-100%) do BE tính sẵn; nếu chưa có thì tạm dùng 0
            current: sp.avgScore ?? 0,
            previous: 0,
            delta: 0,
          }));
          if (fallback.some((c: any) => c.current > 0)) {
            setSkillsComparison(fallback);
          }
        }
      } catch (err) {
        console.warn("Không thể tải dữ liệu tiến độ:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProgressData();
  }, [isAuthenticated]);

  // Lọc dữ liệu timeline theo khoảng thời gian
  const filteredTimeline = useMemo(() => {
    if (selectedRange === "7d") return timelineData.slice(-3);
    if (selectedRange === "30d") return timelineData;
    return timelineData;
  }, [selectedRange, timelineData]);

  // Tạo ma trận heatmap 13 tuần x 7 ngày theo hoạt động thực tế của học viên
  const heatmapWeeks = useMemo(() => {
    const weeks: { dateStr: string; count: number; level: number }[][] = [];
    const today = new Date();
    const totalDays = 13 * 7;
    
    let currentDay = new Date(today);
    currentDay.setDate(today.getDate() - totalDays + 1);

    for (let w = 0; w < 13; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const dateCopy = new Date(currentDay);
        const dayStr = `${dateCopy.getDate().toString().padStart(2, "0")}/${(dateCopy.getMonth() + 1).toString().padStart(2, "0")}/${dateCopy.getFullYear()}`;
        
        // Đọc số bài làm thực tế từ activityMap của học viên
        const count = activityMap[dayStr] || 0;

        let level = 0;
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;

        days.push({ dateStr: dayStr, count, level });
        currentDay.setDate(currentDay.getDate() + 1);
      }
      weeks.push(days);
    }
    return weeks;
  }, [activityMap]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 pt-20 md:pt-24 pb-20">
        <div className="section-container max-w-6xl mx-auto space-y-6">
          {/* Header & Tiêu đề trang */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-foreground">
                Tiến độ học tập
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Theo dõi sự tiến bộ của bạn qua thời gian
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 border border-primary/25 text-primary hover:bg-primary/20 transition-colors"
              >
                Lịch sử làm bài
              </Link>
            </div>
          </div>

          {/* ================= SECTION 1: ĐIỂM THEO THỜI GIAN ================= */}
          <section className="glass-card p-5 md:p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h2 className="font-heading font-bold text-foreground text-lg flex items-center gap-2">
                <LucideLineChart className="w-5 h-5 text-primary" />
                <span>Điểm theo thời gian</span>
              </h2>

              {/* Bộ lọc kỹ năng */}
              <div className="flex flex-wrap gap-2">
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setSelectedSkill("all")}
                    className={`tech-btn inline-flex items-center justify-center text-xs font-semibold h-8 rounded-lg px-3 transition-colors ${
                      selectedSkill === "all"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-primary/40 text-primary dark:text-primary-foreground bg-background hover:bg-primary/10"
                    }`}
                  >
                    Tất cả
                  </button>
                  {SKILLS.map((sk) => (
                    <button
                      key={sk.key}
                      type="button"
                      onClick={() => setSelectedSkill(sk.key)}
                      className={`tech-btn inline-flex items-center justify-center text-xs font-semibold h-8 rounded-lg px-3 transition-colors ${
                        selectedSkill === sk.key
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-primary/40 text-primary dark:text-primary-foreground bg-background hover:bg-primary/10"
                      }`}
                    >
                      {sk.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bộ lọc thời gian */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {(
                [
                  { id: "7d", label: "7 ngày" },
                  { id: "30d", label: "30 ngày" },
                  { id: "3m", label: "3 tháng" },
                  { id: "all", label: "Tất cả" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedRange(tab.id)}
                  className={`tech-btn inline-flex items-center justify-center text-xs font-medium h-7 rounded-md px-2.5 transition-colors ${
                    selectedRange === tab.id
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Line Chart hoặc Empty State */}
            {filteredTimeline.length === 0 ? (
              <div className="h-72 w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20">
                <LucideLineChart className="w-10 h-10 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Chưa có dữ liệu điểm số.<br />
                  <span className="text-xs">Hoàn thành bài thi đầu tiên để xem biểu đồ tiến bộ của bạn.</span>
                </p>
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={filteredTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      unit="%"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "10px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                      }}
                      labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                      formatter={(val: any) => [`${val}%`, ""]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                      formatter={(val) => <span className="text-foreground text-xs font-medium">{val}</span>}
                    />

                    {/* Render các lines dựa theo skill filter */}
                    {SKILLS.map((sk) => {
                      const isVisible = selectedSkill === "all" || selectedSkill === sk.key;
                      if (!isVisible) return null;
                      return (
                        <Line
                          key={sk.key}
                          type="monotone"
                          dataKey={sk.key}
                          name={sk.label}
                          stroke={sk.color}
                          strokeWidth={2.5}
                          dot={{ r: 4, strokeWidth: 1.5, fill: "hsl(var(--background))" }}
                          activeDot={{ r: 6, stroke: sk.color, strokeWidth: 2 }}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* ================= SECTION 2: HOẠT ĐỘNG 3 THÁNG GẦN NHẤT ================= */}
          <section className="glass-card p-5 md:p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading font-bold text-foreground text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <span>Hoạt động 3 tháng gần nhất</span>
              </h2>

              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span>Ít</span>
                <div className="w-3 h-3 rounded-sm bg-muted/40" />
                <div className="w-3 h-3 rounded-sm bg-primary/30" />
                <div className="w-3 h-3 rounded-sm bg-primary/50" />
                <div className="w-3 h-3 rounded-sm bg-primary/75" />
                <div className="w-3 h-3 rounded-sm bg-primary" />
                <span>Nhiều</span>
              </div>
            </div>

            {/* Matrix Github-style Heatmap */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-flex gap-1.5 p-2 bg-muted/10 rounded-xl border border-border/40">
                {heatmapWeeks.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1.5">
                    {week.map((day, dIdx) => {
                      let bgClass = "bg-muted/40";
                      if (day.level === 1) bgClass = "bg-primary/30";
                      else if (day.level === 2) bgClass = "bg-primary/50";
                      else if (day.level === 3) bgClass = "bg-primary/75";
                      else if (day.level === 4) bgClass = "bg-primary";

                      return (
                        <div
                          key={dIdx}
                          onMouseEnter={() => setHoveredCell({ date: day.dateStr, count: day.count })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-3.5 h-3.5 rounded-sm ${bgClass} hover:ring-2 hover:ring-primary/60 transition cursor-pointer`}
                          title={`${day.dateStr}: ${day.count} bài luyện tập`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Tooltip hiển thị khi hover trên ô ngày */}
              <div className="h-6 mt-2 text-xs text-muted-foreground flex items-center">
                {hoveredCell ? (
                  <span className="font-medium text-foreground">
                    📅 Ngày {hoveredCell.date}:{" "}
                    <strong className="text-primary">{hoveredCell.count} bài luyện thi</strong> đã hoàn thành
                  </span>
                ) : (
                  <span>Di chuột vào ô vuông để xem chi tiết bài học theo ngày</span>
                )}
              </div>
            </div>
          </section>

          {/* ================= SECTION 3: SO SÁNH THÁNG NÀY VỚI THÁNG TRƯỚC ================= */}
          <section className="glass-card p-5 md:p-6 rounded-2xl border border-border bg-card/70 backdrop-blur-md shadow-sm">
            <h2 className="font-heading font-bold text-foreground text-lg flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>So sánh tháng này với tháng trước</span>
            </h2>

            {/* Bar Chart so sánh hoặc Empty State */}
            {skillsComparison.length === 0 ? (
              <div className="h-64 w-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 mb-6">
                <BarChart3 className="w-10 h-10 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground text-center px-4">
                  Chưa có dữ liệu để so sánh.<br />
                  <span className="text-xs">Làm bài thi trong tháng này để hệ thống so sánh tiến bộ tự động.</span>
                </p>
              </div>
            ) : (
              <>
                {/* Recharts Bar Chart kép */}
                <div className="h-64 w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={skillsComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                      <XAxis
                        dataKey="skill"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        unit="%"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "10px",
                          fontSize: "12px",
                          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "hsl(var(--foreground))" }}
                        formatter={(val: any) => [`${val}%`, ""]}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", paddingBottom: "10px" }}
                        formatter={(val) => <span className="text-foreground text-xs font-medium">{val}</span>}
                      />
                      <Bar
                        dataKey="current"
                        name="Tháng này"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        name="Tháng trước"
                        fill="hsl(var(--muted-foreground) / 0.5)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 5 Thẻ tóm tắt so sánh kỹ năng */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {skillsComparison.map((item) => {
                    const isPositive = item.delta > 0;
                    const isNegative = item.delta < 0;

                    return (
                      <div
                        key={item.skill}
                        className="rounded-xl border border-border p-3.5 bg-card/90 hover:border-primary/40 transition-colors shadow-sm"
                      >
                        <div className="text-xs font-semibold text-muted-foreground">{item.skill}</div>
                        <div className="mt-1 flex items-baseline gap-1">
                          <span className="text-2xl font-bold font-heading text-foreground">
                            {item.current}%
                          </span>
                        </div>

                        <div
                          className={`mt-1.5 inline-flex items-center gap-1 text-xs font-medium ${
                            isPositive
                              ? "text-emerald-500"
                              : isNegative
                              ? "text-rose-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {isPositive ? (
                            <>
                              <ArrowUp className="w-3.5 h-3.5" />
                              <span>+{item.delta}% so với tháng trước</span>
                            </>
                          ) : isNegative ? (
                            <>
                              <ArrowDown className="w-3.5 h-3.5" />
                              <span>{item.delta}% so với tháng trước</span>
                            </>
                          ) : (
                            <>
                              <Minus className="w-3.5 h-3.5" />
                              <span>{item.previous > 0 ? "0% thay đổi" : "Chưa có tháng trước"}</span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
