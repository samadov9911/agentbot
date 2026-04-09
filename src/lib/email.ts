import { Resend } from 'resend';

// ──────────────────────────────────────────────────────────────
// Email service — singleton Resend client
// ──────────────────────────────────────────────────────────────

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY is not set — email sending is disabled');
    return null;
  }
  _resend = new Resend(apiKey);
  return _resend;
}

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

export interface BookingEmailParams {
  /** Client email address */
  to: string;
  /** Client name */
  visitorName: string;
  /** Business / bot name */
  businessName: string;
  /** Service name (optional) */
  service?: string;
  /** Date string e.g. "2025-01-15" */
  date: string;
  /** Time string e.g. "14:00" */
  time: string;
  /** Duration in minutes */
  duration: number;
  /** Appointment ID */
  appointmentId: string;
  /** Language: ru | en | tr */
  language?: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function formatDateRu(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateEn(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDateTr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ──────────────────────────────────────────────────────────────
// HTML email templates
// ──────────────────────────────────────────────────────────────

function buildBookingHtml(params: BookingEmailParams): string {
  const lang = params.language || 'ru';
  const { visitorName, businessName, service, date, time, duration } = params;

  const dateFormatted =
    lang === 'en' ? formatDateEn(date)
    : lang === 'tr' ? formatDateTr(date)
    : formatDateRu(date);

  const texts = {
    ru: {
      title: 'Подтверждение записи',
      hello: `Здравствуйте, ${visitorName}!`,
      confirmed: 'Ваша запись подтверждена.',
      details: 'Детали записи:',
      serviceLabel: 'Услуга',
      dateLabel: 'Дата',
      timeLabel: 'Время',
      durationLabel: 'Длительность',
      idLabel: 'Номер записи',
      noService: 'Не указана',
      minutes: 'минут',
      footer: 'Если вы не создавали эту запись, проигнорируйте это письмо.',
      thanks: 'С уважением,',
    },
    en: {
      title: 'Appointment Confirmation',
      hello: `Hello, ${visitorName}!`,
      confirmed: 'Your appointment has been confirmed.',
      details: 'Appointment details:',
      serviceLabel: 'Service',
      dateLabel: 'Date',
      timeLabel: 'Time',
      durationLabel: 'Duration',
      idLabel: 'Booking ID',
      noService: 'Not specified',
      minutes: 'minutes',
      footer: 'If you did not make this booking, please ignore this email.',
      thanks: 'Best regards,',
    },
    tr: {
      title: 'Randevu Onayı',
      hello: `Merhaba, ${visitorName}!`,
      confirmed: 'Randevunuz onaylandı.',
      details: 'Randevu detayları:',
      serviceLabel: 'Hizmet',
      dateLabel: 'Tarih',
      timeLabel: 'Saat',
      durationLabel: 'Süre',
      idLabel: 'Randevu No',
      noService: 'Belirtilmedi',
      minutes: 'dakika',
      footer: 'Bu randevuyu siz yapmadıysanız, lütfen bu e-postayı yoksayın.',
      thanks: 'Saygılarımızla,',
    },
  };

  const t = texts[lang] || texts.ru;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981,#059669);padding:32px 24px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">&#10003; ${t.title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 8px;font-size:16px;color:#18181b;">${t.hello}</p>
              <p style="margin:0 0 20px;font-size:14px;color:#52525b;">${t.confirmed}</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:8px;overflow:hidden;margin-bottom:20px;">
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">${t.details}</p>
                  </td>
                </tr>
                ${service ? `
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#71717a;">${t.serviceLabel}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#18181b;">${service}</p>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#71717a;">${t.dateLabel}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#18181b;">${dateFormatted}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#71717a;">${t.timeLabel}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#18181b;">${time}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e4e4e7;">
                    <p style="margin:0;font-size:12px;color:#71717a;">${t.durationLabel}</p>
                    <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#18181b;">${duration} ${t.minutes}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;">
                    <p style="margin:0;font-size:12px;color:#71717a;">${t.idLabel}</p>
                    <p style="margin:4px 0 0;font-size:13px;font-family:monospace;color:#71717a;">${params.appointmentId.slice(0, 8)}</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:12px;color:#a1a1aa;">${t.footer}</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#18181b;">${businessName}</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;">${t.thanks} ${businessName}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ──────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────

/**
 * Send a booking confirmation email to the client.
 * Returns true if sent successfully, false otherwise (never throws).
 */
export async function sendBookingConfirmation(params: BookingEmailParams): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log(`[Email] Skipping booking confirmation to ${params.to} — no RESEND_API_KEY`);
    return false;
  }

  const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const lang = params.language || 'ru';

  const subject =
    lang === 'en' ? `Appointment Confirmed — ${params.businessName}`
    : lang === 'tr' ? `Randevu Onayı — ${params.businessName}`
    : `Запись подтверждена — ${params.businessName}`;

  try {
    const { data, error } = await resend.emails.send({
      from: `${params.businessName} <${fromAddress}>`,
      to: [params.to],
      subject,
      html: buildBookingHtml(params),
    });

    if (error) {
      console.error('[Email] Failed to send booking confirmation:', error);
      return false;
    }

    console.log(`[Email] Booking confirmation sent to ${params.to}, emailId=${data?.id}`);
    return true;
  } catch (err) {
    console.error('[Email] Error sending booking confirmation:', err);
    return false;
  }
}
