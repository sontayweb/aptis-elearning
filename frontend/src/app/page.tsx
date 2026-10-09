"use client";

import { useAuth } from "@/contexts/auth-context";
import { LandingPage } from "@/components/landing-page";
import { DashboardView } from "@/components/dashboard-view";

export default function HomePage() {
  const { user, isAuthenticated, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-xs font-bold text-muted-foreground animate-pulse">
            Đang tải dữ liệu APTIS ESOL PREMIER...
          </span>
        </div>
      </div>
    );
  }

  // If visitor is not logged in: render the comprehensive marketing landing page
  // if (!isAuthenticated) {
  //   return <LandingPage />;
  // }

  // If student is logged in: render the personal learning dashboard
  return <DashboardView user={user} />;
}
