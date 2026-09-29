"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "@/lib/api-client";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  phone_number?: string;
  avatar_url?: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPER_ADMIN";
  is_active?: boolean;
  target_band?: "B1_TARGET" | "B2_TARGET" | "C_TARGET" | null;
  created_at?: string;
  subscription?: {
    planName: string;
    code: string;
    endDate: string;
    aiQuotaLeft: number;
    teacherQuotaLeft: number;
  } | null;
  user_subscriptions?: Array<{
    id: string;
    status: string;
    end_date: string;
    plan: {
      id: string;
      name: string;
      code: string;
    };
  }>;
  ai_quotas?: {
    total_quota: number;
    used_quota: number;
  };
  teacher_quotas?: {
    total_quota: number;
    used_quota: number;
  };
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  register: (data: { email: string; password: string; full_name: string; phone?: string }) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  quickLogin: (role: "student" | "teacher" | "admin" | "super_admin") => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await api.auth.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem("accessToken", res.data.tokens.accessToken);
      localStorage.setItem("refreshToken", res.data.tokens.refreshToken);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    }
    return {
      success: false,
      error: res.error?.message || "Đăng nhập không thành công",
    };
  };

  const register = async (data: { email: string; password: string; full_name: string; phone?: string }) => {
    const res = await api.auth.register(data);
    if (res.success && res.data) {
      return await login(data.email, data.password);
    }
    return {
      success: false,
      error: res.error?.message || "Đăng ký không thành công",
    };
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
  };

  const quickLogin = async (role: "student" | "teacher" | "admin" | "super_admin") => {
    const credentials = {
      student: { email: "hoanghiep310102@gmail.com", password: "Student123!@#" },
      teacher: { email: "teacher@aptiskytich.vn", password: "Admin123!@#" },
      admin: { email: "admin@aptiskytich.vn", password: "Admin123!@#" },
      super_admin: { email: "superadmin@aptiskytich.vn", password: "SuperAdmin123!@#" },
    }[role];

    return await login(credentials.email, credentials.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
        quickLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
