"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  FileCode,
  Sparkles,
  Play,
  Upload,
  Download,
  FileJson,
  ExternalLink,
  X,
  Activity,
  Wrench,
  Check,
  Search,
  Filter,
  ArrowUpRight,
  Clock,
  BookOpen,
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
    id: "aptisacademy" | "aptiskytich";
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      const res = await api.admin.dataSync.getOverview();
      if (res.success && res.data) {
        setOverview(res.data);
      }
    } catch (err: any) {
      console.error("Lỗi khi tải tổng quan đồng bộ:", err);
    } finally {
      setLoadingOverview(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // 1. Chạy Auto-Standardize (Tự động chuẩn hóa & sửa lỗi CSDL)
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
            "Chuẩn hóa & khử trùng lặp dữ liệu đề thi thành công!",
        });
        await loadOverview();
      } else {
        setMessage({ type: "error", text: res.message || "Không thể chuẩn hóa dữ liệu." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi chuẩn hóa dữ liệu." });
    } finally {
      setStandardizing(false);
    }
  };

  // 2. Chạy Unit Test Đối Soát từng Part
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
            `Đã kiểm thử ${res.data.totalPartsTested} phần thi — Tỷ lệ đạt: ${res.data.overallPassRate}%`,
        });
      } else {
        setMessage({ type: "error", text: res.message || "Không thể chạy bộ Unit Test." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi khi chạy Unit Test đối soát." });
    } finally {
      setRunningAudit(false);
    }
  };

  // Xuất báo cáo đối soát ra file Markdown (.md)
  const handleExportAuditMarkdown = () => {
    if (!auditReport) return;
    const lines = [
      `# BÁO CÁO ĐỐI SOÁT UNIT TEST TOÀN BỘ ĐỀ THI APTIS ESOL`,
      `- **Thời gian kiểm định**: ${new Date(auditReport.checkedAt).toLocaleString("vi-VN")}`,
      `- **Tổng số phần thi đã kiểm thử**: **${auditReport.totalPartsTested} Parts**`,
      `- **Số phần thi ĐẠT chuẩn (PASS)**: **${auditReport.totalPassed} Parts**`,
      `- **Số phần thi LỖI (FAIL)**: **${auditReport.totalFailed} Parts**`,
      `- **Tỷ lệ đạt toàn cục**: **${auditReport.overallPassRate}%**`,
      ``,
      `## Bảng Chi Tiết Theo Từng Kỹ Năng & Phần Thi`,
      `| Kỹ năng | Phần thi | Định dạng chuẩn (Contract) | Số mẫu test | Đạt | Lỗi | Đề mẫu đại diện | Trạng thái |`,
      `| :--- | :--- | :--- | :---: | :---: | :---: | :--- | :---: |`,
      ...auditReport.suites.map(
        (s) =>
          `| **${s.skill}** | ${s.partKey} | \`${s.expectedFormat}\` | ${s.testedCount} | ${s.passedCount} | ${s.failedCount} | ${s.sampleExamTitle || "—"} (${s.sampleQuestionsCount} câu) | **${s.status}** |`
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BAO_CAO_DOI_SOAT_UNIT_TEST_${new Date().toISOString().slice(0, 10)}.md`;
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
            text: "Tệp JSON không chứa mảng đề thi hợp lệ (cần là mảng [...] hoặc { exams: [...] }).",
          });
          return;
        }

        setUploadedFileName(file.name);
        setUploadedExams(list);
        setSyncResult(null);
        setMessage({
          type: "success",
          text: `Đã đọc thành công tệp "${file.name}" (${list.length} đề thi sẵn sàng thẩm định/đồng bộ).`,
        });
      } catch (err: any) {
        setMessage({
          type: "error",
          text: `Không thể phân tích cú pháp tệp JSON: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  // Thực thi đồng bộ từ Snapshot trên Server hoặc từ file JSON đã upload
  const handleExecuteSync = async (options: {
    snapshotId?: "aptisacademy" | "aptiskytich";
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
          text: "Vui lòng tải lên tệp JSON hoặc chọn một kho Snapshot có sẵn trên máy chủ.",
        });
        setSyncing(false);
        return;
      }

      const res = await api.admin.dataSync.syncBatch(payload);
      if (res.success && res.data) {
        setSyncResult(res.data);
        setMessage({
          type: "success",
          text: res.message || "Hoàn tất tiến trình đồng bộ!",
        });
        if (!options.dryRun) {
          await loadOverview();
        }
      } else {
        setMessage({ type: "error", text: res.message || "Lỗi khi chạy đồng bộ đề thi." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Lỗi kết nối khi đồng bộ đề thi." });
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
            <span className="text-primary font-semibold">Đồng bộ &amp; Đối soát Đề thi</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-primary" />
            Trung Tâm Đồng Bộ Đa Nguồn &amp; Đối Soát Đề Thi
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản trị tập trung Data Contract, chuẩn hóa đa hình (Polymorphic QuestionType), Deep Upsert và chạy Unit Test tự động cho 5 kỹ năng Aptis ESOL.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. KPI CARDS REALTIME */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tổng Đề Thi Chuẩn Hóa
            </span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingOverview ? "..." : (overview?.summary.totalExams || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Đã khử trùng lặp 100% theo kỹ năng
          </div>
        </div>

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
            Đầy đủ Part 1–4 &amp; Full Test 16 Parts
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Kho Câu Hỏi Đa Hình
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">
            {loadingOverview ? "..." : (overview?.summary.totalQuestions || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            Gồm 7 định dạng câu hỏi khảo thí
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Sức Khỏe Data Contract
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
            {!loadingOverview && overview?.summary.isHealthy && (
              <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                CLEAN
              </span>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground mt-1">
            {overview?.anomalies.totalIssues === 0
              ? "Không có đề rỗng hoặc sai lệch kiểu"
              : `Phát hiện ${overview?.anomalies.totalIssues} điểm cần chuẩn hóa`}
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
          <span>1. Chẩn Đoán &amp; Tự Động Chuẩn Hóa (Auto-Heal)</span>
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
          <span>2. Unit Test Đối Soát Từng Part (5 Kỹ Năng)</span>
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
          <span>3. Đồng Bộ Đề Mới (Deep Upsert Engine)</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: CHẨN ĐOÁN & TỰ ĐỘNG CHUẨN HÓA (AUTO-HEAL)
         ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Khối kiểm tra 4 tiêu chí Data Contract & nút Auto-Heal */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Kiểm Định Tính Toàn Vẹn CSDL &amp; Tự Động Chuẩn Hóa (1-Click Auto-Heal)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Quét toàn bộ CSDL để phát hiện và tự động sửa: tên đề lệch chuẩn (&quot;Đề 1&quot; → &quot;Đề 01&quot;), đề bị nhân bản trùng lặp, đề rỗng 0 câu hỏi, và câu hỏi sai kiểu đa hình.
                </p>
              </div>

              <button
                onClick={handleRunStandardize}
                disabled={standardizing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-4 h-4 ${standardizing ? "animate-spin" : ""}`} />
                {standardizing
                  ? "Đang chuẩn hóa CSDL..."
                  : "Chạy Chuẩn Hóa & Khử Trùng Ngay"}
              </button>
            </div>

            {/* 4 Hạng mục kiểm định */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Đề Thi / Part Rỗng</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Đề không có câu hỏi nào
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
                  {(overview?.anomalies.emptyExamsCount || 0) === 0 ? "PASS" : "CẦN DỌN"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Nhóm Đề Trùng Tên</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Cùng kỹ năng &amp; tiêu đề chuẩn hóa
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
                  {(overview?.anomalies.duplicateGroupsCount || 0) === 0 ? "PASS" : "CẦN GỘP"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Lệch QuestionType Đa Hình</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Speaking/Writing/Reading P1 sai kiểu
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
                  {(overview?.anomalies.typeMismatchCount || 0) === 0 ? "PASS" : "CẦN FIX"}
                </span>
              </div>

              <div className="p-4 rounded-xl border border-border bg-muted/20 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-foreground">Câu Trắc Nghiệm Thiếu Đáp Án</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    MCQ / GapFill có &lt; 2 lựa chọn
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
                  {(overview?.anomalies.brokenOptionsCount || 0) === 0 ? "PASS" : "CẢNH BÁO"}
                </span>
              </div>
            </div>

            {lastStandardizeRes && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Kết quả lần chạy chuẩn hóa vừa xong ({lastStandardizeRes.durationMs}ms):
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-6 gap-y-1 pt-1">
                  <span>
                    • Chuẩn hóa tiêu đề:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.normalizedTitlesCount}
                    </strong>
                  </span>
                  <span>
                    • Khử đề trùng lặp:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.deduplicatedExamsCount}
                    </strong>
                  </span>
                  <span>
                    • Xóa đề rỗng:{" "}
                    <strong className="text-foreground">
                      {lastStandardizeRes.removedEmptyExamsCount}
                    </strong>
                  </span>
                  <span>
                    • Sửa QuestionType đa hình:{" "}
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
                  Phân Bổ Đề Thi Theo Kỹ Năng &amp; Nguồn Đồng Bộ
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

            {/* Bảng phân bổ theo QuestionType đa hình */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">
                  Phân Bổ Câu Hỏi Theo Kiểu Đa Hình (QuestionType)
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  Tổng: {(overview?.summary.totalQuestions || 0).toLocaleString()} câu
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                    <tr>
                      <th className="px-3.5 py-2.5">Kiểu Câu Hỏi (Enum)</th>
                      <th className="px-3.5 py-2.5">Ứng Dụng Phòng Thi</th>
                      <th className="px-3.5 py-2.5 text-right">Số Lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(overview?.byQuestionType || []).map((qt) => (
                      <tr key={qt.questionType} className="hover:bg-muted/30">
                        <td className="px-3.5 py-2.5 font-mono font-bold text-primary">
                          {qt.questionType}
                        </td>
                        <td className="px-3.5 py-2.5 text-muted-foreground">
                          {qt.questionType === "SPEAKING_AUDIO" && "Thu âm Microphone (Speaking Part 1-4)"}
                          {qt.questionType === "MULTIPLE_CHOICE" && "Trắc nghiệm A/B/C/D (Listening & Grammar)"}
                          {qt.questionType === "MATCHING" && "Nối quan điểm / Tiêu đề (Reading P3-4, Listening P2-3)"}
                          {qt.questionType === "SHORT_TEXT" && "Trả lời ngắn / Chat (Writing Part 1 & 3)"}
                          {qt.questionType === "ESSAY" && "Viết biểu mẫu & Email (Writing Part 2 & 4)"}
                          {qt.questionType === "GAP_FILL" && "Điền từ vào đoạn văn (Reading Part 1)"}
                          {qt.questionType === "SENTENCE_ORDER" && "Kéo thả sắp xếp câu (Reading Part 2)"}
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
          TAB 2: UNIT TEST ĐỐI SOÁT TỪNG PART (LIVE API ENGINE AUDIT)
         ===================================================================== */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Bộ Kiểm Thử Tự Động Unit Test Từng Part (Reading, Listening, Writing, Speaking &amp; Full Test)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Giả lập học viên VIP lấy đề qua <code className="font-mono text-foreground">ExamService.getExamQuestions()</code> để kiểm thử trực tiếp cấu trúc từng Part 1–4 của cả 4 kỹ năng và Đề thi thử 16 Parts.
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
                  {runningAudit ? "Đang chạy Unit Test..." : "Chạy Unit Test Đối Soát Ngay"}
                </button>

                {auditReport && (
                  <button
                    onClick={handleExportAuditMarkdown}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    Xuất Báo Cáo (.md)
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
                      Đạt (PASS) / Lỗi (FAIL)
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
                      Thời Gian Thực Thi
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
                      {sk === "ALL" ? "Tất cả (17 Suites)" : sk}
                    </button>
                  ))}
                </div>

                {/* Bảng kết quả chi tiết từng Part */}
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold">
                      <tr>
                        <th className="px-4 py-3">Kỹ Năng</th>
                        <th className="px-4 py-3">Phần Thi &amp; Đặc Tả</th>
                        <th className="px-4 py-3">Định Dạng Chuẩn (Contract)</th>
                        <th className="px-4 py-3 text-center">Số Mẫu Test</th>
                        <th className="px-4 py-3">Đề Mẫu Đại Diện</th>
                        <th className="px-4 py-3 text-right">Kết Quả</th>
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
                              {suite.status}
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
                  Sẵn sàng chạy Kiểm thử Unit Test Đối Soát
                </p>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Bấm nút &quot;Chạy Unit Test Đối Soát Ngay&quot; ở góc phải để kiểm tra tự động toàn bộ 17 phân vùng kỹ năng (Reading P1-4, Listening P1-4, Writing P1-4, Speaking P1-4 &amp; Full Test).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: ĐỒNG BỘ ĐỀ MỚI (DEEP UPSERT ENGINE)
         ===================================================================== */}
      {activeTab === "sync" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cột 1: Đồng bộ từ Kho Snapshot có sẵn trên Server */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary" />
                  Cách 1: Đồng Bộ Từ Kho Snapshot Crawler Trên Hệ Thống
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sử dụng trực tiếp dữ liệu chuẩn hóa từ thư mục <code className="font-mono">tools/data/</code> để chạy thẩm định (Dry-Run) hoặc Deep Upsert vào CSDL.
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
                          {snap.available ? snap.sizeFormatted : "Chưa có trên container"}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                        Source Tag: {snap.sourceCode}
                        {snap.updatedAt &&
                          ` • Cập nhật: ${new Date(snap.updatedAt).toLocaleDateString("vi-VN")}`}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleExecuteSync({ snapshotId: snap.id, dryRun: true })}
                        disabled={!snap.available || syncing}
                        className="px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Thẩm định thử
                      </button>
                      <button
                        onClick={() => handleExecuteSync({ snapshotId: snap.id, dryRun: false })}
                        disabled={!snap.available || syncing}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        Deep Upsert
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
                  Cách 2: Tải Tệp JSON Đề Thi Từ Máy Tính (normalized_exams.json)
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tải lên tệp JSON xuất từ công cụ Crawler (<code className="font-mono">aptisacademy</code>, <code className="font-mono">aptiskytich</code> hoặc nguồn bất kỳ) để nạp trực tiếp lên Production VPS.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-foreground shrink-0">
                    Nhãn nguồn (Source Tag):
                  </label>
                  <select
                    value={customSourceTag}
                    onChange={(e) => setCustomSourceTag(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs font-mono font-bold"
                  >
                    <option value="APTIS_ACADEMY">APTIS_ACADEMY (Aptis Academy)</option>
                    <option value="APTIS_KY_TICH">APTIS_KY_TICH (Aptis Kỳ Tích)</option>
                    <option value="KEY">KEY (Bộ Đề Tủ Dự Đoán)</option>
                    <option value="WEB">WEB (Mặc định)</option>
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
                      : "Bấm vào đây để chọn tệp .json từ máy tính"}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Hỗ trợ tệp lên tới 30MB • Tự động chuẩn hóa QuestionType &amp; kiểm tra Data Contract
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    onClick={() => handleExecuteSync({ dryRun: true })}
                    disabled={!uploadedExams || syncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border bg-background hover:bg-muted text-foreground transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    {syncing ? "Đang xử lý..." : "Kiểm Định Thử (Dry-Run)"}
                  </button>

                  <button
                    onClick={() => handleExecuteSync({ dryRun: false })}
                    disabled={!uploadedExams || syncing}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
                    {syncing ? "Đang đồng bộ..." : "Thực Thi Deep Upsert Vào CSDL"}
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
                    Kết Quả {syncResult.dryRun ? "Kiểm Định Thử (Dry-Run)" : "Đồng Bộ Deep Upsert"} — Nguồn:{" "}
                    <span className="font-mono text-primary">{syncResult.source}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Đã xử lý {syncResult.totalProcessed} đề thi trong {syncResult.durationMs}ms
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold">
                  {syncResult.dryRun ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Hợp lệ: {syncResult.validDryRunCount}
                    </span>
                  ) : (
                    <>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        Tạo mới: {syncResult.createdCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        Deep Update: {syncResult.deepUpdatedCount}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        Bảo toàn bài nộp: {syncResult.inPlaceUpdatedCount}
                      </span>
                    </>
                  )}
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 border border-red-500/20">
                    Bị chặn (Lỗi Contract): {syncResult.validationFailedCount}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b border-border uppercase text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Tên Đề Thi Chuẩn Hóa</th>
                      <th className="px-4 py-2.5">Kỹ Năng</th>
                      <th className="px-4 py-2.5 text-center">Số Câu</th>
                      <th className="px-4 py-2.5">Chi Tiết / Cảnh Báo</th>
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
                            <span className="text-red-500">{item.errors.join("; ")}</span>
                          ) : item.warnings && item.warnings.length > 0 ? (
                            <span className="text-amber-500">{item.warnings.join("; ")}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              Chuẩn Data Contract 100%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] ${
                              item.status === "VALIDATION_FAILED" || item.status === "ERROR"
                                ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            }`}
                          >
                            {item.status}
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
    </div>
  );
}

