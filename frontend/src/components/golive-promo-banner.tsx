"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Gift, ArrowRight, X, Copy, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";

interface GoLivePromoBannerProps {
  className?: string;
  onOpenAuth?: () => void;
}

export function GoLivePromoBanner({ className = "", onOpenAuth }: GoLivePromoBannerProps) {
  const { user, isAuthenticated } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [featuredPromo, setFeaturedPromo] = useState<{
    id: string;
    code: string;
    title: string;
    description?: string;
    codeType: string;
    durationDays: number;
    aiQuota: number;
    discountAmount?: number;
    discountPercent?: number;
    expiresAt?: string;
    planName?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // Tải mã khuyến mại nổi bật (Featured Promo) trực tiếp từ Database
  useEffect(() => {
    let isMounted = true;
    async function loadFeaturedPromo() {
      try {
        const res = await api.payment.getFeaturedPromo();
        if (isMounted) {
          if (res.success && res.data) {
            setFeaturedPromo(res.data);
          } else {
            setFeaturedPromo(null);
          }
        }
      } catch {
        if (isMounted) setFeaturedPromo(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadFeaturedPromo();
    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!featuredPromo) return;
    navigator.clipboard.writeText(featuredPromo.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Nếu người dùng đã là SuperAdmin hoặc đã có gói trả phí
  const isVipOrAdmin =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    Boolean(user?.subscription) ||
    Boolean(user?.user_subscriptions?.length);

  // Nếu đang tải, hoặc không có mã featured trong CSDL, hoặc user là VIP/Admin, hoặc đã bấm tắt banner
  if (loading || !featuredPromo || !isVisible || isVipOrAdmin) {
    return null;
  }

  // Định dạng ngày hết hạn động
  const expiryFormatted = featuredPromo.expiresAt
    ? new Date(featuredPromo.expiresAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
      })
    : null;

  const isTopBar = Boolean(onOpenAuth);

  if (isTopBar) {
    return (
      <div className="relative z-40 bg-gradient-to-r from-amber-600 via-primary to-amber-700 text-white text-xs px-3 sm:px-4 py-2 flex items-center justify-between gap-3 shadow-xs border-b border-white/10 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 overflow-hidden mx-auto sm:mx-0">
          <Gift className="w-4 h-4 text-amber-200 shrink-0 animate-bounce" />
          <span className="font-extrabold uppercase tracking-wider text-[11px] bg-white/20 px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
            {featuredPromo.title} {expiryFormatted ? `(Đến ${expiryFormatted})` : ""}
          </span>
          <span className="truncate text-white/95">
            {featuredPromo.codeType === "FREE_TRIAL"
              ? `Tặng ${featuredPromo.durationDays} ngày VIP & ${featuredPromo.aiQuota} lượt AI với mã:`
              : `Nhận ưu đãi giảm giá độc quyền với mã:`}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            title={`Bấm để copy mã ${featuredPromo.code}`}
            className="inline-flex items-center gap-1 font-mono font-black bg-white text-amber-800 px-2 py-0.5 rounded-md hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
          >
            <span>{featuredPromo.code}</span>
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
              href={`/pricing?code=${encodeURIComponent(featuredPromo.code)}`}
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
            className="p-1 rounded-md hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Dạng card đặt trên các trang hoặc dashboard
  return (
    <div
      className={`rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-primary/5 to-amber-500/15 p-4 sm:p-5 relative overflow-hidden shadow-xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-primary text-white flex items-center justify-center shrink-0 shadow-md">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-extrabold text-sm sm:text-base text-foreground">
                {featuredPromo.title}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                {expiryFormatted ? `Hạn dùng: ${expiryFormatted}` : "Đang diễn ra"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              {featuredPromo.description ||
                `Nhập mã ${featuredPromo.code} để mở khóa toàn bộ ${featuredPromo.durationDays} ngày VIP và ${featuredPromo.aiQuota} lượt chấm AI.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-background text-foreground hover:bg-muted font-mono font-bold text-xs transition-colors cursor-pointer"
          >
            <span>{featuredPromo.code}</span>
            {copied ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>

          <Link
            href={`/pricing?code=${encodeURIComponent(featuredPromo.code)}`}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-primary text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer whitespace-nowrap"
          >
            <span>Dùng ngay</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
