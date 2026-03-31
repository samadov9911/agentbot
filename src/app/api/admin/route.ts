import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
          _count: { select: { bots: true, subscriptions: true } },
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
          botsCount: u._count.bots,
          createdAt: u.createdAt.toISOString(),
        })),
      });
    }

    if (section === 'analytics') {
      const totalUsers = await db.user.count({ where: { deletedAt: null } });
      const activeUsers = await db.user.count({ where: { deletedAt: null, isActive: true } });
      const activeSubscriptions = await db.subscription.count({ where: { status: 'active', plan: { not: 'demo' } } });
      const totalBots = await db.bot.count({ where: { deletedAt: null } });
      const totalConversations = await db.conversation.count();
      const totalAppointments = await db.appointment.count();

      // MRR calculation
      const paidSubscriptions = await db.subscription.findMany({
        where: { status: 'active', plan: { not: 'demo' } },
      });
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
        include: { admin: { select: { email: true } } },
      });
      return NextResponse.json({
        logs: logs.map(l => ({
          id: l.id,
          adminEmail: l.admin.email,
          action: l.action,
          details: l.details,
          ipAddress: l.ipAddress,
          createdAt: l.createdAt.toISOString(),
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

    const { action, targetUserId, details } = await request.json();

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
