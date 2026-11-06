"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import AdminPageHeader from "@/components/admin/admin-page-header";
import {
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Layers,
  StopCircle,
  CheckSquare,
  Square,
  MinusSquare,
  ShieldAlert,
  Zap,
  ImageOff,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { SpeakingHintsModal, SpeakingHintsData } from "@/components/admin/exams/speaking-hints-modal";
import { SpeakingImageSuggestModal } from "@/components/admin/exams/speaking-image-suggest-modal";
import { Camera } from "lucide-react";

interface SpeakingPartItem {
  partId: string;
  partNumber: 2 | 3;
  partTitle: string;
  examId: string;
  examTitle: string;
  examCode: string;
  skill: string;
  imageUrl: string | null;
  secondImageUrl: string | null;
  hasImage: boolean;
  isImageBroken?: boolean;
  status: "COMPLETED" | "PENDING" | "BROKEN_IMAGE" | "MISSING_IMAGE";
  questionCount: number;
  firstQuestionId: string | null;
  vocabularyHints: SpeakingHintsData | null;
  questions: Array<{
    id: string;
    question_number: number;
    prompt: string;
  }>;
}

interface OverviewData {
  summary: {
    totalParts: number;
    completedCount: number;
    pendingCount: number;
    brokenImageCount?: number;
    missingImageCount: number;
    readyToGenCount?: number;
    completionRate: number;
  };
  items: SpeakingPartItem[];
}

/**
 * Chuẩn hóa URL hiển thị để tránh lỗi đường dẫn relative hoặc 404
 */
export function resolveDisplayUrl(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  // Nếu là relative path dạng speaking/2025/... -> lấy từ files.aptisacademy.com.vn
  if (trimmed.startsWith("speaking/")) {
    return `https://files.aptisacademy.com.vn/${trimmed}`;
  }
  // Nếu là /uploads/... thì dùng relative path để frontend Next.js tự serve từ /public
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("uploads/")) {
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
  return trimmed;
}

// ── THUMBNAIL COMPONENT VỚI SMART FALLBACK & LỖI 404 ──
function SpeakingThumbnail({
  url,
  label,
  examTitle,
  examId,
  otherUrl,
  isBrokenManual,
  onErrorDetected,
  onPreview,
}: {
  url: string;
  label: string;
  examTitle: string;
  examId: string;
  otherUrl?: string | null;
  isBrokenManual?: boolean;
  onErrorDetected: (rawUrl: string) => void;
  onPreview: (preview: { title: string; url: string; url2?: string }) => void;
}) {
  const [loadError, setLoadError] = useState<boolean>(false);
  const displayUrl = resolveDisplayUrl(url);
  const isDeadDomain = url.includes("thithuaptis.com") || url.startsWith("javascript:");
  const isBroken = loadError || isDeadDomain || isBrokenManual;

  const handleImageError = () => {
    setLoadError(true);
    onErrorDetected(url);
  };

  if (isBroken) {
    return (
      <Link
        href={`/admin/exams/${examId}/edit`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs font-medium transition-all group shadow-2xs hover:shadow-xs"
        title="Ảnh bị lỗi 404 hoặc đường dẫn hỏng. Bấm để mở trình sửa đề và gắn ảnh mới"
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="whitespace-nowrap font-medium">Ảnh lỗi ({label})</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] bg-amber-200/90 dark:bg-amber-900 text-amber-900 dark:text-amber-100 px-1.5 py-0.5 rounded font-semibold ml-0.5">
          ✏️ Sửa
        </span>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        onPreview({
          title: `${examTitle} - (${label})`,
          url: displayUrl,
          url2: otherUrl ? resolveDisplayUrl(otherUrl) : undefined,
        })
      }
      className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group hover:ring-2 hover:ring-indigo-500 transition-all bg-slate-100 dark:bg-slate-800 shrink-0 shadow-2xs"
      title={`Bấm để xem ${label} phóng to`}
    >
      <img
        src={displayUrl}
        alt={label}
        onError={handleImageError}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
      />
      <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
        <Eye className="w-3.5 h-3.5 drop-shadow" />
      </div>
    </button>
  );
}

// ── PREVIEW MODAL IMAGE ITEM ──
function PreviewImageModalItem({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  const isDead = error || src.includes("thithuaptis.com");

  if (isDead) {
    return (
      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/70 dark:bg-amber-950/40 p-8 flex flex-col items-center justify-center text-center gap-3">
        <AlertTriangle className="w-10 h-10 text-amber-500" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Không thể tải ảnh ({alt})</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 max-w-sm break-all font-mono">
            {src}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Liên kết ảnh bị 404 hoặc không tồn tại. Vui lòng vào trang quản trị đề thi để cập nhật lại ảnh.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5 flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        onError={() => setError(true)}
        className="w-full h-auto object-contain max-h-[65vh]"
      />
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function SpeakingAiHintsHubPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dynamic set of broken image URLs detected at runtime
  const [brokenUrls, setBrokenUrls] = useState<Set<string>>(new Set());

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "READY" | "COMPLETED" | "BROKEN" | "MISSING">("ALL");
  const [partFilter, setPartFilter] = useState<"ALL" | "2" | "3">("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number | "ALL">(25);

  // Auto reset to page 1 on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, partFilter]);

  // Selection Checkbox State
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  // Batch Generation Options & State
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
  const [skipBrokenImages, setSkipBrokenImages] = useState<boolean>(true);
  const [delayMs, setDelayMs] = useState<number>(1500);
  const [batchModalOpen, setBatchModalOpen] = useState<boolean>(false);
  const [batchRunning, setBatchRunning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{
    total: number;
    current: number;
    succeeded: number;
    skipped: number;
    failed: number;
    logs: string[];
  }>({ total: 0, current: 0, succeeded: 0, skipped: 0, failed: 0, logs: [] });
  const abortBatchRef = useRef<boolean>(false);

  // Single Item Operations
  const [generatingPartId, setGeneratingPartId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<SpeakingPartItem | null>(null);
  const [suggestingItem, setSuggestingItem] = useState<SpeakingPartItem | null>(null);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string; url2?: string } | null>(null);

  // Register broken URL detected by any thumbnail img onError
  const handleRegisterBrokenUrl = (rawUrl: string) => {
    setBrokenUrls((prev) => {
      if (prev.has(rawUrl)) return prev;
      const next = new Set(prev);
      next.add(rawUrl);
      return next;
    });
  };

  // Helper check if item has broken image
  const checkIsItemBroken = (item: SpeakingPartItem): boolean => {
    if (!item.hasImage) return false;
    const url1 = item.imageUrl || "";
    const url2 = item.secondImageUrl || "";

    const isUrl1Broken =
      url1.includes("thithuaptis.com") ||
      brokenUrls.has(url1) ||
      (url1.length > 0 && !url1.startsWith("http") && !url1.startsWith("speaking/") && !url1.startsWith("/uploads/") && !url1.startsWith("uploads/"));

    if (item.partNumber === 2) {
      return isUrl1Broken;
    }

    // Part 3 needs 2 pictures
    const isUrl2Broken =
      url2.includes("thithuaptis.com") ||
      brokenUrls.has(url2) ||
      (url2.length > 0 && !url2.startsWith("http") && !url2.startsWith("speaking/") && !url2.startsWith("/uploads/") && !url2.startsWith("uploads/"));

    return isUrl1Broken || isUrl2Broken;
  };

  // Helper check if item is fully ready to generate (has valid images & not completed)
  const checkIsItemReadyToGen = (item: SpeakingPartItem): boolean => {
    if (!item.hasImage) return false;
    if (item.status === "COMPLETED") return false;
    if (checkIsItemBroken(item)) return false;
    return true;
  };

  // Load Data
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.admin.getSpeakingHintsOverview();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error?.message || "Không thể tải danh sách Speaking Parts");
      }
    } catch (err: any) {
      setError(err?.message || "Lỗi kết nối máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Items
  const filteredItems = useMemo(() => {
    if (!data?.items) return [];

    return data.items.filter((item) => {
      const isBroken = checkIsItemBroken(item);
      const isReady = checkIsItemReadyToGen(item);

      // Filter status
      if (statusFilter === "READY") {
        if (!isReady) return false;
      } else if (statusFilter === "COMPLETED") {
        if (item.status !== "COMPLETED") return false;
      } else if (statusFilter === "BROKEN") {
        if (!isBroken) return false;
      } else if (statusFilter === "MISSING") {
        if (item.hasImage) return false;
      }

      // Filter part number
      if (partFilter !== "ALL" && String(item.partNumber) !== partFilter) return false;

      // Filter search
      if (searchTerm.trim()) {
        const lower = searchTerm.toLowerCase();
        const matchTitle = item.examTitle?.toLowerCase().includes(lower);
        const matchPart = item.partTitle?.toLowerCase().includes(lower);
        const matchKeywords = item.vocabularyHints?.keywords?.some((k) => k.toLowerCase().includes(lower));
        if (!matchTitle && !matchPart && !matchKeywords) return false;
      }

      return true;
    });
  }, [data, statusFilter, partFilter, searchTerm, brokenUrls]);

  // Pagination Calculations
  const totalFiltered = filteredItems.length;
  const totalPages = pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Keep currentPage within valid bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedItems = useMemo(() => {
    if (pageSize === "ALL") return filteredItems;
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  // Dynamic KPI counts
  const counts = useMemo(() => {
    if (!data?.items) return { total: 0, completed: 0, ready: 0, broken: 0, missing: 0, rate: 0 };
    const total = data.items.length;
    let completed = 0;
    let ready = 0;
    let broken = 0;
    let missing = 0;

    data.items.forEach((item) => {
      if (item.status === "COMPLETED") {
        completed++;
      } else if (!item.hasImage) {
        missing++;
      } else if (checkIsItemBroken(item)) {
        broken++;
      } else {
        ready++;
      }
    });

    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, ready, broken, missing, rate };
  }, [data, brokenUrls]);

  // Checkbox Selection Helpers
  const handleToggleSelectCurrentPage = () => {
    const pageIds = paginatedItems.map((i) => i.partId);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedPartIds.includes(id));

    if (allSelected) {
      setSelectedPartIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedPartIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleSelectAllFiltered = () => {
    const allIds = filteredItems.map((i) => i.partId);
    setSelectedPartIds(allIds);
  };

  const handleSelectOnlyReadyVisible = () => {
    const readyIds = filteredItems.filter((i) => checkIsItemReadyToGen(i)).map((i) => i.partId);
    setSelectedPartIds(readyIds);
  };

  const handleClearSelection = () => {
    setSelectedPartIds([]);
  };

  const handleToggleRowSelect = (partId: string) => {
    setSelectedPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  // Selected items breakdown
  const selectedItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items.filter((i) => selectedPartIds.includes(i.partId));
  }, [data, selectedPartIds]);

  const selectedReadyCount = useMemo(() => {
    return selectedItems.filter((i) => checkIsItemReadyToGen(i)).length;
  }, [selectedItems, brokenUrls]);

  // Handle Single Part Generate
  const handleSingleGenerate = async (item: SpeakingPartItem) => {
    if (!item.hasImage) {
      alert("Phần thi này chưa được cài đặt hình ảnh. Vui lòng thêm ảnh trong trang chỉnh sửa đề.");
      return;
    }
    if (checkIsItemBroken(item)) {
      if (!confirm("Ảnh của phần thi này có dấu hiệu bị lỗi 404 hoặc đường dẫn hỏng. Bạn có chắc muốn thử gọi AI không?")) {
        return;
      }
    }

    setGeneratingPartId(item.partId);
    try {
      const res = await api.admin.generatePartSpeakingHints(item.partId);
      if (res.success && res.data) {
        setData((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((i) => {
            if (i.partId === item.partId) {
              return {
                ...i,
                status: "COMPLETED" as const,
                vocabularyHints: res.data,
              };
            }
            return i;
          });
          return { ...prev, items: updatedItems };
        });
      } else {
        alert("Lỗi khi sinh gợi ý: " + (res.error?.message || "Không có phản hồi"));
      }
    } catch (err: any) {
      alert("Lỗi: " + (err?.message || "Không thể kết nối đến máy chủ AI"));
    } finally {
      setGeneratingPartId(null);
    }
  };

  // Handle Save from SpeakingHintsModal
  const handleSaveModalHints = async (hints: SpeakingHintsData) => {
    if (!editingItem) return;
    await api.admin.savePartSpeakingHints(editingItem.partId, hints);
    setData((prev) => {
      if (!prev) return prev;
      const updatedItems = prev.items.map((i) => {
        if (i.partId === editingItem.partId) {
          return {
            ...i,
            status: "COMPLETED" as const,
            vocabularyHints: hints,
          };
        }
        return i;
      });
      return { ...prev, items: updatedItems };
    });
  };

  // Run Batch Generation (Support either selected items or entire valid pending queue)
  const startBatchGeneration = async (customTargets?: SpeakingPartItem[]) => {
    if (!data?.items) return;

    let targets: SpeakingPartItem[] = [];

    if (customTargets && customTargets.length > 0) {
      targets = customTargets;
    } else if (selectedPartIds.length > 0) {
      // Use user-selected items
      targets = selectedItems;
    } else {
      // Default: Target all items matching filters
      targets = data.items.filter((item) => {
        if (!item.hasImage) return false;
        if (skipExisting && item.status === "COMPLETED") return false;
        if (skipBrokenImages && checkIsItemBroken(item)) return false;
        return true;
      });
    }

    if (targets.length === 0) {
      alert("Không tìm thấy phần thi nào thỏa mãn điều kiện để sinh AI (đã hoàn tất hoặc ảnh bị lỗi/thiếu ảnh)!");
      return;
    }

    setBatchModalOpen(true);
    setBatchRunning(true);
    abortBatchRef.current = false;

    setBatchProgress({
      total: targets.length,
      current: 0,
      succeeded: 0,
      skipped: 0,
      failed: 0,
      logs: [
        `[${new Date().toLocaleTimeString()}] 🚀 Bắt đầu tiến trình sinh AI cho ${targets.length} phần thi Speaking...`,
        skipBrokenImages ? `[${new Date().toLocaleTimeString()}] 🛡️ Chế độ an toàn: Tự động BỎ QUA các phần thi có ảnh lỗi.` : "",
      ].filter(Boolean),
    });

    for (let i = 0; i < targets.length; i++) {
      if (abortBatchRef.current) {
        setBatchProgress((p) => ({
          ...p,
          logs: [...p.logs, `[${new Date().toLocaleTimeString()}] ⚠️ Tiến trình đã bị dừng bởi người dùng.`],
        }));
        break;
      }

      const item = targets[i];

      // Check broken image skip
      if (skipBrokenImages && checkIsItemBroken(item)) {
        setBatchProgress((p) => ({
          ...p,
          current: i + 1,
          skipped: p.skipped + 1,
          logs: [
            ...p.logs.slice(-30),
            `[${new Date().toLocaleTimeString()}] ⏭️ [BỎ QUA ẢNH LỖI] Part ${item.partNumber} - "${item.examTitle.slice(0, 24)}...": Ảnh 404 / hỏng.`,
          ],
        }));
        continue;
      }

      setBatchProgress((p) => ({
        ...p,
        current: i + 1,
        logs: [
          ...p.logs.slice(-30),
          `[${new Date().toLocaleTimeString()}] [${i + 1}/${targets.length}] Đang xử lý Part ${item.partNumber} - "${item.examTitle.slice(0, 28)}..."`,
        ],
      }));

      try {
        const res = await api.admin.generatePartSpeakingHints(item.partId);
        if (res.success && res.data) {
          setData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              items: prev.items.map((p) =>
                p.partId === item.partId ? { ...p, status: "COMPLETED" as const, vocabularyHints: res.data } : p
              ),
            };
          });

          setBatchProgress((p) => ({
            ...p,
            succeeded: p.succeeded + 1,
            logs: [
              ...p.logs.slice(-30),
              `[${new Date().toLocaleTimeString()}] ✅ Part ${item.partNumber} (${item.examTitle.slice(0, 22)}...): Sinh thành công (${res.data.keywords?.length || 0} từ khóa)`,
            ],
          }));
        } else {
          // If error message indicates broken image and skipBroken is on
          const errText = res.error?.message || "";
          const isImgErr = errText.includes("ảnh") || errText.includes("image") || (res.error as any)?.status === 400 || (res.error as any)?.statusCode === 400;

          if (skipBrokenImages && isImgErr) {
            setBatchProgress((p) => ({
              ...p,
              skipped: p.skipped + 1,
              logs: [
                ...p.logs.slice(-30),
                `[${new Date().toLocaleTimeString()}] ⏭️ [BỎ QUA] Part ${item.partNumber}: Máy chủ báo ảnh không hợp lệ (${errText})`,
              ],
            }));
          } else {
            setBatchProgress((p) => ({
              ...p,
              failed: p.failed + 1,
              logs: [
                ...p.logs.slice(-30),
                `[${new Date().toLocaleTimeString()}] ❌ Part ${item.partNumber} thất bại: ${errText || "Lỗi AI Vision"}`,
              ],
            }));
          }
        }
      } catch (err: any) {
        const errText = err?.message || "";
        if (skipBrokenImages && (errText.includes("ảnh") || err?.statusCode === 400)) {
          setBatchProgress((p) => ({
            ...p,
            skipped: p.skipped + 1,
            logs: [
              ...p.logs.slice(-30),
              `[${new Date().toLocaleTimeString()}] ⏭️ [BỎ QUA] Part ${item.partNumber}: Lỗi ảnh (${errText})`,
            ],
          }));
        } else {
          setBatchProgress((p) => ({
            ...p,
            failed: p.failed + 1,
            logs: [
              ...p.logs.slice(-30),
              `[${new Date().toLocaleTimeString()}] ❌ Lỗi kết nối Part ${item.partNumber}: ${errText || "Lỗi mạng"}`,
            ],
          }));
        }
      }

      // Safe sleep delay between calls to avoid API rate limits
      if (i < targets.length - 1 && delayMs > 0 && !abortBatchRef.current) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setBatchRunning(false);
    setBatchProgress((p) => ({
      ...p,
      logs: [...p.logs, `[${new Date().toLocaleTimeString()}] 🎉 Hoàn tất tiến trình sinh AI hàng loạt!`],
    }));
  };

  const handleStopBatch = () => {
    abortBatchRef.current = true;
  };

  const isAllCurrentPageSelected =
    paginatedItems.length > 0 && paginatedItems.every((i) => selectedPartIds.includes(i.partId));
  const isAllFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedPartIds.includes(i.partId));

  return (
    <div className="space-y-6 pb-20">
      <AdminPageHeader
        title="AI Gợi Ý Tranh Speaking"
        infoTooltip="Tự động phân tích ảnh tranh Part 2 & Part 3 qua mô hình Vision AI, bỏ qua ảnh lỗi và tối ưu ngân hàng gợi ý chuẩn B2/C1."
        stats={[
          { icon: Sparkles, value: counts.total, label: "tranh đề thi" },
          { icon: CheckCircle2, value: counts.completed, label: "đã tạo gợi ý", iconColor: "text-emerald-500" },
          { icon: AlertTriangle, value: counts.broken, label: "ảnh lỗi", iconColor: "text-amber-500" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading || batchRunning}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all shadow-2xs disabled:opacity-50 cursor-pointer"
              title="Làm mới lại dữ liệu từ server"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span>Làm mới</span>
            </button>

            <button
              onClick={() => startBatchGeneration()}
              disabled={loading || batchRunning || counts.ready === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              title="Tự động sinh gợi ý cho toàn bộ đề có ảnh hợp lệ"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Sinh AI Hàng Loạt</span>
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[11px] font-mono font-bold">
                {counts.ready}
              </span>
            </button>
          </div>
        }
      />

      {/* ── KPI METRIC CARDS (INTERACTIVE CLICK-TO-FILTER) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total */}
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group ${
            statusFilter === "ALL"
              ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Phần Tranh
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
              {counts.total}
            </span>
            <span className="text-xs text-slate-500">phần</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Bấm để xem tất cả</div>
        </button>

        {/* Ready to generate (Golden metric!) */}
        <button
          type="button"
          onClick={() => setStatusFilter("READY")}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group ${
            statusFilter === "READY"
              ? "bg-sky-50 dark:bg-sky-950/40 border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-sky-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center gap-1">
              <span>Sẵn Sàng Sinh</span>
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100/70 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
              {counts.ready}
            </span>
            <span className="text-xs text-sky-600 font-medium">ảnh chuẩn</span>
          </div>
          <div className="mt-1 text-[11px] text-sky-600/80 dark:text-sky-400/80 font-medium">
            Có ảnh hợp lệ & chưa sinh
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter("COMPLETED")}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Đã Có Gợi Ý
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {counts.completed}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full font-mono">
              {counts.rate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${counts.rate}%` }}
            />
          </div>
        </button>

        {/* Broken images */}
        <button
          type="button"
          onClick={() => setStatusFilter("BROKEN")}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group ${
            statusFilter === "BROKEN"
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Ảnh Lỗi (404)
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {counts.broken}
            </span>
            <span className="text-xs text-amber-600">cần sửa</span>
          </div>
          <div className="mt-1 text-[11px] text-amber-600/80 dark:text-amber-400/80">
            Tự động bỏ qua khi sinh
          </div>
        </button>

        {/* Missing image */}
        <button
          type="button"
          onClick={() => setStatusFilter("MISSING")}
          className={`text-left rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative overflow-hidden group col-span-2 sm:col-span-1 ${
            statusFilter === "MISSING"
              ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 shadow-2xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Chưa Có Ảnh
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <ImageOff className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {counts.missing}
            </span>
            <span className="text-xs text-rose-600">cần gắn</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600/80 dark:text-rose-400/80">
            Chưa có ảnh trong đề
          </div>
        </button>
      </div>

      {/* ── FILTER & BATCH CONTROL BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên đề thi, part, từ khóa gợi ý..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Part Selection & Batch Options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Part selection segment */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPartFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  partFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Tất cả Part
              </button>
              <button
                onClick={() => setPartFilter("2")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  partFilter === "2"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Part 2 (1 Ảnh)
              </button>
              <button
                onClick={() => setPartFilter("3")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  partFilter === "3"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Part 3 (2 Ảnh)
              </button>
            </div>

            {/* Skip broken images checkbox (THE CORE USER FEATURE!) */}
            <label className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipBrokenImages}
                onChange={(e) => setSkipBrokenImages(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
              />
              <span className="flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Bỏ qua ảnh lỗi khi sinh</span>
              </span>
            </label>

            {/* Skip completed checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span>Bỏ qua đề đã có</span>
            </label>

            {/* Delay selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span>Độ trễ:</span>
              <select
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-mono focus:outline-none"
              >
                <option value={1000}>1.0s</option>
                <option value={1500}>1.5s (Khuyên dùng)</option>
                <option value={2000}>2.0s</option>
                <option value={3000}>3.0s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              statusFilter === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 text-[11px] font-mono">
              {counts.total}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("READY")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              statusFilter === "READY"
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sẵn sàng sinh (Đủ ảnh chuẩn)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-mono font-bold">
              {counts.ready}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              statusFilter === "COMPLETED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-900"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã hoàn tất</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-mono">
              {counts.completed}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("BROKEN")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              statusFilter === "BROKEN"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Ảnh lỗi (404)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-mono">
              {counts.broken}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter("MISSING")}
            className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-2 ${
              statusFilter === "MISSING"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900"
            }`}
          >
            <ImageOff className="w-3.5 h-3.5" />
            <span>Chưa có ảnh</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-mono">
              {counts.missing}
            </span>
          </button>
        </div>
      </div>

      {/* ── STICKY BATCH SELECTION BAR (WHEN ROWS ARE CHECKED) ── */}
      {selectedPartIds.length > 0 && (
        <div className="sticky top-4 z-30 flex items-center justify-between gap-4 bg-slate-900 text-white dark:bg-indigo-950 dark:text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 dark:border-indigo-800 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-500/30 flex items-center justify-center font-mono font-bold text-indigo-300">
              {selectedPartIds.length}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">
                Đã chọn {selectedPartIds.length} phần thi Speaking
              </p>
              <p className="text-xs text-slate-300 dark:text-slate-300 mt-0.5">
                Trong đó: <strong className="text-emerald-300">{selectedReadyCount} phần</strong> sẵn sàng sinh AI hợp lệ.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {selectedPartIds.length < totalFiltered && (
              <button
                onClick={handleSelectAllFiltered}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-300 hover:text-white hover:bg-indigo-600/30 transition-colors"
              >
                Chọn tất cả {totalFiltered} đề đang lọc
              </button>
            )}

            <button
              onClick={() => handleClearSelection()}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              Bỏ chọn tất cả
            </button>

            <button
              onClick={() => startBatchGeneration(selectedItems)}
              disabled={batchRunning || selectedPartIds.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Sinh AI cho {selectedPartIds.length} phần đã chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* ── DATA TABLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-semibold">Đang nạp toàn bộ danh sách tranh Speaking & kiểm tra hình ảnh...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
            <button
              onClick={fetchData}
              className="mt-3 px-4 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-xs font-bold"
            >
              Thử lại
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center text-slate-500 dark:text-slate-400">
            <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Không tìm thấy phần thi nào</p>
            <p className="text-xs text-slate-400 mt-1">Hãy thử đổi điều kiện tìm kiếm hoặc bấm tab "Tất cả" phía trên</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {/* Master Checkbox */}
                  <th className="py-3.5 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectCurrentPage}
                      className="p-1 hover:text-indigo-600 transition-colors"
                      title={isAllCurrentPageSelected ? "Bỏ chọn trang hiện tại" : "Chọn tất cả đề trên trang này"}
                    >
                      {isAllCurrentPageSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-2 w-10 text-center">#</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Đề Thi & Phần Thi</th>
                  <th className="py-3.5 px-4 w-36">Hình Ảnh Tranh</th>
                  <th className="py-3.5 px-4 w-40">Trạng Thái</th>
                  <th className="py-3.5 px-4 min-w-[260px]">Từ Khóa & Gợi Ý AI Đã Sinh</th>
                  <th className="py-3.5 px-4 w-36 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {paginatedItems.map((item, idx) => {
                  const isGenThis = generatingPartId === item.partId;
                  const keywords = item.vocabularyHints?.keywords || [];
                  const isBroken = checkIsItemBroken(item);
                  const isReady = checkIsItemReadyToGen(item);
                  const isSelected = selectedPartIds.includes(item.partId);
                  const rowNumber = pageSize === "ALL" ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={item.partId}
                      className={`transition-colors ${
                        isSelected
                          ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                          : isBroken
                          ? "hover:bg-amber-50/30 dark:hover:bg-amber-950/20"
                          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRowSelect(item.partId)}
                          className="p-1 hover:text-indigo-600 transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* Index */}
                      <td className="py-3.5 px-2 text-center font-mono text-xs text-slate-400">
                        {rowNumber}
                      </td>

                      {/* Exam Title & Part info */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                          {item.examTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              item.partNumber === 2
                                ? "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300"
                                : "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300"
                            }`}
                          >
                            Part {item.partNumber} ({item.partNumber === 2 ? "1 Ảnh" : "2 Ảnh"})
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.partTitle}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            • {item.questionCount} câu hỏi
                          </span>
                        </div>
                      </td>

                      {/* Image Thumbnail with Smart Fallback */}
                      <td className="py-3.5 px-4">
                        {item.hasImage ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.imageUrl && (
                              <SpeakingThumbnail
                                url={item.imageUrl}
                                label="Part 1"
                                examTitle={item.examTitle}
                                examId={item.examId}
                                otherUrl={item.secondImageUrl}
                                isBrokenManual={brokenUrls.has(item.imageUrl)}
                                onErrorDetected={handleRegisterBrokenUrl}
                                onPreview={setPreviewImage}
                              />
                            )}

                            {item.secondImageUrl && (
                              <SpeakingThumbnail
                                url={item.secondImageUrl}
                                label="Part 2"
                                examTitle={item.examTitle}
                                examId={item.examId}
                                isBrokenManual={brokenUrls.has(item.secondImageUrl)}
                                onErrorDetected={handleRegisterBrokenUrl}
                                onPreview={setPreviewImage}
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-start gap-1">
                            <Link
                              href={`/admin/exams/${item.examId}/edit`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-semibold"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Chưa có ảnh (Gắn ngay)</span>
                            </Link>
                            <button
                              onClick={() => setSuggestingItem(item)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5"
                            >
                              <Camera className="w-3 h-3" />
                              <span>✨ Gợi ý ảnh</span>
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã xong ({keywords.length})</span>
                          </span>
                        ) : isBroken ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>Ảnh bị lỗi (404)</span>
                          </span>
                        ) : item.hasImage ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-900/60">
                            <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                            <span>Sẵn sàng sinh</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                            <ImageOff className="w-3.5 h-3.5" />
                            <span>Thiếu ảnh</span>
                          </span>
                        )}
                      </td>

                      {/* Hints Preview / Keyword Chips */}
                      <td className="py-3.5 px-4">
                        {keywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-md">
                            {keywords.slice(0, 5).map((kw, kidx) => (
                              <span
                                key={kidx}
                                className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-medium border border-indigo-200/60 dark:border-indigo-900/40"
                              >
                                {kw}
                              </span>
                            ))}
                            {keywords.length > 5 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[11px] font-mono">
                                +{keywords.length - 5}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Chưa có gợi ý từ vựng</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Single Generate Button */}
                          <button
                            onClick={() => handleSingleGenerate(item)}
                            disabled={!item.hasImage || isGenThis || batchRunning}
                            className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                              item.hasImage && !isBroken
                                ? "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:shadow-2xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                            }`}
                            title={
                              isBroken
                                ? "Ảnh của đề này bị lỗi 404. Hãy sửa ảnh trước khi sinh"
                                : item.status === "COMPLETED"
                                ? "Sinh lại gợi ý bằng AI"
                                : "Sinh gợi ý AI"
                            }
                          >
                            {isGenThis ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>

                          {/* Suggest Images Button */}
                          <button
                            onClick={() => setSuggestingItem(item)}
                            className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/60 text-sky-600 dark:text-sky-300 transition-colors"
                            title="Gợi ý & Gán ảnh chuẩn ngữ cảnh"
                          >
                            <Camera className="w-4 h-4" />
                          </button>

                          {/* Edit Hints Button */}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Chỉnh sửa từ khóa & mẫu câu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Open Exam Editor in new tab */}
                          <Link
                            href={`/admin/exams/${item.examId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Mở trình biên tập đề thi để sửa ảnh hoặc câu hỏi"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PAGINATION CONTROLS BAR ── */}
        {!loading && !error && filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
            {/* Left: Range Info & Page Size Selector */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-slate-600 dark:text-slate-400">
                Hiển thị{" "}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {totalFiltered === 0
                    ? 0
                    : (currentPage - 1) * (pageSize === "ALL" ? totalFiltered : pageSize) + 1}
                </span>{" "}
                -{" "}
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  {pageSize === "ALL" ? totalFiltered : Math.min(currentPage * pageSize, totalFiltered)}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                  {totalFiltered}
                </span>{" "}
                phần thi
              </span>

              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-slate-400">Mỗi trang:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    const val = e.target.value === "ALL" ? "ALL" : Number(e.target.value);
                    setPageSize(val);
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={25}>25 đề</option>
                  <option value={50}>50 đề</option>
                  <option value={100}>100 đề</option>
                  <option value="ALL">Tất cả ({totalFiltered})</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            {pageSize !== "ALL" && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Trang đầu"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-1">
                  {getPageNumbers(currentPage, totalPages).map((p, i) =>
                    p === "..." ? (
                      <span key={`dots-${i}`} className="px-2 text-slate-400 font-mono">
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(Number(p))}
                        className={`min-w-8 h-8 px-2 rounded-lg font-bold font-mono text-xs transition-all ${
                          currentPage === p
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Trang cuối"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── BATCH PROGRESS MODAL ── */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    Tiến Trình Sinh AI Hàng Loạt
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phân tích ảnh tuần tự theo độ trễ an toàn {delayMs / 1000}s tránh quota rate limit. Tự động bỏ qua ảnh lỗi.
                  </p>
                </div>
              </div>

              {!batchRunning && (
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-[11px] text-slate-500 uppercase font-bold">Tiến độ</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {batchProgress.current} / {batchProgress.total}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60">
                <span className="text-[11px] text-emerald-600 uppercase font-bold">Thành công</span>
                <div className="text-lg font-black text-emerald-600 font-mono">
                  {batchProgress.succeeded}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60">
                <span className="text-[11px] text-amber-700 dark:text-amber-400 uppercase font-bold">Bỏ qua (ảnh lỗi)</span>
                <div className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono">
                  {batchProgress.skipped}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60">
                <span className="text-[11px] text-rose-600 uppercase font-bold">Thất bại</span>
                <div className="text-lg font-black text-rose-600 font-mono">
                  {batchProgress.failed}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${
                      batchProgress.total > 0
                        ? Math.round((batchProgress.current / batchProgress.total) * 100)
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>
                  {batchProgress.total > 0
                    ? Math.round((batchProgress.current / batchProgress.total) * 100)
                    : 0}
                  % Hoàn tất
                </span>
                {batchRunning && (
                  <span className="flex items-center gap-1.5 text-indigo-500 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang chạy sinh AI...
                  </span>
                )}
              </div>
            </div>

            {/* Live Console Logs */}
            <div className="bg-slate-950 rounded-xl p-3.5 font-mono text-xs text-slate-300 h-48 overflow-y-auto space-y-1 border border-slate-800">
              {batchProgress.logs.map((log, lidx) => (
                <div
                  key={lidx}
                  className={`leading-relaxed ${
                    log.includes("✅")
                      ? "text-emerald-400 font-medium"
                      : log.includes("❌")
                      ? "text-rose-400 font-medium"
                      : log.includes("⏭️") || log.includes("BỎ QUA")
                      ? "text-amber-400"
                      : log.includes("⚠️")
                      ? "text-amber-300"
                      : "text-slate-300"
                  }`}
                >
                  {log}
                </div>
              ))}
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              {batchRunning ? (
                <button
                  onClick={handleStopBatch}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Dừng tiến trình</span>
                </button>
              ) : (
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                >
                  Đóng cửa sổ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE ZOOM PREVIEW MODAL ── */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-4 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{previewImage.title}</h4>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto">
              <PreviewImageModalItem src={previewImage.url} alt="Ảnh 1" />
              {previewImage.url2 && (
                <PreviewImageModalItem src={previewImage.url2} alt="Ảnh 2" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── IMAGE SUGGEST MODAL ── */}
      {suggestingItem && (
        <SpeakingImageSuggestModal
          isOpen={Boolean(suggestingItem)}
          partId={suggestingItem.partId}
          partNumber={suggestingItem.partNumber}
          examTitle={suggestingItem.partTitle || suggestingItem.examTitle}
          currentImageUrl={suggestingItem.imageUrl}
          currentSecondImageUrl={suggestingItem.secondImageUrl}
          onClose={() => setSuggestingItem(null)}
          onApplied={(newImageUrl) => {
            const split = newImageUrl.split(',').map((s) => s.trim());
            setData((prev) => {
              if (!prev) return prev;
              const updated = prev.items.map((it) => {
                if (it.partId === suggestingItem.partId) {
                  return {
                    ...it,
                    hasImage: true,
                    imageUrl: split[0] || null,
                    secondImageUrl: split[1] || null,
                  };
                }
                return it;
              });
              return { ...prev, items: updated };
            });
            setSuggestingItem(null);
          }}
        />
      )}

      {/* ── SPEAKING HINTS EDIT MODAL ── */}
      {editingItem && (
        <SpeakingHintsModal
          isOpen={Boolean(editingItem)}
          questionId={editingItem.firstQuestionId || editingItem.partId}
          partNumber={editingItem.partNumber}
          topicTitle={editingItem.partTitle || editingItem.examTitle}
          prompt={editingItem.questions[0]?.prompt || ""}
          imageUrl={editingItem.imageUrl || undefined}
          secondImageUrl={editingItem.secondImageUrl || undefined}
          initialHints={editingItem.vocabularyHints}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveModalHints}
        />
      )}
    </div>
  );
}
