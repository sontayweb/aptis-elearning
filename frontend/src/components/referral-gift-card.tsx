import Link from "next/link";
import { Gift } from "lucide-react";

export function ReferralGiftCard() {
  return (
    <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-soft p-5">
      <div className="relative">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="font-heading font-bold text-sm text-foreground">
              Rủ bạn ôn cùng — bạn giảm 10%, bạn nhận 10%
            </p>
            <Link
              className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 btn-brand-gradient shadow-glow-soft hover:shadow-md h-9 rounded-xl px-4 mt-3"
              href="/gioi-thieu"
              data-discover="true"
            >
              Lấy mã
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
