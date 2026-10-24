/**
 * Service gửi email thông báo, xác thực và đặt lại mật khẩu cho TruyenNha
 * Hỗ trợ Cloudflare Pages / Workers qua Resend API, SMTP / Webhook, hoặc mô phỏng log an toàn
 */

export interface SystemEmailConfig {
  provider: 'resend' | 'smtp';
  resendApiKey: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export const DEFAULT_EMAIL_CONFIG: SystemEmailConfig = {
  provider: 'resend',
  resendApiKey: '',
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPass: '',
  fromEmail: 'noreply@truyennha.id.vn',
  fromName: 'Truyện Nhà',
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  customConfig?: Partial<SystemEmailConfig>;
}

export async function sendEmail(
  env: any,
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; simulated?: boolean; error?: string }> {
  const { to, subject, html, text, customConfig } = options;

  let fromEmail = env?.FROM_EMAIL || 'noreply@truyennha.id.vn';
  let fromName = env?.FROM_NAME || 'Truyện Nhà';
  let resendApiKey = env?.RESEND_API_KEY || '';

  // 1. Kiểm tra cấu hình trong site_settings nếu có DB
  if (customConfig?.resendApiKey) {
    resendApiKey = customConfig.resendApiKey;
    if (customConfig.fromEmail) fromEmail = customConfig.fromEmail;
    if (customConfig.fromName) fromName = customConfig.fromName;
  } else if (env?.DB) {
    try {
      const row = (await env.DB.prepare("SELECT value FROM site_settings WHERE key = 'system_config'").first()) as { value: string } | null;
      if (row?.value) {
        const sys = JSON.parse(row.value);
        if (sys?.email?.resendApiKey) {
          resendApiKey = sys.email.resendApiKey;
        }
        if (sys?.email?.fromEmail) fromEmail = sys.email.fromEmail;
        if (sys?.email?.fromName) fromName = sys.email.fromName;
      }
    } catch {
      // fallback
    }
  }

  // 2. Gửi qua Resend API
  if (resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]+>/g, ''),
        }),
      });

      const data = await res.json() as any;
      if (res.ok) {
        return { success: true, messageId: data.id };
      } else {
        console.error('[EmailService] Resend API Error:', data);
        return { success: false, error: data?.message || `Lỗi Resend HTTP ${res.status}` };
      }
    } catch (err: any) {
      console.error('[EmailService] Gửi email thất bại:', err);
      return { success: false, error: err.message };
    }
  }

  // 3. Fallback Log mô phỏng
  console.log(`[EmailService] [Mô phỏng gửi email tới ${to}]: ${subject}`);
  return { success: true, simulated: true };
}
