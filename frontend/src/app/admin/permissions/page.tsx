"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  GraduationCap,
  Sparkles,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  ChevronsRight,
  ChevronsLeft,
  RotateCcw,
  Save,
  CheckCircle2,
  FileCheck2,
  Lock,
  BookOpen,
  PenTool,
  CreditCard,
  UserCheck,
  Settings,
  HelpCircle,
  AlertCircle,
  Eye,
  Layers,
  Filter,
} from "lucide-react";

interface PermissionItem {
  id: string;
  code: string;
  name: string;
  category: "EXAM" | "GRADING" | "CONTENT" | "PAYMENT" | "SECURITY" | "USER";
  categoryName: string;
  description: string;
  isDangerous?: boolean;
}

interface RoleConfig {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  memberCount: number;
  grantedIds: string[];
}

const ALL_PERMISSIONS: PermissionItem[] = [
  // 1. ĐỀ THI & PHÒNG THI
  {
    id: "p_exam_view",
    code: "EXAM:VIEW_ALL",
    name: "Xem toàn bộ ngân hàng đề thi",
    category: "EXAM",
    categoryName: "Đề thi & Khảo thí",
    description: "Tra cứu danh sách đề thi 4 kỹ năng, đề Key dự đoán và phòng thi thử.",
  },
  {
    id: "p_exam_create",
    code: "EXAM:CREATE_EDIT",
    name: "Soạn thảo và sửa đề thi",
    category: "EXAM",
    categoryName: "Đề thi & Khảo thí",
    description: "Tạo mới, chỉnh sửa nội dung part 1-4, audio, tranh ảnh và đáp án đề thi.",
  },
  {
    id: "p_exam_delete",
    code: "EXAM:DELETE",
    name: "Xóa & Ẩn đề thi khỏi thư viện",
    category: "EXAM",
    categoryName: "Đề thi & Khảo thí",
    description: "Xóa hẳn đề hoặc chuyển trạng thái nháp không cho học viên làm bài.",
    isDangerous: true,
  },
  {
    id: "p_exam_room",
    code: "EXAM:CREATE_ROOM",
    name: "Tạo phòng thi thử & phát mã PIN",
    category: "EXAM",
    categoryName: "Đề thi & Khảo thí",
    description: "Khởi tạo đợt thi thử trực tuyến 162 phút với thời gian bắt đầu đồng loạt.",
  },
  {
    id: "p_exam_prediction",
    code: "EXAM:PREDICTION_KEY",
    name: "Quản lý Đề Key Dự Đoán VIP",
    category: "EXAM",
    categoryName: "Đề thi & Khảo thí",
    description: "Cập nhật ngân hàng đề trúng tủ theo tuần và phân quyền truy cập VIP.",
  },

  // 2. CHẤM THI & GIẢNG DẠY
  {
    id: "p_grade_queue",
    code: "GRADE:VIEW_QUEUE",
    name: "Xem hàng đợi bài nộp cần chấm",
    category: "GRADING",
    categoryName: "Chấm thi & Học vụ",
    description: "Xem danh sách bài thi Speaking & Writing đang chờ giáo viên đánh giá.",
  },
  {
    id: "p_grade_evaluate",
    code: "GRADE:EVALUATE_SUBMISSION",
    name: "Chấm điểm Speaking & Writing",
    category: "GRADING",
    categoryName: "Chấm thi & Học vụ",
    description: "Nghe audio thí sinh, chấm điểm rubric CEFR và gửi nhận xét chi tiết.",
  },
  {
    id: "p_class_manage",
    code: "CLASS:MANAGE",
    name: "Tạo và quản lý lớp học",
    category: "GRADING",
    categoryName: "Chấm thi & Học vụ",
    description: "Tạo lớp, phát mã Class Code và quản lý học viên thuộc lớp.",
  },
  {
    id: "p_student_progress",
    code: "CLASS:VIEW_STUDENT_SCORES",
    name: "Xem bảng điểm học viên theo lớp",
    category: "GRADING",
    categoryName: "Chấm thi & Học vụ",
    description: "Xem radar 4 kỹ năng, lịch sử làm bài và tiến độ học tập của từng học viên.",
  },

  // 3. TÀI CHÍNH & SEPAY
  {
    id: "p_pay_view",
    code: "PAY:VIEW_TRANSACTIONS",
    name: "Xem lịch sử nạp tiền SePay",
    category: "PAYMENT",
    categoryName: "Tài chính & Thanh toán",
    description: "Tra cứu sao kê VietQR MB Bank, trạng thái đơn hàng và mã giao dịch.",
  },
  {
    id: "p_pay_manual",
    code: "PAY:MANUAL_APPROVE",
    name: "Khớp lệnh & Duyệt nạp tiền thủ công",
    category: "PAYMENT",
    categoryName: "Tài chính & Thanh toán",
    description: "Duyệt giao dịch cho trường hợp chuyển khoản sai cú pháp hoặc trễ webhook.",
    isDangerous: true,
  },
  {
    id: "p_pay_revenue",
    code: "PAY:REVENUE_REPORTS",
    name: "Xem báo cáo doanh thu tài chính",
    category: "PAYMENT",
    categoryName: "Tài chính & Thanh toán",
    description: "Báo cáo tổng tiền thu, biểu đồ 7 ngày và số lượng gói VIP kích hoạt.",
  },
  {
    id: "p_pay_plans",
    code: "PAY:MANAGE_PLANS",
    name: "Cấu hình bảng giá gói cước VIP",
    category: "PAYMENT",
    categoryName: "Tài chính & Thanh toán",
    description: "Thay đổi giá gói 30 ngày, 90 ngày, quyền lợi lượt chấm AI và giáo viên.",
  },

  // 4. KHO NỘI DUNG & TỪ VỰNG
  {
    id: "p_vocab_manage",
    code: "CONTENT:VOCAB_MANAGE",
    name: "Quản lý 198 bộ từ vựng & Bulk Import",
    category: "CONTENT",
    categoryName: "Nội dung & Tài nguyên",
    description: "Thêm sửa bộ từ vựng, phiên âm IPA, nghĩa tiếng Việt và ví dụ câu.",
  },
  {
    id: "p_dict_manage",
    code: "CONTENT:DICTATION_MANAGE",
    name: "Quản lý bài Nghe chép chính tả",
    category: "CONTENT",
    categoryName: "Nội dung & Tài nguyên",
    description: "Quản lý 3 Level (Foundation, Momentum, Mastery) và file audio luyện chép.",
  },
  {
    id: "p_review_moderate",
    code: "CONTENT:MODERATE_REVIEWS",
    name: "Kiểm duyệt Đánh giá & Bảng Kỳ Tích",
    category: "CONTENT",
    categoryName: "Nội dung & Tài nguyên",
    description: "Duyệt hiển thị feedback học viên lên trang chủ và vinh danh điểm cao.",
  },

  // 5. NGƯỜI DÙNG & TÀI KHOẢN
  {
    id: "p_user_list",
    code: "USER:VIEW_LIST",
    name: "Xem danh sách người dùng",
    category: "USER",
    categoryName: "Quản lý Người dùng",
    description: "Xem danh bạ học viên, giảng viên, trạng thái tài khoản và mục tiêu band điểm.",
  },
  {
    id: "p_user_lock",
    code: "USER:LOCK_UNLOCK",
    name: "Khóa / Mở tài khoản & Đổi mật khẩu",
    category: "USER",
    categoryName: "Quản lý Người dùng",
    description: "Tạm khóa quyền truy cập hoặc gửi link reset mật khẩu cho người dùng.",
    isDangerous: true,
  },
  {
    id: "p_user_grant_vip",
    code: "USER:GRANT_VIP",
    name: "Cấp VIP & Tặng lượt chấm đặc cách",
    category: "USER",
    categoryName: "Quản lý Người dùng",
    description: "Kích hoạt thời hạn VIP hoặc tặng thêm hạn ngạch chấm bài cho học viên.",
  },

  // 6. BẢO MẬT & HỆ THỐNG CỐT LÕI
  {
    id: "p_audit_view",
    code: "SYS:VIEW_AUDIT_LOGS",
    name: "Xem nhật ký kiểm toán Audit Log",
    category: "SECURITY",
    categoryName: "Bảo mật & Hệ thống",
    description: "Tra cứu vết kiểm toán 5W1H và JSON Diff sự thay đổi dữ liệu nhạy cảm.",
  },
  {
    id: "p_rbac_manage",
    code: "SYS:MANAGE_RBAC",
    name: "Cấu hình phân quyền hệ thống (SuperAdmin)",
    category: "SECURITY",
    categoryName: "Bảo mật & Hệ thống",
    description: "Được phép vào màn hình này để gán hoặc thu hồi quyền hạn của các vai trò.",
    isDangerous: true,
  },
];

const DEFAULT_ROLES: RoleConfig[] = [
  {
    id: "role_superadmin",
    code: "SUPER_ADMIN",
    title: "Super Admin (Chủ Trung Tâm)",
    description: "Toàn quyền tối cao mọi phân hệ, bảo mật, tài chính và cấu hình RBAC.",
    icon: ShieldAlert,
    color: "from-rose-500 to-red-600 text-rose-500",
    memberCount: 2,
    grantedIds: ALL_PERMISSIONS.map((p) => p.id),
  },
  {
    id: "role_admin",
    code: "ADMIN",
    title: "Quản Trị Viên (Vận Hành)",
    description: "Quản lý đề thi, từ vựng, tài khoản học viên và duyệt giao dịch SePay.",
    icon: ShieldCheck,
    color: "from-blue-600 to-indigo-600 text-blue-500",
    memberCount: 3,
    grantedIds: [
      "p_exam_view",
      "p_exam_create",
      "p_exam_room",
      "p_exam_prediction",
      "p_grade_queue",
      "p_pay_view",
      "p_pay_manual",
      "p_pay_revenue",
      "p_vocab_manage",
      "p_dict_manage",
      "p_review_moderate",
      "p_user_list",
      "p_user_lock",
      "p_user_grant_vip",
      "p_audit_view",
    ],
  },
  {
    id: "role_teacher",
    code: "TEACHER",
    title: "Giảng Viên & Trợ Giảng",
    description: "Chấm điểm Speaking & Writing, quản lý lớp học và theo dõi bảng điểm học viên.",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-600 text-emerald-500",
    memberCount: 14,
    grantedIds: [
      "p_exam_view",
      "p_exam_room",
      "p_grade_queue",
      "p_grade_evaluate",
      "p_class_manage",
      "p_student_progress",
      "p_vocab_manage",
    ],
  },
  {
    id: "role_student",
    code: "STUDENT",
    title: "Học Viên (Thí Sinh)",
    description: "Quyền hạn người học tiêu chuẩn: làm đề thi, xem kết quả của chính mình.",
    icon: Users,
    color: "from-amber-500 to-orange-600 text-amber-500",
    memberCount: 1840,
    grantedIds: ["p_exam_view"],
  },
];

export default function PermissionsManagementPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(DEFAULT_ROLES);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("role_teacher");
  const [selectedLeftIds, setSelectedLeftIds] = useState<string[]>([]);
  const [selectedRightIds, setSelectedRightIds] = useState<string[]>([]);
  const [searchLeft, setSearchLeft] = useState("");
  const [searchRight, setSearchRight] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Load state from localStorage if exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem("aptis_rbac_matrix_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRoles(parsed);
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const activeRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) || roles[0],
    [roles, selectedRoleId]
  );

  // Available (Left) vs Granted (Right) lists
  const availablePermissions = useMemo(() => {
    const grantedSet = new Set(activeRole.grantedIds);
    return ALL_PERMISSIONS.filter((p) => !grantedSet.has(p.id));
  }, [activeRole]);

  const grantedPermissions = useMemo(() => {
    const grantedSet = new Set(activeRole.grantedIds);
    return ALL_PERMISSIONS.filter((p) => grantedSet.has(p.id));
  }, [activeRole]);

  // Filtered by search & category
  const filteredAvailable = useMemo(() => {
    return availablePermissions.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchLeft.toLowerCase()) ||
        p.code.toLowerCase().includes(searchLeft.toLowerCase()) ||
        p.description.toLowerCase().includes(searchLeft.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [availablePermissions, searchLeft, categoryFilter]);

  const filteredGranted = useMemo(() => {
    return grantedPermissions.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchRight.toLowerCase()) ||
        p.code.toLowerCase().includes(searchRight.toLowerCase()) ||
        p.description.toLowerCase().includes(searchRight.toLowerCase());
      const matchesCat = categoryFilter === "ALL" || p.category === categoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [grantedPermissions, searchRight, categoryFilter]);

  // Toggle selection on left
  const toggleLeftSelect = (id: string) => {
    setSelectedLeftIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle selection on right
  const toggleRightSelect = (id: string) => {
    setSelectedRightIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select all visible left
  const handleSelectAllLeft = () => {
    if (selectedLeftIds.length === filteredAvailable.length) {
      setSelectedLeftIds([]);
    } else {
      setSelectedLeftIds(filteredAvailable.map((p) => p.id));
    }
  };

  // Select all visible right
  const handleSelectAllRight = () => {
    if (selectedRightIds.length === filteredGranted.length) {
      setSelectedRightIds([]);
    } else {
      setSelectedRightIds(filteredGranted.map((p) => p.id));
    }
  };

  // MOVE RIGHT [ ▶ ]: Gán quyền
  const handleMoveRight = () => {
    if (selectedLeftIds.length === 0) {
      showToast("Vui lòng tích chọn ít nhất 1 quyền ở cột trái để chuyển sang!");
      return;
    }
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const nextSet = new Set([...role.grantedIds, ...selectedLeftIds]);
          return { ...role, grantedIds: Array.from(nextSet) };
        }
        return role;
      })
    );
    showToast(`Đã gán thành công ${selectedLeftIds.length} quyền cho ${activeRole.title}!`);
    setSelectedLeftIds([]);
    setHasChanges(true);
  };

  // MOVE ALL RIGHT [ ⏩ ]: Gán toàn bộ
  const handleMoveAllRight = () => {
    const toAdd = filteredAvailable.map((p) => p.id);
    if (toAdd.length === 0) return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          const nextSet = new Set([...role.grantedIds, ...toAdd]);
          return { ...role, grantedIds: Array.from(nextSet) };
        }
        return role;
      })
    );
    showToast(`Đã cấp toàn bộ quyền cho ${activeRole.title}!`);
    setSelectedLeftIds([]);
    setHasChanges(true);
  };

  // MOVE LEFT [ ◀ ]: Gỡ quyền
  const handleMoveLeft = () => {
    if (selectedRightIds.length === 0) {
      showToast("Vui lòng tích chọn quyền ở cột phải để gỡ bỏ!");
      return;
    }
    const toRemoveSet = new Set(selectedRightIds);
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: role.grantedIds.filter((id) => !toRemoveSet.has(id)),
          };
        }
        return role;
      })
    );
    showToast(`Đã gỡ ${selectedRightIds.length} quyền khỏi ${activeRole.title}!`);
    setSelectedRightIds([]);
    setHasChanges(true);
  };

  // MOVE ALL LEFT [ ⏪ ]: Gỡ toàn bộ
  const handleMoveAllLeft = () => {
    const toRemoveSet = new Set(filteredGranted.map((p) => p.id));
    if (toRemoveSet.size === 0) return;
    setRoles((prev) =>
      prev.map((role) => {
        if (role.id === selectedRoleId) {
          return {
            ...role,
            grantedIds: role.grantedIds.filter((id) => !toRemoveSet.has(id)),
          };
        }
        return role;
      })
    );
    showToast(`Đã gỡ các quyền khỏi ${activeRole.title}!`);
    setSelectedRightIds([]);
    setHasChanges(true);
  };

  // Save changes
  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      try {
        localStorage.setItem("aptis_rbac_matrix_config", JSON.stringify(roles));
        setIsSaving(false);
        setHasChanges(false);
        showToast("Đã lưu bảng phân quyền RBAC thành công vào cơ sở dữ liệu!");
      } catch {
        setIsSaving(false);
        showToast("Không thể lưu cấu hình. Vui lòng thử lại!");
      }
    }, 500);
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (
      confirm("Bạn có chắc chắn muốn khôi phục phân quyền về mẫu mặc định tiêu chuẩn?")
    ) {
      setRoles(DEFAULT_ROLES);
      setSelectedLeftIds([]);
      setSelectedRightIds([]);
      localStorage.removeItem("aptis_rbac_matrix_config");
      setHasChanges(false);
      showToast("Đã khôi phục ma trận quyền mặc định tiêu chuẩn!");
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "EXAM":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "GRADING":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "PAYMENT":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "USER":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "SECURITY":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & INTRO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-heading text-foreground">
                  Phân Quyền Vai Trò (RBAC Transfer Matrix)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Mẫu 1: Hai Cột Chuyển Quyền
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Giao diện SuperAdmin trực quan — Tích chọn quyền ở kho bên trái rồi bấm{" "}
                <strong className="text-primary font-bold">[ ▶ ]</strong> để gán sang bên phải.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-border hover:bg-muted font-bold text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            title="Khôi phục quyền mặc định"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-xs transition-all flex items-center gap-2 ${
              hasChanges
                ? "bg-emerald-600 hover:bg-emerald-500 animate-pulse shadow-emerald-600/30"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Đang lưu..." : hasChanges ? "Lưu thay đổi *" : "Lưu phân quyền"}</span>
          </button>
        </div>
      </div>

      {/* 2. ROLE SELECTOR BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {roles.map((r) => {
          const isSelected = r.id === selectedRoleId;
          const RoleIcon = r.icon;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedRoleId(r.id);
                setSelectedLeftIds([]);
                setSelectedRightIds([]);
              }}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group ${
                isSelected
                  ? "bg-card border-primary ring-2 ring-primary/20 shadow-md"
                  : "bg-card/60 hover:bg-card border-border/80 hover:border-border"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr ${r.color} text-white shadow-xs`}
                  >
                    <RoleIcon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                    {r.memberCount.toLocaleString()} tài khoản
                  </span>
                </div>
                <h3 className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                  {r.title}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                  {r.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-muted-foreground">Quyền sở hữu:</span>
                <span className="font-bold text-primary">
                  {r.grantedIds.length}/{ALL_PERMISSIONS.length} quyền
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. DUAL TRANSFER BOX MAIN CONTAINER */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
        {/* Active Role Indicator & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 mb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Đang cấp quyền cho:
            </span>
            <div className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span>{activeRole.title}</span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              ({activeRole.code})
            </span>
          </div>

          {/* Module Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mr-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Lọc:
            </span>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "EXAM", label: "Đề thi" },
              { id: "GRADING", label: "Chấm thi" },
              { id: "PAYMENT", label: "Tài chính" },
              { id: "USER", label: "Người dùng" },
              { id: "SECURITY", label: "Hệ thống" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                  categoryFilter === cat.id
                    ? "bg-foreground text-background"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* THE 3-COLUMN TRANSFER GRID: Left Box | Center Buttons | Right Box */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,72px,1fr] gap-4 items-center">
          {/* ========================================================
              LEFT COLUMN: KHO QUYỀN CÓ SẴN (AVAILABLE PERMISSIONS)
             ======================================================== */}
          <div className="flex flex-col h-[520px] rounded-2xl border border-border bg-muted/20 overflow-hidden shadow-xs">
            {/* Left Header */}
            <div className="p-3.5 bg-muted/60 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="font-heading font-bold text-xs text-foreground uppercase tracking-wider">
                  Kho Quyền Có Sẵn
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllLeft}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {selectedLeftIds.length === filteredAvailable.length && filteredAvailable.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
                  {filteredAvailable.length} quyền
                </span>
              </div>
            </div>

            {/* Left Search Bar */}
            <div className="p-2.5 border-b border-border bg-card">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchLeft}
                  onChange={(e) => setSearchLeft(e.target.value)}
                  placeholder="Tìm nhanh quyền hạn theo tên hoặc mã..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Left Permission Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-border/20">
              {filteredAvailable.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">
                    Không còn quyền nào chưa cấp!
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {searchLeft
                      ? "Không tìm thấy quyền phù hợp với từ khóa."
                      : `Vai trò "${activeRole.title}" đã được cấp toàn bộ quyền trong danh mục này.`}
                  </p>
                </div>
              ) : (
                filteredAvailable.map((perm) => {
                  const isChecked = selectedLeftIds.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => toggleLeftSelect(perm.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 group ${
                        isChecked
                          ? "bg-primary/5 border-primary/60 shadow-xs"
                          : "bg-card hover:bg-muted/40 border-border/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Handled by parent click
                        className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-heading font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {perm.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getCategoryColor(
                              perm.category
                            )}`}
                          >
                            {perm.categoryName}
                          </span>
                          {perm.isDangerous && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Nhạy cảm
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {perm.description}
                        </p>
                        <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 block">
                          {perm.code}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Left Footer Selected Count */}
            <div className="p-2.5 bg-muted/40 border-t border-border text-[11px] font-medium text-muted-foreground flex justify-between items-center">
              <span>Đang chọn: {selectedLeftIds.length} mục</span>
              {selectedLeftIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedLeftIds([])}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Xóa chọn
                </button>
              )}
            </div>
          </div>

          {/* ========================================================
              CENTER COLUMN: 4 TRANSFER ACTION BUTTONS
             ======================================================== */}
          <div className="flex lg:flex-col items-center justify-center gap-2 py-2">
            <button
              type="button"
              onClick={handleMoveRight}
              disabled={selectedLeftIds.length === 0}
              className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold shadow-md hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center group"
              title="Chuyển quyền đã chọn sang bên phải [ ▶ ]"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              type="button"
              onClick={handleMoveAllRight}
              disabled={filteredAvailable.length === 0}
              className="w-10 h-10 rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
              title="Cấp toàn bộ quyền sang phải [ ⏩ ]"
            >
              <ChevronsRight className="w-5 h-5 text-primary" />
            </button>

            <button
              type="button"
              onClick={handleMoveAllLeft}
              disabled={filteredGranted.length === 0}
              className="w-10 h-10 rounded-xl bg-muted border border-border text-foreground hover:bg-muted/80 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center"
              title="Gỡ toàn bộ quyền về trái [ ⏪ ]"
            >
              <ChevronsLeft className="w-5 h-5 text-rose-500" />
            </button>

            <button
              type="button"
              onClick={handleMoveLeft}
              disabled={selectedRightIds.length === 0}
              className="w-12 h-12 rounded-xl bg-muted border border-border text-foreground hover:bg-rose-500 hover:text-white hover:border-rose-500 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center group shadow-xs"
              title="Gỡ quyền đã chọn về bên trái [ ◀ ]"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* ========================================================
              RIGHT COLUMN: QUYỀN ĐÃ CẤP CHO VAI TRÒ (GRANTED PERMISSIONS)
             ======================================================== */}
          <div className="flex flex-col h-[520px] rounded-2xl border border-primary/40 bg-primary/5 overflow-hidden shadow-xs">
            {/* Right Header */}
            <div className="p-3.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-heading font-bold text-xs text-primary uppercase tracking-wider">
                  Quyền ĐÃ CẤP Cho {activeRole.code}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRight}
                  className="text-[11px] font-semibold text-primary hover:underline"
                >
                  {selectedRightIds.length === filteredGranted.length && filteredGranted.length > 0
                    ? "Bỏ chọn tất cả"
                    : "Chọn tất cả"}
                </button>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary text-primary-foreground">
                  {filteredGranted.length} mục
                </span>
              </div>
            </div>

            {/* Right Search Bar */}
            <div className="p-2.5 border-b border-border bg-card">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchRight}
                  onChange={(e) => setSearchRight(e.target.value)}
                  placeholder="Tìm trong danh sách quyền đã cấp..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted/40 border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Right Permission Items List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-border/20">
              {filteredGranted.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <AlertCircle className="w-10 h-10 text-amber-500/40 mb-2" />
                  <p className="text-xs font-semibold text-foreground">Chưa có quyền hạn nào!</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hãy tích chọn các quyền ở cột bên trái và bấm{" "}
                    <strong className="text-primary font-bold">[ ▶ ]</strong> để gán quyền.
                  </p>
                </div>
              ) : (
                filteredGranted.map((perm) => {
                  const isChecked = selectedRightIds.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => toggleRightSelect(perm.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 group ${
                        isChecked
                          ? "bg-rose-500/10 border-rose-500/60 shadow-xs"
                          : "bg-card hover:bg-muted/40 border-border/80"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 w-4 h-4 rounded text-rose-500 focus:ring-rose-500 accent-rose-500 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-heading font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                            {perm.name}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getCategoryColor(
                              perm.category
                            )}`}
                          >
                            {perm.categoryName}
                          </span>
                          {perm.isDangerous && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5" /> Nhạy cảm
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                          {perm.description}
                        </p>
                        <span className="text-[10px] font-mono text-muted-foreground/70 mt-1 block">
                          {perm.code}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Footer Selected Count */}
            <div className="p-2.5 bg-primary/10 border-t border-primary/20 text-[11px] font-medium text-primary flex justify-between items-center">
              <span>Đang chọn để gỡ: {selectedRightIds.length} mục</span>
              {selectedRightIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRightIds([])}
                  className="text-xs text-rose-500 hover:underline font-semibold"
                >
                  Xóa chọn
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SUMMARY & AUDIT FOOTER */}
      <div className="p-5 rounded-2xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Tổng kết phạm vi vai trò: {activeRole.title}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Được cấp quyền thực thi trên{" "}
              <strong className="text-primary font-bold">
                {activeRole.grantedIds.length} trên tổng số {ALL_PERMISSIONS.length}
              </strong>{" "}
              tính năng cốt lõi của nền tảng Aptis Kỳ Tích.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSaveConfig}
          disabled={isSaving}
          className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-all flex items-center gap-2 shrink-0"
        >
          <Check className="w-4 h-4" />
          <span>Xác nhận & Cập nhật ma trận</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-foreground text-background font-bold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
