"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import { READING_PART1_SETS } from "@/data/reading-part1-bank";
import { READING_PART2_BANK } from "@/data/reading-part2-bank";
import {
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Users,
  AlignLeft,
  Languages,
  ExternalLink,
  Globe,
  RefreshCw,
  Play,
  Lock,
} from "lucide-react";
import { ReadingGoogleTranslateModal } from "@/components/reading-google-translate";

interface MarathonQuestion {
  id: string;
  questionNumber: number;
  questionType: string;
  prompt: string;
  options: any;
  correctAnswer: string | null;
  explanation: string | null;
  maxScore: number;
}

interface MarathonPartItem {
  examId: string;
  partId: string;
  title: string;
  description?: string | null;
  skill: string;
  isPro: boolean;
  hotLevel: number;
  logicalPart: number;
  partNumber: number;
  partTitle: string;
  instructions?: string | null;
  passageText?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  questions: MarathonQuestion[];
}

function parseStringArray(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((x) => String(x));
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map((x) => String(x));
    } catch {}
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const fixed = raw.fixedSentence ? [String(raw.fixedSentence)] : [];
    const rest = Array.isArray(raw.sentences)
      ? raw.sentences.map((s: any) => String(s?.text || s || ""))
      : [];
    return [...fixed, ...rest];
  }
  return [];
}

function deterministicShuffle(arr: string[], seedStr: string): string[] {
  if (arr.length <= 2) return [...arr];
  // Keep sentence 1 (index 0) fixed starter, shuffle sentences 2..N deterministically
  const first = arr[0];
  const rest = [...arr.slice(1)];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = rest.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    const tmp = rest[i];
    rest[i] = rest[j];
    rest[j] = tmp;
  }
  // Ensure it's not identical to original order if possible
  if (rest.length > 1 && rest.every((val, idx) => val === arr[idx + 1])) {
    const tmp = rest[0];
    rest[0] = rest[1];
    rest[1] = tmp;
  }
  return [first, ...rest];
}

function ReadingMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "1";

  const [currentPart, setCurrentPart] = useState<"1" | "2" | "3" | "4">(
    initialPart === "2"
      ? "2"
      : initialPart === "3"
      ? "3"
      : initialPart === "4"
      ? "4"
      : "1"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  // Full DB Marathon items
  const [dbItems, setDbItems] = useState<MarathonPartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Interactive user states across Part 1, 2, 3, 4
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [checkedSets, setCheckedSets] = useState<Record<string, boolean>>({});
  const [expandedPassages, setExpandedPassages] = useState<Record<string, boolean>>({});
  const [cohesionOrders, setCohesionOrders] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let mounted = true;
    const fetchMarathon = async () => {
      try {
        setLoading(true);
        const res = await api.exams.getMarathon("READING");
        if (mounted && res.success && Array.isArray(res.data)) {
          setDbItems(res.data);
          // Initialize shuffled orders for Part 2
          const initOrders: Record<string, string[]> = {};
          res.data
            .filter((item: MarathonPartItem) => item.logicalPart === 2)
            .forEach((item: MarathonPartItem) => {
              const q = item.questions[0];
              if (q) {
                const ordered = parseStringArray(q.options);
                if (ordered.length > 0) {
                  initOrders[item.partId] = deterministicShuffle(ordered, item.partId);
                }
              }
            });
          setCohesionOrders(initOrders);
        }
      } catch (err) {
        console.error("Failed to load Reading Marathon bank:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMarathon();
    return () => {
      mounted = false;
    };
  }, []);

  // Group DB items by logicalPart (with fallback to static banks if DB is empty)
  const p1Items = useMemo(() => {
    const fromDb = dbItems.filter((i) => i.logicalPart === 1 && i.questions.length > 0);
    if (fromDb.length > 0) return fromDb;
    return READING_PART1_SETS.map((s) => ({
      examId: "",
      partId: s.id,
      title: s.title,
      skill: "READING",
      isPro: false,
      hotLevel: 5,
      logicalPart: 1,
      partNumber: 1,
      partTitle: "Part 1 - Gap Fill",
      questions: s.questions.map((q, idx) => ({
        id: q.id,
        questionNumber: idx + 1,
        questionType: "GAP_FILL",
        prompt: q.prompt,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.translation || null,
        maxScore: 1,
      })),
    })) as MarathonPartItem[];
  }, [dbItems]);

  const p2Items = useMemo(() => {
    const fromDb = dbItems.filter((i) => i.logicalPart === 2 && i.questions.length > 0);
    if (fromDb.length > 0) return fromDb;
    return READING_PART2_BANK.map((d) => ({
      examId: "",
      partId: `static_p2_${d.id}`,
      title: d.title,
      skill: "READING",
      isPro: false,
      hotLevel: 5,
      logicalPart: 2,
      partNumber: 2,
      partTitle: "Part 2 - Text Cohesion",
      questions: [
        {
          id: `static_p2_q_${d.id}`,
          questionNumber: 1,
          questionType: "SENTENCE_ORDER",
          prompt: d.title,
          options: d.correctOrder,
          correctAnswer: JSON.stringify(d.correctOrder),
          explanation: d.leakKeywordNote || null,
          maxScore: 5,
        },
      ],
    })) as MarathonPartItem[];
  }, [dbItems]);

  const p3Items = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 3 && i.questions.length > 0),
    [dbItems]
  );

  const p4Items = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 4 && i.questions.length > 0),
    [dbItems]
  );

  // Filtered lists by searchTerm
  const filterBySearch = (list: MarathonPartItem[]) => {
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.passageText && item.passageText.toLowerCase().includes(term)) ||
        item.questions.some(
          (q) =>
            q.prompt.toLowerCase().includes(term) ||
            (q.correctAnswer && q.correctAnswer.toLowerCase().includes(term)) ||
            parseStringArray(q.options).some((o) => o.toLowerCase().includes(term))
        )
    );
  };

  const filteredP1 = useMemo(() => filterBySearch(p1Items), [p1Items, searchTerm]);
  const filteredP2 = useMemo(() => filterBySearch(p2Items), [p2Items, searchTerm]);
  const filteredP3 = useMemo(() => filterBySearch(p3Items), [p3Items, searchTerm]);
  const filteredP4 = useMemo(() => filterBySearch(p4Items), [p4Items, searchTerm]);

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const toggleCheckSet = (partId: string) => {
    setCheckedSets((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const handleResetSet = (item: MarathonPartItem) => {
    setAnswers((prev) => {
      const next = { ...prev };
      item.questions.forEach((q) => delete next[q.id]);
      return next;
    });
    setCheckedSets((prev) => ({ ...prev, [item.partId]: false }));
  };

  const moveSentence = (partId: string, defaultCorrect: string[], fromIdx: number, toIdx: number) => {
    setCohesionOrders((prev) => {
      const current = [...(prev[partId] || deterministicShuffle(defaultCorrect, partId))];
      if (toIdx < 0 || toIdx >= current.length) return prev;
      const [moved] = current.splice(fromIdx, 1);
      current.splice(toIdx, 0, moved);
      return { ...prev, [partId]: current };
    });
  };

  const renderClovers = (hotLevel: number) => {
    const count = hotLevel > 0 ? Math.min(5, hotLevel) : 4;
    return "☘️".repeat(count);
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Reading Full Bank
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Trọn Bộ {p1Items.length + p2Items.length + p3Items.length + p4Items.length} Đề Thi Thật Từ CSDL
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Toàn Bộ Đề Đọc Aptis ESOL
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
                  placeholder="Tìm tên đề, từ khóa, nội dung..."
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
                <span
                  className={`text-[10px] font-black uppercase ${
                    currentPart === "1" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Part 1 · Gap Fill
                </span>
                <BookOpen className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Sentence Comprehension
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p1Items.length} bộ đề điền từ ngắn
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
                <span
                  className={`text-[10px] font-black uppercase ${
                    currentPart === "2" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Part 2 · Cohesion
                </span>
                <ArrowUpDown className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Text Cohesion
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p2Items.length} bộ đề sắp xếp câu
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
                <span
                  className={`text-[10px] font-black uppercase ${
                    currentPart === "3" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Part 3 · Opinion
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Opinion Matching
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p3Items.length} bộ đề nối quan điểm A–D
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
                <span
                  className={`text-[10px] font-black uppercase ${
                    currentPart === "4" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Part 4 · Headings
                </span>
                <AlignLeft className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Long Text Comprehension
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p4Items.length} bài đọc dài chọn Heading
              </p>
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Đang tải trọn bộ ngân hàng đề Reading từ hệ thống...
              </p>
            </div>
          ) : (
            <>
              {/* ================================================================ */}
              {/* 1. PART 1 CONTENT (FULL 59 EXAMS)                                */}
              {/* ================================================================ */}
              {currentPart === "1" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h3 className="font-heading font-black text-foreground text-sm">
                        Ngân hàng Full {filteredP1.length} Bộ Đề Reading Part 1 (Gap Fill)
                      </h3>
                      <p className="text-muted-foreground mt-0.5">
                        Chọn từ thích hợp điền vào 5 chỗ trống trong mỗi đề. Có thể làm trực tiếp bên dưới hoặc mở giao diện phòng thi chuẩn.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                      {filteredP1.length} bộ đề ({filteredP1.reduce((s, i) => s + i.questions.length, 0)} câu)
                    </span>
                  </div>

                  <div className="space-y-6">
                    {filteredP1.map((item, idx) => {
                      const isChecked = checkedSets[item.partId];
                      const correctCount = item.questions.filter(
                        (q) =>
                          answers[q.id] &&
                          q.correctAnswer &&
                          answers[q.id].trim().toLowerCase() ===
                            q.correctAnswer.trim().toLowerCase()
                      ).length;

                      return (
                        <div
                          key={item.partId}
                          className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                  Bộ #{idx + 1}
                                </span>
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {renderClovers(item.hotLevel)} Đề thi thật
                                </span>
                                {isChecked && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                    Kết quả: {correctCount}/{item.questions.length} câu đúng
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                                {item.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {item.examId && (
                                <Link
                                  href={`/reading/${item.examId}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-all"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Làm trong phòng thi</span>
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => handleResetSet(item)}
                                className="p-1.5 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Làm lại bộ này"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {item.questions.map((q) => {
                              const opts = parseStringArray(q.options);
                              const userAns = answers[q.id];
                              const fullSent = q.prompt.replace(
                                "[gap]",
                                q.correctAnswer || "___"
                              );
                              const googleTranslateUrl = `https://translate.google.com/?sl=en&tl=vi&text=${encodeURIComponent(
                                fullSent
                              )}&op=translate`;

                              return (
                                <div
                                  key={q.id}
                                  className="p-4 rounded-xl bg-muted/20 border border-border space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="text-xs font-semibold text-foreground leading-relaxed">
                                      <span className="text-primary font-bold mr-1">
                                        Câu {q.questionNumber}:
                                      </span>
                                      {q.prompt.includes("[gap]") ? (
                                        <>
                                          <span>{q.prompt.split("[gap]")[0]}</span>
                                          <span className="px-2 py-0.5 mx-1 rounded bg-primary/15 text-primary font-bold">
                                            {userAns || "___"}
                                          </span>
                                          <span>{q.prompt.split("[gap]")[1]}</span>
                                        </>
                                      ) : (
                                        q.prompt
                                      )}
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
                                    {opts.map((opt) => {
                                      const isSelected = userAns === opt;
                                      const isRight =
                                        q.correctAnswer &&
                                        opt.trim().toLowerCase() ===
                                          q.correctAnswer.trim().toLowerCase();
                                      let style =
                                        "border-border bg-card hover:bg-muted text-foreground";

                                      if (isChecked) {
                                        if (isRight) {
                                          style =
                                            "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold";
                                        } else if (isSelected) {
                                          style =
                                            "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                                        }
                                      } else if (isSelected) {
                                        style =
                                          "border-primary bg-primary/10 text-primary font-bold";
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

                                  {isChecked && q.explanation && (
                                    <div className="text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                                      <strong>Giải thích:</strong> {q.explanation}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => toggleCheckSet(item.partId)}
                              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                            >
                              {isChecked
                                ? "Ẩn đáp án bộ đề này"
                                : "Kiểm tra đáp án bộ đề này"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* 2. PART 2 CONTENT (FULL 50 EXAMS)                                */}
              {/* ================================================================ */}
              {currentPart === "2" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h3 className="font-heading font-black text-foreground text-sm">
                        Ngân hàng Full {filteredP2.length} Bộ Đề Reading Part 2 (Text Cohesion)
                      </h3>
                      <p className="text-muted-foreground mt-0.5">
                        Câu số 1 là câu mở đầu cố định. Dùng mũi tên lên/xuống để sắp xếp các câu còn lại thành đoạn văn hoàn chỉnh và bấm &ldquo;Kiểm tra trật tự&rdquo;.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                      Full {filteredP2.length} đề sắp xếp câu
                    </span>
                  </div>

                  <div className="space-y-6">
                    {filteredP2.map((item, idx) => {
                      const q = item.questions[0];
                      if (!q) return null;
                      const correctOrder = parseStringArray(q.options);
                      const currentSentences =
                        cohesionOrders[item.partId] ||
                        deterministicShuffle(correctOrder, item.partId);
                      const isChecked = checkedSets[item.partId];

                      return (
                        <div
                          key={item.partId}
                          className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                  Đề #{idx + 1}
                                </span>
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {renderClovers(item.hotLevel)}
                                </span>
                                <h4 className="font-heading font-bold text-sm text-foreground">
                                  {item.title}
                                </h4>
                              </div>
                              {q.prompt && q.prompt !== item.title && (
                                <p className="text-xs text-muted-foreground font-semibold mt-1">
                                  Chủ đề đoạn văn: <strong className="text-foreground">{q.prompt}</strong>
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {item.examId && (
                                <Link
                                  href={`/reading/${item.examId}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-all"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Phòng thi</span>
                                </Link>
                              )}
                              <button
                                type="button"
                                onClick={() => toggleCheckSet(item.partId)}
                                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                              >
                                {isChecked ? "Ẩn đáp án đúng" : "Kiểm tra trật tự"}
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2.5">
                            {currentSentences.map((sent, sentIdx) => {
                              const isFirstFixed = sentIdx === 0;
                              const isMatch = sent === correctOrder[sentIdx];

                              let cardBorder = isFirstFixed
                                ? "border-amber-500/40 bg-amber-500/10"
                                : "border-border bg-muted/20";
                              if (isChecked && !isFirstFixed) {
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
                                    <span
                                      className={`px-2 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0 ${
                                        isFirstFixed
                                          ? "bg-amber-600 text-white"
                                          : "bg-card border border-border text-primary"
                                      }`}
                                    >
                                      {isFirstFixed ? (
                                        <>
                                          <Lock className="w-3 h-3" /> Câu 1 (Cố định)
                                        </>
                                      ) : (
                                        `#${sentIdx + 1}`
                                      )}
                                    </span>
                                    <p className="leading-relaxed font-medium">{sent}</p>
                                  </div>

                                  {!isFirstFixed && (
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        disabled={sentIdx <= 1}
                                        onClick={() =>
                                          moveSentence(
                                            item.partId,
                                            correctOrder,
                                            sentIdx,
                                            sentIdx - 1
                                          )
                                        }
                                        className="p-1 rounded bg-card hover:bg-muted border border-border disabled:opacity-30"
                                        title="Di chuyển lên"
                                      >
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={sentIdx === currentSentences.length - 1}
                                        onClick={() =>
                                          moveSentence(
                                            item.partId,
                                            correctOrder,
                                            sentIdx,
                                            sentIdx + 1
                                          )
                                        }
                                        className="p-1 rounded bg-card hover:bg-muted border border-border disabled:opacity-30"
                                        title="Di chuyển xuống"
                                      >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {isChecked && (
                            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
                              <div className="font-bold flex items-center gap-1.5 uppercase text-[11px]">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Trật tự chuẩn xác đề thi:</span>
                              </div>
                              <ol className="list-decimal list-inside space-y-1 leading-relaxed">
                                {correctOrder.map((s, i) => (
                                  <li key={i} className="font-medium">
                                    {s}
                                  </li>
                                ))}
                              </ol>
                              {q.explanation && (
                                <p className="pt-2 border-t border-emerald-500/20 text-[11px] italic">
                                  <strong>Giải thích:</strong> {q.explanation}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* 3. PART 3 CONTENT (FULL 85 OPINION MATCHING EXAMS)               */}
              {/* ================================================================ */}
              {currentPart === "3" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h3 className="font-heading font-black text-foreground text-sm">
                        Ngân hàng Full {filteredP3.length} Bộ Đề Reading Part 3 (Opinion Matching A–D)
                      </h3>
                      <p className="text-muted-foreground mt-0.5">
                        Đọc đoạn văn của 4 người (A, B, C, D) và nối 7 câu hỏi &ldquo;Who...?&rdquo; ngay bên dưới hoặc bấm &ldquo;Làm trong phòng thi&rdquo;.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                      Full {filteredP3.length} đề ({filteredP3.reduce((s, i) => s + i.questions.length, 0)} câu)
                    </span>
                  </div>

                  <div className="space-y-6">
                    {filteredP3.map((item, idx) => {
                      const isChecked = checkedSets[item.partId];
                      const isPassageOpen = expandedPassages[item.partId] ?? true;
                      const correctCount = item.questions.filter(
                        (q) =>
                          answers[q.id] &&
                          q.correctAnswer &&
                          answers[q.id].trim().toLowerCase() ===
                            q.correctAnswer.trim().toLowerCase()
                      ).length;

                      return (
                        <div
                          key={item.partId}
                          className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                  Đề #{idx + 1}
                                </span>
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {renderClovers(item.hotLevel)}
                                </span>
                                {isChecked && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                    Đúng {correctCount}/{item.questions.length} câu
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                                {item.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedPassages((prev) => ({
                                    ...prev,
                                    [item.partId]: !isPassageOpen,
                                  }))
                                }
                                className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-bold text-xs text-foreground"
                              >
                                {isPassageOpen ? "Thu gọn bài đọc" : "Mở bài đọc 4 người"}
                              </button>
                              {item.examId && (
                                <Link
                                  href={`/reading/${item.examId}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Làm trong phòng thi</span>
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* Passage Text */}
                          {isPassageOpen && item.passageText && (
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto font-sans">
                              {item.passageText}
                            </div>
                          )}

                          {/* 7 Questions */}
                          <div className="space-y-2.5">
                            {item.questions.map((q) => {
                              const rawOpts = parseStringArray(q.options);
                              const opts =
                                rawOpts.length > 0 ? rawOpts : ["A", "B", "C", "D"];
                              const userAns = answers[q.id];

                              return (
                                <div
                                  key={q.id}
                                  className="p-3.5 rounded-xl bg-muted/20 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                >
                                  <div className="text-xs font-semibold text-foreground flex-1">
                                    <span className="text-primary font-bold mr-1.5">
                                      Câu {q.questionNumber}:
                                    </span>
                                    {q.prompt}
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                    {opts.map((opt) => {
                                      const isSelected = userAns === opt;
                                      const isRight =
                                        q.correctAnswer &&
                                        opt.trim().toLowerCase() ===
                                          q.correctAnswer.trim().toLowerCase();
                                      let btnCls =
                                        "border-border bg-card hover:bg-muted text-foreground";
                                      if (isChecked) {
                                        if (isRight) {
                                          btnCls =
                                            "border-emerald-500 bg-emerald-600 text-white font-bold";
                                        } else if (isSelected) {
                                          btnCls =
                                            "border-rose-500 bg-rose-500/20 text-rose-700 dark:text-rose-300";
                                        }
                                      } else if (isSelected) {
                                        btnCls =
                                          "border-primary bg-primary text-primary-foreground font-bold";
                                      }

                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => handleSelectOption(q.id, opt)}
                                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${btnCls}`}
                                        >
                                          {opt}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleResetSet(item)}
                              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-semibold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Làm lại
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCheckSet(item.partId)}
                              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                            >
                              {isChecked ? "Ẩn đáp án" : "Kiểm tra đáp án đề này"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* 4. PART 4 CONTENT (FULL 83 LONG READING HEADING EXAMS)           */}
              {/* ================================================================ */}
              {currentPart === "4" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h3 className="font-heading font-black text-foreground text-sm">
                        Ngân hàng Full {filteredP4.length} Bài Đọc Dài Reading Part 4 (Long Text Headings)
                      </h3>
                      <p className="text-muted-foreground mt-0.5">
                        Chọn tiêu đề (Heading) phù hợp nhất cho 7 đoạn văn trong mỗi bài đọc dài hoặc bấm &ldquo;Làm trong phòng thi&rdquo;.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                      Full {filteredP4.length} bài đọc dài ({filteredP4.reduce((s, i) => s + i.questions.length, 0)} câu)
                    </span>
                  </div>

                  <div className="space-y-6">
                    {filteredP4.map((item, idx) => {
                      const isChecked = checkedSets[item.partId];
                      const isPassageOpen = expandedPassages[item.partId] ?? false;
                      const correctCount = item.questions.filter(
                        (q) =>
                          answers[q.id] &&
                          q.correctAnswer &&
                          answers[q.id].trim().toLowerCase() ===
                            q.correctAnswer.trim().toLowerCase()
                      ).length;

                      return (
                        <div
                          key={item.partId}
                          className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                                  Bài #{idx + 1}
                                </span>
                                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                  {renderClovers(item.hotLevel)}
                                </span>
                                {isChecked && (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                    Đúng {correctCount}/{item.questions.length} đoạn
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                                {item.title}
                              </h3>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {item.passageText && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedPassages((prev) => ({
                                      ...prev,
                                      [item.partId]: !isPassageOpen,
                                    }))
                                  }
                                  className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-bold text-xs text-foreground"
                                >
                                  {isPassageOpen ? "Ẩn toàn văn bài đọc" : "Xem toàn văn bài đọc"}
                                </button>
                              )}
                              {item.examId && (
                                <Link
                                  href={`/reading/${item.examId}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                                >
                                  <Play className="w-3.5 h-3.5" />
                                  <span>Làm trong phòng thi</span>
                                </Link>
                              )}
                            </div>
                          </div>

                          {isPassageOpen && item.passageText && (
                            <div className="p-4 rounded-xl bg-muted/30 border border-border/80 text-xs leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto">
                              {item.passageText}
                            </div>
                          )}

                          <div className="space-y-3">
                            {item.questions.map((q) => {
                              const opts = parseStringArray(q.options);
                              const userAns = answers[q.id] || "";
                              const isRight =
                                q.correctAnswer &&
                                userAns.trim().toLowerCase() ===
                                  q.correctAnswer.trim().toLowerCase();

                              return (
                                <div
                                  key={q.id}
                                  className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2"
                                >
                                  <div className="text-xs font-medium text-foreground leading-relaxed">
                                    <span className="font-bold text-primary mr-1.5">
                                      Đoạn {q.questionNumber}:
                                    </span>
                                    {q.prompt}
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <select
                                      value={userAns}
                                      onChange={(e) => handleSelectOption(q.id, e.target.value)}
                                      className={`flex-1 p-2 rounded-xl border text-xs font-semibold bg-card focus:outline-none ${
                                        isChecked
                                          ? isRight
                                            ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                                            : "border-rose-500 text-rose-700 dark:text-rose-300"
                                          : "border-border text-foreground"
                                      }`}
                                    >
                                      <option value="">— Chọn tiêu đề (Heading) cho đoạn {q.questionNumber} —</option>
                                      {opts.map((opt, oIdx) => (
                                        <option key={oIdx} value={opt}>
                                          {String.fromCharCode(65 + oIdx)}. {opt}
                                        </option>
                                      ))}
                                    </select>

                                    {isChecked && q.correctAnswer && (
                                      <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold shrink-0">
                                        ✓ Đáp án: {q.correctAnswer}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="pt-2 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => handleResetSet(item)}
                              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-semibold"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Làm lại
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleCheckSet(item.partId)}
                              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                            >
                              {isChecked ? "Ẩn đáp án" : "Kiểm tra 7 tiêu đề bài này"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
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
