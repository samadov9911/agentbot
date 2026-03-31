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
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || 'noreply@agentbot.vercel.app';
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
            subject: 'Password Reset Code - AgentBot',
            html: `
              <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <div style="background: #059669; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0;">AgentBot</h1>
                </div>
                <div style="border: 1px solid #e5e7eb; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
                  <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Your password reset code is:</p>
                  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin-bottom: 24px;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #059669;">${code}</span>
                  </div>
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">This code expires in 15 minutes. If you did not request this, please ignore this email.</p>
                </div>
              </div>
            `,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
        } else {
          console.error('Resend API error:', await resendRes.text());
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
