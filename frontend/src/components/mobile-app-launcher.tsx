"use client";

import Link from "next/link";
import {
  Headphones,
  Mic,
  BookOpen,
  PenTool,
  BookMarked,
  Ear,
  Zap,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export function MobileAppLauncher() {
  const skills = [
    {
      title: "Listening",
      label: "Nghe",
      href: "/listening",
      icon: Headphones,
      color: "from-blue-500 to-indigo-600 text-white",
      bgSoft: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      desc: "4 Parts audio",
    },
    {
      title: "Speaking",
      label: "Nói AI",
      href: "/speaking",
      icon: Mic,
      color: "from-rose-500 to-pink-600 text-white",
      bgSoft: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      desc: "Chấm phát âm",
      badge: "AI",
    },
    {
      title: "Reading",
      label: "Đọc",
      href: "/reading",
      icon: BookOpen,
      color: "from-amber-500 to-orange-600 text-white",
      bgSoft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      desc: "4 Parts giải thích",
    },
    {
      title: "Writing",
      label: "Viết AI",
      href: "/writing",
      icon: PenTool,
      color: "from-emerald-500 to-teal-600 text-white",
      bgSoft: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      desc: "Chấm CEFR",
      badge: "AI",
    },
    {
      title: "Vocabulary",
      label: "Từ vựng",
      href: "/vocabulary",
      icon: BookMarked,
      color: "from-purple-500 to-violet-600 text-white",
      bgSoft: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      desc: "198 bộ từ",
    },
    {
      title: "Nghe chép",
      label: "Chính tả",
      href: "/nghe-chep",
      icon: Ear,
      color: "from-cyan-500 to-blue-600 text-white",
      bgSoft: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      desc: "Shadowing",
    },
    {
      title: "Thi thử",
      label: "Full Test",
      href: "/thi-thu",
      icon: Zap,
      color: "from-red-600 to-amber-600 text-white",
      bgSoft: "bg-red-500/10 text-red-500 border-red-500/20",
      desc: "162 phút",
      badge: "HOT",
    },
    {
      title: "Lớp học",
      label: "Lớp tôi",
      href: "/my-classes",
      icon: GraduationCap,
      color: "from-teal-500 to-emerald-600 text-white",
      bgSoft: "bg-teal-500/10 text-teal-500 border-teal-500/20",
      desc: "Mã mời lớp",
    },
  ];

  return (
    <div className="md:hidden space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-xs font-bold font-heading text-foreground uppercase tracking-wider">
            Phòng Luyện Nhanh (Webapp Hub)
          </h2>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">
          Chạm để luyện ngay
        </span>
      </div>

      {/* 4 columns x 2 rows grid on mobile */}
      <div className="grid grid-cols-4 gap-2.5">
        {skills.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-card border border-border/80 shadow-xs hover:border-primary/40 active:scale-95 transition-all duration-150 relative group overflow-hidden"
            >
              {/* Badge */}
              {s.badge && (
                <span className="absolute top-1 right-1 px-1 py-0.2 rounded-full text-[8px] font-black bg-primary text-primary-foreground leading-tight shadow-xs">
                  {s.badge}
                </span>
              )}

              {/* Icon Squircle */}
              <div
                className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${s.color} flex items-center justify-center shadow-md shadow-black/10 mb-1.5 transition-transform group-hover:scale-105`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>

              {/* Title */}
              <span className="text-xs font-bold font-heading text-foreground text-center truncate w-full leading-tight">
                {s.label}
              </span>

              {/* Sub description */}
              <span className="text-[9.5px] text-muted-foreground text-center truncate w-full mt-0.5">
                {s.desc}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
