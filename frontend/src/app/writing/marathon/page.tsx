"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { WRITING_CLUBS_BANK, WritingClubItem } from "@/data/writing-clubs-bank";
import {
  PenTool,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Send,
  RotateCcw,
  Award,
  AlertCircle,
  Mail,
  Users,
  MessageSquare,
  FileText,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";

// Additional Part 1 Short Answers Bank
const WRITING_PART1_BANK = [
  {
    id: 1,
    topic: "Personal Information & Daily Life",
    questions: [
      { q: "What do you like doing in your free time?", sample: "Playing football and reading books.", max: 5 },
      { q: "Where do you usually go on weekends?", sample: "I visit local coffee shops.", max: 5 },
      { q: "What is your primary occupation?", sample: "I am a university student.", max: 5 },
      { q: "What kind of music do you prefer?", sample: "Acoustic pop and classical melodies.", max: 5 },
      { q: "How do you travel to work or school?", sample: "By public electric bus daily.", max: 5 },
    ],
  },
  {
    id: 2,
    topic: "Travel & Holidays",
    questions: [
      { q: "What is your favorite holiday destination?", sample: "Da Nang beach and mountains.", max: 5 },
      { q: "Who do you usually travel with?", sample: "My family and close friends.", max: 5 },
      { q: "What did you pack for your last trip?", sample: "Warm clothes and my camera.", max: 5 },
      { q: "Do you prefer summer or winter vacations?", sample: "Summer, because of sunny weather.", max: 5 },
      { q: "How long was your longest trip?", sample: "About ten wonderful days.", max: 5 },
    ],
  },
  {
    id: 3,
    topic: "Food & Healthy Living",
    questions: [
      { q: "What is your favorite traditional dish?", sample: "Traditional beef noodle soup (Pho).", max: 5 },
      { q: "Do you prefer cooking at home or eating out?", sample: "Cooking fresh meals at home.", max: 5 },
      { q: "What time do you usually eat dinner?", sample: "Around seven o'clock every evening.", max: 5 },
      { q: "How often do you exercise each week?", sample: "Three times per week.", max: 5 },
      { q: "What is your favorite fruit?", sample: "Fresh ripe sweet mangoes.", max: 5 },
    ],
  },
  {
    id: 4,
    topic: "Technology & Entertainment",
    questions: [
      { q: "What smartphone app do you use most?", sample: "Social messaging and map apps.", max: 5 },
      { q: "How many hours do you spend online daily?", sample: "Around four productive hours.", max: 5 },
      { q: "Do you like watching movies at the cinema?", sample: "Yes, especially science-fiction films.", max: 5 },
      { q: "What electronic device can't you live without?", sample: "My laptop for daily studying.", max: 5 },
      { q: "What was the last book or article you read?", sample: "An article about digital technology.", max: 5 },
    ],
  },
];

function WritingMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "1";

  const [currentPart, setCurrentPart] = useState<"1" | "2" | "3" | "4">(
    initialPart === "2" ? "2" : initialPart === "3" ? "3" : initialPart === "4" ? "4" : "1"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showSamples, setShowSamples] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Helper count words
  const countWords = (text?: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Clubs for Part 2, 3, 4
  const filteredClubs = useMemo(() => {
    return WRITING_CLUBS_BANK.filter((club) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        club.clubNameEn.toLowerCase().includes(term) ||
        club.clubNameVi.toLowerCase().includes(term) ||
        club.part2.formField.toLowerCase().includes(term) ||
        club.part3.questions.some((q) => q.question.toLowerCase().includes(term)) ||
        club.part4.noticeTitle.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  // Filter Part 1
  const filteredP1 = useMemo(() => {
    return WRITING_PART1_BANK.filter((unit) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        unit.topic.toLowerCase().includes(term) ||
        unit.questions.some((q) => q.q.toLowerCase().includes(term) || q.sample.toLowerCase().includes(term))
      );
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/writing?tab=p${currentPart}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Writing
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Ngân Hàng Đề Thi Thật CEFR B1–C
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Từng Dạng Viết Aptis ESOL
                </h1>
              </div>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm chủ đề, câu hỏi..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>
          </div>

          {/* Part Switcher Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
            <button
              type="button"
              onClick={() => setCurrentPart("1")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentPart === "1"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentPart === "1" ? "text-primary" : "text-muted-foreground"}`}>
                  Part 1 · 1–5 từ
                </span>
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Short Answers
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                20+ câu hỏi tin nhắn ngắn
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPart("2")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentPart === "2"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentPart === "2" ? "text-primary" : "text-muted-foreground"}`}>
                  Part 2 · 20–30 từ
                </span>
                <PenTool className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Form Filling
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                15+ chủ đề đơn câu lạc bộ
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPart("3")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentPart === "3"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentPart === "3" ? "text-primary" : "text-muted-foreground"}`}>
                  Part 3 · 30–40 từ
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Social Interaction
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Chat diễn đàn 3 thành viên
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCurrentPart("4")}
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                currentPart === "4"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                  : "border-border bg-card hover:bg-muted/50"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-black uppercase ${currentPart === "4" ? "text-primary" : "text-muted-foreground"}`}>
                  Part 4 · Email kép
                </span>
                <Mail className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Formal &amp; Informal
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Thư bạn (~50) &amp; Quản lý (~150)
              </p>
            </button>
          </div>

          {/* ================================================================ */}
          {/* 1. PART 1 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "1" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 1 (Short Answers)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Mỗi câu chỉ viết từ <strong>1 đến 5 từ</strong>. Trả lời trực diện, đúng ngữ pháp, không viết câu quá dài tránh bị trừ điểm format.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  Khuyến nghị: 3 phút / 5 câu
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredP1.map((unit) => (
                  <div key={unit.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        Chủ đề {unit.id}
                      </span>
                      <h4 className="font-heading font-bold text-sm text-foreground">
                        {unit.topic}
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {unit.questions.map((q, qIdx) => {
                        const inputKey = `p1_${unit.id}_${qIdx}`;
                        const userText = userAnswers[inputKey] || "";
                        const words = countWords(userText);
                        const isOver = words > 5;
                        const sampleOpen = showSamples[inputKey];

                        return (
                          <div key={qIdx} className="p-3.5 rounded-xl bg-muted/30 border border-border/70 space-y-2">
                            <div className="text-xs font-bold text-foreground flex items-start gap-1.5">
                              <span className="text-primary font-black shrink-0">{qIdx + 1}.</span>
                              <span>{q.q}</span>
                            </div>

                            <div className="space-y-1">
                              <input
                                type="text"
                                value={userText}
                                onChange={(e) =>
                                  setUserAnswers((prev) => ({ ...prev, [inputKey]: e.target.value }))
                                }
                                placeholder="Gõ câu trả lời của bạn (1-5 từ)..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                              />

                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <span className={isOver ? "text-rose-500 font-bold" : words >= 1 ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                                  Số từ: {words}/5 từ {isOver && "(Quá giới hạn 5 từ!)"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSamples((prev) => ({ ...prev, [inputKey]: !prev[inputKey] }))
                                  }
                                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>{sampleOpen ? "Ẩn câu mẫu" : "Xem câu mẫu B2/C1"}</span>
                                </button>
                              </div>
                            </div>

                            {sampleOpen && (
                              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2 animate-fadeIn">
                                <div>
                                  <span className="font-bold">Gợi ý ăn điểm:</span> {q.sample}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(inputKey, q.sample)}
                                  className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-1"
                                  title="Sao chép"
                                >
                                  {copiedId === inputKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 2. PART 2 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "2" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 2 (Form Filling - 20–30 từ)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Viết đoạn văn ngắn nêu lý do, sở thích tham gia CLB. Độ dài lý tưởng là <strong>23–28 từ</strong>. Viết thành các câu văn hoàn chỉnh, dùng từ nối đơn giản (because, and, so, also).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  Khuyến nghị: 7 phút / đề
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredClubs.map((club) => {
                  const inputKey = `p2_club_${club.id}`;
                  const userText = userAnswers[inputKey] || "";
                  const words = countWords(userText);
                  const isValid = words >= 20 && words <= 30;
                  const sampleOpen = showSamples[inputKey];

                  const sampleP2 = `I have always had a strong passion for ${club.clubNameEn.toLowerCase()}. Joining this club allows me to meet like-minded people, practice regularly, and gain valuable practical experiences.`;

                  return (
                    <div key={club.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            CLB {club.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {club.sticker}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
                          {club.clubNameVi}
                        </h4>
                      </div>

                      <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground space-y-1">
                        <div className="font-black text-primary uppercase text-[10px]">Đề bài điền đơn:</div>
                        <p className="font-medium">{club.part2.formField}</p>
                        <p className="text-[11px] text-muted-foreground">{club.part2.description}</p>
                      </div>

                      <div className="space-y-1.5">
                        <textarea
                          rows={3}
                          value={userText}
                          onChange={(e) =>
                            setUserAnswers((prev) => ({ ...prev, [inputKey]: e.target.value }))
                          }
                          placeholder="Viết đoạn văn ngắn 20-30 từ tại đây..."
                          className="w-full p-3 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                        />

                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className={
                              isValid
                                ? "text-emerald-600 font-bold"
                                : words > 30
                                ? "text-rose-500 font-bold"
                                : words > 0
                                ? "text-amber-600 font-bold"
                                : "text-muted-foreground"
                            }
                          >
                            Số từ: {words}/30 từ {isValid && "✓ Chuẩn yêu cầu!"} {words > 30 && "(Vượt quá 30 từ!)"} {words > 0 && words < 20 && "(Chưa đủ 20 từ)"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setShowSamples((prev) => ({ ...prev, [inputKey]: !prev[inputKey] }))
                            }
                            className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>{sampleOpen ? "Ẩn bài mẫu" : "Xem bài mẫu B2"}</span>
                          </button>
                        </div>
                      </div>

                      {sampleOpen && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-fadeIn">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">Bài mẫu chuẩn B2 ({countWords(sampleP2)} từ):</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(inputKey, sampleP2)}
                              className="text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 p-1"
                              title="Sao chép"
                            >
                              {copiedId === inputKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="italic leading-relaxed">{sampleP2}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 3. PART 3 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "3" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 3 (Social Interaction - 30–40 từ/câu)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Hội thoại với 3 thành viên khác nhau. Trả lời đúng trọng tâm câu hỏi của từng người, dùng từ vựng phong phú, liên kết câu tự nhiên.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  Khuyến nghị: 10 phút / 3 câu
                </span>
              </div>

              <div className="space-y-6">
                {filteredClubs.map((club) => (
                  <div key={club.id} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            Chủ đề {club.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {club.sticker}
                          </span>
                        </div>
                        <h4 className="font-heading font-black text-base text-foreground mt-1">
                          {club.clubNameEn} ({club.clubNameVi})
                        </h4>
                      </div>
                      <span className="text-xs text-muted-foreground">{club.part3.context}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {club.part3.questions.map((item, qIdx) => {
                        const inputKey = `p3_${club.id}_${qIdx}`;
                        const userText = userAnswers[inputKey] || "";
                        const words = countWords(userText);
                        const isValid = words >= 30 && words <= 40;
                        const sampleOpen = showSamples[inputKey];

                        const sampleAnswer = `Hi ${item.member}, I completely understand your perspective. In my experience, staying consistent and connecting with encouraging peers helps tremendously. That is why joining this vibrant club is an outstanding opportunity for all of us.`;

                        return (
                          <div key={qIdx} className="p-4 rounded-xl bg-muted/20 border border-border flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">
                                  {item.member[0]}
                                </span>
                                <span className="font-bold text-xs text-foreground">{item.member}</span>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium italic">
                                "{item.question}"
                              </p>
                            </div>

                            <div className="space-y-1.5">
                              <textarea
                                rows={4}
                                value={userText}
                                onChange={(e) =>
                                  setUserAnswers((prev) => ({ ...prev, [inputKey]: e.target.value }))
                                }
                                placeholder={`Phản hồi cho ${item.member} (30-40 từ)...`}
                                className="w-full p-2.5 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                              />

                              <div className="flex items-center justify-between text-[11px]">
                                <span
                                  className={
                                    isValid
                                      ? "text-emerald-600 font-bold"
                                      : words > 40
                                      ? "text-rose-500 font-bold"
                                      : words > 0
                                      ? "text-amber-600 font-bold"
                                      : "text-muted-foreground"
                                  }
                                >
                                  {words}/40 từ {isValid && "✓ Đạt"} {words > 40 && "(Quá từ)"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowSamples((prev) => ({ ...prev, [inputKey]: !prev[inputKey] }))
                                  }
                                  className="text-[11px] font-bold text-primary hover:underline"
                                >
                                  {sampleOpen ? "Ẩn mẫu" : "Xem mẫu B2"}
                                </button>
                              </div>

                              {sampleOpen && (
                                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1 animate-fadeIn">
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold">Mẫu ({countWords(sampleAnswer)} từ):</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(inputKey, sampleAnswer)}
                                      className="text-emerald-700 p-0.5"
                                    >
                                      {copiedId === inputKey ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                  <p className="italic leading-relaxed">{sampleAnswer}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* 4. PART 4 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "4" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 4 (Formal &amp; Informal Email)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    1 đề thông báo (Notice). Viết 2 bức thư: <strong>Thư gửi bạn bè (~50 từ, thân mật)</strong> và <strong>Thư gửi Quản lý CLB (120–150 từ, trang trọng)</strong>. Phân biệt rõ ràng từ vựng và cấu trúc Formal vs Informal.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  Khuyến nghị: 20 phút / 2 thư
                </span>
              </div>

              <div className="space-y-8">
                {filteredClubs.map((club) => {
                  const friendKey = `p4_friend_${club.id}`;
                  const managerKey = `p4_manager_${club.id}`;

                  const friendText = userAnswers[friendKey] || "";
                  const managerText = userAnswers[managerKey] || "";

                  const friendWords = countWords(friendText);
                  const managerWords = countWords(managerText);

                  const isFriendValid = friendWords >= 45 && friendWords <= 60;
                  const isManagerValid = managerWords >= 120 && managerWords <= 160;

                  const sampleFriend = `Hi Alex, have you checked the latest notice from our club? I was quite disappointed to hear about the sudden changes. We should definitely meet up this weekend to discuss alternative options and see what we can do next. Let me know your thoughts!`;

                  const sampleManager = `Dear Club Manager,

I am writing to express my strong concern regarding the recent announcement about the upcoming schedule and fee adjustments. 

As an active and dedicated member of the club, I believe this sudden decision will cause significant inconvenience for many participants who rely heavily on our regular sessions. A substantial increase in expenses or reduction in operating hours may unfortunately discourage prospective members from joining and place unnecessary financial burdens on existing ones.

I would like to respectfully suggest that the management board reconsider this policy. Perhaps hosting fundraising events or adjusting weekday operational hours could serve as a more feasible alternative solution.

Thank you very much for your time and kind consideration. I look forward to hearing your response.

Yours sincerely,
A Concerned Club Member`;

                  return (
                    <div key={club.id} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                            Chủ đề {club.id}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                            {club.sticker}
                          </span>
                          <h4 className="font-heading font-black text-base text-foreground">
                            {club.clubNameEn}
                          </h4>
                        </div>
                      </div>

                      {/* Notice Box */}
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 text-xs space-y-1.5">
                        <div className="flex items-center gap-2 font-black uppercase text-[11px] text-amber-800 dark:text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{club.part4.noticeTitle}</span>
                        </div>
                        <p className="leading-relaxed">{club.part4.noticeContent}</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 1. Informal Email */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold text-[10px] uppercase">
                                Nhiệm vụ 1: Email Thân Mật (~50 từ)
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {club.part4.friendEmailPrompt}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <textarea
                              rows={5}
                              value={friendText}
                              onChange={(e) =>
                                setUserAnswers((prev) => ({ ...prev, [friendKey]: e.target.value }))
                              }
                              placeholder="Hi [Name], ..."
                              className="w-full p-3 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                            />

                            <div className="flex items-center justify-between text-[11px]">
                              <span className={isFriendValid ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                                Số từ: {friendWords}/50 từ {isFriendValid && "✓ Chuẩn"}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setShowSamples((prev) => ({ ...prev, [friendKey]: !prev[friendKey] }))
                                }
                                className="text-[11px] font-bold text-primary hover:underline"
                              >
                                {showSamples[friendKey] ? "Ẩn mẫu" : "Xem mẫu Informal"}
                              </button>
                            </div>

                            {showSamples[friendKey] && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-fadeIn">
                                <div className="flex items-center justify-between font-bold">
                                  <span>Bài mẫu Thân mật ({countWords(sampleFriend)} từ):</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(friendKey, sampleFriend)}
                                    className="p-1"
                                  >
                                    {copiedId === friendKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <p className="italic leading-relaxed">{sampleFriend}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Formal Email */}
                        <div className="space-y-3 p-4 rounded-xl bg-muted/20 border border-border flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px] uppercase">
                                Nhiệm vụ 2: Email Trang Trọng (120–150 từ)
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium">
                              {club.part4.managerEmailPrompt}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <textarea
                              rows={8}
                              value={managerText}
                              onChange={(e) =>
                                setUserAnswers((prev) => ({ ...prev, [managerKey]: e.target.value }))
                              }
                              placeholder="Dear Club Manager, ..."
                              className="w-full p-3 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-none"
                            />

                            <div className="flex items-center justify-between text-[11px]">
                              <span className={isManagerValid ? "text-emerald-600 font-bold" : "text-muted-foreground"}>
                                Số từ: {managerWords}/120–150 từ {isManagerValid && "✓ Chuẩn"}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  setShowSamples((prev) => ({ ...prev, [managerKey]: !prev[managerKey] }))
                                }
                                className="text-[11px] font-bold text-primary hover:underline"
                              >
                                {showSamples[managerKey] ? "Ẩn mẫu" : "Xem mẫu Formal B2/C1"}
                              </button>
                            </div>

                            {showSamples[managerKey] && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-1 animate-fadeIn">
                                <div className="flex items-center justify-between font-bold">
                                  <span>Bài mẫu Trang trọng ({countWords(sampleManager)} từ):</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(managerKey, sampleManager)}
                                    className="p-1"
                                  >
                                    {copiedId === managerKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                                <p className="italic leading-relaxed whitespace-pre-line">{sampleManager}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}

export default function WritingMarathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WritingMarathonContent />
    </Suspense>
  );
}
