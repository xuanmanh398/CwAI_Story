import { Hono } from 'hono';
import { DbEnv, createId, slugify } from '../db';
import { requireAuth, requireRole, SessionUser } from '../auth';
import { ContentCrawlerService } from '../services/crawler';
import { AiEditorService } from '../services/ai-editor';

const crawlerRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

// Yêu cầu quyền editor hoặc admin
crawlerRoute.use('*', requireAuth);
crawlerRoute.use('*', requireRole('editor', 'admin'));

/**
 * POST /api/admin/crawler/preview
 * Bóc tách nội dung từ URL nguồn
 */
crawlerRoute.post('/preview', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const url = (body.url || '').trim();

  if (!url) {
    return c.json({ success: false, error: 'Vui lòng cung cấp URL nguồn' }, 400);
  }

  try {
    const extracted = await ContentCrawlerService.extractFromUrl(url);
    return c.json({
      success: true,
      data: extracted,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: msg }, 400);
  }
});

/**
 * POST /api/admin/crawler/process-ai
 * Xử lý văn bản với AI (Dịch thuật / Biên tập nhuận sắc / Tóm tắt)
 */
crawlerRoute.post('/process-ai', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const { action, content, sourceLanguage, targetLanguage, novelGenre, apiKey, provider } = body;

  if (!content) {
    return c.json({ success: false, error: 'Thiếu nội dung cần xử lý' }, 400);
  }

  // Lấy Cloudflare AI binding nếu có
  const envAi = (c.env as any).AI;

  try {
    const result = await AiEditorService.processContent(
      {
        action: action || 'polish',
        content,
        sourceLanguage,
        targetLanguage,
        novelGenre,
        apiKey,
        provider,
      },
      envAi
    );

    return c.json({
      success: true,
      data: result,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return c.json({ success: false, error: `Lỗi xử lý AI: ${msg}` }, 500);
  }
});

/**
 * POST /api/admin/crawler/import
 * Lưu tác phẩm hoặc chương đã qua biên tập AI vào Database D1
 */
crawlerRoute.post('/import', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
  const body = await c.req.json().catch(() => ({}));

  const {
    importType, // 'new_book' | 'existing_book_chapter'
    bookId,
    title,
    authorName,
    sourceUrl,
    chapterNumber,
    chapterTitle,
    content,
    publicationStatus = 'draft', // Mặc định lưu bản nháp để duyệt an toàn
  } = body;

  const now = new Date().toISOString();
  let targetBookId = bookId;

  // 1. Nếu tạo bộ truyện mới
  if (importType === 'new_book') {
    if (!title || !title.trim()) {
      return c.json({ success: false, error: 'Vui lòng nhập tên truyện' }, 400);
    }

    targetBookId = createId('bk');
    const bookSlug = slugify(title);

    // Tác giả
    let authorId = null;
    if (authorName && authorName.trim()) {
      const authSlug = slugify(authorName);
      let authRow = await db.prepare('SELECT id FROM authors WHERE slug = ?').bind(authSlug).first<{ id: string }>();
      if (!authRow) {
        authorId = createId('auth');
        await db.prepare('INSERT INTO authors (id, name, slug, created_at) VALUES (?, ?, ?, ?)').bind(authorId, authorName.trim(), authSlug, now).run();
      } else {
        authorId = authRow.id;
      }
    }

    // Lưu sách
    await db
      .prepare(`
        INSERT INTO books (id, title, slug, author_id, description, status, publication_status, source_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'ongoing', ?, 'licensed_manual', ?, ?)
      `)
      .bind(
        targetBookId,
        title.trim(),
        bookSlug,
        authorId,
        `Tác phẩm được nhập và biên tập AI từ nguồn: ${sourceUrl || 'Tự do'}`,
        publicationStatus,
        now,
        now
      )
      .run();

    // Ghi nhận nguồn pháp lý vào rights_records
    const rightsId = createId('rgt');
    await db
      .prepare(`
        INSERT INTO rights_records (id, book_id, owner_name, license_type, permitted_scope, permitted_territory, license_start_at, verification_status, attribution_notes, created_at, updated_at)
        VALUES (?, ?, ?, 'Biên tập & Chuyển ngữ AI', 'Lưu trữ bản nháp & Xuất bản trực tuyến', 'Toàn cầu', ?, 'unverified', ?, ?, ?)
      `)
      .bind(
        rightsId,
        targetBookId,
        authorName || 'Tác giả gốc',
        now,
        `URL tham chiếu: ${sourceUrl || 'N/A'}. Cần thẩm định quyền trước khi xuất bản rộng rãi.`,
        now,
        now
      )
      .run();
  }

  // 2. Thêm chương truyện
  if (content && content.trim()) {
    const chId = createId('ch');
    const chNum = parseInt(chapterNumber || '1', 10);
    const finalChTitle = chapterTitle || `Chương ${chNum}`;
    const chSlug = `chuong-${chNum}-${slugify(finalChTitle)}`;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    await db
      .prepare(`
        INSERT INTO chapters (id, book_id, chapter_number, title, slug, content, word_count, publication_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(book_id, chapter_number) DO UPDATE SET
          title = excluded.title,
          content = excluded.content,
          word_count = excluded.word_count,
          publication_status = excluded.publication_status,
          updated_at = excluded.updated_at
      `)
      .bind(chId, targetBookId, chNum, finalChTitle, chSlug, content, wordCount, publicationStatus, now, now)
      .run();

    // Cập nhật updated_at của sách
    await db.prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(now, targetBookId).run();
  }

  // Ghi nhật ký kiểm toán
  await db
    .prepare(
      'INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details_json, ip_address, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      createId('aud'),
      user.id,
      'AI_IMPORT_CONTENT',
      'book',
      targetBookId,
      JSON.stringify({ title, chapterNumber, sourceUrl, publicationStatus }),
      ip,
      now
    )
    .run();

  return c.json({
    success: true,
    message: `Đã nhập và lưu thành công (Trạng thái: ${publicationStatus === 'draft' ? 'Bản nháp' : 'Xuất bản'})`,
    data: { bookId: targetBookId },
  });
});

export default crawlerRoute;
