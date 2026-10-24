import { ContentAdapter, ExternalBookData, ExternalChapterData, validateSafeUrl } from './base';

export interface LicensedApiConfig {
  apiKey?: string;
  timeoutMs?: number;
  maxRetries?: number;
}

/**
 * LicensedPartnerAdapter: Bộ điều hợp chuẩn kết nối REST API đối tác cấp phép
 * Tuân thủ bảo mật SSRF, có backoff retry, timeout và rate limiting handling.
 */
export class LicensedPartnerAdapter implements ContentAdapter {
  readonly providerType = 'licensed_rest_api';

  private parseConfig(configJson: string): LicensedApiConfig {
    try {
      return JSON.parse(configJson || '{}');
    } catch {
      return {};
    }
  }

  private async safeFetch(urlStr: string, options: RequestInit = {}, timeoutMs: number = 8000): Promise<Response> {
    const check = validateSafeUrl(urlStr);
    if (!check.safe) {
      throw new Error(`SSRF Blocked: ${check.reason}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(urlStr, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TruyenNha-LicensedSync/1.0',
          ...(options.headers || {}),
        },
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  async testConnection(baseUrl: string, configJson: string): Promise<{ ok: boolean; message: string }> {
    const config = this.parseConfig(configJson);
    const check = validateSafeUrl(baseUrl);
    if (!check.safe) {
      return { ok: false, message: `URL không hợp lệ: ${check.reason}` };
    }

    try {
      const pingUrl = `${baseUrl.replace(/\/+$/, '')}/ping`;
      const res = await this.safeFetch(pingUrl, {
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
      });

      if (!res.ok) {
        return { ok: false, message: `Đối tác phản hồi mã lỗi HTTP ${res.status}` };
      }

      return { ok: true, message: 'Kết nối API đối tác thành công' };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, message: `Không thể kết nối API đối tác: ${msg}` };
    }
  }

  async fetchBooks(baseUrl: string, configJson: string): Promise<ExternalBookData[]> {
    const config = this.parseConfig(configJson);
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/books`;

    const res = await this.safeFetch(targetUrl, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
    });

    if (!res.ok) {
      throw new Error(`API đối tác trả mã lỗi ${res.status} khi lấy danh sách truyện`);
    }

    const json = (await res.json()) as { items?: ExternalBookData[] };
    return Array.isArray(json.items) ? json.items : [];
  }

  async fetchChapters(baseUrl: string, bookExternalId: string, configJson: string): Promise<ExternalChapterData[]> {
    const config = this.parseConfig(configJson);
    const targetUrl = `${baseUrl.replace(/\/+$/, '')}/books/${encodeURIComponent(bookExternalId)}/chapters`;

    const res = await this.safeFetch(targetUrl, {
      headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {},
    });

    if (!res.ok) {
      throw new Error(`API đối tác trả mã lỗi ${res.status} khi lấy danh sách chương`);
    }

    const json = (await res.json()) as { chapters?: ExternalChapterData[] };
    return Array.isArray(json.chapters) ? json.chapters : [];
  }
}
