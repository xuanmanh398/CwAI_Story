import React, { useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';

interface AdSlotProps {
  slotType: 'top' | 'bottom' | 'reader';
  className?: string;
  is18Plus?: boolean;
}

export const AdSlot: React.FC<AdSlotProps> = ({ slotType, className = '', is18Plus = false }) => {
  // TUÂN THỦ CHÍNH SÁCH GOOGLE ADSENSE: Tuyệt đối không hiển thị quảng cáo trên nội dung 18+/nhạy cảm
  if (is18Plus) {
    return null;
  }

  const { config } = useConfig();
  const ads = config.adsense;
  const customAds = config.customAds;

  // Lấy slot ID tương ứng cho Google AdSense
  let slotId = '';
  if (slotType === 'top') slotId = ads.slotTop;
  else if (slotType === 'bottom') slotId = ads.slotBottom;
  else if (slotType === 'reader') slotId = ads.slotReader;

  // Làm sạch publisher ID (đảm bảo dạng pub-xxxxxxxx hoặc ca-pub-xxxxxxxx)
  const cleanPubId = ads.publisherId ? ads.publisherId.replace(/^ca-/, '') : '';
  const isAdSenseConfigured = ads.enabled && cleanPubId && cleanPubId.startsWith('pub-') && slotId;

  // Tự động tải script Google AdSense nếu được bật
  useEffect(() => {
    if (!isAdSenseConfigured) return;

    const scriptId = 'google-adsense-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${cleanPubId}`;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      // AdSense push error safe catch
    }
  }, [isAdSenseConfigured, cleanPubId]);

  // 1. Nếu đã bật và cấu hình Google AdSense hợp lệ
  if (isAdSenseConfigured) {
    return (
      <div className={`my-4 text-center overflow-hidden ${className}`}>
        <span className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">Quảng cáo tài trợ</span>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={`ca-${cleanPubId}`}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // 2. Nếu có Banner tùy chỉnh của Đối tác / Nhà tài trợ được cấu hình
  let customBanner = null;
  if (customAds?.enabled) {
    if (slotType === 'top' && customAds.topBanner?.enabled) customBanner = customAds.topBanner;
    else if (slotType === 'bottom' && customAds.bottomBanner?.enabled) customBanner = customAds.bottomBanner;
    else if (slotType === 'reader' && customAds.readerBanner?.enabled) customBanner = customAds.readerBanner;
  }

  if (customBanner && customBanner.imageUrl) {
    return (
      <div className={`my-4 text-center overflow-hidden ${className}`}>
        <span className="block text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1">
          Quảng cáo đối tác
        </span>
        <a
          href={customBanner.targetUrl || '#'}
          target={customBanner.targetUrl ? '_blank' : '_self'}
          rel="noopener noreferrer"
          className="inline-block max-w-full rounded-xl overflow-hidden shadow-sm hover:opacity-95 transition"
        >
          <img
            src={customBanner.imageUrl}
            alt={customBanner.title || 'Quảng cáo đối tác'}
            className="max-h-36 sm:max-h-48 w-auto object-contain mx-auto rounded-xl"
          />
        </a>
      </div>
    );
  }

  // 3. Khung placeholder vị trí quảng cáo
  return (
    <div
      className={`my-4 p-4 border border-dashed border-gray-200 dark:border-neutral-800 rounded-xl bg-gray-50/50 dark:bg-neutral-800/30 text-center ${className}`}
    >
      <div className="flex flex-col items-center justify-center py-2 text-xs text-gray-400 dark:text-neutral-500">
        <span className="font-medium text-gray-500 dark:text-neutral-400">Vị trí quảng cáo đối tác ({slotType})</span>
        <span className="text-[11px] mt-0.5">Liên hệ đặt quảng cáo hoặc cấu hình Google AdSense / Banner trong Admin</span>
      </div>
    </div>
  );
};
