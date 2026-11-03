"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Lightbulb,
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  Save,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Search,
  Sparkles,
  Eye,
  X,
  Check,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminTableCard from "@/components/admin/admin-table-card";
import ConfirmModal from "@/components/admin/confirm-modal";
import {
  LISTENING_PART1_CATEGORIES,
  LISTENING_PART1_DATA,
  LISTENING_PART2_TOPICS,
  LISTENING_PART3_DATA,
  LISTENING_PART4_DATA,
  Part1Question,
  Part2Topic,
  Part3Item,
  Part4Topic,
} from "@/data/key-meo-listening-data";
import { WRITING_KEY_MEO_DATA, WritingPartData } from "@/data/key-meo-writing-data";
import { SPEAKING_KEY_MEO_DATA, SpeakingPartData } from "@/data/key-meo-speaking-data";
import { READING_KEY_MEO_DATA, ReadingPartData } from "@/data/key-meo-reading-data";
import { WritingCheatSheetView } from "@/components/key-meo-thi/writing-cheat-sheet-view";
import { SpeakingCheatSheetView } from "@/components/key-meo-thi/speaking-cheat-sheet-view";
import { ReadingCheatSheetView } from "@/components/key-meo-thi/reading-cheat-sheet-view";

type SkillType = "listening" | "reading" | "speaking" | "writing";
type TabType = "p1" | "p2" | "p3" | "p4";

export default function AdminKeyVaMeoThiPage() {
  const [activeSkill, setActiveSkill] = useState<SkillType>("listening");
  const [activeTab, setActiveTab] = useState<TabType>("p1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for Listening parts
  const [part1Data, setPart1Data] = useState<Record<string, Part1Question[]>>(LISTENING_PART1_DATA);
  const [activeCat, setActiveCat] = useState<string>("time");
  const [part2Data, setPart2Data] = useState<Part2Topic[]>(LISTENING_PART2_TOPICS);
  const [part3Data, setPart3Data] = useState<Part3Item[]>(LISTENING_PART3_DATA);
  const [part4Data, setPart4Data] = useState<Part4Topic[]>(LISTENING_PART4_DATA);

  // States for Reading, Speaking, Writing
  const [writingData, setWritingData] = useState<Record<string, WritingPartData>>(WRITING_KEY_MEO_DATA);
  const [speakingData, setSpeakingData] = useState<Record<string, SpeakingPartData>>(SPEAKING_KEY_MEO_DATA);
  const [readingData, setReadingData] = useState<Record<string, ReadingPartData>>(READING_KEY_MEO_DATA);

  // Search filters
  const [search, setSearch] = useState("");

  // Modal edit state
  const [editingItem, setEditingItem] = useState<{ part: TabType; data: any; index?: number } | null>(null);

  // Load custom settings from Database if exists
  useEffect(() => {
    async function loadCustomConfig() {
      try {
        setLoading(true);
        const res: any = await api.settings.getPublic();
        if (res.success && res.data?.raw?.KEY_MEO_LISTENING_CONFIG) {
          const cfg = JSON.parse(res.data.raw.KEY_MEO_LISTENING_CONFIG);
          if (cfg.part1) setPart1Data(cfg.part1);
          if (cfg.part2) setPart2Data(cfg.part2);
          if (cfg.part3) setPart3Data(cfg.part3);
          if (cfg.part4) setPart4Data(cfg.part4);
          if (cfg.writing) setWritingData(cfg.writing);
          if (cfg.speaking) setSpeakingData(cfg.speaking);
          if (cfg.reading) setReadingData(cfg.reading);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomConfig();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save all custom data to Database (SystemSetting: KEY_MEO_LISTENING_CONFIG)
  const handleSaveToDatabase = async () => {
    try {
      setSaving(true);
      const payload = {
        part1: part1Data,
        part2: part2Data,
        part3: part3Data,
        part4: part4Data,
        writing: writingData,
        speaking: speakingData,
        reading: readingData,
        updatedAt: new Date().toISOString(),
      };

      const res = await api.settings.update({
        settings: [
          {
            key: "KEY_MEO_LISTENING_CONFIG",
            value: JSON.stringify(payload),
            description: "Cấu hình ngân hàng câu hỏi & mẹo thi 4 kỹ năng (Listening, Reading, Speaking, Writing)",
          },
        ],
      });

      if (res.success) {
        showToast("✓ Đã lưu toàn bộ cấu hình Key & Mẹo Thi 4 kỹ năng vào Database!");
      } else {
        showToast("❌ Lưu thất bại: " + (res.message || "Lỗi máy chủ"));
      }
    } catch (err: any) {
      showToast("❌ Lỗi kết nối: " + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  // Reset to default seed data
  const handleResetToDefault = () => {
    if (confirm("Bạn có chắc chắn muốn khôi phục về dữ liệu ngân hàng đề mặc định cho tất cả kỹ năng?")) {
      setPart1Data(LISTENING_PART1_DATA);
      setPart2Data(LISTENING_PART2_TOPICS);
      setPart3Data(LISTENING_PART3_DATA);
      setPart4Data(LISTENING_PART4_DATA);
      setWritingData(WRITING_KEY_MEO_DATA);
      setSpeakingData(SPEAKING_KEY_MEO_DATA);
      setReadingData(READING_KEY_MEO_DATA);
      showToast("✓ Đã khôi phục về dữ liệu gốc mặc định. Bấm 'Lưu lên hệ thống' để áp dụng!");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 px-4 py-3 rounded-xl bg-card border border-primary/30 shadow-lg text-xs font-bold text-foreground flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Actions */}
      <AdminPageHeader
        title="Quản Trị Key & Mẹo Thi (Aptis ESOL)"
        description="Cấu hình ngân hàng câu hỏi, bóc tách audio script và ma trận đáp án 4 kỹ năng hiển thị cho học viên."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/key-va-meo-thi?skill=${activeSkill}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Xem giao diện học viên ↗</span>
            </Link>

            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Khôi phục dữ liệu gốc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục gốc</span>
            </button>

            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Đang lưu..." : "Lưu lên hệ thống"}</span>
            </button>
          </div>
        }
      />

      {/* LEVEL 1: SKILL TABS (Listening, Reading, Speaking, Writing) */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { id: "listening", label: "Listening", icon: Headphones, count: "4 Phần" },
          { id: "reading", label: "Reading", icon: BookOpen, count: "4 Phần" },
          { id: "speaking", label: "Speaking", icon: Mic, count: "4 Phần" },
          { id: "writing", label: "Writing", icon: PenTool, count: "4 Phần" },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = activeSkill === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSkill(s.id as SkillType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{s.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                  isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                }`}
              >
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {activeSkill === "listening" && (
        <div className="space-y-6">
          {/* Main Tabs Navigation (Part 1 - Part 4) */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            {[
              { id: "p1", label: "Part 1: Nhóm Đáp Án", count: `${Object.values(part1Data).flat().length} câu` },
              { id: "p2", label: "Part 2: Ghép Người Nói", count: `${part2Data.length} chủ đề` },
              { id: "p3", label: "Part 3: Ma Trận Câu 15", count: `${part3Data.length} chủ đề` },
              { id: "p4", label: "Part 4: Mẹo Học Topic", count: `${part4Data.length} topic 2026` },
            ].map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id as TabType);
                    setSearch("");
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

      {/* ========================================================================= */}
      {/* TAB 1: PART 1 QUẢN TRỊ NHÓM ĐÁP ÁN */}
      {/* ========================================================================= */}
      {activeTab === "p1" && (
        <div className="space-y-4">
          {/* Sub-category selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {LISTENING_PART1_CATEGORIES.map((cat) => {
              const isActive = activeCat === cat.id;
              const count = part1Data[cat.id]?.length || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    isActive
                      ? "bg-primary/10 border-primary text-primary shadow-xs"
                      : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  <span>{cat.num} {cat.label}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted font-mono">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm câu hỏi hoặc đáp án trong nhóm này..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => {
                const currentList = part1Data[activeCat] || [];
                const newNum = currentList.length + 1;
                const newItem: Part1Question = {
                  id: `p1-${activeCat}-${Date.now()}`,
                  number: newNum,
                  question: "",
                  answer: "",
                  isNew: true,
                };
                setEditingItem({ part: "p1", data: newItem });
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm câu hỏi vào nhóm</span>
            </button>
          </div>

          {/* Questions Table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[11px] font-black uppercase text-muted-foreground">
                  <th className="p-3.5 w-16 text-center">STT</th>
                  <th className="p-3.5">CÂU HỎI</th>
                  <th className="p-3.5 w-64">ĐÁP ÁN</th>
                  <th className="p-3.5 w-24 text-center">TAG</th>
                  <th className="p-3.5 w-24 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(part1Data[activeCat] || [])
                  .filter(
                    (q) =>
                      q.question.toLowerCase().includes(search.toLowerCase()) ||
                      q.answer.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((q, idx) => (
                    <tr key={q.id || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                        {String(q.number).padStart(2, "0")}
                      </td>
                      <td className="p-3.5 font-bold text-foreground">{q.question}</td>
                      <td className="p-3.5 font-mono font-bold text-rose-500">{q.answer}</td>
                      <td className="p-3.5 text-center">
                        {q.isNew ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-500/30">
                            MỚI
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground font-medium">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingItem({ part: "p1", data: { ...q }, index: idx })}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Sửa câu hỏi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Xóa câu hỏi này?")) {
                                setPart1Data((prev) => ({
                                  ...prev,
                                  [activeCat]: (prev[activeCat] || []).filter((_, i) => i !== idx),
                                }));
                                showToast("Đã xóa câu hỏi");
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PART 2 QUẢN TRỊ GHÉP NGƯỜI NÓI */}
      {/* ========================================================================= */}
      {activeTab === "p2" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề Part 2..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => {
                const newTopic: Part2Topic = {
                  id: `p2-t${Date.now()}`,
                  topicNumber: part2Data.length + 1,
                  title: "",
                  cloverCount: 3,
                  rows: [
                    { targetAnswer: "", targetAnswerVn: "", audioScript: "", keywords: [] },
                    { targetAnswer: "", targetAnswerVn: "", audioScript: "", keywords: [] },
                    { targetAnswer: "", targetAnswerVn: "", audioScript: "", keywords: [] },
                    { targetAnswer: "", targetAnswerVn: "", audioScript: "", keywords: [] },
                  ],
                };
                setEditingItem({ part: "p2", data: newTopic });
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm chủ đề mới</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
            {part2Data
              .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
              .map((topic, tIdx) => (
                <div key={topic.id || tIdx} className="p-4 md:p-5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-muted-foreground">
                        #{topic.topicNumber}
                      </span>
                      <h3 className="font-bold text-sm text-foreground">{topic.title}</h3>
                      <span className="text-emerald-500 text-xs">{"🍀".repeat(topic.cloverCount)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setEditingItem({
                            part: "p2",
                            data: JSON.parse(JSON.stringify(topic)),
                            index: tIdx,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                        title="Chỉnh sửa chủ đề & câu thoại"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-primary" />
                        <span>Sửa chủ đề</span>
                      </button>

                      <button
                        onClick={() => {
                          const newRows = [...topic.rows];
                          newRows.push({
                            targetAnswer: "Đáp án mẫu",
                            targetAnswerVn: "Bản dịch nghĩa",
                            audioScript: "Câu thoại người nói...",
                            keywords: ["từ khóa 1", "từ khóa 2"],
                          });
                          const updated = [...part2Data];
                          updated[tIdx].rows = newRows;
                          setPart2Data(updated);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold text-primary hover:bg-primary/10 cursor-pointer"
                      >
                        + Dòng nghe ({topic.rows.length}/4)
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Xóa chủ đề "${topic.title}"?`)) {
                            setPart2Data((prev) => prev.filter((_, i) => i !== tIdx));
                            showToast("Đã xóa chủ đề");
                          }
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                        title="Xóa chủ đề"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {topic.rows.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {topic.rows.map((row, rIdx) => (
                        <div
                          key={rIdx}
                          className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                        >
                          <div className="w-full md:w-1/4">
                            <span className="font-bold text-foreground">{row.targetAnswer}</span>
                            <span className="text-[11px] text-muted-foreground block italic">({row.targetAnswerVn})</span>
                          </div>
                          <div className="w-full md:w-5/12 font-serif text-muted-foreground">
                            &ldquo;{row.audioScript}&rdquo;
                          </div>
                          <div className="w-full md:w-1/4 space-y-1">
                            {row.keywords.map((kw, kwIdx) => (
                              <div key={kwIdx} className="text-[11px] text-foreground/80 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                                <span>{kw}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              const updated = [...part2Data];
                              updated[tIdx].rows = updated[tIdx].rows.filter((_, i) => i !== rIdx);
                              setPart2Data(updated);
                            }}
                            className="p-1 text-muted-foreground hover:text-rose-500 cursor-pointer self-start"
                            title="Xóa dòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Chưa có dữ liệu dòng nghe (Chờ file doc tổng hợp). Bấm nút &quot;+ Thêm dòng nghe&quot; để bổ sung.
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PART 3 QUẢN TRỊ MA TRẬN CÂU 15 */}
      {/* ========================================================================= */}
      {activeTab === "p3" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề, mã code hoặc câu chuyện mẹo..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => {
                const newItem: Part3Item = {
                  stt: part3Data.length + 1,
                  topic: "",
                  code: "2010",
                  femaleFirst: ["W", "B", "M", "B"],
                  maleFirst: ["M", "B", "W", "B"],
                  story: "",
                };
                setEditingItem({ part: "p3", data: newItem });
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm ma trận chủ đề</span>
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[11px] font-black uppercase text-muted-foreground">
                  <th className="p-3.5 w-16 text-center">STT</th>
                  <th className="p-3.5 w-1/4">CHỦ ĐỀ (TOPIC)</th>
                  <th className="p-3.5 w-24 text-center">MÃ CODE</th>
                  <th className="p-3.5 w-32 text-center">NỮ NÓI TRƯỚC</th>
                  <th className="p-3.5 w-32 text-center">NAM NÓI TRƯỚC</th>
                  <th className="p-3.5">CÂU CHUYỆN MẸO GHI NHỚ</th>
                  <th className="p-3.5 w-24 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {part3Data
                  .filter(
                    (item) =>
                      item.topic.toLowerCase().includes(search.toLowerCase()) ||
                      item.story.toLowerCase().includes(search.toLowerCase()) ||
                      item.code.includes(search)
                  )
                  .map((item, idx) => (
                    <tr key={item.stt || idx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 text-center font-bold text-muted-foreground">{item.stt}.</td>
                      <td className="p-3.5 font-bold text-foreground">{item.topic}</td>
                      <td className="p-3.5 text-center">
                        <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary font-mono font-bold text-xs">
                          {item.code}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-rose-500">
                        {item.femaleFirst.join(" - ")}
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-sky-500">
                        {item.maleFirst.join(" - ")}
                      </td>
                      <td className="p-3.5 text-xs text-foreground/80 leading-relaxed">{item.story}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() =>
                              setEditingItem({
                                part: "p3",
                                data: JSON.parse(JSON.stringify(item)),
                                index: idx,
                              })
                            }
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Sửa ma trận"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xóa chủ đề "${item.topic}"?`)) {
                                setPart3Data((prev) => prev.filter((_, i) => i !== idx));
                                showToast("Đã xóa chủ đề");
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                            title="Xóa chủ đề"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: PART 4 QUẢN TRỊ MẸO HỌC THEO TOPIC */}
      {/* ========================================================================= */}
      {activeTab === "p4" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm chủ đề, câu hỏi hoặc mẹo..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => {
                const newTopic: Part4Topic = {
                  id: `p4-topic-${Date.now()}`,
                  title: "",
                  cloverCount: 3,
                  question1: "",
                  answer1: "",
                  question2: "",
                  answer2: "",
                  quickTip: "",
                };
                setEditingItem({ part: "p4", data: newTopic });
              }}
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Topic Part 4</span>
            </button>
          </div>

          <div className="space-y-4">
            {part4Data
              .filter(
                (t) =>
                  t.title.toLowerCase().includes(search.toLowerCase()) ||
                  t.question1.toLowerCase().includes(search.toLowerCase()) ||
                  t.answer1.toLowerCase().includes(search.toLowerCase()) ||
                  t.quickTip.toLowerCase().includes(search.toLowerCase())
              )
              .map((topic, tIdx) => (
                <div key={topic.id || tIdx} className="p-4 md:p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-primary" />
                      <h4 className="font-bold text-sm text-foreground">{topic.title}</h4>
                      <span className="text-emerald-500 text-xs">{"🍀".repeat(topic.cloverCount)}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setEditingItem({
                            part: "p4",
                            data: JSON.parse(JSON.stringify(topic)),
                            index: tIdx,
                          })
                        }
                        className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                        title="Sửa topic & 2 câu hỏi"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-primary" />
                        <span>Sửa topic</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Xóa topic "${topic.title}"?`)) {
                            setPart4Data((prev) => prev.filter((_, i) => i !== tIdx));
                            showToast("Đã xóa topic");
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                        title="Xóa topic"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 2 Questions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                      <span className="font-bold text-muted-foreground block text-[10px]">CÂU 01:</span>
                      <p className="font-semibold text-foreground">{topic.question1}</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">✓ {topic.answer1}</p>
                    </div>

                    <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                      <span className="font-bold text-muted-foreground block text-[10px]">CÂU 02:</span>
                      <p className="font-semibold text-foreground">{topic.question2}</p>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">✓ {topic.answer2}</p>
                    </div>
                  </div>

                  {/* Quick Tip */}
                  <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 text-xs">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-foreground/90 font-medium">{topic.quickTip}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* READING TAB VIEW */}
      {/* ========================================================================= */}
      {activeSkill === "reading" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">
                Đang quản trị &amp; xem trước Key &amp; Mẹo Thi kỹ năng Reading (4 Phần).
              </span>
            </div>
            <Link
              href="/key-va-meo-thi?skill=reading"
              target="_blank"
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-primary flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang học viên ↗</span>
            </Link>
          </div>
          <ReadingCheatSheetView customData={readingData} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPEAKING TAB VIEW */}
      {/* ========================================================================= */}
      {activeSkill === "speaking" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">
                Đang quản trị &amp; xem trước Key &amp; Mẹo Thi kỹ năng Speaking (4 Phần).
              </span>
            </div>
            <Link
              href="/key-va-meo-thi?skill=speaking"
              target="_blank"
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-primary flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang học viên ↗</span>
            </Link>
          </div>
          <SpeakingCheatSheetView customData={speakingData} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* WRITING TAB VIEW */}
      {/* ========================================================================= */}
      {activeSkill === "writing" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-muted/40 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-primary" />
              <span className="font-bold text-foreground">
                Đang quản trị &amp; xem trước Key &amp; Mẹo Thi kỹ năng Writing (4 Phần).
              </span>
            </div>
            <Link
              href="/key-va-meo-thi?skill=writing"
              target="_blank"
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-primary flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang học viên ↗</span>
            </Link>
          </div>
          <WritingCheatSheetView customData={writingData} />
        </div>
      )}

      {/* Modal chỉnh sửa câu hỏi Part 1 */}
      {editingItem && editingItem.part === "p1" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-black text-base text-foreground">
                {editingItem.index !== undefined ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Nội dung câu hỏi:</label>
                <textarea
                  rows={3}
                  value={editingItem.data.question}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, question: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ví dụ: When did they decide to meet?"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Đáp án đúng:</label>
                <input
                  type="text"
                  value={editingItem.data.answer}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, answer: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ví dụ: 9am on Sunday"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chkIsNew"
                  checked={!!editingItem.data.isNew}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, isNew: e.target.checked },
                    })
                  }
                  className="rounded border-border"
                />
                <label htmlFor="chkIsNew" className="font-bold text-foreground cursor-pointer">
                  Đánh dấu nhãn [MỚI]
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(part1Data[activeCat] || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setPart1Data({ ...part1Data, [activeCat]: currentList });
                  setEditingItem(null);
                  showToast("Đã cập nhật câu hỏi!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa chủ đề Part 2 */}
      {editingItem && editingItem.part === "p2" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Chủ Đề Part 2" : "Thêm Chủ Đề Mới (Part 2)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-foreground block mb-1">Tên chủ đề (Title):</label>
                  <input
                    type="text"
                    value={editingItem.data.title || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, title: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Ví dụ: Review Khách Sạn & Đặt Phòng"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Độ ưu tiên (Cỏ 🍀 1-5):</label>
                  <select
                    value={editingItem.data.cloverCount || 3}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, cloverCount: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value={1}>🍀 1 Cỏ (Ôn tập)</option>
                    <option value={2}>🍀🍀 2 Cỏ (Trung bình)</option>
                    <option value={3}>🍀🍀🍀 3 Cỏ (Quan trọng)</option>
                    <option value={4}>🍀🍀🍀🍀 4 Cỏ (Trọng tâm)</option>
                    <option value={5}>🍀🍀🍀🍀🍀 5 Cỏ (Cực Hot - Tủ)</option>
                  </select>
                </div>
              </div>

              {/* Speaker rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <span>Danh sách câu thoại người nói ({editingItem.data.rows?.length || 0})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newRows = [...(editingItem.data.rows || [])];
                      newRows.push({
                        targetAnswer: "",
                        targetAnswerVn: "",
                        audioScript: "",
                        keywords: [],
                      });
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, rows: newRows },
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm người nói</span>
                  </button>
                </div>

                {(editingItem.data.rows || []).map((row: any, rIdx: number) => (
                  <div key={rIdx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2.5 relative">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                      <span className="font-bold text-xs text-primary font-mono">
                        Người nói #{rIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRows = (editingItem.data.rows || []).filter((_: any, i: number) => i !== rIdx);
                          setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, rows: newRows },
                          });
                        }}
                        className="text-muted-foreground hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                        title="Xóa người nói này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-0.5">
                          Đáp án tiếng Anh (Target Answer):
                        </label>
                        <input
                          type="text"
                          value={row.targetAnswer || ""}
                          onChange={(e) => {
                            const newRows = [...editingItem.data.rows];
                            newRows[rIdx].targetAnswer = e.target.value;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, rows: newRows } });
                          }}
                          placeholder="VD: A good view of the sea"
                          className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-foreground block mb-0.5">
                          Dịch nghĩa tiếng Việt:
                        </label>
                        <input
                          type="text"
                          value={row.targetAnswerVn || ""}
                          onChange={(e) => {
                            const newRows = [...editingItem.data.rows];
                            newRows[rIdx].targetAnswerVn = e.target.value;
                            setEditingItem({ ...editingItem, data: { ...editingItem.data, rows: newRows } });
                          }}
                          placeholder="VD: Có view nhìn ra biển đẹp"
                          className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-0.5">
                        Câu thoại audio (Audio Script):
                      </label>
                      <textarea
                        rows={2}
                        value={row.audioScript || ""}
                        onChange={(e) => {
                          const newRows = [...editingItem.data.rows];
                          newRows[rIdx].audioScript = e.target.value;
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, rows: newRows } });
                        }}
                        placeholder="VD: We could see the waves breaking right from our hotel balcony..."
                        className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-0.5">
                        Từ khóa nhận diện (cách nhau bởi dấu phẩy):
                      </label>
                      <input
                        type="text"
                        value={Array.isArray(row.keywords) ? row.keywords.join(", ") : row.keywords || ""}
                        onChange={(e) => {
                          const newRows = [...editingItem.data.rows];
                          newRows[rIdx].keywords = e.target.value
                            .split(",")
                            .map((k: string) => k.trim())
                            .filter(Boolean);
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, rows: newRows } });
                        }}
                        placeholder="VD: sea, waves, ocean, balcony"
                        className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = [...part2Data];
                  if (editingItem.index !== undefined) {
                    updated[editingItem.index] = editingItem.data;
                  } else {
                    updated.push(editingItem.data);
                  }
                  setPart2Data(updated);
                  setEditingItem(null);
                  showToast("✓ Đã cập nhật chủ đề Part 2 thành công!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa ma trận Part 3 */}
      {editingItem && editingItem.part === "p3" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Ma Trận Part 3" : "Thêm Ma Trận Mới (Part 3)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-foreground block mb-1">Tên chủ đề (Topic):</label>
                  <input
                    type="text"
                    value={editingItem.data.topic || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, topic: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="VD: Bữa tiệc chia tay đồng nghiệp"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Mã nhớ nhanh (Code):</label>
                  <input
                    type="text"
                    value={editingItem.data.code || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, code: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="VD: 2010"
                  />
                </div>
              </div>

              {/* Female First Selector */}
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-600 dark:text-rose-400">
                    Ma trận khi NỮ nói trước (Female First - 4 câu):
                  </span>
                  <span className="font-mono font-bold text-xs text-rose-500">
                    {(editingItem.data.femaleFirst || []).join(" - ")}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((pos) => (
                    <div key={pos} className="space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-bold">Câu {pos + 1}</span>
                      <select
                        value={editingItem.data.femaleFirst?.[pos] || "W"}
                        onChange={(e) => {
                          const arr = [...(editingItem.data.femaleFirst || ["W", "B", "M", "B"])];
                          arr[pos] = e.target.value as "W" | "M" | "B";
                          setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, femaleFirst: arr },
                          });
                        }}
                        className="w-full p-2 rounded-lg border border-border bg-card text-foreground font-bold font-mono text-center text-xs focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="W">W (Nữ)</option>
                        <option value="M">M (Nam)</option>
                        <option value="B">B (Cả hai)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Male First Selector */}
              <div className="p-3.5 rounded-xl border border-sky-500/30 bg-sky-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-600 dark:text-sky-400">
                    Ma trận khi NAM nói trước (Male First - 4 câu):
                  </span>
                  <span className="font-mono font-bold text-xs text-sky-500">
                    {(editingItem.data.maleFirst || []).join(" - ")}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((pos) => (
                    <div key={pos} className="space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-bold">Câu {pos + 1}</span>
                      <select
                        value={editingItem.data.maleFirst?.[pos] || "M"}
                        onChange={(e) => {
                          const arr = [...(editingItem.data.maleFirst || ["M", "B", "W", "B"])];
                          arr[pos] = e.target.value as "W" | "M" | "B";
                          setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, maleFirst: arr },
                          });
                        }}
                        className="w-full p-2 rounded-lg border border-border bg-card text-foreground font-bold font-mono text-center text-xs focus:ring-1 focus:ring-primary cursor-pointer"
                      >
                        <option value="M">M (Nam)</option>
                        <option value="W">W (Nữ)</option>
                        <option value="B">B (Cả hai)</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Story */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Câu chuyện mẹo ghi nhớ cốt lõi (Story):
                </label>
                <textarea
                  rows={3}
                  value={editingItem.data.story || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, story: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Nhập câu chuyện mẹo hoặc quy tắc liên tưởng giúp học viên ghi nhớ..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = [...part3Data];
                  if (editingItem.index !== undefined) {
                    updated[editingItem.index] = editingItem.data;
                  } else {
                    updated.push(editingItem.data);
                  }
                  setPart3Data(updated);
                  setEditingItem(null);
                  showToast("✓ Đã cập nhật ma trận Part 3 thành công!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa topic Part 4 */}
      {editingItem && editingItem.part === "p4" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Topic Part 4" : "Thêm Topic Mới (Part 4)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-foreground block mb-1">Tên chủ đề (Title):</label>
                  <input
                    type="text"
                    value={editingItem.data.title || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, title: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="VD: The history of transportation"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Độ ưu tiên (Cỏ 🍀 1-5):</label>
                  <select
                    value={editingItem.data.cloverCount || 3}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, cloverCount: Number(e.target.value) },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value={1}>🍀 1 Cỏ (Ôn tập)</option>
                    <option value={2}>🍀🍀 2 Cỏ (Trung bình)</option>
                    <option value={3}>🍀🍀🍀 3 Cỏ (Quan trọng)</option>
                    <option value={4}>🍀🍀🍀🍀 4 Cỏ (Trọng tâm)</option>
                    <option value={5}>🍀🍀🍀🍀🍀 5 Cỏ (Cực Hot - Tủ)</option>
                  </select>
                </div>
              </div>

              {/* Question 1 & Answer 1 */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="font-bold text-xs text-primary block">CÂU HỎI 01</span>
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-0.5">Nội dung câu hỏi 1:</label>
                  <textarea
                    rows={2}
                    value={editingItem.data.question1 || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, question1: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary text-xs"
                    placeholder="VD: What was the main drawback of early steam engines?"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-0.5">Đáp án đúng 1:</label>
                  <input
                    type="text"
                    value={editingItem.data.answer1 || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, answer1: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-border bg-card text-emerald-600 dark:text-emerald-400 font-bold focus:ring-1 focus:ring-primary text-xs"
                    placeholder="VD: They consumed excessive amounts of fuel"
                  />
                </div>
              </div>

              {/* Question 2 & Answer 2 */}
              <div className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2">
                <span className="font-bold text-xs text-primary block">CÂU HỎI 02</span>
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-0.5">Nội dung câu hỏi 2:</label>
                  <textarea
                    rows={2}
                    value={editingItem.data.question2 || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, question2: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-border bg-card text-foreground focus:ring-1 focus:ring-primary text-xs"
                    placeholder="VD: According to the speaker, what led to the rapid expansion of railways?"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-0.5">Đáp án đúng 2:</label>
                  <input
                    type="text"
                    value={editingItem.data.answer2 || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, answer2: e.target.value },
                      })
                    }
                    className="w-full p-2 rounded-lg border border-border bg-card text-emerald-600 dark:text-emerald-400 font-bold focus:ring-1 focus:ring-primary text-xs"
                    placeholder="VD: Private investment and government subsidies"
                  />
                </div>
              </div>

              {/* Quick tip */}
              <div>
                <label className="font-bold text-foreground block mb-1">
                  Mẹo ghi nhớ từ khóa & bẫy cần tránh (Quick Tip):
                </label>
                <textarea
                  rows={3}
                  value={editingItem.data.quickTip || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, quickTip: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  placeholder="VD: Chú ý từ nối 'However, the breakthrough came when...' để bắt đáp án câu 2."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const updated = [...part4Data];
                  if (editingItem.index !== undefined) {
                    updated[editingItem.index] = editingItem.data;
                  } else {
                    updated.unshift(editingItem.data);
                  }
                  setPart4Data(updated);
                  setEditingItem(null);
                  showToast("✓ Đã cập nhật topic Part 4 thành công!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
