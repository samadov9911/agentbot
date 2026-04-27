import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, company, language } = body;

    // Build update data — only include fields that are provided
    const updateData: Record<string, string> = {};
    if (typeof name === 'string') updateData.name = name.trim() || null;
    if (typeof company === 'string') updateData.company = company.trim() || null;
    if (typeof language === 'string' && ['ru', 'en', 'tr'].includes(language)) {
      updateData.language = language;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    // Verify user exists
    const existing = await db.user.findUnique({ where: { id: userId } });
    if (!existing) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user
    const updated = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        language: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/profile — Delete user account.
 * Soft-deletes the user (sets deletedAt), deactivates all their bots,
 * and revokes all embed codes so the bots stop working on websites.
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admins from deleting their own account (use another admin)
    if (user.role === 'admin') {
      return NextResponse.json({ error: 'Admins cannot delete their own account through this endpoint' }, { status: 400 });
    }

    // 1. Soft-delete the user
    await db.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    // 2. Deactivate all bots owned by this user (stops bot-demo-chat from serving them)
    const botsDeactivated = await db.bot.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // 3. Revoke all embed codes (removes embedCode from all bots)
    await db.bot.updateMany({
      where: { userId },
      data: { embedCode: null },
    });

    console.log(`[AccountDelete] User ${userId} (${user.email}) deleted. Bots deactivated: ${botsDeactivated.count}. Embed codes revoked.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Account delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
