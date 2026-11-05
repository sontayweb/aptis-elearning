"use client";

import { useState } from "react";
import {
  Clock,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Star,
  Mic,
  Image as ImageIcon,
  Layers,
  Sparkles,
  ArrowRight,
  Bookmark,
  Volume2,
  BookOpen,
  Code2,
  ZoomIn,
  Copy,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { SPEAKING_KEY_MEO_DATA, SpeakingPartData } from "@/data/key-meo-speaking-data";

interface SpeakingCheatSheetViewProps {
  customData?: Record<string, SpeakingPartData>;
}

export function SpeakingCheatSheetView({ customData }: SpeakingCheatSheetViewProps) {
  const [activePartKey, setActivePartKey] = useState<"p1" | "p2" | "p3" | "p4">("p1");
  const [activeZoomImage, setActiveZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Merge customData from DB (if any) with default seed data
  const data: SpeakingPartData =
    (customData && customData[activePartKey]) || SPEAKING_KEY_MEO_DATA[activePartKey] || SPEAKING_KEY_MEO_DATA.p1;

  const b2c1P2Info = data.b2c1Formula8Steps || SPEAKING_KEY_MEO_DATA.p2.b2c1Formula8Steps;
  const b2c1P2SampleText = b2c1P2Info?.sampleBandB2C1.sentences.map((s) => `${s.num}. ${s.text}`).join("\n") || "";

  const b2c1P3Info = data.b2c1Formula6Steps || SPEAKING_KEY_MEO_DATA.p3.b2c1Formula6Steps;
  const b2c1P3SampleText = b2c1P3Info?.sampleBandB2C1.sentences.map((s) => `${s.num}. ${s.text}`).join("\n") || "";

  return (
    <div className="space-y-6">
      {/* 1. TOP PART SELECTOR (Part 1 - Part 4) */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "p1", label: "Part 1", desc: "30s/câu" },
          { id: "p2", label: "Part 2", desc: "45s/câu" },
          { id: "p3", label: "Part 3", desc: "45s/câu" },
          { id: "p4", label: "Part 4", desc: "1p chuẩn bị + 2p nói" },
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
            {activePartKey === "p1" && <Mic className="w-8 h-8" />}
            {activePartKey === "p2" && <ImageIcon className="w-8 h-8" />}
            {activePartKey === "p3" && <Layers className="w-8 h-8" />}
            {activePartKey === "p4" && <Volume2 className="w-8 h-8" />}
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
          <p className="text-xs md:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {data.overview}
          </p>
        </div>

        {/* Khối Thời gian đề xuất */}
        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-cyan-500/10 p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold">
              <Clock className="w-4 h-4" />
              <span>Thời gian đề xuất</span>
            </div>
            <div className="text-xl md:text-2xl font-black font-heading text-blue-700 dark:text-blue-300 pt-1">
              ~ {data.recommendedTime}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground pt-2">
            Kiểm soát thời gian nói đều đặn, không để micro rơi vào khoảng lặng chết.
          </p>
        </div>
      </div>

      {/* 3.5. KHỐI ĐẶC BIỆT DÀNH RIÊNG CHO PART 2: CÔNG THỨC 8 BƯỚC NÂNG CAO BAND B2-C1 KÈM ẢNH GỐC */}
      {activePartKey === "p2" && b2c1P2Info && (
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-indigo-500/10 p-5 md:p-7 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chiến Lược Độc Quyền Band B2 – C1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black font-heading text-foreground">
                {b2c1P2Info.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {b2c1P2Info.subtitle}
              </p>
            </div>

            <button
              onClick={() => setActiveZoomImage({ url: b2c1P2Info.imageUrl, title: b2c1P2Info.title })}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start md:self-auto shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
              <span>Phóng to Infographic</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Ảnh Infographic */}
            <div className="lg:col-span-5">
              <div
                onClick={() => setActiveZoomImage({ url: b2c1P2Info.imageUrl, title: b2c1P2Info.title })}
                className="group relative rounded-2xl overflow-hidden border border-purple-500/30 bg-black/5 shadow-md hover:shadow-xl transition-all cursor-pointer"
              >
                <img
                  src={b2c1P2Info.imageUrl}
                  alt={b2c1P2Info.title}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold drop-shadow">Nhấn để xem kích thước gốc sắc nét</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                * Click vào ảnh để phóng to toàn màn hình
              </p>
            </div>

            {/* Cột phải: Bảng chi tiết 8 Bước & Bài Mẫu B2-C1 */}
            <div className="lg:col-span-7 space-y-4">
              {/* Bảng 8 bước */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="p-3 bg-muted/60 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground">8 Bước Mô Tả & Cấu Trúc Nâng Cao</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                    8 BƯỚC CHUẨN
                  </span>
                </div>
                <div className="divide-y divide-border text-xs max-h-[340px] overflow-y-auto">
                  {b2c1P2Info.steps.map((st) => (
                    <div key={st.step} className="p-3 hover:bg-muted/30 transition-colors space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-purple-600 dark:text-purple-400 font-mono text-xs">
                          #{st.step} {st.name} ({st.question})
                        </span>
                        <span className="text-[11px] text-muted-foreground italic font-medium">{st.goal}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {st.patterns.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-800 dark:text-purple-200 font-mono text-[11px] font-semibold border border-purple-500/20"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bài mẫu Band B2-C1 */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      Bài Mẫu Thực Chiến Band B2 – C1 (Ứng Dụng Đủ 8 Bước)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (b2c1P2SampleText) {
                        navigator.clipboard.writeText(b2c1P2SampleText);
                        setCopiedKey("p2");
                        setTimeout(() => setCopiedKey(null), 2000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === "p2" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép bài mẫu</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/90 font-medium leading-relaxed bg-card p-3 rounded-xl border border-border">
                  {b2c1P2Info.sampleBandB2C1.sentences.map((s) => (
                    <p key={s.num} className="flex items-start gap-1.5">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0">[{s.num}]</strong>
                      <span>{s.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3.6. KHỐI ĐẶC BIỆT DÀNH RIÊNG CHO PART 3: CÔNG THỨC 6 BƯỚC SO SÁNH 2 TRANH BAND B2-C1 KÈM ẢNH GỐC */}
      {activePartKey === "p3" && b2c1P3Info && (
        <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 via-card to-indigo-500/10 p-5 md:p-7 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chiến Lược Độc Quyền Band B2 – C1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black font-heading text-foreground">
                {b2c1P3Info.title}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                {b2c1P3Info.subtitle}
              </p>
            </div>

            <button
              onClick={() => setActiveZoomImage({ url: b2c1P3Info.imageUrl, title: b2c1P3Info.title })}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer self-start md:self-auto shrink-0"
            >
              <ZoomIn className="w-4 h-4" />
              <span>Phóng to Infographic</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cột trái: Ảnh Infographic */}
            <div className="lg:col-span-5">
              <div
                onClick={() => setActiveZoomImage({ url: b2c1P3Info.imageUrl, title: b2c1P3Info.title })}
                className="group relative rounded-2xl overflow-hidden border border-purple-500/30 bg-black/5 shadow-md hover:shadow-xl transition-all cursor-pointer"
              >
                <img
                  src={b2c1P3Info.imageUrl}
                  alt={b2c1P3Info.title}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-102"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <ZoomIn className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold drop-shadow">Nhấn để xem kích thước gốc sắc nét</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground text-center mt-2 italic">
                * Click vào ảnh để phóng to toàn màn hình
              </p>
            </div>

            {/* Cột phải: Bảng chi tiết 6 Bước & Bài Mẫu B2-C1 */}
            <div className="lg:col-span-7 space-y-4">
              {/* Bảng 6 bước */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
                <div className="p-3 bg-muted/60 border-b border-border flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-foreground">6 Bước So Sánh & Cấu Trúc Nâng Cao</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold">
                    6 BƯỚC CHUẨN
                  </span>
                </div>
                <div className="divide-y divide-border text-xs max-h-[340px] overflow-y-auto">
                  {b2c1P3Info.steps.map((st) => (
                    <div key={st.step} className="p-3 hover:bg-muted/30 transition-colors space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-purple-600 dark:text-purple-400 font-mono text-xs">
                          #{st.step} {st.name} ({st.question})
                        </span>
                        <span className="text-[11px] text-muted-foreground italic font-medium">{st.goal}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {st.patterns.map((p, pIdx) => (
                          <span
                            key={pIdx}
                            className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-800 dark:text-purple-200 font-mono text-[11px] font-semibold border border-purple-500/20"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bài mẫu Band B2-C1 */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                      Bài Mẫu Thực Chiến Band B2 – C1 (So Sánh 2 Bức Tranh)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (b2c1P3SampleText) {
                        navigator.clipboard.writeText(b2c1P3SampleText);
                        setCopiedKey("p3");
                        setTimeout(() => setCopiedKey(null), 2000);
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === "p3" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Chép bài mẫu</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-foreground/90 font-medium leading-relaxed bg-card p-3 rounded-xl border border-border">
                  {b2c1P3Info.sampleBandB2C1.sentences.map((s) => (
                    <p key={s.num} className="flex items-start gap-1.5">
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono shrink-0">[{s.num}]</strong>
                      <span>{s.text}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. ROW 2: MẸO LÀM BÀI + CÔNG THỨC TRẢ LỜI NHANH */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột trái: Mẹo làm bài */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
              Mẹo làm bài
            </h3>
          </div>
          <ul className="space-y-2.5">
            {data.tips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {idx + 1}
                </span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Cột phải: Công thức trả lời nhanh */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
              Công thức trả lời nhanh
            </h3>
          </div>

          {data.quickFormula && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
                <div className="font-mono text-emerald-700 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                  {data.quickFormula.formulaEn}
                </div>
                <div className="text-xs text-muted-foreground">
                  {data.quickFormula.formulaVn}
                </div>
              </div>

              {/* Ví dụ của Part 1 */}
              {data.quickFormula.example && (
                <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2 text-xs">
                  <div className="font-bold text-foreground">
                    Ví dụ: <span className="italic font-normal">{data.quickFormula.example.question}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="text-foreground/90">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Direct answer: </span>
                      {data.quickFormula.example.directAnswer}
                    </div>
                    <div className="text-foreground/90">
                      <span className="font-bold text-amber-600 dark:text-amber-400">Reason: </span>
                      {data.quickFormula.example.reason}
                    </div>
                    <div className="text-foreground/90">
                      <span className="font-bold text-blue-600 dark:text-blue-400">Detail: </span>
                      {data.quickFormula.example.detail}
                    </div>
                  </div>
                </div>
              )}

              {/* Part 1: Bảng Cấu trúc câu hữu ích */}
              {activePartKey === "p1" && data.formulasP1 && (
                <div className="overflow-hidden rounded-xl border border-border mt-2">
                  <div className="bg-muted px-3 py-1.5 text-[11px] font-bold text-muted-foreground">
                    Cấu trúc câu hữu ích:
                  </div>
                  <table className="w-full text-xs">
                    <tbody className="divide-y divide-border">
                      {data.formulasP1.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="p-2.5 font-bold text-foreground w-1/3">{item.category}</td>
                          <td className="p-2.5 font-mono text-primary font-bold">{item.pattern}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Part 3: Bộ từ nối */}
              {activePartKey === "p3" && data.connectorsP3 && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border space-y-1.5 text-xs">
                  <span className="font-bold text-foreground block text-[11px]">Từ nối so sánh nên dùng:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.connectorsP3.map((c, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-mono text-primary font-semibold">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 5. ROW 3: BÀI NÓI MẪU HOẶC NGỮ PHÁP THƯỜNG DÙNG */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cột trái: Bài nói mẫu theo Part */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
              {activePartKey === "p1" && "Chủ đề thường gặp Part 1"}
              {activePartKey === "p2" && "Bài nói mẫu miêu tả tranh Part 2"}
              {activePartKey === "p3" && "Bài nói mẫu so sánh tranh Part 3"}
              {activePartKey === "p4" && "Bài nói mẫu 5 giai đoạn Part 4"}
            </h3>
          </div>

          {/* PART 1: Chủ đề thường gặp */}
          {activePartKey === "p1" && (
            <div className="space-y-2 text-xs">
              <p className="text-muted-foreground leading-relaxed">
                Các câu hỏi xoay quanh thông tin thường nhật:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "family",
                  "hometown",
                  "hobbies",
                  "food",
                  "music",
                  "sports",
                  "daily routine",
                  "holidays",
                  "studies",
                  "work",
                ].map((topic, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-medium text-[11px] border border-border">
                    #{topic}
                  </span>
                ))}
              </div>
              <div className="pt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-foreground/90 leading-relaxed">
                💡 <span className="font-bold">Mục tiêu cốt lõi:</span> Trả lời tự nhiên, rõ ràng và có thêm thông tin (lý do/chi tiết) thay vì chỉ trả lời Yes/No cộc lốc.
              </div>
            </div>
          )}

          {/* PART 2: Bài nói mẫu miêu tả tranh */}
          {activePartKey === "p2" && data.modelSampleP2 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-muted/50 border border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  🎙️ Khung bài nói mẫu (45 giây):
                </div>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  Chuẩn CEFR B1 - C
                </span>
              </div>
              <div className="p-3.5 sm:p-4 rounded-xl bg-background border border-border/80 shadow-xs">
                <p className="whitespace-pre-line leading-relaxed text-sm sm:text-base text-foreground/95 font-medium">
                  "{data.modelSampleP2.template}"
                </p>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span>💡</span>
                <span>Thay thế các thông tin trong ngoặc vuông <strong className="text-foreground font-semibold">[ ... ]</strong> bằng chi tiết thực tế của bức tranh khi nói.</span>
              </p>
            </div>
          )}

          {/* PART 3: Bài nói mẫu so sánh 2 tranh */}
          {activePartKey === "p3" && data.modelSampleP3 && (
            <div className="space-y-3">
              <div className="p-3.5 sm:p-4 rounded-xl bg-muted/50 border border-border space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-bold text-primary text-xs sm:text-sm uppercase tracking-wide">
                    1. Mở bài – Giới thiệu chung
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground/95 leading-relaxed pl-4 font-medium">
                  {data.modelSampleP3.step1Intro}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-blue-500/10 border border-blue-500/25 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="font-bold text-blue-700 dark:text-blue-300 text-xs sm:text-sm uppercase tracking-wide">
                    2. Mô tả ảnh bên trái (Left Picture) (~10–12 giây)
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground/95 leading-relaxed pl-4 font-medium">
                  {data.modelSampleP3.step2Left}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-700 dark:text-amber-300 text-xs sm:text-sm uppercase tracking-wide">
                    3. Mô tả ảnh bên phải (Right Picture) (~10–12 giây)
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground/95 leading-relaxed pl-4 font-medium">
                  {data.modelSampleP3.step3Right}
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm uppercase tracking-wide">
                    4. Kết luận – Quan điểm cá nhân (Conclusion & Opinion)
                  </span>
                </div>
                <p className="text-sm sm:text-base text-foreground/95 leading-relaxed pl-4 font-medium">
                  {data.modelSampleP3.step4Conclusion}
                </p>
              </div>
            </div>
          )}

          {/* PART 4: Bài nói mẫu 5 giai đoạn */}
          {activePartKey === "p4" && data.modelSampleP4 && (
            <div className="space-y-3">
              {data.modelSampleP4.map((stageItem, idx) => (
                <div key={idx} className="p-3.5 sm:p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-xs sm:text-sm uppercase tracking-wide">
                      {stageItem.stage}
                    </span>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                      {stageItem.time}
                    </span>
                  </div>
                  <p className="text-foreground/95 leading-relaxed text-sm sm:text-[15px] font-medium">
                    {stageItem.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cột phải: Ngữ pháp thường dùng */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h3 className="font-heading font-black text-sm text-foreground uppercase tracking-wide">
              Ngữ pháp thường dùng Part {data.partNumber}
            </h3>
          </div>

          {data.grammarPoints && (
            <div className="space-y-2.5 text-xs">
              {data.grammarPoints.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/50 border border-border space-y-1">
                  <div className="font-bold text-foreground text-[11.5px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    <span>{item.tense}</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed pl-3 text-[11px]">
                    {item.usage}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. ROW 4: NHỮNG LỖI CẦN TRÁNH */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-heading font-black text-sm uppercase tracking-wide">
            Những lỗi cần tránh Part {data.partNumber}
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {data.mistakesToAvoid.map((mistake, idx) => (
            <div key={idx} className="flex items-start gap-2 text-foreground/90 leading-relaxed p-2.5 rounded-xl bg-card border border-border">
              <span className="text-rose-500 font-bold shrink-0">✕</span>
              <span>{mistake}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 7. ROW 5: GHI NHỚ NHANH (CÚP VÀNG) */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 p-5 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
          <Trophy className="w-7 h-7" />
        </div>
        <div className="space-y-1 text-center sm:text-left flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
            Ghi nhớ nhanh Part {data.partNumber}
          </div>
          <div className="text-base sm:text-lg font-black font-heading text-foreground">
            {data.quickRemember.highlight}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {data.quickRemember.description}
          </p>
        </div>
      </div>

      {/* MODAL PHÓNG TO INFOGRAPHIC SPEAKING B2-C1 (PART 2 & PART 3) */}
      {activeZoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setActiveZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[95vh] w-full bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3.5 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="font-heading font-black text-xs sm:text-sm text-foreground">
                  {activeZoomImage.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={activeZoomImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-[11px] font-bold text-foreground flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Mở tab mới</span>
                </a>
                <button
                  onClick={() => setActiveZoomImage(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto p-2 sm:p-4 flex-1 flex items-center justify-center bg-black/5">
              <img
                src={activeZoomImage.url}
                alt={activeZoomImage.title}
                className="max-h-[82vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
