import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * GET /api/email-clients
 *
 * Returns leads that have an email address, for use in the
 * "Compose Email" dialog. Only real data from the database.
 *
 * Query params (all optional):
 *   filter=new    — only leads with status "new"
 *   from=YYYY-MM-DD — filter by createdAt >= date
 *   to=YYYY-MM-DD   — filter by createdAt <= date
 */
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all bot IDs for this user (flat query — safe for PgBouncer)
    const userBots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true },
    });

    const botIds = userBots.map(b => b.id);

    if (botIds.length === 0) {
      return NextResponse.json({ clients: [] }, { headers: CACHE_HEADERS });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter'); // "new"
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');

    // Build where clause — all flat filters, safe for PgBouncer
    const where: Record<string, unknown> = {
      botId: { in: botIds },
      visitorEmail: { not: null }, // Only leads with an email
    };

    // Filter by status if requested
    if (filter === 'new') {
      where.status = 'new';
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, unknown> = {};
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00');
        if (!isNaN(from.getTime())) dateFilter.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59');
        if (!isNaN(to.getTime())) dateFilter.lte = to;
      }
      if (Object.keys(dateFilter).length > 0) {
        where.createdAt = dateFilter;
      }
    }

    // Fetch leads ordered by most recent first
    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: {
        id: true,
        visitorName: true,
        visitorEmail: true,
        visitorPhone: true,
        createdAt: true,
        status: true,
      },
    });

    // Map to a clean client format for the email dialog
    const clients = leads.map((lead) => ({
      id: lead.id,
      name: lead.visitorName || '—',
      email: lead.visitorEmail || '',
      phone: lead.visitorPhone || undefined,
      date: lead.createdAt instanceof Date ? lead.createdAt.toISOString() : new Date(lead.createdAt as string).toISOString(),
      isNew: lead.status === 'new',
    }));

    console.log(`[EmailClients] userId=${userId.slice(0, 8)} filter=${filter} returned=${clients.length}`);

    return NextResponse.json({ clients }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('GET /api/email-clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
