"use client";

import { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  READING_PART1_SETS,
  ReadingPart1Set,
  ReadingPart1Question,
} from "@/data/reading-part1-bank";
import {
  READING_PART2_TOPICS,
  READING_PART3_TOPICS,
  READING_PART4_TOPICS,
} from "@/data/reading-topics-bank";
import { READING_PART2_BANK } from "@/data/reading-part2-bank";
import { READING_PART3_BANK } from "@/data/reading-part3-bank";
import {
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  FileText,
  AlignLeft,
  Languages,
  ExternalLink,
  Globe,
} from "lucide-react";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";
import { getCloverConfig } from "@/lib/clover-utils";

// Sample Sentence Cohesion data for Part 2
const PART2_COHESION_DEMO = [
  {
    id: 1,
    title: "Making films (Đóng phim)",
    correctOrder: [
      "Tom had always dreamed of acting in a major motion picture since his early childhood.",
      "Last month, he finally saw an audition notice posted on the local drama board.",
      "He prepared a short classical monologue and practiced diligently every evening.",
      "When he arrived at the studio, the casting directors asked him to perform immediately.",
      "They were deeply impressed by his natural delivery and offered him a supporting role.",
      "Now, Tom is rehearsing daily on the main set, eagerly awaiting his film debut."
    ]
  },
  {
    id: 2,
    title: "Family sport day (Ngày hội thể thao gia đình)",
    correctOrder: [
      "Every summer, our neighborhood organizes an annual community sports competition.",
      "Families from all nearby districts gather in the central park early in the morning.",
      "The day kicks off with traditional relay races, sack jumps, and tug-of-war contests.",
      "Children and parents encourage each other enthusiastically under the warm sunshine.",
      "At midday, everyone shares delicious homemade food at a communal picnic buffet.",
      "Finally, gold medals and certificates are proudly awarded to all participating teams."
    ]
  },
  {
    id: 3,
    title: "Mountain Trip Adventure (Chuyến đi leo núi)",
    correctOrder: [
      "Early on Saturday morning, our hiking group met at the base of the mountain ridge.",
      "We carefully checked our backpacks to ensure we had sufficient water and safety gear.",
      "The initial climb was relatively gentle, winding through quiet, fragrant pine forests.",
      "However, the rocky trail became steep and slippery as we approached the summit.",
      "After three exhausting hours, we reached the peak and enjoyed a breathtaking panoramic view.",
      "We took memorable photographs before safely descending back to our campsite."
    ]
  }
];

function ReadingMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "1";

  const [currentPart, setCurrentPart] = useState<"1" | "2" | "3" | "4">(
    initialPart === "2" ? "2" : initialPart === "3" ? "3" : initialPart === "4" ? "4" : "1"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetId, setSelectedSetId] = useState<string>("all");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showTranslations, setShowTranslations] = useState<Record<string, boolean>>({});
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  // Part 2 Cohesion order state (Đầy đủ 27 bộ đề thi)
  const [cohesionOrder, setCohesionOrder] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {};
    READING_PART2_BANK.forEach((demo) => {
      initial[demo.id] = [...demo.correctOrder].sort(() => 0.5 - Math.random());
    });
    return initial;
  });

  // Part 3 Answers state
  const [p3Answers, setP3Answers] = useState<Record<string, "A" | "B" | "C" | "D">>({});
  const [p3ShowResults, setP3ShowResults] = useState<Record<number, boolean>>({});

  const [cohesionChecked, setCohesionChecked] = useState<Record<number, boolean>>({});

  // Filter Part 1 Sets
  const filteredSets = useMemo(() => {
    return READING_PART1_SETS.filter((set) => {
      if (selectedSetId !== "all" && set.id !== selectedSetId) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const matchTitle = set.title.toLowerCase().includes(term);
      const matchKeywords = set.keyWords.some((k) => k.toLowerCase().includes(term));
      const matchQuestions = set.questions.some(
        (q) =>
          q.prompt.toLowerCase().includes(term) ||
          q.fullSentence.toLowerCase().includes(term) ||
          (q.translation && q.translation.toLowerCase().includes(term))
      );
      return matchTitle || matchKeywords || matchQuestions;
    });
  }, [selectedSetId, searchTerm]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleCheckSet = (setId: string) => {
    setShowResults((prev) => ({ ...prev, [setId]: true }));
  };

  const handleResetSet = (setId: string) => {
    const setToReset = READING_PART1_SETS.find((s) => s.id === setId);
    if (!setToReset) return;
    setAnswers((prev) => {
      const updated = { ...prev };
      setToReset.questions.forEach((q) => delete updated[q.id]);
      return updated;
    });
    setShowResults((prev) => ({ ...prev, [setId]: false }));
  };

  const toggleTranslation = (setId: string) => {
    setShowTranslations((prev) => ({ ...prev, [setId]: !prev[setId] }));
  };

  // Filter Part 2
  const filteredP2Demos = useMemo(() => {
    if (!searchTerm) return READING_PART2_BANK;
    const term = searchTerm.toLowerCase();
    return READING_PART2_BANK.filter(
      (d) =>
        d.title.toLowerCase().includes(term) ||
        d.leakKeywordNote.toLowerCase().includes(term) ||
        d.correctOrder.some((s) => s.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  // Filter Part 3
  const filteredP3Bank = useMemo(() => {
    if (!searchTerm) return READING_PART3_BANK;
    const term = searchTerm.toLowerCase();
    return READING_PART3_BANK.filter(
      (t) =>
        t.title.toLowerCase().includes(term) ||
        t.persons.some((p) => p.text.toLowerCase().includes(term)) ||
        t.questions.some((q) => q.prompt.toLowerCase().includes(term))
    );
  }, [searchTerm]);

  // Move sentence helper in Part 2
  const moveSentence = (demoId: number, fromIdx: number, toIdx: number) => {
    setCohesionOrder((prev) => {
      const list = [...(prev[demoId] || [])];
      const item = list.splice(fromIdx, 1)[0];
      list.splice(toIdx, 0, item);
      return { ...prev, [demoId]: list };
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] pb-16">
        <div className="section-container">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/reading?tab=p${currentPart}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Reading
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Toàn Diện 4 Dạng Bài Đọc Hiểu
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Từng Dạng Đọc Aptis ESOL
                </h1>
              </div>
            </div>

            {/* Quick search & Google Translate */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm từ khóa, đề tài đọc..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>
              <button
                type="button"
                onClick={() => setIsTranslateOpen(true)}
                className="h-9 px-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
                title="Tra cứu từ vựng & dịch câu bằng Google Dịch"
              >
                <Languages className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Google Dịch</span>
              </button>
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
                  Part 1 · Gap Fill
                </span>
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Sentence Comprehension
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                30+ câu điền từ ngắn có dịch
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
                  Part 2 + 3 · Cohesion
                </span>
                <ArrowUpDown className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Text Cohesion
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                12 bộ đề sắp xếp trật tự câu
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
                  Part 4 · Opinion
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Opinion Matching
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                12 bộ đề nối ý kiến 4 nhân vật
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
                  Part 5 · Headings
                </span>
                <AlignLeft className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Long Reading Headings
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Đọc văn bản dài chọn 7 tiêu đề
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
                    Quy tắc ăn trọn điểm Reading Part 1 (Sentence Gap Fill)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Đọc đoạn văn ngắn hoặc email và chọn từ thích hợp điền vào 5 chỗ trống. Chú ý từ loại (danh, động, tính, trạng) và liên từ chỉ nguyên nhân/kết quả.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  19 bộ đề tách câu lẻ (Full Part 1)
                </span>
              </div>

              <div className="space-y-6">
                {filteredSets.map((set) => {
                  const isChecked = showResults[set.id];
                  const hasTranslation = showTranslations[set.id];

                  return (
                    <div key={set.id} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {set.title}
                            </span>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              {set.sticker || "☘️☘️☘️☘️☘️ Đề trọng điểm"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              Từ khóa: {set.keyWords.join(", ")}
                            </span>
                          </div>
                          <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                            {set.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTranslation(set.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-bold text-xs text-foreground transition-all"
                          >
                            <Languages className="w-3.5 h-3.5 text-primary" />
                            <span>{hasTranslation ? "Ẩn dịch nghĩa" : "Dịch nghĩa song ngữ"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetSet(set.id)}
                            className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Làm lại"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {set.questions.map((q) => {
                          const userAns = answers[q.id];
                          const isCorrect = userAns === q.correctAnswer;
                          const googleTranslateUrl = `https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(q.fullSentence)}&op=translate`;

                          return (
                            <div key={q.id} className="p-4 rounded-xl bg-muted/20 border border-border space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-semibold text-foreground leading-relaxed">
                                  {q.prompt}
                                </div>
                                <a
                                  href={googleTranslateUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Mở Google Dịch câu này"
                                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline font-bold shrink-0 p-1 rounded-md bg-primary/5 hover:bg-primary/10"
                                >
                                  <Globe className="w-3 h-3" />
                                  <span>GG Dịch</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                {q.options.map((opt) => {
                                  const isSelected = userAns === opt;
                                  let style = "border-border bg-card hover:bg-muted text-foreground";

                                  if (isChecked) {
                                    if (opt === q.correctAnswer) {
                                      style = "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold";
                                    } else if (isSelected) {
                                      style = "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                                    }
                                  } else if (isSelected) {
                                    style = "border-primary bg-primary/10 text-primary font-bold";
                                  }

                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => handleSelectOption(q.id, opt)}
                                      className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all truncate text-center ${style}`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>

                              {hasTranslation && q.translation && (
                                <div className="text-[11.5px] text-muted-foreground border-t border-border/40 pt-2 flex items-center justify-between gap-2">
                                  <span><strong>Bản dịch:</strong> {q.translation}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleCheckSet(set.id)}
                          className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                        >
                          {isChecked ? "Đã kiểm tra kết quả" : "Kiểm tra đáp án bộ đề này"}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                    Quy tắc ăn trọn điểm Reading Part 2 + 3 (Text Cohesion)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Sắp xếp 6 câu văn đã bị xáo trộn trật tự thành một câu chuyện hoàn chỉnh. Dùng mũi tên lên/xuống để đổi chỗ câu và bấm "Kiểm tra đáp án".
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  27 bộ chủ đề sát đề thi (Full Part 2)
                </span>
              </div>

              <div className="space-y-6">
                {filteredP2Demos.map((demo) => {
                  const currentSentences = cohesionOrder[demo.id] || demo.correctOrder;
                  const isChecked = cohesionChecked[demo.id];

                  return (
                    <div key={demo.id} className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {demo.title.split(" - ")[0]}
                            </span>
                            <h4 className="font-heading font-bold text-sm text-foreground">
                              {demo.title}
                            </h4>
                          </div>
                          {demo.leakKeywordNote && (
                            <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block">
                              🔑 Mẹo từ khóa thứ tự: {demo.leakKeywordNote}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setCohesionChecked((prev) => ({ ...prev, [demo.id]: !prev[demo.id] }))}
                          className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                        >
                          {isChecked ? "Ẩn đáp án đúng" : "Kiểm tra trật tự"}
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {currentSentences.map((sent, sentIdx) => {
                          const correctIdx = demo.correctOrder.indexOf(sent);
                          const isMatch = sentIdx === correctIdx;

                          let cardBorder = "border-border bg-muted/20";
                          if (isChecked) {
                            cardBorder = isMatch
                              ? "border-emerald-500 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                              : "border-rose-500 bg-rose-500/10 text-rose-950 dark:text-rose-200";
                          }

                          return (
                            <div
                              key={sentIdx}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all ${cardBorder}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                                  {sentIdx + 1}
                                </span>
                                <p className="leading-relaxed font-medium">{sent}</p>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={sentIdx === 0}
                                  onClick={() => moveSentence(demo.id, sentIdx, sentIdx - 1)}
                                  className="p-1 rounded bg-card hover:bg-muted border border-border disabled:opacity-30 disabled:pointer-events-none"
                                  title="Di chuyển lên"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={sentIdx === currentSentences.length - 1}
                                  onClick={() => moveSentence(demo.id, sentIdx, sentIdx + 1)}
                                  className="p-1 rounded bg-card hover:bg-muted border border-border disabled:opacity-30 disabled:pointer-events-none"
                                  title="Di chuyển xuống"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {isChecked && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-2 animate-fadeIn">
                          <div className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Trật tự chuẩn xác đề thi:</span>
                          </div>
                          <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                            {demo.correctOrder.map((s, i) => (
                              <li key={i} className="italic">{s}</li>
                            ))}
                          </ol>
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
                    Quy tắc ăn trọn điểm Reading Part 4 (Opinion Matching)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Đọc đoạn văn của 4 nhân vật (Người A, B, C, D) chia sẻ ý kiến về một chủ đề. Có 7 nhận định: Ghép mỗi nhận định với người đã phát biểu ý đó.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  12 đề thi chuẩn British Council
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {READING_PART3_TOPICS.map((topic) => (
                  <div key={topic.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          Đề {topic.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {topic.sticker}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
                        {topic.title}
                      </h4>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                      <div className="font-bold text-foreground">Chiến thuật làm bài nhanh:</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Đọc lướt 7 câu hỏi trước để bắt từ khóa trọng tâm (Keywords) -&gt; Quét nhanh các từ đồng nghĩa (Synonyms) trong phát biểu của từng nhân vật A, B, C, D để nối chuẩn xác 100%.
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">7 câu hỏi nối ý kiến</span>
                      <Link
                        href={`/reading/00000000-0000-0000-0000-000000000001?part=3`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Luyện đề này</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
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
                    Quy tắc ăn trọn điểm Reading Part 5 (Long Reading &amp; Heading Matching)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Bài văn bản dài khoảng 750 từ chia thành 7 đoạn văn. Chọn tiêu đề thích hợp nhất (Heading) cho từng đoạn văn từ danh sách 8 tiêu đề cho trước (có 1 tiêu đề thừa).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  12 bài đọc dài chuẩn B2/C
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {READING_PART4_TOPICS.map((topic) => (
                  <div key={topic.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          Bài {topic.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                          {topic.sticker}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[200px]">
                        {topic.title}
                      </h4>
                    </div>

                    <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                      <div className="font-bold text-foreground">Chiến thuật chọn Heading:</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Đọc câu đầu (Topic sentence) và câu cuối của mỗi đoạn. Tiêu đề đúng luôn tóm tắt ý bao quát (Main Idea) của toàn bộ đoạn văn chứ không chỉ tập trung vào một chi tiết nhỏ (Detail).
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">7 tiêu đề đoạn văn</span>
                      <Link
                        href={`/reading/00000000-0000-0000-0000-000000000001?part=4`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Luyện bài đọc này</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <ReadingGoogleTranslateModal
        isOpen={isTranslateOpen}
        onClose={() => setIsTranslateOpen(false)}
      />
      <Footer />
      <FloatingActions />
    </div>
  );
}

export default function ReadingMarathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReadingMarathonContent />
    </Suspense>
  );
}
