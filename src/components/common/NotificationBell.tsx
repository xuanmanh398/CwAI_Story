import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, BookOpen, CreditCard, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  link?: string | null;
  type: string;
  is_read: number;
  created_at: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      const json = await res.json() as any;
      if (json && json.success) {
        setNotifications(json.data || []);
        setUnreadCount(json.unread_count || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Tự động kiểm tra thông báo mỗi 60 giây
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {
      // ignore
    }
  };

  const markSingleRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const formatTime = (iso: string) => {
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.floor(diff / 60000);
      if (m < 1) return 'Vừa xong';
      if (m < 60) return `${m} phút trước`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} giờ trước`;
      const d = Math.floor(h / 24);
      if (d < 30) return `${d} ngày trước`;
      return new Date(iso).toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'chapter':
        return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'author':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-brand-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        title="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-rose-600 text-white text-[10px] font-black rounded-full ring-2 ring-white dark:ring-neutral-900 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/40">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white">Thông báo</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Đã đọc tất cả</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100 dark:divide-neutral-800/60">
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markSingleRead(item.id)}
                  className={`p-3.5 flex items-start space-x-3 transition hover:bg-gray-50 dark:hover:bg-neutral-800/50 ${
                    item.is_read === 0 ? 'bg-brand-50/20 dark:bg-brand-950/20' : ''
                  }`}
                >
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-neutral-800 shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                        {formatTime(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                    {item.link && (
                      <Link
                        to={item.link}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline mt-1.5"
                      >
                        Xem chi tiết <ExternalLink className="w-3 h-3 ml-0.5" />
                      </Link>
                    )}
                  </div>
                  {item.is_read === 0 && (
                    <span className="w-2 h-2 rounded-full bg-brand-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-gray-400 dark:text-neutral-500">
                <Bell className="w-8 h-8 text-gray-300 dark:text-neutral-700 mx-auto mb-2 opacity-50" />
                Bạn không có thông báo nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
