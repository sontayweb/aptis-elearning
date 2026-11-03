"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  Play,
  Check,
  X,
  Loader2,
  ChevronRight,
  HelpCircle,
  Eye,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  StopCircle,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { SpeakingHintsModal, SpeakingHintsData } from "@/components/admin/exams/speaking-hints-modal";

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
  status: "COMPLETED" | "PENDING" | "MISSING_IMAGE";
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
    missingImageCount: number;
    completionRate: number;
  };
  items: SpeakingPartItem[];
}

export default function SpeakingAiHintsHubPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED" | "MISSING_IMAGE">("ALL");
  const [partFilter, setPartFilter] = useState<"ALL" | "2" | "3">("ALL");

  // Batch Generation Options & State
  const [skipExisting, setSkipExisting] = useState<boolean>(true);
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

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<{ title: string; url: string; url2?: string } | null>(null);

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
      // Filter status
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

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
  }, [data, statusFilter, partFilter, searchTerm]);

  // Recalculate dynamic counts
  const counts = useMemo(() => {
    if (!data?.items) return { total: 0, completed: 0, pending: 0, missing: 0, rate: 0 };
    const total = data.items.length;
    const completed = data.items.filter((i) => i.status === "COMPLETED").length;
    const pending = data.items.filter((i) => i.status === "PENDING").length;
    const missing = data.items.filter((i) => i.status === "MISSING_IMAGE").length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, missing, rate };
  }, [data]);

  // Handle Single Part Generate
  const handleSingleGenerate = async (item: SpeakingPartItem) => {
    if (!item.hasImage) {
      alert("Phần thi này chưa được cài đặt hình ảnh. Vui lòng thêm ảnh trong trang chỉnh sửa đề.");
      return;
    }
    setGeneratingPartId(item.partId);
    try {
      const res = await api.admin.generatePartSpeakingHints(item.partId);
      if (res.success && res.data) {
        // Update local state directly
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
          return {
            ...prev,
            items: updatedItems,
          };
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
      return {
        ...prev,
        items: updatedItems,
      };
    });
  };

  // Run Batch Generation
  const startBatchGeneration = async () => {
    if (!data?.items) return;
    const targets = data.items.filter((item) => {
      if (!item.hasImage) return false;
      if (skipExisting && item.status === "COMPLETED") return false;
      return true;
    });

    if (targets.length === 0) {
      alert("Không có phần thi nào cần sinh gợi ý (đã đủ hoặc chưa có ảnh)!");
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
      logs: [`[${new Date().toLocaleTimeString()}] Bắt đầu tiến trình sinh AI cho ${targets.length} phần thi...`],
    });

    for (let i = 0; i < targets.length; i++) {
      if (abortBatchRef.current) {
        setBatchProgress((p) => ({
          ...p,
          logs: [...p.logs, `[${new Date().toLocaleTimeString()}] ⚠️ Tiến trình đã bị người dùng dừng lại.`],
        }));
        break;
      }

      const item = targets[i];
      setBatchProgress((p) => ({
        ...p,
        current: i + 1,
        logs: [
          ...p.logs.slice(-30),
          `[${new Date().toLocaleTimeString()}] [${i + 1}/${targets.length}] Đang xử lý Part ${item.partNumber} - Đề: "${item.examTitle}"...`,
        ],
      }));

      try {
        const res = await api.admin.generatePartSpeakingHints(item.partId);
        if (res.success && res.data) {
          // Update item in local state
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
              `[${new Date().toLocaleTimeString()}] ✅ Part ${item.partNumber} (${item.examTitle.slice(0, 25)}...) OK (${res.data.keywords?.length || 0} từ khóa)`,
            ],
          }));
        } else {
          setBatchProgress((p) => ({
            ...p,
            failed: p.failed + 1,
            logs: [
              ...p.logs.slice(-30),
              `[${new Date().toLocaleTimeString()}] ❌ Part ${item.partNumber} thất bại: ${res.error?.message || "Lỗi AI"}`,
            ],
          }));
        }
      } catch (err: any) {
        setBatchProgress((p) => ({
          ...p,
          failed: p.failed + 1,
          logs: [
            ...p.logs.slice(-30),
            `[${new Date().toLocaleTimeString()}] ❌ Lỗi kết nối Part ${item.partNumber}: ${err?.message || "Lỗi mạng"}`,
          ],
        }));
      }

      // Safe sleep delay between calls to prevent rate limits
      if (i < targets.length - 1 && delayMs > 0 && !abortBatchRef.current) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    setBatchRunning(false);
    setBatchProgress((p) => ({
      ...p,
      logs: [...p.logs, `[${new Date().toLocaleTimeString()}] 🎉 Quá trình sinh hàng loạt hoàn tất!`],
    }));
  };

  const handleStopBatch = () => {
    abortBatchRef.current = true;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── HEADER & BREADCRUMB ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
            <Link href="/admin" className="hover:text-indigo-600 transition-colors">
              Bảng điều khiển
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span>Công cụ AI</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">AI Gợi Ý Tranh Speaking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </span>
            Trung Tâm AI Gợi Ý Tranh Speaking
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            Tự động phân tích hình ảnh Speaking Part 2 & Part 3 qua mô hình Vision AI tiên tiến. Hệ thống sinh từ vựng
            trọng tâm (keywords), mẫu câu mở đầu và liên kết giúp học viên tự tin trả lời lưu loát.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={fetchData}
            disabled={loading || batchRunning}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={startBatchGeneration}
            disabled={loading || batchRunning || counts.pending === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Sinh AI Hàng Loạt</span>
            {counts.pending > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold font-mono">
                {counts.pending}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Speaking Parts */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tổng Phần Tranh (P2 & P3)
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">{counts.total}</span>
            <span className="text-xs text-slate-500">phần thi</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Bao gồm tất cả đề thi Speaking & Full Test
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-emerald-200/80 dark:border-emerald-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Đã Có Gợi Ý (Hoàn tất)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {counts.completed}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-mono">
              {counts.rate}%
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${counts.rate}%` }}
            />
          </div>
        </div>

        {/* Pending */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Chờ Sinh Gợi Ý
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {counts.pending}
            </span>
            <span className="text-xs text-amber-600">cần xử lý</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Có ảnh nhưng chưa được sinh gợi ý AI
          </div>
        </div>

        {/* Missing Image */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-rose-200/80 dark:border-rose-900/40 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Thiếu Hình Ảnh
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {counts.missing}
            </span>
            <span className="text-xs text-rose-600">cần đính kèm</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Chưa tải ảnh lên đề, không thể phân tích
          </div>
        </div>
      </div>

      {/* ── FILTER & BATCH SETTINGS BAR ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên đề, part, hoặc từ khóa gợi ý..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Part Filter & Batch Options */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Part selection */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setPartFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  partFilter === "ALL"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Tất cả Part
              </button>
              <button
                onClick={() => setPartFilter("2")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  partFilter === "2"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Part 2 (1 Ảnh)
              </button>
              <button
                onClick={() => setPartFilter("3")}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  partFilter === "3"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                Part 3 (2 Ảnh)
              </button>
            </div>

            {/* Skip existing checkbox */}
            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none px-2">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-700"
              />
              <span>Bỏ qua đề đã có gợi ý</span>
            </label>

            {/* Delay selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 pl-2 border-l border-slate-200 dark:border-slate-800">
              <span>Độ trễ:</span>
              <select
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-mono focus:outline-none"
              >
                <option value={1000}>1.0s</option>
                <option value={1500}>1.5s (Khuyên dùng)</option>
                <option value={2000}>2.0s</option>
                <option value={3000}>3.0s</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "ALL"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            }`}
          >
            <span>Tất cả</span>
            <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[11px] font-mono">{counts.total}</span>
          </button>

          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "PENDING"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200/50 dark:border-amber-900/50"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Chờ sinh gợi ý</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-200/40 text-[11px] font-mono">{counts.pending}</span>
          </button>

          <button
            onClick={() => setStatusFilter("COMPLETED")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "COMPLETED"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 border border-emerald-200/50 dark:border-emerald-900/50"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã hoàn tất</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-200/40 text-[11px] font-mono">{counts.completed}</span>
          </button>

          <button
            onClick={() => setStatusFilter("MISSING_IMAGE")}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-2 ${
              statusFilter === "MISSING_IMAGE"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 border border-rose-200/50 dark:border-rose-900/50"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Thiếu ảnh</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-200/40 text-[11px] font-mono">{counts.missing}</span>
          </button>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-sm font-medium">Đang quét toàn bộ đề thi Speaking & hình ảnh...</span>
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
            <p className="text-xs text-slate-400 mt-1">Hãy thử đổi điều kiện tìm kiếm hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Đề Thi & Phần Thi</th>
                  <th className="py-3.5 px-4 w-32">Hình Ảnh Tranh</th>
                  <th className="py-3.5 px-4 w-36">Trạng Thái</th>
                  <th className="py-3.5 px-4">Từ Khóa & Gợi Ý AI Đã Sinh</th>
                  <th className="py-3.5 px-4 w-44 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
                {filteredItems.map((item, idx) => {
                  const isGenThis = generatingPartId === item.partId;
                  const keywords = item.vocabularyHints?.keywords || [];

                  return (
                    <tr
                      key={item.partId}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Exam Title & Part info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                          {item.examTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              item.partNumber === 2
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                                : "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
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

                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-4">
                        {item.hasImage ? (
                          <div className="flex items-center gap-1.5">
                            {item.imageUrl && (
                              <button
                                onClick={() =>
                                  setPreviewImage({
                                    title: `${item.examTitle} - Part ${item.partNumber} (Ảnh 1)`,
                                    url: item.imageUrl!,
                                    url2: item.secondImageUrl || undefined,
                                  })
                                }
                                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group hover:ring-2 hover:ring-indigo-500 transition-all bg-slate-100 dark:bg-slate-800"
                                title="Bấm để xem ảnh phóng to"
                              >
                                <img
                                  src={item.imageUrl}
                                  alt="Part 1"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            )}

                            {item.secondImageUrl && (
                              <button
                                onClick={() =>
                                  setPreviewImage({
                                    title: `${item.examTitle} - Part ${item.partNumber} (Ảnh 2)`,
                                    url: item.secondImageUrl!,
                                  })
                                }
                                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 group hover:ring-2 hover:ring-indigo-500 transition-all bg-slate-100 dark:bg-slate-800"
                                title="Bấm để xem ảnh 2 phóng to"
                              >
                                <img
                                  src={item.secondImageUrl}
                                  alt="Part 2"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-rose-500 font-medium">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>Chưa có ảnh</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {item.status === "COMPLETED" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã xong ({keywords.length})</span>
                          </span>
                        ) : item.status === "PENDING" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Chờ sinh AI</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                            <AlertTriangle className="w-3.5 h-3.5" />
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
                                +{keywords.length - 5} nữa
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
                            className={`p-2 rounded-lg text-xs font-medium transition-all ${
                              item.hasImage
                                ? "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 hover:shadow-xs"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            }`}
                            title={item.status === "COMPLETED" ? "Sinh lại gợi ý bằng AI" : "Sinh gợi ý AI"}
                          >
                            {isGenThis ? (
                              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>

                          {/* Edit Hints Button */}
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Chỉnh sửa từ khóa & mẫu câu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Open Exam Editor in new tab */}
                          <Link
                            href={`/admin/exams/${item.examId}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="Mở trình biên tập đề thi"
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
      </div>

      {/* ── BATCH PROGRESS MODAL ── */}
      {batchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Tiến Trình Sinh AI Hàng Loạt
                  </h3>
                  <p className="text-xs text-slate-500">
                    Phân tích ảnh tuần tự theo độ trễ an toàn {delayMs / 1000}s tránh quota rate limit.
                  </p>
                </div>
              </div>

              {!batchRunning && (
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Progress stats */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Tiến độ</span>
                <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {batchProgress.current} / {batchProgress.total}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50">
                <span className="text-[11px] text-emerald-600 uppercase font-semibold">Thành công</span>
                <div className="text-lg font-black text-emerald-600 font-mono">
                  {batchProgress.succeeded}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/50">
                <span className="text-[11px] text-slate-500 uppercase font-semibold">Bỏ qua</span>
                <div className="text-lg font-black text-slate-600 font-mono">
                  {batchProgress.skipped}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50">
                <span className="text-[11px] text-rose-600 uppercase font-semibold">Thất bại</span>
                <div className="text-lg font-black text-rose-600 font-mono">
                  {batchProgress.failed}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-300"
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
                  <span className="flex items-center gap-1 text-indigo-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang chạy...
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
                      ? "text-emerald-400"
                      : log.includes("❌")
                      ? "text-rose-400"
                      : log.includes("⚠️")
                      ? "text-amber-400"
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
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Dừng tiến trình</span>
                </button>
              ) : (
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
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
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[75vh] overflow-y-auto">
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5">
                <img src={previewImage.url} alt="Preview 1" className="w-full h-auto object-contain max-h-[65vh]" />
              </div>
              {previewImage.url2 && (
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black/5">
                  <img src={previewImage.url2} alt="Preview 2" className="w-full h-auto object-contain max-h-[65vh]" />
                </div>
              )}
            </div>
          </div>
        </div>
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

