import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { SessionUser } from '../auth';

const commentsRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

/**
 * GET /api/comments
 * Lấy danh sách bình luận của truyện hoặc chương
 */
commentsRoute.get('/', async (c) => {
  const db = c.env.DB;
  const bookId = c.req.query('book_id');
  const chapterId = c.req.query('chapter_id');
  const currentUser = c.get('user');

  if (!bookId) {
    return c.json({ success: false, error: 'Thiếu book_id' }, 400);
  }

  let query = `
    SELECT 
      c.id, c.book_id, c.chapter_id, c.user_id, c.parent_id, c.content, c.likes_count, c.created_at,
      u.username, u.role, u.is_premium, u.is_author,
      (SELECT COUNT(1) FROM comments replies WHERE replies.parent_id = c.id) as reply_count
      ${currentUser ? `, (SELECT COUNT(1) FROM comment_likes cl WHERE cl.comment_id = c.id AND cl.user_id = ?) as user_liked` : ', 0 as user_liked'}
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.book_id = ?
  `;

  const params: any[] = [];
  if (currentUser) params.push(currentUser.id);
  params.push(bookId);

  if (chapterId) {
    query += ' AND c.chapter_id = ?';
    params.push(chapterId);
  } else {
    // Nếu xem ở trang sách thì chỉ lấy comment cấp truyện (không gắn chapter) hoặc tất cả
    query += ' AND (c.chapter_id IS NULL OR c.chapter_id = "")';
  }

  query += ' ORDER BY c.created_at DESC LIMIT 100';

  try {
    const result = await db.prepare(query).bind(...params).all();
    return c.json({
      success: true,
      data: result.results || [],
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/comments
 * Gửi bình luận mới hoặc phản hồi
 */
commentsRoute.post('/', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');

  if (!currentUser) {
    return c.json({ success: false, error: 'Vui lòng đăng nhập để bình luận' }, 401);
  }

  const body = await c.req.json().catch(() => ({}));
  const bookId = body.book_id?.trim();
  const chapterId = body.chapter_id?.trim() || null;
  const parentId = body.parent_id?.trim() || null;
  const content = body.content?.trim();

  if (!bookId || !content) {
    return c.json({ success: false, error: 'Nội dung bình luận không được để trống' }, 400);
  }

  if (content.length < 2) {
    return c.json({ success: false, error: 'Bình luận quá ngắn (tối thiểu 2 ký tự)' }, 400);
  }

  if (content.length > 1000) {
    return c.json({ success: false, error: 'Bình luận tối đa 1000 ký tự' }, 400);
  }

  const commentId = createId('cmt');
  const now = new Date().toISOString();

  try {
    // Kiểm tra flood limit (chống spam liên tục trong 5 giây)
    const recent = await db
      .prepare('SELECT id FROM comments WHERE user_id = ? AND datetime(created_at) > datetime("now", "-5 seconds")')
      .bind(currentUser.id)
      .first();

    if (recent) {
      return c.json({ success: false, error: 'Bạn đang thao tác quá nhanh. Vui lòng chờ vài giây.' }, 429);
    }

    await db
      .prepare(`
        INSERT INTO comments (id, book_id, chapter_id, user_id, parent_id, content, likes_count, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?)
      `)
      .bind(commentId, bookId, chapterId, currentUser.id, parentId, content, now)
      .run();

    // Nếu trả lời bình luận của người khác -> Tạo thông báo cho người đó
    if (parentId) {
      const parentComment = await db
        .prepare('SELECT user_id FROM comments WHERE id = ?')
        .bind(parentId)
        .first<{ user_id: string }>();

      if (parentComment && parentComment.user_id !== currentUser.id) {
        const notifId = createId('notif');
        await db
          .prepare(`
            INSERT INTO notifications (id, user_id, title, content, link, type, is_read, created_at)
            VALUES (?, ?, ?, ?, ?, 'comment', 0, ?)
          `)
          .bind(
            notifId,
            parentComment.user_id,
            'Có phản hồi mới cho bình luận của bạn',
            `${currentUser.username} vừa trả lời bình luận của bạn.`,
            chapterId ? `/books/${bookId}` : `/books/${bookId}`,
            now
          )
          .run();
      }
    }

    return c.json({
      success: true,
      data: {
        id: commentId,
        book_id: bookId,
        chapter_id: chapterId,
        user_id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        is_premium: currentUser.is_premium,
        is_author: currentUser.is_author,
        parent_id: parentId,
        content,
        likes_count: 0,
        user_liked: 0,
        reply_count: 0,
        created_at: now,
      },
      message: 'Gửi bình luận thành công',
    });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * POST /api/comments/:id/like
 * Thích hoặc bỏ thích bình luận
 */
commentsRoute.post('/:id/like', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');
  const commentId = c.req.param('id');

  if (!currentUser) {
    return c.json({ success: false, error: 'Vui lòng đăng nhập' }, 401);
  }

  try {
    const existing = await db
      .prepare('SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?')
      .bind(commentId, currentUser.id)
      .first();

    if (existing) {
      // Đã like -> Huỷ like
      await db.batch([
        db.prepare('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?').bind(commentId, currentUser.id),
        db.prepare('UPDATE comments SET likes_count = MAX(0, likes_count - 1) WHERE id = ?').bind(commentId),
      ]);
      return c.json({ success: true, liked: false });
    } else {
      // Chưa like -> Thêm like
      const now = new Date().toISOString();
      await db.batch([
        db.prepare('INSERT INTO comment_likes (comment_id, user_id, created_at) VALUES (?, ?, ?)').bind(commentId, currentUser.id, now),
        db.prepare('UPDATE comments SET likes_count = likes_count + 1 WHERE id = ?').bind(commentId),
      ]);
      return c.json({ success: true, liked: true });
    }
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

/**
 * DELETE /api/comments/:id
 * Xóa bình luận
 */
commentsRoute.delete('/:id', async (c) => {
  const db = c.env.DB;
  const currentUser = c.get('user');
  const commentId = c.req.param('id');

  if (!currentUser) {
    return c.json({ success: false, error: 'Chưa đăng nhập' }, 401);
  }

  try {
    const comment = await db
      .prepare('SELECT user_id FROM comments WHERE id = ?')
      .bind(commentId)
      .first<{ user_id: string }>();

    if (!comment) {
      return c.json({ success: false, error: 'Bình luận không tồn tại' }, 404);
    }

    const isPrivileged = currentUser.role === 'admin' || currentUser.role === 'editor';
    if (comment.user_id !== currentUser.id && !isPrivileged) {
      return c.json({ success: false, error: 'Không có quyền xóa bình luận này' }, 403);
    }

    await db.prepare('DELETE FROM comments WHERE id = ? OR parent_id = ?').bind(commentId, commentId).run();
    return c.json({ success: true, message: 'Đã xóa bình luận' });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

export default commentsRoute;
