import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { Mail, MessageSquare, Send, CheckCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { config } = useConfig();
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto">
          <Mail className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Liên hệ Ban Quản Trị</h1>
        <p className="text-xs text-gray-500">Hợp tác xuất bản, đóng góp ý kiến hoặc phản hồi kỹ thuật</p>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm">
        {sent ? (
          <div className="text-center py-10 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Cảm ơn bạn đã gửi liên hệ!</h3>
            <p className="text-xs text-gray-500">Chúng tôi sẽ phản hồi lại bạn qua email sớm nhất có thể.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Họ và tên *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>
              <div>
                <label className="block font-medium mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Tiêu đề *</label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                placeholder="Ví dụ: Đăng ký hợp tác sáng tác truyện"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Nội dung tin nhắn *</label>
              <textarea
                rows={5}
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition flex items-center justify-center text-sm shadow"
            >
              <Send className="w-4 h-4 mr-2" />
              Gửi tin nhắn
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
