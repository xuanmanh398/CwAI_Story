/**
 * Script Bootstrap Quản trị viên an toàn cho TruyenNha
 * Cách dùng:
 *   node ./scripts/bootstrap-admin.mjs [username] [email] [password]
 * Hoặc qua biến môi trường:
 *   ADMIN_USERNAME=admin ADMIN_EMAIL=admin@truyennha.vn ADMIN_PASSWORD=mat_khau_manh node ./scripts/bootstrap-admin.mjs
 */

import { execSync } from 'child_process';
import crypto from 'crypto';

const username = process.argv[2] || process.env.ADMIN_USERNAME || 'admin';
const email = process.argv[3] || process.env.ADMIN_EMAIL || 'admin@truyennha.vn';
const password = process.argv[4] || process.env.ADMIN_PASSWORD;

if (!password || password.length < 8) {
  console.error('\n❌ Lỗi: Mật khẩu admin phải từ 8 ký tự trở lên.');
  console.error('Cú pháp: node ./scripts/bootstrap-admin.mjs <username> <email> <password>\n');
  process.exit(1);
}

// Hàm PBKDF2 Web Crypto tương đương
async function createAdminHash(pass) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(pass, Buffer.from(salt, 'hex'), 100000, 32, 'sha256');
  return {
    salt,
    hash: derivedKey.toString('hex'),
  };
}

async function run() {
  console.log(`\n⚙️ Đang khởi tạo tài khoản quản trị viên: ${username} (${email})...`);
  const { salt, hash } = await createAdminHash(password);
  const userId = `adm_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const sql = `
    INSERT INTO users (id, username, email, password_hash, salt, role, is_active, created_at, updated_at)
    VALUES ('${userId}', '${username.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${hash}', '${salt}', 'admin', 1, '${now}', '${now}')
    ON CONFLICT(username) DO UPDATE SET
      password_hash = excluded.password_hash,
      salt = excluded.salt,
      role = 'admin',
      updated_at = excluded.updated_at;
  `;

  try {
    console.log('📦 Đang áp dụng vào Cloudflare D1 Local...');
    execSync(`npx wrangler d1 execute DB --local --command="${sql.replace(/\n/g, ' ')}"`, {
      stdio: 'inherit',
    });
    console.log(`\n✅ Khởi tạo tài khoản admin thành công!`);
    console.log(`Tài khoản: ${username}`);
    console.log(`Email:     ${email}`);
    console.log(`Vai trò:   admin\n`);
  } catch (err) {
    console.error('\n❌ Không thể ghi vào D1:', err.message);
    process.exit(1);
  }
}

run();
