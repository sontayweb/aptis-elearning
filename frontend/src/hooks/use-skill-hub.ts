"use client";

import { useState, useEffect, useRef } from "react";

export type SkillTabId = "full" | "p1" | "p2" | "p3" | "p4";

const VALID_TABS: SkillTabId[] = ["full", "p1", "p2", "p3", "p4"];

export function useSkillHubTabSync(skillKey: "listening" | "reading" | "writing" | "speaking") {
  const storageKey = `${skillKey}_active_tab`;
  const [activeTab, setActiveTab] = useState<SkillTabId>("full");
  const isTabHydrated = useRef(false);

  // Sync activeTab changes to sessionStorage and URL query
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isTabHydrated.current) {
      isTabHydrated.current = true;
      return;
    }
    sessionStorage.setItem(storageKey, activeTab);
    try {
      const url = new URL(window.location.href);
      if (activeTab !== "full") url.searchParams.set("tab", activeTab);
      else url.searchParams.delete("tab");
      window.history.replaceState({}, "", url.toString());
    } catch {}
  }, [activeTab, storageKey]);

  // Initial URL/sessionStorage hydration + custom event listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as SkillTabId | null;
      if (tabParam && VALID_TABS.includes(tabParam)) {
        setActiveTab(tabParam);
        sessionStorage.setItem(storageKey, tabParam);
        setTimeout(() => {
          const el = document.getElementById("practice-sets-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      } else {
        const saved = sessionStorage.getItem(storageKey) as SkillTabId | null;
        if (saved && VALID_TABS.includes(saved)) {
          setActiveTab(saved);
        }
      }
    };

    syncTabFromUrl();

    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<{ skill: string; tab: string }>;
      if (
        customEvent.detail &&
        (customEvent.detail.skill === skillKey || !customEvent.detail.skill)
      ) {
        const targetTab = customEvent.detail.tab as SkillTabId;
        if (VALID_TABS.includes(targetTab)) {
          setActiveTab(targetTab);
        }
      }
    };

    window.addEventListener("aptis:switch-skill-tab", handleSwitchTab);
    window.addEventListener("popstate", syncTabFromUrl);

    return () => {
      window.removeEventListener("aptis:switch-skill-tab", handleSwitchTab);
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, [skillKey, storageKey]);

  const selectTab = (tabId: SkillTabId) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("tab", tabId);
        window.history.pushState({}, "", url.toString());
      } catch {}
    }
  };

  return { activeTab, setActiveTab, selectTab };
}

