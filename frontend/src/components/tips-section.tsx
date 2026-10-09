import Link from "next/link";
import { BookOpen, Sparkles, ArrowRight, Clock, Bookmark } from "lucide-react";

interface ArticleItem {
  id: string;
  title: string;
  category: string;
  categoryColor: string;
  readTime: string;
  href: string;
  desc: string;
}

const articles: ArticleItem[] = [
  {
    id: "guide-beginner",
    title: "Hướng dẫn sử dụng APTIS ESOL PREMIER cho người mới bắt đầu",
    category: "Cẩm nang",
    categoryColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    readTime: "3 phút đọc",
    href: "/meo-thi-aptis",
    desc: "Lộ trình ôn tập tối ưu 4 kỹ năng và cách khai thác tối đa kho đề thi thử chuẩn format British Council.",
  },
  {
    id: "reading-strategy",
    title: "Mẹo học & Chiến thuật Reading Aptis đạt Band B2 - C",
    category: "Chiến thuật",
    categoryColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    readTime: "5 phút đọc",
    href: "/meo-thi-aptis",
    desc: "Bí quyết xử lý dạng bài Text Cohesion và Matching Paragraph Headings không lo thiếu thời gian.",
  },
  {
    id: "grammar-vocab-tricks",
    title: "Bí kíp làm bài Grammar & Vocabulary chuẩn 45+ điểm",
    category: "Ngữ pháp",
    categoryColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    readTime: "4 phút đọc",
    href: "/meo-thi-aptis",
    desc: "Tổng hợp các bẫy ngữ pháp thường gặp: đảo ngữ, câu điều kiện hỗn hợp và cụm collocations điểm cao.",
  },
];

export function TipsSection() {
  return (
    <section className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-md p-5 sm:p-6 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-5 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-heading font-black text-base sm:text-lg text-foreground tracking-tight flex items-center gap-2">
              <span>Cẩm nang &amp; Mẹo thi Aptis ESOL</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                <span>Thực chiến</span>
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Chiến thuật làm bài và kinh nghiệm bứt phá Band từ giảng viên
            </p>
          </div>
        </div>

        <Link
          href="/meo-thi-aptis"
          className="text-xs font-bold text-primary hover:text-primary-glow inline-flex items-center gap-1 group self-start sm:self-auto"
        >
          <span>Xem tất cả bí kíp</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Grid 3 Articles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {articles.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group flex flex-col justify-between p-4 rounded-xl border border-border/70 bg-background/50 hover:bg-background/90 hover:border-primary/40 hover:shadow-sm transition-all duration-200"
          >
            <div>
              {/* Category & Read Time */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${item.categoryColor}`}
                >
                  {item.category}
                </span>
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{item.readTime}</span>
                </span>
              </div>

              {/* Title */}
              <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                {item.title}
              </h4>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                {item.desc}
              </p>
            </div>

            {/* Read more CTA link */}
            <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[11px] font-semibold text-primary">
              <span className="group-hover:underline">Đọc bài viết</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
