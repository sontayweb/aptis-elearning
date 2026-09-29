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
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState<VocabTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<VocabTopic | null>(null);
  const [practiceMode, setPracticeMode] = useState<VocabTopic | null>(null);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
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

  // Chế độ kiểm tra (Test Mode): 10 từ vựng ngẫu nhiên / 15 phút (Mục 3.5 Đặc tả)
  const [testMode, setTestMode] = useState(false);
  const [testWords, setTestWords] = useState<
    Array<{
      word: string;
      pos: string;
      ipa: string;
      meaning: string;
      example: string;
      options: string[];
      correctIndex: number;
    }>
  >([]);
  const [testIndex, setTestIndex] = useState(0);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testTimeLeft, setTestTimeLeft] = useState(15 * 60);
  const [testFinished, setTestFinished] = useState(false);

  const startTestMode = () => {
    const allWords = topics.flatMap((t) => t.sampleWords);
    if (allWords.length === 0) return;

    // Chọn ngẫu nhiên tối đa 10 từ
    const shuffled = [...allWords].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.min(10, shuffled.length));

    const questions = selected.map((item) => {
      const otherMeanings = allWords
        .filter((w) => w.meaning !== item.meaning)
        .map((w) => w.meaning)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      const allOptions = [item.meaning, ...otherMeanings].sort(() => 0.5 - Math.random());
      const correctIndex = allOptions.indexOf(item.meaning);

      return {
        word: item.word,
        pos: item.pos,
        ipa: item.ipa,
        meaning: item.meaning,
        example: item.example,
        options: allOptions,
        correctIndex,
      };
    });

    setTestWords(questions);
    setTestIndex(0);
    setTestAnswers({});
    setTestTimeLeft(15 * 60);
    setTestFinished(false);
    setTestMode(true);
  };

  useEffect(() => {
    if (!testMode || testFinished) return;
    const timer = setInterval(() => {
      setTestTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setTestFinished(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testMode, testFinished]);

  const testScore = testWords.filter(
    (q, idx) => testAnswers[idx] === q.correctIndex
  ).length;

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

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "420px", height: "420px", background: "hsl(var(--accent) / 0.32)" }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -bottom-40 -left-20 opacity-70"
            style={{ width: "320px", height: "320px", background: "hsl(var(--primary) / 0.35)" }}
          />

          <div className="section-container py-10 md:py-14 flex flex-col md:flex-row items-center gap-6 relative z-10">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground shrink-0 shadow-lg">
              <BookOpen className="w-8 h-8" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
                Học từ vựng Aptis
              </h1>
              <p className="text-muted-foreground mt-1 text-base md:text-lg">
                Ôn luyện từ vựng theo các chủ đề trong bộ đề thi &amp; quản lý kho từ cá nhân
              </p>
            </div>
          </div>
        </section>

        {/* Tab switcher */}
        <div className="section-container py-8">
          <div className="inline-flex items-center justify-center text-muted-foreground w-full max-w-md mx-auto md:mx-0 h-12 p-1 bg-muted rounded-xl mb-8">
            <button
              type="button"
              onClick={() => setActiveTab("aptis")}
              className={`inline-flex items-center justify-center flex-1 h-full rounded-lg text-sm font-semibold transition-all ${
                activeTab === "aptis"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:text-foreground"
              }`}
            >
              <Library className="w-4 h-4 mr-2" />
              <span>Từ vựng bài thi Aptis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`inline-flex items-center justify-center flex-1 h-full rounded-lg text-sm font-semibold transition-all ${
                activeTab === "my"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:text-foreground"
              }`}
            >
              <Brain className="w-4 h-4 mr-2" />
              <span>Kho từ vựng của tôi</span>
            </button>
          </div>

          {activeTab === "aptis" ? (
            <>
              {/* Search Bar & Test Mode Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-base md:text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Tìm bộ từ vựng…"
                  />
                </div>
                <button
                  type="button"
                  onClick={startTestMode}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow hover:bg-primary-glow transition-all shrink-0"
                >
                  <Clock className="w-4 h-4" />
                  <span>Kiểm tra 15 phút (Test Mode)</span>
                </button>
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

                        <button
                          type="button"
                          onClick={() => {
                            setPracticeMode(topic);
                            setQuizIndex(0);
                            setQuizScore(0);
                          }}
                          className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-sm font-medium bg-primary text-primary-foreground hover:bg-brand-brown h-9 rounded-md px-3 flex-1 gap-1.5 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Luyện tập</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  <button
                    type="button"
                    onClick={() => setIsAddWordModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] text-white hover:brightness-110 font-bold text-xs shadow-sm transition-all"
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Tạo danh sách mới</span>
                  </button>
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

              {/* 3. Luyện tập từ vựng (Screenshot 2) */}
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-heading font-bold text-base md:text-lg text-foreground">
                  Luyện tập từ vựng
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Flashcards */}
                  <div
                    onClick={startTestMode}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          Flashcards
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Lật thẻ để ôn lại các từ trong kho cá nhân của bạn
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Quiz */}
                  <div
                    onClick={startTestMode}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                        <Brain className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          Quiz
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Kiểm tra từ vựng bằng trắc nghiệm 4 đáp án
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Matching */}
                  <div
                    onClick={startTestMode}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                          Matching
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Ghép từ tiếng Anh với nghĩa tiếng Việt trong thời gian giới hạn
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
              <button
                type="button"
                onClick={() => {
                  setPracticeMode(selectedTopic);
                  setSelectedTopic(null);
                  setQuizIndex(0);
                  setQuizScore(0);
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-brand-brown"
              >
                Bắt đầu luyện tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Practice Quiz Modal */}
      {practiceMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-xs font-bold text-primary">
                Luyện tập: {practiceMode.name}
              </span>
              <button
                type="button"
                onClick={() => setPracticeMode(null)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quizIndex < practiceMode.sampleWords.length ? (
              <div className="py-6 space-y-4">
                <div className="text-xs text-muted-foreground">
                  Từ {quizIndex + 1} / {practiceMode.sampleWords.length}
                </div>
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <div className="text-2xl font-bold font-heading text-primary">
                    {practiceMode.sampleWords[quizIndex].word}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {practiceMode.sampleWords[quizIndex].ipa}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-foreground">Chọn nghĩa đúng:</p>
                  {practiceMode.sampleWords.map((w, idx) => (
                    <button
                      key={w.word}
                      type="button"
                      onClick={() => {
                        if (idx === quizIndex) setQuizScore((s) => s + 1);
                        setQuizIndex((prev) => prev + 1);
                      }}
                      className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 text-sm transition-all"
                    >
                      {w.meaning}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="font-heading font-bold text-xl text-foreground">
                  Hoàn thành luyện tập!
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bạn trả lời đúng {quizScore} / {practiceMode.sampleWords.length} từ.
                </p>
                <button
                  type="button"
                  onClick={() => setPracticeMode(null)}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm"
                >
                  Quay lại danh mục
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Mode Modal (10 từ ngẫu nhiên / 15 phút) */}
      {testMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  <Award className="w-3.5 h-3.5" />
                  Test Mode 15 Phút
                </span>
                <span className="text-xs text-muted-foreground font-mono font-bold">
                  {Math.floor(testTimeLeft / 60).toString().padStart(2, "0")}:
                  {(testTimeLeft % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTestMode(false)}
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!testFinished && testWords.length > 0 ? (
              <div className="py-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Câu hỏi {testIndex + 1} / {testWords.length}</span>
                  <span>Đã làm: {Object.keys(testAnswers).length}/{testWords.length}</span>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                  <div className="text-2xl font-bold font-heading text-primary">
                    {testWords[testIndex].word}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1">
                    {testWords[testIndex].ipa} · <span className="italic">{testWords[testIndex].pos}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-foreground">Chọn nghĩa chính xác nhất:</p>
                  {testWords[testIndex].options.map((opt, optIdx) => {
                    const isSelected = testAnswers[testIndex] === optIdx;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setTestAnswers((prev) => ({ ...prev, [testIndex]: optIdx }));
                          if (testIndex < testWords.length - 1) {
                            setTestIndex((i) => i + 1);
                          } else {
                            setTestFinished(true);
                          }
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center gap-3 ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        <span className="w-6 h-6 rounded-md border border-current/30 flex items-center justify-center font-bold text-xs shrink-0">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-4 border-t border-border">
                  <button
                    type="button"
                    disabled={testIndex === 0}
                    onClick={() => setTestIndex((i) => Math.max(0, i - 1))}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-muted disabled:opacity-40"
                  >
                    Câu trước
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (testIndex < testWords.length - 1) {
                        setTestIndex((i) => i + 1);
                      } else {
                        setTestFinished(true);
                      }
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary-glow"
                  >
                    {testIndex === testWords.length - 1 ? "Nộp bài" : "Câu tiếp"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-heading font-bold text-xl text-foreground">
                  Kết Quả Kiểm Tra Từ Vựng
                </h3>
                <div className="p-4 rounded-xl bg-muted/50 border border-border inline-block min-w-[200px]">
                  <div className="text-3xl font-extrabold text-primary font-heading">
                    {testScore} / {testWords.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Độ chính xác: {Math.round((testScore / (testWords.length || 1)) * 100)}%
                  </p>
                </div>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={startTestMode}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border font-bold text-xs hover:bg-muted"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại đề khác</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestMode(false)}
                    className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary-glow"
                  >
                    Hoàn tất
                  </button>
                </div>
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
