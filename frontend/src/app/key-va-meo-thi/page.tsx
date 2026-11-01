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
import {
  Headphones,
  BookOpen,
  Mic,
  PenTool,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
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
        {/* Top Hero Banner */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-10 md:py-14 border-b border-border">
          <div className="section-container relative z-10 max-w-5xl mx-auto text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold shadow-xs">
              <span>🍀</span>
              <span>Dự đoán trọng tâm & Mẹo thi Aptis ESOL 2026</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black font-heading tracking-tight text-foreground">
              Key &amp; Mẹo Thi Aptis
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tổng hợp phương pháp ôn thi cấp tốc, ma trận đáp án trúng tủ và mẹo ghi nhớ độc quyền theo từng phần bài thi.
            </p>

            {/* LEVEL 1: SKILL TABS */}
            <div className="pt-4 flex items-center justify-center gap-2 overflow-x-auto pb-1">
              {[
                { id: "listening", label: "Listening", icon: Headphones, count: "4 Phần" },
                { id: "reading", label: "Reading", icon: BookOpen, count: "Đang cập nhật" },
                { id: "speaking", label: "Speaking", icon: Mic, count: "Đang cập nhật" },
                { id: "writing", label: "Writing", icon: PenTool, count: "Đang cập nhật" },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSkill === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSkill(tab.id as SkillTab)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
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
          {activeSkill === "listening" ? (
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
                    clover: "🍀 19 Topics 2026",
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
          ) : (
            /* CLEAN PENDING STATE FOR READING, SPEAKING, WRITING */
            <div className="p-12 md:p-16 text-center rounded-2xl border border-dashed border-border bg-card space-y-4 max-w-2xl mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
                {activeSkill === "reading" && <BookOpen className="w-7 h-7" />}
                {activeSkill === "speaking" && <Mic className="w-7 h-7" />}
                {activeSkill === "writing" && <PenTool className="w-7 h-7" />}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Kế hoạch phát triển nội dung
                </span>
                <h2 className="text-lg md:text-xl font-black font-heading text-foreground capitalize">
                  Chuyên đề Mẹo Thi {activeSkill} đang được cập nhật
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                  Đội ngũ chuyên gia học thuật đang tổng hợp và kiểm duyệt ngân hàng tài liệu theo chuẩn đề thi Aptis ESOL 2026.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setActiveSkill("listening")}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-xs hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Headphones className="w-4 h-4" />
                  <span>Khám phá Key &amp; Mẹo Listening</span>
                </button>
                <Link
                  href={`/${activeSkill}`}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Luyện đề thi {activeSkill} ngay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}

