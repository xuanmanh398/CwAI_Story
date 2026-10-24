import React, { useState } from 'react';
import { Flag, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface ChapterReportModalProps {
  bookId: string;
  chapterId: string;
  chapterTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChapterReportModal: React.FC<ChapterReportModalProps> = ({
  bookId,
  chapterId,
  chapterTitle,
  isOpen,
  onClose,
}) => {
  const [reason, setReason] = useState('missing_text');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/reports/chapter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          book_id: bookId,
          chapter_id: chapterId,
          reason,
          description: description.trim(),
        }),
      });

      const json = await res.json() as any;
      if (res.ok && json.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setDescription('');
          onClose();
        }, 1800);
      } else {
        alert(json.error || 'Không thể gửi báo cáo');
      }
    } catch {
      alert('Lỗi kết nối khi gửi báo cáo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-md w-full p-6 space-y-5 border border-gray-200 dark:border-neutral-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center shrink-0">
            <Flag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-gray-900 dark:text-white">Báo lỗi chương truyện</h3>
            <p className="text-xs text-gray-500 truncate max-w-xs">{chapterTitle}</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-6 space-y-2">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">Gửi báo cáo thành công!</h4>
            <p className="text-xs text-gray-500">
              Ban biên tập đã ghi nhận và sẽ tiến hành kiểm tra khắc phục sớm nhất. Cảm ơn sự hỗ trợ của bạn!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
                Vấn đề bạn gặp phải:
              </label>
              <div className="space-y-2 text-xs">
                {[
                  { id: 'missing_text', label: 'Chương mất chữ / Trang trắng / Thiếu nội dung' },
                  { id: 'wrong_order', label: 'Sai thứ tự chương / Nhảy số chương' },
                  { id: 'duplicate', label: 'Nội dung bị trùng lặp với chương khác' },
                  { id: 'typo', label: 'Lỗi chính tả / Lỗi font chữ / Khó đọc' },
                  { id: 'other', label: 'Lỗi khác hoặc vi phạm quy chuẩn' },
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center p-2.5 rounded-xl border cursor-pointer transition ${
                      reason === item.id
                        ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 font-semibold'
                        : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={item.id}
                      checked={reason === item.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="mr-2.5 text-brand-600 focus:ring-brand-500"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-neutral-300 mb-1.5">
                Mô tả chi tiết (tùy chọn):
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Từ đoạn 'Vương Lâm bước vào...' bị mất một nửa nội dung..."
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex space-x-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow transition disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo lỗi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
