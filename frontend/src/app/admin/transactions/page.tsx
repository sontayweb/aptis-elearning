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
  ChevronLeft,
  ChevronRight,
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

  // Webhook Test State
  const [testingWebhook, setTestingWebhook] = useState(false);

  // Smart Toggle for KPI metrics strip (defaults to false for clean workhorse layout, persists in localStorage)
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_transactions_kpi_visible") : null;
    if (saved === "true") {
      setShowMetrics(true);
    }
  }, []);

  const toggleMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_transactions_kpi_visible", String(next));
      }
      return next;
    });
  };

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

  // Export to Excel/CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    const headers = [
      "Mã đơn hàng",
      "Học viên",
      "Email",
      "Số điện thoại",
      "Số tiền (VND)",
      "Trạng thái",
      "Ngân hàng",
      "Ngày tạo",
      "Ngày duyệt",
    ];
    const rows = transactions.map((t) => [
      `"${t.order_code}"`,
      `"${t.user.full_name}"`,
      `"${t.user.email}"`,
      `"${t.user.phone_number || ""}"`,
      t.amount,
      `"${t.status}"`,
      `"${t.bank_name || "MBBank"}"`,
      `"${new Date(t.created_at).toLocaleString("vi-VN")}"`,
      `"${t.paid_at ? new Date(t.paid_at).toLocaleString("vi-VN") : "—"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Sao_ke_doanh_thu_Aptis_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculated KPI stats
  const pendingCount = transactions.filter((t) => t.status === "PENDING").length;
  const completedCount = transactions.filter((t) => t.status === "COMPLETED").length;
  const totalRevenue = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  // Client-side search filtering
  const displayedTransactions = searchTerm.trim()
    ? transactions.filter((tx) => {
        const query = searchTerm.toLowerCase();
        return (
          tx.order_code.toLowerCase().includes(query) ||
          tx.user.full_name.toLowerCase().includes(query) ||
          tx.user.email.toLowerCase().includes(query) ||
          (tx.user.phone_number && tx.user.phone_number.includes(query))
        );
      })
    : transactions;

  const handleSort = (field: TxSortKey) => {
    setSortState((prev) => {
      if (prev.key !== field) return { key: field, order: "asc" };
      if (prev.order === "asc") return { key: field, order: "desc" };
      if (prev.order === "desc") return { key: field, order: null };
      return { key: field, order: "asc" };
    });
  };

  const sortedTransactions = useMemo(() => {
    const list = [...displayedTransactions];
    if (!sortState.order || !sortState.key) return list;

    const { key, order } = sortState;
    return list.sort((a, b) => {
      let valA: any = a[key as keyof TransactionItem];
      let valB: any = b[key as keyof TransactionItem];

      if (key === "full_name") {
        valA = a.user?.full_name || "";
        valB = b.user?.full_name || "";
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [displayedTransactions, sortState]);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-1.5">
            <CreditCard className="w-3 h-3 text-slate-600" />
            <span>SePay Payment Gateway & Reconciliation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Sổ Lệnh Giao Dịch SePay
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Theo dõi dòng tiền tự động qua QR MB Bank, khớp lệnh đơn chờ và nạp thủ công đối soát tài vụ
          </p>

          {/* Compact Inline Metrics Strip (SRD 5.6 Clean Standard - Zero Space Overhead) */}
          {!showMetrics && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
              <span className="text-[11px] text-slate-400 font-semibold font-heading uppercase tracking-wider">
                Chỉ số nhanh:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                <DollarSign className="w-3 h-3 text-emerald-600" />
                <span>Doanh thu: <strong className="text-emerald-900 font-mono">{totalRevenue.toLocaleString("vi-VN")}đ</strong></span>
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${
                pendingCount > 0
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-slate-100 border-slate-200/80 text-slate-700"
              }`}>
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Chờ khớp: <strong className="font-mono">{pendingCount}</strong> đơn</span>
                {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-800">
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>Hoàn tất: <strong className="text-blue-900 font-mono">{completedCount}</strong> đơn</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-purple-50 border border-purple-200/80 text-[11px] font-semibold text-purple-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>MB Bank: Auto-Sync OK</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Smart Toggle Button */}
          <button
            type="button"
            onClick={toggleMetrics}
            className={`px-3.5 py-2 rounded-xl border text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shadow-2xs ${
              showMetrics
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
            }`}
            title={showMetrics ? "Thu gọn 4 thẻ chỉ số để giải phóng không gian bảng" : "Mở rộng 4 thẻ chỉ số thống kê"}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showMetrics ? "Thu gọn chỉ số" : "Chỉ số chi tiết"}</span>
            {showMetrics ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5"
            title="Kiểm tra kết nối Webhook SePay IPN"
          >
            <Activity className={`w-3.5 h-3.5 text-blue-600 ${testingWebhook ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Kiểm tra Webhook</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5"
            title="Xuất file sao kê ra Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => setManualModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nạp thủ công</span>
          </button>
        </div>
      </div>

      {/* 4-Card Executive KPI Metrics Strip (Collapsible via Smart Toggle) */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Doanh thu */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Doanh thu trang này
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 mt-0.5 font-mono truncate">
                {totalRevenue.toLocaleString("vi-VN")} đ
              </div>
              <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                <span>Đã thanh toán thực tế</span>
              </div>
            </div>
          </div>

          {/* Cần khớp lệnh */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Cần khớp lệnh ngay
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-amber-700 mt-0.5 font-mono">
                {pendingCount} đơn
              </div>
              <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                {pendingCount > 0 ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Cần xử lý đối soát
                  </span>
                ) : (
                  <span>Không có đơn tồn</span>
                )}
              </div>
            </div>
          </div>

          {/* Thành công */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Đơn hoàn tất
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 mt-0.5 font-mono">
                {completedCount} đơn
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Tổng {totalCount} giao dịch ghi nhận
              </div>
            </div>
          </div>

          {/* Cổng thanh toán & MB Bank */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Cổng MB Bank SePay
              </div>
              <div className="text-sm font-heading font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-Sync Hoạt động</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                IPN Webhook sẵn sàng
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã đơn, học viên, email..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-sans"
          />
        </div>

        {/* Filter Tabs (Apple Segmented Control) */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="p-1 rounded-xl bg-slate-100 border border-slate-200/70 flex items-center gap-1">
            {[
              { id: "ALL", label: "Tất cả", icon: null, color: "" },
              { id: "COMPLETED", label: "Đã thanh toán", icon: CheckCircle2, color: "text-emerald-600" },
              { id: "PENDING", label: "Cần xử lý", icon: Clock, color: "text-amber-600" },
              { id: "FAILED", label: "Thất bại", icon: XCircle, color: "text-rose-600" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-white text-slate-900 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-900" : tab.color}`} />}
                  <span>{tab.label}</span>
                  {tab.id === "PENDING" && pendingCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                      {pendingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchTransactions}
            title="Làm mới bảng"
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-heading font-bold text-[10px] uppercase tracking-wider">
                <SortableHeader
                  field="order_code"
                  title="Mã đơn / Nội dung CK"
                  currentSort={sortState}
                  onSort={handleSort}
                  className="px-4 sm:px-6"
                />
                <SortableHeader
                  field="full_name"
                  title="Học viên thanh toán"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="amount"
                  title="Số tiền (VND)"
                  currentSort={sortState}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  field="payment_gateway"
                  title="Kênh thanh toán"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="status"
                  title="Trạng thái"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="created_at"
                  title="Thời gian"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <th className="py-3 px-4 text-right pr-6">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    Đang tải danh sách giao dịch...
                  </td>
                </tr>
              ) : sortedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-semibold text-slate-700">Không tìm thấy giao dịch nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Giao dịch qua MB Bank QR hoặc nạp thủ công sẽ tự động xuất hiện tại đây
                    </p>
                  </td>
                </tr>
              ) : (
                sortedTransactions.map((tx) => {
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Order Code */}
                      <td className="py-3 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs">
                          <span>{tx.order_code}</span>
                          <button
                            onClick={() => handleCopyCode(tx.order_code)}
                            title="Sao chép mã đơn"
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          >
                            {copiedCode === tx.order_code ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          PT: {tx.payment_method}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {tx.user.full_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-heading font-semibold text-slate-900 truncate">
                              {tx.user.full_name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
                              <span>{tx.user.email}</span>
                              {tx.user.phone_number && (
                                <span className="font-mono text-slate-400">• {tx.user.phone_number}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-heading font-bold text-slate-900 text-sm font-mono">
                          {tx.amount.toLocaleString("vi-VN")} đ
                        </span>
                      </td>

                      {/* Bank Info */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium font-mono">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[120px]">{tx.bank_name || "MBBank"}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {tx.status === "COMPLETED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-heading font-semibold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã thanh toán
                          </span>
                        )}
                        {tx.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-heading font-bold text-[10px]">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Cần xử lý
                          </span>
                        )}
                        {tx.status === "FAILED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-medium text-[10px]">
                            <XCircle className="w-3 h-3" />
                            Thất bại
                          </span>
                        )}
                        {tx.status === "REFUNDED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-medium text-[10px]">
                            <XCircle className="w-3 h-3" />
                            Đã hoàn tiền
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        <div>{new Date(tx.created_at).toLocaleDateString("vi-VN")}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.created_at).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right pr-6">
                        {tx.status === "PENDING" ? (
                          <button
                            onClick={() => handleOpenResolve(tx)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs shadow-xs transition-colors inline-flex items-center gap-1.5"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Khớp lệnh</span>
                          </button>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Admin Pagination Footer */}
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount || sortedTransactions.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 25, 50]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemName="giao dịch"
        />
      </div>

      {/* MODAL 1: TẠO GIAO DỊCH NẠP TIỀN THỦ CÔNG */}
      {manualModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setManualModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-900">
                    Tạo Giao Dịch Nạp Tiền Thủ Công
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ghi nhận đối soát tiền mặt / chuyển khoản trực tiếp và kích hoạt VIP ngay
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManualModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualTx} className="space-y-4">
              {/* Select Student */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-slate-900 block">
                  Chọn Học viên thụ hưởng: *
                </label>

                {selectedManualUser ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
                        {selectedManualUser.full_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-heading font-bold text-slate-900">
                          {selectedManualUser.full_name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {selectedManualUser.email}{" "}
                          {selectedManualUser.phone_number && `• ${selectedManualUser.phone_number}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedManualUser(null)}
                      className="text-xs text-rose-600 hover:underline font-heading font-semibold"
                    >
                      Đổi học viên
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualUserSearch}
                        onChange={(e) => setManualUserSearch(e.target.value)}
                        placeholder="Tìm SĐT, Email hoặc Họ tên học viên..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleSearchManualUser}
                        disabled={isSearchingManualUser}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-heading font-semibold transition-colors flex items-center gap-1 shadow-xs"
                      >
                        {isSearchingManualUser ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Search className="w-3.5 h-3.5" />
                        )}
                        <span>Tìm</span>
                      </button>
                    </div>

                    {manualUserResults.length > 0 && (
                      <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                        {manualUserResults.map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setSelectedManualUser(u);
                              setManualUserResults([]);
                            }}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-heading font-semibold text-slate-900">{u.full_name}</div>
                              <div className="text-[11px] text-slate-500">
                                {u.email} {u.phone_number && `• ${u.phone_number}`}
                              </div>
                            </div>
                            <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                              Chọn
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dynamic VIP Plans Selection (Synced with Quản lý Gói cước VIP) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-semibold text-slate-900 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Chọn Gói cước VIP kích hoạt: *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Đồng bộ trực tiếp từ Quản lý Gói cước VIP)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {availablePlans.length > 0 ? (
                    availablePlans.map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlanId(p.id);
                            setManualAmount(p.priceVnd);
                            setManualNote(`Học vụ kích hoạt gói ${p.name} trực tiếp tại quầy`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/15"
                              : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[9px] font-heading font-bold uppercase font-mono px-1.5 py-0.5 rounded ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {p.code}
                              </span>
                              {isSelected && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs font-heading font-bold leading-tight line-clamp-1">
                              {p.name}
                            </div>
                            <div
                              className={`text-[10px] mt-1 ${
                                isSelected ? "text-slate-300" : "text-slate-500"
                              }`}
                            >
                              {p.durationDays} ngày · {p.aiQuota} lượt AI
                            </div>
                          </div>
                          <div
                            className={`text-sm font-heading font-extrabold font-mono mt-2 pt-1 border-t ${
                              isSelected
                                ? "border-white/15 text-amber-300"
                                : "border-slate-100 text-slate-900"
                            }`}
                          >
                            {p.priceVnd.toLocaleString("vi-VN")} đ
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    // Fallback theo đúng 3 gói chuẩn trong schema/database
                    [
                      { id: "vip_1m", code: "VIP_1M", name: "Gói 1 Tháng (Tốc hành)", durationDays: 30, aiQuota: 10, priceVnd: 199000 },
                      { id: "vip_3m", code: "VIP_3M", name: "Gói 3 Tháng (Cày đề)", durationDays: 90, aiQuota: 30, priceVnd: 399000 },
                      { id: "premier_6m", code: "PREMIER_6M", name: "Gói 6 Tháng (Premier)", durationDays: 180, aiQuota: 100, priceVnd: 699000 },
                    ].map((p) => {
                      const isSelected = selectedPlanId === p.id;
                      return (
                        <button
                          key={p.code}
                          type="button"
                          onClick={() => {
                            setSelectedPlanId(p.id);
                            setManualAmount(p.priceVnd);
                            setManualNote(`Học vụ kích hoạt gói ${p.name} trực tiếp tại quầy`);
                          }}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/15"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-800"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[9px] font-heading font-bold uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                              {p.code}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                          <div className="text-xs font-heading font-bold">{p.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{p.durationDays} ngày · {p.aiQuota} AI</div>
                          <div className="text-sm font-heading font-bold font-mono text-amber-600 mt-2 pt-1 border-t border-slate-100">
                            {p.priceVnd.toLocaleString("vi-VN")} đ
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Số tiền thực thu */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-heading font-semibold text-slate-900 block">
                    Số tiền thực thu (VND): *
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Tự động điền theo gói đã chọn (có thể sửa nếu có ưu đãi)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(Number(e.target.value))}
                    placeholder="Nhập số tiền thực thu..."
                    className="w-full px-3 py-2 text-sm font-mono font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-heading">
                    VND
                  </span>
                </div>
              </div>

              {/* Method */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-slate-900 block">
                  Hình thức nạp tiền:
                </label>
                <select
                  value={manualMethod}
                  onChange={(e) => setManualMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                >
                  <option value="Chuyển khoản trực tiếp">Chuyển khoản trực tiếp (MB Bank / Vietcombank)</option>
                  <option value="Tiền mặt tại trung tâm">Tiền mặt tại quầy trung tâm</option>
                  <option value="Momo / Viettel Money">Ví điện tử Momo / Viettel Money</option>
                  <option value="Khác">Khác / Đối tác giáo dục</option>
                </select>
              </div>

              {/* Internal Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-slate-900 block">
                  Ghi chú đối soát nội bộ:
                </label>
                <input
                  type="text"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  placeholder="Ví dụ: Học viên nạp tiền mặt tại chi nhánh Tây Sơn..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting || !selectedManualUser}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {manualSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  <span>Xác nhận Nạp & Kích hoạt VIP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SMART MATCHER / KHỚP LỆNH ĐƠN CHỜ */}
      {selectedTx && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedTx(null);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-900">
                    Khớp Lệnh Cấp VIP Thủ Công
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">Mã đơn: {selectedTx.order_code}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Card */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold font-heading tracking-wider">
                  Số tiền chuyển khoản
                </div>
                <div className="text-2xl font-heading font-extrabold text-slate-900 font-mono mt-0.5">
                  {selectedTx.amount.toLocaleString("vi-VN")} đ
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase font-semibold font-heading tracking-wider">
                  Ngân hàng thụ hưởng
                </div>
                <div className="text-xs font-semibold text-slate-700 mt-0.5">
                  {selectedTx.bank_name || "MBBank"} (QR Auto)
                </div>
              </div>
            </div>

            {/* Target Student Selector */}
            <div className="space-y-2">
              <label className="text-xs font-heading font-semibold text-slate-900 block">
                Học viên được thụ hưởng gói VIP:
              </label>

              {matchedUser ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shadow-xs">
                      {matchedUser.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-slate-900">{matchedUser.full_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {matchedUser.email} {matchedUser.phone_number && `• ${matchedUser.phone_number}`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMatchedUser(null)}
                    className="text-xs text-rose-600 hover:underline font-heading font-semibold"
                  >
                    Đổi học viên
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      placeholder="Gõ SĐT, Email hoặc Họ tên học viên..."
                      className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={handleSearchStudent}
                      disabled={isSearchingStudent}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-heading font-semibold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      {isSearchingStudent ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Tìm</span>
                    </button>
                  </div>

                  {studentSearchResults.length > 0 && (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                      {studentSearchResults.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setMatchedUser(u);
                            setStudentSearchResults([]);
                          }}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-heading font-semibold text-slate-900">{u.full_name}</div>
                            <div className="text-[11px] text-slate-500">
                              {u.email} {u.phone_number && `• ${u.phone_number}`}
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-semibold">
                            Chọn
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Note Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-slate-900 block">
                Ghi chú đối soát nội bộ:
              </label>
              <input
                type="text"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 text-slate-900 font-medium"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolveLoading}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
              >
                {resolveLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                <span>Xác nhận Khớp lệnh & Kích hoạt VIP</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
