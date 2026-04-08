import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      console.log("[Conversations] Missing x-user-id header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botId = new URL(request.url).searchParams.get("botId");
    let whereClause: Prisma.ConversationWhereInput = {};

    if (botId) {
      const bot = await db.bot.findFirst({
        where: { id: botId, userId, deletedAt: null },
      });
      if (!bot) {
        console.log(`[Conversations] Bot ${botId} not found for user ${userId}`);
        return NextResponse.json({ error: "Bot not found" }, { status: 404 });
      }
      whereClause = { botId };
    } else {
      const bots = await db.bot.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, name: true, publishedAt: true },
      });
      console.log(`[Conversations] User ${userId.slice(0, 8)} has ${bots.length} bots`);

      if (bots.length === 0) {
        console.log(`[Conversations] No bots found for user ${userId.slice(0, 8)}`);
        return NextResponse.json({ conversations: [] });
      }

      const botIds = bots.map((b) => b.id);
      whereClause = { botId: { in: botIds } };
    }

    // ── Try full query with includes first ──
    let conversations;
    let useFallback = false;
    try {
      conversations = await db.conversation.findMany({
        where: whereClause,
        include: {
          _count: { select: { messages: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, role: true, createdAt: true },
          },
          bot: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
      });
    } catch (includeErr) {
      console.error("[Conversations] Full query failed, trying fallback:", includeErr);
      useFallback = true;
    }

    // ── Fallback: simpler query without includes ──
    if (useFallback) {
      try {
        conversations = await db.conversation.findMany({
          where: whereClause,
          orderBy: { updatedAt: "desc" },
          take: 50,
        });
      } catch (fallbackErr) {
        console.error("[Conversations] Fallback query also failed:", fallbackErr);
        // Last resort: just count
        const count = await db.conversation.count({ where: whereClause }).catch(() => 0);
        console.log(`[Conversations] Count fallback: ${count}`);
        return NextResponse.json({ conversations: [], _debug: { count, error: String(includeErr) } });
      }
    }

    console.log(`[Conversations] Returning ${conversations?.length || 0} conversations (fallback=${useFallback})`);

    return NextResponse.json({
      conversations: (conversations || []).map((c: Record<string, unknown>) => {
        // Handle both full (with includes) and fallback (without includes) results
        const messages = (c.messages as Array<Record<string, unknown>> | undefined) || [];
        const bot = c.bot as Record<string, unknown> | undefined;
        const count = c._count as Record<string, unknown> | undefined;

        return {
          id: c.id as string,
          botId: c.botId as string,
          botName: (bot?.name as string) || "Unknown",
          visitorName: (c.visitorName as string) || "Client",
          source: (c.source as string) || "widget",
          status: (c.status as string) || "active",
          messageCount: (count?.messages as number) ?? 0,
          lastMessage: (messages[0]?.content as string) || "No messages",
          lastMessageAt: messages[0]?.createdAt
            ? new Date(messages[0].createdAt as string).toISOString()
            : (c.updatedAt instanceof Date ? (c.updatedAt as Date).toISOString() : new Date().toISOString()),
          createdAt: c.createdAt instanceof Date ? (c.createdAt as Date).toISOString() : new Date(c.createdAt as string).toISOString(),
          updatedAt: c.updatedAt instanceof Date ? (c.updatedAt as Date).toISOString() : new Date(c.updatedAt as string).toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error("[Conversations] Top-level error:", e);
    return NextResponse.json({ error: "Server error", conversations: [] }, { status: 500 });
  }
}
