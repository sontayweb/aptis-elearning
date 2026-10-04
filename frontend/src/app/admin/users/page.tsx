"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SortableHeader, SortState } from "@/components/admin/sortable-header";
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Crown,
  Sparkles,
  Zap,
  KeyRound,
  FileSpreadsheet,
  X,
  Copy,
  ExternalLink,
  Award,
  History,
  LifeBuoy,
  Check,
  CheckSquare,
  Square,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ConfirmModal from "@/components/admin/confirm-modal";
import { useAuth } from "@/contexts/auth-context";

interface UserItem {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
  is_active: boolean;
  created_at: string;
  _count?: {
    submissions: number;
  };
  subscriptions?: Array<{
    end_date: string;
    is_active: boolean;
    plan: {
      name: string;
      code: string;
    };
  }>;
}

interface StudentSummary {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  subscriptions: Array<{
    id: string;
    start_date: string;
    end_date: string;
    ai_quota_left: number;
    teacher_quota_left: number;
    plan: {
      name: string;
      price_vnd: number;
    };
  }>;
  submissions: Array<{
    id: string;
    started_at: string;
    status: string;
    total_score?: number | null;
    cefr_level?: string | null;
    exam: {
      title: string;
      skill: string;
    };
  }>;
  _count: {
    submissions: number;
    transactions: number;
  };
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [vipFilterOnly, setVipFilterOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  type UserSortKey = "full_name" | "phone_number" | "is_active" | "created_at" | "submissions";
  const [sortState, setSortState] = useState<SortState<UserSortKey>>({
    key: "created_at",
    order: "desc",
  });

  // Smart Toggle for KPI metrics strip (defaults to false for clean workhorse layout, persists in localStorage)
  const [showMetrics, setShowMetrics] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin_users_kpi_visible") : null;
    if (saved === "true") {
      setShowMetrics(true);
    }
  }, []);

  const toggleMetrics = () => {
    setShowMetrics((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_users_kpi_visible", String(next));
      }
      return next;
    });
  };

  // Multi-selection state
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [batchActionLoading, setBatchActionLoading] = useState(false);

  // Quick Assistance Drawer State
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [summaryData, setSummaryData] = useState<StudentSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [assistanceTab, setAssistanceTab] = useState<"vip" | "quota" | "password" | "history">("vip");

  // Assistance Action Inputs
  const [vipDays, setVipDays] = useState(30);
  const [vipReason, setVipReason] = useState("Học vụ hỗ trợ kích hoạt");
  const [vipSubmitting, setVipSubmitting] = useState(false);

  const [aiQuotaAdd, setAiQuotaAdd] = useState(10);
  const [quotaSubmitting, setQuotaSubmitting] = useState(false);

  const [resetPassNew, setResetPassNew] = useState("Aptis123");
  const [resetPassSubmitting, setResetPassSubmitting] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  // Confirm Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    user?: UserItem;
    targetStatus?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  // Modal State for New User
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "STUDENT" as "STUDENT" | "TEACHER" | "ADMIN",
    phoneNumber: "",
    targetBand: "B2_TARGET" as "B1_TARGET" | "B2_TARGET" | "C_TARGET",
    internalNotes: "",
  });

  // Bulk Import State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<any>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getUsers({
        search: searchTerm || undefined,
        role: roleFilter,
        page,
        limit: pageSize,
      });

      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) {
          setTotalPages(res.meta.totalPages || 1);
          setTotalCount(res.meta.total || res.data.length);
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách người dùng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    setSelectedUserIds([]);
  }, [page, roleFilter, pageSize]);

  // Lock body scroll and listen for Escape key when modals are open
  useEffect(() => {
    if (createModalOpen || selectedUser || confirmModal.isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setCreateModalOpen(false);
          setSelectedUser(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [createModalOpen, selectedUser, confirmModal.isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedUserIds.length === displayedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(displayedUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Batch VIP Grant (+30 days)
  const handleBatchGrantVip = async () => {
    if (selectedUserIds.length === 0) return;
    if (
      !confirm(
        `Xác nhận gia hạn VIP +30 ngày cho ${selectedUserIds.length} học viên đã chọn?`
      )
    )
      return;

    setBatchActionLoading(true);
    try {
      await Promise.all(
        selectedUserIds.map((id) =>
          api.admin.grantVip(id, {
            days: 30,
            reason: "Gia hạn VIP hàng loạt từ Học vụ",
          })
        )
      );
      showToast(`Đã gia hạn VIP +30 ngày cho ${selectedUserIds.length} học viên thành công!`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch {
      alert("Có lỗi xảy ra khi thực hiện gia hạn hàng loạt");
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Batch Add AI Quota (+10 quota)
  const handleBatchAddQuota = async () => {
    if (selectedUserIds.length === 0) return;
    if (
      !confirm(
        `Xác nhận cộng +10 lượt chấm AI cho ${selectedUserIds.length} học viên đã chọn?`
      )
    )
      return;

    setBatchActionLoading(true);
    try {
      await Promise.all(
        selectedUserIds.map((id) =>
          api.admin.adjustQuota(id, {
            aiQuota: 10,
            reason: "Cộng lượt chấm AI hàng loạt từ Học vụ",
          })
        )
      );
      showToast(`Đã cộng +10 lượt AI cho ${selectedUserIds.length} học viên thành công!`);
      setSelectedUserIds([]);
      fetchUsers();
    } catch {
      alert("Có lỗi xảy ra khi cộng lượt hàng loạt");
    } finally {
      setBatchActionLoading(false);
    }
  };

  // Open Quick Assistance Drawer and fetch student summary
  const handleOpenAssistance = async (user: UserItem) => {
    setSelectedUser(user);
    setSummaryLoading(true);
    setAssistanceTab("vip");
    try {
      const res = await api.admin.getUserSummary(user.id);
      if (res.success && res.data) {
        setSummaryData(res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy tóm tắt học viên:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // 1-Click Grant VIP
  const handleGrantVip = async () => {
    if (!selectedUser) return;
    setVipSubmitting(true);
    try {
      const res = await api.admin.grantVip(selectedUser.id, {
        days: vipDays,
        reason: vipReason,
      });
      if (res.success) {
        showToast(`Đã gia hạn +${vipDays} ngày VIP cho ${selectedUser.full_name} thành công!`);
        fetchUsers();
        const summaryRes = await api.admin.getUserSummary(selectedUser.id);
        if (summaryRes.success) setSummaryData(summaryRes.data);
      } else {
        alert(res.error?.message || "Không thể cấp quyền VIP");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setVipSubmitting(false);
    }
  };

  // 1-Click Add AI Quota
  const handleAdjustQuota = async () => {
    if (!selectedUser) return;
    setQuotaSubmitting(true);
    try {
      const res = await api.admin.adjustQuota(selectedUser.id, {
        aiQuota: aiQuotaAdd,
        reason: "Cộng thêm lượt chấm bài khẩn cấp từ Học vụ",
      });
      if (res.success) {
        showToast(`Đã cộng thêm +${aiQuotaAdd} lượt AI cho ${selectedUser.full_name}!`);
        const summaryRes = await api.admin.getUserSummary(selectedUser.id);
        if (summaryRes.success) setSummaryData(summaryRes.data);
      } else {
        alert(res.error?.message || "Không thể cộng lượt chấm");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setQuotaSubmitting(false);
    }
  };

  // 1-Click Reset Password
  const handleResetPassword = async () => {
    if (!selectedUser) return;
    setResetPassSubmitting(true);
    try {
      const res = await api.admin.resetPassword(selectedUser.id, {
        newPassword: resetPassNew,
      });
      if (res.success) {
        showToast(`Đã đổi mật khẩu của ${selectedUser.full_name} thành "${resetPassNew}"!`);
      } else {
        alert(res.error?.message || "Không thể đặt lại mật khẩu");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setResetPassSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2500);
  };

  // Toggle Account Active / Inactive
  const requestToggleStatus = (user: UserItem) => {
    const nextStatus = !user.is_active;
    setConfirmModal({
      isOpen: true,
      title: nextStatus ? "Mở khóa tài khoản" : "Khóa tài khoản người dùng",
      message: nextStatus
        ? `Bạn có chắc muốn kích hoạt lại tài khoản "${user.full_name}" (${user.email})? Người dùng sẽ đăng nhập và làm bài bình thường.`
        : `Bạn có chắc muốn KHÓA tài khoản "${user.full_name}" (${user.email})? Người dùng sẽ không thể đăng nhập vào hệ thống.`,
      user,
      targetStatus: nextStatus,
    });
  };

  const executeToggleStatus = async () => {
    if (!confirmModal.user || confirmModal.targetStatus === undefined) return;
    const { user, targetStatus } = confirmModal;
    try {
      const res = await api.admin.updateUserStatus(user.id, targetStatus);
      if (res.success) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: targetStatus } : u))
        );
        showToast(`Đã ${targetStatus ? "mở khóa" : "khóa"} tài khoản ${user.full_name} thành công!`);
      } else {
        alert(res.error?.message || "Không thể cập nhật trạng thái");
      }
    } catch (err) {
      alert("Lỗi khi kết nối máy chủ");
    } finally {
      setConfirmModal({ isOpen: false, title: "", message: "" });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const res = await api.admin.createUser(formData);
      if (res.success) {
        setCreateModalOpen(false);
        setFormData({
          email: "",
          password: "",
          fullName: "",
          role: "STUDENT",
          phoneNumber: "",
          targetBand: "B2_TARGET",
          internalNotes: "",
        });
        showToast("Tạo tài khoản mới thành công!");
        fetchUsers();
      } else {
        alert(res.error?.message || "Lỗi tạo tài khoản");
      }
    } catch (err) {
      alert("Lỗi kết nối máy chủ");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDownloadSampleExcel = () => {
    const csvContent =
      "Họ và tên,Email,Số điện thoại,Mật khẩu,Vai trò,Mục tiêu,Ghi chú\n" +
      "Nguyễn Văn An,an.nguyen@example.com,0912345678,Aptis@2026,STUDENT,B2_TARGET,Lớp cấp tốc tháng 10\n" +
      "Trần Thị Bình,binh.tran@example.com,0987654321,Aptis@2026,STUDENT,C_TARGET,Học viên thi thử hội đồng BC\n" +
      "Lê Hoàng Cường,cuong.le@example.com,0905112233,Aptis@2026,TEACHER,C_TARGET,Giảng viên trợ giảng\n";
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "danh_sach_hoc_vien_mau.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      alert("Vui lòng chọn tệp Excel hoặc CSV");
      return;
    }
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const res = await api.admin.bulkImportUsers(bulkFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showToast(`Đã tạo thành công ${res.data.successCount} học viên từ tệp!`);
        fetchUsers();
      } else {
        alert(res.error?.message || "Lỗi xử lý tệp");
      }
    } catch (err) {
      alert("Lỗi khi tải tệp lên máy chủ");
    } finally {
      setBulkLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = (onlySelected: boolean = false) => {
    const listToExport = onlySelected
      ? users.filter((u) => selectedUserIds.includes(u.id))
      : users;

    if (listToExport.length === 0) return;
    const headers = [
      "Họ và tên",
      "Email",
      "Số điện thoại",
      "Vai trò",
      "Trạng thái",
      "Gói học",
      "Lượt thi",
      "Ngày đăng ký",
    ];
    const rows = listToExport.map((u) => [
      `"${u.full_name}"`,
      `"${u.email}"`,
      `"${u.phone_number || ""}"`,
      `"${u.role}"`,
      `"${u.is_active ? "Hoạt động" : "Đã khóa"}"`,
      `"${u.subscriptions && u.subscriptions.length > 0 ? u.subscriptions[0].plan.name : "Free"}"`,
      u._count?.submissions || 0,
      `"${new Date(u.created_at).toLocaleDateString("vi-VN")}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Danh_sach_hoc_vien_Aptis_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter VIP users
  const displayedUsers = vipFilterOnly
    ? users.filter((u) => u.subscriptions && u.subscriptions.length > 0)
    : users;

  const handleSort = (field: UserSortKey) => {
    setSortState((prev) => {
      if (prev.key !== field) return { key: field, order: "asc" };
      if (prev.order === "asc") return { key: field, order: "desc" };
      if (prev.order === "desc") return { key: field, order: null };
      return { key: field, order: "asc" };
    });
  };

  const sortedUsers = useMemo(() => {
    const list = [...displayedUsers];
    if (!sortState.order || !sortState.key) return list;

    const { key, order } = sortState;
    return list.sort((a, b) => {
      let valA: any = a[key as keyof UserItem];
      let valB: any = b[key as keyof UserItem];

      if (key === "submissions") {
        valA = a._count?.submissions || 0;
        valB = b._count?.submissions || 0;
      } else if (key === "is_active") {
        valA = a.is_active ? 1 : 0;
        valB = b.is_active ? 1 : 0;
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return order === "asc" ? -1 : 1;
      if (valA > valB) return order === "asc" ? 1 : -1;
      return 0;
    });
  }, [displayedUsers, sortState]);

  // Calculated Stats
  const vipCount = users.filter((u) => u.subscriptions && u.subscriptions.length > 0).length;
  const teacherCount = users.filter((u) => u.role === "TEACHER").length;
  const activeCount = users.filter((u) => u.is_active).length;
  const activeRate = users.length > 0 ? Math.round((activeCount / users.length) * 100) : 100;

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.targetStatus ? "Mở khóa ngay" : "Khóa tài khoản"}
        type={confirmModal.targetStatus ? "success" : "danger"}
        onConfirm={executeToggleStatus}
        onCancel={() => setConfirmModal({ isOpen: false, title: "", message: "" })}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-1.5">
            <Users className="w-3 h-3 text-slate-600" />
            <span>Student & User Management Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Quản Lý Tài Khoản Học Viên
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Tra cứu theo SĐT/Email, cấp gia hạn VIP 1 chạm, điều phối lượt chấm AI và xử lý tài vụ khẩn cấp
          </p>

          {/* Compact Inline Metrics Strip (SRD 4.3 Clean Standard - Zero Space Overhead) */}
          {!showMetrics && (
            <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
              <span className="text-[11px] text-slate-400 font-semibold font-heading uppercase tracking-wider">
                Chỉ số nhanh:
              </span>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-semibold text-slate-700">
                <Users className="w-3 h-3 text-slate-500" />
                <span>Tổng: <strong className="text-slate-900 font-mono">{totalCount}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] font-semibold text-amber-800">
                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>VIP: <strong className="text-amber-900 font-mono">{vipCount}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200/80 text-[11px] font-semibold text-blue-800">
                <GraduationCap className="w-3 h-3 text-blue-600" />
                <span>Giảng viên: <strong className="text-blue-900 font-mono">{teacherCount}</strong></span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Hoạt động: <strong className="text-emerald-900 font-mono">{activeRate}%</strong></span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Smart Toggle Button for 4 KPI Cards */}
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
            onClick={() => handleExportCSV(false)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5"
            title="Xuất file danh sách ra Excel/CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Xuất Excel</span>
          </button>

          <button
            onClick={() => {
              setBulkResult(null);
              setBulkFile(null);
              setBulkModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Nhập từ Excel</span>
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-heading font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm tài khoản</span>
          </button>
        </div>
      </div>

      {/* 4-Card Executive KPI Metrics Strip (Collapsible via Smart Toggle) */}
      {showMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Tổng tài khoản */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Tổng tài khoản
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 mt-0.5 font-mono">
                {totalCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Hệ thống APTIS ESOL PREMIER
              </div>
            </div>
          </div>

          {/* Học viên VIP */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 fill-amber-500" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Học viên VIP hoạt động
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-amber-700 mt-0.5 font-mono">
                {vipCount}
              </div>
              <div className="text-[10px] text-amber-700 font-medium mt-0.5">
                Có quyền truy cập kho VIP Pro
              </div>
            </div>
          </div>

          {/* Đội ngũ Giảng viên */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Giảng viên học vụ
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-slate-900 mt-0.5 font-mono">
                {teacherCount}
              </div>
              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                Chấm thi & cố vấn chuyên môn
              </div>
            </div>
          </div>

          {/* Trạng thái hoạt động */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex items-center gap-4 hover:border-slate-300 transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider font-heading">
                Tỷ lệ hoạt động
              </div>
              <div className="text-xl sm:text-2xl font-heading font-extrabold text-emerald-700 mt-0.5 font-mono">
                {activeRate}%
              </div>
              <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                {activeCount} / {users.length} tài khoản hợp lệ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên, email hoặc SĐT..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50/50 dark:bg-slate-800/70 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sans"
          />
        </form>

        {/* Role Filters Tabs & VIP toggle */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "STUDENT", label: "Học viên" },
              { id: "TEACHER", label: "Giảng viên" },
              { id: "ADMIN", label: "Học vụ" },
              ...(currentUser?.role === "SUPER_ADMIN" ? [{ id: "SUPER_ADMIN", label: "Super Admin" }] : []),
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setRoleFilter(tab.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all ${
                  roleFilter === tab.id
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold ring-1 ring-slate-900/5 dark:ring-white/10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setVipFilterOnly((prev) => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold border transition-all flex items-center gap-1.5 whitespace-nowrap ${
              vipFilterOnly
                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 font-bold shadow-2xs"
                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Chỉ VIP</span>
          </button>

          <button
            onClick={fetchUsers}
            title="Làm mới danh sách"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900 dark:text-white" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-heading font-bold text-[10px] uppercase tracking-wider">
                <th className="py-3.5 pl-4 sm:pl-6 pr-2 w-10">
                  <button
                    onClick={handleToggleSelectAll}
                    title="Chọn tất cả trang này"
                    className="text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center"
                  >
                    {selectedUserIds.length > 0 &&
                    selectedUserIds.length === displayedUsers.length ? (
                      <CheckSquare className="w-4 h-4 text-slate-900" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <SortableHeader
                  field="full_name"
                  title="Học viên / Tài khoản"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="phone_number"
                  title="Số điện thoại"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <th className="py-3.5 px-4">Gói dịch vụ</th>
                <SortableHeader
                  field="is_active"
                  title="Trạng thái"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  field="submissions"
                  title="Lượt thi"
                  currentSort={sortState}
                  onSort={handleSort}
                  align="center"
                />
                <SortableHeader
                  field="created_at"
                  title="Ngày đăng ký"
                  currentSort={sortState}
                  onSort={handleSort}
                />
                <th className="py-3.5 px-4 text-right pr-6">Hỗ trợ học vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-600" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 font-normal">
                    Không tìm thấy tài khoản nào phù hợp bộ lọc
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => {
                  const activeSub =
                    user.subscriptions && user.subscriptions.length > 0
                      ? user.subscriptions[0]
                      : null;
                  const isVip = !!activeSub;
                  const isSelected = selectedUserIds.includes(user.id);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-slate-50/80" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 sm:pl-6 pr-2">
                        <button
                          onClick={() => handleToggleSelectUser(user.id)}
                          className="text-slate-400 hover:text-slate-900 transition-colors flex items-center justify-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-slate-900" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Name & Email & Role badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {user.full_name.charAt(0)}
                            </div>
                            {isVip && (
                              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                <Crown className="w-2 h-2 fill-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-heading font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate">{user.full_name}</span>
                              {user.role === "SUPER_ADMIN" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-gradient-to-r from-rose-600 to-amber-600 text-white text-[9px] font-bold shadow-xs">
                                  <Sparkles className="w-3 h-3" /> Super Admin
                                </span>
                              )}
                              {user.role === "ADMIN" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-slate-900 text-white text-[9px] font-bold">
                                  <ShieldCheck className="w-3 h-3" /> Admin
                                </span>
                              )}
                              {user.role === "TEACHER" && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold">
                                  <GraduationCap className="w-3 h-3" /> GV
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4">
                        {user.phone_number ? (
                          <a
                            href={`tel:${user.phone_number}`}
                            className="inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 font-mono text-[11px] font-medium"
                          >
                            <Phone className="w-3 h-3 text-slate-400" />
                            {user.phone_number}
                          </a>
                        ) : (
                          <span className="text-slate-300 text-[11px]">—</span>
                        )}
                      </td>

                      {/* VIP Status */}
                      <td className="py-3.5 px-4">
                        {isVip ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-heading font-bold text-[10px]">
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                            <span>{activeSub.plan.name}</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium text-[10px]">
                            FREE
                          </span>
                        )}
                      </td>

                      {/* Active Status */}
                      <td className="py-3.5 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-rose-600 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Đã khóa
                          </span>
                        )}
                      </td>

                      {/* Submissions Count */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-semibold text-slate-900 font-mono">
                          {user._count?.submissions || 0}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(user.created_at).toLocaleDateString("vi-VN")}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right pr-6">
                        <div className="inline-flex items-center gap-1.5">
                          {/* Quick Assistance Button */}
                          <button
                            onClick={() => handleOpenAssistance(user)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-heading font-semibold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                            title="Mở menu hỗ trợ: Cấp VIP, Cộng lượt AI, Đổi mật khẩu"
                          >
                            <LifeBuoy className="w-3 h-3 text-slate-500" />
                            <span>Hỗ trợ</span>
                          </button>

                          {/* Lock / Unlock Toggle */}
                          <button
                            onClick={() => requestToggleStatus(user)}
                            title={user.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                            className={`p-1.5 rounded-lg transition-colors border ${
                              user.is_active
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {user.is_active ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
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
          totalItems={totalCount || sortedUsers.length}
          pageSize={pageSize}
          pageSizeOptions={[10, 15, 25, 50]}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          itemName="tài khoản"
        />
      </div>

      {/* FLOATING BATCH ACTIONS BAR (Linear / Notion Style) */}
      {selectedUserIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 text-xs font-heading font-semibold">
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center font-mono text-[11px] font-bold">
              {selectedUserIds.length}
            </span>
            <span>học viên được chọn</span>
          </div>

          <div className="h-4 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchGrantVip}
              disabled={batchActionLoading}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-heading font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              <span>+30 ngày VIP</span>
            </button>

            <button
              onClick={handleBatchAddQuota}
              disabled={batchActionLoading}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>+10 lượt AI</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-heading font-semibold transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Xuất {selectedUserIds.length} dòng</span>
            </button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
              title="Bỏ chọn tất cả"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* QUICK ASSISTANCE RIGHT DRAWER */}
      {selectedUser && (
        <div
          onClick={() => setSelectedUser(null)}
          className="fixed inset-0 z-[100] flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center font-bold text-base text-white">
                  {selectedUser.full_name.charAt(0)}
                </div>
                <div>
                  <div className="font-heading font-extrabold text-base flex items-center gap-2">
                    {selectedUser.full_name}
                    {selectedUser.is_active ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-400/30">
                        Đã khóa
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5 font-normal">
                    <span>{selectedUser.email}</span>
                    {selectedUser.phone_number && <span>• {selectedUser.phone_number}</span>}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-50/50 dark:bg-slate-900/50">
              {[
                { id: "vip", label: "Cấp / Gia hạn VIP", icon: Crown },
                { id: "quota", label: "Cộng lượt AI", icon: Zap },
                { id: "password", label: "Đổi mật khẩu", icon: KeyRound },
                { id: "history", label: "Lịch sử thi", icon: History },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = assistanceTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAssistanceTab(tab.id as any)}
                    className={`py-3.5 px-3 text-xs font-heading font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 font-bold"
                        : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {summaryLoading ? (
                <div className="py-20 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
                  Đang tải hồ sơ học vụ học viên...
                </div>
              ) : (
                <>
                  {/* TAB 1: GRANT VIP */}
                  {assistanceTab === "vip" && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-950/40 p-4 text-xs space-y-1.5">
                        <div className="font-heading font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                          <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 fill-amber-500" />
                          <span>Trạng thái VIP hiện tại:</span>
                        </div>
                        {summaryData?.subscriptions && summaryData.subscriptions.length > 0 ? (
                          <div className="text-slate-700 dark:text-slate-300 font-medium">
                            Đang kích hoạt gói:{" "}
                            <strong className="text-slate-900 dark:text-white">
                              {summaryData.subscriptions[0].plan.name}
                            </strong>
                            <br />
                            Thời hạn đến:{" "}
                            <strong className="text-slate-900 dark:text-white font-mono">
                              {new Date(summaryData.subscriptions[0].end_date).toLocaleDateString(
                                "vi-VN"
                              )}
                            </strong>
                          </div>
                        ) : (
                          <p className="text-slate-600 dark:text-slate-400">Học viên hiện đang dùng gói FREE (Chưa có VIP).</p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 block">
                          Chọn số ngày gia hạn thêm:
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { days: 7, label: "+7 ngày" },
                            { days: 30, label: "+30 ngày (1T)" },
                            { days: 90, label: "+90 ngày (3T)" },
                            { days: 180, label: "+180 ngày" },
                          ].map((item) => (
                            <button
                              key={item.days}
                              type="button"
                              onClick={() => setVipDays(item.days)}
                              className={`py-2 px-1 rounded-xl text-xs font-heading font-semibold border transition-all text-center ${
                                vipDays === item.days
                                  ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent font-bold shadow-xs shadow-blue-500/20"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 block">
                          Lý do kích hoạt / Ghi chú học vụ:
                        </label>
                        <input
                          type="text"
                          value={vipReason}
                          onChange={(e) => setVipReason(e.target.value)}
                          placeholder="Ví dụ: Đóng tiền mặt tại quầy, Học bổng, Bù lỗi..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white font-normal"
                        />
                      </div>

                      <button
                        onClick={handleGrantVip}
                        disabled={vipSubmitting}
                        className="w-full py-2.5 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-heading font-semibold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {vipSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Crown className="w-4 h-4" />
                        )}
                        <span>Xác nhận Cấp / Gia hạn VIP {vipDays} ngày</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 2: ADJUST QUOTA */}
                  {assistanceTab === "quota" && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/60 dark:bg-sky-950/40 p-4 text-xs space-y-1">
                        <div className="font-heading font-bold text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          <span>Hạn ngạch AI hiện tại:</span>
                        </div>
                        <p className="text-slate-900 dark:text-white text-sm font-heading font-bold font-mono">
                          {summaryData?.subscriptions?.[0]?.ai_quota_left || 0} lượt chấm AI còn lại
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 block">
                          Chọn số lượt chấm AI muốn cộng thêm:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[5, 10, 20].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setAiQuotaAdd(num)}
                              className={`py-2.5 rounded-xl text-xs font-heading font-semibold border transition-all text-center ${
                                aiQuotaAdd === num
                                  ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white border-transparent font-bold shadow-xs shadow-blue-500/20"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              }`}
                            >
                              +{num} lượt
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={handleAdjustQuota}
                        disabled={quotaSubmitting}
                        className="w-full py-2.5 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-heading font-semibold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {quotaSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                        <span>Cộng ngay +{aiQuotaAdd} lượt chấm AI</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 3: RESET PASSWORD */}
                  {assistanceTab === "password" && (
                    <div className="space-y-5">
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 text-xs space-y-1.5">
                        <div className="font-heading font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                          <span>Đặt lại mật khẩu khẩn cấp</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                          Sau khi đặt lại, học viên có thể dùng mật khẩu mới này để đăng nhập ngay lập tức.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-heading font-bold text-slate-800 dark:text-slate-200 block">
                          Mật khẩu mới:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={resetPassNew}
                            onChange={(e) => setResetPassNew(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={() => copyToClipboard(resetPassNew)}
                            className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-200 dark:border-slate-700"
                          >
                            <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>{copiedPass ? "Đã copy!" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleResetPassword}
                        disabled={resetPassSubmitting}
                        className="w-full py-2.5 bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-heading font-semibold text-xs rounded-xl shadow-xs shadow-blue-500/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {resetPassSubmitting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <KeyRound className="w-4 h-4" />
                        )}
                        <span>Xác nhận Đặt lại Mật khẩu</span>
                      </button>
                    </div>
                  )}

                  {/* TAB 4: RECENT TEST HISTORY */}
                  {assistanceTab === "history" && (
                    <div className="space-y-3">
                      <div className="text-xs font-heading font-bold text-slate-800">
                        5 Lượt làm bài thi gần nhất:
                      </div>
                      {summaryData?.submissions && summaryData.submissions.length > 0 ? (
                        <div className="space-y-2">
                          {summaryData.submissions.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs flex items-center justify-between"
                            >
                              <div>
                                <div className="font-heading font-semibold text-slate-900">
                                  {sub.exam.title}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Kỹ năng: {sub.exam.skill} • {new Date(sub.started_at).toLocaleDateString("vi-VN")}
                                </div>
                              </div>
                              <div className="text-right">
                                {sub.cefr_level ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                                    {sub.cefr_level} ({sub.total_score || 0}đ)
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {sub.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs">
                          Học viên chưa thực hiện bài thi nào trên hệ thống
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW USER MODAL */}
      {createModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-heading font-bold text-slate-900 dark:text-white">
                  Thêm Tài Khoản Mới
                </h3>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                  Họ và tên: *
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                  Địa chỉ Email: *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                  Số điện thoại:
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  placeholder="0912 345 678"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                  Mật khẩu khởi tạo: *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Tối thiểu 6 ký tự..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                    Mục tiêu chứng chỉ:
                  </label>
                  <select
                    value={formData.targetBand}
                    onChange={(e) => setFormData({ ...formData, targetBand: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="B1_TARGET">B1 Target</option>
                    <option value="B2_TARGET">B2 Target (Khuyên dùng)</option>
                    <option value="C_TARGET">C Target (Nâng cao)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                    Ghi chú nội bộ học vụ:
                  </label>
                  <input
                    type="text"
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                    placeholder="VD: Lớp cấp tốc K24..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-heading font-semibold text-slate-700 dark:text-slate-300 block">
                  Vai trò trên hệ thống:
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
                >
                  <option value="STUDENT">Học viên (STUDENT)</option>
                  <option value="TEACHER">Giảng viên chấm thi (TEACHER)</option>
                  <option value="ADMIN">Quản trị viên học vụ (ADMIN)</option>
                  {currentUser?.role === "SUPER_ADMIN" && (
                    <option value="SUPER_ADMIN">Tổng quản trị (SUPER_ADMIN)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] hover:from-[#1E40AF] hover:to-[#1D4ED8] text-white font-heading font-semibold text-xs shadow-xs shadow-blue-500/20 flex items-center gap-1.5 transition-colors"
                >
                  {createLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                  <span>Xác nhận tạo tài khoản</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {bulkModalOpen && (
        <div
          onClick={() => setBulkModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-slate-900">
                    Cấp Tài Khoản Hàng Loạt (Bulk Import)
                  </h3>
                  <p className="text-xs text-slate-500">Tải lên danh sách học viên từ file Excel hoặc CSV</p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkImportSubmit} className="space-y-4">
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-emerald-500/50 transition-colors bg-slate-50/50 text-center">
                <input
                  type="file"
                  id="excelFileInput"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setBulkFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="excelFileInput"
                  className="cursor-pointer block space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {bulkFile ? bulkFile.name : "Nhấn để chọn tệp .xlsx hoặc .csv"}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Dung lượng tối đa 10MB. Cột A: Họ tên, Cột B: Email, Cột C: SĐT...
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Chưa có tệp chuẩn?</span>
                <button
                  type="button"
                  onClick={handleDownloadSampleExcel}
                  className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Tải tệp mẫu (.csv)</span>
                </button>
              </div>

              {bulkResult && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Tạo thành công: {bulkResult.successCount} / {bulkResult.totalRows} học viên
                    </span>
                  </div>
                  {bulkResult.errorCount > 0 && (
                    <div className="text-rose-600 space-y-1">
                      <div className="font-semibold">Bị bỏ qua ({bulkResult.errorCount} lỗi):</div>
                      <ul className="list-disc list-inside text-[11px] max-h-24 overflow-y-auto space-y-0.5">
                        {bulkResult.errors.map((err: any, idx: number) => (
                          <li key={idx}>
                            Dòng {err.row}: {err.email} - {err.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading || !bulkFile}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-heading font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  {bulkLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span>Tiến hành nhập dữ liệu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
