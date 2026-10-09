"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { COURSE_SYLLABUS } from "@/components/course-class-banner";

interface CoursePromoPopupProps {
  /** Có tự động hiện sau khi load trang hay không (mặc định: true) */
  autoShow?: boolean;
  /** Thời gian trễ (ms) trước khi popup tự động bật lên (mặc định: 1500ms) */
  delayMs?: number;
  /** Callback khi người dùng hoàn tất đăng ký */
  onRegistered?: () => void;
}

export function CoursePromoPopup({
  autoShow = true,
  delayMs = 1500,
  onRegistered,
}: CoursePromoPopupProps) {
  const { zaloContactUrl, supportHotline } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<{ id: string; dateStr: string; seatsLeft?: number }>({
    id: "batch_15_10",
    dateStr: "15/10",
    seatsLeft: 3,
  });
  const [showSyllabusPreview, setShowSyllabusPreview] = useState(false);

  // Form đăng ký giữ chỗ
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dontShowAgainToday, setDontShowAgainToday] = useState(false);

  useEffect(() => {
    if (!autoShow) return;

    async function checkAndTrigger() {
      // 1. Kiểm tra nếu học viên đã đăng ký khóa học này trước đó
      const alreadyRegistered = localStorage.getItem("aptis_course_registered");
      if (alreadyRegistered === "true") return;

      // 2. Lấy đợt khai giảng mới nhất từ API (hoặc fallback)
      let activeBatchId = "batch_15_10";
      let activeBatchDate = "15/10";
      let seats = 3;

      try {
        const res = await api.courses.getFeaturedFasttrack();
        if (res.success && res.data?.batches && res.data.batches.length > 0) {
          const firstBatch = res.data.batches[0];
          activeBatchId = firstBatch.id;
          activeBatchDate = firstBatch.dateStr;
          seats = firstBatch.seatsLeft || 3;
          setCurrentBatch({ id: activeBatchId, dateStr: activeBatchDate, seatsLeft: seats });
        }
      } catch (err) {
        // Fallback mặc định
      }

      // 3. Kiểm tra xem người dùng đã đóng popup của đợt khai giảng này hôm nay chưa
      const dismissKey = `aptis_promo_dismiss_${activeBatchId}`;
      const dismissedUntil = localStorage.getItem(dismissKey);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        return;
      }

      // 4. Kích hoạt hiển thị popup sau delayMs
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }

    checkAndTrigger();
  }, [autoShow, delayMs]);

  const handleClose = () => {
    setIsOpen(false);
    // Lưu tạm thời gian đóng (nếu chọn không hiển thị lại hôm nay: 24h, nếu không: 4h)
    const hours = dontShowAgainToday ? 24 : 4;
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    localStorage.setItem(`aptis_promo_dismiss_${currentBatch.id}`, String(expiresAt));
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    setIsSubmitting(true);
    try {
      await api.courses.registerLead({
        batchId: currentBatch.id,
        batchDateStr: currentBatch.dateStr,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        targetBand: "B2",
      });
      // Đánh dấu đã đăng ký để không hiện popup làm phiền nữa
      localStorage.setItem("aptis_course_registered", "true");
      setSubmitSuccess(true);
      if (onRegistered) onRegistered();
    } catch (err) {
      console.error("Lỗi gửi thông tin đăng ký popup:", err);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-500/30 bg-card shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Nút đóng X góc trên */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-background/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
          aria-label="Đóng popup thông báo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Top Header Banner Gradient */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-rose-600 via-rose-500 to-amber-500 text-white overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white text-rose-600 font-black text-[11px] uppercase tracking-wider shadow-sm animate-pulse">
              <Sparkles className="w-3 h-3" />
              LỊCH KHAI GIẢNG MỚI
            </span>
            <span className="text-white/90 text-xs font-semibold">
              Ưu đãi giảm 35%
            </span>
          </div>

          <h3 className="relative z-10 font-heading font-black text-xl sm:text-2xl leading-tight text-white drop-shadow-xs">
            LỚP ONLINE APTIS ESOL B2
          </h3>
          <p className="relative z-10 text-xs font-bold text-white/95 uppercase tracking-wide mt-1">
            Ôn cấp tốc đạt mục tiêu B2 • 11 buổi học trọng tâm
          </p>

          {/* Pill Ngày khai giảng nổi bật */}
          <div className="relative z-10 mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white">
            <Calendar className="w-4 h-4 text-white" />
            <span>Khai giảng đợt: <strong className="underline underline-offset-2">{currentBatch.dateStr}</strong></span>
            <span className="bg-white text-rose-600 px-2 py-0.2 rounded-full text-[10px] font-black">
              Chỉ còn {currentBatch.seatsLeft || 3} chỗ
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {submitSuccess ? (
            <div className="py-6 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-heading font-black text-foreground text-lg">
                Đăng ký giữ chỗ thành công!
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Cố vấn học tập sẽ liên hệ với bạn trong vòng 15 phút để gửi tài liệu và xếp lịch học đợt{" "}
                <strong className="text-foreground">{currentBatch.dateStr}</strong>.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <a
                  href={zaloContactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto h-10 px-5 rounded-xl bg-blue-600 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Mở Zalo nhận tư vấn ngay</span>
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
          ) : (
            <>
              {/* Checklist cam kết 3 điểm vàng */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-muted/40 border border-border/80 text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>11 buổi học trọng tâm:</strong> Bám sát format đề thi, trúng trọng tâm.</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Học trực tuyến có ghi hình:</strong> Xem lại bài giảng sau mỗi buổi.</span>
                </div>
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Giáo viên chữa bài 1:1:</strong> Nhận xét và sửa lỗi chi tiết qua Zalo.</span>
                </div>
              </div>

              {/* Accordion thu gọn xem trước 11 buổi học */}
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setShowSyllabusPreview(!showSyllabusPreview)}
                  className="w-full px-3.5 py-2.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between font-bold text-foreground transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-rose-500" />
                    <span>Xem tóm tắt lộ trình 11 buổi học</span>
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {showSyllabusPreview ? "Thu gọn ▲" : "Xem chi tiết ▼"}
                  </span>
                </button>

                {showSyllabusPreview && (
                  <div className="p-3 bg-card border-t border-border space-y-2 max-h-48 overflow-y-auto">
                    {COURSE_SYLLABUS.map((s) => (
                      <div key={s.session} className="flex items-start gap-2 text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black text-white shrink-0 ${
                          s.colorScheme === "rose" ? "bg-rose-600" : "bg-blue-600"
                        }`}>
                          B{s.session}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-foreground">{s.title}:</span>{" "}
                          <span className="text-muted-foreground">{s.subtitle}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form giữ chỗ nhanh */}
              <form onSubmit={handleSubmitLead} className="space-y-3 pt-1">
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
                    Số điện thoại / Zalo nhận ưu đãi <span className="text-rose-500">*</span>
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

                <div className="pt-1 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-11 rounded-xl btn-brand-gradient text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-glow-soft hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang gửi thông tin...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Đăng ký giữ chỗ đợt {currentBatch.dateStr} (Giảm 35%)</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <a
                      href={zaloContactUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat Zalo tư vấn trực tiếp</span>
                    </a>

                    <span className="text-[11px] text-muted-foreground">
                      Hotline: <strong>0387.905.990</strong>
                    </span>
                  </div>
                </div>

                {/* Checkbox không hiển thị lại hôm nay */}
                <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
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
                    className="hover:text-foreground hover:underline cursor-pointer"
                  >
                    Để sau
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
