"use client";

import { useAuth } from "@/contexts/auth-context";
import { DashboardView } from "@/components/dashboard-view";
import { LandingPage } from "@/components/landing-page";

export default function DashboardRoute() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <DashboardView user={user} />;
}
