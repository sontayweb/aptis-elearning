"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { FloatingActions } from "@/components/floating-actions";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api-client";
import {
  Users,
  GraduationCap,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Mic,
  PenTool,
  Copy,
  Check,
  Plus,
  Loader2,
  LogIn,
} from "lucide-react";

interface ClassroomMembership {
  membershipId: string;
  joinedAt: string;
  classroom: {
    id: string;
    name: string;
    classCode: string;
    description?: string | null;
    totalMembers: number;
    createdAt: string;
  };
  teacher: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export default function MyClassesPage() {
  const { user, isAuthenticated } = useAuth();
  const [classCodeInput, setClassCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const loadMyClassrooms = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await api.teacher.getMyClassrooms();
      if (res.success && Array.isArray(res.data)) {
        setClassrooms(res.data);
      }
    } catch (err: any) {
      console.error("Failed to load student classrooms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyClassrooms();
  }, [isAuthenticated]);

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCodeInput.trim()) return;

    setJoining(true);
    setJoinError(null);
    setJoinSuccess(null);

    try {
      const res = await api.teacher.joinClassroom(classCodeInput.trim().toUpperCase());
      if (res.success) {
        setJoinSuccess(`Bạn đã tham gia lớp "${res.data?.classroom?.name || classCodeInput.trim().toUpperCase()}" thành công!`);
        setClassCodeInput("");
        await loadMyClassrooms();
      } else {
        setJoinError(res.error?.message || "Không thể tham gia lớp học. Vui lòng kiểm tra lại mã lớp.");
      }
    } catch (err: any) {
      setJoinError(err.message || "Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
    } finally {
      setJoining(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border-b border-border py-12 md:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full blur-3xl animate-breathing -top-24 -right-24"
            style={{ width: "400px", height: "400px", background: "hsl(var(--primary) / 0.25)" }}
          />

          <div className="section-container relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary w-fit text-xs font-bold mb-4">
                <GraduationCap className="w-4 h-4" />
                <span>Không gian lớp học & Đồng hành cùng Giảng viên</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight mb-4">
                Lớp Học Của Tôi & <span className="gradient-text">Tham Gia Lớp</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                Nhập mã lớp do thầy cô cung cấp để tham gia lớp học, nhận bài tập kỹ năng Speaking & Writing theo lịch đào tạo và được giảng viên chấm điểm chi tiết.
              </p>
            </div>
          </div>
        </section>

        <section className="section-container py-10 space-y-10">
          {/* JOIN CLASSROOM CARD */}
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-foreground">
                  Tham gia lớp học mới
                </h2>
                <p className="text-xs text-muted-foreground">
                  Nhập mã lớp gồm chữ và số do giảng viên của bạn cấp phát (Ví dụ: APTIS-B2-K24)
                </p>
              </div>
            </div>

            <form onSubmit={handleJoinClass} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Nhập mã lớp (VD: APTIS-B2-K24)..."
                  value={classCodeInput}
                  onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                  disabled={!isAuthenticated || joining}
                  className="w-full px-4 py-3 text-sm font-mono uppercase tracking-wider rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={!isAuthenticated || joining || !classCodeInput.trim()}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-50 shrink-0"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Tham gia lớp</span>
                  </>
                )}
              </button>
            </form>

            {!isAuthenticated && (
              <p className="text-xs text-amber-500 mt-3 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-4 h-4" />
                <span>Vui lòng đăng nhập tài khoản học viên để tham gia lớp học.</span>
              </p>
            )}

            {joinError && (
              <div className="mt-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </div>
            )}

            {joinSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{joinSuccess}</span>
              </div>
            )}
          </div>

          {/* LIST OF ENROLLED CLASSROOMS */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <h2 className="font-heading font-bold text-xl text-foreground">
                  Danh sách lớp học đã tham gia ({classrooms.length})
                </h2>
              </div>
              <button
                type="button"
                onClick={loadMyClassrooms}
                className="text-xs text-primary font-bold hover:underline"
              >
                Làm mới danh sách
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm">Đang tải danh sách lớp học...</span>
              </div>
            ) : classrooms.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {classrooms.map((item) => (
                  <div
                    key={item.membershipId}
                    className="rounded-3xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                              ĐÃ THAM GIA
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.joinedAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                          <h3 className="font-heading font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                            {item.classroom.name}
                          </h3>
                        </div>

                        {/* Class code badge */}
                        <button
                          type="button"
                          onClick={() => handleCopy(item.classroom.classCode)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-muted/60 text-xs font-mono font-bold text-foreground hover:bg-muted transition-colors shrink-0"
                          title="Bấm để sao chép mã lớp"
                        >
                          {copiedCode === item.classroom.classCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-500">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              <span>{item.classroom.classCode}</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                        {item.classroom.description || "Lớp luyện thi Aptis ESOL tập trung 4 kỹ năng theo lộ trình trung tâm."}
                      </p>

                      {/* Teacher & Members Info */}
                      <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                            {item.teacher?.full_name?.charAt(0) || "T"}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground flex items-center gap-1">
                              <span>{item.teacher?.full_name}</span>
                              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                                Giảng viên
                              </span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.teacher?.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold text-foreground">
                            {item.classroom.totalMembers}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Học viên</div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Homework Links */}
                    <div className="border-t border-border pt-4">
                      <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
                        Luyện tập theo yêu cầu lớp:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Link
                          href="/speaking"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-colors"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Speaking</span>
                        </Link>
                        <Link
                          href="/writing"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          <span>Writing</span>
                        </Link>
                        <Link
                          href="/thi-thu"
                          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Thi thử</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-border bg-card/40 p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="font-heading font-bold text-lg text-foreground">
                  Bạn chưa tham gia lớp học nào
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hãy liên hệ với giảng viên phụ trách hoặc bộ phận học vụ của trung tâm để nhận <strong>Mã lớp học</strong> và tham gia lớp ở ô phía trên.
                </p>
                <div className="pt-2">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <span>Liên hệ phòng học vụ tư vấn lớp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <FloatingActions />
      <Footer />
    </div>
  );
}
