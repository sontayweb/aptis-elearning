import Link from "next/link";
import { BookOpen, FileText, ArrowRight } from "lucide-react";

const articles = [
  {
    title: "Hướng dẫn sử dụng APTIS ESOL PREMIER cho người mới",
    date: "16-09",
    href: "/meo-thi-aptis/huong-dan-hoc-tren-aptis-ky-tich-cho-nguoi-moi",
  },
  {
    title: "Mẹo học Reading Aptis",
    date: "09-07",
    href: "/meo-thi-aptis/meo-hoc-reading-aptis",
  },
  {
    title: "Mẹo học Grammar Aptis",
    date: "09-07",
    href: "/meo-thi-aptis/meo-hoc-grammar-aptis",
  },
];

export function TipsSection() {
  return (
    <div className="relative rounded-2xl border bg-card/80 backdrop-blur-sm shadow-md tech-card hover:border-primary/50 hover:shadow-glow-red p-6 border-accent/30">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-accent/15 border border-accent/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-accent" />
            </div>
            <h2 className="font-heading font-bold text-foreground">Blog - Mẹo</h2>
          </div>
          <Link
            className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1"
            href="/meo-thi-aptis"
            data-discover="true"
          >
            <span>Xem tất cả</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="space-y-2">
          {articles.map((item) => (
            <Link
              key={item.title}
              className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-primary/40 hover:bg-muted/50 transition-all"
              href={item.href}
              data-discover="true"
            >
              <div className="w-9 h-9 shrink-0 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.date}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
