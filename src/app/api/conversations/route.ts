import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      console.log("[Conversations] Missing x-user-id header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const botId = new URL(request.url).searchParams.get("botId");
    let whereClause: Record<string, unknown> = {};

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
        select: { id: true },
      });
      console.log(`[Conversations] User ${userId} has ${bots.length} bots: ${bots.map(b => b.id).join(',')}`);
      if (bots.length === 0) {
        return NextResponse.json({ conversations: [] });
      }
      whereClause = { botId: { in: bots.map((b) => b.id) } };
    }

    const conversations = await db.conversation.findMany({
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

    console.log(`[Conversations] Found ${conversations.length} conversations for user ${userId}`);

    return NextResponse.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        botId: c.botId,
        botName: c.bot?.name || "Unknown",
        visitorName: c.visitorName || "Client",
        source: c.source || "widget",
        status: c.status || "active",
        messageCount: c._count.messages,
        lastMessage: c.messages[0]?.content || "No messages",
        lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (e) {
    console.error("[Conversations] Error:", e);
    return NextResponse.json({ error: "Server error", conversations: [] }, { status: 500 });
  }
}
