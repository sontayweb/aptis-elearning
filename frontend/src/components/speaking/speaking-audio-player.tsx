"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Volume2, Play, Pause } from "lucide-react";

interface SpeakingAudioPlayerProps {
  src: string | null;
  duration?: number;
}

export function SpeakingAudioPlayer({ src, duration }: SpeakingAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);

  // Fix triệt để Chromium WebM Duration Bug (WebM blob không có duration header khiến Chrome báo Infinity)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsPlaying(false);
    setCurrentTime(0);

    const handleLoadedMetadata = () => {
      if (audio.duration === Infinity) {
        audio.currentTime = 1e101;
        audio.ontimeupdate = () => {
          audio.ontimeupdate = null;
          audio.currentTime = 0;
          if (isFinite(audio.duration) && audio.duration > 0) {
            setAudioDuration(audio.duration);
          }
        };
      } else if (isFinite(audio.duration) && audio.duration > 0) {
        setAudioDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [src]);

  const totalDuration = useMemo(() => {
    if (duration && duration > 0) return duration;
    if (isFinite(audioDuration) && audioDuration > 0) return audioDuration;
    return 0;
  }, [duration, audioDuration]);

  // Cập nhật currentTime mượt mà 60fps khi đang phát (loại bỏ hoàn toàn hiện tượng giật cục)
  useEffect(() => {
    let animId: number;
    const updateLoop = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animId = requestAnimationFrame(updateLoop);
      }
    };
    if (isPlaying) {
      animId = requestAnimationFrame(updateLoop);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || totalDuration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = clickRatio * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, "0")}`;
  };

  const progressPercent =
    totalDuration > 0
      ? Math.min(100, Math.max(0, (currentTime / totalDuration) * 100))
      : 0;

  return (
    <div className="w-full p-2.5 rounded-xl bg-muted/40 border border-border flex items-center gap-2.5 shadow-2xs">
      <audio
        ref={audioRef}
        src={src || undefined}
        onEnded={handleEnded}
        preload="metadata"
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 transition-transform active:scale-95 shadow-xs cursor-pointer"
        title={isPlaying ? "Tạm dừng" : "Nghe lại bài nói"}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
      </button>

      <span className="text-[11px] font-mono text-foreground font-semibold shrink-0 min-w-[32px] text-right">
        {formatTime(currentTime)}
      </span>

      <div
        role="progressbar"
        aria-valuenow={Math.round(progressPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        onClick={handleSeek}
        className="flex-1 h-2 bg-muted-foreground/20 hover:h-2.5 rounded-full overflow-hidden cursor-pointer relative transition-all group"
        title="Nhấp để tua nhanh / chậm"
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-75"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <span className="text-[11px] font-mono text-muted-foreground shrink-0 min-w-[32px]">
        {formatTime(totalDuration)}
      </span>

      <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0 hidden sm:block" />
    </div>
  );
}
