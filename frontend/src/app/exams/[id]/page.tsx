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
            case "FULL_TEST":
            default:
              targetUrl = `/thi-thu/${exam.id}`;
              break;
          }

          if (isMounted) {
            router.replace(targetUrl);
          }
          return;
        }
      } catch (err) {
        console.warn("Could not determine exam skill, defaulting to Full Test room:", err);
      }

      // Fallback to Full Test room if fetch fails
      if (isMounted) {
        router.replace(`/thi-thu/${examId}`);
      }
    }

    routeToExam();

    return () => {
      isMounted = false;
    };
  }, [examId, router]);

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
