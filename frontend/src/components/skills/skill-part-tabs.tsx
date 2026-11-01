"use client";

import React from "react";
import type { SkillTabId } from "@/hooks/use-skill-hub";

export interface SkillPartTabItem {
  id: SkillTabId;
  label: string;
  sub?: string;
}

interface SkillPartTabsProps {
  tabs: SkillPartTabItem[];
  activeTab: SkillTabId;
  onSelectTab: (tabId: SkillTabId) => void;
}

export function SkillPartTabs({
  tabs,
  activeTab,
  onSelectTab,
}: SkillPartTabsProps) {
  return (
    <div className="inline-flex items-center justify-center rounded-xl text-muted-foreground w-full h-auto flex-wrap gap-1.5 bg-muted/50 p-1.5 mb-6 border border-border/60">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`inline-flex items-center justify-center rounded-xl px-3.5 font-semibold flex-1 min-w-[130px] text-xs sm:text-sm py-2.5 transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md font-bold"
                : "hover:text-foreground hover:bg-card/70"
            }`}
          >
            <span className="font-bold">{tab.label}</span>
            {tab.sub && (
              <span className="hidden lg:inline ml-1 opacity-85 font-medium">
                – {tab.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

