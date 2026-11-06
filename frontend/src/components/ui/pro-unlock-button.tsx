"use client";

import React from "react";
import Link from "next/link";
import { Lock } from "lucide-react";

export interface ProUnlockButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  href?: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Standardized Pro / VIP Unlock Button across the whole platform.
 * Replaces ad-hoc, inconsistent button styles (such as hardcoded black backgrounds)
 * with a unified, polished amber aesthetic.
 */
export function ProUnlockButton({
  onClick,
  href,
  label = "Mở khóa",
  className = "",
  size = "md",
}: ProUnlockButtonProps) {
  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-[11px] gap-1"
      : "px-4 py-2 text-xs gap-1.5";

  const baseClasses = `inline-flex items-center justify-center rounded-xl border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 transition-colors cursor-pointer shadow-2xs shrink-0 ${sizeClasses} ${className}`;

  const defaultHandler = (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
      return;
    }
    alert("Đề này thuộc gói Pro. Bạn có thể luyện tập đề Free hoàn toàn miễn phí!");
  };

  if (href) {
    return (
      <Link href={href} className={baseClasses} onClick={onClick}>
        <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={defaultHandler} className={baseClasses}>
      <Lock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
      <span>{label}</span>
    </button>
  );
}

export default ProUnlockButton;

