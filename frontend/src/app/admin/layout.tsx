"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  BookMarked,
  MessageSquare,
  FileText,
  ShieldCheck,
  LogOut,
  ArrowLeft,
  Menu,
  X,
  AlertTriangle,
  LogIn,
  Crown,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sparkles,
  HelpCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  Zap,
  Sun,
  Moon,
} from "lucide-react";
import { useEventTheme } from "@/contexts/event-theme-context";
import AdminTutorialModal from "@/components/admin/admin-tutorial-modal";
import CommandPalette from "@/components/admin/command-palette";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, quickLogin, logout } = useAuth();
  const { currentTheme, setTheme } = useEventTheme();

  // Sidebar states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Modals
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Pending transactions for real-time badge
  const [pendingTxCount, setPendingTxCount] = useState(0);

  // Restore collapsed state and tutorial from localStorage
  useEffect(() => {
    setHasMounted(true);
    const saved = localStorage.getItem("admin_sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }

    // Note: Tutorial can be launched on demand via the "Hướng dẫn" button in the header or dashboard
  }, []);

  // Poll pending transaction count periodically
  useEffect(() => {
    if (isAuthenticated && user?.role === "ADMIN") {
      api.admin
        .getDashboardKPIs()
        .then((res: any) => {
          if (res.success && res.data) {
            setPendingTxCount(res.data.pendingTransactionsCount || 0);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user]);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sidebar_collapsed", next ? "true" : "false");
      return next;
    });
  };

  const navGroups: NavGroup[] = [
    {
      group: "TỔNG QUAN",
      items: [
        {
          title: "Bảng điều khiển",
          href: "/admin",
          icon: LayoutDashboard,
          badge: null,
        },
      ],
    },
    {
      group: "VẬN HÀNH",
      items: [
        {
          title: "Học viên",
          href: "/admin/users",
          icon: Users,
          badge: null,
        },
        {
          title: "Giao dịch SePay",
          href: "/admin/transactions",
          icon: CreditCard,
          badge: pendingTxCount > 0 ? `${pendingTxCount} cần duyệt` : null,
          badgeColor: "bg-primary text-white shadow-glow-red animate-pulse",
        },
      ],
    },
    {
      group: "HỌC VỤ",
      items: [
        {
          title: "Đề thi Aptis",
          href: "/admin/exams",
          icon: BookOpen,
          badge: null,
        },
        {
          title: "Kho Từ vựng",
          href: "/admin/vocabulary",
          icon: BookMarked,
          badge: null,
        },
        {
          title: "Đánh giá học viên",
          href: "/admin/reviews",
          icon: MessageSquare,
          badge: null,
        },
      ],
    },
    {
      group: "HỆ THỐNG",
      items: [
        {
          title: "Phân quyền (RBAC)",
          href: "/admin/permissions",
          icon: ShieldCheck,
          badge: "Mới",
          badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
        },
        {
          title: "Gói cước VIP",
          href: "/admin/cms",
          icon: FileText,
          badge: null,
        },
        {
          title: "Nhật ký Audit",
          href: "/admin/audit-logs",
          icon: History,
          badge: "Audit",
          badgeColor: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
        },
        {
          title: "Sự kiện & Giao diện",
          href: "/admin/events",
          icon: Sparkles,
          badge: "Theme",
          badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
        },
      ],
    },
  ];

  // Filter nav groups by role (SRS Section 1.2 Persona matrix)
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const filteredNavGroups = navGroups.map((group) => {
    if (group.group === "HỆ THỐNG" && !isSuperAdmin) {
      return null;
    }
    if (group.group === "VẬN HÀNH" && !isSuperAdmin) {
      return {
        ...group,
        items: group.items.filter((item) => item.href !== "/admin/transactions"),
      };
    }
    return group;
  }).filter(Boolean) as NavGroup[];

  // Flattened items for matching breadcrumb title
  const allNavItems = filteredNavGroups.flatMap((g) => g.items);

  // Guard Screen if not admin or super admin
  if (!isAuthenticated || (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN")) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200/90 bg-white p-7 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-800">
            <ShieldCheck className="w-7 h-7 text-slate-800" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Admin Security Portal</span>
            </div>
            <h2 className="text-xl font-heading font-extrabold text-slate-900 tracking-tight">
              Phân Hệ Quản Trị Hệ Thống
            </h2>
            <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-normal">
              Khu vực dành riêng cho Quản trị viên của <strong className="text-slate-800">APTIS ESOL PREMIER</strong> để vận hành học vụ, ngân hàng khảo thí và quản lý doanh thu.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => quickLogin("super_admin")}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-heading font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-xs shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>Đăng nhập Tổng Quản Trị (Super Admin)</span>
            </button>

            <button
              onClick={() => quickLogin("admin")}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-heading font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-xs shadow-xs"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập Quản Trị Học Vụ (Admin)</span>
            </button>

            <Link
              href="/dashboard"
              className="w-full py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay lại Trang Học viên</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentNav = allNavItems.find((item) =>
    item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href)
  );

  return (
    <div className="admin-root min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex relative selection:bg-blue-500/20 selection:text-blue-600 font-sans transition-colors duration-200">
      {/* Modals */}
      <AdminTutorialModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenTutorial={() => setTutorialOpen(true)}
      />

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      {/* Apple/Stripe Clean Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 flex flex-col transition-all duration-300 shadow-[1px_0_3px_0_rgba(0,0,0,0.02)] ${
          mobileSidebarOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "lg:w-20" : "lg:w-68"}`}
      >
        {/* Brand Header */}
        <div
          className={`h-16 border-b border-slate-200/80 dark:border-slate-800 flex items-center ${
            isCollapsed ? "justify-center px-2" : "justify-between px-5"
          } shrink-0`}
        >
          {isCollapsed ? (
            <button
              id="tour-sidebar-collapse"
              onClick={toggleSidebarCollapse}
              title="Mở rộng thanh điều hướng"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center group"
            >
              <Image
                src="/logo.webp"
                alt="APTIS ESOL PREMIER"
                width={30}
                height={30}
                className="h-7 w-7 shrink-0 transition-transform group-hover:scale-105"
                priority
              />
            </button>
          ) : (
            <>
              <Link href="/admin" className="flex items-center gap-3 overflow-hidden group">
                <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                  <Image
                    src="/logo.webp"
                    alt="APTIS ESOL PREMIER"
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 transition-transform duration-200 group-hover:scale-105"
                    priority
                  />
                </div>
                <div className="transition-opacity duration-200 min-w-0">
                  <div className="font-heading font-bold text-sm text-slate-900 tracking-tight leading-tight flex items-center gap-1.5 whitespace-nowrap">
                    <span>Aptis Admin</span>
                    <span className="inline-flex items-center gap-1 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 whitespace-nowrap font-medium">
                    PREMIER Workspace
                  </p>
                </div>
              </Link>

              {/* Close mobile button */}
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="lg:hidden text-slate-500 hover:text-slate-900 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Desktop collapse toggle */}
              <button
                id="tour-sidebar-collapse"
                onClick={toggleSidebarCollapse}
                title="Thu gọn thanh điều hướng"
                className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Groups */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden ${
            isCollapsed ? "px-2" : "px-3"
          } py-4 space-y-4`}
        >
          {filteredNavGroups.map((group, groupIdx) => (
            <div key={group.group} className="space-y-1">
              {!isCollapsed ? (
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 py-1 font-heading">
                  {group.group}
                </div>
              ) : (
                groupIdx > 0 && <div className="h-px bg-slate-200/80 dark:bg-slate-800 mx-2 my-2" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    id={`tour-nav-${item.href.replace("/admin/", "").replace("/admin", "dashboard")}`}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    title={
                      isCollapsed
                        ? item.badge
                          ? `${item.title} (${item.badge})`
                          : item.title
                        : undefined
                    }
                    className={`group relative flex items-center ${
                      isCollapsed ? "justify-center w-full py-2 px-0" : "justify-between px-3 py-2"
                    } rounded-xl font-heading font-medium text-[13px] transition-all duration-150 ${
                      isActive
                        ? "bg-gradient-to-r from-[#1D4ED8] to-[#2563EB] text-white font-semibold shadow-md shadow-blue-500/25 ring-1 ring-blue-400/30"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-2.5"}`}>
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform duration-150 ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400"
                        }`}
                      />
                      {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
                    </div>

                    {/* Badge for expanded mode */}
                    {!isCollapsed && item.badge && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                          isActive
                            ? "bg-white/20 text-white"
                            : item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Dot for collapsed mode */}
                    {isCollapsed && item.badge && (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Profile & Quick Portal Jump */}
        <div id="tour-profile-footer" className="p-3 border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 shrink-0">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                  {user?.full_name?.charAt(0) || "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user?.full_name || "Quản trị viên"}
                    </span>
                    <span className={`text-[9px] font-mono px-1 py-0.2 rounded font-bold ${
                      isSuperAdmin ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400" : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400"
                    }`}>
                      {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{user?.email}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href="/dashboard"
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Portal Học viên</span>
                </Link>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors border border-slate-200/80 dark:border-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/dashboard"
                title="Về Portal Học viên"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <button
                onClick={logout}
                title="Đăng xuất"
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors border border-slate-200/80 dark:border-slate-700"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Shell */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[padding] duration-300 ${
          isCollapsed ? "lg:pl-20" : "lg:pl-68"
        }`}
      >
        {/* Apple/Stripe Clean Header */}
        <header className="h-16 px-5 sm:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4 shadow-[0_1px_2px_0_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs font-heading font-medium text-slate-500 dark:text-slate-400">
              <Link href="/admin" className="hover:text-slate-900 dark:hover:text-white transition-colors font-medium">
                Quản trị
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
              <span className="text-slate-900 dark:text-white font-semibold">{currentNav?.title || "Bảng điều khiển"}</span>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2.5">
            {/* Quick Command Search (Ctrl + K) */}
            <button
              id="tour-search-btn"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs transition-all shadow-none"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium">Tìm nhanh...</span>
              <kbd className="px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs">
                ctrl k
              </kbd>
            </button>

            {/* Dark / Light Mode Switcher */}
            <button
              type="button"
              onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
              title={currentTheme === "dark" ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
              aria-label="Chuyển đổi giao diện Sáng / Tối"
            >
              {currentTheme === "dark" ? (
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600 transition-transform duration-200 hover:-rotate-12" />
              )}
            </button>

            {/* Tutorial Walkthrough Launcher */}
            <button
              id="tour-tutorial-btn"
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-heading font-semibold transition-all shadow-2xs"
              title="Mở hướng dẫn vận hành hệ thống"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Hướng dẫn</span>
            </button>

            {/* Pending Transactions Alert Badge */}
            {pendingTxCount > 0 && (
              <Link
                href="/admin/transactions"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 text-xs font-heading font-bold transition-all shadow-2xs"
                title={`${pendingTxCount} đơn hàng SePay cần khớp lệnh`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{pendingTxCount} đơn chờ</span>
              </Link>
            )}

            {/* Realtime Status Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>MB Bank Synced</span>
            </div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs hover:brightness-110 transition-all"
              >
                {user?.full_name?.charAt(0) || "A"}
              </button>

              {profileDropdownOpen && (
                <div
                  onClick={() => setProfileDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <div className="font-heading font-bold text-slate-900 dark:text-white truncate">{user?.full_name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-mono">{user?.email}</div>
                  </div>

                  {/* Theme Switcher Options */}
                  <div className="px-3 pt-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Giao diện
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-1 mb-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme("light");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentTheme === "light"
                          ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sáng</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTheme("dark");
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        currentTheme === "dark"
                          ? "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span>Tối</span>
                    </button>
                  </div>

                  <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-400" />
                    <span>Về Portal Học viên</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất Quản trị</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Inner Container */}
        <main className="admin-main flex-1 p-5 sm:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
