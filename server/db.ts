/**
 * Database helper cho Cloudflare D1
 * Đảm bảo parameterized queries 100%, không nối chuỗi người dùng vào SQL.
 */

export interface DbEnv {
  DB: D1Database;
  SITE_NAME?: string;
  SITE_DESCRIPTION?: string;
  SITE_DOMAIN?: string;
  PRIMARY_COLOR?: string;
  ADSENSE_ENABLED?: string;
  ADSENSE_PUBLISHER_ID?: string;
  ADSENSE_SLOT_TOP?: string;
  ADSENSE_SLOT_BOTTOM?: string;
  ADSENSE_SLOT_READER?: string;
  BOOTSTRAP_ADMIN_TOKEN?: string;
  COOKIE_DOMAIN?: string;
  NODE_ENV?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
}

/**
 * Chuẩn hóa chuỗi tiếng Việt thành slug thân thiện SEO
 */
export function slugify(str: string): string {
  let s = str.toLowerCase().trim();
  // Chuyển ký tự có dấu sang không dấu
  s = s.replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a');
  s = s.replace(/[éèẻẽẹêếềểễệ]/g, 'e');
  s = s.replace(/[íìỉĩị]/g, 'i');
  s = s.replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o');
  s = s.replace(/[úùủũụưứừửữự]/g, 'u');
  s = s.replace(/[ýỳỷỹỵ]/g, 'y');
  s = s.replace(/đ/g, 'd');
  // Thay thế ký tự đặc biệt
  s = s.replace(/[^a-z0-9\s-]/g, '');
  // Thay thế khoảng trắng và gạch nối trùng lặp
  s = s.replace(/[\s-]+/g, '-');
  return s.replace(/^-+|-+$/g, '');
}

/**
 * Làm sạch văn bản tránh XSS trong nội dung chương và bình luận
 * Thay thế các thẻ html nguy hiểm, bảo toàn xuống dòng
 */
export function sanitizeTextContent(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Tạo ID ngẫu nhiên với tiền tố
 */
export function createId(prefix: string = 'id'): string {
  const rand = Math.random().toString(36).substring(2, 10);
  const time = Date.now().toString(36);
  return `${prefix}_${time}_${rand}`;
}
