"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
  FileText,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Save,
  Crown,
  Sparkles,
  GraduationCap,
  Building2,
  KeyRound,
  ExternalLink,
  Layers,
  X,
  CreditCard,
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

export default function AdminCmsPricingPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState(0);
  const [editAiQuota, setEditAiQuota] = useState(0);
  const [editTeacherQuota, setEditTeacherQuota] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getPlans();
      if (res.success && res.data) {
        setPlans(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách gói cước:", err);
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

      if (res.success) {
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
        showToast(res.error?.message || "Lỗi lưu gói cước");
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: PlanItem) => {
    const nextStatus = !plan.isActive;
    try {
      const res = await api.admin.updatePlan(plan.id, {
        is_active: nextStatus,
      });

      if (res.success) {
        setPlans((prev) =>
          prev.map((p) => (p.id === plan.id ? { ...p, isActive: nextStatus } : p))
        );
        showToast(
          `Đã ${nextStatus ? "kích hoạt" : "tạm dừng"} gói cước ${plan.name}!`
        );
      }
    } catch (err) {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Quản lý Gói cước VIP
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Cấu hình bảng giá các gói VIP, phân bổ hạn ngạch chấm AI/Giảng viên và thông số cổng SePay
          </p>
        </div>

        <button
          onClick={fetchPlans}
          className="self-start sm:self-auto px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold rounded-xl border border-slate-200 shadow-2xs transition-colors flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
          <span>Làm mới bảng giá</span>
        </button>
      </div>

      {/* Plans Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-slate-400 rounded-2xl border border-slate-200/80 bg-white">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-600" />
            Đang tải dữ liệu bảng giá...
          </div>
        ) : (
          plans.map((plan) => {
            const isEditing = editingPlanId === plan.id;

            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs relative bg-white ${
                  plan.isActive ? "border-slate-200/90" : "border-slate-200/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-heading font-bold uppercase bg-slate-100 text-slate-800 font-mono">
                      {plan.code}
                    </span>
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`text-[10px] font-heading font-semibold px-2.5 py-0.5 rounded-full transition-colors border ${
                        plan.isActive
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-slate-100 border-slate-200 text-slate-500"
                      }`}
                    >
                      {plan.isActive ? "Đang mở bán" : "Đã tạm dừng"}
                    </button>
                  </div>

                  <h3 className="text-base font-heading font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3 font-normal">
                    Thời hạn: {plan.durationDays} ngày ({Math.round(plan.durationDays / 30)} tháng)
                  </p>

                  {/* Price Setting */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 mb-3">
                    <div className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Giá niêm yết (VND)
                    </div>
                    {isEditing ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full p-1.5 text-base font-mono font-bold rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                    ) : (
                      <div className="text-xl font-mono font-bold text-slate-900">
                        {plan.priceVnd.toLocaleString("vi-VN")}{" "}
                        <span className="text-xs font-normal text-slate-500">đ</span>
                      </div>
                    )}
                  </div>

                  {/* Quotas */}
                  <div className="space-y-2 text-xs mb-4 divide-y divide-slate-100">
                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5 font-normal">
                        <Sparkles className="w-3.5 h-3.5 text-slate-700" /> Quota chấm AI:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editAiQuota}
                          onChange={(e) => setEditAiQuota(Number(e.target.value))}
                          className="w-20 p-1 text-xs border border-slate-300 rounded-lg text-right font-mono font-bold bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-slate-900">{plan.aiQuota} lượt</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 flex items-center gap-1.5 font-normal">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-700" /> Quota GV chấm:
                      </span>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editTeacherQuota}
                          onChange={(e) => setEditTeacherQuota(Number(e.target.value))}
                          className="w-20 p-1 text-xs border border-slate-300 rounded-lg text-right font-mono font-bold bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                        />
                      ) : (
                        <span className="font-mono font-semibold text-slate-900">{plan.teacherQuota} bài</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <span className="text-slate-500 font-normal">Học viên đang dùng:</span>
                      <span className="font-mono font-semibold text-emerald-700">
                        {plan.activeSubscribers} học viên
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Controls */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={saving}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                      >
                        {saving ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Lưu thay đổi</span>
                      </button>
                      <button
                        onClick={() => setEditingPlanId(null)}
                        className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartEdit(plan)}
                      className="w-full py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold border border-slate-200 shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Chỉnh sửa giá & Quota</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* System Gateway Configuration */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800">
            <Building2 className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-slate-900">
              Cổng Thanh Toán Tự Động MB Bank qua SePay
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-normal">
              Giao dịch chuyển khoản được quét tự động bằng API SePay Webhook và kích hoạt VIP tức thì
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">
              Ngân hàng nhận
            </span>
            <div className="font-heading font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-700" />
              <span>MB Bank (Quân Đội)</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono">Tài khoản chính thức</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">
              Số tài khoản MB
            </span>
            <div className="font-mono font-bold text-slate-900 text-base tracking-wider">
              0988776655
            </div>
            <p className="text-[11px] text-slate-500">CTK: NGUYEN HOANG HIEP</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-wider">
              Trạng thái Webhook
            </span>
            <div className="font-heading font-bold text-emerald-700 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Hoạt động 24/7 (Sẵn sàng)</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono truncate">
              /api/payment/sepay-webhook
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
