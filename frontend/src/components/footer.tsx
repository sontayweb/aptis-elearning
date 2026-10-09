"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Mail, Phone, MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/contexts/site-settings-context";

export function Footer() {
  const settings = useSiteSettings();
  return (
    <footer className="relative bg-sidebar text-sidebar-foreground/80 overflow-hidden mt-12">
      {/* Top Border Gradient Line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      {/* Top Ambient Glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="section-padding section-container relative py-12">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.webp"
                alt="APTIS ESOL PREMIER"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
              <span className="font-heading whitespace-nowrap tracking-wide inline-flex items-center gap-0">
                <span className="brand-name-aptis text-base">APTIS</span>
                <span className="brand-name-esol text-base mx-1">ESOL</span>
                <span className="brand-name-premier text-base">PREMIER</span>
              </span>
            </div>
            <p className="text-sm text-sidebar-foreground/50 leading-relaxed mb-5">
              Nền tảng luyện thi Aptis ESOL chuẩn CEFR có AI hỗ trợ. Giúp bạn đạt B1–B2 nhanh nhất.
            </p>
          </div>

          {/* Col 2: Luyện tập */}
          <div>
            <h4 className="font-heading font-semibold text-sidebar-foreground mb-4 uppercase text-xs tracking-wider">
              Luyện tập
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link className="hover:text-primary transition-colors" href="/grammar">
                  Grammar &amp; Vocab
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="/reading">
                  Reading
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="/listening">
                  Listening
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="/speaking">
                  Speaking
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="/writing">
                  Writing
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary transition-colors" href="/vocabulary">
                  Học từ vựng
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tính năng */}
          <div>
            <h4 className="font-heading font-semibold text-sidebar-foreground mb-4 uppercase text-xs tracking-wider">
              Tính năng
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  href="/thi-thu"
                >
                  <span>Thi thử Aptis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  href="/grammar"
                >
                  <span>Luyện theo kỹ năng</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  href="/speaking"
                >
                  <span>AI chấm Speaking–Writing</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  href="/progress"
                >
                  <span>Theo dõi tiến bộ</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                  href="/meo-thi-aptis"
                >
                  <span>Mẹo thi Aptis</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Liên hệ */}
          <div>
            <h4 className="font-heading font-semibold text-sidebar-foreground mb-4 uppercase text-xs tracking-wider">
              Liên hệ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                <span>{settings.supportEmail}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-primary" />
                <a
                  href={`tel:${settings.supportHotline.replace(/\s+/g, "")}`}
                  className="hover:text-primary transition-colors"
                >
                  {settings.supportHotline}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <a
                  href={settings.zaloContactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Zalo: {settings.supportHotline}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-primary"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
                <a
                  href="https://www.facebook.com/Aptiskytich"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors"
                >
                  Facebook: APTIS ESOL PREMIER
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-sidebar-border/60 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-sidebar-foreground/40">
          <div>© 2026 APTIS ESOL PREMIER. All rights reserved.</div>
          <div className="text-xs">
            Made with <span className="text-primary">♥</span> from APTIS ESOL PREMIER
          </div>
        </div>
      </div>
    </footer>
  );
}
