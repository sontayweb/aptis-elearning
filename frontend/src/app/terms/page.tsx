"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { api } from "@/lib/api-client";
import { ShieldCheck, FileText, ArrowLeft, Lock, CheckCircle2 } from "lucide-react";

export default function TermsPage() {
  const [pageData, setPageData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.cms.getPage("terms");
        if (res.success && res.data) {
          setPageData(res.data);
        }
      } catch (err) {
        console.error("Failed to load terms:", err);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background border-b border-border">
          <div className="section-container max-w-4xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chủ</span>
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-4xl font-heading font-extrabold text-foreground">
                Điều Khoản Dịch Vụ &amp; Chính Sách Bảo Mật
              </h1>
            </div>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Cập nhật lần cuối: 27/09/2026 · Áp dụng cho toàn bộ học viên và người dùng trên nền tảng APTIS ESOL PREMIER.
            </p>
          </div>
        </section>

        <section className="section-padding section-container max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border">
              <h2 className="text-lg md:text-xl font-heading font-bold mb-4 flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <span>1. Điều khoản sử dụng tài khoản học viên</span>
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Mỗi tài khoản học viên đăng ký trên hệ thống chỉ phục vụ cho một cá nhân học tập. Người dùng có trách nhiệm bảo mật mật khẩu cá nhân và thông tin đăng nhập.
                </p>
                <p>
                  Hệ thống nghiêm cấm hành vi sử dụng công cụ tự động (bot), phần mềm quét dữ liệu để tải về ngân hàng đề thi hoặc tài liệu bản quyền của trung tâm.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border">
              <h2 className="text-lg md:text-xl font-heading font-bold mb-4 flex items-center gap-2 text-foreground">
                <Lock className="w-5 h-5 text-primary" />
                <span>2. Chính sách thanh toán &amp; Kích hoạt dịch vụ</span>
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Mọi giao dịch nạp tiền mua gói VIP qua mã VietQR (SePay) đều được đối soát tự động 24/7. Tài khoản sẽ được nâng cấp gói cước ngay trong 3–5 giây sau khi ngân hàng xác nhận giao dịch thành công.
                </p>
                <p>
                  Trường hợp học viên chuyển khoản nhầm nội dung hoặc thiếu số tiền quy định, hệ thống sẽ lưu vào hàng đợi kiểm toán để Admin hỗ trợ khớp lệnh thủ công trong vòng tối đa 15 phút.
                </p>
              </div>
            </div>

            <div className="p-6 md:p-8 rounded-2xl bg-card border border-border">
              <h2 className="text-lg md:text-xl font-heading font-bold mb-4 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>3. Chính sách bảo mật dữ liệu cá nhân</span>
              </h2>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  APTIS ESOL PREMIER cam kết không bán, chia sẻ hoặc tiết lộ số điện thoại, email, thông tin bài làm thi thử của học viên cho bất kỳ đơn vị thứ ba nào vì mục đích quảng cáo.
                </p>
                <p>
                  Toàn bộ file âm thanh ghi âm trong phòng thi Speaking chỉ được sử dụng cho mục đích bóc băng chấm điểm AI và phản hồi chất lượng đào tạo từ giảng viên.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
