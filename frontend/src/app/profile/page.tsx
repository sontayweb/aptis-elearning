"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import { AuthModal } from "@/components/auth-modal";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
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
  LogOut,
  GraduationCap,
  RotateCcw,
  ExternalLink,
  Check,
  Monitor,
  Laptop,
  Smartphone,
  Clock,
} from "lucide-react";

const AVATAR_PRESETS = [
  { id: "avatar-1", label: "Học viên Nam 1", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix" },
  { id: "avatar-2", label: "Học viên Nữ 1", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka" },
  { id: "avatar-3", label: "Học viên Nam 2", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo" },
  { id: "avatar-4", label: "Học viên Nữ 2", url: "https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi" },
  { id: "avatar-5", label: "Giảng viên / Học giả", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Teacher" },
  { id: "avatar-6", label: "Robot Thông thái", url: "https://api.dicebear.com/7.x/bottts/svg?seed=Scholar" },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"info" | "password" | "plan">("info");
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // State for Profile Info Form
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [targetBand, setTargetBand] = useState<string>("B2_TARGET");
  const [avatarImageError, setAvatarImageError] = useState(false);
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

  // Device Info Detection
  const [deviceInfo, setDeviceInfo] = useState({
    device: "Máy tính",
    os: "Windows",
    browser: "Chrome",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent;
      let device = "Máy tính";
      let os = "Windows";
      let browser = "Chrome";

      if (/Mobi|Android/i.test(ua)) {
        device = "Điện thoại";
      } else if (/Tablet|iPad/i.test(ua)) {
        device = "Máy tính bảng";
      }

      if (/Windows/i.test(ua)) os = "Windows";
      else if (/Macintosh|Mac OS/i.test(ua)) os = "macOS";
      else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
      else if (/Android/i.test(ua)) os = "Android";
      else if (/Linux/i.test(ua)) os = "Linux";

      if (/Edg/i.test(ua)) browser = "Edge";
      else if (/Chrome|CriOS/i.test(ua)) browser = "Chrome";
      else if (/Firefox|FxiOS/i.test(ua)) browser = "Firefox";
      else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
      else if (/Opera|OPR/i.test(ua)) browser = "Opera";

      setDeviceInfo({ device, os, browser });
    }
  }, []);

  // Populate data when user is loaded
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || user.phone || "");
      setAvatarUrl(user.avatar_url || "");
      setAvatarImageError(false);
      if (user.target_band) {
        setTargetBand(user.target_band);
      }
    }
  }, [user]);

  // Handle Logout from Profile Page
  const handleLogout = () => {
    logout();
    router.push("/");
  };

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
        <main className="flex-1 flex flex-col items-center justify-center px-4 pt-[calc(var(--navbar-total-height,104px)+2.5rem)] pb-16">
          <div className="my-auto flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Đang tải thông tin tài khoản...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 pt-[calc(var(--navbar-total-height,104px)+3rem)] pb-16">
          <div className="max-w-md w-full my-auto p-6 sm:p-8 rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/95 text-center shadow-xl space-y-5 backdrop-blur-sm">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner border border-primary/20">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-foreground">Yêu cầu đăng nhập</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Vui lòng đăng nhập để truy cập trang hồ sơ cá nhân và quản lý tài khoản của bạn.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-md shadow-primary/25 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                Đăng nhập ngay
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground font-semibold text-xs transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </div>
        </main>
        <Footer />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab="login"
        />
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

  // Determine effective preview avatar
  const currentAvatarDisplay = avatarUrl || user.avatar_url;

  // Helper for role display
  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "TEACHER":
        return {
          label: "Giảng viên",
          icon: GraduationCap,
          style: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
        };
      case "ADMIN":
        return {
          label: "Quản trị viên",
          icon: ShieldCheck,
          style: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
        };
      default:
        return {
          label: "Học viên",
          icon: User,
          style: "bg-primary/15 text-primary border-primary/20",
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);
  const RoleIcon = roleInfo.icon;

  const getTargetLabel = (band: string) => {
    switch (band) {
      case "B1_TARGET":
        return "Aptis B1";
      case "C_TARGET":
        return "Aptis C (C1/C2)";
      case "B2_TARGET":
      default:
        return "Aptis B2";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 container max-w-5xl mx-auto px-4 sm:px-6 pt-[calc(var(--navbar-total-height,64px)+1rem)] sm:pt-[calc(var(--navbar-total-height,64px)+1.5rem)] pb-12 transition-all duration-300">
        {/* Compact Hero Banner Card */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card/95 to-primary/5 p-4 sm:p-5 md:p-6 shadow-md mb-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
            {/* Avatar with Compact Size & Live Preview */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-primary to-orange-400 p-0.5 sm:p-1 shadow-md shadow-primary/20">
                <div className="w-full h-full rounded-[10px] sm:rounded-[14px] bg-card overflow-hidden flex items-center justify-center font-bold text-xl sm:text-2xl text-primary select-none">
                  {currentAvatarDisplay && !avatarImageError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentAvatarDisplay}
                      alt={user.full_name}
                      onError={() => setAvatarImageError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (fullName || user.full_name)?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500 text-white shadow-sm border-2 border-card flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                Active
              </span>
            </div>

            {/* Compact Info Section */}
            <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground tracking-tight truncate">
                  {fullName || user.full_name}
                </h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleInfo.style}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleInfo.label}
                  </span>
                  {subscription ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      <Crown className="w-3 h-3" />
                      {subscription.planName}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                      Gói Miễn Phí
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                <span className="truncate">{user.email}</span>
              </p>

              <div className="pt-0.5 flex flex-wrap items-center justify-center sm:justify-start gap-2.5 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
                  <Target className="w-3 h-3 text-primary" />
                  Mục tiêu:&nbsp;
                  <strong className="text-foreground font-semibold">{getTargetLabel(targetBand)}</strong>
                </span>
                {user.created_at && (
                  <span className="inline-flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md border border-border/60">
                    <Calendar className="w-3 h-3 text-muted-foreground/70" />
                    Gia nhập: {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            </div>

            {/* Compact Quota Pills */}
            <div className="w-full sm:w-auto flex sm:flex-col gap-2 shrink-0 pt-2 sm:pt-0">
              <div className="flex-1 sm:w-44 p-2.5 sm:p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between shadow-xs transition-all hover:border-primary/40">
                <div className="leading-tight">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">AI Chấm còn</p>
                  <p className="text-base sm:text-lg font-extrabold text-primary">{aiQuota} lượt</p>
                  <span className="text-[9px] text-muted-foreground/80">Chuẩn CEFR</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="flex-1 sm:w-44 p-2.5 sm:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between shadow-xs transition-all hover:border-emerald-500/40">
                <div className="leading-tight">
                  <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground">GV Chấm còn</p>
                  <p className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{teacherQuota} lượt</p>
                  <span className="text-[9px] text-muted-foreground/80">8.5+ IELTS</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Streamlined Segmented Control */}
        <div className="mb-6 overflow-x-auto pb-1 scrollbar-none">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/50 border border-border/80 shadow-xs">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "info"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Thông tin cá nhân & Mục tiêu
            </button>

            <button
              onClick={() => setActiveTab("password")}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "password"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Đổi mật khẩu bảo mật
            </button>

            <button
              onClick={() => setActiveTab("plan")}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "plan"
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Gói cước & Quyền lợi VIP
            </button>
          </div>
        </div>

        {/* TAB 1: Personal Info */}
        {activeTab === "info" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">Hồ sơ người học</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cập nhật họ tên, ảnh đại diện, số điện thoại và mục tiêu chứng chỉ để AI tối ưu hóa lộ trình ôn thi phù hợp nhất.
                  </p>
                </div>

                {profileSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4 sm:space-y-5">
                  {/* Quick Avatar Picker & Input */}
                  <div className="space-y-2.5 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/60">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        Ảnh đại diện (Avatar)
                      </label>
                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl("");
                            setAvatarImageError(false);
                          }}
                          className="text-[10px] sm:text-[11px] font-medium text-rose-500 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Dùng chữ cái đầu mặc định
                        </button>
                      )}
                    </div>

                    {/* Avatar Preset Grid */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] text-muted-foreground">
                        Chọn nhanh mẫu avatar hoặc dán đường dẫn ảnh tùy ý:
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        {AVATAR_PRESETS.map((preset) => {
                          const isSelected = avatarUrl === preset.url;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                setAvatarUrl(preset.url);
                                setAvatarImageError(false);
                              }}
                              title={preset.label}
                              className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden border transition-all p-0.5 ${
                                isSelected
                                  ? "border-primary ring-2 ring-primary/40 scale-105 shadow-xs"
                                  : "border-border hover:border-primary/50 hover:scale-105"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={preset.url}
                                alt={preset.label}
                                className="w-full h-full object-cover rounded-md bg-card"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                  <div className="w-3.5 h-3.5 rounded-full bg-primary text-white flex items-center justify-center">
                                    <Check className="w-2 h-2 stroke-[3]" />
                                  </div>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom URL Input */}
                    <div className="relative pt-0.5">
                      <input
                        type="url"
                        value={avatarUrl}
                        onChange={(e) => {
                          setAvatarUrl(e.target.value);
                          setAvatarImageError(false);
                        }}
                        placeholder="Hoặc dán URL ảnh đại diện tùy thích (https://...)"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Email (Readonly) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        Địa chỉ Email (Đăng nhập)
                      </label>
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                        Bảo mật cố định
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3.5 py-2 rounded-xl border border-border bg-muted/60 text-muted-foreground text-xs sm:text-sm font-medium cursor-not-allowed pr-9"
                      />
                      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-2.5" />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Email là định danh tài khoản duy nhất và dùng để đồng bộ tiến độ học tập.
                    </p>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      Họ và tên hiển thị <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Ví dụ: Thầy Hưng Aptis Master"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      Số điện thoại Zalo / Liên hệ
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Ví dụ: 0987654321"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dùng để nhận tư vấn lộ trình và tài liệu ôn thi độc quyền qua Zalo.
                    </p>
                  </div>

                  {/* Target Band Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-primary" />
                      Mục tiêu Band điểm Aptis ESOL
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: "B1_TARGET",
                          title: "Mục tiêu B1",
                          sub: "Tốt nghiệp ĐH & Cơ bản",
                          cefr: "CEFR B1 (100 - 139)",
                        },
                        {
                          id: "B2_TARGET",
                          title: "Mục tiêu B2",
                          sub: "Chuẩn Thạc sĩ / Đầu ra",
                          cefr: "CEFR B2 (140 - 159)",
                        },
                        {
                          id: "C_TARGET",
                          title: "Mục tiêu C1/C2",
                          sub: "Chuyên sâu / Giảng dạy",
                          cefr: "CEFR C (160 - 200)",
                        },
                      ].map((band) => {
                        const isSelected = targetBand === band.id;
                        return (
                          <button
                            key={band.id}
                            type="button"
                            onClick={() => setTargetBand(band.id)}
                            className={`p-3 rounded-xl border text-left transition-all relative ${
                              isSelected
                                ? "border-primary bg-primary/10 shadow-xs ring-2 ring-primary/30"
                                : "border-border bg-card hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs sm:text-sm text-foreground">{band.title}</span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{band.sub}</p>
                            <span className="inline-block text-[10px] text-primary/80 mt-1 font-semibold">
                              {band.cefr}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {savingProfile ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang lưu thông tin...
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Lưu thay đổi hồ sơ
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right sidebar info */}
            <div className="space-y-5">
              {/* Card 1: Personalized Study Route */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
                <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Lộ trình học cá nhân hóa
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Thiết lập mục tiêu chuẩn xác giúp AI phân bổ đề thi thử Writing & Speaking chuẩn theo tiêu chí chấm của British Council.
                </p>
                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Đề thi thử:</span>
                    <strong className="text-foreground font-semibold">Đầy đủ 4 kỹ năng</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">Luyện từ vựng:</span>
                    <strong className="text-emerald-500 font-semibold">Không giới hạn</strong>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
                    <span className="text-muted-foreground">AI Chấm điểm:</span>
                    <strong className="text-primary font-semibold">Chuẩn thang CEFR</strong>
                  </div>
                </div>
                <Link
                  href="/thi-thu"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors"
                >
                  Vào làm bài thi thử ngay
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Card 2: Thiết bị đang đăng nhập & Đăng xuất */}
              <ActiveDeviceCard
                deviceInfo={deviceInfo}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Change Password */}
        {activeTab === "password" && (
          <div className="max-w-xl mx-auto space-y-5">
            <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs space-y-5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-foreground">Đổi mật khẩu tài khoản</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mật khẩu mới cần có tối thiểu 6 ký tự để đảm bảo an toàn cho tài khoản của bạn.
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-primary" />
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      placeholder="Nhập mật khẩu đang dùng"
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Ẩn / Hiện mật khẩu"
                    >
                      {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Ẩn / Hiện mật khẩu mới"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="pt-0.5 flex items-center gap-1 text-[11px]">
                      <span className={`flex items-center gap-1 ${newPassword.length >= 6 ? "text-emerald-500 font-semibold" : "text-muted-foreground"}`}>
                        <CheckCircle2 className="w-3 h-3" /> Tối thiểu 6 ký tự ({newPassword.length}/6)
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
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
                      className="w-full px-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none transition-all pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Ẩn / Hiện xác nhận mật khẩu"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-[11px] font-semibold flex items-center gap-1 pt-0.5 ${confirmPassword === newPassword ? "text-emerald-500" : "text-rose-500"}`}>
                      {confirmPassword === newPassword ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          Mật khẩu xác nhận hoàn toàn trùng khớp
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          Mật khẩu xác nhận chưa khớp với mật khẩu mới.
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm shadow-md shadow-primary/20 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {changingPassword ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Cập nhật mật khẩu mới
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Also show active device card in security tab */}
            <ActiveDeviceCard
              deviceInfo={deviceInfo}
              onLogout={handleLogout}
            />
          </div>
        )}

        {/* TAB 3: Plan & Benefits */}
        {activeTab === "plan" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card 1: Gói hiện tại */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Trạng thái gói</span>
                    <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                      {subscription ? subscription.planName : "Gói Học Miễn Phí (Free)"}
                    </h3>
                  </div>
                  {subscription?.endDate ? (
                    <p className="text-xs text-muted-foreground">
                      Hạn dùng: <strong>{new Date(subscription.endDate).toLocaleDateString("vi-VN")}</strong>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Bạn đang sử dụng quyền lợi dùng thử miễn phí.
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Link
                    href="/pricing"
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-semibold text-xs shadow-sm shadow-blue-500/20 hover:brightness-110 transition-all"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    Nâng cấp / Gia hạn VIP
                  </Link>
                </div>
              </div>

              {/* Card 2: Lượt AI */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hạn ngạch AI</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-primary mt-0.5">{aiQuota} lượt</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chấm điểm tức thì, phát hiện lỗi ngữ pháp, phát âm và bài mẫu theo thang chuẩn CEFR.
                </p>
              </div>

              {/* Card 3: Lượt Giảng viên */}
              <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-xs space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hạn ngạch Giảng Viên</span>
                  <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{teacherQuota} lượt</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bài làm được chuyển thẳng đến Giảng viên 8.5+ IELTS / C2 Aptis chấm chữa chi tiết từng câu.
                </p>
              </div>
            </div>

            {/* VIP Features list */}
            <div className="p-5 sm:p-6 rounded-2xl border border-border bg-card shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-foreground">Đặc quyền học viên APTIS ESOL PREMIER</h3>
                  <p className="text-xs text-muted-foreground">
                    Hệ thống tích hợp đầy đủ công cụ luyện thi thực chiến chuẩn quốc tế
                  </p>
                </div>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline shrink-0"
                >
                  Xem bảng giá chi tiết
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    title: "Bộ đề Key Dự Đoán",
                    desc: "Cập nhật liên tục đề thi thật từ IDP & British Council",
                    icon: Zap,
                  },
                  {
                    title: "Chấm Speaking AI",
                    desc: "Phân tích âm vị, độ trôi chảy và chấm 4 tiêu chí chuẩn CEFR",
                    icon: Sparkles,
                  },
                  {
                    title: "Chấm Writing Chuyên Sâu",
                    desc: "Sửa chi tiết từng câu, gợi ý từ vựng C1/C2 thay thế cao cấp",
                    icon: CheckCircle2,
                  },
                  {
                    title: "Lớp học tương tác",
                    desc: "Tham gia lớp học do giáo viên trực tiếp giao bài & theo sát",
                    icon: Crown,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-1.5 hover:border-primary/40 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <item.icon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <h4 className="font-semibold text-xs sm:text-sm text-foreground">{item.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
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

// Reusable Active Device & Single-Session Component
function ActiveDeviceCard({
  deviceInfo,
  onLogout,
}: {
  deviceInfo: { device: string; os: string; browser: string };
  onLogout: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-card space-y-3.5 shadow-xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
          <Monitor className="w-4 h-4 text-primary" />
          Thiết bị đang đăng nhập
        </h3>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          1 thiết bị
        </span>
      </div>

      {/* Policy Notice Box */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          Mỗi tài khoản dùng trên 1 trình duyệt tại một thời điểm — đăng nhập nơi mới sẽ đăng xuất nơi cũ.
        </span>
      </div>

      {/* Current Device Item */}
      <div className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {deviceInfo.device === "Điện thoại" ? (
              <Smartphone className="w-4 h-4 text-primary" />
            ) : (
              <Laptop className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs font-bold text-foreground">
                {deviceInfo.device} · {deviceInfo.os} · {deviceInfo.browser}
              </p>
              <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded">
                (Thiết bị này)
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground/70" />
              Hoạt động 9 phút trước
            </p>
          </div>
        </div>
      </div>

      {/* Logout button / Confirm prompt */}
      {showConfirm ? (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
          <p className="text-[11px] font-medium text-rose-600 dark:text-rose-400 text-center">
            Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-1.5 px-3 rounded-lg border border-border bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Đồng ý đăng xuất
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Đăng xuất ở trang profile này
        </button>
      )}
    </div>
  );
}
