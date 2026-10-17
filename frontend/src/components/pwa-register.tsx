"use client";

import { useEffect, useState } from "react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker in production / supported environments
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register after page is fully loaded to avoid competing for bandwidth
      const handleLoad = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            // Check for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // New content available, automatically activate or notify
                    installingWorker.postMessage({ type: "SKIP_WAITING" });
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.debug("[PWA] Service Worker registration skipped or failed:", err);
          });
      };

      window.addEventListener("load", handleLoad);

      // 2. Listen for PWA Install Prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setIsInstallable(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

      // Check if already in standalone mode
      if (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true
      ) {
        setIsInstallable(false);
      }

      return () => {
        window.removeEventListener("load", handleLoad);
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // If user dismissed or not installable, don't show the prompt bar
  if (!isInstallable || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-red-500/30 text-white rounded-2xl p-4 shadow-2xl shadow-black/50 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center font-bold text-white shadow-md shrink-0">
            A
          </div>
          <div className="text-left">
            <div className="text-xs font-semibold text-red-400">Ứng dụng di động</div>
            <div className="text-sm font-bold text-slate-100">Cài đặt Aptis Premier</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            title="Bỏ qua"
          >
            ✕
          </button>
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all shrink-0 active:scale-95"
          >
            Cài đặt
          </button>
        </div>
      </div>
    </div>
  );
}
