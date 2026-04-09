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

    // Verify the conversation belongs to a bot owned by this user
    let conversation;
    try {
      conversation = await db.conversation.findFirst({
        where: { id },
        include: { bot: { select: { userId: true, name: true } } },
      });
    } catch (dbErr) {
      console.error("[ConversationMessages] DB error finding conversation:", dbErr);
      return NextResponse.json({ error: "Database error", conversation: null, messages: [] }, { status: 500, headers: CACHE_HEADERS });
    }

    if (!conversation) {
      console.warn(`[ConversationMessages] Conversation ${id.slice(0, 8)} not found`);
      return NextResponse.json({ error: "Conversation not found", conversation: null, messages: [] }, { status: 404, headers: CACHE_HEADERS });
    }

    if (conversation.bot.userId !== userId) {
      console.warn(`[ConversationMessages] Forbidden: conv belongs to user ${conversation.bot.userId.slice(0, 8)}, requested by ${userId.slice(0, 8)}`);
      return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: CACHE_HEADERS });
    }

    // Fetch all messages for this conversation
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
      // CRITICAL FIX: Instead of returning 500, return the conversation with empty messages
      // This allows the UI to still show the conversation info instead of a blank error
      return NextResponse.json({
        conversation: {
          id: conversation.id,
          visitorName: conversation.visitorName || "Client",
          source: conversation.source || "widget",
          status: conversation.status,
          createdAt: conversation.createdAt.toISOString(),
        },
        messages: [],
        _warning: "Could not load messages due to a database error",
      }, { status: 200, headers: CACHE_HEADERS });
    }

    // Also try a raw count query as a sanity check
    try {
      const count = await db.message.count({ where: { conversationId: id } });
      if (count !== messages.length) {
        console.warn(`[ConversationMessages] COUNT MISMATCH: findMany returned ${messages.length} but count says ${count}`);
      }
    } catch {
      // Ignore count check failure
    }

    console.log(`[ConversationMessages] Found conversation: ${conversation.visitorName || 'Client'}, messages: ${messages.length}`);

    const responseBody = {
      conversation: {
        id: conversation.id,
        visitorName: conversation.visitorName || "Client",
        source: conversation.source || "widget",
        status: conversation.status,
        createdAt: conversation.createdAt.toISOString(),
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
