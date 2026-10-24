import { describe, it, expect } from 'vitest';
import { ContentCrawlerService } from '../server/services/crawler';
import { AiEditorService } from '../server/services/ai-editor';
import { app } from '../server/app';
import { createMockD1Database } from './mock-db';

describe('AI Editorial & Web Crawler Module', () => {
  it('bóc tách nội dung HTML chương truyện loại bỏ scripts, styles, và trích xuất title', () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Chương 10: Kiếm Khí Ngút Trời - Web Truyen</title>
          <script>alert("tracker");</script>
          <style>.ad { color: red; }</style>
        </head>
        <body>
          <header><nav>Menu</nav></header>
          <div class="chapter-content">
            <p>Trăng lên đỉnh núi, gió thu thổi lạnh thấu xương.</p>
            <p>Diệp Phong vung kiếm, hàn quang lấp lánh như sao băng.</p>
            <br>
            <p>Đối phương lùi lại ba bước, ánh mắt hiện lên vẻ kinh hãi.</p>
          </div>
          <footer>Footer info</footer>
        </body>
      </html>
    `;

    const result = ContentCrawlerService.parseHtmlContent(sampleHtml);
    expect(result.title).toContain('Chương 10: Kiếm Khí Ngút Trời');
    expect(result.content).toContain('Trăng lên đỉnh núi, gió thu thổi lạnh thấu xương.');
    expect(result.content).toContain('Diệp Phong vung kiếm');
    expect(result.content).not.toContain('<script>');
    expect(result.content).not.toContain('<style>');
    expect(result.wordCount).toBeGreaterThan(10);
  });

  it('lọc bỏ watermark, quảng cáo rác và chuẩn hóa dấu câu trong bài viết', async () => {
    const dirtyText = `
      Truyện được đăng tại truyen-lau.xyz chúc bạn đọc truyện vui vẻ!
      Hắn bước tới... nhìn thấy nàng.   Thật đẹp!
      Nguồn: converter_vip_pro http://badlink.com/ads
    `;

    const processed = await AiEditorService.processContent({
      action: 'polish',
      content: dirtyText,
    });

    expect(processed.success).toBe(true);
    expect(processed.resultText).not.toContain('truyen-lau.xyz');
    expect(processed.resultText).not.toContain('http://badlink.com/ads');
    expect(processed.resultText).toContain('Hắn bước tới... nhìn thấy nàng. Thật đẹp!');
  });

  it('từ chối crawler URL nội bộ hoặc metadata nguy hiểm (SSRF protection)', async () => {
    await expect(ContentCrawlerService.extractFromUrl('http://169.254.169.254/secret')).rejects.toThrow('an toàn bảo mật');
    await expect(ContentCrawlerService.extractFromUrl('http://127.0.0.1:8787/api')).rejects.toThrow('an toàn bảo mật');
  });

  it('API /api/admin/crawler/preview yêu cầu xác thực admin/editor', async () => {
    const mockDb = createMockD1Database();
    const env: any = { DB: mockDb };

    const res = await app.request('/api/admin/crawler/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://example.com/chapter-1' }),
    }, env);

    // Chưa đăng nhập -> 401
    expect(res.status).toBe(401);
  });
});
