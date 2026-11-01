"use client";

import Link from "next/link";
import {
  Headphones,
  ArrowLeft,
  ArrowRight,
  Volume2,
  Volume1,
  VolumeX,
  CheckCircle2,
  Pause,
  RotateCcw,
  Info,
} from "lucide-react";

interface SoundCheckScreenProps {
  title?: string;
  soundTested: boolean;
  isTestingSound: boolean;
  checkVolume: number;
  onTestSound: () => void;
  onVolumeChange: (volume: number) => void;
  onStart: () => void;
}

/** Màn hình kiểm tra âm thanh trước khi vào bài Listening (chống chặn Autoplay). */
export function SoundCheckScreen({
  title,
  soundTested,
  isTestingSound,
  checkVolume,
  onTestSound,
  onVolumeChange,
  onStart,
}: SoundCheckScreenProps) {
  return (
  <div className="min-h-screen flex flex-col bg-background text-foreground font-sans select-none">
    {/* Header Bar */}
    <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border px-4 md:px-8 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">
          <Headphones className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
            Aptis ESOL Listening
          </span>
          <span className="text-sm font-bold text-foreground">
            Chuẩn bị & Kiểm tra âm thanh
          </span>
        </div>
      </div>
      <Link
        href="/listening"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Danh sách đề</span>
      </Link>
    </header>

    {/* Content Container */}
    <main className="flex-1 py-8 px-4 flex items-center justify-center">
      <div className="w-full max-w-2xl bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in">
        {/* Title & Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
            <Headphones className="w-3.5 h-3.5" />
            <span>Listening Practice Test</span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-foreground">
            {title || "Bài luyện thi Aptis Listening"}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Vui lòng kiểm tra tai nghe hoặc loa trước khi bắt đầu để đảm bảo chất lượng bài thi.
          </p>
        </div>

        {/* Grid Specs: 4 Parts, 25 câu, 40 phút */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Số câu hỏi</div>
            <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5">25 câu (4 Phần)</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Thời gian</div>
            <div className="text-sm md:text-base font-extrabold text-foreground mt-0.5">40 phút</div>
          </div>
          <div className="p-3.5 rounded-xl border border-border bg-muted/20">
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Lượt nghe</div>
            <div className="text-sm md:text-base font-extrabold text-primary mt-0.5">Tối đa 2 lần / câu</div>
          </div>
        </div>

        {/* Card Sound Check & Volume Control */}
        <div className="p-5 rounded-2xl border-2 border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-bold text-foreground flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-primary" />
              <span>Kiểm tra thiết bị âm thanh (Sound Check)</span>
            </span>
            {soundTested && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Âm thanh rõ ràng!
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Bấm nút bên dưới để nghe thử đoạn audio mẫu bản ngữ Anh - Anh (British Council). Hãy kéo thanh âm lượng để chỉnh mức nghe thoải mái nhất.
          </p>

          {/* Audio Test Button & Volume Slider */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={onTestSound}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                isTestingSound
                  ? "bg-amber-600 text-white animate-pulse"
                  : soundTested
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isTestingSound ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Đang phát thử... (Bấm dừng)</span>
                </>
              ) : soundTested ? (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Nghe lại âm thanh</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Nghe thử âm thanh</span>
                </>
              )}
            </button>

            {/* Volume Slider */}
            <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-background border border-border">
              {checkVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : checkVolume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary shrink-0" />
              )}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={checkVolume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg cursor-pointer"
                title="Điều chỉnh âm lượng"
              />
              <span className="text-xs font-mono font-bold text-foreground w-10 text-right">
                {Math.round(checkVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Rules Notice */}
        <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-2 text-xs text-muted-foreground">
          <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
            <Info className="w-4 h-4 text-primary" />
            <span>Quy chế phòng thi & Hướng dẫn:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            <li>Mỗi câu hỏi audio được nghe tối đa <strong className="text-foreground">2 lần</strong>.</li>
            <li>Khi vào bài thi, đồng hồ <strong className="text-foreground">40 phút</strong> sẽ bắt đầu đếm ngược.</li>
            <li>Bạn có thể đọc lướt câu hỏi trước, sau đó tự bấm nút <strong className="text-primary">[ ▶ Phát Audio ]</strong> khi đã sẵn sàng nghe.</li>
            <li>Không chuyển tab trong khi làm bài để tránh mất tập trung và lỗi phát âm thanh.</li>
          </ul>
        </div>

        {/* Navigation CTA Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={onStart}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-black text-sm shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
          >
            <span>Bắt đầu làm bài</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onStart}
              className="text-xs text-muted-foreground hover:text-foreground font-medium underline underline-offset-4 cursor-pointer transition-colors"
            >
              Vào nhanh (Bỏ qua kiểm tra âm thanh)
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
  );
}
