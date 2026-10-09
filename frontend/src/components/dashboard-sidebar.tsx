"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Crown,
  Zap,
  ArrowRight,
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  Clock,
  Sparkles,
  BookMarked,
  SpellCheck,
  History,
  CheckCircle2,
} from "lucide-react";
import { ReferralGiftCard } from "@/components/referral-gift-card";

interface TodayRecommendationData {
  weakestPartTitle?: string;
  weakestPartSubtitle?: string;
  weakestPartLink?: string;
  weakestPartButtonText?: string;
}

interface DashboardSidebarProps {
  recommendation?: TodayRecommendationData;
}

export function DashboardSidebar({ recommendation }: DashboardSidebarProps) {
  // Pro plan selection state (default: 1 month)
  const [selectedPlanId, setSelectedPlanId] = useState("1-month");

  const planOptions = [
    { id: "1-week", label: "1 tuần", price: "50.000đ" },
    { id: "1-month", label: "1 tháng", price: "150.000đ", isBestValue: true },
    { id: "2-month", label: "2 tháng", price: "280.000đ" },
    { id: "3-month", label: "3 tháng", price: "360.000đ" },
  ];

  const todayTasks = [
    {
      id: "reading-task",
      title: "Reading – Dạng Matching",
      duration: "45 phút",
      href: "/reading",
      icon: BookOpen,
      iconColor: "text-blue-500 bg-blue-500/10",
    },
    {
      id: "listening-task",
      title: "Listening – Note completion",
      duration: "40 phút",
      href: "/listening",
      icon: Headphones,
      iconColor: "text-purple-500 bg-purple-500/10",
    },
    {
      id: "speaking-task",
      title: "Speaking – Part 2",
      duration: "30 phút",
      href: "/speaking",
      icon: Mic,
      iconColor: "text-emerald-500 bg-emerald-500/10",
    },
    {
      id: "writing-task",
      title: "Writing – Email (Part 4)",
      duration: "40 phút",
      href: "/writing",
      icon: PenTool,
      iconColor: "text-amber-500 bg-amber-500/10",
    },
  ];

  const quickLinks = [
    {
      title: "Nghe chép - Dictation",
      desc: "Luyện nghe chi tiết, cải thiện phát âm",
      href: "/dictation",
      icon: Headphones,
      iconColor: "text-rose-500 bg-rose-500/10",
    },
    {
      title: "Học từ vựng",
      desc: "Từ vựng theo chủ đề, bám sát đề thi",
      href: "/vocabulary",
      icon: BookMarked,
      iconColor: "text-purple-500 bg-purple-500/10",
    },
    {
      title: "Grammar & Vocab",
      desc: "Hệ thống ngữ pháp trọng tâm",
      href: "/grammar",
      icon: SpellCheck,
      iconColor: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Lịch sử làm bài",
      desc: "Xem lại kết quả & bài thi đã chấm",
      href: "/history",
      icon: History,
      iconColor: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-5">
      {/* 1. Hôm nay nên học gì? */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
              Hôm nay nên học gì?
            </h3>
          </div>

          <Link
            href="/thi-thu"
            className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-0.5"
          >
            <span>Xem thêm</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {todayTasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border border-border/70 bg-background/50 hover:bg-background/90 hover:border-primary/40 transition-all duration-200"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.iconColor}`}
                >
                  <t.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {t.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{t.duration}</span>
                  </span>
                </div>
              </div>

              <Link
                href={t.href}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white font-bold text-[11px] shrink-0 transition-colors"
              >
                Bắt đầu
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Nâng cấp gói Pro (Khớp chuẩn Mockup Radio Selector) */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-primary/5 to-card/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm hover:border-amber-500/50 transition-all duration-300">
        <div className="flex items-start gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h3 className="font-heading font-black text-sm sm:text-base text-foreground leading-tight">
              Nâng cấp gói Pro
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Học không giới hạn kho đề + chấm AI Speaking &amp; Writing
            </p>
          </div>
        </div>

        {/* Radio Option Selector */}
        <div className="mt-3.5 space-y-1.5">
          {planOptions.map((opt) => {
            const isSelected = selectedPlanId === opt.id;
            return (
              <label
                key={opt.id}
                onClick={() => setSelectedPlanId(opt.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                  isSelected
                    ? "border-emerald-500/60 bg-emerald-500/10 text-foreground shadow-2xs"
                    : "border-border/70 bg-background/50 hover:bg-background/80 text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-border bg-background"
                    }`}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span className={isSelected ? "font-bold text-foreground" : ""}>
                    {opt.label}
                  </span>
                </div>
                <span
                  className={`font-black ${
                    isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                  }`}
                >
                  {opt.price}
                </span>
              </label>
            );
          })}
        </div>

        {/* Upgrade CTA Button */}
        <Link
          href={`/pricing?plan=${selectedPlanId}`}
          className="mt-3.5 w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>Nâng cấp ngay →</span>
        </Link>
      </div>

      {/* 3. Truy cập nhanh (Quick Actions) */}
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Zap className="w-4 h-4 fill-emerald-500/20" />
          </div>
          <h3 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight">
            Truy cập nhanh
          </h3>
        </div>

        <div className="space-y-1.5">
          {quickLinks.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-background/50 hover:bg-background/90 hover:border-primary/40 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconColor}`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {item.desc}
                  </p>
                </div>
              </div>

              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Thẻ Giới thiệu bạn bè nhận thêm lượt chấm AI */}
      <ReferralGiftCard />
    </div>
  );
}
