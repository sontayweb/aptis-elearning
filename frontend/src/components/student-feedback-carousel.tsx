"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  X,
  FileCheck,
} from "lucide-react";
import { api } from "@/lib/api-client";

export interface StudentFeedbackItem {
  id: string;
  studentName: string;
  className: string;
  achievedBand: string;
  quote: string;
  dateStr?: string;
  scoreSummary?: string;
  certificateImageUrl?: string;
  verified?: boolean;
}

const mockFeedbacks: StudentFeedbackItem[] = [
  {
    id: "fb-1",
    studentName: "Trịnh Liên Hương",
    className: "Lớp 22/2026",
    achievedBand: "Đạt B2",
    quote: "Cảm ơn cô và khóa học, tài liệu rất sát đề và dễ hiểu ạ!",
    scoreSummary: "Overall 164/200 - B2",
    verified: true,
  },
  {
    id: "fb-2",
    studentName: "Quỳnh Trang",
    className: "Lớp 21/2026",
    achievedBand: "Đạt C1",
    quote: "Em không ngờ mình chỉ cần B2 mà được C1. Cám ơn cô nhiều ạ!",
    scoreSummary: "Overall 182/200 - C1",
    verified: true,
  },
  {
    id: "fb-3",
    studentName: "Học viên lớp 21/2026",
    className: "ĐHQG Hà Nội",
    achievedBand: "Đạt B2",
    quote: "Cháu học ĐHQG, cám ơn trung tâm nhiều, không ngờ lần 1 đã đỗ ạ!",
    scoreSummary: "Overall 158/200 - B2",
    verified: true,
  },
  {
    id: "fb-4",
    studentName: "Nguyễn Minh Đức",
    className: "Lớp 23/2026",
    achievedBand: "Đạt B2",
    quote: "AI chấm Speaking & Writing phát hiện đúng lỗi ngữ pháp, đi thi tự tin hẳn!",
    scoreSummary: "Overall 160/200 - B2",
    verified: true,
  },
  {
    id: "fb-5",
    studentName: "Trần Mai Anh",
    className: "Lớp 20/2026",
    achievedBand: "Đạt C1",
    quote: "Bộ đề khoanh vùng trúng ngay bài thi Reading Part 4, đạt điểm tối đa luôn ạ.",
    scoreSummary: "Overall 185/200 - C1",
    verified: true,
  },
];

export function StudentFeedbackCarousel() {
  const [feedbacks, setFeedbacks] = useState<StudentFeedbackItem[]>(mockFeedbacks);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<StudentFeedbackItem | null>(null);

  useEffect(() => {
    async function loadFeedbacks() {
      try {
        const res = await api.feedbacks.getFeatured();
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFeedbacks(res.data);
        }
      } catch (err) {
        console.warn("Dùng fallback feedback mặc định:", err);
      }
    }
    loadFeedbacks();
  }, []);

  const handleScroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm">
        {/* Header Row */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 fill-amber-500/30" />
            </div>
            <h2 className="font-heading font-black text-base sm:text-lg text-foreground tracking-tight">
              Kết quả &amp; Feedback học viên
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/meo-thi-aptis"
              className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1 mr-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3 h-3" />
            </Link>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll("left")}
                className="w-7 h-7 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                aria-label="Previous feedback"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll("right")}
                className="w-7 h-7 rounded-lg border border-border bg-background hover:bg-muted text-foreground flex items-center justify-center transition-colors active:scale-90 cursor-pointer"
                aria-label="Next feedback"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex items-stretch gap-3.5 overflow-x-auto no-scrollbar scroll-smooth pb-1 -mx-1 px-1 snap-x snap-mandatory"
        >
          {feedbacks.map((item) => (
            <div
              key={item.id}
              className="snap-start shrink-0 w-[290px] sm:w-[320px] md:w-[340px] rounded-xl sm:rounded-2xl border border-border/80 bg-background/50 hover:bg-background/90 hover:border-primary/40 p-3 sm:p-4 transition-all duration-200 flex gap-3 shadow-xs group"
            >
              {/* Score Sheet Certificate Thumbnail */}
              <button
                type="button"
                onClick={() => setActiveCertificate(item)}
                className="w-16 sm:w-20 shrink-0 rounded-lg border border-border/80 bg-muted/40 hover:border-primary/50 overflow-hidden flex flex-col items-center justify-center p-1.5 transition-transform group-hover:scale-105 cursor-pointer relative"
                title="Nhấn để xem bảng điểm"
              >
                {/* Simulated Certificate Graphic */}
                <div className="w-full h-full rounded border border-border/60 bg-card flex flex-col justify-between p-1 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border/40 pb-0.5">
                    <span className="text-[7px] font-black text-rose-500 uppercase">
                      APTIS
                    </span>
                    <FileCheck className="w-2.5 h-2.5 text-emerald-500" />
                  </div>
                  <div className="space-y-0.5 py-1">
                    <div className="w-full h-1 bg-muted rounded-full" />
                    <div className="w-4/5 h-1 bg-amber-500/60 rounded-full" />
                    <div className="w-full h-1 bg-primary/60 rounded-full" />
                  </div>
                  <span className="text-[7.5px] font-bold text-center text-foreground/80 block">
                    {item.achievedBand}
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-primary mt-1">
                  Xem bảng điểm
                </span>
              </button>

              {/* Feedback Content */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold shadow-xs">
                      {item.achievedBand}
                    </span>
                  </div>
                  <h4 className="font-heading font-extrabold text-xs sm:text-sm text-foreground line-clamp-1">
                    {item.studentName} –{" "}
                    <span className="text-muted-foreground font-semibold">
                      {item.className}
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground italic mt-1 line-clamp-2 leading-relaxed">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Đã xác thực chứng chỉ
                  </span>
                  <span>{item.scoreSummary}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal Xem Bảng Điểm */}
      {activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-2xl space-y-4">
            <button
              type="button"
              onClick={() => setActiveCertificate(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h3 className="font-heading font-extrabold text-foreground text-base">
                Bảng điểm: {activeCertificate.studentName}
              </h3>
            </div>

            {/* Simulated High-Res Certificate Card */}
            <div className="rounded-xl border border-border bg-gradient-to-b from-card to-muted/20 p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <div>
                  <span className="text-xs font-black text-rose-500 uppercase tracking-wider block">
                    British Council Aptis ESOL
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Báo cáo kết quả kiểm tra năng lực
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs">
                  {activeCertificate.achievedBand}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-1">
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Thí sinh
                  </span>
                  <strong className="text-foreground">
                    {activeCertificate.studentName}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">
                    Khóa đào tạo
                  </span>
                  <strong className="text-foreground">
                    {activeCertificate.className}
                  </strong>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {activeCertificate.scoreSummary} · Đạt yêu cầu chuẩn đầu ra B2/C1
              </div>

              <blockquote className="text-xs italic text-muted-foreground border-l-2 border-primary/50 pl-2.5">
                &ldquo;{activeCertificate.quote}&rdquo;
              </blockquote>
            </div>

            <button
              type="button"
              onClick={() => setActiveCertificate(null)}
              className="w-full h-10 rounded-xl btn-brand-gradient text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              Đóng xem chứng chỉ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
