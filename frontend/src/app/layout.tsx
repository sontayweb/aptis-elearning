import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#DE1A35" },
    { media: "(prefers-color-scheme: dark)", color: "#0B132B" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://aptisesolpremier.com"),
  title: {
    default: "APTIS ESOL PREMIER — Luyện thi Aptis ESOL chuẩn British Council",
    template: "%s | APTIS ESOL PREMIER",
  },
  description: "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
  manifest: "/manifest.webmanifest",
  applicationName: "Aptis Premier",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aptis Premier",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://aptisesolpremier.com",
    siteName: "APTIS ESOL PREMIER",
    title: "APTIS ESOL PREMIER — Luyện thi Aptis ESOL chuẩn British Council",
    description: "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
    images: [
      {
        url: "/logo.webp",
        width: 800,
        height: 600,
        alt: "APTIS ESOL PREMIER",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "APTIS ESOL PREMIER — Luyện thi Aptis ESOL chuẩn British Council",
    description: "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
    images: ["/logo.webp"],
  },
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
import { PwaRegister } from "@/components/pwa-register";
import { SelectionTranslator } from "@/components/selection-translator";
import { CoursePromoPopup } from "@/components/course-promo-popup";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://aptisesolpremier.com/#organization",
      "name": "APTIS ESOL PREMIER",
      "url": "https://aptisesolpremier.com",
      "logo": "https://aptisesolpremier.com/logo.webp",
      "description": "Nền tảng luyện thi Aptis ESOL chuẩn CEFR — Thi thử miễn phí, AI chấm Speaking & Writing, lộ trình đạt B2 nhanh nhất.",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+84379866596",
        "contactType": "customer service",
        "areaServed": "VN",
        "availableLanguage": ["Vietnamese", "English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://aptisesolpremier.com/#website",
      "url": "https://aptisesolpremier.com",
      "name": "APTIS ESOL PREMIER",
      "publisher": {
        "@id": "https://aptisesolpremier.com/#organization",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
        {/* Schema.org Dữ liệu cấu trúc chuẩn Google SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Chặn triệt để hiện tượng FOUC (chớp nhoáng màu xanh mặc định trước khi hydrate theme) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var userPref = localStorage.getItem('user_theme_preference') || localStorage.getItem('theme');
                  if (userPref === 'light') {
                    document.documentElement.classList.remove('dark');
                    return;
                  }
                  if (userPref === 'dark') {
                    document.documentElement.classList.add('dark');
                    return;
                  }
                  var saved = localStorage.getItem('system_event_theme_config');
                  var theme = 'tet';
                  if (saved) {
                    var cfg = JSON.parse(saved);
                    if (cfg && cfg.enabled && cfg.activeTemplate) {
                      theme = cfg.activeTemplate;
                    } else if (cfg && cfg.enabled === false) {
                      theme = '';
                    }
                  }
                  if (theme) {
                    document.documentElement.setAttribute('data-event-theme', theme);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground">
        <EventThemeProvider>
          <SiteSettingsProvider>
            <AuthProvider>
              {children}
              <SelectionTranslator />
              <EventDecorations />
              <MobileBottomNav />
              <PwaRegister />
              <CoursePromoPopup />
            </AuthProvider>
          </SiteSettingsProvider>
        </EventThemeProvider>
      </body>
    </html>
  );
}
