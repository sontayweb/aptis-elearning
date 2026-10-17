"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { AuthModal } from "@/components/auth-modal";
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
  AlertTriangle,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Star,
  Flame,
  ArrowRight,
  Gift,
  HelpCircle,
  Headphones,
  Mic,
  BookOpen,
  Award,
} from "lucide-react";

interface PricingPlan {
  id: string;
  code?: string;
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
    code: "FREE",
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
    code: "VIP_1M",
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
    code: "VIP_3M",
    name: "Aptis Cày Đề (3 Tháng)",
    badge: "🔥 KHUYÊN DÙNG ★ BÁN CHẠY",
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
  {
    id: "premier-six",
    code: "PREMIER_6M",
    name: "Aptis ESOL Premier (6 Tháng)",
    badge: "👑 VIP TOÀN DIỆN (TIẾT KIỆM 60%)",
    price: "699.000đ",
    originalPrice: "1.050.000đ",
    duration: "Thời hạn 180 ngày",
    features: [
      "Toàn quyền truy cập mọi tính năng VIP cao cấp nhất",
      "100 lượt chấm AI Speaking & Writing",
      "10 lượt Giảng viên chấm phân tích chi tiết",
      "Cam kết hỗ trợ học tập đến khi đạt chứng chỉ mong muốn",
      "Ưu tiên hỗ trợ kỹ thuật và học tập 1:1 riêng biệt",
    ],
    amount: 699000,
  },
];

export default function PricingPage() {
  const { user, isAuthenticated, refreshUser } = useAuth();
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
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  // States for Go-Live Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [redeemingPromo, setRedeemingPromo] = useState(false);
  const [promoNotice, setPromoNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPromoBox, setShowPromoBox] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Derive active subscription
  const activeSub = user?.subscription || user?.activeSubscription || (user?.user_subscriptions?.[0] ? {
    planName: user.user_subscriptions[0].plan?.name,
    code: user.user_subscriptions[0].plan?.code,
    endDate: user.user_subscriptions[0].end_date,
    aiQuotaLeft: user.user_subscriptions[0].ai_quota_left,
    teacherQuotaLeft: user.user_subscriptions[0].teacher_quota_left,
  } : null);

  const isVip = Boolean(activeSub && activeSub.planName);
  const remainingDays = activeSub?.endDate
    ? Math.max(0, Math.ceil((new Date(activeSub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const handleRedeemPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCodeInput.trim()) return;
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }
    setRedeemingPromo(true);
    setPromoNotice(null);
    try {
      const res: any = await api.payment.redeemPromoCode(promoCodeInput.trim());
      if (res.success) {
        setPromoNotice({
          type: "success",
          text: res.message || "Chúc mừng bạn đã kích hoạt thành công 14 ngày VIP trải nghiệm!",
        });
        setPromoCodeInput("");
        await refreshUser();
      } else {
        setPromoNotice({
          type: "error",
          text: res.message || "Mã kích hoạt không hợp lệ hoặc đã kết thúc chương trình.",
        });
      }
    } catch (err: any) {
      setPromoNotice({
        type: "error",
        text: err.message || "Không thể kích hoạt mã. Vui lòng kiểm tra lại.",
      });
    } finally {
      setRedeemingPromo(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const codeFromUrl = new URLSearchParams(window.location.search).get("code");
      if (codeFromUrl) {
        setPromoCodeInput(codeFromUrl.toUpperCase());
        setShowPromoBox(true);
      }
    }
  }, []);

  useEffect(() => {
    async function loadPlans() {
      try {
        const res = await api.payment.getPlans();
        if (res.success && res.data && res.data.length > 0) {
          const mapped = res.data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            badge:
              p.code === "PREMIER_6M"
                ? "👑 VIP TOÀN DIỆN (TIẾT KIỆM 60%)"
                : p.code === "VIP_3M"
                ? "🔥 KHUYÊN DÙNG ★ BÁN CHẠY"
                : p.code === "VIP_1M"
                ? "TIẾT KIỆM 40%"
                : undefined,
            price: p.price_vnd === 0 ? "0đ" : `${p.price_vnd.toLocaleString("vi-VN")}đ`,
            originalPrice:
              p.price_vnd > 0
                ? `${(p.price_vnd * 1.6).toLocaleString("vi-VN", { maximumFractionDigits: 0 })}đ`
                : undefined,
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

    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
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

  const faqs = [
    {
      q: "Sau khi chuyển khoản bao lâu thì tài khoản được kích hoạt VIP?",
      a: "Hệ thống kết nối trực tiếp cổng SePay VietQR, nhận tín hiệu giao dịch ngân hàng và tự động kích hoạt tài khoản ngay trong vòng 3 – 5 giây 24/7, kể cả ban đêm hay ngày lễ Tết.",
    },
    {
      q: "Số lượt chấm AI Speaking & Writing có bị hết hạn theo ngày không?",
      a: "Lượt chấm AI có giá trị sử dụng trong suốt thời hạn gói cước của bạn. Khi bạn gia hạn hoặc mua thêm gói mới, số lượt chấm AI và thời hạn sử dụng sẽ được cộng dồn tích lũy.",
    },
    {
      q: "Kho đề Key Dự Đoán trúng tủ 85% được cập nhật như thế nào?",
      a: "Đội ngũ chuyên môn liên tục thu thập review từ các hội đồng thi British Council hàng tuần, lọc và cập nhật ngay vào hệ thống cho học viên gói 3 Tháng và 6 Tháng.",
    },
    {
      q: "Nếu tôi nhập nhầm nội dung chuyển khoản hoặc chuyển sai số tiền thì sao?",
      a: "Đừng lo lắng! Bạn chỉ cần bấm nút 'Báo cáo sự cố' ngay trên màn hình thanh toán hoặc liên hệ Zalo Admin VIP. Đội ngũ kỹ thuật hỗ trợ đối soát thủ công và kích hoạt ngay trong 5-15 phút.",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 pt-[var(--navbar-total-height,64px)] transition-all duration-300">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-accent/5 to-background border-b border-border/60 py-12 md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl -top-24 -right-20 opacity-50"
            style={{ width: "420px", height: "420px", background: "hsl(var(--primary) / 0.3)" }}
          />

          <div className="section-container text-center relative z-10 max-w-4xl mx-auto px-4">
            {isVip && activeSub ? (
              // HERO FOR VIP USERS
              <div className="space-y-4 animate-in fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md shadow-amber-500/20">
                  <Crown className="w-4 h-4 fill-white" />
                  <span>HỘI VIÊN CAO CẤP APTIS VIP</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-black text-foreground tracking-tight">
                  Trung Tâm Đặc Quyền &amp; Quản Lý Gói VIP
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Xin chào <strong>{user?.full_name || "Học viên VIP"}</strong>! Bạn đang sở hữu đặc quyền ôn thi không giới hạn. Dưới đây là thông tin chi tiết và tùy chọn gia hạn ưu đãi.
                </p>

                {/* LUXURY VIP PASS CARD */}
                <div className="mt-8 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-card/95 via-card/80 to-amber-500/10 p-6 md:p-8 shadow-xl shadow-amber-500/10 backdrop-blur-md text-left">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
                        <Crown className="w-8 h-8 fill-white" />
                      </div>
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Đang Hoạt Động</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-heading font-black text-foreground">
                          {activeSub.planName || "Gói VIP Pro"}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                          Hạn dùng: <strong className="text-foreground">{activeSub.endDate ? new Date(activeSub.endDate).toLocaleDateString("vi-VN") : "Vĩnh viễn"}</strong>
                          {remainingDays !== null ? ` (Còn ${remainingDays} ngày)` : ""}
                        </p>
                      </div>
                    </div>

                    {/* METRIC PILLS */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-background/80 border border-border text-center">
                        <div className="text-[11px] text-muted-foreground font-medium">Thời gian còn</div>
                        <div className="text-lg md:text-xl font-heading font-black text-amber-600 dark:text-amber-400">
                          {remainingDays ?? "—"} ngày
                        </div>
                      </div>
                      <div className="p-3 rounded-2xl bg-background/80 border border-border text-center">
                        <div className="text-[11px] text-muted-foreground font-medium">Lượt chấm AI</div>
                        <div className="text-lg md:text-xl font-heading font-black text-primary">
                          {activeSub.aiQuotaLeft ?? 20} lượt
                        </div>
                      </div>
                      <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-background/80 border border-border text-center">
                        <div className="text-[11px] text-muted-foreground font-medium">Chấm Giảng viên</div>
                        <div className="text-lg md:text-xl font-heading font-black text-emerald-600 dark:text-emerald-400">
                          {activeSub.teacherQuotaLeft ?? 0} lượt
                        </div>
                      </div>
                    </div>

                    {/* QUICK CTAs */}
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <Link
                        href="/thi-thu"
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4 fill-white" />
                        <span>Luyện đề ngay</span>
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-primary hover:brightness-90 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Về Dashboard</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // HERO FOR GUEST / FREE USERS
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white text-xs font-bold shadow-md shadow-blue-500/20">
                  <Crown className="w-4 h-4" />
                  <span>BẢNG GIÁ DỊCH VỤ ÔN THI APTIS ESOL PREMIER</span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-extrabold text-foreground tracking-tight">
                  Mở Khóa Toàn Bộ Đề Thi &amp; Chấm AI
                </h1>
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Tự động hóa kích hoạt tài khoản ngay lập tức 24/7 qua cổng thanh toán SePay VietQR. Chọn gói đồng hành phù hợp với mục tiêu B1, B2 hay C Target của bạn.
                </p>

                {/* TRUST CHIPS */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> 4.9/5 từ 3.200+ học viên
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-3.5 h-3.5" /> Kích hoạt tự động 3 giây
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" /> Chuẩn British Council CEFR
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= PROMO CODE STRIP ================= */}
        <section className="section-container py-4 max-w-7xl mx-auto px-4">
          {!isVip ? (
            // Full promo code box for non-VIP
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-amber-500/10 border border-amber-500/30 p-5 md:p-6 shadow-xs">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                    <Gift className="w-3.5 h-3.5" />
                    <span>Mã Trải Nghiệm Go-Live</span>
                  </div>
                  <h3 className="text-base md:text-lg font-heading font-extrabold text-foreground">
                    Bạn có mã kích hoạt VIP miễn phí?
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Nhập mã <span className="font-mono font-bold text-primary">GOLIVE14</span> (hoặc <span className="font-mono font-semibold">APTISGOLIVE</span>) để nhận ngay 14 ngày VIP đầy đủ tính năng &amp; 20 lượt chấm AI!
                  </p>
                </div>

                <form onSubmit={handleRedeemPromo} className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="Mã CODE: GOLIVE14"
                    className="px-4 py-2 rounded-xl border border-border bg-background text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-56"
                  />
                  <button
                    type="submit"
                    disabled={redeemingPromo || !promoCodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-primary text-white text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {redeemingPromo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang kích hoạt...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Kích Hoạt Ngay</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {promoNotice && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    promoNotice.type === "success"
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300"
                  }`}
                >
                  {promoNotice.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  )}
                  <span>{promoNotice.text}</span>
                </div>
              )}
            </div>
          ) : (
            // Collapsible discreet bar for already-VIP users
            <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground text-center sm:text-left">
                <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Bạn có mã Voucher hoặc Giftcode gia hạn khác?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPromoBox(!showPromoBox)}
                className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showPromoBox ? "Ẩn hộp nhập mã" : "Nhập mã ưu đãi tại đây"}</span>
                {showPromoBox ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showPromoBox && (
                <form onSubmit={handleRedeemPromo} className="w-full sm:w-auto flex items-center gap-2 pt-2 sm:pt-0">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                    placeholder="MÃ GIFTCODE"
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-primary w-40"
                  />
                  <button
                    type="submit"
                    disabled={redeemingPromo || !promoCodeInput.trim()}
                    className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                  >
                    Kích hoạt
                  </button>
                </form>
              )}
            </div>
          )}
        </section>

        {/* ================= 4-CARD PRICING GRID ================= */}
        <section className="section-container py-8 md:py-12 max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground">
              Bảng Gói Học Phí Linh Hoạt
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Thời hạn và hạn ngạch chấm AI sẽ được tự động cộng dồn nếu bạn đang có gói VIP sẵn.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {plans.map((plan) => {
              const isCurrentPlan = isVip && (
                (plan.code && activeSub?.code && plan.code === activeSub.code) ||
                (plan.amount > 0 && activeSub?.planName && plan.name.toLowerCase().includes(activeSub.planName.toLowerCase())) ||
                (plan.amount === 699000 && activeSub?.planName?.includes("6 Tháng")) ||
                (plan.amount === 399000 && activeSub?.planName?.includes("3 Tháng")) ||
                (plan.amount === 199000 && activeSub?.planName?.includes("1 Tháng"))
              );

              const isRecommended = plan.isPopular || plan.code === "VIP_3M";
              const isPremier = plan.code === "PREMIER_6M" || plan.amount === 699000;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 ${
                    isCurrentPlan
                      ? "border-amber-500 ring-2 ring-amber-500/40 bg-gradient-to-b from-amber-500/10 via-card to-card shadow-xl shadow-amber-500/15 scale-[1.02] z-20"
                      : isPremier
                      ? "border-amber-500/70 bg-gradient-to-b from-amber-500/5 via-card to-card shadow-lg hover:border-amber-500 hover:shadow-amber-500/20"
                      : isRecommended
                      ? "border-primary bg-card shadow-xl shadow-primary/20 scale-[1.02] z-10"
                      : "border-border/80 bg-card/80 shadow-xs hover:border-primary/40 hover:shadow-md"
                  }`}
                >
                  {/* Badge */}
                  {isCurrentPlan ? (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-black tracking-wider shadow-md shadow-amber-500/30 flex items-center gap-1 whitespace-nowrap">
                      <Crown className="w-3 h-3 fill-white" />
                      <span>GÓI HIỆN TẠI ĐANG DÙNG</span>
                    </div>
                  ) : plan.badge ? (
                    <div
                      className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-[10px] font-black tracking-wider shadow-sm whitespace-nowrap ${
                        isPremier
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 shadow-amber-500/30"
                          : isRecommended
                          ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] shadow-blue-500/30"
                          : "bg-muted-foreground/80"
                      }`}
                    >
                      {plan.badge}
                    </div>
                  ) : null}

                  <div>
                    {/* Header */}
                    <div className="pt-2">
                      <h3 className="font-heading font-extrabold text-lg text-foreground leading-tight">
                        {plan.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{plan.duration}</p>
                    </div>

                    {/* Price */}
                    <div className="mt-4 mb-6 pb-4 border-b border-border/60">
                      <div className="flex items-baseline gap-2">
                        <span className="font-heading font-black text-2xl md:text-3xl text-foreground">
                          {plan.price}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-xs text-muted-foreground line-through">
                            {plan.originalPrice}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        {plan.amount === 0 ? "Phù hợp để làm quen" : "Thanh toán một lần · Kích hoạt ngay"}
                      </div>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 mb-8 text-xs text-foreground/90">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="leading-snug">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => !isCurrentPlan && handleSelectPlan(plan)}
                    disabled={isCurrentPlan || (isVip && plan.amount === 0)}
                    className={`w-full py-2.5 px-4 rounded-xl font-heading font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                      isCurrentPlan
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white cursor-default shadow-amber-500/20"
                        : isVip && plan.amount === 0
                        ? "bg-muted text-muted-foreground border border-border cursor-not-allowed opacity-50"
                        : isPremier
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-amber-500/20 cursor-pointer"
                        : isRecommended
                        ? "bg-primary hover:brightness-90 text-primary-foreground shadow-primary/25 cursor-pointer"
                        : "border border-primary text-primary hover:bg-primary/10 cursor-pointer"
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đang Sử Dụng {remainingDays !== null ? `(${remainingDays} ngày)` : ""}</span>
                      </>
                    ) : isVip && plan.amount === 0 ? (
                      <span>Gói Cơ Bản (Đã Có VIP)</span>
                    ) : isVip && plan.amount > 0 ? (
                      <span>Gia Hạn Thêm Gói Này</span>
                    ) : plan.amount === 0 ? (
                      "Bắt đầu miễn phí"
                    ) : (
                      "Nâng cấp ngay"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= COMPARISON TABLE ================= */}
        <section className="section-container py-10 md:py-14 max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-heading font-black text-foreground">
              So Sánh Chi Tiết Quyền Lợi
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              Minh bạch tính năng giữa các phân khúc học viên
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground">
                  <th className="p-4 font-bold">Tính năng / Quyền lợi</th>
                  <th className="p-4 font-bold text-center">Miễn Phí</th>
                  <th className="p-4 font-bold text-center">1 Tháng</th>
                  <th className="p-4 font-bold text-center text-primary bg-primary/5">3 Tháng (Khuyên dùng)</th>
                  <th className="p-4 font-bold text-center text-amber-600 dark:text-amber-400">6 Tháng Premier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="p-4 font-semibold text-foreground">Bộ đề thi thử chuẩn British Council</td>
                  <td className="p-4 text-center text-muted-foreground">3 đề cơ bản</td>
                  <td className="p-4 text-center font-bold text-foreground">Toàn bộ 860+ đề</td>
                  <td className="p-4 text-center font-bold text-primary bg-primary/5">Toàn bộ 860+ đề</td>
                  <td className="p-4 text-center font-bold text-amber-600 dark:text-amber-400">Toàn bộ 860+ đề</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Lượt chấm Speaking &amp; Writing AI</td>
                  <td className="p-4 text-center text-muted-foreground">3 lượt</td>
                  <td className="p-4 text-center font-bold text-foreground">10 lượt</td>
                  <td className="p-4 text-center font-bold text-primary bg-primary/5">30 lượt</td>
                  <td className="p-4 text-center font-bold text-amber-600 dark:text-amber-400">100 lượt</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Kho Đề Key Dự Đoán trúng tủ 85%</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center font-bold text-emerald-600 bg-primary/5">✓ Mở khóa toàn bộ</td>
                  <td className="p-4 text-center font-bold text-emerald-600">✓ Mở khóa toàn bộ</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Giảng viên chấm bài chi tiết 1:1</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center font-bold text-foreground bg-primary/5">3 lượt</td>
                  <td className="p-4 text-center font-bold text-amber-600 dark:text-amber-400">10 lượt chuyên sâu</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Luyện nghe chép chính tả Dictation</td>
                  <td className="p-4 text-center text-muted-foreground">Giới hạn</td>
                  <td className="p-4 text-center font-bold text-foreground">Không giới hạn</td>
                  <td className="p-4 text-center font-bold text-primary bg-primary/5">Không giới hạn</td>
                  <td className="p-4 text-center font-bold text-amber-600 dark:text-amber-400">Không giới hạn</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-foreground">Hỗ trợ học tập qua Zalo Admin VIP</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center text-muted-foreground">—</td>
                  <td className="p-4 text-center font-bold text-emerald-600 bg-primary/5">✓ Ưu tiên 24/7</td>
                  <td className="p-4 text-center font-bold text-emerald-600">✓ Chăm sóc riêng 1:1</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= TRUST & GUARANTEE ================= */}
        <section className="section-container py-8 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card/60 flex items-start gap-3">
              <ShieldCheck className="w-7 h-7 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-heading font-bold text-xs text-foreground">Kích hoạt tức thì 3-5s</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Xử lý tự động qua SePay VietQR 24/7</div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card/60 flex items-start gap-3">
              <Zap className="w-7 h-7 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-heading font-bold text-xs text-foreground">Mở khóa toàn bộ đề</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Không phát sinh thêm bất kỳ chi phí nào</div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card/60 flex items-start gap-3">
              <Sparkles className="w-7 h-7 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-heading font-bold text-xs text-foreground">Chấm AI chuẩn CEFR</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Phân tích 4 tiêu chí Speaking &amp; Writing</div>
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card/60 flex items-start gap-3">
              <Award className="w-7 h-7 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-heading font-bold text-xs text-foreground">Cam kết bảo mật 100%</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Hỗ trợ giải đáp và tra soát trực tiếp</div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ SECTION ================= */}
        <section className="section-container py-12 md:py-16 max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Giải Đáp Thắc Mắc</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground">
              Câu Hỏi Thường Gặp
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all shadow-xs"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 font-heading font-bold text-xs md:text-sm text-foreground hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span className="shrink-0 text-muted-foreground">
                      {isOpen ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="p-4 md:p-5 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border/40 bg-muted/10 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* ================= SEPAY VIETQR PAYMENT MODAL ================= */}
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

            {/* Bank Transfer Details */}
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

            {/* Automatic Detection Status & Resilience */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-4 h-4 animate-spin text-primary" />
                <span>Đang chờ tín hiệu chuyển khoản từ SePay (3 - 5s)...</span>
              </div>

              {verifyNotice && (
                <div
                  className={`p-3 rounded-xl text-xs text-left animate-in fade-in ${
                    verifyNotice.type === "success"
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {verifyNotice.text}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleVerifyTransaction}
                  disabled={verifyingPayment}
                  className="flex-1 py-2 rounded-xl bg-primary hover:brightness-90 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  {verifyingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Tôi đã chuyển tiền</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenDispute}
                  className="px-3 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold text-muted-foreground transition-colors"
                >
                  Báo sự cố
                </button>
              </div>

              {process.env.NODE_ENV !== "production" && (
                <button
                  type="button"
                  onClick={handleSimulatePaymentSuccess}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm transition-colors"
                >
                  ✓ [DEV] Mô phỏng đã chuyển khoản thành công
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= DISPUTE MODAL ================= */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setDisputeModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-heading font-bold text-foreground mb-1">
              Báo Cáo Sự Cố Chuyển Khoản
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Nhập mã giao dịch để Admin tra soát và kích hoạt bù ngay.
            </p>

            <form onSubmit={handleSubmitDispute} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-foreground">Mã GD / Mã FT của ngân hàng *</label>
                <input
                  type="text"
                  required
                  value={disputeBankTransId}
                  onChange={(e) => setDisputeBankTransId(e.target.value)}
                  placeholder="Ví dụ: FT2428392182"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-foreground">Số điện thoại liên hệ</label>
                <input
                  type="text"
                  value={disputePhone}
                  onChange={(e) => setDisputePhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-border bg-background"
                />
              </div>
              {disputeError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-700 text-xs">
                  {disputeError}
                </div>
              )}
              {disputeSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 text-xs">
                  {disputeSuccess}
                </div>
              )}
              <button
                type="submit"
                disabled={submittingDispute}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-bold shadow-md hover:brightness-90 transition-all flex items-center justify-center gap-2"
              >
                {submittingDispute ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Gửi yêu cầu tra soát</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <FloatingActions />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
