import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
    }

    // Verify the conversation belongs to a bot owned by this user
    const conversation = await db.conversation.findFirst({
      where: { id },
      include: { bot: { select: { userId: true } } },
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    if (conversation.bot.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all messages for this conversation
    const messages = await db.message.findMany({
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

    return NextResponse.json({
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
    });
  } catch (e) {
    console.error("[ConversationMessages] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
