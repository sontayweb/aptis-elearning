"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  SPEAKING_PART1_UNITS,
  SpeakingPart1Unit,
} from "@/data/speaking-part1-bank";
import { SPEAKING_PART2_BANK } from "@/data/speaking-part2-bank";
import { SPEAKING_PART3_BANK } from "@/data/speaking-part3-bank";
import { SPEAKING_PART4_BANK } from "@/data/speaking-part4-bank";
import {
  Mic,
  MicOff,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Play,
  Pause,
  X,
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

function parseSpeakingImages(raw?: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((u) => String(u).trim()).filter(Boolean);
      }
    } catch {}
  }
  return trimmed
    .split(",")
    .map((s) => s.replace(/^[\["']+|[\]"']+$/g, "").trim())
    .filter(Boolean);
}

function SpeakingMarathonContent() {
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
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [expandedVocabId, setExpandedVocabId] = useState<string | null>(null);
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null);

  // Full DB Marathon items
  const [dbItems, setDbItems] = useState<MarathonPartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active question modal / practice runner
  const [activeQuestion, setActiveQuestion] = useState<{
    part: number;
    title: string;
    prompt: string;
    sampleAnswer?: string;
    imageUrl?: string;
    vocab?: { en: string; vi: string }[];
    timeLimit: number;
  } | null>(null);

  // Practice runner state
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showSampleInModal, setShowSampleInModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const actualMimeTypeRef = useRef<string>("");

  const formatAudioTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    let mounted = true;
    const fetchMarathon = async () => {
      try {
        setLoading(true);
        const res = await api.exams.getMarathon("SPEAKING");
        if (mounted && res.success && Array.isArray(res.data)) {
          setDbItems(res.data);
        }
      } catch (err) {
        console.error("Failed to load Speaking Marathon bank:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchMarathon();
    return () => {
      mounted = false;
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        try {
          mediaRecorderRef.current.stop();
        } catch {}
      }
      if (audioPlayerRef.current) {
        try {
          audioPlayerRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // Build combined Part 1 Units: DB Part 1 Exams + Static Topic Units
  const p1UnitsCombined = useMemo(() => {
    const dbP1 = dbItems.filter((i) => i.logicalPart === 1 && i.questions.length > 0);
    const dbUnits: SpeakingPart1Unit[] =
      dbP1.length > 0
        ? [
            {
              id: "db_part1_exams",
              unit: "UNIT 0",
              title: `UNIT 0: Trọn Bộ ${dbP1.length} Đề Thi Thật Speaking Part 1 (Chuẩn CSDL)`,
              description: `Tổng hợp toàn bộ ${dbP1.length} đề thi thật Speaking Part 1 có trong hệ thống CSDL với bài mẫu chuẩn B1/B2.`,
              goal: "3 câu hỏi phỏng vấn cá nhân / đề kèm bài mẫu B1-B2",
              questions: dbP1.flatMap((examItem) =>
                examItem.questions.map((q) => ({
                  id: q.id,
                  qLabel: `${examItem.title} · Câu ${q.questionNumber}`,
                  prompt: q.prompt,
                  sampleAnswer: q.explanation || undefined,
                }))
              ),
            },
          ]
        : [];
    return [...dbUnits, ...SPEAKING_PART1_UNITS];
  }, [dbItems]);

  const filteredP1Units = useMemo(() => {
    return p1UnitsCombined
      .map((unit) => {
        if (selectedUnit !== "all" && unit.id !== selectedUnit) return null;
        const matchedQ = unit.questions.filter(
          (q) =>
            q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (q.qLabel && q.qLabel.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        if (matchedQ.length === 0) return null;
        return { ...unit, questions: matchedQ };
      })
      .filter(Boolean) as SpeakingPart1Unit[];
  }, [p1UnitsCombined, searchTerm, selectedUnit]);

  // Part 2 Full DB Topics (46 exams in DB, enriched with vocab from SPEAKING_PART2_BANK when matching)
  const p2CombinedTopics = useMemo(() => {
    const dbP2 = dbItems.filter((i) => i.logicalPart === 2 && i.questions.length > 0);
    if (dbP2.length > 0) {
      return dbP2.map((item, idx) => {
        const matchedStatic = SPEAKING_PART2_BANK.find(
          (st) =>
            item.title.toLowerCase().includes(st.title.toLowerCase()) ||
            (st.imageUrl && item.imageUrl && item.imageUrl.includes(st.imageUrl))
        );
        const imgs = parseSpeakingImages(item.imageUrl);
        return {
          id: item.partId,
          examId: item.examId,
          topicNumber: idx + 1,
          title: item.title,
          imageUrl: imgs[0] || item.imageUrl || matchedStatic?.imageUrl || "",
          questions: item.questions.map((q) => q.prompt),
          sampleAnswers: item.questions.map((q) => q.explanation || ""),
          vocab: matchedStatic?.vocab || [],
        };
      });
    }
    return SPEAKING_PART2_BANK.map((st) => ({
      ...st,
      examId: "",
      sampleAnswers: [] as string[],
    }));
  }, [dbItems]);

  const filteredP2Topics = useMemo(() => {
    if (!searchTerm.trim()) return p2CombinedTopics;
    const term = searchTerm.toLowerCase();
    return p2CombinedTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(term) ||
        topic.questions.some((q) => q.toLowerCase().includes(term)) ||
        topic.vocab.some(
          (v) => v.en.toLowerCase().includes(term) || v.vi.toLowerCase().includes(term)
        )
    );
  }, [p2CombinedTopics, searchTerm]);

  // Part 3 Full DB Topics (51 exams in DB, enriched with vocab from SPEAKING_PART3_BANK when matching)
  const p3CombinedTopics = useMemo(() => {
    const dbP3 = dbItems.filter((i) => i.logicalPart === 3 && i.questions.length > 0);
    if (dbP3.length > 0) {
      return dbP3.map((item, idx) => {
        const matchedStatic = SPEAKING_PART3_BANK.find((st) =>
          item.title.toLowerCase().includes(st.title.toLowerCase())
        );
        const imgs = parseSpeakingImages(item.imageUrl);
        return {
          id: item.partId,
          examId: item.examId,
          topicNumber: idx + 1,
          title: item.title,
          imageUrl: imgs.join(", ") || item.imageUrl || matchedStatic?.imageUrl || "",
          imagesList: imgs,
          questions: item.questions.map((q) => q.prompt),
          sampleAnswers: item.questions.map((q) => q.explanation || ""),
          vocab: matchedStatic?.vocab || [],
        };
      });
    }
    return SPEAKING_PART3_BANK.map((st) => ({
      ...st,
      examId: "",
      imagesList: parseSpeakingImages(st.imageUrl),
      sampleAnswers: [] as string[],
    }));
  }, [dbItems]);

  const filteredP3Topics = useMemo(() => {
    if (!searchTerm.trim()) return p3CombinedTopics;
    const term = searchTerm.toLowerCase();
    return p3CombinedTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(term) ||
        topic.questions.some((q) => q.toLowerCase().includes(term)) ||
        topic.vocab.some(
          (v) => v.en.toLowerCase().includes(term) || v.vi.toLowerCase().includes(term)
        )
    );
  }, [p3CombinedTopics, searchTerm]);

  // Part 4 Full DB Exams (53 exams in DB) + 6 Universal Clusters
  const p4DbExams = useMemo(
    () => dbItems.filter((i) => i.logicalPart === 4 && i.questions.length > 0),
    [dbItems]
  );

  const filteredP4DbExams = useMemo(() => {
    if (!searchTerm.trim()) return p4DbExams;
    const term = searchTerm.toLowerCase();
    return p4DbExams.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.questions.some(
          (q) =>
            q.prompt.toLowerCase().includes(term) ||
            (q.explanation && q.explanation.toLowerCase().includes(term))
        )
    );
  }, [p4DbExams, searchTerm]);

  const filteredP4Clusters = useMemo(() => {
    return SPEAKING_PART4_BANK.filter((cluster) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        cluster.title.toLowerCase().includes(term) ||
        cluster.coverage.toLowerCase().includes(term) ||
        cluster.story.toLowerCase().includes(term) ||
        cluster.sampleSpeech.toLowerCase().includes(term)
      );
    });
  }, [searchTerm]);

  const cleanupAudio = () => {
    if (audioPlayerRef.current) {
      try {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.currentTime = 0;
      } catch {}
    }
    setIsPlayingAudio(false);
    setCurrentPlayTime(0);
    setAudioDuration(0);
    if (audioBlobUrl) {
      try {
        URL.revokeObjectURL(audioBlobUrl);
      } catch {}
    }
  };

  const openPracticeModal = (params: {
    part: number;
    title: string;
    prompt: string;
    sampleAnswer?: string;
    imageUrl?: string;
    vocab?: { en: string; vi: string }[];
    timeLimit: number;
  }) => {
    cleanupAudio();
    setActiveQuestion(params);
    setTimeLeft(params.timeLimit);
    setIsRecording(false);
    setAudioBlobUrl(null);
    setShowSampleInModal(false);
  };

  const closePracticeModal = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupAudio();
    setActiveQuestion(null);
    setIsRecording(false);
    setAudioBlobUrl(null);
  };

  const startRecording = async () => {
    cleanupAudio();
    setAudioBlobUrl(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "";
      const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
        "audio/aac",
      ];
      for (const cand of candidates) {
        if (
          typeof MediaRecorder !== "undefined" &&
          MediaRecorder.isTypeSupported(cand)
        ) {
          mimeType = cand;
          break;
        }
      }
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
      actualMimeTypeRef.current = actualType;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualType });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setTimeLeft(activeQuestion?.timeLimit || 30);

      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert(
        "Vui lòng cấp quyền truy cập Microphone trong trình duyệt để luyện nói."
      );
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const togglePlayAudio = () => {
    const audio = audioPlayerRef.current;
    if (!audio || !audioBlobUrl) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      if (audio.ended || (audio.duration && audio.currentTime >= audio.duration)) {
        audio.currentTime = 0;
      }
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlayingAudio(true))
          .catch(() => setIsPlayingAudio(false));
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[calc(var(--navbar-total-height,64px)+16px)] pb-16">
        <div className="section-container">
          {/* Back Button & Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link
                href={`/speaking?tab=p${currentPart}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Speaking Full Bank
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Trọn Bộ Đề Thi Thật &amp; Tranh Trọng Điểm Từ CSDL
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Toàn Bộ Đề Nói Aptis ESOL
                </h1>
              </div>
            </div>

            {/* Quick Part Switcher */}
            <div className="flex flex-wrap items-center p-1 rounded-xl bg-muted/60 border border-border gap-1">
              <button
                type="button"
                onClick={() => {
                  setCurrentPart("1");
                  setSelectedUnit("all");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "1"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 1 (Cá nhân)
              </button>
              <button
                type="button"
                onClick={() => setCurrentPart("2")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "2"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 2 ({p2CombinedTopics.length} Đề Tranh)
              </button>
              <button
                type="button"
                onClick={() => setCurrentPart("3")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "3"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 3 ({p3CombinedTopics.length} Cặp Tranh)
              </button>
              <button
                type="button"
                onClick={() => setCurrentPart("4")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currentPart === "4"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Part 4 ({p4DbExams.length || 6} Đề Thảo Luận)
              </button>
            </div>
          </div>

          {/* Search & Unit Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  currentPart === "1"
                    ? "Tìm kiếm câu hỏi Part 1 (family, hobbies, hometown...)"
                    : currentPart === "2"
                    ? "Tìm kiếm đề tranh Part 2 hoặc câu hỏi..."
                    : currentPart === "3"
                    ? "Tìm kiếm cặp tranh Part 3..."
                    : "Tìm kiếm đề thảo luận Part 4..."
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-xs sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              />
            </div>

            {currentPart === "1" && (
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-input bg-card text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
              >
                <option value="all">Tất cả Unit ({p1UnitsCombined.length})</option>
                {p1UnitsCombined.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title.replace(/^UNIT\s*\d*:\s*/i, "")} ({u.questions.length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-primary" />
              <p className="text-xs text-muted-foreground font-semibold">
                Đang tải trọn bộ ngân hàng đề Speaking từ hệ thống...
              </p>
            </div>
          ) : (
            <>
              {/* ========================================================= */}
              {/* 1. PART 1 MARATHON DISPLAY                                */}
              {/* ========================================================= */}
              {currentPart === "1" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        Ngân Hàng Câu Hỏi &amp; Bộ Đề Thi Thật Speaking Part 1 Kèm Bài Mẫu B2/C1
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mỗi câu hỏi có 30 giây trả lời. Nhấn nút &ldquo;Luyện nói&rdquo; để ghi âm và nghe lại bài nói của bạn.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      {filteredP1Units.reduce((acc, u) => acc + u.questions.length, 0)} Câu hỏi
                    </span>
                  </div>

                  {filteredP1Units.map((unit) => (
                    <div
                      key={unit.id}
                      className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-xs space-y-4"
                    >
                      <div className="flex items-center justify-between border-b border-border/50 pb-3">
                        <div>
                          <h3 className="font-heading font-extrabold text-base text-foreground">
                            {unit.title}
                          </h3>
                          {unit.goal && (
                            <p className="text-xs text-muted-foreground italic mt-0.5">
                              Mục tiêu: {unit.goal}
                            </p>
                          )}
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-muted text-muted-foreground font-bold text-xs">
                          {unit.questions.length} câu
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {unit.questions.map((q, idx) => (
                          <div
                            key={q.id || idx}
                            className="rounded-xl border border-border/80 bg-background hover:border-primary/50 p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-xs group"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="text-[10px] font-bold text-primary uppercase">
                                  {q.qLabel || `Câu ${idx + 1}`}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> 30s
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug">
                                {q.prompt}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                              {q.sampleAnswer ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                  <Sparkles className="w-3 h-3" /> Có bài mẫu B2
                                </span>
                              ) : (
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  Chuẩn Part 1
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  openPracticeModal({
                                    part: 1,
                                    title: unit.title,
                                    prompt: q.prompt,
                                    sampleAnswer: q.sampleAnswer,
                                    timeLimit: 30,
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                <span>Luyện nói</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ========================================================= */}
              {/* 2. PART 2 MARATHON DISPLAY (FULL 46 TRANH THI THẬT)       */}
              {/* ========================================================= */}
              {currentPart === "2" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        Trọn Bộ {filteredP2Topics.length} Đề Tranh Thi Thật Speaking Part 2 Kèm Bài Mẫu &amp; Từ Vựng
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Mỗi tranh có 3 câu hỏi (45s/câu). Bấm vào từng câu để ghi âm luyện nói hoặc mở trong phòng thi chuẩn.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      Full {filteredP2Topics.length} Đề Tranh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredP2Topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Topic Image */}
                          <div className="relative aspect-[16/10] bg-muted/30 overflow-hidden border-b border-border/60">
                            {topic.imageUrl ? (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img
                                src={topic.imageUrl}
                                alt={topic.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                Chưa có ảnh
                              </div>
                            )}
                            <div className="absolute top-2.5 left-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-black/70 text-white font-bold text-[10px] backdrop-blur-xs">
                                Đề Tranh #{topic.topicNumber < 10 ? `0${topic.topicNumber}` : topic.topicNumber}
                              </span>
                            </div>
                          </div>

                          {/* Title & Questions */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-heading font-bold text-sm text-foreground">
                                {topic.title}
                              </h3>
                              {topic.examId && (
                                <Link
                                  href={`/speaking/${topic.examId}`}
                                  className="text-[11px] font-bold text-primary hover:underline shrink-0"
                                >
                                  Phòng thi →
                                </Link>
                              )}
                            </div>

                            {/* 3 Questions */}
                            <div className="space-y-1.5">
                              {topic.questions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() =>
                                    openPracticeModal({
                                      part: 2,
                                      title: `${topic.title} · Câu ${qIdx + 1}`,
                                      prompt: q,
                                      sampleAnswer: topic.sampleAnswers?.[qIdx],
                                      imageUrl: topic.imageUrl,
                                      vocab: topic.vocab,
                                      timeLimit: 45,
                                    })
                                  }
                                  className="w-full text-left text-xs text-foreground/90 font-medium flex items-start gap-1.5 bg-muted/30 hover:bg-primary/10 p-2 rounded-lg transition-colors"
                                  title="Bấm để luyện nói câu này"
                                >
                                  <span className="text-primary font-bold shrink-0">
                                    {qIdx + 1}.
                                  </span>
                                  <span className="flex-1">{q}</span>
                                  <Mic className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                                </button>
                              ))}
                            </div>

                            {/* Sample Answer Preview Toggle */}
                            {topic.sampleAnswers && topic.sampleAnswers.some(Boolean) && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSampleId(
                                      expandedSampleId === topic.id ? null : topic.id
                                    )
                                  }
                                  className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Xem bài nói mẫu B1/B2 (3 câu)
                                  </span>
                                  {expandedSampleId === topic.id ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {expandedSampleId === topic.id && (
                                  <div className="mt-1.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-2 max-h-56 overflow-y-auto">
                                    {topic.sampleAnswers.map((ans, aIdx) =>
                                      ans ? (
                                        <div key={aIdx}>
                                          <strong className="text-emerald-700 dark:text-emerald-300">
                                            Câu {aIdx + 1}:
                                          </strong>{" "}
                                          <span className="whitespace-pre-line">{ans}</span>
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Vocabulary Accordion */}
                            {topic.vocab && topic.vocab.length > 0 && (
                              <div className="pt-2 border-t border-border/50">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedVocabId(
                                      expandedVocabId === topic.id ? null : topic.id
                                    )
                                  }
                                  className="w-full flex items-center justify-between text-xs font-bold text-primary hover:underline py-1"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Từ vựng theo tranh ({topic.vocab.length} từ)
                                  </span>
                                  {expandedVocabId === topic.id ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {expandedVocabId === topic.id && (
                                  <div className="mt-2 p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] space-y-1 max-h-48 overflow-y-auto">
                                    {topic.vocab.map((v, vIdx) => (
                                      <div key={vIdx} className="grid grid-cols-2 py-0.5">
                                        <span className="font-semibold text-foreground">
                                          {v.en}
                                        </span>
                                        <span className="text-muted-foreground">{v.vi}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bottom Action */}
                        <div className="p-4 pt-0 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openPracticeModal({
                                part: 2,
                                title: topic.title,
                                prompt:
                                  topic.questions[0] ||
                                  "Describe what you see in the picture.",
                                sampleAnswer: topic.sampleAnswers?.[0],
                                imageUrl: topic.imageUrl,
                                vocab: topic.vocab,
                                timeLimit: 45,
                              })
                            }
                            className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Luyện nói tranh này (45s)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. PART 3 MARATHON DISPLAY (FULL 51 CẶP TRANH SO SÁNH)    */}
              {/* ========================================================= */}
              {currentPart === "3" && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-bold text-sm text-foreground">
                        Trọn Bộ {filteredP3Topics.length} Cặp Tranh So Sánh Speaking Part 3 Kèm Bài Mẫu B1/B2
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        So sánh 2 bức ảnh Picture 1 &amp; Picture 2 và trả lời 2 câu hỏi phụ (45s/câu). Bấm vào từng câu để ghi âm hoặc mở phòng thi.
                      </p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                      Full {filteredP3Topics.length} Cặp Tranh
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredP3Topics.map((topic) => (
                      <div
                        key={topic.id}
                        className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Dual Topic Image */}
                          <div className="relative aspect-[16/10] bg-muted/30 overflow-hidden border-b border-border/60">
                            {(() => {
                              const imgs = topic.imagesList || parseSpeakingImages(topic.imageUrl);
                              if (imgs.length >= 2) {
                                return (
                                  <div className="grid grid-cols-2 h-full w-full">
                                    <div className="relative h-full overflow-hidden border-r border-border/40">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imgs[0]}
                                        alt={`${topic.title} - Picture 1`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px]">
                                        Picture 1
                                      </span>
                                    </div>
                                    <div className="relative h-full overflow-hidden">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={imgs[1]}
                                        alt={`${topic.title} - Picture 2`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                        loading="lazy"
                                      />
                                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px]">
                                        Picture 2
                                      </span>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={imgs[0] || topic.imageUrl}
                                  alt={topic.title}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              );
                            })()}
                            <div className="absolute top-2.5 left-2.5 z-10">
                              <span className="px-2 py-0.5 rounded-md bg-purple-700/90 text-white font-bold text-[10px] shadow-xs">
                                Cặp Tranh #{topic.topicNumber < 10 ? `0${topic.topicNumber}` : topic.topicNumber}
                              </span>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-heading font-bold text-sm text-foreground">
                                {topic.title}
                              </h3>
                              {topic.examId && (
                                <Link
                                  href={`/speaking/${topic.examId}`}
                                  className="text-[11px] font-bold text-purple-600 hover:underline shrink-0"
                                >
                                  Phòng thi →
                                </Link>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              {topic.questions.map((q, qIdx) => (
                                <button
                                  key={qIdx}
                                  type="button"
                                  onClick={() =>
                                    openPracticeModal({
                                      part: 3,
                                      title: `${topic.title} · Câu ${qIdx + 1}`,
                                      prompt: q,
                                      sampleAnswer: topic.sampleAnswers?.[qIdx],
                                      imageUrl: topic.imageUrl,
                                      vocab: topic.vocab,
                                      timeLimit: 45,
                                    })
                                  }
                                  className="w-full text-left text-xs text-foreground/90 font-medium flex items-start gap-1.5 bg-muted/30 hover:bg-purple-500/10 p-2 rounded-lg transition-colors"
                                >
                                  <span className="text-purple-600 font-bold shrink-0">
                                    {qIdx + 1}.
                                  </span>
                                  <span className="flex-1">{q}</span>
                                  <Mic className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                                </button>
                              ))}
                            </div>

                            {topic.sampleAnswers && topic.sampleAnswers.some(Boolean) && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedSampleId(
                                      expandedSampleId === topic.id ? null : topic.id
                                    )
                                  }
                                  className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline py-1"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Xem bài nói mẫu so sánh (3 câu)
                                  </span>
                                  {expandedSampleId === topic.id ? (
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                {expandedSampleId === topic.id && (
                                  <div className="mt-1.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-2 max-h-56 overflow-y-auto">
                                    {topic.sampleAnswers.map((ans, aIdx) =>
                                      ans ? (
                                        <div key={aIdx}>
                                          <strong className="text-emerald-700 dark:text-emerald-300">
                                            Câu {aIdx + 1}:
                                          </strong>{" "}
                                          <span className="whitespace-pre-line">{ans}</span>
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              openPracticeModal({
                                part: 3,
                                title: topic.title,
                                prompt:
                                  topic.questions[0] ||
                                  "Describe the two pictures.",
                                sampleAnswer: topic.sampleAnswers?.[0],
                                imageUrl: topic.imageUrl,
                                vocab: topic.vocab,
                                timeLimit: 45,
                              })
                            }
                            className="w-full py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Luyện nói cặp tranh này (45s)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. PART 4 MARATHON DISPLAY (FULL 53 ĐỀ + 6 CỤM VẠN NĂNG)   */}
              {/* ========================================================= */}
              {currentPart === "4" && (
                <div className="space-y-8">
                  {/* Full 53 DB Part 4 Exams */}
                  {filteredP4DbExams.length > 0 && (
                    <div className="space-y-5">
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="font-heading font-bold text-sm text-foreground">
                            Ngân Hàng Full {filteredP4DbExams.length} Đề Thi Thật Speaking Part 4 (1p Chuẩn Bị · 2p Nói)
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Mỗi đề gồm 3 câu hỏi thảo luận chuyên sâu kèm bài mẫu B1/B2. Có thể ghi âm 120s trực tiếp hoặc vào phòng thi chuẩn.
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs shrink-0">
                          Full {filteredP4DbExams.length} Đề Part 4
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {filteredP4DbExams.map((item, idx) => {
                          const combinedPrompt = item.questions
                            .map((q, i) => `${i + 1}. ${q.prompt}`)
                            .join("\n");
                          const combinedSample = item.questions
                            .map((q) => q.explanation)
                            .filter(Boolean)
                            .join("\n\n");
                          const isSampleOpen = expandedSampleId === item.partId;

                          return (
                            <div
                              key={item.partId}
                              className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between"
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                  <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                                    Đề #{idx + 1}
                                  </span>
                                  <Link
                                    href={`/speaking/${item.examId}`}
                                    className="text-xs font-bold text-primary hover:underline"
                                  >
                                    Mở trong phòng thi →
                                  </Link>
                                </div>

                                <h4 className="font-heading font-bold text-sm text-foreground">
                                  {item.title}
                                </h4>

                                <div className="space-y-1.5">
                                  {item.questions.map((q, qIdx) => (
                                    <div
                                      key={q.id}
                                      className="p-2.5 rounded-xl bg-muted/30 border border-border/60 text-xs font-medium text-foreground flex items-start gap-2"
                                    >
                                      <span className="text-primary font-bold shrink-0">
                                        {qIdx + 1}.
                                      </span>
                                      <span>{q.prompt}</span>
                                    </div>
                                  ))}
                                </div>

                                {combinedSample && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedSampleId(
                                          isSampleOpen ? null : item.partId
                                        )
                                      }
                                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>
                                        {isSampleOpen
                                          ? "Ẩn bài nói mẫu"
                                          : "Xem bài nói mẫu B1/B2"}
                                      </span>
                                    </button>
                                    {isSampleOpen && (
                                      <div className="mt-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs whitespace-pre-line leading-relaxed max-h-56 overflow-y-auto">
                                        {combinedSample}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() =>
                                  openPracticeModal({
                                    part: 4,
                                    title: item.title,
                                    prompt: combinedPrompt,
                                    sampleAnswer: combinedSample,
                                    timeLimit: 120,
                                  })
                                }
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                              >
                                <Mic className="w-3.5 h-3.5" />
                                <span>Luyện nói 2 phút đề này</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6 Universal Clusters */}
                  <div className="space-y-5">
                    <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-heading font-bold text-sm text-foreground">
                          Cẩm Nang 6 Cụm Đề Vạn Năng Part 4 (Mẹo Gộp Cốt Truyện B2/C1)
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Mỗi cụm có cốt truyện gộp vạn năng giúp ứng biến nhanh cho nhiều đề Part 4 cùng chủ đề.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0">
                        6 Cụm đề vạn năng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {filteredP4Clusters.map((cluster) => (
                        <div
                          key={cluster.id}
                          className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4 flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <h4 className="font-heading font-bold text-sm text-foreground">
                              {cluster.title}
                            </h4>
                            <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5">
                              <p className="text-muted-foreground font-semibold">
                                <strong className="text-foreground">Đề bao phủ:</strong>{" "}
                                {cluster.coverage}
                              </p>
                              <p className="text-muted-foreground leading-relaxed">
                                <strong className="text-foreground">Cốt truyện gộp:</strong>{" "}
                                {cluster.story}
                              </p>
                            </div>
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                              <span className="font-bold text-amber-800 dark:text-amber-200 block">
                                🎙️ Bài nói mẫu 2 phút (B2/C1):
                              </span>
                              <p className="italic text-muted-foreground leading-relaxed text-[11.5px]">
                                {cluster.sampleSpeech}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              openPracticeModal({
                                part: 4,
                                title: cluster.title,
                                prompt: cluster.story,
                                sampleAnswer: cluster.sampleSpeech,
                                timeLimit: 120,
                              })
                            }
                            className="w-full py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Mic className="w-3.5 h-3.5" />
                            <span>Luyện nói cụm này (120s)</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* PRACTICE AUDIO RECORDING MODAL                            */}
      {/* ========================================================= */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs">
                  Part {activeQuestion.part}
                </span>
                <h3 className="font-heading font-bold text-sm text-foreground">
                  {activeQuestion.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePracticeModal}
                className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {activeQuestion.imageUrl &&
                (() => {
                  const imgs = parseSpeakingImages(activeQuestion.imageUrl);
                  if (imgs.length >= 2) {
                    return (
                      <div className="grid grid-cols-2 gap-3 max-h-56 mx-auto">
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgs[0]}
                            alt="Picture 1"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-bold text-[10px]">
                            Picture 1
                          </span>
                        </div>
                        <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-border bg-muted/20">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgs[1]}
                            alt="Picture 2"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-bold text-[10px]">
                            Picture 2
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="relative aspect-[16/10] max-h-56 rounded-xl overflow-hidden border border-border mx-auto bg-muted/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgs[0] || activeQuestion.imageUrl}
                        alt="Prompt"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })()}

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  CÂU HỎI LUYỆN NÓI:
                </span>
                <p className="text-sm md:text-base font-bold text-foreground leading-relaxed whitespace-pre-line">
                  {activeQuestion.prompt}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Clock
                  className={`w-5 h-5 ${
                    timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-primary"
                  }`}
                />
                <span
                  className={`text-2xl font-mono font-extrabold ${
                    timeLeft <= 5 ? "text-rose-500" : "text-foreground"
                  }`}
                >
                  {formatAudioTime(timeLeft)}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  / {activeQuestion.timeLimit}s
                </span>
              </div>

              {!isRecording && !audioBlobUrl && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <Mic className="w-4 h-4" />
                  <span>BẮT ĐẦU GHI ÂM ({activeQuestion.timeLimit} GIÂY)</span>
                </button>
              )}

              {isRecording && (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-6 py-3 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md animate-pulse transition-all flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  <span>DỪNG VÀ XEM KẾT QUẢ</span>
                </button>
              )}

              {audioBlobUrl && !isRecording && (
                <div className="w-full space-y-3 pt-1">
                  <audio
                    ref={audioPlayerRef}
                    src={audioBlobUrl}
                    preload="auto"
                    onPlay={() => setIsPlayingAudio(true)}
                    onPause={() => setIsPlayingAudio(false)}
                    onEnded={() => {
                      setIsPlayingAudio(false);
                      setCurrentPlayTime(0);
                    }}
                    onTimeUpdate={() => {
                      if (audioPlayerRef.current) {
                        setCurrentPlayTime(audioPlayerRef.current.currentTime);
                      }
                    }}
                    className="hidden"
                  />

                  <div className="flex items-center gap-3 w-full justify-center">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-emerald-700"
                    >
                      {isPlayingAudio ? (
                        <Pause className="w-3.5 h-3.5" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isPlayingAudio ? "Tạm dừng" : "Nghe lại bài nói"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cleanupAudio();
                        startRecording();
                      }}
                      className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-muted"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Nói lại</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeQuestion.sampleAnswer && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSampleInModal(!showSampleInModal)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Xem Gợi Ý &amp; Bài Mẫu B1/B2
                  </span>
                  {showSampleInModal ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showSampleInModal && (
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {activeQuestion.sampleAnswer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}

export default function SpeakingMarathonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Đang tải...
        </div>
      }
    >
      <SpeakingMarathonContent />
    </Suspense>
  );
}
