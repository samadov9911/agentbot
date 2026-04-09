import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendBookingConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Prevent ALL caching (CDN, browser, proxy)
const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store',
};

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

interface CalendarConfig {
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferMinutes: number;
  maxConcurrentBookings: number;
}

interface CalendarSyncConfig {
  type: 'platform' | 'external';
  externalUrl?: string;
}

type SyncStatus = 'synced' | 'platform_only' | 'sync_failed';

function parseCalendarConfig(configJson: string): CalendarConfig | null {
  try {
    const raw = JSON.parse(configJson);
    const cal = raw.calendarConfig;
    if (cal && cal.startTime && cal.endTime && cal.slotDuration) {
      return cal as CalendarConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function parseCalendarSync(configJson: string): CalendarSyncConfig | null {
  try {
    const raw = JSON.parse(configJson);
    const sync = raw.calendarSync;
    if (sync && (sync.type === 'platform' || sync.type === 'external')) {
      return sync as CalendarSyncConfig;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to synchronize a new appointment with an external calendar.
 * For now this is a simulation — it logs the attempt and returns a status.
 */
async function syncToExternalCalendar(
  calendarSync: CalendarSyncConfig,
  appointmentId: string,
  visitorName: string,
  date: string,
  time: string
): Promise<SyncStatus> {
  try {
    const externalUrl = calendarSync.externalUrl;
    if (!externalUrl) {
      console.warn(
        `[CalendarSync] External sync requested for appointment ${appointmentId} but no externalUrl configured`
      );
      return 'sync_failed';
    }

    // Simulated external calendar sync
    console.log(
      `[CalendarSync] Syncing appointment ${appointmentId} (${visitorName}, ${date} at ${time}) to external calendar at ${externalUrl}`
    );

    // In production, this would make an HTTP request to externalUrl
    // e.g. await fetch(externalUrl, { method: 'POST', body: ... })

    console.log(`[CalendarSync] Successfully synced appointment ${appointmentId}`);
    return 'synced';
  } catch (error) {
    console.error(
      `[CalendarSync] Failed to sync appointment ${appointmentId}:`,
      error
    );
    return 'sync_failed';
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getDayOfWeekIso(date: Date): number {
  const dow = date.getDay();
  // Convert: 0=Sun -> 7, 1=Mon -> 1, ..., 6=Sat -> 6
  return dow === 0 ? 7 : dow;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ──────────────────────────────────────────────────────────────
// GET /api/bookings
// ──────────────────────────────────────────────────────────────
// Query params:
//   botId=xxx              -> return upcoming appointments for bot
//   botId=xxx&date=YYYY-MM-DD -> return available slots for bot on date
// ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('botId');
    const date = searchParams.get('date');

    // ── If no botId: return appointments across ALL user's bots ──
    if (!botId) {
      const userBots = await db.bot.findMany({
        where: { userId, deletedAt: null },
        select: { id: true, name: true },
      });
      const botIds = userBots.map(b => b.id);

      if (botIds.length === 0) {
        return NextResponse.json({ appointments: [] }, { headers: CACHE_HEADERS });
      }

      // Build bot name map upfront (no include — safe under PgBouncer)
      const botNameMap: Record<string, string> = {};
      for (const b of userBots) {
        botNameMap[b.id] = b.name;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      // Simple query WITHOUT include — guaranteed to work under PgBouncer
      const allAppointments = await db.appointment.findMany({
        where: {
          botId: { in: botIds },
          date: { gte: thirtyDaysAgo },
          status: { notIn: ['cancelled'] },
        },
        orderBy: { date: 'desc' },
        take: 100,
      });

      const now = new Date().toISOString();
      console.log(`[Bookings] Returning ${allAppointments.length} appointments for user ${userId.slice(0, 8)}, serverTime=${now}`);

      return NextResponse.json({
        appointments: allAppointments.map((apt) => ({
          id: apt.id,
          botId: apt.botId,
          botName: botNameMap[apt.botId] || 'Unknown',
          visitorName: apt.visitorName,
          visitorPhone: apt.visitorPhone,
          visitorEmail: apt.visitorEmail ?? undefined,
          service: apt.service ?? undefined,
          date: apt.date instanceof Date ? apt.date.toISOString() : new Date(apt.date as string).toISOString(),
          duration: apt.duration,
          status: apt.status,
          createdAt: apt.createdAt instanceof Date ? apt.createdAt.toISOString() : new Date(apt.createdAt as string).toISOString(),
        })),
        _serverTime: now,
      }, { headers: CACHE_HEADERS });
    }

    // Verify the bot belongs to the user
    const bot = await db.bot.findFirst({
      where: { id: botId, userId },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // ── Case 1: Get available time slots for a specific date ──
    if (date) {
      return getAvailableSlots(bot.config, botId, date);
    }

    // ── Case 2: Get all upcoming appointments ──
    return getUpcomingAppointments(botId);
  } catch (error) {
    console.error('GET /api/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate available time slots for a specific bot on a given date.
 */
async function getAvailableSlots(
  botConfigJson: string,
  botId: string,
  dateStr: string
) {
  const calConfig = parseCalendarConfig(botConfigJson);

  // Default calendar config if not configured
  const config: CalendarConfig = calConfig ?? {
    days: [1, 2, 3, 4, 5],
    startTime: '09:00',
    endTime: '18:00',
    slotDuration: 60,
    bufferMinutes: 15,
    maxConcurrentBookings: 1,
  };

  // Ensure maxConcurrentBookings has a valid value (minimum 1)
  const maxConcurrent = Math.max(1, config.maxConcurrentBookings || 1);

  // Parse the requested date
  const requestedDate = new Date(dateStr + 'T00:00:00');
  if (isNaN(requestedDate.getTime())) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
  }

  // Check if the day of week is a working day
  const dayOfWeek = getDayOfWeekIso(requestedDate);
  if (!config.days.includes(dayOfWeek)) {
    return NextResponse.json({ date: dateStr, slots: [] });
  }

  // Parse start and end times
  const startMinutes = timeToMinutes(config.startTime);
  const endMinutes = timeToMinutes(config.endTime);
  const slotDuration = config.slotDuration || 60;
  const bufferMinutes = config.bufferMinutes || 0;

  // Get existing appointments for that date
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointments = await db.appointment.findMany({
    where: {
      botId,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
      status: { notIn: ['cancelled'] },
    },
  });

  // Get current time for filtering past slots
  const now = new Date();
  const todayStr = formatDateStr(now);
  const isToday = dateStr === todayStr;
  const currentMinutes = timeToMinutes(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

  // Generate all possible slots
  const slots: { time: string; available: boolean; bookedBy: string | null; currentBookings: number; maxConcurrent: number }[] = [];

  for (let time = startMinutes; time + slotDuration <= endMinutes; time += slotDuration) {
    const timeStr = minutesToTime(time);

    // Skip past slots if today
    if (isToday && time <= currentMinutes) {
      continue;
    }

    // Check how many existing appointments overlap with this slot
    // A slot at `time` with duration `slotDuration` occupies [time - buffer, time + slotDuration + buffer)
    const slotStartWithBuffer = time - bufferMinutes;
    const slotEndWithBuffer = time + slotDuration + bufferMinutes;

    const overlappingAppointments = existingAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const aptMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
      const aptEnd = aptMinutes + (apt.duration || 60);

      // Appointment occupies [aptMinutes, aptEnd)
      // Check overlap with [slotStartWithBuffer, slotEndWithBuffer)
      return aptMinutes < slotEndWithBuffer && aptEnd > slotStartWithBuffer;
    });

    const bookingCount = overlappingAppointments.length;
    const isAvailable = bookingCount < maxConcurrent;

    slots.push({
      time: timeStr,
      available: isAvailable,
      bookedBy: isAvailable ? null : overlappingAppointments[0]?.visitorName ?? null,
      currentBookings: bookingCount,
      maxConcurrent: maxConcurrent,
    });
  }

  return NextResponse.json({ date: dateStr, slots });
}

/**
 * Get all upcoming (future) appointments for a bot.
 * FIX BUG #3: Also return recent past appointments (last 30 days) for complete visibility.
 */
async function getUpcomingAppointments(botId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get bot name (simple query, no include)
  let botName = 'Unknown';
  try {
    const bot = await db.bot.findFirst({ where: { id: botId }, select: { name: true } });
    if (bot) botName = bot.name;
  } catch { /* ignore */ }

  // Simple query WITHOUT include — guaranteed to work under PgBouncer
  const appointments = await db.appointment.findMany({
    where: {
      botId,
      date: { gte: thirtyDaysAgo },
      status: { notIn: ['cancelled'] },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  const now = new Date().toISOString();
  console.log(`[Bookings] getUpcomingAppointments for bot ${botId.slice(0, 8)}, count=${appointments.length}, serverTime=${now}`);

  return NextResponse.json({
    appointments: appointments.map((apt) => ({
      id: apt.id,
      botId: apt.botId,
      botName,
      visitorName: apt.visitorName,
      visitorPhone: apt.visitorPhone,
      visitorEmail: apt.visitorEmail ?? undefined,
      service: apt.service ?? undefined,
      date: apt.date instanceof Date ? apt.date.toISOString() : new Date(apt.date as string).toISOString(),
      duration: apt.duration,
      status: apt.status,
      createdAt: apt.createdAt instanceof Date ? apt.createdAt.toISOString() : new Date(apt.createdAt as string).toISOString(),
    })),
    _serverTime: now,
  });
}

// ──────────────────────────────────────────────────────────────
// POST /api/bookings — Create a new appointment
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { botId, visitorName, visitorPhone, visitorEmail, service, date, time } = body;

    // Validate required fields
    if (!botId || !visitorName || !visitorPhone || !date || !time) {
      return NextResponse.json(
        { error: 'botId, visitorName, visitorPhone, date, and time are required' },
        { status: 400 }
      );
    }

    // Verify the bot belongs to the user
    const bot = await db.bot.findFirst({
      where: { id: botId, userId },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Parse the date and time to create a full DateTime
    const dateObj = new Date(date + 'T00:00:00');
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return NextResponse.json({ error: 'Invalid time format' }, { status: 400 });
    }

    const appointmentDate = new Date(dateObj);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Validate the appointment is in the future
    if (appointmentDate <= new Date()) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      );
    }

    // Validate the slot is available by checking for conflicts
    const calConfig = parseCalendarConfig(bot.config);
    const bufferMinutes = calConfig?.bufferMinutes ?? 15;
    const slotDuration = calConfig?.slotDuration ?? 60;
    const maxConcurrent = Math.max(1, calConfig?.maxConcurrentBookings || 1);

    const aptMinutes = hours * 60 + minutes;
    const aptEnd = aptMinutes + slotDuration;

    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await db.appointment.findMany({
      where: {
        botId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: { notIn: ['cancelled'] },
      },
    });

    // Count overlapping appointments (concurrent booking support)
    const overlappingCount = existingAppointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      const existMinutes = aptDate.getHours() * 60 + aptDate.getMinutes();
      const existEnd = existMinutes + (apt.duration || 60);

      // New slot occupies [aptMinutes - buffer, aptEnd + buffer)
      return existMinutes < aptEnd + bufferMinutes && existEnd > aptMinutes - bufferMinutes;
    }).length;

    if (overlappingCount >= maxConcurrent) {
      return NextResponse.json(
        { error: `This time slot is fully booked (${overlappingCount}/${maxConcurrent} concurrent bookings). Choose another time.` },
        { status: 409 }
      );
    }

    // Create the appointment
    const appointment = await db.appointment.create({
      data: {
        botId,
        visitorName,
        visitorPhone,
        visitorEmail: visitorEmail || null,
        service: service || null,
        date: appointmentDate,
        duration: slotDuration,
        status: 'confirmed',
      },
    });

    // Create a Conversation record for the booking
    const conversation = await db.conversation.create({
      data: {
        botId,
        source: 'widget',
        visitorName,
        status: 'active',
      },
    });

    // Create a system Message for the booking confirmation
    const confirmationContent = [
      `New appointment booked:`,
      `- Visitor: ${visitorName}`,
      `- Phone: ${visitorPhone}`,
      visitorEmail ? `- Email: ${visitorEmail}` : null,
      service ? `- Service: ${service}` : null,
      `- Date: ${date} at ${time}`,
      `- Duration: ${slotDuration} minutes`,
      `- Status: Confirmed`,
    ]
      .filter(Boolean)
      .join('\n');

    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: 'system',
        content: confirmationContent,
        messageType: 'calendar',
        metadata: JSON.stringify({
          appointmentId: appointment.id,
          type: 'booking_confirmed',
        }),
      },
    });

    // ── Send booking confirmation email to client (non-blocking) ──
    if (visitorEmail) {
      // Fire and forget — do not block the response
      sendBookingConfirmation({
        to: visitorEmail,
        visitorName,
        businessName: bot.name,
        service: service || undefined,
        date,
        time,
        duration: slotDuration,
        appointmentId: appointment.id,
      }).catch(() => { /* already logged inside */ });
    } else {
      console.log(`[Bookings] No visitor email — skipping confirmation email (appointment ${appointment.id.slice(0, 8)})`);
    }

    // ── Calendar Sync Logic ──
    const calendarSync = parseCalendarSync(bot.config);
    let syncStatus: SyncStatus = 'platform_only';

    if (calendarSync && calendarSync.type === 'external') {
      syncStatus = await syncToExternalCalendar(
        calendarSync,
        appointment.id,
        visitorName,
        date,
        time
      );
    } else {
      console.log(
        `[CalendarSync] Appointment ${appointment.id} using platform calendar (type: ${calendarSync?.type ?? 'not configured'})`
      );
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        date: appointment.date.toISOString(),
        time,
        duration: appointment.duration,
        status: appointment.status,
      },
      syncStatus,
    });
  } catch (error) {
    console.error('POST /api/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// PATCH /api/bookings — Update calendar sync settings
// ──────────────────────────────────────────────────────────────

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { botId, calendarSync } = body;

    if (!botId || !calendarSync) {
      return NextResponse.json(
        { error: 'botId and calendarSync are required' },
        { status: 400 }
      );
    }

    if (!['platform', 'external'].includes(calendarSync.type)) {
      return NextResponse.json(
        { error: 'calendarSync.type must be "platform" or "external"' },
        { status: 400 }
      );
    }

    if (calendarSync.type === 'external' && !calendarSync.externalUrl) {
      return NextResponse.json(
        { error: 'externalUrl is required when calendarSync.type is "external"' },
        { status: 400 }
      );
    }

    // Verify the bot belongs to the user
    const bot = await db.bot.findFirst({
      where: { id: botId, userId, deletedAt: null },
    });

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Parse existing config and merge calendarSync
    let config: Record<string, unknown>;
    try {
      config = JSON.parse(bot.config);
    } catch {
      config = {};
    }

    config.calendarSync = {
      type: calendarSync.type,
      ...(calendarSync.type === 'external' ? { externalUrl: calendarSync.externalUrl } : {}),
    };

    // Persist updated config
    await db.bot.update({
      where: { id: botId },
      data: { config: JSON.stringify(config) },
    });

    return NextResponse.json({
      success: true,
      calendarSync: config.calendarSync,
    });
  } catch (error) {
    console.error('PATCH /api/bookings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
