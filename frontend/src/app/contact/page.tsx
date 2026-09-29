"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    target: "B2 Target",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="py-12 md:py-20 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border">
          <div className="section-container max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Hỗ trợ tư vấn lộ trình học &amp; giải đáp thắc mắc 24/7</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold tracking-tight mb-4">
              Liên Hệ &amp; <span className="gradient-text">Hỗ Trợ Học Viên</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-2xl mx-auto">
              Đội ngũ tư vấn học vụ và giảng viên Aptis Kỳ Tích luôn sẵn sàng đồng hành, tư vấn mục tiêu và giải đáp mọi câu hỏi của bạn.
            </p>
          </div>
        </section>

        <section className="section-padding section-container max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Contact Info Cards */}
            <div className="space-y-6">
              <h2 className="text-xl font-heading font-bold text-foreground mb-4">Kênh liên hệ trực tiếp</h2>

              <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-1">Hotline tư vấn tuyển sinh</h3>
                  <p className="text-sm text-primary font-semibold">0379 866 596</p>
                  <p className="text-xs text-muted-foreground mt-1">Hỗ trợ từ 8:00 - 22:30 hàng ngày</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-1">Zalo Hỗ trợ VIP 1:1</h3>
                  <a
                    href="https://zalo.me/0867833227"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    <span>Nhắn tin Zalo với Admin</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">Phản hồi siêu tốc trong 5 phút</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base mb-1">Email học vụ</h3>
                  <p className="text-sm text-foreground font-semibold">aptiskytich.admin@gmail.com</p>
                  <p className="text-xs text-muted-foreground mt-1">Tiếp nhận khiếu nại, đối soát tài chính</p>
                </div>
              </div>
            </div>

            {/* Consultation Form */}
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border shadow-sm">
              <h2 className="text-xl font-heading font-bold text-foreground mb-2">Đăng ký nhận tư vấn lộ trình</h2>
              <p className="text-xs md:text-sm text-muted-foreground mb-6">
                Để lại thông tin, cố vấn học tập sẽ liên hệ và kiểm tra trình độ miễn phí cho bạn.
              </p>

              {submitted ? (
                <div className="p-8 text-center rounded-xl bg-primary/10 border border-primary/20 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Gửi thông tin thành công!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cảm ơn bạn đã quan tâm. Cố vấn học tập Aptis Kỳ Tích sẽ gọi điện hoặc nhắn tin Zalo qua số điện thoại <strong>{formData.phone}</strong> trong vòng 15 phút.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Gửi yêu cầu khác
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Số điện thoại *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="0912 345 678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Mục tiêu chứng chỉ
                      </label>
                      <select
                        value={formData.target}
                        onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <option value="B1 Target">Aptis B1</option>
                        <option value="B2 Target">Aptis B2 (Khuyên dùng)</option>
                        <option value="C Target">Aptis C (Nâng cao)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Email (nhận đề thi thử)
                    </label>
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                      Lời nhắn / Câu hỏi cần giải đáp
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Em muốn hỏi về cấu trúc bài thi Speaking và cách đăng ký gói VIP..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Đang gửi...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Gửi yêu cầu tư vấn ngay</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
