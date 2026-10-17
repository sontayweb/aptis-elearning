"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Mail, RefreshCw, Loader2, CheckCircle2, X } from "lucide-react";

export function EmailVerificationNotice() {
  const { user, resendVerification } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  if (!user || user.email_verified || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (cooldown > 0) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const res = await resendVerification();
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || "Đã gửi liên kết xác thực tới hòm thư của bạn.");
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setErrorMsg(res.error || "Không thể gửi email xác thực lúc này. Vui lòng thử lại sau.");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card p-3 sm:p-4 text-xs shadow-xs animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-foreground">
              Tài khoản của bạn chưa xác thực địa chỉ email ({user.email})
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Xác thực email để bảo vệ tài khoản, kích hoạt đầy đủ tính năng và nhận báo cáo chấm thi Nói/Viết chi tiết từ Giảng viên.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {successMsg ? (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang gửi...</span>
                </>
              ) : cooldown > 0 ? (
                <span>Gửi lại sau {cooldown}s</span>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gửi lại email xác thực</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Tạm ẩn thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      {errorMsg && (
        <p className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
}
