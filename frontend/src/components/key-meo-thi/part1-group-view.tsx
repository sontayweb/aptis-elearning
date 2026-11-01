"use client";

import React, { useState } from "react";
import {
  LISTENING_PART1_CATEGORIES,
  LISTENING_PART1_DATA,
  Part1Question,
} from "@/data/key-meo-listening-data";
import { Sparkles, Headphones, CheckCircle2, Search, Filter } from "lucide-react";

export const Part1GroupView: React.FC<{
  customData?: Record<string, Part1Question[]>;
}> = ({ customData }) => {
  const [activeCat, setActiveCat] = useState("time");
  const [search, setSearch] = useState("");

  const dataSource = customData || LISTENING_PART1_DATA;
  const currentQuestions: Part1Question[] = dataSource[activeCat] || [];
  const filteredQuestions = currentQuestions.filter(
    (q) =>
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5" />
            Listening • Part 1 • Đáp án theo nhóm chủ đề
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-black font-heading text-foreground">
          Học câu hỏi và đáp án theo nhóm
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Mỗi câu được xếp vào đúng nhóm đáp án để bạn ôn nhanh theo một dạng nghe, ghi nhớ từ khóa cốt lõi.
        </p>
      </div>

      {/* Categories Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {LISTENING_PART1_CATEGORIES.map((cat) => {
          const isActive = activeCat === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCat(cat.id)}
              className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              <span>{cat.num} {cat.label}</span>
              {cat.isNew && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-0.5">
                  🍀 MỚI
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm câu hỏi hoặc đáp án..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="text-xs text-muted-foreground font-semibold">
          Hiển thị <span className="font-bold text-foreground">{filteredQuestions.length}</span> câu
        </div>
      </div>

      {/* Question Cards List */}
      {filteredQuestions.length > 0 ? (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden shadow-xs">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors"
            >
              {/* Left: Question Number & Content */}
              <div className="flex items-start gap-3.5 flex-1">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                  {String(q.number).padStart(2, "0")}
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                      CÂU HỎI
                    </span>
                    {q.isNew && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[9px] font-black border border-rose-500/30">
                        MỚI
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm font-bold text-foreground leading-relaxed">
                    {q.question}
                  </p>
                </div>
              </div>

              {/* Right: Answer Pill */}
              <div className="md:w-64 shrink-0">
                <div className="p-3 rounded-2xl border border-rose-300/80 dark:border-rose-800/60 bg-rose-500/[0.03] text-left md:text-right transition-colors">
                  <span className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-wider block">
                    ĐÁP ÁN
                  </span>
                  <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">
                    {q.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-muted/20 space-y-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Filter className="w-5 h-5" />
          </div>
          <p className="text-xs md:text-sm font-bold text-foreground">
            Đang cập nhật câu hỏi cho nhóm chủ đề này
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Hệ thống đang đồng bộ thêm câu hỏi chuẩn từ ngân hàng dữ liệu. Hãy chọn tab &quot;01 Thời gian&quot; để học ngay!
          </p>
        </div>
      )}
    </div>
  );
};

