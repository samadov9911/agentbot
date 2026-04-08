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
    // Use proper Prisma type to avoid runtime query issues
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
      console.log(`[Conversations] User ${userId.slice(0, 8)} has ${bots.length} bots: ${bots.map(b => `${b.name}(${b.id.slice(0, 8)})`).join(', ')}`);

      if (bots.length === 0) {
        console.log(`[Conversations] No bots found for user ${userId.slice(0, 8)}`);
        return NextResponse.json({ conversations: [] });
      }

      const botIds = bots.map((b) => b.id);
      whereClause = { botId: { in: botIds } };

      // Quick count check for diagnostics
      const totalCount = await db.conversation.count({ where: whereClause });
      console.log(`[Conversations] Total conversations for user's bots: ${totalCount}`);
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

    console.log(`[Conversations] Returning ${conversations.length} conversations for user ${userId.slice(0, 8)}`);

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
        lastMessageAt: c.messages[0]?.createdAt
          ? (c.messages[0].createdAt instanceof Date ? c.messages[0].createdAt.toISOString() : String(c.messages[0].createdAt))
          : (c.updatedAt instanceof Date ? c.updatedAt.toISOString() : new Date().toISOString()),
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : new Date().toISOString(),
      })),
    });
  } catch (e) {
    console.error("[Conversations] Error:", e);
    return NextResponse.json({ error: "Server error", conversations: [] }, { status: 500 });
  }
}
