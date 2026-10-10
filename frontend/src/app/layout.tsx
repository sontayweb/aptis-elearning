import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "APTIS ESOL PREMIER — Luyện thi Aptis ESOL chuẩn British Council",
  description: "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

import { AuthProvider } from "@/contexts/auth-context";
import { EventThemeProvider } from "@/contexts/event-theme-context";
import { SiteSettingsProvider } from "@/contexts/site-settings-context";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { EventDecorations } from "@/components/event-decorations";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <EventThemeProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              {children}
              <EventDecorations />
              <MobileBottomNav />
            </AuthProvider>
          </SiteSettingsProvider>
        </EventThemeProvider>
      </body>
    </html>
  );
}
