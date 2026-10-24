import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { requireAuth, SessionUser } from '../auth';
import { ReadingProgressSchema } from '../../shared/types';

const progressRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

progressRoute.use('*', requireAuth);

/**
 * GET /api/reading-progress
 * Lấy toàn bộ lịch sử đọc của user
 */
progressRoute.get('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const query = `
    SELECT 
      rp.id, rp.book_id, rp.last_chapter_id, rp.last_chapter_number,
      rp.progress_percent, rp.updated_at,
      b.title as book_title, b.slug as book_slug, b.cover_url as book_cover_url,
      c.title as last_chapter_title, c.slug as last_chapter_slug,
      (SELECT COUNT(*) FROM chapters ch WHERE ch.book_id = b.id AND ch.publication_status = 'published') as total_chapters
    FROM reading_progress rp
    JOIN books b ON rp.book_id = b.id
    LEFT JOIN chapters c ON rp.last_chapter_id = c.id
    WHERE rp.user_id = ? AND b.publication_status = 'published'
    ORDER BY rp.updated_at DESC
    LIMIT 50
  `;

  const rows = await db.prepare(query).bind(user.id).all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * GET /api/reading-progress/:bookId
 * Lấy tiến độ đọc của một truyện cụ thể
 */
progressRoute.get('/:bookId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('bookId');

  const row = await db
    .prepare(`
      SELECT rp.last_chapter_id, rp.last_chapter_number, rp.progress_percent, rp.updated_at,
             c.title as last_chapter_title, c.slug as last_chapter_slug
      FROM reading_progress rp
      LEFT JOIN chapters c ON rp.last_chapter_id = c.id
      WHERE rp.user_id = ? AND rp.book_id = ?
    `)
    .bind(user.id, bookId)
    .first();

  return c.json({
    success: true,
    data: row || null,
  });
});

/**
 * PUT /api/reading-progress
 * Cập nhật tiến độ đọc chương
 */
progressRoute.put('/', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const parseResult = ReadingProgressSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: 'Dữ liệu tiến độ không hợp lệ' }, 400);
  }

  const { book_id, last_chapter_id, last_chapter_number, progress_percent } = parseResult.data;
  const now = new Date().toISOString();

  // UPSERT vào reading_progress
  const progressId = createId('rp');
  await db
    .prepare(`
      INSERT INTO reading_progress (id, user_id, book_id, last_chapter_id, last_chapter_number, progress_percent, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, book_id) DO UPDATE SET
        last_chapter_id = excluded.last_chapter_id,
        last_chapter_number = excluded.last_chapter_number,
        progress_percent = excluded.progress_percent,
        updated_at = excluded.updated_at
    `)
    .bind(progressId, user.id, book_id, last_chapter_id, last_chapter_number, progress_percent, now)
    .run();

  return c.json({ success: true, message: 'Đã lưu tiến độ đọc' });
});

export default progressRoute;
