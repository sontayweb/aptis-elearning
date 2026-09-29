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
          className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-brand-brown h-10 px-4 py-2 shrink-0"
          href="/thi-thu"
          data-discover="true"
        >
          Vào thi thử
        </Link>
      </div>
    </div>
  );
}
