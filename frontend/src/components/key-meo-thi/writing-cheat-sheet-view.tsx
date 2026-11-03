"use client";

import { useState } from "react";
import {
  Clock,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Star,
  FileText,
  Mail,
  MessageSquare,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Bookmark,
} from "lucide-react";
import { WRITING_KEY_MEO_DATA, WritingPartData } from "@/data/key-meo-writing-data";

interface WritingCheatSheetViewProps {
  customData?: Record<string, WritingPartData>;
}

export function WritingCheatSheetView({ customData }: WritingCheatSheetViewProps) {
  const [activePartKey, setActivePartKey] = useState<"p1" | "p2" | "p3" | "p4">("p1");

  // Merge customData from DB (if any) with default seed data
  const data: WritingPartData =
    (customData && customData[activePartKey]) || WRITING_KEY_MEO_DATA[activePartKey] || WRITING_KEY_MEO_DATA.p1;

  return (
    <div className="space-y-6">
      {/* 1. TOP PART SELECTOR (Part 1 - Part 4) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "p1", label: "Part 1", desc: "1–5 từ" },
          { id: "p2", label: "Part 2", desc: "20–30 từ" },
          { id: "p3", label: "Part 3", desc: "3 câu 30–40 từ" },
          { id: "p4", label: "Part 4", desc: "2 Email (40-50 & 120-150 từ)" },
        ].map((tab) => {
          const isActive = activePartKey === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePartKey(tab.id as "p1" | "p2" | "p3" | "p4")}
              className={`px-5 py-2.5 rounded-full text-xs font-heading font-extrabold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border-border"
              }`}
            >
              {isActive && <Star className="w-3.5 h-3.5 fill-current" />}
              <span>{tab.label}</span>
              <span className={`text-[10px] font-normal ${isActive ? "text-white/90" : "text-muted-foreground"}`}>
                ({tab.desc})
              </span>
            </button>
          );
        })}
      </div>

      {/* 2. HERO BANNER CHO PART HIỆN TẠI (Theo layout ảnh mẫu) */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-6 md:p-8 shadow-xs">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div className="flex flex-col sm:flex-row items-center gap-5 relative z-10 text-center sm:text-left">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
            {activePartKey === "p1" && <FileText className="w-8 h-8" />}
            {activePartKey === "p2" && <Bookmark className="w-8 h-8" />}
            {activePartKey === "p3" && <MessageSquare className="w-8 h-8" />}
            {activePartKey === "p4" && <Mail className="w-8 h-8" />}
          </div>
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>{data.badge}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-heading tracking-tight text-foreground">
              {data.title}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {data.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* 3. ROW 1: TỔNG QUAN + THỜI GIAN ĐỀ XUẤT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Khối Tổng quan */}
        <div className="md:col-span-2 rounded-2xl border border-border bg-card p-5 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 rounded-full bg-amber-500" />
            <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
              Tổng quan Part {data.partNumber}
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-sans">
            {data.overview}
          </p>
        </div>

        {/* Khối Thời gian đề xuất */}
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/10 p-5 flex flex-col items-center justify-center text-center space-y-2 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Thời gian đề xuất
            </span>
            <span className="text-xl sm:text-2xl font-black font-heading text-amber-600 dark:text-amber-400 mt-0.5 block">
              {data.recommendedTime}
            </span>
          </div>
        </div>
      </div>

      {/* 4. ROW 2: MẸO LÀM BÀI + CÔNG THỨC TRẢ LỜI NHANH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột Trái: Mẹo làm bài */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground">
              Mẹo làm bài
            </h3>
          </div>

          <div className="space-y-3">
            {data.tips.map((tip, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <span className="text-foreground/90 font-medium">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cột Phải: Công thức trả lời nhanh (Thay đổi linh hoạt theo từng Part) */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground">
              {activePartKey === "p4" ? "Bố cục 2 bức thư" : "Công thức trả lời nhanh"}
            </h3>
          </div>

          {/* Part 1: Bảng từ hỏi và cách trả lời */}
          {activePartKey === "p1" && data.formulasP1 && (
            <div className="overflow-hidden rounded-xl border border-border text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/60 text-muted-foreground font-bold text-[11px] border-b border-border">
                    <th className="p-2.5 w-24">Từ hỏi</th>
                    <th className="p-2.5">Cách trả lời + Ví dụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.formulasP1.map((f, fIdx) => (
                    <tr key={fIdx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 font-bold font-mono text-primary">{f.questionWord}</td>
                      <td className="p-2.5 text-foreground/90 font-medium">{f.responseFormat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Part 2: Bảng mẫu câu biểu mẫu */}
          {activePartKey === "p2" && data.formulasP2 && (
            <div className="overflow-hidden rounded-xl border border-border text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/60 text-muted-foreground font-bold text-[11px] border-b border-border">
                    <th className="p-2.5 w-32">Mục đích viết</th>
                    <th className="p-2.5">Mẫu câu mở đầu & nối ý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.formulasP2.map((f, fIdx) => (
                    <tr key={fIdx} className="hover:bg-muted/20 transition-colors">
                      <td className="p-2.5 font-bold text-foreground">{f.purpose}</td>
                      <td className="p-2.5 font-serif font-bold text-amber-600 dark:text-amber-400">
                        &ldquo;{f.template}&rdquo;
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Part 3: 3 Dạng câu hỏi Chat nhóm */}
          {activePartKey === "p3" && data.formulasP3 && (
            <div className="space-y-3">
              {data.formulasP3.map((f, fIdx) => (
                <div key={fIdx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{f.typeTitle}</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-bold text-[10px]">
                      {f.formula}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{f.breakdown}</p>
                </div>
              ))}
            </div>
          )}

          {/* Part 4: Bố cục 2 Email (Informal & Formal) */}
          {activePartKey === "p4" && data.emailStructuresP4 && (
            <div className="space-y-3">
              {data.emailStructuresP4.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                    s.type === "informal"
                      ? "border-sky-500/30 bg-sky-500/5"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>{s.title}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-background border border-border font-mono font-bold text-[10px] text-muted-foreground">
                      {s.wordCount}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {s.steps.map((st, stIdx) => (
                      <div key={stIdx} className="flex items-start gap-2 text-[11px]">
                        <span className="w-4 h-4 rounded-full bg-primary/20 text-primary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          {st.stepNum}
                        </span>
                        <div>
                          <span className="font-bold text-foreground mr-1.5">{st.stepTitle}:</span>
                          <span className="text-muted-foreground italic">&ldquo;{st.suggestion}&rdquo;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. ROW 3: NHỮNG LỖI CẦN TRÁNH + VÍ DỤ / TỪ NỐI */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột Trái: Những lỗi cần tránh */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-rose-500/20 pb-3">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-rose-700 dark:text-rose-300">
              Những lỗi cần tránh
            </h3>
          </div>

          <div className="space-y-2.5">
            {data.mistakesToAvoid.map((m, mIdx) => (
              <div key={mIdx} className="flex items-start gap-2.5 text-xs">
                <span className="text-rose-500 font-bold shrink-0 mt-0.5">✕</span>
                <span className="text-foreground/90 font-medium">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cột Phải: Ví dụ minh họa / Bộ từ nối */}
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2 border-b border-emerald-500/20 pb-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-emerald-700 dark:text-emerald-300">
              {activePartKey === "p3"
                ? "Bộ từ nối nên sử dụng"
                : activePartKey === "p4"
                ? "Mẫu câu đắt giá cho Email"
                : "Ví dụ câu trả lời chuẩn"}
            </h3>
          </div>

          {/* Part 1: 4 Mini Cards ví dụ */}
          {activePartKey === "p1" && data.examplesP1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {data.examplesP1.map((ex, exIdx) => (
                <div key={exIdx} className="p-3 rounded-xl border border-border bg-card space-y-1">
                  <span className="font-bold text-muted-foreground block text-[11px]">
                    Q: {ex.question}
                  </span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    <span>{ex.answer}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Part 2: Ví dụ 3 bước hoàn chỉnh */}
          {activePartKey === "p2" && data.exampleP2 && (
            <div className="space-y-2.5 text-xs">
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium">{data.exampleP2.step1}</p>
                <p className="font-medium">{data.exampleP2.step2}</p>
                <p className="font-medium">{data.exampleP2.step3}</p>
              </div>
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-card space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block font-heading">
                  Bài hoàn chỉnh mẫu (27 từ):
                </span>
                <p className="font-serif text-foreground font-semibold italic text-xs sm:text-[13px] leading-relaxed">
                  &ldquo;{data.exampleP2.complete}&rdquo;
                </p>
              </div>
            </div>
          )}

          {/* Part 3: Bộ từ nối theo nhóm */}
          {activePartKey === "p3" && data.connectorsP3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {data.connectorsP3.map((c, cIdx) => (
                <div key={cIdx} className="p-2.5 rounded-xl border border-border bg-card space-y-0.5">
                  <span className="font-bold text-primary block text-[11px]">{c.category}:</span>
                  <p className="text-foreground/90 font-mono font-medium text-[11px]">{c.words}</p>
                </div>
              ))}
            </div>
          )}

          {/* Part 4: Bảng mẫu câu đắt giá */}
          {activePartKey === "p4" && data.formulasP4 && (
            <div className="space-y-2 text-xs">
              {data.formulasP4.map((f, fIdx) => (
                <div key={fIdx} className="p-2.5 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                  <span className="font-bold text-foreground w-40 shrink-0">{f.purpose}:</span>
                  <span className="font-serif italic text-amber-700 dark:text-amber-300 font-semibold flex-1">
                    &ldquo;{f.phrase}&rdquo;
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. ROW 4: KHỐI GHI NHỚ NHANH (Trophy strip theo mẫu ảnh) */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <div className="space-y-0.5 flex-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 font-heading block">
              Ghi nhớ nhanh
            </span>
            <div className="text-lg sm:text-xl font-heading font-black text-foreground">
              {data.quickRemember.highlight}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.quickRemember.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

