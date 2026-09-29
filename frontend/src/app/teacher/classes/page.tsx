"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import {
  Users,
  Plus,
  Copy,
  Check,
  BookOpen,
  Calendar,
  X,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function TeacherClassesPage() {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({ name: "", description: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.teacher.getClassrooms();
      if (res.success && Array.isArray(res.data)) {
        setClassrooms(res.data);
      }
    } catch (err) {
      console.error("Failed to load classrooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name.trim()) return;
    setCreateLoading(true);
    try {
      const res = await api.teacher.createClassroom(newClass);
      if (res.success) {
        setCreateModalOpen(false);
        setNewClass({ name: "", description: "" });
        loadClasses();
      } else {
        alert(res.error?.message || "Không thể tạo lớp học");
      }
    } catch {
      alert("Lỗi khi kết nối máy chủ");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleViewMembers = async (cls: any) => {
    setSelectedClass(cls);
    setMembersLoading(true);
    try {
      const res = await api.teacher.getClassroomMembers(cls.id);
      if (res.success && Array.isArray(res.data)) {
        setMembers(res.data);
      } else if (cls.members) {
        setMembers(cls.members);
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.error("Failed to load classroom members:", err);
      setMembers(cls.members || []);
    } finally {
      setMembersLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900">
            Quản Lý Lớp Học &amp; Cấp Mã Phòng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tạo lớp học, cấp mã tham gia (classCode) và theo dõi kết quả của từng học viên
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo lớp học mới</span>
        </button>
      </div>

      {/* Classroom Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs">Đang tải danh sách lớp học...</p>
        </div>
      ) : classrooms.length === 0 ? (
        <div className="py-20 rounded-2xl border border-dashed border-slate-300 bg-white text-center p-8 space-y-3">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-slate-900 text-base">Chưa có lớp học nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Nhấn nút "Tạo lớp học mới" để tạo lớp và lấy mã phòng gửi cho học viên tham gia.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo lớp học ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div
              key={cls.id}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-blue-400 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-slate-900 text-base">{cls.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {cls.description || "Lớp luyện thi Aptis ESOL"}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
              </div>

              {/* Class Code Box */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400">Mã tham gia:</div>
                  <div className="font-mono font-extrabold text-blue-700 text-sm">{cls.class_code}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(cls.class_code)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 inline-flex items-center gap-1 transition-colors"
                >
                  {copiedCode === cls.class_code ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>{cls._count?.members || cls.members?.length || 0} học viên</span>
                <button
                  onClick={() => handleViewMembers(cls)}
                  className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                >
                  <span>Xem chi tiết</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Class Modal */}
      {createModalOpen && (
        <div
          onClick={() => setCreateModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-heading font-bold text-slate-900">Tạo Lớp Học Mới</h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Tên lớp học: *</label>
                <input
                  type="text"
                  required
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  placeholder="VD: Lớp Aptis B2 Cấp Tốc - Khóa 24"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">Mô tả khóa học:</label>
                <textarea
                  rows={3}
                  value={newClass.description}
                  onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                  placeholder="Lịch học Thứ 3 - 5 - 7, mục tiêu cam kết B2 cho sinh viên..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-semibold text-xs shadow-xs"
                >
                  {createLoading ? "Đang tạo..." : "Xác nhận tạo lớp"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Members Drawer/Modal */}
      {selectedClass && (
        <div
          onClick={() => setSelectedClass(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-heading font-bold text-slate-900">{selectedClass.name}</h3>
                <p className="text-xs text-slate-500 font-mono">Mã lớp: {selectedClass.class_code}</p>
              </div>
              <button
                onClick={() => setSelectedClass(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {members.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <p>Lớp học này chưa có học viên tham gia.</p>
                  <p className="mt-1">Hãy gửi mã <strong>{selectedClass.class_code}</strong> để học viên nhập vào hệ thống.</p>
                </div>
              ) : (
                members.map((m: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{m.user?.full_name || "Học viên"}</div>
                      <div className="text-[11px] text-slate-500">{m.user?.email}</div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                      Đã tham gia
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedClass(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
