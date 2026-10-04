import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";

export function RoadmapBanner() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-4 md:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-extrabold text-foreground text-base md:text-lg leading-tight">
            Lần đầu vào web, chưa biết học thế nào?
          </h3>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Xem ngay hướng dẫn lộ trình học trên APTIS ESOL PREMIER — có video ngắn và các bước nên làm theo thứ tự.
          </p>
        </div>
        <Link
          className="tech-btn inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-primary/40 text-primary hover:bg-primary/10 bg-background h-10 px-4 py-2 shrink-0 font-bold gap-1.5 shadow-xs"
          href="/meo-thi-aptis/huong-dan-hoc-tren-aptis-ky-tich-cho-nguoi-moi"
          data-discover="true"
        >
          <span>Xem hướng dẫn</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
