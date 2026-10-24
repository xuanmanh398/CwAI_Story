import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { BookOpen, ShieldCheck, Mail, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  const { config } = useConfig();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-neutral-900 border-t border-gray-200 dark:border-neutral-800 mt-16 text-sm text-gray-600 dark:text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Cột 1: Thông tin thương hiệu */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 font-bold text-lg text-gray-900 dark:text-white">
              <span className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </span>
              <span>{config.siteName}</span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-neutral-400">
              {config.siteDescription}. Tuyển tập tác phẩm tự sáng tác và nguồn cấp phép minh bạch, tôn trọng quyền tác giả.
            </p>
          </div>

          {/* Cột 2: Điều hướng */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Khám phá
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/books" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Tất cả truyện
                </Link>
              </li>
              <li>
                <Link to="/books?status=completed" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Truyện đã hoàn thành
                </Link>
              </li>
              <li>
                <Link to="/books?sort=newest" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Truyện mới đăng
                </Link>
              </li>
              <li>
                <Link to="/tu-sach" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Tủ sách yêu thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 3: Chính sách & Pháp lý */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Chính sách & Quy định
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/gioi-thieu" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Giới thiệu nền tảng
                </Link>
              </li>
              <li>
                <Link to="/dieu-khoan" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link to="/chinh-sach-bao-mat" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                  Chính sách quyền riêng tư
                </Link>
              </li>
              <li>
                <Link to="/chinh-sach-ban-quyen" className="hover:text-brand-600 dark:hover:text-brand-400 transition flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                  Chính sách bản quyền
                </Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Hỗ trợ & Bản quyền */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-xs uppercase tracking-wider">
              Hỗ trợ tác giả
            </h4>
            <p className="text-xs text-gray-500 dark:text-neutral-400 mb-2">
              Nếu bạn là tác giả hoặc đại diện pháp lý phát hiện nội dung cần rà soát:
            </p>
            <Link
              to="/bao-cao-vi-pham"
              className="inline-flex items-center text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline mb-2"
            >
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
              Gửi yêu cầu gỡ bỏ nội dung
            </Link>
            <div className="pt-2">
              <Link to="/lien-he" className="flex items-center text-xs text-brand-600 dark:text-brand-400 hover:underline">
                <Mail className="w-3.5 h-3.5 mr-1" />
                Liên hệ ban quản trị
              </Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 dark:border-neutral-800 text-center text-xs text-gray-400">
          <p>© {currentYear} {config.siteName}. Vận hành trên nền tảng Cloudflare Edge & D1 Database.</p>
          <p className="mt-1">
            Nội dung tác phẩm thuộc bản quyền của các tác giả và đơn vị cấp phép tương ứng. Nghiêm cấm mọi hành vi tự ý sao chép.
          </p>
        </div>
      </div>
    </footer>
  );
};
