"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAuth } from "@/contexts/auth-context";
import {
  Gift,
  Share2,
  Users,
  Sparkles,
  Copy,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Award,
  HelpCircle,
} from "lucide-react";

export default function GioiThieuPage() {
  const { user, isAuthenticated } = useAuth();
  const [copied, setCopied] = useState(false);

  // Sinh mã giới thiệu động dựa trên thông tin người dùng hoặc mã mặc định
  const referralCode = user?.email
    ? `APTIS-${user.email.split("@")[0].toUpperCase().slice(0, 6)}`
    : "APTIS-PREMIER";
  
  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/?ref=${referralCode}`
    : `https://aptis-premier.edu.vn/?ref=${referralCode}`;

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const steps = [
    {
      step: "01",
      icon: Share2,
      title: "Gửi link giới thiệu",
      desc: "Sao chép mã giới thiệu hoặc link riêng của bạn và gửi cho bạn bè, nhóm học tập ôn thi Aptis.",
    },
    {
      step: "02",
      icon: Users,
      title: "Bạn bè nâng cấp gói VIP",
      desc: "Bạn bè nhập mã khi thanh toán gói cước (1 Tháng, 3 Tháng hoặc 6 Tháng) để được giảm ngay 10%.",
    },
    {
      step: "03",
      icon: Gift,
      title: "Cả hai cùng nhận thưởng",
      desc: "Bạn nhận ngay 10% hoa hồng tích lũy hoặc +5 lượt chấm Speaking/Writing AI cao cấp.",
    },
  ];

  const benefits = [
    {
      target: "Dành cho bạn bè được giới thiệu",
      color: "from-blue-600 to-indigo-600",
      items: [
        "Giảm ngay 10% cho mọi gói cước VIP (1 Tháng / 3 Tháng / 6 Tháng)",
        "Tặng kèm bộ Ebook bí kíp 4 kỹ năng chuẩn British Council",
        "Kích hoạt tài khoản tức thì qua cổng VietQR SePay",
      ],
    },
    {
      target: "Dành cho người giới thiệu (Bạn)",
      color: "from-rose-600 to-amber-600",
      items: [
        "Nhận 10% tiền mặt hoa hồng hoặc quy đổi thành thời hạn VIP",
        "Thưởng ngay +5 lượt chấm AI Speaking & Writing chuyên sâu",
        "Không giới hạn số lượt bạn bè giới thiệu mỗi tháng",
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold mb-4">
              <Gift className="w-4 h-4" />
              <span>Chương Trình Đồng Hành — Cùng Đạt Target B1 / B2 / C1</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-4">
              Rủ bạn ôn cùng — <span className="text-primary">Bạn giảm 10%</span>, Bạn nhận quà
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Chia sẻ giải pháp luyện thi Aptis ESOL chuẩn British Council đến bạn bè để cùng nhau bứt phá điểm số và nhận các phần thưởng học tập giá trị.
            </p>

            {/* Referral Link & Code Box */}
            <div className="max-w-xl mx-auto bg-card border border-border shadow-lg rounded-2xl p-6 text-left">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Mã giới thiệu độc quyền của bạn:
                </span>
                <span className="text-xs text-primary font-semibold">
                  {isAuthenticated ? "Đã xác thực tài khoản" : "Tài khoản khách (Mã mẫu)"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full bg-muted/50 border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground font-bold tracking-wider select-all break-all">
                  {referralLink}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(referralLink)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl btn-brand-gradient text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      <span>Đã chép link!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép link</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>Mã nhập tay khi thanh toán: <strong className="text-foreground font-mono">{referralCode}</strong></span>
                <button
                  type="button"
                  onClick={() => handleCopy(referralCode)}
                  className="text-primary hover:underline font-semibold"
                >
                  Chép mã
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Steps */}
        <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-heading font-extrabold mb-2">
              Chỉ 3 bước đơn giản để nhận thưởng
            </h2>
            <p className="text-sm text-muted-foreground">
              Quy trình tự động ghi nhận hoa hồng và ưu đãi ngay sau khi đơn hàng thành công.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st) => {
              const Icon = st.icon;
              return (
                <div
                  key={st.step}
                  className="rounded-2xl border border-border bg-card p-6 relative hover:border-primary/50 transition-all shadow-xs"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">BƯỚC {st.step}</span>
                  <h3 className="font-heading font-bold text-lg text-foreground mt-1 mb-2">
                    {st.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Benefits Grid */}
        <section className="py-12 bg-muted/20 border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {benefits.map((b, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                      {b.target}
                    </div>
                    <ul className="space-y-3 mt-2">
                      {b.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 text-center max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-heading font-bold mb-3">
            Sẵn sàng lan tỏa và nhận thưởng cùng APTIS PREMIER?
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Mọi thắc mắc về đối soát hoa hồng hoặc chương trình hợp tác CTV giáo dục, vui lòng liên hệ trực tiếp ban quản trị.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/pricing"
              className="px-6 py-3 rounded-xl btn-brand-gradient text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              Xem các gói cước VIP
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold transition-colors"
            >
              Liên hệ hỗ trợ
            </Link>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
