"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";
import { NotificationDropdown } from "@/components/notification-dropdown";
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

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [skillsDropdown, setSkillsDropdown] = useState(false);
  const [moreDropdown, setMoreDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const skillsRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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
      <nav className="fixed top-0 left-0 right-0 z-50 xl:h-16 transition-all duration-300 bg-background/95 backdrop-blur-md border-b border-primary/30 shadow-[0_4px_20px_-8px_hsl(var(--primary)/0.18)]">
        <div className="h-16 xl:h-full max-w-[1440px] mx-auto px-4 lg:px-6 flex items-center gap-3">
        {/* Brand Logo */}
        <Link
          className="flex items-center gap-2 shrink-0 group"
          href="/dashboard"
          data-discover="true"
        >
          <Image
            src="/logo.webp"
            alt="Aptis Kỳ Tích"
            width={40}
            height={40}
            className="h-10 w-10 px-0 pb-0 transition-transform duration-200 group-hover:scale-105"
            priority
          />
          <span className="font-heading font-bold text-base text-foreground tracking-tight whitespace-nowrap">
            Aptis <span className="gradient-text">Kỳ Tích</span>
          </span>
        </Link>

        {/* Center Nav Items */}
        <div className="hidden xl:flex items-center flex-1 min-w-0 justify-start gap-1 ml-4 lg:ml-6">
          {/* Thi thử button */}
          <Link
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold rounded-full transition-transform duration-200 whitespace-nowrap shadow-[0_4px_14px_rgba(204,28,1,0.35)] hover:scale-105 bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] text-white hover:shadow-[0_6px_18px_rgba(204,28,1,0.45)]"
            href="/thi-thu"
            data-discover="true"
          >
            <ClipboardCheck className="w-4 h-4" />
            Thi thử
          </Link>

          {/* Luyện tập từng kỹ năng dropdown */}
          <div className="relative" ref={skillsRef}>
            <button
              type="button"
              onClick={() => setSkillsDropdown((prev) => !prev)}
              className="group flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            >
              <BookOpen className="w-4 h-4" />
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
            className="group flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            href="/key-du-doan"
            data-discover="true"
          >
            <Sparkles className="w-4 h-4 text-accent" />
            Đề Key Dự Đoán
          </Link>

          {/* Lịch sử học tập */}
          <Link
            className="group flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            href="/history"
            data-discover="true"
          >
            <History className="w-4 h-4" />
            Lịch sử học tập
          </Link>

          {/* More dropdown */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreDropdown((prev) => !prev)}
              className="group flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-full transition-colors whitespace-nowrap text-foreground hover:bg-muted"
            >
              <Ellipsis className="w-4 h-4" />
              More
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          {/* Nâng cấp */}
          <Link href="/pricing" data-discover="true">
            <button className="tech-btn inline-flex items-center justify-center whitespace-nowrap transition-colors rounded-full h-8 px-3.5 text-xs font-extrabold gap-1 bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] text-white hover:brightness-110 border-0 shadow-sm">
              <Crown className="w-3.5 h-3.5" /> Nâng cấp
            </button>
          </Link>

          {/* Dashboard Button */}
          <Link href="/dashboard" data-discover="true">
            <button className="tech-btn inline-flex items-center justify-center whitespace-nowrap font-medium hover:bg-accent/15 hover:text-accent-foreground rounded-md gap-1.5 text-sm h-8 px-3 transition-colors">
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
                  className="relative w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
                >
                  <span className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-primary/20 text-primary font-bold">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
                  </span>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                </button>

                {userDropdown && (
                  <div
                    onMouseLeave={() => setUserDropdown(false)}
                    className="absolute top-full right-0 mt-2 w-64 rounded-2xl border border-border bg-popover p-3 shadow-xl z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-border">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base">
                        {user.full_name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{user.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-primary/15 text-primary">
                            {user.role}
                          </span>
                          {user.user_subscriptions?.length ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-amber-500/15 text-amber-600">
                              {user.user_subscriptions[0].plan.name}
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-bold bg-muted text-muted-foreground">
                              FREE
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="py-2 text-xs space-y-1">
                      <div className="flex justify-between px-2 py-1 text-muted-foreground text-[11px]">
                        <span>Lượt chấm AI còn lại:</span>
                        <span className="font-bold text-primary">
                          {user.ai_quotas ? user.ai_quotas.total_quota - user.ai_quotas.used_quota : 3}
                        </span>
                      </div>
                      <div className="flex justify-between px-2 py-1 text-muted-foreground text-[11px]">
                        <span>Lượt chấm Giảng viên:</span>
                        <span className="font-bold text-emerald-500">
                          {user.teacher_quotas ? user.teacher_quotas.total_quota - user.teacher_quotas.used_quota : 0}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdown(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-foreground hover:bg-muted transition-colors"
                      >
                        <User className="w-4 h-4 text-primary" />
                        <span>Hồ sơ & Đổi mật khẩu</span>
                      </Link>

                      <Link
                        href="/my-classes"
                        onClick={() => setUserDropdown(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-foreground hover:bg-muted transition-colors"
                      >
                        <Users className="w-4 h-4 text-primary" />
                        <span>Lớp học của tôi</span>
                      </Link>

                      {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <Link
                          href="/admin"
                          onClick={() => setUserDropdown(false)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>{user.role === "SUPER_ADMIN" ? "Vào Cổng Super Admin" : "Vào Trang Quản Trị (Admin)"}</span>
                        </Link>
                      )}
                      {user.role === "TEACHER" && (
                        <Link
                          href="/teacher"
                          onClick={() => setUserDropdown(false)}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                        >
                          <GraduationCap className="w-4 h-4" />
                          <span>Vào Cổng Giảng Viên</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdown(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] hover:brightness-110 shadow-sm transition-all"
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
            className="flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent/20 text-foreground transition-colors"
            type="button"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4" />
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
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] rounded-xl shadow-md"
            >
              <LogIn className="w-4 h-4" />
              Đăng nhập / Đăng ký tài khoản
            </button>
          )}
          {isAuthenticated && (
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Hồ sơ cá nhân & Đổi mật khẩu</span>
            </Link>
          )}
          <Link
            href="/thi-thu"
            className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] rounded-xl shadow-md"
          >
            <ClipboardCheck className="w-4 h-4" />
            Thi thử Full Test
          </Link>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <Link href="/reading" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Reading
            </Link>
            <Link href="/listening" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Listening
            </Link>
            <Link href="/speaking" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Speaking (AI)
            </Link>
            <Link href="/writing" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Writing (AI)
            </Link>
            <Link href="/grammar" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Grammar & Vocab
            </Link>
            <Link href="/vocabulary" className="p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-lg font-medium">
              Học từ vựng
            </Link>
            <Link href="/nghe-chep" className="p-2.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded-lg font-medium">
              Dictation & Shadowing
            </Link>
            <Link href="/key-du-doan" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Đề Key Dự Đoán
            </Link>
            <Link href="/tai-lieu" className="p-2.5 bg-primary/10 text-primary rounded-lg font-bold">
              Kho tài liệu & Video
            </Link>
            <Link href="/meo-thi-aptis" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Blog Mẹo thi
            </Link>
            <Link href="/about" className="p-2.5 bg-muted/40 rounded-lg font-medium">
              Về chúng tôi
            </Link>
          </div>
        </div>
      )}
      </nav>

      {/* Auth Modal rendered outside nav container */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}
