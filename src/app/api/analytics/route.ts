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

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CACHE_HEADERS });

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
      }, { headers: CACHE_HEADERS });
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
    }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error("[Analytics] Error:", e);
    return NextResponse.json({ error: "Server error", details: String(e) }, { status: 500, headers: CACHE_HEADERS });
  }
}

// ──────────────────────────────────────────────────────────────
// Build chart data for last 7 days using efficient queries
// ──────────────────────────────────────────────────────────────

// Safe date-to-ISO helper
function toISO(value: unknown): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  return new Date().toISOString();
}

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
    // ── Try full queries with includes first (can fail under PgBouncer) ──
    let recentConvs: Array<Record<string, unknown>> = [];
    let recentApts: Array<Record<string, unknown>> = [];
    let recentLeads: Array<Record<string, unknown>> = [];
    let useFallback = false;

    try {
      const [convs, apts, lds] = await Promise.all([
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
      recentConvs = convs as unknown as Array<Record<string, unknown>>;
      recentApts = apts as unknown as Array<Record<string, unknown>>;
      recentLeads = lds as unknown as Array<Record<string, unknown>>;
    } catch (includeErr) {
      console.error("[Analytics Activity] Full query failed, trying fallback:", includeErr);
      useFallback = true;
    }

    // ── Fallback: simple queries without includes ──
    if (useFallback) {
      try {
        const [convs, apts, lds] = await Promise.all([
          db.conversation.findMany({
            where: { botId: { in: botIds } },
            take: 5,
            orderBy: { createdAt: "desc" },
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
        recentConvs = convs as unknown as Array<Record<string, unknown>>;
        recentApts = apts as unknown as Array<Record<string, unknown>>;
        recentLeads = lds as unknown as Array<Record<string, unknown>>;
      } catch (fallbackErr) {
        console.error("[Analytics Activity] Fallback also failed:", fallbackErr);
        return [];
      }
    }

    // Build bot name lookup for fallback
    let botNameMap: Record<string, string> = {};
    if (useFallback) {
      try {
        const bots = await db.bot.findMany({
          where: { id: { in: botIds }, deletedAt: null },
          select: { id: true, name: true },
        });
        for (const b of bots) {
          botNameMap[b.id] = b.name;
        }
      } catch { /* ignore */ }
    }

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
      ...recentConvs.map((c) => {
        const bot = c.bot as Record<string, unknown> | undefined;
        return {
          id: c.id as string,
          message: "💬 Диалог с " + ((c.visitorName as string) || "клиентом") + " (" + ((bot?.name as string) || botNameMap[c.botId as string] || "бот") + ")",
          timestamp: timeAgo(c.createdAt),
          createdAt: toISO(c.createdAt),
          type: "conversation" as const,
        };
      }),
      ...recentApts.map((a) => ({
        id: a.id as string,
        message: "📅 Запись: " + ((a.visitorName as string) || "клиент") + (a.service ? " — " + (a.service as string) : ""),
        timestamp: timeAgo(a.createdAt),
        createdAt: toISO(a.createdAt),
        type: "appointment" as const,
      })),
      ...recentLeads.map((l) => ({
        id: l.id as string,
        message: "👤 Новый лид: " + ((l.visitorName as string) || "клиент") + (l.visitorPhone ? " (" + (l.visitorPhone as string) + ")" : ""),
        timestamp: timeAgo(l.createdAt),
        createdAt: toISO(l.createdAt),
        type: "lead" as const,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 12);

    console.log(`[Analytics] Activity built: convs=${recentConvs.length}, apts=${recentApts.length}, leads=${recentLeads.length}, total=${activity.length}, fallback=${useFallback}`);
    return activity;
  } catch (e) {
    console.error("[Analytics] Activity build error:", e);
    return [];
  }
}
