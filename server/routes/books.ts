import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { SessionUser } from '../auth';
import { sha256Hex } from '../crypto';

const booksRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

interface BookRow {
  id: string;
  title: string;
  slug: string;
  author_id: string | null;
  author_name: string | null;
  cover_url: string | null;
  description: string;
  status: string;
  publication_status: string;
  source_type: string;
  view_count: number;
  is_18_plus?: number;
  is_premium?: number;
  price_coins?: number;
  free_chapters_count?: number;
  created_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
  latest_chapter_number?: number | null;
  latest_chapter_title?: string | null;
  total_chapters?: number;
  genres_csv?: string | null;
  license_status?: string | null;
}

/**
 * GET /api/books
 * Lấy danh sách truyện đã xuất bản, hỗ trợ lọc và phân trang
 */
booksRoute.get('/', async (c) => {
  const db = c.env.DB;
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(c.req.query('limit') || '12', 10)));
  const offset = (page - 1) * limit;

  const genreSlug = c.req.query('genre')?.trim();
  const status = c.req.query('status')?.trim(); // ongoing, completed
  const sort = c.req.query('sort') || 'updated'; // updated, newest, title, views

  const conditions: string[] = ["b.publication_status = 'published'"];
  const params: (string | number)[] = [];

  const currentUser = c.get('user');
  const isPrivileged = currentUser && (currentUser.is_premium === 1 || currentUser.role === 'admin');

  if (genreSlug) {
    if (genreSlug === '18-plus') {
      if (!isPrivileged) {
        return c.json({
          success: false,
          requires_premium: true,
          error: 'Mục 18+ chỉ dành riêng cho tài khoản Premium.',
          data: [],
          meta: { page, limit, total: 0, totalPages: 0 },
        }, 403);
      }
      conditions.push(`(
        b.is_18_plus = 1 OR EXISTS (
          SELECT 1 FROM book_genres bg
          JOIN genres g ON bg.genre_id = g.id
          WHERE bg.book_id = b.id AND g.slug = '18-plus'
        )
      )`);
    } else {
      // Với mọi thể loại thông thường khác: Tuyệt đối không hiển thị truyện 18+
      conditions.push('(b.is_18_plus IS NULL OR b.is_18_plus = 0)');
      conditions.push(`
        EXISTS (
          SELECT 1 FROM book_genres bg
          JOIN genres g ON bg.genre_id = g.id
          WHERE bg.book_id = b.id AND g.slug = ?
        )
      `);
      params.push(genreSlug);
    }
  } else {
    // Không truyền genre (Trang chủ, danh sách mặc định): Tuyệt đối không hiển thị truyện 18+
    conditions.push('(b.is_18_plus IS NULL OR b.is_18_plus = 0)');
  }

  if (status && ['ongoing', 'completed', 'hiatus'].includes(status)) {
    conditions.push('b.status = ?');
    params.push(status);
  }

  const whereClause = conditions.join(' AND ');

  let orderBy = 'b.updated_at DESC';
  if (sort === 'newest') orderBy = 'b.created_at DESC';
  else if (sort === 'title') orderBy = 'b.title ASC';
  else if (sort === 'views') orderBy = 'b.view_count DESC';

  // Đếm tổng số bản ghi
  const countQuery = `SELECT COUNT(*) as total FROM books b WHERE ${whereClause}`;
  const countStmt = db.prepare(countQuery);
  const totalRow = await (params.length > 0 ? countStmt.bind(...params) : countStmt).first<{ total: number }>();
  const total = totalRow?.total || 0;

  // Lấy dữ liệu truyện kèm tác giả, thể loại và chương mới nhất
  const dataQuery = `
    SELECT 
      b.id, b.title, b.slug, b.author_id, a.name as author_name,
      b.cover_url, b.description, b.status, b.publication_status,
      b.source_type, b.view_count, b.is_18_plus, b.is_premium,
      b.price_coins, b.free_chapters_count,
      b.created_at, b.updated_at,
      (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND c.publication_status = 'published') as total_chapters,
      (SELECT c.chapter_number FROM chapters c WHERE c.book_id = b.id AND c.publication_status = 'published' ORDER BY c.chapter_number DESC LIMIT 1) as latest_chapter_number,
      (SELECT c.title FROM chapters c WHERE c.book_id = b.id AND c.publication_status = 'published' ORDER BY c.chapter_number DESC LIMIT 1) as latest_chapter_title,
      (
        SELECT GROUP_CONCAT(g.name, '||')
        FROM book_genres bg
        JOIN genres g ON bg.genre_id = g.id
        WHERE bg.book_id = b.id
      ) as genres_csv
    FROM books b
    LEFT JOIN authors a ON b.author_id = a.id
    WHERE ${whereClause}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const dataStmt = db.prepare(dataQuery);
  const rows = await dataStmt.bind(...params, limit, offset).all<BookRow>();

  const items = (rows.results || []).map((b) => ({
    ...b,
    genres: b.genres_csv ? b.genres_csv.split('||') : [],
  }));

  return c.json({
    success: true,
    data: items,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

/**
 * GET /api/books/:slug
 * Chi tiết một bộ truyện
 */
booksRoute.get('/:slug', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  const user = c.get('user');
  const isPrivileged = user && (user.role === 'admin' || user.role === 'editor');

  const query = `
    SELECT 
      b.id, b.title, b.slug, b.author_id, a.name as author_name, a.bio as author_bio,
      b.cover_url, b.description, b.status, b.publication_status,
      b.source_type, b.view_count, b.is_18_plus, b.is_premium,
      b.price_coins, b.free_chapters_count, b.created_by_user_id,
      b.created_at, b.updated_at,
      r.owner_name as license_owner, r.license_type, r.verification_status as license_status,
      (
        SELECT GROUP_CONCAT(g.id || '::' || g.name || '::' || g.slug, '||')
        FROM book_genres bg
        JOIN genres g ON bg.genre_id = g.id
        WHERE bg.book_id = b.id
      ) as genres_raw,
      (SELECT COUNT(*) FROM chapters c WHERE c.book_id = b.id AND (c.publication_status = 'published' OR ? = 1)) as total_chapters
    FROM books b
    LEFT JOIN authors a ON b.author_id = a.id
    LEFT JOIN rights_records r ON r.book_id = b.id
    WHERE b.slug = ?
  `;

  const book = await db.prepare(query).bind(isPrivileged ? 1 : 0, slug).first<BookRow & { author_bio?: string; genres_raw?: string }>();

  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy bộ truyện này' }, 404);
  }

  // Nếu truyện chưa published, chỉ admin hoặc editor mới được xem
  if (book.publication_status !== 'published' && !isPrivileged) {
    return c.json({ success: false, error: 'Truyện chưa được xuất bản hoặc đang tạm khóa' }, 404);
  }

  // Tăng view_count với cơ chế CHỐNG CHEAT VIEW (Anti-Cheat View Debounce: 1 view/IP/30 phút & loại bỏ Bot)
  if (book.publication_status === 'published') {
    const userAgent = c.req.header('user-agent') || '';
    const isBot = /bot|spider|crawler|crawling|slurp|facebookexternalhit|bingpreview/i.test(userAgent);

    if (!isBot) {
      const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
      const recordValidView = async () => {
        try {
          const ipHash = await sha256Hex(ip);
          const recentView = await db
            .prepare(`
              SELECT id FROM book_view_logs 
              WHERE book_id = ? AND ip_hash = ? AND created_at > datetime('now', '-30 minutes')
              LIMIT 1
            `)
            .bind(book.id, ipHash)
            .first();

          if (!recentView) {
            const now = new Date().toISOString();
            await db
              .prepare('INSERT INTO book_view_logs (id, book_id, ip_hash, user_id, created_at) VALUES (?, ?, ?, ?, ?)')
              .bind(createId('vw'), book.id, ipHash, user?.id || null, now)
              .run();

            await db.prepare('UPDATE books SET view_count = view_count + 1 WHERE id = ?').bind(book.id).run();
          }
        } catch (e) {
          console.warn('Lỗi ghi nhận view chống cheat:', e);
        }
      };

      if ('executionCtx' in c) {
        c.executionCtx.waitUntil(recordValidView());
      } else {
        recordValidView().catch(() => {});
      }
    }
  }

  const genres = book.genres_raw
    ? book.genres_raw.split('||').map((raw) => {
        const [id, name, gSlug] = raw.split('::');
        return { id, name, slug: gSlug };
      })
    : [];

  let isPurchased = false;
  if (user) {
    if (user.role === 'admin' || (book.created_by_user_id && book.created_by_user_id === user.id)) {
      isPurchased = true;
    } else {
      const purchaseRow = await db
        .prepare('SELECT id FROM book_purchases WHERE user_id = ? AND book_id = ?')
        .bind(user.id, book.id)
        .first();
      if (purchaseRow) isPurchased = true;
    }
  }

  return c.json({
    success: true,
    data: {
      ...book,
      genres,
      is_purchased: isPurchased,
    },
  });
});

/**
 * GET /api/books/:slug/chapters
 * Danh sách chương của truyện
 */
booksRoute.get('/:slug/chapters', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  const user = c.get('user');
  const isPrivileged = user && (user.role === 'admin' || user.role === 'editor');

  const book = await db.prepare('SELECT id, publication_status FROM books WHERE slug = ?').bind(slug).first<{ id: string; publication_status: string }>();

  if (!book || (book.publication_status !== 'published' && !isPrivileged)) {
    return c.json({ success: false, error: 'Không tìm thấy truyện' }, 404);
  }

  let query = `
    SELECT id, chapter_number, title, slug, word_count, publication_status, created_at, updated_at
    FROM chapters
    WHERE book_id = ?
  `;
  if (!isPrivileged) {
    query += " AND publication_status = 'published'";
  }
  query += ' ORDER BY chapter_number ASC';

  const rows = await db.prepare(query).bind(book.id).all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

/**
 * GET /api/books/:slug/chapters/:chapterNumber
 * Đọc nội dung một chương
 */
booksRoute.get('/:slug/chapters/:chapterNumber', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  const chapterNumber = parseInt(c.req.param('chapterNumber'), 10);
  const user = c.get('user');
  const isPrivileged = user && (user.role === 'admin' || user.role === 'editor');

  if (isNaN(chapterNumber)) {
    return c.json({ success: false, error: 'Số chương không hợp lệ' }, 400);
  }

  // Lấy thông tin truyện
  const book = await db
    .prepare('SELECT id, title, slug, cover_url, publication_status, is_18_plus, is_premium, price_coins, free_chapters_count, created_by_user_id FROM books WHERE slug = ?')
    .bind(slug)
    .first<{ id: string; title: string; slug: string; cover_url: string | null; publication_status: string; is_18_plus: number; is_premium: number; price_coins: number; free_chapters_count: number; created_by_user_id: string | null }>();

  if (!book || (book.publication_status !== 'published' && !isPrivileged)) {
    return c.json({ success: false, error: 'Truyện không tồn tại hoặc chưa xuất bản' }, 404);
  }

  // Lấy thông tin chương hiện tại
  const chapter = await db
    .prepare('SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ?')
    .bind(book.id, chapterNumber)
    .first<{
      id: string;
      book_id: string;
      chapter_number: number;
      title: string;
      slug: string;
      content: string;
      word_count: number;
      publication_status: string;
      updated_at: string;
    }>();

  if (!chapter || (chapter.publication_status !== 'published' && !isPrivileged)) {
    return c.json({ success: false, error: 'Chương chưa xuất bản hoặc không tồn tại' }, 404);
  }

  // Kiểm tra quyền tác giả hoặc đặc quyền
  const isAuthorOfBook = Boolean(user && (book.created_by_user_id === user.id || user.role === 'admin' || user.role === 'editor'));
  const isPremiumUser = Boolean(user && user.is_premium === 1);
  const isAuthorized18Plus = isAuthorOfBook || isPrivileged || isPremiumUser;

  // Lấy chương trước và chương sau (chỉ lấy published đối với độc giả)
  const prevChapter = await db
    .prepare(`
      SELECT chapter_number, title, slug FROM chapters 
      WHERE book_id = ? AND chapter_number < ? ${isPrivileged ? '' : "AND publication_status = 'published'"}
      ORDER BY chapter_number DESC LIMIT 1
    `)
    .bind(book.id, chapterNumber)
    .first<{ chapter_number: number; title: string; slug: string }>();

  const nextChapter = await db
    .prepare(`
      SELECT chapter_number, title, slug FROM chapters 
      WHERE book_id = ? AND chapter_number > ? ${isPrivileged ? '' : "AND publication_status = 'published'"}
      ORDER BY chapter_number ASC LIMIT 1
    `)
    .bind(book.id, chapterNumber)
    .first<{ chapter_number: number; title: string; slug: string }>();

  // 0. Bắt buộc đăng ký / đăng nhập tài khoản để đọc truyện (khách chưa đăng nhập chỉ xem thông tin chung)
  if (!user) {
    return c.json({
      success: true,
      data: {
        chapter: {
          id: chapter.id,
          book_id: chapter.book_id,
          chapter_number: chapter.chapter_number,
          title: chapter.title,
          slug: chapter.slug,
          content: '🔒 Bạn chưa đăng nhập. Vui lòng đăng ký tài khoản mới hoặc đăng nhập để bắt đầu đọc nội dung truyện.',
          word_count: chapter.word_count,
          publication_status: chapter.publication_status,
          updated_at: chapter.updated_at,
          is_locked: true,
          require_reason: 'require_login',
        },
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          cover_url: book.cover_url || '',
          is_18_plus: book.is_18_plus,
          is_premium: book.is_premium,
          price_coins: book.price_coins || 0,
          free_chapters_count: book.free_chapters_count || 5,
        },
        prevChapter: prevChapter || null,
        nextChapter: nextChapter || null,
        is_locked: true,
      },
    });
  }

  // Nếu là tác giả của truyện hoặc admin thì được đọc toàn bộ không giới hạn
  if (isAuthorOfBook) {
    return c.json({
      success: true,
      data: {
        chapter: {
          ...chapter,
          is_locked: false,
        },
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          cover_url: book.cover_url || '',
          is_18_plus: book.is_18_plus,
          is_premium: book.is_premium,
          price_coins: book.price_coins || 0,
          free_chapters_count: book.free_chapters_count || 5,
        },
        prevChapter: prevChapter || null,
        nextChapter: nextChapter || null,
        is_locked: false,
      },
    });
  }

  // 1. Nếu tác phẩm là 18+ (is_18_plus = 1) mà người dùng chưa mở khóa gói 18+
  if (book.is_18_plus === 1 && !isAuthorized18Plus) {
    const previewWords = chapter.content.split(/\s+/).slice(0, 120).join(' ');
    const previewContent = `${previewWords}...\n\n[🔒 NỘI DUNG 18+ BẢN QUYỀN GIỚI HẠN]\nChương truyện này thuộc danh mục nội dung 18+ và giới hạn thành viên. Vui lòng mở khóa gói 18+ để đọc trọn vẹn toàn bộ tác phẩm.`;

    return c.json({
      success: true,
      data: {
        chapter: {
          ...chapter,
          content: previewContent,
          is_locked: true,
          require_reason: '18_plus',
        },
        book: {
          id: book.id,
          title: book.title,
          slug: book.slug,
          cover_url: book.cover_url || '',
          is_18_plus: 1,
          is_premium: book.is_premium,
          price_coins: book.price_coins || 0,
          free_chapters_count: book.free_chapters_count || 5,
        },
        prevChapter: prevChapter || null,
        nextChapter: nextChapter || null,
        is_locked: true,
      },
    });
  }

  // 2. Nếu tác phẩm là tác phẩm trả phí và chương này vượt quá số chương đọc thử miễn phí
  const priceCoins = book.price_coins || 0;
  const freeChapters = book.free_chapters_count !== undefined && book.free_chapters_count !== null ? book.free_chapters_count : 5;

  if (priceCoins > 0 && chapterNumber > freeChapters) {
    let isPurchased = false;
    const purchaseRow = await db
      .prepare('SELECT id FROM book_purchases WHERE user_id = ? AND book_id = ?')
      .bind(user.id, book.id)
      .first();
    if (purchaseRow) isPurchased = true;

    if (!isPurchased) {
      const previewWords = chapter.content.split(/\s+/).slice(0, 100).join(' ');
      const previewContent = `${previewWords}...\n\n[🔒 CHƯƠNG TRẢ PHÍ / BẢN QUYỀN TÁC GIẢ]\nTác phẩm này miễn phí ${freeChapters} chương đầu tiên. Để đọc tiếp chương ${chapterNumber} và toàn bộ các chương còn lại, vui lòng mở khóa tác phẩm (${priceCoins} xu).`;

      return c.json({
        success: true,
        data: {
          chapter: {
            ...chapter,
            content: previewContent,
            is_locked: true,
            require_reason: 'paid_book',
            price_coins: priceCoins,
            free_chapters_count: freeChapters,
          },
          book: {
            id: book.id,
            title: book.title,
            slug: book.slug,
            cover_url: book.cover_url || '',
            price_coins: priceCoins,
            free_chapters_count: freeChapters,
            is_18_plus: book.is_18_plus,
            is_premium: book.is_premium,
          },
          prevChapter: prevChapter || null,
          nextChapter: nextChapter || null,
          is_locked: true,
        },
      });
    }
  }

  return c.json({
    success: true,
    data: {
      chapter: {
        ...chapter,
        is_locked: false,
      },
      book: {
        id: book.id,
        title: book.title,
        slug: book.slug,
        cover_url: book.cover_url || '',
        is_18_plus: book.is_18_plus,
        is_premium: book.is_premium,
        price_coins: book.price_coins || 0,
        free_chapters_count: book.free_chapters_count || 5,
      },
      prevChapter: prevChapter || null,
      nextChapter: nextChapter || null,
      is_locked: false,
    },
  });
});

export default booksRoute;
