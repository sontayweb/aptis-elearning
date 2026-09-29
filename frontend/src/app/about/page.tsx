"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  Award,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export default function AboutPage() {
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.cms.getPage("about");
        if (res.success && res.data) {
          setPageData(res.data);
        }
      } catch (err) {
        console.error("Failed to load about page:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-24 border-b border-border">
          <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Tiên phong khảo thí Aptis ESOL trực tuyến tại Việt Nam</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-6 leading-tight">
              Giới thiệu về <span className="gradient-text">Aptis Kỳ Tích</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-8">
              {pageData?.content ||
                "Nền tảng luyện thi và khảo thí tiếng Anh Aptis ESOL chuẩn hóa British Council tích hợp AI chấm điểm phát âm & ngữ pháp theo khung tham chiếu CEFR."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/thi-thu"
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
              >
                <span>Thi thử miễn phí ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="px-6 py-3 rounded-xl bg-card border border-border text-foreground font-semibold hover:bg-accent/10 transition-colors"
              >
                Xem bảng giá gói học
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="py-12 border-b border-border bg-card/40">
          <div className="section-container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-2xl bg-background border border-border/70 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold gradient-text mb-2">15,200+</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Học viên đạt B1–B2</div>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border/70 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-primary mb-2">98.6%</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Tỷ lệ đỗ đúng mục tiêu</div>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border/70 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">860+</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Bộ đề thi trúng tủ</div>
              </div>
              <div className="p-6 rounded-2xl bg-background border border-border/70 shadow-sm">
                <div className="text-3xl md:text-4xl font-extrabold text-amber-500 mb-2">3–5s</div>
                <div className="text-xs md:text-sm text-muted-foreground font-medium">Kích hoạt VIP tức thì</div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="section-padding section-container">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-3">Triết lý & Giá trị cốt lõi</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Chúng tôi tập trung tối đa vào hiệu quả thực chiến của học viên với 3 cam kết vàng.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Mô phỏng 100% chuẩn thi thật</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Áp lực thời gian, đồng hồ đếm ngược, chuyển tab phát hiện gian lận và giao diện làm bài được thiết kế tương đương 100% phần mềm thi máy tính của Hội đồng Anh (British Council).
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">AI Whisper + GPT-4o chấm thi</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Engine AI tự động bóc băng bản ghi âm giọng nói, phân tích 4 tiêu chí cốt lõi: Phát âm, Lưu loát, Ngữ pháp, Từ vựng và đề xuất giải pháp nâng cấp band điểm chi tiết bằng tiếng Việt.
              </p>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Đồng hành & Chữa bài 1:1</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Đội ngũ giáo viên chuyên môn chấm trực tiếp các bài luận Writing Part 4 và Speaking Part 4 hằng tuần, giải đáp thắc mắc 1:1 qua nhóm Zalo VIP hỗ trợ 24/7.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
