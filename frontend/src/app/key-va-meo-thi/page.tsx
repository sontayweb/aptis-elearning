"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { Part1GroupView } from "@/components/key-meo-thi/part1-group-view";
import { Part2SpeakerMatchView } from "@/components/key-meo-thi/part2-speaker-match-view";
import { Part3CheatSheetView } from "@/components/key-meo-thi/part3-cheat-sheet-view";
import { Part4TopicView } from "@/components/key-meo-thi/part4-topic-view";
import { WritingCheatSheetView } from "@/components/key-meo-thi/writing-cheat-sheet-view";
import { SpeakingCheatSheetView } from "@/components/key-meo-thi/speaking-cheat-sheet-view";
import { ReadingCheatSheetView } from "@/components/key-meo-thi/reading-cheat-sheet-view";
import {
  Headphones,
  Info,
  BookOpen,
  Mic,
  PenTool,
} from "lucide-react";

type SkillTab = "listening" | "reading" | "speaking" | "writing";
type ListeningPartTab = "p1" | "p2" | "p3" | "p4";

export default function KeyVaMeoThiPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <KeyVaMeoThiContent />
    </Suspense>
  );
}

function KeyVaMeoThiContent() {
  const searchParams = useSearchParams();
  const partParam = searchParams.get("part") as ListeningPartTab | null;
  const skillParam = searchParams.get("skill") as SkillTab | null;

  const [activeSkill, setActiveSkill] = useState<SkillTab>(skillParam || "listening");
  const [activeListeningPart, setActiveListeningPart] = useState<ListeningPartTab>(
    partParam && ["p1", "p2", "p3", "p4"].includes(partParam) ? partParam : "p1"
  );
  const [customConfig, setCustomConfig] = useState<any>(null);

  useEffect(() => {
    api.settings
      .getPublic()
      .then((res: any) => {
        if (res.success && res.data?.raw?.KEY_MEO_LISTENING_CONFIG) {
          try {
            setCustomConfig(JSON.parse(res.data.raw.KEY_MEO_LISTENING_CONFIG));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (partParam && ["p1", "p2", "p3", "p4"].includes(partParam)) {
      setActiveListeningPart(partParam);
    }
    if (skillParam && ["listening", "reading", "speaking", "writing"].includes(skillParam)) {
      setActiveSkill(skillParam);
    }
  }, [partParam, skillParam]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Compact Header Web App */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-background to-background py-3.5 sm:py-4 border-b border-border/80">
          <div className="section-container relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <span className="text-sm">🍀</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight text-foreground">
                Key &amp; Mẹo Thi Aptis
              </h1>
              <div className="relative group/info inline-flex items-center">
                <button
                  type="button"
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-help"
                  aria-label="Thông tin Key & Mẹo thi"
                >
                  <Info className="w-4 h-4" />
                </button>
                <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-50 w-80 max-w-xs rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs p-3 shadow-xl border border-slate-700 opacity-0 group-hover/info:opacity-100 group-hover/info:pointer-events-auto group-focus-within/info:opacity-100 group-focus-within/info:pointer-events-auto transition-all transform origin-top-left leading-relaxed">
                  Tổng hợp phương pháp ôn thi cấp tốc, ma trận đáp án trúng tủ và mẹo ghi nhớ độc quyền theo từng phần bài thi Aptis ESOL 2026.
                </div>
              </div>
            </div>

            {/* LEVEL 1: SKILL TABS (Listening, Reading, Speaking, Writing) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: "listening", label: "Listening", icon: Headphones, count: "4 Phần" },
                { id: "reading", label: "Reading", icon: BookOpen, count: "4 Phần" },
                { id: "speaking", label: "Speaking", icon: Mic, count: "4 Phần" },
                { id: "writing", label: "Writing", icon: PenTool, count: "4 Phần" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSkill === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSkill(tab.id as SkillTab)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Content Area */}
        <section className="section-container max-w-6xl mx-auto py-8">
          {activeSkill === "listening" && (
            <div className="space-y-6">
              {/* LEVEL 2: LISTENING SUB-TABS (Part 1 - 4) */}
              <div className="flex items-center justify-center sm:justify-start gap-2 overflow-x-auto pb-2 border-b border-border">
                {[
                  {
                    id: "p1",
                    num: "Part 1",
                    title: "Học theo nhóm đáp án",
                    clover: "🍀 Mới",
                  },
                  {
                    id: "p2",
                    num: "Part 2",
                    title: "Ghép người nói theo chủ đề",
                    clover: "🍀 Mẹo loại trừ",
                  },
                  {
                    id: "p3",
                    num: "Part 3",
                    title: "Ma trận Câu 15 (M - W - B)",
                    clover: "🍀 17 Chủ đề",
                  },
                  {
                    id: "p4",
                    num: "Part 4",
                    title: "Mẹo học theo Topic",
                    clover: "🍀 48 Topics 2026",
                  },
                ].map((pTab) => {
                  const isActive = activeListeningPart === pTab.id;
                  return (
                    <button
                      key={pTab.id}
                      onClick={() => setActiveListeningPart(pTab.id as ListeningPartTab)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                        isActive
                          ? "bg-primary/10 border-primary text-primary shadow-xs"
                          : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                      }`}
                    >
                      <span>{pTab.num}: {pTab.title}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                        {pTab.clover}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* RENDER THE ACTIVE LISTENING PART VIEW */}
              {activeListeningPart === "p1" && <Part1GroupView customData={customConfig?.part1} />}
              {activeListeningPart === "p2" && <Part2SpeakerMatchView customData={customConfig?.part2} />}
              {activeListeningPart === "p3" && <Part3CheatSheetView customData={customConfig?.part3} />}
              {activeListeningPart === "p4" && <Part4TopicView customData={customConfig?.part4} />}
            </div>
          )}

          {activeSkill === "reading" && (
            <ReadingCheatSheetView customData={customConfig?.reading} />
          )}

          {activeSkill === "speaking" && (
            <SpeakingCheatSheetView customData={customConfig?.speaking} />
          )}

          {activeSkill === "writing" && (
            <WritingCheatSheetView customData={customConfig?.writing} />
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
