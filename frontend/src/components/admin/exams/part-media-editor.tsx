"use client";

import React, { useState, useEffect } from "react";
import { Image, Volume2, Split, Eye, FileText, Sparkles } from "lucide-react";
import ImageUploadInput from "@/components/admin/image-upload-input";

interface PartMediaEditorProps {
  partTitle: string;
  skill: string;
  partNumber: number;
  instructions: string;
  passageText: string;
  audioUrl: string;
  imageUrl: string;
  onChange: (fields: {
    instructions?: string;
    passageText?: string;
    audioUrl?: string;
    imageUrl?: string;
  }) => void;
}

export const PartMediaEditor: React.FC<PartMediaEditorProps> = ({
  partTitle,
  skill,
  partNumber,
  instructions,
  passageText,
  audioUrl,
  imageUrl,
  onChange,
}) => {
  // Helper parse danh sách URL ảnh (hỗ trợ cả JSON array '["url1","url2"]' và chuỗi phân tách dấu phẩy)
  const parseImageUrls = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    const trimmed = raw.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((u) => String(u).trim()).filter(Boolean);
        }
      } catch {}
    }
    return trimmed
      .split(",")
      .map((s) => s.replace(/^[\["']+|[\]"']+$/g, "").trim())
      .filter(Boolean);
  };

  // Kiểm tra nếu là Speaking Part 3 (so sánh 2 tranh) hoặc có từ 2 ảnh trở lên
  const parsedInitialImages = parseImageUrls(imageUrl);
  const isSpeakingPart3 =
    skill === "SPEAKING" &&
    (partNumber === 3 ||
      (partTitle || "").toLowerCase().includes("part 3") ||
      (partTitle || "").toLowerCase().includes("compare"));
  const hasMultipleImages = parsedInitialImages.length > 1;

  const [isDualImageMode, setIsDualImageMode] = useState(
    isSpeakingPart3 || hasMultipleImages
  );

  // Tách 2 ảnh nếu có
  const [img1, setImg1] = useState(parsedInitialImages[0] || "");
  const [img2, setImg2] = useState(parsedInitialImages[1] || "");

  useEffect(() => {
    const parts = parseImageUrls(imageUrl);
    setImg1(parts[0] || "");
    setImg2(parts[1] || "");
    if (isSpeakingPart3 || parts.length > 1) {
      setIsDualImageMode(true);
    }
  }, [imageUrl, isSpeakingPart3]);

  const formatDualOutput = (u1: string, u2: string) => {
    const list = [u1.trim(), u2.trim()].filter(Boolean);
    if (list.length === 0) return "";
    if (list.length === 1) return list[0];
    return JSON.stringify(list);
  };

  const handleImg1Change = (url: string) => {
    setImg1(url);
    if (isDualImageMode) {
      onChange({ imageUrl: formatDualOutput(url, img2) });
    } else {
      onChange({ imageUrl: url.trim() });
    }
  };

  const handleImg2Change = (url: string) => {
    setImg2(url);
    onChange({ imageUrl: formatDualOutput(img1, url) });
  };

  const toggleDualMode = (enable: boolean) => {
    setIsDualImageMode(enable);
    if (enable) {
      onChange({ imageUrl: formatDualOutput(img1, img2) });
    } else {
      onChange({ imageUrl: img1.trim() });
    }
  };

  const lc = "block font-heading font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs";
  const ic = "w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-xs";

  return (
    <div className="space-y-4 pt-1">
      {/* Hướng dẫn bài thi (Instructions) */}
      <div>
        <label className={lc}>Hướng dẫn làm bài (Instructions cho học viên)</label>
        <textarea
          rows={2}
          className={ic + " resize-none"}
          placeholder="VD: In this part, you will look at two pictures and answer three questions..."
          value={instructions || ""}
          onChange={(e) => onChange({ instructions: e.target.value })}
        />
      </div>

      {/* Bài đọc / Ngữ cảnh đoạn văn */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={lc}>Bài đọc / Ngữ cảnh đoạn văn (Passage text)</label>
          {passageText && (
            <span className="text-[10px] text-slate-400 font-mono">
              ~{passageText.trim().split(/\s+/).filter(Boolean).length} từ
            </span>
          )}
        </div>
        <textarea
          rows={5}
          className={ic + " font-sans leading-relaxed resize-none"}
          placeholder="Nhập nội dung bài đọc Reading, hoặc ngữ cảnh đề bài..."
          value={passageText || ""}
          onChange={(e) => onChange({ passageText: e.target.value })}
        />
      </div>

      {/* File Audio (Listening) */}
      {(skill === "LISTENING" || skill === "FULL_TEST" || audioUrl) && (
        <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 space-y-2">
          <div className="flex items-center gap-2 text-sky-800 dark:text-sky-300 font-bold text-xs">
            <Volume2 className="w-4 h-4" />
            <span>Âm thanh Part (Listening Audio)</span>
          </div>
          <input
            type="text"
            className={ic + " font-mono text-[11px]"}
            placeholder="https://... /uploads/audio/..."
            value={audioUrl || ""}
            onChange={(e) => onChange({ audioUrl: e.target.value })}
          />
          {audioUrl && (
            <div className="mt-1 pt-2 border-t border-sky-100 dark:border-sky-900/40 flex items-center gap-3">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold shrink-0">Nghe thử:</span>
              <audio controls className="w-full h-8" src={audioUrl} />
            </div>
          )}
        </div>
      )}

      {/* Tranh ảnh minh họa (Speaking & Reading) */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs">
            <Image className="w-4 h-4 text-rose-500" />
            <span>Hình ảnh minh họa đề bài ({skill === "SPEAKING" ? "Speaking" : "Reading/Exam"})</span>
          </div>

          {/* Toggle chế độ 2 tranh so sánh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toggleDualMode(!isDualImageMode)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                isDualImageMode
                  ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <Split className="w-3 h-3" />
              <span>{isDualImageMode ? "Đang bật: 2 tranh so sánh (Part 3)" : "Chuyển sang 2 tranh so sánh"}</span>
            </button>
          </div>
        </div>

        {isDualImageMode ? (
          /* Chế độ 2 tranh so sánh (Speaking Part 3) */
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block mb-1.5">
                  🖼️ Bức tranh 1 (Ảnh bên trái)
                </span>
                <ImageUploadInput
                  value={img1}
                  onChange={handleImg1Change}
                  category={skill.toLowerCase()}
                  helperText="Tải lên hoặc dán link ảnh 1"
                />
              </div>

              <div className="p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/40 bg-rose-50/30 dark:bg-rose-950/20">
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 block mb-1.5">
                  🖼️ Bức tranh 2 (Ảnh bên phải)
                </span>
                <ImageUploadInput
                  value={img2}
                  onChange={handleImg2Change}
                  category={skill.toLowerCase()}
                  helperText="Tải lên hoặc dán link ảnh 2"
                />
              </div>
            </div>

            {/* Trực quan hóa đối chiếu 2 tranh giống màn hình học viên */}
            {(img1 || img2) && (
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem trước hiển thị ở phòng thi học viên (Speaking Part 3):</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {img1 ? (
                      <img src={img1} alt="Tranh 1" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Chưa có ảnh 1</span>
                    )}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                      Picture 1
                    </span>
                  </div>
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {img2 ? (
                      <img src={img2} alt="Tranh 2" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-500 font-mono">Chưa có ảnh 2</span>
                    )}
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                      Picture 2
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Chế độ 1 tranh đơn thông thường */
          <div>
            <ImageUploadInput
              value={imageUrl || ""}
              onChange={(url) => onChange({ imageUrl: url })}
              category={skill.toLowerCase()}
              helperText="Ảnh hiển thị trong bài thi (VD: tranh miêu tả Speaking Part 2, tranh ngữ cảnh)."
            />
          </div>
        )}
      </div>
    </div>
  );
};
