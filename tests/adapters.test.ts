import { describe, it, expect } from 'vitest';
import { validateSafeUrl } from '../server/adapters/base';
import { MockInternalAdapter } from '../server/adapters/mock';

describe('Content Adapters & SSRF Security Validator', () => {
  it('chặn URL localhost, loopback và 127.0.0.1', () => {
    expect(validateSafeUrl('http://localhost:3000/api').safe).toBe(false);
    expect(validateSafeUrl('http://127.0.0.1:8787/api').safe).toBe(false);
    expect(validateSafeUrl('http://127.0.0.2/test').safe).toBe(false);
    expect(validateSafeUrl('http://0.0.0.0/test').safe).toBe(false);
  });

  it('chặn địa chỉ Metadata IP Cloudflare/AWS/GCP (169.254.169.254)', () => {
    const res = validateSafeUrl('http://169.254.169.254/latest/meta-data/');
    expect(res.safe).toBe(false);
    expect(res.reason).toContain('siêu dữ liệu');
  });

  it('chặn các dải IP mạng nội bộ RFC 1918 (10.x, 172.16-31.x, 192.168.x)', () => {
    expect(validateSafeUrl('http://10.0.0.1/books').safe).toBe(false);
    expect(validateSafeUrl('http://192.168.1.100/admin').safe).toBe(false);
    expect(validateSafeUrl('http://172.16.0.1/api').safe).toBe(false);
    expect(validateSafeUrl('http://172.31.255.255/api').safe).toBe(false);
  });

  it('chặn các giao thức không phải HTTP/HTTPS như file, gopher, ftp', () => {
    expect(validateSafeUrl('file:///etc/passwd').safe).toBe(false);
    expect(validateSafeUrl('ftp://ftp.example.com').safe).toBe(false);
    expect(validateSafeUrl('gopher://evil.com').safe).toBe(false);
  });

  it('chấp nhận URL HTTPS công khai hợp lệ', () => {
    const res = validateSafeUrl('https://api-sandbox.partner-alpha.example/v1');
    expect(res.safe).toBe(true);
    expect(res.url?.hostname).toBe('api-sandbox.partner-alpha.example');
  });

  it('MockInternalAdapter trả về dữ liệu tự sáng tác có thỏa thuận cấp phép', async () => {
    const adapter = new MockInternalAdapter();
    const books = await adapter.fetchBooks('https://mock.truyennha.internal/v1', '{}');

    expect(books).toBeInstanceOf(Array);
    expect(books.length).toBeGreaterThan(0);

    const firstBook = books[0];
    expect(firstBook.title).toBeDefined();
    expect(firstBook.externalId).toBeDefined();
    expect(firstBook.licenseOwner).toBeDefined();

    const chapters = await adapter.fetchChapters('https://mock.truyennha.internal/v1', firstBook.externalId, '{}');
    expect(chapters.length).toBeGreaterThan(0);
    expect(chapters[0].content).toBeDefined();
  });
});
