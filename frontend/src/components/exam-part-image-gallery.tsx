"use client";

import { useState } from "react";
import { parsePartImages } from "@/lib/media-utils";
import { ExternalLink, Maximize2, X } from "lucide-react";

interface ExamPartImageGalleryProps {
  imageUrl?: string | null;
  title?: string;
  variant?: "admin-preview" | "exam-room" | "card-thumbnail";
  className?: string;
}

export function ExamPartImageGallery({
  imageUrl,
  title,
  variant = "exam-room",
  className = "",
}: ExamPartImageGalleryProps) {
  const images = parsePartImages(imageUrl);
  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);

  if (images.length === 0) return null;

  // -------------------------------------------------------------------------
  // 1. ADMIN PREVIEW VARIANT (Hiển thị trong Danh sách Câu hỏi Admin)
  // -------------------------------------------------------------------------
  if (variant === "admin-preview") {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 ${className}`}
      >
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {images.map((src, idx) => (
            <div key={idx} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={images.length > 1 ? `Tranh ${idx + 1}` : "Tranh minh họa"}
                className="h-16 w-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs shrink-0 bg-slate-100 dark:bg-slate-900 cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setActiveModalImage(src)}
              />
              {images.length > 1 && (
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/75 text-white text-[9px] font-bold rounded shadow-xs">
                  #{idx + 1}
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="min-w-0 flex-1 text-xs">
          <span className="font-heading font-bold text-slate-800 dark:text-slate-200 block text-[11px] mb-0.5">
            🖼️ Tranh ảnh minh họa {title ? `(${title})` : ""}
            {images.length > 1 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Cặp 2 tranh đối chiếu
              </span>
            )}:
          </span>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
            {images.map((src, idx) => (
              <a
                key={idx}
                href={src}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1 font-semibold"
              >
                <span>{images.length > 1 ? `Xem tranh ${idx + 1}` : "Xem ảnh gốc"}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            ))}
          </div>
        </div>

        {/* Modal phóng to ảnh */}
        {activeModalImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setActiveModalImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModalImage}
                alt="Enlarged preview"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setActiveModalImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 2. CARD THUMBNAIL VARIANT (Hiển thị thẻ bài thi Speaking Marathon)
  // -------------------------------------------------------------------------
  if (variant === "card-thumbnail") {
    if (images.length >= 2) {
      return (
        <div className={`grid grid-cols-2 h-full w-full ${className}`}>
          <div className="relative h-full overflow-hidden border-r border-border/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt="Picture 1"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px] backdrop-blur-xs">
              Picture 1
            </span>
          </div>
          <div className="relative h-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[1]}
              alt="Picture 2"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white font-bold text-[9px] backdrop-blur-xs">
              Picture 2
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full h-full overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt={title || "Topic image"}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // 3. EXAM ROOM VARIANT (Hiển thị trong Phòng thi Speaking & Thi Thử 162p)
  // -------------------------------------------------------------------------
  if (images.length >= 2) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.slice(0, 2).map((src, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Picture ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                onClick={() => setActiveModalImage(src)}
              />
              <span className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 text-white font-bold text-xs backdrop-blur-xs shadow-xs">
                Picture {idx + 1}
              </span>
              <button
                type="button"
                onClick={() => setActiveModalImage(src)}
                className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="Phóng to ảnh"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Modal phóng to */}
        {activeModalImage && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setActiveModalImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeModalImage}
                alt="Enlarged preview"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              />
              <button
                type="button"
                onClick={() => setActiveModalImage(null)}
                className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Đơn tranh
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-border bg-muted/20 aspect-[16/10] shadow-sm group ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[0]}
        alt={title || "Speaking Prompt Image"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
        onClick={() => setActiveModalImage(images[0])}
      />
      <button
        type="button"
        onClick={() => setActiveModalImage(images[0])}
        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
        title="Phóng to ảnh"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* Modal phóng to */}
      {activeModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setActiveModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeModalImage}
              alt="Enlarged preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setActiveModalImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
