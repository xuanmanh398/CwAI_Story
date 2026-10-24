-- Migration 0008: Bảng hàng đợi kiểm duyệt nội dung vi phạm và trường kiểm duyệt
CREATE TABLE IF NOT EXISTS moderation_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'book' hoặc 'chapter'
  entity_id TEXT NOT NULL,
  book_id TEXT,
  title TEXT NOT NULL,
  author_id TEXT,
  author_name TEXT,
  excerpt TEXT,
  violation_summary TEXT NOT NULL,
  violation_category TEXT, -- 'chủ_quyền_lãnh_thổ', 'phân_biệt_vùng_miền', 'xúc_phạm', 'cổ_xúy_bạo_lực'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by TEXT,
  reviewed_at TEXT,
  author_notified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_moderation_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_entity ON moderation_queue(entity_type, entity_id);
