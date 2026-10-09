"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SITE_CONFIG } from "@/config/site-config";
import { api } from "@/lib/api-client";

export interface PublicSiteSettings {
  zaloContactUrl: string;
  hotlinePhone: string;
  supportHotline: string;
  supportEmail: string;
  fanpageUrl: string;
  consultantName: string;
}

const DEFAULT_SETTINGS: PublicSiteSettings = {
  zaloContactUrl: SITE_CONFIG.contact.defaultZaloUrl,
  hotlinePhone: SITE_CONFIG.contact.defaultHotline,
  supportHotline: SITE_CONFIG.contact.defaultHotline,
  supportEmail: SITE_CONFIG.contact.defaultEmail,
  fanpageUrl: SITE_CONFIG.contact.facebookUrl,
  consultantName: SITE_CONFIG.contact.consultantName,
};

interface SiteSettingsContextType {
  settings: PublicSiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULT_SETTINGS,
  loading: false,
  refreshSettings: async () => {},
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.settings.getPublic();
      if (res.success && res.data) {
        const hotline = res.data.hotlinePhone || DEFAULT_SETTINGS.hotlinePhone;
        setSettings({
          zaloContactUrl: res.data.zaloContactUrl || DEFAULT_SETTINGS.zaloContactUrl,
          hotlinePhone: hotline,
          supportHotline: hotline,
          supportEmail: DEFAULT_SETTINGS.supportEmail,
          fanpageUrl: res.data.fanpageUrl || DEFAULT_SETTINGS.fanpageUrl,
          consultantName: res.data.consultantName || DEFAULT_SETTINGS.consultantName,
        });
      }
    } catch (err) {
      console.warn("Dùng fallback cấu hình liên lạc mặc định:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  return context?.settings || DEFAULT_SETTINGS;
}
