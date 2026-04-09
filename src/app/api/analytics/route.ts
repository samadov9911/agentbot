import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const range = new URL(request.url).searchParams.get("range") || "today";
    const since = new Date();

    if (range === "today") since.setHours(0, 0, 0, 0);
    else if (range === "week") since.setDate(since.getDate() - 7);
    else if (range === "month") since.setMonth(since.getMonth() - 1);

    // ── Step 1: Find user's bots ──
    const bots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, name: true },
    });

    const ids = bots.map((b) => b.id);
    console.log(`[Analytics] userId=${userId}, botsFound=${bots.length}, botIds=${JSON.stringify(ids)}`);

    if (ids.length === 0) {
      return NextResponse.json({
        stats: { activeBots: 0, conversationsToday: 0, appointmentsToday: 0, leadsToday: 0 },
        totalConversations: 0,
        totalAppointments: 0,
        chartData: [],
        activity: [],
        lastUpdated: new Date().toISOString(),
      });
    }

    // ── Step 2: Count stats (parallel) ──
    const [conv, apt, leads, totalConversations, totalAppointments] = await Promise.all([
      db.conversation.count({ where: { botId: { in: ids }, createdAt: { gte: since } } }),
      db.appointment.count({ where: { botId: { in: ids }, date: { gte: since } } }),
      db.lead.count({ where: { botId: { in: ids }, createdAt: { gte: since } } }),
      db.conversation.count({ where: { botId: { in: ids } } }),
      db.appointment.count({ where: { botId: { in: ids } } }),
    ]);

    console.log(`[Analytics] Stats: conv=${conv}, apt=${apt}, leads=${leads}, totalConv=${totalConversations}, totalApt=${totalAppointments}`);

    // ── Step 3: Chart data — last 7 days using single batch query ──
    const chartData = await buildChartData(ids);

    // ── Step 4: Recent activity ──
    const activity = await buildActivity(ids);

    return NextResponse.json({
      stats: {
        activeBots: bots.length,
        conversationsToday: conv,
        appointmentsToday: apt,
        leadsToday: leads,
      },
      totalConversations,
      totalAppointments,
      chartData,
      activity,
      lastUpdated: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[Analytics] Error:", e);
    return NextResponse.json({ error: "Server error", details: String(e) }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// Build chart data for last 7 days using efficient queries
// ──────────────────────────────────────────────────────────────

async function buildChartData(botIds: string[]) {
  const chartData: Array<{ date: string; conversations: number; appointments: number; leads: number }> = [];

  // Calculate day boundaries (use fixed dates, avoid mutations)
  // Chart shows: 6 days ago → today → 7 days ahead (14 days total)
  // This ensures upcoming appointments (tomorrow, next week) are visible.
  const days: Array<{ start: Date; end: Date; label: string }> = [];
  for (let i = -7; i <= 6; i++) {
    const dayStart = new Date();
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const label = dayStart.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
    days.push({ start: dayStart, end: dayEnd, label });
  }

  // Fetch data across the full chart range
  const rangeStart = days[0].start;
  const rangeEnd = days[days.length - 1].end;

  const [conversations, appointments, leads] = await Promise.all([
    db.conversation.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: rangeStart, lt: new Date(rangeEnd.getTime() + 1) } },
      select: { createdAt: true },
    }),
    // Appointments use `date` (scheduled date) — can be in the future
    db.appointment.findMany({
      where: { botId: { in: botIds }, date: { gte: rangeStart, lt: new Date(rangeEnd.getTime() + 1) } },
      select: { date: true },
    }),
    db.lead.findMany({
      where: { botId: { in: botIds }, createdAt: { gte: rangeStart, lt: new Date(rangeEnd.getTime() + 1) } },
      select: { createdAt: true },
    }),
  ]);

  console.log(`[ChartData] conversations=${conversations.length}, appointments=${appointments.length}, leads=${leads.length}`);

  // Bucket each record into its day
  for (const day of days) {
    const dc = conversations.filter((c) => {
      const t = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
      return t >= day.start && t <= day.end;
    }).length;

    const da = appointments.filter((a) => {
      const t = a.date instanceof Date ? a.date : new Date(a.date);
      return t >= day.start && t <= day.end;
    }).length;

    const dl = leads.filter((l) => {
      const t = l.createdAt instanceof Date ? l.createdAt : new Date(l.createdAt);
      return t >= day.start && t <= day.end;
    }).length;

    chartData.push({
      date: day.label,
      conversations: dc,
      appointments: da,
      leads: dl,
    });
  }

  return chartData;
}

// ──────────────────────────────────────────────────────────────
// Build recent activity from conversations + appointments
// ──────────────────────────────────────────────────────────────

async function buildActivity(botIds: string[]) {
  try {
    const [recentConvs, recentApts, recentLeads] = await Promise.all([
      db.conversation.findMany({
        where: { botId: { in: botIds } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { bot: { select: { name: true } } },
      }),
      db.appointment.findMany({
        where: { botId: { in: botIds } },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      db.lead.findMany({
        where: { botId: { in: botIds } },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    function timeAgo(date: Date | string): string {
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
        message: "💬 Диалог с " + (c.visitorName || "клиентом") + " (" + (c.bot?.name || "бот") + ")",
        timestamp: timeAgo(c.createdAt),
        createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
        type: "conversation" as const,
      })),
      ...recentApts.map((a) => ({
        id: a.id,
        message: "📅 Запись: " + (a.visitorName || "клиент") + (a.service ? " — " + a.service : ""),
        timestamp: timeAgo(a.createdAt),
        createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
        type: "appointment" as const,
      })),
      ...recentLeads.map((l) => ({
        id: l.id,
        message: "👤 Новый лид: " + (l.visitorName || "клиент") + (l.visitorPhone ? " (" + l.visitorPhone + ")" : ""),
        timestamp: timeAgo(l.createdAt),
        createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
        type: "lead" as const,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    console.log(`[Analytics] Activity built: convs=${recentConvs.length}, apts=${recentApts.length}, leads=${recentLeads.length}, total=${activity.length}`);
    return activity;
  } catch (e) {
    console.error("[Analytics] Activity build error:", e);
    return [];
  }
}
