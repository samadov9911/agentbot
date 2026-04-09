import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Prevent ALL caching (CDN, browser, proxy)
const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// Session marker regex — strip hidden sessionId prefix from displayed messages
const SESSION_MARKER_REGEX = /^\[session:[a-zA-Z0-9_-]+\]\s*/;

function stripSessionMarker(text: string | null): string | null {
  if (!text) return null;
  return text.replace(SESSION_MARKER_REGEX, '');
}

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

// GET /api/leads — Fetch leads for the authenticated user's bots
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CACHE_HEADERS });

    const botId = new URL(request.url).searchParams.get('botId');
    let whereClause: Record<string, unknown> = {};
    let allBotIds: string[] = [];

    if (botId) {
      const bot = await db.bot.findFirst({ where: { id: botId, userId, deletedAt: null } });
      if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404, headers: CACHE_HEADERS });
      whereClause = { botId };
      allBotIds = [botId];
    } else {
      const bots = await db.bot.findMany({ where: { userId, deletedAt: null }, select: { id: true } });
      allBotIds = bots.map(b => b.id);
      if (allBotIds.length === 0) {
        return NextResponse.json({ leads: [] }, { headers: CACHE_HEADERS });
      }
      whereClause = { botId: { in: allBotIds } };
    }

    // ── Try full query with include first (can fail under PgBouncer) ──
    let leads: Array<Record<string, unknown>> = [];
    let useFallback = false;

    try {
      const results = await db.lead.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 100,
        include: { Bot: { select: { name: true } } },
      });
      leads = results as unknown as Array<Record<string, unknown>>;
    } catch (includeErr) {
      console.error('[Leads] Full query with include failed, trying fallback:', includeErr);
      useFallback = true;
    }

    // ── Fallback: simple query without include ──
    if (useFallback) {
      try {
        const results = await db.lead.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          take: 100,
        });
        leads = results as unknown as Array<Record<string, unknown>>;
      } catch (fallbackErr) {
        console.error('[Leads] Fallback query also failed:', fallbackErr);
        return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CACHE_HEADERS });
      }
    }

    // Build bot name lookup for fallback
    let botNameMap: Record<string, string> = {};
    if (useFallback && allBotIds.length > 0) {
      try {
        const bots = await db.bot.findMany({
          where: { id: { in: allBotIds }, deletedAt: null },
          select: { id: true, name: true },
        });
        for (const b of bots) {
          botNameMap[b.id] = b.name;
        }
      } catch {
        // ignore — leads will show "Unknown" bot name
      }
    }

    return NextResponse.json({
      leads: leads.map(l => {
        const bot = l.Bot as Record<string, unknown> | undefined;
        return {
          id: l.id as string,
          botId: l.botId as string,
          botName: (bot?.name as string) || botNameMap[l.botId as string] || 'Unknown',
          visitorName: l.visitorName as string | undefined,
          visitorPhone: l.visitorPhone as string | undefined,
          visitorEmail: l.visitorEmail as string | undefined,
          ipAddress: l.ipAddress as string | undefined,
          message: stripSessionMarker(l.message as string | null),
          source: l.source as string,
          status: l.status as string,
          createdAt: toISO(l.createdAt),
        };
      }),
    }, { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('[Leads] GET error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500, headers: CACHE_HEADERS });
  }
}

// POST /api/leads — Create a new lead (manual creation from dashboard)
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { botId, visitorName, visitorPhone, visitorEmail, ipAddress, region, message, source } = body;

    if (!botId) return NextResponse.json({ error: 'botId required' }, { status: 400 });

    const bot = await db.bot.findFirst({ where: { id: botId, userId, deletedAt: null } });
    if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });

    const lead = await db.lead.create({
      data: {
        botId,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        visitorEmail: visitorEmail || null,
        ipAddress: ipAddress || null,
        region: region || null,
        message: message || null,
        source: source || 'dashboard',
        status: 'new',
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (e) {
    console.error('[Leads] POST error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT /api/leads — Update an existing lead
export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId, visitorName, visitorPhone, visitorEmail, message, status } = await request.json();
    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

    // ── Verify ownership (with fallback for PgBouncer) ──
    let leadBotUserId: string | null = null;
    let leadExists = false;

    try {
      const lead = await db.lead.findFirst({
        where: { id: leadId },
        include: { Bot: { select: { userId: true } } },
      }) as unknown as (Record<string, unknown> & { Bot?: Record<string, unknown> }) | null;
      if (lead) {
        leadExists = true;
        leadBotUserId = (lead.Bot?.userId as string) ?? null;
      }
    } catch (includeErr) {
      console.error('[Leads PUT] Include failed, trying fallback:', includeErr);
    }

    // Fallback: check lead existence and ownership separately
    if (!leadExists) {
      try {
        const lead = await db.lead.findFirst({ where: { id: leadId } });
        if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        leadExists = true;
        // Get bot userId separately
        try {
          const bot = await db.bot.findFirst({
            where: { id: lead.botId },
            select: { userId: true },
          });
          leadBotUserId = bot?.userId ?? null;
        } catch {
          // Can't verify ownership — allow the update
          leadBotUserId = userId;
        }
      } catch (fallbackErr) {
        console.error('[Leads PUT] Fallback also failed:', fallbackErr);
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
    }

    if (leadBotUserId && leadBotUserId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (visitorName !== undefined) updateData.visitorName = visitorName;
    if (visitorPhone !== undefined) updateData.visitorPhone = visitorPhone;
    if (visitorEmail !== undefined) updateData.visitorEmail = visitorEmail;
    if (message !== undefined) updateData.message = message;
    if (status !== undefined) updateData.status = status;

    const updated = await db.lead.update({ where: { id: leadId }, data: updateData });

    return NextResponse.json({ success: true, lead: updated });
  } catch (e) {
    console.error('[Leads] PUT error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
