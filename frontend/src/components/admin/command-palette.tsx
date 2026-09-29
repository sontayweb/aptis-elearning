"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  BookMarked,
  MessageSquare,
  FileText,
  History,
  ArrowRight,
  Sparkles,
  Command,
  X,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTutorial: () => void;
}

export default function CommandPalette({ isOpen, onClose, onOpenTutorial }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions = [
    {
      id: "dashboard",
      title: "Bảng điều khiển Tổng quan",
      subtitle: "Thống kê lượt thi, doanh thu, việc cần xử lý",
      icon: LayoutDashboard,
      href: "/admin",
      category: "Trang điều hướng",
    },
    {
      id: "users",
      title: "Quản lý Học viên & Tài khoản",
      subtitle: "Tra cứu theo SĐT, cấp quyền VIP, bơm lượt AI, đặt lại mật khẩu",
      icon: Users,
      href: "/admin/users",
      category: "Trang điều hướng",
    },
    {
      id: "transactions",
      title: "Sổ lệnh Giao dịch SePay",
      subtitle: "Khớp lệnh chuyển khoản MB Bank, kích hoạt đơn lỗi cú pháp",
      icon: CreditCard,
      href: "/admin/transactions",
      category: "Trang điều hướng",
    },
    {
      id: "exams",
      title: "Ngân hàng Đề thi Aptis ESOL",
      subtitle: "Quản lý đề thi 4 kỹ năng Nghe, Đọc, Viết, Nói chuẩn CEFR",
      icon: BookOpen,
      href: "/admin/exams",
      category: "Trang điều hướng",
    },
    {
      id: "vocabulary",
      title: "Kho Từ vựng Aptis",
      subtitle: "Chỉnh sửa bộ từ vựng, cấp độ B1-C, ghi âm audio",
      icon: BookMarked,
      href: "/admin/vocabulary",
      category: "Trang điều hướng",
    },
    {
      id: "reviews",
      title: "Kiểm duyệt Đánh giá (Bảng Kỳ Tích)",
      subtitle: "Duyệt nhận xét, lời vinh danh từ học viên điểm cao",
      icon: MessageSquare,
      href: "/admin/reviews",
      category: "Trang điều hướng",
    },
    {
      id: "audit-logs",
      title: "Nhật ký Kiểm toán (Audit Logs)",
      subtitle: "Tra cứu lịch sử thao tác, đối soát thay đổi dữ liệu",
      icon: History,
      href: "/admin/audit-logs",
      category: "Trang điều hướng",
    },
    {
      id: "cms",
      title: "Quản lý Gói cước VIP",
      subtitle: "Điều chỉnh bảng giá VIP 1M, 3M, 6M và hạn ngạch AI",
      icon: FileText,
      href: "/admin/cms",
      category: "Trang điều hướng",
    },
    {
      id: "tutorial",
      title: "Xem Hướng dẫn Vận hành (Tutorial Onboarding)",
      subtitle: "Mở tour hướng dẫn 5 bước sử dụng toàn bộ tính năng quản trị",
      icon: Sparkles,
      action: () => {
        onClose();
        onOpenTutorial();
      },
      category: "Hỗ trợ & Trợ giúp",
    },
  ];

  const filtered = actions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          const item = filtered[selectedIndex];
          if (item.action) {
            item.action();
          } else if (item.href) {
            router.push(item.href);
            onClose();
          }
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filtered, selectedIndex, router, onClose]);

  // Lock body scroll when command palette is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-xl w-full max-h-[80vh] rounded-3xl border border-border/90 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-border/70 flex items-center gap-3 bg-muted/30">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tính năng, màn hình quản trị, hoặc bấm Esc để đóng..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none font-medium font-sans"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted border border-border rounded-lg shadow-sm">
            ESC
          </kbd>
          <button onClick={onClose} className="sm:hidden p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs font-medium">
              Không tìm thấy tính năng nào phù hợp với &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else if (item.href) {
                      router.push(item.href);
                      onClose();
                    }
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-primary/10 text-foreground border border-primary/40 shadow-glow-soft"
                      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-gradient-to-r from-[#CC1C01] to-[#FEAD5F] text-white shadow-glow-soft"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-heading font-bold truncate flex items-center gap-1.5 text-foreground">
                        {item.title}
                        <span className="text-[10px] font-normal text-muted-foreground">({item.category})</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.subtitle}</div>
                    </div>
                  </div>
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? "text-primary translate-x-1" : "text-muted-foreground/40"
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="p-3 bg-muted/40 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>Dùng <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">↑</kbd> <kbd className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">↓</kbd> để di chuyển</span>
            <span><kbd className="font-mono bg-card px-1.5 py-0.5 rounded border border-border">Enter</kbd> để chọn</span>
          </div>
          <div className="text-primary font-bold flex items-center gap-1 font-heading">
            <Command className="w-3.5 h-3.5" />
            <span>Aptis Quick Navigator</span>
          </div>
        </div>
      </div>
    </div>
  );
}
