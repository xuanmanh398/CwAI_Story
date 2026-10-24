/**
 * Module Mật mã học an toàn cho Cloudflare Workers & Node.js
 * Sử dụng Web Crypto API tiêu chuẩn (crypto.subtle) với PBKDF2-HMAC-SHA256 (100,000 iterations).
 * Đáp ứng khuyến nghị NIST SP 800-132, tương thích 100% runtime Cloudflare V8 isolate.
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_BYTE_LENGTH = 16;
const KEY_BYTE_LENGTH = 32;

// Chuyển Uint8Array sang Hex string
function bufToHex(buf: Uint8Array): string {
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Chuyển Hex string sang Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Sinh muối (salt) ngẫu nhiên bằng CSPRNG
 */
export function generateSalt(): string {
  const salt = new Uint8Array(SALT_BYTE_LENGTH);
  crypto.getRandomValues(salt);
  return bufToHex(salt);
}

/**
 * Hash mật khẩu với Salt sử dụng PBKDF2-HMAC-SHA256
 */
export async function hashPassword(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuf = hexToBuf(saltHex);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuf.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    KEY_BYTE_LENGTH * 8
  );

  return bufToHex(new Uint8Array(derivedBits));
}

/**
 * So sánh an toàn chống timing attack (Constant-time comparison)
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Xác thực mật khẩu nhập vào với hash và salt đã lưu
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const computedHash = await hashPassword(password, salt);
  return timingSafeEqual(computedHash, hash);
}

/**
 * Tạo token ngẫu nhiên bảo mật (dùng cho Session ID, CSRF Token, Reset Token)
 */
export function generateSecureToken(byteLength: number = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes);
}

/**
 * Băm dữ liệu ngắn gọn bằng SHA-256 (dùng cho IP Hash, ETag)
 */
export async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
  return bufToHex(new Uint8Array(digest));
}
