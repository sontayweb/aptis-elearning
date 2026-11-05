"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Mic,
  Check,
  X,
  ZoomIn,
  Eye,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import AdminTableCard from "@/components/admin/admin-table-card";
import {
  SPEAKING_KEY_MEO_DATA,
  SpeakingPartData,
} from "@/data/key-meo-speaking-data";

type TabType = "p1" | "p2" | "p3" | "p4";

interface AdminSpeakingTabProps {
  speakingData: Record<string, SpeakingPartData>;
  setSpeakingData: React.Dispatch<React.SetStateAction<Record<string, SpeakingPartData>>>;
  showToast: (msg: string) => void;
}

export default function AdminSpeakingTab({
  speakingData,
  setSpeakingData,
  showToast,
}: AdminSpeakingTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>("p1");
  const [speakingP1Cat, setSpeakingP1Cat] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [previewSpeakingModal, setPreviewSpeakingModal] = useState<{ url: string; title: string } | null>(null);
  const [editingItem, setEditingItem] = useState<{
    skill?: "speaking";
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
                label: "Part 1: Câu Hỏi Cá Nhân & Cấu Trúc",
                count: `${speakingData.p1?.formulasP1?.length || 6} mẫu`,
              },
              {
                id: "p2",
                label: "Part 2: Mẫu Mô Tả Tranh & Trải Nghiệm",
                count: "8 bước B2-C1",
              },
              {
                id: "p3",
                label: "Part 3: So Sánh 2 Tranh & Từ Nối",
                count: "6 bước B2-C1",
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
                      onClick={() =>
                        setPreviewSpeakingModal({
                          url: "/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg",
                          title: "Cấu Trúc Speaking Aptis Part 2 — Band B2–C1 (Infographic 8 Bước)",
                        })
                      }
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
                      onClick={() =>
                        setPreviewSpeakingModal({
                          url: "/images/key-meo-thi/cau-truc-speaking-part-2-band-b2-c1.jpg",
                          title: "Cấu Trúc Speaking Aptis Part 2 — Band B2–C1 (Infographic 8 Bước)",
                        })
                      }
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
              {/* Infographic 6 bước Band B2-C1 đồng bộ cho học viên */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-purple-500/30 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <div>
                      <h3 className="font-heading font-black text-sm text-foreground">
                        Cấu Trúc Speaking Aptis Part 3 — Band B2–C1 (Infographic 6 Bước So Sánh)
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Tài liệu trực quan được hiển thị đồng bộ cho học viên tại trang Key &amp; Mẹo thi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/images/key-meo-thi/cau-truc-speaking-part-3-band-b2-c1.jpg"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Mở ảnh tab mới</span>
                    </a>
                    <button
                      onClick={() =>
                        setPreviewSpeakingModal({
                          url: "/images/key-meo-thi/cau-truc-speaking-part-3-band-b2-c1.jpg",
                          title: "Cấu Trúc Speaking Aptis Part 3 — Band B2–C1 (Infographic 6 Bước)",
                        })
                      }
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
                      onClick={() =>
                        setPreviewSpeakingModal({
                          url: "/images/key-meo-thi/cau-truc-speaking-part-3-band-b2-c1.jpg",
                          title: "Cấu Trúc Speaking Aptis Part 3 — Band B2–C1 (Infographic 6 Bước)",
                        })
                      }
                      className="group relative rounded-xl overflow-hidden border border-purple-500/30 bg-muted/20 cursor-pointer shadow-xs hover:shadow-md transition-all"
                    >
                      <img
                        src="/images/key-meo-thi/cau-truc-speaking-part-3-band-b2-c1.jpg"
                        alt="Cấu Trúc Speaking Aptis Part 3 Band B2-C1"
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
                        Danh sách 6 bước so sánh &amp; Mục tiêu đánh giá B2–C1
                      </div>
                      <div className="divide-y divide-border text-xs max-h-[220px] overflow-y-auto">
                        {[
                          { step: 1, name: "TOPIC (Chủ đề chung)", goal: "Nêu điểm tương đồng khái quát của 2 tranh" },
                          { step: 2, name: "PICTURE 1 (Mô tả tranh 1)", goal: "Nêu bối cảnh, hành động và chi tiết chính" },
                          { step: 3, name: "LINKING (Từ nối đối lập)", goal: "Chuyển ý tự nhiên sang bức tranh thứ 2" },
                          { step: 4, name: "PICTURE 2 (Mô tả tranh 2)", goal: "Mô tả tranh 2 đối chiếu trực tiếp với tranh 1" },
                          { step: 5, name: "DIFFERENCES (Khác biệt sâu)", goal: "So sánh phương tiện, bầu không khí, chi phí" },
                          { step: 6, name: "FEELINGS & PREFERENCE (Cảm xúc & Lựa chọn cá nhân)", goal: "Đoán cảm xúc nhân vật + Nêu lựa chọn cá nhân" },
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
                        ✓ Ảnh Infographic và bảng 6 bước so sánh nâng cao đã được chèn đồng bộ hiển thị tại giao diện học viên (<code className="font-mono text-foreground">/key-va-meo-thi?skill=speaking</code>).
                      </p>
                    </div>
                  </div>
                </div>
              </div>

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

      {previewSpeakingModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewSpeakingModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-[95vh] w-full bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-heading font-black text-xs sm:text-sm text-foreground">
                  {previewSpeakingModal.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewSpeakingModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Mở tab mới</span>
                </a>
                <button
                  onClick={() => setPreviewSpeakingModal(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-2 sm:p-4 flex-1 flex items-center justify-center bg-black/5">
              <img
                src={previewSpeakingModal.url}
                alt={previewSpeakingModal.title}
                className="max-h-[82vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
