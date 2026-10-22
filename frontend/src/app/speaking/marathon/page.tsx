"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  SPEAKING_PART1_UNITS,
  SpeakingPart1QuestionItem,
  SpeakingPart1Unit,
} from "@/data/speaking-part1-bank";
import {
  SPEAKING_PART2_BANK,
  SpeakingPart2Topic,
} from "@/data/speaking-part2-bank";
import {
  SPEAKING_PART3_BANK,
  SpeakingPart3Topic,
} from "@/data/speaking-part3-bank";
import {
  Mic,
  MicOff,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  RotateCcw,
  Play,
  Pause,
  Layers,
  Image as ImageIcon,
  Flame,
  Star,
  X,
  Award,
} from "lucide-react";

function SpeakingMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "1";

  const [currentPart, setCurrentPart] = useState<"1" | "2" | "3">(
    initialPart === "2" ? "2" : initialPart === "3" ? "3" : "1"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [expandedVocabId, setExpandedVocabId] = useState<string | null>(null);

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

  // Cleanup timer & recording on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
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

  // Filter Part 1
  const filteredP1Units = useMemo(() => {
    return SPEAKING_PART1_UNITS.map((unit) => {
      if (selectedUnit !== "all" && unit.id !== selectedUnit) return null;
      const matchedQ = unit.questions.filter((q) =>
        q.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchedQ.length === 0) return null;
      return { ...unit, questions: matchedQ };
    }).filter(Boolean) as SpeakingPart1Unit[];
  }, [searchTerm, selectedUnit]);

  // Filter Part 2
  const filteredP2Topics = useMemo(() => {
    return SPEAKING_PART2_BANK.filter((topic) => {
      const matchTitle = topic.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchQuestion = topic.questions.some((q) =>
        q.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchVocab = topic.vocab.some(
        (v) =>
          v.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vi.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchTitle || matchQuestion || matchVocab;
    });
  }, [searchTerm]);

  // Filter Part 3
  const filteredP3Topics = useMemo(() => {
    return SPEAKING_PART3_BANK.filter((topic) => {
      const matchTitle = topic.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchQuestion = topic.questions.some((q) =>
        q.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const matchVocab = topic.vocab.some(
        (v) =>
          v.en.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.vi.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return matchTitle || matchQuestion || matchVocab;
    });
  }, [searchTerm]);

  // Dọn dẹp tài nguyên âm thanh
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

  // Launch Question practice
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    cleanupAudio();
    setActiveQuestion(null);
    setIsRecording(false);
    setAudioBlobUrl(null);
  };

  // Start Voice Recording
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
        if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(cand)) {
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

      // flush mỗi 250ms để dữ liệu luôn được nạp đầy đủ
      mediaRecorder.start(250);
      setIsRecording(true);
      setTimeLeft(activeQuestion?.timeLimit || 30);

      // Countdown timer
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
      alert("Vui lòng cấp quyền truy cập Microphone trong trình duyệt để luyện nói.");
    }
  };

  // Stop Voice Recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.requestData();
      } catch {}
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  // Audio Playback
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
          .then(() => {
            setIsPlayingAudio(true);
          })
          .catch((err) => {
            console.error("Audio playback error:", err);
            setIsPlayingAudio(false);
            try {
              audio.load();
              audio
                .play()
                .then(() => setIsPlayingAudio(true))
                .catch(() => setIsPlayingAudio(false));
            } catch {}
          });
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
                href="/speaking"
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Bank
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Câu hỏi lẻ & Tranh trọng điểm
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Từng Câu Hỏi Nói Aptis
                </h1>
              </div>
            </div>

            {/* Quick Part Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border">
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
                Part 2 (25 Tranh & Vocab)
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
                Part 3 (So sánh 2 tranh)
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
                    ? "Tìm kiếm tranh Part 2 hoặc từ vựng (phòng họp, siêu thị, gia đình...)"
                    : "Tìm kiếm tranh Part 3 (leo núi, biển, phương tiện...)"
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
                <option value="all">Tất cả Unit ({SPEAKING_PART1_UNITS.length})</option>
                {SPEAKING_PART1_UNITS.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.title.replace(/^UNIT\s*\d*:\s*/i, "")} ({u.questions.length})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* ========================================================= */}
          {/* 1. PART 1 MARATHON DISPLAY                                */}
          {/* ========================================================= */}
          {currentPart === "1" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Ngân Hàng 90+ Câu Hỏi Lẻ Part 1 Kèm Bài Mẫu B2/C1
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mỗi câu hỏi có 30 giây trả lời. Nhấn nút &ldquo;Luyện Nói 30s&rdquo; để ghi âm và nghe lại bài nói của bạn.
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
                          <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug line-clamp-3">
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
          {/* 2. PART 2 MARATHON DISPLAY (25 Tranh + Từ Vựng)           */}
          {/* ========================================================= */}
          {currentPart === "2" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Bộ 25 Tranh Trọng Điểm Thi Thật Part 2 Kèm Bảng Từ Vựng Song Ngữ
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Mỗi tranh có 3 câu hỏi (45s/câu). Học bảng từ vựng gợi ý theo tranh trước khi ghi âm để đạt điểm Lexical Resource cao.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  {filteredP2Topics.length} Tranh
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
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={topic.imageUrl}
                          alt={topic.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md bg-black/70 text-white font-bold text-[10px] backdrop-blur-xs">
                            Tranh {topic.topicNumber < 10 ? `0${topic.topicNumber}` : topic.topicNumber}
                          </span>
                        </div>
                      </div>

                      {/* Title & Questions */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-heading font-bold text-sm text-foreground">
                            {topic.title}
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            Tranh trọng điểm Part 2
                          </span>
                        </div>

                        {/* 3 Questions */}
                        <div className="space-y-1.5">
                          {topic.questions.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="text-xs text-foreground/90 font-medium flex items-start gap-1.5 bg-muted/30 p-2 rounded-lg"
                            >
                              <span className="text-primary font-bold shrink-0">{qIdx + 1}.</span>
                              <span className="line-clamp-2">{q}</span>
                            </div>
                          ))}
                        </div>

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
                                <div className="grid grid-cols-2 font-bold text-muted-foreground border-b border-border/60 pb-1 mb-1">
                                  <span>English</span>
                                  <span>Tiếng Việt</span>
                                </div>
                                {topic.vocab.map((v, vIdx) => (
                                  <div key={vIdx} className="grid grid-cols-2 py-0.5">
                                    <span className="font-semibold text-foreground">{v.en}</span>
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
                    <div className="p-4 pt-0">
                      <button
                        type="button"
                        onClick={() =>
                          openPracticeModal({
                            part: 2,
                            title: topic.title,
                            prompt: topic.questions[0] || "Describe what you see in the picture.",
                            imageUrl: topic.imageUrl,
                            vocab: topic.vocab,
                            timeLimit: 45,
                          })
                        }
                        className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
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
          {/* 3. PART 3 MARATHON DISPLAY (So Sánh 2 Tranh)               */}
          {/* ========================================================= */}
          {currentPart === "3" && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-sm text-foreground">
                    Bộ Cặp Tranh So Sánh Part 3 Kèm Bảng Từ Vựng Đối Lập
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    So sánh 2 tranh, nêu quan điểm sở thích và bình luận xu hướng tương lai. 45 giây cho mỗi câu hỏi.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  {filteredP3Topics.length} Cặp Tranh
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredP3Topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Topic Image */}
                      <div className="relative aspect-[16/10] bg-muted/30 overflow-hidden border-b border-border/60">
                        {(() => {
                          const imgs = (topic.imageUrl || "").split(",").map((s) => s.trim()).filter(Boolean);
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
                                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px] backdrop-blur-xs">
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
                                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px] backdrop-blur-xs">
                                    Picture 2
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={topic.imageUrl}
                                alt={topic.title}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </>
                          );
                        })()}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="px-2 py-0.5 rounded-md bg-purple-700/90 text-white font-bold text-[10px] backdrop-blur-xs shadow-xs">
                            Cặp Tranh 0{topic.topicNumber}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-3">
                        <h3 className="font-heading font-bold text-sm text-foreground">
                          {topic.title}
                        </h3>

                        <div className="space-y-1.5">
                          {topic.questions.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="text-xs text-foreground/90 font-medium flex items-start gap-1.5 bg-muted/30 p-2 rounded-lg"
                            >
                              <span className="text-purple-600 font-bold shrink-0">{qIdx + 1}.</span>
                              <span className="line-clamp-2">{q}</span>
                            </div>
                          ))}
                        </div>

                        {/* Vocab Table */}
                        {topic.vocab && topic.vocab.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedVocabId(
                                  expandedVocabId === topic.id ? null : topic.id
                                )
                              }
                              className="w-full flex items-center justify-between text-xs font-bold text-purple-600 hover:underline py-1"
                            >
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                Từ vựng so sánh ({topic.vocab.length} từ)
                              </span>
                              {expandedVocabId === topic.id ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {expandedVocabId === topic.id && (
                              <div className="mt-2 p-2.5 rounded-xl bg-muted/60 border border-border text-[11px] space-y-1 max-h-48 overflow-y-auto">
                                <div className="grid grid-cols-2 font-bold text-muted-foreground border-b border-border/60 pb-1 mb-1">
                                  <span>English</span>
                                  <span>Tiếng Việt</span>
                                </div>
                                {topic.vocab.map((v, vIdx) => (
                                  <div key={vIdx} className="grid grid-cols-2 py-0.5">
                                    <span className="font-semibold text-foreground">{v.en}</span>
                                    <span className="text-muted-foreground">{v.vi}</span>
                                  </div>
                                ))}
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
                              "Tell me what you see in the two pictures and contrast them.",
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
        </div>
      </main>

      {/* ========================================================= */}
      {/* PRACTICE AUDIO RECORDING MODAL                            */}
      {/* ========================================================= */}
      {activeQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
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

            {/* Prompt & Picture */}
            <div className="space-y-3">
              {activeQuestion.imageUrl && (
                (() => {
                  const imgs = (activeQuestion.imageUrl || "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
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
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-bold text-[10px] backdrop-blur-xs">
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
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/75 text-white font-bold text-[10px] backdrop-blur-xs">
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
                        src={activeQuestion.imageUrl}
                        alt="Prompt"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                })()
              )}

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground block mb-1">
                  CÂU HỎI LUYỆN NÓI:
                </span>
                <p className="text-sm md:text-base font-bold text-foreground leading-relaxed">
                  {activeQuestion.prompt}
                </p>
              </div>
            </div>

            {/* Timer & Recording Controller */}
            <div className="p-4 rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className={`w-5 h-5 ${timeLeft <= 5 ? "text-rose-500 animate-pulse" : "text-primary"}`} />
                <span className={`text-2xl font-mono font-extrabold ${timeLeft <= 5 ? "text-rose-500" : "text-foreground"}`}>
                  00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  / {activeQuestion.timeLimit}s
                </span>
              </div>

              {/* Record Button */}
              {!isRecording && !audioBlobUrl && (
                <button
                  type="button"
                  onClick={startRecording}
                  className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-md transition-all flex items-center gap-2 hover:scale-105"
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
                    onLoadedMetadata={() => {
                      const audio = audioPlayerRef.current;
                      if (!audio) return;
                      // Fix bug duration = Infinity trên Chrome khi phát WebM Blob
                      if (audio.duration === Infinity) {
                        audio.currentTime = 1e101;
                        audio.ontimeupdate = () => {
                          audio.ontimeupdate = null;
                          audio.currentTime = 0;
                          if (isFinite(audio.duration) && audio.duration > 0) {
                            setAudioDuration(audio.duration);
                          }
                        };
                      } else if (isFinite(audio.duration) && audio.duration > 0) {
                        setAudioDuration(audio.duration);
                      }
                    }}
                    className="hidden"
                  />

                  {/* Thanh tiến trình phát lại âm thanh */}
                  <div className="w-full p-2.5 rounded-xl bg-muted/60 border border-border/80 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="w-9 h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer"
                      title={isPlayingAudio ? "Tạm dừng" : "Nghe lại bài nói"}
                    >
                      {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>

                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground font-semibold">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatAudioTime(currentPlayTime)}</span>
                        <span>{formatAudioTime(audioDuration || (activeQuestion.timeLimit - timeLeft))}</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={Math.round(
                          (audioDuration || (activeQuestion.timeLimit - timeLeft)) > 0
                            ? (currentPlayTime / (audioDuration || (activeQuestion.timeLimit - timeLeft))) * 100
                            : 0
                        )}
                        onClick={(e) => {
                          const audio = audioPlayerRef.current;
                          const dur = audioDuration || (activeQuestion.timeLimit - timeLeft);
                          if (!audio || dur <= 0) return;
                          const rect = e.currentTarget.getBoundingClientRect();
                          const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                          audio.currentTime = ratio * dur;
                          setCurrentPlayTime(ratio * dur);
                        }}
                        className="w-full h-2 bg-muted-foreground/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative transition-all"
                      >
                        <div
                          className="h-full bg-emerald-600 rounded-full transition-all duration-75"
                          style={{
                            width: `${
                              (audioDuration || (activeQuestion.timeLimit - timeLeft)) > 0
                                ? Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      (currentPlayTime /
                                        (audioDuration || (activeQuestion.timeLimit - timeLeft))) *
                                        100
                                    )
                                  )
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Nút hành động chính */}
                  <div className="flex items-center gap-3 w-full justify-center">
                    <button
                      type="button"
                      onClick={togglePlayAudio}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer"
                    >
                      {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isPlayingAudio ? "Tạm dừng" : "Nghe lại bài nói"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        cleanupAudio();
                        startRecording();
                      }}
                      className="px-5 py-2.5 rounded-xl border border-border bg-card text-foreground font-bold text-xs flex items-center gap-1.5 hover:bg-muted transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Nói lại</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sample Answer Toggle */}
            {activeQuestion.sampleAnswer && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSampleInModal(!showSampleInModal)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Xem Gợi Ý & Bài Mẫu B2/C1
                  </span>
                  {showSampleInModal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showSampleInModal && (
                  <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-foreground leading-relaxed animate-in fade-in space-y-1">
                    <span className="font-bold text-amber-600 block">Bài mẫu đề xuất:</span>
                    <p>{activeQuestion.sampleAnswer}</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <SpeakingMarathonContent />
    </Suspense>
  );
}
