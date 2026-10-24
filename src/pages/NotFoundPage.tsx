import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md space-y-4">
        <div className="text-7xl font-extrabold text-brand-600">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trang không tồn tại</h1>
        <p className="text-xs text-gray-500 leading-relaxed">
          Địa chỉ bạn truy cập có thể đã bị thay đổi, xóa bỏ hoặc tạm thời không khả dụng.
        </p>

        <div className="pt-4 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 shadow"
          >
            <Home className="w-4 h-4 mr-1.5" />
            Về trang chủ
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 text-xs font-semibold hover:bg-gray-50"
          >
            <Search className="w-4 h-4 mr-1.5" />
            Tìm kiếm truyện
          </Link>
        </div>
      </div>
    </div>
  );
};
