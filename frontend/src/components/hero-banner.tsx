"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Flame,
  CircleCheck,
  Target,
  TrendingUp,
  Crown,
} from "lucide-react";

import { useEventTheme } from "@/contexts/event-theme-context";

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
  const num = parseInt(cleanHex.length === 3 ? cleanHex.split("").map((c) => c + c).join("") : cleanHex, 16);
  if (isNaN(num)) return { r: 37, g: 99, b: 235 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function HeroBanner({
  displayName = "Hiệp Hoàng",
  skillsCovered = 1,
  streak = 1,
  totalQuestions = 25,
  accuracy = 8,
  currentLevel = "Chưa đủ dữ liệu",
  aiCreditsRemaining = 2,
  aiCreditsTotal = 3,
  planName = "Miễn phí",
}: HeroBannerProps) {
  const { config: eventConfig } = useEventTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rgb = eventConfig.enabled && eventConfig.primaryColor
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

    const count = 30;
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
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
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
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.18 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Floating points
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [eventConfig.enabled, eventConfig.primaryColor]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card/60 backdrop-blur-sm p-4 sm:p-6 md:p-8"
      style={{ opacity: 1, transform: "none" }}
    >
      {/* Decorative Grid & Glow Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 tech-grid-bg animate-grid-drift" />
        <div className="glow-orb glow-orb-blue -top-24 -left-24 w-[420px] h-[420px]" />
        <div className="glow-orb glow-orb-blue top-1/3 -right-32 w-[360px] h-[360px]" />
        <div className="glow-orb glow-orb-navy bottom-0 left-1/3 w-[320px] h-[320px]" />
      </div>

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="particles-bg pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Ambient Breathing Halos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-20 -right-20"
        style={{
          width: "300px",
          height: "300px",
          background: "hsl(var(--primary) / 0.35)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -bottom-20 -left-20"
        style={{
          width: "260px",
          height: "260px",
          background: "hsl(var(--accent) / 0.32)",
        }}
      />

      {/* Main Relative Container */}
      <div className="relative z-10">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5 sm:mb-6">
          <div>
            {eventConfig.enabled ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] sm:text-xs font-bold mb-2 sm:mb-3 shadow-xs">
                <span>{eventConfig.icon}</span>
                <span>{eventConfig.badge}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="font-semibold">{eventConfig.name}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] sm:text-xs font-bold mb-2 sm:mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Dashboard</span>
              </div>
            )}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-extrabold leading-tight">
              Xin chào,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-glow to-accent">
                {displayName}
              </span>{" "}
              👋
            </h1>
            <p className="text-muted-foreground mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base leading-relaxed">
              Đã có dữ liệu{" "}
              <strong className="text-foreground">
                {skillsCovered}/4 kỹ năng
              </strong>{" "}
              — làm thêm để biết band tổng · Streak{" "}
              <strong className="text-primary">{streak} ngày</strong>{" "}
              🔥&nbsp;-&nbsp;hôm nay luyện tiếp nhé!
            </p>
          </div>

          <Link
            className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-brand-gradient text-white shadow-glow-soft hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 h-10 sm:h-11 rounded-xl px-6 sm:px-8 shrink-0 w-full sm:w-auto"
            href="/thi-thu"
            data-discover="true"
          >
            <Zap className="w-4 h-4 mr-1 sm:mr-2" />
            <span>Thi thử ngay</span>
          </Link>
        </div>

        {/* 6 Metric Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {/* Card 1: Chuỗi ngày */}
          <div className="group relative flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-3 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-primary/30 to-primary/5 text-primary">
              <Flame className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Chuỗi ngày
              </div>
              <div className="text-base sm:text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
                {streak} ngày
              </div>
            </div>
          </div>

          {/* Card 2: Câu đã làm */}
          <div className="group relative flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-3 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-accent/30 to-accent/5 text-accent">
              <CircleCheck className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Câu đã làm
              </div>
              <div className="text-base sm:text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
                {totalQuestions}
              </div>
            </div>
          </div>

          {/* Card 3: Chính xác */}
          <div className="group relative flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-3 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-success/30 to-success/5 text-success">
              <Target className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Chính xác
              </div>
              <div className="text-base sm:text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
                {accuracy}%
              </div>
            </div>
          </div>

          {/* Card 4: Trình độ */}
          <div className="group relative flex items-center gap-2.5 sm:gap-4 rounded-xl sm:rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-3 sm:px-5 sm:py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-primary/30 to-primary/5 text-primary">
              <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Trình độ
              </div>
              <div className="text-sm sm:text-xl font-heading font-extrabold text-foreground leading-tight truncate">
                {currentLevel}
              </div>
            </div>
          </div>

          {/* Card 5: Lượt chấm AI */}
          <div className="group relative flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:px-4 sm:py-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 border-border bg-card/70 hover:border-primary/50 hover:shadow-glow-soft">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-accent/30 to-accent/5 text-accent">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Lượt chấm AI
              </div>
              <div className="text-base sm:text-2xl font-heading font-extrabold leading-tight text-foreground">
                {aiCreditsRemaining}/{aiCreditsTotal}
              </div>
              <div className="text-[10px] sm:text-[11px] leading-tight text-muted-foreground truncate">
                còn lại
              </div>
            </div>
          </div>

          {/* Card 6: Gói hiện tại */}
          <Link
            href="/pricing"
            role="button"
            tabIndex={0}
            className="group relative flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border p-3 sm:px-4 sm:py-5 cursor-pointer backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 border-border bg-card/70 hover:border-primary/50 hover:shadow-glow-soft"
          >
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl ring-1 ring-inset from-muted/40 to-muted/10 text-muted-foreground bg-gradient-to-br ring-border">
              <Crown className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] sm:text-sm text-muted-foreground truncate">
                Gói hiện tại
              </div>
              <div className="text-sm sm:text-xl font-heading font-extrabold leading-tight truncate text-foreground">
                {planName}
              </div>
              <span className="mt-1 inline-flex items-center gap-0.5 sm:gap-1 rounded-full btn-brand-gradient px-2 py-0.2 sm:px-2.5 sm:py-0.5 text-[9.5px] sm:text-[11px] font-bold text-white shadow-xs">
                <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Nâng cấp
              </span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
