"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Award,
  ArrowRight,
  TrendingUp,
  Headphones,
  Mic,
  FileEdit,
  BookOpen,
  BookA,
  Flame,
  Star,
  Users,
  Layers,
  ChevronDown,
  ChevronRight,
  Lock,
  Compass,
  Check,
  Crown,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { AuthModal } from "@/components/auth-modal";

export function LandingPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState<number>(0);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const stats = [
    { value: "870+", label: "Đề thi Aptis sát thật", desc: "Cập nhật liên tục từ đề thi British Council" },
    { value: "8.500+", label: "Học viên đang luyện", desc: "Cộng đồng thí sinh mục tiêu B1, B2, C1" },
    { value: "340.000+", label: "Lượt làm bài thi thử", desc: "Hàng trăm bài nộp chấm AI mỗi ngày" },
    { value: "Đề Key 24/7", label: "Dự đoán sát đợt thi", desc: "Phân loại ưu tiên Cao - Vừa - Thấp" },
  ];

  const coreBenefits = [
    {
      icon: ShieldCheck,
      title: "Sát đề thật 100%",
      desc: "Mô phỏng chính xác giao diện thi trên máy tính của British Council.",
    },
    {
      icon: Mic,
      title: "AI chấm Speaking",
      desc: "Chấm chuẩn xác phát âm, ngữ điệu, trả band điểm & gợi ý sửa chi tiết.",
    },
    {
      icon: FileEdit,
      title: "AI chấm Writing",
      desc: "Nhận xét 4 tiêu chí CEFR, chỉ rõ lỗi ngữ pháp & bài mẫu nâng band.",
    },
    {
      icon: Layers,
      title: "870+ đề luyện tập",
      desc: "Kho đề phong phú nhất, đầy đủ cả 5 kỹ năng từ Part 1 đến Part 4.",
    },
    {
      icon: TrendingUp,
      title: "Theo dõi tiến độ",
      desc: "Biểu đồ năng lực theo từng tuần và chuỗi streak giữ vững kỷ luật.",
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Làm 1 bài thi thử full test",
      desc: "Vào Thi thử làm trọn một đề như thi thật để biết chính xác bạn đang ở trình độ nào (A2, B1 hay B2).",
      actionText: "Vào thi thử ngay",
      href: "/thi-thu",
    },
    {
      step: "02",
      title: "Xem band điểm AI chấm",
      desc: "AI chấm cả Speaking và Writing ngay sau khi nộp bài. Phân tích chi tiết 4 tiêu chí chuẩn CEFR.",
      actionText: "Xem demo chấm AI",
      href: "#tinh-nang",
    },
    {
      step: "03",
      title: "Luyện kỹ năng còn yếu",
      desc: "Dựa vào bảng điểm, kỹ năng nào chưa đạt target thì vào luyện riêng từng part của kỹ năng đó.",
      actionText: "Chọn kỹ năng luyện",
      href: "/listening",
    },
    {
      step: "04",
      title: "Học theo đề Key dự đoán",
      desc: "Làm các bộ đề Key có xác suất trúng cao trước, rèn luyện phản xạ giúp làm bài tự tin tuyệt đối.",
      actionText: "Xem Đề Key hôm nay",
      href: "/key-du-doan",
    },
  ];

  const whyChooseUs = [
    {
      icon: ShieldCheck,
      title: "Mô phỏng giống đề thật 100%",
      desc: "Giao diện kéo thả, dropdown inline, bộ đếm giờ y hệt bài thi Aptis ESOL chính thức.",
    },
    {
      icon: Layers,
      title: "Đầy đủ đề thật, cập nhật liên tục",
      desc: "Hơn 870+ đề bám sát kỳ thi thật, liên tục bổ sung sau mỗi đợt thi hàng tuần.",
    },
    {
      icon: Sparkles,
      title: "AI chấm & chữa Speaking - Writing",
      desc: "Sát thực tế, trả kết quả & nhận xét từng lỗi từ vựng, ngữ pháp chỉ sau vài giây.",
    },
    {
      icon: Award,
      title: "Nắm rõ band điểm mục tiêu",
      desc: "Biết chính xác điểm quy đổi CEFR từng kỹ năng để tập trung ôn đúng chỗ còn thiếu.",
    },
    {
      icon: BookOpen,
      title: "Giải thích chi tiết từng câu",
      desc: "Mỗi câu hỏi đều có đáp án, dịch nghĩa và lý do chuẩn xác, hiểu sâu bản chất không học vẹt.",
    },
    {
      icon: Flame,
      title: "Theo dõi tiến bộ + Giữ streak",
      desc: "Biểu đồ năng lực trực quan cùng tính năng streak tạo động lực học đều đặn mỗi ngày.",
    },
  ];

  const tools = [
    {
      title: "Đề Key Dự Đoán",
      tag: "PRO",
      desc: "Bộ đề dự đoán theo topic sát lịch thi, phân mức ưu tiên Cao - Vừa - Thấp.",
      href: "/key-du-doan",
      color: "from-blue-600 to-indigo-600",
    },
    {
      title: "Dictation & Shadowing",
      tag: "HOT",
      desc: "Luyện nghe chép chính tả và nhại giọng để bứt phá phản xạ Listening & Speaking.",
      href: "/nghe-chep",
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Học từ vựng & Flashcard",
      tag: "FREE",
      desc: "Kho từ vựng Aptis theo chủ đề kèm phát âm bản xứ và thẻ ghi nhớ thông minh.",
      href: "/vocabulary",
      color: "from-amber-500 to-orange-500",
    },
    {
      title: "Marathon từng Part",
      tag: "PRO",
      desc: "Cày liên tục 1 part duy nhất (Ví dụ: Reading Part 2, Speaking Part 3) cho quen tay.",
      href: "/listening",
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Kho tài liệu & Video",
      tag: "FREE",
      desc: "Ebook giải đề, template viết bài luận, mẹo làm bài thi đạt B2 nhanh nhất.",
      href: "/tai-lieu",
      color: "from-cyan-500 to-blue-500",
    },
    {
      title: "Xem lại từng câu đã làm",
      tag: "SMART",
      desc: "Lịch sử học tập lưu trọn bài làm, soi lại lỗi sai và so sánh với đáp án chuẩn.",
      href: "/history",
      color: "from-purple-500 to-indigo-500",
    },
  ];

  const feedbacks = [
    {
      name: "Nguyễn Hà Giang",
      school: "ĐH Kinh tế Quốc dân",
      score: "B2 Overall (Reading 44, Writing 41)",
      text: "Em chỉ cần B1 để ra trường nhưng sau 3 tuần luyện đề Key trên web và được AI sửa Writing kỹ từng câu, thi thật em đạt luôn B2! Quá bất ngờ luôn ạ.",
      badge: "Đạt B2",
    },
    {
      name: "Phúc Bảo Châu",
      school: "ĐH Ngoại Thương",
      score: "C1 Overall (Listening 46/50, Reading 48/50)",
      text: "Web mô phỏng y chang phòng thi thật của Hội đồng Anh. Nhất là phần Reading kéo thả câu, luyện quen tay nên vào phòng thi em làm thừa hẳn 15 phút.",
      badge: "Đạt C1",
    },
    {
      name: "Lê Bảo Thy",
      school: "ĐH Bách Khoa",
      score: "B2 Overall (Speaking 42/50)",
      text: "Phần Speaking em sợ nhất vì hay bị vấp, nhưng nhờ AI chấm nhận diện lỗi phát âm và cho câu mẫu cải thiện nên tự tin hơn hẳn. Cảm ơn ad rất nhiều!",
      badge: "Đạt B2",
    },
  ];

  const faqs = [
    {
      q: "Aptis ESOL là gì và có giá trị sử dụng như thế nào?",
      a: "Aptis ESOL là bài thi đánh giá năng lực tiếng Anh chuẩn CEFR do British Council (Hội đồng Anh) tổ chức. Chứng chỉ được Bộ Giáo dục & Đào tạo Việt Nam công nhận tương đương các chuẩn B1, B2, C phục vụ xét tốt nghiệp đại học, thạc sĩ và thi công chức.",
    },
    {
      q: "Nền tảng APTIS ESOL PREMIER có sát với đề thi thật không?",
      a: "Hoàn toàn sát 100%. Nền tảng mô phỏng đúng phần mềm thi máy tính chính thức: từ cơ chế kéo thả câu (Reading Part 2), chọn dropdown (Reading Part 1), bộ đếm thời gian, cho đến cấu trúc chấm điểm 5 kỹ năng.",
    },
    {
      q: "Công nghệ AI chấm Speaking và Writing hoạt động như thế nào?",
      a: "AI được huấn luyện chuyên sâu theo khung CEFR và barem chấm thi của British Council. Với Writing, AI phân tích 4 tiêu chí: Task Fulfillment, Grammar, Lexical Resource, Cohesion. Với Speaking, AI lắng nghe phát âm, độ trôi chảy, ngữ điệu và gợi ý cách diễn đạt nâng band.",
    },
    {
      q: "Tôi có thể thi thử miễn phí không?",
      a: "Có! Bạn hoàn toàn có thể làm bài thi thử miễn phí, trải nghiệm làm bài trực tiếp trên hệ thống và nhận ngay kết quả đánh giá năng lực ban đầu mà không mất bất kỳ chi phí nào.",
    },
    {
      q: "Gói Pro có những quyền lợi gì vượt trội?",
      a: "Gói Pro mở khóa trọn bộ 870+ đề thi, không giới hạn lượt chấm Speaking/Writing bằng AI, truy cập Bộ đề Key Dự đoán sát kỳ thi và được đội ngũ giảng viên hỗ trợ giải đáp 24/7.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* 1. Header / Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* ====================================================
            2. HERO SECTION
            ==================================================== */}
        <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0B1120] text-white">
          {/* Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-blue-600/30 to-indigo-500/20 blur-[130px] rounded-full"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/3 -right-20 w-[450px] h-[450px] bg-blue-500/15 blur-[120px] rounded-full"
          />

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              {/* Left Column: Headlines & CTAs */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 backdrop-blur-md shadow-xs">
                  <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                    Nền tảng luyện thi Aptis ESOL ứng dụng Trí Tuệ Nhân Tạo (AI)
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15]">
                  Luyện thi Aptis{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                    chuẩn đề thật
                  </span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
                    AI chấm điểm tức thì
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Hơn <strong className="text-white font-bold">870+ đề thi</strong> sát thực tế kỳ thi British Council.
                  AI chấm <strong className="text-blue-300">Speaking & Writing</strong> chuẩn 4 tiêu chí CEFR, trả band điểm và gợi ý lộ trình bứt phá B2 chỉ sau vài phút.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link
                    href="/thi-thu"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-extrabold text-sm sm:text-base shadow-[0_8px_25px_rgba(37,99,235,0.45)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.6)] hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                    <span>Thi thử miễn phí ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/listening"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-sm sm:text-base backdrop-blur-md active:scale-95 transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-blue-300" />
                    <span>Xem kho đề luyện</span>
                  </Link>
                </div>

                {/* 3 Core Trust Badges */}
                <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-300">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Mô phỏng 100% đề máy tính thật</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>AI chấm Speaking–Writing CEFR</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>Có band điểm & giải thích ngay</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Mockup Showcase */}
              <div className="lg:col-span-5 relative">
                {/* Mockup Browser Window */}
                <div className="relative rounded-2xl border border-white/15 bg-slate-900/90 backdrop-blur-xl shadow-2xl p-4 sm:p-5 overflow-hidden animate-in zoom-in-95 duration-500">
                  {/* Browser Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <div className="px-3 py-0.5 rounded-md bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                      aptisesolpremier.vn/thi-thu
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold">● Đang thi</span>
                  </div>

                  {/* Inside Exam Content Demo */}
                  <div className="space-y-3.5">
                    {/* Exam Header */}
                    <div className="flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/5">
                      <div>
                        <span className="text-[11px] text-blue-400 font-bold block uppercase tracking-wide">
                          Reading & Vocabulary
                        </span>
                        <h4 className="text-xs font-bold text-white">Question 24 of 30</h4>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-mono font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>00:24:39</span>
                      </div>
                    </div>

                    {/* Question text snippet */}
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 space-y-2">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Part 2: Sentence Ordering
                      </p>
                      <p className="text-xs leading-relaxed text-slate-200">
                        Sắp xếp 5 câu sau thành một đoạn văn hoàn chỉnh theo mạch sự kiện:
                      </p>
                      <div className="space-y-1.5 pt-1">
                        <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30 text-[11px] text-blue-200 flex items-center justify-between">
                          <span>1. The annual science exhibition opened its doors on Monday.</span>
                          <span className="text-[10px] text-blue-400 font-bold">✓ Chuẩn</span>
                        </div>
                        <div className="p-2 rounded-lg bg-slate-800/80 border border-white/10 text-[11px] text-slate-300">
                          2. Hundreds of students from nearby schools arrived early...
                        </div>
                      </div>
                    </div>

                    {/* Quick Button Bar */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Đã làm: 24/30 câu</span>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs rounded-lg bg-white/10 text-slate-200 font-semibold">
                          Câu trước
                        </button>
                        <button className="px-3 py-1 text-xs rounded-lg bg-blue-600 text-white font-bold">
                          Câu kế tiếp →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Card 1: AI Writing Evaluation (Top Right) */}
                <div className="absolute -top-6 -right-4 sm:-right-6 bg-slate-900/95 border border-blue-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">AI Chấm Writing</span>
                    <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      Band B2 <span className="text-xs text-emerald-400 font-bold">● 18/20 điểm</span>
                    </span>
                  </div>
                </div>

                {/* Floating Card 2: Streak (Bottom Left) */}
                <div className="absolute -bottom-5 -left-4 sm:-left-6 bg-slate-900/95 border border-amber-500/40 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Flame className="w-5 h-5 fill-white" />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Chuỗi học liên tục</span>
                    <span className="text-sm font-extrabold text-amber-300">18 ngày streak</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            3. KEY METRICS COUNTER BAR
            ==================================================== */}
        <section className="relative -mt-6 z-20 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-card border border-border shadow-xl backdrop-blur-xl">
            {stats.map((s, idx) => (
              <div key={idx} className="p-3 sm:p-4 text-center border-r last:border-r-0 border-border/60">
                <div className="font-heading text-2xl sm:text-4xl font-black text-primary tracking-tight">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm font-bold text-foreground mt-1">{s.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ====================================================
            4. 5 CORE VALUE PROPOSITIONS ROW
            ==================================================== */}
        <section className="py-12 md:py-16 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-muted/20 p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {coreBenefits.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-start gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================
            5. 4-STEP LEARNING ROADMAP ("Bắt đầu học với 4 bước này")
            ==================================================== */}
        <section className="py-12 md:py-20 bg-muted/30 border-y border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                LỘ TRÌNH DÀNH CHO NGƯỜI MỚI
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
                Bắt đầu học với <span className="text-primary">4 bước này</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Được xây dựng từ kinh nghiệm của hơn 8.500 thí sinh đã thi đỗ B1 & B2 Aptis ESOL
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((st, idx) => (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#2563EB] text-white flex items-center justify-center font-heading font-black text-sm shadow-md shadow-blue-500/20">
                      {st.step}
                    </div>
                    <h3 className="font-heading font-bold text-base text-foreground leading-snug">
                      {st.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {st.desc}
                    </p>
                  </div>

                  <div className="pt-6 mt-4 border-t border-border/60">
                    <Link
                      href={st.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                    >
                      <span>{st.actionText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================
            6. FEATURE SHOWCASES ("Tính năng nổi bật")
            ==================================================== */}
        <section id="tinh-nang" className="py-16 md:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              TÍNH NĂNG NỔI BẬT
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
              Trải nghiệm luyện thi cùng <span className="text-primary">APTIS ESOL PREMIER</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mọi công cụ bạn cần để đạt band mục tiêu, gói gọn trên một nền tảng thông minh duy nhất.
            </p>
          </div>

          {/* Feature 01: Thi thử & AI chấm Speaking - Writing */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
            <div className="lg:col-span-6 space-y-5">
              <span className="font-heading text-4xl font-black text-primary/30">01</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                Thi thử & AI chấm Speaking – Writing
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Làm bài mô phỏng đề thật, AI thông minh chấm cả Speaking & Writing — trả điểm số, band CEFR và phân tích chi tiết từng lỗi sai ngay sau khi nộp.
              </p>
              <div className="space-y-3 text-xs sm:text-sm text-foreground pt-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Chấm theo 4 tiêu chí CEFR:</strong> Task Fulfillment, Grammar, Vocab, Cohesion.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Chỉ rõ lỗi sai & bài mẫu nâng band:</strong> Sửa từng câu văn chưa tự nhiên.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Lưu kết quả & theo dõi cải thiện:</strong> So sánh sự tiến bộ qua từng đề luyện.</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/thi-thu"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-md hover:bg-blue-700 transition-all"
                >
                  <span>Thử chấm bài ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Feature 01 Demo Visual */}
            <div className="lg:col-span-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="font-bold text-foreground">Báo cáo đánh giá AI APTIS ESOL</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                  Điểm: 17.8 / 20 (Band B2)
                </span>
              </div>
              <div className="space-y-3 text-xs text-foreground/90">
                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="font-bold text-foreground">Task 1: Thư thân mật (Email to a friend)</div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Nội dung đầy đủ, sử dụng từ ngữ tự nhiên, mạch lạc tốt. Ngữ pháp chuẩn xác, không có lỗi chính tả đáng kể.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60 space-y-1">
                  <div className="font-bold text-foreground">Task 2: Thư trang trọng (Formal Complaint)</div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    Sử dụng các cấu trúc trang trọng xuất sắc: <em>"I am writing to express my dissatisfaction..."</em>. Vốn từ phong phú đạt chuẩn B2.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 02: Luyện theo kỹ năng sát đề thật */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
            <div className="lg:col-span-6 order-2 lg:order-1 rounded-2xl border border-border bg-muted/40 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span className="font-bold text-foreground">Reading · Part 2: Sắp xếp câu</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary">⏱ 18:42</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-primary/40 font-medium text-foreground flex items-center justify-between">
                  <span>1. The festival begins with a parade through the town centre.</span>
                  <span className="text-[10px] text-primary font-bold">Mẫu</span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border text-foreground/80">
                  2. People gather early to find the best spots along the route.
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border text-foreground/80">
                  3. Afterwards, there are live music performances in the main square.
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-5">
              <span className="font-heading text-4xl font-black text-primary/30">02</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                Luyện theo kỹ năng sát đề thi thật
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                5 kỹ năng riêng biệt với đúng thao tác bài thi: kéo thả (drag & drop), dropdown inline, bấm giờ. Luyện từng phần nhỏ hoặc trọn bộ như thi thật.
              </p>
              <div className="space-y-3 text-xs sm:text-sm text-foreground pt-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Kéo thả & dropdown y hệt máy thi:</strong> Làm quen thao tác trước ngày thi.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Đủ 5 kỹ năng:</strong> Listening, Reading, Speaking, Writing, Grammar & Vocab.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Tùy chọn luyện part:</strong> Cày đúng dạng bài mình đang yếu để tiết kiệm thời gian.</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/listening"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-md hover:bg-blue-700 transition-all"
                >
                  <span>Khám phá 5 kỹ năng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Feature 03: Theo dõi tiến độ & Giữ streak */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-lg">
            <div className="lg:col-span-6 space-y-5">
              <span className="font-heading text-4xl font-black text-primary/30">03</span>
              <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                Theo dõi tiến độ & giữ streak
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Xem band tăng theo từng kỹ năng, biểu đồ tiến bộ theo thời gian thực và giữ chuỗi streak học tập để duy trì thói quen mỗi ngày.
              </p>
              <div className="space-y-3 text-xs sm:text-sm text-foreground pt-2">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Biểu đồ tiến bộ từng kỹ năng:</strong> Nhìn thấy sự bứt phá từ B1 lên B2.</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Streak & Lịch sử học tập:</strong> Nhắc nhở kỷ luật học tập không bỏ lỡ ngày nào.</span>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  href="/history"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm shadow-md hover:bg-blue-700 transition-all"
                >
                  <span>Xem hồ sơ học tập</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Feature 03 Demo Visual */}
            <div className="lg:col-span-6 rounded-2xl border border-border bg-muted/40 p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs">
                <div>
                  <span className="text-[11px] text-muted-foreground block">Tiến độ tuần này</span>
                  <span className="font-heading font-black text-lg text-foreground">B1 → B2</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-bold text-xs">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>18 ngày streak</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2 text-center">
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[11px] text-muted-foreground">Reading</div>
                  <div className="text-base font-bold text-primary mt-0.5">B2 (44/50)</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[11px] text-muted-foreground">Listening</div>
                  <div className="text-base font-bold text-primary mt-0.5">B1+ (38/50)</div>
                </div>
                <div className="p-3 rounded-xl bg-card border border-border/60">
                  <div className="text-[11px] text-muted-foreground">Writing</div>
                  <div className="text-base font-bold text-primary mt-0.5">B2 (42/50)</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            7. VÌ SAO CHỌN APTIS ESOL PREMIER ("Điểm mạnh")
            ==================================================== */}
        <section className="py-16 md:py-24 bg-muted/20 border-y border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                ĐIỂM MẠNH VƯỢT TRỘI
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
                Vì sao chọn <span className="text-primary">APTIS ESOL PREMIER</span>?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Được tin tưởng bởi hàng nghìn sinh viên các trường đại học hàng đầu trên toàn quốc.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseUs.map((w, idx) => {
                const Icon = w.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl border border-border bg-card shadow-xs hover:shadow-md hover:border-primary/40 transition-all space-y-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-heading font-bold text-base text-foreground">{w.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{w.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================
            8. COMPLEMENTARY TOOLS ECOSYSTEM ("Công cụ ôn tập")
            ==================================================== */}
        <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              CÔNG CỤ ÔN TẬP TOÀN DIỆN
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
              Hệ sinh thái công cụ hỗ trợ <span className="text-primary">toàn diện</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Đầy đủ mọi tiện ích từ nghe chép chính tả, flashcard từ vựng cho đến bộ đề dự đoán sát lịch thi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((t, idx) => (
              <Link
                key={idx}
                href={t.href}
                className="group relative p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {t.title}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${t.color}`}
                    >
                      {t.tag}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                </div>
                <div className="pt-4 mt-4 border-t border-border/60 flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Trải nghiệm ngay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ====================================================
            9. STUDENT TESTIMONIALS / PROOF ("Học viên nói gì")
            ==================================================== */}
        <section className="py-16 md:py-24 bg-muted/20 border-y border-border">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                KẾT QUẢ THỰC TẾ
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
                Feedback từ <span className="text-primary">thí sinh đã đạt chứng chỉ</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Hàng nghìn học viên đã đạt chuẩn đầu ra B1, B2 và C1 ngay trong lần thi đầu tiên.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {feedbacks.map((f, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-foreground">{f.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{f.school}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 font-extrabold text-xs">
                        {f.badge}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-foreground/90 leading-relaxed italic">
                      "{f.text}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/60 text-[11px] font-semibold text-primary">
                    {f.score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================
            10. PRICING PREVIEW ("Bảng giá luyện thi")
            ==================================================== */}
        <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              BẢNG GIÁ ƯU ĐÃI
            </span>
            <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-foreground">
              Đầu tư một lần — <span className="text-primary">Đỗ Aptis chắc chắn</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Chọn gói học phù hợp với quỹ thời gian và mục tiêu điểm số của bạn.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto gap-6 items-stretch">
            {/* Free Tier */}
            <div className="p-8 rounded-3xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-muted text-muted-foreground inline-block">
                  GÓI TRẢI NGHIỆM
                </span>
                <div className="font-heading text-3xl font-extrabold text-foreground">
                  0đ <span className="text-xs font-normal text-muted-foreground">/ Miễn phí</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Phù hợp để làm quen với cấu trúc bài thi Aptis trên máy tính.
                </p>
                <div className="space-y-2.5 pt-2 text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Thi thử 2 đề Full Test miễn phí</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Luyện tập các part Reading cơ bản</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>3 lượt chấm AI Speaking & Writing</span>
                  </div>
                </div>
              </div>

              <Link
                href="/thi-thu"
                className="w-full text-center py-3 rounded-xl border border-border bg-muted/50 hover:bg-muted font-bold text-xs text-foreground transition-all"
              >
                Bắt đầu học miễn phí
              </Link>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="relative p-8 rounded-3xl border-2 border-primary bg-gradient-to-b from-primary/5 via-card to-card shadow-xl flex flex-col justify-between space-y-6">
              <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-sm">
                KHUYÊN DÙNG
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary/10 text-primary inline-flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  GÓI VIP PRO TRỌN GÓI
                </span>
                <div className="font-heading text-3xl font-extrabold text-foreground">
                  199.000đ{" "}
                  <span className="text-xs font-normal line-through text-muted-foreground">
                    499.000đ
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mở khóa toàn bộ 870+ đề và công nghệ AI chấm không giới hạn.
                </p>
                <div className="space-y-2.5 pt-2 text-xs text-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary font-bold shrink-0" />
                    <span><strong>Mở khóa trọn bộ 870+ đề thi thật</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary font-bold shrink-0" />
                    <span><strong>Không giới hạn lượt chấm AI Speaking & Writing</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary font-bold shrink-0" />
                    <span><strong>Bộ đề Key Dự Đoán ưu tiên sát kỳ thi</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary font-bold shrink-0" />
                    <span>Hỗ trợ giải đáp thắc mắc 24/7 từ đội ngũ Admin</span>
                  </div>
                </div>
              </div>

              <Link
                href="/pricing"
                className="w-full text-center py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-extrabold text-xs shadow-md shadow-blue-500/25 hover:brightness-110 active:scale-95 transition-all"
              >
                Nâng cấp VIP PRO ngay
              </Link>
            </div>
          </div>
        </section>

        {/* ====================================================
            11. FAQ ACCORDION SECTION
            ==================================================== */}
        <section className="py-16 md:py-24 bg-muted/20 border-t border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                HỎI ĐÁP THẮC MẮC
              </span>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-foreground">
                Câu hỏi thường gặp
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = activeFaq === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-border bg-card overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-sm text-foreground hover:text-primary transition-colors"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180 text-primary" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-5 sm:px-5 text-xs text-muted-foreground leading-relaxed animate-in fade-in duration-200 border-t border-border/40 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ====================================================
            12. FINAL CALL TO ACTION BANNER
            ==================================================== */}
        <section className="py-16 md:py-24 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl">
            {/* Background Glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent"
            />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-200 bg-white/10 px-3 py-1 rounded-full inline-block">
                CHINH PHỤC CHỨNG CHỈ TIẾNG ANH
              </span>
              <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
                Sẵn sàng đạt B1 & B2 Aptis ESOL ngay hôm nay?
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-normal">
                Bắt đầu với bài thi thử miễn phí, nhận band điểm AI chuẩn xác và trải nghiệm cảm giác làm bài như trong phòng thi thật.
              </p>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/thi-thu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold text-sm sm:text-base shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
              >
                <Zap className="w-4 h-4 fill-blue-700" />
                <span>Bắt đầu thi thử miễn phí</span>
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-sm sm:text-base backdrop-blur-md active:scale-95 transition-all"
              >
                <span>Xem các gói VIP PRO</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingActions />

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
