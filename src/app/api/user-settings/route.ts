import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * GET /api/user-settings
 *
 * Returns the current user's email settings (emailFrom, company, botName).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, company: true, emailFrom: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Also get the first bot name for display purposes
    let botName: string | null = null;
    try {
      const bot = await db.bot.findFirst({
        where: { userId },
        select: { name: true },
      });
      botName = bot?.name ?? null;
    } catch { /* ignore */ }

    return NextResponse.json(
      {
        email: user.email,
        name: user.name,
        company: user.company,
        emailFrom: user.emailFrom,
        botName,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('GET /api/user-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/user-settings
 *
 * Updates the user's emailFrom setting.
 *
 * Body:
 *   emailFrom: string (optional) — the sender email address
 *
 * Returns:
 *   { success: true, emailFrom: string | null }
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { emailFrom } = body;

    if (emailFrom !== undefined && emailFrom !== null && emailFrom !== '') {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailFrom.trim())) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...(emailFrom !== undefined
          ? { emailFrom: emailFrom === null || emailFrom === '' ? null : emailFrom.trim() }
          : {}),
      },
      select: { emailFrom: true },
    });

    console.log(`[UserSettings] Updated emailFrom for userId=${userId.slice(0, 8)}: ${updatedUser.emailFrom ?? '(default)'}`);

    return NextResponse.json({
      success: true,
      emailFrom: updatedUser.emailFrom,
    });
  } catch (error) {
    console.error('PATCH /api/user-settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
