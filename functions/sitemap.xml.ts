import { DbEnv } from '../server/db';

export const onRequest: PagesFunction<DbEnv> = async (context) => {
  const db = context.env.DB;
  const domain = context.env.SITE_DOMAIN || 'truyennha.vn';
  const baseUrl = `https://${domain}`;

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  xml += `  <url><loc>${baseUrl}/</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>\n`;
  xml += `  <url><loc>${baseUrl}/books</loc><changefreq>hourly</changefreq><priority>0.9</priority></url>\n`;

  if (db) {
    try {
      const books = await db.prepare("SELECT slug, updated_at FROM books WHERE publication_status = 'published'").all<{ slug: string; updated_at: string }>();
      for (const b of books.results || []) {
        xml += `  <url><loc>${baseUrl}/books/${b.slug}</loc><lastmod>${b.updated_at.split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>\n`;
      }
    } catch {}
  }

  xml += `</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
