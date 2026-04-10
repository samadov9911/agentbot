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
 * GET /api/reports
 *
 * Returns real report data for the last 7 days:
 * - dailyData: per-day breakdown of emails, calls, appointments, leads, conversations
 * - totals: aggregated totals for the week
 * - performance: AI performance metrics computed from real data
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Step 1: Get user's bot IDs ──
    const userBots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    const botIds = userBots.map((b) => b.id);

    if (botIds.length === 0) {
      // No bots — return empty data
      const dailyData = buildEmptyDays();
      return NextResponse.json(
        {
          dailyData,
          totals: { emails: 0, calls: 0, appointments: 0, leads: 0, conversations: 0 },
          performance: { tasksCompleted: 0, satisfaction: 0, avgResponseSeconds: null },
        },
        { headers: CACHE_HEADERS },
      );
    }

    // ── Step 2: Calculate day boundaries for last 7 days ──
    const days: Array<{ start: Date; end: Date; dateStr: string; label: string }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dateStr = dayStart.toISOString().split('T')[0]; // YYYY-MM-DD
      const label = dayStart.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
      days.push({ start: dayStart, end: dayEnd, dateStr, label });
    }

    const rangeStart = days[0].start;
    const rangeEnd = days[days.length - 1].end;

    // ── Step 3: Fetch all records for the 7-day range in parallel ──
    const [
      leads,
      callLogs,
      appointments,
      conversations,
    ] = await Promise.all([
      // Leads (including status for emails count — contacted leads = email outreach)
      db.lead.findMany({
        where: { botId: { in: botIds }, createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { id: true, status: true, createdAt: true },
      }),
      // Call logs for calls count
      db.callLog.findMany({
        where: { userId, createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { id: true, createdAt: true },
      }),
      // Appointments
      db.appointment.findMany({
        where: { botId: { in: botIds }, createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { id: true, status: true, createdAt: true },
      }),
      // Conversations
      db.conversation.findMany({
        where: { botId: { in: botIds }, createdAt: { gte: rangeStart, lte: rangeEnd } },
        select: { id: true, isFlagged: true, createdAt: true },
      }),
    ]);

    // ── Step 4: Also get lifetime data for performance metrics ──
    const [lifetimeAppointments, lifetimeConversations] = await Promise.all([
      db.appointment.findMany({
        where: { botId: { in: botIds } },
        select: { status: true },
      }),
      db.conversation.findMany({
        where: { botId: { in: botIds } },
        select: { id: true, isFlagged: true },
      }),
    ]);

    // ── Step 5: Compute average response time ──
    let avgResponseSeconds: number | null = null;
    try {
      // Get conversation IDs from the last 7 days
      const convIds7d = conversations.map((c) => c.id);
      if (convIds7d.length > 0) {
        const messages = await db.message.findMany({
          where: { conversationId: { in: convIds7d } },
          select: { role: true, createdAt: true, conversationId: true },
          orderBy: { createdAt: 'asc' },
        });

        // Group by conversation and compute avg time between user message and next bot reply
        const messagesByConv = new Map<string, Array<{ role: string; createdAt: Date }>>();
        for (const msg of messages) {
          const list = messagesByConv.get(msg.conversationId) || [];
          list.push({ role: msg.role, createdAt: msg.createdAt });
          messagesByConv.set(msg.conversationId, list);
        }

        const responseTimes: number[] = [];
        for (const [, msgs] of messagesByConv) {
          for (let i = 0; i < msgs.length - 1; i++) {
            if (msgs[i].role === 'user' && msgs[i + 1].role === 'bot') {
              const diff = msgs[i + 1].createdAt.getTime() - msgs[i].createdAt.getTime();
              if (diff > 0 && diff < 600000) {
                // Only count responses under 10 minutes (ignore long gaps)
                responseTimes.push(diff / 1000);
              }
            }
          }
        }

        if (responseTimes.length > 0) {
          avgResponseSeconds = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
        }
      }
    } catch (err) {
      console.error('[Reports] Error computing response time:', err);
    }

    // ── Step 6: Bucket data into daily rows ──
    const dailyData = days.map((day) => {
      const dayLeads = leads.filter((l) => {
        const t = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
        return t >= day.start && t <= day.end;
      });

      const dayCalls = callLogs.filter((c) => {
        const t = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return t >= day.start && t <= day.end;
      });

      const dayAppointments = appointments.filter((a) => {
        const t = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        return t >= day.start && t <= day.end;
      });

      const dayConversations = conversations.filter((c) => {
        const t = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
        return t >= day.start && t <= day.end;
      });

      return {
        date: day.dateStr,
        label: day.label,
        emails: dayLeads.filter((l) => l.status === 'contacted').length,
        calls: dayCalls.length,
        appointments: dayAppointments.length,
        leads: dayLeads.length,
        conversations: dayConversations.length,
      };
    });

    // ── Step 7: Compute totals ──
    const totals = dailyData.reduce(
      (acc, r) => ({
        emails: acc.emails + r.emails,
        calls: acc.calls + r.calls,
        appointments: acc.appointments + r.appointments,
        leads: acc.leads + r.leads,
        conversations: acc.conversations + r.conversations,
      }),
      { emails: 0, calls: 0, appointments: 0, leads: 0, conversations: 0 },
    );

    // ── Step 8: Compute AI performance metrics ──
    // Tasks completed = confirmed appointments / total appointments
    const totalApts = lifetimeAppointments.length;
    const confirmedApts = lifetimeAppointments.filter((a) => a.status === 'confirmed').length;
    const tasksCompleted = totalApts > 0 ? Math.round((confirmedApts / totalApts) * 100) : 0;

    // Satisfaction = non-flagged conversations / total conversations
    const totalConvs = lifetimeConversations.length;
    const nonFlagged = lifetimeConversations.filter((c) => !c.isFlagged).length;
    const satisfaction = totalConvs > 0 ? Math.round((nonFlagged / totalConvs) * 100) : 0;

    const performance = {
      tasksCompleted,
      satisfaction,
      avgResponseSeconds,
    };

    console.log(
      `[Reports] userId=${userId.slice(0, 8)} days=7 totals=${JSON.stringify(totals)} perf=${JSON.stringify(performance)}`,
    );

    return NextResponse.json(
      { dailyData, totals, performance },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('GET /api/reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildEmptyDays() {
  const days: Array<{ date: string; label: string; emails: number; calls: number; appointments: number; leads: number; conversations: number }> = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dateStr = dayStart.toISOString().split('T')[0];
    const label = dayStart.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
    days.push({ date: dateStr, label, emails: 0, calls: 0, appointments: 0, leads: 0, conversations: 0 });
  }
  return days;
}
