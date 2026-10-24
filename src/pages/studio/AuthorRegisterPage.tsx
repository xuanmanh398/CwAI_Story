import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Feather, CheckCircle, ShieldCheck, AlertCircle, Coins, CreditCard, AlertTriangle, ArrowRight, QrCode } from 'lucide-react';

export const AuthorRegisterPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [penName, setPenName] = useState(user?.username || '');
  const [fullName, setFullName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [bankName, setBankName] = useState('MB Bank');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bio, setBio] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const REGISTRATION_FEE_COINS = 100;
  const userCoins = user?.coins || 0;
  const hasEnoughCoins = userCoins >= REGISTRATION_FEE_COINS;

  const qrUrl = user
    ? `https://img.vietqr.io/image/MB-0338988636-compact2.png?amount=100000&addInfo=${encodeURIComponent(
        `TN ${user.username} TACGIA`
      )}&accountName=TRUYEN%20NHA`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      window.location.href = '/login?redirect=/dang-ky-tac-gia';
      return;
    }

    if (penName.trim().length < 2) {
      setError('Bút danh sáng tác phải có ít nhất 2 ký tự');
      return;
    }

    if (fullName.trim().length < 3) {
      setError('Vui lòng nhập Họ và tên đầy đủ (in hoa)');
      return;
    }

    if (!idCardNumber.trim() || idCardNumber.trim().length < 9) {
      setError('Vui lòng nhập số CCCD hợp lệ (9 đến 12 chữ số)');
      return;
    }

    if (!bankAccountNumber.trim() || bankAccountNumber.trim().length < 6) {
      setError('Vui lòng nhập số tài khoản hoặc số thẻ ngân hàng nhận tiền');
      return;
    }

    if (!agreed) {
      setError('Vui lòng đồng ý với Cam kết bản quyền và quy định sáng tác');
      return;
    }

    if (!hasEnoughCoins) {
      setError(`Số dư ví hiện tại (${userCoins} Xu) không đủ để thanh toán phí đăng ký (100 Xu ~ 100.000 VNĐ). Vui lòng nạp thêm Xu trước khi kích hoạt.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/studio/register-author', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          pen_name: penName.trim(),
          full_name: fullName.trim(),
          id_card_number: idCardNumber.trim(),
          bank_name: bankName.trim(),
          bank_account_number: bankAccountNumber.trim(),
          bio: bio.trim(),
        }),
      });

      const data = await res.json() as any;
      if (res.ok && data.success) {
        setSuccess(true);
        if (refreshUser) await refreshUser();
        setTimeout(() => {
          window.location.href = '/studio';
        }, 1500);
      } else {
        setError(data.error || 'Đăng ký tác giả không thành công. Vui lòng thử lại.');
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-brand-800 to-teal-900 text-white p-8 sm:p-10 shadow-xl">
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Coins className="w-3.5 h-3.5 mr-1" />
            Cộng đồng sáng tác Truyện Nhà
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Đăng ký trở thành Tác giả Sáng tác
          </h1>
          <p className="text-emerald-100 text-sm leading-relaxed max-w-xl">
            Tự do đăng tải tác phẩm, xây dựng lượng độc giả trung thành và khai thác doanh thu bản quyền minh bạch.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Feather className="w-80 h-80 -mr-12" />
        </div>
      </div>

      {/* Lợi ích khi trở thành tác giả (Đúng 3 thẻ theo yêu cầu) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center font-bold">
            <Feather className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Toàn quyền sáng tác</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Tạo truyện, thêm chương, quản lý bản thảo và xuất bản truyện theo tiến độ của bạn.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
            <Coins className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-amber-900 dark:text-amber-200">Chia sẻ Doanh thu</h3>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
            Tự đặt giá bán truyện & chương miễn phí. Tác giả nhận 85%, Nhà phát hành 15% phí nền tảng.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-950/40 text-brand-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-gray-900 dark:text-white">Bảo hộ bản quyền</h3>
          <p className="text-xs text-gray-500 leading-relaxed">
            Hồ sơ tác quyền minh bạch, chống sao chép trái phép và hỗ trợ xử lý vi phạm DMCA.
          </p>
        </div>
      </div>

      {/* Form đăng ký */}
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-neutral-700 pb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Thông tin Định danh Tác giả (KYC)
          </h2>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
            Phí đăng ký: 100.000 VNĐ (100 Xu)
          </span>
        </div>

        {!user ? (
          <div className="text-center py-8 space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-bold text-gray-900 dark:text-white">Bạn cần đăng nhập tài khoản</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Vui lòng đăng nhập hoặc tạo tài khoản miễn phí trên Truyện Nhà trước khi hoàn tất đăng ký làm tác giả.
            </p>
            <div className="pt-2">
              <Link
                to="/login?redirect=/dang-ky-tac-gia"
                className="inline-flex items-center px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow transition"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Đăng ký thành công!</h3>
            <p className="text-xs text-gray-500">
              Chào mừng bạn đến với Không gian sáng tác. Đang chuyển hướng bạn tới Studio...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-medium border border-rose-200 dark:border-rose-900">
                {error}
              </div>
            )}

            {/* Cảnh báo bắt buộc đồng nhất họ tên và CCCD */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="flex items-center font-bold space-x-1.5 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>LƯU Ý QUAN TRỌNG VỀ ĐỊNH DANH TÁC GIẢ:</span>
              </div>
              <p className="leading-relaxed">
                <strong>Họ tên đầy đủ</strong>, <strong>tên trên thẻ CCCD</strong> và <strong>tên chủ tài khoản ngân hàng nhận tiền PHẢI GIỐNG NHAU HOÀN TOÀN</strong>. Điều này nhằm bảo vệ quyền tác giả, chống giả mạo danh tính và phục vụ việc giải ngân doanh thu tác phẩm chính xác 100%.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Bút danh sáng tác <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={penName}
                  onChange={(e) => setPenName(e.target.value)}
                  placeholder="Ví dụ: Dạ Nguyệt, Nam Cung Kiếm..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
                <p className="text-[11px] text-gray-400 mt-1">Tên này hiển thị công khai trên truyện.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Họ và tên đầy đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: NGUYỄN VĂN AN"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                />
                <p className="text-[11px] text-gray-400 mt-1">Phải trùng với tên trên thẻ CCCD & tài khoản ngân hàng.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Số CCCD / CMND <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="12 chữ số CCCD..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Tên Ngân hàng nhận tiền <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Ví dụ: MB Bank, VCB, Techcombank..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                  Số thẻ / STK Ngân hàng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value.trim())}
                  placeholder="Nhập số tài khoản..."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
                Giới thiệu ngắn về tác giả / Phong cách sáng tác
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Chia sẻ đôi nét về sở trường thể loại (Tiên hiệp, Đô thị...) hoặc phong cách kể chuyện của bạn..."
                className="w-full px-4 py-2.5 rounded-xl text-sm bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>

            {/* Khung thanh toán phí đăng ký 100k */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-gray-800 dark:text-neutral-200">
                  Phí kích hoạt tư cách Tác giả:
                </span>
                <strong className="text-amber-600 text-sm">100.000 VNĐ (100 Xu)</strong>
              </div>

              <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200/60 dark:border-neutral-800 text-gray-600 dark:text-neutral-400">
                <span>Số dư ví hiện tại của bạn:</span>
                <span className={`font-bold ${hasEnoughCoins ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {userCoins} Xu {hasEnoughCoins ? '✓ Đủ điều kiện thanh toán' : `(Thiếu ${REGISTRATION_FEE_COINS - userCoins} Xu)`}
                </span>
              </div>

              {!hasEnoughCoins && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs space-y-3">
                  <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 font-bold">
                    <QrCode className="w-4 h-4 text-amber-600" />
                    <span>Quét mã VietQR nạp 100.000 VNĐ (100 Xu) vào tài khoản:</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <img
                      src={qrUrl}
                      alt="VietQR 100k"
                      className="w-36 h-36 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white p-1 shrink-0"
                    />
                    <div className="space-y-1 text-[11px] text-gray-600 dark:text-neutral-300">
                      <div>Ngân hàng: <strong>MB Bank (Quân Đội)</strong></div>
                      <div>Số TK: <strong className="font-mono text-gray-900 dark:text-white">0338988636</strong></div>
                      <div>Chủ TK: <strong>TRUYEN NHA</strong></div>
                      <div>Số tiền: <strong className="text-amber-600 font-bold">100.000 VNĐ</strong></div>
                      <div>Nội dung: <strong className="font-mono text-emerald-600">TN {user.username} TACGIA</strong></div>
                      <p className="text-[10px] text-gray-400 pt-1">
                        Sau khi chuyển khoản xong, vui lòng chờ 1-2 phút hoặc{' '}
                        <Link to="/nap-xu" className="text-brand-600 hover:underline font-bold">
                          vào trang Nạp Xu →
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Thỏa thuận phân chia doanh thu */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-bold text-xs">
                <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Thỏa thuận phân chia doanh thu & Cơ chế trả thưởng:</span>
              </div>
              <ul className="text-xs text-amber-800/90 dark:text-amber-300/90 space-y-1.5 list-disc pl-5 leading-relaxed">
                <li>
                  <strong>Tác giả hưởng 85% doanh thu</strong> từ mỗi lượt mở khóa truyện/chương trả phí của bạn.
                </li>
                <li>
                  <strong>Nhà phát hành (Truyện Nhà) trích giữ 15% phí nền tảng</strong> nhằm chi trả hạ tầng máy chủ, thanh toán ngân hàng và bảo hộ bản quyền tác phẩm.
                </li>
                <li>
                  Tác giả toàn quyền cài đặt giá tác phẩm (Xu) và số chương đọc thử miễn phí.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-neutral-700">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-gray-600 dark:text-neutral-300 leading-relaxed">
                  Tôi cam kết thông tin họ tên, CCCD và tài khoản ngân hàng trên là chính xác và trùng khớp. Tôi đồng ý thanh toán 100 Xu phí kích hoạt Tác giả, tuân thủ{' '}
                  <Link to="/dieu-khoan" className="text-brand-600 hover:underline">Điều khoản dịch vụ</Link> và{' '}
                  <Link to="/chinh-sach-ban-quyen" className="text-brand-600 hover:underline">Chính sách bản quyền</Link> của Truyện Nhà.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || !hasEnoughCoins}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Feather className="w-4 h-4" />
              <span>
                {loading
                  ? 'Đang thanh toán & kích hoạt...'
                  : hasEnoughCoins
                  ? 'Thanh toán 100 Xu & Kích hoạt Tác giả'
                  : `Cần nạp thêm ${REGISTRATION_FEE_COINS - userCoins} Xu để đăng ký`}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthorRegisterPage;
