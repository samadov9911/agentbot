import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    const range = searchParams.get('range') || 'month';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get user's bots
    const botFilter: Record<string, unknown> = { userId, deletedAt: null };
    if (botId) botFilter.id = botId;
    const bots = await db.bot.findMany({ where: botFilter });
    const botIds = bots.map(b => b.id);

    // Get conversation counts
    const conversations = await db.conversation.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: startDate } },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    // Get appointments
    const appointments = await db.appointment.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: startDate } },
    });

    // Get analytics events
    const events = await db.analyticsEvent.findMany({
      where: { userId, createdAt: { gte: startDate } },
    });

    // Build daily stats
    const dailyMap = new Map<string, { date: string; visitors: number; conversations: number; appointments: number }>();
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = 0; i <= 30; i++) {
      const d = new Date(startDate.getTime() + i * dayMs);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { date: key, visitors: 0, conversations: 0, appointments: 0 });
    }

    events.forEach(e => {
      const key = e.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        if (e.eventType === 'page_view' || e.eventType === 'widget_opened') entry.visitors++;
      }
    });

    conversations.forEach(c => {
      const key = c.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) entry.conversations++;
    });

    appointments.forEach(a => {
      const key = a.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) entry.appointments++;
    });

    // Calculate sources
    const sourceMap = new Map<string, number>();
    conversations.forEach(c => {
      sourceMap.set(c.source, (sourceMap.get(c.source) || 0) + 1);
    });

    const totalVisitors = events.filter(e => e.eventType === 'widget_opened').length;
    const totalConversations = conversations.length;
    const totalAppointments = appointments.length;
    const conversionRate = totalVisitors > 0 ? Math.round((totalAppointments / totalVisitors) * 100) : 0;

    return NextResponse.json({
      totalVisitors,
      totalConversations,
      totalAppointments,
      conversionRate,
      dailyStats: Array.from(dailyMap.values()),
      topQuestions: [],
      topServices: [],
      sources: Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
