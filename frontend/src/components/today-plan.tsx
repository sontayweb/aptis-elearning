import Link from "next/link";
import { TrendingDown, RotateCcw, SpellCheck, ChevronRight, Zap } from "lucide-react";

export function TodayPlan() {
  const tasks = [
    {
      icon: TrendingDown,
      title: "Reading Part 3 đang là phần yếu nhất",
      desc: "5 lượt làm gần đây trung bình 45%, thấp hơn đáng kể so với các part khác",
      linkLabel: "Luyện Reading Part 3",
      to: "/reading?part=3",
      iconColor: "text-primary",
      iconBg: "bg-primary/10",
    },
    {
      icon: RotateCcw,
      title: "12 câu sai đang chờ ôn tập",
      desc: "Các câu hỏi Reading & Grammar bạn đã chọn sai trong tuần này",
      linkLabel: "Ôn lại câu sai",
      to: "/grammar?filter=wrong",
      iconColor: "text-warning",
      iconBg: "bg-warning/10",
    },
    {
      icon: SpellCheck,
      title: "Lỗi thì quá khứ đơn (Past Simple) lặp 4 lần",
      desc: "Phát hiện trong 3 bài Writing Task 2 gần đây được AI chấm",
      linkLabel: "Luyện ngữ pháp chuyên đề",
      to: "/grammar?topic=past-simple",
      iconColor: "text-accent",
      iconBg: "bg-accent/10",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Zap className="h-4 w-4" />
        </div>
        <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground">
          Hôm nay nên làm
        </h3>
      </div>
      <p className="text-xs md:text-sm text-muted-foreground mb-4">
        Đề xuất tự động từ hệ thống AI dựa trên kết quả ôn tập gần đây của bạn
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {tasks.map((task, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-xl border border-border bg-background/50 p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${task.iconBg} ${task.iconColor}`}
              >
                <task.icon className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-xs md:text-sm text-foreground leading-snug">
                  {task.title}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {task.desc}
                </p>
              </div>
            </div>

            <Link
              href={task.to}
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline pt-2 border-t border-border/50"
            >
              <span>{task.linkLabel}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
