import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await db.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If this email is registered, a verification code has been sent.',
      });
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing unused codes for this email
    await db.passwordReset.deleteMany({
      where: { email: normalizedEmail, usedAt: null },
    });

    // Save new reset code
    await db.passwordReset.create({
      data: {
        email: normalizedEmail,
        code,
        expiresAt,
      },
    });

    // Try to send email via Resend if API key is configured
    // Always use onboarding@resend.dev (works without domain verification)
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    let emailSent = false;

    if (resendApiKey) {
      try {
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `AgentBot <${fromEmail}>`,
            to: [normalizedEmail],
            subject: 'AgentBot - Password Reset Code',
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 28px; border-radius: 16px 16px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">AgentBot</h1>
                  <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">Password Reset</p>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 36px 28px; border-radius: 0 0 16px 16px; background: white;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 8px;">Hello,</p>
                  <p style="color: #6b7280; font-size: 15px; margin: 0 0 24px;">Your password reset verification code is:</p>
                  <div style="background: #f0fdf4; border: 2px dashed #059669; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: #059669; font-family: 'Courier New', monospace;">${code}</span>
                  </div>
                  <p style="color: #9ca3af; font-size: 13px; margin: 0; text-align: center;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
                </div>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          const errBody = await resendRes.text();
          console.error('Resend API error:', errBody);
        }
      } catch (emailErr) {
        console.error('Failed to send email:', emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      // Return code only when email service is not configured (for demo/testing)
      ...(emailSent ? {} : { code }),
      message: emailSent
        ? 'A verification code has been sent to your email.'
        : 'Verification code generated (email service not configured).',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Request reset error:', msg);
    return NextResponse.json({ error: 'Failed to send reset code' }, { status: 500 });
  }
}
