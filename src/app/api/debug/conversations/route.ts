import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Debug endpoint: returns raw diagnostic info about user's bots and conversations.
 * Called from the analytics page to identify why the Dialogs tab might be empty.
 *
 * Usage: GET /api/debug/conversations (with x-user-id header)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Missing x-user-id" }, { status: 400 });
    }

    // 1. Find user's bots
    const bots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, name: true, publishedAt: true, createdAt: true },
    });

    const botIds = bots.map((b) => b.id);

    // 2. Count ALL conversations for these bots (no filters)
    let totalConversations = 0;
    let conversationsByBot: Record<string, number> = {};
    if (botIds.length > 0) {
      totalConversations = await db.conversation.count({
        where: { botId: { in: botIds } },
      });

      // Count per bot
      for (const botId of botIds) {
        const count = await db.conversation.count({ where: { botId } });
        conversationsByBot[botId] = count;
      }
    }

    // 3. Get latest 5 conversations (raw)
    const recentConvs = botIds.length > 0
      ? await db.conversation.findMany({
          where: { botId: { in: botIds } },
          orderBy: { updatedAt: "desc" },
          take: 5,
          select: {
            id: true,
            botId: true,
            visitorId: true,
            visitorName: true,
            status: true,
            source: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : [];

    // 4. Count appointments and leads too
    let totalAppointments = 0;
    let totalLeads = 0;
    if (botIds.length > 0) {
      totalAppointments = await db.appointment.count({
        where: { botId: { in: botIds } },
      });
      totalLeads = await db.lead.count({
        where: { botId: { in: botIds } },
      });
    }

    return NextResponse.json({
      userId: userId.slice(0, 8) + "...",
      botsCount: bots.length,
      bots: bots.map((b) => ({
        id: b.id.slice(0, 8) + "...",
        name: b.name,
        published: !!b.publishedAt,
        createdAt: b.createdAt?.toISOString(),
      })),
      botIds,
      totalConversations,
      conversationsByBot,
      recentConversations: recentConvs.map((c) => ({
        id: c.id.slice(0, 8) + "...",
        botId: c.botId.slice(0, 8) + "...",
        visitorId: c.visitorId?.slice(0, 12) + "...",
        visitorName: c.visitorName || "(null)",
        status: c.status,
        source: c.source,
        createdAt: c.createdAt?.toISOString(),
        updatedAt: c.updatedAt?.toISOString(),
      })),
      totalAppointments,
      totalLeads,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      error: String(e),
      stack: e instanceof Error ? e.stack : undefined,
    }, { status: 500 });
  }
}
