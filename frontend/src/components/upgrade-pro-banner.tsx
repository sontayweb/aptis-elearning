import Link from "next/link";
import { Crown } from "lucide-react";

export function UpgradeProBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-11 h-11 rounded-xl btn-brand-gradient flex items-center justify-center shrink-0 shadow-glow-soft">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-extrabold text-foreground text-base md:text-lg leading-tight">
            Nâng cấp Pro — mở toàn bộ kho đề + chấm AI không giới hạn
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Học không giới hạn Speaking/Writing AI, full đề thi thử &amp; luyện theo kỹ năng.
          </p>
        </div>
        <Link
          className="tech-btn inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2 shrink-0 btn-brand-gradient shadow-glow-soft font-bold gap-1.5"
          href="/pricing"
          data-discover="true"
        >
          <Crown className="w-4 h-4" />
          <span>Nâng cấp Pro</span>
        </Link>
      </div>
    </div>
  );
}
