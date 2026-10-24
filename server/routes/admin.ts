import { Hono } from 'hono';
import { DbEnv, createId, slugify } from '../db';
import { requireAuth, requireRole, SessionUser } from '../auth';
import { generateSalt, hashPassword } from '../crypto';
import { validateSafeUrl } from '../adapters/base';
import { MockInternalAdapter } from '../adapters/mock';
import { LicensedPartnerAdapter } from '../adapters/licensed-api';
import { BookCreateSchema, ChapterCreateSchema, ContentSourceSchema } from '../../shared/types';
import { SEED_50_NOVELS } from '../data/seed-novels';
import { sendEmail } from '../services/email';
import { testAiConnection, discoverAiModels, DEFAULT_AI_CONFIG } from '../services/ai';

const adminRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

// Helper ghi audit log
async function logAudit(
  db: D1Database,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  details: Record<string, unknown>,
  ip?: string
) {
  const logId = createId('aud');
  const now = new Date().toISOString();
  await db
    .prepare(
      'INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(logId, userId, action, entityType, entityId, JSON.stringify(details), ip || null, now)
    .run();
}

/**
 * POST /api/admin/bootstrap
 * Thiết lập tài khoản admin đầu tiên an toàn
 * Chỉ kích hoạt nếu:
 * 1. Chưa có bất kỳ admin nào trong hệ thống, HOẶC
 * 2. Header `x-bootstrap-token` khớp với secret `BOOTSTRAP_ADMIN_TOKEN` được cấu hình qua biến môi trường.
 */
adminRoute.post('/bootstrap', async (c) => {
  const db = c.env.DB;
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const bootstrapTokenHeader = c.req.header('x-bootstrap-token');
  const envToken = c.env.BOOTSTRAP_ADMIN_TOKEN;

  // Kiểm tra đã có admin chưa
  const existingAdmin = await db
    .prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1")
    .first();

  const isTokenValid = envToken && bootstrapTokenHeader && bootstrapTokenHeader === envToken;

  if (existingAdmin && !isTokenValid) {
    return c.json(
      {
        success: false,
        error: 'Hệ thống đã có quản trị viên. Cần cung cấp Bootstrap Token hợp lệ qua biến môi trường để cấu hình lại.',
      },
      403
    );
  }

  const body = await c.req.json().catch(() => ({}));
  const username = (body.username || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (username.length < 3 || !email.includes('@') || password.length < 8) {
    return c.json(
      {
        success: false,
        error: 'Dữ liệu không hợp lệ. Mật khẩu admin phải từ 8 ký tự trở lên.',
      },
      400
    );
  }

  const userId = createId('adm');
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)'
    )
    .bind(userId, username, email, passwordHash, salt, 'admin', now, now)
    .run();

  await logAudit(db, userId, 'BOOTSTRAP_ADMIN', 'user', userId, { username, email }, ip);

  return c.json({
    success: true,
    message: 'Khởi tạo tài khoản Quản Trị Viên thành công',
    data: { id: userId, username, email, role: 'admin' },
  });
});

// Các endpoint dưới đây đều bắt buộc đăng nhập và quyền Quản trị viên (Admin) duy nhất
// Biên tập viên chỉ có thể đăng bài qua Studio, không thể vào trang quản trị
adminRoute.use('*', requireAuth);
adminRoute.use('*', requireRole('admin'));

/**
 * GET /api/admin/stats
 * Thống kê tổng quan dashboard từ cơ sở dữ liệu thật
 */
adminRoute.get('/stats', async (c) => {
  const db = c.env.DB;

  const [booksStat, chaptersStat, usersStat, viewsStat, monetizationStat, pendingWithdrawals] = await Promise.all([
    db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN publication_status = 'published' THEN 1 END) as published,
        COUNT(CASE WHEN publication_status = 'draft' THEN 1 END) as draft
      FROM books
    `).first<{ total: number; published: number; draft: number }>(),

    db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN publication_status = 'published' THEN 1 END) as published
      FROM chapters
    `).first<{ total: number; published: number }>(),

    db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'editor' THEN 1 END) as editors
      FROM users
    `).first<{ total: number; admins: number; editors: number }>(),

    db.prepare(`
      SELECT SUM(view_count) as total_views FROM books
    `).first<{ total_views: number }>(),

    db.prepare(`
      SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(platform_fee), 0) as platform_revenue_vnd,
        COALESCE(SUM(author_earned), 0) as author_earned_vnd
      FROM book_purchases
    `).first<{ total_purchases: number; platform_revenue_vnd: number; author_earned_vnd: number }>(),

    db.prepare(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM withdrawal_requests
      WHERE status = 'pending'
    `).first<{ count: number; total_amount: number }>(),
  ]);

  return c.json({
    success: true,
    data: {
      books: booksStat,
      chapters: chaptersStat,
      users: usersStat,
      totalViews: viewsStat?.total_views || 0,
      monetization: {
        totalPurchases: monetizationStat?.total_purchases || 0,
        total_purchases: monetizationStat?.total_purchases || 0,
        platformRevenueVnd: monetizationStat?.platform_revenue_vnd || 0,
        platform_fee_revenue: monetizationStat?.platform_revenue_vnd || 0,
        authorEarnedVnd: monetizationStat?.author_earned_vnd || 0,
        author_revenue: monetizationStat?.author_earned_vnd || 0,
        total_revenue_coins: (monetizationStat?.platform_revenue_vnd || 0) + (monetizationStat?.author_earned_vnd || 0),
        pendingWithdrawalsCount: pendingWithdrawals?.count || 0,
        pending_withdrawals_count: pendingWithdrawals?.count || 0,
        pendingWithdrawalsAmount: pendingWithdrawals?.total_amount || 0,
        pending_withdrawals_amount: pendingWithdrawals?.total_amount || 0,
      },
    },
  });
});

/**
 * GET /api/admin/books
 * Lấy danh sách truyện trong admin (kể cả draft, unpublished)
 */
adminRoute.get('/books', async (c) => {
  const db = c.env.DB;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;
  const status = c.req.query('status');
  const pubStatus = c.req.query('pub_status');

  const conditions: string[] = ['1=1'];
  const params: (string | number)[] = [];

  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (pubStatus) {
    conditions.push('b.publication_status = ?');
    params.push(pubStatus);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) as total FROM books b WHERE ${whereClause}`;
  const totalRow = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  const total = totalRow?.total || 0;

  const dataQuery = `
    SELECT 
      b.*, a.name as author_name,
      r.owner_name as license_owner, r.verification_status as license_status,
      (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id) as total_chapters
    FROM books b
    LEFT JOIN authors a ON b.author_id = a.id
    LEFT JOIN rights_records r ON r.book_id = b.id
    WHERE ${whereClause}
    ORDER BY b.updated_at DESC
    LIMIT ? OFFSET ?
  `;

  const rows = await db.prepare(dataQuery).bind(...params, limit, offset).all();

  return c.json({
    success: true,
    data: rows.results || [],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * POST /api/admin/books
 * Thêm truyện mới
 */
adminRoute.post('/books', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const parseResult = BookCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
  }

  const data = parseResult.data;
  const bookId = createId('bk');
  const now = new Date().toISOString();

  // Kiểm tra trùng slug
  const existingSlug = await db.prepare('SELECT id FROM books WHERE slug = ?').bind(data.slug).first();
  if (existingSlug) {
    return c.json({ success: false, error: 'Slug truyện đã tồn tại, vui lòng chọn slug khác' }, 409);
  }

  let authorId = data.author_id || null;
  // Tạo tác giả mới nếu được chỉ định
  if (!authorId && data.author_name?.trim()) {
    const authorSlug = slugify(data.author_name);
    const existingAuthor = await db.prepare('SELECT id FROM authors WHERE slug = ?').bind(authorSlug).first<{ id: string }>();
    if (existingAuthor) {
      authorId = existingAuthor.id;
    } else {
      authorId = createId('auth');
      await db
        .prepare('INSERT INTO authors (id, name, slug, created_at) VALUES (?, ?, ?, ?)')
        .bind(authorId, data.author_name.trim(), authorSlug, now)
        .run();
    }
  }

  const is18Plus = data.is_18_plus ? 1 : 0;
  const isPremium = data.is_premium ? 1 : 0;

  await db
    .prepare(`
      INSERT INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, view_count, is_18_plus, is_premium, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'original', 0, ?, ?, ?, ?)
    `)
    .bind(
      bookId,
      data.title,
      data.slug,
      authorId,
      data.cover_url || null,
      data.description,
      data.status,
      data.publication_status,
      is18Plus,
      isPremium,
      now,
      now
    )
    .run();

  // Gắn thể loại
  const targetGenreIds = [...(data.genre_ids || [])];
  if (is18Plus === 1 && !targetGenreIds.includes('genre_18plus')) {
    targetGenreIds.push('genre_18plus');
  }

  if (targetGenreIds.length > 0) {
    for (const gId of targetGenreIds) {
      await db.prepare('INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)').bind(bookId, gId).run();
    }
  }

  // Tạo bản ghi quyền tác giả nếu có
  if (data.license_owner?.trim()) {
    const rightsId = createId('rgt');
    await db
      .prepare(`
        INSERT INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'Toàn cầu', ?, 'verified', ?, ?)
      `)
      .bind(
        rightsId,
        bookId,
        data.license_owner.trim(),
        data.license_type || 'Bản quyền tác giả tự do',
        data.permitted_scope || 'Toàn quyền xuất bản trên TruyenNha',
        now,
        now,
        now
      )
      .run();
  }

  await logAudit(db, user.id, 'CREATE_BOOK', 'book', bookId, { title: data.title, slug: data.slug }, ip);

  return c.json({ success: true, data: { id: bookId, slug: data.slug } });
});

/**
 * PUT /api/admin/books/:id
 * Cập nhật thông tin truyện và trạng thái xuất bản
 */
adminRoute.put('/books/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const existing = await db.prepare('SELECT id, title FROM books WHERE id = ?').bind(bookId).first();
  if (!existing) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  const { title, cover_url, description, status, publication_status } = body;
  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE books 
      SET title = COALESCE(?, title),
          cover_url = COALESCE(?, cover_url),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          publication_status = COALESCE(?, publication_status),
          updated_at = ?
      WHERE id = ?
    `)
    .bind(title || null, cover_url || null, description || null, status || null, publication_status || null, now, bookId)
    .run();

  await logAudit(db, user.id, 'UPDATE_BOOK', 'book', bookId, { title, publication_status }, ip);

  return c.json({ success: true, message: 'Đã cập nhật bộ truyện' });
});

/**
 * DELETE /api/admin/books/:id
 * Xóa bộ truyện (chỉ admin có quyền)
 */
adminRoute.delete('/books/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  const book = await db.prepare('SELECT id, title FROM books WHERE id = ?').bind(bookId).first<{ id: string; title: string }>();
  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  await db.prepare('DELETE FROM books WHERE id = ?').bind(bookId).run();
  await logAudit(db, user.id, 'DELETE_BOOK', 'book', bookId, { title: book.title }, ip);

  return c.json({ success: true, message: 'Đã xóa bộ truyện và toàn bộ chương liên quan' });
});

/**
 * POST /api/admin/chapters
 * Thêm chương mới cho truyện
 */
adminRoute.post('/chapters', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const parseResult = ChapterCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: parseResult.error.errors[0]?.message || 'Dữ liệu chương không hợp lệ' }, 400);
  }

  const { book_id, chapter_number, title, slug, content, publication_status } = parseResult.data;
  const chapterId = createId('ch');
  const now = new Date().toISOString();
  const wordCount = content.trim().split(/\s+/).length;

  try {
    await db
      .prepare(`
        INSERT INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(chapterId, book_id, chapter_number, title, slug, content, wordCount, publication_status, now, now)
      .run();

    // Cập nhật updated_at của truyện
    await db.prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(now, book_id).run();

    await logAudit(db, user.id, 'CREATE_CHAPTER', 'chapter', chapterId, { book_id, chapter_number, title }, ip);

    return c.json({ success: true, data: { id: chapterId } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('UNIQUE')) {
      return c.json({ success: false, error: 'Số thứ tự chương hoặc slug chương này đã tồn tại trong truyện' }, 409);
    }
    return c.json({ success: false, error: 'Lỗi khi lưu chương' }, 500);
  }
});

/**
 * PUT /api/admin/chapters/:id
 * Cập nhật chương
 */
adminRoute.put('/chapters/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const chapterId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const { title, content, publication_status } = body;
  const now = new Date().toISOString();
  const wordCount = content ? content.trim().split(/\s+/).length : null;

  await db
    .prepare(`
      UPDATE chapters
      SET title = COALESCE(?, title),
          content = COALESCE(?, content),
          word_count = COALESCE(?, word_count),
          publication_status = COALESCE(?, publication_status),
          updated_at = ?
      WHERE id = ?
    `)
    .bind(title || null, content || null, wordCount, publication_status || null, now, chapterId)
    .run();

  await logAudit(db, user.id, 'UPDATE_CHAPTER', 'chapter', chapterId, { title, publication_status }, ip);

  return c.json({ success: true, message: 'Đã cập nhật chương thành công' });
});

/**
 * DELETE /api/admin/chapters/:id
 * Xóa một chương (chỉ admin)
 */
adminRoute.delete('/chapters/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const chapterId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  await db.prepare('DELETE FROM chapters WHERE id = ?').bind(chapterId).run();
  await logAudit(db, user.id, 'DELETE_CHAPTER', 'chapter', chapterId, {}, ip);

  return c.json({ success: true, message: 'Đã xóa chương' });
});

/**
 * GET /api/admin/sources
 * Lấy danh sách nguồn cấp phép
 */
adminRoute.get('/sources', async (c) => {
  const db = c.env.DB;
  const rows = await db.prepare('SELECT * FROM content_sources ORDER BY created_at DESC').all();
  return c.json({ success: true, data: rows.results || [] });
});

/**
 * POST /api/admin/sources
 * Thêm nguồn cấp phép mới (chỉ admin, kiểm tra SSRF)
 */
adminRoute.post('/sources', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const parseResult = ContentSourceSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
  }

  const { name, slug, provider_type, base_url, is_active, sync_frequency, config_json } = parseResult.data;

  // SSRF check
  const check = validateSafeUrl(base_url);
  if (!check.safe) {
    return c.json({ success: false, error: `Base URL không an toàn: ${check.reason}` }, 400);
  }

  const sourceId = createId('src');
  const now = new Date().toISOString();

  await db
    .prepare(`
      INSERT INTO content_sources (id, name, slug, provider_type, base_url, is_active, sync_frequency, config_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(sourceId, name, slug, provider_type, base_url, is_active ? 1 : 0, sync_frequency, config_json, now)
    .run();

  await logAudit(db, user.id, 'CREATE_CONTENT_SOURCE', 'source', sourceId, { name, base_url }, ip);

  return c.json({ success: true, data: { id: sourceId } });
});

/**
 * POST /api/admin/sources/:id/sync
 * Chạy đồng bộ nguồn cấp phép thủ công
 */
adminRoute.post('/sources/:id/sync', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const sourceId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  const source = await db.prepare('SELECT * FROM content_sources WHERE id = ?').bind(sourceId).first<{
    id: string;
    name: string;
    provider_type: string;
    base_url: string;
    config_json: string;
  }>();

  if (!source) {
    return c.json({ success: false, error: 'Nguồn không tồn tại' }, 404);
  }

  const runId = createId('sync');
  const now = new Date().toISOString();

  // Khởi tạo bản ghi sync_runs
  await db
    .prepare('INSERT INTO sync_runs (id, source_id, status, total_fetched, total_saved, errors_json, started_at) VALUES (?, ?, ?, 0, 0, ?, ?)')
    .bind(runId, sourceId, 'running', '[]', now)
    .run();

  let adapter;
  if (source.provider_type === 'mock_internal') {
    adapter = new MockInternalAdapter();
  } else {
    adapter = new LicensedPartnerAdapter();
  }

  let totalFetched = 0;
  let totalSaved = 0;
  const errors: string[] = [];

  try {
    const books = await adapter.fetchBooks(source.base_url, source.config_json);
    totalFetched = books.length;

    for (const b of books) {
      const bookSlug = b.slug || slugify(b.title);
      // Tìm theo external_id
      const existing = await db
        .prepare('SELECT id FROM books WHERE external_id = ?')
        .bind(b.externalId)
        .first<{ id: string }>();

      let bookDbId = existing?.id;
      if (!bookDbId) {
        bookDbId = createId('bk');
        // Tạo tác giả nếu chưa có
        const authSlug = slugify(b.authorName);
        let authorRow = await db.prepare('SELECT id FROM authors WHERE slug = ?').bind(authSlug).first<{ id: string }>();
        if (!authorRow) {
          const newAuthId = createId('auth');
          await db
            .prepare('INSERT INTO authors (id, name, slug, created_at) VALUES (?, ?, ?, ?)')
            .bind(newAuthId, b.authorName, authSlug, now)
            .run();
          authorRow = { id: newAuthId };
        }

        // Lưu truyện với trạng thái published vì là nguồn cấp phép đã thẩm định
        await db
          .prepare(`
            INSERT INTO books (id, title, slug, author_id, cover_url, description, status, publication_status, source_type, external_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 'licensed_api', ?, ?, ?)
          `)
          .bind(bookDbId, b.title, bookSlug, authorRow.id, b.coverUrl || null, b.description, b.status, b.externalId, now, now)
          .run();

        // Ghi rights record
        const rightsId = createId('rgt');
        await db
          .prepare(`
            INSERT INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes, created_at, updated_at)
            VALUES (?, ?, ?, 'Hợp đồng cấp quyền số', 'Xuất bản trực tuyến tiếng Việt', 'Toàn cầu', ?, 'verified', ?, ?, ?)
          `)
          .bind(rightsId, bookDbId, b.licenseOwner, now, b.licenseNotes || '', now, now)
          .run();

        totalSaved++;
      }

      // Lấy các chương của bộ truyện
      const chapters = await adapter.fetchChapters(source.base_url, b.externalId, source.config_json);
      for (const ch of chapters) {
        const chSlug = ch.slug || `chuong-${ch.chapterNumber}-${slugify(ch.title)}`;
        const wordCount = ch.content.trim().split(/\s+/).length;

        await db
          .prepare(`
            INSERT INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
            ON CONFLICT(book_id, chapter_number) DO UPDATE SET
              title = excluded.title,
              content = excluded.content,
              word_count = excluded.word_count,
              updated_at = excluded.updated_at
          `)
          .bind(createId('ch'), bookDbId, ch.chapterNumber, ch.title, chSlug, ch.content, wordCount, now, now)
          .run();
      }
    }

    const completedAt = new Date().toISOString();
    await db
      .prepare('UPDATE sync_runs SET status = ?, total_fetched = ?, total_saved = ?, completed_at = ? WHERE id = ?')
      .bind('success', totalFetched, totalSaved, completedAt, runId)
      .run();

    await db
      .prepare('UPDATE content_sources SET last_synced_at = ? WHERE id = ?')
      .bind(completedAt, sourceId)
      .run();

    await logAudit(db, user.id, 'SYNC_SOURCE', 'source', sourceId, { totalFetched, totalSaved }, ip);

    return c.json({
      success: true,
      data: { runId, totalFetched, totalSaved, status: 'success' },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    errors.push(errorMsg);

    await db
      .prepare('UPDATE sync_runs SET status = ?, errors_json = ?, completed_at = ? WHERE id = ?')
      .bind('failed', JSON.stringify(errors), new Date().toISOString(), runId)
      .run();

    return c.json({ success: false, error: `Đồng bộ thất bại: ${errorMsg}` }, 500);
  }
});

/**
 * GET /api/admin/rights
 * Quản lý hồ sơ bản quyền
 */
adminRoute.get('/rights', async (c) => {
  const db = c.env.DB;
  const rows = await db
    .prepare(`
      SELECT r.*, b.title as book_title, b.slug as book_slug
      FROM rights_records r
      JOIN books b ON r.book_id = b.id
      ORDER BY r.created_at DESC
    `)
    .all();

  return c.json({ success: true, data: rows.results || [] });
});

/**
 * PUT /api/admin/rights/:id
 * Cập nhật trạng thái xác minh bản quyền (unverified, verified, revoked)
 */
adminRoute.put('/rights/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const rightsId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const { verification_status, contract_ref_url, attribution_notes } = body;
  if (!['unverified', 'verified', 'revoked'].includes(verification_status)) {
    return c.json({ success: false, error: 'Trạng thái xác minh không hợp lệ' }, 400);
  }

  const now = new Date().toISOString();
  await db
    .prepare(`
      UPDATE rights_records 
      SET verification_status = ?, contract_ref_url = COALESCE(?, contract_ref_url), attribution_notes = COALESCE(?, attribution_notes), updated_at = ?
      WHERE id = ?
    `)
    .bind(verification_status, contract_ref_url || null, attribution_notes || null, now, rightsId)
    .run();

  // Nếu bị thu hồi (revoked), tự động gỡ xuất bản truyện
  if (verification_status === 'revoked') {
    const right = await db.prepare('SELECT book_id FROM rights_records WHERE id = ?').bind(rightsId).first<{ book_id: string }>();
    if (right) {
      await db.prepare("UPDATE books SET publication_status = 'removed', updated_at = ? WHERE id = ?").bind(now, right.book_id).run();
    }
  }

  await logAudit(db, user.id, 'UPDATE_RIGHTS_STATUS', 'rights', rightsId, { verification_status }, ip);

  return c.json({ success: true, message: 'Đã cập nhật trạng thái bản quyền' });
});

/**
 * GET /api/admin/audit-logs
 * Xem lịch sử kiểm toán thao tác quản trị
 */
adminRoute.get('/audit-logs', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50', 10)));

  const rows = await db
    .prepare(`
      SELECT a.*, u.username, u.email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `)
    .bind(limit)
    .all();

  return c.json({ success: true, data: rows.results || [] });
});

/**
 * GET /api/admin/users
 * Danh sách người dùng đầy đủ thông tin KYC, tài chính & trạng thái khóa
 */
adminRoute.get('/users', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const rows = await db
    .prepare(`
      SELECT 
        id, username, email, role, is_active, is_author, is_premium, coins, author_earnings,
        full_name, id_card_number, bank_name, bank_account_number, locked_until, lock_reason, premium_until,
        created_at, updated_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 200
    `)
    .all();

  return c.json({ success: true, data: rows.results || [] });
});

/**
 * POST /api/admin/users/:id/warn
 * Gửi email cảnh báo và thông báo trực tiếp đến tài khoản người dùng
 */
adminRoute.post('/users/:id/warn', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const admin = c.get('user')!;
  const targetId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  const title = (body.title || 'Cảnh báo vi phạm từ Quản trị viên Truyện Nhà').trim();
  const content = (body.content || '').trim();

  if (!content) {
    return c.json({ success: false, error: 'Vui lòng nhập nội dung cảnh báo' }, 400);
  }

  const targetUser = await db
    .prepare('SELECT id, username, email FROM users WHERE id = ?')
    .bind(targetId)
    .first<{ id: string; username: string; email: string }>();

  if (!targetUser) {
    return c.json({ success: false, error: 'Không tìm thấy người dùng' }, 404);
  }

  const now = new Date().toISOString();

  // 1. Lưu thông báo vào user_notifications
  await db
    .prepare(`
      INSERT INTO user_notifications (id, user_id, title, content, type, is_read, created_at)
      VALUES (?, ?, ?, ?, 'warning', 0, ?)
    `)
    .bind(createId('notif'), targetUser.id, title, content, now)
    .run();

  // 2. Gửi email cảnh báo trực tiếp đến hòm thư người dùng
  await sendEmail(c.env, {
    to: targetUser.email,
    subject: `[Truyện Nhà] ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fffafb;">
        <h2 style="color: #dc2626; border-bottom: 2px solid #fecaca; padding-bottom: 10px;">⚠️ Thông Báo Cảnh Báo Vi Phạm</h2>
        <p>Xin chào <strong>${targetUser.username}</strong>,</p>
        <p>Ban quản trị hệ thống <strong>Truyện Nhà</strong> gửi thông báo cảnh báo đến bạn:</p>
        <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; line-height: 1.6; color: #7f1d1d; white-space: pre-line;">
          ${content}
        </div>
        <p style="font-size: 12px; color: #6b7280; margin-top: 24px;">
          Vui lòng tuân thủ đúng nội quy và chính sách của Truyện Nhà để tránh tài khoản bị khóa vĩnh viễn.
        </p>
      </div>
    `,
  });

  // 3. Ghi audit log
  await logAudit(db, admin.id, 'WARN_USER', 'user', targetId, { title, content, email: targetUser.email }, ip);

  return c.json({
    success: true,
    message: `Đã gửi cảnh báo thành công đến hòm thư ${targetUser.email} và thông báo hệ thống của người dùng.`,
  });
});

/**
 * POST /api/admin/users/:id/lock
 * Khóa tài khoản có thời hạn hoặc vô thời hạn (vĩnh viễn)
 */
adminRoute.post('/users/:id/lock', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const admin = c.get('user')!;
  const targetId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  if (targetId === admin.id) {
    return c.json({ success: false, error: 'Bạn không thể tự khóa tài khoản của chính mình' }, 400);
  }

  const targetUser = await db
    .prepare('SELECT id, username, email FROM users WHERE id = ?')
    .bind(targetId)
    .first<{ id: string; username: string; email: string }>();

  if (!targetUser) {
    return c.json({ success: false, error: 'Không tìm thấy người dùng' }, 404);
  }

  const lockType = body.lockType || 'temporary'; // 'temporary' | 'permanent'
  const days = parseInt(body.days || '7', 10);
  const reason = (body.reason || 'Vi phạm điều khoản dịch vụ của Truyện Nhà').trim();
  const notifyEmail = body.notifyEmail !== false;

  const now = new Date();
  let lockedUntilIso = '9999-12-31T23:59:59.999Z'; // Vô thời hạn
  let lockDurationText = 'Vô thời hạn (Vĩnh viễn)';

  if (lockType === 'temporary') {
    const unlockDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    lockedUntilIso = unlockDate.toISOString();
    lockDurationText = `${days} ngày (đến ngày ${unlockDate.toLocaleDateString('vi-VN')})`;
  }

  // 1. Cập nhật khóa tài khoản và xóa mọi phiên đăng nhập đang hoạt động của user
  await db
    .prepare('UPDATE users SET is_active = 0, locked_until = ?, lock_reason = ?, updated_at = ? WHERE id = ?')
    .bind(lockedUntilIso, reason, now.toISOString(), targetId)
    .run();

  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(targetId).run();

  // 2. Gửi email thông báo nếu có
  if (notifyEmail) {
    await sendEmail(c.env, {
      to: targetUser.email,
      subject: `[Truyện Nhà] Thông báo tạm khóa tài khoản: ${targetUser.username}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #fffafb;">
          <h2 style="color: #dc2626;">🔒 Tài Khoản Đã Bị Khóa</h2>
          <p>Xin chào <strong>${targetUser.username}</strong>,</p>
          <p>Tài khoản của bạn tại <strong>Truyện Nhà</strong> đã bị khóa với thông tin chi tiết:</p>
          <ul>
            <li><strong>Thời hạn khóa:</strong> ${lockDurationText}</li>
            <li><strong>Lý do:</strong> ${reason}</li>
          </ul>
          <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
            Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ email hỗ trợ của ban quản trị.
          </p>
        </div>
      `,
    });
  }

  // 3. Ghi audit log
  await logAudit(db, admin.id, 'LOCK_USER', 'user', targetId, { lockType, days, lockedUntilIso, reason }, ip);

  return c.json({
    success: true,
    message: `Đã khóa tài khoản ${targetUser.username} (${lockDurationText}).`,
    data: { locked_until: lockedUntilIso, lock_reason: reason },
  });
});

/**
 * POST /api/admin/users/:id/unlock
 * Mở khóa tài khoản người dùng
 */
adminRoute.post('/users/:id/unlock', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const admin = c.get('user')!;
  const targetId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  const now = new Date().toISOString();
  await db
    .prepare('UPDATE users SET is_active = 1, locked_until = NULL, lock_reason = NULL, updated_at = ? WHERE id = ?')
    .bind(now, targetId)
    .run();

  await logAudit(db, admin.id, 'UNLOCK_USER', 'user', targetId, {}, ip);

  return c.json({
    success: true,
    message: 'Đã mở khóa tài khoản thành công.',
  });
});

/**
 * DELETE /api/admin/users/:id
 * Xóa người dùng vĩnh viễn khỏi hệ thống
 */
adminRoute.delete('/users/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const admin = c.get('user')!;
  const targetId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  if (targetId === admin.id) {
    return c.json({ success: false, error: 'Bạn không thể tự xóa tài khoản của chính mình' }, 400);
  }

  const targetUser = await db
    .prepare('SELECT id, username, email FROM users WHERE id = ?')
    .bind(targetId)
    .first<{ id: string; username: string; email: string }>();

  if (!targetUser) {
    return c.json({ success: false, error: 'Không tìm thấy người dùng' }, 404);
  }

  // Xóa các bảng liên kết
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(targetId).run();
  await db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(targetId).run();
  await db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(targetId).run();
  await db.prepare('DELETE FROM user_notifications WHERE user_id = ?').bind(targetId).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(targetId).run();

  await logAudit(db, admin.id, 'DELETE_USER', 'user', targetId, { username: targetUser.username, email: targetUser.email }, ip);

  return c.json({
    success: true,
    message: `Đã xóa vĩnh viễn tài khoản ${targetUser.username} (${targetUser.email}).`,
  });
});

/**
 * PUT /api/admin/users/:id/role
 * Đổi phân quyền người dùng (chỉ admin)
 */
adminRoute.put('/users/:id/role', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const currentAdmin = c.get('user')!;
  const targetUserId = c.req.param('id');
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const newRole = body.role;
  if (!['admin', 'editor', 'reader'].includes(newRole)) {
    return c.json({ success: false, error: 'Vai trò không hợp lệ' }, 400);
  }

  // Không cho phép tự hạ quyền của chính mình nếu là admin duy nhất
  if (currentAdmin.id === targetUserId && newRole !== 'admin') {
    return c.json({ success: false, error: 'Bạn không thể tự hạ quyền quản trị viên của chính mình' }, 400);
  }

  const now = new Date().toISOString();
  await db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?').bind(newRole, now, targetUserId).run();
  await logAudit(db, currentAdmin.id, 'CHANGE_USER_ROLE', 'user', targetUserId, { newRole }, ip);

  return c.json({ success: true, message: 'Đã cập nhật vai trò người dùng' });
});

/**
 * POST /api/admin/seed-50
 * Nạp 50 truyện dài tập hoàn chỉnh, chia chapter chuẩn vào D1
 */
adminRoute.post('/seed-50', requireRole('admin'), async (c) => {
  try {
    const db = c.env.DB;
    const currentAdmin = c.get('user')!;
    const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';

  const GENRE_MAP: Record<string, string> = {
    'tien-hiep': 'genre_tienhiep',
    'kiem-hiep': 'genre_kiemhiep',
    'do-thi': 'genre_dothi',
    'khoa-huyen': 'genre_khoahuyen',
    'huyen-huyen': 'genre_huyenhuyen',
    'trinh-tham': 'genre_trinhtham',
    '18-plus': 'genre_18plus',
  };

  const now = new Date().toISOString();
  let totalImported = 0;
  let totalChapters = 0;

  // Xử lý từng đợt 2 truyện để tối ưu giới hạn batch của D1
  const batchSize = 2;
  for (let i = 0; i < SEED_50_NOVELS.length; i += batchSize) {
    const chunk = SEED_50_NOVELS.slice(i, i + batchSize);
    const statements: D1PreparedStatement[] = [];

    for (const novel of chunk) {
      const authorId = (novel as any).authorId || `auth_${novel.slug}`;
      const bookId = (novel as any).id || `bk_${novel.slug}`;
      const genreId = GENRE_MAP[novel.genreSlug] || 'genre_tienhiep';
      const viewCount = Math.floor(Math.random() * 800) + 150;

      // 1. Author
      statements.push(
        db.prepare(
          'INSERT OR IGNORE INTO authors (id, name, slug, bio, created_at) VALUES (?, ?, ?, ?, ?)'
        ).bind(authorId, novel.author, novel.slug + '-tac-gia', `Tác giả ${novel.author}`, now)
      );

      // 2. Book
      statements.push(
        db.prepare(`
          INSERT OR REPLACE INTO books (
            id, title, slug, author_id, cover_url, description,
            status, publication_status, source_type, view_count,
            is_18_plus, is_premium,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'ongoing', 'published', 'original', ?, ?, ?, ?, ?)
        `).bind(
          bookId,
          novel.title,
          novel.slug,
          authorId,
          novel.cover,
          novel.description,
          viewCount,
          (novel as any).is_18_plus ? 1 : 0,
          (novel as any).is_premium ? 1 : 0,
          now,
          now
        )
      );

      // 3. Book Genre
      statements.push(
        db.prepare(
          'INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)'
        ).bind(bookId, genreId)
      );

      // 4. Rights Record
      statements.push(
        db.prepare(`
          INSERT OR REPLACE INTO rights_records (
            id, book_id, owner_name, license_type, permitted_scope,
            license_start_at, verification_status, attribution_notes, created_at, updated_at
          ) VALUES (?, ?, ?, 'author_permission', 'Toàn quyền xuất bản số', ?, 'verified', ?, ?, ?)
        `).bind(
          `rr_${novel.slug}`,
          bookId,
          novel.author,
          now,
          'Tác phẩm dài tập hoàn chỉnh phân phối chính thức trên TruyenNha',
          now,
          now
        )
      );

      // 5. Chapters
      for (const ch of novel.chapters) {
        const chId = `ch_${novel.slug}_${ch.num}`;
        const chSlug = `chuong-${ch.num}`;
        const wordCount = ch.content.split(/\s+/).filter(Boolean).length;

        statements.push(
          db.prepare(`
            INSERT OR REPLACE INTO chapters (
              id, book_id, chapter_number, title, slug, content,
              word_count, publication_status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)
          `).bind(
            chId,
            bookId,
            ch.num,
            ch.title,
            chSlug,
            ch.content,
            wordCount,
            now,
            now
          )
        );
        totalChapters++;
      }
      totalImported++;
    }

    // Thực thi batch trên D1
    if (statements.length > 0) {
      await db.batch(statements);
    }
  }

  await logAudit(db, currentAdmin.id, 'SEED_50_NOVELS', 'book', null, { totalImported, totalChapters }, ip);

  return c.json({
    success: true,
    message: `Đã nạp thành công ${totalImported} truyện dài tập với ${totalChapters} chương hoàn chỉnh vào cơ sở dữ liệu!`,
    data: { totalNovels: totalImported, totalChapters },
  });
} catch (err: any) {
  return c.json({
    success: false,
    error: err?.message || String(err),
    stack: err?.stack,
  }, 500);
}
});

/**
 * GET /api/admin/ads-config
 * Lấy cấu hình quảng cáo hiện tại từ database
 */
adminRoute.get('/ads-config', async (c) => {
  const db = c.env.DB;
  let adsConfig: any = null;
  try {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'ads_config'").first<{ value: string }>();
    if (row?.value) {
      adsConfig = JSON.parse(row.value);
    }
  } catch {
    // ignore
  }

  return c.json({
    success: true,
    data: adsConfig || {
      adsense: {
        enabled: c.env.ADSENSE_ENABLED === 'true',
        publisherId: c.env.ADSENSE_PUBLISHER_ID || '',
        slotTop: c.env.ADSENSE_SLOT_TOP || '',
        slotBottom: c.env.ADSENSE_SLOT_BOTTOM || '',
        slotReader: c.env.ADSENSE_SLOT_READER || '',
        autoAds: false,
      },
      customAds: {
        enabled: false,
        topBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
        bottomBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
        readerBanner: { enabled: false, imageUrl: '', targetUrl: '', title: '' },
      },
    },
  });
});

/**
 * POST /api/admin/ads-config
 * Cập nhật cấu hình quảng cáo Google AdSense & Banner đối tác
 */
adminRoute.post('/ads-config', async (c) => {
  const db = c.env.DB;
  const user = c.get('user');
  if (!user || user.role !== 'admin') {
    return c.json({ success: false, error: 'Chỉ quản trị viên cấp cao mới có quyền cấu hình quảng cáo' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const valueJson = JSON.stringify(body);

  await db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('ads_config', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).bind(valueJson, now).run();

  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  await logAudit(db, user.id, 'UPDATE_ADS_CONFIG', 'system_settings', 'ads_config', body, ip);

  return c.json({
    success: true,
    message: 'Cập nhật cấu hình quảng cáo thành công!',
    data: body,
  });
});

/**
 * GET /api/admin/system-config
 * Lấy cấu hình hệ thống (Email gửi OTP & AI API kiểm duyệt)
 */
adminRoute.get('/system-config', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  let systemConfig: any = null;
  try {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'system_config'").first<{ value: string }>();
    if (row?.value) {
      systemConfig = JSON.parse(row.value);
    }
  } catch {}

  const defaultEmail = {
    provider: 'resend',
    resendApiKey: c.env.RESEND_API_KEY || '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    fromEmail: c.env.FROM_EMAIL || 'noreply@truyennha.id.vn',
    fromName: c.env.FROM_NAME || 'Truyện Nhà',
  };

  const defaultAi = {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash',
    autoModerateNovels: false,
    autoModerateComments: false,
  };

  return c.json({
    success: true,
    data: {
      email: { ...defaultEmail, ...(systemConfig?.email || {}) },
      ai: { ...defaultAi, ...(systemConfig?.ai || {}) },
    },
  });
});

/**
 * POST /api/admin/system-config
 * Lưu cấu hình hệ thống (Email OTP, thông báo & AI API tự động)
 */
adminRoute.post('/system-config', requireRole('admin'), async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const valueJson = JSON.stringify(body);

  await db.prepare(`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('system_config', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).bind(valueJson, now).run();

  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  await logAudit(db, user.id, 'UPDATE_SYSTEM_CONFIG', 'system_settings', 'system_config', body, ip);

  return c.json({
    success: true,
    message: 'Đã lưu cấu hình hệ thống (Email & AI) thành công!',
    data: body,
  });
});

/**
 * POST /api/admin/system-config/test-email
 * Kiểm tra gửi email thử nghiệm bằng cấu hình hiện tại
 */
adminRoute.post('/system-config/test-email', requireRole('admin'), async (c) => {
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const targetEmail = (body.to || user.email).trim();
  const customConfig = body.customConfig || {};

  const result = await sendEmail(c.env, {
    to: targetEmail,
    subject: '[Truyện Nhà] Email thử nghiệm kết nối hệ thống',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #d1fae5; border-radius: 12px; background-color: #f0fdf4;">
        <h2 style="color: #16a34a;">✅ Kết Nối Email Thành Công!</h2>
        <p>Xin chào <strong>${user.username}</strong>,</p>
        <p>Đây là email kiểm tra kết nối từ hệ thống cấu hình tự động của <strong>Truyện Nhà</strong>.</p>
        <p>Các chức năng gửi mã OTP, thông báo mật khẩu và cảnh báo hệ thống sẽ sử dụng cấu hình này.</p>
        <p style="font-size: 11px; color: #6b7280; margin-top: 20px;">Thời gian kiểm tra: ${new Date().toLocaleString('vi-VN')}</p>
      </div>
    `,
    customConfig,
  });

  if (result.success) {
    return c.json({
      success: true,
      message: result.simulated
        ? `Đã mô phỏng gửi email thành công tới ${targetEmail} (chế độ log console). Hãy cấu hình Resend API Key để gửi email thật.`
        : `Đã gửi email thử nghiệm thành công tới ${targetEmail}! Vui lòng kiểm tra hòm thư.`,
      simulated: result.simulated,
    });
  } else {
    return c.json({
      success: false,
      error: result.error || 'Gửi email thử nghiệm thất bại. Vui lòng kiểm tra API Key.',
    }, 400);
  }
});

/**
 * POST /api/admin/system-config/test-ai
 * Kiểm tra kết nối AI API (ChatGPT OpenAI hoặc Google Gemini)
 */
adminRoute.post('/system-config/test-ai', requireRole('admin'), async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider || 'gemini';
  const apiKey = (body.apiKey || '').trim();
  const model = (body.model || '').trim();

  const result = await testAiConnection(provider, apiKey, model);
  if (result.success) {
    return c.json({
      success: true,
      message: `Kết nối thành công tới ${provider === 'gemini' ? 'Google Gemini' : 'OpenAI ChatGPT'} (${model})!`,
      reply: result.reply,
    });
  } else {
    return c.json({
      success: false,
      error: result.error || 'Kết nối AI API thất bại',
    }, 400);
  }
});

/**
 * GET /api/admin/withdrawals
 * Danh sách yêu cầu rút tiền của tác giả
 */
adminRoute.get('/withdrawals', async (c) => {
  const db = c.env.DB;
  const rows = await db
    .prepare(`
      SELECT w.*, u.username, u.email
      FROM withdrawal_requests w
      JOIN users u ON w.user_id = u.id
      ORDER BY w.created_at DESC
      LIMIT 100
    `)
    .all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * POST /api/admin/withdrawals/:id/approve
 * Quản trị viên phê duyệt yêu cầu rút tiền và xác nhận đã chuyển khoản
 */
adminRoute.post('/withdrawals/:id/approve', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const reqId = c.req.param('id');
  const now = new Date().toISOString();

  const reqRow = await db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').bind(reqId).first<any>();
  if (!reqRow) {
    return c.json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền' }, 404);
  }

  if (reqRow.status !== 'pending') {
    return c.json({ success: false, error: 'Yêu cầu này đã được xử lý trước đó' }, 400);
  }

  await db
    .prepare("UPDATE withdrawal_requests SET status = 'approved', updated_at = ? WHERE id = ?")
    .bind(now, reqId)
    .run();

  await db
    .prepare("UPDATE wallet_transactions SET status = 'completed' WHERE user_id = ? AND description LIKE ?")
    .bind(reqRow.user_id, `%${reqId}%`)
    .run();

  return c.json({ success: true, message: 'Đã phê duyệt và xác nhận giải ngân thành công!' });
});

/**
 * POST /api/admin/withdrawals/:id/reject
 * Quản trị viên từ chối yêu cầu và hoàn lại tiền vào tài khoản tác giả
 */
adminRoute.post('/withdrawals/:id/reject', async (c) => {
  const db = c.env.DB;
  const reqId = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const adminNote = (body.note || 'Thông tin ngân hàng không hợp lệ hoặc không khớp').trim();
  const now = new Date().toISOString();

  const reqRow = await db.prepare('SELECT * FROM withdrawal_requests WHERE id = ?').bind(reqId).first<any>();
  if (!reqRow) {
    return c.json({ success: false, error: 'Không tìm thấy yêu cầu rút tiền' }, 404);
  }

  if (reqRow.status !== 'pending') {
    return c.json({ success: false, error: 'Yêu cầu này đã được xử lý trước đó' }, 400);
  }

  // Hoàn tiền lại cho tác giả
  await db
    .prepare('UPDATE users SET author_earnings = author_earnings + ?, updated_at = ? WHERE id = ?')
    .bind(reqRow.amount, now, reqRow.user_id)
    .run();

  // Cập nhật trạng thái từ chối
  await db
    .prepare("UPDATE withdrawal_requests SET status = 'rejected', admin_note = ?, updated_at = ? WHERE id = ?")
    .bind(adminNote, now, reqId)
    .run();

  // Ghi nhật ký hoàn tiền
  await db
    .prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at)
      VALUES (?, ?, 'topup', ?, 'completed', ?, ?)
    `)
    .bind(
      createId('tx'),
      reqRow.user_id,
      reqRow.amount,
      `Hoàn lại tiền rút không thành công: ${adminNote}`,
      now
    )
    .run();

  return c.json({ success: true, message: 'Đã từ chối yêu cầu và hoàn tiền thành công về số dư tác giả!' });
});

/**
 * POST /api/admin/system-config/discover-models
 * Tự động quét và nhận diện danh sách model từ API Key của Google Gemini hoặc OpenAI
 */
adminRoute.post('/system-config/discover-models', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const provider = body.provider as 'gemini' | 'openai';
  const apiKey = (body.apiKey || '').trim();

  const res = await discoverAiModels(provider, apiKey);
  if (!res.success) {
    return c.json({ success: false, error: res.error }, 400);
  }
  return c.json({ success: true, models: res.models || [] });
});

/**
 * GET /api/admin/users/:id/transactions
 * Xem nhật ký biến động số dư và giao dịch chi tiết của một người dùng
 */
adminRoute.get('/users/:id/transactions', async (c) => {
  const db = c.env.DB;
  const userId = c.req.param('id');

  const userRow = await db
    .prepare('SELECT id, username, email, full_name, coins, balance, is_author, role, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first<any>();

  if (!userRow) {
    return c.json({ success: false, error: 'Không tìm thấy người dùng' }, 404);
  }

  const txs = await db
    .prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100')
    .bind(userId)
    .all();

  const notifs = await db
    .prepare('SELECT * FROM user_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .bind(userId)
    .all();

  return c.json({
    success: true,
    data: {
      user: userRow,
      transactions: txs.results || [],
      notifications: notifs.results || [],
    },
  });
});

/**
 * GET /api/admin/moderation
 * Danh sách nội dung bị gắn cờ cần kiểm duyệt
 */
adminRoute.get('/moderation', async (c) => {
  const db = c.env.DB;
  const status = c.req.query('status') || 'all';

  let sql = 'SELECT * FROM moderation_queue';
  const params: any[] = [];
  if (status !== 'all') {
    sql += ' WHERE status = ?';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC LIMIT 100';

  const rows = await db.prepare(sql).bind(...params).all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * POST /api/admin/moderation/:id/approve
 * Phê duyệt và cho phép xuất bản nội dung
 */
adminRoute.post('/moderation/:id/approve', async (c) => {
  const db = c.env.DB;
  const adminUser = c.get('user')!;
  const id = c.req.param('id');
  const now = new Date().toISOString();

  const item = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').bind(id).first<any>();
  if (!item) {
    return c.json({ success: false, error: 'Không tìm thấy mục kiểm duyệt' }, 404);
  }

  await db
    .prepare("UPDATE moderation_queue SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?")
    .bind(adminUser.username, now, id)
    .run();

  if (item.entity_type === 'chapter') {
    await db.prepare("UPDATE chapters SET publication_status = 'published', updated_at = ? WHERE id = ?").bind(now, item.entity_id).run();
  } else if (item.entity_type === 'book') {
    await db.prepare("UPDATE books SET publication_status = 'published', updated_at = ? WHERE id = ?").bind(now, item.entity_id).run();
  }

  // Thông báo tới tác giả
  if (item.author_id) {
    const notifId = createId('notif');
    await db
      .prepare("INSERT INTO user_notifications (id, user_id, title, content, type, created_at) VALUES (?, ?, ?, ?, 'system', ?)")
      .bind(
        notifId,
        item.author_id,
        `Tác phẩm "${item.title}" đã được duyệt xuất bản`,
        `Ban Quản trị đã kiểm duyệt thủ công và chính thức thông qua xuất bản tác phẩm/chương "${item.title}".`,
        now
      )
      .run();
  }

  return c.json({ success: true, message: 'Đã phê duyệt và xuất bản nội dung thành công!' });
});

/**
 * POST /api/admin/moderation/:id/reject
 * Từ chối nội dung vi phạm
 */
adminRoute.post('/moderation/:id/reject', async (c) => {
  const db = c.env.DB;
  const adminUser = c.get('user')!;
  const id = c.req.param('id');
  const now = new Date().toISOString();

  const item = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').bind(id).first<any>();
  if (!item) {
    return c.json({ success: false, error: 'Không tìm thấy mục kiểm duyệt' }, 404);
  }

  await db
    .prepare("UPDATE moderation_queue SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?")
    .bind(adminUser.username, now, id)
    .run();

  if (item.entity_type === 'chapter') {
    await db.prepare("UPDATE chapters SET publication_status = 'draft', updated_at = ? WHERE id = ?").bind(now, item.entity_id).run();
  } else if (item.entity_type === 'book') {
    await db.prepare("UPDATE books SET publication_status = 'draft', updated_at = ? WHERE id = ?").bind(now, item.entity_id).run();
  }

  return c.json({ success: true, message: 'Đã từ chối xuất bản tác phẩm vi phạm!' });
});

/**
 * POST /api/admin/moderation/:id/notify-author
 * Gửi thông báo & thư điện tử cho tác giả về tình trạng kiểm duyệt
 */
adminRoute.post('/moderation/:id/notify-author', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const customMessage = (body.message || '').trim();
  const now = new Date().toISOString();

  const item = await db.prepare('SELECT * FROM moderation_queue WHERE id = ?').bind(id).first<any>();
  if (!item) {
    return c.json({ success: false, error: 'Không tìm thấy mục kiểm duyệt' }, 404);
  }

  if (!item.author_id) {
    return c.json({ success: false, error: 'Mục này không có tác giả liên kết' }, 400);
  }

  const author = await db.prepare('SELECT id, username, email FROM users WHERE id = ?').bind(item.author_id).first<any>();
  if (!author) {
    return c.json({ success: false, error: 'Không tìm thấy tác giả trong cơ sở dữ liệu' }, 404);
  }

  const defaultContent = `Kính gửi tác giả ${author.username},\n\nBan Quản trị Truyện Nhà xin thông báo về tác phẩm "${item.title}".\n\nHệ thống ghi nhận dấu hiệu vi phạm tiêu chuẩn cộng đồng (${item.violation_category || 'Nội dung chưa phù hợp'}):\n"${item.violation_summary}".\n\nVui lòng điều chỉnh lại tác phẩm hoặc liên hệ lại với Ban Quản trị để được hỗ trợ.`;
  const finalMsg = customMessage || defaultContent;

  // 1. Thêm vào hòm thư thông báo trên web
  const notifId = createId('notif');
  await db
    .prepare("INSERT INTO user_notifications (id, user_id, title, content, type, created_at) VALUES (?, ?, ?, ?, 'warning', ?)")
    .bind(
      notifId,
      author.id,
      `Thông báo kiểm duyệt: ${item.title}`,
      finalMsg,
      now
    )
    .run();

  // 2. Cập nhật thời điểm thông báo
  await db.prepare('UPDATE moderation_queue SET author_notified_at = ? WHERE id = ?').bind(now, id).run();

  // 3. Gửi email
  if (author.email) {
    await sendEmail(c.env, {
      to: author.email,
      subject: `[Truyện Nhà] Thông báo kiểm duyệt tác phẩm: ${item.title}`,
      text: finalMsg,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background: #fff5f5;">
          <h2 style="color: #dc2626; margin-top: 0;">Thông Báo Kiểm Duyệt Tác Phẩm</h2>
          <p>Xin chào <strong>${author.username}</strong>,</p>
          <p>Ban Quản trị Truyện Nhà xin gửi thông báo liên quan đến tác phẩm: <strong>${item.title}</strong>.</p>
          <div style="background: #ffffff; padding: 15px; border-left: 4px solid #ef4444; margin: 15px 0; border-radius: 4px;">
            <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${finalMsg}</p>
          </div>
          <p style="font-size: 12px; color: #6b7280;">Vui lòng truy cập Không gian sáng tác Studio để kiểm tra và cập nhật lại tác phẩm.</p>
        </div>
      `,
    });
  }

  return c.json({ success: true, message: `Đã gửi thông báo thành công đến tác giả ${author.username}!` });
});

export default adminRoute;
