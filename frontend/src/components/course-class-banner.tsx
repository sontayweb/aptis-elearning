"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  X,
  PhoneCall,
  MessageCircle,
  Send,
  Loader2,
  BookOpen,
  Headphones,
  MessageSquare,
  PenLine,
  Mail,
  Target,
  FileText,
  TrendingUp,
  Copy,
  Check,
  CreditCard,
  QrCode,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { SITE_CONFIG } from "@/config/site-config";

interface BatchItem {
  id: string;
  dateStr: string;
  isHot?: boolean;
  seatsLeft?: number;
}

const defaultBatches: BatchItem[] = [
  {
    id: "1",
    dateStr: SITE_CONFIG.courseClass.fixedOpeningDate || "14/10",
    isHot: true,
    seatsLeft: 3,
  },
  { id: "2", dateStr: "04/11", seatsLeft: 8 },
  { id: "3", dateStr: "18/11", seatsLeft: 12 },
  { id: "4", dateStr: "02/12", seatsLeft: 15 },
  { id: "5", dateStr: "16/12", seatsLeft: 15 },
];

export interface SyllabusSession {
  session: number;
  title: string;
  subtitle: string;
  colorScheme: "rose" | "blue";
  iconType: "file" | "book" | "headphones" | "message" | "pen" | "mail" | "target";
  bullets: string[];
}

// 100% chính xác theo infographic Lộ trình khóa học Aptis ESOL B2 của người dùng
export const COURSE_SYLLABUS: SyllabusSession[] = [
  {
    session: 1,
    title: "Giới thiệu bài thi Aptis ESOL + Hướng dẫn đăng ký thi",
    subtitle: "Tổng quan cấu trúc & thủ tục thi",
    colorScheme: "rose",
    iconType: "file",
    bullets: [
      "Tổng quan cấu trúc bài thi",
      "Giới thiệu thang điểm & cách tính điểm",
      "Hướng dẫn đăng ký thi chi tiết",
    ],
  },
  {
    session: 2,
    title: "Reading",
    subtitle: "Chiến lược làm bài & luyện đề",
    colorScheme: "blue",
    iconType: "book",
    bullets: [
      "Dạng bài thường gặp",
      "Kỹ năng skimming, scanning",
      "Luyện đề Reading theo format thật",
    ],
  },
  {
    session: 3,
    title: "Listening",
    subtitle: "Phương pháp nghe & luyện đề",
    colorScheme: "rose",
    iconType: "headphones",
    bullets: [
      "Kỹ năng nghe nắm ý, nghe chi tiết",
      "Nhận biết bẫy trong bài nghe",
      "Luyện đề Listening theo format thật",
    ],
  },
  {
    session: 4,
    title: "Speaking (Part 1)",
    subtitle: "Trả lời thông tin cá nhân",
    colorScheme: "blue",
    iconType: "message",
    bullets: [
      "Cách trả lời tự nhiên, mạch lạc",
      "Luyện phát âm, ngữ điệu",
      "Thực hành & sửa lỗi chi tiết",
    ],
  },
  {
    session: 5,
    title: "Speaking (Part 2)",
    subtitle: "Mô tả, so sánh, đưa quan điểm",
    colorScheme: "rose",
    iconType: "message",
    bullets: [
      "Cấu trúc câu & từ vựng phù hợp",
      "Cách triển khai ý rõ ràng",
      "Luyện nói theo chủ đề thường gặp",
    ],
  },
  {
    session: 6,
    title: "Speaking (Part 3)",
    subtitle: "Thảo luận, đưa ý & giải thích",
    colorScheme: "blue",
    iconType: "message",
    bullets: [
      "Mở rộng ý bằng lý do và ví dụ",
      "Cách phản biện & phát triển ý",
      "Luyện tập & sửa lỗi chi tiết",
    ],
  },
  {
    session: 7,
    title: "Writing (Part 3)",
    subtitle: "Viết phản hồi trong CLB",
    colorScheme: "rose",
    iconType: "pen",
    bullets: [
      "Cấu trúc bài viết 3 ý kiến (30–40 từ)",
      "Cách triển khai ý",
      "Luyện viết & chữa bài chi tiết",
    ],
  },
  {
    session: 8,
    title: "Writing (Part 4)",
    subtitle: "Viết email (50–225 từ)",
    colorScheme: "blue",
    iconType: "mail",
    bullets: [
      "Cấu trúc email chuẩn",
      "Cách triển khai ý mạch lạc, đúng ngữ pháp",
      "Luyện viết & chữa bài chi tiết",
    ],
  },
  {
    session: 9,
    title: "Ôn Speaking (Tổng hợp 1)",
    subtitle: "Luyện đề & thực hành chuyên sâu",
    colorScheme: "rose",
    iconType: "message",
    bullets: [
      "Luyện full Part 1, 2, 3",
      "Thực hành theo đề mẫu",
      "Giáo viên nhận xét, sửa lỗi chi tiết",
    ],
  },
  {
    session: 10,
    title: "Ôn Speaking (Tổng hợp 2)",
    subtitle: "Luyện đề nâng cao",
    colorScheme: "blue",
    iconType: "message",
    bullets: [
      "Rèn phản xạ, sự trôi chảy",
      "Mô phỏng phòng thi",
      "Nhận feedback cá nhân",
    ],
  },
  {
    session: 11,
    title: "Ôn tập & Review",
    subtitle: "Hệ thống lại kiến thức – Sẵn sàng thi thật",
    colorScheme: "rose",
    iconType: "target",
    bullets: [
      "Tổng hợp trọng tâm 4 kỹ năng",
      "Làm mini test tổng hợp",
      "Giải đáp thắc mắc & chiến lược làm bài",
    ],
  },
];

export function CourseClassBanner() {
  const { zaloContactUrl, supportHotline } = useSiteSettings();
  const [batches, setBatches] = useState<BatchItem[]>(defaultBatches);
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(defaultBatches[0]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"syllabus" | "register">("syllabus");

  // Form lead registration state
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await api.courses.getFeaturedFasttrack();
        if (res.success && res.data?.batches && res.data.batches.length > 0) {
          setBatches(res.data.batches);
          setSelectedBatch(res.data.batches[0]);
        }
      } catch (err) {
        console.warn("Dùng fallback đợt khai giảng mặc định:", err);
      }
    }
    loadBatches();
  }, []);

  const handleSelectBatch = (batch: BatchItem, tab: "syllabus" | "register" = "syllabus") => {
    setSelectedBatch(batch);
    setActiveTab(tab);
    setSubmitSuccess(false);
    setSubmitError(null);
    setModalOpen(true);
  };

  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await api.courses.registerLead({
        batchId: selectedBatch?.id,
        batchDateStr: selectedBatch?.dateStr,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
        note: note.trim() || undefined,
        targetBand: "B2",
      });
      if (res && res.success === false) {
        throw new Error(res.message || "Gửi thông tin đăng ký thất bại.");
      }
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Lỗi khi đăng ký giữ chỗ:", err);
      setSubmitError(
        err?.message || "Không thể kết nối máy chủ để lưu thông tin. Vui lòng bấm Nhắn Zalo hoặc gọi Hotline để giữ chỗ ngay!"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSessionIcon = (iconType: SyllabusSession["iconType"], colorScheme: "rose" | "blue") => {
    const iconClass = colorScheme === "rose" ? "text-rose-600 dark:text-rose-400" : "text-blue-600 dark:text-blue-400";
    switch (iconType) {
      case "file":
        return <FileText className={`w-5 h-5 ${iconClass}`} />;
      case "book":
        return <BookOpen className={`w-5 h-5 ${iconClass}`} />;
      case "headphones":
        return <Headphones className={`w-5 h-5 ${iconClass}`} />;
      case "message":
        return <MessageSquare className={`w-5 h-5 ${iconClass}`} />;
      case "pen":
        return <PenLine className={`w-5 h-5 ${iconClass}`} />;
      case "mail":
        return <Mail className={`w-5 h-5 ${iconClass}`} />;
      case "target":
        return <Target className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <FileText className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-500/8 via-primary/5 to-card/90 backdrop-blur-sm p-4 sm:p-5 md:p-6 shadow-sm hover:border-rose-500/40 hover:shadow-glow-soft transition-all duration-300">
        {/* Soft background glow decoration */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full bg-rose-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 sm:gap-6">
          {/* Cụm 1: Tiêu đề & Thông tin lớp */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-xs animate-pulse">
                <Sparkles className="w-3 h-3" />
                Khai giảng
              </span>
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                Khóa đào tạo tăng tốc
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-black tracking-tight text-foreground leading-tight">
              Lớp online{" "}
              <span className="text-rose-600 dark:text-rose-400">
                APTIS ESOL B2
              </span>
            </h2>
            <p className="text-xs sm:text-sm font-bold text-rose-600/90 dark:text-rose-400/90 uppercase tracking-wide mt-0.5">
              ÔN CẤP TỐC ĐẠT MỤC TIÊU B2
            </p>

            {/* Lịch học cố định */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs font-bold text-rose-600/90 dark:text-rose-400/90">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Thứ 3 – Thứ 5 – Thứ 7
              </span>
              <span className="text-muted-foreground/50">|</span>
              <span>20:00 – 21:30</span>
              <span className="text-muted-foreground/50">|</span>
              <span>Online Zoom</span>
            </div>

            {/* Checklist 5 cam kết (tích xanh) */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-foreground/90 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Học trực tuyến tương tác qua Zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Có bài giảng xem lại sau mỗi buổi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Web luyện + Bộ đề khoanh vùng</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tài liệu &amp; đáp án chi tiết</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Giáo viên chữa bài &amp; đồng hành tận tình</span>
              </div>
            </div>
          </div>

          {/* Cụm 2: Khối Ưu đãi + Các đợt khai giảng sắp tới */}
          <div className="w-full xl:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 shrink-0 pt-3 xl:pt-0 border-t xl:border-t-0 border-border/60">
            {/* Box Học phí ưu đãi */}
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500 to-rose-600 text-white p-3.5 sm:px-4 sm:py-3.5 text-center shadow-md flex flex-col items-center justify-center min-w-[140px]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/90">
                Học phí ưu đãi
              </span>
              <span className="text-base sm:text-lg font-heading font-black tracking-tight leading-tight mt-0.5 whitespace-nowrap">
                {SITE_CONFIG.courseClass.tuitionFormatted}
              </span>
              <span className="text-[10px] font-bold text-white/95 mt-1 bg-white/20 px-2 py-0.5 rounded-full">
                {SITE_CONFIG.courseClass.durationText}
              </span>
            </div>

            {/* Cụm lịch đợt khai giảng */}
            <div className="flex-1 sm:flex-none rounded-2xl border border-border/80 bg-card/70 backdrop-blur-sm p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  <span>Các đợt khai giảng sắp tới</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Click để xem lộ trình / giữ chỗ
                </span>
              </div>

              {/* Dynamic date pills */}
              <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                {batches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBatch(b, "syllabus")}
                    className="flex-1 sm:flex-initial text-center px-2.5 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-foreground font-bold text-xs transition-all duration-200 active:scale-95 cursor-pointer relative group"
                    title={`Xem lộ trình & đăng ký đợt ${b.dateStr}`}
                  >
                    <span>{b.dateStr}</span>
                    {b.isHot && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-background animate-ping" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectBatch(batches[0], "syllabus")}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lộ trình 11 buổi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectBatch(batches[0], "register")}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Giữ chỗ ngay</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Lộ trình 11 buổi học & Đăng ký giữ chỗ B2 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                      LỘ TRÌNH KHÓA HỌC
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      Đợt chọn:{" "}
                      <strong className="text-rose-600 dark:text-rose-400 font-bold">
                        {selectedBatch?.dateStr || "Sắp tới"}
                      </strong>
                    </span>
                  </div>
                  <h3 className="font-heading font-black text-foreground text-base sm:text-lg truncate">
                    APTIS ESOL ÔN CẤP TỐC ĐẠT MỤC TIÊU B2
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector nhanh đợt khai giảng trong Modal */}
            <div className="px-5 py-2.5 bg-card border-b border-border/60 flex items-center justify-between gap-3 overflow-x-auto text-xs shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-foreground shrink-0">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Chọn ngày khai giảng:</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {batches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBatch(b)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-colors cursor-pointer ${
                      selectedBatch?.id === b.id
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-muted hover:bg-muted/80 text-foreground"
                    }`}
                  >
                    {b.dateStr}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Navigation (Lộ trình vs Đăng ký giữ chỗ) */}
            <div className="flex border-b border-border bg-card shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab("syllabus")}
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "syllabus"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Lộ trình chi tiết 11 buổi</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("register")}
                className={`flex-1 py-3 px-4 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "register"
                    ? "border-rose-600 text-rose-600 dark:text-rose-400 bg-rose-500/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Send className="w-4 h-4" />
                <span>Đăng ký — Học phí 1.400.000đ</span>
              </button>
            </div>

            {/* Modal Body with Custom Scrollbar */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {activeTab === "syllabus" ? (
                <div className="space-y-4">
                  {/* 3 định hướng cốt lõi (Theo poster) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <Target className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>11 buổi học trọng tâm</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Bám sát format đề thi</span>
                    </div>
                    <div className="flex items-center gap-2 font-bold text-foreground">
                      <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>Học đúng – Trúng trọng tâm</span>
                    </div>
                  </div>

                  {/* Grid 11 buổi học chính xác 100% theo Infographic */}
                  <div className="space-y-3">
                    {COURSE_SYLLABUS.map((item) => {
                      const isRose = item.colorScheme === "rose";
                      return (
                        <div
                          key={item.session}
                          className={`rounded-xl border p-3.5 sm:p-4 transition-all duration-200 ${
                            isRose
                              ? "bg-rose-500/3 border-rose-500/20 hover:border-rose-500/40"
                              : "bg-blue-500/3 border-blue-500/20 hover:border-blue-500/40"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              {/* Session Pill */}
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-black text-white shrink-0 tracking-wide ${
                                  isRose ? "bg-rose-600" : "bg-blue-600"
                                }`}
                              >
                                Buổi {item.session}
                              </span>

                              {/* Session Icon Circle */}
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isRose
                                    ? "bg-rose-500/15"
                                    : "bg-blue-500/15"
                                }`}
                              >
                                {renderSessionIcon(item.iconType, item.colorScheme)}
                              </div>

                              <div>
                                <h4 className="font-heading font-extrabold text-foreground text-sm sm:text-base leading-tight">
                                  {item.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.subtitle}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Bullet points chi tiết */}
                          <div className="pl-0 sm:pl-10 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            {item.bullets.map((bullet, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 text-foreground/90 font-medium"
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                    isRose ? "bg-rose-500" : "bg-blue-500"
                                  }`}
                                />
                                <span className="leading-snug">{bullet}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Thanh Footer Đăng Ký Lộ Trình */}
                  <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-rose-500/10 via-card to-blue-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                        <PhoneCall className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-muted-foreground uppercase">
                          Đăng ký tư vấn trực tiếp
                        </span>
                        <div className="font-heading font-black text-rose-600 dark:text-rose-400 text-base sm:text-lg">
                          0387.905.990 / {supportHotline}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <a
                        href={zaloContactUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-blue-500" />
                        <span>Chat Zalo</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="flex-1 sm:flex-none h-10 px-5 rounded-xl btn-brand-gradient text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                      >
                        <span>Giữ chỗ đợt {selectedBatch?.dateStr}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab Đăng ký — 2 Option rõ ràng */
                <div className="max-w-lg mx-auto py-2 space-y-4">
                  {submitSuccess ? (
                    <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-600 mx-auto flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="font-heading font-black text-foreground text-lg">
                        Đã ghi nhận thông tin!
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Cố vấn học tập sẽ liên hệ xác nhận lớp{" "}
                        <strong className="text-foreground">
                          Aptis B2 (Đợt {selectedBatch?.dateStr})
                        </strong>{" "}
                        trong vòng 15 phút.
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
                          onClick={() => {
                            setModalOpen(false);
                            setSubmitSuccess(false);
                          }}
                          className="w-full sm:w-auto h-10 px-4 rounded-xl border border-border text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                        >
                          Đóng cửa sổ
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Thông tin đợt đăng ký */}
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                            Khai giảng đợt
                          </span>
                          <h4 className="font-heading font-black text-foreground text-base">
                            {selectedBatch?.dateStr || "Sắp tới"} · Thứ 3–5–7 · 20:00–21:30
                          </h4>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="block text-[10px] font-bold text-muted-foreground uppercase">Học phí</span>
                          <span className="font-heading font-black text-rose-600 dark:text-rose-400 text-base sm:text-lg">
                            {SITE_CONFIG.courseClass.tuitionFormatted}
                          </span>
                        </div>
                      </div>

                      {/* Option A: Chuyển khoản hoặc Tư vấn */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">A</div>
                          <span className="font-bold text-sm text-foreground">
                            {SITE_CONFIG.courseClass.tuitionVnd === 0 || SITE_CONFIG.bankAccount.accountNumber.includes("Liên hệ")
                              ? "Tư vấn lộ trình & Giữ chỗ ưu đãi"
                              : "Chuyển khoản học phí giữ chỗ"}
                          </span>
                          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">Nhanh nhất</span>
                        </div>

                        <div className="pl-0 sm:pl-8 space-y-3">
                          {SITE_CONFIG.courseClass.tuitionVnd === 0 || SITE_CONFIG.bankAccount.accountNumber.includes("Liên hệ") ? (
                            /* Box Tư vấn học phí & Lộ trình */
                            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3">
                              <div>
                                <p className="font-bold text-xs text-foreground">Học phí &amp; Tài khoản thanh toán</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Giảng viên sẽ đánh giá trình độ miễn phí và gửi mức học phí ưu đãi kèm thông tin chuyển khoản trực tiếp qua Zalo cho bạn.
                                </p>
                              </div>

                              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <a
                                  href={zaloContactUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex-1 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>Nhắn Zalo nhận lộ trình &amp; học phí</span>
                                </a>
                                <a
                                  href={`tel:${supportHotline?.replace(/[^0-9]/g, "") || SITE_CONFIG.contact.defaultZaloPhone}`}
                                  className="h-10 px-4 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
                                >
                                  <PhoneCall className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Hotline: {supportHotline || SITE_CONFIG.contact.defaultHotline}</span>
                                </a>
                              </div>
                            </div>
                          ) : (
                            /* Box VietQR + Thông tin tài khoản */
                            <>
                              <div className="flex flex-col sm:flex-row items-center gap-3.5 p-3 rounded-xl bg-muted/40 border border-border/80">
                                <div className="w-28 h-28 bg-white p-1.5 rounded-xl border border-border/80 shrink-0 shadow-xs flex items-center justify-center">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={
                                      SITE_CONFIG.bankAccount.qrImageUrl ||
                                      `https://img.vietqr.io/image/MB-${SITE_CONFIG.bankAccount.accountNumber}-compact2.png?amount=${SITE_CONFIG.courseClass.tuitionVnd}&addInfo=Aptis%20B2`
                                    }
                                    alt="Mã VietQR chuyển khoản học phí"
                                    className="w-full h-full object-contain"
                                  />
                                </div>

                                <div className="space-y-1.5 text-xs flex-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-[11px]">Ngân hàng:</span>
                                    <span className="font-bold text-foreground text-[11px]">{SITE_CONFIG.bankAccount.bankName}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-[11px]">Số tài khoản:</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(SITE_CONFIG.bankAccount.accountNumber);
                                        setCopiedAccount(true);
                                        setTimeout(() => setCopiedAccount(false), 2000);
                                      }}
                                      className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline cursor-pointer"
                                      title="Bấm để copy STK"
                                    >
                                      <span>{SITE_CONFIG.bankAccount.accountNumber}</span>
                                      {copiedAccount ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 opacity-70" />
                                      )}
                                    </button>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground text-[11px]">Chủ tài khoản:</span>
                                    <span className="font-bold text-foreground text-[11px]">{SITE_CONFIG.bankAccount.accountHolder}</span>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-border/60 pt-1">
                                    <span className="text-muted-foreground text-[11px]">Nội dung CK:</span>
                                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                                      Tên + SĐT + B2
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <p className="text-[11px] text-muted-foreground">
                                Sau khi chuyển khoản, bạn chỉ cần nhắn Zalo gửi biên lai để trợ giảng kích hoạt phòng học ngay lập tức.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-border" />
                        <span className="font-bold">HOẶC</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Option B: Zalo/Gọi tư vấn */}
                      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">B</div>
                          <span className="font-bold text-sm text-foreground">Liên hệ tư vấn trực tiếp</span>
                        </div>
                        <div className="pl-8 flex flex-col sm:flex-row gap-2">
                          <a
                            href={zaloContactUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Nhắn Zalo ngay</span>
                          </a>
                          <a
                            href={`tel:${supportHotline?.replace(/[^0-9]/g, "")}`}
                            className="flex-1 h-10 rounded-xl border border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <PhoneCall className="w-4 h-4" />
                            <span>Gọi: {supportHotline || "0387.905.990"}</span>
                          </a>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex-1 h-px bg-border" />
                        <span className="font-bold">HOẶC để lại thông tin</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Form gửi thông tin */}
                      <form onSubmit={handleSubmitLead} className="space-y-3">
                        {submitError && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                            <div className="flex-1">
                              <p className="font-semibold">{submitError}</p>
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Họ và tên <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ví dụ: Nguyễn Văn An"
                            className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground mb-1.5">
                            Số điện thoại / Zalo <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Ví dụ: 0987654321"
                            className="w-full h-10 px-3.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-10 rounded-xl btn-brand-gradient text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang gửi...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>Để lại thông tin — Được gọi lại trong 15 phút</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
