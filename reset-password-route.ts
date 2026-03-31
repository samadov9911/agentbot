import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and new password are required' }, { status: 400 });
    }

    if (code.length !== 6) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find valid reset code
    const resetRecord = await db.passwordReset.findFirst({
      where: {
        email: normalizedEmail,
        code,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired verification code' }, { status: 400 });
    }

    // Mark code as used
    await db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    });

    // Update user password
    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { email: normalizedEmail },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Reset password error:', msg);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
