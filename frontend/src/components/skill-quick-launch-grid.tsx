"use client";

import Link from "next/link";
import {
  BookOpen,
  Headphones,
  Mic,
  PenTool,
  SpellCheck,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";

interface SkillProgressItem {
  skill: string;
  label?: string;
  name?: string;
  pct?: number;
  completedExams?: number;
}

interface SkillQuickLaunchGridProps {
  skills?: SkillProgressItem[];
}

export function SkillQuickLaunchGrid({ skills }: SkillQuickLaunchGridProps) {
  // Helper to get skill percentage from stats
  const getSkillPct = (skillKey: string): number => {
    if (!skills || skills.length === 0) return 0;
    const found = skills.find(
      (s) =>
        s.skill.toLowerCase().includes(skillKey.toLowerCase()) ||
        (s.name && s.name.toLowerCase().includes(skillKey.toLowerCase())) ||
        (s.label && s.label.toLowerCase().includes(skillKey.toLowerCase()))
    );
    return found ? Math.round(found.pct ?? 0) : 0;
  };

  const skillCards = [
    {
      key: "grammar",
      title: "Grammar & Vocab",
      href: "/grammar",
      pct: getSkillPct("grammar"),
      icon: SpellCheck,
      iconBg: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      progressColor: "bg-rose-500",
      hoverBorder: "hover:border-rose-500/40",
      btnClass: "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white shadow-2xs shadow-rose-500/20",
    },
    {
      key: "reading",
      title: "Reading",
      href: "/reading",
      pct: getSkillPct("reading"),
      icon: BookOpen,
      iconBg: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      progressColor: "bg-blue-500",
      hoverBorder: "hover:border-blue-500/40",
      btnClass: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-2xs shadow-blue-500/20",
    },
    {
      key: "listening",
      title: "Listening",
      href: "/listening",
      pct: getSkillPct("listening"),
      icon: Headphones,
      iconBg: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      progressColor: "bg-amber-500",
      hoverBorder: "hover:border-amber-500/40",
      btnClass: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-2xs shadow-amber-500/20",
    },
    {
      key: "writing",
      title: "Writing",
      href: "/writing",
      pct: getSkillPct("writing"),
      icon: PenTool,
      iconBg: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      progressColor: "bg-purple-500",
      hoverBorder: "hover:border-purple-500/40",
      btnClass: "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-2xs shadow-purple-500/20",
    },
    {
      key: "speaking",
      title: "Speaking",
      href: "/speaking",
      pct: getSkillPct("speaking"),
      icon: Mic,
      iconBg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      progressColor: "bg-emerald-500",
      hoverBorder: "hover:border-emerald-500/40",
      btnClass: "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-2xs shadow-emerald-500/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <h2 className="font-heading font-black text-base sm:text-lg text-foreground tracking-tight">
            Luyện tập theo kỹ năng
          </h2>
        </div>

        <Link
          href="/progress"
          className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1 transition-colors"
        >
          <span>Xem chi tiết</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 5 Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {skillCards.map((card) => (
          <div
            key={card.key}
            className={`flex flex-col justify-between rounded-2xl border border-border/80 bg-background/50 hover:bg-background/90 ${card.hoverBorder} p-3 sm:p-3.5 transition-all duration-200 group shadow-2xs hover:shadow-xs`}
          >
            <div>
              {/* Top Icon */}
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${card.iconBg}`}
              >
                <card.icon className="w-5 h-5" />
              </div>

              {/* Title */}
              <h3 className="font-heading font-extrabold text-xs sm:text-sm text-foreground line-clamp-1">
                {card.title}
              </h3>

              {/* Progress Bar & Percent */}
              <div className="mt-3 mb-3.5 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
                  <span>Tiến độ</span>
                  <span className="text-foreground">{card.pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${card.progressColor}`}
                    style={{ width: `${Math.max(4, Math.min(100, card.pct))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              href={card.href}
              className={`w-full h-8.5 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 hover:opacity-95 ${card.btnClass}`}
            >
              <span>Luyện ngay</span>
              <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
