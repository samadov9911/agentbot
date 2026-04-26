import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'overview';

    if (section === 'users') {
      const users = await db.user.findMany({
        where: { deletedAt: null },
        include: {
          _count: { select: { Bot: true, Subscription: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({
        users: users.map(u => ({
          id: u.id,
          email: u.email,
          name: u.name,
          company: u.company,
          role: u.role,
          isActive: u.isActive,
          botsCount: (u._count as Record<string, number>).Bot || 0,
          createdAt: u.createdAt.toISOString(),
        })),
      });
    }

    if (section === 'analytics') {
      const [totalUsers, activeUsers, activeSubscriptions, totalBots, totalConversations, totalAppointments, paidSubscriptions] = await Promise.all([
        db.user.count({ where: { deletedAt: null } }).catch(() => 0),
        db.user.count({ where: { deletedAt: null, isActive: true } }).catch(() => 0),
        db.subscription.count({ where: { status: 'active', plan: { not: 'demo' } } }).catch(() => 0),
        db.bot.count({ where: { deletedAt: null } }).catch(() => 0),
        db.conversation.count().catch(() => 0),
        db.appointment.count().catch(() => 0),
        db.subscription.findMany({ where: { status: 'active', plan: { not: 'demo' } } }).catch(() => []),
      ]);

      const mrr = paidSubscriptions.reduce((sum, s) => {
        if (s.plan === 'monthly') return sum + (s.pricePaid || 0);
        if (s.plan === 'quarterly') return sum + ((s.pricePaid || 0) / 3);
        if (s.plan === 'yearly') return sum + ((s.pricePaid || 0) / 12);
        return sum;
      }, 0);

      return NextResponse.json({
        totalUsers,
        activeUsers,
        activeSubscriptions,
        totalBots,
        totalConversations,
        totalAppointments,
        mrr: Math.round(mrr),
        arr: Math.round(mrr * 12),
      });
    }

    if (section === 'logs') {
      const logs = await db.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { Admin: { select: { email: true } } },
      });
      return NextResponse.json({
        logs: logs.map(l => ({
          id: l.id,
          adminEmail: (l as Record<string, unknown>).Admin?.email || '',
          action: l.action,
          details: l.details,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt.toISOString(),
        })),
      });
    }

    if (section === 'embed') {
      // Fetch bots that have an embedCode set — use Bot table directly
      const botsWithCodes = await db.bot.findMany({
        where: {
          deletedAt: null,
          embedCode: { not: null },
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          name: true,
          type: true,
          niche: true,
          embedCode: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          User: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return NextResponse.json({
        embedCodes: botsWithCodes.map(bot => ({
          id: bot.id,
          code: bot.embedCode,
          botId: bot.id,
          isActive: bot.isActive,
          createdBy: bot.User?.name || bot.User?.email || null,
          revokedAt: null,
          createdAt: bot.createdAt.toISOString(),
          updatedAt: bot.updatedAt.toISOString(),
          bot: {
            id: bot.id,
            name: bot.name,
            type: bot.type,
            niche: bot.niche,
            isActive: bot.isActive,
            ownerName: bot.User?.name || bot.User?.email || '—',
            ownerEmail: bot.User?.email || '',
          },
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
  } catch (error) {
    console.error('Admin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, targetUserId, details, embedCodeId } = await request.json();

    // Log admin action
    await db.adminLog.create({
      data: {
        adminId: userId,
        action,
        details: JSON.stringify(details || {}),
      },
    });

    if (action === 'block_user' && targetUserId) {
      await db.user.update({ where: { id: targetUserId }, data: { isActive: false } });
      return NextResponse.json({ success: true, message: 'User blocked' });
    }

    if (action === 'unblock_user' && targetUserId) {
      await db.user.update({ where: { id: targetUserId }, data: { isActive: true } });
      return NextResponse.json({ success: true, message: 'User unblocked' });
    }

    // All embed code actions use botId (embedCodeId is actually bot.id)
    if (action === 'revoke_embed_code' && embedCodeId) {
      const bot = await db.bot.findUnique({
        where: { id: embedCodeId },
        select: { id: true, name: true, embedCode: true },
      });
      if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      }
      await db.bot.update({
        where: { id: embedCodeId },
        data: { embedCode: null },
      });
      return NextResponse.json({ success: true, message: 'Embed code revoked', data: { code: bot.embedCode } });
    }

    if (action === 'regenerate_embed_code' && embedCodeId) {
      const bot = await db.bot.findUnique({
        where: { id: embedCodeId },
        select: { id: true, name: true },
      });
      if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      }
      const newCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
      await db.bot.update({
        where: { id: embedCodeId },
        data: { embedCode: newCode },
      });
      return NextResponse.json({ success: true, message: 'Embed code regenerated', data: { code: newCode } });
    }

    if (action === 'activate_embed_code' && embedCodeId) {
      // Generate a new embed code for a bot that doesn't have one
      const bot = await db.bot.findUnique({
        where: { id: embedCodeId },
        select: { id: true, name: true, embedCode: true },
      });
      if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      }
      if (bot.embedCode) {
        return NextResponse.json({ success: true, message: 'Embed code already active', data: { code: bot.embedCode } });
      }
      const newCode = crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase();
      await db.bot.update({
        where: { id: embedCodeId },
        data: { embedCode: newCode },
      });
      return NextResponse.json({ success: true, message: 'Embed code activated', data: { code: newCode } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
