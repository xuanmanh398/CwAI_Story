import { DbEnv } from '../server/db';

export const onRequest: PagesFunction<DbEnv> = async (context) => {
  const domain = context.env.SITE_DOMAIN || 'truyennha.vn';
  const txt = `User-agent: *
Disallow: /admin/
Disallow: /api/admin/
Disallow: /api/auth/
Disallow: /tu-sach
Disallow: /search

Sitemap: https://${domain}/sitemap.xml
`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
