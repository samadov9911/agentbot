import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Session marker regex — strip hidden sessionId prefix from displayed messages
const SESSION_MARKER_REGEX = /^\[session:[a-zA-Z0-9_-]+\]\s*/;

function stripSessionMarker(text: string | null): string | null {
  if (!text) return null;
  return text.replace(SESSION_MARKER_REGEX, '');
}

// GET /api/leads — Fetch leads for the authenticated user's bots
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const botId = new URL(request.url).searchParams.get('botId');
    let whereClause: Record<string, unknown> = {};

    if (botId) {
      const bot = await db.bot.findFirst({ where: { id: botId, userId, deletedAt: null } });
      if (!bot) return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      whereClause = { botId };
    } else {
      const bots = await db.bot.findMany({ where: { userId, deletedAt: null }, select: { id: true } });
      whereClause = { botId: { in: bots.map(b => b.id) } };
    }

    const leads = await db.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // FIX BUG #4: Strip session marker from displayed message
    return NextResponse.json({
      leads: leads.map(l => ({
        id: l.id,
        botId: l.botId,
        visitorName: l.visitorName,
        visitorPhone: l.visitorPhone,
        visitorEmail: l.visitorEmail,
        ipAddress: l.ipAddress,
        message: stripSessionMarker(l.message),
        source: l.source,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[Leads] GET error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
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

    const lead = await db.lead.findFirst({
      where: { id: leadId },
      include: { Bot: { select: { userId: true } } },
    });

    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (lead.Bot.userId !== userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

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
