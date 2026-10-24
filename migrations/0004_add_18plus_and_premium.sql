-- Migration: 0004_add_18plus_and_premium.sql
-- Thêm hỗ trợ phân loại 18+ và gói Premium hạn chế quyền truy cập

ALTER TABLE books ADD COLUMN is_18_plus INTEGER NOT NULL DEFAULT 0;
ALTER TABLE books ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN is_premium INTEGER NOT NULL DEFAULT 0;

INSERT OR IGNORE INTO genres (id, name, slug, description) 
VALUES ('genre_18plus', 'Truyện 18+ (Giới Hạn)', '18-plus', 'Thể loại nội dung dành cho lứa tuổi 18+, yêu cầu tài khoản đặc quyền hoặc thành viên Premium.');
