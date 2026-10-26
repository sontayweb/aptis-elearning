"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Sparkles,
  Flame,
  Star,
  Search,
  RefreshCw,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Clock,
  Layers,
  HelpCircle,
  Play,
  X,
  Save,
  Check,
  ShieldCheck,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminTableCard from "@/components/admin/admin-table-card";
import { ExamItem, EditExamFormData } from "@/components/admin/exams/exam.types";
import { ExamEditModal } from "@/components/admin/exams/exam-edit-modal";
import ConfirmModal from "@/components/admin/confirm-modal";

export default function AdminKeyDuDoanPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [hotFilter, setHotFilter] = useState<string>("HOT_ALL"); // "HOT_ALL", "HOT_3", "HOT_2", "HOT_1"
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Modals
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editForm, setEditForm] = useState<EditExamFormData>({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
    isPublished: true,
    hotLevel: 3,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Modal: Add Exam into Key Category
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [allExamsPool, setAllExamsPool] = useState<ExamItem[]>([]);
  const [poolSearch, setPoolSearch] = useState("");
  const [loadingPool, setLoadingPool] = useState(false);
  const [selectedPoolExam, setSelectedPoolExam] = useState<ExamItem | null>(null);
  const [assignHotLevel, setAssignHotLevel] = useState<number>(3);
  const [assignLoading, setAssignLoading] = useState(false);

  // Confirm remove from Key
  const [confirmRemoveExam, setConfirmRemoveExam] = useState<ExamItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch Key Exams
  const fetchKeyExams = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.admin.getExams({
        skill: skillFilter !== "ALL" ? skillFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        hotLevel: hotFilter,
        page: 1,
        limit: 200,
      });

      if (res.success && res.data) {
        setExams(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đề key dự đoán:", err);
      showToast("Không thể tải danh sách đề Key");
    } finally {
      setLoading(false);
    }
  }, [skillFilter, hotFilter, debouncedSearch]);

  useEffect(() => {
    fetchKeyExams();
  }, [fetchKeyExams]);

  // Cycle hot level: 0 -> 1 -> 2 -> 3 -> 0
  const handleCycleHotLevel = async (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = exam.hotLevel ?? 0;
    const nextLevel = current === 0 ? 1 : current === 1 ? 2 : current === 2 ? 3 : 0;
    try {
      const res = await api.admin.updateExam(exam.id, { hotLevel: nextLevel });
      if (res.success) {
        showToast(
          nextLevel === 0
            ? `Đã gỡ "${exam.title}" khỏi danh mục Đề Key`
            : `Đã đổi "${exam.title}" thành ${nextLevel}⭐`
        );
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi khi cập nhật mức độ hot");
    }
  };

  // Quick toggle VIP
  const handleToggleVip = async (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPro = !exam.isPro;
    try {
      const res = await api.admin.updateExam(exam.id, { isPro: nextPro });
      if (res.success) {
        showToast(nextPro ? `Đã gắn nhãn VIP cho "${exam.title}"` : `Đã mở miễn phí cho "${exam.title}"`);
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi khi cập nhật gói VIP");
    }
  };

  // Open Edit Exam Modal
  const handleOpenEdit = (exam: ExamItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingExam(exam);
    setEditForm({
      title: exam.title,
      description: exam.description || "",
      skill: exam.skill,
      durationMinutes: exam.durationMinutes,
      isPro: exam.isPro,
      isPublished: exam.isPublished,
      hotLevel: exam.hotLevel ?? 3,
    });
  };

  // Save Edit Exam
  const handleSaveEdit = async () => {
    if (!editingExam) return;
    setEditLoading(true);
    try {
      const res = await api.admin.updateExam(editingExam.id, {
        title: editForm.title,
        description: editForm.description || undefined,
        skill: editForm.skill,
        durationMinutes: Number(editForm.durationMinutes),
        isPro: editForm.isPro,
        isPublished: editForm.isPublished,
        hotLevel: Number(editForm.hotLevel),
      });

      if (res.success) {
        showToast("Đã cập nhật cấu hình đề Key!");
        setEditingExam(null);
        fetchKeyExams();
      } else {
        showToast(res.error?.message || "Lỗi cập nhật đề");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setEditLoading(false);
    }
  };

  // Remove from Key Category
  const handleConfirmRemove = async () => {
    if (!confirmRemoveExam) return;
    try {
      const res = await api.admin.updateExam(confirmRemoveExam.id, { hotLevel: 0 });
      if (res.success) {
        showToast(`Đã gỡ "${confirmRemoveExam.title}" khỏi danh mục Đề Key`);
        setConfirmRemoveExam(null);
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  // Open Add Pool Modal
  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setSelectedPoolExam(null);
    setLoadingPool(true);
    try {
      // Get all exams to pick from
      const res = await api.admin.getExams({ limit: 100 });
      if (res.success && res.data) {
        setAllExamsPool(res.data);
      }
    } catch {
      showToast("Không thể tải kho đề");
    } finally {
      setLoadingPool(false);
    }
  };

  // Confirm Add to Key Category
  const handleAssignToKey = async () => {
    if (!selectedPoolExam) return;
    setAssignLoading(true);
    try {
      const res = await api.admin.updateExam(selectedPoolExam.id, { hotLevel: assignHotLevel });
      if (res.success) {
        showToast(`Đã thêm "${selectedPoolExam.title}" vào Đề Key với mức độ ${assignHotLevel}⭐!`);
        setAddModalOpen(false);
        fetchKeyExams();
      } else {
        showToast(res.error?.message || "Lỗi gán đề");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setAssignLoading(false);
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = exams.length;
    const hot3Count = exams.filter((e) => (e.hotLevel ?? 0) === 3).length;
    const hot2Count = exams.filter((e) => (e.hotLevel ?? 0) === 2).length;
    const hot1Count = exams.filter((e) => (e.hotLevel ?? 0) === 1).length;
    const vipCount = exams.filter((e) => e.isPro).length;
    return { total, hot3Count, hot2Count, hot1Count, vipCount };
  }, [exams]);

  const skillTabs = [
    { key: "ALL", label: "Tất cả kỹ năng" },
    { key: "READING", label: "Reading" },
    { key: "LISTENING", label: "Listening" },
    { key: "WRITING", label: "Writing" },
    { key: "SPEAKING", label: "Speaking" },
    { key: "FULL_TEST", label: "Full Test" },
  ];

  const hotTabs = [
    { key: "HOT_ALL", label: "Tất cả Đề Key (1⭐-3⭐)", icon: Sparkles },
    { key: "HOT_3", label: "🔥🔥🔥 3⭐ Đề Tủ", icon: Flame },
    { key: "HOT_2", label: "⭐⭐ 2⭐ Đề Hot", icon: Star },
    { key: "HOT_1", label: "⭐ 1⭐ Ôn tập", icon: Star },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <AdminPageHeader
        badge={{
          icon: Sparkles,
          label: `${stats.total} Đề Key`,
        }}
        title="Quản lý Đề Key Dự Đoán ☘️"
        description="Quản lý tập trung các bộ đề có gắn sao, dự đoán trúng tủ cao, đồng bộ trực tiếp với giao diện học viên (/key-du-doan)"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/key-du-doan"
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors"
              title="Mở giao diện phòng Đề Key của học viên"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Xem trang Học viên</span>
            </Link>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white text-xs font-heading font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-rose-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Gán đề mới vào Key</span>
            </button>

            <button
              onClick={fetchKeyExams}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
              title="Tải lại"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/60 to-white dark:from-rose-950/30 dark:to-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
              Tổng số Đề Key
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-rose-950 dark:text-rose-100">
            {stats.total}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Đang phát hành cho học viên</span>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/60 to-white dark:from-amber-950/30 dark:to-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
              🔥🔥🔥 3⭐ Đề Tủ
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-amber-950 dark:text-amber-100">
            {stats.hot3Count}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Khả năng trúng cao nhất (&gt;90%)</span>
        </div>

        <div className="p-4 rounded-2xl border border-orange-200/80 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/60 to-white dark:from-orange-950/30 dark:to-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400">
              ⭐⭐ 2⭐ Đề Hot
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/40 text-orange-600 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-orange-950 dark:text-orange-100">
            {stats.hot2Count}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Tần suất xuất hiện thường xuyên</span>
        </div>

        <div className="p-4 rounded-2xl border border-purple-200/80 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/60 to-white dark:from-purple-950/30 dark:to-slate-900 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400">
              Yêu cầu VIP PRO
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-mono font-black text-purple-950 dark:text-purple-100">
            {stats.vipCount}
          </p>
          <span className="text-[10px] text-slate-400 mt-1 block">Độc quyền cho gói tài khoản VIP</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3.5 shadow-xs">
        {/* Row 1: Skill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">Kỹ năng:</span>
          {skillTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSkillFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold shrink-0 transition-all ${
                skillFilter === tab.key
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Row 2: Hot Level Filter + Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {hotTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setHotFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                    hotFilter === tab.key
                      ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                      : "bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đề Key..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>
      </div>

      {/* Exams Table Card */}
      <AdminTableCard
        header={
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                Danh sách Đề Key Dự Đoán đang hoạt động
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                {exams.length} đề
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Bấm trực tiếp vào cột Mức độ Hot để xoay vòng gán sao (0⭐ ➔ 1⭐ ➔ 2⭐ ➔ 3⭐)
            </p>
          </div>
        }
        isLoading={loading}
        isEmpty={exams.length === 0}
        emptyTitle="Không có đề Key dự đoán nào phù hợp"
        emptySubtitle="Hãy thử điều chỉnh lại bộ lọc hoặc bấm '+ Gán đề mới vào Key' ở trên."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-[11px] font-heading font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Đề thi</th>
                <th className="py-3 px-3">Kỹ năng</th>
                <th className="py-3 px-3">Mức độ Hot</th>
                <th className="py-3 px-3">VIP</th>
                <th className="py-3 px-3">Cấu trúc</th>
                <th className="py-3 px-3">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {exams.map((exam) => {
                const hotLvl = exam.hotLevel ?? 0;
                return (
                  <tr
                    key={exam.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Title */}
                    <td className="py-3.5 px-4 font-heading font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span>{exam.title}</span>
                        {exam.description && (
                          <span className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]" title={exam.description}>
                            — {exam.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Skill */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {exam.skill}
                      </span>
                    </td>

                    {/* Hot Level Switcher */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={(e) => handleCycleHotLevel(exam, e)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 ${
                          hotLvl === 3
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 shadow-2xs"
                            : hotLvl === 2
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                            : hotLvl === 1
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                        }`}
                        title="Click để xoay vòng mức độ Hot"
                      >
                        {hotLvl === 3 && <Flame className="w-3.5 h-3.5 fill-rose-500" />}
                        {hotLvl === 2 && <Star className="w-3.5 h-3.5 fill-amber-500" />}
                        {hotLvl === 1 && <Star className="w-3.5 h-3.5 fill-blue-500" />}
                        <span>
                          {hotLvl === 3
                            ? "3⭐ Đề Tủ"
                            : hotLvl === 2
                            ? "2⭐ Đề Hot"
                            : hotLvl === 1
                            ? "1⭐ Ôn tập"
                            : "Chưa gán"}
                        </span>
                      </button>
                    </td>

                    {/* VIP Toggle */}
                    <td className="py-3.5 px-3">
                      <button
                        onClick={(e) => handleToggleVip(exam, e)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 transition-colors ${
                          exam.isPro
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600"
                        }`}
                        title="Click để đổi VIP / Miễn phí"
                      >
                        <Crown className={`w-3 h-3 ${exam.isPro ? "fill-amber-500" : ""}`} />
                        <span>{exam.isPro ? "VIP PRO" : "Free"}</span>
                      </button>
                    </td>

                    {/* Structure */}
                    <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                      {exam.partsCount} parts • {exam.questionsCount} Qs • {exam.durationMinutes}p
                    </td>

                    {/* Published */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                          exam.isPublished ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                      <span className="text-[11px] text-slate-500">
                        {exam.isPublished ? "Xuất bản" : "Nháp"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/exams/${exam.id}/edit`}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Sửa chi tiết câu hỏi & phần thi"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Biên soạn</span>
                        </Link>

                        <button
                          onClick={(e) => handleOpenEdit(exam, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Cấu hình nhanh"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setConfirmRemoveExam(exam)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Gỡ khỏi danh mục Đề Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminTableCard>

      {/* Modal: Add Exam into Key Category */}
      {addModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setAddModalOpen(false);
          }}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-900 dark:text-white">
                    Gán Đề thi vào Danh mục Key Dự Đoán
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Chọn một bộ đề từ kho và thiết lập mức độ hot để đưa lên phòng Đề Key học viên
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Search in pool */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Gõ tên đề để lọc nhanh trong kho đề..."
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Pool list */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800">
                {loadingPool ? (
                  <div className="p-6 text-center text-slate-400">Đang tải kho đề...</div>
                ) : (
                  allExamsPool
                    .filter((e) => e.title.toLowerCase().includes(poolSearch.toLowerCase()))
                    .map((item) => {
                      const isSelected = selectedPoolExam?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedPoolExam(item)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-rose-50 dark:bg-rose-950/50 text-rose-950 dark:text-rose-200 font-bold"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border border-slate-200 dark:border-slate-700">
                              {item.skill}
                            </span>
                            <span className="truncate">{item.title}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {item.hotLevel && item.hotLevel > 0 ? (
                              <span className="text-[10px] text-amber-600 font-bold">
                                {item.hotLevel}⭐ (Đã gán)
                              </span>
                            ) : null}
                            {isSelected && <Check className="w-4 h-4 text-rose-600" />}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              {/* Level Selector */}
              {selectedPoolExam && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Chọn mức độ sao cho:{" "}
                    <span className="text-rose-600">{selectedPoolExam.title}</span>
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { level: 3, label: "🔥🔥 3⭐ Đề Tủ", desc: "Trúng tủ cao nhất" },
                      { level: 2, label: "⭐⭐ 2⭐ Đề Hot", desc: "Xuất hiện đều" },
                      { level: 1, label: "⭐ 1⭐ Ôn tập", desc: "Bổ trợ thêm" },
                    ].map((opt) => (
                      <button
                        key={opt.level}
                        type="button"
                        onClick={() => setAssignHotLevel(opt.level)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          assignHotLevel === opt.level
                            ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold"
                            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="text-xs">{opt.label}</div>
                        <div className="text-[10px] opacity-70">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs"
              >
                Hủy
              </button>
              <button
                disabled={!selectedPoolExam || assignLoading}
                onClick={handleAssignToKey}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {assignLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Gán vào Đề Key</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Exam Metadata Modal */}
      <ExamEditModal
        exam={editingExam}
        form={editForm}
        setForm={setEditForm}
        onSave={handleSaveEdit}
        onClose={() => setEditingExam(null)}
        loading={editLoading}
      />

      {/* Confirm Remove Modal */}
      <ConfirmModal
        isOpen={!!confirmRemoveExam}
        title="Gỡ đề khỏi danh mục Key Dự Đoán"
        message={`Bạn có chắc muốn gỡ "${confirmRemoveExam?.title}" khỏi phòng Đề Key? Đề thi vẫn được giữ nguyên trong kho đề chung với mức độ 0⭐.`}
        confirmText="Xác nhận gỡ"
        cancelText="Hủy"
        onConfirm={handleConfirmRemove}
        onCancel={() => setConfirmRemoveExam(null)}
      />
    </div>
  );
}
