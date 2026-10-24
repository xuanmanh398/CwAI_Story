import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, User, Eye, Clock } from 'lucide-react';

export interface BookCardProps {
  id: string;
  title: string;
  slug: string;
  author_name?: string | null;
  cover_url?: string | null;
  status?: string;
  view_count?: number;
  total_chapters?: number;
  latest_chapter_number?: number | null;
  latest_chapter_title?: string | null;
  genres?: string[];
  updated_at?: string;
  is_18_plus?: number;
  is_premium?: number;
  price_coins?: number;
  free_chapters_count?: number;
}

export const BookCard: React.FC<{ book: BookCardProps }> = ({ book }) => {
  // Định dạng thời gian tương đối
  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} ngày trước`;
      return new Date(iso).toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const defaultCover = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&auto=format&fit=crop&q=80';

  return (
    <div className="group relative flex flex-col bg-white dark:bg-neutral-800 rounded-xl overflow-hidden border border-gray-200/80 dark:border-neutral-700/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Cover Image */}
      <Link to={`/books/${book.slug}`} className="relative aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-neutral-900 block">
        <img
          src={book.cover_url || defaultCover}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = defaultCover;
          }}
        />
        {book.status === 'completed' && (
          <span className="absolute top-2 right-2 bg-emerald-600/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow">
            Hoàn thành
          </span>
        )}
        {book.is_18_plus === 1 ? (
          <span className="absolute top-2 left-2 bg-rose-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1">
            <span>🔞</span>
            <span>18+</span>
          </span>
        ) : book.is_premium === 1 ? (
          <span className="absolute top-2 left-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1">
            <span>👑</span>
            <span>VIP</span>
          </span>
        ) : null}
        {book.genres && book.genres.length > 0 && (
          <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded">
            {book.genres[0]}
          </span>
        )}
        {book.price_coins !== undefined && book.price_coins > 0 ? (
          <span className="absolute bottom-2 right-2 bg-amber-500/95 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1">
            <span>🪙</span>
            <span>{book.price_coins} Xu</span>
          </span>
        ) : (
          <span className="absolute bottom-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow">
            Miễn phí
          </span>
        )}
      </Link>

      {/* Information */}
      <div className="p-3.5 flex flex-col flex-1">
        <Link to={`/books/${book.slug}`} className="block">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors text-base" title={book.title}>
            {book.title}
          </h3>
        </Link>

        <div className="flex items-center text-xs text-gray-500 dark:text-neutral-400 mt-1.5 space-x-2">
          <span className="flex items-center truncate">
            <User className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="truncate">{book.author_name || 'Khuyết danh'}</span>
          </span>
        </div>

        {/* Latest chapter */}
        <div className="mt-2 text-xs flex items-center justify-between text-gray-500 dark:text-neutral-400 border-t border-gray-100 dark:border-neutral-700/50 pt-2">
          {book.latest_chapter_number ? (
            <Link
              to={`/books/${book.slug}/chuong-${book.latest_chapter_number}`}
              className="text-brand-600 dark:text-brand-400 hover:underline truncate flex items-center"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="truncate">C.{book.latest_chapter_number}</span>
            </Link>
          ) : (
            <span className="text-gray-400">Chưa có chương</span>
          )}

          {book.updated_at && (
            <span className="flex items-center text-[11px] text-gray-400 flex-shrink-0 ml-2">
              <Clock className="w-3 h-3 mr-0.5" />
              {formatTime(book.updated_at)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
