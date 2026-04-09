import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyResetToken, type ResetTokenPayload } from '@/lib/reset-token';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, expires, sig, newPassword } = body;

    // Validate required fields
    if (!email || !token || !expires || !sig || !newPassword) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 },
      );
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 8 символов' },
        { status: 400 },
      );
    }

    // Verify the token
    const payload: ResetTokenPayload = {
      email: String(email).toLowerCase(),
      token: String(token),
      expires: Number(expires),
      sig: String(sig),
    };

    const isValid = verifyResetToken(payload);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Ссылка недействительна или истекла. Запросите новую.' },
        { status: 400 },
      );
    }

    // Find user
    const user = await db.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 },
      );
    }

    // Update password
    const passwordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      message: 'Пароль успешно изменён! Теперь вы можете войти с новым паролем.',
    });
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
