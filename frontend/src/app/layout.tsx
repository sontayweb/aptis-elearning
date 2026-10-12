import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="vi" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
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
