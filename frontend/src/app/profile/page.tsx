"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Crown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  KeyRound,
  Calendar,
  ArrowRight,
  Zap,
  Target,
  Image as ImageIcon,
  LogIn,
} from "lucide-react";

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "plan">("info");

  // State for Profile Info Form
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [targetBand, setTargetBand] = useState<string>("B2_TARGET");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // State for Change Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Populate data when user is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || user.phone || "");
      setAvatarUrl(user.avatar_url || "");
      if (user.target_band) {
        setTargetBand(user.target_band);
      }
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!fullName.trim()) {
      setProfileError("Họ và tên không được để trống");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.auth.updateProfile({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        targetBand: targetBand,
      });

      if (res.success) {
        setProfileSuccess("Cập nhật thông tin hồ sơ thành công!");
        await refreshUser();
        setTimeout(() => setProfileSuccess(null), 4000);
      } else {
        setProfileError(res.error?.message || res.message || "Cập nhật thất bại. Vui lòng thử lại.");
      }
    } catch (err: any) {
      setProfileError(err.message || "Đã xảy ra lỗi kết nối");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Mật khẩu mới phải có tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Xác nhận mật khẩu mới không khớp");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.auth.changePassword({
        currentPassword,
        newPassword,
      });

      if (res.success) {
        setPasswordSuccess("Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(res.error?.message || res.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.");
      }
    } catch (err: any) {
      setPasswordError(err.message || "Đã xảy ra lỗi trong quá trình đổi mật khẩu");
    } finally {
      setChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải thông tin tài khoản...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-8 rounded-3xl border border-border bg-card text-center shadow-lg space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Yêu cầu đăng nhập</h2>
            <p className="text-sm text-muted-foreground">
              Vui lòng đăng nhập để truy cập trang hồ sơ cá nhân và quản lý tài khoản của bạn.
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold shadow-md shadow-blue-500/25 hover:brightness-110 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Về trang chủ đăng nhập
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const subscription = user.subscription || (user.user_subscriptions?.[0] ? {
    planName: user.user_subscriptions[0].plan.name,
    code: user.user_subscriptions[0].plan.code,
    endDate: user.user_subscriptions[0].end_date,
    aiQuotaLeft: user.ai_quotas ? user.ai_quotas.total_quota - user.ai_quotas.used_quota : 3,
    teacherQuotaLeft: user.teacher_quotas ? user.teacher_quotas.total_quota - user.teacher_quotas.used_quota : 0,
  } : null);

  const aiQuota = user.ai_quotas
    ? Math.max(0, user.ai_quotas.total_quota - user.ai_quotas.used_quota)
    : subscription?.aiQuotaLeft ?? 3;

  const teacherQuota = user.teacher_quotas
    ? Math.max(0, user.teacher_quotas.total_quota - user.teacher_quotas.used_quota)
    : subscription?.teacherQuotaLeft ?? 0;

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header Hero Card */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card/90 to-primary/5 p-6 md:p-8 shadow-xl mb-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-tr from-primary to-orange-400 p-1 shadow-lg shadow-primary/20">
                <div className="w-full h-full rounded-[14px] bg-card overflow-hidden flex items-center justify-center font-bold text-3xl md:text-4xl text-primary">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.full_name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-sm border-2 border-card">
                Active
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                  {user.full_name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary/15 text-primary border border-primary/20">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {user.role}
                  </span>
                  {subscription ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">
                      <Crown className="w-3.5 h-3.5" />
                      {subscription.planName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted text-muted-foreground">
                      FREE TIER
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                <Mail className="w-4 h-4 text-muted-foreground/70" />
                {user.email}
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" />
                  Mục tiêu:&nbsp;
                  <strong className="text-foreground">
                    {targetBand === "B1_TARGET" ? "Aptis B1" : targetBand === "C_TARGET" ? "Aptis C (C1/C2)" : "Aptis B2"}
                  </strong>
                </span>
                {user.created_at && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground/70" />
                    Gia nhập: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            </div>

            {/* Quota overview pills */}
            <div className="w-full md:w-auto flex md:flex-col gap-2 shrink-0">
              <div className="flex-1 md:w-48 p-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">AI Chấm còn</p>
                  <p className="text-lg font-black text-primary">{aiQuota} lượt</p>
                </div>
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 md:w-48 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground">GV Chấm còn</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{teacherQuota} lượt</p>
                </div>
                <Crown className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-border mb-8 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "info"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <User className="w-4 h-4" />
            Thông tin cá nhân & Mục tiêu
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "password"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Đổi mật khẩu bảo mật
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === "plan"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Crown className="w-4 h-4" />
            Gói cước & Quyền lợi VIP
          </button>
        </div>

        {/* TAB 1: Personal Info */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 md:p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Hồ sơ người học</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cập nhật họ tên, số điện thoại và mục tiêu chứng chỉ để AI gợi ý lộ trình ôn luyện chuẩn xác nhất.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {/* Email (Readonly) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      Địa chỉ Email (Đăng nhập)
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/60 text-muted-foreground text-sm font-medium cursor-not-allowed pr-10"
                      />
                      <Lock className="w-4 h-4 text-muted-foreground absolute right-3.5 top-3" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Email là định danh bảo mật tài khoản duy nhất và không thể thay đổi trực tiếp.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Họ và tên hiển thị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      Số điện thoại Zalo / Liên hệ
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dùng để nhận tư vấn lộ trình và hỗ trợ nhận tài liệu quà tặng qua Zalo.
                    </p>
                  </div>

                  {/* Avatar URL */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      Link ảnh đại diện (Avatar URL)
                    </label>
                    <input
                      type="url"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Target Band Selection */}
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Mục tiêu Band điểm Aptis ESOL
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        {
                          id: "B1_TARGET",
                          title: "Mục tiêu B1",
                          sub: "Tốt nghiệp ĐH & Cơ bản",
                          color: "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-600",
                        },
                        {
                          id: "B2_TARGET",
                          title: "Mục tiêu B2",
                          sub: "Chuẩn Thạc sĩ / Đầu ra",
                          color: "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-600",
                        },
                        {
                          id: "C_TARGET",
                          title: "Mục tiêu C1/C2",
                          sub: "Chuyên sâu / Giảng dạy",
                          color: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-600",
                        },
                      ].map((band) => (
                        <button
                          key={band.id}
                          type="button"
                          onClick={() => setTargetBand(band.id)}
                          className={`p-3.5 rounded-2xl border text-left transition-all relative ${
                            targetBand === band.id
                              ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/30"
                              : "border-border bg-card hover:bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-foreground">{band.title}</span>
                            {targetBand === band.id && (
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">{band.sub}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang lưu thông tin...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Lưu thay đổi hồ sơ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right sidebar tips */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl border border-border bg-card space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Lộ trình học cá nhân hóa
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thiết lập mục tiêu chuẩn xác giúp thuật toán AI phân bổ đề thi thử Writing & Speaking tương thích với tiêu chí thang điểm Hội đồng Anh (British Council).
                </p>
                <div className="space-y-2 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Đề thi thử đã làm:</span>
                    <strong className="text-foreground">Đầy đủ 4 kỹ năng</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Thực hành từ vựng:</span>
                    <strong className="text-emerald-500 font-bold">Không giới hạn</strong>
                  </div>
                </div>
                <Link
                  href="/thi-thu"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
                >
                  Vào làm bài thi thử ngay
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === "password" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 md:p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold text-foreground">Đổi mật khẩu tài khoản</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Để đảm bảo an toàn, vui lòng không chia sẻ mật khẩu của bạn với bất kỳ ai. Mật khẩu mới cần có ít nhất 6 ký tự.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-sm font-semibold flex items-center gap-3 animate-in fade-in">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu bạn đang sử dụng"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Tối thiểu 6 ký tự"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="pt-1 flex items-center gap-2 text-[11px]">
                      <span className={`flex items-center gap-1 ${newPassword.length >= 6 ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tối thiểu 6 ký tự
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-rose-500 font-semibold">
                      Mật khẩu xác nhận chưa khớp với mật khẩu mới.
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang xử lý đổi mật khẩu...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        Cập nhật mật khẩu mới
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Plan & Benefits */}
        {activeTab === "plan" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Gói hiện tại */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trạng thái gói</span>
                  <h3 className="text-xl font-extrabold text-foreground mt-0.5">
                    {subscription ? subscription.planName : "Gói Học Miễn Phí (Free)"}
                  </h3>
                </div>
                {subscription?.endDate && (
                  <p className="text-xs text-muted-foreground">
                    Hạn dùng đến: <strong>{new Date(subscription.endDate).toLocaleDateString("vi-VN")}</strong>
                  </p>
                )}
                <div className="pt-2">
                  <Link
                    href="/pricing"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:brightness-110 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    Nâng cấp / Gia hạn gói VIP
                  </Link>
                </div>
              </div>

              {/* Card 2: Lượt AI */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hạn ngạch AI</span>
                  <h3 className="text-3xl font-black text-primary mt-0.5">{aiQuota} lượt</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dùng để AI chấm điểm tức thì, phát hiện lỗi ngữ pháp, phát âm và gợi ý bài viết mẫu theo thang chuẩn CEFR.
                </p>
              </div>

              {/* Card 3: Lượt Giảng viên */}
              <div className="p-6 rounded-3xl border border-border bg-card shadow-sm space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hạn ngạch Giảng Viên</span>
                  <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{teacherQuota} lượt</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Bài Writing & Speaking được chuyển thẳng đến Giảng viên 8.5+ IELTS / C2 Aptis chấm chữa chi tiết từng câu.
                </p>
              </div>
            </div>

            {/* VIP Features list */}
            <div className="p-6 md:p-8 rounded-3xl border border-border bg-card shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-foreground">Đặc quyền học viên APTIS ESOL PREMIER</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    title: "Bộ đề Key Dự Đoán",
                    desc: "Cập nhật liên tục đề thi thật từ phòng thi IDP & British Council",
                    icon: Zap,
                  },
                  {
                    title: "Chấm Speaking AI",
                    desc: "Phân tích âm vị, độ trôi chảy và chấm band điểm 4 tiêu chí",
                    icon: Sparkles,
                  },
                  {
                    title: "Chấm Writing Chuyên Sâu",
                    desc: "Sửa chi tiết từng câu, gợi ý từ vựng C1/C2 thay thế cao cấp",
                    icon: CheckCircle2,
                  },
                  {
                    title: "Lớp học tương tác",
                    desc: "Tham gia lớp học do giáo viên trực tiếp giao bài & chấm bài",
                    icon: Crown,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2">
                    <item.icon className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <FloatingActions />
    </div>
  );
}
