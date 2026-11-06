"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  X,
  Check,
  Loader2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Camera,
} from "lucide-react";
import { api } from "@/lib/api-client";

interface CandidateItem {
  id: string;
  title: string;
  previewUrl: string;
  downloadUrl: string;
  source: string;
  photographer?: string;
}

interface CandidatePair {
  id: string;
  title: string;
  image1: CandidateItem;
  image2?: CandidateItem;
}

interface SpeakingImageSuggestModalProps {
  isOpen: boolean;
  partId: string;
  partNumber: 2 | 3;
  examTitle: string;
  currentImageUrl?: string | null;
  currentSecondImageUrl?: string | null;
  onClose: () => void;
  onApplied: (newImageUrl: string) => void;
}

export function SpeakingImageSuggestModal({
  isOpen,
  partId,
  partNumber,
  examTitle,
  currentImageUrl,
  currentSecondImageUrl,
  onClose,
  onApplied,
}: SpeakingImageSuggestModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    concept1: string;
    concept2?: string;
  } | null>(null);
  const [candidatePairs, setCandidatePairs] = useState<CandidatePair[]>([]);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);

  // Fetch suggestions khi mở Modal
  useEffect(() => {
    if (!isOpen || !partId) return;

    let mounted = true;
    const fetchSuggestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.admin.suggestPartImages(partId);
        if (mounted && res?.data) {
          setAnalysis(res.data.analysis);
          setCandidatePairs(res.data.candidatePairs || []);
          if (res.data.candidatePairs?.length > 0) {
            setSelectedPairId(res.data.candidatePairs[0].id);
          }
        }
      } catch (err: any) {
        if (mounted) {
          setError(err?.message || "Không thể tải danh sách gợi ý ảnh. Vui lòng thử lại.");
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      mounted = false;
    };
  }, [isOpen, partId]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!selectedPairId) return;
    const selected = candidatePairs.find((p) => p.id === selectedPairId);
    if (!selected) return;

    setIsApplying(true);
    setError(null);

    try {
      const res = await api.admin.applySuggestedPartImages(partId, {
        image1SourceUrl: selected.image1.downloadUrl,
        image2SourceUrl: partNumber === 3 ? selected.image2?.downloadUrl : undefined,
      });

      if (res?.data?.newImageUrl) {
        onApplied(res.data.newImageUrl);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi khi lưu ảnh vào hệ thống. Vui lòng thử lại.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-sky-50/50 dark:from-slate-900 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                Gợi Ý Ảnh Chuẩn Ngữ Cảnh
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Part {partNumber} ({partNumber === 2 ? "1 Ảnh" : "2 Ảnh So Sánh"})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {examTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Trạng thái Loading */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
                  AI đang phân tích câu hỏi và truy xuất kho ảnh thực tế...
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Đang lọc ảnh nhiếp ảnh gia chất lượng cao chuẩn khảo thí quốc tế
                </p>
              </div>
            </div>
          )}

          {/* Báo lỗi nếu có */}
          {error && !isLoading && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-200">Đã xảy ra lỗi</p>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Nội dung kết quả gợi ý */}
          {!isLoading && analysis && candidatePairs.length > 0 && (
            <>
              {/* Box phân tích Intent của AI */}
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs uppercase tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Phân tích chủ đề từ câu hỏi thực tế</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {analysis.summary}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-300 font-medium">
                    📸 Tranh 1: {analysis.concept1}
                  </span>
                  {analysis.concept2 && (
                    <span className="text-xs px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-300 font-medium">
                      📸 Tranh 2: {analysis.concept2}
                    </span>
                  )}
                </div>
              </div>

              {/* Danh sách các ứng viên ảnh */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Chọn 1 cặp ảnh bạn ưng ý nhất:
                </label>

                <div className="space-y-4">
                  {candidatePairs.map((pair, idx) => {
                    const isSelected = selectedPairId === pair.id;
                    return (
                      <div
                        key={pair.id}
                        onClick={() => setSelectedPairId(pair.id)}
                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-400"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {pair.title}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Nguồn: {pair.image1.source}
                          </span>
                        </div>

                        {/* Grid hiển thị ảnh */}
                        <div
                          className={`grid gap-3 ${
                            partNumber === 3 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"
                          }`}
                        >
                          {/* Tranh 1 */}
                          <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 aspect-3/2">
                            <img
                              src={pair.image1.previewUrl}
                              alt={pair.image1.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[10px]">
                              <p className="line-clamp-1 font-medium">{pair.image1.title}</p>
                              {pair.image1.photographer && (
                                <p className="text-slate-300 text-[9px]">
                                  Bởi: {pair.image1.photographer}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Tranh 2 (nếu là Part 3) */}
                          {partNumber === 3 && pair.image2 && (
                            <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 aspect-3/2">
                              <img
                                src={pair.image2.previewUrl}
                                alt={pair.image2.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white text-[10px]">
                                <p className="line-clamp-1 font-medium">{pair.image2.title}</p>
                                {pair.image2.photographer && (
                                  <p className="text-slate-300 text-[9px]">
                                    Bởi: {pair.image2.photographer}
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            Đóng
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isLoading || isApplying || !selectedPairId}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:shadow-lg disabled:cursor-not-allowed"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải & cập nhật hệ thống...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Lưu & Gắn ảnh vào đề thi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

