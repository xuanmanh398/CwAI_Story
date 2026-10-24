import { describe, it, expect } from 'vitest';
import { generateSalt, hashPassword, verifyPassword, timingSafeEqual, generateSecureToken } from '../server/crypto';

describe('Crypto & Password Hashing Module (Web Crypto PBKDF2)', () => {
  it('tạo salt ngẫu nhiên đủ 32 ký tự hex (16 bytes)', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    expect(salt1).toHaveLength(32);
    expect(salt2).toHaveLength(32);
    expect(salt1).not.toBe(salt2);
  });

  it('tạo hash password nhất quán với cùng mật khẩu và salt', async () => {
    const password = 'MatKhauBaoMat@123';
    const salt = generateSalt();
    const hash1 = await hashPassword(password, salt);
    const hash2 = await hashPassword(password, salt);

    expect(hash1).toHaveLength(64); // 32 bytes hex = 64 ký tự
    expect(hash1).toBe(hash2);
  });

  it('xác thực mật khẩu đúng và từ chối mật khẩu sai', async () => {
    const password = 'MatKhauChinhXac#2024';
    const salt = generateSalt();
    const hash = await hashPassword(password, salt);

    const isMatch = await verifyPassword(password, hash, salt);
    expect(isMatch).toBe(true);

    const isWrong = await verifyPassword('MatKhauSaiRoi!', hash, salt);
    expect(isWrong).toBe(false);
  });

  it('so sánh chuỗi an toàn chống timing attack (timingSafeEqual)', () => {
    expect(timingSafeEqual('abcdef', 'abcdef')).toBe(true);
    expect(timingSafeEqual('abcdef', 'abcdeg')).toBe(false);
    expect(timingSafeEqual('short', 'longer_string')).toBe(false);
  });

  it('tạo token bảo mật ngẫu nhiên không trùng lặp', () => {
    const token1 = generateSecureToken(32);
    const token2 = generateSecureToken(32);
    expect(token1).toHaveLength(64);
    expect(token2).toHaveLength(64);
    expect(token1).not.toBe(token2);
  });
});
