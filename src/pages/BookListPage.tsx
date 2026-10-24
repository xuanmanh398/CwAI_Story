import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookCard, BookCardProps } from '../components/common/BookCard';
import { BookCardSkeleton } from '../components/common/Skeleton';
import { Pagination } from '../components/common/Pagination';
import { AdSlot } from '../components/common/AdSlot';
import { Filter, Layers, Lock, Sparkles, Trophy, Eye, Flame, ArrowRight } from 'lucide-react';

interface Genre {
  id: string;
  name: string;
  slug: string;
}

export const BookListPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState<BookCardProps[]>([]);
  const [rankingBooks, setRankingBooks] = useState<BookCardProps[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLocked18Plus, setIsLocked18Plus] = useState(false);
  const [show18PlusModal, setShow18PlusModal] = useState(false);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const selectedGenre = searchParams.get('genre') || '';
  const selectedStatus = searchParams.get('status') || '';
  const selectedSort = searchParams.get('sort') || 'updated';

  const isPremium = user && (user.is_premium === 1 || user.role === 'admin');
  const is18PlusView = selectedGenre === '18-plus';
  const currentGenreObj = genres.find((g) => g.slug === selectedGenre);

  // Lấy danh sách thể loại
  useEffect(() => {
    fetch('/api/genres')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setGenres(json.data || []);
      })
      .catch(() => {});
  }, []);

  // Lấy danh sách truyện theo query params
  useEffect(() => {
    setLoading(true);
    setIsLocked18Plus(false);

    // Kiểm tra bảo vệ client nếu truy cập 18+ mà không có quyền
    if (selectedGenre === '18-plus' && !isPremium) {
      setBooks([]);
      setTotalPages(1);
      setTotalCount(0);
      setIsLocked18Plus(true);
      setLoading(false);
      return;
    }

    const query = new URLSearchParams({
      page: currentPage.toString(),
      limit: '12',
      sort: selectedSort,
    });
    if (selectedGenre) query.set('genre', selectedGenre);
    if (selectedStatus) query.set('status', selectedStatus);

    fetch(`/api/books?${query.toString()}`, { credentials: 'include' })
      .then((res) => {
        if (res.status === 403) {
          setIsLocked18Plus(true);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json && json.success) {
          setBooks(json.data || []);
          setTotalPages(json.meta?.totalPages || 1);
          setTotalCount(json.meta?.total || 0);
        } else if (json && json.requires_premium) {
          setIsLocked18Plus(true);
          setBooks([]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPage, selectedGenre, selectedStatus, selectedSort, isPremium]);

  // Lấy dữ liệu Bảng Xếp Hạng (Lượt đọc cao -> thấp)
  useEffect(() => {
    // Nếu là danh mục 18+ mà chưa mở khóa -> không tải ranking 18+
    if (selectedGenre === '18-plus' && !isPremium) {
      setRankingBooks([]);
      return;
    }

    setLoadingRanking(true);
    const rankingQuery = new URLSearchParams({
      limit: '10',
      sort: 'views',
    });
    if (selectedGenre) {
      rankingQuery.set('genre', selectedGenre);
    }

    fetch(`/api/books?${rankingQuery.toString()}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (json && json.success) {
          setRankingBooks(json.data || []);
        } else {
          setRankingBooks([]);
        }
      })
      .catch(() => setRankingBooks([]))
      .finally(() => setLoadingRanking(false));
  }, [selectedGenre, isPremium]);

  const updateParam = (key: string, value: string) => {
    if (key === 'genre' && value === '18-plus' && !isPremium) {
      setShow18PlusModal(true);
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // Reset về trang 1 khi lọc
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', newPage.toString());
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Tiêu đề & Bộ lọc */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Layers className="w-6 h-6 mr-2 text-brand-600" />
            Danh mục truyện
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            {isLocked18Plus
              ? 'Mục truyện giới hạn 18+ dành riêng cho thành viên Premium'
              : `Hiển thị ${totalCount} tác phẩm được tuyển chọn và cấp phép`}
          </p>
        </div>

        {/* Filters bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Trạng thái */}
          <select
            value={selectedStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 focus:outline-none focus:border-brand-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ongoing">Đang tiến hành</option>
            <option value="completed">Đã hoàn thành</option>
          </select>

          {/* Sắp xếp */}
          <select
            value={selectedSort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="text-xs py-2 px-3 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-neutral-200 focus:outline-none focus:border-brand-500"
          >
            <option value="updated">Mới cập nhật</option>
            <option value="newest">Mới đăng</option>
            <option value="views">Lượt xem nhiều</option>
            <option value="title">Tên truyện (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Dải Thể loại (Category Chips) Chuyển toàn bộ Thể loại vào đây */}
      <div className="flex flex-wrap gap-2 pt-1 pb-2">
        <button
          onClick={() => updateParam('genre', '')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
            !selectedGenre
              ? 'bg-brand-600 text-white shadow-brand-500/20'
              : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-brand-500'
          }`}
        >
          Tất cả thể loại
        </button>

        {genres.map((g) => {
          const is18 = g.slug === '18-plus' || g.name.includes('18');
          const isSelected = selectedGenre === g.slug;

          return (
            <button
              key={g.id}
              onClick={() => updateParam('genre', g.slug)}
              className={`inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                isSelected
                  ? is18
                    ? 'bg-rose-600 text-white'
                    : 'bg-brand-600 text-white shadow-brand-500/20'
                  : is18
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                  : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-neutral-700 hover:border-brand-500'
              }`}
            >
              <span>{is18 ? '18+' : g.name}</span>
              {is18 && <Lock className="w-3 h-3 ml-1 text-rose-500" />}
            </button>
          );
        })}
      </div>

      <AdSlot slotType="top" />

      {/* Khối chính: Danh sách truyện + Bảng Xếp Hạng */}
      {isLocked18Plus ? (
        <div className="text-center py-20 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/50 p-8 space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Danh mục 18+ Giới hạn truy cập
          </h2>
          <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed max-w-lg mx-auto">
            Các tác phẩm trong danh mục 18+ chỉ dành cho độc giả trưởng thành và độc quyền cho tài khoản thành viên <strong>Premium</strong> hoặc Quản trị viên.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            {!user ? (
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow transition"
              >
                Đăng nhập tài khoản
              </Link>
            ) : (
              <button
                onClick={() => updateParam('genre', '')}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow transition"
              >
                Xem các thể loại khác
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (8/12): DANH SÁCH TRUYỆN */}
          <div className="lg:col-span-8 space-y-6">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <BookCardSkeleton key={i} />
                ))}
              </div>
            ) : books.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {books.map((b) => (
                    <BookCard key={b.id} book={b} />
                  ))}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-neutral-800/40 rounded-xl border border-gray-100 dark:border-neutral-800">
                <Filter className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Không tìm thấy truyện phù hợp</h3>
                <p className="text-xs text-gray-500 mt-1">Hãy thử thay đổi điều kiện lọc hoặc thể loại</p>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (4/12): BẢNG XẾP HẠNG (NẾU Ở MỤC 18+ THÌ CHỈ CÓ TRUYỆN 18+) */}
          <aside
            className={`lg:col-span-4 rounded-2xl p-5 border shadow-sm space-y-4 ${
              is18PlusView
                ? 'bg-rose-50/20 dark:bg-neutral-800/90 border-rose-200/70 dark:border-rose-900/40'
                : 'bg-white dark:bg-neutral-800/90 border-gray-200/80 dark:border-neutral-700/60'
            }`}
          >
            {/* Header BXH */}
            <div
              className={`flex items-center justify-between pb-3 border-b ${
                is18PlusView
                  ? 'border-rose-200/60 dark:border-rose-900/40'
                  : 'border-gray-100 dark:border-neutral-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span
                  className={`p-2 rounded-xl ${
                    is18PlusView
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {is18PlusView ? <Flame className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center space-x-1.5">
                    <span>
                      {is18PlusView
                        ? 'Bảng Xếp Hạng 18+'
                        : currentGenreObj
                        ? `BXH ${currentGenreObj.name}`
                        : 'Bảng Xếp Hạng'}
                    </span>
                    {is18PlusView && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                        18+
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                    {is18PlusView
                      ? 'Top truyện 18+ đọc nhiều nhất (Cao → Thấp)'
                      : 'Lượt đọc nhiều nhất (Cao → Thấp)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Danh sách truyện BXH */}
            <div className="space-y-2.5">
              {loadingRanking ? (
                <div className="space-y-3 py-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-3">
                      <div className="w-7 h-7 bg-gray-200 dark:bg-neutral-700 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 bg-gray-200 dark:bg-neutral-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 dark:bg-neutral-800 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : rankingBooks.length > 0 ? (
                rankingBooks.map((book, index) => {
                  const rank = index + 1;
                  const isTop1 = rank === 1;
                  const isTop2 = rank === 2;
                  const isTop3 = rank === 3;

                  return (
                    <div
                      key={book.id}
                      className={`group flex items-center justify-between p-2.5 rounded-xl transition duration-150 ${
                        isTop1
                          ? is18PlusView
                            ? 'bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent dark:from-rose-950/40 dark:to-neutral-800 border border-rose-300/60 dark:border-rose-700/50'
                            : 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:to-neutral-800 border border-amber-300/60 dark:border-amber-700/50'
                          : isTop2
                          ? 'bg-gray-50 dark:bg-neutral-800/60 border border-gray-200/60 dark:border-neutral-700/50'
                          : isTop3
                          ? 'bg-amber-50/40 dark:bg-neutral-800/40 border border-amber-900/10 dark:border-neutral-700/40'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-750'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        {/* Huy hiệu thứ hạng */}
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs ${
                            isTop1
                              ? is18PlusView
                                ? 'bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-rose-500/30 shadow'
                                : 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30 shadow'
                              : isTop2
                              ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white'
                              : isTop3
                              ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-white'
                              : 'bg-gray-100 dark:bg-neutral-700 text-gray-500 dark:text-neutral-400 text-xs font-bold'
                          }`}
                        >
                          {rank}
                        </span>

                        {/* Ảnh bìa nhỏ cho Top 3 */}
                        {rank <= 3 && (
                          <Link
                            to={`/books/${book.slug}`}
                            className="w-10 h-13 rounded-md overflow-hidden shrink-0 shadow-sm bg-gray-100 dark:bg-neutral-900"
                          >
                            <img
                              src={
                                book.cover_url ||
                                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80'
                              }
                              alt={book.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&auto=format&fit=crop&q=80';
                              }}
                            />
                          </Link>
                        )}

                        {/* Tiêu đề & Tác giả */}
                        <div className="min-w-0 flex-1">
                          <Link
                            to={`/books/${book.slug}`}
                            className={`font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate block ${
                              is18PlusView
                                ? 'group-hover:text-rose-600 dark:group-hover:text-rose-400'
                                : 'group-hover:text-brand-600 dark:group-hover:text-brand-400'
                            }`}
                            title={book.title}
                          >
                            {book.title}
                          </Link>
                          <div className="flex items-center text-[11px] text-gray-500 dark:text-neutral-400 space-x-1.5 mt-0.5">
                            <span className="truncate">{book.author_name || 'Khuyết danh'}</span>
                            {is18PlusView && (
                              <span className="text-[10px] font-bold px-1 rounded bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                                18+
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Số lượt đọc (Xếp cao -> thấp) */}
                      <div className="text-right shrink-0 pl-2">
                        <span
                          className={`inline-flex items-center font-extrabold text-xs ${
                            isTop1
                              ? is18PlusView
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                              : isTop2
                              ? 'text-slate-600 dark:text-slate-300'
                              : isTop3
                              ? 'text-amber-800 dark:text-amber-500'
                              : 'text-gray-600 dark:text-neutral-400'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 opacity-70" />
                          {(book.view_count || 0).toLocaleString('vi-VN')}
                        </span>
                        <span className="block text-[10px] text-gray-400">lượt đọc</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-neutral-500">
                  Chưa có dữ liệu xếp hạng
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      <AdSlot slotType="bottom" />

      {/* Modal 18+ Lock Popup */}
      {show18PlusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-rose-200 dark:border-rose-900 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Danh mục 18+ bị khóa</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300">
                  Dành riêng cho Premium
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-neutral-300 leading-relaxed">
              Khu vực truyện <strong>18+</strong> chứa các nội dung giới hạn theo độ tuổi và chỉ mở khóa đặc quyền cho thành viên <strong>Premium</strong> hoặc Quản trị viên.
            </p>

            <div className="bg-rose-50 dark:bg-rose-950/30 rounded-xl p-3 border border-rose-100 dark:border-rose-900/30 text-xs text-rose-800 dark:text-rose-300">
              💡 Hãy đăng nhập tài khoản có thẩm quyền hoặc nâng cấp tài khoản Premium để mở khóa toàn bộ kho nội dung độc quyền.
            </div>

            <div className="flex space-x-3 pt-2">
              {!user ? (
                <Link
                  to="/login"
                  onClick={() => setShow18PlusModal(false)}
                  className="flex-1 text-center py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow"
                >
                  Đăng nhập tài khoản
                </Link>
              ) : (
                <button
                  onClick={() => setShow18PlusModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow"
                >
                  Tôi đã hiểu
                </button>
              )}
              <button
                onClick={() => setShow18PlusModal(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 font-semibold text-sm transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
