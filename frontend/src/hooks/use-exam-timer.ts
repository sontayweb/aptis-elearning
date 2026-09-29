"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useExamTimer(initialSeconds: number, onExpire?: () => void, isRunning: boolean = true) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const syncTime = useCallback((serverSecondsRemaining: number) => {
    setSecondsLeft(serverSecondsRemaining);
    hasExpiredRef.current = false;
  }, []);

  useEffect(() => {
    if (initialSeconds > 0) {
      setSecondsLeft(initialSeconds);
      hasExpiredRef.current = false;
    }
  }, [initialSeconds]);

  useEffect(() => {
    if (!isRunning || secondsLeft <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!hasExpiredRef.current) {
            hasExpiredRef.current = true;
            onExpireRef.current?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, secondsLeft > 0]);

  const formatTime = (secs: number): string => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
    return `${pad(m)}:${pad(s)}`;
  };

  const isWarning = secondsLeft > 0 && secondsLeft <= 300;
  const isCritical = secondsLeft > 0 && secondsLeft <= 60;

  return { secondsLeft, formatted: formatTime(secondsLeft), isWarning, isCritical, syncTime };
}
