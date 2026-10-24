import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { AdSlot } from '../components/common/AdSlot';
import {
  ChevronLeft,
  ChevronRight,
  List,
  Settings,
  Sun,
  Moon,
  BookOpen,
  ArrowLeft,
  Type,
  Maximize2,
  Minimize2,
  Coins,
  Lock,
  Sparkles,
  CreditCard,
  AlertCircle,
  Flag,
} from 'lucide-react';
import { CommentSection } from '../components/common/CommentSection';
import { ChapterReportModal } from '../components/reader/ChapterReportModal';

interface ChapterDetail {
  id: string;
  book_id: string;
  chapter_number: number;
  title: string;
  slug: string;
  content: string;
  word_count: number;
  updated_at: string;
  is_locked?: boolean;
  require_reason?: string;
  price_coins?: number;
  free_chapters_count?: number;
}

interface ChapterNav {
  chapter_number: number;
  title: string;
  slug: string;
}

export const ChapterReadingPage: React.FC = () => {
  const { slug, chapterSlug, chapterNumber } = useParams<{ slug: string; chapterSlug?: string; chapterNumber?: string }>();
  const rawParam = chapterSlug || chapterNumber || '1';
  const parsedChapterNumber = parseInt(rawParam.replace(/\D+/g, '') || '1', 10);
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [book, setBook] = useState<{
    id: string;
    title: string;
    slug: string;
    is_18_plus?: number;
    is_premium?: number;
    price_coins?: number;
    free_chapters_count?: number;
  } | null>(null);
  const [prevChapter, setPrevChapter] = useState<ChapterNav | null>(null);
  const [nextChapter, setNextChapter] = useState<ChapterNav | null>(null);
  const [allChapters, setAllChapters] = useState<{ chapter_number: number; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [unlocking18, setUnlocking18] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleUnlock18 = async () => {
    if (!user) return;
    setUnlocking18(true);
    try {
      const res = await fetch('/api/wallet/unlock-18plus', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        if (refreshUser) await refreshUser();
        window.location.reload();
      } else {
        alert(data.error || 'Mở khóa thất bại');
      }
    } catch {
      alert('Lỗi kết nối máy chủ');
    } finally {
      setUnlocking18(false);
    }
  };

  const handlePurchaseBook = async () => {
    if (!book?.id) return;
    setPurchasing(true);
    setPurchaseError(null);
    try {
      const res = await fetch('/api/wallet/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ book_id: book.id }),
      });
      const json = await res.json() as any;
      if (json.success) {
        if (refreshUser) await refreshUser();
        window.location.reload();
      } else {
        setPurchaseError(json.error || 'Mở khóa truyện không thành công');
      }
    } catch {
      setPurchaseError('Lỗi kết nối máy chủ');
    } finally {
      setPurchasing(false);
    }
  };

  // Settings đọc truyện
  const [fontSize, setFontSize] = useState<number>(() => {
    return parseInt(localStorage.getItem('reader_font_size') || '18', 10);
  });
  const [lineHeight, setLineHeight] = useState<number>(() => {
    return parseFloat(localStorage.getItem('reader_line_height') || '1.8');
  });
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>(() => {
    return (localStorage.getItem('reader_font_family') as 'serif' | 'sans') || 'serif';
  });
  const [maxWidth, setMaxWidth] = useState<'narrow' | 'medium' | 'wide'>(() => {
    return (localStorage.getItem('reader_max_width') as 'narrow' | 'medium' | 'wide') || 'medium';
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showChapterDrawer, setShowChapterDrawer] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Tải nội dung chương
  useEffect(() => {
    if (!slug || isNaN(parsedChapterNumber)) return;
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    fetch(`/api/books/${slug}/chapters/${parsedChapterNumber}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Chương không tồn tại hoặc chưa xuất bản');
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setChapter(json.data.chapter);
          setBook(json.data.book);
          setPrevChapter(json.data.prevChapter);
          setNextChapter(json.data.nextChapter);
          document.title = `${json.data.chapter.title} - ${json.data.book.title}`;

          // Lưu tiến độ đọc
          saveProgress(json.data.book, json.data.chapter.id, json.data.chapter.chapter_number, json.data.chapter.title);
        } else {
          throw new Error(json.error || 'Lỗi tải chương');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug, parsedChapterNumber]);

  // Tải danh sách tất cả chương để hiển thị drawer chọn nhanh
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/books/${slug}/chapters`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setAllChapters(json.data || []);
      })
      .catch(() => {});
  }, [slug]);

  // Lưu tiến độ đọc
  const saveProgress = (
    bookData: { id: string; title: string; slug: string; cover_url?: string },
    chapterId: string,
    chNumber: number,
    chTitle: string
  ) => {
    try {
      // 1. Lưu bản ghi riêng cho truyện này
      localStorage.setItem(
        `read_progress_${bookData.id}`,
        JSON.stringify({ chapterNumber: chNumber, title: chTitle, updatedAt: new Date().toISOString() })
      );

      // 2. Lưu vào danh sách tổng hợp lịch sử đọc trong localStorage
      const HISTORY_KEY = 'truyennha_reading_history';
      const raw = localStorage.getItem(HISTORY_KEY);
      let list: any[] = [];
      try {
        if (raw) list = JSON.parse(raw);
      } catch {}
      if (!Array.isArray(list)) list = [];

      list = list.filter((item) => item.book_id !== bookData.id && item.book_slug !== bookData.slug);
      list.unshift({
        id: `hist_${bookData.id}`,
        book_id: bookData.id,
        book_title: bookData.title,
        book_slug: bookData.slug,
        book_cover_url: bookData.cover_url || '',
        last_chapter_id: chapterId,
        last_chapter_number: chNumber,
        last_chapter_title: chTitle,
        updated_at: new Date().toISOString(),
      });

      if (list.length > 50) list = list.slice(0, 50);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Lưu lịch sử đọc local thất bại:', e);
    }

    // 3. Đồng bộ server nếu đã login
    if (user) {
      fetch('/api/reading-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          book_id: bookData.id,
          last_chapter_id: chapterId,
          last_chapter_number: chNumber,
          progress_percent: 100,
        }),
      }).catch(() => {});
    }
  };

  // Điều hướng bằng phím mũi tên bàn phím mượt mà không tải lại toàn trang
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' && prevChapter && slug) {
        navigate(`/books/${slug}/chuong-${prevChapter.chapter_number}`);
      } else if (e.key === 'ArrowRight' && nextChapter && slug) {
        navigate(`/books/${slug}/chuong-${nextChapter.chapter_number}`);
      }
    },
    [prevChapter, nextChapter, slug, navigate]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const updateFontSize = (delta: number) => {
    const next = Math.max(14, Math.min(26, fontSize + delta));
    setFontSize(next);
    localStorage.setItem('reader_font_size', next.toString());
  };

  const updateLineHeight = (lh: number) => {
    setLineHeight(lh);
    localStorage.setItem('reader_line_height', lh.toString());
  };

  const updateFontFamily = (ff: 'serif' | 'sans') => {
    setFontFamily(ff);
    localStorage.setItem('reader_font_family', ff);
  };

  const updateMaxWidth = (mw: 'narrow' | 'medium' | 'wide') => {
    setMaxWidth(mw);
    localStorage.setItem('reader_max_width', mw);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !chapter || !book) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-neutral-200">Không thể mở chương này</h2>
        <p className="text-sm text-gray-500">{error || 'Chương không tồn tại hoặc đã bị khóa.'}</p>
        <Link
          to={`/books/${slug}`}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Về trang chi tiết truyện
        </Link>
      </div>
    );
  }

  // Tùy biến container width
  const widthClasses = {
    narrow: 'max-w-2xl',
    medium: 'max-w-3xl',
    wide: 'max-w-5xl',
  }[maxWidth];

  return (
    <div className="min-h-screen pb-24 transition-colors">
      {/* Top Floating Control Bar */}
      <div className="sticky top-16 z-30 bg-white/90 dark:bg-neutral-900/90 backdrop-blur border-b border-gray-200/80 dark:border-neutral-800 px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs">
          <Link
            to={`/books/${book.slug}`}
            className="flex items-center font-semibold text-gray-700 dark:text-neutral-300 hover:text-brand-600 truncate max-w-[200px] sm:max-w-md"
            title={book.title}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 flex-shrink-0" />
            <span className="truncate">{book.title}</span>
          </Link>

          <div className="flex items-center space-x-2">
            {/* Nút danh sách chương */}
            <button
              onClick={() => setShowChapterDrawer(!showChapterDrawer)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 flex items-center"
              title="Danh sách chương"
            >
              <List className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Mục lục</span>
            </button>

            {/* Nút tùy chỉnh giao diện đọc */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:bg-gray-50 flex items-center"
              title="Tùy chỉnh đọc truyện"
            >
              <Settings className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Cài đặt</span>
            </button>

            {/* Nút báo lỗi chương */}
            <button
              onClick={() => setShowReportModal(true)}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-600 dark:text-neutral-300 hover:text-rose-600 hover:bg-gray-50 flex items-center"
              title="Báo lỗi chương"
            >
              <Flag className="w-4 h-4 mr-1 text-rose-500" />
              <span className="hidden sm:inline">Báo lỗi</span>
            </button>
          </div>
        </div>

        {/* Panel Tùy Chỉnh Đọc (Dropdown settings) */}
        {showSettings && (
          <div className="max-w-5xl mx-auto mt-2 p-4 bg-white dark:bg-neutral-800 rounded-xl border border-gray-200 dark:border-neutral-700 shadow-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              {/* Đổi màu nền */}
              <div>
                <label className="block text-gray-500 mb-1.5 font-medium">Màu nền</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 py-1.5 rounded border text-center ${
                      theme === 'light' ? 'border-brand-500 bg-gray-100 font-bold' : 'border-gray-200 bg-white'
                    }`}
                  >
                    Sáng
                  </button>
                  <button
                    onClick={() => setTheme('sepia')}
                    className={`flex-1 py-1.5 rounded border text-center bg-[#fbf0d9] text-[#2c2219] ${
                      theme === 'sepia' ? 'border-brand-500 font-bold' : 'border-[#e0ceb0]'
                    }`}
                  >
                    Vàng kem
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 py-1.5 rounded border text-center bg-neutral-900 text-white ${
                      theme === 'dark' ? 'border-brand-500 font-bold' : 'border-neutral-700'
                    }`}
                  >
                    Tối
                  </button>
                </div>
              </div>

              {/* Cỡ chữ */}
              <div>
                <label className="block text-gray-500 mb-1.5 font-medium">Cỡ chữ: {fontSize}px</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => updateFontSize(-2)}
                    className="flex-1 py-1.5 rounded border border-gray-200 dark:border-neutral-700 text-center font-bold"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => updateFontSize(2)}
                    className="flex-1 py-1.5 rounded border border-gray-200 dark:border-neutral-700 text-center font-bold"
                  >
                    A+
                  </button>
                </div>
              </div>

              {/* Phông chữ */}
              <div>
                <label className="block text-gray-500 mb-1.5 font-medium">Phông chữ</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateFontFamily('serif')}
                    className={`flex-1 py-1.5 rounded border font-serif text-center ${
                      fontFamily === 'serif' ? 'border-brand-500 font-bold' : 'border-gray-200 dark:border-neutral-700'
                    }`}
                  >
                    Có chân (Serif)
                  </button>
                  <button
                    onClick={() => updateFontFamily('sans')}
                    className={`flex-1 py-1.5 rounded border font-sans text-center ${
                      fontFamily === 'sans' ? 'border-brand-500 font-bold' : 'border-gray-200 dark:border-neutral-700'
                    }`}
                  >
                    Không chân
                  </button>
                </div>
              </div>

              {/* Chiều rộng khung */}
              <div>
                <label className="block text-gray-500 mb-1.5 font-medium">Độ rộng trang</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateMaxWidth('narrow')}
                    className={`flex-1 py-1.5 rounded border text-center ${maxWidth === 'narrow' ? 'border-brand-500 font-bold' : 'border-gray-200 dark:border-neutral-700'}`}
                  >
                    Gọn
                  </button>
                  <button
                    onClick={() => updateMaxWidth('medium')}
                    className={`flex-1 py-1.5 rounded border text-center ${maxWidth === 'medium' ? 'border-brand-500 font-bold' : 'border-gray-200 dark:border-neutral-700'}`}
                  >
                    Vừa
                  </button>
                  <button
                    onClick={() => updateMaxWidth('wide')}
                    className={`flex-1 py-1.5 rounded border text-center ${maxWidth === 'wide' ? 'border-brand-500 font-bold' : 'border-gray-200 dark:border-neutral-700'}`}
                  >
                    Rộng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapter Drawer (Modal danh sách chương) */}
      {showChapterDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end" onClick={() => setShowChapterDrawer(false)}>
          <div
            className="w-full max-w-md bg-white dark:bg-neutral-900 h-full p-6 overflow-y-auto space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <h3 className="font-bold text-base text-gray-900 dark:text-white">Mục lục ({allChapters.length} chương)</h3>
              <button onClick={() => setShowChapterDrawer(false)} className="text-gray-400 hover:text-gray-600">
                Đóng
              </button>
            </div>
            <div className="space-y-1">
              {allChapters.map((ch) => (
                <Link
                  key={ch.chapter_number}
                  to={`/books/${slug}/chuong-${ch.chapter_number}`}
                  onClick={() => setShowChapterDrawer(false)}
                  className={`block p-2 rounded-lg text-xs transition ${
                    ch.chapter_number === chapter.chapter_number
                      ? 'bg-brand-600 text-white font-semibold'
                      : 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                  }`}
                >
                  {ch.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chapter Content Container */}
      <main className={`mx-auto px-4 sm:px-6 py-8 ${widthClasses}`}>
        {/* Tiêu đề chương */}
        <div className="text-center space-y-2 mb-8">
          <Link to={`/books/${book.slug}`} className="text-xs uppercase tracking-wider text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            {book.title}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {chapter.title}
          </h1>
          <div className="text-xs text-gray-400 flex items-center justify-center space-x-3 pt-1">
            <span>Dùng phím mũi tên &larr; &rarr; để chuyển chương</span>
          </div>
        </div>

        {/* Nút chuyển chương trên (Chuyển mượt mà tức thì 0s & làm mới quảng cáo theo chương) */}
        <div className="flex items-center justify-between my-6 py-3 border-y border-gray-200/60 dark:border-neutral-800 text-xs">
          {prevChapter ? (
            <Link
              to={`/books/${slug}/chuong-${prevChapter.chapter_number}`}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Chương trước
            </Link>
          ) : (
            <span className="opacity-30 flex items-center px-3.5 py-1.5 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4 mr-1" /> Chương trước
            </span>
          )}

          <button
            onClick={() => setShowChapterDrawer(true)}
            className="px-3 py-1.5 text-gray-500 hover:text-brand-600 font-medium"
          >
            Chương {chapter.chapter_number}
          </button>

          {nextChapter ? (
            <Link
              to={`/books/${slug}/chuong-${nextChapter.chapter_number}`}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700 shadow-sm"
            >
              Chương sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          ) : (
            <span className="opacity-30 flex items-center px-3.5 py-1.5 cursor-not-allowed">
              Chương sau <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          )}
        </div>

        <AdSlot key={`reader-ad-top-${chapter.chapter_number}`} slotType="reader" is18Plus={book?.is_18_plus === 1} />

        {/* VĂN BẢN CHƯƠNG */}
        <article
          ref={contentRef}
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: lineHeight,
          }}
          className={`space-y-6 text-gray-800 dark:text-neutral-200 whitespace-pre-line tracking-normal select-text ${
            fontFamily === 'serif' ? 'font-serif' : 'font-sans'
          }`}
        >
          {chapter.content}
        </article>

        {/* Khung khóa nội dung: Yêu cầu đăng ký / đăng nhập HOẶC Trả phí mở truyện HOẶC 18+ / Premium */}
        {chapter.is_locked && chapter.require_reason === 'require_login' ? (
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-blue-50/80 via-white to-blue-50/30 dark:from-neutral-800 dark:via-neutral-800/90 dark:to-neutral-900 border-2 border-dashed border-blue-300 dark:border-blue-700/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-3xl shadow-inner border border-blue-300 dark:border-blue-700">
              📖
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30">
                Yêu cầu tài khoản thành viên
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Vui lòng đăng ký hoặc đăng nhập để đọc tiếp
              </h3>
              <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                Độc giả cần có tài khoản thành viên để đọc nội dung truyện và đồng bộ lịch sử đọc. Quá trình tạo tài khoản hoàn toàn <strong>miễn phí</strong>!
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={`/register?redirect=/books/${slug}/chuong-${chapter.chapter_number}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition"
              >
                Đăng ký tài khoản (Miễn phí)
              </Link>
              <Link
                to={`/login?redirect=/books/${slug}/chuong-${chapter.chapter_number}`}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-800 font-semibold text-xs transition"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        ) : chapter.is_locked && chapter.require_reason === 'paid_book' ? (
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-50/80 via-white to-amber-50/40 dark:from-neutral-800 dark:via-neutral-800/90 dark:to-neutral-900 border-2 border-dashed border-amber-300 dark:border-amber-700/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-3xl shadow-inner border border-amber-300 dark:border-amber-700">
              🪙
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                Tác phẩm thu phí bản quyền
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Mở khóa để tiếp tục đọc truyện
              </h3>
              <p className="text-xs text-gray-600 dark:text-neutral-400 leading-relaxed">
                Tác giả đã cho phép đọc thử miễn phí{' '}
                <strong>{chapter.free_chapters_count || book?.free_chapters_count || 5} chương đầu</strong>. Để đọc trọn vẹn toàn bộ các chương tiếp theo của <strong>{book?.title}</strong>, vui lòng mở khóa tác phẩm.
              </p>
            </div>

            <div className="p-4 max-w-sm mx-auto bg-amber-100/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-gray-700 dark:text-neutral-300">
                <span>Giá mở khóa toàn bộ:</span>
                <strong className="text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                  {chapter.price_coins || book?.price_coins || 0} Xu
                </strong>
              </div>
              {user && (
                <div className="flex justify-between items-center text-gray-600 dark:text-neutral-400 pt-1 border-t border-amber-200/60 dark:border-amber-800/30">
                  <span>Số dư hiện tại của bạn:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {user.coins || 0} Xu
                  </span>
                </div>
              )}
            </div>

            {purchaseError && (
              <div className="max-w-sm mx-auto p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-medium border border-rose-200 dark:border-rose-900">
                {purchaseError}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {!user ? (
                <Link
                  to={`/login?redirect=/books/${slug}/chuong-${chapter.chapter_number}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Đăng nhập để mở khóa truyện
                </Link>
              ) : (user.coins || 0) >= (chapter.price_coins || book?.price_coins || 0) ? (
                <button
                  type="button"
                  disabled={purchasing}
                  onClick={handlePurchaseBook}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{purchasing ? 'Đang mở khóa...' : `Mở khóa toàn bộ truyện (${chapter.price_coins || book?.price_coins} Xu)`}</span>
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                  <Link
                    to="/nap-xu"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>Nạp Xu ngay (Thiếu {(chapter.price_coins || book?.price_coins || 0) - (user.coins || 0)} Xu)</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : chapter.is_locked && (chapter.require_reason === '18_plus' || book?.is_18_plus === 1) ? (
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-rose-50/70 via-white to-rose-50/30 dark:from-neutral-800 dark:via-neutral-800/90 dark:to-neutral-900 border-2 border-dashed border-rose-300 dark:border-rose-900/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-3xl shadow-inner border border-rose-200 dark:border-rose-800">
              🔞
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30">
                Gói mở khóa Danh mục 18+: 50.000 VNĐ / tháng (50 Xu)
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center justify-center space-x-1.5">
                <span>Nội dung giới hạn 18+</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                Chương truyện này thuộc danh mục nội dung 18+. Vui lòng mở khóa gói 18+ với <strong>50.000 VNĐ / tháng (50 Xu)</strong> để đọc không giới hạn danh mục 18+ trong 30 ngày.
              </p>
            </div>

            {user && (
              <div className="p-3 max-w-sm mx-auto bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs flex justify-between items-center">
                <span className="text-gray-600 dark:text-neutral-300">Số dư hiện tại của bạn:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {user.coins || 0} Xu
                </span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {!user ? (
                <Link
                  to={`/login?redirect=/books/${slug}/chuong-${chapter.chapter_number}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Đăng nhập để mở khóa
                </Link>
              ) : (user.coins || 0) >= 50 ? (
                <button
                  type="button"
                  disabled={unlocking18}
                  onClick={handleUnlock18}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{unlocking18 ? 'Đang mở khóa...' : 'Mở khóa 30 ngày (50 Xu)'}</span>
                </button>
              ) : (
                <Link
                  to="/nap-xu"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Nạp thêm Xu (Còn thiếu {50 - (user.coins || 0)} Xu)</span>
                </Link>
              )}
            </div>
          </div>
        ) : chapter.is_locked ? (
          <div className="my-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 dark:from-neutral-800 dark:via-neutral-800/90 dark:to-neutral-900 border-2 border-dashed border-amber-300 dark:border-amber-800/60 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-3xl shadow-inner border border-amber-200 dark:border-amber-700">
              👑
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                Độc quyền thành viên VIP
              </span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Nội dung giới hạn thành viên VIP
              </h3>
              <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed">
                Chương truyện này dành riêng cho hội viên VIP. Vui lòng nâng cấp VIP hoặc mở khóa tác phẩm để tiếp tục đọc.
              </p>
            </div>

            {user && (
              <div className="p-3 max-w-sm mx-auto bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs flex justify-between items-center">
                <span className="text-gray-600 dark:text-neutral-300">Số dư hiện tại của bạn:</span>
                <span className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                  {user.coins || 0} Xu
                </span>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {!user ? (
                <Link
                  to={`/login?redirect=/books/${slug}/chuong-${chapter.chapter_number}`}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Đăng nhập tài khoản
                </Link>
              ) : (user.coins || 0) >= 50 ? (
                <button
                  type="button"
                  disabled={unlocking18}
                  onClick={handleUnlock18}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{unlocking18 ? 'Đang kích hoạt...' : 'Kích hoạt VIP 30 ngày (50 Xu)'}</span>
                </button>
              ) : (
                <Link
                  to="/nap-xu"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-xs shadow-md transition flex items-center justify-center space-x-1.5"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>Nạp Xu ngay (Còn thiếu {50 - (user.coins || 0)} Xu)</span>
                </Link>
              )}
            </div>
          </div>
        ) : null}

        <AdSlot key={`reader-ad-bottom-${chapter.chapter_number}`} slotType="reader" is18Plus={book?.is_18_plus === 1} />

        {/* Nút chuyển chương dưới (Chuyển mượt mà tức thì 0s & làm mới quảng cáo theo chương) */}
        <div className="flex items-center justify-between my-10 pt-6 border-t border-gray-200/60 dark:border-neutral-800 text-xs">
          {prevChapter ? (
            <Link
              to={`/books/${slug}/chuong-${prevChapter.chapter_number}`}
              className="inline-flex items-center px-4 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-800 font-medium"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Chương trước
            </Link>
          ) : (
            <span className="opacity-30 flex items-center px-4 py-2 cursor-not-allowed">
              <ChevronLeft className="w-4 h-4 mr-1" /> Chương trước
            </span>
          )}

          <Link
            to={`/books/${slug}`}
            className="px-4 py-2 text-gray-600 dark:text-neutral-400 hover:text-brand-600 font-medium"
          >
            Mục lục truyện
          </Link>

          {nextChapter ? (
            <Link
              to={`/books/${slug}/chuong-${nextChapter.chapter_number}`}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 text-white font-medium hover:bg-brand-700 shadow"
            >
              Chương sau
              <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          ) : (
            <span className="opacity-30 flex items-center px-4 py-2 cursor-not-allowed">
              Chương sau <ChevronRight className="w-4 h-4 ml-1" />
            </span>
          )}
        </div>

        {/* Banner Báo lỗi & Mẹo phím tắt */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gray-50/80 dark:bg-neutral-800/60 border border-gray-200/60 dark:border-neutral-700/60 text-xs text-gray-500 dark:text-neutral-400 mb-8">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-gray-200/80 dark:bg-neutral-700 font-mono text-[10px] font-bold">←</span>
            <span className="p-1 rounded bg-gray-200/80 dark:bg-neutral-700 font-mono text-[10px] font-bold">→</span>
            <span>Sử dụng phím mũi tên trên bàn phím để chuyển chương nhanh</span>
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            Báo lỗi chương này
          </button>
        </div>

        {/* Khu vực Bình luận & Thảo luận chương */}
        <CommentSection
          bookId={book.id}
          chapterId={chapter.id}
          title={`Bình luận Chương ${chapter.chapter_number}`}
        />

        {/* Modal Báo lỗi chương */}
        <ChapterReportModal
          bookId={book.id}
          chapterId={chapter.id}
          chapterTitle={`${chapter.title} (Chương ${chapter.chapter_number})`}
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
        />
      </main>
    </div>
  );
};
