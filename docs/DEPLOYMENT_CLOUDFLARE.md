# Hướng Dẫn Triển Khai Cloudflare Chi Tiết Từ Đầu

Tài liệu này hướng dẫn toàn bộ quy trình thiết lập và triển khai nền tảng **TruyenNha** lên hệ thống Cloudflare Pages và Cloudflare D1.

---

## 1. Yêu Cầu Chuẩn Bị
- Máy tính đã cài đặt **Node.js** (phiên bản 18+ hoặc 20+) và **npm**.
- Tài khoản Cloudflare (Gói miễn phí - Free Plan hoàn toàn đủ điều kiện).
- Tên miền đã trỏ DNS về Cloudflare (nếu muốn dùng Custom Domain).

---

## 2. Bước 1: Phát Triển & Kiểm Thử Cục Bộ (Local Development)

### 2.1. Cài đặt thư viện
```bash
npm install
```

### 2.2. Khởi tạo Cơ sở dữ liệu D1 Local
Chạy migration tạo schema và nạp dữ liệu mẫu tự sáng tác:
```bash
# 1. Áp dụng schema bảng dữ liệu
npx wrangler d1 migrations apply DB --local

# 2. Nạp dữ liệu demo tự sáng tác
npx wrangler d1 execute DB --local --file=./migrations/0002_demo_data.sql
```

### 2.3. Khởi tạo Tài khoản Quản Trị Viên (Admin) Cục bộ
```bash
node ./scripts/bootstrap-admin.mjs admin admin@truyennha.vn MatKhauAdmin@123
```

### 2.4. Khởi chạy giao diện và kiểm thử
```bash
# Chạy kiểm thử tự động
npm run test

# Chạy build kiểm tra lỗi biên dịch
npm run build

# Khởi chạy frontend Vite
npm run dev
```

---

## 3. Bước 2: Khởi Tạo Tài Nguyên Trên Cloudflare

### 3.1. Đăng nhập Cloudflare CLI
```bash
npx wrangler login
```
Trình duyệt sẽ mở ra để bạn xác thực tài khoản Cloudflare.

### 3.2. Tạo Cơ Sở Dữ Liệu Cloudflare D1
```bash
npx wrangler d1 create truyennha-db
```
Kết quả hiển thị trên màn hình sẽ có dạng:
```toml
[[d1_databases]]
binding = "DB"
database_name = "truyennha-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Hãy mở file `wrangler.toml` và cập nhật trường `database_id` khớp với ID vừa nhận được.

### 3.3. Áp Dụng Migrations Lên Cloudflare D1 Production
```bash
# Áp dụng cấu trúc bảng (schema)
npx wrangler d1 migrations apply DB --remote

# Nạp dữ liệu mẫu ban đầu (tùy chọn)
npx wrangler d1 execute DB --remote --file=./migrations/0002_demo_data.sql
```

---

## 4. Bước 3: Cấu Hình Secrets & Biến Môi Trường

Thiết lập các biến bí mật trên Cloudflare (không lưu vào mã nguồn Git):

```bash
# Token dùng để khởi tạo admin qua endpoint bí mật
npx wrangler secret put BOOTSTRAP_ADMIN_TOKEN
# Nhập chuỗi ngẫu nhiên dài từ 32 ký tự, ví dụ: TruyenNha_SecretBootstrap_2024_xyz

# Khóa bí mật phiên làm việc
npx wrangler secret put SESSION_SECRET
```

---

## 5. Bước 4: Triển Khai Lên Cloudflare Pages

### 5.1. Build mã nguồn Production
```bash
npm run build
```
Thư mục `dist` sẽ được tạo chứa toàn bộ static assets tối ưu.

### 5.2. Deploy ứng dụng lên Cloudflare Pages
```bash
npx wrangler pages deploy dist --project-name=truyennha
```

Lần đầu tiên chạy, Cloudflare Pages sẽ tự động liên kết project. 

### 5.3. Liên kết D1 Database với Cloudflare Pages
1. Truy cập **Cloudflare Dashboard** -> **Workers & Pages** -> Chọn dự án `truyennha`.
2. Vào tab **Settings** -> **Functions** -> **D1 database bindings**.
3. Thêm Binding:
   - **Variable name:** `DB`
   - **D1 database:** Chọn `truyennha-db`
4. Nhấn **Save**.

---

## 6. Bước 5: Khởi Tạo Tài Khoản Quản Trị Viên Trên Production

Sau khi deploy xong, bạn khởi tạo tài khoản Admin đầu tiên bằng lệnh cURL với Token bí mật:

```bash
curl -X POST https://truyennha.pages.dev/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -H "x-bootstrap-token: TruyenNha_SecretBootstrap_2024_xyz" \
  -d '{
    "username": "superadmin",
    "email": "admin@yourdomain.com",
    "password": "MatKhauAdminBaoMat#2024"
  }'
```

Sau khi hoàn tất, endpoint sẽ tự động khóa lại vì hệ thống đã có tài khoản Quản trị viên.

---

## 7. Bước 6: Gắn Custom Domain & Thiết Lập DNS

1. Trong trang dự án Cloudflare Pages, chọn tab **Custom domains**.
2. Nhấn **Set up a custom domain** và nhập tên miền của bạn (ví dụ: `truyennha.vn`).
3. Cloudflare sẽ tự động định tuyến và cấp phát chứng chỉ SSL/TLS miễn phí.

---

## 8. Quy Trình Sao Lưu (Backup) & Phục Hồi (Restore)

### 8.1. Sao lưu dữ liệu D1
```bash
# Xuất toàn bộ dữ liệu ra tệp SQL
npx wrangler d1 export truyennha-db --remote --output=./backup_$(date +%Y%m%d).sql
```

### 8.2. Phục hồi dữ liệu D1
```bash
npx wrangler d1 execute truyennha-db --remote --file=./backup_20241021.sql
```

---

## 9. Định Mức Gói Miễn Phí (Cloudflare Free Tier Limits)

Gói miễn phí của Cloudflare cực kỳ dồi dào cho một website đọc truyện chữ:
- **Cloudflare Pages:** Băng thông và số lượt xem trang tĩnh KHÔNG GIỚI HẠN.
- **Functions / Workers:** 100,000 requests API / ngày.
- **Cloudflare D1:**
  - 5,000,000 lượt đọc (Rows read) / ngày.
  - 100,000 lượt ghi (Rows written) / ngày.
  - 5 GB dung lượng lưu trữ (đủ lưu hàng chục ngàn bộ truyện chữ).
