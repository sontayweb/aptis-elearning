"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  PenTool,
  CheckCircle2,
  LogOut,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout, quickLogin } = useAuth();
  const isTeacherOrAdmin = user?.role === "TEACHER" || user?.role === "ADMIN";

  const navigation = [
    { name: "Tổng quan Lớp học", href: "/teacher", icon: LayoutDashboard },
    { name: "Quản lý Lớp học", href: "/teacher/classes", icon: Users },
    { name: "Hàng đợi Chấm thi", href: "/teacher/grading", icon: PenTool },
  ];

  if (!isAuthenticated || !isTeacherOrAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-slate-900">
              Yêu cầu quyền Giảng viên
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Khu vực dành riêng cho Giảng viên và Cán bộ chấm thi chuyên môn. Vui lòng đăng nhập với tài khoản được cấp quyền TEACHER.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => quickLogin("teacher")}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-heading font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Đăng nhập thử nghiệm: Giảng viên (Teacher)</span>
            </button>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về trang chủ học viên</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200/80 flex flex-col shrink-0">
        {/* Brand */}
        <div className="h-16 px-6 border-b border-slate-200/80 flex items-center justify-between">
          <Link href="/teacher" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-heading font-extrabold text-slate-900 leading-tight">
                Cổng Giảng Viên
              </div>
              <div className="text-[10px] text-blue-600 font-semibold uppercase tracking-wider">
                Aptis Kỳ Tích
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1">
          <div className="text-[10px] uppercase font-bold text-slate-400 px-3 py-2 tracking-wider">
            Nghiệp vụ Học vụ
          </div>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-heading font-semibold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-white/70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Profile */}
        <div className="p-4 border-t border-slate-200/80">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 mb-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              GV
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 truncate">
                {user?.full_name || "Giảng viên"}
              </div>
              <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="flex-1 py-1.5 rounded-lg border border-slate-200 text-center text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Về Website
            </Link>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
