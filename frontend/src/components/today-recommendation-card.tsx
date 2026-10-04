"use client";

import Link from "next/link";
import { TrendingDown, RotateCcw, ArrowRight } from "lucide-react";

interface TodayRecommendationData {
  weakestPartTitle?: string;
  weakestPartSubtitle?: string;
  weakestPartLink?: string;
  weakestPartButtonText?: string;
  wrongQuestionsCount?: number;
  wrongQuestionsDetail?: string;
  wrongQuestionsLink?: string;
}

interface TodayRecommendationCardProps {
  data?: TodayRecommendationData;
  weakestPartTitle?: string;
  weakestPartSubtitle?: string;
  weakestPartLink?: string;
  weakestPartButtonText?: string;
  wrongQuestionsCount?: number;
  wrongQuestionsDetail?: string;
  wrongQuestionsLink?: string;
}

export function TodayRecommendationCard({
  data,
  ...props
}: TodayRecommendationCardProps) {
  const weakestPartTitle =
    data?.weakestPartTitle ?? props.weakestPartTitle ?? "Làm 1 bài thi thử Full Test trước";
  const weakestPartSubtitle =
    data?.weakestPartSubtitle ??
    props.weakestPartSubtitle ??
    "Biết chính xác trình độ A2, B1 hay B2 của bạn để nhận lộ trình chuẩn";
  const weakestPartLink = data?.weakestPartLink ?? props.weakestPartLink ?? "/thi-thu";
  const weakestPartButtonText =
    data?.weakestPartButtonText ?? props.weakestPartButtonText ?? "Vào thi thử ngay";
  const wrongQuestionsCount = data?.wrongQuestionsCount ?? props.wrongQuestionsCount ?? 0;
  const wrongQuestionsDetail =
    data?.wrongQuestionsDetail ??
    props.wrongQuestionsDetail ??
    "Chưa có câu sai nào đang chờ ôn!";
  const wrongQuestionsLink = data?.wrongQuestionsLink ?? props.wrongQuestionsLink ?? "/thi-thu";
  return (
    <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-xs">
      <h3 className="font-heading font-extrabold text-base md:text-lg text-foreground">
        ⚡ Hôm nay nên làm
      </h3>
      <p className="text-sm text-muted-foreground mt-0.5">
        Gợi ý dựa trên lịch sử ôn tập của bạn
      </p>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Recommendation 1: Weakest Part */}
        <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground line-clamp-1">
              {weakestPartTitle}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {weakestPartSubtitle}
            </p>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-1.5 hover:underline"
              href={weakestPartLink}
              data-discover="true"
            >
              <span>{weakestPartButtonText}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Recommendation 2: Wrong Questions to Review */}
        <div className="flex gap-3 rounded-xl border border-border bg-background/50 p-3 hover:border-primary/40 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <RotateCcw className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-foreground">
              {wrongQuestionsCount} câu sai đang chờ ôn
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {wrongQuestionsDetail}
            </p>
            <Link
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-1.5 hover:underline"
              href={wrongQuestionsLink}
              data-discover="true"
            >
              <span>Ôn câu sai</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
