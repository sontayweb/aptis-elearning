"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { Loader2 } from "lucide-react";

export default function ExamDispatcherPage() {
  const params = useParams();
  const router = useRouter();
  const examId = typeof params?.id === "string" ? params.id : "";
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;

    let isMounted = true;

    async function routeToExam() {
      try {
        const res = await api.exams.getById(examId);
        if (res.success && res.data) {
          const exam = res.data as { id: string; skill?: string };
          let targetUrl = `/thi-thu/${exam.id}`;

          switch (exam.skill) {
            case "READING":
              targetUrl = `/reading/${exam.id}`;
              break;
            case "LISTENING":
              targetUrl = `/listening/${exam.id}`;
              break;
            case "WRITING":
              targetUrl = `/writing/${exam.id}`;
              break;
            case "SPEAKING":
              targetUrl = `/speaking/${exam.id}`;
              break;
            case "GRAMMAR_VOCABULARY":
              targetUrl = `/grammar/${exam.id}`;
              break;
            case "FULL_TEST":
            default:
              targetUrl = `/thi-thu/${exam.id}`;
              break;
          }

          if (isMounted) {
            router.replace(targetUrl);
          }
          return;
        } else {
          if (isMounted) {
            setError(res?.message || "Không tìm thấy thông tin đề thi trong hệ thống.");
          }
        }
      } catch (err: any) {
        console.error("Could not determine exam skill:", err);
        if (isMounted) {
          setError(err?.message || "Lỗi kết nối khi tải cấu hình đề thi. Vui lòng thử lại.");
        }
      }
    }

    routeToExam();

    return () => {
      isMounted = false;
    };
  }, [examId, router]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <div className="text-center space-y-4 max-w-sm p-6 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <span className="text-xl font-bold">!</span>
          </div>
          <h2 className="font-heading font-bold text-lg text-white">Không thể kết nối phòng thi</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/exams")}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-semibold transition-colors cursor-pointer"
            >
              Quay lại danh sách
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mx-auto border border-primary/30">
          <Loader2 className="w-6 h-6 animate-spin text-red-500" />
        </div>
        <h2 className="font-heading font-bold text-lg">Đang kết nối phòng thi Aptis...</h2>
        <p className="text-xs text-slate-400">
          Hệ thống đang chuẩn bị cấu hình đề thi và điều hướng tới giao diện học viên. Vui lòng đợi trong giây lát.
        </p>
      </div>
    </div>
  );
}
