import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export function HistoryEmptyCard() {
  return (
    <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-red p-6">
      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-bold text-foreground">Lịch sử học tập</h2>
          <Link
            className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1"
            href="/history"
            data-discover="true"
          >
            <span>Tất cả</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="text-center py-6">
          <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-3">
            <BookOpen className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm text-foreground font-medium mb-1">Chưa có kết quả</p>
          <p className="text-xs text-muted-foreground mb-4">
            Làm bài thi thử đầu tiên để đo trình độ.
          </p>
          <Link
            className="tech-btn inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-glow-red hover:bg-primary-glow hover:shadow-glow-red transition-all duration-300 hover:-translate-y-0.5 h-9 rounded-md px-3 w-full"
            href="/thi-thu"
            data-discover="true"
          >
            <span>Thi thử miễn phí</span>
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
