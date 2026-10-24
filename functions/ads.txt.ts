import { DbEnv } from '../server/db';

export const onRequest: PagesFunction<DbEnv> = async (context) => {
  let pubId = context.env.ADSENSE_PUBLISHER_ID || '';

  try {
    const db = context.env.DB;
    if (db) {
      const row = await db.prepare("SELECT value FROM site_settings WHERE key = 'ads_config'").first<{ value: string }>();
      if (row?.value) {
        const parsed = JSON.parse(row.value);
        if (parsed?.adsense?.publisherId) {
          pubId = parsed.adsense.publisherId;
        }
      }
    }
  } catch {
    // fallback
  }

  if (pubId) {
    pubId = pubId.replace(/^ca-/, '').trim();
  }

  if (!pubId || !pubId.startsWith('pub-')) {
    pubId = 'pub-8536397536776608';
  }

  return new Response(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
