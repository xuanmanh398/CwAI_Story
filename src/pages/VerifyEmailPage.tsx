import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMessage('Mã xác thực email không hợp lệ hoặc thiếu.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setSuccess(true);
          setMessage(json.message || 'Xác thực email thành công!');
          if (refreshUser) refreshUser();
        } else {
          setSuccess(false);
          setMessage(json.error || 'Xác thực email thất bại hoặc liên kết đã hết hạn.');
        }
      })
      .catch(() => {
        setSuccess(false);
        setMessage('Không thể kết nối máy chủ để xác thực email.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-gray-200 dark:border-neutral-700 shadow-lg text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md">
          <Mail className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xác thực Địa chỉ Email</h1>

        {loading ? (
          <div className="py-6 space-y-3">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-gray-500">Đang kiểm tra và kích hoạt tài khoản...</p>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                Xác thực thành công!
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow-sm"
              >
                <span>Bắt đầu đọc truyện ngay</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">Xác thực không thành công</h2>
              <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
            </div>
            <div className="pt-2">
              <Link
                to="/login"
                className="w-full inline-block py-2.5 rounded-xl bg-gray-100 dark:bg-neutral-700 text-gray-800 dark:text-neutral-200 font-semibold text-sm hover:bg-gray-200 transition"
              >
                Quay lại trang Đăng nhập
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
