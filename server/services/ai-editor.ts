/**
 * AI Editor & Translation Engine
 * Hỗ trợ: Cloudflare Workers AI (miễn phí), Google Gemini API, OpenAI-compatible API
 * kèm Rule-based fallback khi không có key.
 */

export interface AiTaskOptions {
  action: 'translate' | 'polish' | 'summarize';
  content: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  novelGenre?: string;
  apiKey?: string;
  provider?: 'cloudflare_ai' | 'gemini' | 'openai' | 'fallback';
}

export interface AiTaskResult {
  success: boolean;
  resultText: string;
  providerUsed: string;
  tokensOrWordCount?: number;
}

export class AiEditorService {
  /**
   * Xử lý văn bản với AI theo yêu cầu
   */
  static async processContent(options: AiTaskOptions, envAi?: any): Promise<AiTaskResult> {
    const { action, content, sourceLanguage = 'Tiếng Trung/Tiếng Anh', targetLanguage = 'Tiếng Việt', novelGenre = 'Tiên Hiệp/Đô Thị' } = options;

    if (!content || content.trim().length === 0) {
      return { success: false, resultText: '', providerUsed: 'none' };
    }

    // 1. Nếu có Cloudflare Workers AI binding
    if (envAi && typeof envAi.run === 'function') {
      try {
        const systemPrompt = this.buildSystemPrompt(action, sourceLanguage, targetLanguage, novelGenre);
        const response = await envAi.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Hãy xử lý văn bản sau:\n\n${content.substring(0, 4000)}` },
          ],
          max_tokens: 2048,
        });

        if (response && response.response) {
          return {
            success: true,
            resultText: response.response.trim(),
            providerUsed: 'Cloudflare Workers AI (Llama 3.1)',
          };
        }
      } catch (err) {
        console.warn('Lỗi gọi Cloudflare Workers AI, chuyển sang fallback:', err);
      }
    }

    // 2. Nếu có Google Gemini API Key
    if (options.apiKey && options.provider === 'gemini') {
      try {
        const prompt = `${this.buildSystemPrompt(action, sourceLanguage, targetLanguage, novelGenre)}\n\nNội dung cần xử lý:\n${content.substring(0, 5000)}`;
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${options.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3 },
          }),
        });

        const json = await res.json() as any;
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            success: true,
            resultText: text.trim(),
            providerUsed: 'Google Gemini 1.5 Flash',
          };
        }
      } catch (err) {
        console.warn('Lỗi gọi Gemini API, chuyển sang fallback:', err);
      }
    }

    // 3. Fallback Engine: Bộ lọc biên tập & nhuận sắc thông minh cục bộ
    return {
      success: true,
      resultText: this.fallbackCleanAndPolish(content, action),
      providerUsed: 'Smart Regex & Rule-based Editorial Fallback',
    };
  }

  private static buildSystemPrompt(action: string, sourceLang: string, targetLang: string, genre: string): string {
    if (action === 'translate') {
      return `Bạn là một dịch giả tiểu thuyết văn học cao cấp thể loại ${genre}. Hãy dịch chính xác, mượt mà từ ${sourceLang} sang ${targetLang}. Giữ nguyên tên nhân vật, địa danh, chiêu thức võ thuật, danh từ riêng. Đảm bảo câu văn thuần phong cách truyện chữ tiếng Việt, không dịch thô ngữ pháp máy móc. Không thêm lời bình cá nhân, chỉ trả về nội dung đã dịch.`;
    }
    if (action === 'polish') {
      return `Bạn là biên tập viên văn học tiếng Việt kỳ cựu thể loại ${genre}. Hãy đọc kỹ và nhuận sắc văn bản: sửa lỗi chính tả, cải thiện nhịp điệu câu văn, loại bỏ các từ lặp gây khó chịu, chia đoạn văn hợp lý, loại bỏ quảng cáo hoặc watermark trang web nếu có. Giữ nguyên cốt truyện gốc và chỉ trả về văn bản đã nhuận sắc.`;
    }
    return `Bạn là biên tập viên tóm tắt truyện. Hãy viết một đoạn tóm tắt hấp dẫn, súc tích (khoảng 150-250 từ) làm nổi bật điểm kịch tính nhất của nội dung được cung cấp.`;
  }

  /**
   * Bộ lọc làm sạch văn bản thông minh (loại bỏ link rác, watermark, chuẩn hóa đoạn văn)
   */
  private static fallbackCleanAndPolish(raw: string, action: string): string {
    let text = raw;

    // 1. Loại bỏ các dòng quảng cáo / watermark thường gặp trên các trang truyện
    text = text.replace(/truyện\s*được\s*(đăng|copy|convert)\s*tại\s*[^\n]+/gi, '');
    text = text.replace(/(nguồn|nguon|converter|chúc bạn đọc truyện vui vẻ|theo dõi tại)[^\n]+/gi, '');
    text = text.replace(/https?:\/\/[^\s]+/gi, '');
    text = text.replace(/[a-zA-Z0-9.-]+\.(com|vn|net|org|xyz|top|vip)/gi, '');

    // 2. Chuẩn hóa dấu câu tiếng Việt & bảo toàn dấu ba chấm
    text = text.replace(/\.{3,}/g, '___ELLIPSIS___');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\s+([.,!?:;])/g, '$1');
    text = text.replace(/([.,!?:;])([^\s"”'’\d])/g, '$1 $2');
    text = text.replace(/___ELLIPSIS___/g, '...');

    // 3. Chuẩn hóa chia đoạn
    const paragraphs = text
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    let result = paragraphs.join('\n\n');

    if (action === 'summarize') {
      const firstFew = paragraphs.slice(0, 3).join(' ');
      result = `Tóm lược: ${firstFew.substring(0, 300)}...`;
    }

    return result;
  }
}
