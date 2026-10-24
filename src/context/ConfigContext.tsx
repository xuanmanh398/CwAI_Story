import React, { createContext, useContext, useEffect, useState } from 'react';

export interface CustomAdItem {
  enabled: boolean;
  imageUrl: string;
  targetUrl: string;
  title?: string;
}

export interface CustomAdsConfig {
  enabled: boolean;
  topBanner?: CustomAdItem;
  bottomBanner?: CustomAdItem;
  readerBanner?: CustomAdItem;
}

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteDomain: string;
  primaryColor: string;
  adsense: {
    enabled: boolean;
    publisherId: string;
    slotTop: string;
    slotBottom: string;
    slotReader: string;
    autoAds?: boolean;
  };
  customAds?: CustomAdsConfig;
}

const defaultConfig: SiteConfig = {
  siteName: import.meta.env.VITE_SITE_NAME || 'TruyenNha',
  siteDescription: import.meta.env.VITE_SITE_DESCRIPTION || 'Nền tảng đọc truyện chữ tiếng Việt chất lượng cao',
  siteDomain: import.meta.env.VITE_SITE_DOMAIN || 'truyennha.id.vn',
  primaryColor: import.meta.env.VITE_PRIMARY_COLOR || '#16a34a',
  adsense: {
    enabled: import.meta.env.VITE_ADSENSE_ENABLED === 'true',
    publisherId: import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '',
    slotTop: import.meta.env.VITE_ADSENSE_SLOT_TOP || '',
    slotBottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM || '',
    slotReader: import.meta.env.VITE_ADSENSE_SLOT_READER || '',
    autoAds: false,
  },
  customAds: {
    enabled: false,
    topBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
    bottomBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
    readerBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
  },
};

const ConfigContext = createContext<{
  config: SiteConfig;
  updateConfig: (c: Partial<SiteConfig>) => void;
  refreshConfig: () => Promise<void>;
}>({
  config: defaultConfig,
  updateConfig: () => {},
  refreshConfig: async () => {},
});

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.data) {
        setConfig((prev) => ({
          ...prev,
          ...data.data,
          adsense: { ...prev.adsense, ...(data.data.adsense || {}) },
          customAds: { ...prev.customAds, ...(data.data.customAds || {}) },
        }));
      }
    } catch {
      // Sử dụng cấu hình mặc định nếu API chưa phản hồi
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateConfig = (newCfg: Partial<SiteConfig>) => {
    setConfig((prev) => ({ ...prev, ...newCfg }));
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
