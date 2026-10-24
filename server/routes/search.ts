import { Hono } from 'hono';
import { DbEnv } from '../db';

const searchRoute = new Hono<{ Bindings: DbEnv }>();

/**
 * GET /api/search?q=...
 * Tìm kiếm truyện đã xuất bản theo tên truyện và tác giả
 */
searchRoute.get('/', async (c) => {
  const db = c.env.DB;
  const rawQ = c.req.query('q') || '';
  const q = rawQ.trim().replace(/\s+/g, ' ');

  if (!q || q.length < 2) {
    return c.json({
      success: true,
      data: [],
      meta: { total: 0, query: q },
    });
  }

  // Cắt ngắn nếu từ khóa quá dài để tránh lạm dụng bộ nhớ
  const safeQ = q.substring(0, 80);
  const searchPattern = `%${safeQ}%`;

  const query = `
    SELECT 
      b.id, b.title, b.slug, b.cover_url, b.description, b.status,
      b.view_count, b.updated_at, a.name as author_name,
      b.price_coins, b.free_chapters_count, b.is_18_plus,
      (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND c.publication_status = 'published') as total_chapters
    FROM books b
    LEFT JOIN authors a ON b.author_id = a.id
    WHERE b.publication_status = 'published'
      AND (b.is_18_plus IS NULL OR b.is_18_plus = 0)
      AND (b.title LIKE ? OR a.name LIKE ? OR b.slug LIKE ?)
    ORDER BY b.updated_at DESC
    LIMIT 20
  `;

  const rows = await db.prepare(query).bind(searchPattern, searchPattern, searchPattern).all();

  return c.json({
    success: true,
    data: rows.results || [],
    meta: {
      total: (rows.results || []).length,
      query: safeQ,
    },
  });
});

export default searchRoute;
