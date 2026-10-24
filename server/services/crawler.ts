import { validateSafeUrl } from '../adapters/base';

export interface ExtractedChapter {
  title: string;
  content: string;
  wordCount: number;
}

/**
 * Service bóc tách nội dung văn bản từ URL nguồn an toàn
 * Chặn đứng SSRF và làm sạch HTML độc hại
 */
export class ContentCrawlerService {
  /**
   * Bóc tách nội dung chương từ một trang web nguồn
   */
  static async extractFromUrl(urlStr: string): Promise<ExtractedChapter> {
    const check = validateSafeUrl(urlStr);
    if (!check.safe) {
      throw new Error(`URL bị từ chối do an toàn bảo mật: ${check.reason}`);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(urlStr, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TruyenNha-AIBot/1.0',
          'Accept': 'text/html,application/xhtml+xml',
        },
      });

      if (!res.ok) {
        throw new Error(`Máy chủ nguồn phản hồi mã lỗi HTTP ${res.status}`);
      }

      const html = await res.text();
      return this.parseHtmlContent(html);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Phân tích cú pháp HTML để lấy Tiêu đề và Văn bản thuần
   */
  static parseHtmlContent(html: string): ExtractedChapter {
    // 1. Lọc bỏ các thẻ nguy hiểm và không cần thiết
    let clean = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '');

    // 2. Trích xuất tiêu đề (h1 hoặc title)
    let title = 'Chương mới';
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);

    if (h1Match && h1Match[1]) {
      title = h1Match[1].replace(/<[^>]+>/g, '').trim();
    } else if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    // 3. Tách nội dung văn bản chính
    // Tìm các thẻ chứa nội dung phổ biến như id="chapter-content", class="chapter-content", v.v.
    let contentBlock = '';
    const contentBlockMatch = clean.match(/<(div|article)[^>]*(?:id|class)=["'][^"']*(?:content|chapter-c|chapter-body|entry-content)[^"']*["'][^>]*>([\s\S]*?)<\/\1>/i);

    if (contentBlockMatch && contentBlockMatch[2]) {
      contentBlock = contentBlockMatch[2];
    } else {
      contentBlock = clean;
    }

    // Chuyển đổi <p>, <br> thành xuống dòng
    let formattedText = contentBlock
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '') // Xóa toàn bộ HTML tags còn lại
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    // Chuẩn hóa khoảng trắng và dòng trống
    const lines = formattedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const finalContent = lines.join('\n\n');
    const wordCount = finalContent.split(/\s+/).filter(Boolean).length;

    return {
      title,
      content: finalContent,
      wordCount,
    };
  }
}
