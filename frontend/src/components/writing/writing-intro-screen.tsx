"use client";

import Link from "next/link";
import {
  PenTool,
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  CheckCircle2,
  Info,
  Lock,
  Sparkles,
} from "lucide-react";

interface WritingIntroScreenProps {
  title?: string;
  partsCount?: number;
  totalMinutes?: number;
  onStart: () => void;
}

/**
 * Màn hình Tổng quan & Quy chế trước khi vào bài thi Writing (PHẦN II.1).
 * Giúp học viên nắm rõ hạn mức từ khóa cứng (Hard Lock) và chủ động kích hoạt đồng hồ.
 */
export function WritingIntroScreen({
  title,
  partsCount = 4,
  totalMinutes = 50,
  onStart,
}: WritingIntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            <PenTool className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Aptis ESOL Writing
            </span>
            <span className="text-sm font-bold text-foreground">
              Tổng quan &amp; Quy chế làm bài
            </span>
          </div>
        </div>
        <Link
          href="/writing"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách đề</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 flex items-center justify-center">
        <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in">
          {/* Title & Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
              <PenTool className="w-3.5 h-3.5" />
              <span>Writing Practice Test</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              {title || "Bài luyện thi Aptis Writing"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Xem kỹ hạn mức số từ và hướng dẫn phân bổ thời gian trước khi bắt đầu tính giờ.
            </p>
          </div>

          {/* Grid Specs */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Cấu trúc bài thi</div>
              <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5">
                {partsCount > 1 ? "4 Phần (Part 1–4)" : "1 Phần luyện lẻ"}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Tổng thời gian</div>
              <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{totalMinutes} phút</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Kiểm soát số từ</div>
              <div className="text-sm md:text-base font-extrabold text-primary mt-0.5 flex items-center justify-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                <span>Hard Lock</span>
              </div>
            </div>
          </div>

          {/* 4 Parts Breakdown & Word Limits */}
          <div className="p-5 rounded-2xl border border-border bg-muted/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Cấu trúc 4 Part &amp; Hạn mức từ tối đa</span>
              </span>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Chuẩn British Council
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 1 — Thông tin cá nhân</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">~3 phút</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  5 câu trả lời ngắn gọn (1–5 từ/câu).
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">Giới hạn khóa:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">Tối đa 10 từ / câu</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 2 — Điền đơn CLB</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">~7 phút</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Viết đoạn văn ngắn trả lời câu hỏi (20–30 từ).
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">Giới hạn khóa:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">Tối đa 45 từ</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 3 — Phòng chat CLB</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">~10 phút</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Trả lời 3 thành viên trong nhóm chat (30–40 từ/câu).
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">Giới hạn khóa:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">Tối đa 60 từ / câu</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 4 — Viết 2 Email</span>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Gợi ý: 20–30 phút</span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Thư thân mật (~50 từ) &amp; Thư trang trọng (120–150 từ).
                </p>
                <div className="pt-1 flex items-center justify-between border-t border-border/60">
                  <span className="text-[11px] text-muted-foreground">Giới hạn khóa:</span>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400">75 từ &amp; 225 từ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-1.5 text-xs">
            <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Cảnh báo giới hạn từ &amp; Phân bổ thời gian:</span>
            </div>
            <p className="text-foreground/90 leading-relaxed pl-5">
              Hệ thống sẽ <strong>khóa nhập liệu khi chạm ngưỡng từ tối đa</strong> (viền ô nhập chuyển đỏ, bạn vẫn có thể xóa/sửa lại từ đã viết). Hãy phân bổ thời gian hợp lý — <strong>gợi ý dành ít nhất 20 phút cho Part 4</strong> vì phần này chiếm trọng số điểm cao nhất (C1/C2).
            </p>
          </div>

          {/* Rules Notice */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 text-xs text-muted-foreground">
            <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-primary" />
              <span>Quy chế phòng thi Writing:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Bài viết được tự động lưu nháp liên tục mỗi khi bạn gõ phím.</li>
              <li>Bạn có thể chuyển đổi tự do giữa các Part và dùng nút <strong className="text-foreground">Gắn cờ</strong> để đánh dấu phần cần kiểm tra lại.</li>
              <li>Sau khi nộp bài, hệ thống <strong className="text-primary">AI Kỳ Tích</strong> sẽ chấm điểm chi tiết theo thang CEFR (A1–C) và sửa lỗi ngữ pháp từng câu.</li>
            </ul>
          </div>

          {/* Navigation CTA Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onStart}
              className="tech-btn w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>Bắt đầu</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={onStart}
                className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4 cursor-pointer transition-colors"
              >
                Vào nhanh (Bỏ qua hướng dẫn)
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

