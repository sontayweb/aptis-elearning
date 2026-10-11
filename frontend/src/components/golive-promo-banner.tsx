"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Gift, ArrowRight, X, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface GoLivePromoBannerProps {
  className?: string;
  onOpenAuth?: () => void;
}

export function GoLivePromoBanner({ className = "", onOpenAuth }: GoLivePromoBannerProps) {
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Kiểm tra xem user đã ẩn banner trong session này chưa
    const dismissed = sessionStorage.getItem("dismiss_golive_banner");
    if (dismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem("dismiss_golive_banner", "true");
  };

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText("GOLIVE14");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Nếu người dùng đã là SuperAdmin hoặc đã có gói trả phí thì không cần thúc đẩy mã này
  const isVipOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);

  if (!isVisible || isVipOrAdmin) {
    return null;
  }

  // Nếu nằm trong Navbar (khi có onOpenAuth hoặc không có className dạng card riêng)
  const isTopBar = Boolean(onOpenAuth);

  if (isTopBar) {
    return (
      <div className="relative z-40 bg-gradient-to-r from-amber-600 via-primary to-amber-700 text-white text-xs px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shadow-xs border-b border-white/10 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 overflow-hidden mx-auto sm:mx-0">
          <Gift className="w-4 h-4 text-amber-200 shrink-0 animate-bounce" />
          <span className="font-extrabold uppercase tracking-wider text-[11px] bg-white/20 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
            Go-Live 14 Ngày VIP
          </span>
          <span className="truncate text-white/95">
            Mở khóa 860+ đề thi &amp; 20 lượt chấm AI với mã:
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            title="Bấm để copy mã GOLIVE14"
            className="inline-flex items-center gap-1 font-mono font-black bg-white text-amber-800 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
          >
            <span>GOLIVE14</span>
            {copied ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            ) : (
              <Copy className="w-3 h-3 opacity-70" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isAuthenticated && onOpenAuth ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors cursor-pointer hidden md:inline-flex items-center gap-1"
            >
              <span>Nhận quà</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ) : (
            <Link
              href="/pricing?code=GOLIVE14"
              className="px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-colors cursor-pointer hidden md:inline-flex items-center gap-1"
            >
              <span>Kích hoạt ngay</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng thông báo"
            className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Dạng Card Banner (Dùng trong Dashboard hoặc Landing Page)
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/10 p-4 sm:p-5 shadow-sm transition-all hover:border-amber-500/60 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-amber-500/20 blur-2xl"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs border border-amber-500/30">
            <Gift className="w-5 h-5 animate-pulse" />
          </div>

          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                CHÀO MỪNG GO-LIVE
              </span>
              <span className="text-xs font-bold text-foreground truncate">
                Tặng 14 ngày VIP Pro Miễn Phí
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhập mã{" "}
              <button
                type="button"
                onClick={handleCopyCode}
                title="Bấm để copy mã"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs border border-amber-500/30 transition-colors cursor-pointer"
              >
                <span>GOLIVE14</span>
                {copied ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 opacity-70" />
                )}
              </button>{" "}
              để mở khóa toàn bộ 860+ đề thi &amp; 20 lượt chấm AI.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          {!isAuthenticated && onOpenAuth ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex-1 sm:flex-initial h-9 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-primary hover:from-amber-700 hover:to-primary/90 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Đăng nhập nhận quà</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              href="/pricing?code=GOLIVE14"
              className="flex-1 sm:flex-initial h-9 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-primary hover:from-amber-700 hover:to-primary/90 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kích hoạt ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Đóng thông báo"
            className="w-8 h-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
