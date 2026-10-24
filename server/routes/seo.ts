import { Hono } from 'hono';
import { DbEnv } from '../db';

const seoRoute = new Hono<{ Bindings: DbEnv }>();

/**
 * GET /sitemap.xml
 * Tạo sitemap XML động cho các trang công khai hợp lệ
 */
seoRoute.get('/sitemap.xml', async (c) => {
  const db = c.env.DB;
  const domain = c.env.SITE_DOMAIN || 'truyennha.id.vn';
  const baseUrl = `https://${domain}`;

  // Lấy các truyện published
  const books = await db
    .prepare("SELECT slug, updated_at FROM books WHERE publication_status = 'published'")
    .all<{ slug: string; updated_at: string }>();

  // Lấy các chương published
  const chapters = await db
    .prepare(`
      SELECT b.slug as book_slug, c.chapter_number, c.updated_at
      FROM chapters c
      JOIN books b ON c.book_id = b.id
      WHERE c.publication_status = 'published' AND b.publication_status = 'published'
    `)
    .all<{ book_slug: string; chapter_number: number; updated_at: string }>();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Trang chủ & tĩnh
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/books</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/gioi-thieu</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/dieu-khoan</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/chinh-sach-bao-mat</loc><changefreq>monthly</changefreq><priority>0.3</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/chinh-sach-ban-quyen</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>\n`;

  // Truyện
  for (const b of books.results || []) {
    xml += `  <url><loc>${baseUrl}/books/${b.slug}</loc><lastmod>${b.updated_at.split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
  }

  // Chương
  for (const ch of chapters.results || []) {
    xml += `  <url><loc>${baseUrl}/books/${ch.book_slug}/chuong-${ch.chapter_number}</loc><lastmod>${ch.updated_at.split('T')[0]}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>\n`;
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
    },
  });
});

/**
 * GET /robots.txt
 */
seoRoute.get('/robots.txt', (c) => {
  const domain = c.env.SITE_DOMAIN || 'truyennha.id.vn';
  const txt = `User-agent: *
Disallow: /admin/
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /tu-sach
Disallow: /search

Sitemap: https://${domain}/sitemap.xml
`;

  return new Response(txt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
});

/**
 * GET /ads.txt
 * Tự động đồng bộ với cấu hình Publisher ID từ Database hoặc Environment
 */
seoRoute.get('/ads.txt', async (c) => {
  const db = c.env.DB;
  let pubId = c.env.ADSENSE_PUBLISHER_ID || '';

  try {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'ads_config'").first<{ value: string }>();
    if (row?.value) {
      const parsed = JSON.parse(row.value);
      if (parsed?.adsense?.publisherId) {
        pubId = parsed.adsense.publisherId;
      }
    }
  } catch {
    // fallback
  }

  if (pubId) {
    pubId = pubId.replace(/^ca-/, '').trim();
  }

  if (!pubId || !pubId.startsWith('pub-')) {
    return new Response('# Google AdSense: Chua cau hinh Publisher ID (pub-xxxxxxxxxxxxxxxx)', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const content = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

/**
 * GET /api/config
 * Trả về cấu hình công khai của website
 */
seoRoute.get('/api/config', async (c) => {
  const db = c.env.DB;
  let adsConfigFromDb: any = null;
  try {
    const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'ads_config'").first<{ value: string }>();
    if (row?.value) {
      adsConfigFromDb = JSON.parse(row.value);
    }
  } catch {
    // dự phòng nếu chưa có bảng
  }

  const adsense = {
    enabled: adsConfigFromDb?.adsense?.enabled ?? (c.env.ADSENSE_ENABLED === 'true'),
    publisherId: adsConfigFromDb?.adsense?.publisherId ?? (c.env.ADSENSE_PUBLISHER_ID || ''),
    slotTop: adsConfigFromDb?.adsense?.slotTop ?? (c.env.ADSENSE_SLOT_TOP || ''),
    slotBottom: adsConfigFromDb?.adsense?.slotBottom ?? (c.env.ADSENSE_SLOT_BOTTOM || ''),
    slotReader: adsConfigFromDb?.adsense?.slotReader ?? (c.env.ADSENSE_SLOT_READER || ''),
    autoAds: adsConfigFromDb?.adsense?.autoAds ?? false,
  };

  const customAds = adsConfigFromDb?.customAds || {
    enabled: false,
    topBanner: null,
    bottomBanner: null,
    readerBanner: null,
  };

  return c.json({
    success: true,
    data: {
      siteName: c.env.SITE_NAME || 'TruyenNha',
      siteDescription: c.env.SITE_DESCRIPTION || 'Nền tảng đọc truyện chữ tiếng Việt chất lượng cao',
      siteDomain: c.env.SITE_DOMAIN || 'truyennha.id.vn',
      primaryColor: c.env.PRIMARY_COLOR || '#16a34a',
      adsense,
      customAds,
    },
  });
});

export default seoRoute;
