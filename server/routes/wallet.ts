import { Hono } from 'hono';
import { DbEnv, createId } from '../db';
import { requireAuth, SessionUser } from '../auth';

const walletRoute = new Hono<{ Bindings: DbEnv; Variables: { user?: SessionUser } }>();

// Mọi thao tác ví đều yêu cầu đăng nhập
walletRoute.use('*', requireAuth);

/**
 * GET /api/wallet/balance
 * Lấy số dư xu và doanh thu tác giả
 */
walletRoute.get('/balance', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const row = await db
    .prepare('SELECT coins, author_earnings FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ coins: number; author_earnings: number }>();

  return c.json({
    success: true,
    data: {
      coins: row?.coins || 0,
      author_earnings: row?.author_earnings || 0,
    },
  });
});

/**
 * GET /api/wallet/transactions
 * Lịch sử biến động số dư xu / giao dịch
 */
walletRoute.get('/transactions', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;

  const rows = await db
    .prepare('SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50')
    .bind(user.id)
    .all();

  return c.json({
    success: true,
    data: rows.results || [],
  });
});

// Bảng quy đổi gói nạp chuẩn: Tỉ lệ 1.000 VNĐ = 1 Xu (kèm ưu đãi cố định)
// Không chấp nhận số xu do client tự gửi để chống hack xu 100%
const OFFICIAL_TOPUP_PACKAGES: Record<number, { coins: number; bonus: number }> = {
  20000: { coins: 20, bonus: 0 },
  50000: { coins: 52, bonus: 2 },
  100000: { coins: 110, bonus: 10 },
  200000: { coins: 230, bonus: 30 },
  500000: { coins: 600, bonus: 100 },
};

/**
 * POST /api/wallet/topup
 * Nạp xu vào tài khoản (Độc giả xác nhận đã thanh toán gói nạp)
 */
walletRoute.post('/topup', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));

  const amountVnd = parseInt(body.amountVnd || '0', 10);
  const transferCode = (body.transferCode || '').trim();

  // Xác thực gói nạp hợp lệ theo số tiền VNĐ thực tế
  const pkg = OFFICIAL_TOPUP_PACKAGES[amountVnd];
  if (!pkg) {
    return c.json({ success: false, error: 'Gói nạp không hợp lệ hoặc số tiền không đúng bảng giá hệ thống' }, 400);
  }

  // Số xu được tính toán hoàn toàn ở phía máy chủ (Server-side computed)
  const coins = pkg.coins;

  // Chống spam nạp liên tục (Rate-limiting: 15 giây giữa các lần bấm)
  const lastTx = await db
    .prepare("SELECT created_at FROM wallet_transactions WHERE user_id = ? AND type = 'topup' ORDER BY created_at DESC LIMIT 1")
    .bind(user.id)
    .first<{ created_at: string }>();

  if (lastTx?.created_at) {
    const diffSec = (Date.now() - new Date(lastTx.created_at).getTime()) / 1000;
    if (diffSec < 15) {
      return c.json({ success: false, error: 'Bạn đang thao tác quá nhanh. Vui lòng chờ 15 giây để hệ thống xử lý giao dịch trước.' }, 429);
    }
  }

  const txId = createId('tx');
  const now = new Date().toISOString();

  // Cộng xu trực tiếp vào tài khoản người dùng
  await db
    .prepare('UPDATE users SET coins = coins + ?, updated_at = ? WHERE id = ?')
    .bind(coins, now, user.id)
    .run();

  // Ghi nhật ký giao dịch ví
  await db
    .prepare(
      'INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      txId,
      user.id,
      'topup',
      coins,
      'completed',
      `Nạp ${coins} xu qua VietQR (${amountVnd.toLocaleString('vi-VN')}đ${pkg.bonus > 0 ? ` gồm +${pkg.bonus} xu tặng thêm` : ''}) - Mã: ${transferCode || txId}`,
      now
    )
    .run();

  // Lấy số dư mới
  const updatedUser = await db.prepare('SELECT coins FROM users WHERE id = ?').bind(user.id).first<{ coins: number }>();

  return c.json({
    success: true,
    message: `Nạp thành công ${coins} xu vào tài khoản!`,
    data: {
      new_coins: updatedUser?.coins || 0,
      transaction_id: txId,
    },
  });
});

/**
 * POST /api/wallet/purchase
 * Độc giả dùng xu mua / mở khóa trọn bộ tác phẩm trả phí
 */
walletRoute.post('/purchase', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const body = await c.req.json().catch(() => ({}));
  const bookId = (body.book_id || body.bookId || '').trim();

  if (!bookId) {
    return c.json({ success: false, error: 'Thiếu mã tác phẩm cần mở khóa' }, 400);
  }

  // 1. Kiểm tra tác phẩm
  const book = await db
    .prepare('SELECT id, title, slug, price_coins, created_by_user_id FROM books WHERE id = ? OR slug = ?')
    .bind(bookId, bookId)
    .first<{ id: string; title: string; slug: string; price_coins: number; created_by_user_id: string | null }>();

  if (!book) {
    return c.json({ success: false, error: 'Không tìm thấy tác phẩm này' }, 404);
  }

  if (!book.price_coins || book.price_coins <= 0) {
    return c.json({ success: true, message: 'Tác phẩm này hoàn toàn miễn phí, không cần mở khóa!' });
  }

  // Tác giả tự xem truyện của mình không cần mua
  if (book.created_by_user_id === user.id || user.role === 'admin') {
    return c.json({ success: true, message: 'Bạn là tác giả hoặc quản trị viên của truyện này.' });
  }

  // 2. Kiểm tra đã mua chưa (chống mua trùng lặp)
  const existingPurchase = await db
    .prepare('SELECT id FROM book_purchases WHERE user_id = ? AND book_id = ?')
    .bind(user.id, book.id)
    .first();

  if (existingPurchase) {
    return c.json({ success: true, message: 'Bạn đã mở khóa tác phẩm này rồi!' });
  }

  // 3. Kiểm tra số dư xu của người đọc
  const currentUser = await db.prepare('SELECT coins FROM users WHERE id = ?').bind(user.id).first<{ coins: number }>();
  const currentCoins = currentUser?.coins || 0;

  if (currentCoins < book.price_coins) {
    return c.json(
      {
        success: false,
        requires_topup: true,
        current_coins: currentCoins,
        needed_coins: book.price_coins,
        error: `Số dư không đủ. Bạn đang có ${currentCoins} xu, tác phẩm yêu cầu ${book.price_coins} xu để mở khóa.`,
      },
      400
    );
  }

  const now = new Date().toISOString();
  const pricePaid = book.price_coins;
  // Quy đổi giá trị: 1 xu = 1.000 VND. Tác giả nhận 85%, Nhà phát hành thu 15% phí nền tảng
  const authorEarnedVnd = Math.floor(pricePaid * 1000 * 0.85); // 85% doanh thu
  const platformFeeVnd = pricePaid * 1000 - authorEarnedVnd;   // 15% phí nền tảng

  // 4. Trừ xu người đọc an toàn (Anti-hack race condition atomic check)
  const deductResult = await db
    .prepare('UPDATE users SET coins = coins - ?, updated_at = ? WHERE id = ? AND coins >= ?')
    .bind(pricePaid, now, user.id, pricePaid)
    .run();

  if (!deductResult.success || (deductResult.meta as any)?.changes === 0) {
    return c.json(
      {
        success: false,
        error: 'Số dư xu không đủ hoặc giao dịch bị từ chối.',
      },
      400
    );
  }

  // 5. Chuyển thẳng doanh thu VND về tài khoản tác giả của tác phẩm ngay lập tức
  if (book.created_by_user_id) {
    await db
      .prepare('UPDATE users SET author_earnings = author_earnings + ?, updated_at = ? WHERE id = ?')
      .bind(authorEarnedVnd, now, book.created_by_user_id)
      .run();

    // Ghi nhật ký nhận doanh thu VND cho tác giả
    await db
      .prepare(
        'INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .bind(
        createId('tx'),
        book.created_by_user_id,
        'author_earning',
        authorEarnedVnd,
        'completed',
        `Nhận 85% doanh thu mở khóa tác phẩm "${book.title}" (+${authorEarnedVnd.toLocaleString('vi-VN')} VNĐ)`,
        now
      )
      .run();
  }

  // 6. Ghi nhận giao dịch mở khóa tác phẩm
  const purchaseId = createId('pch');
  await db
    .prepare(
      'INSERT INTO book_purchases (id, user_id, book_id, price_paid, author_earned, platform_fee, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(purchaseId, user.id, book.id, pricePaid, authorEarnedVnd, platformFeeVnd, now)
    .run();

  // Ghi nhật ký chi tiêu của độc giả
  await db
    .prepare(
      'INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    .bind(
      createId('tx'),
      user.id,
      'purchase',
      -pricePaid,
      'completed',
      `Mở khóa toàn bộ tác phẩm "${book.title}" (-${pricePaid} xu)`,
      now
    )
    .run();

  return c.json({
    success: true,
    message: `Chúc mừng bạn đã mở khóa thành công tác phẩm "${book.title}"! Giờ bạn có thể thưởng thức toàn bộ các chương.`,
    data: {
      book_id: book.id,
      book_slug: book.slug,
      price_paid: pricePaid,
      author_earned_vnd: authorEarnedVnd,
      platform_fee_vnd: platformFeeVnd,
    },
  });
});

/**
 * GET /api/wallet/check-purchased/:bookId
 * Kiểm tra xem độc giả đã mua truyện này chưa
 */
walletRoute.get('/check-purchased/:bookId', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const bookId = c.req.param('bookId');

  const book = await db
    .prepare('SELECT id, created_by_user_id, price_coins, free_chapters_count FROM books WHERE id = ? OR slug = ?')
    .bind(bookId, bookId)
    .first<{ id: string; created_by_user_id: string | null; price_coins: number; free_chapters_count: number }>();

  if (!book) {
    return c.json({ success: false, is_purchased: false });
  }

  // Miễn phí hoặc là tác giả / admin
  if (book.price_coins <= 0 || book.created_by_user_id === user.id || user.role === 'admin') {
    return c.json({ success: true, is_purchased: true, price_coins: book.price_coins });
  }

  const purchase = await db
    .prepare('SELECT id FROM book_purchases WHERE user_id = ? AND book_id = ?')
    .bind(user.id, book.id)
    .first();

  return c.json({
    success: true,
    is_purchased: !!purchase,
    price_coins: book.price_coins,
    free_chapters_count: book.free_chapters_count || 5,
  });
});

/**
 * POST /api/wallet/unlock-18plus
 * Mở khóa danh mục 18+ & Thành viên VIP Premium (50.000 VNĐ / 50 Xu mỗi tháng)
 */
walletRoute.post('/unlock-18plus', async (c) => {
  const db = c.env.DB;
  const user = c.get('user')!;
  const FEE_COINS = 50; // 50 Xu = 50.000 VNĐ

  const userRow = await db
    .prepare('SELECT coins, premium_until FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ coins: number; premium_until?: string | null }>();

  const currentCoins = userRow?.coins || 0;
  if (currentCoins < FEE_COINS) {
    return c.json({
      success: false,
      requires_coins: true,
      current_coins: currentCoins,
      required_coins: FEE_COINS,
      error: `Số dư trong ví không đủ. Cần 50 Xu (50.000 VNĐ/tháng) để mở khóa danh mục 18+. Hiện tại bạn có ${currentCoins} Xu.`,
    }, 402);
  }

  const now = new Date();
  let baseDate = now;
  if (userRow?.premium_until) {
    const existingDate = new Date(userRow.premium_until);
    if (existingDate > now) {
      baseDate = existingDate;
    }
  }

  // Cộng thêm 30 ngày
  const newExpiresDate = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const newExpiresIso = newExpiresDate.toISOString();
  const nowIso = now.toISOString();

  // 1. Trừ 50 Xu & Cập nhật premium_until
  await db
    .prepare(`
      UPDATE users 
      SET 
        coins = coins - ?, 
        is_premium = 1, 
        premium_until = ?, 
        updated_at = ? 
      WHERE id = ?
    `)
    .bind(FEE_COINS, newExpiresIso, nowIso, user.id)
    .run();

  // 2. Ghi nhật ký giao dịch
  await db
    .prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at)
      VALUES (?, ?, 'subscription_18plus', ?, 'completed', ?, ?)
    `)
    .bind(
      createId('tx'),
      user.id,
      -FEE_COINS,
      `Gói mở khóa danh mục 18+ & Thành viên VIP (30 ngày)`,
      nowIso
    )
    .run();

  const formattedDate = newExpiresDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return c.json({
    success: true,
    message: `Chúc mừng bạn đã mở khóa thành công Danh mục 18+ và kích hoạt gói VIP đến ngày ${formattedDate}!`,
    data: {
      coins_deducted: FEE_COINS,
      remaining_coins: currentCoins - FEE_COINS,
      premium_until: newExpiresIso,
      formatted_date: formattedDate,
    },
  });
});

/**
 * POST /api/wallet/webhook
 * Webhook nhận biến động số dư ngân hàng (SePay / Casso / VietQR / PayOS) tự động cộng xu
 */
walletRoute.post('/webhook', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json().catch(() => ({}));

  // Hỗ trợ cả định dạng SePay, Casso hoặc custom webhook
  const content = (body.content || body.description || body.remark || '').toUpperCase();
  const amount = Number(body.amount || body.transferAmount || 0);

  if (amount <= 0 || !content) {
    return c.json({ success: false, error: 'Dữ liệu giao dịch không hợp lệ' }, 400);
  }

  // Cú pháp nạp: NAP <username_hoặc_id> hoặc TN <username_hoặc_id>
  const match = content.match(/(?:NAP|TN)\s*([A-Za-z0-9_-]+)/i);
  if (!match) {
    return c.json({ success: false, error: 'Không nhận diện được mã nạp hợp lệ trong nội dung' }, 400);
  }

  const userIdentifier = match[1];
  const user = await db
    .prepare('SELECT id, username, coins FROM users WHERE id = ? OR username = ?')
    .bind(userIdentifier, userIdentifier)
    .first<{ id: string; username: string; coins: number }>();

  if (!user) {
    return c.json({ success: false, error: `Không tìm thấy tài khoản với mã "${userIdentifier}"` }, 404);
  }

  // Tỷ lệ quy đổi: 1.000 VNĐ = 1 Xu
  const coinsToAdd = Math.floor(amount / 1000);
  if (coinsToAdd <= 0) {
    return c.json({ success: false, error: 'Số tiền nạp chưa đạt mức quy đổi tối thiểu (1.000đ = 1 xu)' }, 400);
  }

  const now = new Date().toISOString();
  const txId = createId('tx');

  // Kiểm tra trùng lặp mã giao dịch ngân hàng nếu có
  const refCode = body.referenceCode || body.transactionId || body.id || txId;
  const duplicate = await db
    .prepare('SELECT 1 FROM wallet_transactions WHERE description LIKE ?')
    .bind(`%ref:${refCode}%`)
    .first();

  if (duplicate) {
    return c.json({ success: true, message: 'Giao dịch đã được ghi nhận trước đó' });
  }

  // 1. Cộng xu cho người dùng
  await db
    .prepare('UPDATE users SET coins = coins + ?, updated_at = ? WHERE id = ?')
    .bind(coinsToAdd, now, user.id)
    .run();

  // 2. Ghi nhật ký ví
  await db
    .prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, status, description, created_at)
      VALUES (?, ?, 'deposit', ?, 'completed', ?, ?)
    `)
    .bind(
      txId,
      user.id,
      coinsToAdd,
      `Tự động nạp qua chuyển khoản ngân hàng: +${coinsToAdd} xu (Số tiền: ${amount.toLocaleString('vi-VN')}đ) [ref:${refCode}]`,
      now
    )
    .run();

  // 3. Tạo thông báo cho người dùng
  const notifId = createId('notif');
  await db
    .prepare(`
      INSERT INTO notifications (id, user_id, title, content, link, type, is_read, created_at)
      VALUES (?, ?, 'Nạp xu thành công!', ?, '/nap-xu', 'payment', 0, ?)
    `)
    .bind(
      notifId,
      user.id,
      `Tài khoản của bạn vừa được cộng +${coinsToAdd.toLocaleString('vi-VN')} xu từ giao dịch ngân hàng thành công.`,
      now
    )
    .run();

  return c.json({
    success: true,
    message: `Đã nạp thành công ${coinsToAdd} xu cho tài khoản ${user.username}`,
    data: {
      user_id: user.id,
      username: user.username,
      coins_added: coinsToAdd,
      new_balance: (user.coins || 0) + coinsToAdd,
    },
  });
});

export default walletRoute;
