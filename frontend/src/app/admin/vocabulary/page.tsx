"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  BookMarked,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  Volume2,
  Edit2,
  Save,
  X,
  Layers,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Crown,
  BookOpen,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Tag,
  Check,
  Download,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";

interface VocabSet {
  id: string;
  title: string;
  category: string;
  total_words: number;
  is_free: boolean;
  created_at?: string;
}

interface VocabWord {
  id: string;
  set_id: string;
  word: string;
  phonetic?: string | null;
  meaning_vi: string;
  example_sentence?: string | null;
  cefr_level: string;
}

export default function AdminVocabularyPage() {
  const [sets, setSets] = useState<VocabSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<VocabSet | null>(null);
  const [words, setWords] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [wordsLoading, setWordsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Smart Toggle for KPI metrics strip (defaults to false for clean workhorse layout, persists in localStorage)
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_vocab_kpi_visible") : null;
    if (saved === "true") {
      setShowMetrics(true);
    }
  }, []);

  const toggleMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_vocab_kpi_visible", String(next));
      }
      return next;
    });
  };

  // Inline editing state
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editMeaning, setEditMeaning] = useState("");
  const [editPhonetic, setEditPhonetic] = useState("");
  const [editExample, setEditExample] = useState("");
  const [editCefr, setEditCefr] = useState("B1");

  // Create Set Modal
  const [createSetModalOpen, setCreateSetModalOpen] = useState(false);
  const [newSetForm, setNewSetForm] = useState({
    title: "",
    category: "B2 Business",
    is_free: false,
  });
  const [createSetLoading, setCreateSetLoading] = useState(false);

  // Add word modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState({
    word: "",
    phonetic: "",
    meaningVi: "",
    exampleSentence: "",
    cefrLevel: "B1",
  });
  const [addWordLoading, setAddWordLoading] = useState(false);

  // Bulk Import Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importLoading, setImportLoading] = useState(false);

  // Confirm delete modals
  const [confirmDeleteSet, setConfirmDeleteSet] = useState<VocabSet | null>(null);
  const [confirmDeleteWord, setConfirmDeleteWord] = useState<VocabWord | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchSets = async () => {
    setLoading(true);
    try {
      const res = await api.vocabulary.getSets();
      if (res.success && res.data) {
        setSets(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách bộ từ vựng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, []);

  // Lock body scroll for modals
  useEffect(() => {
    if (
      addModalOpen ||
      createSetModalOpen ||
      importModalOpen ||
      confirmDeleteSet ||
      confirmDeleteWord
    ) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setAddModalOpen(false);
          setCreateSetModalOpen(false);
          setImportModalOpen(false);
          setConfirmDeleteSet(null);
          setConfirmDeleteWord(null);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [addModalOpen, createSetModalOpen, importModalOpen, confirmDeleteSet, confirmDeleteWord]);

  const handleSelectSet = async (set: VocabSet) => {
    setSelectedSet(set);
    setWordsLoading(true);
    try {
      const res = await api.vocabulary.getWords(set.id);
      if (res.success && res.data) {
        setWords(res.data.words || []);
      }
    } catch (err) {
      console.error("Lỗi tải từ vựng trong bộ:", err);
    } finally {
      setWordsLoading(false);
    }
  };

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetForm.title) return;
    setCreateSetLoading(true);
    try {
      const res = await api.vocabulary.createSet(newSetForm);
      if (res.success) {
        showToast(`Đã tạo bộ từ vựng "${newSetForm.title}" thành công!`);
        setCreateSetModalOpen(false);
        setNewSetForm({ title: "", category: "B2 Business", is_free: false });
        fetchSets();
      } else {
        showToast(res.error?.message || "Không thể tạo bộ từ");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setCreateSetLoading(false);
    }
  };

  const handleDeleteSet = async () => {
    if (!confirmDeleteSet) return;
    try {
      const res = await api.vocabulary.deleteSet(confirmDeleteSet.id);
      if (res.success) {
        showToast(`Đã xóa bộ từ "${confirmDeleteSet.title}"!`);
        setConfirmDeleteSet(null);
        if (selectedSet?.id === confirmDeleteSet.id) {
          setSelectedSet(null);
        }
        fetchSets();
      } else {
        showToast(res.error?.message || "Không thể xóa bộ từ");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleStartEdit = (w: VocabWord) => {
    setEditingWordId(w.id);
    setEditMeaning(w.meaning_vi);
    setEditPhonetic(w.phonetic || "");
    setEditExample(w.example_sentence || "");
    setEditCefr(w.cefr_level || "B1");
  };

  const handleSaveEdit = async (wordId: string) => {
    try {
      const res = await api.vocabulary.updateWord(wordId, {
        meaning_vi: editMeaning,
        phonetic: editPhonetic || undefined,
        example_sentence: editExample || undefined,
        cefr_level: editCefr,
      });

      if (res.success) {
        setWords((prev) =>
          prev.map((w) =>
            w.id === wordId
              ? {
                  ...w,
                  meaning_vi: editMeaning,
                  phonetic: editPhonetic || null,
                  example_sentence: editExample || null,
                  cefr_level: editCefr,
                }
              : w
          )
        );
        setEditingWordId(null);
        showToast("Đã lưu cập nhật từ vựng thành công!");
      } else {
        showToast(res.error?.message || "Lỗi cập nhật từ");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleDeleteWord = async () => {
    if (!confirmDeleteWord) return;
    try {
      const res = await api.vocabulary.deleteWord(confirmDeleteWord.id);
      if (res.success) {
        setWords((prev) => prev.filter((w) => w.id !== confirmDeleteWord.id));
        setSets((prev) =>
          prev.map((s) =>
            s.id === selectedSet?.id ? { ...s, total_words: Math.max(0, s.total_words - 1) } : s
          )
        );
        showToast(`Đã xóa từ "${confirmDeleteWord.word}" khỏi bộ!`);
        setConfirmDeleteWord(null);
      } else {
        showToast(res.error?.message || "Không thể xóa từ");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSet || !newWord.word || !newWord.meaningVi) return;
    setAddWordLoading(true);

    try {
      const res = await api.vocabulary.createWord(selectedSet.id, {
        word: newWord.word.trim(),
        phonetic: newWord.phonetic.trim() || undefined,
        meaning_vi: newWord.meaningVi.trim(),
        example_sentence: newWord.exampleSentence.trim() || undefined,
        cefr_level: newWord.cefrLevel,
      });

      if (res.success && res.data) {
        setWords([res.data, ...words]);
        setSets((prev) =>
          prev.map((s) =>
            s.id === selectedSet.id ? { ...s, total_words: s.total_words + 1 } : s
          )
        );
        setAddModalOpen(false);
        setNewWord({
          word: "",
          phonetic: "",
          meaningVi: "",
          exampleSentence: "",
          cefrLevel: "B1",
        });
        showToast(`Đã thêm từ "${res.data.word}" vào bộ từ vựng!`);
      } else {
        showToast(res.error?.message || "Không thể thêm từ");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setAddWordLoading(false);
    }
  };

  const handleImportWords = async () => {
    if (!selectedSet || !importText.trim()) return;
    setImportLoading(true);
    try {
      let parsedWords: any[] = [];
      // Try JSON format
      if (importText.trim().startsWith("[")) {
        parsedWords = JSON.parse(importText);
      } else {
        // Line-by-line format: Word | Phonetic | Meaning | CEFR | Example
        const lines = importText.split("\n").filter((l) => l.trim().length > 0);
        parsedWords = lines.map((line) => {
          const parts = line.split("|").map((p) => p.trim());
          return {
            word: parts[0] || "",
            phonetic: parts[1] || "",
            meaning_vi: parts[2] || "",
            cefr_level: parts[3] || "B1",
            example_sentence: parts[4] || "",
          };
        });
      }

      const res = await api.vocabulary.importWords(selectedSet.id, parsedWords);
      if (res.success) {
        showToast(`Đã nhập thành công ${parsedWords.length} từ vào bộ!`);
        setImportModalOpen(false);
        setImportText("");
        handleSelectSet(selectedSet);
        fetchSets();
      } else {
        showToast(res.error?.message || "Lỗi nhập danh sách từ");
      }
    } catch (err: any) {
      showToast("Định dạng dữ liệu không hợp lệ. Vui lòng kiểm tra lại cấu trúc.");
    } finally {
      setImportLoading(false);
    }
  };

  // Web Speech API for instant native pronunciation audio
  const handleSpeak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const filteredSets = sets.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (categoryFilter === "ALL") return matchesSearch;
    if (categoryFilter === "FREE") return matchesSearch && s.is_free;
    if (categoryFilter === "PRO") return matchesSearch && !s.is_free;
    return matchesSearch && s.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const filteredWords = words.filter(
    (w) =>
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaning_vi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalWordsInSystem = sets.reduce((sum, s) => sum + (s.total_words || 0), 0);
  const proSetsCount = sets.filter((s) => !s.is_free).length;

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <BookMarked className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Kho Từ Vựng Khảo Thí</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Kho Từ vựng Aptis</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Ngân hàng từ vựng học thuật CEFR B1 - C2, từ điển chuyên ngành và công cụ biên tập trực tiếp
          </p>

          {/* Compact Inline Metrics Strip (Subtle Neutral Gray Chips) */}
          {!selectedSet && !showMetrics && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
                Chỉ số nhanh:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <BookMarked className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Tổng: <strong className="text-slate-900 dark:text-white font-mono">{sets.length}</strong> bộ</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Layers className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Từ vựng: <strong className="text-slate-900 dark:text-white font-mono">{totalWordsInSystem}</strong> từ</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Crown className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span>VIP: <strong className="text-slate-900 dark:text-white font-mono">{proSetsCount}</strong> ({sets.length - proSetsCount} Free)</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                <Sparkles className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Độ phủ: <strong className="text-slate-900 dark:text-white font-mono">B1 — C2</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Toggle Button */}
          {!selectedSet && (
            <button
              type="button"
              onClick={toggleMetrics}
              className={`px-3.5 py-2 rounded-xl border text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
                showMetrics
                  ? "bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700 shadow-sm"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              }`}
              title={showMetrics ? "Thu gọn 4 thẻ chỉ số để giải phóng không gian danh sách từ" : "Mở rộng 4 thẻ chỉ số thống kê"}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{showMetrics ? "Thu gọn chỉ số" : "Chỉ số chi tiết"}</span>
              {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
          {!selectedSet ? (
            <button
              onClick={() => setCreateSetModalOpen(true)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo bộ từ mới</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportModalOpen(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5"
                title="Nhập danh sách từ hàng loạt"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden sm:inline">Nhập hàng loạt</span>
              </button>

              <button
                onClick={() => setAddModalOpen(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm từ vào bộ</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Cards (Shown on sets view, Collapsible via Smart Toggle) */}
      {!selectedSet && showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Tổng số bộ từ vựng
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <BookMarked className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {sets.length}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Đã phân loại chủ đề</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Tổng từ vựng trong kho
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {totalWordsInSystem}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Chuẩn phát âm IPA & Ví dụ</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Bộ từ VIP PRO
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Crown className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              {proSetsCount}{" "}
              <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">
                / {sets.length - proSetsCount} Free
              </span>
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Dành riêng cho học viên VIP</div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-heading">
                Cấp độ CEFR
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 dark:text-white font-mono">
              B1 — C2
            </div>
            <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-1">Phục vụ mục tiêu Aptis</div>
          </div>
        </div>
      )}

      {/* VIEW 1: SETS GRID */}
      {!selectedSet ? (
        <div className="space-y-4">
          {/* Filters & Search Bar */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên bộ từ..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
              />
            </div>

            <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 flex items-center gap-1 w-full md:w-auto overflow-x-auto">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "B1", label: "Aptis B1" },
                { id: "B2", label: "Aptis B2" },
                { id: "C1", label: "Nâng cao C1" },
                { id: "FREE", label: "Miễn phí" },
                { id: "PRO", label: "VIP PRO" },
              ].map((tab) => {
                const isActive = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sets Grid - Responsive 4 Columns on XL per Guideline 4 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                Đang tải các bộ từ vựng...
              </div>
            ) : filteredSets.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
                Không tìm thấy bộ từ vựng nào phù hợp.
              </div>
            ) : (
              filteredSets.map((set) => (
                <div
                  key={set.id}
                  className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-heading font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {set.category || "Aptis Core"}
                      </span>
                      {set.is_free ? (
                        <span className="text-[10px] font-heading font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                          Miễn phí
                        </span>
                      ) : (
                        <span className="text-[10px] font-heading font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Crown className="w-3 h-3 fill-amber-500 text-amber-500" /> VIP PRO
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => handleSelectSet(set)}
                      className="font-heading font-bold text-slate-900 dark:text-white text-sm mb-1.5 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {set.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-normal">
                      Kho từ vựng chuẩn khung CEFR ôn thi Aptis ESOL
                    </p>
                  </div>

                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between mt-4">
                    <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                      {set.total_words} từ vựng
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleSelectSet(set)}
                        className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>Quản lý từ</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setConfirmDeleteSet(set)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Xóa bộ từ"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* VIEW 2: WORDS DETAIL TABLE WITH INLINE NOTION-STYLE EDIT */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              onClick={() => setSelectedSet(null)}
              className="inline-flex items-center gap-1.5 text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-fit shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại danh sách bộ</span>
            </button>

            <div className="text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
              Đang xem bộ: <span className="text-slate-900 dark:text-white font-bold">{selectedSet.title}</span> (
              <span className="font-mono text-slate-900 dark:text-white font-semibold">{words.length}</span> từ)
            </div>
          </div>

          {/* Search in Set */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm từ tiếng Anh hoặc nghĩa tiếng Việt..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
              />
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              Bấm biểu tượng loa để nghe phát âm giọng bản xứ
            </div>
          </div>

          {/* Words Table with Inline Edit */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700/80 text-slate-500 dark:text-slate-400 font-heading font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Từ vựng (English)</th>
                    <th className="py-3.5 px-4">Phiên âm IPA</th>
                    <th className="py-3.5 px-4">Nghĩa tiếng Việt</th>
                    <th className="py-3.5 px-4">Cấp độ CEFR</th>
                    <th className="py-3.5 px-4">Ví dụ câu</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-900 dark:text-slate-100">
                  {wordsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
                        Đang tải danh sách từ vựng...
                      </td>
                    </tr>
                  ) : filteredWords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400 dark:text-slate-500 font-normal">
                        Chưa có từ vựng nào trong bộ này. Bấm &quot;Thêm từ vào bộ&quot; để bắt đầu.
                      </td>
                    </tr>
                  ) : (
                    filteredWords.map((w) => {
                      const isEditing = editingWordId === w.id;

                      return (
                        <tr key={w.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                          {/* Word */}
                          <td className="py-3.5 px-4 sm:px-6 font-heading font-bold text-slate-900 dark:text-white text-xs">
                            <div className="flex items-center gap-2">
                              <span>{w.word}</span>
                              <button
                                onClick={() => handleSpeak(w.word)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Phát âm từ này"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Phonetic */}
                          <td className="py-3.5 px-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPhonetic}
                                onChange={(e) => setEditPhonetic(e.target.value)}
                                className="p-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                                {w.phonetic || "—"}
                              </span>
                            )}
                          </td>

                          {/* Vietnamese Meaning */}
                          <td className="py-3.5 px-4 max-w-xs">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editMeaning}
                                onChange={(e) => setEditMeaning(e.target.value)}
                                className="p-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <div
                                onClick={() => handleStartEdit(w)}
                                className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-normal text-slate-800 dark:text-slate-200"
                                title="Bấm để chỉnh sửa"
                              >
                                {w.meaning_vi}
                              </div>
                            )}
                          </td>

                          {/* CEFR Level */}
                          <td className="py-3.5 px-4">
                            {isEditing ? (
                              <select
                                value={editCefr}
                                onChange={(e) => setEditCefr(e.target.value)}
                                className="p-1 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                              >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                              </select>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {w.cefr_level || "B1"}
                              </span>
                            )}
                          </td>

                          {/* Example Sentence */}
                          <td className="py-3.5 px-4 max-w-sm">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editExample}
                                onChange={(e) => setEditExample(e.target.value)}
                                className="p-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic font-normal leading-relaxed">
                                {w.example_sentence ? `"${w.example_sentence}"` : "—"}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="inline-flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(w.id)}
                                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                    title="Lưu"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingWordId(null)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Hủy"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(w)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title="Chỉnh sửa trực tiếp"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setConfirmDeleteWord(w)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                    title="Xóa từ khỏi bộ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE VOCAB SET */}
      {createSetModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateSetModalOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-slate-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Tạo Bộ Từ Vựng Mới
                </h3>
              </div>
              <button
                onClick={() => setCreateSetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSet} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-heading font-semibold text-slate-700 mb-1">
                  Tên bộ từ vựng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 300 Cụm Từ Collocations Điểm Cao Aptis C"
                  value={newSetForm.title}
                  onChange={(e) => setNewSetForm({ ...newSetForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                />
              </div>

              <div>
                <label className="block font-heading font-semibold text-slate-700 mb-1">
                  Phân loại / Cấp độ
                </label>
                <select
                  value={newSetForm.category}
                  onChange={(e) => setNewSetForm({ ...newSetForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  <option value="B1 Social">B1 Social & Daily Life</option>
                  <option value="B2 Business">B2 Business & Workplace</option>
                  <option value="B2 Academic">B2 Education & Academic</option>
                  <option value="C1 Advanced">C1 Advanced Collocations</option>
                  <option value="Travel & Hospitality">Travel & Hospitality</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!newSetForm.is_free}
                    onChange={(e) => setNewSetForm({ ...newSetForm, is_free: !e.target.checked })}
                    className="w-4 h-4 rounded text-slate-900 accent-slate-900"
                  />
                  <span className="font-heading font-semibold text-slate-800 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    Đánh dấu là Bộ từ VIP PRO (Chỉ dành cho học viên nâng cấp)
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateSetModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={createSetLoading || !newSetForm.title}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
                >
                  {createSetLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Tạo bộ từ ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD SINGLE WORD */}
      {addModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddModalOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-slate-800" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Thêm Từ Vựng Vào Bộ
                </h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWord} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    Từ tiếng Anh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Elaborate"
                    value={newWord.word}
                    onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    Phiên âm IPA
                  </label>
                  <input
                    type="text"
                    placeholder="/iˈlæb.ər.ət/"
                    value={newWord.phonetic}
                    onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-heading font-semibold text-slate-700 mb-1">
                  Nghĩa tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Giải thích chi tiết, tỉ mỉ, công phu"
                  value={newWord.meaningVi}
                  onChange={(e) => setNewWord({ ...newWord, meaningVi: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    CEFR
                  </label>
                  <select
                    value={newWord.cefrLevel}
                    onChange={(e) => setNewWord({ ...newWord, cefrLevel: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block font-heading font-semibold text-slate-700 mb-1">
                    Ví dụ câu minh họa
                  </label>
                  <input
                    type="text"
                    placeholder="Could you elaborate on that point?"
                    value={newWord.exampleSentence}
                    onChange={(e) => setNewWord({ ...newWord, exampleSentence: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:outline-none focus:border-slate-900 font-sans"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={addWordLoading || !newWord.word || !newWord.meaningVi}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
                >
                  {addWordLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu vào bộ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK IMPORT WORDS */}
      {importModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setImportModalOpen(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <h3 className="font-heading font-bold text-sm text-slate-900">
                  Nhập Từ Vựng Hàng Loạt
                </h3>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-normal">
              Dán dữ liệu mỗi dòng một từ theo định dạng: <br />
              <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded">
                Từ tiếng Anh | Phiên âm IPA | Nghĩa tiếng Việt | Cấp độ CEFR | Câu ví dụ
              </code>{" "}
              hoặc mảng JSON.
            </p>

            <textarea
              rows={10}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={`Accommodate | /əˈkɒm.ə.deɪt/ | Cung cấp nơi ở, đáp ứng | B2 | The hotel can accommodate up to 500 guests.
Priority | /praɪˈɒr.ə.ti/ | Sự ưu tiên hàng đầu | B1 | Safety is our top priority.
Substantial | /səbˈstæn.ʃəl/ | Đáng kể, có giá trị lớn | C1 | There has been a substantial increase in scores.`}
              className="w-full p-3 rounded-xl border border-slate-200 font-mono text-[11px] bg-slate-50 focus:outline-none focus:border-slate-900 text-slate-900"
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-xs transition-colors"
              >
                Hủy
              </button>

              <button
                type="button"
                disabled={importLoading || !importText.trim()}
                onClick={handleImportWords}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-40"
              >
                {importLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                <span>Nhập toàn bộ vào bộ này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODALS */}
      <ConfirmModal
        isOpen={!!confirmDeleteSet}
        title="Xác nhận Xóa Bộ Từ Vựng"
        message={`Bạn có chắc chắn muốn xóa bộ từ "${confirmDeleteSet?.title}"? Toàn bộ từ vựng và ghi chú của học viên trong bộ này sẽ bị xóa khỏi cơ sở dữ liệu.`}
        confirmText="Xác nhận xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteSet}
        onCancel={() => setConfirmDeleteSet(null)}
      />

      <ConfirmModal
        isOpen={!!confirmDeleteWord}
        title="Xác nhận Xóa Từ Vựng"
        message={`Bạn có chắc chắn muốn xóa từ "${confirmDeleteWord?.word}" khỏi bộ từ vựng?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={handleDeleteWord}
        onCancel={() => setConfirmDeleteWord(null)}
      />
    </div>
  );
}
