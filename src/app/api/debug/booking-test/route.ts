import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to diagnose why appointments and leads are not loading.
 * Call: GET /api/debug/booking-test with x-user-id header
 * Returns: detailed info about each DB step and whether it succeeds.
 */
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 400 });
  }

  const result: Record<string, unknown> = { userId, steps: [] };
  const steps: Array<{ step: string; ok: boolean; detail?: string }> = [];

  // Step 1: Find user bots
  try {
    const bots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      select: { id: true, name: true },
    });
    steps.push({ step: 'findBots', ok: true, detail: `Found ${bots.length} bots: ${bots.map(b => b.name).join(', ')}` });
    result.botIds = bots.map(b => b.id);

    if (bots.length === 0) {
      return NextResponse.json({ ...result, steps });
    }

    const botIds = bots.map(b => b.id);

    // Step 2: Try appointment count (simple, no include)
    try {
      const aptCount = await db.appointment.count({
        where: { botId: { in: botIds } },
      });
      steps.push({ step: 'appointmentCount', ok: true, detail: `Total: ${aptCount}` });
    } catch (e) {
      steps.push({ step: 'appointmentCount', ok: false, detail: String(e) });
    }

    // Step 3: Try appointment findMany WITHOUT include
    try {
      const apts = await db.appointment.findMany({
        where: { botId: { in: botIds } },
        orderBy: { date: 'desc' },
        take: 5,
      });
      steps.push({ step: 'appointmentFindMany_noInclude', ok: true, detail: `Found ${apts.length}` });
      result.sampleAppointments = apts.map(a => ({
        id: a.id,
        visitorName: a.visitorName,
        date: a.date instanceof Date ? a.date.toISOString() : String(a.date),
      }));
    } catch (e) {
      steps.push({ step: 'appointmentFindMany_noInclude', ok: false, detail: String(e) });
    }

    // Step 4: Try appointment findMany WITH include (this may fail under PgBouncer)
    try {
      const apts = await db.appointment.findMany({
        where: { botId: { in: botIds } },
        orderBy: { date: 'desc' },
        take: 5,
        include: { Bot: { select: { name: true } } },
      });
      steps.push({ step: 'appointmentFindMany_withInclude', ok: true, detail: `Found ${apts.length}` });
    } catch (e) {
      steps.push({ step: 'appointmentFindMany_withInclude', ok: false, detail: String(e) });
    }

    // Step 5: Try lead count
    try {
      const leadCount = await db.lead.count({
        where: { botId: { in: botIds } },
      });
      steps.push({ step: 'leadCount', ok: true, detail: `Total: ${leadCount}` });
    } catch (e) {
      steps.push({ step: 'leadCount', ok: false, detail: String(e) });
    }

    // Step 6: Try lead findMany WITHOUT include
    try {
      const leads = await db.lead.findMany({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      steps.push({ step: 'leadFindMany_noInclude', ok: true, detail: `Found ${leads.length}` });
      result.sampleLeads = leads.map(l => ({
        id: l.id,
        visitorName: l.visitorName,
        status: l.status,
      }));
    } catch (e) {
      steps.push({ step: 'leadFindMany_noInclude', ok: false, detail: String(e) });
    }

    // Step 7: Try lead findMany WITH include
    try {
      const leads = await db.lead.findMany({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { Bot: { select: { name: true } } },
      });
      steps.push({ step: 'leadFindMany_withInclude', ok: true, detail: `Found ${leads.length}` });
    } catch (e) {
      steps.push({ step: 'leadFindMany_withInclude', ok: false, detail: String(e) });
    }

    // Step 8: Try the EXACT same query as current GET /api/bookings (no include)
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const allAppointments = await db.appointment.findMany({
        where: {
          botId: { in: botIds },
          date: { gte: thirtyDaysAgo },
          status: { notIn: ['cancelled'] },
        },
        orderBy: { date: 'desc' },
        take: 100,
      });
      steps.push({ step: 'bookingsSimpleQuery', ok: true, detail: `Found ${allAppointments.length}` });
      result.bookingsResult = allAppointments.slice(0, 3).map(a => ({
        id: a.id,
        visitorName: a.visitorName,
        date: a.date instanceof Date ? a.date.toISOString() : String(a.date),
        status: a.status,
      }));
    } catch (e) {
      steps.push({ step: 'bookingsSimpleQuery', ok: false, detail: String(e) });
    }

    // Step 9: Try the EXACT same query as current GET /api/leads (no include)
    try {
      const allLeads = await db.lead.findMany({
        where: { botId: { in: botIds } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
      steps.push({ step: 'leadsSimpleQuery', ok: true, detail: `Found ${allLeads.length}` });
      result.leadsResult = allLeads.slice(0, 3).map(l => ({
        id: l.id,
        visitorName: l.visitorName,
        status: l.status,
      }));
    } catch (e) {
      steps.push({ step: 'leadsSimpleQuery', ok: false, detail: String(e) });
    }

  } catch (e) {
    steps.push({ step: 'topLevel', ok: false, detail: String(e) });
  }

  result.steps = steps;
  return NextResponse.json(result);
}
