"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { useAuth } from "@/contexts/auth-context";
import {
  Bell,
  Check,
  CheckCheck,
  Crown,
  FileCheck2,
  GraduationCap,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "SYSTEM" | "EXAM_GRADED" | "VIP_ACTIVATED" | "CLASS_ANNOUNCEMENT";
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export function NotificationDropdown() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await api.notifications.getAll({ limit: 10 });
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        if (res.meta && typeof res.meta.unreadCount === "number") {
          setUnreadCount(res.meta.unreadCount);
        } else {
          setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
        }
      }
    } catch (err) {
      console.warn("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll unread count every 45s
    const timer = setInterval(() => {
      if (isAuthenticated) {
        api.notifications.getUnreadCount().then((res) => {
          if (res.success && res.data) {
            setUnreadCount(res.data.unreadCount);
          }
        }).catch(() => {});
      }
    }, 45000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  // Click on a notification item
  const handleItemClick = async (item: NotificationItem) => {
    if (!item.is_read) {
      api.notifications.markAsRead(item.id).then(() => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }).catch(() => {});
    }
    setIsOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Helper relative time
  const getRelativeTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "VIP_ACTIVATED":
        return <Crown className="w-4 h-4 text-amber-500" />;
      case "EXAM_GRADED":
        return <FileCheck2 className="w-4 h-4 text-blue-500" />;
      case "CLASS_ANNOUNCEMENT":
        return <GraduationCap className="w-4 h-4 text-emerald-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative inline-flex items-center" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        aria-label="Thông báo"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-muted transition-colors text-foreground select-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center leading-none ring-2 ring-background animate-pulse shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-foreground">
                Thông báo
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40 p-1">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Đang tải thông báo...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mb-2 text-muted-foreground/60">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-foreground">
                  Chưa có thông báo nào
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Các thông báo bài thi, kết quả chấm điểm sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 relative group ${
                    item.is_read
                      ? "hover:bg-muted/40 text-muted-foreground"
                      : "bg-primary/5 hover:bg-primary/10 text-foreground"
                  }`}
                >
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl bg-card border border-border shrink-0 flex items-center justify-center shadow-xs mt-0.5">
                    {getIcon(item.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs font-bold leading-tight truncate ${
                          item.is_read ? "text-foreground/80" : "text-foreground"
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-ping" />
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/70 mt-1 block">
                      {getRelativeTime(item.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border bg-muted/20 text-center">
            <Link
              href="/history"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-1 py-1"
            >
              <span>Xem lịch sử bài thi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
