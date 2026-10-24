import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { DbEnv } from './db';
import { userContextMiddleware, SessionUser } from './auth';

import booksRoute from './routes/books';
import searchRoute from './routes/search';
import genresRoute from './routes/genres';
import authRoute from './routes/auth';
import bookmarksRoute from './routes/bookmarks';
import progressRoute from './routes/progress';
import adminRoute from './routes/admin';
import crawlerRoute from './routes/crawler';
import seoRoute from './routes/seo';
import studioRoute from './routes/studio';
import walletRoute from './routes/wallet';
import commentsRoute from './routes/comments';
import notificationsRoute from './routes/notifications';
import reportsRoute from './routes/reports';

export const app = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

// 1. Security Headers Middleware
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
});

// 2. CORS Middleware
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-bootstrap-token'],
    maxAge: 86400,
  })
);

// 3. User session context middleware
app.use('*', userContextMiddleware);

// 4. Global Error Handler
app.onError((err, c) => {
  console.error('Unhandled Application Error:', err);
  return c.json(
    {
      success: false,
      error: 'Hệ thống đang bận hoặc xảy ra lỗi xử lý. Vui lòng thử lại sau.',
    },
    500
  );
});

// 5. Mount API Routes - hỗ trợ cả có prefix /api và không prefix
const api = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();
api.route('/config', seoRoute);
api.route('/books', booksRoute);
api.route('/search', searchRoute);
api.route('/genres', genresRoute);
api.route('/auth', authRoute);
api.route('/bookmarks', bookmarksRoute);
api.route('/reading-progress', progressRoute);
api.route('/admin/crawler', crawlerRoute);
api.route('/admin', adminRoute);
api.route('/studio', studioRoute);
api.route('/wallet', walletRoute);
api.route('/comments', commentsRoute);
api.route('/notifications', notificationsRoute);
api.route('/reports', reportsRoute);

app.route('/api', api);
app.route('/', api);
app.route('/', seoRoute);

// 6. 404 cho API không xác định
app.notFound((c) => {
  return c.json({ success: false, error: 'Endpoint không tồn tại' }, 404);
});

export default app;
