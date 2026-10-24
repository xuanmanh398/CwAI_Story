import { describe, it, expect } from 'vitest';
import { slugify, sanitizeTextContent } from '../server/db';
import { UserRegisterSchema, BookCreateSchema, ChapterCreateSchema } from '../shared/types';

describe('Slugify, Sanitizer & Validation Schemas', () => {
  it('chuyển đổi tiếng Việt có dấu thành slug URL thân thiện', () => {
    expect(slugify('Đại Đạo Phong Vân Ký')).toBe('dai-dao-phong-van-ky');
    expect(slugify('Gió Ngang Phố Cổ - Hà Nội')).toBe('gio-ngang-pho-co-ha-noi');
    expect(slugify('Bí Mật Tinh Cầu Lam @#$')).toBe('bi-mat-tinh-cau-lam');
    expect(slugify('   Chương 1: Mưa   Gió   ')).toBe('chuong-1-mua-gio');
  });

  it('sanitize nội dung tránh chèn thẻ HTML độc hại (XSS prevention)', () => {
    const raw = '<script>alert("xss")</script><b onclick="hack()">Xin chào</b> & "tác giả"';
    const clean = sanitizeTextContent(raw);
    expect(clean).not.toContain('<script>');
    expect(clean).toContain('&lt;script&gt;');
    expect(clean).toContain('&amp;');
    expect(clean).toContain('&quot;');
  });

  it('validate dữ liệu đăng ký người dùng hợp lệ', () => {
    const valid = UserRegisterSchema.safeParse({
      username: 'docgia_01',
      email: 'docgia@truyennha.vn',
      password: 'MatKhauDaiTu8KyTu!',
    });
    expect(valid.success).toBe(true);

    // Username chứa ký tự đặc biệt không được phép
    const invalidUsername = UserRegisterSchema.safeParse({
      username: 'docgia<script>',
      email: 'docgia@truyennha.vn',
      password: 'MatKhauDaiTu8KyTu!',
    });
    expect(invalidUsername.success).toBe(false);

    // Mật khẩu quá ngắn
    const shortPass = UserRegisterSchema.safeParse({
      username: 'docgia_01',
      email: 'docgia@truyennha.vn',
      password: '123',
    });
    expect(shortPass.success).toBe(false);
  });

  it('validate schema tạo truyện', () => {
    const valid = BookCreateSchema.safeParse({
      title: 'Thiên Cổ Anh Hùng',
      slug: 'thien-co-anh-hung',
      description: 'Mô tả bộ truyện',
      status: 'ongoing',
      publication_status: 'draft',
      genre_ids: ['genre_tienhiep'],
    });
    expect(valid.success).toBe(true);

    // Slug có khoảng trắng hoặc ký tự hoa là không hợp lệ
    const invalidSlug = BookCreateSchema.safeParse({
      title: 'Thiên Cổ Anh Hùng',
      slug: 'Thien Co Anh Hung',
    });
    expect(invalidSlug.success).toBe(false);
  });

  it('validate schema tạo chương truyện', () => {
    const valid = ChapterCreateSchema.safeParse({
      book_id: 'bk_123',
      chapter_number: 1,
      title: 'Chương 1: Khởi đầu',
      slug: 'chuong-1-khoi-dau',
      content: 'Nội dung truyện dài hơn mười ký tự...',
      publication_status: 'published',
    });
    expect(valid.success).toBe(true);

    // Thiếu nội dung
    const noContent = ChapterCreateSchema.safeParse({
      book_id: 'bk_123',
      chapter_number: 1,
      title: 'Chương 1: Khởi đầu',
      slug: 'chuong-1',
      content: '',
    });
    expect(noContent.success).toBe(false);
  });
});
