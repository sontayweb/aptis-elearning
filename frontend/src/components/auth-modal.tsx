"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { X, Lock, Mail, User, Phone, Sparkles, CheckCircle2, ShieldCheck, GraduationCap } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, defaultTab = "login" }: AuthModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { login, register, quickLogin } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === "login") {
        const res = await login(email, password);
        if (res.success) {
          onClose();
          const userRole = res.user?.role;
          if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") {
            router.push("/admin");
          } else if (userRole === "TEACHER") {
            router.push("/teacher");
          } else {
            if (pathname === "/" || pathname === "/about" || pathname === "/terms" || pathname === "/contact" || pathname === "/meo-thi-aptis") {
              router.push("/dashboard");
            } else {
              router.refresh();
            }
          }
        } else {
          setError(res.error || "Đăng nhập thất bại");
        }
      } else {
        const res = await register({
          email,
          password,
          full_name: fullName,
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
        onClose();
        if (role === "admin" || role === "super_admin") {
          router.push("/admin");
        } else if (role === "teacher") {
          router.push("/teacher");
        } else {
          if (pathname === "/" || pathname === "/about" || pathname === "/terms" || pathname === "/contact" || pathname === "/meo-thi-aptis") {
            router.push("/dashboard");
          } else {
            router.refresh();
          }
        }
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
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
            {tab === "login" ? "Chào mừng trở lại!" : "Tạo tài khoản mới"}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Luyện thi Aptis ESOL chuẩn định dạng British Council
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-1 bg-muted rounded-xl mb-5 text-sm font-semibold">
          <button
            type="button"
            onClick={() => { setTab("login"); setError(null); }}
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
            onClick={() => { setTab("register"); setError(null); }}
            className={`py-1.5 rounded-lg transition-all ${
              tab === "register"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Đăng ký
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-medium">
            {error}
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                placeholder="example@aptiskytich.vn"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:brightness-110 transition-all shadow-md shadow-blue-500/25 disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : tab === "login" ? "Đăng nhập ngay" : "Tạo tài khoản"}
          </button>
        </form>

        {/* Quick Demo Switcher - Chỉ hiển thị khi development để bảo mật tài khoản quản trị khi Go-Live */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mt-5 pt-4 border-t border-border">
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
