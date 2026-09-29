export function ExamListSkeleton({
  title = "Đang tải danh sách bài thi...",
  cardsCount = 6,
}: {
  title?: string;
  cardsCount?: number;
}) {
  return (
    <div className="section-container py-8 space-y-8 animate-pulse">
      {/* Top Search & Filter Tabs Skeleton */}
      <div className="space-y-4">
        {/* Search input placeholder */}
        <div className="h-11 w-full max-w-xl rounded-xl bg-muted/70" />

        {/* Filter buttons row */}
        <div className="flex flex-wrap gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-9 w-28 rounded-lg bg-muted/60" />
          ))}
        </div>
      </div>

      {/* Grid Exam Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(cardsCount)].map((_, i) => (
          <div
            key={i}
            className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4 shadow-sm"
          >
            {/* Header tags */}
            <div className="flex items-center justify-between">
              <div className="h-5 w-20 rounded-full bg-muted/80" />
              <div className="h-5 w-14 rounded-full bg-muted/60" />
            </div>

            {/* Exam Title & Subtitle */}
            <div className="space-y-2">
              <div className="h-6 w-3/4 rounded-lg bg-muted/90" />
              <div className="h-4 w-1/2 rounded bg-muted/50" />
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border/50">
              <div className="h-3 w-16 rounded bg-muted/60" />
              <div className="h-3 w-20 rounded bg-muted/60" />
            </div>

            {/* Action CTA Button */}
            <div className="h-10 w-full rounded-xl bg-muted/80 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
