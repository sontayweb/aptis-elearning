"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { api } from "@/lib/api-client";
import {
  ShieldCheck,
  Search,
  RotateCcw,
  Save,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  X,
  AlertCircle,
  CheckSquare,
  Square,
  Crown,
} from "lucide-react";

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  category: "EXAM" | "GRADING" | "PAYMENT" | "CONTENT" | "USER" | "SECURITY";
  description: string;
  isDangerous?: boolean;
}

interface RoleConfig {
  id: string;
  code: "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT";
  title: string;
  subtitle: string;
  description: string;
  memberCount: number;
  grantedIds: string[];
}

const CATEGORY_NAMES: Record<PermissionItem["category"], string> = {
  EXAM: "Đề thi",
  GRADING: "Chấm thi",
  PAYMENT: "Tài chính",
  CONTENT: "Học liệu",
  USER: "Tài khoản",
  SECURITY: "Bảo mật",
};

const ALL_PERMISSIONS: PermissionItem[] = [
  // 1. Đề thi & Khảo thí
  {
    id: "p_exam_view",
    code: "EXAM:VIEW_ALL",
    name: "Tra cứu thư viện đề thi",
    category: "EXAM",
    description: "Xem danh sách đề 4 kỹ năng, đề Key dự đoán và phòng thi thử.",
  },
  {
    id: "p_exam_create",
    code: "EXAM:CREATE_EDIT",
    name: "Soạn thảo và chỉnh sửa đề thi",
    category: "EXAM",
    description: "Tạo mới, chỉnh sửa nội dung part 1-4, audio, tranh ảnh và đáp án.",
  },
  {
    id: "p_exam_delete",
    code: "EXAM:DELETE",
    name: "Xóa & Ẩn đề thi khỏi thư viện",
    category: "EXAM",
    description: "Xóa hẳn đề hoặc chuyển trạng thái nháp không cho học viên làm bài.",
    isDangerous: true,
  },
  {
    id: "p_exam_room",
    code: "EXAM:CREATE_ROOM",
    name: "Tổ chức phòng thi trực tuyến",
    category: "EXAM",
    description: "Khởi tạo đợt thi thử 162 phút với thời gian bắt đầu đồng loạt và phát PIN.",
  },
  {
    id: "p_exam_prediction",
    code: "EXAM:PREDICTION_KEY",
    name: "Quản lý Đề Key dự đoán VIP",
    category: "EXAM",
    description: "Cập nhật ngân hàng đề trúng tủ theo tuần và phân quyền truy cập học viên VIP.",
  },

  // 2. Chấm thi & Học vụ
  {
    id: "p_grade_queue",
    code: "GRADE:VIEW_QUEUE",
    name: "Xem hàng đợi bài nộp cần chấm",
    category: "GRADING",
    description: "Xem danh sách bài Speaking & Writing học viên nộp đang chờ đánh giá.",
  },
  {
    id: "p_grade_evaluate",
    code: "GRADE:EVALUATE_SUBMISSION",
    name: "Chấm điểm Speaking & Writing",
    category: "GRADING",
    description: "Nghe audio thí sinh, chấm điểm rubric CEFR và gửi nhận xét chi tiết.",
  },
  {
    id: "p_class_manage",
    code: "CLASS:MANAGE",
    name: "Tạo và quản lý lớp học",
    category: "GRADING",
    description: "Tạo lớp, phát mã Class Code và theo dõi sĩ số học viên trong lớp.",
  },
  {
    id: "p_student_progress",
    code: "CLASS:VIEW_STUDENT_SCORES",
    name: "Xem bảng điểm và radar năng lực",
    category: "GRADING",
    description: "Xem radar 4 kỹ năng, lịch sử làm bài và tiến độ học tập của từng học viên.",
  },

  // 3. Tài chính & Thanh toán
  {
    id: "p_pay_view",
    code: "PAY:VIEW_TRANSACTIONS",
    name: "Xem lịch sử nạp tiền SePay",
    category: "PAYMENT",
    description: "Tra cứu sao kê VietQR MB Bank, trạng thái đơn hàng và mã giao dịch.",
  },
  {
    id: "p_pay_manual",
    code: "PAY:MANUAL_APPROVE",
    name: "Khớp lệnh & Duyệt nạp tiền thủ công",
    category: "PAYMENT",
    description: "Duyệt giao dịch cho trường hợp chuyển khoản sai cú pháp hoặc trễ webhook.",
    isDangerous: true,
  },
  {
    id: "p_pay_revenue",
    code: "PAY:REVENUE_REPORTS",
    name: "Xem báo cáo doanh thu tài chính",
    category: "PAYMENT",
    description: "Báo cáo tổng tiền thu, biểu đồ 7 ngày và số lượng gói VIP kích hoạt.",
  },
  {
    id: "p_pay_plans",
    code: "PAY:MANAGE_PLANS",
    name: "Cấu hình bảng giá gói cước VIP",
    category: "PAYMENT",
    description: "Thay đổi giá gói 30 ngày, 90 ngày, quyền lợi lượt chấm AI và giáo viên.",
  },

  // 4. Nội dung & Tài nguyên
  {
    id: "p_vocab_manage",
    code: "CONTENT:VOCAB_MANAGE",
    name: "Quản lý 198 bộ từ vựng & Bulk Import",
    category: "CONTENT",
    description: "Thêm sửa bộ từ vựng, phiên âm IPA, nghĩa tiếng Việt và ví dụ câu.",
  },
  {
    id: "p_dict_manage",
    code: "CONTENT:DICTATION_MANAGE",
    name: "Quản lý bài nghe chép chính tả",
    category: "CONTENT",
    description: "Biên tập đoạn audio cắt nhỏ theo mốc thời gian và đáp án chuẩn transcript.",
  },
  {
    id: "p_hall_of_fame",
    code: "CONTENT:HALL_OF_FAME",
    name: "Quản lý Bảng Vàng vinh danh",
    category: "CONTENT",
    description: "Duyệt học viên đạt điểm cao B1/B2/C hiển thị trang chủ vinh danh.",
  },
  {
    id: "p_blog_tips",
    code: "CONTENT:BLOG_TIPS",
    name: "Đăng bài viết chia sẻ kinh nghiệm Aptis",
    category: "CONTENT",
    description: "Soạn thảo bài viết mẹo làm bài, đề thi mẫu và cẩm nang phòng thi.",
  },

  // 5. Quản trị người dùng
  {
    id: "p_user_view",
    code: "USER:VIEW_LIST",
    name: "Tra cứu danh sách học viên & tài khoản",
    category: "USER",
    description: "Tìm kiếm học viên theo SĐT, Email, lọc vai trò và xem lịch sử thi.",
  },
  {
    id: "p_user_lock",
    code: "USER:LOCK_UNLOCK_GRANT_VIP",
    name: "Khóa/Mở tài khoản & Cấp VIP đặc cách",
    category: "USER",
    description: "Khóa tài khoản vi phạm, mở khóa học vụ hoặc cộng thêm ngày VIP.",
    isDangerous: true,
  },

  // 6. Bảo mật & Quản trị cao cấp
  {
    id: "p_audit_log",
    code: "SECURITY:AUDIT_LOG",
    name: "Xem nhật ký hệ thống (Audit Log)",
    category: "SECURITY",
    description: "Theo dõi lịch sử đăng nhập, thay đổi đề thi và giao dịch tiền bạc.",
  },
  {
    id: "p_rbac_manage",
    code: "SECURITY:MANAGE_PERMISSIONS",
    name: "Quản trị ma trận phân quyền RBAC",
    category: "SECURITY",
    description: "Điều chỉnh quyền hạn chi tiết và gán vai trò nhân sự trong trung tâm.",
    isDangerous: true,
  },
];

const DEFAULT_ROLES: RoleConfig[] = [
  {
    id: "role_teacher",
    code: "TEACHER",
    title: "Giảng Viên",
    subtitle: "Học vụ & Chấm thi",
    description: "Chấm Speaking & Writing, mở lớp học và theo dõi bảng điểm học viên.",
    memberCount: 0,
    grantedIds: [
      "p_exam_view",
      "p_exam_room",
      "p_grade_queue",
      "p_grade_evaluate",
      "p_class_manage",
      "p_student_progress",
      "p_vocab_manage",
      "p_blog_tips",
    ],
  },
  {
    id: "role_student",
    code: "STUDENT",
    title: "Học Viên",
    subtitle: "Luyện thi",
    description: "Làm bài luyện tập 4 kỹ năng, thi thử phòng thi và xem kết quả cá nhân.",
    memberCount: 0,
    grantedIds: ["p_exam_view"],
  },
  {
    id: "role_admin",
    code: "ADMIN",
    title: "Quản Trị Viên",
    subtitle: "Vận hành & Học vụ",
    description: "Quản lý ngân hàng đề, từ vựng, tài khoản học viên và đối soát SePay.",
    memberCount: 0,
    grantedIds: [
      "p_exam_view",
      "p_exam_create",
      "p_exam_delete",
      "p_exam_room",
      "p_exam_prediction",
      "p_grade_queue",
      "p_grade_evaluate",
      "p_class_manage",
      "p_student_progress",
      "p_pay_view",
      "p_pay_manual",
      "p_pay_revenue",
      "p_pay_plans",
      "p_vocab_manage",
      "p_dict_manage",
      "p_hall_of_fame",
      "p_blog_tips",
      "p_user_view",
      "p_user_lock",
      "p_audit_log",
    ],
  },
  {
    id: "role_super_admin",
    code: "SUPER_ADMIN",
    title: "Chủ Trung Tâm",
    subtitle: "Super Admin",
    description: "Thẩm quyền tuyệt đối trên mọi phân hệ, bảo mật, tài chính và cấu hình RBAC.",
    memberCount: 1,
    grantedIds: ALL_PERMISSIONS.map((p) => p.id),
  },
];

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("role_teacher");
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search & Filter state
  const [leftSearch, setLeftSearch] = useState("");
  const [rightSearch, setRightSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  // Selection states for transfer box
  const [selectedLeftIds, setSelectedLeftIds] = useState<string[]>([]);
  const [selectedRightIds, setSelectedRightIds] = useState<string[]>([]);

  // Load configuration and dynamic user count
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("aptis_rbac_matrix_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoles((prev) =>
            prev.map((role) => {
              const matched = parsed.find((p: { id: string }) => p.id === role.id);
              return matched ? { ...role, grantedIds: matched.grantedIds } : role;
            })
          );
        }
      }
    } catch (err) {
      console.error("Lỗi đọc cấu hình phân quyền từ localStorage:", err);
    }

    async function syncMemberCounts() {
      try {
        const [kpiRes, teacherRes, adminRes] = await Promise.allSettled([
          api.admin.getDashboardKPIs(),
          api.admin.getUsers({ role: "TEACHER", limit: 1 }),
          api.admin.getUsers({ role: "ADMIN", limit: 1 }),
        ]);

        let totalUsers = 0;
        let teacherCount = 0;
        let adminCount = 0;

        if (kpiRes.status === "fulfilled" && kpiRes.value.success && kpiRes.value.data) {
          totalUsers = kpiRes.value.data.totalUsers || 0;
        }

        if (teacherRes.status === "fulfilled" && teacherRes.value.success) {
          teacherCount = (teacherRes.value as { meta?: { total?: number } }).meta?.total || 0;
        }

        if (adminRes.status === "fulfilled" && adminRes.value.success) {
          adminCount = (adminRes.value as { meta?: { total?: number } }).meta?.total || 0;
        }

        const studentCount = Math.max(0, totalUsers - teacherCount - adminCount);

        setRoles((prev) =>
          prev.map((r) => {
            if (r.code === "TEACHER") return { ...r, memberCount: teacherCount };
            if (r.code === "STUDENT") return { ...r, memberCount: studentCount };
            if (r.code === "ADMIN") return { ...r, memberCount: adminCount };
            if (r.code === "SUPER_ADMIN") return { ...r, memberCount: 1 };
            return r;
          })
        );
      } catch (err) {
        console.warn("Dùng role count mặc định:", err);
      }
    }

    syncMemberCounts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  const isSuperAdmin = activeRole.code === "SUPER_ADMIN";

  // Available permissions for left list
  const availablePermissions = useMemo(() => {
    return ALL_PERMISSIONS.filter((p) => !activeRole.grantedIds.includes(p.id));
  }, [activeRole.grantedIds]);

  // Granted permissions for right list
  const grantedPermissions = useMemo(() => {
    return ALL_PERMISSIONS.filter((p) => activeRole.grantedIds.includes(p.id));
  }, [activeRole.grantedIds]);

  // Filtered Left list
  const filteredLeft = useMemo(() => {
    return availablePermissions.filter((p) => {
      const matchCat = activeCategory === "ALL" || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(leftSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(leftSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(leftSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [availablePermissions, activeCategory, leftSearch]);

  // Filtered Right list
  const filteredRight = useMemo(() => {
    return grantedPermissions.filter((p) => {
      const matchCat = activeCategory === "ALL" || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(rightSearch.toLowerCase()) ||
        p.code.toLowerCase().includes(rightSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(rightSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [grantedPermissions, activeCategory, rightSearch]);

  // Clear selections when role changes
  useEffect(() => {
    setSelectedLeftIds([]);
    setSelectedRightIds([]);
  }, [selectedRoleId]);

  const toggleSelectLeft = (id: string) => {
    setSelectedLeftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectRight = (id: string) => {
    setSelectedRightIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllLeft = () => {
    if (selectedLeftIds.length === filteredLeft.length) {
      setSelectedLeftIds([]);
    } else {
      setSelectedLeftIds(filteredLeft.map((p) => p.id));
    }
  };

  const handleSelectAllRight = () => {
    if (selectedRightIds.length === filteredRight.length) {
      setSelectedRightIds([]);
    } else {
      setSelectedRightIds(filteredRight.map((p) => p.id));
    }
  };

  // Move selected to RIGHT
  const handleMoveRight = () => {
    if (isSuperAdmin) {
      showToast("Chủ Trung Tâm luôn giữ toàn bộ thẩm quyền.");
      return;
    }
    if (selectedLeftIds.length === 0) {
      showToast("Vui lòng tích chọn ít nhất 1 quyền ở cột trái để chuyển sang!");
      return;
    }

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: Array.from(new Set([...role.grantedIds, ...selectedLeftIds])),
          };
        }
        return role;
      })
    );

    showToast(`Đã cấp thêm ${selectedLeftIds.length} quyền cho ${activeRole.title}!`);
    setSelectedLeftIds([]);
    setHasChanges(true);
  };

  // Move selected to LEFT
  const handleMoveLeft = () => {
    if (isSuperAdmin) {
      showToast("Chủ Trung Tâm luôn giữ toàn bộ thẩm quyền.");
      return;
    }
    if (selectedRightIds.length === 0) {
      showToast("Vui lòng tích chọn ít nhất 1 quyền ở cột phải để gỡ bỏ!");
      return;
    }

    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: role.grantedIds.filter((id) => !selectedRightIds.includes(id)),
          };
        }
        return role;
      })
    );

    showToast(`Đã gỡ ${selectedRightIds.length} quyền khỏi ${activeRole.title}!`);
    setSelectedRightIds([]);
    setHasChanges(true);
  };

  // Move ALL visible to RIGHT
  const handleMoveAllRight = () => {
    if (isSuperAdmin) return;
    if (filteredLeft.length === 0) return;

    const idsToAdd = filteredLeft.map((p) => p.id);
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: Array.from(new Set([...role.grantedIds, ...idsToAdd])),
          };
        }
        return role;
      })
    );

    showToast(`Đã cấp toàn bộ ${idsToAdd.length} quyền cho ${activeRole.title}!`);
    setSelectedLeftIds([]);
    setHasChanges(true);
  };

  // Move ALL visible to LEFT
  const handleMoveAllLeft = () => {
    if (isSuperAdmin) return;
    if (filteredRight.length === 0) return;

    const idsToRemove = filteredRight.map((p) => p.id);
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: role.grantedIds.filter((id) => !idsToRemove.includes(id)),
          };
        }
        return role;
      })
    );

    showToast(`Đã gỡ toàn bộ ${idsToRemove.length} quyền khỏi ${activeRole.title}!`);
    setSelectedRightIds([]);
    setHasChanges(true);
  };

  // Double click transfer
  const handleDoubleClickLeft = (id: string) => {
    if (isSuperAdmin) return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: [...role.grantedIds, id],
          };
        }
        return role;
      })
    );
    setSelectedLeftIds((prev) => prev.filter((item) => item !== id));
    setHasChanges(true);
  };

  const handleDoubleClickRight = (id: string) => {
    if (isSuperAdmin) return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: role.grantedIds.filter((item) => item !== id),
          };
        }
        return role;
      })
    );
    setSelectedRightIds((prev) => prev.filter((item) => item !== id));
    setHasChanges(true);
  };

  // Save changes
  const handleSaveConfig = useCallback(() => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem("aptis_rbac_matrix_config", JSON.stringify(roles));
        setIsSaving(false);
        setHasChanges(false);
        showToast("✓ Đã lưu cấu hình phân quyền vai trò thành công!");
      } catch {
        setIsSaving(false);
        showToast("Không thể lưu phân quyền. Vui lòng thử lại!");
      }
    }, 250);
  }, [roles]);

  // Ctrl + S shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSaveConfig();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSaveConfig]);

  // Reset to default
  const handleResetDefaults = () => {
    if (confirm("Khôi phục phân quyền của tất cả vai trò về trạng thái tiêu chuẩn ban đầu?")) {
      setRoles(DEFAULT_ROLES);
      localStorage.removeItem("aptis_rbac_matrix_config");
      setHasChanges(false);
      setSelectedLeftIds([]);
      setSelectedRightIds([]);
      showToast("Đã khôi phục phân quyền tiêu chuẩn ban đầu.");
    }
  };

  const grantedCount = activeRole.grantedIds.length;

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-heading font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. TOP HEADER (Đồng bộ chuẩn 100% với các trang Quản trị học viên / Đề thi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-semibold mb-1.5">
            <ShieldCheck className="w-3 h-3 text-slate-600" />
            <span>Role-Based Access Control Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
            Phân Quyền Vai Trò
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Chọn nhóm chức vụ và chuyển quyền giữa hai cột: Kho quyền khả dụng ➔ Thẩm quyền đã cấp
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-heading font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Đặt lại về phân quyền tiêu chuẩn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khôi phục chuẩn</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="tech-btn px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Đang lưu..." : "Lưu thay đổi"}</span>
          </button>
        </div>
      </div>

      {/* 2. TOOLBAR CHỌN VAI TRÒ & CHUYÊN MỤC (Thanh ngang gọn gàng, giống hệt trang admin/users) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto w-full md:w-auto">
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            const rCount = r.grantedIds.length;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoleId(r.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-heading font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{r.title}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isSelected
                      ? "bg-slate-100 text-slate-700 font-bold"
                      : "bg-slate-200/60 text-slate-500"
                  }`}
                >
                  {rCount}/{ALL_PERMISSIONS.length}
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({r.memberCount.toLocaleString()} user)
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-xs font-heading font-semibold text-slate-400 whitespace-nowrap hidden sm:inline">
            Lọc chuyên mục:
          </span>
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-heading font-medium text-slate-700 focus:outline-none focus:bg-white cursor-pointer"
          >
            <option value="ALL">Tất cả chuyên mục ({ALL_PERMISSIONS.length})</option>
            <option value="EXAM">Đề Thi & Khảo Thí (5)</option>
            <option value="GRADING">Chấm Thi & Lớp Học (4)</option>
            <option value="PAYMENT">Tài Chính SePay (4)</option>
            <option value="CONTENT">Học Liệu & Từ Vựng (4)</option>
            <option value="USER">Người Dùng & VIP (2)</option>
            <option value="SECURITY">Bảo Mật Hệ Thống (2)</option>
          </select>
        </div>
      </div>

      {/* 3. MẪU 1: HAI CỘT CHUYỂN QUYỀN SANG BÊN (DUAL TRANSFER BOX) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_64px_1fr] gap-3 items-center">
        {/* === CỘT TRÁI: KHO QUYỀN CÓ SẴN (CHƯA CẤP) === */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col h-[520px]">
          {/* Header Cột Trái */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm text-slate-800">
                Kho quyền có sẵn (Chưa cấp)
              </span>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                {filteredLeft.length} mục
              </span>
            </div>

            <button
              type="button"
              onClick={handleSelectAllLeft}
              disabled={filteredLeft.length === 0 || isSuperAdmin}
              className="text-xs font-heading font-semibold text-primary hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedLeftIds.length === filteredLeft.length && filteredLeft.length > 0
                ? "Bỏ chọn"
                : "Chọn tất cả"}
            </button>
          </div>

          {/* Search Box Cột Trái */}
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={leftSearch}
                onChange={(e) => setLeftSearch(e.target.value)}
                placeholder="Tìm nhanh quyền chưa cấp..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
              {leftSearch && (
                <button
                  type="button"
                  onClick={() => setLeftSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Cột Trái */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {isSuperAdmin ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <Crown className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
                <p className="text-xs font-heading font-bold text-slate-700">
                  Chủ Trung Tâm giữ 100% toàn quyền
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Không còn quyền nào chưa cấp cho vai trò này.
                </p>
              </div>
            ) : filteredLeft.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mb-2" />
                <p className="text-xs font-heading font-semibold text-slate-600">
                  {leftSearch ? "Không tìm thấy quyền phù hợp" : "Đã cấp toàn bộ quyền trong danh mục này"}
                </p>
              </div>
            ) : (
              filteredLeft.map((p) => {
                const isSelected = selectedLeftIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => toggleSelectLeft(p.id)}
                    onDoubleClick={() => handleDoubleClickLeft(p.id)}
                    className={`px-3 py-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-200 text-blue-900 shadow-2xs font-semibold"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/60 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 text-slate-400">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-heading font-bold text-slate-800 truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {CATEGORY_NAMES[p.category]}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {p.isDangerous && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                        Nhạy cảm
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Cột Trái */}
          <div className="px-3.5 py-2 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Đã chọn: <strong className="text-slate-800 font-mono">{selectedLeftIds.length}</strong></span>
            <span className="text-slate-400">Nhấp đúp để chuyển nhanh</span>
          </div>
        </div>

        {/* === NÚT CHUYỂN Ở GIỮA === */}
        <div className="flex flex-row lg:flex-col items-center justify-center gap-2 py-1">
          {/* Cấp quyền đã chọn (▶) */}
          <button
            type="button"
            onClick={handleMoveRight}
            disabled={selectedLeftIds.length === 0 || isSuperAdmin}
            title="Cấp quyền đã chọn sang bên phải"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-primary hover:text-white hover:border-primary disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:hover:border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed group"
          >
            <ChevronRight className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Gỡ quyền đã chọn (◀) */}
          <button
            type="button"
            onClick={handleMoveLeft}
            disabled={selectedRightIds.length === 0 || isSuperAdmin}
            title="Gỡ quyền đã chọn trả về bên trái"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 disabled:hover:border-slate-200 text-slate-700 shadow-2xs transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>

          {/* Cấp tất cả (⏩) */}
          <button
            type="button"
            onClick={handleMoveAllRight}
            disabled={filteredLeft.length === 0 || isSuperAdmin}
            title="Cấp toàn bộ quyền hiển thị"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-primary/10 hover:text-primary hover:border-primary/40 disabled:opacity-20 text-slate-500 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Gỡ tất cả (⏪) */}
          <button
            type="button"
            onClick={handleMoveAllLeft}
            disabled={filteredRight.length === 0 || isSuperAdmin}
            title="Gỡ toàn bộ quyền hiển thị"
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 disabled:opacity-20 text-slate-500 transition-all flex items-center justify-center cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        </div>

        {/* === CỘT PHẢI: QUYỀN ĐÃ CẤP CHO VAI TRÒ NÀY === */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col h-[520px]">
          {/* Header Cột Phải */}
          <div className="px-4 py-3 bg-emerald-50/70 border-b border-emerald-100/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-xs sm:text-sm text-emerald-950">
                Thẩm quyền ĐÃ CẤP ({activeRole.title})
              </span>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {filteredRight.length} mục
              </span>
            </div>

            <button
              type="button"
              onClick={handleSelectAllRight}
              disabled={filteredRight.length === 0 || isSuperAdmin}
              className="text-xs font-heading font-semibold text-emerald-700 hover:underline cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedRightIds.length === filteredRight.length && filteredRight.length > 0
                ? "Bỏ chọn"
                : "Chọn tất cả"}
            </button>
          </div>

          {/* Search Box Cột Phải */}
          <div className="p-2 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={rightSearch}
                onChange={(e) => setRightSearch(e.target.value)}
                placeholder="Tìm nhanh quyền đã cấp..."
                className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
              />
              {rightSearch && (
                <button
                  type="button"
                  onClick={() => setRightSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Cột Phải */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredRight.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <AlertCircle className="w-7 h-7 text-amber-400 mb-2" />
                <p className="text-xs font-heading font-semibold text-slate-600">
                  {rightSearch ? "Không tìm thấy quyền phù hợp" : "Chưa có quyền nào được cấp"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Chọn quyền ở cột trái và bấm nút [ ▶ ] để gán vào vai trò này.
                </p>
              </div>
            ) : (
              filteredRight.map((p) => {
                const isSelected = selectedRightIds.includes(p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => !isSuperAdmin && toggleSelectRight(p.id)}
                    onDoubleClick={() => !isSuperAdmin && handleDoubleClickRight(p.id)}
                    className={`px-3 py-2 rounded-xl border transition-all flex items-center justify-between gap-3 select-none ${
                      isSuperAdmin
                        ? "bg-slate-50/70 border-slate-200/60 text-slate-700 cursor-not-allowed"
                        : isSelected
                        ? "bg-rose-50/80 border-rose-200 text-rose-900 shadow-2xs font-semibold cursor-pointer"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/60 text-slate-700 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="shrink-0 text-slate-400">
                        {isSuperAdmin ? (
                          <Lock className="w-4 h-4 text-rose-500" />
                        ) : isSelected ? (
                          <CheckSquare className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-heading font-bold text-slate-800 truncate">
                            {p.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            {CATEGORY_NAMES[p.category]}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                          {p.description}
                        </p>
                      </div>
                    </div>

                    {p.isDangerous && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
                        Nhạy cảm
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Cột Phải */}
          <div className="px-3.5 py-2 bg-emerald-50/40 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Đã chọn: <strong className="text-slate-800 font-mono">{selectedRightIds.length}</strong></span>
            {selectedRightIds.length > 0 && !isSuperAdmin && (
              <span className="text-rose-600 font-semibold">Sẵn sàng gỡ ◀</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. FLOATING SAVE BAR (Hiện khi có thay đổi chưa lưu) */}
      {hasChanges && (
        <div className="fixed bottom-6 inset-x-4 max-w-xl mx-auto z-50 p-3.5 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-200 border border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-heading font-bold text-white">Có thay đổi phân quyền chưa lưu</p>
              <p className="text-[11px] text-slate-300">Nhấn Ctrl+S hoặc Lưu thay đổi để cập nhật</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-heading font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="tech-btn px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Đang lưu..." : "Lưu ngay"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
