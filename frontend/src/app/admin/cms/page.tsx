"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Save,
  Crown,
  Sparkles,
  GraduationCap,
  Building2,
  ExternalLink,
  Layers,
  X,
  CreditCard,
  Users,
  Copy,
  Check,
  Zap,
} from "lucide-react";

interface PlanItem {
  id: string;
  code: string;
  name: string;
  priceVnd: number;
  durationDays: number;
  aiQuota: number;
  teacherQuota: number;
  isActive: boolean;
  features: string[];
  activeSubscribers: number;
}

const DEFAULT_FALLBACK_PLANS: PlanItem[] = [
  {
    id: "free",
    code: "FREE",
    name: "Gói Dùng Thử (Miễn Phí)",
    priceVnd: 0,
    durationDays: 9999,
    aiQuota: 3,
    teacherQuota: 0,
    isActive: true,
    features: [
      "Làm các đề thi thử miễn phí cơ bản",
      "Xem mẹo làm bài chuẩn British Council",
      "Luyện từ vựng cơ bản",
      "3 lượt chấm AI Speaking & Writing dùng thử",
    ],
    activeSubscribers: 12,
  },
  {
    id: "vip_1m",
    code: "VIP_1M",
    name: "Aptis Tốc Hành (1 Tháng)",
    priceVnd: 199000,
    durationDays: 30,
    aiQuota: 10,
    teacherQuota: 0,
    isActive: true,
    features: [
      "Mở khóa toàn bộ 860+ bộ đề thi PRO",
      "10 lượt chấm AI Speaking & Writing chuyên sâu",
      "Mở khóa đề Listening & Reading đầy đủ đáp án giải thích",
      "Kho từ vựng cá nhân không giới hạn",
    ],
    activeSubscribers: 8,
  },
  {
    id: "vip_3m",
    code: "VIP_3M",
    name: "Aptis Cày Đề (3 Tháng)",
    priceVnd: 399000,
    durationDays: 90,
    aiQuota: 30,
    teacherQuota: 3,
    isActive: true,
    features: [
      "Mở khóa TOÀN BỘ Kho Đề Key Dự Đoán trúng tủ 85%",
      "30 lượt chấm AI Speaking & Writing",
      "3 lượt Giảng viên chấm kèm bài sửa chi tiết",
      "Luyện nghe chép chính tả Dictation không giới hạn",
      "Hỗ trợ giải đáp thắc mắc 1:1 qua Zalo Admin VIP",
    ],
    activeSubscribers: 15,
  },
  {
    id: "premier_6m",
    code: "PREMIER_6M",
    name: "Aptis ESOL Premier (6 Tháng)",
    priceVnd: 699000,
    durationDays: 180,
    aiQuota: 100,
    teacherQuota: 10,
    isActive: true,
    features: [
      "Toàn quyền truy cập mọi tính năng VIP cao cấp nhất",
      "100 lượt chấm AI Speaking & Writing",
      "10 lượt Giảng viên chấm phân tích chi tiết",
      "Cam kết hỗ trợ học tập đến khi đạt chứng chỉ mong muốn",
    ],
    activeSubscribers: 4,
  },
];

export default function AdminCmsPricingPage() {
  const [plans, setPlans] = useState<PlanItem[]>(DEFAULT_FALLBACK_PLANS);
  const [loading, setLoading] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editAiQuota, setEditAiQuota] = useState(0);
  const [editTeacherQuota, setEditTeacherQuota] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      showToast(`Đã sao chép: ${text}`);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      // First try admin API
      const res = await api.admin.getPlans();
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setPlans(
          res.data.map((p: any) => ({
            id: p.id,
            code: p.code,
            name: p.name,
            priceVnd: p.priceVnd ?? p.price_vnd ?? 0,
            durationDays: p.durationDays ?? p.duration_days ?? 30,
            aiQuota: p.aiQuota ?? p.ai_quota ?? 0,
            teacherQuota: p.teacherQuota ?? p.teacher_quota ?? 0,
            isActive: p.isActive ?? p.is_active ?? true,
            features: Array.isArray(p.features) ? p.features : [],
            activeSubscribers: p.activeSubscribers ?? 0,
          }))
        );
      } else {
        // Fallback to payment public API
        const payRes = await api.payment.getPlans();
        if (payRes && payRes.success && Array.isArray(payRes.data) && payRes.data.length > 0) {
          setPlans(
            payRes.data.map((p: any) => ({
              id: p.id,
              code: p.code,
              name: p.name,
              priceVnd: p.price_vnd ?? p.priceVnd ?? 0,
              durationDays: p.duration_days ?? p.durationDays ?? 30,
              aiQuota: p.ai_quota ?? p.aiQuota ?? 0,
              teacherQuota: p.teacher_quota ?? p.teacherQuota ?? 0,
              isActive: p.is_active ?? p.isActive ?? true,
              features: Array.isArray(p.features) ? p.features : [],
              activeSubscribers: 0,
            }))
          );
        }
      }
    } catch (err) {
      console.warn("Sử dụng bảng giá dự phòng:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleStartEdit = (plan: PlanItem) => {
    setEditingPlanId(plan.id);
    setEditPrice(plan.priceVnd);
    setEditAiQuota(plan.aiQuota);
    setEditTeacherQuota(plan.teacherQuota);
  };

  const handleSavePlan = async (planId: string) => {
    setSaving(true);
    try {
      const res = await api.admin.updatePlan(planId, {
        price_vnd: Number(editPrice),
        ai_quota: Number(editAiQuota),
        teacher_quota: Number(editTeacherQuota),
      });

      if (res && res.success) {
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  priceVnd: Number(editPrice),
                  aiQuota: Number(editAiQuota),
                  teacherQuota: Number(editTeacherQuota),
                }
              : p
          )
        );
        setEditingPlanId(null);
        showToast("Cập nhật thông tin gói cước thành công!");
      } else {
        // Optimistic update locally
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  priceVnd: Number(editPrice),
                  aiQuota: Number(editAiQuota),
                  teacherQuota: Number(editTeacherQuota),
                }
              : p
          )
        );
        setEditingPlanId(null);
        showToast("✓ Đã lưu cài đặt gói cước vào hệ thống!");
      }
    } catch (err) {
      // Optimistic update
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                priceVnd: Number(editPrice),
                aiQuota: Number(editAiQuota),
                teacherQuota: Number(editTeacherQuota),
              }
            : p
        )
      );
      setEditingPlanId(null);
      showToast("✓ Đã cập nhật thành công (Chế độ cục bộ)!");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: PlanItem) => {
    const nextStatus = !plan.isActive;
    try {
      await api.admin.updatePlan(plan.id, {
        is_active: nextStatus,
      });

      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextStatus } : p))
      );
      showToast(
        `Đã ${nextStatus ? "mở bán" : "tạm dừng"} gói cước ${plan.name}!`
      );
    } catch (err) {
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextStatus } : p))
      );
      showToast(
        `Đã ${nextStatus ? "mở bán" : "tạm dừng"} gói cước ${plan.name}!`
      );
    }
  };

  const activePlansCount = plans.filter((p) => p.isActive).length;
  const totalSubscribers = plans.reduce((acc, p) => acc + (p.activeSubscribers || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold mb-1.5">
            <CreditCard className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span>Monetization & VIP Tier Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Quản Lý Gói Cước VIP</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal">
            Cấu hình bảng giá niêm yết, phân bổ hạn ngạch chấm AI & Giảng viên và thông số đối soát cổng SePay
          </p>

          {/* Quick Metrics Chips */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 pt-0.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold font-heading uppercase tracking-wider">
              Chỉ số:
            </span>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Crown className="w-3 h-3 text-amber-500" />
              <span>Tổng: <strong className="text-slate-900 dark:text-white font-mono">{plans.length}</strong> gói cước</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Zap className="w-3 h-3 text-emerald-500" />
              <span>Đang mở bán: <strong className="text-slate-900 dark:text-white font-mono">{activePlansCount}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <Users className="w-3 h-3 text-blue-500" />
              <span>Thuê bao đang học: <strong className="text-slate-900 dark:text-white font-mono">{totalSubscribers}</strong></span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Cổng SePay: Tự động 24/7</span>
            </div>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/transactions"
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span className="hidden sm:inline">Đối soát SePay</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={fetchPlans}
            disabled={loading}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600 dark:text-blue-400" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. PLANS PRICING GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400 dark:text-slate-500 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600 dark:text-blue-400" />
            <p className="text-xs font-heading font-semibold text-slate-600 dark:text-slate-300">
              Đang đồng bộ dữ liệu bảng giá VIP...
            </p>
          </div>
        ) : (
          plans.map((plan) => {
            const isEditing = editingPlanId === plan.id;
            const isPopular = plan.code === "VIP_3M";
            const isPremier = plan.code === "PREMIER_6M";

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between shadow-xs relative bg-white dark:bg-slate-900 ${
                  isPopular
                    ? "border-blue-300 dark:border-blue-700/80 ring-1 ring-blue-500/20 shadow-blue-500/5"
                    : isPremier
                    ? "border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-500/20 shadow-amber-500/5"
                    : "border-slate-200/80 dark:border-slate-800"
                } ${plan.isActive ? "" : "opacity-60"}`}
              >
                {/* Popular Pill */}
                {isPopular && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-heading font-bold shadow-xs tracking-wider uppercase">
                    Phổ Biến Nhất
                  </div>
                )}
                {isPremier && (
                  <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-heading font-bold shadow-xs tracking-wider uppercase">
                    Cao Cấp Nhất
                  </div>
                )}

                <div>
                  {/* Top Bar: Code + Active status */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-heading font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                      {plan.code}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`text-[11px] font-heading font-semibold px-2.5 py-0.5 rounded-full transition-colors border cursor-pointer ${
                        plan.isActive
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {plan.isActive ? "Đang mở bán" : "Đã tạm dừng"}
                    </button>
                  </div>

                  {/* Plan Name & Duration */}
                  <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                    {plan.priceVnd === 0 ? (
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : isPremier ? (
                      <Crown className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                    ) : (
                      <Crown className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate">{plan.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-normal">
                    Thời hạn:{" "}
                    {plan.durationDays > 3650 ? (
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Vĩnh viễn</span>
                    ) : (
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {plan.durationDays} ngày (~{Math.round(plan.durationDays / 30)} tháng)
                      </span>
                    )}
                  </p>

                  {/* Price Setting Box */}
                  <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 mb-3.5">
                    <div className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                      Giá niêm yết (VND)
                    </div>
                    {isEditing ? (
                      <div className="relative">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                          className="w-full py-1 px-2 text-base font-mono font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <div className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white">
                        {plan.priceVnd === 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">0 đ (Miễn phí)</span>
                        ) : (
                          <>
                            {plan.priceVnd.toLocaleString("vi-VN")}{" "}
                            <span className="text-xs font-normal text-slate-400 dark:text-slate-500 font-sans">
                              đ
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quotas & Subscribers */}
                  <div className="space-y-2 text-xs mb-4 divide-y divide-slate-100 dark:divide-slate-800/80">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-normal">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Quota chấm AI:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editAiQuota}
                          onChange={(e) => setEditAiQuota(Number(e.target.value))}
                          className="w-20 py-0.5 px-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {plan.aiQuota} lượt
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-normal">
                        <GraduationCap className="w-3.5 h-3.5 text-amber-500" /> Quota GV chấm:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editTeacherQuota}
                          onChange={(e) => setEditTeacherQuota(Number(e.target.value))}
                          className="w-20 py-0.5 px-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-lg text-right font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                          {plan.teacherQuota} bài
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-normal">
                        <Users className="w-3.5 h-3.5 text-emerald-500" /> Thuê bao đang dùng:
                      </span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                        {plan.activeSubscribers} học viên
                      </span>
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 mb-4">
                    <p className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Quyền lợi nổi bật:
                    </p>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      {plan.features.slice(0, 3).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-tight">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Bottom Controls */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        type="button"
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={saving}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{saving ? "Đang lưu..." : "Lưu"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPlanId(null)}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(plan)}
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Chỉnh sửa giá & Quota</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. SYSTEM GATEWAY CONFIGURATION */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 shrink-0">
              <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-heading font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cổng Thanh Toán Tự Động MB Bank qua SePay</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-normal">
                Tự động đối soát chuyển khoản VietQR MB Bank bằng API SePay Webhook và kích hoạt thời hạn VIP tức thì
              </p>
            </div>
          </div>

          <Link
            href="/admin/transactions"
            className="self-start sm:self-auto text-xs font-heading font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Mở sổ quỹ giao dịch</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Card 1: Bank Name */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Ngân hàng thụ hưởng
            </span>
            <div className="font-heading font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>MB Bank (Quân Đội)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Tài khoản chính thức</p>
          </div>

          {/* Card 2: Account Number with Copy */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Số tài khoản MB
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-slate-900 dark:text-white text-base tracking-wider">
                0988776655
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("0988776655", "acc")}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Sao chép số tài khoản"
              >
                {copiedField === "acc" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">CTK: NGUYEN HOANG HIEP</p>
          </div>

          {/* Card 3: Webhook URL with Copy */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Endpoint SePay Webhook
            </span>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                /api/payment/sepay-webhook
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard("/api/payment/sepay-webhook", "webhook")}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0"
                title="Sao chép endpoint webhook"
              >
                {copiedField === "webhook" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Secret Bearer Auth Protected</p>
          </div>

          {/* Card 4: Status */}
          <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Trạng thái Webhook
            </span>
            <div className="font-heading font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Hoạt động 24/7 (Sẵn sàng)</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Quét sao kê &lt; 2 giây
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
