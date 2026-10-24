import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export const PrivacyPage: React.FC = () => {
  const { config } = useConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Chính sách quyền riêng tư</h1>
      <p className="text-xs text-gray-400">Cập nhật lần cuối: Tháng 10/2024</p>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm space-y-6">
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">1. Thông tin chúng tôi thu thập</h2>
          <p>
            Chúng tôi chỉ thu thập các thông tin tối thiểu cần thiết để vận hành dịch vụ:
          </p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Tên đăng nhập và địa chỉ email khi bạn đăng ký tài khoản.</li>
            <li>Lịch sử đọc và danh sách truyện yêu thích để đồng bộ trải nghiệm của bạn.</li>
            <li>Thông tin kỹ thuật cơ bản (IP ẩn danh, loại trình duyệt) phục vụ bảo mật và ngăn ngừa gian lận.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">2. Cách thức bảo mật mật khẩu</h2>
          <p>
            Mật khẩu của bạn được mã hóa một chiều bằng thuật toán PBKDF2-HMAC-SHA256 với 100,000 vòng lặp và muối (salt) ngẫu nhiên. Chúng tôi tuyệt đối không lưu trữ mật khẩu dạng văn bản rõ (plaintext).
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">3. Cookie và Phiên làm việc</h2>
          <p>
            {config.siteName} sử dụng cookie HttpOnly và Secure để duy trì phiên đăng nhập an toàn, ngăn chặn việc rò rỉ session token qua JavaScript độc hại (XSS). Chúng tôi không chia sẻ cookie này cho bất kỳ bên thứ ba nào.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">4. Dịch vụ quảng cáo của bên thứ ba (Google AdSense)</h2>
          <p>
            Website có thể hiển thị quảng cáo từ Google AdSense. Google có thể sử dụng cookie (như DoubleClick cookie) để phân phát quảng cáo dựa trên các lượt truy cập trước đó của người dùng. Người dùng có thể tìm hiểu và chọn không tham gia quảng cáo được cá nhân hóa bằng cách truy cập Cài đặt quảng cáo của Google.
          </p>
        </section>
      </div>
    </div>
  );
};
