import { Hono } from 'hono';
import { DbEnv } from '../db';

const genresRoute = new Hono<{ Bindings: DbEnv }>();

/**
 * GET /api/genres
 * Lấy danh sách tất cả các thể loại kèm số lượng truyện xuất bản
 */
genresRoute.get('/', async (c) => {
  const db = c.env.DB;

  const query = `
    SELECT 
      g.id, g.name, g.slug, g.description,
      COUNT(DISTINCT CASE WHEN b.publication_status = 'published' THEN b.id END) as book_count
    FROM genres g
    LEFT JOIN book_genres bg ON g.id = bg.genre_id
    LEFT JOIN books b ON bg.book_id = b.id
    GROUP BY g.id, g.name, g.slug, g.description
    ORDER BY book_count DESC, g.name ASC
  `;

  const rows = await db.prepare(query).all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

export default genresRoute;
