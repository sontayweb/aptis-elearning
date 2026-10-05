"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useEventTheme } from "@/contexts/event-theme-context";
import { AuthModal } from "@/components/auth-modal";
import { NotificationDropdown } from "@/components/notification-dropdown";
import { EventAnnouncementBar } from "@/components/event-decorations";
import {
  ClipboardCheck,
  BookOpen,
  ChevronDown,
  Sparkles,
  History,
  Ellipsis,
  Crown,
  Flame,
  Bell,
  Sun,
  Moon,
  Gift,
  Check,
  CheckCircle2,
  Copy,
  Menu,
  X,
  LogIn,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Mic,
  FileEdit,
  Headphones,
  BookA,
  BookMarked,
  Ear,
  Users,
  User,
} from "lucide-react";

function NavbarUserAvatar({ user }: { user?: { avatar_url?: string; full_name?: string } | null }) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.avatar_url]);

  if (user?.avatar_url && !imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar_url}
        alt={user.full_name || "Avatar"}
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    );
  }

  return (
    <span className="w-full h-full rounded-full flex items-center justify-center bg-[#1A3FA4] text-white font-bold text-xs select-none">
      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
    </span>
  );
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { config: eventConfig, currentTheme, setTheme: setEventTheme } = useEventTheme();
  const pathname = usePathname();
  const [skillsDropdown, setSkillsDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralLink, setReferralLink] = useState("");

  const skillsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Auto-close all menus on route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdown(false);
    setSkillsDropdown(false);
    setMoreDropdown(false);
  }, [pathname]);

  // Đồng bộ chiều cao thực tế của header (Navbar + EventAnnouncementBar) vào CSS variable --navbar-total-height
  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return;

    const syncHeaderHeight = () => {
      const height = headerEl.offsetHeight;
      if (height > 0) {
        document.documentElement.style.setProperty("--navbar-total-height", `${height}px`);
      }
    };

    syncHeaderHeight();
    const ro = new ResizeObserver(syncHeaderHeight);
    ro.observe(headerEl);

    return () => ro.disconnect();
  }, [eventConfig.enabled, eventConfig.bannerEnabled]);

  // Initial theme sync is managed by EventThemeProvider

  useEffect(() => {
    if (typeof window !== "undefined" && user) {
      setReferralLink(`${window.location.origin}/?ref=${user.id || "invite"}`);
    }
  }, [user]);

  const toggleTheme = (newTheme: string) => {
    setEventTheme(newTheme);
  };

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (skillsRef.current && !skillsRef.current.contains(target)) {
        setSkillsDropdown(false);
      }
      if (moreRef.current && !moreRef.current.contains(target)) {
        setMoreDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <EventAnnouncementBar />
        <nav className="xl:h-16 transition-all duration-300 bg-background/95 backdrop-blur-md border-b border-primary/30 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.18)]">
        <div className="h-16 xl:h-full max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center gap-3">
        {/* Brand Logo */}
        <Link
          className="flex items-center gap-2 shrink-0 group mr-1 xl:mr-2"
          href={isAuthenticated ? "/dashboard" : "/"}
          onClick={() => setMobileMenuOpen(false)}
          data-discover="true"
        >
          <Image
            src="/logo.webp"
            alt="APTIS ESOL PREMIER"
            width={38}
            height={38}
            className="h-9 w-9 px-0 pb-0 transition-transform duration-200 group-hover:scale-105 shrink-0"
            priority
          />
          <span className="font-heading whitespace-nowrap tracking-tight hidden sm:inline-flex items-center gap-0 font-extrabold text-sm xl:text-base">
            <span className="brand-name-aptis">APTIS</span>
            <span className="brand-name-esol mx-1">ESOL</span>
            <span className="brand-name-premier">PREMIER</span>
          </span>
        </Link>

        {/* Center Nav Items */}
        <div className="hidden xl:flex items-center shrink-0 gap-0.5 xl:gap-1 ml-1 xl:ml-3">
          {/* Thi thử button */}
          <Link
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs xl:text-sm font-bold rounded-full transition-transform duration-200 whitespace-nowrap shadow-glow-soft hover:scale-105 btn-brand-gradient text-white"
            href="/thi-thu"
            data-discover="true"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Thi thử
          </Link>

          {/* Luyện tập từng kỹ năng dropdown */}
          <div className="relative" ref={skillsRef}>
            <button
              type="button"
              onClick={() => setSkillsDropdown((prev) => !prev)}
              className="group flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Luyện tập từng kỹ năng
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  skillsDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
            {skillsDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl border border-border bg-popover/95 backdrop-blur-md p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1">
                {/* 1. Speaking */}
                <Link
                  href="/speaking"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Speaking</div>
                    <div className="text-[11px] text-muted-foreground">Luyện nói theo đề Aptis</div>
                  </div>
                </Link>

                {/* 2. Writing */}
                <Link
                  href="/writing"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileEdit className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Writing</div>
                    <div className="text-[11px] text-muted-foreground">Luyện viết theo đề Aptis</div>
                  </div>
                </Link>

                {/* 3. Listening */}
                <Link
                  href="/listening"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Listening</div>
                    <div className="text-[11px] text-muted-foreground">Luyện nghe theo đề Aptis</div>
                  </div>
                </Link>

                {/* 4. Reading */}
                <Link
                  href="/reading"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Reading</div>
                    <div className="text-[11px] text-muted-foreground">Luyện đọc theo đề Aptis</div>
                  </div>
                </Link>

                {/* 5. Grammar & Vocabulary */}
                <Link
                  href="/grammar"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <BookA className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Grammar & Vocabulary</div>
                    <div className="text-[11px] text-muted-foreground">Ngữ pháp và từ vựng</div>
                  </div>
                </Link>

                {/* Divider: CÔNG CỤ ÔN TẬP */}
                <div className="pt-2 pb-1 px-3 border-t border-border mt-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    CÔNG CỤ ÔN TẬP
                  </span>
                </div>

                {/* 6. Học từ vựng */}
                <Link
                  href="/vocabulary"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Học từ vựng</div>
                    <div className="text-[11px] text-muted-foreground">Kho từ vựng & Flashcard</div>
                  </div>
                </Link>

                {/* 7. Dictation & Shadowing */}
                <Link
                  href="/nghe-chep"
                  onClick={() => setSkillsDropdown(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                    <Ear className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Dictation & Shadowing</div>
                    <div className="text-[11px] text-muted-foreground">Luyện nghe chép & nói nhại</div>
                  </div>
                </Link>
              </div>
            )}
          </div>

          {/* Đề Key Dự Đoán */}
          <Link
            className="group flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            href="/key-du-doan"
            data-discover="true"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Đề Key Dự Đoán
          </Link>

          {/* Lịch sử học tập */}
          <Link
            className="group flex items-center gap-1 px-2.5 py-1.5 text-xs xl:text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            href="/history"
            data-discover="true"
          >
            <History className="w-3.5 h-3.5" />
            Lịch sử học tập
          </Link>

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreDropdown((prev) => !prev)}
              className="group flex items-center gap-1 px-2 py-1.5 text-xs xl:text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            >
              <Ellipsis className="w-3.5 h-3.5" />
              More
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  moreDropdown ? "rotate-180" : ""
                }`}
              />
            </button>
            {moreDropdown && (
              <div className="absolute top-full left-0 mt-2 w-48 rounded-xl border border-border bg-popover p-1 shadow-lg z-50 animate-in fade-in zoom-in-95">
                <Link
                  href="/tai-lieu"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-primary font-bold hover:bg-muted transition-colors"
                >
                  Kho tài liệu & Video
                </Link>
                <Link
                  href="/meo-thi-aptis"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Blog - Mẹo thi
                </Link>
                <Link
                  href="/vocabulary"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Học từ vựng
                </Link>
                <Link
                  href="/bang-ky-tich"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Bảng Kỳ Tích
                </Link>
                <Link
                  href="/progress"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Tiến độ học tập
                </Link>
                <Link
                  href="/landing"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-primary font-bold hover:bg-muted transition-colors"
                >
                  Giới thiệu nền tảng
                </Link>
                <Link
                  href="/about"
                  onClick={() => setMoreDropdown(false)}
                  className="flex items-center px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-muted transition-colors"
                >
                  Về chúng tôi
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="hidden xl:flex items-center gap-1.5 xl:gap-2 shrink-0 ml-auto">
          {/* Nâng cấp */}
          <Link href="/pricing" data-discover="true">
            <button className="tech-btn inline-flex items-center justify-center whitespace-nowrap transition-all rounded-full h-8 px-3 text-xs font-bold gap-1 btn-brand-gradient text-white border-0 shadow-glow-soft">
              <Crown className="w-3.5 h-3.5" /> Nâng cấp
            </button>
          </Link>

          {/* Dashboard Button (Hiển thị trên màn hình rộng 2xl) */}
          <Link href="/dashboard" data-discover="true" className="hidden 2xl:inline-flex">
            <button className="tech-btn inline-flex items-center justify-center whitespace-nowrap font-medium hover:bg-accent/15 hover:text-accent-foreground rounded-md gap-1.5 text-xs xl:text-sm h-8 px-2.5 transition-colors">
              <Flame className="w-4 h-4 text-primary" />
              <span>Dashboard</span>
            </button>
          </Link>

          {/* Bell & User Avatar / Login */}
          <div className="relative inline-flex items-center gap-1.5 pl-1">
            {isAuthenticated && <NotificationDropdown />}

            {isAuthenticated && user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  aria-label="Mở menu tài khoản"
                  className="relative w-8 h-8 rounded-full ring-2 ring-primary/30 overflow-hidden bg-[#1A3FA4] text-white flex items-center justify-center hover:opacity-90 hover:ring-primary/60 transition-all shadow-sm shrink-0"
                >
                  <NavbarUserAvatar user={user} />
                </button>

                {userDropdown && (
                  <div
                    className="absolute top-full right-0 mt-2.5 w-64 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 select-none"
                  >
                    {/* User Header Profile */}
                    <div className="px-3 py-2.5 border-b border-border/80 flex items-center gap-2.5 mb-1">
                      <div className="w-8 h-8 rounded-full ring-1 ring-primary/30 overflow-hidden shrink-0">
                        <NavbarUserAvatar user={user} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">
                          {user.full_name || "Học viên"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Giao diện */}
                    <div className="px-3 pt-1.5 pb-1 text-xs font-semibold text-muted-foreground">
                      Giao diện
                    </div>

                    {/* Dynamic Event Theme (Halloween, Noel, Trung thu, Tết...) */}
                    {eventConfig.enabled && (
                      <button
                        type="button"
                        onClick={() => toggleTheme(eventConfig.activeTemplate)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base leading-none">{eventConfig.icon || "🎃"}</span>
                          <span>{eventConfig.name}</span>
                        </div>
                        {currentTheme === eventConfig.activeTemplate && (
                          <span className="text-red-500 font-bold text-base leading-none">✓</span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => toggleTheme("light")}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Sun className="w-4 h-4 text-foreground/80" />
                        <span>Sáng</span>
                      </div>
                      {currentTheme === "light" && (
                        <span className="text-red-500 font-bold text-base leading-none">✓</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleTheme("dark")}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Moon className="w-4 h-4 text-foreground/80" />
                        <span>Tối</span>
                      </div>
                      {currentTheme === "dark" && (
                        <span className="text-red-500 font-bold text-base leading-none">✓</span>
                      )}
                    </button>

                    <div className="my-1 border-t border-border/80" />

                    {/* Thông tin tài khoản */}
                    <Link
                      href="/profile"
                      onClick={() => setUserDropdown(false)}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors"
                    >
                      <User className="w-4 h-4 text-foreground/80" />
                      <span>Thông tin tài khoản</span>
                    </Link>

                    {/* Giới thiệu bạn */}
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdown(false);
                        setReferralModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-foreground hover:bg-muted/70 transition-colors text-left"
                    >
                      <Gift className="w-4 h-4 text-foreground/80" />
                      <span>Giới thiệu bạn</span>
                    </button>

                    {/* Cổng điều hành Admin / Giảng viên nếu có */}
                    {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdown(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-amber-600 hover:bg-amber-500/10 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Quản trị hệ thống</span>
                      </Link>
                    )}
                    {user.role === "TEACHER" && (
                      <Link
                        href="/teacher"
                        onClick={() => setUserDropdown(false)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-blue-600 hover:bg-blue-500/10 transition-colors"
                      >
                        <GraduationCap className="w-4 h-4" />
                        <span>Cổng giảng viên</span>
                      </Link>
                    )}

                    <div className="my-1 border-t border-border/80" />

                    {/* Đăng xuất */}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setUserDropdown(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white btn-brand-gradient shadow-glow-soft transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu and theme buttons */}
        <div className="xl:hidden flex items-center gap-1 ml-auto">
          <button
            onClick={() => {
              if (eventConfig.enabled) {
                if (currentTheme === "light") toggleTheme("dark");
                else if (currentTheme === "dark") toggleTheme(eventConfig.activeTemplate);
                else toggleTheme("light");
              } else {
                toggleTheme(currentTheme === "dark" ? "light" : "dark");
              }
            }}
            className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent/20 text-foreground transition-colors"
            type="button"
            aria-label="Chuyển đổi giao diện"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : currentTheme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <span className="text-sm leading-none">{eventConfig.icon || "🎃"}</span>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-border bg-background px-4 py-3 space-y-2 animate-in fade-in">
          {!isAuthenticated && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-white btn-brand-gradient rounded-xl shadow-glow-soft"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập / Đăng ký tài khoản
            </button>
          )}
          {isAuthenticated && user && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                <NavbarUserAvatar user={user} />
              </div>
              <div className="min-w-0 flex-1 truncate">
                <span>{user.full_name || "Hồ sơ cá nhân & Đổi mật khẩu"}</span>
              </div>
            </Link>
          )}
          <Link
            href="/thi-thu"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white btn-brand-gradient rounded-xl shadow-glow-soft"
          >
            <ClipboardCheck className="w-4 h-4" />
            Thi thử Full Test
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <Link
              href="/reading"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Reading
            </Link>
            <Link
              href="/listening"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Listening
            </Link>
            <Link
              href="/speaking"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Speaking (AI)
            </Link>
            <Link
              href="/writing"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Writing (AI)
            </Link>
            <Link
              href="/grammar"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Grammar & Vocab
            </Link>
            <Link
              href="/vocabulary"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 rounded-lg font-medium transition-colors"
            >
              Học từ vựng
            </Link>
            <Link
              href="/nghe-chep"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20 rounded-lg font-medium transition-colors"
            >
              Dictation & Shadowing
            </Link>
            <Link
              href="/key-du-doan"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Đề Key Dự Đoán
            </Link>
            <Link
              href="/tai-lieu"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-bold transition-colors"
            >
              Kho tài liệu & Video
            </Link>
            <Link
              href="/meo-thi-aptis"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Blog Mẹo thi
            </Link>
            <Link
              href="/landing"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 rounded-lg font-bold transition-colors"
            >
              Giới thiệu nền tảng
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 bg-muted/40 hover:bg-muted rounded-lg font-medium transition-colors"
            >
              Về chúng tôi
            </Link>
          </div>
        </div>
      )}
      </nav>
      </header>

      {/* Referral Modal */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-foreground">Giới thiệu bạn bè</h3>
                  <p className="text-xs text-muted-foreground">Cùng học cùng tiến — nhận ưu đãi đặc biệt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReferralModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
                aria-label="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 space-y-2 text-xs text-foreground">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Bạn bè được giảm <strong>10%</strong> học phí khi nhập link giới thiệu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">✓</span>
                <span>Bạn nhận thêm <strong>10 lượt chấm AI</strong> và tích lũy phần thưởng</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Liên kết giới thiệu của bạn</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-muted/60 border border-border focus:outline-none select-all text-foreground"
                />
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-primary hover:bg-brand-brown rounded-xl transition-colors shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  {referralCopied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReferralModalOpen(false)}
              className="w-full py-2.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal rendered outside nav container */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
