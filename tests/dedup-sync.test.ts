import { describe, it, expect } from 'vitest';
import { app } from '../server/app';
import { createMockD1Database } from './mock-db';

describe('Advanced Security & Dedup Sync Tests', () => {
  it('cô lập dữ liệu tủ sách và tiến độ đọc giữa các tài khoản khác nhau', async () => {
    const mockDb = createMockD1Database({
      users: [
        { id: 'usr_userA', username: 'user_a', email: 'a@example.com', role: 'reader', is_active: 1 },
        { id: 'usr_userB', username: 'user_b', email: 'b@example.com', role: 'reader', is_active: 1 },
      ],
      sessions: [
        { id: 'sess_A', user_id: 'usr_userA', expires_at: new Date(Date.now() + 86400000).toISOString() },
        { id: 'sess_B', user_id: 'usr_userB', expires_at: new Date(Date.now() + 86400000).toISOString() },
      ],
      bookmarks: [
        { id: 'bm_1', user_id: 'usr_userA', book_id: 'bk_1' },
      ],
    });

    const env: any = { DB: mockDb, SITE_NAME: 'TruyenNha' };

    // Kiểm tra user A thấy bookmark của mình
    const resA = await app.request('/api/bookmarks/check/bk_1', {
      headers: { Cookie: 'tn_session=sess_A' },
    }, env);
    const jsonA: any = await resA.json();
    expect(jsonA.isBookmarked).toBe(true);

    // Kiểm tra user B KHÔNG thấy bookmark của user A
    const resB = await app.request('/api/bookmarks/check/bk_1', {
      headers: { Cookie: 'tn_session=sess_B' },
    }, env);
    const jsonB: any = await resB.json();
    expect(jsonB.isBookmarked).toBe(false);
  });

  it('từ chối thêm bookmark hoặc tiến độ đọc cho user chưa đăng nhập', async () => {
    const mockDb = createMockD1Database();
    const env: any = { DB: mockDb, SITE_NAME: 'TruyenNha' };

    const res = await app.request('/api/bookmarks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ book_id: 'bk_1' }),
    }, env);

    expect(res.status).toBe(401);
  });
});
