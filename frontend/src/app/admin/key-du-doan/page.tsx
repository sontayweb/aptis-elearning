"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Sparkles,
  Flame,
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
  Eye,
  Zap,
  Tag,
  Filter,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminTableCard from "@/components/admin/admin-table-card";
import { ExamItem, EditExamFormData } from "@/components/admin/exams/exam.types";
import { ExamEditModal } from "@/components/admin/exams/exam-edit-modal";
import { BulkHotLevelModal } from "@/components/admin/exams/bulk-hot-level-modal";
import ConfirmModal from "@/components/admin/confirm-modal";
import { DEFAULT_TOPIC_RULES, TopicRule, normalizeText } from "@/lib/topic-rules";

export default function AdminKeyDuDoanPage() {
  // Top-level View Tab: 'topics' (Quy tắc chủ đề & auto gán nhãn) or 'exams' (Danh sách đề thi)
  const [activeMainTab, setActiveMainTab] = useState<"topics" | "exams">("topics");

  // Exams State (Tab 2)
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Exams
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [hotFilter, setHotFilter] = useState<string>("HOT_ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Topic Rules State (Tab 1)
  const [topicRules, setTopicRules] = useState<(TopicRule & { matchedCount?: number })[]>(DEFAULT_TOPIC_RULES);
  const [topicLoading, setTopicLoading] = useState(false);
  const [topicSearch, setTopicSearch] = useState("");
  const [topicHotFilter, setTopicHotFilter] = useState<number | 0>(0); // 0 = all, 5, 4, 3, 2
  const [syncingAll, setSyncingAll] = useState(false);

  // Topic Edit/Create Modal State
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TopicRule | null>(null);
  const [topicFormData, setTopicFormData] = useState<{
    id?: string;
    name: string;
    hotLevel: number;
    forecastTag: string;
    keywordsStr: string;
    excludeKeywordsStr: string;
    applicableSkill: "ALL" | "READING" | "LISTENING" | "SPEAKING" | "WRITING";
    autoPropagate: boolean;
  }>({
    name: "",
    hotLevel: 5,
    forecastTag: "★★★★★ Đề tủ cực hot",
    keywordsStr: "",
    excludeKeywordsStr: "",
    applicableSkill: "ALL",
    autoPropagate: true,
  });
  const [topicSaving, setTopicSaving] = useState(false);

  // Preview Matches Modal State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewRule, setPreviewRule] = useState<TopicRule | null>(null);
  const [previewData, setPreviewData] = useState<{
    totalMatches: number;
    exams: { id: string; title: string; skill: string; hot_level: number; forecast_tag?: string }[];
  }>({ totalMatches: 0, exams: [] });

  // Delete Topic Confirm
  const [confirmDeleteTopic, setConfirmDeleteTopic] = useState<TopicRule | null>(null);
  const [resetHotOnDelete, setResetHotOnDelete] = useState(false);

  // Modal: Edit Exam
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [editForm, setEditForm] = useState<EditExamFormData>({
    title: "",
    description: "",
    skill: "FULL_TEST",
    durationMinutes: 162,
    isPro: false,
    isPublished: true,
    hotLevel: 5,
  });
  const [editLoading, setEditLoading] = useState(false);

  // Modal: Add Exam into Key Category
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [allExamsPool, setAllExamsPool] = useState<ExamItem[]>([]);
  const [poolSearch, setPoolSearch] = useState("");
  const [loadingPool, setLoadingPool] = useState(false);
  const [selectedPoolExam, setSelectedPoolExam] = useState<ExamItem | null>(null);
  const [assignHotLevel, setAssignHotLevel] = useState<number>(5);
  const [assignLoading, setAssignLoading] = useState(false);

  // Confirm remove from Key
  const [confirmRemoveExam, setConfirmRemoveExam] = useState<ExamItem | null>(null);
  const [bulkHotOpen, setBulkHotOpen] = useState(false);

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

  // Fetch Topic Rules from Backend
  const fetchTopicRules = useCallback(async () => {
    setTopicLoading(true);
    try {
      const res = await api.admin.getTopicRules();
      if (res && res.success && Array.isArray(res.data)) {
        setTopicRules(res.data);
      } else {
        // Fallback to local default rules
        setTopicRules(DEFAULT_TOPIC_RULES);
      }
    } catch {
      // Offline or error -> fallback gracefully
      setTopicRules(DEFAULT_TOPIC_RULES);
    } finally {
      setTopicLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopicRules();
    fetchKeyExams();
  }, [fetchTopicRules, fetchKeyExams]);

  // ─────────────────────────────────────────────────────────────
  // TOPIC ACTIONS
  // ─────────────────────────────────────────────────────────────

  // Fast change topic clover level (1..5 ☘️)
  const handleTopicQuickSetHot = async (rule: TopicRule, newLevel: number) => {
    const updatedTag =
      newLevel === 5
        ? "★★★★★ Đề tủ cực hot"
        : newLevel === 4
        ? "★★★★ Tần suất thi cao"
        : newLevel === 3
        ? "★★★ Trọng tâm ôn tập"
        : "★★ Luyện tập mở rộng";

    try {
      const res = await api.admin.saveTopicRule({
        ...rule,
        hotLevel: newLevel,
        forecastTag: updatedTag,
        autoPropagate: true,
      });

      if (res && res.success) {
        showToast(`Đã đổi chủ đề "${rule.name}" thành ${newLevel} ☘️ và tự động cập nhật toàn bộ đề thi khớp!`);
        fetchTopicRules();
        fetchKeyExams();
      } else {
        showToast("Lỗi khi cập nhật mức Cỏ cho chủ đề");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Open Preview Modal
  const handleOpenPreview = async (rule: TopicRule) => {
    setPreviewRule(rule);
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    try {
      const res = await api.admin.previewTopicMatches({
        keywords: rule.keywords,
        skill: rule.applicableSkill,
      });
      if (res && res.success && res.data) {
        setPreviewData(res.data);
      } else {
        setPreviewData({ totalMatches: 0, exams: [] });
      }
    } catch {
      showToast("Không thể tải danh sách đề thi khớp");
    } finally {
      setPreviewLoading(false);
    }
  };

  // Sync All Rules to DB
  const handleSyncAllRules = async () => {
    setSyncingAll(true);
    try {
      const res = await api.admin.syncAllTopicRules();
      if (res && res.success) {
        showToast(`⚡ Đã đồng bộ thành công! Cập nhật ${res.data?.updatedCount ?? 0} đề thi theo quy tắc chủ đề.`);
        fetchTopicRules();
        fetchKeyExams();
      } else {
        showToast("Không thể đồng bộ quy tắc chủ đề");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setSyncingAll(false);
    }
  };

  // Open Add/Edit Topic Modal
  const handleOpenAddTopic = () => {
    setEditingTopic(null);
    setTopicFormData({
      name: "",
      hotLevel: 5,
      forecastTag: "★★★★★ Đề tủ cực hot",
      keywordsStr: "",
      excludeKeywordsStr: "",
      applicableSkill: "ALL",
      autoPropagate: true,
    });
    setTopicModalOpen(true);
  };

  const handleOpenEditTopic = (rule: TopicRule) => {
    setEditingTopic(rule);
    setTopicFormData({
      id: rule.id,
      name: rule.name,
      hotLevel: rule.hotLevel,
      forecastTag: rule.forecastTag,
      keywordsStr: rule.keywords.join(", "),
      excludeKeywordsStr: (rule.excludeKeywords || []).join(", "),
      applicableSkill: rule.applicableSkill || "ALL",
      autoPropagate: true,
    });
    setTopicModalOpen(true);
  };

  // Save Topic Rule
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicFormData.name.trim()) {
      showToast("Vui lòng nhập tên chủ đề");
      return;
    }
    const keywords = topicFormData.keywordsStr
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter(Boolean);

    if (keywords.length === 0) {
      showToast("Vui lòng nhập ít nhất 1 từ khóa nhận diện");
      return;
    }

    const excludeKeywords = topicFormData.excludeKeywordsStr
      .split(/[,;\n]/)
      .map((k) => k.trim())
      .filter(Boolean);

    setTopicSaving(true);
    try {
      const payload = {
        id: topicFormData.id,
        name: topicFormData.name.trim(),
        hotLevel: Number(topicFormData.hotLevel),
        forecastTag: topicFormData.forecastTag.trim(),
        keywords,
        excludeKeywords: excludeKeywords.length > 0 ? excludeKeywords : undefined,
        applicableSkill: topicFormData.applicableSkill,
        autoPropagate: topicFormData.autoPropagate,
        isActive: true,
      };

      const res = await api.admin.saveTopicRule(payload);
      if (res && res.success) {
        showToast(
          topicFormData.autoPropagate
            ? `Đã lưu chủ đề "${payload.name}" và tự động gắn nhãn ${payload.hotLevel} ☘️ cho các đề thi liên quan!`
            : `Đã lưu chủ đề "${payload.name}" thành công!`
        );
        setTopicModalOpen(false);
        fetchTopicRules();
        fetchKeyExams();
      } else {
        showToast(res.error?.message || "Lỗi khi lưu chủ đề");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setTopicSaving(false);
    }
  };

  // Delete Topic Rule
  const handleConfirmDeleteTopic = async () => {
    if (!confirmDeleteTopic) return;
    try {
      const res = await api.admin.deleteTopicRule(confirmDeleteTopic.id, resetHotOnDelete);
      if (res && res.success) {
        showToast(`Đã xóa chủ đề "${confirmDeleteTopic.name}"!`);
        setConfirmDeleteTopic(null);
        fetchTopicRules();
        fetchKeyExams();
      } else {
        showToast("Lỗi khi xóa chủ đề");
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // INDIVIDUAL EXAMS ACTIONS (Tab 2)
  // ─────────────────────────────────────────────────────────────
  const handleCycleHotLevel = async (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = exam.hotLevel ?? 0;
    const nextLevel = (current + 1) % 6;
    try {
      const res = await api.admin.updateExam(exam.id, { hotLevel: nextLevel });
      if (res.success) {
        showToast(
          nextLevel === 0
            ? `Đã gỡ "${exam.title}" khỏi danh mục Đề Key (0 ☘️)`
            : `Đã đổi "${exam.title}" thành ${"☘️".repeat(nextLevel)} (${nextLevel} Cỏ)`
        );
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi khi cập nhật mức độ Cỏ");
    }
  };

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

  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setSelectedPoolExam(null);
    setLoadingPool(true);
    try {
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

  const handleAssignToKey = async () => {
    if (!selectedPoolExam) return;
    setAssignLoading(true);
    try {
      const res = await api.admin.updateExam(selectedPoolExam.id, { hotLevel: assignHotLevel });
      if (res.success) {
        showToast(`Đã thêm "${selectedPoolExam.title}" vào Đề Key với mức độ ${"☘️".repeat(assignHotLevel || 1)}!`);
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

  // Filtered Topic Rules
  const filteredTopics = useMemo(() => {
    return topicRules.filter((r) => {
      const matchesSearch =
        topicSearch.trim() === "" ||
        r.name.toLowerCase().includes(topicSearch.toLowerCase()) ||
        r.keywords.some((kw) => kw.toLowerCase().includes(topicSearch.toLowerCase()));
      const matchesHot = topicHotFilter === 0 || r.hotLevel === topicHotFilter;
      return matchesSearch && matchesHot;
    });
  }, [topicRules, topicSearch, topicHotFilter]);

  // Topic Stats
  const topicStats = useMemo(() => {
    const totalTopics = topicRules.length;
    const hot5Count = topicRules.filter((r) => r.hotLevel === 5).length;
    const hot4Count = topicRules.filter((r) => r.hotLevel === 4).length;
    const hot3Count = topicRules.filter((r) => r.hotLevel === 3).length;
    const hot2Count = topicRules.filter((r) => r.hotLevel === 2).length;
    const totalMatchedExams = topicRules.reduce((acc, curr) => acc + (curr.matchedCount || 0), 0);
    return { totalTopics, hot5Count, hot4Count, hot3Count, hot2Count, totalMatchedExams };
  }, [topicRules]);

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
          label: `${topicStats.totalTopics} Chủ đề · ${topicStats.totalMatchedExams} Đề thi khớp`,
        }}
        title="Quản lý Gán nhãn Sao & Đề Key Dự Đoán ☘️"
        description="Gán nhãn Cỏ (☘️) tự động theo Chủ đề (Topic-based propagation) — Đổi số sao cho 1 chủ đề sẽ tự động lan tỏa tới tất cả đề thi có cùng chủ đề trên toàn hệ thống."
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
              onClick={() => setBulkHotOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors"
              title="Dán danh sách tên đề để gán mức Cỏ ☘️ hàng loạt"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Gán độ hot hàng loạt</span>
            </button>

            <button
              onClick={handleSyncAllRules}
              disabled={syncingAll}
              className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Quét và cập nhật toàn bộ đề thi trong DB theo tập luật chủ đề"
            >
              <Zap className={`w-3.5 h-3.5 ${syncingAll ? "animate-spin" : ""}`} />
              <span>{syncingAll ? "Đang đồng bộ..." : "⚡ Đồng bộ toàn hệ thống"}</span>
            </button>

            <button
              onClick={handleOpenAddTopic}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Chủ Đề Mới</span>
            </button>
          </div>
        }
      />

      {/* Main Mode Switcher: Topics vs Individual Exams */}
      <div className="flex items-center gap-3 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveMainTab("topics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
            activeMainTab === "topics"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>☘️ Quy Tắc Chủ Đề & Tự Động Gán Sao ({topicRules.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab("exams")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all ${
            activeMainTab === "exams"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📋 Danh Sách Đề Thi Đã Gán Nhãn ({exams.length} Đề)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: TOPIC RULES & AUTO-PROPAGATION STUDIO             */}
      {/* ======================================================== */}
      {activeMainTab === "topics" && (
        <div className="space-y-6">
          {/* Topic Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div
              onClick={() => setTopicHotFilter(0)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                topicHotFilter === 0
                  ? "bg-primary/10 border-primary shadow-sm"
                  : "bg-card border-border/60 hover:border-primary/40"
              }`}
            >
              <div className="text-xs font-semibold text-muted-foreground">Tất cả chủ đề</div>
              <div className="text-2xl font-black mt-1 text-foreground">{topicStats.totalTopics}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">{topicStats.totalMatchedExams} đề khớp</div>
            </div>

            <div
              onClick={() => setTopicHotFilter(5)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                topicHotFilter === 5
                  ? "bg-emerald-500/10 border-emerald-500 shadow-sm"
                  : "bg-card border-border/60 hover:border-emerald-500/40"
              }`}
            >
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">☘️☘️☘️☘️☘️ Cực Hot</div>
              <div className="text-2xl font-black mt-1 text-foreground">{topicStats.hot5Count}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Mức ưu tiên 5</div>
            </div>

            <div
              onClick={() => setTopicHotFilter(4)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                topicHotFilter === 4
                  ? "bg-amber-500/10 border-amber-500 shadow-sm"
                  : "bg-card border-border/60 hover:border-amber-500/40"
              }`}
            >
              <div className="text-xs font-semibold text-amber-600 dark:text-amber-400">☘️☘️☘️☘️ Tần Suất Cao</div>
              <div className="text-2xl font-black mt-1 text-foreground">{topicStats.hot4Count}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Mức ưu tiên 4</div>
            </div>

            <div
              onClick={() => setTopicHotFilter(3)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                topicHotFilter === 3
                  ? "bg-blue-500/10 border-blue-500 shadow-sm"
                  : "bg-card border-border/60 hover:border-blue-500/40"
              }`}
            >
              <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">☘️☘️☘️ Trọng Tâm</div>
              <div className="text-2xl font-black mt-1 text-foreground">{topicStats.hot3Count}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Mức ưu tiên 3</div>
            </div>

            <div
              onClick={() => setTopicHotFilter(2)}
              className={`cursor-pointer p-4 rounded-2xl border transition-all ${
                topicHotFilter === 2
                  ? "bg-slate-500/10 border-slate-500 shadow-sm"
                  : "bg-card border-border/60 hover:border-slate-500/40"
              }`}
            >
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">☘️☘️ Mở Rộng</div>
              <div className="text-2xl font-black mt-1 text-foreground">{topicStats.hot2Count}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Mức ưu tiên 2</div>
            </div>
          </div>

          {/* Search & Topic Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={topicSearch}
                onChange={(e) => setTopicSearch(e.target.value)}
                placeholder="Tìm kiếm chủ đề theo tên hoặc từ khóa (ví dụ: film, singer, coffee, mountain)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
              {topicSearch && (
                <button
                  onClick={() => setTopicSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[0, 5, 4, 3, 2].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setTopicHotFilter(lvl)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                    topicHotFilter === lvl
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lvl === 0 ? "Tất cả" : `${"☘️".repeat(lvl)} (${lvl} Cỏ)`}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Cards Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((rule) => {
              const cloverColors =
                rule.hotLevel === 5
                  ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                  : rule.hotLevel === 4
                  ? "border-amber-500/30 bg-amber-500/[0.03]"
                  : rule.hotLevel === 3
                  ? "border-blue-500/30 bg-blue-500/[0.03]"
                  : "border-slate-500/30 bg-slate-500/[0.03]";

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${cloverColors}`}
                >
                  <div>
                    {/* Header: Title & Hot level selector */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-heading font-black text-sm text-foreground flex items-center gap-1.5">
                          <span>{rule.name}</span>
                        </h4>
                        <span className="text-[11px] text-muted-foreground block mt-0.5">
                          {rule.forecastTag}
                        </span>
                      </div>

                      {/* Interactive Clover Picker: Click any number of clovers to change */}
                      <div
                        className="flex items-center bg-card/80 border border-border/80 rounded-lg p-1 shrink-0 shadow-xs"
                        title="Click để đổi nhanh số Cỏ cho chủ đề này (tự động lan tỏa)"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleTopicQuickSetHot(rule, star)}
                            className={`p-0.5 rounded text-xs transition-transform hover:scale-125 ${
                              star <= rule.hotLevel ? "opacity-100" : "opacity-25 grayscale"
                            }`}
                          >
                            ☘️
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Keywords pills */}
                    <div className="mt-3">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Từ khóa nhận diện ({rule.keywords.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rule.keywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-medium bg-muted/80 text-foreground border border-border/50"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>

                      {rule.excludeKeywords && rule.excludeKeywords.length > 0 && (
                        <div className="mt-2 text-[10px] text-rose-500 flex items-center gap-1">
                          <span className="font-bold">Loại trừ:</span>
                          <span className="italic">{rule.excludeKeywords.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & Actions */}
                  <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenPreview(rule)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                      title="Xem tất cả các đề thi đang khớp với từ khóa của chủ đề này"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{rule.matchedCount ?? 0} đề thi khớp</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTopicQuickSetHot(rule, rule.hotLevel)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-500/10 transition-colors"
                        title="Lan tỏa ngay đến tất cả đề thi khớp trong DB"
                      >
                        <Zap className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleOpenEditTopic(rule)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Chỉnh sửa từ khóa & thông tin chủ đề"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDeleteTopic(rule);
                          setResetHotOnDelete(false);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Xóa chủ đề"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTopics.length === 0 && (
            <div className="p-12 text-center border rounded-2xl border-dashed border-border bg-card">
              <Tag className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-foreground">Không tìm thấy chủ đề phù hợp</p>
              <p className="text-xs text-muted-foreground mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm Chủ Đề Mới</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: INDIVIDUAL EXAMS REGISTRY & MANUAL OVERRIDE       */}
      {/* ======================================================== */}
      {activeMainTab === "exams" && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/60 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Skill Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {["ALL", "READING", "LISTENING", "WRITING", "SPEAKING"].map((sk) => (
                  <button
                    key={sk}
                    onClick={() => setSkillFilter(sk)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-colors ${
                      skillFilter === sk
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sk === "ALL" ? "Tất cả kỹ năng" : sk}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm đề theo tiêu đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Hot Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/40">
              {[
                { key: "HOT_ALL", label: "Tất cả đề Key (1☘️-5☘️)" },
                { key: "HOT_5", label: "☘️☘️☘️☘️☘️ 5 Cỏ" },
                { key: "HOT_4", label: "☘️☘️☘️☘️ 4 Cỏ" },
                { key: "HOT_3", label: "☘️☘️☘️ 3 Cỏ" },
                { key: "HOT_2", label: "☘️☘️ 2 Cỏ" },
                { key: "HOT_1", label: "☘️ 1 Cỏ" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setHotFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    hotFilter === tab.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exams Table */}
          <AdminTableCard
            header={
              <div className="p-4 border-b border-border/80 flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Danh sách Bộ đề Key Dự đoán</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bấm trực tiếp vào cột Mức Cỏ để chuyển nhanh mức độ (0 ☘️ → 5 ☘️)
                  </p>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/30 text-muted-foreground font-heading font-semibold">
                    <th className="py-3 px-4">Tên bộ đề</th>
                    <th className="py-3 px-4">Kỹ năng</th>
                    <th className="py-3 px-4">Mức Cỏ (Hot Level)</th>
                    <th className="py-3 px-4">Gói đề</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                        Đang tải danh sách đề Key...
                      </td>
                    </tr>
                  ) : exams.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        Không tìm thấy bộ đề nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-foreground line-clamp-1">{exam.title}</div>
                          {exam.forecastTag && (
                            <span className="text-[10px] text-muted-foreground block">{exam.forecastTag}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground border">
                            {exam.skill}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => handleCycleHotLevel(exam, e)}
                            className="px-2.5 py-1 rounded-lg border border-border/80 bg-card hover:bg-muted text-xs font-semibold flex items-center gap-1 transition-transform hover:scale-105"
                            title="Click để chuyển nhanh cấp độ Cỏ"
                          >
                            <span>{"☘️".repeat(exam.hotLevel || 1)}</span>
                            <span className="text-[11px] text-muted-foreground">({exam.hotLevel || 1} Cỏ)</span>
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => handleToggleVip(exam, e)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                              exam.isPro
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                                : "bg-muted text-muted-foreground border"
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            <span>{exam.isPro ? "VIP PRO" : "Miễn phí"}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleOpenEdit(exam, e)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Sửa đề thi"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmRemoveExam(exam)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                              title="Gỡ khỏi danh mục Đề Key"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AdminTableCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PREVIEW MATCHING EXAMS (Xem trước đề khớp)         */}
      {/* ======================================================== */}
      {previewModalOpen && previewRule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>Đề thi khớp chủ đề: "{previewRule.name}"</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Từ khóa: {previewRule.keywords.join(", ")}
                </p>
              </div>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              {previewLoading ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Đang quét hệ thống tìm đề thi khớp...
                </div>
              ) : previewData.exams.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  Không tìm thấy đề thi nào khớp với từ khóa của chủ đề này trong Database.
                </div>
              ) : (
                <>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    ✓ Tìm thấy {previewData.totalMatches} đề thi khớp trên toàn bộ các kỹ năng:
                  </div>
                  <div className="space-y-2">
                    {previewData.exams.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-foreground">{ex.title}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="font-semibold text-primary">[{ex.skill}]</span>
                            <span>Mức Cỏ hiện tại: {"☘️".repeat(ex.hot_level || 0)} ({ex.hot_level || 0} Cỏ)</span>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            → {previewRule.hotLevel} ☘️
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Tổng cộng {previewData.totalMatches} đề thi
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT TOPIC RULE                          */}
      {/* ======================================================== */}
      {topicModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <span>{editingTopic ? "Chỉnh sửa Chủ Đề" : "Thêm Chủ Đề Mới"}</span>
              </h3>
              <button
                onClick={() => setTopicModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">Tên chủ đề *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Film & Cinema, Mountain Summits..."
                  value={topicFormData.name}
                  onChange={(e) => setTopicFormData({ ...topicFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Mức độ Cỏ / Sao (Hot Level) *</label>
                <div className="flex items-center gap-2">
                  {[5, 4, 3, 2, 1].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        setTopicFormData({
                          ...topicFormData,
                          hotLevel: lvl,
                          forecastTag:
                            lvl === 5
                              ? "★★★★★ Đề tủ cực hot"
                              : lvl === 4
                              ? "★★★★ Tần suất thi cao"
                              : lvl === 3
                              ? "★★★ Trọng tâm ôn tập"
                              : "★★ Luyện tập mở rộng",
                        })
                      }
                      className={`flex-1 py-2 rounded-xl border text-center font-bold transition-all ${
                        topicFormData.hotLevel === lvl
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : "border-border/60 bg-muted/40 text-muted-foreground hover:border-emerald-500/30"
                      }`}
                    >
                      <div>{"☘️".repeat(lvl)}</div>
                      <div className="text-[10px] mt-0.5">{lvl} Cỏ</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Nhãn dự đoán hiển thị (Forecast Tag)</label>
                <input
                  type="text"
                  value={topicFormData.forecastTag}
                  onChange={(e) => setTopicFormData({ ...topicFormData, forecastTag: e.target.value })}
                  placeholder="Ví dụ: ★★★★★ Đề tủ cực hot (Part 2/3)"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Từ khóa nhận diện đề thi * (phân tách bởi dấu phẩy hoặc xuống dòng)
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ví dụ: making films, film club, film, movie"
                  value={topicFormData.keywordsStr}
                  onChange={(e) => setTopicFormData({ ...topicFormData, keywordsStr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                />
                <span className="text-[11px] text-muted-foreground">
                  Bất kỳ đề thi nào có tiêu đề chứa 1 trong các từ khóa trên sẽ tự động được nhận diện vào chủ đề này.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Từ khóa loại trừ (Exclude Keywords - Không bắt buộc)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: childhood memories (để tránh nuốt khi từ khóa là childhood)"
                  value={topicFormData.excludeKeywordsStr}
                  onChange={(e) => setTopicFormData({ ...topicFormData, excludeKeywordsStr: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Kỹ năng áp dụng</label>
                <select
                  value={topicFormData.applicableSkill}
                  onChange={(e) =>
                    setTopicFormData({
                      ...topicFormData,
                      applicableSkill: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                >
                  <option value="ALL">Tất cả kỹ năng (Reading, Listening, Speaking, Writing)</option>
                  <option value="READING">Chỉ Reading</option>
                  <option value="LISTENING">Chỉ Listening</option>
                  <option value="SPEAKING">Chỉ Speaking</option>
                  <option value="WRITING">Chỉ Writing</option>
                </select>
              </div>

              {/* Auto Propagate Switch */}
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] flex items-center justify-between">
                <div>
                  <div className="font-bold text-foreground">⚡ Tự động gán nhãn ngay cho đề thi</div>
                  <div className="text-[11px] text-muted-foreground">
                    Cập nhật ngay lập tức các đề thi trong Database có chứa từ khóa
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={topicFormData.autoPropagate}
                  onChange={(e) => setTopicFormData({ ...topicFormData, autoPropagate: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted font-semibold text-xs"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={topicSaving}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{topicSaving ? "Đang lưu..." : "Lưu Chủ Đề"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIRM DELETE TOPIC MODAL                                */}
      {/* ======================================================== */}
      {confirmDeleteTopic && (
        <ConfirmModal
          isOpen={true}
          title={`Xác nhận xóa chủ đề "${confirmDeleteTopic.name}"?`}
          message={`Bạn có chắc chắn muốn xóa quy tắc chủ đề "${confirmDeleteTopic.name}" khỏi hệ thống không? Các đề thi đã gán Cỏ sẽ được bảo lưu.`}
          onConfirm={handleConfirmDeleteTopic}
          onCancel={() => setConfirmDeleteTopic(null)}
          confirmText="Xác nhận xóa"
          type="danger"
        />
      )}

      {/* Modals for Tab 2: Edit Exam, Add Exam, Remove Exam */}
      {editingExam && (
        <ExamEditModal
          exam={editingExam}
          form={editForm}
          setForm={setEditForm}
          loading={editLoading}
          onClose={() => setEditingExam(null)}
          onSave={handleSaveEdit}
        />
      )}

      <BulkHotLevelModal
        isOpen={bulkHotOpen}
        onClose={() => setBulkHotOpen(false)}
        defaultSkill={skillFilter}
        onDone={(msg) => {
          showToast(msg);
          fetchKeyExams();
          fetchTopicRules();
        }}
      />

      {confirmRemoveExam && (
        <ConfirmModal
          isOpen={true}
          title="Gỡ đề khỏi danh mục Đề Key?"
          message={`Bạn có chắc muốn chuyển mức độ Cỏ của đề "${confirmRemoveExam.title}" về 0 ☘️ (Đề thường)?`}
          onConfirm={handleConfirmRemove}
          onCancel={() => setConfirmRemoveExam(null)}
          confirmText="Gỡ khỏi Đề Key"
          type="danger"
        />
      )}
    </div>
  );
}
