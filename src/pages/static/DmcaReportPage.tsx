import React, { useState } from 'react';
import { useConfig } from '../../context/ConfigContext';
import { AlertTriangle, Send, CheckCircle } from 'lucide-react';

export const DmcaReportPage: React.FC = () => {
  const { config } = useConfig();
  const [formData, setFormData] = useState({
    ownerName: '',
    email: '',
    phone: '',
    bookTitleOrUrl: '',
    proofDetails: '',
    statementAgreement: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.statementAgreement) {
      alert('Vui lòng xác nhận tính trung thực của thông tin cung cấp');
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
          Tiếp nhận báo cáo vi phạm bản quyền
        </h1>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Biểu mẫu dành cho tác giả hoặc chủ sở hữu bản quyền hợp pháp yêu cầu xem xét và gỡ bỏ nội dung trên hệ thống {config.siteName}.
        </p>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm">
        {submitted ? (
          <div className="text-center py-12 space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Đã tiếp nhận yêu cầu thành công</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
              Mã hồ sơ: <strong className="text-brand-600">REQ-{Date.now().toString(36).toUpperCase()}</strong>. Bộ phận pháp lý của chúng tôi sẽ xác minh tài liệu và liên hệ lại với bạn qua email <strong>{formData.email}</strong> trong vòng 24 - 48 giờ.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Họ tên chủ sở hữu / Người đại diện *</label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  placeholder="Ví dụ: Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Email liên hệ nhận phản hồi *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">Tên tác phẩm hoặc Đường link URL vi phạm *</label>
              <input
                type="text"
                required
                value={formData.bookTitleOrUrl}
                onChange={(e) => setFormData({ ...formData, bookTitleOrUrl: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                placeholder="https://truyennha.vn/books/... hoặc Tên bộ truyện"
              />
            </div>

            <div>
              <label className="block font-medium mb-1">Căn cứ sở hữu và tài liệu chứng minh *</label>
              <textarea
                rows={4}
                required
                value={formData.proofDetails}
                onChange={(e) => setFormData({ ...formData, proofDetails: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                placeholder="Mô tả chi tiết: Giấy chứng nhận quyền tác giả, link phát hành gốc, hợp đồng bản quyền..."
              />
            </div>

            <div className="pt-2">
              <label className="flex items-start space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.statementAgreement}
                  onChange={(e) => setFormData({ ...formData, statementAgreement: e.target.checked })}
                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500"
                />
                <span className="text-[11px] text-gray-600 dark:text-neutral-400 leading-normal">
                  Tôi cam đoan thông tin cung cấp trên là hoàn toàn chính xác và tôi là chủ sở hữu bản quyền hợp pháp hoặc người được ủy quyền hợp pháp để thực hiện yêu cầu này.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition flex items-center justify-center text-sm shadow"
            >
              <Send className="w-4 h-4 mr-2" />
              Gửi thông báo gỡ bỏ nội dung
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
