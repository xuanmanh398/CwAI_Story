# Hướng Dẫn Tích Hợp Nguồn Nội Dung Có Cấp Phép (Content Adapters)

## 1. Nguyên Tắc Cốt Lõi Về Quyền Nội Dung

Hệ thống TruyenNha tuân thủ tuyệt đối các quy định pháp luật về Sở hữu Trí tuệ:
1. **Nghiêm cấm cào dữ liệu (Scraping):** Không thu thập trái phép nội dung từ các website khác.
2. **Nguồn cấp phép hợp pháp:** Chỉ nhập nội dung từ các API đối tác có ký kết thỏa thuận phân phối điện tử hoặc tác phẩm tự sáng tác.
3. **Thẩm định trước khi xuất bản:** Mọi tác phẩm nhập về đều tự động ghi nhận hồ sơ tại bảng `rights_records`.

---

## 2. Kiến Trúc Bộ Điều Hợp (Adapter Interface)

Mỗi nhà cung cấp nội dung cần triển khai interface `ContentAdapter`:

```typescript
export interface ContentAdapter {
  readonly providerType: string;
  testConnection(baseUrl: string, configJson: string): Promise<{ ok: boolean; message: string }>;
  fetchBooks(baseUrl: string, configJson: string): Promise<ExternalBookData[]>;
  fetchChapters(baseUrl: string, bookExternalId: string, configJson: string): Promise<ExternalChapterData[]>;
}
```

### 2.1. Cấu trúc dữ liệu chuẩn hóa
```typescript
export interface ExternalBookData {
  externalId: string;       // Khóa định danh duy nhất từ đối tác (chống trùng lặp)
  title: string;            // Tên truyện
  slug?: string;            // Slug (nếu không có, hệ thống sẽ tự sinh)
  authorName: string;       // Tên tác giả
  coverUrl?: string;        // Ảnh bìa
  description: string;      // Tóm tắt
  genres: string[];         // Danh sách thể loại
  status: 'ongoing' | 'completed' | 'hiatus';
  licenseOwner: string;     // Tên đơn vị / Tác giả cấp phép
  licenseNotes?: string;    // Số hợp đồng / thỏa thuận
}
```

---

## 3. Các Adapter Đã Cung Cấp Sẵn Trong Mã Nguồn

### 3.1. `MockInternalAdapter` (`server/adapters/mock.ts`)
- **Mục đích:** Cung cấp nguồn tác phẩm tự sáng tác nội bộ để thử nghiệm và demo đầy đủ quy trình đồng bộ.
- **Dữ liệu:** Tác phẩm giả lập "Sơn Trang Ký Sự" và "Ngân Thiên Ngoại Truyện".

### 3.2. `LicensedPartnerAdapter` (`server/adapters/licensed-api.ts`)
- **Mục đích:** Bộ điều hợp mẫu chuẩn REST API để kết nối trực tiếp với hệ thống CMS của nhà xuất bản hoặc đối tác.
- **Tính năng bảo vệ:**
  - Kiểm tra URL an toàn chống **SSRF** (`validateSafeUrl`).
  - Timeout với `AbortController` (mặc định 8000ms).
  - Tự động gắn header `Authorization: Bearer <API_KEY>` từ cấu hình bảo mật.
  - Phân tích và chống trùng lặp dựa trên `external_id`.

---

## 4. Quy Trình Tích Hợp Đối Tác Thực Tế

Khi bạn đã ký thỏa thuận bản quyền với đối tác mới:

1. **Bước 1:** Vào trang Quản trị (`/admin` -> Tab "Nguồn cấp phép").
2. **Bước 2:** Nhấn thêm nguồn mới:
   - Tên nguồn: Tên nhà xuất bản hoặc nền tảng đối tác.
   - Provider Type: `licensed_rest_api`.
   - Base URL: URL Endpoint của đối tác (bắt buộc phải là `https://`).
   - Config JSON:
     ```json
     {
       "apiKey": "PARTNER_SECRET_BEARER_TOKEN",
       "timeoutMs": 10000,
       "maxRetries": 3
     }
     ```
3. **Bước 3:** Nhấn **"Chạy đồng bộ ngay"**. Hệ thống sẽ:
   - Gọi API lấy danh sách truyện.
   - Kiểm tra xem truyện đã tồn tại chưa bằng `external_id` (nếu có, không ghi đè nội dung người biên tập đã chỉnh sửa).
   - Tự động tạo bản ghi `rights_records` với trạng thái `verified`.
   - Tải các chương mới nhất.
   - Ghi lại kết quả và nhật ký lỗi vào bảng `sync_runs`.
