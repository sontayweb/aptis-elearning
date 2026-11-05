"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  PenTool,
  Check,
  X,
} from "lucide-react";
import AdminTableCard from "@/components/admin/admin-table-card";
import {
  WRITING_KEY_MEO_DATA,
  WritingPartData,
} from "@/data/key-meo-writing-data";

type TabType = "p1" | "p2" | "p3" | "p4";

interface AdminWritingTabProps {
  writingData: Record<string, WritingPartData>;
  setWritingData: React.Dispatch<React.SetStateAction<Record<string, WritingPartData>>>;
  showToast: (msg: string) => void;
}

export default function AdminWritingTab({
  writingData,
  setWritingData,
  showToast,
}: AdminWritingTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("p1");
  const [writingP1Cat, setWritingP1Cat] = useState<string>("all");
  const [writingP4Cat, setWritingP4Cat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<{
    skill?: "writing";
    part: TabType;
    data: any;
    index?: number;
  } | null>(null);

  return (
    <>
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
    </>
  );
}
