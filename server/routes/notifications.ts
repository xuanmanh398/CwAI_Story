import { Hono } from 'hono';
import { DbEnv } from '../db';
import { SessionUser } from '../auth';

const notificationsRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

/**
 * GET /api/notifications
 * Lấy danh sách thông báo và số lượng chưa đọc
 */
notificationsRoute.get('/', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');

  if (!currentUser) {
    return c.json({ success: true, data: [], unread_count: 0 });
  }

  try {
    const [unreadRow, notifs] = await Promise.all([
      db
        .prepare('SELECT COUNT(1) as unread_count FROM notifications WHERE user_id = ? AND is_read = 0')
        .bind(currentUser.id)
        .first<{ unread_count: number }>(),
      db
        .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
        .bind(currentUser.id)
        .all(),
    ]);

    return c.json({
      success: true,
      unread_count: unreadRow?.unread_count || 0,
      data: notifs.results || [],
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/notifications/:id/read
 * Đánh dấu 1 thông báo đã đọc
 */
notificationsRoute.post('/:id/read', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');
  const id = c.req.param('id');

  if (!currentUser) {
    return c.json({ success: false, error: 'Chưa đăng nhập' }, 401);
  }

  try {
    await db
      .prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
      .bind(id, currentUser.id)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/notifications/read-all
 * Đánh dấu tất cả thông báo đã đọc
 */
notificationsRoute.post('/read-all', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');

  if (!currentUser) {
    return c.json({ success: false, error: 'Chưa đăng nhập' }, 401);
  }

  try {
    await db
      .prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?')
      .bind(currentUser.id)
      .run();

    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default notificationsRoute;
