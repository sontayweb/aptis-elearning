"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import {
  Sparkles,
  BookOpen,
  Mic,
  Headphones,
  PenTool,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

export default function MeoThiAptisPage() {
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.cms.getPage("meo-thi");
        if (res.success && res.data) {
          setPageData(res.data);
        }
      } catch (err) {
        console.error("Failed to load meo thi:", err);
      }
    }
    loadData();
  }, []);

  const skillTips = [
    {
      skill: "Speaking",
      icon: Mic,
      color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
      title: "Chiến thuật làm bài thi Nói đạt Band C (12 phút)",
      bullets: [
        "Part 1: Trả lời 3 câu hỏi cá nhân trong 30s/câu. Cấu trúc: Trực tiếp trả lời + 2 câu mở rộng lý do.",
        "Part 2 & 3: Miêu tả tranh & so sánh. Không chỉ liệt kê đồ vật mà hãy suy đoán cảm xúc (They appear to be delighted).",
        "Part 4: 1 phút chuẩn bị rất quan trọng. Viết nhanh 3 gạch đầu dòng ý tưởng để nói trôi chảy suốt 2 phút.",
      ],
      link: "/speaking",
    },
    {
      skill: "Writing",
      icon: PenTool,
      color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
      title: "Cấu trúc bài viết đạt trọn điểm ngữ pháp & từ vựng",
      bullets: [
        "Part 1: 5 câu ngắn dưới 5 từ (trả lời nhanh trong 3 phút).",
        "Part 2: Điền form 20-30 từ. Đảm bảo đúng chính tả và thì hiện tại đơn.",
        "Part 3: Chat nhóm mạng xã hội 30-40 từ/tin nhắn. Dùng văn phong tự nhiên.",
        "Part 4: Thư thân mật (50 từ) + Thư trang trọng (120-150 từ). Sử dụng câu phức và từ nối trang trọng.",
      ],
      link: "/writing",
    },
    {
      skill: "Reading",
      icon: BookOpen,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      title: "Quản lý 35 phút cho 25 câu hỏi Đọc hiểu",
      bullets: [
        "Part 1: Hoàn thành 5 câu điền từ trong vòng tối đa 4 phút.",
        "Part 2: Sắp xếp 6 câu thành đoạn văn hoàn chỉnh. Tìm câu mở đầu độc lập (không chứa đại từ chỉ định).",
        "Part 3: Nối thông tin với người phát biểu. Dùng phương pháp quét từ đồng nghĩa (Paraphrasing).",
        "Part 4: Đọc văn bản dài nối tiêu đề. Đọc câu đầu và câu cuối mỗi đoạn trước để nắm ý chính.",
      ],
      link: "/reading",
    },
    {
      skill: "Listening",
      icon: Headphones,
      color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
      title: "Mẹo bắt bẫy âm thanh bài thi Nghe",
      bullets: [
        "Mỗi câu hỏi được nghe 2 lần tự động.",
        "Lần nghe 1: Đọc trước 4 đáp án trong 5 giây đầu để định vị từ khóa trọng tâm.",
        "Cảnh giác các từ nối đảo nghĩa (However, But, In fact, Actually) thường mang đáp án thật.",
        "Chú ý số điện thoại, giá tiền, ngày tháng ở Part 1 - nghe kỹ từng cặp số dễ nhầm.",
      ],
      link: "/listening",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background py-16 md:py-20 border-b border-border">
          <div className="section-container relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20">
              <Lightbulb className="w-4 h-4 text-primary" />
              <span>Cẩm nang ôn thi thực chiến từ các giảng viên 8.5+</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-4 leading-tight">
              Mẹo Thi <span className="gradient-text">Aptis ESOL</span> Đạt Band B2 &amp; C
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Tổng hợp kinh nghiệm phòng thi thật tại Hội đồng Anh, mẹo phân bổ thời gian và chiến thuật làm bài 4 kỹ năng không bị mất điểm oan.
            </p>
          </div>
        </section>

        <section className="section-padding section-container max-w-5xl mx-auto">
          <div className="space-y-8">
            {skillTips.map((tip) => {
              const Icon = tip.icon;
              return (
                <div
                  key={tip.skill}
                  className="p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${tip.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">Kỹ năng {tip.skill}</span>
                        <h2 className="text-lg md:text-xl font-heading font-bold text-foreground">{tip.title}</h2>
                      </div>
                    </div>
                    <Link
                      href={tip.link}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      <span>Vào phòng luyện {tip.skill}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <ul className="space-y-3">
                    {tip.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
