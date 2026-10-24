import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { SessionUser } from '../auth';

const reportsRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

/**
 * POST /api/reports/chapter
 * Độc giả báo lỗi chương truyện
 */
reportsRoute.post('/chapter', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');

  const body = await c.req.json().catch(() => ({}));
  const bookId = body.book_id?.trim();
  const chapterId = body.chapter_id?.trim();
  const reason = body.reason?.trim() || 'typo';
  const description = body.description?.trim() || '';

  if (!bookId || !chapterId) {
    return c.json({ success: false, error: 'Thiếu thông tin sách hoặc chương' }, 400);
  }

  const reportId = createId('rpt');
  const now = new Date().toISOString();

  try {
    await db
      .prepare(`
        INSERT INTO chapter_reports (id, book_id, chapter_id, user_id, reason, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
      `)
      .bind(reportId, bookId, chapterId, currentUser ? currentUser.id : null, reason, description, now)
      .run();

    return c.json({
      success: true,
      message: 'Cảm ơn bạn đã phản hồi! Ban biên tập sẽ kiểm tra và khắc phục sớm nhất.',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * GET /api/reports/chapter
 * Quản trị viên lấy danh sách báo lỗi
 */
reportsRoute.get('/chapter', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'editor')) {
    return c.json({ success: false, error: 'Không có quyền truy cập' }, 403);
  }

  try {
    const list = await db
      .prepare(`
        SELECT 
          r.id, r.book_id, r.chapter_id, r.user_id, r.reason, r.description, r.status, r.created_at,
          b.title as book_title, b.slug as book_slug,
          c.title as chapter_title, c.chapter_number, c.slug as chapter_slug,
          u.username as reporter_name
        FROM chapter_reports r
        JOIN books b ON r.book_id = b.id
        JOIN chapters c ON r.chapter_id = c.id
        LEFT JOIN users u ON r.user_id = u.id
        ORDER BY r.created_at DESC
        LIMIT 50
      `)
      .all();

    return c.json({ success: true, data: list.results || [] });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default reportsRoute;
