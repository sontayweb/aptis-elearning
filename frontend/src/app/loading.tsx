import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Skeleton Content */}
      <main className="flex-1 pt-20 md:pt-24 pb-20">
        <div className="section-container space-y-6">
          {/* 1. Hero Banner Skeleton */}
          <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 md:p-8 animate-pulse">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
              <div className="space-y-3">
                <div className="h-6 w-28 rounded-full bg-muted/80" />
                <div className="h-9 md:h-10 w-72 md:w-96 rounded-xl bg-muted/90" />
                <div className="h-4 w-60 md:w-80 rounded-lg bg-muted/60" />
              </div>
              <div className="h-11 w-36 rounded-md bg-muted/80 shrink-0" />
            </div>

            {/* 6 Metric Cards Skeleton inside Hero Banner */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3.5 rounded-2xl border border-border/60 bg-muted/40 px-4 py-4"
                >
                  <div className="h-12 w-12 rounded-2xl bg-muted/80 shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="h-3 w-14 rounded bg-muted/70" />
                    <div className="h-5 w-10 rounded bg-muted/90" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Middle Row Action Cards Skeleton (5 cards / steps) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-2xl border border-border/60 bg-card/60 p-4 flex flex-col justify-between"
              >
                <div className="h-4 w-2/3 rounded bg-muted/80" />
                <div className="h-3 w-full rounded bg-muted/50" />
              </div>
            ))}
          </div>

          {/* 3. Bottom 2-Column Layout Skeleton */}
          <div className="grid lg:grid-cols-3 gap-6 animate-pulse">
            {/* Left 2 Cols */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-5 w-44 rounded bg-muted/80" />
                  <div className="h-3 w-64 rounded bg-muted/60" />
                </div>
                <div className="h-32 rounded-xl bg-muted/40" />
              </div>

              <div className="h-56 rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between">
                <div className="h-5 w-40 rounded bg-muted/80" />
                <div className="h-28 rounded-xl bg-muted/40" />
              </div>
            </div>

            {/* Right 1 Col */}
            <div className="space-y-6">
              <div className="h-72 rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between">
                <div className="h-5 w-36 rounded bg-muted/80" />
                <div className="space-y-3">
                  <div className="h-10 rounded-xl bg-muted/50" />
                  <div className="h-10 rounded-xl bg-muted/50" />
                  <div className="h-10 rounded-xl bg-muted/50" />
                </div>
              </div>

              <div className="h-48 rounded-2xl border border-border/60 bg-card/60 p-6 flex flex-col justify-between">
                <div className="h-5 w-32 rounded bg-muted/80" />
                <div className="h-20 rounded-xl bg-muted/40" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating Action Buttons */}
      <FloatingActions />
    </div>
  );
}
