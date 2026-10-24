import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { AdSlot } from '../components/common/AdSlot';
import { CommentSection } from '../components/common/CommentSection';
import {
  BookOpen,
  User,
  Clock,
  Eye,
  Bookmark,
  BookmarkCheck,
  ShieldCheck,
  CheckCircle,
  ListOrdered,
  Share2,
  Lock,
  Coins,
} from 'lucide-react';

interface BookDetail {
  id: string;
  title: string;
  slug: string;
  author_id?: string;
  author_name?: string;
  author_bio?: string;
  cover_url?: string;
  description: string;
  status: string;
  publication_status: string;
  source_type: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  license_owner?: string;
  license_type?: string;
  license_status?: string;
  is_18_plus?: number;
  is_premium?: number;
  price_coins?: number;
  free_chapters_count?: number;
  is_purchased?: boolean;
  total_chapters: number;
  genres: { id: string; name: string; slug: string }[];
}

interface ChapterItem {
  id: string;
  chapter_number: number;
  title: string;
  slug: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export const BookDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, refreshUser } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [book, setBook] = useState<BookDetail | null>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [lastReadChapter, setLastReadChapter] = useState<{ chapterNumber: number; title?: string } | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseMsg, setPurchaseMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePurchaseBook = async () => {
    if (!book) return;
    if (!user) {
      navigate(`/login?redirect=/books/${slug}`);
      return;
    }
    setPurchasing(true);
    setPurchaseMsg(null);
    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ book_id: book.id }),
      });
      const data = (await res.json()) as any;
      if (res.ok && data.success) {
        setBook((prev) => (prev ? { ...prev, is_purchased: true } : prev));
        setPurchaseMsg({ type: 'success', text: data.message || 'Chúc mừng bạn đã mở khóa trọn bộ tác phẩm!' });
        if (refreshUser) await refreshUser();
      } else {
        setPurchaseMsg({ type: 'error', text: data.error || 'Mở khóa truyện không thành công' });
      }
    } catch {
      setPurchaseMsg({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    // 1. Lấy thông tin truyện
    fetch(`/api/books/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy truyện');
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setBook(json.data);
          document.title = `${json.data.title} - ${json.data.author_name || 'Truyện'} | ${config.siteName}`;

          // 2. Lấy danh sách chương
          return fetch(`/api/books/${slug}/chapters`);
        }
        throw new Error('Lỗi dữ liệu');
      })
      .then((res) => res?.json())
      .then((chapJson) => {
        if (chapJson?.success) {
          setChapters(chapJson.data || []);
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => setLoading(false));
  }, [slug, config.siteName]);

  // Kiểm tra Bookmark & Lịch sử đọc nếu đã đăng nhập hoặc từ localStorage
  useEffect(() => {
    if (!book) return;

    if (user) {
      // Kiểm tra bookmark trên server
      fetch(`/api/bookmarks/check/${book.id}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setIsBookmarked(json.isBookmarked);
        })
        .catch(() => {});

      // Lấy lịch sử đọc từ server
      fetch(`/api/reading-progress/${book.id}`, { credentials: 'include' })
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.last_chapter_number) {
            setLastReadChapter({
              chapterNumber: json.data.last_chapter_number,
              title: json.data.last_chapter_title,
            });
          }
        })
        .catch(() => {});
    } else {
      // Khách: lấy từ localStorage
      const localProgress = localStorage.getItem(`read_progress_${book.id}`);
      if (localProgress) {
        try {
          const parsed = JSON.parse(localProgress);
          if (parsed.chapterNumber) {
            setLastReadChapter({ chapterNumber: parsed.chapterNumber, title: parsed.title });
          }
        } catch {}
      }
    }
  }, [book, user]);

  const toggleBookmark = async () => {
    if (!book) return;
    if (!user) {
      navigate('/login');
      return;
    }

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        const res = await fetch(`/api/bookmarks/${book.id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) setIsBookmarked(false);
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ book_id: book.id }),
        });
        if (res.ok) setIsBookmarked(true);
      }
    } finally {
      setBookmarkLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-xl font-bold">Không tìm thấy tác phẩm này</h2>
        <p className="text-sm text-gray-500 mt-2">Truyện có thể đã bị gỡ hoặc chưa được phát hành.</p>
        <Link to="/books" className="inline-block mt-4 text-brand-600 hover:underline">
          Về danh sách truyện
        </Link>
      </div>
    );
  }

  const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb */}
      <nav className="text-xs text-gray-500 dark:text-neutral-400 flex items-center space-x-2">
        <Link to="/" className="hover:text-brand-600">Trang chủ</Link>
        <span>/</span>
        <Link to="/books" className="hover:text-brand-600">Truyện</Link>
        <span>/</span>
        <span className="text-gray-800 dark:text-neutral-200 truncate">{book.title}</span>
      </nav>

      {/* Thông báo cho người đọc chưa đăng ký / đăng nhập */}
      {!user && (
        <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center space-x-2.5">
            <span className="text-xl shrink-0">📖</span>
            <div>
              <span className="font-bold block sm:inline mr-1">Chưa đăng nhập:</span>
              <span>Bạn đang xem thông tin chung của tác phẩm. Nền tảng yêu cầu <strong>đăng ký tài khoản</strong> để bắt đầu đọc nội dung các chương.</span>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Link
              to={`/register?redirect=/books/${book.slug}`}
              className="px-3.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition shadow-sm"
            >
              Đăng ký miễn phí
            </Link>
            <Link
              to={`/login?redirect=/books/${book.slug}`}
              className="px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 hover:bg-white dark:hover:bg-neutral-800 font-medium text-xs transition"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      )}

      {/* Thông tin chính của truyện */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200/80 dark:border-neutral-700/60 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Ảnh bìa */}
          <div className="w-full md:w-56 flex-shrink-0">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-gray-100 dark:bg-neutral-900">
              <img
                src={book.cover_url || defaultCover}
                alt={book.title}
                className="w-full h-full object-cover"
                onError={(e) => ((e.currentTarget as HTMLImageElement).src = defaultCover)}
              />
            </div>
          </div>

          {/* Chi tiết nội dung */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {book.status === 'completed' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    Đã hoàn thành
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300">
                    Đang ra
                  </span>
                )}
                {book.license_status === 'verified' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
                    Đã xác minh bản quyền
                  </span>
                )}
                {book.is_18_plus === 1 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                    🔞 18+ Giới Hạn
                  </span>
                )}
                {book.is_premium === 1 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                    👑 VIP Premium
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                {book.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-neutral-400 mt-2">
                <span className="flex items-center font-medium">
                  <User className="w-4 h-4 mr-1 text-gray-400" />
                  {book.author_name || 'Khuyết danh'}
                </span>
                <span className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                  {chapters.length} chương
                </span>
                <span className="flex items-center">
                  <Eye className="w-4 h-4 mr-1 text-gray-400" />
                  {book.view_count} lượt đọc
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1 text-gray-400" />
                  Cập nhật: {new Date(book.updated_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Thể loại */}
            {book.genres && book.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {book.genres.map((g) => (
                  <Link
                    key={g.id}
                    to={`/books?genre=${g.slug}`}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-neutral-700/60 hover:bg-brand-50 hover:text-brand-600 transition"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Thông tin bản quyền tác giả minh bạch */}
            {book.license_owner && (
              <div className="p-3 bg-emerald-50/50 dark:bg-neutral-900/60 rounded-xl border border-emerald-100 dark:border-neutral-700 text-xs text-gray-600 dark:text-neutral-300 space-y-1">
                <div className="font-semibold text-emerald-800 dark:text-emerald-400 flex items-center">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Ủy quyền & Quyền xuất bản số:
                </div>
                <div>Bên cấp quyền: <strong>{book.license_owner}</strong></div>
                <div>Hình thức: {book.license_type || 'Bản quyền điện tử hợp lệ'}</div>
              </div>
            )}

            {/* Hộp Giá & Trạng thái Bản quyền / Mở khóa trọn bộ */}
            <div className="p-4 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/70 dark:bg-neutral-900/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-neutral-400">Hình thức đọc:</span>
                  {book.price_coins && book.price_coins > 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60">
                      🪙 Trọn bộ: {book.price_coins} Xu
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                      Miễn phí 100%
                    </span>
                  )}
                </div>

                {book.price_coins && book.price_coins > 0 && (
                  <div className="text-xs text-gray-500 dark:text-neutral-400">
                    Đọc thử: <strong>{book.free_chapters_count || 5} chương đầu</strong>
                  </div>
                )}
              </div>

              {book.price_coins && book.price_coins > 0 ? (
                book.is_purchased ? (
                  <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Bạn đã sở hữu trọn bộ tác phẩm này (Đọc vĩnh viễn mọi chương không giới hạn)</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-600 dark:text-neutral-400">
                      Chỉ cần trả phí <strong>1 lần duy nhất</strong> ({book.price_coins} Xu) để đọc full tác phẩm thay vì phải trả phí từng chương lẻ.
                    </div>
                    {purchaseMsg && (
                      <div className={`p-2.5 rounded-lg text-xs font-medium ${purchaseMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900'}`}>
                        {purchaseMsg.text}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        onClick={handlePurchaseBook}
                        disabled={purchasing}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs shadow transition disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>{purchasing ? 'Đang mở khóa...' : `Mở khóa trọn bộ tác phẩm (${book.price_coins} Xu)`}</span>
                      </button>
                      {user && (user.coins || 0) < book.price_coins && (
                        <Link
                          to="/nap-xu"
                          className="px-3 py-2 rounded-lg bg-white dark:bg-neutral-800 border border-amber-300 dark:border-amber-700 text-amber-600 dark:text-amber-400 text-xs font-semibold hover:bg-amber-50 dark:hover:bg-neutral-700 transition flex items-center space-x-1"
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>Nạp Xu (Hiện có {user.coins || 0} Xu)</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              ) : null}
            </div>

            {/* Action Buttons: Đọc từ đầu / Đọc tiếp / Bookmark */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {lastReadChapter ? (
                <Link
                  to={`/books/${book.slug}/chuong-${lastReadChapter.chapterNumber}`}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Đọc tiếp (Chương {lastReadChapter.chapterNumber})
                </Link>
              ) : chapters.length > 0 ? (
                <Link
                  to={`/books/${book.slug}/chuong-1`}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm transition shadow flex items-center"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Đọc từ đầu (Chương 1)
                </Link>
              ) : null}

              <button
                onClick={toggleBookmark}
                disabled={bookmarkLoading}
                className={`px-4 py-2.5 rounded-xl border font-medium text-sm transition flex items-center ${
                  isBookmarked
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-700 dark:text-brand-300'
                    : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-neutral-200 hover:bg-gray-50'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="w-4 h-4 mr-1.5 text-brand-600" />
                    Đã lưu vào tủ sách
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4 mr-1.5" />
                    Lưu vào tủ sách
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tóm tắt truyện */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-neutral-700/60">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">Giới thiệu tóm tắt</h2>
          <div className="text-sm leading-relaxed text-gray-700 dark:text-neutral-300 whitespace-pre-line font-serif">
            {book.description || 'Chưa có tóm tắt cho bộ truyện này.'}
          </div>
        </div>
      </div>

      <AdSlot slotType="top" />

      {book.is_18_plus === 1 && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs flex items-start space-x-3">
          <span className="text-xl shrink-0">🔞</span>
          <div>
            <span className="font-bold block">Khuyến cáo nội dung dành cho độc giả từ 18 tuổi trở lên:</span>
            <span>Tác phẩm có một số chi tiết nhạy cảm. Để tuân thủ chính sách quảng cáo an toàn của Google và bảo vệ người dùng, các chương của tác phẩm này chỉ mở cho tài khoản đã xác thực quyền hoặc thành viên VIP Premium.</span>
          </div>
        </div>
      )}

      {/* Danh sách chương */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200/80 dark:border-neutral-700/60 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <ListOrdered className="w-5 h-5 mr-2 text-brand-600" />
            Danh sách chương ({chapters.length})
          </h2>
        </div>

        {chapters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {chapters.map((ch) => {
              const isFreeChapter = !book.price_coins || book.price_coins === 0 || ch.chapter_number <= (book.free_chapters_count || 5);
              return (
                <Link
                  key={ch.id}
                  to={`/books/${book.slug}/chuong-${ch.chapter_number}`}
                  className="p-2.5 rounded-lg text-xs hover:bg-gray-50 dark:hover:bg-neutral-700/50 flex items-center justify-between border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition group"
                >
                  <span className="font-medium text-gray-800 dark:text-neutral-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 truncate mr-2">
                    {ch.title}
                  </span>
                  {isFreeChapter ? (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Miễn phí
                    </span>
                  ) : book.is_purchased ? (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      Đã mở
                    </span>
                  ) : (
                    <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center space-x-1">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Trả phí</span>
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-4 text-center">Chưa có chương nào được xuất bản</p>
        )}
      </div>

      {/* Thảo luận & Bình luận sách */}
      <CommentSection bookId={book.id} title={`Thảo luận & Bình luận (${book.title})`} />

      <AdSlot slotType="bottom" is18Plus={book.is_18_plus === 1} />
    </div>
  );
};
