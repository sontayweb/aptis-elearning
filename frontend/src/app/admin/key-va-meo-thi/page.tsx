"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Lightbulb,
  Headphones,
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

type TabType = "p1" | "p2" | "p3" | "p4";

export default function AdminKeyVaMeoThiPage() {
  const [activeTab, setActiveTab] = useState<TabType>("p1");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // States for each part
  const [part1Data, setPart1Data] = useState<Record<string, Part1Question[]>>(LISTENING_PART1_DATA);
  const [activeCat, setActiveCat] = useState<string>("time");
  const [part2Data, setPart2Data] = useState<Part2Topic[]>(LISTENING_PART2_TOPICS);
  const [part3Data, setPart3Data] = useState<Part3Item[]>(LISTENING_PART3_DATA);
  const [part4Data, setPart4Data] = useState<Part4Topic[]>(LISTENING_PART4_DATA);

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
        updatedAt: new Date().toISOString(),
      };

      const res = await api.settings.update({
        settings: [
          {
            key: "KEY_MEO_LISTENING_CONFIG",
            value: JSON.stringify(payload),
            description: "Cấu hình ngân hàng câu hỏi & mẹo thi Listening Part 1-4",
          },
        ],
      });

      if (res.success) {
        showToast("✓ Đã lưu toàn bộ cấu hình Key & Mẹo Thi vào Database!");
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
    if (confirm("Bạn có chắc chắn muốn khôi phục về dữ liệu ngân hàng đề mặc định?")) {
      setPart1Data(LISTENING_PART1_DATA);
      setPart2Data(LISTENING_PART2_TOPICS);
      setPart3Data(LISTENING_PART3_DATA);
      setPart4Data(LISTENING_PART4_DATA);
      showToast("✓ Đã khôi phục về dữ liệu mặc định. Bấm 'Lưu lên hệ thống' để áp dụng!");
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
        description="Cấu hình ngân hàng câu hỏi, bóc tách audio script và ma trận đáp án 4 phần Listening hiển thị cho học viên."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/key-va-meo-thi"
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
                  title: "Chủ đề mới (2026)",
                  cloverCount: 3,
                  rows: [],
                };
                setPart2Data((prev) => [...prev, newTopic]);
                showToast("Đã thêm chủ đề mới vào danh sách!");
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
                        + Thêm dòng nghe ({topic.rows.length}/4)
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Xóa chủ đề "${topic.title}"?`)) {
                            setPart2Data((prev) => prev.filter((_, i) => i !== tIdx));
                            showToast("Đã xóa chủ đề");
                          }
                        }}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 cursor-pointer"
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
                  topic: "Chủ đề mới",
                  code: "2010",
                  femaleFirst: ["W", "B", "M", "B"],
                  maleFirst: ["M", "B", "W", "B"],
                  story: "Câu chuyện ghi nhớ cốt lõi...",
                };
                setPart3Data((prev) => [...prev, newItem]);
                showToast("Đã thêm chủ đề ma trận mới!");
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
                  <th className="p-3.5 w-20 text-right">XÓA</th>
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
                        <button
                          onClick={() => {
                            if (confirm(`Xóa chủ đề "${item.topic}"?`)) {
                              setPart3Data((prev) => prev.filter((_, i) => i !== idx));
                              showToast("Đã xóa chủ đề");
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                  title: "Chủ đề mới (2026)",
                  cloverCount: 3,
                  question1: "Câu hỏi 1...",
                  answer1: "Đáp án đúng 1...",
                  question2: "Câu hỏi 2...",
                  answer2: "Đáp án đúng 2...",
                  quickTip: "Mẹo ghi nhớ từ khóa...",
                };
                setPart4Data((prev) => [newTopic, ...prev]);
                showToast("Đã thêm topic Part 4 mới!");
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

                    <button
                      onClick={() => {
                        if (confirm(`Xóa topic "${topic.title}"?`)) {
                          setPart4Data((prev) => prev.filter((_, i) => i !== tIdx));
                          showToast("Đã xóa topic");
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
    </div>
  );
}
