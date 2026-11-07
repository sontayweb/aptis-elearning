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
  CheckSquare,
  Square,
  Lock,
  Unlock,
  SlidersHorizontal,
} from "lucide-react";
import AdminPageHeader from "@/components/admin/admin-page-header";
import AdminTableCard from "@/components/admin/admin-table-card";
import { ExamItem, EditExamFormData } from "@/components/admin/exams/exam.types";
import { ExamEditModal } from "@/components/admin/exams/exam-edit-modal";
import ConfirmModal from "@/components/admin/confirm-modal";
import { DEFAULT_TOPIC_RULES, TopicRule, normalizeText } from "@/lib/topic-rules";

export default function AdminKeyDuDoanPage() {
  // Top-level View Tab: 'exams' (Mặc định: Quản lý danh sách đề thi trực tiếp) hoặc 'topics' (Quy tắc chủ đề nâng cao)
  const [activeMainTab, setActiveMainTab] = useState<"exams" | "topics">("exams");

  // Exams State (Tab 1)
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters for Exams
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [hotFilter, setHotFilter] = useState<string>("HOT_ALL"); // 'HOT_ALL', 'HOT_5', 'HOT_4', 'HOT_3', 'HOT_2', 'HOT_1', 'HOT_0', 'ALL'
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Multi-select Batch Actions State
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());
  const [batchLoading, setBatchLoading] = useState(false);

  // Topic Rules State (Tab 2)
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
    forecastTag: "★★★★★ Đề tủ cực hot",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Modal: Add Exam into Key Category (Thêm đề từ kho vào Key)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [poolExams, setPoolExams] = useState<ExamItem[]>([]);
  const [poolSearch, setPoolSearch] = useState("");
  const [poolSkillFilter, setPoolSkillFilter] = useState("ALL");
  const [loadingPool, setLoadingPool] = useState(false);
  const [selectedPoolExamIds, setSelectedPoolExamIds] = useState<Set<string>>(new Set());
  const [assignHotLevel, setAssignHotLevel] = useState<number>(5);
  const [assignForecastTag, setAssignForecastTag] = useState("★★★★★ Đề tủ cực hot");
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
  const fetchKeyExams = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.admin.getExams({
        skill: skillFilter !== "ALL" ? skillFilter : undefined,
        search: debouncedSearch.trim() || undefined,
        hotLevel: hotFilter,
        page: 1,
        limit: 300,
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
        setTopicRules(DEFAULT_TOPIC_RULES);
      }
    } catch {
      setTopicRules(DEFAULT_TOPIC_RULES);
    } finally {
      setTopicLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopicRules();
  }, [fetchTopicRules]);

  useEffect(() => {
    fetchKeyExams(true);
    setSelectedExamIds(new Set());
  }, [fetchKeyExams]);

  // ─────────────────────────────────────────────────────────────
  // OPTIMISTIC SINGLE EXAM ACTIONS (0ms phản hồi, không giật màn hình)
  // ─────────────────────────────────────────────────────────────

  // Set Clover Level (0..5 ☘️)
  const handleSetHotLevel = async (exam: ExamItem, newLevel: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const oldLevel = exam.hotLevel ?? 0;
    if (oldLevel === newLevel) return;

    const defaultTags: Record<number, string> = {
      5: "★★★★★ Đề tủ cực hot",
      4: "★★★★ Tần suất thi cao",
      3: "★★★ Trọng tâm ôn tập",
      2: "★★ Luyện tập mở rộng",
      1: "★ Đề bổ trợ cơ bản",
      0: "",
    };

    // Optimistic Update
    setExams((prev) =>
      prev.map((item) =>
        item.id === exam.id
          ? {
              ...item,
              hotLevel: newLevel,
              forecastTag: newLevel === 0 ? null : item.forecastTag || defaultTags[newLevel],
            }
          : item
      )
    );

    try {
      const res = await api.admin.updateExam(exam.id, {
        hotLevel: newLevel,
        forecastTag: newLevel === 0 ? null : exam.forecastTag || defaultTags[newLevel],
      });
      if (res.success) {
        showToast(
          newLevel === 0
            ? `Đã gỡ "${exam.title}" về Đề thường (0 ☘️)`
            : `Đã đổi "${exam.title}" thành ${"☘️".repeat(newLevel)} (${newLevel} Cỏ)`
        );
      } else {
        // Rollback on error
        setExams((prev) =>
          prev.map((item) => (item.id === exam.id ? { ...item, hotLevel: oldLevel } : item))
        );
        showToast(res.error?.message || "Lỗi khi cập nhật mức độ Cỏ");
      }
    } catch {
      setExams((prev) =>
        prev.map((item) => (item.id === exam.id ? { ...item, hotLevel: oldLevel } : item))
      );
      showToast("Lỗi kết nối máy chủ");
    }
  };

  // Toggle VIP Pro
  const handleToggleVip = async (exam: ExamItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPro = !exam.isPro;

    // Optimistic Update
    setExams((prev) =>
      prev.map((item) => (item.id === exam.id ? { ...item, isPro: nextPro } : item))
    );

    try {
      const res = await api.admin.updateExam(exam.id, { isPro: nextPro });
      if (res.success) {
        showToast(nextPro ? `Đã bật VIP PRO cho "${exam.title}"` : `Đã mở Miễn phí cho "${exam.title}"`);
      } else {
        setExams((prev) =>
          prev.map((item) => (item.id === exam.id ? { ...item, isPro: !nextPro } : item))
        );
        showToast("Lỗi khi cập nhật gói đề");
      }
    } catch {
      setExams((prev) =>
        prev.map((item) => (item.id === exam.id ? { ...item, isPro: !nextPro } : item))
      );
      showToast("Lỗi kết nối");
    }
  };

  // Quick Forecast Tag Preset
  const handleQuickForecastTag = async (exam: ExamItem, tag: string) => {
    setExams((prev) =>
      prev.map((item) => (item.id === exam.id ? { ...item, forecastTag: tag } : item))
    );
    try {
      const res = await api.admin.updateExam(exam.id, { forecastTag: tag });
      if (res.success) {
        showToast(`Đã cập nhật nhãn: "${tag}"`);
      }
    } catch {
      showToast("Lỗi cập nhật nhãn");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BATCH ACTIONS (Xử lý hàng loạt đề thi đã chọn)
  // ─────────────────────────────────────────────────────────────

  const handleToggleSelectAll = () => {
    if (selectedExamIds.size === exams.length && exams.length > 0) {
      setSelectedExamIds(new Set());
    } else {
      setSelectedExamIds(new Set(exams.map((e) => e.id)));
    }
  };

  const handleToggleSelectRow = (examId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(examId)) next.delete(examId);
      else next.add(examId);
      return next;
    });
  };

  const handleBatchSetHotLevel = async (hotLevel: number) => {
    if (selectedExamIds.size === 0) return;
    const ids = Array.from(selectedExamIds);
    setBatchLoading(true);

    const defaultTags: Record<number, string> = {
      5: "★★★★★ Đề tủ cực hot",
      4: "★★★★ Tần suất thi cao",
      3: "★★★ Trọng tâm ôn tập",
      2: "★★ Luyện tập mở rộng",
      1: "★ Đề bổ trợ cơ bản",
      0: "",
    };

    // Optimistic Update
    setExams((prev) =>
      prev.map((item) =>
        selectedExamIds.has(item.id)
          ? {
              ...item,
              hotLevel,
              forecastTag: hotLevel === 0 ? null : item.forecastTag || defaultTags[hotLevel],
            }
          : item
      )
    );

    try {
      const res = await api.admin.bulkUpdateHotLevel({
        examIds: ids,
        hotLevel,
        forecastTag: hotLevel === 0 ? null : defaultTags[hotLevel],
      });
      if (res && res.success) {
        showToast(
          hotLevel === 0
            ? `Đã gỡ ${ids.length} đề về Đề thường (0 ☘️)`
            : `Đã gán ${"☘️".repeat(hotLevel)} (${hotLevel} Cỏ) cho ${ids.length} đề thi!`
        );
        setSelectedExamIds(new Set());
      } else {
        showToast(res.error?.message || "Lỗi thao tác hàng loạt");
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
      fetchKeyExams();
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchToggleVip = async (isPro: boolean) => {
    if (selectedExamIds.size === 0) return;
    const ids = Array.from(selectedExamIds);
    setBatchLoading(true);

    // Optimistic Update
    setExams((prev) =>
      prev.map((item) => (selectedExamIds.has(item.id) ? { ...item, isPro } : item))
    );

    try {
      const res = await api.admin.bulkUpdateHotLevel({
        examIds: ids,
        isPro,
      });
      if (res && res.success) {
        showToast(isPro ? `Đã bật VIP PRO cho ${ids.length} đề thi!` : `Đã mở Miễn phí cho ${ids.length} đề thi!`);
        setSelectedExamIds(new Set());
      } else {
        showToast("Lỗi khi cập nhật VIP hàng loạt");
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
      fetchKeyExams();
    } finally {
      setBatchLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL: THÊM ĐỀ TỪ KHO VÀO KEY
  // ─────────────────────────────────────────────────────────────
  const handleOpenAddModal = async () => {
    setAddModalOpen(true);
    setSelectedPoolExamIds(new Set());
    setLoadingPool(true);
    try {
      // Tải tất cả đề trong kho (bao gồm đề 0 Cỏ)
      const res = await api.admin.getExams({ limit: 400 });
      if (res.success && res.data) {
        setPoolExams(res.data);
      }
    } catch {
      showToast("Không thể tải kho đề");
    } finally {
      setLoadingPool(false);
    }
  };

  const handleAssignPoolToKey = async () => {
    if (selectedPoolExamIds.size === 0) {
      showToast("Vui lòng chọn ít nhất 1 đề thi từ kho");
      return;
    }
    setAssignLoading(true);
    const ids = Array.from(selectedPoolExamIds);

    try {
      const res = await api.admin.bulkUpdateHotLevel({
        examIds: ids,
        hotLevel: assignHotLevel,
        forecastTag: assignForecastTag || null,
      });

      if (res.success) {
        showToast(`Đã thêm thành công ${ids.length} đề thi vào Đề Key với mức độ ${"☘️".repeat(assignHotLevel)}!`);
        setAddModalOpen(false);
        fetchKeyExams();
      } else {
        showToast(res.error?.message || "Lỗi khi gán đề vào Key");
      }
    } catch {
      showToast("Lỗi kết nối máy chủ");
    } finally {
      setAssignLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // MODAL: EDIT EXAM CHI TIẾT
  // ─────────────────────────────────────────────────────────────
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
      forecastTag: exam.forecastTag || "★★★★★ Đề tủ cực hot",
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
        forecastTag: editForm.forecastTag || null,
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
      const res = await api.admin.updateExam(confirmRemoveExam.id, { hotLevel: 0, forecastTag: null });
      if (res.success) {
        showToast(`Đã gỡ "${confirmRemoveExam.title}" khỏi danh mục Đề Key`);
        setConfirmRemoveExam(null);
        fetchKeyExams();
      }
    } catch {
      showToast("Lỗi kết nối");
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TOPIC RULES ACTIONS (Tab 2)
  // ─────────────────────────────────────────────────────────────

  const handleTopicQuickSetHot = async (rule: TopicRule, newLevel: number) => {
    const updatedTag =
      newLevel === 5
        ? "★★★★★ Đề tủ cực hot"
        : newLevel === 4
        ? "★★★★ Tần suất thi cao"
        : newLevel === 3
        ? "★★★ Trọng tâm ôn tập"
        : "★★ Luyện tập mở rộng";

    // Optimistic
    setTopicRules((prev) =>
      prev.map((r) => (r.id === rule.id ? { ...r, hotLevel: newLevel, forecastTag: updatedTag } : r))
    );

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

  const handleSyncAllRules = async () => {
    setSyncingAll(true);
    try {
      const res = await api.admin.syncAllTopicRules();
      if (res && res.success) {
        showToast(`⚡ Đã đồng bộ thành công! Cập nhật ${res.data?.updatedCount ?? 0} đề thi theo quy tắc từ khóa.`);
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

  // KPI Statistics
  const examStats = useMemo(() => {
    const totalKey = exams.filter((e) => (e.hotLevel ?? 0) > 0).length;
    const hot5 = exams.filter((e) => (e.hotLevel ?? 0) === 5).length;
    const hot4 = exams.filter((e) => (e.hotLevel ?? 0) === 4).length;
    const hot3 = exams.filter((e) => (e.hotLevel ?? 0) === 3).length;
    const hot12 = exams.filter((e) => (e.hotLevel ?? 0) === 1 || (e.hotLevel ?? 0) === 2).length;
    const normal0 = exams.filter((e) => (e.hotLevel ?? 0) === 0).length;
    return { totalKey, hot5, hot4, hot3, hot12, normal0 };
  }, [exams]);

  // Filtered pool in Add Modal
  const filteredPoolExams = useMemo(() => {
    const q = poolSearch.trim().toLowerCase();
    return poolExams.filter((ex) => {
      const matchQ = !q || ex.title.toLowerCase().includes(q) || ex.id.toLowerCase().includes(q);
      const matchSkill = poolSkillFilter === "ALL" || ex.skill === poolSkillFilter;
      return matchQ && matchSkill;
    });
  }, [poolExams, poolSearch, poolSkillFilter]);

  return (
    <div className="space-y-6 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-white bg-slate-900 dark:bg-slate-800 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Clean 2-Row Header */}
      <AdminPageHeader
        title="Quản lý Gán nhãn Đề Tủ & Key Dự Đoán ☘️"
        infoTooltip="Gán nhãn Cỏ (☘️) cho các bộ đề trọng tâm. Học viên chỉ thấy các bộ đề có gắn Cỏ tại trang Đề Key. Có thể gán Cỏ trực tiếp từng đề hoặc chọn nhiều đề để gán hàng loạt."
        stats={[
          { icon: Sparkles, value: examStats.totalKey, label: "đề Key" },
          { icon: Flame, value: examStats.hot5, label: "5 Cỏ cực hot" },
          { icon: Tag, value: topicRules.length, label: "quy tắc chủ đề" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/key-du-doan"
              target="_blank"
              className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-heading font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Mở giao diện phòng Đề Key thực tế của học viên"
            >
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
              <span>Xem trang Học viên</span>
            </Link>

            <button
              onClick={handleSyncAllRules}
              disabled={syncingAll}
              className="px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-heading font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Quét toàn bộ đề thi trong Database và tự động gán Cỏ theo danh sách từ khóa chủ đề"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ${syncingAll ? "animate-spin" : ""}`} />
              <span>{syncingAll ? "Đang đồng bộ..." : "Đồng bộ theo từ khóa"}</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-brand-brown text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Đề Vào Key</span>
            </button>
          </div>
        }
      />

      {/* Main Mode Switcher: Exams (Default) vs Topics (Advanced) */}
      <div className="flex items-center gap-3 border-b border-border/80 pb-3">
        <button
          onClick={() => setActiveMainTab("exams")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all cursor-pointer ${
            activeMainTab === "exams"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>📋 Quản Lý Đề Thi &amp; Gán Cỏ Trực Tiếp ({exams.length} Đề)</span>
        </button>

        <button
          onClick={() => setActiveMainTab("topics")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs transition-all cursor-pointer ${
            activeMainTab === "topics"
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>🏷️ Quy Tắc Từ Khóa Tự Động ({topicRules.length} Chủ Đề)</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: INDIVIDUAL EXAMS REGISTRY (TAB MẶC ĐỊNH CHO ADMIN) */}
      {/* ======================================================== */}
      {activeMainTab === "exams" && (
        <div className="space-y-6">
          {/* Quick KPI Stat Cards (Bấm vào card để lọc ngay danh sách đề) */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            <div
              onClick={() => setHotFilter("HOT_ALL")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_ALL"
                  ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                  : "bg-card border-border/60 hover:border-primary/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-muted-foreground">Tất cả đề Key</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.totalKey}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">1☘️ đến 5☘️</div>
            </div>

            <div
              onClick={() => setHotFilter("HOT_5")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_5"
                  ? "bg-emerald-500/10 border-emerald-500 shadow-xs ring-1 ring-emerald-500/30"
                  : "bg-card border-border/60 hover:border-emerald-500/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">☘️ 5 Cỏ Siêu Hot</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.hot5}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Ưu tiên số 1</div>
            </div>

            <div
              onClick={() => setHotFilter("HOT_4")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_4"
                  ? "bg-teal-500/10 border-teal-500 shadow-xs ring-1 ring-teal-500/30"
                  : "bg-card border-border/60 hover:border-teal-500/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-teal-600 dark:text-teal-400">☘️ 4 Cỏ Hay Ra</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.hot4}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Tần suất cao</div>
            </div>

            <div
              onClick={() => setHotFilter("HOT_3")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_3"
                  ? "bg-amber-500/10 border-amber-500 shadow-xs ring-1 ring-amber-500/30"
                  : "bg-card border-border/60 hover:border-amber-500/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">☘️ 3 Cỏ Trọng Tâm</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.hot3}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Nên ôn luyện</div>
            </div>

            <div
              onClick={() => setHotFilter("HOT_2")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_2" || hotFilter === "HOT_1"
                  ? "bg-sky-500/10 border-sky-500 shadow-xs ring-1 ring-sky-500/30"
                  : "bg-card border-border/60 hover:border-sky-500/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">☘️ 1-2 Cỏ Mở Rộng</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.hot12}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Luyện thêm</div>
            </div>

            <div
              onClick={() => setHotFilter("HOT_0")}
              className={`cursor-pointer p-3.5 rounded-2xl border transition-all ${
                hotFilter === "HOT_0"
                  ? "bg-slate-500/15 border-slate-500 shadow-xs ring-1 ring-slate-500/30"
                  : "bg-card border-border/60 hover:border-slate-500/40"
              }`}
            >
              <div className="text-[11px] font-semibold text-muted-foreground">📁 Kho Đề Thường</div>
              <div className="text-xl font-black mt-1 text-foreground">{examStats.normal0}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">0 Cỏ / Chưa gán</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-card border border-border/70 shadow-xs space-y-3.5">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              {/* Skill Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                {[
                  { id: "ALL", label: "Tất cả kỹ năng" },
                  { id: "READING", label: "Reading" },
                  { id: "LISTENING", label: "Listening" },
                  { id: "WRITING", label: "Writing" },
                  { id: "SPEAKING", label: "Speaking" },
                  { id: "FULL_TEST", label: "Full Test" },
                ].map((sk) => (
                  <button
                    key={sk.id}
                    onClick={() => setSkillFilter(sk.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-heading font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      skillFilter === sk.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "bg-muted/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {sk.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm theo tên đề, mã đề hoặc chủ đề..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Hot Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-border/50 text-xs">
              <span className="text-[11px] font-bold text-muted-foreground mr-1 shrink-0">Lọc mức Cỏ:</span>
              {[
                { key: "HOT_ALL", label: "Tất cả đề Key (1–5☘️)" },
                { key: "HOT_5", label: "☘️ 5 Cỏ · Siêu Hot" },
                { key: "HOT_4", label: "☘️ 4 Cỏ · Hay ra" },
                { key: "HOT_3", label: "☘️ 3 Cỏ · Trọng tâm" },
                { key: "HOT_2", label: "☘️ 2 Cỏ" },
                { key: "HOT_1", label: "☘️ 1 Cỏ" },
                { key: "HOT_0", label: "📁 Kho đề thường (0 Cỏ)" },
                { key: "ALL", label: "Toàn bộ kho đề" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setHotFilter(tab.key)}
                  className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    hotFilter === tab.key
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exams Table Card */}
          <AdminTableCard
            header={
              <div className="p-4 border-b border-border/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Danh sách Đề thi ({exams.length} đề)</span>
                  </h3>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    · Bấm trực tiếp vào các nút [1..5☘️] để đổi số cỏ ngay lập tức (0ms phản hồi)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleToggleSelectAll}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {selectedExamIds.size === exams.length && exams.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                        <span>Bỏ chọn tất cả</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5" />
                        <span>Chọn tất cả ({exams.length})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-heading font-semibold">
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedExamIds.size === exams.length && exams.length > 0}
                        onChange={handleToggleSelectAll}
                        className="rounded accent-primary w-3.5 h-3.5 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="py-3 px-3">Tên bộ đề &amp; Ghi chú</th>
                    <th className="py-3 px-3 w-28">Kỹ năng</th>
                    <th className="py-3 px-3 w-72">Mức Cỏ (Chọn 1 click để đổi)</th>
                    <th className="py-3 px-3 w-28">Gói đề</th>
                    <th className="py-3 px-3 text-right w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        Đang tải danh sách đề thi...
                      </td>
                    </tr>
                  ) : exams.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-muted-foreground">
                        <p className="font-semibold text-sm">Không tìm thấy bộ đề nào phù hợp</p>
                        <p className="text-xs mt-1">Thử đổi bộ lọc hoặc bấm nút &ldquo;Thêm Đề Vào Key&rdquo; ở trên.</p>
                      </td>
                    </tr>
                  ) : (
                    exams.map((exam) => {
                      const isSelected = selectedExamIds.has(exam.id);
                      const currentHot = exam.hotLevel ?? 0;

                      return (
                        <tr
                          key={exam.id}
                          className={`transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary/5 hover:bg-primary/10"
                              : "hover:bg-muted/30"
                          }`}
                          onClick={(e) => handleToggleSelectRow(exam.id, e)}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleToggleSelectRow(exam.id, e as any)}
                              className="rounded accent-primary w-3.5 h-3.5 cursor-pointer"
                            />
                          </td>

                          {/* Title & Forecast Tag */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-foreground line-clamp-1">{exam.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {exam.forecastTag ? (
                                <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20">
                                  {exam.forecastTag}
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground italic">Chưa gắn ghi chú ca thi</span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(exam);
                                }}
                                className="text-[10px] text-muted-foreground hover:text-primary underline"
                              >
                                Đổi nhãn
                              </button>
                            </div>
                          </td>

                          {/* Skill */}
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-foreground border border-border">
                              {exam.skill}
                            </span>
                          </td>

                          {/* 1-Click Clover Level Buttons */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {[0, 1, 2, 3, 4, 5].map((lvl) => {
                                const isCurrent = currentHot === lvl;
                                return (
                                  <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => handleSetHotLevel(exam, lvl)}
                                    title={lvl === 0 ? "Gỡ về Đề thường (0 Cỏ)" : `Gán ${lvl} Cỏ ☘️`}
                                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                                      isCurrent
                                        ? lvl === 0
                                          ? "bg-slate-700 text-white font-black ring-1 ring-slate-800"
                                          : lvl >= 4
                                          ? "bg-emerald-600 text-white font-black shadow-xs ring-1 ring-emerald-500"
                                          : "bg-amber-600 text-white font-black shadow-xs ring-1 ring-amber-500"
                                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/40"
                                    }`}
                                  >
                                    {lvl === 0 ? "0 Cỏ" : `${lvl}☘️`}
                                  </button>
                                );
                              })}
                            </div>
                          </td>

                          {/* VIP / FREE */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={(e) => handleToggleVip(exam, e)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                                exam.isPro
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                                  : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                              }`}
                              title="Click để đổi giữa VIP PRO và Miễn phí"
                            >
                              <Crown className="w-3 h-3" />
                              <span>{exam.isPro ? "VIP PRO" : "Miễn phí"}</span>
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleOpenEdit(exam, e)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                                title="Sửa chi tiết đề"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {currentHot > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmRemoveExam(exam)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                  title="Gỡ khỏi danh mục Đề Key"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </AdminTableCard>

          {/* Floating Sticky Batch Action Bar (Xuất hiện khi chọn >= 1 đề) */}
          {selectedExamIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
              <span className="text-xs font-bold text-emerald-400">
                Đã chọn {selectedExamIds.size} đề:
              </span>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              {/* Set Clover Batch */}
              <div className="flex items-center gap-1">
                {[5, 4, 3, 2, 1, 0].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    disabled={batchLoading}
                    onClick={() => handleBatchSetHotLevel(lvl)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {lvl === 0 ? "Gỡ Cỏ" : `Gán ${lvl}☘️`}
                  </button>
                ))}
              </div>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              {/* Set VIP PRO Batch */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={batchLoading}
                  onClick={() => handleBatchToggleVip(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Crown className="w-3 h-3" />
                  <span>Bật VIP</span>
                </button>
                <button
                  type="button"
                  disabled={batchLoading}
                  onClick={() => handleBatchToggleVip(false)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Mở Free
                </button>
              </div>

              <div className="h-4 w-px bg-slate-700 hidden sm:block" />

              <button
                type="button"
                onClick={() => setSelectedExamIds(new Set())}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: TOPIC RULES & AUTO-PROPAGATION STUDIO             */}
      {/* ======================================================== */}
      {activeMainTab === "topics" && (
        <div className="space-y-6">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-foreground block mb-0.5">
                💡 Quy tắc chủ đề tự động (Topic Rules Engine):
              </span>
              Hệ thống quét tên đề thi theo từ khóa (keywords). Khi lưu hoặc đổi Cỏ cho 1 chủ đề, toàn bộ đề thi có tên chứa từ khóa sẽ được tự động đồng bộ mức Cỏ ngay lập tức.
            </div>
            <button
              onClick={handleOpenAddTopic}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Quy Tắc Mới</span>
            </button>
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-xs focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
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
                  ? "border-teal-500/30 bg-teal-500/[0.03]"
                  : rule.hotLevel === 3
                  ? "border-amber-500/30 bg-amber-500/[0.03]"
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

                      {/* Interactive Clover Picker */}
                      <div
                        className="flex items-center bg-card/80 border border-border/80 rounded-lg p-1 shrink-0 shadow-2xs"
                        title="Click để đổi nhanh số Cỏ cho chủ đề này (tự động lan tỏa)"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleTopicQuickSetHot(rule, star)}
                            className={`p-0.5 rounded text-xs transition-transform hover:scale-125 cursor-pointer ${
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
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors cursor-pointer"
                      title="Xem danh sách đề thi khớp với từ khóa của chủ đề này"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{rule.matchedCount ?? 0} đề thi khớp</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTopicQuickSetHot(rule, rule.hotLevel)}
                        className="px-2 py-1 rounded-lg text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Lan tỏa ngay đến tất cả đề thi khớp trong DB"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span>Gán ngay</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditTopic(rule)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Chỉnh sửa từ khóa & thông tin chủ đề"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setConfirmDeleteTopic(rule);
                          setResetHotOnDelete(false);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
              <p className="text-sm font-semibold text-foreground">Không tìm thấy quy tắc chủ đề phù hợp</p>
              <p className="text-xs text-muted-foreground mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bấm Thêm Quy Tắc Mới</p>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: THÊM ĐỀ TỪ KHO VÀO KEY (ĐÃ HOÀN THIỆN ĐẦY ĐỦ)    */}
      {/* ======================================================== */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-2xl border border-border shadow-2xl flex flex-col max-h-[88vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-foreground flex items-center gap-2">
                  <Plus className="w-4 h-4 text-primary" />
                  <span>Thêm Đề Từ Kho Vào Danh Mục Đề Key</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chọn một hoặc nhiều đề từ kho để gán nhãn Cỏ và đưa lên trang Đề Key cho học viên luyện tập.
                </p>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
              {/* Chọn mức Cỏ cần gán */}
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                <label className="block font-bold text-foreground">
                  1. Chọn mức độ Cỏ muốn gán cho các đề đã chọn:
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setAssignHotLevel(lvl);
                        setAssignForecastTag(
                          lvl === 5
                            ? "★★★★★ Đề tủ cực hot"
                            : lvl === 4
                            ? "★★★★ Tần suất thi cao"
                            : lvl === 3
                            ? "★★★ Trọng tâm ôn tập"
                            : "★★ Luyện tập mở rộng"
                        );
                      }}
                      className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        assignHotLevel === lvl
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 shadow-2xs ring-1 ring-emerald-500"
                          : "border-border bg-card text-muted-foreground hover:border-emerald-500/40"
                      }`}
                    >
                      <div>{"☘️".repeat(lvl)}</div>
                      <div className="text-[10px] mt-0.5">{lvl} Cỏ</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ghi chú ca thi */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  2. Nhãn dự đoán / Ghi chú ca thi:
                </label>
                <input
                  type="text"
                  value={assignForecastTag}
                  onChange={(e) => setAssignForecastTag(e.target.value)}
                  placeholder="Ví dụ: ★★★★★ Đề tủ cực hot (Ca sáng 20/10)"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              {/* Tìm kiếm & Lọc đề trong kho */}
              <div>
                <label className="block font-bold text-foreground mb-1">
                  3. Chọn đề thi từ kho ({selectedPoolExamIds.size} đã chọn):
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm theo tên đề trong kho..."
                      value={poolSearch}
                      onChange={(e) => setPoolSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <select
                    value={poolSkillFilter}
                    onChange={(e) => setPoolSkillFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-input bg-background text-xs font-semibold"
                  >
                    <option value="ALL">Tất cả kỹ năng</option>
                    <option value="READING">Reading</option>
                    <option value="LISTENING">Listening</option>
                    <option value="WRITING">Writing</option>
                    <option value="SPEAKING">Speaking</option>
                    <option value="FULL_TEST">Full Test</option>
                  </select>
                </div>

                <div className="border border-border rounded-xl max-h-60 overflow-y-auto divide-y divide-border/50">
                  {loadingPool ? (
                    <div className="py-8 text-center text-muted-foreground">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-primary" />
                      Đang tải kho đề...
                    </div>
                  ) : filteredPoolExams.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                      Không tìm thấy đề thi phù hợp
                    </div>
                  ) : (
                    filteredPoolExams.map((ex) => {
                      const isChecked = selectedPoolExamIds.has(ex.id);
                      return (
                        <div
                          key={ex.id}
                          onClick={() => {
                            setSelectedPoolExamIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(ex.id)) next.delete(ex.id);
                              else next.add(ex.id);
                              return next;
                            });
                          }}
                          className={`p-2.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer ${
                            isChecked ? "bg-primary/5" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded accent-primary w-3.5 h-3.5"
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground truncate">{ex.title}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                                <span className="font-bold text-primary">[{ex.skill}]</span>
                                <span>Hiện tại: {ex.hotLevel ? `${ex.hotLevel} ☘️` : "0 Cỏ (Đề thường)"}</span>
                              </div>
                            </div>
                          </div>

                          <span className="text-[11px] font-bold text-emerald-600 shrink-0">
                            {isChecked ? "✓ Đã chọn" : ""}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Đã chọn <strong>{selectedPoolExamIds.size}</strong> đề thi
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-input bg-background hover:bg-muted font-semibold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={assignLoading || selectedPoolExamIds.size === 0}
                  onClick={handleAssignPoolToKey}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{assignLoading ? "Đang thêm..." : `Thêm ${selectedPoolExamIds.size} Đề Vào Key`}</span>
                </button>
              </div>
            </div>
          </div>
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
                  <span>Đề thi khớp chủ đề: &ldquo;{previewRule.name}&rdquo;</span>
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
                      className={`flex-1 py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        topicFormData.hotLevel === lvl
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-2xs ring-1 ring-emerald-500"
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
                  className="px-4 py-2 rounded-xl border border-input bg-background hover:bg-muted font-semibold text-xs cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={topicSaving}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
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

      {/* Modals for Tab 1: Edit Exam Chi Tiết, Remove Exam */}
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
