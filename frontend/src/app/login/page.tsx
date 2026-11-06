"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth-modal";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
  }, [isAuthenticated, loading, router, searchParams]);

  const handleClose = () => {
    const redirect = searchParams.get("redirect") || "/";
    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <AuthModal
        isOpen={true}
        onClose={handleClose}
        defaultTab="login"
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-xs">
          Đang tải trang đăng nhập...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
