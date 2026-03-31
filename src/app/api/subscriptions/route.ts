import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PLAN_CONFIG: Record<
  string,
  { price: number; days: number | null; label: string }
> = {
  monthly: { price: 29, days: 30, label: 'Monthly' },
  quarterly: { price: 74, days: 90, label: 'Quarterly' },
  yearly: { price: 244, days: 365, label: 'Yearly' },
  lifetime: { price: 499, days: null, label: 'Lifetime' },
};

// ──────────────────────────────────────────────────────────────
// GET /api/subscriptions — fetch current subscription + payments
// ──────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 401 });
  }

  try {
    const subscriptions = await db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const currentSub = subscriptions[0] ?? null;

    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({
      subscription: currentSub,
      payments,
    });
  } catch (error) {
    console.error('GET /api/subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/subscriptions — create / cancel subscription
// ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Missing x-user-id header' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { plan, action } = body as { plan?: string; action?: string };

    // ── Cancel subscription ──
    if (action === 'cancel') {
      const activeSubs = await db.subscription.findMany({
        where: { userId, status: 'active', plan: { not: 'demo' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      if (activeSubs.length === 0) {
        return NextResponse.json({ error: 'No active subscription to cancel' }, { status: 400 });
      }

      const sub = activeSubs[0];
      const updated = await db.subscription.update({
        where: { id: sub.id },
        data: { status: 'cancelled', autoRenew: false },
      });

      // Also update the user's plan
      await db.user.update({
        where: { id: userId },
        data: { planName: 'none', planStatus: 'cancelled' },
      });

      return NextResponse.json({
        subscription: updated,
        message: 'Subscription cancelled successfully',
      });
    }

    // ── New subscription / upgrade ──
    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be one of: monthly, quarterly, yearly, lifetime' },
        { status: 400 },
      );
    }

    const config = PLAN_CONFIG[plan];

    // Expire ALL existing active subscriptions (including demo)
    await db.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'expired', autoRenew: false },
    });

    // Clear demo period if exists
    await db.demoPeriod.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Calculate expiration
    const now = new Date();
    const expiresAt = config.days ? new Date(now.getTime() + config.days * 24 * 60 * 60 * 1000) : null;

    // Create subscription
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan,
        status: 'active',
        startsAt: now,
        expiresAt,
        autoRenew: plan !== 'lifetime',
        pricePaid: config.price,
      },
    });

    // Create payment record
    await db.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: config.price,
        currency: 'USD',
        plan,
        status: 'completed',
      },
    });

    // Update user — clear demoExpiresAt so the client stops showing demo banner
    await db.user.update({
      where: { id: userId },
      data: {
        planName: plan,
        planStatus: 'active',
        demoExpiresAt: null,
      },
    });

    return NextResponse.json({
      subscription,
      user: { planName: plan, planStatus: 'active', demoExpiresAt: null },
      message: `Successfully subscribed to ${config.label} plan`,
    });
  } catch (error) {
    console.error('POST /api/subscriptions error:', error);
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
