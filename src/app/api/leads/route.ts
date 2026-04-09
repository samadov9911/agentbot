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

    // ── Build bot name map upfront (no include — safe under PgBouncer) ──
    let botNameMap: Record<string, string> = {};
    if (allBotIds.length > 0) {
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

    // Simple query WITHOUT include — guaranteed to work under PgBouncer
    const leads = await db.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      leads: leads.map(l => ({
        id: l.id,
        botId: l.botId,
        botName: botNameMap[l.botId] || 'Unknown',
        visitorName: l.visitorName ?? undefined,
        visitorPhone: l.visitorPhone ?? undefined,
        visitorEmail: l.visitorEmail ?? undefined,
        ipAddress: l.ipAddress ?? undefined,
        message: stripSessionMarker(l.message),
        source: l.source,
        status: l.status,
        createdAt: toISO(l.createdAt),
      })),
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
