import { Hono } from 'hono';
import { DbEnv, createId, slugify } from '../db';
import { requireAuth, SessionUser } from '../auth';
import { moderateContentWithAi, DEFAULT_AI_CONFIG, SystemAiConfig } from '../services/ai';

const studioRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

async function getSystemAiConfig(db: D1Database): Promise<SystemAiConfig> {
  try {
    const row = (await db.prepare("SELECT value FROM site_settings WHERE key = 'system_config'").first()) as { value: string } | null;
    if (row?.value) {
      const cfg = JSON.parse(row.value);
      if (cfg?.ai) return cfg.ai;
    }
  } catch {}
  return DEFAULT_AI_CONFIG;
}

// Mọi thao tác trong studio đều yêu cầu đăng nhập
studioRoute.use('*', requireAuth);

/**
 * GET /api/studio/author-status
 * Kiểm tra trạng thái tác giả của tài khoản
 */
studioRoute.get('/author-status', async (c) => {
  const user = c.get('user')!;
  const isAuthor = user.is_author === 1 || user.role === 'admin' || user.role === 'editor';
  return c.json({
    success: true,
    data: {
      is_author: isAuthor,
      role: user.role,
    },
  });
});

/**
 * POST /api/studio/register-author
 * Đăng ký tài khoản thành Tác giả (Phí 100k ~ 100 Xu, xác thực KYC Họ tên, CCCD, Ngân hàng)
 */
studioRoute.post('/register-author', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const penName = (body.pen_name || '').trim();
  const fullName = (body.full_name || '').trim().toUpperCase();
  const idCardNumber = (body.id_card_number || '').trim();
  const bankName = (body.bank_name || '').trim();
  const bankAccountNumber = (body.bank_account_number || '').trim();
  const bio = (body.bio || '').trim();

  if (penName.length < 2) {
    return c.json({ success: false, error: 'Bút danh sáng tác phải có ít nhất 2 ký tự' }, 400);
  }

  if (fullName.length < 3) {
    return c.json({ success: false, error: 'Vui lòng nhập Họ và tên đầy đủ' }, 400);
  }

  if (!idCardNumber || idCardNumber.length < 9) {
    return c.json({ success: false, error: 'Số CCCD/CMND không hợp lệ (tối thiểu 9-12 số)' }, 400);
  }

  if (!bankName) {
    return c.json({ success: false, error: 'Vui lòng chọn hoặc nhập Tên ngân hàng nhận tiền' }, 400);
  }

  if (!bankAccountNumber || bankAccountNumber.length < 6) {
    return c.json({ success: false, error: 'Vui lòng nhập Số thẻ hoặc Số tài khoản ngân hàng nhận tiền' }, 400);
  }

  // Kiểm tra số dư ví Xu (Phí đăng ký tác giả là 100 Xu = 100.000 VNĐ)
  const REGISTRATION_FEE_COINS = 100;
  const userRow = await db
    .prepare('SELECT coins FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ coins: number }>();

  const currentCoins = userRow?.coins || 0;
  if (currentCoins < REGISTRATION_FEE_COINS) {
    return c.json({
      success: false,
      requires_coins: true,
      current_coins: currentCoins,
      required_coins: REGISTRATION_FEE_COINS,
      error: `Số dư trong ví hiện có ${currentCoins} Xu, cần thêm ${REGISTRATION_FEE_COINS - currentCoins} Xu để thanh toán phí đăng ký Tác giả (100.000 VNĐ / 100 Xu).`,
    }, 402);
  }

  const now = new Date().toISOString();

  // 1. Trừ 100 Xu và lưu thông tin định danh KYC tác giả
  await db
    .prepare(`
      UPDATE users 
      SET 
        coins = coins - ?, 
        is_author = 1, 
        author_pen_name = ?, 
        full_name = ?, 
        id_card_number = ?, 
        bank_name = ?, 
        bank_account_number = ?, 
        updated_at = ? 
      WHERE id = ?
    `)
    .bind(REGISTRATION_FEE_COINS, penName, fullName, idCardNumber, bankName, bankAccountNumber, now, user.id)
    .run();

  // 2. Ghi nhật ký biến động số dư ví
  await db
    .prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at)
      VALUES (?, ?, 'author_registration', ?, 'completed', ?, ?)
    `)
    .bind(
      createId('tx'),
      user.id,
      -REGISTRATION_FEE_COINS,
      `Phí kích hoạt quyền Tác giả sáng tác bản quyền (-${REGISTRATION_FEE_COINS} Xu)`,
      now
    )
    .run();

  // 3. Kiểm tra hoặc tạo hồ sơ tác giả trong bảng authors
  const authorSlug = slugify(penName);
  const existingAuthor = await db.prepare('SELECT id FROM authors WHERE slug = ?').bind(authorSlug).first();
  if (!existingAuthor) {
    await db
      .prepare('INSERT INTO authors (id, name, slug, bio, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(createId('aut'), penName, authorSlug, bio || `Tác giả sáng tác tại Truyện Nhà (${fullName})`, now)
      .run();
  }

  return c.json({
    success: true,
    message: 'Chúc mừng! Bạn đã đăng ký thành công tư cách Tác giả Sáng tác. Hệ thống đã xác nhận hồ sơ của bạn.',
    data: {
      is_author: 1,
      pen_name: penName,
      full_name: fullName,
      bank_name: bankName,
      coins_deducted: REGISTRATION_FEE_COINS,
      remaining_coins: currentCoins - REGISTRATION_FEE_COINS,
    },
  });
});

/**
 * GET /api/studio/my-books
 * Danh sách các truyện do chính người dùng hiện tại đăng
 */
studioRoute.get('/my-books', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const isAuthor = user.is_author === 1 || user.role === 'admin' || user.role === 'editor';
  if (!isAuthor) {
    return c.json({
      success: false,
      requires_author: true,
      error: 'Bạn cần đăng ký làm Tác giả để truy cập Không gian sáng tác.',
      data: [],
    }, 403);
  }

  const rows = await db
    .prepare(`
      SELECT 
        b.id, b.title, b.slug, b.cover_url, b.description, b.status, 
        b.publication_status, b.view_count, b.price_coins, b.free_chapters_count,
        b.is_18_plus, b.is_premium,
        b.created_at, b.updated_at,
        a.name as author_name,
        (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id) as chapter_count,
        (
          SELECT GROUP_CONCAT(g.name, ', ') 
          FROM book_genres bg 
          JOIN genres g ON bg.genre_id = g.id 
          WHERE bg.book_id = b.id
        ) as genre_names,
        (
          SELECT GROUP_CONCAT(bg.genre_id, ',')
          FROM book_genres bg
          WHERE bg.book_id = b.id
        ) as genre_ids_csv
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.created_by_user_id = ?
      ORDER BY b.updated_at DESC
    `)
    .bind(user.id)
    .all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * POST /api/studio/books
 * Độc giả / Tác giả đăng truyện mới
 */
studioRoute.post('/books', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const isAuthor = user.is_author === 1 || user.role === 'admin' || user.role === 'editor';
  if (!isAuthor) {
    return c.json({
      success: false,
      requires_author: true,
      error: 'Bạn cần đăng ký làm Tác giả trước khi đăng truyện mới.',
    }, 403);
  }

  const body = await c.req.json().catch(() => ({}));

  const title = (body.title || '').trim();
  if (title.length < 2) {
    return c.json({ success: false, error: 'Tên truyện phải có ít nhất 2 ký tự' }, 400);
  }

  const authorName = (body.author_name || user.username).trim();
  const description = (body.description || '').trim();
  const coverUrl = (body.cover_url || '').trim() || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80';
  const status = body.status === 'completed' ? 'completed' : 'ongoing';
  const publicationStatus = body.publication_status === 'draft' ? 'draft' : 'published';
  const genreIds: string[] = Array.isArray(body.genre_ids) ? body.genre_ids : [];
  const is18Plus = body.is_18_plus === true || body.is_18_plus === 1 ? 1 : 0;
  const isPremium = body.is_premium === true || body.is_premium === 1 ? 1 : 0;
  const priceCoins = Math.max(0, parseInt(body.price_coins || '0', 10));
  const freeChaptersCount = Math.max(1, parseInt(body.free_chapters_count || '5', 10));
  if (is18Plus === 1 && !genreIds.includes('genre_18plus')) {
    genreIds.push('genre_18plus');
  }

  // Tạo slug độc nhất
  let baseSlug = slugify(title);
  if (!baseSlug) baseSlug = `truyen-${Date.now()}`;
  let finalSlug = baseSlug;

  const existingSlug = await db.prepare('SELECT id FROM books WHERE slug = ?').bind(finalSlug).first();
  if (existingSlug) {
    finalSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  }

  const now = new Date().toISOString();
  const bookId = createId('bk');

  // Tìm hoặc tạo tác giả
  const authorSlug = slugify(authorName) || `tac-gia-${Date.now()}`;
  let authorRow = await db.prepare('SELECT id FROM authors WHERE name = ? OR slug = ?').bind(authorName, authorSlug).first<{ id: string }>();
  let authorId = authorRow?.id;

  if (!authorId) {
    authorId = createId('auth');
    await db
      .prepare('INSERT INTO authors (id, name, slug, bio, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(authorId, authorName, authorSlug, `Tác giả thành viên trên TruyenNha`, now)
      .run();
  }

  // Tạo tác phẩm
  await db
    .prepare(`
      INSERT INTO books (
        id, title, slug, author_id, cover_url, description,
        status, publication_status, source_type, view_count,
        created_by_user_id, is_18_plus, is_premium, price_coins, free_chapters_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'original', 0, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      bookId,
      title,
      finalSlug,
      authorId,
      coverUrl,
      description,
      status,
      publicationStatus,
      user.id,
      is18Plus,
      isPremium,
      priceCoins,
      freeChaptersCount,
      now,
      now
    )
    .run();

  // Gắn thể loại
  if (genreIds.length > 0) {
    for (const gid of genreIds) {
      await db
        .prepare('INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)')
        .bind(bookId, gid)
        .run();
    }
  }

  // Ghi nhận bản quyền tác giả tự do
  const rightsId = createId('rr');
  await db
    .prepare(`
      INSERT INTO rights_records (
        id, book_id, owner_name, license_type, permitted_scope,
        license_start_at, verification_status, attribution_notes, created_at, updated_at
      ) VALUES (?, ?, ?, 'author_permission', 'Toàn quyền xuất bản số', ?, 'verified', ?, ?, ?)
    `)
    .bind(
      rightsId,
      bookId,
      authorName,
      now,
      `Tác phẩm tự sáng tác do thành viên @${user.username} (ID: ${user.id}) trực tiếp đăng tải`,
      now,
      now
    )
    .run();

  return c.json({
    success: true,
    message: 'Tạo tác phẩm thành công!',
    data: {
      id: bookId,
      title,
      slug: finalSlug,
      status,
      publication_status: publicationStatus,
    },
  });
});

/**
 * GET /api/studio/books/:id
 * Chi tiết truyện kèm toàn bộ danh sách chương để quản lý
 */
studioRoute.get('/books/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');

  const book = await db
    .prepare(`
      SELECT b.*, a.name as author_name
      FROM books b
      LEFT JOIN authors a ON b.author_id = a.id
      WHERE b.id = ?
    `)
    .bind(bookId)
    .first<any>();

  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  // Kiểm tra quyền sở hữu (chỉ người tạo hoặc admin mới xem được chi tiết studio)
  if (book.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền quản lý truyện này' }, 403);
  }

  // Thể loại của truyện
  const genres = await db
    .prepare(`
      SELECT g.id, g.name, g.slug
      FROM book_genres bg
      JOIN genres g ON bg.genre_id = g.id
      WHERE bg.book_id = ?
    `)
    .bind(bookId)
    .all();

  // Danh sách toàn bộ chương (kể cả bản nháp)
  const chapters = await db
    .prepare(`
      SELECT id, chapter_number, title, slug, word_count, publication_status, created_at, updated_at
      FROM chapters
      WHERE book_id = ?
      ORDER BY chapter_number ASC
    `)
    .bind(bookId)
    .all();

  return c.json({
    success: true,
    data: {
      ...book,
      genres: genres.results || [],
      chapters: chapters.results || [],
    },
  });
});

/**
 * PUT /api/studio/books/:id
 * Cập nhật thông tin truyện
 */
studioRoute.put('/books/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');

  const book = await db.prepare('SELECT id, created_by_user_id FROM books WHERE id = ?').bind(bookId).first<any>();
  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  if (book.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền sửa truyện này' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const title = (body.title || '').trim();
  if (title.length < 2) {
    return c.json({ success: false, error: 'Tên truyện phải có ít nhất 2 ký tự' }, 400);
  }

  const description = (body.description || '').trim();
  const coverUrl = (body.cover_url || '').trim();
  const status = body.status === 'completed' ? 'completed' : 'ongoing';
  const publicationStatus = body.publication_status === 'draft' ? 'draft' : 'published';
  const genreIds: string[] = Array.isArray(body.genre_ids) ? body.genre_ids : [];
  const is18Plus = body.is_18_plus === true || body.is_18_plus === 1 ? 1 : 0;
  const isPremium = body.is_premium === true || body.is_premium === 1 ? 1 : 0;
  const priceCoins = Math.max(0, parseInt(body.price_coins || '0', 10));
  const freeChaptersCount = Math.max(1, parseInt(body.free_chapters_count || '5', 10));
  if (is18Plus === 1) {
    if (!genreIds.includes('genre_18plus')) {
      genreIds.push('genre_18plus');
    }
  } else {
    // Nếu gỡ 18+, chắc chắn xóa genre_18plus khỏi book_genres
    await db.prepare("DELETE FROM book_genres WHERE book_id = ? AND genre_id = 'genre_18plus'").bind(bookId).run();
    const idx = genreIds.indexOf('genre_18plus');
    if (idx !== -1) genreIds.splice(idx, 1);
  }

  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE books 
      SET title = ?, description = ?, cover_url = ?, status = ?, publication_status = ?, is_18_plus = ?, is_premium = ?, price_coins = ?, free_chapters_count = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(title, description, coverUrl, status, publicationStatus, is18Plus, isPremium, priceCoins, freeChaptersCount, now, bookId)
    .run();

  // Cập nhật thể loại
  if (genreIds.length > 0) {
    await db.prepare('DELETE FROM book_genres WHERE book_id = ?').bind(bookId).run();
    for (const gid of genreIds) {
      await db.prepare('INSERT OR IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)').bind(bookId, gid).run();
    }
  }

  return c.json({ success: true, message: 'Đã cập nhật thông tin truyện!' });
});

/**
 * DELETE /api/studio/books/:id
 * Xóa truyện của tác giả
 */
studioRoute.delete('/books/:id', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');

  const book = await db.prepare('SELECT id, created_by_user_id FROM books WHERE id = ?').bind(bookId).first<any>();
  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  if (book.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền xóa truyện này' }, 403);
  }

  // Xóa các dữ liệu liên quan
  await db.batch([
    db.prepare('DELETE FROM chapters WHERE book_id = ?').bind(bookId),
    db.prepare('DELETE FROM book_genres WHERE book_id = ?').bind(bookId),
    db.prepare('DELETE FROM rights_records WHERE book_id = ?').bind(bookId),
    db.prepare('DELETE FROM bookmarks WHERE book_id = ?').bind(bookId),
    db.prepare('DELETE FROM reading_progress WHERE book_id = ?').bind(bookId),
    db.prepare('DELETE FROM books WHERE id = ?').bind(bookId),
  ]);

  return c.json({ success: true, message: 'Đã xóa tác phẩm và các chương liên quan' });
});

/**
 * POST /api/studio/books/:id/chapters
 * Thêm chương mới cho truyện
 */
studioRoute.post('/books/:id/chapters', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('id');

  const book = await db.prepare('SELECT id, created_by_user_id FROM books WHERE id = ?').bind(bookId).first<any>();
  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  if (book.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền thêm chương cho truyện này' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  const publicationStatus = body.publication_status === 'draft' ? 'draft' : 'published';

  if (!title) {
    return c.json({ success: false, error: 'Vui lòng nhập tiêu đề chương' }, 400);
  }
  if (content.length < 10) {
    return c.json({ success: false, error: 'Nội dung chương phải có ít nhất 10 ký tự' }, 400);
  }

  // Xác định số thứ tự chương
  let chapterNumber = parseInt(body.chapter_number, 10);
  if (isNaN(chapterNumber) || chapterNumber < 1) {
    const maxRow = await db
      .prepare('SELECT MAX(chapter_number) as max_num FROM chapters WHERE book_id = ?')
      .bind(bookId)
      .first<{ max_num: number | null }>();
    chapterNumber = (maxRow?.max_num || 0) + 1;
  }

  const slug = `chuong-${chapterNumber}`;
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const chapterId = createId('ch');
  const now = new Date().toISOString();

  // Kiểm tra trùng lặp số chương
  const existingCh = await db
    .prepare('SELECT id FROM chapters WHERE book_id = ? AND chapter_number = ?')
    .bind(bookId, chapterNumber)
    .first();

  if (existingCh) {
    return c.json({ success: false, error: `Chương số ${chapterNumber} đã tồn tại trong truyện này` }, 400);
  }

  let actualPubStatus = publicationStatus;
  let moderationFlagged = false;
  let moderationReason = '';

  // Kiểm duyệt nội dung tự động bằng AI trước khi công khai
  if (publicationStatus === 'published') {
    const aiConfig = await getSystemAiConfig(db);
    if (aiConfig.enabled && aiConfig.autoModerateNovels && aiConfig.apiKey) {
      const auditRes = await moderateContentWithAi(aiConfig, `${title}\n\n${content}`);
      if (!auditRes.isApproved) {
        actualPubStatus = 'draft';
        moderationFlagged = true;
        moderationReason = auditRes.violationSummary || 'Nội dung có dấu hiệu vi phạm tiêu chuẩn kiểm duyệt';

        const modId = createId('mod');
        const authorPenName = (user as any).author_pen_name || user.username;
        await db
          .prepare(`
            INSERT INTO moderation_queue (
              id, entity_type, entity_id, book_id, title, author_id, author_name,
              excerpt, violation_summary, violation_category, status, created_at
            ) VALUES (?, 'chapter', ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
          `)
          .bind(
            modId,
            chapterId,
            bookId,
            `Chương ${chapterNumber}: ${title} (${book.title})`,
            user.id,
            authorPenName,
            content.slice(0, 300),
            moderationReason,
            auditRes.violationCategory || 'vi_phạm_tiêu_chuẩn',
            now
          )
          .run();
      }
    }
  }

  await db
    .prepare(`
      INSERT INTO chapters (
        id, book_id, chapter_number, title, slug, content,
        word_count, publication_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      chapterId,
      bookId,
      chapterNumber,
      title,
      slug,
      content,
      wordCount,
      actualPubStatus,
      now,
      now
    )
    .run();

  // Cập nhật updated_at của sách
  await db.prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(now, bookId).run();

  return c.json({
    success: true,
    message: moderationFlagged
      ? `Chương đã lưu nhưng bị tạm giữ ở Bản nháp do AI phát hiện dấu hiệu vi phạm (${moderationReason}). Ban Quản trị sẽ kiểm duyệt thủ công.`
      : 'Thêm chương thành công!',
    moderation_flagged: moderationFlagged,
    data: {
      id: chapterId,
      book_id: bookId,
      chapter_number: chapterNumber,
      title,
      slug,
      word_count: wordCount,
      publication_status: actualPubStatus,
    },
  });
});

/**
 * GET /api/studio/chapters/:chapterId
 * Lấy chi tiết nội dung chương để chỉnh sửa
 */
studioRoute.get('/chapters/:chapterId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const chapterId = c.req.param('chapterId');

  const chapter = await db
    .prepare(`
      SELECT c.*, b.title as book_title, b.created_by_user_id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ?
    `)
    .bind(chapterId)
    .first<any>();

  if (!chapter) {
    return c.json({ success: false, error: 'Không tìm thấy chương' }, 404);
  }

  if (chapter.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền xem chương này' }, 403);
  }

  return c.json({
    success: true,
    data: chapter,
  });
});

/**
 * PUT /api/studio/chapters/:chapterId
 * Cập nhật nội dung chương
 */
studioRoute.put('/chapters/:chapterId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const chapterId = c.req.param('chapterId');

  const chapter = await db
    .prepare(`
      SELECT c.id, c.book_id, b.created_by_user_id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ?
    `)
    .bind(chapterId)
    .first<any>();

  if (!chapter) {
    return c.json({ success: false, error: 'Không tìm thấy chương' }, 404);
  }

  if (chapter.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền sửa chương này' }, 403);
  }

  const body = await c.req.json().catch(() => ({}));
  const title = (body.title || '').trim();
  const content = (body.content || '').trim();
  const publicationStatus = body.publication_status === 'draft' ? 'draft' : 'published';

  if (!title) {
    return c.json({ success: false, error: 'Vui lòng nhập tiêu đề chương' }, 400);
  }
  if (content.length < 10) {
    return c.json({ success: false, error: 'Nội dung chương phải có ít nhất 10 ký tự' }, 400);
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const now = new Date().toISOString();

  await db
    .prepare(`
      UPDATE chapters
      SET title = ?, content = ?, word_count = ?, publication_status = ?, updated_at = ?
      WHERE id = ?
    `)
    .bind(title, content, wordCount, publicationStatus, now, chapterId)
    .run();

  await db.prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(now, chapter.book_id).run();

  return c.json({ success: true, message: 'Đã cập nhật chương thành công!' });
});

/**
 * DELETE /api/studio/chapters/:chapterId
 * Xóa một chương
 */
studioRoute.delete('/chapters/:chapterId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const chapterId = c.req.param('chapterId');

  const chapter = await db
    .prepare(`
      SELECT c.id, c.book_id, b.created_by_user_id
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.id = ?
    `)
    .bind(chapterId)
    .first<any>();

  if (!chapter) {
    return c.json({ success: false, error: 'Không tìm thấy chương' }, 404);
  }

  if (chapter.created_by_user_id !== user.id && user.role !== 'admin') {
    return c.json({ success: false, error: 'Bạn không có quyền xóa chương này' }, 403);
  }

  await db.prepare('DELETE FROM chapters WHERE id = ?').bind(chapterId).run();
  const now = new Date().toISOString();
  await db.prepare('UPDATE books SET updated_at = ? WHERE id = ?').bind(now, chapter.book_id).run();

  return c.json({ success: true, message: 'Đã xóa chương thành công' });
});

/**
 * GET /api/studio/earnings
 * Thống kê doanh thu bán truyện của tác giả và lịch sử rút tiền
 */
studioRoute.get('/earnings', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const userRow = await db
    .prepare('SELECT author_earnings, coins FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ author_earnings: number; coins: number }>();

  // Thống kê các lượt mở khóa truyện do tác giả này đăng
  const salesRow = await db
    .prepare(`
      SELECT 
        COUNT(bp.id) as total_sales,
        COALESCE(SUM(bp.price_paid), 0) as total_coins_spent,
        COALESCE(SUM(bp.author_earned), 0) as total_author_earned_vnd,
        COALESCE(SUM(bp.platform_fee), 0) as total_platform_fee_vnd
      FROM book_purchases bp
      JOIN books b ON bp.book_id = b.id
      WHERE b.created_by_user_id = ?
    `)
    .bind(user.id)
    .first<{ total_sales: number; total_coins_spent: number; total_author_earned_vnd: number; total_platform_fee_vnd: number }>();

  // Danh sách yêu cầu rút tiền của tác giả
  const withdrawals = await db
    .prepare('SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 30')
    .bind(user.id)
    .all();

  // Tổng tiền đang chờ duyệt rút
  const pendingRow = await db
    .prepare("SELECT COALESCE(SUM(amount), 0) as pending_total FROM withdrawal_requests WHERE user_id = ? AND status = 'pending'")
    .bind(user.id)
    .first<{ pending_total: number }>();

  // Lịch sử độc giả mua tác phẩm gần đây
  const recentSales = await db
    .prepare(`
      SELECT bp.id, bp.price_paid, bp.author_earned, bp.created_at, b.title as book_title, u.username as reader_name
      FROM book_purchases bp
      JOIN books b ON bp.book_id = b.id
      JOIN users u ON bp.user_id = u.id
      WHERE b.created_by_user_id = ?
      ORDER BY bp.created_at DESC
      LIMIT 20
    `)
    .bind(user.id)
    .all();

  const authorBalance = userRow?.author_earnings || 0;

  return c.json({
    success: true,
    data: {
      author_earnings: authorBalance,
      available_balance_vnd: authorBalance,
      pending_withdrawals: pendingRow?.pending_total || 0,
      total_sales_count: salesRow?.total_sales || 0,
      total_earned_vnd: salesRow?.total_author_earned_vnd || 0,
      platform_split: '85% Tác giả / 15% Nhà phát hành',
      withdrawals: withdrawals.results || [],
      withdrawal_history: withdrawals.results || [],
      recent_sales: recentSales.results || [],
    },
  });
});

/**
 * POST /api/studio/withdraw
 * Tác giả gửi yêu cầu rút doanh thu về tài khoản ngân hàng
 */
studioRoute.post('/withdraw', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const amount = parseInt(body.amount || '0', 10);
  const bankName = (body.bank_name || '').trim();
  const accountNumber = (body.account_number || '').trim();
  const accountHolder = (body.account_holder || '').trim();

  if (amount < 100000) {
    return c.json({ success: false, error: 'Số tiền rút tối thiểu là 100.000đ' }, 400);
  }

  if (!bankName || !accountNumber || !accountHolder) {
    return c.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin tài khoản ngân hàng' }, 400);
  }

  // Kiểm tra số dư khả dụng
  const userRow = await db.prepare('SELECT author_earnings FROM users WHERE id = ?').bind(user.id).first<{ author_earnings: number }>();
  const available = userRow?.author_earnings || 0;

  if (amount > available) {
    return c.json(
      {
        success: false,
        error: `Số dư khả dụng không đủ (${available.toLocaleString('vi-VN')}đ). Bạn không thể rút vượt quá số dư.`,
      },
      400
    );
  }

  const now = new Date().toISOString();
  const reqId = createId('wdr');

  // Trừ số dư khả dụng của tác giả
  await db
    .prepare('UPDATE users SET author_earnings = author_earnings - ?, updated_at = ? WHERE id = ?')
    .bind(amount, now, user.id)
    .run();

  // Tạo yêu cầu rút tiền
  await db
    .prepare(`
      INSERT INTO withdrawal_requests (
        id, user_id, amount, bank_name, account_number, account_holder, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `)
    .bind(reqId, user.id, amount, bankName, accountNumber, accountHolder, now, now)
    .run();

  // Ghi nhật ký ví
  await db
    .prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at)
      VALUES (?, ?, 'withdrawal', ?, 'pending', ?, ?)
    `)
    .bind(
      createId('tx'),
      user.id,
      -amount,
      `Yêu cầu rút ${amount.toLocaleString('vi-VN')}đ về ${bankName} (${accountNumber} - ${accountHolder})`,
      now
    )
    .run();

  return c.json({
    success: true,
    message: `Đã gửi yêu cầu rút ${amount.toLocaleString('vi-VN')}đ thành công. Ban quản trị sẽ đối soát và giải ngân trong 24 giờ.`,
    data: {
      request_id: reqId,
      remaining_balance: available - amount,
    },
  });
});

export default studioRoute;
