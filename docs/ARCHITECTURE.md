# Kiến Trúc Hệ Thống TruyenNha

## 1. Tổng quan Kiến trúc

TruyenNha là nền tảng đọc truyện chữ tiếng Việt chất lượng cao, được xây dựng theo mô hình **Jamstack / Edge Computing** hiện đại trên nền tảng Cloudflare:

```
+------------------------------------------------------------------+
|                           CLIENT BROWSER                         |
|   React 18 SPA + Vite + Tailwind CSS + Lucide Icons + Router v6   |
+---------------------------------+--------------------------------+
                                  |
               HTTPS (Static Assets / API Requests)
                                  |
                                  v
+---------------------------------+--------------------------------+
|                   CLOUDFLARE EDGE NETWORK                        |
|                                                                  |
|  [Static Assets Cache]          [Cloudflare Pages Functions]     |
|  - HTML / JS / CSS Bundles      - Hono Web Framework API Router  |
|  - Edge CDN Invalidation        - Security Headers Middleware    |
|                                 - Web Crypto PBKDF2 Auth & Authz |
|                                 - SSRF Protection Filter         |
|                                 - Dynamic SEO (Sitemap, Robots)  |
|                                 - Content Adapters (Mock/Partner)|
+---------------------------------+--------------------------------+
                                  |
                         D1 Database Binding
                                  |
                                  v
+---------------------------------+--------------------------------+
|                   CLOUDFLARE D1 (SQLITE ENGINE)                  |
|  - users, sessions, authors, genres, books, chapters             |
|  - bookmarks, reading_progress, rights_records, audit_logs       |
|  - content_sources, sync_runs                                    |
+------------------------------------------------------------------+
```

## 2. Các Thành phần Chính

### 2.1. Frontend (Client Layer)
- **Framework:** React 18, TypeScript, Vite 6.
- **Styling:** Tailwind CSS với bảng màu brand tùy biến, hỗ trợ 3 chế độ đọc: Sáng (Light), Tối (Dark), Vàng kem (Sepia).
- **Trải nghiệm đọc:** Floating Control Toolbar cho phép người đọc tùy biến kích cỡ chữ (14px - 26px), khoảng cách dòng (1.4 - 2.2), phông chữ có chân (Serif) hoặc không chân (Sans), chiều rộng trang.
- **Tiến độ đọc:** Tự động đồng bộ vị trí đọc dở. Với khách vãng lai, lưu vào `localStorage`; với người dùng đã đăng nhập, tự động đồng bộ thời gian thực về Cloudflare D1.

### 2.2. Backend API (Edge Worker / Functions Layer)
- **Framework:** Hono v4 — web framework siêu nhẹ, định tuyến nhanh, hỗ trợ đầy đủ Cloudflare Pages Functions.
- **Binding:** `DB` (Cloudflare D1 SQLite Database).
- **Mã hóa:** Web Crypto Native API (`crypto.subtle`) thực thi PBKDF2-HMAC-SHA256 với 100,000 vòng lặp và 16-byte cryptographically secure random salt. Tương thích 100% V8 Isolate runtime, không phụ thuộc thư viện C/C++ native.
- **Phiên làm việc:** Session-based Authentication với `HttpOnly`, `SameSite=Lax`, `Secure` Cookie và lưu trạng thái vào bảng `sessions`.

### 2.3. Cơ sở dữ liệu (Cloudflare D1)
- D1 là cơ sở dữ liệu quan hệ SQLite phân tán trên mạng lưới Cloudflare.
- Sử dụng Parameterized Queries cho 100% truy vấn, tuyệt đối không nối chuỗi input người dùng vào SQL.
- 13 bảng dữ liệu với index tối ưu cho slug, trạng thái xuất bản (publication_status), ngày cập nhật (updated_at) và quan hệ n-n.

### 2.4. Module Điều hợp Nguồn (Content Adapters)
- Kiến trúc Interface chuẩn hóa: `ContentAdapter`.
- `MockInternalAdapter`: Cung cấp truyện demo tự sáng tác, mô phỏng nguồn nội bộ đã thẩm định.
- `LicensedPartnerAdapter`: Tích hợp chuẩn REST API đối tác có cấp phép kèm timeout, retry backoff, Bearer authentication.
- `validateSafeUrl`: Bộ lọc an toàn chặn đứng tấn công SSRF (chặn loopback, dải IP nội bộ RFC 1918, metadata endpoints 169.254.169.254, và các cổng mạng nhạy cảm).
