-- Migration 0007: Thêm trường KYC tác giả, khóa tài khoản, thời hạn Premium và bảng thông báo người dùng

-- Thêm các trường KYC tác giả và khóa tài khoản cho bảng users
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN id_card_number TEXT;
ALTER TABLE users ADD COLUMN bank_name TEXT;
ALTER TABLE users ADD COLUMN bank_account_number TEXT;
ALTER TABLE users ADD COLUMN locked_until TEXT;
ALTER TABLE users ADD COLUMN lock_reason TEXT;
ALTER TABLE users ADD COLUMN premium_until TEXT;

-- Bảng thông báo / cảnh báo người dùng từ ban quản trị
CREATE TABLE IF NOT EXISTS user_notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'warning', -- 'warning', 'info', 'system'
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON user_notifications(user_id);
