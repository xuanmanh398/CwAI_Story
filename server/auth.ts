import { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DbEnv } from './db';
import { generateSecureToken, sha256Hex } from './crypto';
import { UserRole } from '../shared/types';

export const SESSION_COOKIE_NAME = 'tn_session';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const SESSION_TTL_DAYS = 14;

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: number;
  is_premium?: number;
  is_author?: number;
  email_verified?: number;
  coins?: number;
  author_earnings?: number;
  full_name?: string;
  id_card_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  locked_until?: string | null;
  lock_reason?: string | null;
  premium_until?: string | null;
}

/**
 * In-memory IP rate limiter cho các endpoint nhạy cảm (Login, Register)
 */
interface RateLimitRecord {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, maxAttempts: number = 5, windowMs: number = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }

  if (record.count >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: maxAttempts - record.count };
}

/**
 * Tạo phiên đăng nhập mới trong bảng `sessions`
 */
export async function createSession(
  db: D1Database,
  userId: string,
  userAgent?: string,
  ip?: string
): Promise<string> {
  const sessionId = generateSecureToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const ipHash = ip ? await sha256Hex(ip) : null;

  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, expires_at, created_at, user_agent, ip_hash) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .bind(sessionId, userId, expiresAt, new Date().toISOString(), userAgent || '', ipHash)
    .run();

  return sessionId;
}

/**
 * Lấy thông tin người dùng từ Session ID trong DB
 */
export async function getSessionUser(db: D1Database, sessionId: string): Promise<SessionUser | null> {
  if (!sessionId) return null;

  const now = new Date().toISOString();
  const row = await db
    .prepare(`
      SELECT 
        u.id, u.username, u.email, u.role, u.is_active, u.is_premium, u.is_author, 
        u.email_verified, u.coins, u.author_earnings, u.full_name, u.id_card_number,
        u.bank_name, u.bank_account_number, u.locked_until, u.lock_reason, u.premium_until,
        s.expires_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > ? AND u.is_active = 1
    `)
    .bind(sessionId, now)
    .first<any>();

  if (!row) return null;

  // Kiểm tra nếu tài khoản đang bị khóa thời hạn hoặc vĩnh viễn
  if (row.locked_until && row.locked_until > now) {
    return null;
  }

  // Tự động kiểm tra thời hạn Premium / mở khóa 18+
  const isPremiumValid = (row.is_premium === 1) || (row.premium_until && row.premium_until > now) ? 1 : 0;

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role as UserRole,
    is_active: row.is_active,
    is_premium: isPremiumValid,
    is_author: row.is_author || 0,
    email_verified: row.email_verified || 0,
    coins: row.coins || 0,
    author_earnings: row.author_earnings || 0,
    full_name: row.full_name || '',
    id_card_number: row.id_card_number || '',
    bank_name: row.bank_name || '',
    bank_account_number: row.bank_account_number || '',
    locked_until: row.locked_until,
    lock_reason: row.lock_reason,
    premium_until: row.premium_until,
  };
}

/**
 * Xóa phiên đăng nhập
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  if (!sessionId) return;
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

/**
 * Ghi cookie session an toàn
 */
export function setAuthCookie(c: Context<any>, sessionId: string) {
  const isProd = c.env?.NODE_ENV === 'production';
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    domain: c.env?.COOKIE_DOMAIN || undefined,
  });
}

/**
 * Xóa cookie session
 */
export function clearAuthCookie(c: Context<any>) {
  deleteCookie(c, SESSION_COOKIE_NAME, {
    path: '/',
    domain: c.env?.COOKIE_DOMAIN || undefined,
  });
}

/**
 * Middleware trích xuất user hiện tại (nếu có)
 */
export const userContextMiddleware: MiddlewareHandler<{ Bindings: DbEnv; Variables: { user?: SessionUser } }> = async (
  c,
  next
) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (sessionId && c.env.DB) {
    try {
      const user = await getSessionUser(c.env.DB, sessionId);
      if (user) {
        c.set('user', user);
      }
    } catch {
      // Bỏ qua lỗi session không hợp lệ
    }
  }
  await next();
};

/**
 * Middleware bắt buộc đăng nhập
 */
export const requireAuth: MiddlewareHandler<{ Bindings: DbEnv; Variables: { user?: SessionUser } }> = async (
  c,
  next
) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này' }, 401);
  }
  await next();
};

/**
 * Middleware kiểm tra quyền theo vai trò (Role-based access control)
 */
export function requireRole(...allowedRoles: UserRole[]): MiddlewareHandler<{ Bindings: DbEnv; Variables: { user?: SessionUser } }> {
  return async (c, next) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Yêu cầu xác thực tài khoản' }, 401);
    }
    if (!allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: 'Bạn không có quyền thực hiện chức năng này' }, 403);
    }
    await next();
  };
}
