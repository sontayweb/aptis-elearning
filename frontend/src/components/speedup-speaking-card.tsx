import Link from "next/link";
import { Mic, ArrowRight } from "lucide-react";

export function SpeedupSpeakingCard() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-red p-6 overflow-hidden relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
        style={{ background: "var(--gradient-radial-red)" }}
      />
      <div className="relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-[#7a0f00] text-primary-foreground mb-3 shadow-glow-soft">
            <Mic className="w-5 h-5" />
          </div>
          <h2 className="font-heading font-extrabold text-foreground mb-1">
            Tăng tốc Speaking
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            AI PREMIER chấm + feedback chi tiết. Chỉ 12 phút mỗi ngày.
          </p>
          <Link
            className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-glow-red hover:bg-primary-glow hover:shadow-glow-red transition-all duration-300 hover:-translate-y-0.5 h-9 rounded-md px-3 w-full"
            href="/speaking"
            data-discover="true"
          >
            <span>Luyện Speaking</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
