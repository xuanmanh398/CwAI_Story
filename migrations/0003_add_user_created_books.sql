-- Migration: 0003_add_user_created_books.sql
-- Thêm cột created_by_user_id để hỗ trợ tính năng độc giả/tác giả tự đăng truyện

ALTER TABLE books ADD COLUMN created_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_books_created_by ON books(created_by_user_id);
