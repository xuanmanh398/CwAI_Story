import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export const TermsPage: React.FC = () => {
  const { config } = useConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Điều khoản sử dụng dịch vụ</h1>
      <p className="text-xs text-gray-400">Cập nhật lần cuối: Tháng 10/2024</p>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm space-y-6">
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">1. Chấp thuận các điều khoản</h2>
          <p>
            Bằng việc truy cập hoặc sử dụng website {config.siteName}, bạn đồng ý tuân thủ các quy định và điều khoản được nêu tại văn bản này. Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng dịch vụ.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">2. Quyền sở hữu trí tuệ</h2>
          <p>
            Toàn bộ nội dung văn bản, giao diện đồ họa, mã nguồn và dữ liệu trên {config.siteName} được bảo vệ bởi pháp luật về sở hữu trí tuệ Việt Nam và các điều ước quốc tế. Nghiêm cấm mọi hành vi trích xuất tự động (cào dữ liệu/scraping), sao chép thương mại hoặc tái xuất bản khi chưa có văn bản chấp thuận.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">3. Trách nhiệm tài khoản độc giả</h2>
          <p>
            Độc giả có trách nhiệm bảo mật thông tin đăng nhập và mật khẩu cá nhân. Mọi hành động phát sinh từ tài khoản của bạn sẽ thuộc trách nhiệm của chủ sở hữu tài khoản đó.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">4. Hành vi nghiêm cấm</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tấn công từ chối dịch vụ (DDoS) hoặc can thiệp vào máy chủ và cơ sở dữ liệu.</li>
            <li>Sử dụng bot hoặc công cụ quét tự động để tải hàng loạt chương truyện.</li>
            <li>Phát tán nội dung vi phạm thuần phong mỹ tục hoặc pháp luật hiện hành.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};
