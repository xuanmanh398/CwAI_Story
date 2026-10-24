import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../server/app';
import { createMockD1Database } from './mock-db';

describe('API Routes & Security Access Control', () => {
  let mockDb: any;
  const env: any = {
    SITE_NAME: 'TruyenNha',
    SITE_DOMAIN: 'truyennha.vn',
    PRIMARY_COLOR: '#16a34a',
    ADSENSE_ENABLED: 'false',
  };

  beforeEach(() => {
    mockDb = createMockD1Database();
    env.DB = mockDb;
  });

  it('GET /api/config trả về thông tin cấu hình website hợp lệ', async () => {
    const res = await app.request('/api/config', {}, env);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.siteName).toBe('TruyenNha');
    expect(json.data.primaryColor).toBe('#16a34a');
  });

  it('GET /robots.txt trả về cấu hình cấm index admin/auth', async () => {
    const res = await app.request('/robots.txt', {}, env);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Disallow: /admin/');
    expect(text).toContain('Disallow: /api/admin/');
    expect(text).toContain('Sitemap: https://truyennha.vn/sitemap.xml');
  });

  it('GET /api/books chỉ trả về truyện đã xuất bản (published)', async () => {
    const res = await app.request('/api/books', {}, env);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toBeInstanceOf(Array);

    // Đảm bảo không có truyện draft nào lọt vào API công khai
    const draftBook = json.data.find((b: any) => b.publication_status === 'draft');
    expect(draftBook).toBeUndefined();
  });

  it('GET /api/books/:slug trả về 404 khi truy cập truyện draft bằng API công khai', async () => {
    const res = await app.request('/api/books/ban-thao-gia-kim-thuat', {}, env);
    // Draft book phải bị từ chối với status 404 cho reader
    expect(res.status).toBe(404);

    const json: any = await res.json();
    expect(json.success).toBe(false);
  });

  it('GET /api/books/:slug trả về 200 cho truyện đã xuất bản', async () => {
    const res = await app.request('/api/books/dai-dao-phong-van-ky', {}, env);
    expect(res.status).toBe(200);

    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('Đại Đạo Phong Vân Ký');
  });

  it('POST /api/auth/register đăng ký tài khoản mới và cấp session cookie', async () => {
    const res = await app.request(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'docgia_test',
          email: 'test@truyennha.vn',
          password: 'MatKhauBaoMat#123',
        }),
      },
      env
    );

    expect(res.status).toBe(200);
    const json: any = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.username).toBe('docgia_test');

    // Kiểm tra Set-Cookie header
    const cookie = res.headers.get('set-cookie');
    expect(cookie).toContain('tn_session=');
    expect(cookie?.toLowerCase()).toContain('httponly');
  });

  it('Bảo vệ khu vực /api/admin: từ chối truy cập khi chưa đăng nhập', async () => {
    const res = await app.request('/api/admin/stats', {}, env);
    expect(res.status).toBe(401);
  });
});
