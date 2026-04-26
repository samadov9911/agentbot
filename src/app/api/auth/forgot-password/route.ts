import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateResetToken } from '@/lib/reset-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user – we always return the same message to avoid email enumeration
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      // Don't reveal whether email exists – return success anyway
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, вам будет отправлено письмо для сброса пароля.',
      });
    }

    // Generate stateless reset token
    const payload = generateResetToken(normalizedEmail);

    // Build reset link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentbot-one.vercel.app';
    const resetLink = `${appUrl}/?reset=true&email=${encodeURIComponent(normalizedEmail)}&token=${payload.token}&expires=${payload.expires}&sig=${payload.sig}`;

    // Send email via Resend REST API
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[forgot-password] RESEND_API_KEY is not set');
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, вам будет отправлено письмо для сброса пароля.',
      });
    }

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'АгентБот <onboarding@resend.dev>',
        to: normalizedEmail,
        subject: 'Сброс пароля — АгентБот',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #059669; margin: 0;">АгентБот</h1>
              <p style="color: #6b7280; font-size: 14px;">Сброс пароля</p>
            </div>
            <p style="color: #374151; font-size: 15px;">
              Здравствуйте! Вы запросили сброс пароля для аккаунта <strong>${normalizedEmail}</strong>.
            </p>
            <p style="color: #374151; font-size: 15px;">
              Нажмите кнопку ниже, чтобы установить новый пароль. Ссылка действительна 1 час.
            </p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}"
                 style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Сбросить пароль
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
              Если вы не запрашивали сброс пароля, проигнорируйте это письмо.
            </p>
            <p style="color: #9ca3af; font-size: 12px;">
              Ссылка: <a href="${resetLink}" style="color: #059669;">${resetLink}</a>
            </p>
          </div>
        `,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error('[forgot-password] Resend API error:', emailRes.status, errText);
    }

    return NextResponse.json({
      message: 'Если аккаунт с таким email существует, вам будет отправлено письмо для сброса пароля.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
