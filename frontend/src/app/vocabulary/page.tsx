"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  BookOpen,
  Library,
  Brain,
  Search,
  Eye,
  Play,
  X,
  Volume2,
  Check,
  Plus,
  Sparkles,
  Clock,
  RotateCcw,
  Award,
  AlertCircle,
  Trash2,
  Database,
  GraduationCap,
  Folder,
  Layers,
  HelpCircle,
  FolderPlus,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Headphones,
  Mic,
  PenTool,
  BarChart3,
  Filter,
  FileSpreadsheet,
  Download,
  Loader2,
} from "lucide-react";

interface VocabTopic {
  id: string;
  name: string;
  category: string;
  wordCount: number;
  sampleWords: { word: string; pos: string; ipa: string; meaning: string; example: string }[];
}

export default function VocabularyPage() {
  const [activeTab, setActiveTab] = useState<"aptis" | "my">("aptis");
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<
    "all" | "reading" | "listening" | "speaking" | "writing"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<VocabTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<VocabTopic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddWordModalOpen, setIsAddWordModalOpen] = useState(false);
  const [newWord, setNewWord] = useState({ word: "", meaning: "", example: "", phonetic: "" });
  const [notebookWords, setNotebookWords] = useState<
    Array<{ id: string; word: string; meaning: string; example?: string; phonetic?: string }>
  >([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("aptis_user_notebook");
      if (stored) {
        setNotebookWords(JSON.parse(stored));
      } else {
        setNotebookWords([
          {
            id: "nb-1",
            word: "Substantiate",
            phonetic: "/səbˈstæn.ʃi.eɪt/",
            meaning: "Chứng minh, xác thực (bằng dẫn chứng)",
            example: "The candidate failed to substantiate his claims during the interview.",
          },
          {
            id: "nb-2",
            word: "Vantage point",
            phonetic: "/ˈvæn.tɪdʒ ˌpɔɪnt/",
            meaning: "Góc nhìn, quan điểm cá nhân",
            example: "From my vantage point, the decision brings substantial benefits.",
          },
        ]);
      }
    } catch {}
  }, []);

  const handleAddNotebookWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word.trim() || !newWord.meaning.trim()) return;
    const item = {
      id: `word_${Date.now()}`,
      word: newWord.word.trim(),
      phonetic: newWord.phonetic.trim() || undefined,
      meaning: newWord.meaning.trim(),
      example: newWord.example.trim() || undefined,
    };
    const updated = [item, ...notebookWords];
    setNotebookWords(updated);
    try {
      localStorage.setItem("aptis_user_notebook", JSON.stringify(updated));
    } catch {}
    setNewWord({ word: "", meaning: "", example: "", phonetic: "" });
    setIsAddWordModalOpen(false);
  };

  const handleDeleteNotebookWord = (id: string) => {
    const updated = notebookWords.filter((w) => w.id !== id);
    setNotebookWords(updated);
    try {
      localStorage.setItem("aptis_user_notebook", JSON.stringify(updated));
    } catch {}
  };

  // Trạng thái & Xử lý Import từ Google Sheet
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState("");
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccessMessage, setSheetSuccessMessage] = useState<string | null>(null);
  const [parsedSheetWords, setParsedSheetWords] = useState<
    Array<{ word: string; meaning: string; phonetic?: string; example?: string }>
  >([]);

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  }

  function parseGoogleSheetCsvText(csvText: string) {
    const rawLines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return [];
    const firstCols = parseCsvLine(rawLines[0]);
    const hasHeader = firstCols.some((col) => /stt|word|từ|meaning|nghĩa|cột|no\./i.test(col));
    const dataLines = hasHeader ? rawLines.slice(1) : rawLines;

    const words: Array<{ word: string; meaning: string; phonetic?: string; example?: string }> = [];

    for (const line of dataLines) {
      const cols = parseCsvLine(line);
      let word = "";
      let meaning = "";
      let phonetic = "";
      let example = "";

      if (cols.length >= 3 && /^\d+$/.test(cols[0])) {
        word = cols[1] || "";
        meaning = cols[2] || "";
        if (cols[3]) phonetic = cols[3];
        if (cols[4]) example = cols[4];
      } else if (cols.length >= 2) {
        word = cols[0] || "";
        meaning = cols[1] || "";
        if (cols[2]) phonetic = cols[2];
        if (cols[3]) example = cols[3];
      }

      if (word && meaning) {
        words.push({
          word: word.trim(),
          meaning: meaning.trim(),
          phonetic: phonetic.trim() || undefined,
          example: example.trim() || undefined,
        });
      }
    }
    return words;
  }

  const handleFetchSheetData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!sheetUrl.trim()) {
      setSheetError("Vui lòng dán đường link Google Sheet.");
      return;
    }

    try {
      setIsFetchingSheet(true);
      setSheetError(null);
      setSheetSuccessMessage(null);
      setParsedSheetWords([]);

      const res = await fetch("/api/import-sheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sheetUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Không thể tải dữ liệu từ Google Sheet.");
      }

      const parsed = parseGoogleSheetCsvText(data.csvText);
      if (parsed.length === 0) {
        throw new Error("Không tìm thấy dòng từ vựng hợp lệ nào trong bảng tính. Vui lòng kiểm tra lại cấu trúc cột.");
      }

      setParsedSheetWords(parsed);
    } catch (err: any) {
      setSheetError(err.message || "Lỗi kết nối tải Google Sheet.");
    } finally {
      setIsFetchingSheet(false);
    }
  };

  const handleApplySheetWordsToNotebook = () => {
    if (parsedSheetWords.length === 0) return;

    const existingWordSet = new Set(notebookWords.map((w) => w.word.toLowerCase()));
    const newItems = parsedSheetWords
      .filter((w) => !existingWordSet.has(w.word.toLowerCase()))
      .map((w, idx) => ({
        id: `sheet_${Date.now()}_${idx}`,
        word: w.word,
        meaning: w.meaning,
        phonetic: w.phonetic,
        example: w.example,
      }));

    const duplicateCount = parsedSheetWords.length - newItems.length;
    const updated = [...newItems, ...notebookWords];
    setNotebookWords(updated);

    try {
      localStorage.setItem("aptis_user_notebook", JSON.stringify(updated));
    } catch {}

    setSheetSuccessMessage(
      `Đã thêm thành công ${newItems.length} từ vựng vào Sổ tay của bạn${
        duplicateCount > 0 ? ` (bỏ qua ${duplicateCount} từ đã có)` : ""
      }!`
    );
    setParsedSheetWords([]);
    setTimeout(() => {
      setIsGoogleSheetModalOpen(false);
      setSheetSuccessMessage(null);
    }, 1500);
  };

  const loadVocabSets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.vocabulary.getSets();
      if (res.success && Array.isArray(res.data)) {
        const apiTopics: VocabTopic[] = res.data.map((s: any) => ({
          id: s.id,
          name: (s.title || "Bộ từ vựng Aptis").toUpperCase(),
          category: s.category || "APTIS GENERAL",
          wordCount: s._count?.words || s.total_words || 20,
          sampleWords: s.words
            ? s.words.map((w: any) => ({
                word: w.word,
                pos: w.pos || "n",
                ipa: w.phonetic || "",
                meaning: w.meaning_vi || "",
                example: w.example_sentence || "",
              }))
            : [],
        }));
        setTopics(apiTopics);
      } else {
        setError(res.error?.message || "Không thể tải danh sách bộ từ vựng từ máy chủ (Vui lòng kiểm tra CSDL).");
        setTopics([]);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải danh sách từ vựng:", err);
      setError("Không thể kết nối đến máy chủ hoặc cơ sở dữ liệu chưa sẵn sàng.");
      setTopics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabSets();
  }, []);

  const handleSelectTopic = async (topic: VocabTopic) => {
    setSelectedTopic(topic);
    if (topic.sampleWords.length === 0) {
      try {
        const res = await api.vocabulary.getWords(topic.id);
        if (res.success && res.data && res.data.length > 0) {
          const words = res.data.map((w: any) => ({
            word: w.word,
            pos: w.pos || "n",
            ipa: w.phonetic || "",
            meaning: w.meaning_vi || "",
            example: w.example_sentence || "",
          }));
          const updatedTopic = { ...topic, sampleWords: words };
          setSelectedTopic(updatedTopic);
          setTopics((prev) => prev.map((t) => (t.id === topic.id ? updatedTopic : t)));
        }
      } catch (err) {
        console.error("Lỗi khi tải chi tiết từ vựng:", err);
      }
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchSearch) return false;
    if (selectedSkillFilter === "all") return true;

    const cat = t.category.toLowerCase();
    const name = t.name.toLowerCase();
    if (selectedSkillFilter === "reading")
      return cat.includes("reading") || name.includes("đọc") || cat.includes("academic") || cat.includes("cốt lõi") || cat.includes("general");
    if (selectedSkillFilter === "listening")
      return cat.includes("listening") || name.includes("nghe") || cat.includes("audio");
    if (selectedSkillFilter === "speaking")
      return cat.includes("speaking") || name.includes("nói") || cat.includes("collocation");
    if (selectedSkillFilter === "writing")
      return cat.includes("writing") || name.includes("viết") || cat.includes("email") || cat.includes("linking");
    return true;
  });

  const skillCards = [
    {
      key: "reading" as const,
      name: "READING",
      subName: "Từ vựng đọc hiểu",
      icon: BookOpen,
      color: "rose",
      badgeClass: "bg-rose-500 text-white",
      borderClass: "border-rose-500/30 hover:border-rose-500/60",
      bgSoft: "bg-rose-500/5",
      btnClass: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400",
      bullets: [
        "Từ đồng nghĩa (Synonym)",
        "Từ/ cụm từ Paraphrase",
        "Từ vựng theo chủ đề thường gặp",
        "Từ vựng học thuật và ngữ cảnh",
      ],
      countLabel: "8 bộ từ theo chủ đề",
      actionText: "Xem các bộ từ",
    },
    {
      key: "listening" as const,
      name: "LISTENING",
      subName: "Từ vựng nghe",
      icon: Headphones,
      color: "blue",
      badgeClass: "bg-blue-500 text-white",
      borderClass: "border-blue-500/30 hover:border-blue-500/60",
      bgSoft: "bg-blue-500/5",
      btnClass: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
      bullets: [
        "Từ đồng nghĩa / paraphrase",
        "Từ dễ nghe nhầm",
        "Cụm từ thường gặp trong audio",
        "Từ vựng theo chủ đề và tình huống",
      ],
      countLabel: "8 bộ từ theo chủ đề",
      actionText: "Xem các bộ từ",
    },
    {
      key: "speaking" as const,
      name: "SPEAKING",
      subName: "Từ vựng nói",
      icon: Mic,
      color: "emerald",
      badgeClass: "bg-emerald-500 text-white",
      borderClass: "border-emerald-500/30 hover:border-emerald-500/60",
      bgSoft: "bg-emerald-500/5",
      btnClass: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      bullets: [
        "Từ vựng theo chủ đề thường gặp",
        "Collocations và cụm diễn đạt tự nhiên",
        "Cụm diễn đạt ý kiến, quan điểm",
        "Từ vựng mô tả, so sánh, đưa ra giải pháp",
      ],
      countLabel: "10 chủ đề từ vựng",
      actionText: "Xem các chủ đề",
    },
    {
      key: "writing" as const,
      name: "WRITING",
      subName: "Từ vựng viết",
      icon: PenTool,
      color: "purple",
      badgeClass: "bg-purple-500 text-white",
      borderClass: "border-purple-500/30 hover:border-purple-500/60",
      bgSoft: "bg-purple-500/5",
      btnClass: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400",
      bullets: [
        "Collocations thường dùng",
        "Từ vựng trang trọng và thân mật",
        "Linking phrases (từ nối)",
        "Từ vựng áp dụng cho Part 3 & 4",
        "Từ vựng theo chủ đề email và bài viết",
      ],
      countLabel: "10 chủ đề từ vựng",
      actionText: "Xem các chủ đề",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* Hero Section theo giao diện mới */}
        <section className="relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-primary/5 to-card border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl -top-24 -right-16 w-96 h-96 bg-primary/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl -bottom-24 -left-16 w-80 h-80 bg-emerald-500/10"
          />

          <div className="section-container py-8 md:py-12 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4 sm:gap-5 text-left">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm border border-emerald-500/20">
                <BookOpen className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-heading font-black text-foreground tracking-tight">
                  Học từ vựng Aptis
                </h1>
                <p className="text-muted-foreground mt-1 text-xs sm:text-sm md:text-base font-medium">
                  Ôn luyện từ vựng theo từng kỹ năng trong bài thi Aptis ESOL.
                </p>
              </div>
            </div>

            {/* Artwork phối cảnh góc phải */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-card/80 border border-border/80 shadow-xs backdrop-blur-sm shrink-0">
              <div className="flex -space-x-2 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  R
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  L
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  S
                </div>
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
                  W
                </div>
              </div>
              <div className="text-xs">
                <span className="font-bold text-foreground block">Aptis ESOL Vocabulary</span>
                <span className="text-muted-foreground text-[11px]">Skills for Success</span>
              </div>
            </div>
          </div>
        </section>

        {/* Khu vực nội dung chính */}
        <div className="section-container py-6 md:py-8 space-y-6 md:space-y-8">
          {/* Hàng điều khiển kết hợp (Control Bar theo mockup ảnh dưới) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
            {/* 1. Tab Switcher */}
            <div className="inline-flex items-center p-1 bg-muted rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("aptis");
                  setSelectedSkillFilter("all");
                }}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === "aptis"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Từ vựng theo kỹ năng</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("my")}
                className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === "my"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Kho từ vựng của tôi</span>
              </button>
            </div>

            {/* 2. Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-3.5 rounded-xl border border-input bg-card text-foreground text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all shadow-xs"
                placeholder="Tìm bộ từ vựng, chủ đề..."
              />
            </div>
          </div>

          {activeTab === "aptis" ? (
            <>
              {/* KHỐI 4 THẺ KỸ NĂNG: Chọn kỹ năng để học từ vựng (Chuẩn theo ảnh mockup) */}
              <section className="space-y-3.5">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="font-heading font-black text-foreground text-base sm:text-lg">
                      Chọn kỹ năng để học từ vựng
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Các bộ từ vựng được biên soạn bám sát dạng bài và chủ đề thường gặp trong Aptis ESOL.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {skillCards.map((sc) => {
                    const isSelected = selectedSkillFilter === sc.key;
                    const IconElem = sc.icon;
                    return (
                      <div
                        key={sc.key}
                        onClick={() =>
                          setSelectedSkillFilter((prev) => (prev === sc.key ? "all" : sc.key))
                        }
                        className={`rounded-2xl border bg-card p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md ${
                          sc.borderClass
                        } ${sc.bgSoft} ${
                          isSelected
                            ? "ring-2 ring-primary border-primary shadow-glow-soft"
                            : ""
                        }`}
                      >
                        <div>
                          {/* Card Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${sc.badgeClass}`}
                              >
                                <IconElem className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <h3 className="font-heading font-black text-xs sm:text-sm text-foreground tracking-wide leading-tight">
                                  {sc.name}
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                  {sc.subName}
                                </p>
                              </div>
                            </div>
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                isSelected ? "text-primary translate-x-0.5" : "text-muted-foreground"
                              }`}
                            />
                          </div>

                          {/* Bullet points checklist */}
                          <ul className="space-y-1.5 text-xs text-foreground/85 my-3">
                            {sc.bullets.map((b, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-1.5">
                                <CheckCircle2
                                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                    sc.color === "rose"
                                      ? "text-rose-500"
                                      : sc.color === "blue"
                                      ? "text-blue-500"
                                      : sc.color === "emerald"
                                      ? "text-emerald-500"
                                      : "text-purple-500"
                                  }`}
                                />
                                <span className="leading-tight">{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Card Footer */}
                        <div className="pt-2 border-t border-border/60 mt-2 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{sc.countLabel}</span>
                          </div>

                          <button
                            type="button"
                            className={`w-full py-1.5 px-3 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-1 transition-colors cursor-pointer ${sc.btnClass}`}
                          >
                            <span>{sc.actionText}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Danh sách các bộ từ vựng thực tế (Bảo tồn toàn bộ chức năng cũ) */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">
                      Danh sách bộ từ vựng:
                    </span>
                    {selectedSkillFilter !== "all" && (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase">
                        Đang lọc: {selectedSkillFilter}
                      </span>
                    )}
                  </div>

                  {selectedSkillFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setSelectedSkillFilter("all")}
                      className="text-xs font-bold text-muted-foreground hover:text-foreground underline cursor-pointer"
                    >
                      Xem tất cả các bộ từ
                    </button>
                  )}
                </div>

              {/* Topic Grid */}
              {loading ? (
                <div className="py-20 text-center text-muted-foreground space-y-3">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-medium">Đang tải các bộ từ vựng từ hệ thống...</p>
                </div>
              ) : error ? (
                <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold text-sm">Chưa thể tải dữ liệu thực tế</p>
                      <p className="text-xs opacity-90">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={loadVocabSets}
                    className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 shrink-0"
                  >
                    Thử lại
                  </button>
                </div>
              ) : filteredTopics.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <h3 className="font-heading font-bold text-base text-foreground">Không có bộ từ vựng nào</h3>
                  <p className="text-xs text-muted-foreground mt-1">Cơ sở dữ liệu hiện tại chưa có bộ từ vựng nào trong danh mục này.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTopics.map((topic) => (
                    <div
                      key={topic.id}
                      className="rounded-xl bg-card text-card-foreground shadow-sm tech-card group border border-border p-5 flex flex-col gap-3 hover:border-primary/50 transition-all"
                    >
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit bg-[hsl(170,60%,92%)] text-[hsl(170,60%,28%)] border-[hsl(170,60%,80%)]">
                        {topic.category}
                      </div>

                      <h3 className="font-heading font-semibold text-foreground text-base leading-snug">
                        {topic.name}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {topic.wordCount} từ vựng
                      </span>

                      <div className="flex gap-2 mt-auto pt-2">
                        <button
                          type="button"
                          onClick={() => handleSelectTopic(topic)}
                          className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border bg-background h-9 rounded-md px-3 flex-1 gap-1.5 border-primary/40 text-primary hover:bg-primary/5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Xem nhanh</span>
                        </button>

                        <Link
                          href={`/vocabulary/${topic.id}`}
                          className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground hover:bg-brand-brown h-9 rounded-md px-3 flex-1 gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Luyện tập</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            </>
          ) : (
            /* My Saved Vocabulary Notebook (Screenshot 2) */
            <div className="space-y-8">
              {/* 1. Stats row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-heading text-foreground block">
                      {notebookWords.length}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Tổng số từ</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-heading text-foreground block">
                      {Math.max(0, notebookWords.length > 0 ? notebookWords.length - 1 : 0)}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Từ đã thuộc</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-black font-heading text-foreground block">
                      {notebookWords.length > 0 ? 1 : 0}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">Từ cần ôn</span>
                  </div>
                </div>
              </div>

              {/* 2. Danh sách từ vựng của tôi */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base md:text-lg text-foreground">
                    Danh sách từ vựng của tôi
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsGoogleSheetModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Nhập từ Google Sheet</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddWordModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white hover:brightness-110 font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm từ thủ công</span>
                    </button>
                  </div>
                </div>

                {notebookWords.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center max-w-2xl mx-auto space-y-3">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-muted/60 text-muted-foreground/60 flex items-center justify-center">
                      <Folder className="w-7 h-7" />
                    </div>
                    <h4 className="font-heading font-bold text-base text-foreground">
                      Chưa có danh sách nào
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Bấm &quot;Tạo danh sách mới&quot; hoặc tra từ khi làm bài để bắt đầu!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {notebookWords.map((item) => (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-heading font-bold text-base text-foreground">
                                {item.word}
                              </span>
                              {item.phonetic && (
                                <span className="text-xs text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                                  {item.phonetic}
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteNotebookWord(item.id)}
                              className="w-7 h-7 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground transition-colors"
                              title="Xóa khỏi sổ tay"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-foreground font-medium mb-2">
                            {item.meaning}
                          </p>
                          {item.example && (
                            <p className="text-[11px] text-muted-foreground italic border-l-2 border-primary/30 pl-2.5 py-0.5">
                              &quot;{item.example}&quot;
                            </p>
                          )}
                        </div>
                        <div className="pt-3 border-t border-border/60 mt-3 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              if ("speechSynthesis" in window) {
                                const u = new SpeechSynthesisUtterance(item.word);
                                u.lang = "en-US";
                                window.speechSynthesis.speak(u);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Phát âm</span>
                          </button>
                          <span className="text-[10px] text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full font-semibold">
                            ✓ Đang ghi nhớ
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Word Modal */}
          {isAddWordModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                  <h3 className="font-heading font-bold text-base text-foreground flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" />
                    <span>Thêm từ vựng vào sổ tay</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddWordModalOpen(false)}
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddNotebookWord} className="space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Từ vựng tiếng Anh <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ubiquitous"
                      value={newWord.word}
                      onChange={(e) => setNewWord((prev) => ({ ...prev, word: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Phiên âm IPA (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. /juːˈbɪk.wə.təs/"
                      value={newWord.phonetic}
                      onChange={(e) => setNewWord((prev) => ({ ...prev, phonetic: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Nghĩa tiếng Việt <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Phổ biến, có mặt ở khắp mọi nơi"
                      value={newWord.meaning}
                      onChange={(e) => setNewWord((prev) => ({ ...prev, meaning: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">
                      Câu ví dụ minh họa
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Smartphones have become ubiquitous in daily life."
                      value={newWord.example}
                      onChange={(e) => setNewWord((prev) => ({ ...prev, example: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl bg-muted/40 border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-border flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddWordModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="tech-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary-glow transition-all"
                    >
                      Lưu từ vựng
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Google Sheet Import Modal */}
          {isGoogleSheetModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-4 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-foreground">
                        Nhập từ vựng từ Google Sheet
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Đồng bộ nhanh danh sách từ vựng từ bảng tính công khai
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleSheetModalOpen(false);
                      setSheetError(null);
                      setParsedSheetWords([]);
                    }}
                    className="w-7 h-7 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-4 pr-1">
                  {/* Hướng dẫn định dạng */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-2">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cấu trúc bảng tính được hỗ trợ:</span>
                    </div>
                    <ul className="list-disc pl-4 space-y-1 text-muted-foreground text-[11.5px]">
                      <li>
                        <strong>Cột A:</strong> STT (hoặc Từ vựng) · <strong>Cột B:</strong> Từ vựng (Word) · <strong>Cột C:</strong> Nghĩa tiếng Việt (Meaning)
                      </li>
                      <li>
                        Cột D & E (tùy chọn): Phiên âm IPA & Câu ví dụ minh họa.
                      </li>
                      <li>
                        Bảng tính cần được bật quyền: <em>&quot;Bất kỳ ai có đường liên kết đều có thể xem&quot;</em>.
                      </li>
                    </ul>
                  </div>

                  {/* Form nhập link */}
                  <form onSubmit={handleFetchSheetData} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-foreground block mb-1">
                        Đường link Google Sheet <span className="text-destructive">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          required
                          placeholder="https://docs.google.com/spreadsheets/d/..."
                          value={sheetUrl}
                          onChange={(e) => setSheetUrl(e.target.value)}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-background border border-border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="submit"
                          disabled={isFetchingSheet}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-60 cursor-pointer"
                        >
                          {isFetchingSheet ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Đang tải...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải dữ liệu</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Thông báo lỗi */}
                  {sheetError && (
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{sheetError}</span>
                    </div>
                  )}

                  {/* Thông báo thành công */}
                  {sheetSuccessMessage && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{sheetSuccessMessage}</span>
                    </div>
                  )}

                  {/* Danh sách xem trước */}
                  {parsedSheetWords.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Tìm thấy {parsedSheetWords.length} từ vựng
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Xem trước dữ liệu
                        </span>
                      </div>

                      <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background divide-y divide-border">
                        {parsedSheetWords.map((item, idx) => (
                          <div key={idx} className="p-2.5 text-xs flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-primary flex items-center gap-2">
                                <span>{item.word}</span>
                                {item.phonetic && (
                                  <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                    {item.phonetic}
                                  </span>
                                )}
                              </div>
                              <div className="text-foreground text-[11.5px] mt-0.5">{item.meaning}</div>
                              {item.example && (
                                <div className="text-[10.5px] text-muted-foreground italic mt-0.5">
                                  Ví dụ: {item.example}
                                </div>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Modal */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-2 mt-4 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGoogleSheetModalOpen(false);
                      setSheetError(null);
                      setParsedSheetWords([]);
                    }}
                    className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    disabled={parsedSheetWords.length === 0}
                    onClick={handleApplySheetWordsToNotebook}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thêm {parsedSheetWords.length} từ vào Sổ tay</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quick View Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-xs font-bold text-primary uppercase">
                  {selectedTopic.category}
                </span>
                <h3 className="font-heading font-bold text-xl text-foreground">
                  {selectedTopic.name} ({selectedTopic.wordCount} từ)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-4 space-y-4 flex-1">
              {selectedTopic.sampleWords.map((w, idx) => (
                <div
                  key={w.word}
                  className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-base text-foreground">{w.word}</span>
                      <span className="text-xs text-muted-foreground italic font-mono">
                        {w.ipa}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {w.pos}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-primary">{w.meaning}</p>
                  <p className="text-xs text-muted-foreground italic">
                    Ví dụ: &ldquo;{w.example}&rdquo;
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTopic(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Đóng
              </button>
              <Link
                href={`/vocabulary/${selectedTopic.id}`}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown inline-flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Bắt đầu luyện tập</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}
