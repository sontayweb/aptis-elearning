"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  ShieldCheck,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  X,
  CreditCard,
  RefreshCw,
  AlertTriangle,
  PhoneCall,
  FileText,
  Send,
  Loader2,
  HelpCircle,
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  price: string;
  originalPrice?: string;
  duration: string;
  features: string[];
  isPopular?: boolean;
  amount: number;
}

const defaultPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Gói Dùng Thử",
    price: "0đ",
    duration: "Trải nghiệm cơ bản",
    features: [
      "3 lượt chấm bài Speaking & Writing AI",
      "Truy cập 3 đề thi thử chuẩn British Council",
      "Luyện từ vựng 198 bộ cơ bản",
      "Xem đáp án và giải thích trắc nghiệm",
    ],
    amount: 0,
  },
  {
    id: "pro-month",
    name: "Aptis Tốc Hành (1 Tháng)",
    badge: "TIẾT KIỆM 40%",
    price: "199.000đ",
    originalPrice: "350.000đ",
    duration: "Thời hạn 30 ngày",
    features: [
      "10 lượt chấm Speaking & Writing AI chuyên sâu",
      "Mở khóa toàn bộ 860+ bộ đề thi PRO",
      "Mở khóa toàn bộ đề Listening & Reading",
      "Kho từ vựng cá nhân không giới hạn",
      "Phân tích lỗi sai ngữ pháp theo chuẩn CEFR",
    ],
    amount: 199000,
  },
  {
    id: "vip-unlimited",
    name: "Aptis Cày Đề (3 Tháng)",
    badge: "KHUYÊN DÙNG ★ BÁN CHẠY",
    price: "399.000đ",
    originalPrice: "690.000đ",
    duration: "Thời hạn 90 ngày",
    features: [
      "30 lượt chấm AI Speaking & Writing",
      "3 lượt Giảng viên chấm kèm bài sửa chi tiết",
      "Mở khóa TOÀN BỘ Kho Đề Key Dự Đoán trúng tủ 85%",
      "Truy cập Bảng Kỳ Tích & toàn bộ bài mẫu Band C",
      "Luyện nghe chép chính tả Dictation không giới hạn",
      "Hỗ trợ giải đáp thắc mắc 1:1 qua Zalo Admin VIP",
    ],
    isPopular: true,
    amount: 399000,
  },
];

export default function PricingPage() {
  const { user, isAuthenticated, quickLogin, refreshUser } = useAuth();
  const [plans, setPlans] = useState<PricingPlan[]>(defaultPlans);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [orderDetails, setOrderDetails] = useState<{
    order_code: string;
    amount: number;
    qr_code_url: string;
    bank_name: string;
    bank_account: string;
    account_name: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<"pending" | "success">("pending");
  const [loading, setLoading] = useState(false);

  // States for Enterprise Payment Resilience
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState<{ type: "success" | "warning" | "error"; text: string } | null>(null);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeBankTransId, setDisputeBankTransId] = useState("");
  const [disputeAmount, setDisputeAmount] = useState("");
  const [disputeSenderBank, setDisputeSenderBank] = useState("");
  const [disputePhone, setDisputePhone] = useState("");
  const [disputeNote, setDisputeNote] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeSuccess, setDisputeSuccess] = useState<string | null>(null);
  const [disputeError, setDisputeError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await api.payment.getPlans();
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            badge: p.code === "VIP_3M" ? "KHUYÊN DÙNG ★ BÁN CHẠY" : (p.code === "VIP_1M" ? "TIẾT KIỆM 40%" : undefined),
            price: p.price_vnd === 0 ? "0đ" : `${p.price_vnd.toLocaleString("vi-VN")}đ`,
            originalPrice: p.price_vnd > 0 ? `${(p.price_vnd * 1.5).toLocaleString("vi-VN")}đ` : undefined,
            duration: p.duration_days > 365 ? "Trải nghiệm cơ bản" : `Thời hạn ${p.duration_days} ngày`,
            features: p.features || [],
            isPopular: p.code === "VIP_3M",
            amount: p.price_vnd,
          }));
          setPlans(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch plans:", err);
      }
    }
    loadPlans();
  }, []);

  // Polling tự động phát hiện webhook SePay kích hoạt gói
  useEffect(() => {
    if (!orderDetails || paymentStatus === "success") return;

    const interval = setInterval(async () => {
      try {
        const subRes = await api.payment.getMySubscription();
        if (subRes.success && subRes.data && subRes.data.is_active) {
          setPaymentStatus("success");
          await refreshUser();
          setTimeout(() => {
            setSelectedPlan(null);
            setOrderDetails(null);
            window.location.href = "/dashboard";
          }, 2000);
        }
      } catch (err) {
        // im lặng chờ lần poll tiếp theo
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [orderDetails, paymentStatus, refreshUser]);

  const handleSelectPlan = async (plan: PricingPlan) => {
    if (plan.amount === 0) {
      window.location.href = "/dashboard";
      return;
    }

    // If not logged in, auto quick-login student
    if (!isAuthenticated) {
      await quickLogin("student");
    }

    setSelectedPlan(plan);
    setLoading(true);

    try {
      const res = await api.payment.initiate(plan.id);
      if (res.success && res.data) {
        setOrderDetails(res.data);
      } else {
        alert(res.error?.message || "Không thể khởi tạo mã thanh toán từ máy chủ. Vui lòng thử lại sau.");
        setSelectedPlan(null);
      }
    } catch (err: any) {
      alert(err?.message || "Không thể kết nối đến máy chủ thanh toán. Vui lòng thử lại sau.");
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSimulatePaymentSuccess = async () => {
    setPaymentStatus("success");
    await refreshUser();
    setTimeout(() => {
      alert("Chúc mừng bạn đã kích hoạt thành công Gói VIP! Tài khoản đã được cộng hạn ngạch Quota.");
      setSelectedPlan(null);
      setOrderDetails(null);
      setPaymentStatus("pending");
      window.location.href = "/dashboard";
    }, 1500);
  };

  const handleVerifyTransaction = async () => {
    if (!orderDetails) return;
    setVerifyingPayment(true);
    setVerifyNotice(null);
    try {
      const res = await api.payment.verify(orderDetails.order_code);
      if (res.success && res.data?.isCompleted) {
        setVerifyNotice({
          type: "success",
          text: res.data.message || "Xác nhận thành công! Gói VIP của bạn đã được kích hoạt.",
        });
        setPaymentStatus("success");
        await refreshUser();
        setTimeout(() => {
          setSelectedPlan(null);
          setOrderDetails(null);
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        setVerifyNotice({
          type: "warning",
          text:
            res.message ||
            res.data?.message ||
            "Hệ thống chưa tìm thấy giao dịch ngân hàng khớp mã. Nếu bạn vừa chuyển tiền, ngân hàng có thể mất 1-2 phút hoặc đang bảo trì. Bạn có thể bấm 'Báo cáo sự cố' để Admin hỗ trợ ngay.",
        });
      }
    } catch (err: any) {
      setVerifyNotice({
        type: "error",
        text: err.message || "Không thể kết nối đến máy chủ tra soát. Vui lòng thử lại sau.",
      });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleOpenDispute = () => {
    if (orderDetails) {
      setDisputeAmount(String(orderDetails.amount));
    }
    if (user?.phone_number || user?.phone) {
      setDisputePhone(user.phone_number || user.phone || "");
    }
    setDisputeSuccess(null);
    setDisputeError(null);
    setDisputeModalOpen(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderDetails) return;
    if (!disputeBankTransId.trim()) {
      setDisputeError("Vui lòng nhập mã giao dịch hoặc mã FT của ngân hàng");
      return;
    }
    setSubmittingDispute(true);
    setDisputeError(null);
    setDisputeSuccess(null);
    try {
      const res = await api.payment.reportIssue(orderDetails.order_code, {
        bankTransId: disputeBankTransId.trim(),
        transferAmount: Number(disputeAmount) || orderDetails.amount,
        senderBank: disputeSenderBank.trim() || undefined,
        contactPhone: disputePhone.trim() || undefined,
        note: disputeNote.trim() || undefined,
      });

      if (res.success) {
        setDisputeSuccess(
          res.message ||
            "Yêu cầu tra soát đã được tiếp nhận thành công. Đội ngũ Kỹ thuật & CSKH sẽ đối soát và kích hoạt bù trong vòng 5-15 phút!"
        );
      } else {
        setDisputeError(res.message || res.error?.message || "Không thể gửi yêu cầu hỗ trợ. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setDisputeError(err.message || "Lỗi kết nối khi gửi yêu cầu.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border-b border-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-32 -right-24"
            style={{ width: "450px", height: "450px", background: "hsl(var(--primary) / 0.35)" }}
          />

          <div className="section-container py-12 md:py-20 text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold mb-4 shadow-sm shadow-blue-500/20">
              <Crown className="w-4 h-4" />
              <span>Nâng Cấp Gói Ôn Thi APTIS ESOL PREMIER</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-foreground mb-4">
              Mở Khóa Toàn Bộ Đề Thi &amp; Chấm AI
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Tự động hóa kích hoạt tài khoản ngay lập tức 24/7 qua cổng thanh toán SePay VietQR. Chọn gói phù hợp với mục tiêu B1, B2 hay C Target của bạn.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="section-container py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl border bg-card p-8 flex flex-col justify-between transition-all duration-300 ${
                  plan.isPopular
                    ? "border-primary shadow-2xl shadow-primary/20 scale-105 z-10"
                    : "border-border shadow-sm hover:border-primary/50"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-[11px] font-extrabold tracking-wider shadow-md shadow-blue-500/30">
                    {plan.badge}
                  </div>
                )}

                <div>
                  <h3 className="font-heading font-bold text-xl text-foreground mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-4">{plan.duration}</p>

                  <div className="flex items-baseline gap-2 mb-6">
                    <span className="font-heading font-black text-3xl md:text-4xl text-primary">
                      {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-xs text-muted-foreground line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8 text-xs text-foreground/90">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 rounded-2xl font-heading font-bold text-sm transition-all shadow-md ${
                    plan.isPopular
                      ? "bg-primary hover:bg-brand-brown text-primary-foreground shadow-primary/25"
                      : "border border-primary text-primary hover:bg-primary/10"
                  }`}
                >
                  {plan.amount === 0 ? "Bắt đầu miễn phí" : "Nâng cấp ngay"}
                </button>
              </div>
            ))}
          </div>

          {/* Trust Guarantees */}
          <div className="mt-16 p-6 rounded-2xl border border-border bg-card/60 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
              <div>
                <div className="font-bold text-xs">Kích hoạt tự động 3-5 giây</div>
                <div className="text-[11px] text-muted-foreground">Qua SePay Webhook 24/7</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <div className="font-bold text-xs">Mở khóa toàn bộ đề thi</div>
                <div className="text-[11px] text-muted-foreground">Không phát sinh thêm chi phí</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-primary shrink-0" />
              <div>
                <div className="font-bold text-xs">AI chấm Speaking &amp; Writing</div>
                <div className="text-[11px] text-muted-foreground">Chuẩn format CEFR quốc tế</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* SePay VietQR Payment Modal (SRS Section 5) */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedPlan(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Thanh toán tự động SePay VietQR</span>
              </div>
              <h3 className="font-heading font-bold text-xl text-foreground">
                {selectedPlan.name}
              </h3>
              <p className="text-2xl font-black font-heading text-primary mt-1">
                {selectedPlan.price}
              </p>
            </div>

            {/* Dynamic VietQR Code Box */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center mb-6 max-w-[260px] mx-auto shadow-inner">
              {orderDetails?.qr_code_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={orderDetails.qr_code_url}
                  alt="VietQR MB Bank"
                  className="w-56 h-56 mx-auto rounded-xl object-contain shadow-sm"
                />
              ) : (
                <div className="w-48 h-48 mx-auto bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center text-white space-y-2">
                  <QrCode className="w-24 h-24 text-white" />
                  <span className="text-[10px] font-mono tracking-wider font-bold">
                    MB BANK · 0866950837
                  </span>
                  <span className="text-[9px] bg-blue-600 px-2 py-0.5 rounded text-white font-bold">
                    QUÉT MÃ VIETQR
                  </span>
                </div>
              )}
              <p className="text-[11px] text-slate-600 mt-2.5 font-bold">
                Mở App ngân hàng bất kỳ để quét mã
              </p>
            </div>

            {/* Bank Transfer Details (SRS 5.4) */}
            <div className="space-y-3 mb-6 bg-muted/40 p-4 rounded-2xl border border-border/60 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ngân hàng:</span>
                <span className="font-bold text-foreground">
                  {orderDetails?.bank_name || "MB BANK (Ngân hàng Quân Đội)"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tài khoản:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-foreground text-sm">
                    {orderDetails?.bank_account || "0866950837"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderDetails?.bank_account || "0866950837", "stk")}
                    className="p-1 rounded hover:bg-muted text-primary"
                    title="Sao chép"
                  >
                    {copiedField === "stk" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chủ tài khoản:</span>
                <span className="font-bold text-foreground">
                  {orderDetails?.account_name || "APTIS ESOL PREMIER"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Số tiền:</span>
                <span className="font-bold text-primary text-sm">{selectedPlan.price}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground font-bold">Nội dung CK:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-primary text-sm bg-primary/10 px-2 py-0.5 rounded">
                    {orderDetails?.order_code || "APTIS VIP"}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(orderDetails?.order_code || "APTIS VIP", "nd")}
                    className="p-1 rounded hover:bg-muted text-primary"
                    title="Sao chép nội dung"
                  >
                    {copiedField === "nd" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Automatic Detection Status */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4 animate-spin text-primary" />
                <span>Đang chờ tín hiệu chuyển khoản từ SePay (3 - 5s)...</span>
              </div>

              {/* Demo button to simulate instant bank payment webhook */}
              <button
                type="button"
                onClick={handleSimulatePaymentSuccess}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
              >
                ✓ Mô phỏng đã chuyển khoản thành công (SePay Webhook)
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <FloatingActions />
    </div>
  );
}
