"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { getCloverConfig } from "@/lib/clover-utils";

/* ============================================================================
 * SKILL MARATHON / PRO CUSTOM ACTION CARD (CARD 1)
 * ============================================================================ */

export interface SkillMarathonCardProps {
  marathonType: "custom" | "marathon" | string;
  marathonText: string;
  marathonDesc: string;
  marathonBtn: string;
  marathonUrl?: string | null;
  onActionClick?: () => void;
}

export function SkillMarathonCard({
  marathonType,
  marathonText,
  marathonDesc,
  marathonBtn,
  marathonUrl,
  onActionClick,
}: SkillMarathonCardProps) {
  return (
    <div className="relative rounded-2xl border-2 border-primary/50 bg-card p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
      <div>
        <div className="flex items-center justify-between mb-3">
          {marathonType === "custom" ? (
            <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] uppercase">
              PRO
            </span>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground font-bold text-[10px]">
                ∞ Marathon
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                PRO
              </span>
            </div>
          )}
          {marathonType === "marathon" && (
            <span className="text-[11px] font-semibold text-muted-foreground">
              Chưa làm
            </span>
          )}
        </div>

        <h3 className="text-lg font-heading font-extrabold text-foreground mb-2">
          {marathonText}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {marathonDesc}
        </p>
      </div>

      <div className="pt-6 mt-4 border-t border-border/40">
        {marathonUrl ? (
          <Link
            href={marathonUrl}
            className="tech-btn block w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center cursor-pointer"
          >
            {marathonBtn}
          </Link>
        ) : (
          <button
            type="button"
            onClick={onActionClick}
            className="tech-btn w-full py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary-glow font-bold text-xs shadow-sm transition-all text-center cursor-pointer"
          >
            {marathonBtn}
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * SKILL EXAM CARD (CARD 2..N)
 * ============================================================================ */

export interface SkillExamCardProps {
  id: string;
  title: string;
  subtitle: string;
  partBadge: string;
  isFree: boolean;
  isProOrAdmin: boolean;
  cloverLevel?: number | null;
  extraBadge?: React.ReactNode;
  trophyText?: string | null;
  status: "not_started" | "in_progress" | "completed";
  completedParts?: number;
  totalParts?: number;
  targetUrl: string;
  onLockedClick?: () => void;
}

export function SkillExamCard({
  title,
  subtitle,
  partBadge,
  isFree,
  isProOrAdmin,
  cloverLevel,
  extraBadge,
  trophyText,
  status,
  completedParts,
  totalParts = 4,
  targetUrl,
  onLockedClick,
}: SkillExamCardProps) {
  const hotLvl = cloverLevel || 0;
  const borderClass =
    hotLvl >= 5
      ? "border-rose-500/40 shadow-rose-500/5 ring-1 ring-rose-500/20"
      : hotLvl === 4
      ? "border-amber-500/30 ring-1 ring-amber-500/20"
      : hotLvl === 3
      ? "border-blue-500/30 ring-1 ring-blue-500/20"
      : hotLvl > 0
      ? "border-emerald-500/30"
      : "border-border";

  const isCompleted =
    status === "completed" ||
    (completedParts !== undefined && completedParts >= totalParts);
  const isInProgress =
    !isCompleted &&
    (status === "in_progress" || (completedParts !== undefined && completedParts > 0));

  return (
    <div
      className={`relative rounded-2xl border bg-card hover:border-primary/50 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group ${borderClass}`}
    >
      <div>
        {/* Top Badges & Trophy */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-md border border-border bg-muted/50 text-muted-foreground font-bold text-[10px]">
              {partBadge}
            </span>
            {isFree ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                FREE
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                PRO
              </span>
            )}

            {extraBadge}

            {/* Clover ☘️ Sticker */}
            {hotLvl > 0 &&
              (() => {
                const cfg = getCloverConfig(hotLvl);
                return (
                  <span
                    className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] inline-flex items-center gap-1 border ${cfg.badgeClass}`}
                    title={`${hotLvl} Cỏ ☘️`}
                  >
                    <span>{cfg.symbol}</span>
                  </span>
                );
              })()}
          </div>

          {trophyText ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-black text-xs border border-amber-500/25 shadow-2xs shrink-0">
              🏆 {trophyText}
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-heading font-extrabold text-foreground mb-1.5 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Subtitle */}
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>

        {/* Progress Status */}
        <div className="pt-0.5 text-xs">
          {isCompleted ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {totalParts > 1
                  ? `Đã hoàn thành tất cả ${totalParts} Part`
                  : "Đã hoàn thành"}
              </span>
            </div>
          ) : isInProgress ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 text-xs font-semibold shadow-2xs">
              <span>
                Đã làm {completedParts || 1}/{totalParts} Part
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground font-medium block">
              Chưa bắt đầu
            </span>
          )}
        </div>
      </div>

      {/* Bottom Action CTA */}
      <div className="pt-6 mt-4 border-t border-border/40 flex items-center justify-end">
        {isFree || isProOrAdmin ? (
          <Link
            href={targetUrl}
            className="tech-btn inline-flex items-center justify-center whitespace-nowrap text-xs font-bold h-9 rounded-xl px-4 bg-primary text-primary-foreground hover:bg-primary-glow shadow-sm gap-1.5 group-hover:gap-2 transition-all cursor-pointer"
          >
            <span>{isInProgress ? "Tiếp tục luyện tập" : "Bắt đầu luyện tập"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={
              onLockedClick ||
              (() =>
                alert(
                  "Đề này thuộc gói Pro. Bạn có thể luyện tập đề Free hoàn toàn miễn phí!"
                ))
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-xs hover:bg-amber-500/10 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Mở khóa</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * SKILL EMPTY STATE
 * ============================================================================ */

interface SkillEmptyStateProps {
  icon: React.ReactNode;
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}

export function SkillEmptyState({
  icon,
  title = "Không tìm thấy đề thi phù hợp",
  description = "Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc ưu tiên/trạng thái.",
  onResetFilters,
}: SkillEmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center border border-dashed border-border rounded-2xl bg-card/50 space-y-3">
      <div className="mx-auto flex items-center justify-center text-muted-foreground opacity-50">
        {icon}
      </div>
      <div>
        <h3 className="font-heading font-bold text-base text-foreground">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      {onResetFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition-colors cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

