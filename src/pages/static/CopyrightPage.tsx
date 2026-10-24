import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../../context/ConfigContext';
import { ShieldCheck, AlertCircle, FileText } from 'lucide-react';

export const CopyrightPage: React.FC = () => {
  const { config } = useConfig();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 text-sm leading-relaxed text-gray-700 dark:text-neutral-300">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center">
          <ShieldCheck className="w-8 h-8 text-emerald-600 mr-2.5" />
          Chính sách bản quyền & Sở hữu trí tuệ
        </h1>
        <p className="text-xs text-gray-400">Cam kết tuân thủ Luật Sở hữu trí tuệ và công ước quốc tế</p>
      </div>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-gray-200 dark:border-neutral-700 shadow-sm space-y-6">
        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            1. Nguyên tắc cốt lõi về bản quyền
          </h2>
          <p>
            {config.siteName} đặt sự tôn trọng bản quyền của tác giả và dịch giả lên hàng đầu. Mọi tác phẩm được đăng tải trên nền tảng đều thuộc một trong các trường hợp:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Tác phẩm tự sáng tác có hợp đồng cấp phép hoặc thỏa thuận phát hành điện tử.</li>
            <li>Nội dung tích hợp từ đối tác có bản quyền đã được kiểm chứng qua API.</li>
            <li>Tác phẩm đã hết thời hạn bảo hộ quyền tác giả theo luật định (Public Domain).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
            2. Quy trình tiếp nhận và xử lý gỡ bỏ (Notice and Takedown)
          </h2>
          <p>
            Nếu bạn là chủ sở hữu bản quyền hợp pháp (hoặc người được ủy quyền hợp pháp) và phát hiện bất kỳ tác phẩm hoặc chương truyện nào xuất hiện trên website mà chưa được sự đồng ý của bạn, chúng tôi sẵn sàng phối hợp xử lý theo quy trình sau:
          </p>
          <ol className="list-decimal pl-5 mt-2 space-y-1.5">
            <li><strong>Tiếp nhận yêu cầu:</strong> Bạn gửi thông báo vi phạm kèm tài liệu chứng minh quyền sở hữu qua trang Báo cáo vi phạm.</li>
            <li><strong>Thẩm tra sơ bộ:</strong> Ban quản trị kiểm tra tính hợp lệ của tài liệu trong vòng 24 - 48 giờ làm việc.</li>
            <li><strong>Khóa tạm thời:</strong> Chuyển trạng thái tác phẩm sang &quot;removed&quot; hoặc &quot;unpublished&quot; ngay khi có cơ sở nghi vấn hợp lý để bảo vệ quyền lợi của tác giả.</li>
            <li><strong>Giải quyết dứt điểm:</strong> Phản hồi kết quả xử lý và gỡ bỏ vĩnh viễn nội dung nếu xác nhận có vi phạm.</li>
          </ol>
        </section>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-300">Bạn muốn gửi yêu cầu gỡ bỏ nội dung?</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
              Sử dụng biểu mẫu trực tuyến để ban quản trị tiếp nhận ngay lập tức
            </p>
          </div>
          <Link
            to="/bao-cao-vi-pham"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs shadow transition flex-shrink-0"
          >
            Gửi yêu cầu
          </Link>
        </div>
      </div>
    </div>
  );
};
