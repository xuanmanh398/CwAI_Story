import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookCard, BookCardProps } from '../components/common/BookCard';
import { BookCardSkeleton } from '../components/common/Skeleton';
import { AdSlot } from '../components/common/AdSlot';
import {
  Sparkles,
  Clock,
  CheckCircle2,
  Flame,
  ArrowRight,
  BookOpen,
  Trophy,
  Eye,
  TrendingUp,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [recentBooks, setRecentBooks] = useState<BookCardProps[]>([]);
  const [rankingBooks, setRankingBooks] = useState<BookCardProps[]>([]);
  const [completedBooks, setCompletedBooks] = useState<BookCardProps[]>([]);
  const [filterType, setFilterType] = useState<'updated' | 'newest'>('updated');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [recentRes, rankingRes, completedRes] = await Promise.all([
          fetch(`/api/books?limit=12&sort=${filterType}`),
          fetch('/api/books?limit=10&sort=views'),
          fetch('/api/books?limit=4&status=completed'),
        ]);

        const [recentJson, rankingJson, completedJson] = await Promise.all([
          recentRes.json(),
          rankingRes.json(),
          completedRes.json(),
        ]);

        if (recentJson.success) setRecentBooks(recentJson.data || []);
        if (rankingJson.success) setRankingBooks(rankingJson.data || []);
        if (completedJson.success) setCompletedBooks(completedJson.data || []);
      } catch (err) {
        console.error('Lỗi tải dữ liệu trang chủ:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterType]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* Hero Banner Chào Mừng */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-800 via-brand-800 to-teal-900 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Nền tảng đọc truyện chữ bản quyền & sáng tác
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Thưởng thức từng trang chữ tinh tuyển
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
            Kho truyện chữ tự sáng tác và nguồn cấp phép minh bạch. Tối ưu trải nghiệm đọc mượt mà, không quảng cáo phản cảm, bảo vệ quyền tác giả.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to="/books"
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white text-brand-900 font-semibold text-sm hover:bg-emerald-50 transition shadow"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Khám phá danh mục
            </Link>
            <Link
              to="/chinh-sach-ban-quyen"
              className="inline-flex items-center px-4 py-2.5 rounded-xl bg-emerald-950/40 text-white border border-emerald-500/30 font-medium text-sm hover:bg-emerald-950/60 transition"
            >
              Chính sách bản quyền
            </Link>
          </div>
        </div>

        {/* Trang trí nền */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <BookOpen className="w-96 h-96 -mr-16" />
        </div>
      </section>

      {/* Quảng cáo Top */}
      <AdSlot slotType="top" />

      {/* KHỐI CHÍNH: TRUYỆN MỚI & BẢNG XẾP HẠNG LƯỢT ĐỌC (CAO -> THẤP) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CỘT TRÁI (8/12): DANH SÁCH TRUYỆN MỚI */}
        <section className="lg:col-span-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200/60 dark:border-neutral-800 gap-3">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400">
                <Clock className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center">
                  Truyện Mới
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  {filterType === 'updated'
                    ? 'Tác phẩm mới cập nhật chương gần đây'
                    : 'Tác phẩm mới ra mắt trên hệ thống'}
                </p>
              </div>
            </div>

            {/* Bộ chọn lọc tab: Mới cập nhật / Mới ra mắt */}
            <div className="flex items-center space-x-2">
              <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-neutral-800 border border-gray-200/80 dark:border-neutral-700 text-xs">
                <button
                  onClick={() => setFilterType('updated')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    filterType === 'updated'
                      ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-300 shadow-xs'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Mới cập nhật
                </button>
                <button
                  onClick={() => setFilterType('newest')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                    filterType === 'newest'
                      ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-brand-300 shadow-xs'
                      : 'text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Truyện mới đăng
                </button>
              </div>

              <Link
                to={`/books?sort=${filterType}`}
                className="hidden sm:inline-flex items-center text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline ml-2"
              >
                Tất cả <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <BookCardSkeleton key={i} />)
              : recentBooks.map((book) => <BookCard key={book.id} book={book} />)}
          </div>

          <div className="text-center pt-2 sm:hidden">
            <Link
              to={`/books?sort=${filterType}`}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 text-xs font-semibold text-gray-700 dark:text-neutral-300 hover:bg-gray-50"
            >
              Xem tất cả truyện mới <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </section>

        {/* CỘT PHẢI (4/12): BẢNG XẾP HẠNG LƯỢT ĐỌC (CAO -> THẤP) */}
        <aside className="lg:col-span-4 bg-white dark:bg-neutral-800/90 rounded-2xl p-5 border border-gray-200/80 dark:border-neutral-700/60 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Trophy className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center space-x-1.5">
                  <span>Bảng Xếp Hạng</span>
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-neutral-400">
                  Lượt đọc nhiều nhất (Cao &rarr; Thấp)
                </p>
              </div>
            </div>

            <Link
              to="/books?sort=views"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center"
            >
              Xem tất cả <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          {/* Danh sách 10 tác phẩm đứng đầu BXH */}
          <div className="space-y-2.5">
            {loading ? (
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
                        ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:to-neutral-800 border border-amber-300/60 dark:border-amber-700/50'
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
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30 shadow'
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
                          className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate block"
                          title={book.title}
                        >
                          {book.title}
                        </Link>
                        <div className="flex items-center text-[11px] text-gray-500 dark:text-neutral-400 space-x-1.5 mt-0.5">
                          <span className="truncate">{book.author_name || 'Khuyết danh'}</span>
                          {book.genres && book.genres.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-gray-400 truncate">{book.genres[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Số lượt đọc (Xếp cao -> thấp) */}
                    <div className="text-right shrink-0 pl-2">
                      <span
                        className={`inline-flex items-center font-extrabold text-xs ${
                          isTop1
                            ? 'text-amber-600 dark:text-amber-400'
                            : isTop2
                            ? 'text-slate-600 dark:text-slate-300'
                            : isTop3
                            ? 'text-amber-700 dark:text-amber-500'
                            : 'text-gray-600 dark:text-neutral-400'
                        }`}
                      >
                        <Eye className="w-3 h-3 mr-1 text-gray-400" />
                        {(book.view_count || 0).toLocaleString()}
                      </span>
                      <span className="block text-[10px] text-gray-400">lượt đọc</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-gray-400 py-4 text-center">Chưa có dữ liệu xếp hạng</p>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-neutral-700 text-center">
            <Link
              to="/books?sort=views"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center"
            >
              <span>Xem đầy đủ bảng xếp hạng</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
        </aside>
      </div>

      {/* Truyện Đã Hoàn Thành (Full) */}
      {completedBooks.length > 0 && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200/60 dark:border-neutral-800">
            <div className="flex items-center space-x-2">
              <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  Truyện Đã Hoàn Thành (Full)
                </h2>
                <p className="text-xs text-gray-500 dark:text-neutral-400">
                  Trọn vẹn câu chuyện, thỏa sức đọc liền mạch không phải đợi chương
                </p>
              </div>
            </div>
            <Link
              to="/books?status=completed"
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center"
            >
              Xem thêm <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {completedBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </section>
      )}

      {/* Quảng cáo Bottom */}
      <AdSlot slotType="bottom" />
    </div>
  );
};
