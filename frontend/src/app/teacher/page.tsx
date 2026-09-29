"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import {
  Users,
  PenTool,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [gradingQueue, setGradingQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, classesRes, queueRes] = await Promise.all([
        api.teacher.getStats(),
        api.teacher.getClassrooms(),
        api.teacher.getGradingQueue(),
      ]);

      if (statsRes.success) setStats(statsRes.data);
      if (classesRes.success && Array.isArray(classesRes.data)) setClassrooms(classesRes.data);
      if (queueRes.success && Array.isArray(queueRes.data)) setGradingQueue(queueRes.data);
    } catch (err) {
      console.error("Failed to load teacher dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">
            Tổng Quan Giảng Dạy &amp; Khảo Thí
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tiến độ học tập các lớp và hàng đợi chấm bài Speaking &amp; Writing
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Làm mới số liệu</span>
        </button>
      </div>

      {/* 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-500">
              Lớp học quản lý
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900 font-mono">
            {stats?.totalClassrooms ?? classrooms.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lớp luyện thi Aptis đang mở</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-500">
              Tổng số học viên
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-700 font-mono">
            {stats?.totalStudents ?? 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Thành viên tham gia theo mã lớp</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-heading font-semibold uppercase tracking-wider text-slate-500">
              Bài thi chờ chấm
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <PenTool className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-700 font-mono">
            {stats?.pendingGradingCount ?? gradingQueue.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Bài Speaking &amp; Writing cần chấm tay</div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Quick Grading Queue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-heading font-bold text-slate-900">
                Hàng Đợi Chấm Bài Gần Nhất
              </h2>
            </div>
            <Link
              href="/teacher/grading"
              className="text-xs text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Xem tất cả ({gradingQueue.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {gradingQueue.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>Hiện không có bài thi nào đang chờ chấm!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {gradingQueue.slice(0, 5).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-slate-900">
                      {item.user?.full_name || "Học viên"}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.exam?.title} · {item.exam?.skill}
                    </div>
                  </div>
                  <Link
                    href={`/teacher/grading?id=${item.id}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold"
                  >
                    Chấm bài
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Classroom List Preview */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-heading font-bold text-slate-900">
                Lớp Học Đang Phụ Trách
              </h2>
            </div>
            <Link
              href="/teacher/classes"
              className="text-xs text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1"
            >
              <span>Quản lý lớp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {classrooms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>Bạn chưa tạo lớp học nào.</p>
              <Link
                href="/teacher/classes"
                className="mt-2 inline-block px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                + Tạo lớp học mới
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {classrooms.slice(0, 4).map((cls) => (
                <div
                  key={cls.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{cls.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Mã lớp: <span className="font-mono font-bold text-blue-600">{cls.class_code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                      {cls._count?.members || cls.members?.length || 0} học viên
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
