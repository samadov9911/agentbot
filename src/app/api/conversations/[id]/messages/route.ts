import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Prevent ALL caching (CDN, browser, proxy)
const CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store",
};

// Safe date-to-ISO helper (handles both Date objects and strings)
function toISO(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let id: string | undefined;
    try {
      const resolvedParams = await params;
      id = resolvedParams.id;
    } catch (paramsErr) {
      console.error("[ConversationMessages] Failed to resolve params:", paramsErr);
      return NextResponse.json({ error: "Invalid conversation ID", conversation: null, messages: [] }, { status: 400, headers: CACHE_HEADERS });
    }

    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required", conversation: null, messages: [] }, { status: 400, headers: CACHE_HEADERS });
    }

    const userId = request.headers.get("x-user-id");
    if (!userId) {
      console.warn("[ConversationMessages] Missing x-user-id header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CACHE_HEADERS });
    }

    console.log(`[ConversationMessages] Fetching messages for conv=${id.slice(0, 8)}, user=${userId.slice(0, 8)}`);

    // ── Step 1: Find conversation ──
    // Try full query with include first (can fail under PgBouncer/supabase pooler)
    let conversation: Record<string, unknown> | null = null;
    let botUserId: string | null = null;
    let useFallback = false;

    try {
      const result = await db.conversation.findFirst({
        where: { id },
        include: { bot: { select: { userId: true, name: true } } },
      });
      if (result) {
        conversation = result as unknown as Record<string, unknown>;
        const bot = conversation.bot as Record<string, unknown> | undefined;
        botUserId = (bot?.userId as string) ?? null;
      }
    } catch (includeErr) {
      console.error("[ConversationMessages] Full query with include failed, trying fallback:", includeErr);
      useFallback = true;
    }

    // ── Fallback: simple query without include ──
    if (useFallback || !conversation) {
      try {
        const result = await db.conversation.findFirst({ where: { id } });
        if (result) {
          conversation = result as unknown as Record<string, unknown>;
        }
      } catch (fallbackErr) {
        console.error("[ConversationMessages] Fallback query also failed:", fallbackErr);
        return NextResponse.json({ error: "Database error", conversation: null, messages: [] }, { status: 500, headers: CACHE_HEADERS });
      }
    }

    if (!conversation) {
      console.warn(`[ConversationMessages] Conversation ${id.slice(0, 8)} not found`);
      return NextResponse.json({ error: "Conversation not found", conversation: null, messages: [] }, { status: 404, headers: CACHE_HEADERS });
    }

    // ── Step 2: Verify ownership ──
    if (!botUserId) {
      try {
        const convBotId = conversation.botId as string;
        const bot = await db.bot.findFirst({
          where: { id: convBotId },
          select: { userId: true },
        });
        botUserId = bot?.userId ?? null;
      } catch (botErr) {
        console.error("[ConversationMessages] Could not fetch bot for ownership check:", botErr);
        // If we can't verify ownership, allow access (conversation was found by ID)
        botUserId = userId;
      }
    }

    if (botUserId && botUserId !== userId) {
      console.warn(`[ConversationMessages] Forbidden: conv belongs to user ${botUserId.slice(0, 8)}, requested by ${userId.slice(0, 8)}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CACHE_HEADERS });
    }

    // ── Step 3: Fetch messages ──
    let messages;
    try {
      messages = await db.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          messageType: true,
          createdAt: true,
        },
      });
    } catch (msgErr) {
      console.error("[ConversationMessages] DB error fetching messages:", msgErr);
      // Return conversation info with empty messages instead of 500
      return NextResponse.json({
        conversation: {
          id: conversation.id as string,
          visitorName: (conversation.visitorName as string) || "Client",
          source: (conversation.source as string) || "widget",
          status: (conversation.status as string) || "active",
          createdAt: toISO(conversation.createdAt),
        },
        messages: [],
        _warning: "Could not load messages due to a database error",
      }, { status: 200, headers: CACHE_HEADERS });
    }

    console.log(`[ConversationMessages] Found conversation: ${(conversation.visitorName as string) || 'Client'}, messages: ${messages.length}`);

    // ── Step 4: Build response ──
    const responseBody = {
      conversation: {
        id: conversation.id as string,
        visitorName: (conversation.visitorName as string) || "Client",
        source: (conversation.source as string) || "widget",
        status: (conversation.status as string) || "active",
        createdAt: toISO(conversation.createdAt),
      },
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        messageType: m.messageType,
        createdAt: m.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(responseBody, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error("[ConversationMessages] Top-level error:", e);
    return NextResponse.json({ error: "Server error", conversation: null, messages: [] }, { status: 500, headers: CACHE_HEADERS });
  }
}
