"use client";

import { useState, useMemo } from "react";
import {
  Clock,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Star,
  BookOpen,
  Search,
  Sparkles,
  Heading,
  Check,
  Pin,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { READING_KEY_MEO_DATA, READING_P2_TOPICS, ReadingPartData, ReadingP2Topic } from "@/data/key-meo-reading-data";

interface ReadingCheatSheetViewProps {
  customData?: Record<string, ReadingPartData>;
}

export function ReadingCheatSheetView({ customData }: ReadingCheatSheetViewProps) {
  const [activePartKey, setActivePartKey] = useState<"p1" | "p2" | "p3" | "p4">("p1");
  const [selectedTopicId, setSelectedTopicId] = useState<string>("topic-8"); // Default to Making films (topic-8) as seen in user reference
  const [topicSearch, setTopicSearch] = useState<string>("");

  // Merge customData from DB (if any) with default seed data
  const data: ReadingPartData =
    (customData && customData[activePartKey]) || READING_KEY_MEO_DATA[activePartKey] || READING_KEY_MEO_DATA.p1;

  // Topics for Part 2
  const topicsList: ReadingP2Topic[] = data.topicsP2 || READING_P2_TOPICS;

  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topicsList;
    const q = topicSearch.toLowerCase();
    return topicsList.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.fullTitle.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q)
    );
  }, [topicsList, topicSearch]);

  const activeTopic = useMemo(() => {
    return topicsList.find((t) => t.id === selectedTopicId) || topicsList[0];
  }, [topicsList, selectedTopicId]);

  // Extract keywords to highlight from summary cues
  const highlightKeywords = useMemo(() => {
    if (!activeTopic || !activeTopic.summary) return [];
    const matches = activeTopic.summary.match(/\((.*?)\)/g);
    if (!matches) return [];
    return matches
      .map((m) => m.replace(/[()]/g, "").trim().toLowerCase())
      .filter((w) => w.length > 2 && !w.includes("lễ hội") && !w.includes("ca sĩ"));
  }, [activeTopic]);

  // Function to highlight words in English text
  const renderHighlightedEn = (text: string) => {
    if (!highlightKeywords.length) return text;
    // Create regex matching any of the keywords
    const escaped = highlightKeywords.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
    if (!escaped) return text;
    try {
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = text.split(regex);
      return parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-200/90 dark:bg-amber-500/35 px-1 py-0.5 rounded font-semibold text-foreground"
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP PART SELECTOR (Part 1 - Part 4) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "p1", label: "Part 1", desc: "~ 4 phút" },
          { id: "p2", label: "Part 2", desc: "Đối chiếu cặp câu" },
          { id: "p3", label: "Part 3", desc: "Nối ý kiến người nói" },
          { id: "p4", label: "Part 4", desc: "Nối tiêu đề đoạn văn" },
        ].map((tab) => {
          const isActive = activePartKey === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePartKey(tab.id as "p1" | "p2" | "p3" | "p4")}
              className={`px-5 py-2.5 rounded-full text-xs font-heading font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {isActive && <Star className="w-3.5 h-3.5 fill-current" />}
              <span>{tab.label}</span>
              <span className={`text-[10px] font-normal ${isActive ? "text-white/90" : "text-muted-foreground"}`}>
                ({tab.desc})
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* PART 1 VIEW (BỐ CỤC CHUẨN 100% THEO ẢNH MẪU 1) */}
      {/* ========================================================================= */}
      {activePartKey === "p1" && (
        <div className="space-y-6">
          {/* Banner Hero Part 1 */}
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>{data.badge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-foreground">
                  {data.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {data.subtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Hàng 1: Đặc điểm Part 1 + Thời gian đề xuất */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">✏️</span>
                <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                  Đặc điểm Part 1
                </h3>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {data.overview}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Clock className="w-4 h-4" />
                  <span>Thời gian đề xuất</span>
                </div>
                <div className="text-xl md:text-2xl font-black font-heading text-blue-700 dark:text-blue-300 pt-1">
                  {data.recommendedTime}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground pt-2">
                Hoàn thành nhanh để dành tối đa thời gian cho Part 4.
              </p>
            </div>
          </div>

          {/* Hàng 2: Cách làm bài + Dấu hiệu & Mẹo nhận diện */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cột trái: Cách làm bài */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                  Cách làm bài
                </h3>
              </div>
              <ul className="space-y-2.5">
                {data.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      {idx + 1}
                    </span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột phải: Dấu hiệu & Mẹo nhận diện */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                  Dấu hiệu &amp; Mẹo nhận diện
                </h3>
              </div>

              {data.cluesP1 && (
                <div className="overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground font-bold">
                      <tr>
                        <th className="p-2.5 text-left w-1/2">Câu hỏi</th>
                        <th className="p-2.5 text-left">Phương án</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.cluesP1.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="p-2.5 font-mono font-bold text-primary">{item.questionPattern}</td>
                          <td className="p-2.5 text-foreground/90 font-medium">
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mr-1.5">→</span>
                            {item.answerType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Hàng 3: Những lỗi cần tránh + Ví dụ minh họa */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Cột trái: Những lỗi cần tránh */}
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                  Những lỗi cần tránh
                </h3>
              </div>
              <ul className="space-y-2 text-xs">
                {data.mistakesToAvoid.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-foreground/90 leading-relaxed">
                    <span className="text-rose-500 font-bold shrink-0">✕</span>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Cột phải: Ví dụ minh họa */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-heading font-black text-sm uppercase tracking-wide">
                  Ví dụ minh họa
                </h3>
              </div>

              {data.exampleP1 && (
                <div className="space-y-2.5 text-xs bg-card p-4 rounded-xl border border-border shadow-2xs">
                  <div>
                    <span className="font-bold text-foreground">Câu hỏi: </span>
                    <span className="font-mono text-primary font-semibold">{data.exampleP1.question}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    <span className="font-bold text-foreground">Phương án: </span>
                    <span>{data.exampleP1.options}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    → 👉 Đáp án đúng: {data.exampleP1.correctAnswer}
                  </div>
                  <div className="text-[11px] text-muted-foreground italic">
                    <span className="font-bold text-foreground not-italic">Giải thích: </span>
                    {data.exampleP1.explanation}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hàng 4: Ghi nhớ nhanh */}
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-5 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Trophy className="w-7 h-7" />
            </div>
            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Ghi nhớ nhanh
              </div>
              <div className="text-sm sm:text-base font-black font-heading text-foreground">
                {data.quickRemember.highlight}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.quickRemember.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 2 VIEW: ĐỐI CHIẾU CẶP CÂU (BỐ CỤC 2 CỘT 100% THEO ẢNH MẪU 2) */}
      {/* ========================================================================= */}
      {activePartKey === "p2" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: DANH SÁCH + TOPICS (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-3">
              <div className="rounded-2xl border border-sky-500/30 bg-sky-500/5 p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-heading font-black text-xs uppercase tracking-wider text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                    <span>+</span>
                    <span>TOPICS:</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold font-mono">
                    {topicsList.length} Chủ đề
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    placeholder="Tìm nhanh topic..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* Topics List */}
                <div className="space-y-1.5 max-h-[620px] overflow-y-auto pr-1">
                  {filteredTopics.map((topic) => {
                    const isSelected = activeTopic.id === topic.id;
                    return (
                      <button
                        key={topic.id}
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer border ${
                          isSelected
                            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white border-sky-600 shadow-md shadow-sky-500/20 scale-[1.01]"
                            : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{topic.emoji}</span>
                          <span className="truncate">
                            {topic.num}. {topic.title}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: NỘI DUNG ĐỐI CHIẾU CẶP CÂU (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Header Box (Khớp theo ảnh mẫu 2) */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-1.5 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📚</span>
                    <h2 className="font-heading font-black text-sm sm:text-base text-foreground tracking-tight flex items-center gap-1.5">
                      <span>APTIS READING • PART 2: ĐỐI CHIẾU CẶP CÂU</span>
                      <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </h2>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-card border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
                    British Council +1
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Đọc hiểu liên kết: Đối chiếu đoạn văn gốc và phân tích đáp án có từ khóa biến thể (paraphrasing).
                </p>
              </div>

              {/* 2 Cột Đối Chiếu Song Song: CÂU GỐC vs DỊCH NGHĨA */}
              <div className="rounded-2xl border border-sky-500/20 bg-card overflow-hidden shadow-xs">
                {/* Headers 2 cột */}
                <div className="grid grid-cols-1 md:grid-cols-2 border-b border-border bg-muted/60 text-xs font-bold">
                  <div className="p-3.5 flex items-center gap-2 text-foreground border-b md:border-b-0 md:border-r border-border">
                    <span className="text-base">📝</span>
                    <span className="uppercase tracking-wider">CÂU GỐC</span>
                  </div>
                  <div className="p-3.5 flex items-center gap-2 text-foreground">
                    <span className="uppercase tracking-wider">DỊCH NGHĨA</span>
                  </div>
                </div>

                {/* Tiêu đề topic hiện tại */}
                <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center gap-2 text-xs font-bold text-primary">
                  <span className="text-base">{activeTopic.emoji}</span>
                  <span>{activeTopic.num}. {activeTopic.fullTitle}</span>
                </div>

                {/* Danh sách các câu đối chiếu song song */}
                <div className="divide-y divide-border text-xs leading-relaxed">
                  {activeTopic.pairs.map((pair, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 hover:bg-muted/20 transition-colors">
                      {/* Câu gốc tiếng Anh */}
                      <div className="p-4 border-b md:border-b-0 md:border-r border-border space-y-1">
                        <div className="flex items-start gap-2 text-foreground/90">
                          <span className="text-primary font-bold shrink-0 mt-0.5">•</span>
                          <div>{renderHighlightedEn(pair.en)}</div>
                        </div>
                      </div>

                      {/* Bản dịch nghĩa tiếng Việt */}
                      <div className="p-4 text-muted-foreground space-y-1">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground/60 shrink-0 mt-0.5">•</span>
                          <div>{pair.vn}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Khung TÓM TẮT MẸO NHỚ (Khớp theo ảnh mẫu 2) */}
                <div className="p-4 bg-amber-500/10 border-t border-amber-500/30 flex items-start gap-2.5 text-xs">
                  <span className="text-base shrink-0 mt-0.5">📌</span>
                  <div className="space-y-0.5 text-foreground">
                    <span className="font-heading font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide mr-1.5">
                      TÓM TẮT MẸO NHỚ:
                    </span>
                    <span className="font-medium text-foreground/90 leading-relaxed">
                      {activeTopic.summary}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 3 VIEW: NỐI Ý KIẾN NGƯỜI NÓI */}
      {/* ========================================================================= */}
      {activePartKey === "p3" && (
        <div className="space-y-6">
          {/* Banner Hero Part 3 */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>{data.badge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-foreground">
                  {data.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {data.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                Tổng quan Part 3
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {data.overview}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">Thời gian đề xuất</span>
                <div className="text-2xl font-black font-heading text-blue-700 dark:text-blue-300">
                  {data.recommendedTime}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Phân bổ đều cho 7 nhận định.</p>
            </div>
          </div>

          {/* Bẫy từ đồng nghĩa */}
          {data.paraphraseTrapsP3 && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                Bẫy từ đồng nghĩa (Paraphrasing Traps)
              </h3>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted text-muted-foreground font-bold">
                    <tr>
                      <th className="p-2.5 text-left w-1/3">Từ khóa câu hỏi</th>
                      <th className="p-2.5 text-left">Từ đồng nghĩa trong bài đọc</th>
                      <th className="p-2.5 text-left">Cảnh báo bẫy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.paraphraseTrapsP3.map((trap, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="p-2.5 font-bold text-foreground">{trap.questionKeyword}</td>
                        <td className="p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold">{trap.passageSynonym}</td>
                        <td className="p-2.5 text-amber-600 dark:text-amber-400">{trap.trapNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* PART 4 VIEW: NỐI TIÊU ĐỀ ĐOẠN VĂN */}
      {/* ========================================================================= */}
      {activePartKey === "p4" && (
        <div className="space-y-6">
          {/* Banner Hero Part 4 */}
          <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-purple-500/15 p-6 md:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-purple-500/30">
                <Heading className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>{data.badge}</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-foreground">
                  {data.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  {data.subtitle}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                Tổng quan Part 4
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                {data.overview}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-blue-600 dark:text-blue-400 text-xs font-bold">Thời gian đề xuất</span>
                <div className="text-2xl font-black font-heading text-blue-700 dark:text-blue-300">
                  {data.recommendedTime}
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">Đọc lướt bắt ý câu đầu và câu cuối.</p>
            </div>
          </div>

          {/* Chiến lược tiêu đề */}
          {data.headingStrategiesP4 && (
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
              <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
                Chiến lược nhận diện dạng tiêu đề
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.headingStrategiesP4.map((strat, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/60 border border-border space-y-1.5 text-xs">
                    <div className="font-bold text-foreground text-[12px]">{strat.headingType}</div>
                    <div className="text-[11px] text-primary font-mono font-bold">Từ khóa: {strat.clueKeywords}</div>
                    <p className="text-[11px] text-muted-foreground">{strat.guide}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
