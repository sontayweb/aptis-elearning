"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  PanelLeftClose,
  Users,
  CreditCard,
  BookOpen,
  History,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Search,
  ArrowLeft,
  LucideIcon,
} from "lucide-react";

interface AdminTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  targetId: string;
  badge: string;
  title: string;
  icon: LucideIcon;
  description: string;
  tips: string[];
  preferredPlacement?: "right" | "bottom" | "top" | "left";
}

export default function AdminTutorialModal({ isOpen, onClose }: AdminTutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const [popoverPos, setPopoverPos] = useState<{
    x: number;
    y: number;
    arrowSide: "left" | "top" | "bottom" | "none";
  }>({
    x: 0,
    y: 0,
    arrowSide: "none",
  });

  const steps: TourStep[] = [
    {
      targetId: "tour-sidebar-collapse",
      preferredPlacement: "right",
      badge: "Không gian làm việc",
      title: "Thu gọn Menu (Sidebar Collapsible)",
      icon: PanelLeftClose,
      description:
        "Bấm vào đây để thu gọn hoặc mở rộng thanh điều hướng bên trái thành dạng Mini-Sidebar (w-20). Khi thu gọn, diện tích màn hình tăng thêm 25%, giúp bạn quan sát các bảng dữ liệu lớn mà không cần cuộn ngang.",
      tips: [
        "Chuyển đổi tức thì giữa 2 chế độ đóng / mở.",
        "Rê chuột vào biểu tượng khi thu gọn để xem chú thích chi tiết.",
        "Hệ thống tự động ghi nhớ trạng thái đóng/mở của bạn.",
      ],
    },
    {
      targetId: "tour-search-btn",
      preferredPlacement: "bottom",
      badge: "Phím tắt thần tốc",
      title: "Tìm kiếm nhanh Command Palette (Ctrl + K)",
      icon: Search,
      description:
        "Bấm tổ hợp phím Ctrl + K (hoặc nhấp chuột vào đây) để mở bảng lệnh tìm kiếm thông minh. Bạn có thể tra cứu nhanh bất kỳ học viên, đề thi, giao dịch hoặc nhảy trang ngay lập tức.",
      tips: [
        "Gõ tắt tên tính năng hoặc từ khóa để tìm siêu tốc.",
        "Dùng phím Mũi tên Lên/Xuống để duyệt danh sách và Enter để chọn.",
        "Bấm phím Esc để đóng nhanh bảng tìm kiếm.",
      ],
    },
    {
      targetId: "tour-nav-users",
      preferredPlacement: "right",
      badge: "Chăm sóc Học viên",
      title: "Quản lý Học viên & Hỗ trợ 1 Chạm",
      icon: Users,
      description:
        "Quản lý danh sách tài khoản học viên và giảng viên. Nhấp vào nút 'Hỗ trợ' ở bất kỳ học viên nào để mở ngay Ngăn hỗ trợ nhanh bên phải.",
      tips: [
        "Gia hạn VIP tức thì: +7 ngày, +30 ngày, +90 ngày kèm lý do đối soát.",
        "Cộng lượt AI chấm bài Speaking & Writing ngay lập tức.",
        "1-Click đặt lại mật khẩu về mặc định để gửi Zalo cho học viên.",
      ],
    },
    {
      targetId: "tour-nav-transactions",
      preferredPlacement: "right",
      badge: "Khớp lệnh Tài chính",
      title: "Sổ lệnh SePay & Khớp tiền Tự động",
      icon: CreditCard,
      description:
        "Hệ thống tự động lắng nghe Webhook ngân hàng MB Bank và kích hoạt VIP khi nhận tiền. Nếu học viên chuyển sai cú pháp, bạn có thể tra cứu và khớp lệnh thủ công chỉ trong 5 giây.",
      tips: [
        "Phù hiệu đơn chờ trên thanh Header sẽ báo khi có giao dịch cần xử lý.",
        "Tìm kiếm học viên theo Số điện thoại, Email hoặc Họ tên.",
        "Tự động kích hoạt gói VIP và lưu nhật ký giao dịch minh bạch.",
      ],
    },
    {
      targetId: "tour-nav-exams",
      preferredPlacement: "right",
      badge: "Học vụ & Khảo thí",
      title: "Ngân hàng Đề thi Aptis Chuẩn CEFR",
      icon: BookOpen,
      description:
        "Ngân hàng đề thi 4 kỹ năng Nghe, Đọc, Viết, Nói chuẩn format British Council. Hỗ trợ tạo đề thi thử theo Stepper Wizard và phân định gói Miễn phí với gói PRO.",
      tips: [
        "Tạo đề thi mới theo từng bước trực quan, dễ quản trị.",
        "Nghe thử file âm thanh Audio trực tiếp trước khi xuất bản cho học viên.",
        "Gắn cờ VIP PRO để bảo vệ tài nguyên đề thi chất lượng cao.",
      ],
    },
    {
      targetId: "tour-nav-audit-logs",
      preferredPlacement: "right",
      badge: "Bảo mật & Giám sát",
      title: "Nhật ký Kiểm toán (Audit Logs)",
      icon: History,
      description:
        "Toàn bộ thao tác nhạy cảm (cấp VIP, xóa đề, mở khóa tài khoản, duyệt tiền) đều được ghi nhận vĩnh viễn bằng tiếng Việt đời thường, minh bạch và an toàn.",
      tips: [
        "Chuẩn Append-Only bảo vệ tính toàn vẹn, chống can thiệp dữ liệu.",
        "Ghi nhận chi tiết: Ai đã làm gì, lúc nào, với học viên nào, từ IP nào.",
        "Chế độ xem kỹ thuật JSON Diff khi cần đối chiếu biến động dữ liệu.",
      ],
    },
    {
      targetId: "tour-profile-footer",
      preferredPlacement: "right",
      badge: "Chuyển đổi giao diện",
      title: "Chuyển nhanh sang Portal Học viên",
      icon: ArrowLeft,
      description:
        "Cho phép bạn lập tức chuyển sang giao diện của Học viên để trải nghiệm thực tế bài làm, kiểm tra ngân hàng đề thi trước khi học viên sử dụng.",
      tips: [
        "1 tài khoản quản trị kiểm tra được toàn diện cả 2 giao diện.",
        "Chuyển qua lại mượt mà không cần đăng xuất.",
      ],
    },
  ];

  const current = steps[currentStep] || steps[0];
  const Icon = current.icon;

  const updateSpotlight = useCallback(() => {
    if (!isOpen) return;

    const el = document.getElementById(current.targetId);
    if (!el) {
      setSpotlightRect(null);
      // Center in viewport
      const cardW = Math.min(420, window.innerWidth - 32);
      const cardH = 340;
      setPopoverPos({
        x: Math.max(16, (window.innerWidth - cardW) / 2),
        y: Math.max(16, (window.innerHeight - cardH) / 2),
        arrowSide: "none",
      });
      return;
    }

    // Scroll target into view if needed
    el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });

    const rect = el.getBoundingClientRect();
    setSpotlightRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    const cardW = Math.min(420, window.innerWidth - 32);
    const cardH = 340;
    const padding = 16;
    const placement = current.preferredPlacement || "right";

    let x = 0;
    let y = 0;
    let arrowSide: "left" | "top" | "bottom" | "none" = "none";

    if (placement === "right") {
      x = rect.right + 18;
      y = rect.top + rect.height / 2 - 120;
      arrowSide = "left";

      // If overflowing right edge, flip to bottom
      if (x + cardW > window.innerWidth - padding) {
        x = rect.left + rect.width / 2 - cardW / 2;
        y = rect.bottom + 18;
        arrowSide = "top";
      }
    } else if (placement === "bottom") {
      x = rect.left + rect.width / 2 - cardW / 2;
      y = rect.bottom + 18;
      arrowSide = "top";

      // If overflowing bottom edge, flip to top
      if (y + cardH > window.innerHeight - padding) {
        y = rect.top - cardH - 18;
        arrowSide = "bottom";
      }
    } else if (placement === "top") {
      x = rect.left + rect.width / 2 - cardW / 2;
      y = rect.top - cardH - 18;
      arrowSide = "bottom";
    }

    // Clamp coordinates inside safe screen area
    x = Math.max(padding, Math.min(x, window.innerWidth - cardW - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - cardH - padding));

    setPopoverPos({ x, y, arrowSide });
  }, [isOpen, current]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setSpotlightRect(null);
      return;
    }

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Initial position calculation with a tiny delay to allow DOM render
    const timer = setTimeout(updateSpotlight, 60);

    const handleResize = () => updateSpotlight();
    const handleScroll = () => updateSpotlight();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          handleClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentStep, updateSpotlight]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem("admin_tutorial_dismissed", "true");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 1. INTERACTIVE SPOTLIGHT CUTOUT (Follows the target element with smooth glide) */}
      {spotlightRect ? (
        <div
          style={{
            top: Math.max(0, spotlightRect.top - 6),
            left: Math.max(0, spotlightRect.left - 6),
            width: spotlightRect.width + 12,
            height: spotlightRect.height + 12,
          }}
          className="fixed rounded-2xl pointer-events-none transition-all duration-300 ease-out z-[95] border-2 border-slate-900 shadow-[0_0_0_9999px_rgba(15,23,42,0.65),0_0_20px_rgba(15,23,42,0.4)] ring-4 ring-slate-900/10"
        >
          {/* Animated Pulsing Beacon on corner */}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 shadow-xs"></span>
          </span>
        </div>
      ) : (
        /* Fallback dark overlay when target element is not in DOM */
        <div
          onClick={handleClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[95] animate-in fade-in"
        />
      )}

      {/* 2. FLOATING POPOVER CARD ANCHORED NEXT TO TARGET */}
      <div
        style={{
          top: popoverPos.y,
          left: popoverPos.x,
        }}
        className="fixed z-[100] w-[420px] max-w-[calc(100vw-32px)] transition-all duration-300 ease-out animate-in fade-in zoom-in-95"
      >
        {/* Pointer Arrow */}
        {popoverPos.arrowSide === "left" && (
          <div className="hidden sm:block absolute -left-2 top-8 w-4 h-4 bg-slate-900 rotate-45 rounded-xs shadow-sm" />
        )}
        {popoverPos.arrowSide === "top" && (
          <div className="hidden sm:block absolute -top-2 left-10 w-4 h-4 bg-slate-900 rotate-45 rounded-xs shadow-sm" />
        )}
        {popoverPos.arrowSide === "bottom" && (
          <div className="hidden sm:block absolute -bottom-2 left-10 w-4 h-4 bg-white rotate-45 rounded-xs border-r border-b border-slate-200" />
        )}

        {/* Card Body */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white relative">
            <button
              onClick={handleClose}
              title="Đóng hướng dẫn (Esc)"
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-heading font-bold uppercase tracking-wider text-slate-200 border border-white/15">
                Bước {currentStep + 1} / {steps.length}
              </span>
              <span className="text-[11px] font-heading font-medium text-slate-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-rose-400" />
                <span>{current.badge}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                <Icon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-heading font-bold text-white tracking-tight leading-snug">
                {current.title}
              </h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-700 leading-relaxed font-normal text-xs sm:text-[13px]">
              {current.description}
            </p>

            {/* Key Tips */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 space-y-2">
              <div className="font-heading font-bold text-slate-800 flex items-center gap-1.5 text-[11px]">
                <Zap className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                <span>Gợi ý thao tác:</span>
              </div>
              <ul className="space-y-1 pl-4 list-disc text-slate-600 text-[11px]">
                {current.tips.map((tip, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col gap-3">
            {/* Top row: progress dots & checkbox */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    title={`Chuyển đến bước ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      currentStep === idx
                        ? "w-5 bg-slate-900"
                        : "w-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                  />
                ))}
              </div>

              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900"
                />
                <span>Không hiện lại</span>
              </label>
            </div>

            {/* Bottom row: navigation buttons */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-slate-500 hover:text-slate-900 font-heading font-medium transition-colors px-2 py-1.5"
              >
                Bỏ qua tour
              </button>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-medium transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hoàn tất & Khám phá</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
