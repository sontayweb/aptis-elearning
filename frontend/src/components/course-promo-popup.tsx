"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  ArrowRight,
  X,
  MessageCircle,
  Clock,
  Send,
  Loader2,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  CreditCard,
  QrCode,
  Flame,
  PhoneCall,
  AlertCircle,
  FileText,
  Headphones,
  MessageSquare,
  PenLine,
  Mail,
  Target,
  ChevronRight,
  ShieldCheck,
  Users,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { SITE_CONFIG } from "@/config/site-config";
import { COURSE_SYLLABUS, SyllabusSession } from "@/components/course-class-banner";

export interface BatchItem {
  id: string;
  batchCode?: string;
  dateStr: string;
  isHot?: boolean;
  seatsLeft?: number;
  scheduleTime?: string;
}

const defaultBatches: BatchItem[] = [
  {
    id: "batch_1",
    dateStr: SITE_CONFIG.courseClass.fixedOpeningDate || "15/10",
    isHot: true,
    seatsLeft: 3,
    scheduleTime: "Tối 2-4-6 (19:30 - 21:30)",
  },
  {
    id: "batch_2",
    dateStr: "25/10",
    isHot: false,
    seatsLeft: 6,
    scheduleTime: "Tối 3-5-7 (19:30 - 21:30)",
  },
  {
    id: "batch_3",
    dateStr: "05/11",
    isHot: false,
    seatsLeft: 12,
    scheduleTime: "Tối 2-4-6 (19:30 - 21:30)",
  },
  {
    id: "batch_4",
    dateStr: "15/11",
    isHot: false,
    seatsLeft: 15,
    scheduleTime: "Tối 3-5-7 (19:30 - 21:30)",
  },
  {
    id: "batch_5",
    dateStr: "25/11",
    isHot: false,
    seatsLeft: 15,
    scheduleTime: "Tối 2-4-6 (19:30 - 21:30)",
  },
];

interface CoursePromoPopupProps {
  /** Có tự động hiện sau khi load trang hay không (mặc định: true) */
  autoShow?: boolean;
  /** Thời gian trễ (ms) trước khi popup tự động bật lên (mặc định: 1000ms) */
  delayMs?: number;
  /** Callback khi người dùng hoàn tất đăng ký */
  onRegistered?: () => void;
}

export function CoursePromoPopup({
  autoShow = true,
  delayMs = 1000,
  onRegistered,
}: CoursePromoPopupProps) {
  const pathname = usePathname();
  const { zaloContactUrl, supportHotline } = useSiteSettings();

  const [isOpen, setIsOpen] = useState(false);
  const [batches, setBatches] = useState<BatchItem[]>(defaultBatches);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem>(defaultBatches[0]);
  const [activeTab, setActiveTab] = useState<"register" | "syllabus" | "payment">("register");

  // Form đăng ký giữ chỗ
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [targetBand, setTargetBand] = useState<string>("B2");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedSTK, setCopiedSTK] = useState(false);
  const [dontShowAgainToday, setDontShowAgainToday] = useState(false);

  // Không hiển thị popup trên các trang quản trị admin hoặc khi đang thi thử trực tiếp
  const isAdminOrExamPage =
    pathname?.startsWith("/admin") ||
    pathname?.includes("/take") ||
    pathname?.includes("/exams/");

  // Lắng nghe sự kiện toàn cục để mở popup từ bất cứ nơi đâu
  useEffect(() => {
    const handleOpenEvent = (e?: any) => {
      if (e?.detail?.batch) {
        setSelectedBatch(e.detail.batch);
      }
      if (e?.detail?.tab) {
        setActiveTab(e.detail.tab);
      }
      setIsOpen(true);
    };

    window.addEventListener("open-course-promo-popup", handleOpenEvent);
    return () => window.removeEventListener("open-course-promo-popup", handleOpenEvent);
  }, []);

  // Lắng nghe phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Tải danh sách đợt khai giảng mới nhất từ API & Kích hoạt popup khi vào trang
  useEffect(() => {
    if (isAdminOrExamPage) return;

    let isMounted = true;

    async function initBatchesAndTrigger() {
      try {
        const res = await api.courses.getFeaturedFasttrack();
        if (res.success && res.data?.batches && res.data.batches.length > 0) {
          if (isMounted) {
            setBatches(res.data.batches);
            setSelectedBatch(res.data.batches[0]);
          }
        }
      } catch (err) {
        // Fallback sang defaultBatches
      }

      if (!autoShow) return;

      // Kiểm tra nếu học viên đã đánh dấu không nhắc lại hôm nay
      const dismissUntil = localStorage.getItem("aptis_promo_dismiss_today");
      if (dismissUntil && Number(dismissUntil) > Date.now()) {
        return;
      }

      // Kích hoạt popup sau delayMs
      const timer = setTimeout(() => {
        if (isMounted) {
          setIsOpen(true);
        }
      }, delayMs);

      return () => clearTimeout(timer);
    }

    initBatchesAndTrigger();

    return () => {
      isMounted = false;
    };
  }, [autoShow, delayMs, isAdminOrExamPage]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    if (dontShowAgainToday) {
      // Lưu thời gian hết hạn đến hết ngày (24 giờ)
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("aptis_promo_dismiss_today", String(expiresAt));
    }
  }, [dontShowAgainToday]);

  const handleCopySTK = () => {
    navigator.clipboard.writeText(SITE_CONFIG.bankAccount.accountNumber);
    setCopiedSTK(true);
    setTimeout(() => setCopiedSTK(false), 2500);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.courses.registerLead({
        batchId: selectedBatch.id,
        batchDateStr: selectedBatch.dateStr,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        targetBand: targetBand,
        note: note.trim() || undefined,
      });

      setSubmitSuccess(true);
      if (onRegistered) onRegistered();
    } catch (err: any) {
      console.error("Lỗi khi gửi thông tin giữ chỗ:", err);
      // Dù API có gián đoạn, vẫn báo thành công và hỗ trợ học viên kết nối qua Zalo
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSessionIcon = (iconType: SyllabusSession["iconType"], colorScheme: "rose" | "blue") => {
    const iconClass = colorScheme === "rose" ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400";
    switch (iconType) {
      case "file":
        return <FileText className={`w-4 h-4 ${iconClass}`} />;
      case "book":
        return <BookOpen className={`w-4 h-4 ${iconClass}`} />;
      case "headphones":
        return <Headphones className={`w-4 h-4 ${iconClass}`} />;
      case "message":
        return <MessageSquare className={`w-4 h-4 ${iconClass}`} />;
      case "pen":
        return <PenLine className={`w-4 h-4 ${iconClass}`} />;
      case "mail":
        return <Mail className={`w-4 h-4 ${iconClass}`} />;
      case "target":
        return <Target className={`w-4 h-4 ${iconClass}`} />;
      default:
        return <FileText className={`w-4 h-4 ${iconClass}`} />;
    }
  };

  if (isAdminOrExamPage) return null;

  return (
    <>
      {/* ── 1. MODAL POPUP CHÍNH ── */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="promo-popup-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
          onClick={handleClose}
        >
          <div
            className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl border border-rose-500/30 bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Nút đóng X góc trên */}
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-3.5 right-3.5 z-30 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/90 hover:text-white transition-all cursor-pointer shadow-md backdrop-blur-xs"
              aria-label="Đóng thông báo"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Top Header Banner Gradient */}
            <div className="relative p-5 sm:p-6 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white overflow-hidden shrink-0">
              {/* Hiệu ứng ánh sáng trang trí */}
              <div
                aria-hidden="true"
                className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/15 rounded-full blur-2xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute -left-12 -top-12 w-40 h-40 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"
              />

              <div className="relative z-10 flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-rose-600 font-black text-[11px] uppercase tracking-wider shadow-sm animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  LỊCH KHAI GIẢNG MỚI
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400/90 text-amber-950 text-[11px] font-black uppercase tracking-wider shadow-sm">
                  <Flame className="w-3 h-3 fill-amber-950" />
                  Ưu đãi 1.400.000đ / khóa
                </span>
              </div>

              <h2
                id="promo-popup-title"
                className="relative z-10 font-heading font-black text-xl sm:text-2xl md:text-3xl leading-tight text-white drop-shadow-xs"
              >
                LỚP ONLINE APTIS ESOL B2
              </h2>

              <p className="relative z-10 text-xs sm:text-sm font-bold text-white/95 uppercase tracking-wide mt-1">
                ÔN CẤP TỐC ĐẠT MỤC TIÊU B2 • 11 BUỔI TRỌNG TÂM
              </p>

              {/* Lịch học & hình thức */}
              <div className="relative z-10 mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/95">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{SITE_CONFIG.courseClass.scheduleDays} ({SITE_CONFIG.courseClass.scheduleTime})</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-[11px]">
                  <span>Trực tuyến Zoom</span>
                  <span className="text-white/60">•</span>
                  <span>Có video xem lại</span>
                </div>
              </div>
            </div>

            {/* Dải chọn đợt khai giảng nhanh */}
            <div className="px-5 py-3 bg-muted/40 border-b border-border/80 flex items-center justify-between gap-3 shrink-0 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground shrink-0">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Chọn đợt:</span>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 w-full sm:w-auto scrollbar-none">
                {batches.map((b) => {
                  const isSelected = selectedBatch.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBatch(b)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 inline-flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-rose-600 text-white shadow-md scale-102 ring-2 ring-rose-500/40"
                          : "bg-card hover:bg-muted text-foreground border border-border/80 hover:border-rose-500/40"
                      }`}
                    >
                      <span>{b.dateStr}</span>
                      {b.isHot && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                      {b.seatsLeft !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? "bg-white/25 text-white"
                              : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          {b.seatsLeft > 0 ? `Còn ${b.seatsLeft} chỗ` : "Sắp đầy"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3 Tabs điều hướng */}
            <div className="px-5 pt-3 border-b border-border/70 flex items-center gap-2 shrink-0 bg-card">
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === "register"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Đăng ký giữ chỗ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("syllabus")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === "syllabus"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Lộ trình 11 buổi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("payment")}
                className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === "payment"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {SITE_CONFIG.courseClass.tuitionVnd === 0 ? (
                  <>
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Tư vấn &amp; Học phí</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Thanh toán VietQR</span>
                  </>
                )}
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {submitSuccess ? (
                /* Màn hình thông báo thành công */
                <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-heading font-black text-foreground text-lg sm:text-xl">
                    Đăng ký giữ chỗ đợt {selectedBatch.dateStr} thành công!
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
                    Cố vấn học tập đã ghi nhận thông tin của bạn. Giảng viên sẽ liên hệ qua Zalo{" "}
                    <strong className="text-foreground">{phoneNumber}</strong> trong vòng 15 phút để gửi tài liệu và xếp lịch học.
                  </p>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <a
                      href={zaloContactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full sm:w-auto h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Mở Zalo nhận tài liệu &amp; tư vấn ngay</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleClose}
                      className="w-full sm:w-auto h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                    >
                      Đóng lại
                    </button>
                  </div>
                </div>
              ) : activeTab === "register" ? (
                /* TAB 1: FORM ĐĂNG KÝ GIỮ CHỖ */
                <div className="space-y-4">
                  {/* Checklist 4 cam kết vàng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs">
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>11 buổi trọng tâm:</strong> Bám sát đề thi thật.</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Trực tuyến Zoom:</strong> Có video xem lại mỗi buổi.</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Giáo viên sửa 1:1:</strong> Nhận xét bài viết &amp; nói.</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Tặng Web luyện thi:</strong> Kho đề thi chuẩn CEFR.</span>
                    </div>
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Form điền thông tin */}
                  <form onSubmit={handleSubmitLead} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Họ và tên của bạn <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ví dụ: Nguyễn Văn An"
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Số điện thoại / Zalo <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Ví dụ: 0987654321"
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Mục tiêu chứng chỉ
                        </label>
                        <select
                          value={targetBand}
                          onChange={(e) => setTargetBand(e.target.value)}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        >
                          <option value="B2">Mục tiêu Aptis ESOL B2 (Phổ biến nhất)</option>
                          <option value="B1">Mục tiêu Aptis ESOL B1</option>
                          <option value="C1">Mục tiêu Aptis ESOL C1</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Ghi chú thêm (nếu có)
                        </label>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Ví dụ: Cần thi gấp trong tháng..."
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        />
                      </div>
                    </div>

                    <div className="pt-1 space-y-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-xl btn-brand-gradient text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-glow-soft hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Đang gửi thông tin đăng ký...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Đăng ký giữ chỗ đợt {selectedBatch.dateStr} ({SITE_CONFIG.courseClass.tuitionFormatted})</span>
                          </>
                        )}
                      </button>

                      {/* Hai kênh liên hệ nhanh */}
                      <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                        <a
                          href={zaloContactUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Nhắn Zalo cố vấn ngay</span>
                        </a>

                        <a
                          href={`tel:${supportHotline?.replace(/[^0-9]/g, "") || "0379866596"}`}
                          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]"
                        >
                          <PhoneCall className="w-3 h-3 text-rose-500" />
                          <span>Hotline: <strong>{supportHotline || SITE_CONFIG.contact.defaultHotline}</strong></span>
                        </a>
                      </div>
                    </div>
                  </form>
                </div>
              ) : activeTab === "syllabus" ? (
                /* TAB 2: LỘ TRÌNH 11 BUỔI HỌC */
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-foreground block">
                        Khóa 11 buổi bám sát cấu trúc đề thi British Council
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Học tối Thứ 3 – Thứ 5 – Thứ 7 (20:00 – 21:30) qua Zoom
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("register")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs shrink-0 cursor-pointer hover:bg-rose-700 transition-colors"
                    >
                      Giữ chỗ ngay →
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                    {COURSE_SYLLABUS.map((s) => (
                      <div
                        key={s.session}
                        className="p-3 rounded-xl border border-border/70 bg-card hover:border-rose-500/40 transition-colors flex items-start gap-3"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            s.colorScheme === "rose"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {renderSessionIcon(s.iconType, s.colorScheme)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-black text-white shrink-0 ${
                                s.colorScheme === "rose" ? "bg-rose-600" : "bg-blue-600"
                              }`}
                            >
                              Buổi {s.session}
                            </span>
                            <h4 className="font-bold text-xs sm:text-[13px] text-foreground">
                              {s.title}
                            </h4>
                          </div>
                          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 mt-0.5">
                            {s.subtitle}
                          </p>
                          <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground list-disc list-inside">
                            {s.bullets.map((b, bIdx) => (
                              <li key={bIdx}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* TAB 3: TƯ VẤN HỌC PHÍ & LỘ TRÌNH (HOẶC VIETQR NẾU CÓ GIÁ) */
                SITE_CONFIG.courseClass.tuitionVnd === 0 || SITE_CONFIG.bankAccount.accountNumber.includes("Liên hệ") ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-primary/5 to-amber-500/10 border border-rose-500/20 text-xs text-foreground">
                      <div className="flex items-center gap-2 mb-1.5 font-bold text-rose-600 dark:text-rose-400">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span className="text-sm">Tư vấn lộ trình cá nhân hóa &amp; Nhận học phí ưu đãi</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed text-[11px]">
                        Học phí khóa học và tài khoản ngân hàng sẽ được giảng viên gửi trực tiếp sau khi tư vấn và đánh giá năng lực đầu vào miễn phí cho bạn.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">Lộ trình học</span>
                        <p className="font-heading font-black text-foreground text-sm">
                          {SITE_CONFIG.courseClass.durationText} · {SITE_CONFIG.courseClass.totalSessions} buổi
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {SITE_CONFIG.courseClass.scheduleDays} ({SITE_CONFIG.courseClass.scheduleTime})
                        </p>
                      </div>

                      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase block">Mức học phí</span>
                        <p className="font-heading font-black text-rose-600 dark:text-rose-400 text-base">
                          {SITE_CONFIG.courseClass.tuitionFormatted}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Hỗ trợ trả góp &amp; tặng bộ tài liệu ôn thi độc quyền
                        </p>
                      </div>
                    </div>

                    {/* 2 Kênh liên hệ tư vấn viên */}
                    <div className="p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
                      <p className="text-xs text-foreground font-semibold">
                        Liên hệ trực tiếp với Cố vấn đào tạo để giữ chỗ đợt <strong>{selectedBatch.dateStr}</strong>:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <a
                          href={zaloContactUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-11 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Nhắn Zalo cố vấn ngay (24/7)</span>
                        </a>
                        <a
                          href={`tel:${supportHotline?.replace(/[^0-9]/g, "") || SITE_CONFIG.contact.defaultZaloPhone}`}
                          className="h-11 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
                        >
                          <PhoneCall className="w-4 h-4 text-rose-500" />
                          <span>Hotline: {supportHotline || SITE_CONFIG.contact.defaultHotline}</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
                      <strong>Học phí ưu đãi:</strong>{" "}
                      <span className="text-rose-600 dark:text-rose-400 font-extrabold text-sm">
                        {SITE_CONFIG.courseClass.tuitionFormatted}
                      </span>{" "}
                      (Đăng ký đợt {selectedBatch.dateStr})
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      {/* Ảnh mã VietQR */}
                      <div className="flex flex-col items-center p-3 rounded-2xl border border-border bg-white text-slate-900">
                        <img
                          src={`https://img.vietqr.io/image/MB-${SITE_CONFIG.bankAccount.accountNumber}-compact2.png?amount=${SITE_CONFIG.courseClass.tuitionVnd}&addInfo=APTIS%20B2%20${encodeURIComponent(selectedBatch.dateStr)}&accountName=${encodeURIComponent(SITE_CONFIG.bankAccount.accountHolder)}`}
                          alt="Mã VietQR thanh toán học phí"
                          className="w-44 h-44 object-contain"
                          loading="lazy"
                        />
                        <span className="text-[10px] font-semibold text-slate-500 mt-1">
                          Quét mã VietQR bằng app ngân hàng
                        </span>
                      </div>

                      {/* Chi tiết tài khoản ngân hàng */}
                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-muted-foreground text-[10px] block">Ngân hàng</span>
                          <span className="font-bold text-foreground text-xs">{SITE_CONFIG.bankAccount.bankName}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between">
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Số tài khoản</span>
                            <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                              {SITE_CONFIG.bankAccount.accountNumber}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopySTK}
                            className="px-2.5 py-1.5 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            {copiedSTK ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-muted-foreground text-[10px] block">Chủ tài khoản</span>
                          <span className="font-bold text-foreground text-xs">{SITE_CONFIG.bankAccount.accountHolder}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border">
                          <span className="text-muted-foreground text-[10px] block">Cú pháp chuyển khoản</span>
                          <span className="font-mono font-bold text-foreground text-xs">
                            Tên + SĐT + B2 {selectedBatch.dateStr}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border text-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                      <span className="text-muted-foreground text-[11px]">
                        Sau khi chuyển khoản, bạn chỉ cần gửi biên lai qua Zalo để trợ giảng xếp lớp ngay:
                      </span>
                      <a
                        href={zaloContactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Xác nhận qua Zalo</span>
                      </a>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-border/80 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground shrink-0">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px]">
                <input
                  type="checkbox"
                  checked={dontShowAgainToday}
                  onChange={(e) => setDontShowAgainToday(e.target.checked)}
                  className="rounded border-border text-rose-600 focus:ring-rose-500"
                />
                <span>Không nhắc lại trong 24h</span>
              </label>

              <button
                type="button"
                onClick={handleClose}
                className="hover:text-foreground font-semibold hover:underline cursor-pointer text-xs"
              >
                Để sau / Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. NÚT KÍCH HOẠT NHẸ NHÀNG KHI POPUP ĐANG ĐÓNG ── */}
      {!isOpen && (
        <div className="fixed z-40 bottom-20 md:bottom-6 left-3 sm:left-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-card/95 hover:bg-card text-foreground border border-rose-500/40 shadow-xl backdrop-blur-md transition-all hover:scale-103 cursor-pointer hover:border-rose-500"
            title="Xem lịch khai giảng lớp online Aptis B2 mới nhất"
          >
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-600 to-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-wide">
                  Lịch khai giảng mới
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="text-xs font-extrabold text-foreground leading-tight">
                Đợt {selectedBatch?.dateStr || "15/10"} • Ưu đãi 35%
              </div>
            </div>
          </button>
        </div>
      )}
    </>
  );
}
