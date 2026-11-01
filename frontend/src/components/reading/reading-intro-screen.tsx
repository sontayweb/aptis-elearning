"use client";

import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Clock,
  Highlighter,
  Info,
  Sparkles,
  Flag,
  Layers,
} from "lucide-react";

interface ReadingIntroScreenProps {
  title?: string;
  durationMinutes?: number;
  stagesCount?: number;
  onStart: () => void;
}

/**
 * Màn hình Hướng dẫn thao tác trước khi vào bài thi Reading (PHẦN IV.1).
 * Giúp học viên nắm rõ thao tác từng phần (chọn từ, kéo thả câu, nối ý, highlight dẫn chứng)
 * và chủ động bấm Bắt đầu mới tính giờ 35 phút.
 */
export function ReadingIntroScreen({
  title,
  durationMinutes = 35,
  stagesCount = 4,
  onStart,
}: ReadingIntroScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
              Aptis ESOL Reading
            </span>
            <span className="text-sm font-bold text-foreground">
              Hướng dẫn thao tác &amp; Quy chế
            </span>
          </div>
        </div>
        <Link
          href="/reading"
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
              <BookOpen className="w-3.5 h-3.5" />
              <span>Reading Practice Test</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-foreground">
              {title || "Bài luyện thi Aptis Reading"}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Nắm vững cấu trúc các phần thi và công cụ Highlight dẫn chứng trước khi bắt đầu tính giờ.
            </p>
          </div>

          {/* Grid Specs */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Cấu trúc đề</div>
              <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{stagesCount > 1 ? "4 Phần (25 câu)" : "1 Phần luyện lẻ"}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Thời gian làm bài</div>
              <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5 flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{durationMinutes} phút</span>
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Công cụ hỗ trợ</div>
              <div className="text-sm md:text-base font-extrabold text-primary mt-0.5 flex items-center justify-center gap-1">
                <Highlighter className="w-3.5 h-3.5" />
                <span>Highlight &amp; Cờ</span>
              </div>
            </div>
          </div>

          {/* Interactive Guide per Part */}
          <div className="p-5 rounded-2xl border border-border bg-muted/15 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Hướng dẫn thao tác tương tác 4 phần thi</span>
              </span>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                Thao tác nhanh
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 1 — Điền từ vào câu</span>
                  <span className="text-[10px] font-semibold text-primary">5 câu · 10 điểm</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Bấm trực tiếp vào từng ô trống trong bức thư ngắn và chọn <strong>1 từ đúng nhất</strong> từ danh sách thả xuống.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 2 — Sắp xếp đoạn văn</span>
                  <span className="text-[10px] font-semibold text-primary">2 bài · 10 điểm</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  <strong>Kéo thả trực tiếp</strong> các thẻ câu (hoặc bấm nút mũi tên <code className="px-1 py-0.5 bg-muted rounded">↑</code> <code className="px-1 py-0.5 bg-muted rounded">↓</code>) để xếp thành câu chuyện hoàn chỉnh.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 3 (Opinion Matching)</span>
                  <span className="text-[10px] font-semibold text-primary">7 câu · 14 điểm</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Đọc quan điểm của 4 người (A, B, C, D) và nối từng câu hỏi bên phải với đúng người có ý kiến tương ứng.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Part 4 (Long Reading)</span>
                  <span className="text-[10px] font-semibold text-primary">7 đoạn · 16 điểm</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Đọc bài văn dài, dùng chuột <strong>bôi đen câu dẫn chứng</strong> để bật nút <strong className="text-amber-600 dark:text-amber-400">🖍️ Highlight</strong> và chọn tiêu đề (Heading) cho mỗi đoạn.
                </p>
              </div>
            </div>
          </div>

          {/* Rules Notice */}
          <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 text-xs text-muted-foreground">
            <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
              <Info className="w-4 h-4 text-primary" />
              <span>Lưu ý khi làm bài Reading:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1">
              <li>Thời gian làm bài <strong className="text-foreground">{durationMinutes} phút</strong> sẽ bắt đầu đếm ngược ngay khi bạn bấm nút <strong className="text-foreground">Bắt đầu</strong>.</li>
              <li>Sử dụng nút <strong className="text-amber-600 dark:text-amber-400 inline-flex items-center gap-0.5"><Flag className="w-3 h-3 inline" /> Gắn cờ</strong> ở góc trên bài đọc để đánh dấu phần cần xem lại trước khi nộp bài.</li>
              <li>Sau khi nộp bài, hệ thống hiển thị <strong className="text-primary">Lời giải thích chi tiết &amp; Dẫn chứng</strong> cho từng câu hỏi.</li>
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

