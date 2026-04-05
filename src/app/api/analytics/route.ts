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
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
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
      include: { Message: { orderBy: { createdAt: 'asc' } } },
    });

    // Get appointments
    const appointments = await db.appointment.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: startDate } },
    });

    // Get analytics events
    const events = await db.analyticsEvent.findMany({
      where: { userId, createdAt: { gte: startDate } },
    });

    // BUGFIX: Get leads for statistics
    const leads = await db.lead.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: startDate } },
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

    // BUGFIX: Count leads in daily stats
    leads.forEach(l => {
      const key = l.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        // Count leads as visitors too if they have contact info
        if (l.visitorName || l.visitorPhone || l.visitorEmail) {
          entry.visitors++;
        }
      }
    });

    // BUGFIX: Add leads to source map
    leads.forEach(l => {
      const source = l.source || 'widget';
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
    });

    const totalVisitors = events.filter(e => e.eventType === 'widget_opened').length + leads.filter(l => l.visitorName || l.visitorPhone || l.visitorEmail).length;
    const totalConversations = conversations.length;
    const totalAppointments = appointments.length;
    // BUGFIX: Include leads with contact info as conversions
    const contactedLeads = leads.filter(l => l.status === 'contacted' || l.visitorPhone || l.visitorEmail).length;
    const conversionRate = totalVisitors > 0 ? Math.round(((totalAppointments + contactedLeads) / totalVisitors) * 100) : 0;

    // BUGFIX: Build top services from leads messages
    const serviceKeywords = leads
      .filter(l => l.message)
      .map(l => l.message as string);
    
    const topServices: Array<{ service: string; count: number }> = [];
    serviceKeywords.forEach(msg => {
      // Simple keyword extraction - could be enhanced
      const keywords = msg.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      keywords.forEach(kw => {
        const existing = topServices.find(s => s.service.toLowerCase() === kw);
        if (existing) {
          existing.count++;
        } else if (topServices.length < 10) {
          topServices.push({ service: kw, count: 1 });
        }
      });
    });
    topServices.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      totalVisitors,
      totalConversations,
      totalAppointments,
      totalLeads: leads.length, // BUGFIX: Add total leads count
      contactedLeads, // BUGFIX: Add contacted leads count
      conversionRate,
      dailyStats: Array.from(dailyMap.values()),
      topQuestions: [],
      topServices: topServices.slice(0, 5),
      sources: Array.from(sourceMap.entries()).map(([source, count]) => ({ source, count })),
      // BUGFIX: Return real conversations for the list
      conversations: conversations.slice(0, 50).map(c => ({
        id: c.id,
        date: c.createdAt.toISOString(),
        source: c.source,
        visitorName: c.visitorName || null,
        status: c.status,
        messagesCount: c.Message?.length || 0,
        lastMessage: c.Message?.length > 0 ? c.Message[c.Message.length - 1].content : null,
      })),
      // BUGFIX: Return real appointments for the list
      appointments: appointments.slice(0, 50).map(a => ({
        id: a.id,
        visitorName: a.visitorName,
        visitorPhone: a.visitorPhone,
        visitorEmail: a.visitorEmail,
        service: a.service,
        date: a.date.toISOString(),
        duration: a.duration,
        status: a.status,
        createdAt: a.createdAt.toISOString(),
      })),
      // BUGFIX: Return leads for CSV export
      leads: leads.map(l => ({
        id: l.id,
        visitorName: l.visitorName,
        visitorPhone: l.visitorPhone,
        visitorEmail: l.visitorEmail,
        message: l.message,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
