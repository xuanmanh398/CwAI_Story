# Tài Liệu Đặc Tả API - TruyenNha

Tất cả các API trả về định dạng chuẩn JSON:
```json
{
  "success": true,
  "data": { ... },
  "error": "Thông báo lỗi nếu có",
  "meta": { ... }
}
```

---

## 1. Công Khai (Public Endpoints)

### `GET /api/config`
Lấy cấu hình động của website.
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "siteName": "TruyenNha",
    "siteDescription": "Nền tảng đọc truyện chữ tiếng Việt chất lượng cao",
    "siteDomain": "truyennha.vn",
    "primaryColor": "#16a34a",
    "adsense": {
      "enabled": false,
      "publisherId": "",
      "slotTop": "",
      "slotBottom": "",
      "slotReader": ""
    }
  }
}
```

### `GET /api/books`
Danh sách truyện đã xuất bản (`published`).
- **Query Parameters:**
  - `page`: số trang (mặc định: 1)
  - `limit`: số bản ghi mỗi trang (mặc định: 12, tối đa: 50)
  - `genre`: slug thể loại (ví dụ: `tien-hiep`)
  - `status`: trạng thái (`ongoing`, `completed`, `hiatus`)
  - `sort`: sắp xếp (`updated`, `newest`, `views`, `title`)
- **Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "book_daidao",
      "title": "Đại Đạo Phong Vân Ký",
      "slug": "dai-dao-phong-van-ky",
      "author_name": "Lam Vũ",
      "cover_url": "https://...",
      "status": "ongoing",
      "publication_status": "published",
      "view_count": 16,
      "total_chapters": 3,
      "latest_chapter_number": 3,
      "latest_chapter_title": "Chương 3: Trở về Tông Môn",
      "genres": ["Tiên Hiệp", "Huyền Huyễn"],
      "updated_at": "2024-10-20T12:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 12, "total": 4, "totalPages": 1 }
}
```

### `GET /api/books/:slug`
Chi tiết bộ truyện.
- **Response 200 (nếu xuất bản):**
```json
{
  "success": true,
  "data": {
    "id": "book_daidao",
    "title": "Đại Đạo Phong Vân Ký",
    "slug": "dai-dao-phong-van-ky",
    "author_name": "Lam Vũ",
    "author_bio": "Cây bút sáng tác...",
    "cover_url": "https://...",
    "description": "Nội dung tóm tắt...",
    "license_owner": "Tác giả Lam Vũ",
    "license_type": "Độc quyền phân phối điện tử",
    "license_status": "verified",
    "genres": [{ "id": "genre_tienhiep", "name": "Tiên Hiệp", "slug": "tien-hiep" }],
    "total_chapters": 3
  }
}
```
- **Response 404:** Khi truyện không tồn tại hoặc ở trạng thái `draft`/`removed` (đối với độc giả chưa phân quyền).

### `GET /api/books/:slug/chapters`
Lấy danh sách tất cả các chương của bộ truyện (chỉ trả về chương `published`).

### `GET /api/books/:slug/chapters/:chapterNumber`
Đọc nội dung chi tiết một chương.
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "chapter": {
      "id": "chap_dd_1",
      "chapter_number": 1,
      "title": "Chương 1: Phế tích trong cơn giông",
      "slug": "chuong-1-phe-tich-trong-con-giong",
      "content": "Văn bản nội dung chương...",
      "word_count": 420,
      "publication_status": "published"
    },
    "book": {
      "id": "book_daidao",
      "title": "Đại Đạo Phong Vân Ký",
      "slug": "dai-dao-phong-van-ky"
    },
    "prevChapter": null,
    "nextChapter": {
      "chapter_number": 2,
      "title": "Chương 2: Ngưng tụ Luyện Khí Quyết",
      "slug": "chuong-2-ngung-tu-luyen-khi-quyet"
    }
  }
}
```

### `GET /api/search?q=tu_khoa`
Tìm kiếm truyện theo tên truyện, tác giả hoặc slug.

### `GET /api/genres`
Danh sách thể loại và số lượng truyện đã xuất bản.

---

## 2. Xác Thực & Người Dùng (Auth Endpoints)

### `POST /api/auth/register`
- **Request Body:**
```json
{
  "username": "docgia_moi",
  "email": "docgia@example.com",
  "password": "MatKhauBaoMat#123"
}
```
- **Response 200:** Cấp HttpOnly cookie `tn_session`.

### `POST /api/auth/login`
- **Request Body:**
```json
{
  "usernameOrEmail": "docgia_moi",
  "password": "MatKhauBaoMat#123"
}
```

### `POST /api/auth/logout`
Hủy phiên đăng nhập và xóa cookie.

### `GET /api/auth/me`
Lấy thông tin tài khoản hiện tại.

---

## 3. Tủ Sách & Tiến Độ Đọc (Yêu cầu Đăng nhập)

### `GET /api/bookmarks`
Danh sách truyện yêu thích của user.

### `POST /api/bookmarks`
- **Request Body:** `{ "book_id": "book_daidao" }`

### `DELETE /api/bookmarks/:bookId`
Xóa truyện khỏi tủ sách.

### `GET /api/reading-progress`
Lấy toàn bộ lịch sử đọc của người dùng.

### `PUT /api/reading-progress`
- **Request Body:**
```json
{
  "book_id": "book_daidao",
  "last_chapter_id": "chap_dd_2",
  "last_chapter_number": 2,
  "progress_percent": 100
}
```

---

## 4. Quản Trị Hệ Thống (Yêu cầu Role `editor` hoặc `admin`)

- `GET /api/admin/stats`: Thống kê tổng quan.
- `GET /api/admin/books`: Danh sách truyện gồm cả bản nháp và bản gỡ.
- `POST /api/admin/books`: Tạo truyện mới kèm khai báo bản quyền.
- `PUT /api/admin/books/:id`: Cập nhật truyện & trạng thái xuất bản.
- `DELETE /api/admin/books/:id`: Xóa truyện (Chỉ `admin`).
- `POST /api/admin/chapters`: Thêm chương mới.
- `PUT /api/admin/chapters/:id`: Sửa nội dung chương.
- `DELETE /api/admin/chapters/:id`: Xóa chương (Chỉ `admin`).
- `GET /api/admin/sources`: Danh sách nguồn cấp phép.
- `POST /api/admin/sources`: Thêm nguồn cấp phép (xác thực SSRF).
- `POST /api/admin/sources/:id/sync`: Kích hoạt đồng bộ thủ công (Chỉ `admin`).
- `GET /api/admin/rights`: Quản lý hồ sơ bản quyền tác phẩm.
- `PUT /api/admin/rights/:id`: Cập nhật trạng thái xác minh bản quyền.
- `GET /api/admin/users`: Danh sách người dùng (Chỉ `admin`).
- `PUT /api/admin/users/:id/role`: Phân quyền người dùng (Chỉ `admin`).
- `GET /api/admin/audit-logs`: Lịch sử kiểm toán thao tác quản trị.
- `POST /api/admin/bootstrap`: Khởi tạo admin đầu tiên an toàn bằng token bí mật.
