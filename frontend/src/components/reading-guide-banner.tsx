"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Trophy,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface ReadingGuideBannerProps {
  onOpenGuideModal?: () => void;
}

export function ReadingGuideBanner({ onOpenGuideModal }: ReadingGuideBannerProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wide">
                Hướng Dẫn Thi Thật
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                Target B2: 36/50 Điểm
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-foreground mt-1">
              Form Đề Thi Reading Aptis ESOL & Chiến Thuật Làm Bài Chuẩn Điểm
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              5 câu hỏi lớn (29 câu hỏi nhỏ, 50 điểm, 35 phút) — Thang điểm đạt B2 và mẹo làm bài bám sát key đề thi thật
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Cẩm nang 4 Part chi tiết</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <span>{isOpen ? "Thu gọn chiến thuật" : "Xem Form đề & Chiến thuật"}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-6 pt-6 border-t border-border/60 space-y-6 animate-in fade-in-50 duration-200">
          {/* 4 Parts Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Part 1 */}
            <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  Part 1
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">3 phút · 10 điểm</span>
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Gap Fill (Điền từ vào chỗ trống)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                5 câu hỏi nhỏ dưới dạng đoạn email ngắn. Mỗi câu có 3 đáp án để chọn từ phù hợp nhất.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-emerald-600 font-semibold">
                🎯 Thang điểm: 2 điểm/câu (10 điểm). Yêu cầu đúng ít nhất 4-5 câu.
              </div>
            </div>

            {/* Part 2 */}
            <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                  Part 2
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">10 phút · 10 điểm</span>
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Text Cohesion (Sắp xếp trật tự câu)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                2 câu chuyện riêng biệt (mỗi chuyện 5 câu). Câu đầu tiên đã cố định, sắp xếp 4 câu còn lại.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-blue-600 font-semibold">
                🎯 Thang điểm: 1 điểm/câu (10 điểm). Chú ý các từ liên kết: <em>this, that, these, after, then</em>.
              </div>
            </div>

            {/* Part 3 */}
            <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                  Part 3
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">12 phút · 16 điểm</span>
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Opinion Matching (4 người)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Nối nhận định với quan điểm của 4 nhân vật (A, B, C, D). Tổng cộng 7 câu hỏi nhận định.
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-purple-600 font-semibold">
                🎯 Thang điểm: Mỗi người 4 điểm (16 điểm). Cần tìm từ đồng nghĩa (paraphrase).
              </div>
            </div>

            {/* Part 4 */}
            <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                  Part 4
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground">10 phút · 14 điểm</span>
              </div>
              <h4 className="font-heading font-bold text-sm text-foreground">Headings Matching (Bài đọc dài)</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Bài văn dài gồm 7 đoạn văn, chọn tiêu đề phù hợp từ 8 tiêu đề cho trước (có 1 tiêu đề thừa).
              </p>
              <div className="pt-2 border-t border-border/40 text-[11px] text-rose-600 font-semibold">
                🎯 Thang điểm: 2 điểm/câu (14 điểm). Đọc câu đầu và câu cuối mỗi đoạn trước.
              </div>
            </div>
          </div>

          {/* Strategy & Key Tips Note */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                Chiến Thuật Đạt Điểm Chuẩn B2 (Target 36/50 Điểm)
              </h4>
            </div>
            <p className="text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
              👉 Để đạt <strong>B2 (36/50 điểm)</strong>, thí sinh được phép sai tối đa 14 điểm (~6-7 câu). Các đáp án Key trong hệ thống bám sát đề thi thật 100%, nội dung giữ trọn vẹn đại ý. Khi làm bài, học viên cần đọc dịch kỹ lưỡng và chú ý các từ chỉ định/từ liên kết: <code>this, that, these, those, then, after, in addition</code>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
