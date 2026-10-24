/**
 * Service tích hợp AI API (ChatGPT OpenAI và Google Gemini)
 * Hỗ trợ kiểm duyệt nội dung tự động và kiểm tra kết nối API
 */

export interface SystemAiConfig {
  enabled: boolean;
  provider: 'gemini' | 'openai';
  apiKey: string;
  model: string;
  autoModerateNovels: boolean;
  autoModerateComments: boolean;
}

export const DEFAULT_AI_CONFIG: SystemAiConfig = {
  enabled: false,
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-1.5-flash',
  autoModerateNovels: false,
  autoModerateComments: false,
};

/**
 * Kiểm tra kết nối AI API
 */
export async function testAiConnection(
  provider: 'gemini' | 'openai',
  apiKey: string,
  model: string
): Promise<{ success: boolean; reply?: string; error?: string }> {
  if (!apiKey.trim()) {
    return { success: false, error: 'Chưa cung cấp API Key' };
  }

  const prompt = 'Hãy trả lời ngắn gọn một câu bằng tiếng Việt: "Kết nối AI API thành công!"';

  try {
    if (provider === 'gemini') {
      const selectedModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 60 },
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        return { success: false, error: data?.error?.message || `Lỗi Gemini HTTP ${res.status}` };
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      return { success: true, reply: text || 'Kết nối thành công!' };
    } else {
      // OpenAI ChatGPT
      const selectedModel = model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 60,
        }),
      });

      const data = await res.json() as any;
      if (!res.ok) {
        return { success: false, error: data?.error?.message || `Lỗi OpenAI HTTP ${res.status}` };
      }

      const text = data?.choices?.[0]?.message?.content?.trim();
      return { success: true, reply: text || 'Kết nối thành công!' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Không thể kết nối đến máy chủ AI API' };
  }
}

/**
 * Tự động nhận diện danh sách các model khả dụng từ API Key
 */
export async function discoverAiModels(
  provider: 'gemini' | 'openai',
  apiKey: string
): Promise<{ success: boolean; models?: string[]; error?: string }> {
  if (!apiKey.trim()) {
    return { success: false, error: 'Vui lòng nhập API Key trước khi nhận diện Model' };
  }

  try {
    if (provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
      const res = await fetch(url);
      const data = await res.json() as any;
      if (!res.ok) {
        return { success: false, error: data?.error?.message || `Lỗi Gemini API (HTTP ${res.status})` };
      }

      const models: string[] = [];
      if (Array.isArray(data?.models)) {
        for (const m of data.models) {
          if (m.supportedGenerationMethods?.includes('generateContent')) {
            const cleanName = (m.name || '').replace(/^models\//, '');
            if (cleanName && !cleanName.includes('embedding') && !cleanName.includes('aqa') && !cleanName.includes('imagen')) {
              models.push(cleanName);
            }
          }
        }
      }

      // Ưu tiên sắp xếp các model thông dụng
      models.sort((a, b) => {
        if (a.includes('2.0-flash')) return -1;
        if (b.includes('2.0-flash')) return 1;
        if (a.includes('1.5-flash')) return -1;
        if (b.includes('1.5-flash')) return 1;
        return a.localeCompare(b);
      });

      return {
        success: true,
        models: models.length > 0 ? models : ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      };
    } else {
      // OpenAI
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
      });
      const data = await res.json() as any;
      if (!res.ok) {
        return { success: false, error: data?.error?.message || `Lỗi OpenAI API (HTTP ${res.status})` };
      }

      const models: string[] = [];
      if (Array.isArray(data?.data)) {
        for (const m of data.data) {
          const id = m.id || '';
          if (
            id.startsWith('gpt-') ||
            id.startsWith('chatgpt-') ||
            id.startsWith('o1') ||
            id.startsWith('o3')
          ) {
            if (!id.includes('realtime') && !id.includes('audio') && !id.includes('transcription')) {
              models.push(id);
            }
          }
        }
      }

      models.sort((a, b) => {
        if (a === 'gpt-4o-mini') return -1;
        if (b === 'gpt-4o-mini') return 1;
        if (a === 'gpt-4o') return -1;
        if (b === 'gpt-4o') return 1;
        return a.localeCompare(b);
      });

      return {
        success: true,
        models: models.length > 0 ? models : ['gpt-4o-mini', 'gpt-4o', 'o3-mini'],
      };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi kết nối khi quét danh sách Model AI' };
  }
}

export interface ModerationResult {
  isApproved: boolean;
  violationCategory?: string;
  violationSummary?: string;
  reason?: string;
}

/**
 * Kiểm duyệt nội dung tác phẩm hoặc bình luận bằng AI
 * Kiểm tra 4 điều cấm cốt lõi:
 * 1. Xâm phạm chủ quyền lãnh thổ, an ninh quốc gia (xuyên tạc biển đảo, đường lưỡi bò phi pháp)
 * 2. Phân biệt đối xử vùng miền, dân tộc, tôn giáo, gây chia rẽ
 * 3. Xúc phạm, bôi nhọ, phỉ báng danh dự nhân phẩm cá nhân hoặc tổ chức
 * 4. Cổ xúy tệ nạn xã hội (ma túy, cờ bạc), kích động bạo lực cực đoan, ấu dâm
 */
export async function moderateContentWithAi(
  config: SystemAiConfig,
  textToAudit: string
): Promise<ModerationResult> {
  if (!config.enabled || !config.apiKey) {
    return { isApproved: true }; // Bỏ qua nếu chưa bật
  }

  const prompt = `Bạn là hệ thống kiểm duyệt nội dung văn học tiếng Việt của nền tảng TruyenNha.
Nhiệm vụ: Đánh giá xem đoạn văn bản sau đây có vi phạm các tiêu chuẩn sau hay không:
1. Xâm phạm chủ quyền lãnh thổ, an ninh quốc gia (xuyên tạc lịch sử, vi phạm chủ quyền biển đảo Việt Nam, nhắc đến bản đồ 9 đoạn/đường lưỡi bò phi pháp, phủ nhận chủ quyền Hoàng Sa, Trường Sa).
2. Phân biệt đối xử, kỳ thị dân tộc, tôn giáo, phân biệt vùng miền (Bắc/Trung/Nam), kích động hận thù, chia rẽ khối đại đoàn kết dân tộc.
3. Xúc phạm, bôi nhọ, phỉ báng danh dự nhân phẩm cá nhân hoặc cơ quan, tổ chức; vu khống; ngôn từ thô tục phản cảm.
4. Cổ xúy tệ nạn xã hội (ma túy, cờ bạc, mại dâm), kích động bạo lực cực đoan, hướng dẫn hành vi phạm pháp nguy hiểm hoặc nội dung ấu dâm.

Đoạn văn bản cần kiểm tra:
"""
${textToAudit.slice(0, 3000)}
"""

Quy tắc phản hồi:
Nếu an toàn (không vi phạm), trả về:
{"safe": true}

Nếu có vi phạm bất kỳ điều nào trên, trả về duy nhất định dạng JSON:
{
  "safe": false,
  "category": "xâm phạm lãnh thổ" HOẶC "phân biệt vùng miền/dân tộc" HOẶC "xúc phạm cá nhân/tổ chức" HOẶC "cổ xúy bạo lực/tệ nạn",
  "summary": "Tóm tắt ngắn gọn 1-2 câu về nội dung cụ thể vi phạm trong văn bản"
}
Không thêm bất kỳ chữ nào ngoài JSON hợp lệ.`;

  try {
    let rawOutput = '';
    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 150, responseMimeType: 'application/json' },
        }),
      });
      const data = await res.json() as any;
      rawOutput = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          max_tokens: 150,
        }),
      });
      const data = await res.json() as any;
      rawOutput = data?.choices?.[0]?.message?.content?.trim() || '';
    }

    const parsed = JSON.parse(rawOutput);
    if (parsed.safe === false) {
      return {
        isApproved: false,
        violationCategory: parsed.category || 'vi_phạm_nội_quy',
        violationSummary: parsed.summary || parsed.reason || 'Nội dung có dấu hiệu vi phạm tiêu chuẩn cộng đồng',
        reason: parsed.summary || parsed.reason || 'Nội dung vi phạm tiêu chuẩn cộng đồng',
      };
    }
    return { isApproved: true };
  } catch {
    // Nếu AI gặp lỗi tạm thời (hết quota, timeout), không chặn người dùng
    return { isApproved: true };
  }
}
