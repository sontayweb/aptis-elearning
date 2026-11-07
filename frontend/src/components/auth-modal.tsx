"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  X,
  Lock,
  Mail,
  User,
  Phone,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  GraduationCap,
  ArrowLeft,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { login, googleLogin, register, quickLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "register" | "forgot">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [devResetToken, setDevResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  const [googleClientId, setGoogleClientId] = useState(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
      "686564345536-iddvjvle0bprc5uga1ogaqcicrdha4ls.apps.googleusercontent.com"
  );

  useEffect(() => {
    setMounted(true);
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      api.auth
        .googleConfig()
        .then((res) => {
          if (res.data?.clientId) {
            setGoogleClientId(res.data.clientId);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab);
      setError(null);
      setForgotSuccess(null);
      setDevResetToken(null);
    }
  }, [isOpen, defaultTab]);

  // Lock body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const navigateAfterAuth = (userRole?: string) => {
    onClose();
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
      router.push("/admin");
    } else if (userRole === "TEACHER") {
      router.push("/teacher");
    } else {
      if (
        pathname === "/" ||
        pathname === "/about" ||
        pathname === "/terms" ||
        pathname === "/contact" ||
        pathname === "/meo-thi-aptis"
      ) {
        router.push("/dashboard");
      } else {
        router.refresh();
      }
    }
  };

  // Load Google Identity Services SDK when GOOGLE_CLIENT_ID is configured
  useEffect(() => {
    if (!isOpen || !mounted || !googleClientId || tab === "forgot") return;

    const initGoogleButton = () => {
      const win = window as any;
      if (!win.google?.accounts?.id || !googleButtonRef.current) return;

      win.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) return;
          setError(null);
          setLoading(true);
          try {
            const res = await googleLogin(response.credential);
            if (res.success) {
              navigateAfterAuth(res.user?.role);
            } else {
              setError(res.error || "Đăng nhập Google thất bại");
            }
          } catch (err: any) {
            setError(err?.message || "Lỗi xác thực Google OAuth2");
          } finally {
            setLoading(false);
          }
        },
      });

      win.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: googleButtonRef.current.offsetWidth || 360,
        text: tab === "register" ? "signup_with" : "continue_with",
        shape: "pill",
      });
    };

    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      initGoogleButton();
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogleButton;
    document.body.appendChild(script);
  }, [isOpen, mounted, googleClientId, tab]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setForgotSuccess(null);
    setDevResetToken(null);
    setLoading(true);

    try {
      if (tab === "forgot") {
        const res = await api.auth.forgotPassword(email.trim());
        if (res.success) {
          setForgotSuccess(
            res.data?.message ||
              res.message ||
              "Nếu email tồn tại trên hệ thống, liên kết đặt lại mật khẩu đã được gửi tới hòm thư của bạn."
          );
          if (res.data?.resetToken) {
            setDevResetToken(res.data.resetToken);
          }
        } else {
          setError(res.message || "Không thể gửi yêu cầu đặt lại mật khẩu");
        }
      } else if (tab === "login") {
        const res = await login(email, password);
        if (res.success) {
          navigateAfterAuth(res.user?.role);
        } else {
          setError(res.error || "Đăng nhập thất bại");
        }
      } else {
        const res = await register({
          email,
          password,
          fullName,
          full_name: fullName,
          phoneNumber: phone || undefined,
          phone: phone || undefined,
        });
        if (res.success) {
          onClose();
          router.push("/dashboard");
        } else {
          setError(res.error || "Đăng ký thất bại");
        }
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: "student" | "teacher" | "admin" | "super_admin") => {
    setError(null);
    setLoading(true);
    try {
      const res = await quickLogin(role);
      if (res && res.success) {
        navigateAfterAuth(res.user?.role);
      } else {
        setError(res?.error || "Đăng nhập nhanh thất bại. Vui lòng thử lại!");
      }
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập nhanh");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-[90vh] overflow-y-auto pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#2563EB] text-white shadow-lg shadow-blue-500/25 mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-heading font-bold text-xl text-foreground">
            {tab === "login"
              ? "Chào mừng trở lại!"
              : tab === "register"
              ? "Tạo tài khoản mới"
              : "Khôi phục mật khẩu"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {tab === "forgot"
              ? "Nhập địa chỉ email đăng ký để nhận liên kết đặt lại mật khẩu"
              : "Luyện thi Aptis ESOL chuẩn định dạng British Council"}
          </p>
        </div>

        {/* Tab Toggle (chỉ hiện khi ở login / register) */}
        {tab !== "forgot" ? (
          <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-5 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                tab === "login"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("register");
                setError(null);
              }}
              className={`py-1.5 rounded-lg transition-all ${
                tab === "register"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Đăng ký
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setError(null);
              setForgotSuccess(null);
              setDevResetToken(null);
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại đăng nhập</span>
          </button>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Forgot Password Success Alert */}
        {forgotSuccess && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs space-y-2">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã gửi yêu cầu khôi phục mật khẩu</span>
            </div>
            <p className="leading-relaxed">{forgotSuccess}</p>
            {devResetToken && (
              <div className="pt-1">
                <Link
                  href={`/auth/reset-password?token=${encodeURIComponent(devResetToken)}`}
                  onClick={onClose}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors"
                >
                  <span>[DEV] Mở trang đặt lại mật khẩu ngay</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Họ và tên
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="hocvien@aptisesolpremier.com"
                className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          {tab !== "forgot" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Mật khẩu
                </label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("forgot");
                      setError(null);
                      setForgotSuccess(null);
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          {tab === "register" && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Số điện thoại (tùy chọn)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full pl-9 pr-3 py-2 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:brightness-110 transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 min-h-[44px]"
          >
            {loading
              ? "Đang xử lý..."
              : tab === "login"
              ? "Đăng nhập ngay"
              : tab === "register"
              ? "Tạo tài khoản"
              : "Gửi liên kết đặt lại mật khẩu"}
          </button>
        </form>

        {/* Google OAuth2 Sign-In / Sign-Up */}
        {tab !== "forgot" && (
          <div className="mt-4 pt-3.5 border-t border-border space-y-2.5">
            {googleClientId ? (
              <div ref={googleButtonRef} className="w-full flex justify-center min-h-[40px]" />
            ) : (
              <button
                type="button"
                onClick={() =>
                  setError(
                    "Chưa cấu hình biến môi trường NEXT_PUBLIC_GOOGLE_CLIENT_ID. Vui lòng thêm Google Client ID vào .env để kích hoạt đăng nhập Google."
                  )
                }
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted/60 text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>{tab === "register" ? "Đăng ký nhanh với Google" : "Tiếp tục với Google"}</span>
              </button>
            )}
          </div>
        )}

        {/* Quick Demo Switcher - Chỉ hiển thị khi development để bảo mật tài khoản quản trị khi Go-Live */}
        {process.env.NODE_ENV !== "production" && tab !== "forgot" && (
          <div className="mt-4 pt-3.5 border-t border-border">
            <p className="text-[11px] font-semibold text-muted-foreground text-center mb-2.5">
              HOẶC ĐĂNG NHẬP NHANH VỚI TÀI KHOẢN MẪU (DEV ONLY):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("student")}
                className="flex flex-col items-center p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-center"
              >
                <GraduationCap className="w-4 h-4 text-primary mb-1" />
                <span className="text-[11px] font-bold text-foreground">Học viên</span>
                <span className="text-[9px] text-muted-foreground">Demo VIP</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("teacher")}
                className="flex flex-col items-center p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-center"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                <span className="text-[11px] font-bold text-foreground">Giảng viên</span>
                <span className="text-[9px] text-muted-foreground">Chấm bài</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("admin")}
                className="flex flex-col items-center p-2 rounded-xl bg-muted/60 hover:bg-muted transition-colors text-center"
              >
                <ShieldCheck className="w-4 h-4 text-blue-500 mb-1" />
                <span className="text-[11px] font-bold text-foreground">Học vụ</span>
                <span className="text-[9px] text-muted-foreground">Đề thi/Lớp</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin("super_admin")}
                className="flex flex-col items-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors text-center"
              >
                <Sparkles className="w-4 h-4 text-rose-500 mb-1" />
                <span className="text-[11px] font-bold text-rose-500">Super Admin</span>
                <span className="text-[9px] text-muted-foreground">Toàn quyền</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
