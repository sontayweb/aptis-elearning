"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Lock, CheckCircle2, XCircle, Loader2, ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Đường dẫn đặt lại mật khẩu thiếu mã xác thực (token). Vui lòng yêu cầu gửi lại email.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.resetPassword({ token, newPassword });
      if (res.success) {
        setSuccessMsg(res.message || "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      } else {
        setError(res.message || "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.");
      }
    } catch (err: any) {
      setError(err?.message || "Đã xảy ra lỗi khi đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl border border-border bg-card/90 backdrop-blur-md shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto ring-4 ring-rose-500/10">
          <XCircle className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading font-black text-xl text-foreground">
            Liên kết không hợp lệ
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Đường dẫn đặt lại mật khẩu không đầy đủ hoặc đã hết hạn. Vui lòng quay lại trang chủ và chọn &ldquo;Quên mật khẩu&rdquo; để nhận liên kết mới.
          </p>
        </div>
        <Link
          href="/"
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] inline-flex items-center justify-center gap-2 shadow-md"
        >
          <span>Về trang chủ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl border border-border bg-card/90 backdrop-blur-md shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
      {successMsg ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading font-black text-xl text-foreground">
              Đổi mật khẩu thành công!
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {successMsg}
            </p>
          </div>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] inline-flex items-center justify-center gap-2 shadow-md"
          >
            <span>Về trang chủ để đăng nhập</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1D4ED8] to-[#2563EB] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/25">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="font-heading font-bold text-xl text-foreground">
              Tạo mật khẩu mới
            </h1>
            <p className="text-xs text-muted-foreground">
              Nhập mật khẩu mới tối thiểu 8 ký tự cho tài khoản Aptis ESOL của bạn.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  className="w-full pl-9 pr-10 py-2.5 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:brightness-110 transition-all shadow-md shadow-blue-500/25 disabled:opacity-50 inline-flex items-center justify-center gap-2 min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang cập nhật mật khẩu...</span>
                </>
              ) : (
                <span>Xác nhận đổi mật khẩu</span>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-gradient-to-b from-background via-background to-muted/30">
      <Suspense
        fallback={
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải...</span>
          </div>
        }
      >
        <ResetPasswordContent />
      </Suspense>
    </main>
  );
}

