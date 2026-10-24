import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Bookmark, Clock, Trash2, ArrowRight } from 'lucide-react';

interface BookmarkItem {
  bookmark_id: string;
  bookmarked_at: string;
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  author_name: string;
  last_chapter_number?: number;
  total_chapters: number;
}

interface ProgressItem {
  id: string;
  book_id: string;
  book_title: string;
  book_slug: string;
  book_cover_url?: string;
  last_chapter_number: number;
  last_chapter_title: string;
  updated_at: string;
}

const HISTORY_KEY = 'truyennha_reading_history';

export const LibraryPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('history');
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [history, setHistory] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tải dữ liệu tủ sách và lịch sử đọc
  const fetchLibraryData = async () => {
    setLoading(true);

    // 1. Luôn tải lịch sử từ localStorage trước (đảm bảo hiển thị ngay cả khi offline hoặc chưa login)
    let localHistory: ProgressItem[] = [];
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        localHistory = JSON.parse(raw);
      }
    } catch {}
    if (!Array.isArray(localHistory)) localHistory = [];

    // 2. Nếu đã đăng nhập, lấy thêm bookmarks và lịch sử từ cloud DB
    if (user) {
      try {
        const [bmRes, progRes] = await Promise.all([
          fetch('/api/bookmarks', { credentials: 'include' }),
          fetch('/api/reading-progress', { credentials: 'include' }),
        ]);
        const [bmJson, progJson] = await Promise.all([bmRes.json(), progRes.json()]);

        if (bmJson.success) setBookmarks(bmJson.data || []);

        if (progJson.success && Array.isArray(progJson.data)) {
          const cloudHistory: ProgressItem[] = progJson.data;

          // Hợp nhất local và cloud: lấy bản ghi có thời gian mới hơn và luôn giữ ảnh bìa chính xác
          const map = new Map<string, ProgressItem>();
          for (const item of localHistory) {
            map.set(item.book_id, item);
          }
          for (const item of cloudHistory) {
            const existing = map.get(item.book_id);
            if (!existing) {
              map.set(item.book_id, item);
            } else {
              const isCloudNewer = new Date(item.updated_at) > new Date(existing.updated_at);
              const base = isCloudNewer ? item : existing;
              // Luôn ưu tiên lấy ảnh bìa hợp lệ từ cloud nếu local bị thiếu
              const resolvedCover = item.book_cover_url || existing.book_cover_url || '';
              map.set(item.book_id, {
                ...base,
                book_cover_url: resolvedCover,
                book_title: item.book_title || existing.book_title,
                book_slug: item.book_slug || existing.book_slug,
              });
            }
          }
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
          setHistory(merged);
          try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
          } catch {}
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Lỗi tải dữ liệu cloud:', err);
      }
    }

    setHistory(localHistory);
    setLoading(false);
  };

  useEffect(() => {
    fetchLibraryData();
  }, [user]);

  const removeBookmark = async (bookId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${bookId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setBookmarks((prev) => prev.filter((b) => b.id !== bookId));
      }
    } catch {}
  };

  const clearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc truyện trên thiết bị này?')) {
      try {
        localStorage.removeItem(HISTORY_KEY);
      } catch {}
      setHistory([]);
    }
  };

  const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Bookmark className="w-6 h-6 mr-2 text-brand-600" />
            Tủ sách cá nhân
          </h1>
          <p className="text-xs text-gray-500 mt-1">Quản lý truyện yêu thích và tiến độ đọc của bạn</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-gray-100 dark:bg-neutral-800 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'history'
                ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Lịch sử đọc ({history.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-neutral-700 text-brand-600 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Yêu thích ({user ? bookmarks.length : 0})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : activeTab === 'history' ? (
        /* Tab Lịch sử đọc */
        <div>
          {history.length > 0 && (
            <div className="flex justify-end mb-3">
              <button
                onClick={clearHistory}
                className="inline-flex items-center text-xs text-red-600 hover:text-red-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Xóa toàn bộ lịch sử
              </button>
            </div>
          )}

          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id || h.book_id}
                  className="flex items-center justify-between p-3.5 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow transition"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-12 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm">
                      <img
                        src={h.book_cover_url || defaultCover}
                        alt={h.book_title}
                        className="w-full h-full object-cover"
                        onError={(e) => ((e.currentTarget as HTMLImageElement).src = defaultCover)}
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/books/${h.book_slug}`}
                        className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white hover:text-brand-600 truncate block"
                      >
                        {h.book_title}
                      </Link>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        Đang đọc: <strong className="text-brand-600 dark:text-brand-400">{h.last_chapter_title || `Chương ${h.last_chapter_number}`}</strong>
                      </p>
                      <span className="inline-flex items-center text-[11px] text-gray-400 mt-0.5">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(h.updated_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 flex-shrink-0 text-xs pl-2">
                    <Link
                      to={`/books/${h.book_slug}/chuong-${h.last_chapter_number}`}
                      className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm transition inline-flex items-center"
                    >
                      <span>Đọc tiếp</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1 hidden sm:inline" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-3">
              <Clock className="w-12 h-12 text-gray-300 dark:text-neutral-600 mx-auto" />
              <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Chưa có lịch sử đọc</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Khi bạn mở và đọc các chương truyện trên Truyện Nhà, tiến độ đọc sẽ được ghi nhớ tự động tại đây.
              </p>
              <div className="pt-2">
                <Link
                  to="/books"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold hover:bg-brand-700 transition shadow"
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  Khám phá truyện ngay
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tab Bookmark */
        !user ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-800 rounded-2xl border border-gray-200 dark:border-neutral-700 p-8 space-y-4">
            <Bookmark className="w-12 h-12 text-brand-600 mx-auto opacity-70" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Đăng nhập để đồng bộ truyện Yêu thích
            </h2>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Khi đăng nhập, danh sách truyện yêu thích của bạn sẽ được lưu trữ an toàn trên đám mây và đồng bộ trên mọi thiết bị.
            </p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow transition"
              >
                Đăng nhập ngay
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        ) : bookmarks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bookmarks.map((b) => (
              <div
                key={b.bookmark_id}
                className="flex bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700 p-3 space-x-3 shadow-sm hover:shadow transition"
              >
                <Link to={`/books/${b.slug}`} className="w-20 aspect-[3/4] flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={b.cover_url || defaultCover}
                    alt={b.title}
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).src = defaultCover)}
                  />
                </Link>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <Link
                      to={`/books/${b.slug}`}
                      className="font-semibold text-sm text-gray-900 dark:text-white hover:text-brand-600 line-clamp-2"
                    >
                      {b.title}
                    </Link>
                    <p className="text-xs text-gray-500 mt-1 truncate">{b.author_name || 'Đang cập nhật'}</p>
                    <p className="text-[11px] text-brand-600 dark:text-brand-400 mt-1">
                      {b.total_chapters} chương
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-neutral-700 mt-2">
                    <Link
                      to={`/books/${b.slug}`}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Đọc truyện
                    </Link>
                    <button
                      onClick={() => removeBookmark(b.id)}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Bỏ lưu truyện"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-2">
            <Bookmark className="w-10 h-10 text-gray-300 dark:text-neutral-600 mx-auto" />
            <h3 className="font-semibold text-gray-700 dark:text-neutral-300">Tủ sách đang trống</h3>
            <p className="text-xs text-gray-500">
              Hãy nhấn nút &quot;Lưu vào tủ sách&quot; ở trang chi tiết truyện để theo dõi thuận tiện hơn.
            </p>
            <Link to="/books" className="inline-block mt-3 text-xs font-semibold text-brand-600 hover:underline">
              Khám phá danh sách truyện
            </Link>
          </div>
        )
      )}
    </div>
  );
};
