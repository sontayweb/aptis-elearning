"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Flame,
  CircleCheck,
  Target,
  TrendingUp,
  Crown,
  Calendar,
  Pencil,
  X,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";

import { useEventTheme } from "@/contexts/event-theme-context";
import { api } from "@/lib/api-client";

interface HeroBannerProps {
  displayName?: string;
  skillsCovered?: number;
  streak?: number;
  totalQuestions?: number;
  accuracy?: number;
  currentLevel?: string;
  aiCreditsRemaining?: number;
  aiCreditsTotal?: number;
  planName?: string;
}

function hexToRgb(hex?: string): { r: number; g: number; b: number } {
  if (!hex || !hex.startsWith("#")) return { r: 37, g: 99, b: 235 };
  const cleanHex = hex.replace("#", "");
  const num = parseInt(
    cleanHex.length === 3
      ? cleanHex.split("").map((c) => c + c).join("")
      : cleanHex,
    16
  );
  if (isNaN(num)) return { r: 37, g: 99, b: 235 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function HeroBanner({
  displayName = "Thí sinh Aptis",
  skillsCovered = 1,
  streak = 0,
  totalQuestions = 0,
  accuracy = 0,
  currentLevel = "Chưa thi",
  aiCreditsRemaining = 3,
  aiCreditsTotal = 3,
  planName = "Miễn phí",
}: HeroBannerProps) {
  const { config: eventConfig } = useEventTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Goal State
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAim, setCurrentAim] = useState("B2");
  const [currentDate, setCurrentDate] = useState("2026-11-15");
  const [targetCount, setTargetCount] = useState(3);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadGoal() {
      try {
        const res = await api.student.getGoal();
        if (res.success && res.data) {
          if (res.data.aim) setCurrentAim(res.data.aim);
          if (res.data.dailyTarget) setTargetCount(res.data.dailyTarget);
          if (res.data.examDate) setCurrentDate(res.data.examDate.slice(0, 10));
        }
      } catch (err) {
        console.warn("Using default goal props:", err);
      }
    }
    loadGoal();
  }, []);

  const handleSaveGoal = async () => {
    setIsSaving(true);
    try {
      await api.student.updateGoal({
        aim: currentAim,
        dailyTarget: targetCount,
        examDate: currentDate,
      });
      setModalOpen(false);
    } catch (err) {
      console.error("Failed to save goal:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Format date display (DD/MM/YYYY)
  const formatDisplayDate = (dStr: string) => {
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return dStr;
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return dStr;
    }
  };

  // Calculate days remaining
  const daysRemaining = Math.max(
    0,
    Math.ceil(
      (new Date(currentDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Radial progress calculations (Radius 36 -> Circumference = 2 * PI * 36 ≈ 226)
  const progressPercent = Math.min(
    100,
    Math.round(
      skillsCovered > 0 ? (skillsCovered / 5) * 60 + Math.min(40, streak * 5) : 0
    )
  );
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Particle Canvas Background Animation (Preserved from Event Theme)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb =
      eventConfig.enabled && eventConfig.primaryColor
        ? hexToRgb(eventConfig.primaryColor)
        : { r: 37, g: 99, b: 235 };

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener("resize", handleResize);

    const count = 28;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 1.5 + 0.8,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Faint lines connecting particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 80) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${
              0.12 * (1 - dist / 80)
            })`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particle points
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`;
        ctx.fill();

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [eventConfig]);

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-card/80 p-4 sm:p-6 md:p-7 shadow-sm transition-all duration-300">
        {/* Particle Canvas for Event Theme */}
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="particles-bg pointer-events-none absolute inset-0 w-full h-full opacity-60"
        />

        {/* Ambient Breathing Halos */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full blur-3xl opacity-30 -top-20 -right-20"
          style={{
            width: "280px",
            height: "280px",
            background: "hsl(var(--primary))",
          }}
        />

        {/* Main Content: Flex 2 columns (Left: Greeting & Sub-metrics, Right: Goal Cockpit) */}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
          {/* Nửa Trái: Lời Chào, Gói cước, Truyền cảm hứng */}
          <div className="flex-1 min-w-0">
            {/* Event or Standard Badge */}
            <div className="flex items-center gap-2 mb-2">
              {eventConfig.enabled ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-bold shadow-xs">
                  <span>{eventConfig.icon}</span>
                  <span>{eventConfig.badge}</span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="font-semibold">{eventConfig.name}</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>APTIS ESOL PREMIER</span>
                </div>
              )}
            </div>

            {/* Greeting Heading */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight text-foreground leading-tight">
              Xin chào,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-accent">
                {displayName}
              </span>{" "}
              👋
            </h1>

            {/* Plan Badge + Inspiration */}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs">
                <Crown className="w-3.5 h-3.5 fill-current" />
                <span>Học sinh {planName.toUpperCase().includes("PRO") ? "Có Gói PRO" : planName}</span>
              </span>
              <span className="text-xs text-muted-foreground font-medium">
                Cùng chinh phục mục tiêu{" "}
                <strong className="text-foreground">{currentAim}</strong> với lộ
                trình cá nhân hoá!
              </span>
            </div>

            {/* Quick Metrics Sub-bar (Câu làm, Độ chính xác, AI Credit, Streak) */}
            <div className="mt-4 flex items-center gap-2 sm:gap-3 flex-wrap text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>Streak: <strong className="text-foreground">{streak} ngày</strong></span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                <CircleCheck className="w-3.5 h-3.5 text-accent" />
                <span>Đã làm: <strong className="text-foreground">{totalQuestions} câu</strong></span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Chính xác: <strong className="text-foreground">{accuracy}%</strong></span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-muted/40 border border-border/60">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI Quota: <strong className="text-foreground">{aiCreditsRemaining}/{aiCreditsTotal}</strong></span>
              </div>
            </div>
          </div>

          {/* Nửa Phải: Embedded Goal Cockpit Card (Khớp chuẩn Mockup) */}
          <div className="w-full lg:w-auto shrink-0">
            <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-md p-4 sm:p-5 shadow-sm hover:border-primary/40 hover:shadow-glow-soft transition-all duration-300 flex items-center justify-between gap-5 sm:gap-6 min-w-[280px] sm:min-w-[340px]">
              {/* Goal Details */}
              <div className="space-y-3 flex-1 min-w-0">
                {/* Mục tiêu */}
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      Mục tiêu của bạn
                    </div>
                    <div className="text-sm sm:text-base font-heading font-black text-foreground leading-tight">
                      Aptis ESOL {currentAim}
                    </div>
                  </div>
                </div>

                {/* Ngày thi dự kiến */}
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-muted-foreground">
                      Ngày thi dự kiến
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs sm:text-sm font-bold text-foreground">
                        {formatDisplayDate(currentDate)}
                      </span>
                      {/* Nút sửa ✏️ */}
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        title="Chỉnh sửa mục tiêu & ngày thi"
                        aria-label="Chỉnh sửa mục tiêu"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium block">
                      Còn {daysRemaining} ngày ôn tập
                    </span>
                  </div>
                </div>
              </div>

              {/* Radial Progress Chart (Tiến độ chung) */}
              <div className="flex flex-col items-center justify-center shrink-0 pl-2 border-l border-border/60">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="text-muted/40 stroke-current"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r={radius}
                      className="text-emerald-500 stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-sm sm:text-base font-heading font-black text-foreground leading-none">
                      {progressPercent}%
                    </span>
                  </div>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground mt-1 text-center whitespace-nowrap">
                  Tiến độ chung
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Goal Edit Modal (Tích hợp logic từ GoalTracker) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-foreground text-lg">
                  Đặt mục tiêu học tập
                </h3>
                <p className="text-xs text-muted-foreground">
                  Điều chỉnh lộ trình và mục tiêu điểm thi Aptis của bạn
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-1">
              {/* Target Band Selector */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Mục tiêu CEFR mong muốn
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["A2", "B1", "B2", "C"].map((band) => (
                    <button
                      key={band}
                      type="button"
                      onClick={() => setCurrentAim(band)}
                      className={`h-10 rounded-xl text-xs font-bold transition-all ${
                        currentAim === band
                          ? "btn-brand-gradient text-white shadow-glow-soft"
                          : "border border-border hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {band}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exam Date Picker */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Ngày thi dự kiến
                </label>
                <input
                  type="date"
                  value={currentDate}
                  onChange={(e) => setCurrentDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              {/* Daily Target Counter */}
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">
                  Mục tiêu số bài luyện mỗi ngày
                </label>
                <div className="flex items-center justify-between border border-border rounded-xl p-2 bg-background/50">
                  <span className="text-xs font-semibold text-muted-foreground pl-2">
                    {targetCount} bài / ngày
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTargetCount(Math.max(1, targetCount - 1))}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetCount(Math.min(20, targetCount + 1))}
                      className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted text-foreground"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveGoal}
                disabled={isSaving}
                className="flex-1 h-10 rounded-xl btn-brand-gradient text-white text-xs font-bold shadow-glow-soft hover:shadow-md transition-all disabled:opacity-50"
              >
                {isSaving ? "Đang lưu..." : "Lưu mục tiêu"}
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="h-10 px-4 rounded-xl border border-border hover:bg-muted text-xs font-semibold text-muted-foreground transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
