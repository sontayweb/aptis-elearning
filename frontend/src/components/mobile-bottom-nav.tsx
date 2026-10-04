"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Zap,
  Headphones,
  GraduationCap,
  History,
} from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  // Hide on admin routes, teacher routes, or active exam sessions
  if (
    !pathname ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/exams") ||
    /^\/(thi-thu|reading|listening|speaking|writing|grammar)\/[^/]+$/.test(pathname)
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Trang chủ",
      href: "/",
      icon: Home,
      isActive: pathname === "/" || pathname === "/dashboard",
    },
    {
      label: "Thi thử",
      href: "/thi-thu",
      icon: Zap,
      badge: "HOT",
      isActive: pathname.startsWith("/thi-thu"),
    },
    {
      label: "Luyện đề",
      href: "/listening",
      icon: Headphones,
      isActive:
        pathname.startsWith("/listening") ||
        pathname.startsWith("/speaking") ||
        pathname.startsWith("/reading") ||
        pathname.startsWith("/writing") ||
        pathname.startsWith("/grammar") ||
        pathname.startsWith("/vocabulary") ||
        pathname.startsWith("/nghe-chep") ||
        pathname.startsWith("/key-du-doan") ||
        pathname.startsWith("/tai-lieu"),
    },
    {
      label: "Lớp học",
      href: "/my-classes",
      icon: GraduationCap,
      isActive: pathname.startsWith("/my-classes"),
    },
    {
      label: "Lịch sử",
      href: "/history",
      icon: History,
      isActive:
        pathname.startsWith("/history") ||
        pathname.startsWith("/progress") ||
        pathname.startsWith("/bang-ky-tich") ||
        pathname.startsWith("/profile"),
    },
  ];

  return (
    <>
      {/* Spacer to prevent page bottom content from being obscured on mobile */}
      <div className="h-16 md:hidden pointer-events-none" aria-hidden="true" />
      <nav
        aria-label="Thanh điều hướng ứng dụng di động"
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/90 backdrop-blur-xl border-t border-border/80 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-2 pt-1 pb-[max(env(safe-area-inset-bottom),10px)]"
      >
        <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all duration-200 active:scale-90 select-none ${
                  active
                    ? "text-primary font-bold"
                    : "text-muted-foreground hover:text-foreground font-medium"
                }`}
              >
                {/* Active Ambient Glow Background */}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 inset-y-1 bg-primary/10 rounded-xl -z-10 animate-in fade-in zoom-in-95 duration-200"
                  />
                )}

                {/* Icon Container with Badge */}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      active ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                    }`}
                  />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-3 px-1 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-rose-500 to-amber-500 text-white leading-none shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-1 transition-colors leading-tight ${
                    active ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </span>

                {/* Active Dot Indicator */}
                {active && (
                  <span className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
