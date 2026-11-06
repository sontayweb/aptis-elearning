"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  BookOpen,
  Check,
  X,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import AdminTableCard from "@/components/admin/admin-table-card";
import {
  READING_KEY_MEO_DATA,
  READING_P2_TOPICS,
  ReadingPartData,
  ReadingP2Topic,
} from "@/data/key-meo-reading-data";

type TabType = "p1" | "p2" | "p3" | "p4";

interface AdminReadingTabProps {
  readingData: Record<string, ReadingPartData>;
  setReadingData: React.Dispatch<React.SetStateAction<Record<string, ReadingPartData>>>;
  showToast: (msg: string) => void;
}

export default function AdminReadingTab({
  readingData,
  setReadingData,
  showToast,
}: AdminReadingTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("p1");
  const [search, setSearch] = useState("");
  const [editingItem, setEditingItem] = useState<{
    skill?: "reading";
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
                      .map((c, realIdx) => ({ c, realIdx }))
                      .filter(
                        ({ c }) =>
                          (c.questionPattern || "").toLowerCase().includes(search.toLowerCase()) ||
                          (c.answerType || "").toLowerCase().includes(search.toLowerCase())
                      )
                      .map(({ c, realIdx }, idx) => (
                        <tr key={realIdx} className="hover:bg-muted/20 transition-colors">
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
                                    index: realIdx,
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
                                      (_, i) => i !== realIdx
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
                  .map((topic, realIdx) => ({ topic, realIdx }))
                  .filter(
                    ({ topic }) =>
                      (topic.title || "").toLowerCase().includes(search.toLowerCase()) ||
                      (topic.summary || "").toLowerCase().includes(search.toLowerCase())
                  )
                  .map(({ topic, realIdx: tIdx }) => (
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
                      .map((t, realIdx) => ({ t, realIdx }))
                      .filter(
                        ({ t }) =>
                          (t.questionKeyword || "").toLowerCase().includes(search.toLowerCase()) ||
                          (t.passageSynonym || "").toLowerCase().includes(search.toLowerCase()) ||
                          (t.trapNote || "").toLowerCase().includes(search.toLowerCase())
                      )
                      .map(({ t, realIdx }, idx) => (
                        <tr key={realIdx} className="hover:bg-muted/20 transition-colors">
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
                                    index: realIdx,
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
                                    ).filter((_, i) => i !== realIdx);
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
                      .map((h, realIdx) => ({ h, realIdx }))
                      .filter(
                        ({ h }) =>
                          (h.headingType || "").toLowerCase().includes(search.toLowerCase()) ||
                          (h.clueKeywords || "").toLowerCase().includes(search.toLowerCase()) ||
                          (h.guide || "").toLowerCase().includes(search.toLowerCase())
                      )
                      .map(({ h, realIdx }, idx) => (
                        <tr key={realIdx} className="hover:bg-muted/20 transition-colors">
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
                                    index: realIdx,
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
                                    ).filter((_, i) => i !== realIdx);
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
                <label className="font-bold text-foreground block mb-1">Từ khóa câu hỏi (Question Keyword):</label>
                <input
                  type="text"
                  value={editingItem.data.questionKeyword || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, questionKeyword: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: prefer working alone / too expensive..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Từ đồng nghĩa trong bài đọc (Passage Synonym):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.passageSynonym || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, passageSynonym: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: work independently / beyond my budget..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Bẫy cần tránh &amp; Mẹo nhận diện (Trap Note):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.trapNote || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, trapNote: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Cẩn thận bẫy phủ định 'used to' hoặc nhắc lại đúng từ nhưng phủ định..."
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
                <label className="font-bold text-foreground block mb-1">Dạng tiêu đề (Heading Type):</label>
                <input
                  type="text"
                  value={editingItem.data.headingType || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, headingType: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Lịch sử / Nguồn gốc (Origins / History / Past)"
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Từ khóa nhận diện (Clue Keywords):</label>
                <textarea
                  rows={2}
                  value={editingItem.data.clueKeywords || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, clueKeywords: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: century, ancient, originally, dates back to, 19th..."
                />
              </div>

              <div>
                <label className="font-bold text-foreground block mb-1">Hướng dẫn xử lý (Guide):</label>
                <textarea
                  rows={3}
                  value={editingItem.data.guide || ""}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, guide: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-border bg-muted/30 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="VD: Tìm đoạn văn có nhiều mốc năm tháng hoặc từ chỉ thời kỳ cổ đại..."
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
    </>
  );
}
