import { describe, it, expect, beforeEach } from 'vitest';
import { app } from '../server/app';
import { createMockD1Database } from './mock-db';

describe('Author Studio & User Story Submission Tests', () => {
  let mockDb: any;
  const env: any = {
    SITE_NAME: 'TruyenNha',
    SITE_DOMAIN: 'truyennha.vn',
  };

  beforeEach(() => {
    mockDb = createMockD1Database();
    env.DB = mockDb;
  });

  it('Từ chối 401 khi người dùng chưa đăng nhập truy cập /api/studio/my-books', async () => {
    const res = await app.request('/api/studio/my-books', {}, env);
    expect(res.status).toBe(401);

    const json: any = await res.json();
    expect(json.success).toBe(false);
  });

  it('Từ chối 401 khi người dùng chưa đăng nhập gọi POST /api/studio/books', async () => {
    const res = await app.request(
      '/api/studio/books',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Truyện Thử Nghiệm' }),
      },
      env
    );
    expect(res.status).toBe(401);
  });

  it('Cho phép người dùng đã đăng nhập tạo truyện mới và thêm chương', async () => {
    // 1. Đăng ký tài khoản độc giả/tác giả
    const regRes = await app.request(
      '/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'tacgia_moi',
          email: 'tacgia@example.com',
          password: 'Password@123',
        }),
      },
      env
    );
    expect(regRes.status).toBe(200);
    const cookie = regRes.headers.get('set-cookie') || '';

    // 2. Đăng truyện mới qua Author Studio
    const bookRes = await app.request(
      '/api/studio/books',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          title: 'Huyền Thiên Đế Tôn',
          author_name: 'Bút Danh Lam Vũ',
          description: 'Hành trình quật khởi của thiếu niên tại Huyền Vũ Đại Lục.',
          genre_ids: ['genre_tienhiep'],
          status: 'ongoing',
          publication_status: 'published',
        }),
      },
      env
    );

    expect(bookRes.status).toBe(200);
    const bookJson: any = await bookRes.json();
    expect(bookJson.success).toBe(true);
    expect(bookJson.data.title).toBe('Huyền Thiên Đế Tôn');
    const bookId = bookJson.data.id;

    // 3. Thêm chương mới cho truyện vừa tạo
    const chapterRes = await app.request(
      `/api/studio/books/${bookId}/chapters`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: cookie,
        },
        body: JSON.stringify({
          chapter_number: 1,
          title: 'Chương 1: Khởi đầu thức tỉnh',
          content: 'Nội dung chương một vô cùng sống động với nhiều tình tiết hồi hộp và hấp dẫn.',
          publication_status: 'published',
        }),
      },
      env
    );

    expect(chapterRes.status).toBe(200);
    const chapterJson: any = await chapterRes.json();
    expect(chapterJson.success).toBe(true);
    expect(chapterJson.data.chapter_number).toBe(1);

    // 4. Lấy danh sách truyện của tôi
    const myBooksRes = await app.request(
      '/api/studio/my-books',
      {
        headers: { Cookie: cookie },
      },
      env
    );
    expect(myBooksRes.status).toBe(200);
    const myBooksJson: any = await myBooksRes.json();
    expect(myBooksJson.success).toBe(true);
    expect(myBooksJson.data.length).toBeGreaterThanOrEqual(1);
  });
});
