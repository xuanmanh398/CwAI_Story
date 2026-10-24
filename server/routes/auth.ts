import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { generateSalt, hashPassword, verifyPassword, generateSecureToken } from '../crypto';
import {
  checkRateLimit,
  createSession,
  deleteSession,
  setAuthCookie,
  clearAuthCookie,
  SessionUser,
  SESSION_COOKIE_NAME,
} from '../auth';
import { getCookie } from 'hono/cookie';
import { UserRegisterSchema, UserLoginSchema } from '../../shared/types';
import { sendEmail } from '../services/email';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const authRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

/**
 * POST /api/auth/register
 * Đăng ký tài khoản người đọc (reader)
 */
authRoute.post('/register', async (c) => {
  const db = c.env.DB;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';

  // Rate limit đăng ký: tối đa 5 lần mỗi 10 phút từ cùng 1 IP
  const rl = checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return c.json({ success: false, error: 'Bạn đã đăng ký quá nhiều lần. Vui lòng thử lại sau 10 phút.' }, 429);
  }

  const body = await c.req.json().catch(() => ({}));
  const parseResult = UserRegisterSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: parseResult.error.errors[0]?.message || 'Dữ liệu không hợp lệ' }, 400);
  }

  const { username, email, password } = parseResult.data;

  // Kiểm tra trùng username hoặc email
  const existing = await db
    .prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?')
    .bind(username.toLowerCase(), email.toLowerCase())
    .first<{ id: string; username: string; email: string }>();

  if (existing) {
    if (existing.username.toLowerCase() === username.toLowerCase()) {
      return c.json({ success: false, error: 'Tên đăng nhập đã được sử dụng' }, 409);
    }
    return c.json({ success: false, error: 'Email đã được sử dụng' }, 409);
  }

  const userId = createId('usr');
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const now = new Date().toISOString();

  await db
    .prepare(
      'INSERT INTO users (id, username, email, password_hash, salt, role, is_active, is_premium, is_author, email_verified, coins, author_earnings, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, 0, 0, 0, ?, ?)'
    )
    .bind(userId, username, email.toLowerCase(), passwordHash, salt, 'reader', now, now)
    .run();

  // Tạo token & mã OTP 6 số xác thực email (có hiệu lực 15 phút)
  const otpCode = generateOTP();
  const verifyToken = generateSecureToken(32);
  const verifyExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await db
    .prepare('INSERT INTO email_verification_tokens (id, user_id, token, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(createId('evt'), userId, verifyToken, otpCode, verifyExpires, now)
    .run();

  // Gửi email chào mừng kèm mã OTP 6 chữ số
  const origin = new URL(c.req.url).origin;
  const verifyLink = `${origin}/xac-thuc-email?token=${verifyToken}`;
  await sendEmail(c.env, {
    to: email,
    subject: `[Truyện Nhà] Mã OTP xác thực tài khoản: ${otpCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 8px;">Chào mừng ${username}!</h2>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">Mã xác thực OTP gồm 6 chữ số để kích hoạt tài khoản đọc truyện của bạn là:</p>
        <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
          Mã OTP có hiệu lực trong <strong>15 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai khác.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Hoặc bấm vào liên kết xác thực nhanh: <br><a href="${verifyLink}" style="color: #059669;">${verifyLink}</a></p>
      </div>
    `,
  });

  // Tạo phiên đăng nhập tự động
  const userAgent = c.req.header('user-agent');
  const sessionId = await createSession(db, userId, userAgent, ip);
  setAuthCookie(c, sessionId);

  return c.json({
    success: true,
    data: {
      id: userId,
      username,
      email,
      role: 'reader',
      is_premium: 0,
      is_author: 0,
      email_verified: 0,
      coins: 0,
      author_earnings: 0,
    },
    otpCode,   // Trả về OTP code cho môi trường trải nghiệm trực tiếp
    verifyLink,
  });
});

/**
 * POST /api/auth/login
 * Đăng nhập tài khoản
 */
authRoute.post('/login', async (c) => {
  const db = c.env.DB;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';

  // Rate limit đăng nhập: tối đa 7 lần mỗi phút từ cùng 1 IP
  const rl = checkRateLimit(`login:${ip}`, 7, 60 * 1000);
  if (!rl.allowed) {
    return c.json({ success: false, error: 'Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút.' }, 429);
  }

  const body = await c.req.json().catch(() => ({}));
  const parseResult = UserLoginSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json({ success: false, error: 'Vui lòng nhập tài khoản và mật khẩu hợp lệ' }, 400);
  }

  const { usernameOrEmail, password } = parseResult.data;

  // Tìm kiếm theo username hoặc email
  const user = await db
    .prepare(
      'SELECT id, username, email, password_hash, salt, role, is_active, is_premium, is_author, email_verified, coins, author_earnings, locked_until, lock_reason, premium_until, full_name FROM users WHERE username = ? OR email = ?'
    )
    .bind(usernameOrEmail.toLowerCase(), usernameOrEmail.toLowerCase())
    .first<{
      id: string;
      username: string;
      email: string;
      password_hash: string;
      salt: string;
      role: string;
      is_active: number;
      is_premium?: number;
      is_author?: number;
      email_verified?: number;
      coins?: number;
      author_earnings?: number;
      locked_until?: string | null;
      lock_reason?: string | null;
      premium_until?: string | null;
      full_name?: string | null;
    }>();

  if (!user) {
    return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, 401);
  }

  // Xác thực mật khẩu
  const isValid = await verifyPassword(password, user.password_hash, user.salt);
  if (!isValid) {
    return c.json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác' }, 401);
  }

  // Kiểm tra trạng thái khóa tài khoản
  const now = new Date().toISOString();
  if (user.locked_until && user.locked_until > now) {
    if (user.locked_until.startsWith('9999')) {
      return c.json({
        success: false,
        error: `Tài khoản của bạn đã bị KHÓA VĨNH VIỄN. Lý do: ${user.lock_reason || 'Vi phạm điều khoản dịch vụ và chính sách của Truyện Nhà'}.`,
      }, 403);
    } else {
      const lockDate = new Date(user.locked_until).toLocaleDateString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      return c.json({
        success: false,
        error: `Tài khoản đang bị TẠM KHÓA đến ${lockDate}. Lý do: ${user.lock_reason || 'Vi phạm nội quy hệ thống'}.`,
      }, 403);
    }
  }

  if (user.is_active !== 1) {
    return c.json({
      success: false,
      error: `Tài khoản đã bị vô hiệu hóa. Lý do: ${user.lock_reason || 'Vui lòng liên hệ ban quản trị để được hỗ trợ'}.`,
    }, 403);
  }

  // Tự động kiểm tra thời hạn Premium / mở khóa 18+
  const isPremiumValid = (user.is_premium === 1) || (user.premium_until && user.premium_until > now) ? 1 : 0;

  // Tạo phiên đăng nhập
  const userAgent = c.req.header('user-agent');
  const sessionId = await createSession(db, user.id, userAgent, ip);
  setAuthCookie(c, sessionId);

  return c.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_premium: isPremiumValid,
      is_author: user.is_author || 0,
      email_verified: user.email_verified || 0,
      coins: user.coins || 0,
      author_earnings: user.author_earnings || 0,
      full_name: user.full_name || '',
    },
  });
});

/**
 * POST /api/auth/forgot-password
 * Yêu cầu đặt lại mật khẩu qua email
 */
authRoute.post('/forgot-password', async (c) => {
  const db = c.env.DB;
  const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';

  // Rate limit: 3 lần trong 15 phút
  const rl = checkRateLimit(`forgot:${ip}`, 3, 15 * 60 * 1000);
  if (!rl.allowed) {
    return c.json({ success: false, error: 'Bạn đã yêu cầu quá nhiều lần. Vui lòng chờ 15 phút.' }, 429);
  }

  const body = await c.req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    return c.json({ success: false, error: 'Vui lòng cung cấp địa chỉ email hợp lệ' }, 400);
  }

  const user = await db
    .prepare('SELECT id, username, email FROM users WHERE email = ? AND is_active = 1')
    .bind(email)
    .first<{ id: string; username: string; email: string }>();

  // Dù tìm thấy user hay không, trả về thông điệp thành công chung để bảo mật thông tin
  if (!user) {
    return c.json({
      success: true,
      message: 'Nếu địa chỉ email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu đã được gửi đến bạn.',
    });
  }

  // Xóa token cũ của user nếu có
  await db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(user.id).run();

  // Tạo token & mã OTP 6 số (hiệu lực 15 phút)
  const otpCode = generateOTP();
  const token = generateSecureToken(32);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await db
    .prepare('INSERT INTO password_reset_tokens (id, user_id, token, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(createId('prt'), user.id, token, otpCode, expiresAt, now)
    .run();

  const origin = new URL(c.req.url).origin;
  const resetLink = `${origin}/dat-lai-mat-khau?token=${token}`;

  await sendEmail(c.env, {
    to: user.email,
    subject: `[Truyện Nhà] Mã OTP đặt lại mật khẩu: ${otpCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
        <h2 style="color: #059669; text-align: center; margin-bottom: 8px;">Khôi phục Mật khẩu</h2>
        <p style="text-align: center; color: #4b5563; font-size: 14px;">Xin chào <strong>${user.username}</strong>, mã xác thực OTP 6 số của bạn là:</p>
        <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
          Mã này có hiệu lực trong <strong>15 phút</strong>. Bạn có thể nhập mã này trực tiếp trên trang để thiết lập mật khẩu mới.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Hoặc mở liên kết khôi phục trực tiếp: <br><a href="${resetLink}" style="color: #059669;">${resetLink}</a></p>
      </div>
    `,
  });

  return c.json({
    success: true,
    message: 'Mã xác thực OTP đã được gửi đến email của bạn.',
    otpCode, // Trả về cho môi trường dev/test
    resetLink,
  });
});

/**
 * POST /api/auth/reset-password-otp
 * Đặt lại mật khẩu sử dụng mã OTP 6 chữ số
 */
authRoute.post('/reset-password-otp', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim();
  const newPassword = (body.newPassword || '').trim();

  if (!email || !otp) {
    return c.json({ success: false, error: 'Vui lòng cung cấp email và mã OTP' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400);
  }

  const user = await db
    .prepare('SELECT id FROM users WHERE email = ? AND is_active = 1')
    .bind(email)
    .first<{ id: string }>();

  if (!user) {
    return c.json({ success: false, error: 'Không tìm thấy tài khoản với email này' }, 404);
  }

  const now = new Date().toISOString();
  const resetRow = await db
    .prepare('SELECT id FROM password_reset_tokens WHERE user_id = ? AND otp_code = ? AND expires_at > ?')
    .bind(user.id, otp, now)
    .first<{ id: string }>();

  if (!resetRow) {
    return c.json({ success: false, error: 'Mã OTP không chính xác hoặc đã hết hạn (15 phút)' }, 400);
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  await db
    .prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
    .bind(newHash, newSalt, now, user.id)
    .run();

  await db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(user.id).run();
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();

  return c.json({
    success: true,
    message: 'Mật khẩu đã được thay đổi thành công! Vui lòng đăng nhập bằng mật khẩu mới.',
  });
});

/**
 * POST /api/auth/verify-otp
 * Xác thực email kích hoạt tài khoản bằng mã OTP 6 số
 */
authRoute.post('/verify-otp', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();
  const otp = (body.otp || '').trim();

  if (!email || !otp) {
    return c.json({ success: false, error: 'Vui lòng nhập email và mã OTP' }, 400);
  }

  const user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first<{ id: string }>();
  if (!user) {
    return c.json({ success: false, error: 'Không tìm thấy tài khoản' }, 404);
  }

  const now = new Date().toISOString();
  const tokenRow = await db
    .prepare('SELECT id FROM email_verification_tokens WHERE user_id = ? AND otp_code = ? AND expires_at > ?')
    .bind(user.id, otp, now)
    .first<{ id: string }>();

  if (!tokenRow) {
    return c.json({ success: false, error: 'Mã OTP không chính xác hoặc đã hết hạn' }, 400);
  }

  await db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now, user.id).run();
  await db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(user.id).run();

  return c.json({
    success: true,
    message: 'Chúc mừng! Tài khoản và địa chỉ email của bạn đã được kích hoạt thành công.',
  });
});

/**
 * POST /api/auth/resend-otp
 * Gửi lại mã OTP mới về email
 */
authRoute.post('/resend-otp', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const email = (body.email || '').trim().toLowerCase();

  if (!email) {
    return c.json({ success: false, error: 'Thiếu địa chỉ email' }, 400);
  }

  const user = await db.prepare('SELECT id, username FROM users WHERE email = ?').bind(email).first<{ id: string; username: string }>();
  if (!user) {
    return c.json({ success: false, error: 'Không tìm thấy tài khoản' }, 404);
  }

  await db.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').bind(user.id).run();

  const otpCode = generateOTP();
  const token = generateSecureToken(32);
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await db
    .prepare('INSERT INTO email_verification_tokens (id, user_id, token, otp_code, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(createId('evt'), user.id, token, otpCode, expiresAt, now)
    .run();

  await sendEmail(c.env, {
    to: email,
    subject: `[Truyện Nhà] Mã OTP mới xác thực tài khoản: ${otpCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 16px;">
        <h2 style="color: #059669; text-align: center;">Mã OTP mới của bạn</h2>
        <div style="background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #059669;">${otpCode}</span>
        </div>
        <p style="font-size: 13px; color: #6b7280; text-align: center;">Mã này có hiệu lực trong 15 phút.</p>
      </div>
    `,
  });

  return c.json({
    success: true,
    message: 'Đã gửi mã OTP mới về email của bạn!',
    otpCode,
  });
});

/**
 * POST /api/auth/reset-password
 * Thực hiện đổi mật khẩu mới với token
 */
authRoute.post('/reset-password', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const token = (body.token || '').trim();
  const newPassword = (body.newPassword || '').trim();

  if (!token) {
    return c.json({ success: false, error: 'Mã xác thực không hợp lệ hoặc thiếu' }, 400);
  }

  if (newPassword.length < 6) {
    return c.json({ success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }, 400);
  }

  const now = new Date().toISOString();
  const resetRow = await db
    .prepare('SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token = ? AND expires_at > ?')
    .bind(token, now)
    .first<{ id: string; user_id: string; expires_at: string }>();

  if (!resetRow) {
    return c.json({ success: false, error: 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không tồn tại' }, 400);
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  // Cập nhật mật khẩu mới cho user
  await db
    .prepare('UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?')
    .bind(newHash, newSalt, now, resetRow.user_id)
    .run();

  // Xóa token đã sử dụng
  await db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').bind(resetRow.id).run();

  // Xóa tất cả các phiên đăng nhập cũ để buộc đăng nhập lại
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(resetRow.user_id).run();

  return c.json({
    success: true,
    message: 'Mật khẩu của bạn đã được thay đổi thành công. Vui lòng đăng nhập bằng mật khẩu mới.',
  });
});

/**
 * POST /api/auth/verify-email
 * Kích hoạt trạng thái email đã xác thực
 */
authRoute.post('/verify-email', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));
  const token = (body.token || '').trim();

  if (!token) {
    return c.json({ success: false, error: 'Mã xác thực không hợp lệ' }, 400);
  }

  const now = new Date().toISOString();
  const tokenRow = await db
    .prepare('SELECT id, user_id, expires_at FROM email_verification_tokens WHERE token = ? AND expires_at > ?')
    .bind(token, now)
    .first<{ id: string; user_id: string; expires_at: string }>();

  if (!tokenRow) {
    return c.json({ success: false, error: 'Liên kết xác thực không hợp lệ hoặc đã hết hạn' }, 400);
  }

  await db.prepare('UPDATE users SET email_verified = 1, updated_at = ? WHERE id = ?').bind(now, tokenRow.user_id).run();
  await db.prepare('DELETE FROM email_verification_tokens WHERE id = ?').bind(tokenRow.id).run();

  return c.json({
    success: true,
    message: 'Chúc mừng! Địa chỉ email của bạn đã được xác thực thành công.',
  });
});

/**
 * POST /api/auth/logout
 * Đăng xuất tài khoản
 */
authRoute.post('/logout', async (c) => {
  const db = c.env.DB;
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionId) {
    await deleteSession(db, sessionId);
  }
  clearAuthCookie(c);

  return c.json({ success: true, message: 'Đăng xuất thành công' });
});

/**
 * GET /api/auth/me
 * Lấy thông tin tài khoản hiện tại
 */
authRoute.get('/me', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: true, data: null });
  }

  return c.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_premium: user.is_premium || 0,
      is_author: user.is_author || 0,
      email_verified: user.email_verified || 0,
      coins: user.coins || 0,
      author_earnings: user.author_earnings || 0,
    },
  });
});

export default authRoute;
