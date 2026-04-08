import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const range = new URL(request.url).searchParams.get("range") || "today";
    const since = new Date();

    if (range === "today") since.setHours(0, 0, 0, 0);
    else if (range === "week") since.setDate(since.getDate() - 7);
    else if (range === "month") since.setMonth(since.getMonth() - 1);

    // FIX BUG #1: Use {userId} instead of shorthand {u} — Prisma requires the model field name
    const bots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    const ids = bots.map((b) => b.id);

    if (ids.length === 0) {
      return NextResponse.json({
        stats: { activeBots: 0, conversationsToday: 0, appointmentsToday: 0, leadsToday: 0 },
        totalConversations: 0,
        totalAppointments: 0,
        chartData: [],
        activity: [],
      });
    }

    const [conv, apt, leads] = await Promise.all([
      db.conversation.count({ where: { botId: { in: ids }, createdAt: { gte: since } } }),
      db.appointment.count({ where: { botId: { in: ids }, date: { gte: since } } }),
      db.lead.count({ where: { botId: { in: ids }, createdAt: { gte: since } } }),
    ]);

    // FIX BUG #1: Also return totalConversations/totalAppointments for overview page compatibility
    const totalConversations = await db.conversation.count({ where: { botId: { in: ids } } });
    const totalAppointments = await db.appointment.count({ where: { botId: { in: ids } } });

    // Chart data — last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [dc, da, dl] = await Promise.all([
        db.conversation.count({ where: { botId: { in: ids }, createdAt: { gte: dayStart, lt: dayEnd } } }),
        db.appointment.count({ where: { botId: { in: ids }, date: { gte: dayStart, lt: dayEnd } } }),
        db.lead.count({ where: { botId: { in: ids }, createdAt: { gte: dayStart, lt: dayEnd } } }),
      ]);

      chartData.push({
        date: dayStart.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" }),
        conversations: dc,
        appointments: da,
        leads: dl,
      });
    }

    // Recent activity
    const recentConvs = await db.conversation.findMany({
      where: { botId: { in: ids } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { bot: { select: { name: true } } },
    });

    const recentApts = await db.appointment.findMany({
      where: { botId: { in: ids } },
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    function timeAgo(date: Date | string) {
      const diffMs = Date.now() - new Date(date).getTime();
      const minutes = Math.floor(diffMs / 60000);
      if (minutes < 1) return "just now";
      if (minutes < 60) return minutes + " min ago";
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return hours + " hour" + (hours > 1 ? "s" : "") + " ago";
      return Math.floor(hours / 24) + " day" + (Math.floor(hours / 24) > 1 ? "s" : "") + " ago";
    }

    const activity = [
      ...recentConvs.map((c) => ({
        id: c.id,
        message: "Conversation with " + (c.visitorName || "client"),
        timestamp: timeAgo(c.createdAt),
        type: "conversation" as const,
      })),
      ...recentApts.map((a) => ({
        id: a.id,
        message: "Appointment for " + (a.visitorName || "client"),
        timestamp: timeAgo(a.createdAt),
        type: "appointment" as const,
      })),
    ]
      .sort((a, b) => {
        // Sort by most recent first
        const aMs = a.timestamp.includes("just") ? 0 : a.timestamp.includes("min") ? 1 : a.timestamp.includes("hour") ? 2 : 3;
        const bMs = b.timestamp.includes("just") ? 0 : b.timestamp.includes("min") ? 1 : b.timestamp.includes("hour") ? 2 : 3;
        return aMs - bMs;
      })
      .slice(0, 8);

    console.log("[Analytics] Stats:", { activeBots: bots.length, conv, apt, leads, totalConversations, totalAppointments });

    return NextResponse.json({
      stats: {
        activeBots: bots.length,
        conversationsToday: conv,
        appointmentsToday: apt,
        leadsToday: leads,
      },
      // FIX BUG #1: Return both field name formats for compatibility
      totalConversations: totalConversations,
      totalAppointments: totalAppointments,
      chartData,
      activity,
    });
  } catch (e) {
    console.error("[Analytics] Error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
