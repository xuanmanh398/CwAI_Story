import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Heart, Send, Trash2, Reply, Shield, Crown, Feather, CornerDownRight } from 'lucide-react';

export interface CommentItem {
  id: string;
  book_id: string;
  chapter_id?: string | null;
  user_id: string;
  parent_id?: string | null;
  content: string;
  likes_count: number;
  user_liked: number;
  reply_count: number;
  username: string;
  role: string;
  is_premium: number;
  is_author: number;
  created_at: string;
}

interface CommentSectionProps {
  bookId: string;
  chapterId?: string;
  title?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  bookId,
  chapterId,
  title = 'Bình luận & Thảo luận',
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = async () => {
    try {
      let url = `/api/comments?book_id=${bookId}`;
      if (chapterId) url += `&chapter_id=${chapterId}`;
      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json() as any;
      if (json && json.success) {
        setComments(json.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchComments();
  }, [bookId, chapterId]);

  const handleSubmit = async (e: React.FormEvent, parentId: string | null = null) => {
    e.preventDefault();
    const textToSend = parentId ? replyContent.trim() : content.trim();
    if (!textToSend || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          book_id: bookId,
          chapter_id: chapterId || null,
          parent_id: parentId,
          content: textToSend,
        }),
      });
      const json = await res.json() as any;
      if (res.ok && json.success) {
        if (parentId) {
          setReplyContent('');
          setReplyingTo(null);
        } else {
          setContent('');
        }
        await fetchComments();
      } else {
        alert(json.error || 'Không thể gửi bình luận');
      }
    } catch {
      alert('Lỗi kết nối khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      alert('Vui lòng đăng nhập để thích bình luận');
      return;
    }

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json && json.success) {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId) {
              return {
                ...c,
                user_liked: json.liked ? 1 : 0,
                likes_count: json.liked ? c.likes_count + 1 : Math.max(0, c.likes_count - 1),
              };
            }
            return c;
          })
        );
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json() as any;
      if (json && json.success) {
        setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
      } else {
        alert(json.error || 'Không thể xóa');
      }
    } catch {
      alert('Lỗi khi xóa bình luận');
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

  const topLevelComments = comments.filter((c) => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="bg-white dark:bg-neutral-800/80 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-neutral-700/60 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-700">
        <div className="flex items-center space-x-2">
          <span className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <MessageSquare className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center space-x-2">
              <span>{title}</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300">
                {comments.length}
              </span>
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400">
              Cùng chia sẻ cảm nghĩ, bàn luận về tình tiết và nhân vật
            </p>
          </div>
        </div>
      </div>

      {/* Ô nhập bình luận chính */}
      {user ? (
        <form onSubmit={(e) => handleSubmit(e, null)} className="space-y-3">
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Viết cảm nghĩ của bạn về chương/truyện này..."
              rows={3}
              maxLength={1000}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-gray-400">
                {content.length}/1000 ký tự
              </span>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs transition shadow-sm"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="text-center py-4 px-4 bg-gray-50 dark:bg-neutral-900/60 rounded-xl border border-dashed border-gray-200 dark:border-neutral-700 text-xs text-gray-600 dark:text-neutral-300">
          <span>Vui lòng </span>
          <Link to="/login" className="font-bold text-brand-600 hover:underline">
            Đăng nhập
          </Link>
          <span> để cùng tham gia thảo luận và để lại bình luận.</span>
        </div>
      )}

      {/* Danh sách bình luận */}
      <div className="space-y-4 pt-2">
        {loading ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-neutral-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-neutral-700 rounded w-1/4" />
                  <div className="h-4 bg-gray-100 dark:bg-neutral-800 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelComments.length > 0 ? (
          topLevelComments.map((comment) => {
            const replies = getReplies(comment.id);
            const isOwner = user && user.id === comment.user_id;
            const canDelete = isOwner || (user && (user.role === 'admin' || user.role === 'editor'));

            return (
              <div key={comment.id} className="space-y-3">
                {/* Bình luận gốc */}
                <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50/80 dark:hover:bg-neutral-750 transition group">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Nội dung */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="font-bold text-xs text-gray-900 dark:text-white">
                        {comment.username}
                      </span>

                      {/* Badges */}
                      {comment.role === 'admin' && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Admin
                        </span>
                      )}
                      {comment.is_author === 1 && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                          <Feather className="w-2.5 h-2.5 mr-0.5" /> Tác giả
                        </span>
                      )}
                      {comment.is_premium === 1 && (
                        <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                          <Crown className="w-2.5 h-2.5 mr-0.5" /> VIP
                        </span>
                      )}

                      <span className="text-[10px] text-gray-400 ml-auto shrink-0">
                        {formatTime(comment.created_at)}
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-neutral-200 mt-1.5 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>

                    {/* Action buttons */}
                    <div className="flex items-center space-x-4 mt-2">
                      <button
                        onClick={() => handleLike(comment.id)}
                        className={`inline-flex items-center text-[11px] font-semibold transition ${
                          comment.user_liked === 1
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-gray-500 dark:text-neutral-400 hover:text-rose-600'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 mr-1 ${comment.user_liked === 1 ? 'fill-current' : ''}`} />
                        <span>{comment.likes_count > 0 ? comment.likes_count : 'Thích'}</span>
                      </button>

                      {user && (
                        <button
                          onClick={() => setReplyingTo(replyingTo?.id === comment.id ? null : comment)}
                          className="inline-flex items-center text-[11px] font-semibold text-gray-500 dark:text-neutral-400 hover:text-brand-600 transition"
                        >
                          <Reply className="w-3.5 h-3.5 mr-1" />
                          <span>Trả lời</span>
                        </button>
                      )}

                      {canDelete && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="inline-flex items-center text-[11px] text-gray-400 hover:text-rose-600 transition ml-auto opacity-0 group-hover:opacity-100"
                          title="Xóa bình luận"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Ô nhập phản hồi */}
                    {replyingTo?.id === comment.id && (
                      <form onSubmit={(e) => handleSubmit(e, comment.id)} className="mt-3 space-y-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`Trả lời @${comment.username}...`}
                          rows={2}
                          maxLength={500}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                        />
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setReplyingTo(null)}
                            className="px-3 py-1 rounded-lg text-[11px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800"
                          >
                            Hủy
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || !replyContent.trim()}
                            className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-[11px] disabled:opacity-50"
                          >
                            Phản hồi
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Danh sách phản hồi con */}
                {replies.length > 0 && (
                  <div className="pl-8 sm:pl-11 space-y-2 border-l-2 border-gray-100 dark:border-neutral-800 ml-4">
                    {replies.map((reply) => {
                      const isReplyOwner = user && user.id === reply.user_id;
                      const canDeleteReply =
                        isReplyOwner || (user && (user.role === 'admin' || user.role === 'editor'));

                      return (
                        <div
                          key={reply.id}
                          className="flex items-start space-x-2.5 p-2 rounded-xl hover:bg-gray-50/60 dark:hover:bg-neutral-750 transition group"
                        >
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                            {reply.username.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-xs text-gray-900 dark:text-white">
                                {reply.username}
                              </span>
                              {reply.is_author === 1 && (
                                <span className="text-[9px] font-bold px-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                                  Tác giả
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 ml-auto">
                                {formatTime(reply.created_at)}
                              </span>
                            </div>

                            <p className="text-xs text-gray-700 dark:text-neutral-300 mt-1 leading-relaxed">
                              {reply.content}
                            </p>

                            <div className="flex items-center space-x-3 mt-1.5">
                              <button
                                onClick={() => handleLike(reply.id)}
                                className={`inline-flex items-center text-[10px] font-semibold transition ${
                                  reply.user_liked === 1
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-gray-400 hover:text-rose-600'
                                }`}
                              >
                                <Heart
                                  className={`w-3 h-3 mr-1 ${reply.user_liked === 1 ? 'fill-current' : ''}`}
                                />
                                <span>{reply.likes_count > 0 ? reply.likes_count : ''}</span>
                              </button>

                              {canDeleteReply && (
                                <button
                                  onClick={() => handleDelete(reply.id)}
                                  className="text-[10px] text-gray-400 hover:text-rose-600 transition ml-auto opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-xs text-gray-400 dark:text-neutral-500">
            Chưa có bình luận nào. Hãy là người đầu tiên để lại cảm nghĩ!
          </div>
        )}
      </div>
    </div>
  );
};
