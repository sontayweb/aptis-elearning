"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import { DEFAULT_LISTENING_TEST } from "@/data/listening-benchmark";
import {
  Headphones,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  Users,
  Mic,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

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

function parseOpts(raw: any): string[] {
  if (Array.isArray(raw)) return raw.map((o) => String(o));
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p.map((o) => String(o));
    } catch {}
  }
  return [];
}

function ListeningMarathonContent() {
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
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showTranscripts, setShowTranscripts] = useState<Record<string, boolean>>({});
  const [p1VisibleCount, setP1VisibleCount] = useState(24);

  // Full DB Marathon items
  const [dbItems, setDbItems] = useState<MarathonPartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchMarathon = async () => {
      try {
        setLoading(true);
        const res = await api.exams.getMarathon("LISTENING");
        if (mounted && res.success && Array.isArray(res.data)) {
          setDbItems(res.data);
        }
      } catch (err) {
        console.error("Failed to load Listening Marathon bank:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMarathon();
    return () => {
      mounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handlePlayAudio = (id: string, url?: string | null) => {
    if (!url) return;
    if (playingAudioId === id) {
      if (audioRef.current) audioRef.current.pause();
      setPlayingAudioId(null);
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioId(id);
    audio.play().catch(() => setPlayingAudioId(null));
    audio.onended = () => setPlayingAudioId(null);
  };

  // Group by logicalPart (1..4)
  const p1Items = useMemo(() => {
    const fromDb = dbItems.filter((i) => i.logicalPart === 1 && i.questions.length > 0);
    if (fromDb.length > 0) return fromDb;
    return (DEFAULT_LISTENING_TEST.part1 || []).map((q) => ({
      examId: "",
      partId: `static_p1_${q.num}`,
      title: `Listening Part 1 - Câu ${q.num}`,
      skill: "LISTENING",
      isPro: false,
      hotLevel: 4,
      logicalPart: 1,
      partNumber: 1,
      partTitle: "Part 1 - Information Recognition",
      passageText: q.transcript || null,
      audioUrl: q.audioUrl || null,
      questions: [
        {
          id: `static_p1_q_${q.num}`,
          questionNumber: q.num,
          questionType: "MULTIPLE_CHOICE",
          prompt: q.prompt,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          maxScore: 1,
        },
      ],
    })) as MarathonPartItem[];
  }, [dbItems]);

  const p2Items = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 2 && i.questions.length > 0),
    [dbItems]
  );

  const p3Items = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 3 && i.questions.length > 0),
    [dbItems]
  );

  const p4Items = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 4 && i.questions.length > 0),
    [dbItems]
  );

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
            (q.explanation && q.explanation.toLowerCase().includes(term)) ||
            parseOpts(q.options).some((o) => o.toLowerCase().includes(term))
        )
    );
  };

  const filteredP1 = useMemo(() => filterBySearch(p1Items), [p1Items, searchTerm]);
  const filteredP2 = useMemo(() => filterBySearch(p2Items), [p2Items, searchTerm]);
  const filteredP3 = useMemo(() => filterBySearch(p3Items), [p3Items, searchTerm]);
  const filteredP4 = useMemo(() => filterBySearch(p4Items), [p4Items, searchTerm]);

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
                href={`/listening?tab=p${currentPart}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Listening Full Bank
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Trọn Bộ {p1Items.length + p2Items.length + p3Items.length + p4Items.length} Đề Nghe &amp; Transcript Thật
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Toàn Bộ Đề Nghe Aptis ESOL
                </h1>
              </div>
            </div>

            {/* Quick search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setP1VisibleCount(24);
                }}
                placeholder="Tìm tên đề, câu hỏi, transcript..."
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
                <span
                  className={`text-[10px] font-black uppercase ${
                    currentPart === "1" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Part 1 · {p1Items.length} đề
                </span>
                <Headphones className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Information Recognition
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p1Items.length} câu nghe ngắn
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
                  Part 2 · {p2Items.length} đề
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Speaker Matching (A–D)
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p2Items.length} đề 4 người nói
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
                  Part 3 · {p3Items.length} đề
                </span>
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Opinion Matching
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p3Items.length} đề Man / Woman / Both
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
                  Part 4 · {p4Items.length} đề
                </span>
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Monologue Comprehension
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Full {p4Items.length} bài độc thoại dài
              </p>
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Đang tải trọn bộ ngân hàng đề Listening từ hệ thống...
              </p>
            </div>
          ) : (
            <>
              {/* ================================================================ */}
              {/* 1. PART 1 CONTENT (FULL 325 EXAMS)                               */}
              {/* ================================================================ */}
              {currentPart === "1" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <h3 className="font-heading font-black text-foreground text-sm">
                        Ngân hàng Full {filteredP1.length} Câu Nghe Ngắn Listening Part 1
                      </h3>
                      <p className="text-muted-foreground mt-0.5">
                        Bấm &ldquo;Nghe Audio&rdquo; hoặc dùng trình phát âm thanh, chọn đáp án A/B/C và đối chiếu Transcript chi tiết.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                      Hiển thị {Math.min(p1VisibleCount, filteredP1.length)}/{filteredP1.length} đề
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredP1.slice(0, p1VisibleCount).map((item, idx) => {
                      const q = item.questions[0];
                      if (!q) return null;
                      const opts = parseOpts(q.options);
                      const qKey = item.partId;
                      const userAns = selectedAnswers[qKey];
                      const isChecked = showResults[qKey];
                      const transcriptOpen = showTranscripts[qKey];
                      const isPlaying = playingAudioId === qKey;
                      const transcriptText = item.passageText || q.explanation;

                      return (
                        <div
                          key={item.partId}
                          className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3.5">
                            <div className="flex items-center justify-between border-b border-border/60 pb-3 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0">
                                  #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-foreground truncate">
                                  {item.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {item.audioUrl && (
                                  <button
                                    type="button"
                                    onClick={() => handlePlayAudio(qKey, item.audioUrl)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs ${
                                      isPlaying
                                        ? "bg-amber-500 text-white animate-pulse"
                                        : "bg-primary text-primary-foreground hover:bg-brand-brown"
                                    }`}
                                  >
                                    {isPlaying ? (
                                      <Pause className="w-3.5 h-3.5" />
                                    ) : (
                                      <Play className="w-3.5 h-3.5" />
                                    )}
                                    <span>{isPlaying ? "Đang phát" : "Nghe Audio"}</span>
                                  </button>
                                )}
                                {item.examId && (
                                  <Link
                                    href={`/listening/${item.examId}`}
                                    className="px-2.5 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted text-[11px] font-bold text-foreground"
                                    title="Mở trong phòng thi"
                                  >
                                    Phòng thi
                                  </Link>
                                )}
                              </div>
                            </div>

                            <div className="text-xs md:text-sm font-heading font-extrabold text-foreground leading-relaxed">
                              {q.prompt}
                            </div>

                            <div className="space-y-2">
                              {opts.map((opt, optIdx) => {
                                const isSelected = userAns === opt;
                                const isRight =
                                  q.correctAnswer &&
                                  (opt.trim().toLowerCase() ===
                                    q.correctAnswer.trim().toLowerCase() ||
                                    q.correctAnswer.trim() ===
                                      String.fromCharCode(65 + optIdx));
                                let btnStyle =
                                  "border-border bg-muted/20 hover:bg-muted/60 text-foreground";

                                if (isChecked) {
                                  if (isRight) {
                                    btnStyle =
                                      "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold";
                                  } else if (isSelected) {
                                    btnStyle =
                                      "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                                  }
                                } else if (isSelected) {
                                  btnStyle =
                                    "border-primary bg-primary/10 text-primary font-bold";
                                }

                                return (
                                  <button
                                    key={optIdx}
                                    type="button"
                                    onClick={() =>
                                      setSelectedAnswers((prev) => ({
                                        ...prev,
                                        [qKey]: opt,
                                      }))
                                    }
                                    className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                        {String.fromCharCode(65 + optIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                    {isChecked && isRight && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    )}
                                    {isChecked && isSelected && !isRight && (
                                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-3 pt-2 border-t border-border/40 text-xs">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() =>
                                  setShowResults((prev) => ({
                                    ...prev,
                                    [qKey]: !prev[qKey],
                                  }))
                                }
                                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-bold text-[11px] text-foreground transition-colors"
                              >
                                {isChecked ? "Ẩn kết quả" : "Kiểm tra đáp án"}
                              </button>

                              {transcriptText && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowTranscripts((prev) => ({
                                      ...prev,
                                      [qKey]: !prev[qKey],
                                    }))
                                  }
                                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>
                                    {transcriptOpen ? "Ẩn Transcript" : "Xem Transcript"}
                                  </span>
                                </button>
                              )}
                            </div>

                            {transcriptOpen && transcriptText && (
                              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5">
                                <div className="font-bold text-primary flex items-center gap-1.5 text-[11px] uppercase">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>Transcript &amp; Giải thích:</span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                                  {transcriptText}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {p1VisibleCount < filteredP1.length && (
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setP1VisibleCount((prev) => prev + 30)}
                        className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-sm"
                      >
                        Tải thêm câu hỏi Part 1 ({filteredP1.length - p1VisibleCount} câu còn lại)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ================================================================ */}
              {/* 2. PART 2, 3, 4 CONTENT (FULL MULTI-QUESTION EXAMS)              */}
              {/* ================================================================ */}
              {(currentPart === "2" || currentPart === "3" || currentPart === "4") && (
                <div className="space-y-6">
                  {(() => {
                    const activeList =
                      currentPart === "2"
                        ? filteredP2
                        : currentPart === "3"
                        ? filteredP3
                        : filteredP4;
                    const headerTitle =
                      currentPart === "2"
                        ? `Ngân hàng Full ${activeList.length} Đề Listening Part 2 (Speaker Matching — 4 Người Nói)`
                        : currentPart === "3"
                        ? `Ngân hàng Full ${activeList.length} Đề Listening Part 3 (Hội Thoại Man / Woman / Both)`
                        : `Ngân hàng Full ${activeList.length} Đề Listening Part 4 (Bài Độc Thoại Dài — Monologue)`;

                    return (
                      <>
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div>
                            <h3 className="font-heading font-black text-foreground text-sm">
                              {headerTitle}
                            </h3>
                            <p className="text-muted-foreground mt-0.5">
                              Nghe Audio, làm trực tiếp toàn bộ câu hỏi của từng đề ngay tại đây hoặc bấm &ldquo;Làm trong phòng thi&rdquo;.
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                            Full {activeList.length} đề ({activeList.reduce((s, i) => s + i.questions.length, 0)} câu)
                          </span>
                        </div>

                        <div className="space-y-6">
                          {activeList.map((item, idx) => {
                            const isChecked = showResults[item.partId];
                            const transcriptOpen = showTranscripts[item.partId];
                            const isPlaying = playingAudioId === item.partId;

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
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                        {renderClovers(item.hotLevel)}
                                      </span>
                                    </div>
                                    <h3 className="text-base font-heading font-extrabold text-foreground mt-1">
                                      {item.title}
                                    </h3>
                                  </div>

                                  <div className="flex items-center gap-2 flex-wrap">
                                    {item.audioUrl && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handlePlayAudio(item.partId, item.audioUrl)
                                        }
                                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-xs ${
                                          isPlaying
                                            ? "bg-amber-500 text-white animate-pulse"
                                            : "bg-primary text-primary-foreground hover:bg-brand-brown"
                                        }`}
                                      >
                                        {isPlaying ? (
                                          <Pause className="w-3.5 h-3.5" />
                                        ) : (
                                          <Play className="w-3.5 h-3.5" />
                                        )}
                                        <span>
                                          {isPlaying ? "Đang phát Audio..." : "Nghe Audio bài này"}
                                        </span>
                                      </button>
                                    )}
                                    {item.examId && (
                                      <Link
                                        href={`/listening/${item.examId}`}
                                        className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 hover:bg-muted font-bold text-xs text-foreground"
                                      >
                                        Làm trong phòng thi →
                                      </Link>
                                    )}
                                  </div>
                                </div>

                                {/* Questions */}
                                <div className="space-y-3">
                                  {item.questions.map((q) => {
                                    const opts = parseOpts(q.options);
                                    const userAns = selectedAnswers[q.id] || "";
                                    const isRight =
                                      q.correctAnswer &&
                                      userAns.trim().toLowerCase() ===
                                        q.correctAnswer.trim().toLowerCase();

                                    return (
                                      <div
                                        key={q.id}
                                        className="p-3.5 rounded-xl bg-muted/20 border border-border space-y-2.5"
                                      >
                                        <div className="text-xs font-semibold text-foreground">
                                          <span className="text-primary font-bold mr-1.5">
                                            Câu {q.questionNumber}:
                                          </span>
                                          {q.prompt}
                                        </div>

                                        {currentPart === "2" ? (
                                          /* Dropdown for Part 2 (6 opinions) */
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                            <select
                                              value={userAns}
                                              onChange={(e) =>
                                                setSelectedAnswers((prev) => ({
                                                  ...prev,
                                                  [q.id]: e.target.value,
                                                }))
                                              }
                                              className={`flex-1 p-2 rounded-xl border text-xs font-semibold bg-card focus:outline-none ${
                                                isChecked
                                                  ? isRight
                                                    ? "border-emerald-500 text-emerald-700 dark:text-emerald-300"
                                                    : "border-rose-500 text-rose-700 dark:text-rose-300"
                                                  : "border-border text-foreground"
                                              }`}
                                            >
                                              <option value="">— Chọn quan điểm tương ứng —</option>
                                              {opts.map((opt, oIdx) => (
                                                <option key={oIdx} value={opt}>
                                                  {opt}
                                                </option>
                                              ))}
                                            </select>
                                            {isChecked && q.correctAnswer && (
                                              <span className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold shrink-0">
                                                ✓ {q.correctAnswer}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          /* Option buttons for Part 3 (Man/Woman/Both) & Part 4 (MC) */
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {opts.map((opt, oIdx) => {
                                              const isSelected = userAns === opt;
                                              const optRight =
                                                q.correctAnswer &&
                                                (opt.trim().toLowerCase() ===
                                                  q.correctAnswer.trim().toLowerCase() ||
                                                  q.correctAnswer.trim() ===
                                                    String.fromCharCode(65 + oIdx));
                                              let cls =
                                                "border-border bg-card hover:bg-muted text-foreground";
                                              if (isChecked) {
                                                if (optRight) {
                                                  cls =
                                                    "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold";
                                                } else if (isSelected) {
                                                  cls =
                                                    "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                                                }
                                              } else if (isSelected) {
                                                cls =
                                                  "border-primary bg-primary/10 text-primary font-bold";
                                              }
                                              return (
                                                <button
                                                  key={oIdx}
                                                  type="button"
                                                  onClick={() =>
                                                    setSelectedAnswers((prev) => ({
                                                      ...prev,
                                                      [q.id]: opt,
                                                    }))
                                                  }
                                                  className={`p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between gap-2 ${cls}`}
                                                >
                                                  <span>{opt}</span>
                                                  {isChecked && optRight && (
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                  )}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Footer actions & Transcript */}
                                <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowResults((prev) => ({
                                        ...prev,
                                        [item.partId]: !prev[item.partId],
                                      }))
                                    }
                                    className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-xs shadow-xs"
                                  >
                                    {isChecked ? "Ẩn đáp án" : "Kiểm tra đáp án đề này"}
                                  </button>

                                  {item.passageText && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setShowTranscripts((prev) => ({
                                          ...prev,
                                          [item.partId]: !prev[item.partId],
                                        }))
                                      }
                                      className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      <FileText className="w-3.5 h-3.5" />
                                      <span>
                                        {transcriptOpen ? "Ẩn Transcript" : "Xem Transcript bài nghe"}
                                      </span>
                                    </button>
                                  )}
                                </div>

                                {transcriptOpen && item.passageText && (
                                  <div className="p-4 rounded-xl bg-muted/40 border border-border text-xs leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto">
                                    <div className="font-bold text-primary uppercase text-[11px] mb-1">
                                      Transcript bài nghe:
                                    </div>
                                    {item.passageText}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}

export default function ListeningMarathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ListeningMarathonContent />
    </Suspense>
  );
}
