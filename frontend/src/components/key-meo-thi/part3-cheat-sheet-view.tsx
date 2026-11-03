"use client";

import React, { useState } from "react";
import {
  LISTENING_PART3_DATA,
  LISTENING_PART3_RULES,
  Part3Item,
} from "@/data/key-meo-listening-data";
import {
  Headphones,
  Eye,
  EyeOff,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Sparkles,
  HelpCircle,
  Lightbulb,
} from "lucide-react";

export const Part3CheatSheetView: React.FC<{
  customData?: Part3Item[];
}> = ({ customData }) => {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [hideAnswers, setHideAnswers] = useState(false);
  const [search, setSearch] = useState("");
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  const cheatData = customData && customData.length > 0 ? customData : LISTENING_PART3_DATA;

  const filteredData = cheatData.filter((item) =>
    item.topic.toLowerCase().includes(search.toLowerCase()) ||
    item.story.toLowerCase().includes(search.toLowerCase()) ||
    item.code.includes(search)
  );

  const toggleReveal = (stt: number) => {
    setRevealedIds((prev) => ({ ...prev, [stt]: !prev[stt] }));
  };

  const renderBadge = (char: "W" | "B" | "M", idx: number) => {
    let colorClass = "";
    if (char === "W") {
      colorClass = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    } else if (char === "B") {
      colorClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    } else {
      colorClass = "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
    }

    return (
      <span
        key={idx}
        className={`w-6 h-6 rounded-full border text-[11px] font-black flex items-center justify-center shrink-0 ${colorClass}`}
        title={char === "W" ? "Woman (Nữ)" : char === "M" ? "Man (Nam)" : "Both (Cả hai)"}
      >
        {char}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Action Buttons */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            Aptis Listening Cheat Sheet • Part 3
          </span>
          <h1 className="text-xl md:text-2xl font-black font-heading text-foreground">
            Bảng Chủ Đề Câu 15 & Mẹo Học Nhanh
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Bí quyết bắt vị đối thoại Nam (M) - Nữ (W) - Cả hai (B) và mã số ghi nhớ cốt lõi.
          </p>
        </div>

        {/* 2 Interactive Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer transition-all shadow-xs"
          >
            {viewMode === "table" ? (
              <>
                <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                <span>Chuyển sang Thẻ (Card View)</span>
              </>
            ) : (
              <>
                <TableIcon className="w-3.5 h-3.5 text-primary" />
                <span>Chuyển sang Bảng (Table View)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setHideAnswers(!hideAnswers)}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
              hideAnswers
                ? "bg-rose-500/10 border-rose-500/40 text-rose-600 dark:text-rose-400"
                : "bg-card hover:bg-muted border-border text-foreground"
            }`}
          >
            {hideAnswers ? (
              <>
                <Eye className="w-3.5 h-3.5 text-rose-500" />
                <span>Hiện đáp án</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Tự kiểm tra (Ẩn đáp án)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 3 Strategy Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {LISTENING_PART3_RULES.map((rule, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl border border-border bg-card flex items-start gap-3 shadow-xs"
          >
            <div className="w-12 h-12 rounded-xl border border-primary/20 bg-primary/10 text-primary flex items-center justify-center font-black text-sm shrink-0">
              {rule.badge}
            </div>
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                {rule.title}
              </h3>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {rule.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo chủ đề, mã code hoặc câu chuyện mẹo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground font-semibold">
          Tổng số: <span className="font-bold text-foreground">{filteredData.length}</span> chủ đề
        </div>
      </div>

      {/* Content Rendering: Table View OR Cards View */}
      {viewMode === "table" ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-[11px] font-black uppercase text-muted-foreground tracking-wider">
                  <th className="p-3.5 w-1/5">STT & Chủ đề (Topic)</th>
                  <th className="p-3.5 w-24 text-center">Mã Code</th>
                  <th className="p-3.5 w-36 text-center">Nữ nói trước</th>
                  <th className="p-3.5 w-36 text-center">Nam nói trước</th>
                  <th className="p-3.5">Câu chuyện mẹo ghi nhớ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredData.map((item) => {
                  const isItemHidden = hideAnswers && !revealedIds[item.stt];

                  return (
                    <tr
                      key={item.stt}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      {/* Column 1: Topic */}
                      <td className="p-3.5 font-bold text-foreground">
                        <div className="flex items-start gap-2">
                          <span className="text-muted-foreground">{item.stt}.</span>
                          <span className="text-xs md:text-sm font-bold text-foreground">{item.topic}</span>
                        </div>
                      </td>

                      {/* Column 2: Mã Code */}
                      <td className="p-3.5 text-center">
                        {isItemHidden ? (
                          <button
                            onClick={() => toggleReveal(item.stt)}
                            className="px-2.5 py-1 rounded-lg bg-muted text-[10px] font-bold text-muted-foreground hover:bg-muted/80 cursor-pointer"
                          >
                            ???
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg border border-primary/30 bg-primary/10 text-primary font-black text-xs font-mono">
                            {item.code}
                          </span>
                        )}
                      </td>

                      {/* Column 3: Nữ nói trước */}
                      <td className="p-3.5">
                        {isItemHidden ? (
                          <div className="text-center text-muted-foreground text-[10px] italic">
                            (Đã ẩn)
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {item.femaleFirst.map((char, cIdx) => renderBadge(char, cIdx))}
                          </div>
                        )}
                      </td>

                      {/* Column 4: Nam nói trước */}
                      <td className="p-3.5">
                        {isItemHidden ? (
                          <div className="text-center text-muted-foreground text-[10px] italic">
                            (Đã ẩn)
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1.5">
                            {item.maleFirst.map((char, cIdx) => renderBadge(char, cIdx))}
                          </div>
                        )}
                      </td>

                      {/* Column 5: Mẹo ghi nhớ */}
                      <td className="p-3.5 text-xs text-foreground/90 font-medium leading-relaxed">
                        {item.story}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards View (Flashcard style) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((item) => {
            const isItemHidden = hideAnswers && !revealedIds[item.stt];

            return (
              <div
                key={item.stt}
                className="p-5 rounded-2xl border border-border bg-card space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">
                      CHỦ ĐỀ #{item.stt}
                    </span>
                    {!isItemHidden && (
                      <span className="px-2.5 py-0.5 rounded-lg border border-primary/30 bg-primary/10 text-primary font-black text-xs font-mono">
                        Mã {item.code}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-black text-foreground">
                    {item.topic}
                  </h3>
                  <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs text-foreground/90 leading-relaxed font-medium">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 inline mr-1.5 shrink-0" /><span>{item.story}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/70 space-y-2">
                  {isItemHidden ? (
                    <button
                      onClick={() => toggleReveal(item.stt)}
                      className="w-full py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Bấm để lật xem đáp án
                    </button>
                  ) : (
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Nữ nói trước:</span>
                        <div className="flex items-center gap-1">
                          {item.femaleFirst.map((char, cIdx) => renderBadge(char, cIdx))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground">Nam nói trước:</span>
                        <div className="flex items-center gap-1">
                          {item.maleFirst.map((char, cIdx) => renderBadge(char, cIdx))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

