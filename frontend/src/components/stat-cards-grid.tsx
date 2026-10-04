"use client";

import Link from "next/link";
import {
  Flame,
  CircleCheck,
  Target,
  TrendingUp,
  Sparkles,
  Crown,
} from "lucide-react";

interface StatCardsGridProps {
  streak?: number;
  totalQuestions?: number;
  accuracy?: number;
  currentLevel?: string;
  aiCreditsRemaining?: number;
  aiCreditsTotal?: number;
  planName?: string;
}

export function StatCardsGrid({
  streak = 0,
  totalQuestions = 0,
  accuracy = 0,
  currentLevel = "Chưa đủ dữ liệu",
  aiCreditsRemaining = 3,
  aiCreditsTotal = 3,
  planName = "Miễn phí",
}: StatCardsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Chuỗi ngày */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-primary/30 to-primary/5 text-primary">
          <Flame className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground truncate">Chuỗi ngày</div>
          <div className="text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
            {streak} ngày
          </div>
        </div>
      </div>

      {/* 2. Câu đã làm */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-accent/30 to-accent/5 text-accent">
          <CircleCheck className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground truncate">Câu đã làm</div>
          <div className="text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
            {totalQuestions}
          </div>
        </div>
      </div>

      {/* 3. Chính xác */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-success/30 to-success/5 text-success">
          <Target className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground truncate">Chính xác</div>
          <div className="text-2xl font-heading font-extrabold text-foreground leading-tight truncate">
            {accuracy}%
          </div>
        </div>
      </div>

      {/* 4. Trình độ */}
      <div className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card/70 backdrop-blur-sm px-5 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-glow-soft">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-[#1A3FA4]/30 to-[#1A3FA4]/5 text-[#1A3FA4] dark:text-[#3B82F6]">
          <TrendingUp className="h-7 w-7" />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground truncate">Trình độ</div>
          <div className="text-lg xl:text-xl font-heading font-extrabold text-foreground leading-tight truncate" title={currentLevel}>
            {currentLevel}
          </div>
        </div>
      </div>

      {/* 5. Lượt chấm AI */}
      <div className="group relative flex items-center gap-3 rounded-2xl border px-4 py-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 border-border bg-card/70 hover:border-primary/50 hover:shadow-glow-soft">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ring-1 ring-inset ring-border from-accent/30 to-accent/5 text-accent">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground truncate">Lượt chấm AI</div>
          <div className="text-2xl font-heading font-extrabold leading-tight text-foreground">
            {aiCreditsRemaining}/{aiCreditsTotal}
          </div>
          <div className="text-[11px] leading-tight text-muted-foreground truncate">
            lượt dùng thử còn lại
          </div>
        </div>
      </div>

      {/* 6. Gói hiện tại */}
      <Link
        href="/pricing"
        className="group relative flex items-center gap-3 rounded-2xl border px-4 py-5 cursor-pointer backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 border-border bg-card/70 hover:border-primary/50 hover:shadow-glow-soft"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset from-muted/40 to-muted/10 text-muted-foreground bg-gradient-to-br ring-border">
          <Crown className="h-7 w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm text-muted-foreground truncate">Gói hiện tại</div>
          <div className="text-xl font-heading font-extrabold leading-tight truncate text-foreground">
            {planName}
          </div>
          <div className="text-[11px] text-muted-foreground truncate">Mở khóa toàn bộ</div>
          <button
            type="button"
            className="mt-1.5 inline-flex items-center gap-1 rounded-full btn-brand-gradient px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs"
          >
            <Crown className="w-3 h-3" />
            <span>Nâng cấp</span>
          </button>
        </div>
      </Link>
    </div>
  );
}
