import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { BookOpen, Lock, User, Mail, AlertCircle, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { config } = useConfig();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // OTP Step State
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otpCode, setOtpCode] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username.length < 3) {
      setError('Tên đăng nhập phải có ít nhất 3 ký tự');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới');
      return;
    }
    if (!email.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }
    if (password !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.otpCode) setDevOtpHint(data.otpCode);
        setStep('otp');
      } else {
        setError(data.error || 'Đăng ký không thành công');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.trim().length !== 6) {
      setOtpError('Vui lòng nhập đúng mã OTP gồm 6 chữ số');
      return;
    }

    setOtpError(null);
    setOtpSubmitting(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpCode.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setOtpSuccess(true);
        if (refreshUser) await refreshUser();
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setOtpError(data.error || 'Mã OTP không chính xác hoặc đã hết hạn');
      }
    } catch {
      setOtpError('Lỗi kết nối máy chủ');
    } finally {
      setOtpSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError(null);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.otpCode) setDevOtpHint(data.otpCode);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setOtpError(data.error || 'Không thể gửi lại mã OTP');
      }
    } catch {
      setOtpError('Lỗi kết nối');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl p-8 border border-gray-200 dark:border-neutral-700 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md">
            {step === 'register' ? <BookOpen className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'register' ? 'Tạo tài khoản mới' : 'Xác thực mã OTP'}
          </h1>
          <p className="text-xs text-gray-500">
            {step === 'register'
              ? `Tham gia cộng đồng đọc truyện tại ${config.siteName}`
              : `Mã OTP 6 số đã được gửi tới email ${email}`}
          </p>
        </div>

        {step === 'register' ? (
          <>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Tên đăng nhập (Username)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: docgia_99"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Địa chỉ Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Mật khẩu (từ 8 ký tự)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập ít nhất 8 ký tự..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Đang tạo tài khoản...' : 'Tiếp tục nhận mã OTP'}
              </button>
            </form>

            <div className="text-center text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-neutral-700">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-semibold text-brand-600 hover:underline">
                Đăng nhập ngay
              </Link>
            </div>
          </>
        ) : (
          /* Step OTP */
          <div className="space-y-5">
            {otpError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            {otpSuccess ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h3 className="font-bold text-gray-900 dark:text-white">Kích hoạt tài khoản thành công!</h3>
                <p className="text-xs text-gray-500">Đang chuyển bạn vào trang chủ...</p>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 text-center uppercase tracking-wider mb-2">
                    Nhập mã OTP (6 số)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="------"
                    className="w-full text-center tracking-[12px] text-2xl font-extrabold py-3 rounded-2xl border-2 border-brand-500 bg-gray-50 dark:bg-neutral-900 text-brand-700 dark:text-brand-300 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
                  />
                </div>

                {devOtpHint && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 text-center">
                    Mã OTP thử nghiệm nhanh: <strong>{devOtpHint}</strong>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={otpSubmitting || otpCode.length !== 6}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition shadow-md disabled:opacity-50"
                >
                  {otpSubmitting ? 'Đang xác thực...' : 'Xác thực OTP & Đăng nhập'}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep('register')}
                    className="text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  >
                    Đổi thông tin đăng ký
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-brand-600 font-semibold hover:underline disabled:opacity-50 flex items-center"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1" />
                    {resendCooldown > 0 ? `Gửi lại sau (${resendCooldown}s)` : 'Gửi lại mã OTP'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
