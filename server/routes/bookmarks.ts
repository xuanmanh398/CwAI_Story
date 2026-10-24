import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { requireAuth, SessionUser } from '../auth';

const bookmarksRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

// Yêu cầu đăng nhập cho toàn bộ bookmarks API
bookmarksRoute.use('*', requireAuth);

/**
 * GET /api/bookmarks
 * Lấy danh sách bookmark của user hiện tại
 */
bookmarksRoute.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const query = `
    SELECT 
      bm.id as bookmark_id, bm.created_at as bookmarked_at,
      b.id, b.title, b.slug, b.cover_url, b.status, b.publication_status,
      a.name as author_name,
      rp.last_chapter_number, rp.progress_percent, rp.updated_at as last_read_at,
      (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND c.publication_status = 'published') as total_chapters
    FROM bookmarks bm
    JOIN books b ON bm.book_id = b.id
    LEFT JOIN authors a ON b.author_id = a.id
    LEFT JOIN reading_progress rp ON rp.user_id = bm.user_id AND rp.book_id = bm.book_id
    WHERE bm.user_id = ? AND b.publication_status = 'published'
    ORDER BY bm.created_at DESC
  `;

  const rows = await db.prepare(query).bind(user.id).all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * POST /api/bookmarks
 * Thêm một bộ truyện vào tủ sách
 */
bookmarksRoute.post('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const bookId = body.book_id;

  if (!bookId || typeof bookId !== 'string') {
    return c.json({ success: false, error: 'Thiếu mã truyện hợp lệ' }, 400);
  }

  // Kiểm tra truyện có tồn tại và published không
  const book = await db
    .prepare("SELECT id FROM books WHERE id = ? AND publication_status = 'published'")
    .bind(bookId)
    .first();

  if (!book) {
    return c.json({ success: false, error: 'Truyện không tồn tại hoặc chưa xuất bản' }, 404);
  }

  const bookmarkId = createId('bm');
  const now = new Date().toISOString();

  // Dùng INSERT OR IGNORE để tránh duplicate
  await db
    .prepare('INSERT OR IGNORE INTO bookmarks (id, user_id, book_id, created_at) VALUES (?, ?, ?, ?)')
    .bind(bookmarkId, user.id, bookId, now)
    .run();

  return c.json({
    success: true,
    message: 'Đã lưu truyện vào tủ sách',
  });
});

/**
 * DELETE /api/bookmarks/:bookId
 * Xóa truyện khỏi tủ sách
 */
bookmarksRoute.delete('/:bookId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('bookId');

  await db
    .prepare('DELETE FROM bookmarks WHERE user_id = ? AND book_id = ?')
    .bind(user.id, bookId)
    .run();

  return c.json({
    success: true,
    message: 'Đã xóa truyện khỏi tủ sách',
  });
});

/**
 * GET /api/bookmarks/check/:bookId
 * Kiểm tra xem truyện đã được lưu chưa
 */
bookmarksRoute.get('/check/:bookId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('bookId');

  const row = await db
    .prepare('SELECT id FROM bookmarks WHERE user_id = ? AND book_id = ?')
    .bind(user.id, bookId)
    .first();

  return c.json({
    success: true,
    isBookmarked: !!row,
  });
});

export default bookmarksRoute;
