import Link from "next/link";
import { Zap } from "lucide-react";

export function StartRightCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-extrabold text-base md:text-lg">
            Bắt đầu đúng cách
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Làm 1 bài thi thử full test trước để biết band hiện tại của bạn — rồi hãy đặt mục tiêu.
          </p>
        </div>
        <Link
          className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold ring-offset-background transition-all bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white hover:brightness-110 shadow-sm shadow-blue-500/20 h-10 px-5 shrink-0"
          href="/thi-thu"
          data-discover="true"
        >
          Vào thi thử
        </Link>
      </div>
    </div>
  );
}
