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
 * GET /api/agent-stats
 *
 * Returns real-time AI agent statistics for the authenticated user.
 * All counts are computed from the database — no mock data.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all bot IDs for this user
    const userBots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    const botIds = userBots.map(b => b.id);

    // Empty response when no bots exist yet
    if (botIds.length === 0) {
      return NextResponse.json(
        {
          tasksToday: 0,
          totalMessages: 0,
          confirmedBookings: 0,
          lastActivity: null,
          emailsSent: 0,
          callsMade: 0,
          newLeads: 0,
          conversationsProcessed: 0,
        },
        { headers: CACHE_HEADERS },
      );
    }

    // ── Time boundaries ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Start of last week (7 days ago)
    const lastWeekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    lastWeekStart.setHours(0, 0, 0, 0);

    // ── Parallel queries for maximum performance ──
    const [
      tasksToday,
      totalMessages,
      confirmedBookings,
      lastMessage,
      lastAppointment,
      lastLead,
      emailsSent,
      callsMade,
      newLeads,
      conversationsProcessed,
    ] = await Promise.all([
      // 1. Tasks today = user messages from today (each triggers AI processing)
      db.message.count({
        where: {
          conversation: { botId: { in: botIds } },
          role: 'user',
          createdAt: { gte: todayStart },
        },
      }),

      // 2. Total messages (all roles)
      db.message.count({
        where: {
          conversation: { botId: { in: botIds } },
        },
      }),

      // 3. Confirmed bookings (all time)
      db.appointment.count({
        where: {
          botId: { in: botIds },
          status: 'confirmed',
        },
      }),

      // 4. Latest message timestamp
      db.message.findFirst({
        where: { conversation: { botId: { in: botIds } } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 5. Latest appointment timestamp
      db.appointment.findFirst({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 6. Latest lead timestamp
      db.lead.findFirst({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 7. Emails sent = leads that were contacted (AI reached out via email)
      db.lead.count({
        where: {
          botId: { in: botIds },
          status: 'contacted',
        },
      }),

      // 8. Calls made (from CallLog)
      db.callLog.count({
        where: { userId },
      }),

      // 9. New leads this week
      db.lead.count({
        where: {
          botId: { in: botIds },
          createdAt: { gte: lastWeekStart },
        },
      }),

      // 10. Conversations processed (all time)
      db.conversation.count({
        where: { botId: { in: botIds } },
      }),
    ]);

    // ── Last activity: most recent timestamp across messages, appointments, leads ──
    let lastActivity: string | null = null;
    const timestamps = [
      lastMessage?.createdAt ? new Date(lastMessage.createdAt).getTime() : 0,
      lastAppointment?.createdAt ? new Date(lastAppointment.createdAt).getTime() : 0,
      lastLead?.createdAt ? new Date(lastLead.createdAt).getTime() : 0,
    ];
    const maxTs = Math.max(...timestamps);
    if (maxTs > 0) {
      lastActivity = new Date(maxTs).toISOString();
    }

    console.log(
      `[AgentStats] userId=${userId.slice(0, 8)} tasksToday=${tasksToday} totalMessages=${totalMessages} confirmedBookings=${confirmedBookings} emailsSent=${emailsSent} callsMade=${callsMade} newLeads=${newLeads} conversationsProcessed=${conversationsProcessed}`,
    );

    return NextResponse.json(
      {
        tasksToday,
        totalMessages,
        confirmedBookings,
        lastActivity,
        emailsSent,
        callsMade,
        newLeads,
        conversationsProcessed,
      },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error('GET /api/agent-stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
