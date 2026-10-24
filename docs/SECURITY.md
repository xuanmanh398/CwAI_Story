# Báo Cáo An Ninh & Tiêu Chuẩn Bảo Mật - TruyenNha

## 1. Cơ Chế Mã Hóa Mật Khẩu (Password Hashing)
- **Chuẩn:** Web Crypto API (`crypto.subtle`) PBKDF2-HMAC-SHA256.
- **Tham số:** 100,000 vòng lặp (Iterations) theo khuyến nghị của Viện Tiêu chuẩn và Kỹ thuật Quốc gia Hoa Kỳ (NIST SP 800-132).
- **Muối (Salt):** 16 bytes ngẫu nhiên được sinh bằng CSPRNG (`crypto.getRandomValues`).
- **Timing-safe compare:** Hàm so sánh thời gian bất biến (`timingSafeEqual`) chống tấn công Side-Channel Timing Attack.
- **Tương thích:** 100% Native trong Cloudflare Workers V8 Isolate, không phụ thuộc C++ binaries hoặc Node.js gyps.

---

## 2. Quản Lý Phiên & Cookies (Session Management)
- **Lưu trữ phiên:** Bảng `sessions` trong Cloudflare D1 với trường `expires_at` (TTL 14 ngày), `ip_hash` và `user_agent`.
- **Cấu hình Cookie:**
  - `HttpOnly: true` (Ngăn chặn hoàn toàn JavaScript truy cập cookie, miễn nhiễm trước XSS lấy cắp token).
  - `Secure: true` (Bật trên môi trường production, chỉ gửi qua HTTPS).
  - `SameSite: Lax` (Chống lại các cuộc tấn công Cross-Site Request Forgery - CSRF).
  - Không lưu trữ session token dài hạn trong `localStorage`.

---

## 3. Chống Tấn Công Phổ Biến (OWASP Top 10 Mitigation)

### 3.1. SQL Injection
- 100% các truy vấn vào D1 đều sử dụng **Parameterized Queries** (`.prepare('... WHERE col = ?').bind(val)`).
- Tuyệt đối không nối chuỗi input của người dùng vào câu lệnh SQL.

### 3.2. Cross-Site Scripting (XSS)
- Nội dung truyện được render dưới dạng văn bản an toàn qua React Virtual DOM.
- Hàm `sanitizeTextContent` lọc bỏ và mã hóa các ký tự điều khiển HTML nguy hiểm (`<`, `>`, `&`, `"`, `'`).

### 3.3. Server-Side Request Forgery (SSRF)
- Module `validateSafeUrl` thẩm định mọi URL trước khi gọi kết nối ngoài:
  - Chặn `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`.
  - Chặn dải IP nội bộ RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
  - Chặn địa chỉ Metadata IP Cloudflare/AWS/GCP (`169.254.169.254`).
  - Chặn các cổng nhạy cảm (SSH, FTP, Database ports).

### 3.4. Rate Limiting (Chống Brute-Force)
- Tích hợp in-memory IP rate limiter giới hạn:
  - Tối đa 7 lần thử đăng nhập / phút.
  - Tối đa 5 lần đăng ký / 10 phút.

### 3.5. Phân Quyền Phía Server (Broken Access Control)
- Mọi endpoint tại `/api/admin/*` đều qua middleware `requireAuth` và `requireRole('editor', 'admin')`.
- Không chỉ ẩn nút trên giao diện; mọi thao tác can thiệp dữ liệu đều được xác thực quyền tại server.

### 3.6. Bảo Vệ Dữ Liệu Chưa Xuất Bản
- Truyện và chương ở trạng thái `draft`, `unpublished` hoặc `removed` được lọc ngay ở tầng SQL database; độc giả thông thường nhận HTTP 404 nếu cố tình đoán ID hoặc slug.
