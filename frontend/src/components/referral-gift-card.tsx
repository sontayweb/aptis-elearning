import Link from "next/link";
import { Gift, Sparkles, ArrowRight } from "lucide-react";

export function ReferralGiftCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-card/90 backdrop-blur-sm p-4 sm:p-5 shadow-sm hover:border-rose-500/50 hover:shadow-glow-soft transition-all duration-300">
      {/* Background soft glow decoration */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-heading font-black text-sm text-foreground leading-tight">
                Rủ bạn cùng ôn thi
              </h3>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                <span>+5 lượt AI</span>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
              Bạn giảm <span className="font-bold text-foreground">10%</span> gói học, bạn nhận thêm <span className="font-bold text-foreground">lượt chấm AI Speaking &amp; Writing</span> miễn phí.
            </p>
          </div>
        </div>

        <Link
          href="/gioi-thieu"
          className="mt-2 w-full h-9 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-95"
        >
          <span>Lấy mã giới thiệu ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
