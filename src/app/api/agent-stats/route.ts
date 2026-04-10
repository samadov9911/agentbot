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
 *
 * IMPORTANT: All Message queries use flat `conversationId` filter (NOT
 * the relation filter `conversation: { botId }`) because PgBouncer in
 * transaction mode does not support the implicit JOIN that Prisma generates
 * for nested relation filters.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Get all bot IDs for this user
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

    // Step 2: Get all conversation IDs for these bots (flat query — safe for PgBouncer)
    const conversations = await db.conversation.findMany({
      where: { botId: { in: botIds } },
      select: { id: true },
    });

    const conversationIds = conversations.map(c => c.id);

    console.log(
      `[AgentStats] userId=${userId.slice(0, 8)} bots=${botIds.length} conversations=${conversationIds.length}`,
    );

    // ── Time boundaries ──
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // ── Parallel queries (all flat — no relation filters on Message) ──
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
      // 1. Tasks today = user messages from today
      db.message.count({
        where: {
          conversationId: { in: conversationIds },
          role: 'user',
          createdAt: { gte: todayStart },
        },
      }),

      // 2. Total messages (all roles)
      db.message.count({
        where: {
          conversationId: { in: conversationIds },
        },
      }),

      // 3. Confirmed bookings (Appointment has botId directly — safe)
      db.appointment.count({
        where: {
          botId: { in: botIds },
          status: 'confirmed',
        },
      }),

      // 4. Latest message timestamp (flat filter — safe for PgBouncer)
      db.message.findFirst({
        where: { conversationId: { in: conversationIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 5. Latest appointment timestamp (has botId directly — safe)
      db.appointment.findFirst({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 6. Latest lead timestamp (Lead has botId directly — safe)
      db.lead.findFirst({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),

      // 7. Emails sent today = leads contacted today
      db.lead.count({
        where: {
          botId: { in: botIds },
          status: 'contacted',
          createdAt: { gte: todayStart },
        },
      }),

      // 8. Calls made today (CallLog has userId directly — safe)
      db.callLog.count({
        where: { userId, createdAt: { gte: todayStart } },
      }),

      // 9. New leads today
      db.lead.count({
        where: {
          botId: { in: botIds },
          createdAt: { gte: todayStart },
        },
      }),

      // 10. Conversations today (has botId directly — safe)
      db.conversation.count({
        where: { botId: { in: botIds }, createdAt: { gte: todayStart } },
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
      `[AgentStats] userId=${userId.slice(0, 8)} ` +
        `tasksToday=${tasksToday} totalMessages=${totalMessages} ` +
        `confirmedBookings=${confirmedBookings} emailsSent=${emailsSent} ` +
        `callsMade=${callsMade} newLeads=${newLeads} conversationsProcessed=${conversationsProcessed} ` +
        `lastActivity=${lastActivity}`,
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
