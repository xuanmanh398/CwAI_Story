import React from 'react';
import { useConfig } from '../../context/ConfigContext';
import { BookOpen, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { config } = useConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Giới thiệu {config.siteName}</h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Nền tảng đọc truyện chữ tiếng Việt hiện đại, tập trung vào văn hóa tôn trọng bản quyền, trải nghiệm đọc tối giản và tốc độ vượt trội trên Cloudflare Edge.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm space-y-6 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-2">
            <BookOpen className="w-5 h-5 text-brand-600 mr-2" />
            1. Tầm nhìn & Sứ mệnh
          </h2>
          <p>
            {config.siteName} được thành lập với mục tiêu xây dựng một sân chơi văn học trực tuyến lành mạnh, minh bạch và tiện nghi cho cộng đồng yêu thích truyện chữ tại Việt Nam. Chúng tôi tin rằng mỗi con chữ đều mang giá trị trí tuệ cần được trân trọng và bảo vệ.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-2">
            <ShieldCheck className="w-5 h-5 text-brand-600 mr-2" />
            2. Cam kết nguồn nội dung
          </h2>
          <p>
            Khác biệt với các website tự ý thu thập nội dung trái phép, nguồn truyện trên {config.siteName} tuân thủ nghiêm ngặt ba tiêu chuẩn:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Tác phẩm do đội ngũ sáng tác nội bộ và các tác giả cộng tác trực tiếp cấp phép.</li>
            <li>Nội dung tích hợp qua giao diện API có thỏa thuận ủy quyền bản quyền chính thức.</li>
            <li>Các tác phẩm thuộc phạm vi chia sẻ tự do hoặc bản quyền cộng đồng đã qua kiểm định pháp lý.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-2">
            <Sparkles className="w-5 h-5 text-brand-600 mr-2" />
            3. Trải nghiệm người đọc là trung tâm
          </h2>
          <p>
            Website được thiết kế tinh giản, không cài cắm quảng cáo phản cảm, hỗ trợ đầy đủ chế độ đọc đêm (Dark mode) và chế độ giấy vàng cổ điển (Sepia) giúp bảo vệ thị lực trong suốt thời gian đọc sách kéo dài.
          </p>
        </div>
      </div>
    </div>
  );
};
