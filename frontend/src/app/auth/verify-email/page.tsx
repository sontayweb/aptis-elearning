"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, RefreshCw, Home } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { verifyEmail, resendVerification, isAuthenticated, user } = useAuth();

  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string>("");
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function executeVerification() {
      if (!token) {
        setStatus("error");
        setMessage("Liên kết xác thực không hợp lệ hoặc thiếu mã token.");
        return;
      }

      setStatus("loading");
      const res = await verifyEmail(token);
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "Địa chỉ email của bạn đã được xác thực thành công!");

        // Start countdown to redirect
        let count = 4;
        timer = setInterval(() => {
          count -= 1;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(timer);
            router.push("/dashboard");
          }
        }, 1000);
      } else {
        setStatus("error");
        setMessage(res.error || "Liên kết xác thực không hợp lệ hoặc đã hết hạn.");
      }
    }

    executeVerification();

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [token, verifyEmail, router]);

  const handleResend = async () => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    setResending(true);
    setResendSuccess(null);
    const res = await resendVerification();
    setResending(false);
    if (res.success) {
      setResendSuccess(res.message || "Đã gửi lại email xác thực thành công!");
    } else {
      setMessage(res.error || "Không thể gửi lại email xác thực.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl border border-border bg-card/90 backdrop-blur-md shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
      {/* 1. LOADING STATE */}
      {status === "loading" && (
        <div className="space-y-4 py-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto shadow-inner">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-heading font-black text-xl text-foreground">
              Đang xác thực email...
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Vui lòng giữ nguyên màn hình trong giây lát, hệ thống đang kiểm tra mã xác thực của bạn.
            </p>
          </div>
        </div>
      )}

      {/* 2. SUCCESS STATE */}
      {status === "success" && (
        <div className="space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm ring-4 ring-emerald-500/10">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-black text-xl sm:text-2xl text-foreground">
              Xác thực thành công! 🎉
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/80 text-xs text-muted-foreground">
            Tự động chuyển về trang học tập trong <strong className="text-primary font-bold">{countdown}s</strong>...
          </div>

          <div className="pt-2">
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white btn-brand-gradient shadow-glow-soft inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <span>Vào học &amp; Luyện đề ngay</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. ERROR STATE */}
      {status === "error" && (
        <div className="space-y-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm ring-4 ring-rose-500/10">
            <XCircle className="w-9 h-9" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading font-black text-xl text-foreground">
              Xác thực không thành công
            </h1>
            <p className="text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          {resendSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-left">
              ✓ {resendSuccess}
            </div>
          )}

          <div className="pt-2 space-y-2">
            {isAuthenticated && !resendSuccess && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-glow shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang gửi lại email...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Gửi lại email xác thực mới</span>
                  </>
                )}
              </button>
            )}

            <Link
              href="/"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-foreground bg-muted hover:bg-muted/80 border border-border inline-flex items-center justify-center gap-2 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Về trang chủ</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-card to-background relative overflow-hidden">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Đang tải...</span>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
