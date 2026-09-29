import Link from "next/link";
import { History, ChevronRight, CheckCircle2 } from "lucide-react";

export function RecentTests() {
  const tests = [
    {
      id: "test-1",
      title: "Full Test Mock Exam 05 (4 Kỹ Năng)",
      date: "Hôm nay, 14:30",
      skill: "Full Test",
      score: "168/200",
      band: "B2",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
    },
    {
      id: "test-2",
      title: "Reading Part 4 - Extended Reading Text",
      date: "Hôm qua, 20:15",
      skill: "Reading",
      score: "42/50",
      band: "B2",
      badgeColor: "bg-info/10 text-info border-info/20",
    },
    {
      id: "test-3",
      title: "Writing Task 2 - Informal Email & Formal Response",
      date: "22/09, 09:40",
      skill: "Writing (AI)",
      score: "38/50",
      band: "B1",
      badgeColor: "bg-success/10 text-success border-success/20",
    },
    {
      id: "test-4",
      title: "Listening Part 1 - Information Identification",
      date: "21/09, 16:10",
      skill: "Listening",
      score: "46/50",
      band: "C1",
      badgeColor: "bg-warning/10 text-warning border-warning/20",
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <History className="h-4 w-4" />
          </div>
          <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground">
            Lịch sử làm bài gần đây
          </h3>
        </div>
        <Link
          href="/history"
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          <span>Xem tất cả</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-border/60">
        {tests.map((t) => (
          <div
            key={t.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0 hover:bg-muted/30 px-2 rounded-xl transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${t.badgeColor}`}
                  >
                    {t.skill}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{t.date}</span>
                </div>
                <h4 className="text-xs md:text-sm font-semibold text-foreground mt-0.5">
                  {t.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 pl-11 sm:pl-0">
              <div className="text-right">
                <div className="text-xs font-bold text-foreground">{t.score}</div>
                <div className="text-[10px] text-muted-foreground">
                  Band đạt: <strong className="text-accent">{t.band}</strong>
                </div>
              </div>
              <Link
                href={`/history/${t.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Xem lại</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
