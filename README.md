# TruyenNha - Nền Tảng Đọc Truyện Chữ Tiếng Việt Trên Cloudflare

[![Tests](https://img.shields.io/badge/tests-25%20passed-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Runtime](https://img.shields.io/badge/runtime-Cloudflare%20Pages%20%2B%20D1-orange.svg)]()

**TruyenNha** là ứng dụng website đọc truyện chữ tiếng Việt hoàn chỉnh, hiện đại, tối ưu SEO, hỗ trợ mobile-first, bảo mật cao và vận hành hoàn toàn trên hạ tầng Edge Computing của **Cloudflare (Cloudflare Pages + Functions + D1 Database)**.

---

## 🌟 Tính Năng Nổi Bật

### 1. Trải Nghiệm Đọc Truyện Chuyên Nghiệp
- **Giao diện hiện đại, tối giản:** Hỗ trợ 3 chế độ đọc: Sáng (Light), Tối (Dark), Vàng kem hoài cổ (Sepia).
- **Tùy chỉnh linh hoạt:** Thay đổi kích cỡ chữ (14px - 26px), khoảng cách dòng, phông chữ có chân (Serif) / không chân (Sans), chiều rộng trang.
- **Điều hướng nhanh:** Chuyển chương bằng phím mũi tên bàn phím (`←` và `→`), mục lục chương trực quan.
- **Tiến độ đọc tự động:** Tự động ghi nhớ chương đang đọc dở (lưu `localStorage` cho khách và đồng bộ Cloudflare D1 khi đăng nhập).

### 2. Quản Lý Quyền & Bản Quyền Minh Bạch
- **100% Nguồn Hợp Pháp:** Cơ chế hồ sơ bản quyền (`rights_records`) ghi nhận chủ sở hữu, loại giấy phép, phạm vi hiển thị.
- **Không Scrape dữ liệu trái phép:** Chỉ tích hợp tác phẩm tự sáng tác hoặc qua API đối tác đã được cấp phép.
- **Quy trình gỡ bỏ vi phạm (Notice & Takedown):** Trang báo cáo vi phạm bản quyền trực tuyến, lưu lịch sử xử lý.

### 3. Kiến Trúc Bộ Điều Hợp Nguồn (Content Adapters)
- `MockInternalAdapter`: Cung cấp nguồn tác phẩm tự sáng tác có sẵn để demo đầy đủ chức năng.
- `LicensedPartnerAdapter`: Tích hợp chuẩn REST API đối tác với timeout, retry backoff, chống trùng lặp qua `external_id`.
- **Bộ lọc chống SSRF:** Chặn tuyệt đối loopback, private IP và Cloudflare/AWS Metadata IP (`169.254.169.254`).

### 4. Quản Trị Hệ Thống Đầy Đủ (/admin)
- **Thống kê Dashboard:** Số liệu thời gian thực từ Database (truyện, chương, người dùng, lượt xem).
- **CRUD Tác phẩm & Chương:** Soạn thảo, lưu nháp (draft), xuất bản (publish), gỡ bỏ (remove).
- **Quản lý Nguồn & Chạy Đồng Bộ:** Kích hoạt đồng bộ API thủ công và theo dõi nhật ký `sync_runs`.
- **Phân quyền người dùng:** Vai trò `reader`, `editor`, `admin`.
- **Nhật ký kiểm toán (Audit Logs):** Theo dõi mọi hành động sửa đổi dữ liệu quan trọng.

### 5. Tối Ưu SEO & Tích Hợp Google AdSense
- Đường dẫn thân thiện chuẩn tiếng Việt (Slug URL không dấu).
- Tự động tạo `sitemap.xml`, `robots.txt`, `ads.txt`.
- OpenGraph metadata, JSON-LD Schema.
- Component `AdSlot` thanh lịch, bật/tắt qua biến môi trường, không giả mạo publisher ID.

---

## 🏗️ Cấu Trúc Thư Mục

```
CwAI_Story/
├── functions/                    # Cloudflare Pages Functions
│   └── [[route]].ts              # Mount Hono API vào Pages
├── migrations/                   # Cloudflare D1 SQL Migrations
│   ├── 0001_initial_schema.sql   # 13 bảng cơ sở dữ liệu
│   └── 0002_demo_data.sql        # Dữ liệu demo tự sáng tác
├── scripts/
│   └── bootstrap-admin.mjs       # Script khởi tạo admin an toàn
├── server/                       # Backend API (Hono Framework)
│   ├── adapters/                 # Base, Mock & Licensed Partner Adapters
│   ├── routes/                   # books, search, genres, auth, bookmarks, progress, admin, seo
│   ├── app.ts                    # Hono application & Security Middleware
│   ├── auth.ts                   # Session, Cookies & Rate Limiting
│   ├── crypto.ts                 # Web Crypto Native PBKDF2 Hashing
│   └── db.ts                     # D1 Database helpers & Sanitizers
├── shared/
│   └── types.ts                  # Zod Schemas & TypeScript interfaces
├── src/                          # Frontend React SPA
│   ├── components/               # Header, Footer, BookCard, AdSlot, Pagination, Skeleton
│   ├── context/                  # AuthContext, ThemeContext, ConfigContext
│   ├── pages/                    # HomePage, BookList, BookDetail, Reader, Library, Admin, Static pages
│   ├── App.tsx                   # Routing
│   ├── index.css                 # Tailwind directives & styles
│   └── main.tsx                  # React DOM Entry
├── tests/                        # Vitest Test Suites (25 tests passed)
├── wrangler.toml                 # Cấu hình Cloudflare D1 & Pages
├── vite.config.ts                # Cấu hình Vite
└── package.json
```

---

## 🚀 Hướng Dẫn Chạy Cục Bộ (Local Setup)

### Bước 1: Cài đặt thư viện
```bash
npm install
```

### Bước 2: Chạy migration D1 Database
```bash
# Áp dụng bảng dữ liệu
npx wrangler d1 migrations apply DB --local

# Nạp dữ liệu mẫu tự sáng tác
npx wrangler d1 execute DB --local --file=./migrations/0002_demo_data.sql
```

### Bước 3: Khởi tạo tài khoản Quản trị viên (Admin)
```bash
node ./scripts/bootstrap-admin.mjs admin admin@truyennha.vn MatKhauAdmin@123
```

### Bước 4: Chạy kiểm thử tự động
```bash
npm run test
```

### Bước 5: Chạy ứng dụng
```bash
npm run dev
```
Truy cập `http://localhost:3000` trên trình duyệt.

---

## ☁️ Hướng Dẫn Triển Khai Lên Cloudflare

Xem hướng dẫn chi tiết tại: [Tài liệu triển khai Cloudflare](docs/DEPLOYMENT_CLOUDFLARE.md).

Tóm tắt nhanh:
1. Tạo D1 Database: `npx wrangler d1 create truyennha-db`
2. Cập nhật `database_id` vào `wrangler.toml`
3. Chạy migration remote: `npx wrangler d1 migrations apply DB --remote`
4. Cài đặt secret token: `npx wrangler secret put BOOTSTRAP_ADMIN_TOKEN`
5. Build & Deploy:
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=truyennha
   ```
6. Vào Dashboard Cloudflare gắn binding `DB` vào Functions của Pages.

---

## 🔒 Tiêu Chuẩn Bảo Mật

- **Mật khẩu:** Mã hóa bằng `PBKDF2-HMAC-SHA256` với 100,000 vòng lặp + 16-byte random salt qua chuẩn Web Crypto API native.
- **Session:** Cookie `HttpOnly`, `SameSite=Lax`, `Secure`.
- **SQL Injection:** 100% Parameterized queries.
- **SSRF:** Bộ lọc địa chỉ IP nội bộ, loopback và metadata endpoint.
- **Rate Limit:** Tích hợp bộ đếm giới hạn tần suất đăng nhập/đăng ký.

Chi tiết xem tại: [Báo cáo an ninh](docs/SECURITY.md).

---

## 📄 Bản Quyền & Giấy Phép

- Mã nguồn ứng dụng được phát hành theo giấy phép [MIT License](LICENSE).
- **Lưu ý:** Giấy phép mã nguồn KHÔNG cấp quyền đối với các tác phẩm văn học, truyện chữ hoặc tài sản trí tuệ của tác giả/đối tác cấp phép.
