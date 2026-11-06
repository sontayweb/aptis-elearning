"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
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
  Lock,
  Crown,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Loader2,
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
  const { user, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const partParam = searchParams.get("part") as ListeningPartTab | null;
  const skillParam = searchParams.get("skill") as SkillTab | null;

  const [activeSkill, setActiveSkill] = useState<SkillTab>(skillParam || "listening");
  const [activeListeningPart, setActiveListeningPart] = useState<ListeningPartTab>(
    partParam && ["p1", "p2", "p3", "p4"].includes(partParam) ? partParam : "p1"
  );
  const [customConfig, setCustomConfig] = useState<any>(null);

  const isProOrAdmin = Boolean(
    user &&
      (user.role === "SUPER_ADMIN" ||
        user.role === "ADMIN" ||
        user.role === "TEACHER" ||
        (user.subscription?.code && user.subscription.code !== "FREE") ||
        (user.activeSubscription?.code && user.activeSubscription.code !== "FREE") ||
        (Array.isArray(user.user_subscriptions) &&
          user.user_subscriptions.some(
            (sub) => sub?.plan?.code && sub.plan.code !== "FREE"
          )))
  );

  useEffect(() => {
    if (!isProOrAdmin) return;
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
  }, [isProOrAdmin]);

  useEffect(() => {
    if (partParam && ["p1", "p2", "p3", "p4"].includes(partParam)) {
      setActiveListeningPart(partParam);
    }
    if (skillParam && ["listening", "reading", "speaking", "writing"].includes(skillParam)) {
      setActiveSkill(skillParam);
    }
  }, [partParam, skillParam]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Đang kiểm tra quyền truy cập...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isProOrAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <Navbar />
        <main className="flex-1 pt-20 pb-16 flex items-center justify-center px-4">
          <div className="max-w-xl w-full rounded-3xl border border-amber-500/30 bg-card shadow-xl overflow-hidden relative">
            <div className="bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-transparent p-6 sm:p-8 text-center border-b border-border/60">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/25">
                <Crown className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold mb-3 border border-amber-500/20">
                <Lock className="w-3.5 h-3.5" />
                Đặc quyền Tài khoản VIP PRO
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-foreground tracking-tight">
                Kho Key &amp; Mẹo Thi Aptis Độc Quyền
              </h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                Tài liệu tổng hợp ma trận đáp án trúng tủ, từ khóa nhận diện nhanh và công thức ăn điểm 4 kỹ năng Listening, Reading, Speaking, Writing chỉ dành riêng cho học viên gói <strong className="text-foreground">VIP PRO</strong>.
              </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                {[
                  "Ma trận Key Listening Part 1 - 4 trúng tủ 2026",
                  "Mẹo bẫy Paraphrase & Heading Reading Part 1 - 4",
                  "Khung mẫu câu Speaking B2 - C đạt điểm tối đa",
                  "Template Email & Club Writing chuẩn giám khảo",
                ].map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border/60 text-xs font-medium text-foreground"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {!user ? (
                  <>
                    <Link
                      href="/login?redirect=/key-va-meo-thi"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      Đăng nhập tài khoản PRO
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/pricing"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Xem gói nâng cấp PRO
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/pricing"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold text-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                    >
                      <Sparkles className="w-4 h-4" />
                      Nâng cấp VIP PRO ngay
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted text-foreground font-semibold text-sm transition-all text-center"
                    >
                      Về Bảng điều khiển
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
        <FloatingActions />
      </div>
    );
  }

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
