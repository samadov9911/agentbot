import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * POST /api/send-emails
 *
 * Sends emails to one or more recipients via Resend.
 *
 * Body:
 *   recipients: string[]  — list of email addresses
 *   subject: string
 *   body: string  — plain text or HTML
 *   html: boolean (default false)  — if true, body is treated as HTML
 *
 * Returns:
 *   { success: true, sent: number, failed: number, errors: string[] }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recipients, subject, body, html: isHtml, fromEmail } = await request.json();

    // Validate
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'recipients array is required' }, { status: 400 });
    }
    if (!subject || !body) {
      return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });
    }

    // Validate email format (basic check)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validRecipients = recipients.filter((e: string) => emailRegex.test(e.trim()));
    const invalidRecipients = recipients.filter((e: string) => !emailRegex.test(e.trim()));

    if (validRecipients.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided' }, { status: 400 });
    }

    // Get Resend API key
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Email sending is not configured. Set RESEND_API_KEY in environment variables.' },
        { status: 503 },
      );
    }

    // Determine sender: user's custom email > env EMAIL_FROM > default
    const customFrom = typeof fromEmail === 'string' && fromEmail.trim() ? fromEmail.trim() : null;
    const envFrom = process.env.EMAIL_FROM || null;
    const fromAddress = customFrom || envFrom || 'onboarding@resend.dev';

    // If user provided a custom from email, persist it to their profile
    if (customFrom) {
      try {
        await db.user.update({ where: { id: userId }, data: { emailFrom: customFrom } });
      } catch { /* ignore */ }
    }

    // Get business name for "from" display name
    let businessName = 'AgentBot';
    try {
      const bot = await db.bot.findFirst({ where: { userId }, select: { name: true } });
      if (bot) businessName = bot.name;
    } catch { /* ignore */ }

    const resend = new Resend(apiKey);

    // Build HTML email with professional template
    const emailHtml = isHtml ? body : buildPlainTextHtml(body, businessName);

    console.log(
      `[SendEmails] userId=${userId.slice(0, 8)} sending to ${validRecipients.length} recipients from=${fromAddress}`,
    );

    // Send to each recipient individually for better error tracking
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send in batches of 10 to avoid rate limits
    for (let i = 0; i < validRecipients.length; i += 10) {
      const batch = validRecipients.slice(i, i + 10);

      const results = await Promise.allSettled(
        batch.map((email: string) =>
          resend.emails.send({
            from: fromAddress,
            to: [email.trim()],
            subject: subject.trim(),
            html: emailHtml,
          }),
        ),
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const recipient = batch[j].trim();

        if (result.status === 'fulfilled') {
          const { data, error } = result.value;
          if (error) {
            failedCount++;
            const errMsg = String((error as Record<string, unknown>)?.message || error);
            errors.push(`${recipient}: ${errMsg}`);
            console.error(`[SendEmails] Failed to send to ${recipient}: ${errMsg}`);
          } else {
            sentCount++;
            console.log(`[SendEmails] ✅ Sent to ${recipient}, emailId=${data?.id}`);
          }
        } else {
          failedCount++;
          errors.push(`${recipient}: ${result.reason}`);
          console.error(`[SendEmails] Exception for ${recipient}:`, result.reason);
        }
      }
    }

    // Add invalid emails to errors
    if (invalidRecipients.length > 0) {
      errors.push(
        `${invalidRecipients.length} invalid email(s) skipped: ${invalidRecipients.join(', ')}`,
      );
    }

    console.log(
      `[SendEmails] Done: sent=${sentCount} failed=${failedCount} errors=${errors.length}`,
    );

    return NextResponse.json({
      success: true,
      sent: sentCount,
      failed: failedCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('POST /api/send-emails error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Wrap plain text body in a clean HTML email template.
 */
function buildPlainTextHtml(textBody: string, businessName: string): string {
  const paragraphs = textBody
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => `<p style="margin:0 0 12px;font-size:15px;color:#18181b;line-height:1.6;">${escapeHtml(line)}</p>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 24px;">
              ${paragraphs}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(businessName)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
