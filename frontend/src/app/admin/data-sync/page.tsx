"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  GitCompare,
  Eye,
  AlertTriangle,
  Database,
  Layers,
  FileCode,
  Sparkles,
  Play,
  Upload,
  Download,
  FileJson,
  X,
  Activity,
  Wrench,
  Check,
  ArrowUpRight,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Lightbulb,
  Target,
  BarChart3,
  FlaskConical,
  Rocket,
} from "lucide-react";

interface OverviewData {
  summary: {
    totalExams: number;
    totalParts: number;
    totalQuestions: number;
    totalSubmissions: number;
    healthScore: number;
    isHealthy: boolean;
  };
  anomalies: {
    emptyExamsCount: number;
    duplicateGroupsCount: number;
    typeMismatchCount: number;
    brokenOptionsCount: number;
    totalIssues: number;
  };
  bySkill: Array<{ skill: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  byQuestionType: Array<{ questionType: string; count: number }>;
  snapshots: Array<{
    id: "aptisacademy" | "aptiskytich" | "aptistest";
    name: string;
    sourceCode: string;
    available: boolean;
    sizeFormatted: string;
    updatedAt: string | null;
  }>;
  checkedAt: string;
}

interface PartSuiteResult {
  skill: string;
  partKey: string;
  partName: string;
  expectedFormat: string;
  testedCount: number;
  passedCount: number;
  failedCount: number;
  sampleExamId: string | null;
  sampleExamTitle: string | null;
  sampleQuestionsCount: number;
  status: "PASS" | "FAIL" | "WARN";
  failures: Array<{ examId: string; examTitle: string; reason: string }>;
}

interface AuditReportData {
  overallPassRate: number;
  totalPartsTested: number;
  totalPassed: number;
  totalFailed: number;
  suites: PartSuiteResult[];
  durationMs: number;
  checkedAt: string;
}

interface SyncBatchResult {
  dryRun: boolean;
  source: string;
  totalProcessed: number;
  createdCount: number;
  deepUpdatedCount: number;
  inPlaceUpdatedCount: number;
  validDryRunCount: number;
  validationFailedCount: number;
  errorCount: number;
  durationMs: number;
  completedAt: string;
  details: Array<{
    status: string;
    id?: string;
    title: string;
    skill?: string;
    partsCount?: number;
    questionsCount?: number;
    submissionsPreserved?: number;
    action?: string;
    existingExamId?: string | null;
    diff?: any;
    incomingExam?: any;
    errors?: string[];
    warnings?: string[];
  }>;
}

const SKILL_LABELS: Record<string, { label: string; color: string }> = {
  SPEAKING: {
    label: "Speaking (Nói)",
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  LISTENING: {
    label: "Listening (Nghe)",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  WRITING: {
    label: "Writing (Viết)",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  READING: {
    label: "Reading (Đọc)",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  FULL_TEST: {
    label: "Full Test (Thi thử 4 Kỹ năng)",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  GRAMMAR_VOCABULARY: {
    label: "Grammar & Vocabulary",
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
};

export default function AdminDataSyncPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "audit" | "sync">("overview");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Tutorial Modal State
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialTab, setTutorialTab] = useState<"intro" | "metrics" | "heal" | "audit" | "sync" | "faq">("intro");

  // Auto-Standardize state
  const [standardizing, setStandardizing] = useState(false);
  const [lastStandardizeRes, setLastStandardizeRes] = useState<any | null>(null);

  // Unit Test Audit state
  const [runningAudit, setRunningAudit] = useState(false);
  const [sampleLimit, setSampleLimit] = useState(35);
  const [auditReport, setAuditReport] = useState<AuditReportData | null>(null);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>("ALL");

  // Batch Sync state
  const [syncing, setSyncing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedExams, setUploadedExams] = useState<any[] | null>(null);
  const [customSourceTag, setCustomSourceTag] = useState("APTIS_ACADEMY");
  const [syncResult, setSyncResult] = useState<SyncBatchResult | null>(null);

  // Side-by-Side Visual Diff Modal state
  const [selectedDiffItem, setSelectedDiffItem] = useState<any | null>(null);
  const [diffFilter, setDiffFilter] = useState<"ALL" | "CHANGED_ONLY" | "MEDIA_ONLY">("ALL");
  const [variantTagInput, setVariantTagInput] = useState<string>("Biến thể mới");
  const [resolvingAction, setResolvingAction] = useState<boolean>(false);

  // Xử lý 3 hành động Git-style quyết định: Ghi đè, Tạo biến thể, Bỏ qua
  const handleResolveExam = async (action: "OVERWRITE" | "CREATE_VARIANT" | "SKIP") => {
    if (!selectedDiffItem) return;
    try {
      setResolvingAction(true);
      const res = await api.admin.dataSync.resolveExam({
        action,
        incomingExam: selectedDiffItem.incomingExam || {
          title: selectedDiffItem.title,
          skill: selectedDiffItem.skill,
        },
        existingExamId: selectedDiffItem.existingExamId,
        variantTag: variantTagInput,
      });

      if (res.success) {
        setMessage({
          type: "success",
          text: res.message || "Xử lý đề thi thành công!",
        });
        setSelectedDiffItem(null);
        await loadOverview();
      } else {
        setMessage({
          type: "error",
          text: res.message || "Không thể xử lý đề thi.",
        });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Lỗi khi xử lý quyết định đề thi.",
      });
    } finally {
      setResolvingAction(false);
    }
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await api.admin.dataSync.getOverview();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải tổng quan ngân hàng đề:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // Close tutorial with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedDiffItem) setSelectedDiffItem(null);
        else if (showTutorial) setShowTutorial(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showTutorial, selectedDiffItem]);

  // 1. Chạy Tự Động Sửa Lỗi & Gộp Đề Trùng
  const handleRunStandardize = async () => {
    try {
      setStandardizing(true);
      setMessage(null);
      const res = await api.admin.dataSync.runStandardize();
      if (res.success) {
        setLastStandardizeRes(res.data);
        setMessage({
          type: "success",
          text:
            res.message ||
            "Đã kiểm tra & sửa lỗi tự động thành công! Toàn bộ kho đề đã được tối ưu.",
        });
        await loadOverview();
      } else {
        setMessage({ type: "error", text: res.message || "Không thể thực hiện kiểm tra và sửa lỗi." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi tối ưu dữ liệu." });
    } finally {
      setStandardizing(false);
    }
  };

  // 2. Chạy Kiểm Tra Phòng Thi Thực Tế Từng Part
  const handleRunAudit = async () => {
    try {
      setRunningAudit(true);
      setMessage(null);
      const res = await api.admin.dataSync.runAudit(sampleLimit);
      if (res.success && res.data) {
        setAuditReport(res.data);
        setMessage({
          type: res.data.totalFailed === 0 ? "success" : "error",
          text:
            res.message ||
            `Đã kiểm tra ${res.data.totalPartsTested} phần thi — Tỷ lệ đạt chuẩn: ${res.data.overallPassRate}%`,
        });
      } else {
        setMessage({ type: "error", text: res.message || "Không thể chạy kiểm tra phòng thi." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi chạy kiểm tra phòng thi." });
    } finally {
      setRunningAudit(false);
    }
  };

  // Xuất báo cáo kiểm tra ra file Markdown (.md)
  const handleExportAuditMarkdown = () => {
    if (!auditReport) return;
    const lines = [
      `# BÁO CÁO KIỂM TRA PHÒNG THI THỰC TẾ NGÂN HÀNG ĐỀ APTIS ESOL`,
      `- **Thời gian kiểm tra**: ${new Date(auditReport.checkedAt).toLocaleString("vi-VN")}`,
      `- **Tổng số phần thi đã kiểm tra**: **${auditReport.totalPartsTested} Phần thi (Parts)**`,
      `- **Số phần thi ĐẠT CHUẨN (PASS)**: **${auditReport.totalPassed} Phần thi**`,
      `- **Số phần thi CẦN KIỂM TRA (FAIL)**: **${auditReport.totalFailed} Phần thi**`,
      `- **Tỷ lệ hiển thị chuẩn toàn bộ**: **${auditReport.overallPassRate}%**`,
      ``,
      `## Chi Tiết Đánh Giá Từng Kỹ Năng & Phần Thi`,
      `| Kỹ năng | Phần thi | Yêu cầu chuẩn hiển thị | Số mẫu test | Đạt | Cần sửa | Đề mẫu xem thử | Trạng thái |`,
      `| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |`,
      ...auditReport.suites.map(
        (s) =>
          `| **${s.skill}** | ${s.partKey} | \`${s.expectedFormat}\` | ${s.testedCount} | ${s.passedCount} | ${s.failedCount} | ${s.sampleExamTitle || "—"} (${s.sampleQuestionsCount} câu) | **${s.status === "PASS" ? "ĐẠT CHUẨN" : s.status === "FAIL" ? "CẦN SỬA" : "CHƯA CÓ ĐỀ"}** |`
      ),
      ``,
      `## Hướng Dẫn Xử Lý Tiếp Theo`,
      `1. Với các phần thi có trạng thái **CẦN SỬA**, nhấp vào đề mẫu đại diện ở cột "Đề mẫu xem thử" để mở trang chỉnh sửa câu hỏi.`,
      `2. Chuyển sang Tab "1. Sức Khỏe Kho Đề & Tự Động Sửa Lỗi" và bấm nút "Bắt Đầu Tự Động Sửa Lỗi & Gộp Đề" để hệ thống tự động đưa các câu hỏi về đúng dạng chuẩn.`,
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BAO_CAO_KIEM_TRA_PHONG_THI_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Xử lý đọc file JSON từ máy tính quản trị viên
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawText = String(event.target?.result || "");
        const parsed = JSON.parse(rawText);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.exams)
          ? parsed.exams
          : Array.isArray(parsed.data)
          ? parsed.data
          : [];

        if (list.length === 0) {
          setMessage({
            type: "error",
            text: "Tệp JSON không chứa danh sách đề thi hợp lệ (cần là danh sách mảng [...] hoặc { exams: [...] }).",
          });
          return;
        }

        setUploadedFileName(file.name);
        setUploadedExams(list);
        setSyncResult(null);
        setMessage({
          type: "success",
          text: `Đã đọc thành công tệp "${file.name}" (${list.length} đề thi sẵn sàng kiểm tra thử hoặc nạp vào kho).`,
        });
      } catch (err: any) {
        setMessage({
          type: "error",
          text: `Không thể đọc tệp JSON: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Thực thi nạp từ Snapshot máy chủ hoặc từ file JSON đã upload
  const handleExecuteSync = async (options: {
    snapshotId?: "aptisacademy" | "aptiskytich" | "aptistest";
    dryRun: boolean;
  }) => {
    try {
      setSyncing(true);
      setMessage(null);

      const payload: any = {
        dryRun: options.dryRun,
        defaultSource: customSourceTag,
      };

      if (options.snapshotId) {
        payload.snapshotId = options.snapshotId;
      } else if (uploadedExams && uploadedExams.length > 0) {
        payload.exams = uploadedExams;
      } else {
        setMessage({
          type: "error",
          text: "Vui lòng tải lên tệp JSON hoặc chọn một kho đề có sẵn trên hệ thống.",
        });
        setSyncing(false);
        return;
      }

      const res = await api.admin.dataSync.syncBatch(payload);
      if (res.success && res.data) {
        setSyncResult(res.data);
        setMessage({
          type: "success",
          text: res.message || "Hoàn tất tiến trình xử lý đề thi!",
        });
        if (!options.dryRun) {
          await loadOverview();
        }
      } else {
        setMessage({ type: "error", text: res.message || "Lỗi khi xử lý dữ liệu đề thi." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi nạp dữ liệu đề thi." });
    } finally {
      setSyncing(false);
    }
  };

  const filteredSuites =
    auditReport?.suites.filter(
      (s) => selectedSkillFilter === "ALL" || s.skill === selectedSkillFilter
    ) || [];

  return (
    <div className="space-y-6">
      {/* 1. HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Bảng điều khiển
            </Link>
            <span>/</span>
            <Link href="/admin/exams" className="hover:text-foreground transition-colors">
              Học vụ
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold">Quản lý &amp; Tối ưu ngân hàng đề</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-primary" />
            Trung Tâm Quản Lý &amp; Tối Ưu Dữ Liệu Ngân Hàng Đề Thi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Kiểm tra chất lượng đề thi, tự động phát hiện &amp; sửa lỗi hiển thị, hợp nhất đề trùng lặp và nạp đề thi mới an toàn (bảo toàn lịch sử làm bài của học viên).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Hướng Dẫn Sử Dụng & Giải Thích Chi Tiết */}
          <button
            onClick={() => setShowTutorial(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all shadow-xs cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Hướng dẫn &amp; Giải thích tính năng</span>
          </button>

          <Link
            href="/admin/database-backup"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-blue-500" />
            Sao lưu CSDL
          </Link>

          <button
            onClick={loadOverview}
            disabled={loadingOverview}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? "animate-spin" : ""}`} />
            Làm mới số liệu
          </button>
        </div>
      </div>

      {/* 2. THÔNG BÁO FEEDBACK */}
      {message && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm animate-in fade-in duration-200 ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KPI CARDS REALTIME */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tổng đề */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Số Đề Thi
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingOverview ? "..." : (overview?.summary.totalExams || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Đã gom nhóm &amp; loại bỏ đề trùng lặp
          </div>
        </div>

        {/* Card 2: Tổng phần thi */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Phần Thi (Parts)
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingOverview ? "..." : (overview?.summary.totalParts || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Đầy đủ Part 1–4 các kỹ năng &amp; Đề thi thử
          </div>
        </div>

        {/* Card 3: Tổng câu hỏi */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Số Câu Hỏi
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingOverview ? "..." : (overview?.summary.totalQuestions || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Gồm 7 dạng bài: trắc nghiệm, điền từ, thu âm, viết...
          </div>
        </div>

        {/* Card 4: Sức khỏe đề thi */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Độ Hoàn Hảo Dữ Liệu
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                overview?.summary.isHealthy
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono flex items-center gap-2">
            <span>{loadingOverview ? "..." : `${overview?.summary.healthScore ?? 100}%`}</span>
            {!loadingOverview && (
              <span
                className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full border ${
                  overview?.summary.isHealthy
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                }`}
              >
                {overview?.summary.isHealthy ? "HOÀN HẢO" : "CẦN TỐI ƯU"}
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {overview?.anomalies.totalIssues === 0
              ? "Kho đề hoàn hảo, không có lỗi cấu trúc"
              : `Phát hiện ${overview?.anomalies.totalIssues} điểm cần tối ưu`}
          </div>
        </div>
      </div>

      {/* 4. NAVIGATION TABS */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("overview")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "overview"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>1. Sức Khỏe Kho Đề &amp; Tự Động Sửa Lỗi (1 Chạm)</span>
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "audit"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>2. Kiểm Tra Phòng Thi Thực Tế (5 Kỹ Năng)</span>
        </button>

        <button
          onClick={() => setActiveTab("sync")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sync"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>3. Thêm &amp; Cập Nhật Đề Thi Hàng Loạt</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: SỨC KHỎE KHO ĐỀ & TỰ ĐỘNG SỬA LỖI (AUTO-HEAL)
         ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Banner hướng dẫn nhanh */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <div>
              <strong>Tác dụng của phần này:</strong> Quét tự động toàn bộ đề thi để phát hiện lỗi định dạng, đề rỗng hoặc đề trùng tên. Khi bấm nút <strong>&quot;Bắt Đầu Tự Động Sửa Lỗi &amp; Gộp Đề&quot;</strong>, hệ thống sẽ tự động sửa chuẩn hóa mà <u>hoàn toàn không làm mất điểm hay bài làm</u> của học viên!
            </div>
          </div>

          {/* Khối kiểm tra 4 tiêu chí chất lượng & nút Tự động sửa */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Tự Động Quét &amp; Khắc Phục Lỗi Ngân Hàng Đề (1 Chạm)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quét toàn bộ kho đề để phát hiện và tự động sửa: tên đề lệch chuẩn (&quot;Đề 1&quot; → &quot;Đề 01&quot;), gom đề trùng tên, dọn đề trống 0 câu hỏi, và chuyển đổi câu hỏi về đúng dạng bài thi Aptis chuẩn.
                </p>
              </div>

              <button
                onClick={handleRunStandardize}
                disabled={standardizing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${standardizing ? "animate-spin" : ""}`} />
                {standardizing
                  ? "Đang tự động xử lý..."
                  : "Bắt Đầu Tự Động Sửa Lỗi & Gộp Đề"}
              </button>
            </div>

            {/* 4 Hạng mục kiểm định */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Đề / Phần Thi Trống</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Đề chưa có câu hỏi nào
                  </div>
                  <div className="mt-2 font-mono text-lg font-black text-foreground">
                    {overview?.anomalies.emptyExamsCount ?? 0} đề
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    (overview?.anomalies.emptyExamsCount || 0) === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {(overview?.anomalies.emptyExamsCount || 0) === 0 ? "ĐẠT CHUẨN" : "CẦN DỌN"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Đề Thi Trùng Tên Cần Gộp</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Cùng kỹ năng &amp; tên giống nhau
                  </div>
                  <div className="mt-2 font-mono text-lg font-black text-foreground">
                    {overview?.anomalies.duplicateGroupsCount ?? 0} nhóm
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    (overview?.anomalies.duplicateGroupsCount || 0) === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {(overview?.anomalies.duplicateGroupsCount || 0) === 0 ? "ĐẠT CHUẨN" : "CẦN GỘP"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Câu Hỏi Chưa Đúng Dạng Bài</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Ví dụ: Speaking/Writing/Reading P1 sai dạng câu
                  </div>
                  <div className="mt-2 font-mono text-lg font-black text-foreground">
                    {overview?.anomalies.typeMismatchCount ?? 0} câu
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    (overview?.anomalies.typeMismatchCount || 0) === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {(overview?.anomalies.typeMismatchCount || 0) === 0 ? "ĐẠT CHUẨN" : "CẦN SỬA"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Câu Trắc Nghiệm Thiếu Lựa Chọn</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Câu trắc nghiệm / điền từ có &lt; 2 phương án chọn
                  </div>
                  <div className="mt-2 font-mono text-lg font-black text-foreground">
                    {overview?.anomalies.brokenOptionsCount ?? 0} câu
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                    (overview?.anomalies.brokenOptionsCount || 0) === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  }`}
                >
                  {(overview?.anomalies.brokenOptionsCount || 0) === 0 ? "ĐẠT CHUẨN" : "CẦN LƯU Ý"}
                </span>
              </div>
            </div>

            {/* Báo cáo kết quả xử lý vừa xong */}
            {lastStandardizeRes && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Kết quả tự động xử lý thành công ({lastStandardizeRes.durationMs}ms):
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 pt-1">
                  <span>
                    • Chuẩn hóa tên đề (&quot;Đề 1&quot; → &quot;Đề 01&quot;):{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.normalizedTitlesCount}
                    </strong>
                  </span>
                  <span>
                    • Khử &amp; gộp đề trùng lặp:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.deduplicatedExamsCount}
                    </strong>
                  </span>
                  <span>
                    • Dọn dẹp đề trống không có câu hỏi:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.removedEmptyExamsCount}
                    </strong>
                  </span>
                  <span>
                    • Sửa câu hỏi về đúng dạng bài chuẩn:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.fixedQuestionTypesCount}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Phân bổ theo Kỹ năng & QuestionType */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bảng phân bổ theo Kỹ năng & Nguồn */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Phân Bổ Đề Thi Theo Kỹ Năng &amp; Nguồn Nạp
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Tổng: {(overview?.summary.totalExams || 0).toLocaleString()} đề
                </span>
              </div>

              <div className="space-y-2.5">
                {(overview?.bySkill || []).map((item) => {
                  const meta = SKILL_LABELS[item.skill] || {
                    label: item.skill,
                    color: "bg-slate-500/10 text-slate-600 border-slate-500/20",
                  };
                  const pct =
                    overview && overview.summary.totalExams > 0
                      ? Math.round((item.count / overview.summary.totalExams) * 100)
                      : 0;
                  return (
                    <div
                      key={item.skill}
                      className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden hidden sm:block">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-sm font-bold text-foreground w-16 text-right">
                          {item.count.toLocaleString()} đề
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">Nguồn dữ liệu:</span>
                {(overview?.bySource || []).map((src) => (
                  <span
                    key={src.source}
                    className="px-2.5 py-1 rounded-lg bg-muted text-foreground font-mono text-xs font-semibold border border-border"
                  >
                    {src.source}: {src.count.toLocaleString()} đề
                  </span>
                ))}
              </div>
            </div>

            {/* Bảng phân bổ theo QuestionType */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Phân Bổ Câu Hỏi Theo Dạng Bài Thi
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Tổng: {(overview?.summary.totalQuestions || 0).toLocaleString()} câu
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Dạng Câu Hỏi</th>
                      <th className="px-3.5 py-2.5">Ứng Dụng Trong Phòng Thi Của Học Viên</th>
                      <th className="px-3.5 py-2.5 text-right">Số Lượng Câu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-border">
                    {(overview?.byQuestionType || []).map((qt) => (
                      <tr key={qt.questionType} className="hover:bg-muted/30">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-primary">
                          {qt.questionType}
                        </td>
                        <td className="px-3.5 py-2.5 text-muted-foreground">
                          {qt.questionType === "SPEAKING_AUDIO" && "Thu âm Microphone (Speaking Part 1–4)"}
                          {qt.questionType === "MULTIPLE_CHOICE" && "Trắc nghiệm chọn đáp án A/B/C/D (Listening & Ngữ pháp)"}
                          {qt.questionType === "MATCHING" && "Nối quan điểm / Tiêu đề (Reading P3-4, Listening P2-3)"}
                          {qt.questionType === "SHORT_TEXT" && "Trả lời tin nhắn ngắn / Chat room (Writing Part 1 & 3)"}
                          {qt.questionType === "ESSAY" && "Viết biểu mẫu & Viết Email thân mật/trang trọng (Writing Part 2 & 4)"}
                          {qt.questionType === "GAP_FILL" && "Điền từ vào chỗ trống trong đoạn văn (Reading Part 1)"}
                          {qt.questionType === "SENTENCE_ORDER" && "Kéo thả sắp xếp câu thành bài văn (Reading Part 2 & 3)"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-foreground">
                          {qt.count.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: KIỂM TRA PHÒNG THI THỰC TẾ (LIVE AUDIT)
         ===================================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Banner giải thích */}
          <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-start gap-2.5">
            <Activity className="w-4 h-4 shrink-0 mt-0.5 text-purple-500" />
            <div>
              <strong>Cơ chế kiểm tra thực tế:</strong> Hệ thống sẽ đóng vai một học viên VIP vào thi từng đề để kiểm tra xem mọi câu hỏi có hiển thị đầy đủ trên màn hình, đúng chức năng tương tác (nghe, nói, kéo thả, gõ bài) hay không. Bạn có thể bấm trực tiếp vào tên đề thi để vào trang sửa nếu phát hiện lỗi!
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Bộ Kiểm Tra Tự Động Phòng Thi Học Viên (5 Kỹ Năng)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kiểm tra trực tiếp cấu trúc từng Part 1–4 của cả 4 kỹ năng (Reading, Listening, Writing, Speaking) và Đề thi thử liên hoàn 16 Parts.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground font-medium">Số đề mẫu/kỹ năng:</span>
                  <select
                    value={sampleLimit}
                    onChange={(e) => setSampleLimit(Number(e.target.value))}
                    className="px-2.5 py-2 rounded-xl border border-border bg-background text-foreground font-mono text-xs font-bold"
                  >
                    <option value={20}>20 đề / kỹ năng</option>
                    <option value={35}>35 đề / kỹ năng</option>
                    <option value={60}>60 đề / kỹ năng</option>
                    <option value={100}>100 đề / kỹ năng</option>
                  </select>
                </div>

                <button
                  onClick={handleRunAudit}
                  disabled={runningAudit}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Play className={`w-3.5 h-3.5 ${runningAudit ? "animate-spin" : ""}`} />
                  {runningAudit ? "Đang chạy kiểm tra..." : "Bắt Đầu Kiểm Tra Phòng Thi"}
                </button>

                {auditReport && (
                  <button
                    onClick={handleExportAuditMarkdown}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    Tải Báo Cáo (.md)
                  </button>
                )}
              </div>
            </div>

            {auditReport ? (
              <div className="space-y-4 pt-2">
                {/* Summary Banner */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Tỷ Lệ Đạt Chuẩn
                    </div>
                    <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                      {auditReport.overallPassRate}%
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Tổng Lượt Part Đã Test
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-1">
                      {auditReport.totalPartsTested} Parts
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Đạt (Tốt) / Cần Sửa (Lỗi)
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-1">
                      <span className="text-emerald-500">{auditReport.totalPassed}</span>
                      {" / "}
                      <span className={auditReport.totalFailed > 0 ? "text-red-500" : "text-muted-foreground"}>
                        {auditReport.totalFailed}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border">
                    <div className="text-[11px] text-muted-foreground uppercase font-semibold">
                      Thời Gian Thực Hiện
                    </div>
                    <div className="text-xl font-black font-mono text-foreground mt-1">
                      {auditReport.durationMs} ms
                    </div>
                  </div>
                </div>

                {/* Bộ lọc theo kỹ năng */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {["ALL", "READING", "LISTENING", "WRITING", "SPEAKING", "FULL_TEST"].map((sk) => (
                    <button
                      key={sk}
                      onClick={() => setSelectedSkillFilter(sk)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        selectedSkillFilter === sk
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {sk === "ALL" ? "Tất cả (17 Nhóm kiểm tra)" : sk}
                    </button>
                  ))}
                </div>

                {/* Bảng kết quả chi tiết từng Part */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-4 py-3">Kỹ Năng</th>
                        <th className="px-4 py-3">Phần Thi &amp; Nội Dung Kiểm Tra</th>
                        <th className="px-4 py-3">Yêu Cầu Chuẩn Hiển Thị</th>
                        <th className="px-4 py-3 text-center">Số Mẫu Test (Đạt / Tổng)</th>
                        <th className="px-4 py-3">Đề Mẫu Xem Thử</th>
                        <th className="px-4 py-3 text-right">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredSuites.map((suite) => (
                        <tr key={`${suite.skill}_${suite.partKey}`} className="hover:bg-muted/30">
                          <td className="px-4 py-3 font-mono font-bold text-foreground">
                            {suite.skill}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground">{suite.partName}</div>
                            {suite.failures.length > 0 && (
                              <div className="mt-1 text-[11px] text-red-500 space-y-0.5">
                                {suite.failures.slice(0, 3).map((f, idx) => (
                                  <div key={idx}>
                                    • {f.examTitle}: {f.reason}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-primary font-semibold">
                            {suite.expectedFormat}
                          </td>
                          <td className="px-4 py-3 text-center font-mono font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {suite.passedCount}
                            </span>
                            {" / "}
                            <span>{suite.testedCount}</span>
                          </td>
                          <td className="px-4 py-3">
                            {suite.sampleExamId ? (
                              <Link
                                href={`/admin/exams/${suite.sampleExamId}/edit`}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                title="Bấm để mở trang sửa đề thi này"
                              >
                                <span className="truncate max-w-[220px]">
                                  {suite.sampleExamTitle}
                                </span>
                                <span className="text-muted-foreground font-mono">
                                  ({suite.sampleQuestionsCount} câu)
                                </span>
                                <ArrowUpRight className="w-3 h-3 shrink-0" />
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                                suite.status === "PASS"
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : suite.status === "FAIL"
                                  ? "bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30"
                                  : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                              }`}
                            >
                              {suite.status === "PASS" && <Check className="w-3 h-3" />}
                              {suite.status === "PASS"
                                ? "ĐẠT CHUẨN"
                                : suite.status === "FAIL"
                                ? "CẦN SỬA"
                                : "CHƯA CÓ ĐỀ"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center rounded-xl border border-dashed border-border bg-muted/20">
                <Activity className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-bold text-foreground">
                  Sẵn sàng kiểm tra giao diện làm bài của học viên
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Bấm nút &quot;Bắt Đầu Kiểm Tra Phòng Thi&quot; ở góc phải để hệ thống tự động kiểm tra toàn bộ 17 phân vùng kỹ năng (Reading P1-4, Listening P1-4, Writing P1-4, Speaking P1-4 &amp; Full Test).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: THÊM & CẬP NHẬT ĐỀ THI HÀNG LOẠT
         ===================================================================== */}
      {activeTab === "sync" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Hộp chỉ dẫn an toàn nạp đề */}
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              Nguyên tắc vàng khi nạp đề thi mới:
            </div>
            <p>
              1. <strong>Luôn bấm &quot;Kiểm Tra Thử (Chưa Lưu)&quot; trước:</strong> Hệ thống sẽ đọc và kiểm tra từng câu hỏi trong file mà KHÔNG ghi đè CSDL, giúp bạn phát hiện ngay các câu bị thiếu đáp án hoặc sai định dạng.
            </p>
            <p>
              2. <strong>Bảo toàn kết quả học viên:</strong> Nếu đề thi đã có học viên làm bài và nộp điểm, hệ thống sẽ <u>giữ nguyên 100% lịch sử và điểm số</u> của học viên, chỉ cập nhật nội dung văn bản mới!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: Đồng bộ từ Kho Snapshot có sẵn trên Server */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Cách 1: Nạp Từ Kho Đề Có Sẵn Trên Hệ Thống
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sử dụng các gói đề thi đã được chuẩn bị sẵn trên máy chủ để nạp vào hệ thống luyện thi.
                </p>
              </div>

              <div className="space-y-3">
                {(overview?.snapshots || []).map((snap) => (
                  <div
                    key={snap.id}
                    className="p-4 rounded-xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{snap.name}</span>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            snap.available
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-500 border border-slate-500/20"
                          }`}
                        >
                          {snap.available ? snap.sizeFormatted : "Chưa có trên máy chủ"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                        Nguồn: {snap.sourceCode}
                        {snap.updatedAt &&
                          ` • Cập nhật: ${new Date(snap.updatedAt).toLocaleDateString("vi-VN")}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleExecuteSync({ snapshotId: snap.id, dryRun: true })}
                        disabled={!snap.available || syncing}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
                        title="Kiểm tra tính hợp lệ của tệp mà không lưu vào CSDL"
                      >
                        Kiểm tra thử
                      </button>
                      <button
                        onClick={() => handleExecuteSync({ snapshotId: snap.id, dryRun: false })}
                        disabled={!snap.available || syncing}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
                        title="Lưu chính thức vào ngân hàng đề"
                      >
                        Lưu vào hệ thống
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột 2: Upload trực tiếp file JSON từ máy tính Quản trị viên */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <FileJson className="w-4 h-4 text-primary" />
                  Cách 2: Tải Tệp Dữ Liệu Đề Thi (.json) Từ Máy Tính
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tải lên tệp JSON chứa danh sách đề thi mới từ máy tính của bạn để nạp trực tiếp lên hệ thống.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-foreground shrink-0">
                    Nguồn đề thi:
                  </label>
                  <select
                    value={customSourceTag}
                    onChange={(e) => setCustomSourceTag(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold"
                  >
                    <option value="APTIS_ACADEMY">APTIS_ACADEMY (Aptis Academy)</option>
                    <option value="APTIS_KY_TICH">APTIS_KY_TICH (Aptis Kỳ Tích)</option>
                    <option value="KEY">KEY (Bộ Đề Tủ Dự Đoán)</option>
                    <option value="WEB">WEB (Nguồn chung)</option>
                  </select>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/40 transition-all text-center cursor-pointer space-y-1.5"
                >
                  <Upload className="w-7 h-7 mx-auto text-primary" />
                  <div className="text-xs font-bold text-foreground">
                    {uploadedFileName
                      ? `Đã chọn: ${uploadedFileName} (${uploadedExams?.length || 0} đề)`
                      : "Bấm vào đây để chọn tệp .json từ máy tính của bạn"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Hỗ trợ tệp lên tới 30MB • Hệ thống tự động kiểm tra định dạng và cấu trúc đề trước khi lưu
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => handleExecuteSync({ dryRun: true })}
                    disabled={!uploadedExams || syncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    {syncing ? "Đang xử lý..." : "Kiểm Tra Thử (Chưa Lưu)"}
                  </button>

                  <button
                    onClick={() => handleExecuteSync({ dryRun: false })}
                    disabled={!uploadedExams || syncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Đang lưu..." : "Lưu Vào Hệ Thống"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bảng kết quả sau khi chạy Sync / Dry-Run */}
          {syncResult && (
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Kết Quả {syncResult.dryRun ? "Kiểm Tra Thử (Chưa Lưu Dữ Liệu)" : "Lưu Đề Vào Hệ Thống"} — Nguồn:{" "}
                    <span className="font-mono text-primary">{syncResult.source}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Đã xử lý {syncResult.totalProcessed} đề thi trong {syncResult.durationMs}ms
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                  {syncResult.dryRun ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Hợp lệ: {syncResult.validDryRunCount} đề
                    </span>
                  ) : (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Tạo mới: {syncResult.createdCount} đề
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Cập nhật nội dung: {syncResult.deepUpdatedCount} đề
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Bảo toàn an toàn bài làm: {syncResult.inPlaceUpdatedCount} đề
                      </span>
                    </>
                  )}
                  {syncResult.validationFailedCount > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20">
                      Bị chặn (Lỗi định dạng): {syncResult.validationFailedCount} đề
                    </span>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Tên Đề Thi</th>
                      <th className="px-4 py-2.5">Kỹ Năng</th>
                      <th className="px-4 py-2.5 text-center">Số Câu</th>
                      <th className="px-4 py-2.5">Chi Tiết / Đánh Giá</th>
                      <th className="px-4 py-2.5 text-right">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {syncResult.details.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 font-bold text-foreground">{item.title}</td>
                        <td className="px-4 py-2.5 font-mono text-muted-foreground">
                          {item.skill || "—"}
                        </td>
                        <td className="px-4 py-2.5 text-center font-mono">
                          {item.questionsCount ?? "—"}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground">
                          {item.errors && item.errors.length > 0 ? (
                            <div className="text-red-500 flex flex-col gap-0.5">
                              <span>{item.errors.join("; ")}</span>
                            </div>
                          ) : item.diff ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border ${
                                  item.diff.similarityPercent >= 95
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                    : item.diff.similarityPercent >= 70
                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                                }`}
                              >
                                Tương đồng: {item.diff.similarityPercent}%
                              </span>

                              {item.diff.modifiedQuestionsCount > 0 && (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">
                                  • {item.diff.modifiedQuestionsCount} câu sửa
                                </span>
                              )}
                              {item.diff.addedQuestionsCount > 0 && (
                                <span className="text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                                  • +{item.diff.addedQuestionsCount} câu mới
                                </span>
                              )}
                              {item.diff.mediaChangedPartsCount > 0 && (
                                <span className="text-purple-600 dark:text-purple-400 font-semibold text-[11px]">
                                  • Audio/Ảnh đổi
                                </span>
                              )}
                              {item.submissionsPreserved !== undefined && item.submissionsPreserved > 0 && (
                                <span className="text-indigo-600 dark:text-indigo-400 font-medium text-[10px]">
                                  (Đã có {item.submissionsPreserved} bài nộp)
                                </span>
                              )}

                              <button
                                onClick={() => setSelectedDiffItem(item)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-all cursor-pointer shadow-xs ml-auto"
                                title="Mở bảng so sánh trực quan 2 cột giữa đề trong CSDL và đề mới kéo về"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Xem So Sánh (Diff)</span>
                              </button>
                            </div>
                          ) : item.warnings && item.warnings.length > 0 ? (
                            <span className="text-amber-500">{item.warnings.join("; ")}</span>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-emerald-600 dark:text-emerald-400">
                                Đề mới hoàn toàn, định dạng chuẩn British Council
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                              item.status === "VALIDATION_FAILED" || item.status === "ERROR"
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : item.status === "CREATED"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : item.status === "IN_PLACE_UPDATED"
                                ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                            }`}
                          >
                            {item.status === "VALIDATION_FAILED"
                              ? "LỖI ĐỊNH DẠNG"
                              : item.status === "VALID_DRY_RUN"
                              ? "HỢP LỆ"
                              : item.status === "CREATED"
                              ? "TẠO MỚI"
                              : item.status === "DEEP_UPDATED"
                              ? "CẬP NHẬT"
                              : item.status === "IN_PLACE_UPDATED"
                              ? "BẢO TOÀN BÀI NỘP"
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          MODAL HƯỚNG DẪN SỬ DỤNG & GIẢI THÍCH CHI TIẾT (TUTORIAL MODAL)
         ===================================================================== */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Cẩm Nang Hướng Dẫn &amp; Giải Thích Chi Tiết
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Trung Tâm Quản Lý &amp; Tối Ưu Dữ Liệu Ngân Hàng Đề Thi Aptis ESOL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Đóng cửa sổ hướng dẫn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Navigation Tabs + Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Menu điều hướng bài hướng dẫn */}
              <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-3 space-y-1 shrink-0 overflow-y-auto">
                <button
                  onClick={() => setTutorialTab("intro")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "intro"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Target className={`w-3.5 h-3.5 ${tutorialTab === "intro" ? "text-primary-foreground" : "text-primary"}`} />
                    1. Mục đích của trang
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => setTutorialTab("metrics")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "metrics"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className={`w-3.5 h-3.5 ${tutorialTab === "metrics" ? "text-primary-foreground" : "text-blue-500"}`} />
                    2. Ý nghĩa 4 chỉ số
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => setTutorialTab("heal")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "heal"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className={`w-3.5 h-3.5 ${tutorialTab === "heal" ? "text-primary-foreground" : "text-amber-500"}`} />
                    3. Sửa lỗi &amp; Gộp đề
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => setTutorialTab("audit")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "audit"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical className={`w-3.5 h-3.5 ${tutorialTab === "audit" ? "text-primary-foreground" : "text-purple-500"}`} />
                    4. Kiểm tra phòng thi
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => setTutorialTab("sync")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "sync"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Rocket className={`w-3.5 h-3.5 ${tutorialTab === "sync" ? "text-primary-foreground" : "text-emerald-500"}`} />
                    5. Thêm đề mới an toàn
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>

                <button
                  onClick={() => setTutorialTab("faq")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    tutorialTab === "faq"
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className={`w-3.5 h-3.5 ${tutorialTab === "faq" ? "text-primary-foreground" : "text-indigo-500"}`} />
                    6. Câu hỏi thường gặp
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>

              {/* Nội dung chi tiết từng tab */}
              <div className="flex-1 p-5 md:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-foreground">
                {/* 1. MỤC ĐÍCH */}
                {tutorialTab === "intro" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      Trang này sinh ra để làm gì?
                    </h4>
                    <p>
                      Hệ thống của chúng ta hiện quản lý hơn <strong>1,690 đề thi</strong> với hơn <strong>15,300 câu hỏi</strong> thuộc 5 kỹ năng thi Aptis ESOL (Reading, Listening, Writing, Speaking, Grammar &amp; Vocabulary).
                    </p>
                    <p>
                      Mỗi kỹ năng Aptis lại có các dạng bài thi rất đặc thù:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li><strong>Speaking:</strong> Phải ghi âm bằng Microphone và phát audio câu hỏi.</li>
                      <li><strong>Reading:</strong> Part 1 là điền từ đoạn văn, Part 2 là kéo thả sắp xếp câu, Part 3 &amp; 4 là nối quan điểm và nối tiêu đề.</li>
                      <li><strong>Writing:</strong> Part 1 &amp; 3 là trả lời tin nhắn ngắn, Part 2 &amp; 4 là điền form và viết email dài.</li>
                      <li><strong>Listening:</strong> Phải có file âm thanh Audio và các phương án chọn trắc nghiệm.</li>
                    </ul>
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <strong className="text-foreground">Mục đích chính của trang:</strong> Giúp Quản trị viên và Đội ngũ Học vụ có thể:
                      <ol className="list-decimal pl-5 mt-1 space-y-1 text-muted-foreground">
                        <li><strong>Kiểm soát chất lượng:</strong> Biết ngay đề nào đang bị lỗi, thiếu đáp án hoặc rỗng câu hỏi để sửa kịp thời trước khi học viên làm bài.</li>
                        <li><strong>Tự động sửa lỗi 1 chạm:</strong> Chỉ cần bấm 1 nút, hệ thống tự động dọn rác, gộp các đề trùng tên và chuyển câu hỏi về đúng dạng chuẩn.</li>
                        <li><strong>Thêm đề thi mới mà không mất dữ liệu:</strong> Nạp thêm hàng trăm đề thi từ file JSON mà vẫn bảo toàn 100% lịch sử và điểm số của học viên cũ!</li>
                      </ol>
                    </div>
                  </div>
                )}

                {/* 2. Ý NGHĨA CHỈ SỐ */}
                {tutorialTab === "metrics" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-500" />
                      Ý nghĩa 4 chỉ số &amp; 4 thẻ cảnh báo
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="text-foreground">1. Tổng Số Đề Thi:</strong> Tổng số bài thi thực tế mà học viên có thể bấm vào luyện tập. Đã được khử các đề nhân bản trùng lặp.
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="text-foreground">2. Tổng Phần Thi (Parts):</strong> Tổng số phần thi. Mỗi đề có từ 1 đến 4 phần thi riêng lẻ (hoặc 16 phần thi đối với đề Thi Thử 4 Kỹ Năng Full Test).
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="text-foreground">3. Tổng Số Câu Hỏi:</strong> Toàn bộ câu hỏi khảo thí trên toàn hệ thống.
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="text-foreground">4. Độ Hoàn Hảo Dữ Liệu (%):</strong> Thước đo độ sạch và chuẩn của kho đề. Càng gần 100% chứng tỏ kho đề càng hoàn hảo, không có đề rỗng hay câu hỏi sai dạng.
                      </div>
                    </div>

                    <h5 className="font-bold text-foreground pt-2">Giải thích 4 thẻ cảnh báo bên dưới:</h5>
                    <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground">
                      <li><strong>Đề / Phần thi trống (CẦN DỌN):</strong> Có đề thi được tạo nhưng bên trong có 0 câu hỏi. Cần dọn để tránh học viên bấm vào làm một đề trống trơn.</li>
                      <li><strong>Đề thi trùng tên (CẦN GỘP):</strong> Ví dụ có 2 đề đều mang tên &quot;Reading Test 01&quot;. Hệ thống sẽ gộp lại và ưu tiên giữ đề có nhiều học viên làm nhất.</li>
                      <li><strong>Câu hỏi chưa đúng dạng bài (CẦN SỬA):</strong> Ví dụ đề Speaking nhưng câu hỏi lại bị lưu thành câu trắc nghiệm. Khi bấm Tự động sửa, hệ thống sẽ đưa về dạng thu âm microphone.</li>
                      <li><strong>Câu trắc nghiệm thiếu lựa chọn (CẦN LƯU Ý):</strong> Câu hỏi trắc nghiệm hoặc điền từ chỉ có 1 hoặc 0 phương án lựa chọn, học viên sẽ không chọn được đáp án. Cần vào bổ sung đáp án cho câu đó.</li>
                    </ul>
                  </div>
                )}

                {/* 3. TỰ ĐỘNG SỬA LỖI */}
                {tutorialTab === "heal" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Khi nào nên bấm nút &quot;Bắt Đầu Tự Động Sửa Lỗi &amp; Gộp Đề&quot;?
                    </h4>
                    <p>
                      Bạn nên bấm nút này khi:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                      <li>Thẻ <strong>&quot;Độ hoàn hảo dữ liệu&quot;</strong> dưới 100%.</li>
                      <li>Các thẻ cảnh báo hiển thị nhãn <strong>CẦN DỌN</strong>, <strong>CẦN GỘP</strong> hoặc <strong>CẦN SỬA</strong>.</li>
                      <li>Vừa nạp thêm một tệp đề thi mới từ giáo viên hoặc công cụ import.</li>
                    </ul>

                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                      <strong>Khi bạn bấm nút, hệ thống tự động làm 4 việc trong tích tắc:</strong>
                      <ol className="list-decimal pl-5 mt-1 space-y-1">
                        <li><strong>Chuẩn hóa tên đề:</strong> Tự động sửa các tên lệch như &quot;Đề 1&quot; thành &quot;Đề 01&quot;, &quot;Test 2&quot; thành &quot;Test 02&quot; để danh sách đề thi xếp theo đúng thứ tự đẹp mắt.</li>
                        <li><strong>Dọn dẹp đề rỗng:</strong> Tự động xóa các đề 0 câu hỏi mà chưa có học viên nào làm bài.</li>
                        <li><strong>Gộp đề trùng tên:</strong> Nếu phát hiện các đề trùng nhau, hệ thống ưu tiên giữ lại đề có nhiều câu hỏi và nhiều bài làm nhất, loại bỏ đề rác trùng lặp.</li>
                        <li><strong>Sửa dạng bài:</strong> Đưa toàn bộ câu hỏi Speaking về thu âm mic, Writing về trả lời ngắn/viết luận, Reading P1 về điền từ.</li>
                      </ol>
                    </div>

                    <p className="text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span><strong>Bảo đảm an toàn:</strong> Thao tác này hoàn toàn không làm mất bất kỳ bài nộp, bài chấm điểm hay tài khoản nào của học viên!</span>
                    </p>
                  </div>
                )}

                {/* 4. KIỂM TRA PHÒNG THI */}
                {tutorialTab === "audit" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" />
                      Tab 2: Kiểm tra phòng thi thực tế hoạt động như thế nào?
                    </h4>
                    <p>
                      Tính năng này đóng vai trò như một <strong>&quot;Học viên VIP ảo&quot;</strong>. Khi bạn bấm nút <strong>&quot;Bắt Đầu Kiểm Tra Phòng Thi&quot;</strong>, hệ thống sẽ:
                    </p>
                    <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                      <li>Truy cập vào từng đề thi giống hệt cách một học viên thật mở bài thi trên website.</li>
                      <li>Kiểm tra xem giao diện phòng thi có nạp đầy đủ các Part từ 1 đến 4 không.</li>
                      <li>Kiểm tra xem câu hỏi có đúng định dạng tương tác không (Speaking có bật mic không, Reading Part 2 có khung kéo thả không...).</li>
                    </ol>

                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <strong className="text-foreground">Cách đọc bảng kết quả kiểm tra:</strong>
                      <ul className="list-disc pl-5 mt-1 space-y-1 text-muted-foreground">
                        <li><strong>ĐẠT CHUẨN (PASS - Màu xanh):</strong> Phần thi hiển thị hoàn hảo, học viên làm bài trơn tru không lỗi.</li>
                        <li><strong>CẦN SỬA (FAIL - Màu đỏ):</strong> Đề thi đang có lỗi (ví dụ thiếu options hoặc part rỗng). Bảng sẽ liệt kê chính xác tên đề và nguyên nhân. Bạn có thể <u>nhấp trực tiếp vào tên đề thi</u> để mở trang chỉnh sửa ngay lập tức!</li>
                        <li><strong>Nút &quot;Tải Báo Cáo (.md)&quot;:</strong> Xuất toàn bộ bảng kết quả kiểm tra thành tệp văn bản để lưu trữ hoặc gửi cho bộ phận học vụ.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* 5. NẠP ĐỀ MỚI */}
                {tutorialTab === "sync" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-emerald-500" />
                      Quy trình 3 bước chuẩn khi nạp thêm đề thi mới
                    </h4>
                    
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <strong className="text-foreground">Bước 1: Chọn hoặc tải tệp dữ liệu đề thi (.json)</strong>
                        <p className="text-muted-foreground mt-0.5">
                          Bạn có thể chọn kho Snapshot có sẵn trên hệ thống (Cách 1) hoặc tải lên tệp JSON từ máy tính của bạn (Cách 2). Chọn đúng nhãn nguồn (ví dụ Aptis Academy hoặc Bộ đề tủ).
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-blue-500/30 bg-blue-500/5">
                        <strong className="text-blue-700 dark:text-blue-300">Bước 2: Luôn bấm &quot;Kiểm Tra Thử (Chưa Lưu)&quot; trước!</strong>
                        <p className="text-muted-foreground mt-0.5">
                          Hệ thống sẽ chạy thử để phát hiện xem tệp JSON có câu nào thiếu đề bài, thiếu lựa chọn hay không. Xem bảng kết quả bên dưới: nếu cột trạng thái toàn màu xanh <strong>HỢP LỆ</strong> thì bạn có thể yên tâm nạp vào kho!
                        </p>
                      </div>

                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                        <strong className="text-emerald-700 dark:text-emerald-300">Bước 3: Bấm &quot;Lưu Vào Hệ Thống&quot;</strong>
                        <p className="text-muted-foreground mt-0.5">
                          Hệ thống sẽ thêm đề mới vào kho. Nếu đề đã có học viên làm bài từ trước, hệ thống sẽ tự động kích hoạt chế độ <strong>Bảo toàn an toàn bài làm</strong>: chỉ cập nhật nội dung chữ và media, <u>giữ nguyên 100% điểm số và bài nộp cũ của học viên</u>!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. FAQ */}
                {tutorialTab === "faq" && (
                  <div className="space-y-3.5">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-indigo-500" />
                      Các câu hỏi thường gặp của Quản trị viên
                    </h4>
                    
                    <div className="space-y-2.5">
                      <div className="p-3 rounded-xl border border-border bg-muted/20">
                        <div className="font-bold text-foreground">
                          Q: Tôi bấm nút &quot;Bắt Đầu Tự Động Sửa Lỗi &amp; Gộp Đề&quot; thì có làm mất kết quả thi của học viên không?
                        </div>
                        <div className="text-muted-foreground mt-1">
                          <strong>Trả lời:</strong> Hoàn toàn không! Hệ thống có cơ chế bảo vệ kép: chỉ những đề rỗng (chưa có câu hỏi nào) và chưa có học viên nào nộp bài mới bị dọn dẹp. Những đề đã có học viên thi sẽ được giữ nguyên an toàn 100%.
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/20">
                        <div className="font-bold text-foreground">
                          Q: Tần suất tôi nên vào trang này kiểm tra là bao lâu một lần?
                        </div>
                        <div className="text-muted-foreground mt-1">
                          <strong>Trả lời:</strong> Bạn nên vào trang này kiểm tra 1 tuần một lần hoặc sau mỗi lần nạp thêm đề thi mới. Nếu thấy độ hoàn hảo dữ liệu đạt 95%–100% là hệ thống đang hoạt động rất tốt!
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/20">
                        <div className="font-bold text-foreground">
                          Q: Tại sao tôi thấy thẻ cảnh báo &quot;Câu trắc nghiệm thiếu lựa chọn&quot;?
                        </div>
                        <div className="text-muted-foreground mt-1">
                          <strong>Trả lời:</strong> Do một số câu hỏi trắc nghiệm trong quá trình nhập liệu ban đầu bị thiếu các phương án chọn A/B/C/D. Bạn có thể sang Tab 2 (Kiểm tra phòng thi) để xem danh sách các đề đó và bấm vào chỉnh sửa bổ sung phương án.
                        </div>
                      </div>

                      <div className="p-3 rounded-xl border border-border bg-muted/20">
                        <div className="font-bold text-foreground">
                          Q: Tệp JSON đề thi từ máy tính có giới hạn dung lượng bao nhiêu?
                        </div>
                        <div className="text-muted-foreground mt-1">
                          <strong>Trả lời:</strong> Hệ thống hỗ trợ tệp JSON tải lên tới 30MB (chứa hàng trăm đề thi cùng lúc). Luôn nhớ bấm &quot;Kiểm Tra Thử&quot; trước khi bấm &quot;Lưu Vào Hệ Thống&quot; nhé!
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex items-center justify-between bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                Mẹo: Bạn có thể nhấn phím <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">Esc</kbd> để đóng nhanh cửa sổ này.
              </span>
              <button
                onClick={() => setShowTutorial(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Đã hiểu &amp; Đóng hướng dẫn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL SO SÁNH TRỰC QUAN 2 CỘT (SIDE-BY-SIDE VISUAL DIFF)
         ===================================================================== */}
      {selectedDiffItem && selectedDiffItem.diff && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <GitCompare className="w-5 h-5" />
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Bảng So Sánh Đối Chiếu Đề Thi (Side-by-Side Visual Diff)
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                    {selectedDiffItem.skill}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Đề thi: <strong className="text-foreground">{selectedDiffItem.title}</strong>
                  {selectedDiffItem.diff.titleChanged && (
                    <span className="text-amber-500 ml-2">
                      (Đổi tiêu đề từ &quot;{selectedDiffItem.diff.existingTitle}&quot; → &quot;{selectedDiffItem.diff.incomingTitle}&quot;)
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setSelectedDiffItem(null)}
                className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors cursor-pointer self-end sm:self-center"
                title="Đóng cửa sổ so sánh (Esc)"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="px-5 py-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-muted-foreground">Chỉ số đối chiếu:</span>
                <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-muted text-foreground border border-border">
                  Độ khớp: {selectedDiffItem.diff.similarityPercent}%
                </span>
                <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Giữ nguyên: {selectedDiffItem.diff.unchangedQuestionsCount} câu
                </span>
                <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Thay đổi: {selectedDiffItem.diff.modifiedQuestionsCount} câu
                </span>
                {selectedDiffItem.diff.addedQuestionsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    Thêm mới: {selectedDiffItem.diff.addedQuestionsCount} câu
                  </span>
                )}
                {selectedDiffItem.diff.removedQuestionsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    Bị thiếu/xóa: {selectedDiffItem.diff.removedQuestionsCount} câu
                  </span>
                )}
                {selectedDiffItem.diff.mediaChangedPartsCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg font-mono font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Audio/Ảnh: {selectedDiffItem.diff.mediaChangedPartsCount} phần
                  </span>
                )}
              </div>

              {/* Bộ lọc xem */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setDiffFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    diffFilter === "ALL"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  Tất Cả
                </button>
                <button
                  onClick={() => setDiffFilter("CHANGED_ONLY")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    diffFilter === "CHANGED_ONLY"
                      ? "bg-amber-500 text-white"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  Chỉ Câu Thay Đổi
                </button>
                <button
                  onClick={() => setDiffFilter("MEDIA_ONLY")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    diffFilter === "MEDIA_ONLY"
                      ? "bg-purple-600 text-white"
                      : "bg-muted/50 hover:bg-muted text-muted-foreground"
                  }`}
                >
                  Chỉ Đổi Audio/Ảnh
                </button>
              </div>
            </div>

            {/* Modal Body: Two-Column Side-by-Side Diff */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
              {/* Git Diff Terminal-style Banner */}
              <div className="p-3 rounded-xl bg-muted/60 border border-border font-mono text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">$</span>
                  <span className="text-foreground font-semibold">git diff --exam</span>
                  <span className="text-red-500">a/[CSDL: "{selectedDiffItem.diff.existingTitle}"]</span>
                  <span className="text-muted-foreground">...</span>
                  <span className="text-emerald-500">b/[CRAWL: "{selectedDiffItem.diff.incomingTitle}"]</span>
                </div>
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{selectedDiffItem.diff.addedQuestionsCount} insertions</span>
                  <span className="text-red-600 dark:text-red-400 font-bold">-{selectedDiffItem.diff.removedQuestionsCount} deletions</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">~{selectedDiffItem.diff.modifiedQuestionsCount} changes</span>
                </div>
              </div>
              {/* Cột tiêu đề mẫu */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sticky top-0 z-10 bg-card py-2 border-b border-border font-bold text-xs uppercase tracking-wider">
                <div className="flex items-center justify-between text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border">
                  <span>CỘT TRÁI: Dữ Liệu Đang Có Trong CSDL (Hiện Tại)</span>
                  <span className="font-mono text-[11px] font-normal">
                    {selectedDiffItem.diff.existingDuration} phút • {selectedDiffItem.diff.totalExistingQuestions} câu
                  </span>
                </div>
                <div className="flex items-center justify-between text-primary bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                  <span>CỘT PHẢI: Dữ Liệu Mới Kéo Về / Tải Lên (Sắp Nạp)</span>
                  <span className="font-mono text-[11px] font-normal">
                    {selectedDiffItem.diff.incomingDuration} phút • {selectedDiffItem.diff.totalIncomingQuestions} câu
                  </span>
                </div>
              </div>

              {/* Danh sách từng Part */}
              {selectedDiffItem.diff.parts
                .filter((part: any) => {
                  if (diffFilter === "MEDIA_ONLY") return part.mediaChanged;
                  if (diffFilter === "CHANGED_ONLY") {
                    return (
                      part.status !== "UNCHANGED" ||
                      part.questions.some((q: any) => q.status !== "UNCHANGED")
                    );
                  }
                  return true;
                })
                .map((part: any, pIdx: number) => {
                  const filteredQuestions = part.questions.filter((q: any) => {
                    if (diffFilter === "CHANGED_ONLY") return q.status !== "UNCHANGED";
                    return true;
                  });

                  return (
                    <div
                      key={pIdx}
                      className="border border-border rounded-2xl overflow-hidden bg-background shadow-xs space-y-3"
                    >
                      {/* Part Header */}
                      <div className="p-3.5 bg-muted/30 border-b border-border flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            Part {part.part_number}: {part.title}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
                            part.status === "UNCHANGED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {part.status === "UNCHANGED" ? "ĐỒNG NHẤT 100%" : "CÓ SỰ THAY ĐỔI"}
                        </span>
                      </div>

                      {/* Part Media Diff (nếu có audio, hình ảnh, bài đọc) */}
                      {(part.existingMedia?.audio_url ||
                        part.incomingMedia?.audio_url ||
                        part.existingMedia?.image_url ||
                        part.incomingMedia?.image_url ||
                        part.existingMedia?.passage_text ||
                        part.incomingMedia?.passage_text) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 px-4 py-2 text-xs border-b border-border/60">
                          {/* Cột trái: Media hiện tại */}
                          <div className="p-3 rounded-xl bg-muted/20 border border-border/80 space-y-1.5">
                            <div className="text-[11px] font-bold text-muted-foreground uppercase">
                              Tài nguyên Media CSDL
                            </div>
                            {part.existingMedia?.audio_url ? (
                              <div className="text-muted-foreground truncate">
                                🎵 Audio: <span className="font-mono text-foreground">{part.existingMedia.audio_url}</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic">Không có Audio</div>
                            )}
                            {part.existingMedia?.image_url ? (
                              <div className="text-muted-foreground truncate">
                                🖼️ Ảnh: <span className="font-mono text-foreground">{part.existingMedia.image_url}</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Cột phải: Media mới */}
                          <div
                            className={`p-3 rounded-xl border space-y-1.5 ${
                              part.mediaChanged
                                ? "bg-amber-500/10 border-amber-500/30"
                                : "bg-muted/20 border-border/80"
                            }`}
                          >
                            <div className="text-[11px] font-bold text-primary uppercase flex items-center justify-between">
                              <span>Tài nguyên Media Mới</span>
                              {part.mediaChanged && (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                                  [ĐÃ ĐỔI MEDIA]
                                </span>
                              )}
                            </div>
                            {part.incomingMedia?.audio_url ? (
                              <div className="text-muted-foreground truncate">
                                🎵 Audio: <span className="font-mono text-foreground">{part.incomingMedia.audio_url}</span>
                              </div>
                            ) : (
                              <div className="text-muted-foreground italic">Không có Audio</div>
                            )}
                            {part.incomingMedia?.image_url ? (
                              <div className="text-muted-foreground truncate">
                                🖼️ Ảnh: <span className="font-mono text-foreground">{part.incomingMedia.image_url}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Danh sách câu hỏi đối chiếu 2 cột */}
                      <div className="p-4 space-y-3">
                        {filteredQuestions.length === 0 ? (
                          <div className="text-center py-4 text-xs text-muted-foreground italic">
                            Không có câu hỏi nào thay đổi trong phần thi này.
                          </div>
                        ) : (
                          filteredQuestions.map((q: any, qIdx: number) => {
                            const isMod = q.status === "MODIFIED";
                            const isAdd = q.status === "ADDED";
                            const isRem = q.status === "REMOVED";

                            return (
                              <div
                                key={qIdx}
                                className={`grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 rounded-xl border transition-colors ${
                                  isMod
                                    ? "bg-amber-500/10 border-amber-500/40"
                                    : isAdd
                                    ? "bg-blue-500/10 border-blue-500/40"
                                    : isRem
                                    ? "bg-red-500/10 border-red-500/40"
                                    : "bg-muted/10 border-border/60"
                                }`}
                              >
                                {/* Cột trái: Câu hỏi trong CSDL */}
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold font-mono text-foreground">
                                      Câu {q.question_number} (CSDL Hiện Tại)
                                    </span>
                                    {q.existing ? (
                                      <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                                        {q.existing.question_type} • {q.existing.max_score}đ
                                      </span>
                                    ) : null}
                                  </div>

                                  {q.existing ? (
                                    <>
                                      <div className="text-foreground font-medium">
                                        {q.existing.prompt}
                                      </div>
                                      {Array.isArray(q.existing.options) && q.existing.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {q.existing.options.map((opt: any, oIdx: number) => {
                                            const optText = typeof opt === "string" ? opt : opt.text || opt.label;
                                            const isCorrect =
                                              String(optText || "").trim() === String(q.existing.correct_answer || "").trim() ||
                                              String(opt.key || "").trim() === String(q.existing.correct_answer || "").trim();

                                            return (
                                              <span
                                                key={oIdx}
                                                className={`px-2 py-0.5 rounded text-[11px] ${
                                                  isCorrect
                                                    ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                              >
                                                {optText}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {q.existing.correct_answer && (
                                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                                          Đáp án đúng: <strong>{q.existing.correct_answer}</strong>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-muted-foreground italic text-xs py-2">
                                      — Câu hỏi này không tồn tại trong CSDL cũ (Mới được thêm).
                                    </div>
                                  )}
                                </div>

                                {/* Cột phải: Câu hỏi mới kéo về */}
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold font-mono text-primary flex items-center gap-1.5">
                                      <span>Câu {q.question_number} (Dữ Liệu Mới)</span>
                                      {isMod && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                                          ĐÃ ĐỔI: {q.changedFields?.join(", ")}
                                        </span>
                                      )}
                                      {isAdd && (
                                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                          MỚI THÊM
                                        </span>
                                      )}
                                    </span>
                                    {q.incoming ? (
                                      <span className="font-mono text-[10px] text-primary px-1.5 py-0.5 rounded bg-primary/10">
                                        {q.incoming.question_type} • {q.incoming.max_score}đ
                                      </span>
                                    ) : null}
                                  </div>

                                  {q.incoming ? (
                                    <>
                                      <div
                                        className={`font-medium ${
                                          q.changedFields?.includes("prompt")
                                            ? "text-amber-700 dark:text-amber-300 font-bold bg-amber-500/10 p-1 rounded"
                                            : "text-foreground"
                                        }`}
                                      >
                                        {q.incoming.prompt}
                                      </div>
                                      {Array.isArray(q.incoming.options) && q.incoming.options.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                          {q.incoming.options.map((opt: any, oIdx: number) => {
                                            const optText = typeof opt === "string" ? opt : opt.text || opt.label;
                                            const isCorrect =
                                              String(optText || "").trim() === String(q.incoming.correct_answer || "").trim() ||
                                              String(opt.key || "").trim() === String(q.incoming.correct_answer || "").trim();

                                            return (
                                              <span
                                                key={oIdx}
                                                className={`px-2 py-0.5 rounded text-[11px] ${
                                                  isCorrect
                                                    ? "bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/40"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                              >
                                                {optText}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      )}
                                      {q.incoming.correct_answer && (
                                        <div
                                          className={`text-[11px] font-mono ${
                                            q.changedFields?.includes("correct_answer")
                                              ? "text-amber-700 dark:text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded inline-block"
                                              : "text-emerald-600 dark:text-emerald-400"
                                          }`}
                                        >
                                          Đáp án đúng: <strong>{q.incoming.correct_answer}</strong>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <div className="text-red-500 italic text-xs py-2">
                                      — Câu hỏi này đã bị lược bỏ trong tệp dữ liệu mới.
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer với 3 Lựa Chọn Quyết Định (Git Merge Conflict Resolution) */}
            <div className="p-4 border-t border-border flex flex-col gap-3 bg-muted/20 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-muted-foreground">
                <div>
                  {selectedDiffItem.submissionsPreserved > 0 ? (
                    <span className="text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      Cơ chế bảo vệ: Đã có {selectedDiffItem.submissionsPreserved} học viên làm bài thi này. Chọn "Ghi đè" sẽ Safe In-Place Update (bảo toàn 100% ID và điểm thi).
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      Cơ chế cập nhật: Đề này chưa có lượt thi nào. Chọn "Ghi đè" sẽ Deep Replace toàn diện dữ liệu mới nhất.
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground shrink-0 text-[11px]">Nhãn Biến Thể:</span>
                  <input
                    type="text"
                    value={variantTagInput}
                    onChange={(e) => setVariantTagInput(e.target.value)}
                    placeholder="VD: Biến thể Nam nói trước (MWBW)"
                    className="px-2.5 py-1 text-xs rounded-lg border border-border bg-background text-foreground w-60 focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-border/50">
                <button
                  onClick={() => setSelectedDiffItem(null)}
                  disabled={resolvingAction}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
                >
                  Đóng (Esc)
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Nút 3: Bỏ qua */}
                  <button
                    onClick={() => handleResolveExam("SKIP")}
                    disabled={resolvingAction}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                    title="Bỏ qua đề này, không lưu hay tác động gì vào Database"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>3. Bỏ Qua Đề Này</span>
                  </button>

                  {/* Nút 2: Tạo thành Biến Thể Liên Kết */}
                  <button
                    onClick={() => handleResolveExam("CREATE_VARIANT")}
                    disabled={resolvingAction}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    title="Tạo đề thi mới độc lập nhưng liên kết là Biến thể đề thi của đề gốc (Khuyên dùng cho đề tủ thi thật xoay vòng giọng đọc/tranh)"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-purple-500" />
                    <span>2. Tạo Thành Biến Thể Liên Kết</span>
                  </button>

                  {/* Nút 1: Ghi đè đề cũ */}
                  <button
                    onClick={() => handleResolveExam("OVERWRITE")}
                    disabled={resolvingAction}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    title="Cập nhật hoặc ghi đè nội dung mới lên đề thi cũ trong CSDL"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${resolvingAction ? "animate-spin" : ""}`} />
                    <span>1. Ghi Đè Đề Cũ (Overwrite)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
