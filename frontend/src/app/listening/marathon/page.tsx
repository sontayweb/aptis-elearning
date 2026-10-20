"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { DEFAULT_LISTENING_TEST } from "@/data/listening-benchmark";
import {
  LISTENING_PART2_TOPICS,
  LISTENING_PART3_TOPICS,
  LISTENING_PART4_TOPICS,
} from "@/data/listening-topics-bank";
import {
  Headphones,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  ArrowLeft,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  FileText,
  AlertCircle,
  Award,
  Users,
  Mic,
  MessageSquare,
} from "lucide-react";

function ListeningMarathonContent() {
  const searchParams = useSearchParams();
  const initialPart = searchParams.get("part") || "1";

  const [currentPart, setCurrentPart] = useState<"1" | "2" | "3" | "4">(
    initialPart === "2" ? "2" : initialPart === "3" ? "3" : initialPart === "4" ? "4" : "1"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [showTranscripts, setShowTranscripts] = useState<Record<string, boolean>>({});

  // Audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play audio helper
  const handlePlayAudio = (id: string, url?: string) => {
    if (!url) return;
    if (playingAudioId === id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudioId(id);

    audio.play().catch((err) => {
      console.warn("Audio play blocked:", err);
      setPlayingAudioId(null);
    });

    audio.onended = () => {
      setPlayingAudioId(null);
    };
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Filter Part 1
  const filteredP1 = useMemo(() => {
    return (DEFAULT_LISTENING_TEST.part1 || []).filter((q) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        q.prompt.toLowerCase().includes(term) ||
        q.options.some((opt) => opt.toLowerCase().includes(term)) ||
        (q.transcript && q.transcript.toLowerCase().includes(term))
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
                href={`/listening?tab=p${currentPart}`}
                className="w-10 h-10 rounded-xl border border-border bg-card hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shadow-xs"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
                    ∞ Marathon Listening
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                    Ngân Hàng Audio &amp; Transcript Thật
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-heading font-extrabold text-foreground mt-0.5">
                  Luyện Tập Marathon Từng Phần Nghe Aptis ESOL
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
                placeholder="Tìm câu hỏi, từ khóa transcript..."
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
                  Part 1 · 13 câu
                </span>
                <Headphones className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Information Recognition
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Nghe bắt thông tin ngắn
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
                  Part 2 · 4 Speakers
                </span>
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Speaker Matching
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                8 chủ đề 4 người chia sẻ
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
                  Part 3 · 4 câu
                </span>
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Opinion Matching
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Man / Woman / Both agree
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
                  Part 4 · 2 Audio dài
                </span>
                <Mic className="w-4 h-4 text-primary" />
              </div>
              <div className="font-heading font-bold text-xs text-foreground truncate">
                Monologue &amp; Lecture
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                Bài giảng &amp; Bản tin dài
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
                    Quy tắc ăn trọn điểm Part 1 (13 câu nghe ngắn)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Mỗi câu chỉ hỏi 1 thông tin duy nhất: giờ giấc, địa điểm, số điện thoại, lý do hoặc cảm xúc. Được nghe tối đa 2 lần. Hãy chú ý các từ gây nhiễu (distractors) và từ đồng nghĩa (paraphrasing).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  13 câu · 13 điểm
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredP1.map((item, idx) => {
                  const qKey = `p1_${item.num}`;
                  const userAns = selectedAnswers[qKey];
                  const isChecked = showResults[qKey];
                  const transcriptOpen = showTranscripts[qKey];
                  const isCorrect = userAns === item.correctAnswer;
                  const isPlaying = playingAudioId === qKey;

                  return (
                    <div key={item.num} className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                      {/* Question Top Bar */}
                      <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                            #{item.num}
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            Câu hỏi số {item.num}
                          </span>
                        </div>

                        {/* Audio Play Button */}
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
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{isPlaying ? "Đang phát..." : "Nghe Audio"}</span>
                          </button>
                        )}
                      </div>

                      {/* Prompt */}
                      <div className="text-xs md:text-sm font-heading font-extrabold text-foreground leading-relaxed">
                        {item.prompt}
                      </div>

                      {/* Options */}
                      <div className="space-y-2">
                        {item.options.map((opt, optIdx) => {
                          const isSelected = userAns === opt;
                          let btnStyle = "border-border bg-muted/20 hover:bg-muted/60 text-foreground";

                          if (isChecked) {
                            if (opt === item.correctAnswer) {
                              btnStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold";
                            } else if (isSelected) {
                              btnStyle = "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-200";
                            }
                          } else if (isSelected) {
                            btnStyle = "border-primary bg-primary/10 text-primary font-bold";
                          }

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => setSelectedAnswers((prev) => ({ ...prev, [qKey]: opt }))}
                              className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-card border border-border flex items-center justify-center font-bold text-[10px] shrink-0">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>
                              {isChecked && opt === item.correctAnswer && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {isChecked && isSelected && opt !== item.correctAnswer && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowResults((prev) => ({ ...prev, [qKey]: !prev[qKey] }))}
                            className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 font-bold text-[11px] text-foreground transition-colors"
                          >
                            {isChecked ? "Ẩn kết quả" : "Kiểm tra đáp án"}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowTranscripts((prev) => ({ ...prev, [qKey]: !prev[qKey] }))}
                          className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{transcriptOpen ? "Ẩn Transcript" : "Xem Transcript"}</span>
                        </button>
                      </div>

                      {/* Transcript & Explanation Box */}
                      {transcriptOpen && item.transcript && (
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2 animate-fadeIn">
                          <div className="font-bold text-primary flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Transcript bài nghe bản ngữ:</span>
                          </div>
                          <p className="italic text-muted-foreground leading-relaxed whitespace-pre-line">
                            "{item.transcript}"
                          </p>
                          {item.explanation && (
                            <div className="pt-2 border-t border-border/50 text-[11px] text-emerald-700 dark:text-emerald-300">
                              <strong>Giải thích:</strong> {item.explanation}
                            </div>
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
          {/* 2. PART 2 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "2" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 2 (Speaker Matching - 4 người)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    4 người lần lượt phát biểu về cùng một chủ đề (4 ý kiến). Ghép 4 nhận định với người nói tương ứng (Người 1, 2, 3, 4). Có 2 nhận định gây nhiễu thừa.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  8 bộ chủ đề thi thật
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {LISTENING_PART2_TOPICS.map((topic) => (
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
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[220px]">
                        {topic.title}
                      </h4>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <strong>Bối cảnh nghe:</strong> {topic.context}
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-1.5">
                        <div className="font-bold text-foreground">4 Người phát biểu trong bài:</div>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
                          <li><strong>Speaker 1:</strong> Nêu quan điểm về trải nghiệm cá nhân tích cực</li>
                          <li><strong>Speaker 2:</strong> Phàn nàn về chi phí và chất lượng dịch vụ</li>
                          <li><strong>Speaker 3:</strong> Khuyên nên tìm kiếm giải pháp thay thế hợp lý</li>
                          <li><strong>Speaker 4:</strong> Đánh giá triển vọng cải tiến trong tương lai</li>
                        </ul>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">Format chuẩn đề thi British Council</span>
                      <Link
                        href={`/listening/00000000-0000-0000-0000-000000000001?part=2`}
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
          {/* 3. PART 3 CONTENT                                                */}
          {/* ================================================================ */}
          {currentPart === "3" && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-black text-foreground text-sm">
                    Quy tắc ăn trọn điểm Part 3 (Opinion Matching - Man / Woman / Both)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Hội thoại giữa 1 người nam và 1 người nữ trao đổi về một sự việc, kế hoạch hoặc vấn đề. Có 4 câu nhận định: Phải xác định nhận định đó là của Người Nam (Man), Người Nữ (Woman), hay Cả hai cùng đồng ý (Both).
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  6 bộ chủ đề đàm thoại
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {LISTENING_PART3_TOPICS.map((topic) => (
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
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[220px]">
                        {topic.title}
                      </h4>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <strong>Bối cảnh:</strong> {topic.context}
                    </p>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-2">
                      <div className="font-bold text-foreground">Chiến thuật ăn điểm B2/C1:</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Để ý các từ đồng tình: <em>"I couldn't agree more"</em>, <em>"That's exactly what I was thinking"</em> (=&gt; Chọn <strong>Both</strong>). Ngược lại nếu có <em>"I'm not so sure"</em>, <em>"On the other hand"</em> (=&gt; Quan điểm riêng rẽ của Man hoặc Woman).
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">4 câu hỏi trắc nghiệm</span>
                      <Link
                        href={`/listening/00000000-0000-0000-0000-000000000001?part=3`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Luyện đàm thoại Part 3</span>
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
                    Quy tắc ăn trọn điểm Part 4 (Monologue &amp; Academic Lectures)
                  </h3>
                  <p className="text-muted-foreground mt-0.5">
                    Gồm 2 bài nghe độc thoại riêng biệt (Bản tin phát thanh hoặc Bài giảng học thuật). Mỗi bài nghe kéo dài khoảng 1.5–2 phút, kèm 2 câu hỏi trắc nghiệm nội dung chi tiết.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-card border border-border font-bold text-primary shrink-0 self-start sm:self-center">
                  6 bài độc thoại dài
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {LISTENING_PART4_TOPICS.map((topic) => (
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
                      <h4 className="font-heading font-bold text-sm text-foreground truncate max-w-[220px]">
                        {topic.title}
                      </h4>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      <strong>Chủ đề:</strong> {topic.context}
                    </p>

                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 text-xs space-y-1.5">
                      <div className="font-bold text-foreground">Kỹ năng cốt lõi cần rèn:</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Tập trung nghe ý chính của người diễn thuyết (Gist) và nghe tìm dữ kiện đặc thù (Dates, Cause &amp; Effect, Recommendations).
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground">Độ dài ~2 phút / bài</span>
                      <Link
                        href={`/listening/00000000-0000-0000-0000-000000000001?part=4`}
                        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown font-bold text-[11px] shadow-xs inline-flex items-center gap-1"
                      >
                        <span>Luyện bài độc thoại Part 4</span>
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
