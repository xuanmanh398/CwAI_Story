/**
 * Adapter Base & Bộ lọc an toàn chống SSRF
 */

export interface ExternalBookData {
  externalId: string;
  title: string;
  slug?: string;
  authorName: string;
  coverUrl?: string;
  description: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  licenseOwner: string;
  licenseNotes?: string;
}

export interface ExternalChapterData {
  chapterNumber: number;
  title: string;
  slug?: string;
  content: string;
}

export interface SyncResult {
  success: boolean;
  totalFetched: number;
  totalSaved: number;
  errors: string[];
}

export interface ContentAdapter {
  readonly providerType: string;
  testConnection(baseUrl: string, configJson: string): Promise<{ ok: boolean; message: string }>;
  fetchBooks(baseUrl: string, configJson: string): Promise<ExternalBookData[]>;
  fetchChapters(baseUrl: string, bookExternalId: string, configJson: string): Promise<ExternalChapterData[]>;
}

/**
 * Kiểm tra URL an toàn chống SSRF (Server-Side Request Forgery)
 * Nghiêm cấm loopback, RFC 1918 private IPs, AWS/GCP/Cloudflare metadata IP (169.254.169.254)
 */
export function validateSafeUrl(urlStr: string): { safe: boolean; reason?: string; url?: URL } {
  try {
    const parsed = new URL(urlStr);

    // Chỉ cho phép HTTPS (hoặc HTTP nếu trong môi trường test cục bộ xác định rõ)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { safe: false, reason: 'Chỉ chấp nhận giao thức HTTP/HTTPS' };
    }

    const host = parsed.hostname.toLowerCase();

    // Chặn localhost và biến thể
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '0.0.0.0') {
      return { safe: false, reason: 'Không cho phép kết nối tới địa chỉ nội bộ (localhost/loopback)' };
    }

    // Chặn Cloudflare / AWS / Azure / GCP Metadata IP
    if (host === '169.254.169.254') {
      return { safe: false, reason: 'Địa chỉ IP siêu dữ liệu bị cấm (Metadata Protection)' };
    }

    // Chặn Private IPv4 Subnets (RFC 1918)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = host.match(ipv4Regex);
    if (ipMatch) {
      const octet1 = parseInt(ipMatch[1], 10);
      const octet2 = parseInt(ipMatch[2], 10);

      // 10.0.0.0/8
      if (octet1 === 10) {
        return { safe: false, reason: 'Dải mạng nội bộ (10.0.0.0/8) bị cấm' };
      }
      // 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
      if (octet1 === 172 && octet2 >= 16 && octet2 <= 31) {
        return { safe: false, reason: 'Dải mạng nội bộ (172.16.0.0/12) bị cấm' };
      }
      // 192.168.0.0/16
      if (octet1 === 192 && octet2 === 168) {
        return { safe: false, reason: 'Dải mạng nội bộ (192.168.0.0/16) bị cấm' };
      }
      // 127.0.0.0/8
      if (octet1 === 127) {
        return { safe: false, reason: 'Dải loopback (127.0.0.0/8) bị cấm' };
      }
    }

    // Chặn port nhạy cảm
    if (parsed.port) {
      const port = parseInt(parsed.port, 10);
      const forbiddenPorts = [22, 23, 25, 110, 143, 3306, 5432, 6379, 27017];
      if (forbiddenPorts.includes(port)) {
        return { safe: false, reason: `Cổng mạng ${port} không được phép kết nối` };
      }
    }

    return { safe: true, url: parsed };
  } catch {
    return { safe: false, reason: 'Định dạng URL không hợp lệ' };
  }
}
