import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ──────────────────────────────────────────────────────────────
// GET /api/leads — Fetch leads for a bot
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');

    // Build where clause: either specific bot or all user's bots
    let whereClause: Record<string, unknown>;
    if (botId) {
      // Verify bot belongs to user
      const bot = await db.bot.findFirst({
        where: { id: botId, userId, deletedAt: null },
      });
      if (!bot) {
        return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
      }
      whereClause = { botId };
    } else {
      // Get all bot IDs for this user
      const userBots = await db.bot.findMany({
        where: { userId, deletedAt: null },
        select: { id: true },
      });
      const botIds = userBots.map((b) => b.id);
      whereClause = { botId: { in: botIds } };
    }

    const leads = await db.lead.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({
      leads: leads.map((l) => ({
        id: l.id,
        botId: l.botId,
        visitorName: l.visitorName || null,
        visitorPhone: l.visitorPhone || null,
        visitorEmail: l.visitorEmail || null,
        ipAddress: l.ipAddress || null,
        region: l.region || null,
        message: l.message || null,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/leads — Create a lead
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { botId, visitorName, visitorPhone, visitorEmail, ipAddress, region, message, source } = body;

    if (!botId) {
      return NextResponse.json({ error: 'botId is required' }, { status: 400 });
    }

    // Verify bot belongs to user
    const bot = await db.bot.findFirst({
      where: { id: botId, userId, deletedAt: null },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Check if a lead with this botId and same IP/session already exists recently (last 2h)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existingLead = await db.lead.findFirst({
      where: {
        botId,
        ipAddress: ipAddress || 'unknown',
        createdAt: { gte: twoHoursAgo },
      },
    });

    if (existingLead) {
      // Update existing lead with any new contact info
      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (visitorName && !existingLead.visitorName) updateData.visitorName = visitorName;
      if (visitorPhone && !existingLead.visitorPhone) updateData.visitorPhone = visitorPhone;
      if (visitorEmail && !existingLead.visitorEmail) updateData.visitorEmail = visitorEmail;
      if (message && !existingLead.message) updateData.message = message;
      if (visitorName || visitorPhone || visitorEmail) updateData.status = 'contacted';

      await db.lead.update({
        where: { id: existingLead.id },
        data: updateData,
      });

      return NextResponse.json({
        success: true,
        lead: { id: existingLead.id },
        updated: true,
      });
    }

    // Create new lead
    const lead = await db.lead.create({
      data: {
        botId,
        visitorName: visitorName || null,
        visitorPhone: visitorPhone || null,
        visitorEmail: visitorEmail || null,
        ipAddress: ipAddress || null,
        region: region || null,
        message: message || null,
        source: source || 'widget',
        status: (visitorName || visitorPhone || visitorEmail) ? 'contacted' : 'new',
      },
    });

    return NextResponse.json({
      success: true,
      lead: { id: lead.id },
    });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
