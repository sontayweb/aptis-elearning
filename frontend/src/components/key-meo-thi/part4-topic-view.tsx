"use client";

import React, { useState } from "react";
import {
  LISTENING_PART4_DATA,
  Part4Topic,
} from "@/data/key-meo-listening-data";
import {
  Headphones,
  CheckCircle2,
  Lightbulb,
  Search,
  Filter,
  Check,
  BookOpen,
} from "lucide-react";

export const Part4TopicView: React.FC<{
  customData?: Part4Topic[];
}> = ({ customData }) => {
  const [search, setSearch] = useState("");
  const [selectedClover, setSelectedClover] = useState<number | "all">("all");

  const topicList = customData && customData.length > 0 ? customData : LISTENING_PART4_DATA;

  const filteredTopics = topicList.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(search.toLowerCase()) ||
      topic.question1.toLowerCase().includes(search.toLowerCase()) ||
      topic.answer1.toLowerCase().includes(search.toLowerCase()) ||
      topic.question2.toLowerCase().includes(search.toLowerCase()) ||
      topic.answer2.toLowerCase().includes(search.toLowerCase()) ||
      topic.quickTip.toLowerCase().includes(search.toLowerCase());

    const matchesClover =
      selectedClover === "all" || topic.cloverCount === selectedClover;

    return matchesSearch && matchesClover;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Headphones className="w-3.5 h-3.5" />
          Listening • Part 4 • Mẹo học theo Topic (Dự đoán 2026)
        </span>
        <h1 className="text-xl md:text-2xl font-black font-heading text-foreground">
          Ngân hàng câu hỏi & Mẹo học nhanh Part 4
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Đặc sản Aptis: Mỗi topic gồm 2 câu hỏi, đáp án cốt lõi và câu chuyện mẹo liên kết từ vựng tiếng Anh.
        </p>
      </div>

      {/* Filters: Search & Clover Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo chủ đề, câu hỏi hoặc từ khóa mẹo..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Filter by Clover count */}
        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-xl border border-border shrink-0">
          <button
            onClick={() => setSelectedClover("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedClover === "all"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            Tất cả ({topicList.length})
          </button>
          {[4, 3, 2].map((cnt) => (
            <button
              key={cnt}
              onClick={() => setSelectedClover(cnt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                selectedClover === cnt
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span>{"🍀".repeat(cnt)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Topics List */}
      <div className="space-y-6">
        {filteredTopics.map((topic, tIdx) => (
          <div
            key={topic.id || tIdx}
            className="p-5 md:p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs hover:border-primary/40 transition-colors"
          >
            {/* Topic Header Card (Matching Image 1) */}
            <div className="p-3.5 md:p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-primary tracking-wider block">
                    LISTENING PART 4
                  </span>
                  <h3 className="text-sm md:text-base font-black text-foreground flex items-center gap-2 flex-wrap">
                    <span>{topic.title}</span>
                    <span className="text-emerald-500 text-xs">
                      {"🍀".repeat(topic.cloverCount)}
                    </span>
                  </h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-[11px] shrink-0">
                2 câu
              </span>
            </div>

            {/* Question 01 Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-7 h-7 rounded-lg border border-border bg-card text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  01
                </div>
                <div className="text-xs md:text-sm font-semibold text-foreground leading-relaxed">
                  {topic.question1}
                </div>
              </div>
              <div className="md:w-5/12 shrink-0 p-3 rounded-xl border border-primary/25 bg-primary/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đáp án đúng</span>
                </div>
                <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">
                  {topic.answer1}
                </div>
              </div>
            </div>

            {/* Question 02 Card */}
            <div className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-7 h-7 rounded-lg border border-border bg-card text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  02
                </div>
                <div className="text-xs md:text-sm font-semibold text-foreground leading-relaxed">
                  {topic.question2}
                </div>
              </div>
              <div className="md:w-5/12 shrink-0 p-3 rounded-xl border border-primary/25 bg-primary/5">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đáp án đúng</span>
                </div>
                <div className="text-xs md:text-sm font-bold text-foreground mt-0.5">
                  {topic.answer2}
                </div>
              </div>
            </div>

            {/* Quick Tip Box (Matching Image 1) */}
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Lightbulb className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  MẸO HỌC NHANH
                </span>
                <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed">
                  {topic.quickTip}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

