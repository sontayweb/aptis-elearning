"use client";

import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  Trophy,
  Award,
  Layers,
  Lightbulb,
  CheckCircle2,
  Mic,
  Flame,
} from "lucide-react";

export interface SpeakingGuideBannerProps {
  onOpenGuideModal?: () => void;
}

export function SpeakingGuideBanner({ onOpenGuideModal }: SpeakingGuideBannerProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"structure" | "steps" | "tips">("structure");

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card p-5 md:p-6 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wide">
                Hướng Dẫn Toàn Diện
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                Target B2 vững → C1
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-heading font-extrabold text-foreground mt-1">
              Form Đề Thi & Phương Pháp Học Speaking Aptis ESOL
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cấu trúc 4 part, thời gian chuẩn British Council, phương pháp 4 bước và bộ câu đệm tăng độ trôi chảy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {onOpenGuideModal && (
            <button
              type="button"
              onClick={onOpenGuideModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-all shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Cẩm nang 4 Part chi tiết</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <span>{isOpen ? "Thu gọn hướng dẫn" : "Xem Form đề & Cách học"}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="mt-6 pt-6 border-t border-border/60 space-y-6 animate-in fade-in-50 duration-200">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2 border-b border-border/40 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("structure")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "structure"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              1. Cấu Trúc Đề Thi (Form 4 Parts)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("steps")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "steps"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              2. Phương Pháp Học 4 Bước
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tips")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "tips"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              3. Bí Quyết B2→C1 & Câu Đệm (Fillers)
            </button>
          </div>

          {/* TAB 1: Cấu trúc 4 Part */}
          {activeTab === "structure" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Part 1 */}
              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Part 1
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">3 câu · 30s/câu</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-foreground">Personal Information</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Trả lời 3 câu hỏi xoay quanh bản thân, công việc, học tập, gia đình, sở thích. <strong>Không có thời gian chuẩn bị</strong>.
                </p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-primary font-medium">
                  🎯 Tiêu chí: Nói trôi chảy, trả lời trực diện ngay câu đầu tiên.
                </div>
              </div>

              {/* Part 2 */}
              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    Part 2
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">3 câu · 45s/câu</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-foreground">Describe & Express Opinion</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Xem 1 bức tranh, miêu tả tranh (Q1), kể trải nghiệm cá nhân liên quan (Q2), và nêu quan điểm/lý do xã hội (Q3).
                </p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-primary font-medium">
                  🎯 Tiêu chí: Bám sát từ vựng theo tranh, mở rộng 2-3 ý cụ thể.
                </div>
              </div>

              {/* Part 3 */}
              <div className="p-4 rounded-xl border border-border bg-card/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold text-[10px]">
                    Part 3
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">3 câu · 45s/câu</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-foreground">Compare & Explain</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  So sánh 2 bức tranh đối lập (Q1), chọn 1 trong 2 phương án & giải thích lý do (Q2), bình luận xu hướng tương lai (Q3).
                </p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-primary font-medium">
                  🎯 Tiêu chí: Dùng liên từ so sánh (whereas, while, on the contrary).
                </div>
              </div>

              {/* Part 4 */}
              <div className="p-4 rounded-xl border-2 border-primary/40 bg-card space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold text-[10px]">
                    Part 4 · Long Turn
                  </span>
                  <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">1p prep + 2p nói</span>
                </div>
                <h4 className="font-heading font-bold text-sm text-foreground">Abstract Topic & 3 Questions</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Xem 1 tranh gợi ý & 3 câu hỏi trừu tượng hiển thị cùng lúc. Có <strong>1 phút chuẩn bị ghi chú</strong> và <strong>nói liên tục trong 2 phút</strong> trả lời cả 3 câu.
                </p>
                <div className="pt-2 border-t border-border/40 text-[11px] text-rose-600 dark:text-rose-400 font-bold">
                  ⚡ Chiến thuật: Trả lời lần lượt 3 câu, khoảng 35-40s mỗi câu.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Phương pháp 4 bước */}
          {activeTab === "steps" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center">
                  B1
                </div>
                <h4 className="font-bold text-sm text-foreground">Đọc hiểu cấu trúc</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Xác định câu trả lời trực tiếp (Direct answer), các ý mở rộng (Extensions), lý do/ví dụ (Reasons/Examples) và câu kết.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center">
                  B2
                </div>
                <h4 className="font-bold text-sm text-foreground">Cá nhân hóa</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thay đổi hoạt động, mốc thời gian, mối quan hệ và cảm xúc thật để bài nói phản ánh đúng bản thân, tránh học vẹt.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center">
                  B3
                </div>
                <h4 className="font-bold text-sm text-foreground">Luyện với đồng hồ</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Đọc thành tiếng, sau đó nói lại trong đúng 30s (Part 1), 45s (Part 2, 3) hoặc 120s (Part 4). Không nói quá nhanh.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-extrabold text-xs flex items-center justify-center">
                  B4
                </div>
                <h4 className="font-bold text-sm text-foreground">Tự trả lời độc lập</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Đặt tài liệu sang một bên và nói bằng từ ngữ của chính mình. Giữ khung cấu trúc nhưng tự nhiên với ngữ điệu thật.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Bí quyết & Câu đệm */}
          {activeTab === "tips" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3 p-4 rounded-xl border border-border bg-card/60">
                <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  5 Nguyên Tắc Đạt B2 Vững → C1
                </h4>
                <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>1. Trả lời trực tiếp ngay câu đầu:</strong> Tránh mở đầu dài dòng nhưng không cung cấp thông tin.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>2. Phát triển 2-3 ý cụ thể:</strong> Một lý do hoặc ví dụ cụ thể có giá trị hơn nhiều ý liệt kê sáo rỗng.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>3. Dùng câu ghép & câu phức:</strong> Kết hợp tự nhiên với <em>because, although, while, which, when, if</em>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>4. Cụm từ collocations chất lượng:</strong> <em>make the most of, gain valuable experience, maintain a healthy balance, broaden my horizons</em>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>5. Ưu tiên độ lưu loát và rõ ràng:</strong> Khi gần hết giờ, hãy chốt câu trọn vẹn thay vì cố nhồi thêm ý dang dở.</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3 p-4 rounded-xl border border-border bg-card/60">
                <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  Mẫu Câu Đệm (Filler Phrases) Chuẩn Anh
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="font-bold text-foreground">Dạng &ldquo;Tell me about...&rdquo;:</span>
                    <p className="text-muted-foreground italic mt-0.5">&ldquo;Well, I am really excited to share with you about...&rdquo;</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="font-bold text-foreground">Dạng &ldquo;What / How / Why...&rdquo;:</span>
                    <p className="text-muted-foreground italic mt-0.5">&ldquo;Well, to be honest, I really like this question because...&rdquo;</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="font-bold text-foreground">Dạng trải nghiệm quá khứ (first school, last holiday):</span>
                    <p className="text-muted-foreground italic mt-0.5">&ldquo;As far as I can recall, it was a truly unforgettable experience...&rdquo;</p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-background border border-border/60">
                    <span className="font-bold text-foreground">Gặp chủ đề ít từ vựng:</span>
                    <p className="text-muted-foreground italic mt-0.5">&ldquo;To be completely honest, I don&apos;t have much experience with this, but from what I observed...&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
