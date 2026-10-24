import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookCard, BookCardProps } from '../components/common/BookCard';
import { BookCardSkeleton } from '../components/common/Skeleton';
import { Search, AlertCircle } from 'lucide-react';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<BookCardProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceTimerRef = useRef<any>(null);

  const performSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
      const json = await res.json();
      if (json.success) {
        setResults(json.data || []);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Đồng bộ search param và debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (query.trim() !== initialQuery) {
        setSearchParams(query.trim() ? { q: query.trim() } : {});
      }
      performSearch(query);
    }, 350);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Initial search
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Big Search Input */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Tìm kiếm tác phẩm
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-neutral-400">
          Tra cứu theo tên truyện, tên tác giả hoặc nội dung quan tâm
        </p>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập tên truyện hoặc tác giả cần tìm..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm sm:text-base transition"
            autoFocus
          />
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-3.5" />
        </div>
      </div>

      {/* Kết quả tìm kiếm */}
      <div className="mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : hasSearched && results.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-neutral-400">
              Tìm thấy {results.length} kết quả phù hợp với &quot;{query}&quot;
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {results.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          </div>
        ) : hasSearched && query.trim().length >= 2 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-800/40 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-2">
            <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="font-semibold text-gray-800 dark:text-neutral-200">Không tìm thấy tác phẩm</h3>
            <p className="text-xs text-gray-500">
              Không có truyện nào khớp với từ khóa &quot;{query}&quot;. Vui lòng kiểm tra lại chính tả hoặc tìm theo từ khóa ngắn hơn.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};
