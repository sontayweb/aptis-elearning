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
  ZoomIn,
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
import { READING_KEY_MEO_DATA, READING_P2_TOPICS, ReadingPartData, ReadingP2Topic } from "@/data/key-meo-reading-data";

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

  // Sub-category filters for Speaking & Writing
  const [speakingP1Cat, setSpeakingP1Cat] = useState<string>("all");
  const [writingP1Cat, setWritingP1Cat] = useState<string>("all");
  const [writingP4Cat, setWritingP4Cat] = useState<string>("all");

  // Search filters
  const [search, setSearch] = useState("");
  const [previewP2Image, setPreviewP2Image] = useState(false);

  // Modal edit state
  const [editingItem, setEditingItem] = useState<{
    skill?: SkillType;
    part: TabType;
    data: any;
    index?: number;
  } | null>(null);

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
      {/* READING TAB VIEW (QUẢN TRỊ ADMIN ĐỒNG BỘ 100% VỚI LISTENING)               */}
      {/* ========================================================================= */}
      {activeSkill === "reading" && (
        <div className="space-y-6">
          {/* Main Tabs Navigation (Part 1 - Part 4) */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            {[
              {
                id: "p1",
                label: "Part 1: Mẹo Điền Từ (Gap Fill)",
                count: `${readingData.p1?.cluesP1?.length || 6} dạng`,
              },
              {
                id: "p2",
                label: "Part 2: 20 Thẻ Đề Cặp Câu Cohesion",
                count: `${(readingData.p2?.topicsP2 || READING_P2_TOPICS).length} chủ đề`,
              },
              {
                id: "p3",
                label: "Part 3: Ma Trận Bẫy Paraphrase",
                count: `${readingData.p3?.paraphraseTrapsP3?.length || 7} cặp từ`,
              },
              {
                id: "p4",
                label: "Part 4: Mẹo Headings Đoạn Văn",
                count: `${readingData.p4?.headingStrategiesP4?.length || 4} chiến lược`,
              },
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

          {/* TAB 1: READING PART 1 MẸO ĐIỀN TỪ */}
          {activeTab === "p1" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm dấu hiệu câu hỏi hoặc loại từ..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "reading",
                      part: "p1",
                      data: { questionPattern: "", answerType: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm mẹo điền từ</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5">CẤU TRÚC / DẤU HIỆU CÂU HỎI</th>
                      <th className="p-3.5">LOẠI TỪ CẦN ĐIỀN / QUY TẮC</th>
                      <th className="p-3.5 text-center w-28">TAG</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(readingData.p1?.cluesP1 || [])
                      .filter(
                        (c) =>
                          c.questionPattern.toLowerCase().includes(search.toLowerCase()) ||
                          c.answerType.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((c, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold font-mono text-foreground text-xs">
                            {c.questionPattern}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {c.answerType}
                          </td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                              GAP FILL
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "reading",
                                    part: "p1",
                                    data: { ...c },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa mẹo điền từ"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa mẹo này?")) {
                                    const nextClues = (readingData.p1?.cluesP1 || []).filter(
                                      (_, i) => i !== idx
                                    );
                                    setReadingData((prev) => ({
                                      ...prev,
                                      p1: { ...prev.p1, cluesP1: nextClues },
                                    }));
                                    showToast("Đã xóa mẹo điền từ");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa mẹo này"
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

          {/* TAB 2: READING PART 2 COHESION TOPICS (GIỐNG HỆT LISTENING PART 2 CARDS) */}
          {activeTab === "p2" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm chủ đề Part 2 (Tom Harper, College, Festival...)"
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    const currentTopics = readingData.p2?.topicsP2 || READING_P2_TOPICS;
                    const newTopic: ReadingP2Topic = {
                      id: `topic-${Date.now()}`,
                      num: currentTopics.length + 1,
                      title: "Chủ đề mới",
                      fullTitle: "Chủ đề mới (Bản dịch)",
                      emoji: "📖",
                      pairs: [
                        { en: "Sentence 1...", vn: "Câu dịch 1..." },
                        { en: "Sentence 2...", vn: "Câu dịch 2..." },
                      ],
                      summary: "Tóm tắt mẹo nhớ...",
                    };
                    setEditingItem({
                      skill: "reading",
                      part: "p2",
                      data: newTopic,
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm chủ đề mới</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
                {(readingData.p2?.topicsP2 || READING_P2_TOPICS)
                  .filter(
                    (t) =>
                      t.title.toLowerCase().includes(search.toLowerCase()) ||
                      t.summary.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((topic, tIdx) => (
                    <div key={topic.id || tIdx} className="p-4 md:p-5 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-muted-foreground">
                            #{topic.num}
                          </span>
                          <span className="text-base">{topic.emoji || "📖"}</span>
                          <h3 className="font-bold text-sm text-foreground">{topic.title}</h3>
                          <span className="text-xs text-muted-foreground">({topic.fullTitle})</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setEditingItem({
                                skill: "reading",
                                part: "p2",
                                data: JSON.parse(JSON.stringify(topic)),
                                index: tIdx,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                            title="Sửa chủ đề"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-primary" />
                            <span>Sửa chủ đề</span>
                          </button>

                          <button
                            onClick={() => {
                              const updated = [
                                ...(readingData.p2?.topicsP2 || READING_P2_TOPICS),
                              ];
                              updated[tIdx].pairs.push({
                                en: "New sentence...",
                                vn: "Câu dịch mới...",
                              });
                              setReadingData((prev) => ({
                                ...prev,
                                p2: { ...prev.p2, topicsP2: updated },
                              }));
                            }}
                            className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold text-primary hover:bg-primary/10 cursor-pointer"
                          >
                            + Dòng câu ({topic.pairs.length})
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Xóa chủ đề "${topic.title}"?`)) {
                                const updated = (
                                  readingData.p2?.topicsP2 || READING_P2_TOPICS
                                ).filter((_, i) => i !== tIdx);
                                setReadingData((prev) => ({
                                  ...prev,
                                  p2: { ...prev.p2, topicsP2: updated },
                                }));
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

                      {/* Pairs Table */}
                      <div className="space-y-2 pt-1">
                        {topic.pairs.map((pair, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-3 rounded-xl border border-border bg-muted/20 flex flex-col md:flex-row md:items-start justify-between gap-3 text-xs"
                          >
                            <div className="w-full md:w-1/2 font-serif text-foreground font-medium">
                              <span className="font-mono font-bold text-primary mr-2">
                                {pIdx + 1}.
                              </span>
                              {pair.en}
                            </div>
                            <div className="w-full md:w-1/2 text-muted-foreground italic">
                              {pair.vn}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Summary Tip */}
                      <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-2.5 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-800 dark:text-amber-300 font-bold block mb-0.5">
                            Mẹo ghi nhớ từ khóa độc quyền:
                          </strong>
                          <p className="text-foreground/90 font-medium">{topic.summary}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 3: READING PART 3 MA TRẬN BẪY PARAPHRASE */}
          {activeTab === "p3" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm từ khóa câu hỏi hoặc từ đồng nghĩa..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "reading",
                      part: "p3",
                      data: { questionKeyword: "", passageSynonym: "", trapNote: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bẫy Paraphrase</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">TỪ KHÓA CÂU HỎI (QUESTION KEYWORD)</th>
                      <th className="p-3.5 w-1/3">TỪ ĐỒNG NGHĨA TRONG BÀI (PASSAGE SYNONYM)</th>
                      <th className="p-3.5">BẪY CẦN TRÁNH (TRAP NOTE)</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(readingData.p3?.paraphraseTrapsP3 || [])
                      .filter(
                        (t) =>
                          t.questionKeyword.toLowerCase().includes(search.toLowerCase()) ||
                          t.passageSynonym.toLowerCase().includes(search.toLowerCase()) ||
                          t.trapNote.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((t, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            {t.questionKeyword}
                          </td>
                          <td className="p-3.5 font-bold text-emerald-600 dark:text-emerald-400">
                            {t.passageSynonym}
                          </td>
                          <td className="p-3.5 text-muted-foreground italic text-xs">
                            {t.trapNote}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "reading",
                                    part: "p3",
                                    data: { ...t },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa bẫy"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa bẫy paraphrase này?")) {
                                    const nextTraps = (
                                      readingData.p3?.paraphraseTrapsP3 || []
                                    ).filter((_, i) => i !== idx);
                                    setReadingData((prev) => ({
                                      ...prev,
                                      p3: { ...prev.p3, paraphraseTrapsP3: nextTraps },
                                    }));
                                    showToast("Đã xóa bẫy paraphrase");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa bẫy này"
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

          {/* TAB 4: READING PART 4 MẸO NỐI HEADINGS */}
          {activeTab === "p4" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm dạng tiêu đề hoặc từ khóa nhận diện..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "reading",
                      part: "p4",
                      data: { headingType: "", clueKeywords: "", guide: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm chiến lược Headings</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">DẠNG TIÊU ĐỀ (HEADING TYPE)</th>
                      <th className="p-3.5 w-1/3">TỪ KHÓA NHẬN DIỆN (CLUE KEYWORDS)</th>
                      <th className="p-3.5">HƯỚNG DẪN XỬ LÝ (GUIDE)</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(readingData.p4?.headingStrategiesP4 || [])
                      .filter(
                        (h) =>
                          h.headingType.toLowerCase().includes(search.toLowerCase()) ||
                          h.clueKeywords.toLowerCase().includes(search.toLowerCase()) ||
                          h.guide.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((h, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            {h.headingType}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {h.clueKeywords}
                          </td>
                          <td className="p-3.5 text-muted-foreground text-xs">
                            {h.guide}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "reading",
                                    part: "p4",
                                    data: { ...h },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa chiến lược"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa chiến lược này?")) {
                                    const nextList = (
                                      readingData.p4?.headingStrategiesP4 || []
                                    ).filter((_, i) => i !== idx);
                                    setReadingData((prev) => ({
                                      ...prev,
                                      p4: { ...prev.p4, headingStrategiesP4: nextList },
                                    }));
                                    showToast("Đã xóa chiến lược headings");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa chiến lược này"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPEAKING TAB VIEW (QUẢN TRỊ ADMIN ĐỒNG BỘ 100% VỚI LISTENING)              */}
      {/* ========================================================================= */}
      {activeSkill === "speaking" && (
        <div className="space-y-6">
          {/* Main Tabs Navigation (Part 1 - Part 4) */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            {[
              {
                id: "p1",
                label: "Part 1: Câu Hỏi Cá Nhân & Cấu Trúc",
                count: `${speakingData.p1?.formulasP1?.length || 6} mẫu`,
              },
              {
                id: "p2",
                label: "Part 2: Mẫu Mô Tả Tranh & Trải Nghiệm",
                count: "4 bước chuẩn",
              },
              {
                id: "p3",
                label: "Part 3: So Sánh 2 Tranh & Từ Nối",
                count: "4 bước so sánh",
              },
              {
                id: "p4",
                label: "Part 4: Khung Thuyết Trình 5 Giai Đoạn",
                count: "5 giai đoạn",
              },
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

          {/* TAB 1: SPEAKING PART 1 CÂU HỎI CÁ NHÂN & CẤU TRÚC */}
          {activeTab === "p1" && (
            <div className="space-y-4">
              {/* Sub-category selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  "all",
                  "Sở thích",
                  "Thói quen",
                  "Lý do",
                  "Tần suất",
                  "Trải nghiệm",
                  "Ý kiến",
                ].map((cat) => {
                  const isActive = speakingP1Cat === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSpeakingP1Cat(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {cat === "all" ? "Tất cả chủ đề" : cat}
                    </button>
                  );
                })}
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm cấu trúc nói hoặc phân loại..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "speaking",
                      part: "p1",
                      data: { category: "Sở thích", pattern: "", example: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm cấu trúc Part 1</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">CHỦ ĐỀ / PHÂN LOẠI</th>
                      <th className="p-3.5 w-1/3">CẤU TRÚC / CÔNG THỨC NÓI</th>
                      <th className="p-3.5">VÍ DỤ MINH HỌA</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(speakingData.p1?.formulasP1 || [])
                      .filter((f) => {
                        const matchCat =
                          speakingP1Cat === "all" ||
                          f.category.toLowerCase().includes(speakingP1Cat.toLowerCase());
                        const matchSearch =
                          f.category.toLowerCase().includes(search.toLowerCase()) ||
                          f.pattern.toLowerCase().includes(search.toLowerCase()) ||
                          (f.example && f.example.toLowerCase().includes(search.toLowerCase()));
                        return matchCat && matchSearch;
                      })
                      .map((f, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black">
                              {f.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {f.pattern}
                          </td>
                          <td className="p-3.5 text-muted-foreground italic text-xs">
                            {f.example || "—"}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "speaking",
                                    part: "p1",
                                    data: { ...f },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa cấu trúc"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa cấu trúc này?")) {
                                    const nextFormulas = (
                                      speakingData.p1?.formulasP1 || []
                                    ).filter((_, i) => i !== idx);
                                    setSpeakingData((prev) => ({
                                      ...prev,
                                      p1: { ...prev.p1, formulasP1: nextFormulas },
                                    }));
                                    showToast("Đã xóa cấu trúc nói");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa cấu trúc này"
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

          {/* TAB 2: SPEAKING PART 2 MÔ TẢ TRANH & TRẢI NGHIỆM */}
          {activeTab === "p2" && (
            <div className="space-y-4">
              {/* Infographic 8 bước Band B2-C1 đồng bộ cho học viên */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-purple-500/30 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <div>
                      <h3 className="font-heading font-black text-sm text-foreground">
                        Cấu Trúc Speaking Aptis Part 2 — Band B2–C1 (Infographic 8 Bước)
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Tài liệu trực quan được hiển thị đồng bộ cho học viên tại trang Key &amp; Mẹo thi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở ảnh tab mới</span>
                    </a>
                    <button
                      onClick={() => setPreviewP2Image(true)}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Phóng to xem</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  <div className="md:col-span-4">
                    <div
                      onClick={() => setPreviewP2Image(true)}
                      className="group relative rounded-xl overflow-hidden border border-purple-500/30 bg-muted/20 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src="/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg"
                        alt="Cấu Trúc Speaking Aptis Part 2 Band B2-C1"
                        className="w-full h-auto object-cover group-hover:scale-102 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <ZoomIn className="w-4 h-4" />
                        <span>Xem chi tiết</span>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-3">
                    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
                      <div className="p-2.5 bg-muted/60 border-b border-border text-[11px] font-black uppercase text-foreground">
                        Danh sách 8 bước &amp; Mục tiêu đánh giá B2–C1
                      </div>
                      <div className="divide-y divide-border text-xs max-h-[220px] overflow-y-auto">
                        {[
                          { step: 1, name: "PEOPLE (Có ai?)", goal: "Nhận xét về mối quan hệ, thái độ, vai trò" },
                          { step: 2, name: "PLACE (Ở đâu?)", goal: "Mô tả không gian và bầu không khí" },
                          { step: 3, name: "ACTIONS (Đang làm gì?)", goal: "Mô tả hành động + Mục đích có thể" },
                          { step: 4, name: "CLOTHES (Mặc gì?)", goal: "Nhận xét về phong cách và phù hợp ngữ cảnh" },
                          { step: 5, name: "AGE (Đoán tuổi)", goal: "Ước lượng + Lý do ước lượng" },
                          { step: 6, name: "FEELINGS (Cảm xúc)", goal: "Đoán cảm xúc + Giải thích sâu hơn" },
                          { step: 7, name: "BACKGROUND (Phía sau có gì?)", goal: "Mô tả chi tiết + Nhận xét, suy luận" },
                          { step: 8, name: "PREDICTION (Sau đó làm gì?)", goal: "Dự đoán nhiều khả năng + Lý do, mục đích" },
                        ].map((s) => (
                          <div key={s.step} className="p-2 flex items-center justify-between gap-2">
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                              #{s.step} {s.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground italic">{s.goal}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-foreground/90 space-y-1">
                      <strong className="text-emerald-700 dark:text-emerald-300 font-bold block text-[11px] uppercase">
                        Trạng thái hiển thị:
                      </strong>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        ✓ Ảnh Infographic và bảng 8 bước nâng cao đã được chèn đồng bộ hiển thị tại giao diện học viên (<code className="font-mono text-foreground">/key-va-meo-thi?skill=speaking</code>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-card border border-border shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="font-heading font-black text-sm text-foreground">
                    Khung Trả Lời 4 Bước Mô Tả Tranh Chuẩn B1–B2
                  </h3>
                  <button
                    onClick={() =>
                      setEditingItem({
                        skill: "speaking",
                        part: "p2",
                        data: {
                          template:
                            speakingData.p2?.modelSampleP2?.template ||
                            "In the picture, I can see...",
                        },
                      })
                    }
                    className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-primary flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa bài nói mẫu</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                    <span className="font-bold text-primary">Bước 1: Bối cảnh tổng quan</span>
                    <p className="text-muted-foreground">
                      In this picture, I can see a group of people in what looks like a park...
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                    <span className="font-bold text-primary">Bước 2: Hành động &amp; Chi tiết</span>
                    <p className="text-muted-foreground">
                      In the foreground, there is a young girl wearing a blue jacket who is reading a book...
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                    <span className="font-bold text-primary">Bước 3: Phỏng đoán &amp; Cảm xúc</span>
                    <p className="text-muted-foreground">
                      They seem to be enjoying themselves because everyone has a big smile on their face...
                    </p>
                  </div>
                  <div className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                    <span className="font-bold text-primary">Bước 4: Liên hệ bản thân</span>
                    <p className="text-muted-foreground">
                      This picture reminds me of my own weekend when my family went camping together...
                    </p>
                  </div>
                </div>

                {speakingData.p2?.modelSampleP2?.template && (
                  <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs">
                    <strong className="text-primary font-bold block mb-1">
                      Bài nói mẫu hoàn chỉnh đã lưu:
                    </strong>
                    <p className="text-foreground font-serif leading-relaxed italic">
                      &ldquo;{speakingData.p2.modelSampleP2.template}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SPEAKING PART 3 SO SÁNH 2 TRANH */}
          {activeTab === "p3" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">BƯỚC</th>
                      <th className="p-3.5 w-1/4">GIAI ĐOẠN SO SÁNH</th>
                      <th className="p-3.5 w-1/2">CÂU MẪU ĐIỂN HÌNH (MODEL SPEECH)</th>
                      <th className="p-3.5">TỪ NỐI QUAN TRỌNG</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[
                      {
                        step: "01",
                        title: "Mở đầu tổng quan",
                        sample: "Both pictures show people engaging in leisure activities, but in very different settings.",
                        connector: "Both ... but ...",
                      },
                      {
                        step: "02",
                        title: "Miêu tả tranh 1",
                        sample: "In the first picture on the left, an elderly couple is walking along a quiet beach.",
                        connector: "In the first picture / On the left",
                      },
                      {
                        step: "03",
                        title: "Miêu tả đối lập tranh 2",
                        sample: "In contrast, the second picture illustrates a vibrant city center packed with young tourists.",
                        connector: "In contrast / Whereas / While",
                      },
                      {
                        step: "04",
                        title: "Bày tỏ sở thích cá nhân",
                        sample: "Personally speaking, I would rather spend my holiday in a peaceful place like the first image.",
                        connector: "Personally / As for me",
                      },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                          {row.step}
                        </td>
                        <td className="p-3.5 font-bold text-foreground">{row.title}</td>
                        <td className="p-3.5 font-serif text-muted-foreground leading-relaxed">
                          &ldquo;{row.sample}&rdquo;
                        </td>
                        <td className="p-3.5 font-bold text-primary font-mono">{row.connector}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SPEAKING PART 4 KHUNG THUYẾT TRÌNH 5 GIAI ĐOẠN */}
          {activeTab === "p4" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm giai đoạn hoặc nội dung mẫu..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "speaking",
                      part: "p4",
                      data: { stage: "", time: "20 – 25s", content: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm giai đoạn mới</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">GIAI ĐOẠN (STAGE)</th>
                      <th className="p-3.5 w-28 text-center">THỜI GIAN</th>
                      <th className="p-3.5">MẪU CÂU THUYẾT TRÌNH CHUẨN (TEMPLATE)</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(
                      speakingData.p4?.modelSampleP4 || [
                        {
                          stage: "Giai đoạn 1: Mở đầu bài nói",
                          time: "10 – 15s",
                          content:
                            "Today, I am going to talk about a memorable experience that happened to me recently...",
                        },
                        {
                          stage: "Giai đoạn 2: Trả lời câu hỏi 1 (When/Where)",
                          time: "25 – 30s",
                          content:
                            "It took place about two years ago when I travelled to Da Nang with my close friends...",
                        },
                        {
                          stage: "Giai đoạn 3: Trả lời câu hỏi 2 (Feelings/Why)",
                          time: "25 – 30s",
                          content:
                            "The reason why I remember it vividly is that we conquered the mountain top and saw the sunrise...",
                        },
                        {
                          stage: "Giai đoạn 4: Trả lời câu hỏi 3 (Future/Impact)",
                          time: "25 – 30s",
                          content:
                            "From this experience, I learned that perseverance is essential. In the future, I plan to...",
                        },
                        {
                          stage: "Giai đoạn 5: Kết luận & Chốt bài",
                          time: "10s",
                          content:
                            "To sum up, this journey was truly unforgettable and taught me a valuable lesson in life.",
                        },
                      ]
                    )
                      .filter(
                        (row) =>
                          row.stage.toLowerCase().includes(search.toLowerCase()) ||
                          row.content.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((row, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">{row.stage}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                              {row.time}
                            </span>
                          </td>
                          <td className="p-3.5 font-serif text-muted-foreground leading-relaxed">
                            &ldquo;{row.content}&rdquo;
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "speaking",
                                    part: "p4",
                                    data: { ...row },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa giai đoạn"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa giai đoạn thuyết trình này?")) {
                                    const nextList = (
                                      speakingData.p4?.modelSampleP4 || []
                                    ).filter((_, i) => i !== idx);
                                    setSpeakingData((prev) => ({
                                      ...prev,
                                      p4: { ...prev.p4, modelSampleP4: nextList },
                                    }));
                                    showToast("Đã xóa giai đoạn");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa giai đoạn này"
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* WRITING TAB VIEW (QUẢN TRỊ ADMIN ĐỒNG BỘ 100% VỚI LISTENING)               */}
      {/* ========================================================================= */}
      {activeSkill === "writing" && (
        <div className="space-y-6">
          {/* Main Tabs Navigation (Part 1 - Part 4) */}
          <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto">
            {[
              {
                id: "p1",
                label: "Part 1: 5 Câu Trả Lời Ngắn (1-5 từ)",
                count: `${writingData.p1?.examplesP1?.length || 6} câu mẫu`,
              },
              {
                id: "p2",
                label: "Part 2: Điền Form CLB (20-30 từ)",
                count: `${writingData.p2?.formulasP2?.length || 3} công thức`,
              },
              {
                id: "p3",
                label: "Part 3: Chat Room 3 Thành Viên (30-40 từ)",
                count: `${writingData.p3?.formulasP3?.length || 3} dạng câu`,
              },
              {
                id: "p4",
                label: "Part 4: Cấu Trúc Email 2 Phần",
                count: `${writingData.p4?.formulasP4?.length || 5} cụm mẫu`,
              },
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

          {/* TAB 1: WRITING PART 1 TRẢ LỜI 1-5 TỪ */}
          {activeTab === "p1" && (
            <div className="space-y-4">
              {/* Sub-category selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {["all", "What", "Where", "When", "Who", "Why", "How"].map((cat) => {
                  const isActive = writingP1Cat === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setWritingP1Cat(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      {cat === "all" ? "Tất cả từ để hỏi" : `Hỏi ${cat}`}
                    </button>
                  );
                })}
              </div>

              {/* Action bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm câu hỏi hoặc câu trả lời 1–5 từ..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "writing",
                      part: "p1",
                      data: { question: "", answer: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm câu hỏi mẫu</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5">CÂU HỎI THƯỜNG GẶP (QUESTION)</th>
                      <th className="p-3.5">ĐÁP ÁN CHUẨN 1–5 TỪ (SAMPLE ANSWER)</th>
                      <th className="p-3.5 text-center w-28">ĐỘ DÀI</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(writingData.p1?.examplesP1 || [])
                      .filter((ex) => {
                        const matchCat =
                          writingP1Cat === "all" ||
                          ex.question.toLowerCase().startsWith(writingP1Cat.toLowerCase());
                        const matchSearch =
                          ex.question.toLowerCase().includes(search.toLowerCase()) ||
                          ex.answer.toLowerCase().includes(search.toLowerCase());
                        return matchCat && matchSearch;
                      })
                      .map((ex, idx) => {
                        const wordCount = ex.answer.trim().split(/\s+/).length;
                        return (
                          <tr key={idx} className="hover:bg-muted/20 transition-colors">
                            <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                              {String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="p-3.5 font-bold text-foreground">{ex.question}</td>
                            <td className="p-3.5 font-mono font-bold text-rose-500">{ex.answer}</td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/30">
                                {wordCount} TỪ
                              </span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() =>
                                    setEditingItem({
                                      skill: "writing",
                                      part: "p1",
                                      data: { ...ex },
                                      index: idx,
                                    })
                                  }
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Sửa câu"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm("Xóa câu hỏi này?")) {
                                      const nextExs = (
                                        writingData.p1?.examplesP1 || []
                                      ).filter((_, i) => i !== idx);
                                      setWritingData((prev) => ({
                                        ...prev,
                                        p1: { ...prev.p1, examplesP1: nextExs },
                                      }));
                                      showToast("Đã xóa câu hỏi");
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                  title="Xóa câu hỏi này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: WRITING PART 2 ĐIỀN FORM CLB (20-30 TỪ) */}
          {activeTab === "p2" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm mục đích diễn đạt hoặc mẫu câu..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "writing",
                      part: "p2",
                      data: { purpose: "", template: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm công thức Part 2</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">MỤC ĐÍCH DIỄN ĐẠT (PURPOSE)</th>
                      <th className="p-3.5">MẪU CÂU CHUẨN 20–30 TỪ (TEMPLATE)</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(writingData.p2?.formulasP2 || [])
                      .filter(
                        (f) =>
                          f.purpose.toLowerCase().includes(search.toLowerCase()) ||
                          f.template.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((f, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">{f.purpose}</td>
                          <td className="p-3.5 font-serif text-muted-foreground leading-relaxed">
                            &ldquo;{f.template}&rdquo;
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "writing",
                                    part: "p2",
                                    data: { ...f },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa công thức"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa công thức này?")) {
                                    const nextList = (
                                      writingData.p2?.formulasP2 || []
                                    ).filter((_, i) => i !== idx);
                                    setWritingData((prev) => ({
                                      ...prev,
                                      p2: { ...prev.p2, formulasP2: nextList },
                                    }));
                                    showToast("Đã xóa công thức");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa công thức này"
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

          {/* TAB 3: WRITING PART 3 CHAT ROOM 3 THÀNH VIÊN */}
          {activeTab === "p3" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm dạng câu hỏi phòng chat..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "writing",
                      part: "p3",
                      data: { typeTitle: "", formula: "", breakdown: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm mẫu Chat Room</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">DẠNG CÂU HỎI PHÒNG CHAT</th>
                      <th className="p-3.5 w-1/3">CÔNG THỨC 3 BƯỚC (30–40 TỪ)</th>
                      <th className="p-3.5">CHI TIẾT TỪNG PHẦN</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(writingData.p3?.formulasP3 || [])
                      .filter(
                        (f) =>
                          f.typeTitle.toLowerCase().includes(search.toLowerCase()) ||
                          f.formula.toLowerCase().includes(search.toLowerCase()) ||
                          f.breakdown.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((f, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">{f.typeTitle}</td>
                          <td className="p-3.5 font-bold text-primary font-mono">{f.formula}</td>
                          <td className="p-3.5 text-muted-foreground text-xs">{f.breakdown}</td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "writing",
                                    part: "p3",
                                    data: { ...f },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa mẫu chat"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa cấu trúc này?")) {
                                    const nextList = (
                                      writingData.p3?.formulasP3 || []
                                    ).filter((_, i) => i !== idx);
                                    setWritingData((prev) => ({
                                      ...prev,
                                      p3: { ...prev.p3, formulasP3: nextList },
                                    }));
                                    showToast("Đã xóa mẫu chat");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa mẫu chat này"
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

          {/* TAB 4: WRITING PART 4 CẤU TRÚC EMAIL 2 PHẦN */}
          {activeTab === "p4" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm mục đích hoặc mẫu câu Email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  onClick={() => {
                    setEditingItem({
                      skill: "writing",
                      part: "p4",
                      data: { purpose: "", phrase: "" },
                    });
                  }}
                  className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-primary/90 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm mẫu câu Email</span>
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-muted-foreground font-bold">
                      <th className="p-3.5 text-center w-14">STT</th>
                      <th className="p-3.5 w-1/4">MỤC ĐÍCH VIẾT THƯ (PURPOSE)</th>
                      <th className="p-3.5">MẪU CÂU EMAIL CHUẨN APTIS (PHRASE)</th>
                      <th className="p-3.5 text-right w-24">THAO TÁC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(writingData.p4?.formulasP4 || [])
                      .filter(
                        (f) =>
                          f.purpose.toLowerCase().includes(search.toLowerCase()) ||
                          f.phrase.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((f, idx) => (
                        <tr key={idx} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3.5 text-center font-bold text-muted-foreground font-mono">
                            {String(idx + 1).padStart(2, "0")}
                          </td>
                          <td className="p-3.5 font-bold text-foreground">{f.purpose}</td>
                          <td className="p-3.5 font-serif text-muted-foreground leading-relaxed">
                            &ldquo;{f.phrase}&rdquo;
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() =>
                                  setEditingItem({
                                    skill: "writing",
                                    part: "p4",
                                    data: { ...f },
                                    index: idx,
                                  })
                                }
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                title="Sửa mẫu email"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm("Xóa mẫu câu này?")) {
                                    const nextList = (
                                      writingData.p4?.formulasP4 || []
                                    ).filter((_, i) => i !== idx);
                                    setWritingData((prev) => ({
                                      ...prev,
                                      p4: { ...prev.p4, formulasP4: nextList },
                                    }));
                                    showToast("Đã xóa mẫu câu email");
                                  }
                                }}
                                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                                title="Xóa mẫu câu này"
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
        </div>
      )}

      {/* Modal chỉnh sửa câu hỏi Listening Part 1 */}
      {editingItem && (!editingItem.skill || editingItem.skill === "listening") && editingItem.part === "p1" && (
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

      {/* Modal chỉnh sửa chủ đề Listening Part 2 */}
      {editingItem && (!editingItem.skill || editingItem.skill === "listening") && editingItem.part === "p2" && (
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

      {/* Modal chỉnh sửa ma trận Listening Part 3 */}
      {editingItem && (!editingItem.skill || editingItem.skill === "listening") && editingItem.part === "p3" && (
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

      {/* Modal chỉnh sửa topic Listening Part 4 */}
      {editingItem && (!editingItem.skill || editingItem.skill === "listening") && editingItem.part === "p4" && (
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

      {/* ========================================================================= */}
      {/* READING MODALS                                                            */}
      {/* ========================================================================= */}
      {/* Modal chỉnh sửa mẹo Reading Part 1 */}
      {editingItem && editingItem.skill === "reading" && editingItem.part === "p1" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Mẹo Điền Từ (Part 1)" : "Thêm Mẹo Điền Từ Mới (Part 1)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Cấu trúc / Dấu hiệu câu hỏi:</label>
                <input
                  type="text"
                  value={editingItem.data.questionPattern || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, questionPattern: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  placeholder="Ví dụ: Giới từ in/on/at/by + [Chỗ trống]"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Loại từ cần điền / Quy tắc nhận biết:</label>
                <textarea
                  rows={2}
                  value={editingItem.data.answerType || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, answerType: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Ví dụ: Điền Danh từ hoặc V-ing chỉ hành động"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Ví dụ minh họa (Tùy chọn):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.exampleSentence || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, exampleSentence: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary italic"
                  placeholder="Ví dụ: We are looking forward to seeing you soon."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(readingData.p1?.cluesP1 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setReadingData((prev) => ({
                    ...prev,
                    p1: { ...prev.p1, cluesP1: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu mẹo điền từ Reading Part 1!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Reading Part 2 */}
      {editingItem && editingItem.skill === "reading" && editingItem.part === "p2" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Chủ Đề Reading Part 2" : "Thêm Chủ Đề Mới (Reading Part 2)"}
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
                <div>
                  <label className="font-bold text-foreground block mb-1">Biểu tượng (Emoji):</label>
                  <input
                    type="text"
                    value={editingItem.data.emoji || "📖"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, emoji: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground text-center text-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="font-bold text-foreground block mb-1">Tên chủ đề tiếng Anh:</label>
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
                    placeholder="VD: Tom Harper's Career"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tên dịch tiếng Việt:</label>
                <input
                  type="text"
                  value={editingItem.data.fullTitle || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, fullTitle: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Sự nghiệp của Tom Harper"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Tóm tắt mẹo nhớ:</label>
                <textarea
                  rows={2}
                  value={editingItem.data.summary || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, summary: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Chú ý liên từ 'However' và đại từ 'He' chỉ Tom Harper..."
                />
              </div>

              {/* Danh sách các cặp câu nối tiếp */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <span>Các câu trong bài ({editingItem.data.pairs?.length || 0})</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const newPairs = [...(editingItem.data.pairs || [])];
                      newPairs.push({ en: "", vn: "" });
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, pairs: newPairs },
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu</span>
                  </button>
                </div>

                {(editingItem.data.pairs || []).map((pair: any, pIdx: number) => (
                  <div key={pIdx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-2 relative">
                    <div className="flex items-center justify-between border-b border-border/60 pb-1">
                      <span className="font-bold text-xs text-primary font-mono">Câu #{pIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newPairs = (editingItem.data.pairs || []).filter((_: any, i: number) => i !== pIdx);
                          setEditingItem({
                            ...editingItem,
                            data: { ...editingItem.data, pairs: newPairs },
                          });
                        }}
                        className="text-muted-foreground hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                        title="Xóa câu này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-0.5">Tiếng Anh (EN):</label>
                      <input
                        type="text"
                        value={pair.en || ""}
                        onChange={(e) => {
                          const newPairs = [...editingItem.data.pairs];
                          newPairs[pIdx].en = e.target.value;
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, pairs: newPairs } });
                        }}
                        placeholder="VD: Tom Harper started his journey in 2010."
                        className="w-full p-2 rounded-lg border border-border bg-card text-foreground text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-foreground block mb-0.5">Dịch nghĩa tiếng Việt (VN):</label>
                      <input
                        type="text"
                        value={pair.vn || ""}
                        onChange={(e) => {
                          const newPairs = [...editingItem.data.pairs];
                          newPairs[pIdx].vn = e.target.value;
                          setEditingItem({ ...editingItem, data: { ...editingItem.data, pairs: newPairs } });
                        }}
                        placeholder="VD: Tom Harper bắt đầu hành trình của mình vào năm 2010."
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
                  const currentTopics = [...(readingData.p2?.topicsP2 || READING_P2_TOPICS)];
                  if (editingItem.index !== undefined) {
                    currentTopics[editingItem.index] = editingItem.data;
                  } else {
                    currentTopics.push(editingItem.data);
                  }
                  setReadingData((prev) => ({
                    ...prev,
                    p2: { ...prev.p2, topicsP2: currentTopics },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu chủ đề Reading Part 2!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Reading Part 3 */}
      {editingItem && editingItem.skill === "reading" && editingItem.part === "p3" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Bẫy Paraphrase" : "Thêm Bẫy Paraphrase Mới"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Loại bẫy (Trap Type):</label>
                <select
                  value={editingItem.data.trapType || "Từ đồng nghĩa đổi dạng"}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, trapType: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Từ đồng nghĩa đổi dạng">Từ đồng nghĩa đổi dạng</option>
                  <option value="Phủ định ngầm (Negative paraphrase)">Phủ định ngầm (Negative paraphrase)</option>
                  <option value="Bẫy mốc thời gian / thì hoàn thành">Bẫy mốc thời gian / thì hoàn thành</option>
                  <option value="Khái quát hóa / Cụ thể hóa">Khái quát hóa / Cụ thể hóa</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Đoạn văn gốc (Original Text):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.originalText || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, originalText: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: The venue was fully booked until December..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Cách diễn đạt trong câu hỏi (Question Paraphrase):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.questionParaphrase || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, questionParaphrase: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: There were no tickets available before the end of the year..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Mẹo nhận diện & Đáp án đúng:</label>
                <input
                  type="text"
                  value={editingItem.data.correctTrap || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, correctTrap: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: fully booked = no tickets available"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(readingData.p3?.paraphraseTrapsP3 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setReadingData((prev) => ({
                    ...prev,
                    p3: { ...prev.p3, paraphraseTrapsP3: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu bẫy Paraphrase Reading Part 3!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Reading Part 4 */}
      {editingItem && editingItem.skill === "reading" && editingItem.part === "p4" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Chiến Lược Headings" : "Thêm Chiến Lược Headings Mới"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Dạng đoạn văn (Type):</label>
                <input
                  type="text"
                  value={editingItem.data.type || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, type: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Đoạn văn so sánh / đối lập"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Dấu hiệu nhận diện (Signal):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.signal || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, signal: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: In contrast, on the other hand, unlike..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Chiến lược chọn tiêu đề (Strategy):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.strategy || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, strategy: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Tìm tiêu đề chứa từ Differences / Comparison / Versus..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Ví dụ minh họa (Example):</label>
                <input
                  type="text"
                  value={editingItem.data.example || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, example: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Tiêu đề: Differences between traditional and digital media"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(readingData.p4?.headingStrategiesP4 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setReadingData((prev) => ({
                    ...prev,
                    p4: { ...prev.p4, headingStrategiesP4: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu chiến lược Reading Part 4!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SPEAKING MODALS                                                           */}
      {/* ========================================================================= */}
      {/* Modal chỉnh sửa Speaking Part 1 */}
      {editingItem && editingItem.skill === "speaking" && editingItem.part === "p1" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Cấu Trúc Speaking Part 1" : "Thêm Cấu Trúc Mới (Part 1)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Chủ đề / Phân loại (Category):</label>
                <input
                  type="text"
                  value={editingItem.data.category || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, category: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Sở thích, Thói quen, Lý do, Tần suất..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Cấu trúc / Công thức nói (Pattern):</label>
                <input
                  type="text"
                  value={editingItem.data.pattern || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, pattern: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: I'm really into / keen on + V-ing/N..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Ví dụ minh họa (Example):</label>
                <textarea
                  rows={3}
                  value={editingItem.data.example || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, example: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary italic"
                  placeholder="VD: I'm really keen on listening to classical music because it relaxes my mind."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(speakingData.p1?.formulasP1 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setSpeakingData((prev) => ({
                    ...prev,
                    p1: { ...prev.p1, formulasP1: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu cấu trúc Speaking Part 1!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Speaking Part 2 Mẫu */}
      {editingItem && editingItem.skill === "speaking" && editingItem.part === "p2" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  Chỉnh Sửa Bài Nói Mẫu (Speaking Part 2)
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Nội dung bài nói mẫu hoàn chỉnh:</label>
                <textarea
                  rows={6}
                  value={editingItem.data.template || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, template: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="In the picture, I can see..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setSpeakingData((prev) => ({
                    ...prev,
                    p2: {
                      ...prev.p2,
                      modelSampleP2: {
                        ...(prev.p2?.modelSampleP2 || {
                          title: "Mô tả tranh công viên & buổi dã ngoại gia đình",
                          time: "45s",
                        }),
                        template: editingItem.data.template,
                      },
                    },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu bài nói mẫu Speaking Part 2!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Speaking Part 4 */}
      {editingItem && editingItem.skill === "speaking" && editingItem.part === "p4" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Giai Đoạn Thuyết Trình" : "Thêm Giai Đoạn Mới"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-foreground block mb-1">Giai đoạn (Stage):</label>
                  <input
                    type="text"
                    value={editingItem.data.stage || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, stage: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="VD: Giai đoạn 1"
                  />
                </div>
                <div>
                  <label className="font-bold text-foreground block mb-1">Thời gian (Time):</label>
                  <input
                    type="text"
                    value={editingItem.data.time || ""}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        data: { ...editingItem.data, time: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="VD: 20-25s"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Nội dung mẫu (Content):</label>
                <textarea
                  rows={4}
                  value={editingItem.data.content || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, content: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="VD: I'd like to begin by talking about..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [
                    ...(speakingData.p4?.modelSampleP4 || [
                      {
                        stage: "Giai đoạn 1: Mở đầu & Giới thiệu",
                        time: "15 – 20s",
                        content:
                          "I would like to start by talking about an experience that had a great impact on me...",
                      },
                      {
                        stage: "Giai đoạn 2: Trả lời câu hỏi 1 (When/Where)",
                        time: "25 – 30s",
                        content:
                          "It took place about two years ago when I travelled to Da Nang with my close friends...",
                      },
                      {
                        stage: "Giai đoạn 3: Trả lời câu hỏi 2 (Feelings/Why)",
                        time: "25 – 30s",
                        content:
                          "The reason why I remember it vividly is that we conquered the mountain top and saw the sunrise...",
                      },
                      {
                        stage: "Giai đoạn 4: Trả lời câu hỏi 3 (Future/Impact)",
                        time: "25 – 30s",
                        content:
                          "From this experience, I learned that perseverance is essential. In the future, I plan to...",
                      },
                      {
                        stage: "Giai đoạn 5: Kết luận & Chốt bài",
                        time: "10s",
                        content:
                          "To sum up, this journey was truly unforgettable and taught me a valuable lesson in life.",
                      },
                    ]),
                  ];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setSpeakingData((prev) => ({
                    ...prev,
                    p4: { ...prev.p4, modelSampleP4: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu giai đoạn Speaking Part 4!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WRITING MODALS                                                            */}
      {/* ========================================================================= */}
      {/* Modal chỉnh sửa Writing Part 1 */}
      {editingItem && editingItem.skill === "writing" && editingItem.part === "p1" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Câu Hỏi Writing Part 1" : "Thêm Câu Hỏi Mới (Part 1)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Câu hỏi (Question):</label>
                <input
                  type="text"
                  value={editingItem.data.question || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, question: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: What is the weather like today?"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Đáp án mẫu chuẩn 1–5 từ (Answer):</label>
                <input
                  type="text"
                  value={editingItem.data.answer || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, answer: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-mono font-bold text-rose-500 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: It is sunny and hot."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(writingData.p1?.examplesP1 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setWritingData((prev) => ({
                    ...prev,
                    p1: { ...prev.p1, examplesP1: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu câu hỏi Writing Part 1!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Writing Part 2 */}
      {editingItem && editingItem.skill === "writing" && editingItem.part === "p2" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Công Thức Part 2" : "Thêm Công Thức Mới (Part 2)"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Mục đích diễn đạt (Purpose):</label>
                <input
                  type="text"
                  value={editingItem.data.purpose || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, purpose: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Nêu lý do tham gia CLB..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Mẫu câu chuẩn 20–30 từ (Template):</label>
                <textarea
                  rows={4}
                  value={editingItem.data.template || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, template: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="VD: I have been keen on sports since childhood, so I joined this club to improve my fitness and make new friends."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(writingData.p2?.formulasP2 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setWritingData((prev) => ({
                    ...prev,
                    p2: { ...prev.p2, formulasP2: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu công thức Writing Part 2!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Writing Part 3 */}
      {editingItem && editingItem.skill === "writing" && editingItem.part === "p3" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Mẫu Chat Room" : "Thêm Mẫu Chat Room Mới"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Dạng câu hỏi phòng chat (Type Title):</label>
                <input
                  type="text"
                  value={editingItem.data.typeTitle || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, typeTitle: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Câu hỏi về cảm nghĩ / ý kiến cá nhân"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Công thức 3 bước (Formula):</label>
                <input
                  type="text"
                  value={editingItem.data.formula || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, formula: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Chào hỏi + Nêu quan điểm + Lý do minh họa"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Chi tiết từng phần (Breakdown / Ví dụ):</label>
                <textarea
                  rows={4}
                  value={editingItem.data.breakdown || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, breakdown: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="VD: Hi everyone! From my point of view, I completely agree with your suggestion because it brings great benefits..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(writingData.p3?.formulasP3 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setWritingData((prev) => ({
                    ...prev,
                    p3: { ...prev.p3, formulasP3: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu mẫu Chat Room Writing Part 3!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chỉnh sửa Writing Part 4 */}
      {editingItem && editingItem.skill === "writing" && editingItem.part === "p4" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-primary" />
                <h3 className="font-black text-base text-foreground">
                  {editingItem.index !== undefined ? "Chỉnh Sửa Mẫu Câu Email" : "Thêm Mẫu Câu Email Mới"}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground block mb-1">Mục đích viết thư (Purpose):</label>
                <input
                  type="text"
                  value={editingItem.data.purpose || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, purpose: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Bày tỏ sự thất vọng / Khiếu nại"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Mẫu câu Email chuẩn Aptis (Phrase):</label>
                <textarea
                  rows={3}
                  value={editingItem.data.phrase || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, phrase: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-serif focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  placeholder="VD: I am writing to express my strong disappointment regarding..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  const currentList = [...(writingData.p4?.formulasP4 || [])];
                  if (editingItem.index !== undefined) {
                    currentList[editingItem.index] = editingItem.data;
                  } else {
                    currentList.push(editingItem.data);
                  }
                  setWritingData((prev) => ({
                    ...prev,
                    p4: { ...prev.p4, formulasP4: currentList },
                  }));
                  setEditingItem(null);
                  showToast("Đã lưu mẫu câu email Writing Part 4!");
                }}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phóng To Infographic Speaking Part 2 */}
      {previewP2Image && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewP2Image(false)}
        >
          <div
            className="relative max-w-4xl max-h-[95vh] w-full bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-heading font-black text-xs sm:text-sm text-foreground">
                  Cấu Trúc Speaking Aptis Part 2 — Band B2–C1 (Infographic Gốc)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Mở tab mới</span>
                </a>
                <button
                  onClick={() => setPreviewP2Image(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-2 sm:p-4 flex-1 flex items-center justify-center bg-black/5">
              <img
                src="/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg"
                alt="Cấu trúc Speaking Aptis Part 2 Band B2-C1"
                className="max-h-[82vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
