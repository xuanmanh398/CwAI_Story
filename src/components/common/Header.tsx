import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { useTheme } from '../../context/ThemeContext';
import {
  BookOpen,
  Search,
  Sun,
  Moon,
  Bookmark,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
  Feather,
  Lock,
  ChevronDown,
  Sparkles,
  Coins,
  Wallet,
} from 'lucide-react';

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export const Header: React.FC = () => {
  const { config } = useConfig();
  const { user, logout, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [show18PlusModal, setShow18PlusModal] = useState(false);
  const [unlocking18Plus, setUnlocking18Plus] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const handleUnlock18Plus = async () => {
    if (!user) return;
    setUnlocking18Plus(true);
    setUnlockMessage(null);
    try {
      const res = await fetch('/api/wallet/unlock-18plus', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        if (refreshUser) await refreshUser();
        setUnlockMessage(data.message || 'Mở khóa thành công!');
        setTimeout(() => {
          setShow18PlusModal(false);
          window.location.href = '/books?genre=18-plus';
        }, 1200);
      } else {
        alert(data.error || 'Mở khóa không thành công');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setUnlocking18Plus(false);
    }
  };
  const navigate = useNavigate();

  // Tải danh sách thể loại cho dropdown Danh mục
  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setGenres(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    window.location.href = '/';
  };

  const isStaff = user && (user.role === 'admin' || user.role === 'editor');
  const isAuthor = user && (user.is_author === 1 || isStaff);
  const isPremium = user && (user.is_premium === 1 || user.role === 'admin');

  const handleGenreClick = (e: React.MouseEvent, slug: string) => {
    if (slug === '18-plus' && !isPremium) {
      e.preventDefault();
      e.stopPropagation();
      setCategoryDropdownOpen(false);
      setMobileMenuOpen(false);
      setShow18PlusModal(true);
      return;
    }
    setCategoryDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-gray-200/80 dark:border-neutral-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2.5 font-bold text-xl text-gray-900 dark:text-white">
              <span className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm shadow-brand-600/30">
                <BookOpen className="w-5 h-5" />
              </span>
              <span className="tracking-tight">{config.siteName}</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium text-gray-600 dark:text-neutral-300">
              <Link to="/" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                Trang chủ
              </Link>

              {/* Danh mục Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setCategoryDropdownOpen(true)}
                onMouseLeave={() => setCategoryDropdownOpen(false)}
              >
                <button
                  onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  className="flex items-center hover:text-brand-600 dark:hover:text-brand-400 transition py-2"
                >
                  <span>Danh mục</span>
                  <ChevronDown className="w-4 h-4 ml-1 opacity-70" />
                </button>

                {categoryDropdownOpen && (
                  <div className="absolute left-0 mt-0 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-gray-100 dark:border-neutral-700 py-2 z-50 animate-in fade-in duration-150">
                    <Link
                      to="/books"
                      onClick={() => setCategoryDropdownOpen(false)}
                      className="block px-4 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-neutral-700/50 border-b border-gray-100 dark:border-neutral-700/50"
                    >
                      📚 Xem tất cả truyện ({genres.length} thể loại)
                    </Link>

                    <div className="grid grid-cols-2 gap-1 p-2">
                      {genres.map((g) => {
                        const is18 = g.slug === '18-plus' || g.name.includes('18');
                        return (
                          <Link
                            key={g.id}
                            to={`/books?genre=${g.slug}`}
                            onClick={(e) => handleGenreClick(e, g.slug)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition ${
                              is18
                                ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-50/60 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                : 'text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <span className="truncate">{is18 ? '18+' : g.name}</span>
                            {is18 && <Lock className="w-3 h-3 ml-1 text-rose-500 flex-shrink-0" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/tu-sach" className="flex items-center hover:text-brand-600 dark:hover:text-brand-400 transition">
                <Bookmark className="w-4 h-4 mr-1" />
                Tủ sách
              </Link>

              {/* Tác giả / Đăng truyện */}
              {isAuthor ? (
                <Link
                  to="/studio"
                  className="flex items-center text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 transition"
                >
                  <Feather className="w-4 h-4 mr-1 text-brand-500" />
                  Đăng truyện
                </Link>
              ) : (
                <Link
                  to="/dang-ky-tac-gia"
                  className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium hover:text-emerald-700 transition bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800"
                >
                  <Feather className="w-3.5 h-3.5 mr-1" />
                  Đăng ký viết truyện
                </Link>
              )}

              {/* Quản trị viên (Chỉ hiển thị cho tài khoản có vai trò admin) */}
              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="flex items-center text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 transition bg-amber-50 dark:bg-amber-950/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 shadow-sm"
                >
                  <Shield className="w-3.5 h-3.5 mr-1 text-amber-500" />
                  Quản trị
                </Link>
              )}
            </nav>

            {/* Search bar */}
            <div className="hidden lg:block flex-1 max-w-xs mx-6">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Tìm tên truyện, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-100 dark:bg-neutral-800 rounded-full border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-neutral-900 focus:outline-none transition"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </form>
            </div>

            {/* Right actions: Theme + User */}
            <div className="flex items-center space-x-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                title="Đổi giao diện sáng/tối"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User Dropdown or Login */}
              {user ? (
                <div className="flex items-center space-x-2">
                  {/* Coin Badge & Link to /nap-xu */}
                  <Link
                    to="/nap-xu"
                    className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-xs"
                    title="Số dư Xu - Bấm để Nạp thêm"
                  >
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{user.coins || 0}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">Xu</span>
                    <span className="w-3.5 h-3.5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-black leading-none">+</span>
                  </Link>

                  {/* Chuông Thông Báo */}
                  <NotificationBell />

                  <div className="relative">
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-sm">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-neutral-200">
                        {user.username}
                      </span>
                      {user.is_premium === 1 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-400/30">
                          PRO
                        </span>
                      )}
                    </button>

                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-100 dark:border-neutral-700 py-1 z-50 text-sm">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-700 text-xs text-gray-500 dark:text-neutral-400 space-y-1">
                          <div>Đăng nhập: <strong className="text-gray-900 dark:text-white">{user.username}</strong></div>
                          <div className="text-[11px] text-gray-400 truncate">{user.email}</div>
                          <div className="flex items-center justify-between pt-1 text-amber-600 dark:text-amber-400 font-semibold">
                            <span>Số dư ví:</span>
                            <Link to="/nap-xu" onClick={() => setUserDropdownOpen(false)} className="hover:underline flex items-center font-bold">
                              <Coins className="w-3 h-3 mr-1" />
                              {user.coins || 0} Xu (Nạp +)
                            </Link>
                          </div>
                          {isAuthor && (
                            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span>Thu nhập:</span>
                              <Link to="/studio" onClick={() => setUserDropdownOpen(false)} className="hover:underline font-bold">
                                {(user.author_earnings || 0).toLocaleString()}đ
                              </Link>
                            </div>
                          )}
                        </div>

                      <Link
                        to="/tu-sach"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-700"
                      >
                        <Bookmark className="w-4 h-4 mr-2 text-gray-400" />
                        Tủ sách & Lịch sử đọc
                      </Link>

                      <Link
                        to="/nap-xu"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center px-4 py-2 text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-neutral-700"
                      >
                        <Coins className="w-4 h-4 mr-2 text-amber-500" />
                        Nhật ký ví & Giao dịch
                      </Link>

                      {isAuthor ? (
                        <Link
                          to="/studio"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-brand-600 dark:text-brand-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700"
                        >
                          <Feather className="w-4 h-4 mr-2 text-brand-500" />
                          Không gian sáng tác
                        </Link>
                      ) : (
                        <Link
                          to="/dang-ky-tac-gia"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-emerald-600 dark:text-emerald-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700"
                        >
                          <Feather className="w-4 h-4 mr-2 text-emerald-500" />
                          Đăng ký làm Tác giả
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-brand-600 dark:text-brand-400 font-medium hover:bg-gray-50 dark:hover:bg-neutral-700"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Trang Quản trị
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-1.5 text-sm font-medium text-gray-700 dark:text-neutral-200 hover:text-brand-600 transition"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:inline-block px-3.5 py-1.5 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition shadow-sm"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile menu trigger */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden py-3 border-t border-gray-100 dark:border-neutral-800 space-y-2">
              <form onSubmit={handleSearchSubmit} className="relative mb-3">
                <input
                  type="text"
                  placeholder="Tìm truyện..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-neutral-800 rounded-lg border border-transparent focus:border-brand-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              </form>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Trang chủ
              </Link>
              <Link
                to="/books"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Danh mục truyện
              </Link>
              <Link
                to="/tu-sach"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-800"
              >
                Tủ sách & Lịch sử đọc
              </Link>

              {user && (
                <Link
                  to="/nap-xu"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-base font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100"
                >
                  <span className="flex items-center">
                    <Coins className="w-4 h-4 mr-2 text-amber-500" />
                    Nạp Xu & Số dư Ví
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white">
                    {user.coins || 0} Xu
                  </span>
                </Link>
              )}

              {isAuthor ? (
                <Link
                  to="/studio"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-neutral-800"
                >
                  ✍️ Không gian sáng tác
                </Link>
              ) : (
                <Link
                  to="/dang-ky-tac-gia"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-neutral-800"
                >
                  ✍️ Đăng ký viết truyện
                </Link>
              )}

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-neutral-800"
                >
                  Khu vực Quản trị
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modal Mở Khóa Danh Mục 18+ (50k/tháng) */}
      {show18PlusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-rose-200 dark:border-rose-900 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0 text-2xl">
                🔞
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mở khóa Danh mục 18+</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/30">
                  Gói VIP 50.000 VNĐ / tháng (50 Xu)
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
              Khu vực truyện <strong>18+</strong> chứa các tác phẩm giới hạn độ tuổi và độc quyền Premium. Chỉ với <strong>50.000 VNĐ / tháng (50 Xu)</strong>, bạn sẽ mở khóa không giới hạn toàn bộ danh mục 18+ và đọc mượt mà không quảng cáo.
            </p>

            {user && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs flex justify-between items-center">
                <span className="text-gray-600 dark:text-neutral-300">Số dư hiện tại của bạn:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {user.coins || 0} Xu
                </span>
              </div>
            )}

            {unlockMessage && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                {unlockMessage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
              {!user ? (
                <Link
                  to="/login?redirect=/books?genre=18-plus"
                  onClick={() => setShow18PlusModal(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow"
                >
                  Đăng nhập để mở khóa
                </Link>
              ) : (user.coins || 0) >= 50 ? (
                <button
                  disabled={unlocking18Plus}
                  onClick={handleUnlock18Plus}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition shadow disabled:opacity-50 flex items-center justify-center space-x-1"
                >
                  <Lock className="w-3.5 h-3.5 mr-1" />
                  <span>{unlocking18Plus ? 'Đang kích hoạt...' : 'Mở khóa 30 ngày (50 Xu)'}</span>
                </button>
              ) : (
                <Link
                  to="/nap-xu"
                  onClick={() => setShow18PlusModal(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition shadow"
                >
                  🪙 Nạp thêm Xu (Còn thiếu {50 - (user.coins || 0)} Xu)
                </Link>
              )}
              <button
                onClick={() => setShow18PlusModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 font-semibold text-xs transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
