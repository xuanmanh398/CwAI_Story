import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Coins, QrCode, CheckCircle2, History, ArrowRight, ShieldCheck, Copy, Sparkles } from 'lucide-react';

interface TopupPackage {
  id: string;
  vnd: number;
  coins: number;
  bonus: number;
  badge?: string;
}

const TOPUP_PACKAGES: TopupPackage[] = [
  { id: 'p20', vnd: 20000, coins: 20, bonus: 0 },
  { id: 'p50', vnd: 50000, coins: 52, bonus: 2, badge: 'Phổ biến' },
  { id: 'p100', vnd: 100000, coins: 110, bonus: 10, badge: 'Tặng 10%' },
  { id: 'p200', vnd: 200000, coins: 230, bonus: 30, badge: 'Tặng 15%' },
  { id: 'p500', vnd: 500000, coins: 600, bonus: 100, badge: 'Siêu ưu đãi' },
];

export const TopupPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<TopupPackage>(TOPUP_PACKAGES[1]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const bankName = 'MB Bank (Quân Đội)';
  const accountNumber = '0338988636';
  const accountHolder = 'TRUYEN NHA';
  const transferContent = `TN ${user?.username || 'DOCGIA'}`;

  const qrUrl = `https://img.vietqr.io/image/MB-0338988636-compact2.png?amount=${selectedPackage.vnd}&addInfo=${encodeURIComponent(
    transferContent
  )}&accountName=${encodeURIComponent(accountHolder)}`;

  const loadTransactions = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/wallet/transactions', { credentials: 'include' });
      const json = await res.json() as any;
      if (json.success) setTransactions(json.data || []);
    } catch {}
  };

  useEffect(() => {
    loadTransactions();
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmTopup = async () => {
    if (!user) return;
    setLoading(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/wallet/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amountVnd: selectedPackage.vnd,
          coins: selectedPackage.coins,
          transferCode: transferContent,
        }),
      });
      const data = await res.json() as any;

      if (res.ok && data.success) {
        setSuccessMessage(`Đã nạp thành công ${selectedPackage.coins} xu vào tài khoản!`);
        if (refreshUser) await refreshUser();
        await loadTransactions();
      } else {
        alert(data.error || 'Nạp xu thất bại');
      }
    } catch {
      alert('Không thể kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white dark:bg-neutral-800 rounded-3xl text-center space-y-4 shadow-lg border border-gray-100 dark:border-neutral-700">
        <Coins className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bạn cần đăng nhập</h2>
        <p className="text-xs text-gray-500">Vui lòng đăng nhập tài khoản để nạp xu và mở khóa các chương truyện.</p>
        <Link
          to="/login?redirect=/nap-xu"
          className="inline-block px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">
            <Coins className="w-3.5 h-3.5 mr-1" />
            Ví xu Truyện Nhà
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Nạp Xu Đọc Truyện</h1>
          <p className="text-amber-100 text-xs sm:text-sm max-w-md leading-relaxed">
            Nạp xu để mở khóa toàn bộ tác phẩm có phí, ủng hộ tác giả sáng tác và trải nghiệm nội dung không giới hạn.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 text-center sm:text-right flex-shrink-0">
          <span className="text-xs text-amber-200 block">Số dư hiện tại</span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1 flex items-center justify-center sm:justify-end">
            <span className="text-amber-300 mr-2">🪙</span>
            <span>{(user.coins || 0).toLocaleString('vi-VN')}</span>
            <span className="text-sm font-medium ml-1.5 opacity-80">xu</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center text-xs text-emerald-700 dark:text-emerald-300 space-x-3 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Chọn gói & Mã QR chuyển khoản */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Cột 1: Danh sách các gói nạp */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
            <span>1. Chọn gói nạp xu</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TOPUP_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-4 rounded-2xl border-2 text-left transition ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 shadow-md ring-2 ring-brand-500/20'
                      : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-gray-300'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black text-brand-600 dark:text-brand-400">
                      🪙 {pkg.coins} xu
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                    {pkg.vnd.toLocaleString('vi-VN')} đ
                  </div>
                  {pkg.bonus > 0 && (
                    <span className="inline-block mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{pkg.bonus} xu tặng thêm
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hướng dẫn thanh toán */}
          <div className="p-4 bg-gray-50 dark:bg-neutral-800/60 rounded-2xl border border-gray-200 dark:border-neutral-700 space-y-2 text-xs text-gray-600 dark:text-neutral-300">
            <div className="flex items-center space-x-1.5 font-bold text-gray-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Chính sách nạp xu minh bạch</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-gray-500 dark:text-neutral-400">
              <li>Xu được cộng tự động và không có thời hạn sử dụng.</li>
              <li>Mỗi lượt mở khóa truyện sẽ trích <strong>85%</strong> doanh thu trực tiếp cho Tác giả tác phẩm.</li>
              <li>Hỗ trợ chuyển khoản nhanh 24/7 qua mã VietQR liên ngân hàng.</li>
            </ul>
          </div>
        </div>

        {/* Cột 2: Mã QR Thanh toán */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-800 p-6 rounded-3xl border border-gray-200 dark:border-neutral-700 shadow-md space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center justify-between">
              <span>2. Quét mã VietQR</span>
              <span className="text-xs text-brand-600 font-semibold">{selectedPackage.vnd.toLocaleString('vi-VN')} đ</span>
            </h2>

            <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-center border border-gray-100 dark:border-neutral-700">
              <img
                src={qrUrl}
                alt="Mã QR nạp xu"
                className="w-56 h-auto rounded-xl shadow-sm border border-gray-200 dark:border-neutral-800"
              />
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-neutral-700">
                <span className="text-gray-400">Ngân hàng</span>
                <span className="font-semibold text-gray-800 dark:text-neutral-200">{bankName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-neutral-700">
                <span className="text-gray-400">Số tài khoản</span>
                <button
                  onClick={() => copyToClipboard(accountNumber)}
                  className="font-bold text-brand-600 flex items-center hover:underline"
                >
                  <span>{accountNumber}</span>
                  <Copy className="w-3 h-3 ml-1" />
                </button>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-neutral-700">
                <span className="text-gray-400">Nội dung CK</span>
                <button
                  onClick={() => copyToClipboard(transferContent)}
                  className="font-bold text-rose-600 flex items-center hover:underline"
                >
                  <span>{transferContent}</span>
                  <Copy className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>

            {copied && (
              <p className="text-center text-[11px] font-semibold text-emerald-600">Đã sao chép vào bộ nhớ tạm!</p>
            )}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirmTopup}
            className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{loading ? 'Đang xác thực...' : 'Xác nhận Nạp Ngay (Cộng Xu)'}</span>
          </button>
        </div>
      </div>

      {/* Lịch sử giao dịch ví */}
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-200 dark:border-neutral-700 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center">
          <History className="w-4 h-4 mr-2 text-gray-500" />
          Lịch sử biến động xu
        </h3>

        {transactions.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-neutral-700 text-xs">
            {transactions.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-neutral-200">{tx.description}</p>
                  <span className="text-[11px] text-gray-400">{new Date(tx.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div
                  className={`font-bold text-sm ${
                    tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} xu
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">Chưa có giao dịch nào gần đây.</p>
        )}
      </div>
    </div>
  );
};
