"use client";

import React, { useState } from "react";
import {
  LISTENING_PART2_TOPICS,
  Part2Topic,
} from "@/data/key-meo-listening-data";
import {
  Headphones,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  FileText,
  Search,
} from "lucide-react";

export const Part2SpeakerMatchView: React.FC<{
  customData?: Part2Topic[];
}> = ({ customData }) => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>("p2-t17");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");

  const topicsList = customData && customData.length > 0 ? customData : LISTENING_PART2_TOPICS;

  const activeTopic =
    topicsList.find((t) => t.id === selectedTopicId) ||
    topicsList[3] ||
    topicsList[0];

  const filteredTopics = topicsList.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Strategy Tips */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card space-y-4">
        <div className="space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            Listening • Part 2 • Ghép người nói theo chủ đề
          </span>
          <h1 className="text-xl md:text-2xl font-black font-heading text-foreground">
            Mẹo loại trừ & Phân tích đáp án
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Bảng bóc tách transcript câu thoại của 4 người nói kèm từ khóa đồng nghĩa (paraphrase) chuẩn.
          </p>
        </div>

        {/* Strategy Bar */}
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-wider shrink-0">
              STRATEGY TIPS
            </span>
            <span className="text-xs font-bold text-foreground">
              01. Đọc pool đáp án ➔ 02. Bắt keyword / paraphrase ➔ 03. Loại trừ đáp án
            </span>
          </div>
          <span className="text-[11px] font-semibold text-primary shrink-0">
            Kỹ thuật ăn trọn 6 điểm
          </span>
        </div>
      </div>

      {/* Main Split Layout: Sidebar + Table */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sidebar: Topic Selector */}
        <div
          className={`w-full lg:w-72 shrink-0 transition-all space-y-3 ${
            sidebarCollapsed ? "lg:w-16" : ""
          }`}
        >
          <div className="p-3.5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  DANH SÁCH CHỦ ĐỀ
                </span>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                title={sidebarCollapsed ? "Mở rộng" : "Thu gọn"}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <>
                    <span>Thu gọn</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {!sidebarCollapsed && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm chủ đề..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-border bg-muted/40 text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredTopics.map((topic) => {
                  const isSelected = selectedTopicId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSelectedTopicId(topic.id)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2 cursor-pointer border ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : "bg-card hover:bg-muted/50 border-transparent text-foreground font-medium"
                      }`}
                    >
                      <span className="mt-0.5 shrink-0 text-emerald-500 text-[11px]">
                        {"🍀".repeat(topic.cloverCount)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="truncate">
                          Chủ đề {topic.topicNumber}: {topic.title}
                        </div>
                        {topic.isPendingDoc && (
                          <span className="text-[10px] text-muted-foreground font-normal">
                            (Chờ file doc tổng hợp)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!sidebarCollapsed && (
              <div className="pt-2 border-t border-border">
                <button
                  type="button"
                  className="w-full py-2.5 px-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>MỞ RỘNG / XEM THÊM</span>
                  <span>🍀 MỚI</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Master Cheat Sheet Table */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base md:text-lg font-black font-heading text-foreground flex items-center gap-2">
              <span>Chủ đề {activeTopic.topicNumber}: {activeTopic.title}</span>
              <span className="text-emerald-500 text-sm">
                {"🍀".repeat(activeTopic.cloverCount)}
              </span>
            </h2>
          </div>

          {activeTopic.rows.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                      <th className="p-4 w-1/4">ĐÁP ÁN TRONG POOL (TARGET ANSWER)</th>
                      <th className="p-4 w-5/12">PHẦN NGHE (AUDIO SCRIPT)</th>
                      <th className="p-4 w-1/3">TỪ KHÓA / NỘI DUNG CẦN NGHE (KEYWORDS & CLUES)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activeTopic.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-muted/20 transition-colors align-top"
                      >
                        {/* Column 1: Target Answer */}
                        <td className="p-4 space-y-1">
                          <div className="font-bold text-foreground text-xs md:text-sm">
                            {row.targetAnswer}
                          </div>
                          <div className="text-[11px] text-muted-foreground italic">
                            ({row.targetAnswerVn})
                          </div>
                        </td>

                        {/* Column 2: Audio Script */}
                        <td className="p-4 text-xs md:text-sm text-foreground/90 leading-relaxed font-serif">
                          &ldquo;{row.audioScript}&rdquo;
                        </td>

                        {/* Column 3: Keywords & Clues */}
                        <td className="p-4 space-y-1.5">
                          {row.keywords.map((kw, kIdx) => (
                            <div
                              key={kIdx}
                              className="flex items-start gap-1.5 text-xs text-foreground/90"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                              <span>{kw}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <p className="text-xs md:text-sm font-bold text-foreground">
                Chủ đề này đang được ban học thuật hoàn thiện file doc
              </p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Theo đúng lộ trình, dữ liệu sẽ được cập nhật ngay khi giáo viên gửi file doc tổng hợp. Bạn hãy chọn **Chủ đề 17** ở danh sách bên trái để xem bảng mẫu chuẩn!
              </p>
              <button
                onClick={() => setSelectedTopicId("p2-t17")}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 cursor-pointer"
              >
                Xem Chủ đề 17 (Bảo vệ môi trường)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

