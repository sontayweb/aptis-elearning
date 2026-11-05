"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import AdminPageHeader from "@/components/admin/admin-page-header";
import {
  Tag,
  Gift,
  PlusCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  Copy,
  Check,
  Edit2,
  Trash2,
  X,
  Radio,
  Flame,
  Percent,
  Coins,
  ShieldAlert,
  Calendar,
  Layers,
} from "lucide-react";

export interface PromotionItem {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  codeType: "FREE_TRIAL" | "DISCOUNT_AMOUNT" | "DISCOUNT_PERCENT";
  planId?: string | null;
  planName?: string | null;
  durationDays?: number | null;
  aiQuota?: number | null;
  teacherQuota?: number | null;
  discountAmount?: number | null;
  discountPercent?: number | null;
  minOrderAmount?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  maxUses?: number | null;
  currentUses: number;
  redemptionsCount: number;
  expiresAt?: string | null;
  createdAt?: string | null;
}

interface RedemptionRecord {
  id: string;
  redeemedAt: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    phone_number?: string | null;
  };
  subscription?: {
    id: string;
    start_date: string;
    end_date: string;
    ai_quota_left: number;
  } | null;
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromotionItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    code_type: "FREE_TRIAL" as "FREE_TRIAL" | "DISCOUNT_AMOUNT" | "DISCOUNT_PERCENT",
    duration_days: 14,
    ai_quota: 20,
    teacher_quota: 0,
    discount_amount: 50000,
    discount_percent: 20,
    min_order_amount: 0,
    max_uses: "" as string | number,
    expires_at: "",
    is_featured: false,
    is_active: true,
  });

  // Redemptions Modal
  const [redemptionsPromo, setRedemptionsPromo] = useState<PromotionItem | null>(null);
  const [redemptionsList, setRedemptionsList] = useState<RedemptionRecord[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Fetch Promotions
  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res: any = await api.admin.promotions.list();
      if (res.success && Array.isArray(res.data)) {
        setPromotions(res.data);
      }
    } catch (err) {
      console.error("Failed to load promotions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Copy code helper
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Option 1: Exclusive Auto-Swap Toggle
  const handleToggleFeatured = async (promo: PromotionItem) => {
    const nextState = !promo.isFeatured;
    setActionLoadingId(promo.id);
    try {
      const res: any = await api.admin.promotions.update(promo.id, {
        is_featured: nextState,
      });
      if (res.success) {
        await fetchPromotions();
      }
    } catch (err: any) {
      alert(err?.message || "Không thể cập nhật cờ Treo Banner");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Toggle is_active
  const handleToggleActive = async (promo: PromotionItem) => {
    const nextState = !promo.isActive;
    setActionLoadingId(promo.id);
    try {
      const res: any = await api.admin.promotions.update(promo.id, {
        is_active: nextState,
      });
      if (res.success) {
        await fetchPromotions();
      }
    } catch (err: any) {
      alert(err?.message || "Không thể cập nhật trạng thái");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete
  const handleDelete = async (promo: PromotionItem) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã [${promo.code}]? Hành động này không thể hoàn tác.`)) {
      return;
    }
    setActionLoadingId(promo.id);
    try {
      const res: any = await api.admin.promotions.delete(promo.id);
      if (res.success) {
        await fetchPromotions();
      }
    } catch (err: any) {
      alert(err?.message || "Không thể xóa mã khuyến mại");
    } finally {
      setActionLoadingId(null);
    }
  };

  // View Redemptions
  const handleOpenRedemptions = async (promo: PromotionItem) => {
    setRedemptionsPromo(promo);
    setLoadingRedemptions(true);
    setRedemptionsList([]);
    try {
      const res: any = await api.admin.promotions.getRedemptions(promo.id);
      if (res.success && res.data) {
        setRedemptionsList(res.data.redemptions || []);
      }
    } catch (err: any) {
      alert(err?.message || "Không thể tải danh sách học viên dùng mã");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPromo(null);
    setFormData({
      code: "",
      title: "Chương trình Trải nghiệm Go-Live VIP",
      description: "Tặng 14 ngày học VIP đầy đủ tính năng & 20 lượt chấm AI",
      code_type: "FREE_TRIAL",
      duration_days: 14,
      ai_quota: 20,
      teacher_quota: 0,
      discount_amount: 50000,
      discount_percent: 20,
      min_order_amount: 0,
      max_uses: "",
      expires_at: "2026-11-25T23:59",
      is_featured: false,
      is_active: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (promo: PromotionItem) => {
    setEditingPromo(promo);
    let formattedExpiresAt = "";
    if (promo.expiresAt) {
      try {
        const d = new Date(promo.expiresAt);
        formattedExpiresAt = d.toISOString().slice(0, 16);
      } catch {}
    }
    setFormData({
      code: promo.code,
      title: promo.title || "",
      description: promo.description || "",
      code_type: promo.codeType || "FREE_TRIAL",
      duration_days: promo.durationDays ?? 14,
      ai_quota: promo.aiQuota ?? 20,
      teacher_quota: promo.teacherQuota ?? 0,
      discount_amount: promo.discountAmount ?? 50000,
      discount_percent: promo.discountPercent ?? 20,
      min_order_amount: promo.minOrderAmount ?? 0,
      max_uses: promo.maxUses !== null && promo.maxUses !== undefined ? promo.maxUses : "",
      expires_at: formattedExpiresAt,
      is_featured: promo.isFeatured,
      is_active: promo.isActive,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        code_type: formData.code_type,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
        max_uses: formData.max_uses !== "" ? Number(formData.max_uses) : null,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : null,
      };

      if (formData.code_type === "FREE_TRIAL") {
        payload.duration_days = Number(formData.duration_days) || 14;
        payload.ai_quota = Number(formData.ai_quota) || 20;
        payload.teacher_quota = Number(formData.teacher_quota) || 0;
      } else if (formData.code_type === "DISCOUNT_AMOUNT") {
        payload.discount_amount = Number(formData.discount_amount) || 0;
        payload.min_order_amount = Number(formData.min_order_amount) || 0;
      } else if (formData.code_type === "DISCOUNT_PERCENT") {
        payload.discount_percent = Number(formData.discount_percent) || 0;
        payload.min_order_amount = Number(formData.min_order_amount) || 0;
      }

      if (editingPromo) {
        const res: any = await api.admin.promotions.update(editingPromo.id, payload);
        if (res.success) {
          setIsModalOpen(false);
          await fetchPromotions();
        }
      } else {
        const res: any = await api.admin.promotions.create(payload);
        if (res.success) {
          setIsModalOpen(false);
          await fetchPromotions();
        }
      }
    } catch (err: any) {
      setFormError(err?.message || "Đã xảy ra lỗi khi lưu mã khuyến mại");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      const matchesSearch =
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.title && p.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType =
        typeFilter === "ALL" || p.codeType === typeFilter;

      let matchesStatus = true;
      if (statusFilter === "ACTIVE") matchesStatus = p.isActive;
      else if (statusFilter === "INACTIVE") matchesStatus = !p.isActive;
      else if (statusFilter === "FEATURED") matchesStatus = p.isFeatured;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [promotions, searchTerm, typeFilter, statusFilter]);

  // Summary Metrics
  const activeCount = promotions.filter((p) => p.isActive).length;
  const featuredItem = promotions.find((p) => p.isFeatured);
  const totalRedemptions = promotions.reduce((acc, p) => acc + (p.currentUses || 0), 0);

  const stats = [
    {
      icon: Tag,
      value: promotions.length,
      label: "Tổng số mã",
      subValue: "Mã khuyến mại & quà tặng",
      iconColor: "text-blue-500",
    },
    {
      icon: CheckCircle2,
      value: activeCount,
      label: "Đang hoạt động",
      subValue: `${promotions.length - activeCount} mã tạm ngưng`,
      iconColor: "text-emerald-500",
    },
    {
      icon: Flame,
      value: featuredItem ? featuredItem.code : "Chưa bật",
      label: "Mã Treo Banner (Live)",
      subValue: featuredItem
        ? featuredItem.expiresAt
          ? `Hết hạn: ${new Date(featuredItem.expiresAt).toLocaleDateString("vi-VN")}`
          : "Không giới hạn hạn dùng"
        : "Không hiển thị trên trang chủ",
      iconColor: "text-amber-500",
    },
    {
      icon: Users,
      value: totalRedemptions.toLocaleString("vi-VN"),
      label: "Tổng lượt kích hoạt",
      subValue: "Học viên đã trải nghiệm",
      iconColor: "text-purple-500",
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <AdminPageHeader
        badge={{
          icon: Sparkles,
          label: "QUẢN TRỊ KHUYẾN MẠI & BANNER",
        }}
        title="Quản lý Mã Khuyến Mại & Voucher"
        description="Toàn quyền tạo mã trải nghiệm 0đ, voucher giảm giá đơn hàng, và bật cờ Treo Banner độc quyền hiển thị trực tiếp cho học viên."
        stats={stats}
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchPromotions}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-primary" : ""}`} />
              Làm mới
            </button>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 active:scale-[0.98] transition-all shadow-md shadow-primary/20"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo mã mới
            </button>
          </div>
        }
      />

      {/* Cơ chế Auto-Swap Banner Notice */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5 text-slate-800 dark:text-slate-200 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading font-bold text-sm text-amber-900 dark:text-amber-300">
                Cơ chế Treo Banner Độc Quyền (Auto-Swap Thông Minh)
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                OPTION 1 ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Mỗi thời điểm chỉ có <strong>duy nhất 1 mã</strong> được treo trên thanh Banner thông báo trang chủ. Khi bạn gạt <strong>BẬT</strong> cờ &quot;Treo Banner&quot; cho bất kỳ mã nào, hệ thống sẽ <strong>tự động hạ mã cũ xuống</strong> trong một Transaction an toàn mà không cần thao tác tắt thủ công.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo mã code, tiêu đề..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả loại mã</option>
            <option value="FREE_TRIAL">🎁 Quà tặng VIP 0đ</option>
            <option value="DISCOUNT_AMOUNT">💵 Giảm tiền mặt</option>
            <option value="DISCOUNT_PERCENT">🏷️ Giảm theo %</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang bật (Active)</option>
            <option value="INACTIVE">Tạm ngưng (Off)</option>
            <option value="FEATURED">🔥 Đang treo Banner</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Mã Code</th>
                <th className="py-3.5 px-4">Loại Mã</th>
                <th className="py-3.5 px-4">Quyền Lợi</th>
                <th className="py-3.5 px-4">Lượt Dùng</th>
                <th className="py-3.5 px-4">Hạn Sử Dụng</th>
                <th className="py-3.5 px-4 text-center">Treo Banner</th>
                <th className="py-3.5 px-4 text-center">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Đang nạp dữ liệu danh sách mã...
                  </td>
                </tr>
              ) : filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Không tìm thấy mã khuyến mại nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredPromotions.map((p) => {
                  const isExpired = p.expiresAt ? new Date(p.expiresAt) < new Date() : false;
                  const isUsageExceeded = p.maxUses ? p.currentUses >= p.maxUses : false;
                  const isOperating = p.isActive && !isExpired && !isUsageExceeded;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                        p.isFeatured ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.05]" : ""
                      }`}
                    >
                      {/* Mã Code */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm tracking-wide px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 select-all">
                              {p.code}
                            </span>
                            <button
                              onClick={() => handleCopyCode(p.code)}
                              title="Sao chép mã"
                              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            >
                              {copiedCode === p.code ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {p.isFeatured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                <Flame className="w-3 h-3" /> LIVE BANNER
                              </span>
                            )}
                          </div>
                          <div className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                            {p.title}
                          </div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 max-w-xs">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Loại Mã */}
                      <td className="py-4 px-4 align-middle">
                        {p.codeType === "FREE_TRIAL" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <Gift className="w-3.5 h-3.5" /> Quà Tặng VIP 0đ
                          </span>
                        )}
                        {p.codeType === "DISCOUNT_AMOUNT" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Coins className="w-3.5 h-3.5" /> Giảm Tiền Mặt
                          </span>
                        )}
                        {p.codeType === "DISCOUNT_PERCENT" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Percent className="w-3.5 h-3.5" /> Giảm Giá Theo %
                          </span>
                        )}
                      </td>

                      {/* Quyền Lợi */}
                      <td className="py-4 px-4 align-middle">
                        {p.codeType === "FREE_TRIAL" && (
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {p.durationDays || 14} Ngày VIP
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              +{p.aiQuota || 20} lượt chấm AI
                            </div>
                          </div>
                        )}
                        {p.codeType === "DISCOUNT_AMOUNT" && (
                          <div className="space-y-0.5">
                            <div className="font-bold text-blue-600 dark:text-blue-400">
                              -{Number(p.discountAmount || 0).toLocaleString("vi-VN")} đ
                            </div>
                            {p.minOrderAmount ? (
                              <div className="text-[11px] text-slate-500">
                                Đơn từ {Number(p.minOrderAmount).toLocaleString("vi-VN")} đ
                              </div>
                            ) : null}
                          </div>
                        )}
                        {p.codeType === "DISCOUNT_PERCENT" && (
                          <div className="space-y-0.5">
                            <div className="font-bold text-purple-600 dark:text-purple-400">
                              Giảm {p.discountPercent}%
                            </div>
                            {p.minOrderAmount ? (
                              <div className="text-[11px] text-slate-500">
                                Đơn từ {Number(p.minOrderAmount).toLocaleString("vi-VN")} đ
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>

                      {/* Lượt Dùng */}
                      <td className="py-4 px-4 align-middle">
                        <div className="space-y-1 max-w-[130px]">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                              {p.currentUses}
                            </span>
                            <span className="text-slate-400">
                              / {p.maxUses ? p.maxUses : "Không GH"}
                            </span>
                          </div>
                          {p.maxUses && (
                            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  p.currentUses >= p.maxUses ? "bg-rose-500" : "bg-primary"
                                }`}
                                style={{
                                  width: `${Math.min(100, (p.currentUses / p.maxUses) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                          {isUsageExceeded && (
                            <span className="text-[10px] text-rose-500 font-medium">Đã hết lượt dùng</span>
                          )}
                        </div>
                      </td>

                      {/* Hạn Sử Dụng */}
                      <td className="py-4 px-4 align-middle">
                        {p.expiresAt ? (
                          <div className="space-y-0.5">
                            <div
                              className={`text-xs font-medium ${
                                isExpired
                                  ? "text-rose-500 dark:text-rose-400 line-through"
                                  : "text-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {new Date(p.expiresAt).toLocaleDateString("vi-VN")}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(p.expiresAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                            {isExpired && (
                              <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500">
                                ĐÃ HẾT HẠN
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">Vô thời hạn</span>
                        )}
                      </td>

                      {/* Treo Banner Toggle (Option 1 Auto-Swap) */}
                      <td className="py-4 px-4 align-middle text-center">
                        <button
                          type="button"
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleToggleFeatured(p)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${
                            p.isFeatured ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                          } ${actionLoadingId === p.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              p.isFeatured ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <div className="text-[10px] font-medium text-slate-500 mt-1">
                          {p.isFeatured ? (
                            <span className="text-amber-600 dark:text-amber-400 font-bold">Đang Treo</span>
                          ) : (
                            "Tắt"
                          )}
                        </div>
                      </td>

                      {/* Trạng Thái Toggle */}
                      <td className="py-4 px-4 align-middle text-center">
                        <button
                          type="button"
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleToggleActive(p)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                            p.isActive ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                          } ${actionLoadingId === p.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                              p.isActive ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <div className="text-[10px] font-medium text-slate-500 mt-1">
                          {p.isActive ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Bật</span>
                          ) : (
                            "Tắt"
                          )}
                        </div>
                      </td>

                      {/* Thao Tác */}
                      <td className="py-4 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenRedemptions(p)}
                            title="Xem học viên đã dùng"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Chỉnh sửa mã"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p)}
                            title="Xóa mã"
                            disabled={actionLoadingId === p.id}
                            className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500 dark:text-rose-400 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
      </div>

      {/* =========================================================================
          MODAL: TẠO MỚI / CHỈNH SỬA MÃ KHUYẾN MẠI
          ========================================================================= */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-900 dark:text-white space-y-5"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary" />
                <h3 className="font-heading font-bold text-lg">
                  {editingPromo ? `Chỉnh Sửa Mã [${editingPromo.code}]` : "Tạo Mã Khuyến Mại / Quà Tặng Mới"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModal} className="space-y-4 text-xs sm:text-sm">
              {/* Row: Code & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Mã Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingPromo)}
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="VD: GOLIVE14, APTIS50"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-60"
                  />
                  <p className="text-[11px] text-slate-400">Tự động viết hoa, không dấu, không khoảng cách.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Tiêu đề hiển thị <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="VD: Quà tặng Go-Live 14 ngày VIP"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Mô tả quyền lợi hoặc thể lệ chương trình để học viên nắm rõ..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Loại Mã Code */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Loại mã & Mô hình áp dụng</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code_type: "FREE_TRIAL" })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formData.code_type === "FREE_TRIAL"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Gift className="w-5 h-5 mb-1.5 text-emerald-500" />
                    <span className="font-bold text-xs">Quà Tặng VIP 0đ</span>
                    <span className="text-[10px] text-slate-500">Tặng ngày VIP trải nghiệm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code_type: "DISCOUNT_AMOUNT" })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formData.code_type === "DISCOUNT_AMOUNT"
                        ? "border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Coins className="w-5 h-5 mb-1.5 text-blue-500" />
                    <span className="font-bold text-xs">Giảm Tiền Mặt</span>
                    <span className="text-[10px] text-slate-500">Giảm trừ trực tiếp VNĐ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code_type: "DISCOUNT_PERCENT" })}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      formData.code_type === "DISCOUNT_PERCENT"
                        ? "border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500"
                        : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <Percent className="w-5 h-5 mb-1.5 text-purple-500" />
                    <span className="font-bold text-xs">Giảm Theo %</span>
                    <span className="text-[10px] text-slate-500">Chiết khấu theo phần trăm</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Fields for Code Type */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                {formData.code_type === "FREE_TRIAL" && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Số ngày VIP tặng
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={formData.duration_days}
                        onChange={(e) =>
                          setFormData({ ...formData, duration_days: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Lượt chấm AI tặng
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.ai_quota}
                        onChange={(e) =>
                          setFormData({ ...formData, ai_quota: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Chấm GV tặng
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={formData.teacher_quota}
                        onChange={(e) =>
                          setFormData({ ...formData, teacher_quota: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {formData.code_type === "DISCOUNT_AMOUNT" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Số tiền giảm (VNĐ)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={1000}
                        value={formData.discount_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_amount: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Đơn tối thiểu áp dụng (VNĐ)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={formData.min_order_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, min_order_amount: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}

                {formData.code_type === "DISCOUNT_PERCENT" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Phần trăm giảm (%)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.discount_percent}
                        onChange={(e) =>
                          setFormData({ ...formData, discount_percent: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Đơn tối thiểu áp dụng (VNĐ)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={0}
                        value={formData.min_order_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, min_order_amount: Number(e.target.value) })
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Limits and Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Giới hạn số lượt dùng (Tùy chọn)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Bỏ trống nếu không giới hạn"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-slate-400">Ví dụ: 100 lượt cho 100 học viên đầu tiên.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Ngày kết thúc chương trình (Hạn dùng)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-slate-400">Sau thời gian này, học viên sẽ không thể nhập mã.</p>
                </div>
              </div>

              {/* Switches: Featured Banner and Active */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
                {/* Switch Treo Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-500" />
                      <span className="font-bold text-xs text-amber-900 dark:text-amber-300">
                        Treo lên Banner trang chủ (Auto-Swap)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Tự động gỡ mã hiện tại và đưa mã này lên thông báo Banner học viên.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_featured: !formData.is_featured })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      formData.is_featured ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_featured ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Switch Kích Hoạt */}
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      Kích hoạt sử dụng mã (Active)
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Bật để cho phép học viên áp dụng mã khi học tập hoặc thanh toán.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      formData.is_active ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary/95 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-primary/20 flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {editingPromo ? "Lưu thay đổi" : "Tạo mã khuyến mại"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DANH SÁCH HỌC VIÊN ĐÃ DÙNG MÃ (REDEMPTIONS)
          ========================================================================= */}
      {redemptionsPromo && (
        <div
          onClick={() => setRedemptionsPromo(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 text-slate-900 dark:text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-heading font-bold text-base">
                    Lịch Sử Kích Hoạt Mã [{redemptionsPromo.code}]
                  </h3>
                  <p className="text-xs text-slate-400">
                    {redemptionsPromo.title} &bull; Tổng {redemptionsList.length} lượt đã dùng
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRedemptionsPromo(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto py-4">
              {loadingRedemptions ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Đang tải danh sách học viên...
                </div>
              ) : redemptionsList.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Chưa có học viên nào kích hoạt mã này.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {redemptionsList.map((r) => (
                    <div key={r.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-100">
                          {r.user.full_name || "Học viên ẩn danh"}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {r.user.email} {r.user.phone_number ? `&bull; ${r.user.phone_number}` : ""}
                        </div>
                      </div>

                      <div className="text-right space-y-0.5 shrink-0">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(r.redeemedAt).toLocaleDateString("vi-VN")}{" "}
                          {new Date(r.redeemedAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        {r.subscription && (
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Hạn VIP: {new Date(r.subscription.end_date).toLocaleDateString("vi-VN")} (+{r.subscription.ai_quota_left} AI)
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-right">
              <button
                onClick={() => setRedemptionsPromo(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

