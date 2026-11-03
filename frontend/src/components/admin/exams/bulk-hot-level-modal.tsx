"use client";

import React, { useState } from "react";
import { X, Zap, Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultSkill?: string;
  onDone: (message: string) => void;
}

const LEVELS = [5, 4, 3, 2, 1, 0] as const;

export const BulkHotLevelModal: React.FC<Props> = ({ isOpen, onClose, defaultSkill, onDone }) => {
  const [skill, setSkill] = useState<string>(defaultSkill && defaultSkill !== "ALL" ? defaultSkill : "READING");
  const [texts, setTexts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ updated: number; unmatched: string[] } | null>(null);

  if (!isOpen) return null;

  const parse = (t: string) =>
    (t || "")
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

  const handleApply = async () => {
    const rules = LEVELS.map((lv) => ({ hotLevel: lv, keywords: parse(texts[lv] || "") })).filter(
      (r) => r.keywords.length > 0
    );
    if (!rules.length) return;
    setLoading(true);
    try {
      const res = await api.admin.bulkUpdateHotLevel({ skill, rules });
      if (res.success) {
        setResult({ updated: res.data.updated, unmatched: res.data.unmatched });
        onDone(`Đã gán độ hot cho ${res.data.updated} đề`);
      } else {
        onDone(res.error?.message || "Không thể gán độ hot hàng loạt");
      }
    } catch {
      onDone("Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-heading font-bold text-sm flex items-center gap-2 text-slate-900 dark:text-white">
            <Zap className="w-4 h-4 text-amber-500" /> Gán độ hot hàng loạt (theo danh sách tên đề)
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <p className="text-slate-500">
            Dán tên đề/chủ đề (mỗi dòng hoặc cách nhau bằng dấu phẩy) vào từng mức độ hot. Hệ thống khớp theo tên (không phân biệt
            hoa/thường, bỏ phần trong ngoặc) và gán độ hot cho mọi đề khớp.
          </p>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Kỹ năng:</span>
            <select
              value={skill}
              onChange={(e) => setSkill(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1"
            >
              {["READING", "SPEAKING", "LISTENING", "WRITING", "ALL"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {LEVELS.map((lv) => (
            <div key={lv}>
              <label className="font-semibold block mb-1">
                {lv === 0 ? "Gỡ độ hot (0)" : `${lv} Sao (Mức ${lv})`}
              </label>
              <textarea
                rows={lv >= 3 ? 3 : 2}
                value={texts[lv] || ""}
                onChange={(e) => setTexts((p) => ({ ...p, [lv]: e.target.value }))}
                placeholder="Film, Singer, New coffee shop..."
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          ))}

          {result && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3">
              <div className="font-bold text-emerald-700 dark:text-emerald-300">Đã cập nhật {result.updated} đề.</div>
              {result.unmatched.length > 0 && (
                <div className="mt-1 text-amber-700 dark:text-amber-300">
                  Không khớp đề nào: {result.unmatched.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            Đóng
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};

