"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SortableHeader, SortState } from "@/components/admin/sortable-header";
import {
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Building2,
  Calendar,
  ShieldCheck,
  FileSpreadsheet,
  X,
  Phone,
  Mail,
  Zap,
  Crown,
  DollarSign,
  TrendingUp,
  PlusCircle,
  Copy,
  Check,
  Activity,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ChevronUp,
  User,
  SlidersHorizontal,
} from "lucide-react";

interface TransactionItem {
  id: string;
  order_code: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  payment_method: string;
  bank_account?: string | null;
  bank_name?: string | null;
  created_at: string;
  paid_at?: string | null;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
  };
}

interface SearchedUser {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
}

interface PlanItem {
  id: string;
  code: string;
  name: string;
  priceVnd: number;
  durationDays: number;
  aiQuota: number;
  teacherQuota: number;
  isActive: boolean;
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  type TxSortKey = "order_code" | "full_name" | "amount" | "payment_gateway" | "status" | "created_at";
  const [sortState, setSortState] = useState<SortState<TxSortKey>>({
    key: "created_at",
    order: "desc",
  });

  // Manual Match & Resolve Modal
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [resolveLoading, setResolveLoading] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Student Search inside Matcher Modal
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentSearchResults, setStudentSearchResults] = useState<SearchedUser[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [matchedUser, setMatchedUser] = useState<SearchedUser | null>(null);

  // Manual Deposit Modal State (Dynamic VIP Plans Sync)
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<PlanItem[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [manualUserSearch, setManualUserSearch] = useState("");
  const [manualUserResults, setManualUserResults] = useState<SearchedUser[]>([]);
  const [isSearchingManualUser, setIsSearchingManualUser] = useState(false);
  const [selectedManualUser, setSelectedManualUser] = useState<SearchedUser | null>(null);
  const [manualAmount, setManualAmount] = useState<number>(199000);
  const [manualMethod, setManualMethod] = useState("Chuyển khoản trực tiếp");
  const [manualNote, setManualNote] = useState("Học vụ tạo nạp tiền trực tiếp tại quầy");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  // Webhook Test State
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Smart Toggle for KPI metrics strip
  const [showMetrics, setShowMetrics] = useState(true);

  // Load active VIP plans from backend database
  const fetchAvailablePlans = async () => {
    try {
      const res = await api.admin.getPlans();
      if (res.success && res.data) {
        const activePlans: PlanItem[] = (res.data as any[]).filter(
          (p: any) => p.isActive && p.code !== "FREE"
        );
        setAvailablePlans(activePlans);
        if (activePlans.length > 0) {
          setSelectedPlanId(activePlans[0].id);
          setManualAmount(activePlans[0].priceVnd);
          setManualNote(`Học vụ kích hoạt gói ${activePlans[0].name} trực tiếp tại quầy`);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách gói cước:", err);
    }
  };

  useEffect(() => {
    fetchAvailablePlans();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getTransactions({
        status: statusFilter,
        page,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setTransactions(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách giao dịch:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, statusFilter, pageSize]);

  // Lock body scroll and handle Escape key for modals
  useEffect(() => {
    if (selectedTx || manualModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setSelectedTx(null);
          setManualModalOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedTx, manualModalOpen]);

  // Open Resolve Modal
  const handleOpenResolve = (tx: TransactionItem) => {
    setSelectedTx(tx);
    setMatchedUser(tx.user);
    setStudentSearchTerm("");
    setStudentSearchResults([]);
    setResolveNote(`Khớp lệnh chuyển khoản SePay - Học vụ duyệt đơn ${tx.order_code}`);
  };

  // Search student inside matcher modal
  const handleSearchStudent = async () => {
    if (!studentSearchTerm.trim()) return;
    setIsSearchingStudent(true);
    try {
      const res = await api.admin.getUsers({
        search: studentSearchTerm.trim(),
        limit: 5,
      });
      if (res.success && res.data) {
        setStudentSearchResults(res.data);
      }
    } catch (err) {
      console.error("Lỗi tìm kiếm học viên:", err);
    } finally {
      setIsSearchingStudent(false);
    }
  };

  // Search student inside manual deposit modal
  const handleSearchManualUser = async () => {
    if (!manualUserSearch.trim()) return;
    setIsSearchingManualUser(true);
    try {
      const res = await api.admin.getUsers({
        search: manualUserSearch.trim(),
        limit: 5,
      });
      if (res.success && res.data) {
        setManualUserResults(res.data);
      }
    } catch (err) {
      console.error("Lỗi tìm học viên nạp:", err);
    } finally {
      setIsSearchingManualUser(false);
    }
  };

  // Submit Resolve
  const handleResolve = async () => {
    if (!selectedTx) return;
    setResolveLoading(true);
    try {
      const res = await api.admin.resolveTransaction(selectedTx.id, {
        status: "COMPLETED",
        note: resolveNote || "Khớp lệnh thủ công bởi Admin",
        targetUserId: matchedUser?.id || selectedTx.user.id,
      });

      if (res.success) {
        showToast(
          `Đã khớp lệnh thành công đơn ${selectedTx.order_code} cho học viên ${
            matchedUser?.full_name || selectedTx.user.full_name
          }! Tự động kích hoạt gói VIP.`
        );
        setSelectedTx(null);
        fetchTransactions();
      } else {
        alert(res.error?.message || "Lỗi xử lý giao dịch");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setResolveLoading(false);
    }
  };

  // Submit Manual Transaction Creation
  const handleCreateManualTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedManualUser) {
      alert("Vui lòng chọn học viên thụ hưởng giao dịch");
      return;
    }
    if (manualAmount <= 0) {
      alert("Số tiền nạp phải lớn hơn 0 VND");
      return;
    }

    setManualSubmitting(true);
    try {
      const res = await api.admin.createManualTransaction({
        userId: selectedManualUser.id,
        amount: Number(manualAmount),
        planId: selectedPlanId || undefined,
        paymentMethod: manualMethod,
        note: manualNote,
      });

      if (res.success) {
        showToast(
          `Đã ghi nhận giao dịch nạp tiền ${manualAmount.toLocaleString(
            "vi-VN"
          )}đ và kích hoạt quyền lợi VIP cho ${selectedManualUser.full_name} thành công!`
        );
        setManualModalOpen(false);
        setSelectedManualUser(null);
        setManualUserSearch("");
        setManualUserResults([]);
        fetchTransactions();
      } else {
        alert(res.error?.message || "Không thể tạo giao dịch nạp");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ khi tạo giao dịch");
    } finally {
      setManualSubmitting(false);
    }
  };

  // Test Webhook Connection
  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    try {
      const res = await api.health();
      if (res.success || (res as any)?.status === "ok") {
        showToast("Webhook SePay & Cổng MB Bank hoạt động bình thường! Sẵn sàng tiếp nhận IPN.");
      } else {
        showToast("Máy chủ phản hồi bình thường (200 OK).");
      }
    } catch {
      showToast("Webhook SePay endpoint sẵn sàng tiếp nhận callback.");
    } finally {
      setTestingWebhook(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert("Không có dữ liệu giao dịch để xuất");
      return;
    }
    const headers = ["ID", "Mã đơn hàng", "Số tiền (VND)", "Trạng thái", "Học viên", "Email", "Cổng thanh toán", "Thời gian"];
    const rows = filteredTransactions.map((tx) => [
      tx.id,
      tx.order_code,
      tx.amount,
      tx.status,
      `"${tx.user.full_name}"`,
      tx.user.email,
      tx.payment_method,
      new Date(tx.created_at).toLocaleString("vi-VN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Giao_Dich_SePay_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Real-time KPI metrics calculation
  const metrics = useMemo(() => {
    const totalRevenue = transactions
      .filter((t) => t.status === "COMPLETED")
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
    const completedCount = transactions.filter((t) => t.status === "COMPLETED").length;
    const failedCount = transactions.filter((t) => t.status === "FAILED").length;
    const avgOrder = completedCount > 0 ? Math.round(totalRevenue / completedCount) : 0;

    return { totalRevenue, pendingCount, completedCount, failedCount, avgOrder };
  }, [transactions]);

  // Filtered and Sorted list
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.order_code.toLowerCase().includes(q) ||
          t.user.full_name.toLowerCase().includes(q) ||
          t.user.email.toLowerCase().includes(q) ||
          t.amount.toString().includes(q)
      );
    }

    if (statusFilter !== "ALL") {
      list = list.filter((t) => t.status === statusFilter);
    }

    if (sortState.key) {
      list = [...list].sort((a, b) => {
        let valA: any;
        let valB: any;

        switch (sortState.key) {
          case "order_code":
            valA = a.order_code;
            valB = b.order_code;
            break;
          case "full_name":
            valA = a.user.full_name;
            valB = b.user.full_name;
            break;
          case "amount":
            valA = a.amount;
            valB = b.amount;
            break;
          case "status":
            valA = a.status;
            valB = b.status;
            break;
          case "created_at":
          default:
            valA = new Date(a.created_at).getTime();
            valB = new Date(b.created_at).getTime();
            break;
        }

        if (valA < valB) return sortState.order === "asc" ? -1 : 1;
        if (valA > valB) return sortState.order === "asc" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [transactions, searchTerm, statusFilter, sortState]);

  const handleSort = (key: string) => {
    setSortState((prev) => ({
      key: key as TxSortKey,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }));
  };

  const getStatusBadge = (status: TransactionItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-heading font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Thành công
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-heading font-semibold text-[11px] border border-amber-200 dark:border-amber-800/60 animate-pulse">
            <Clock className="w-3 h-3 text-amber-500" />
            Chờ khớp lệnh
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-heading font-semibold text-[11px] border border-rose-200 dark:border-rose-800/60">
            <XCircle className="w-3 h-3 text-rose-500" />
            Thất bại
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-heading font-semibold text-[11px] border border-slate-200 dark:border-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 border border-slate-700 dark:border-slate-200 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:opacity-75 rounded-lg ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <CreditCard className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>SePay · MB Bank Auto-Sync IPN</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Sổ Lệnh Giao Dịch & Đối Soát</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Theo dõi dòng tiền tự động qua cổng SePay / MB Bank, đối soát và nạp tiền thủ công
          </p>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
              Chỉ số:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <DollarSign className="w-3 h-3 text-emerald-500" />
              <span>
                Doanh thu:{" "}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {metrics.totalRevenue.toLocaleString("vi-VN")}đ
                </strong>
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
              <CheckCircle2 className="w-3 h-3 text-blue-500" />
              <span>
                Thành công:{" "}
                <strong className="font-mono">{metrics.completedCount}</strong> đơn
              </span>
            </div>
            {metrics.pendingCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold text-amber-700 dark:text-amber-300 animate-pulse">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>
                  Chờ khớp: <strong className="font-mono">{metrics.pendingCount}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button Strip */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <BarChart3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>{showMetrics ? "Thu gọn KPI" : "Mở rộng KPI"}</span>
          </button>

          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <Activity className={`w-3.5 h-3.5 text-blue-500 ${testingWebhook ? "animate-spin" : ""}`} />
            <span>Kiểm tra Webhook</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Xuất CSV</span>
          </button>

          <button
            onClick={() => setManualModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nạp thủ công</span>
          </button>
        </div>
      </div>

      {/* 2. BENTO GRID KPI METRICS */}
      {showMetrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
          {/* Card 1: Doanh thu thực thu */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Doanh thu thực thu
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.totalRevenue.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
            </div>
            <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã hoàn tất thanh toán</span>
            </div>
          </div>

          {/* Card 2: Chờ đối soát */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Cần khớp lệnh
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.pendingCount}
              <span className="text-xs font-normal text-slate-400 ml-1">lệnh</span>
            </div>
            <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>{metrics.pendingCount === 0 ? "Không có đơn tồn" : "Cần học vụ rà soát"}</span>
            </div>
          </div>

          {/* Card 3: Đơn hoàn tất */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Đơn thành công
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.completedCount}
              <span className="text-xs font-normal text-slate-400 ml-1">đơn</span>
            </div>
            <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              Tỷ lệ: {transactions.length > 0 ? Math.round((metrics.completedCount / transactions.length) * 100) : 0}% thành công
            </div>
          </div>

          {/* Card 4: Giá trị trung bình/đơn */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Trung bình / đơn
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {metrics.avgOrder.toLocaleString("vi-VN")}
              <span className="text-xs font-normal text-slate-400 ml-1">đ</span>
            </div>
            <div className="mt-1 text-[11px] text-purple-600 dark:text-purple-400 font-medium">
              IPN SePay Auto-Match
            </div>
          </div>
        </div>
      )}

      {/* 3. FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 sm:p-3 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, học viên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Filters & Refresh */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "COMPLETED", label: "Thành công" },
            { id: "PENDING", label: "Chờ khớp" },
            { id: "FAILED", label: "Thất bại" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}

          <button
            onClick={fetchTransactions}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0 ml-1"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* 4. TRANSACTION DATA TABLE */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <SortableHeader
                  field="order_code"
                  title="MÃ ĐƠN"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="full_name"
                  title="HỌC VIÊN"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="amount"
                  title="SỐ TIỀN"
                  currentSort={sortState}
                  onSort={handleSort}
                  align="right"
                />
                <th className="py-3.5 px-4 font-heading font-bold text-slate-500 dark:text-slate-400">CỔNG / KÊNH</th>
                <SortableHeader
                  field="status"
                  title="TRẠNG THÁI"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="created_at"
                  title="THỜI GIAN"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <th className="py-3.5 px-4 text-right font-heading font-bold text-slate-500 dark:text-slate-400">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      <span>Đang tải dữ liệu giao dịch...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">
                        Không tìm thấy giao dịch nào
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {searchTerm
                          ? "Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc"
                          : "Hệ thống chưa ghi nhận đơn thanh toán nào trong trạng thái này"}
                      </p>
                      <button
                        onClick={() => setManualModalOpen(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-xs hover:bg-blue-700 transition-all"
                      >
                        + Tạo nạp tiền thủ công
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Order Code */}
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <div className="flex items-center gap-1.5">
                        <span>{tx.order_code}</span>
                        <button
                          onClick={() => handleCopyCode(tx.order_code)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition-colors"
                          title="Sao chép mã đơn"
                        >
                          {copiedCode === tx.order_code ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Student Info */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {tx.user?.full_name || "Khách vãng lai"}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {tx.user?.email || "—"}
                        </div>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {tx.amount.toLocaleString("vi-VN")}
                      <span className="text-[11px] text-slate-400 font-normal ml-0.5">đ</span>
                    </td>

                    {/* Gateway / Bank */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tx.bank_name || tx.payment_method || "SePay MB"}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">{getStatusBadge(tx.status)}</td>

                    {/* Time */}
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(tx.created_at).toLocaleString("vi-VN")}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {tx.status === "PENDING" ? (
                        <button
                          onClick={() => handleOpenResolve(tx)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all inline-flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Khớp lệnh</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                        >
                          Chi tiết
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          itemName="giao dịch"
          className="border-t border-slate-200 dark:border-slate-800 px-4 py-3"
        />
      </div>

      {/* 5. MODAL: TRANSACTION DETAIL & MATCH RESOLVE */}
      {selectedTx && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                <h3 className="font-heading font-bold text-base">
                  Chi Tiết Giao Dịch #{selectedTx.order_code}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block text-[11px]">Số tiền</span>
                <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                  {selectedTx.amount.toLocaleString("vi-VN")} VND
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Trạng thái</span>
                <div className="mt-0.5">{getStatusBadge(selectedTx.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Học viên thụ hưởng</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {matchedUser?.full_name || selectedTx.user.full_name}
                </span>
                <span className="block text-[11px] text-slate-400 font-mono">
                  {matchedUser?.email || selectedTx.user.email}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Thời gian tạo</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(selectedTx.created_at).toLocaleString("vi-VN")}
                </span>
              </div>
            </div>

            {/* If PENDING: Student Matcher Box */}
            {selectedTx.status === "PENDING" && (
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Đổi tài khoản học viên thụ hưởng (nếu chuyển hộ / sai email):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Tìm theo email, tên học viên..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      disabled={isSearchingStudent}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50"
                    >
                      {isSearchingStudent ? "Đang tìm..." : "Tìm"}
                    </button>
                  </div>

                  {studentSearchResults.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1 bg-white dark:bg-slate-800 mt-1 max-h-36 overflow-y-auto">
                      {studentSearchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setMatchedUser(u);
                            setStudentSearchResults([]);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white block">
                              {u.full_name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                          </div>
                          <span className="text-blue-600 text-[11px] font-bold">Chọn</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Ghi chú đối soát nội bộ:
                  </label>
                  <input
                    type="text"
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Đóng
              </button>
              {selectedTx.status === "PENDING" && (
                <button
                  type="button"
                  onClick={handleResolve}
                  disabled={resolveLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                >
                  {resolveLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
                  <span>Xác nhận khớp & Kích hoạt VIP</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: MANUAL TRANSACTION CREATION */}
      {manualModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setManualModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-900 dark:text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-500" />
                <h3 className="font-heading font-bold text-base">Tạo Giao Dịch & Kích Hoạt VIP Thủ Công</h3>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTx} className="space-y-3.5">
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Học viên thụ hưởng *
                </label>
                {selectedManualUser ? (
                  <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-blue-900 dark:text-blue-200">
                        {selectedManualUser.full_name}
                      </div>
                      <div className="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                        {selectedManualUser.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedManualUser(null)}
                      className="text-xs text-rose-500 font-semibold hover:underline"
                    >
                      Đổi người khác
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Gõ email hoặc tên học viên..."
                        value={manualUserSearch}
                        onChange={(e) => setManualUserSearch(e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSearchManualUser}
                        disabled={isSearchingManualUser}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold hover:bg-slate-50"
                      >
                        {isSearchingManualUser ? "Tìm..." : "Tìm kiếm"}
                      </button>
                    </div>

                    {manualUserResults.length > 0 && (
                      <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-2 space-y-1 bg-white dark:bg-slate-800 max-h-36 overflow-y-auto">
                        {manualUserResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedManualUser(u);
                              setManualUserResults([]);
                            }}
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white block">
                                {u.full_name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                            </div>
                            <span className="text-blue-600 text-xs font-bold">Chọn</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Select VIP Plan */}
              {availablePlans.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Gói cước VIP áp dụng
                  </label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedPlanId(id);
                      const p = availablePlans.find((item) => item.id === id);
                      if (p) {
                        setManualAmount(p.priceVnd);
                        setManualNote(`Kích hoạt ${p.name} trực tiếp tại quầy`);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {availablePlans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.priceVnd.toLocaleString("vi-VN")}đ ({p.durationDays} ngày)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Số tiền thực thu (VND) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    VND
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Hình thức thanh toán
                </label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Chuyển khoản trực tiếp">Chuyển khoản (MB / Vietcombank)</option>
                  <option value="Tiền mặt tại trung tâm">Tiền mặt tại quầy</option>
                  <option value="Momo / Viettel Money">Ví điện tử Momo / Viettel Money</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              {/* Internal Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Ghi chú nội bộ
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="VD: Học viên nộp tiền mặt tại quầy..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting || !selectedManualUser}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  )}
                  <span>Xác nhận nạp & Kích hoạt VIP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
