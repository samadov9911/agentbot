'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  Crown,
  CreditCard,
  Clock,
  Zap,
  ArrowRight,
  Shield,
  Star,
  X,
  AlertTriangle,
  Loader2,
  ChevronRight,
  CalendarDays,
  RefreshCcw,
  Sparkles,
  Infinity,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface SubscriptionData {
  id: string;
  userId: string;
  plan: 'demo' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  status: 'active' | 'expired' | 'cancelled';
  startsAt: string;
  expiresAt?: string | null;
  autoRenew: boolean;
  pricePaid?: number | null;
}

interface PaymentRecord {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  plan: string;
  status: string;
  createdAt: string;
}

interface PricingPlanConfig {
  id: 'monthly' | 'quarterly' | 'yearly' | 'lifetime';
  price: number;
  periodLabel: string;
  periodSub: string;
  savePercent?: number;
  popular?: boolean;
  icon: React.ElementType;
}

// ──────────────────────────────────────────────────────────────
// Plan definitions
// ──────────────────────────────────────────────────────────────

const PLAN_FEATURES: Record<string, string[]> = {
  monthly: [
    'subscription.unlimitedBots',
    'subscription.unlimitedConversations',
    'subscription.analyticsFull',
    'subscription.allChannels',
    'subscription.prioritySupport',
  ],
  quarterly: [
    'subscription.unlimitedBots',
    'subscription.unlimitedConversations',
    'subscription.analyticsFull',
    'subscription.allChannels',
    'subscription.prioritySupport',
    'subscription.apiAccess',
  ],
  yearly: [
    'subscription.unlimitedBots',
    'subscription.unlimitedConversations',
    'subscription.analyticsFull',
    'subscription.allChannels',
    'subscription.prioritySupport',
    'subscription.apiAccess',
    'subscription.whiteLabel',
  ],
  lifetime: [
    'subscription.unlimitedBots',
    'subscription.unlimitedConversations',
    'subscription.analyticsFull',
    'subscription.allChannels',
    'subscription.prioritySupport',
    'subscription.apiAccess',
    'subscription.whiteLabel',
    'subscription.apiAccess',
  ],
};

function getPricingPlans(lang: Language): PricingPlanConfig[] {
  return [
    {
      id: 'monthly',
      price: 29,
      periodLabel: `$29`,
      periodSub: t('subscription.perMonth', lang),
      icon: Zap,
    },
    {
      id: 'quarterly',
      price: 74,
      periodLabel: `$74`,
      periodSub: `3 ${t('subscription.monthsShort', lang)} — ${t('subscription.discount', lang)} 15%`,
      savePercent: 15,
      popular: true,
      icon: Star,
    },
    {
      id: 'yearly',
      price: 244,
      periodLabel: `$244`,
      periodSub: `1 ${t('subscription.yearShort', lang)} — ${t('subscription.discount', lang)} 30%`,
      savePercent: 30,
      icon: Shield,
    },
    {
      id: 'lifetime',
      price: 499,
      periodLabel: `$499`,
      periodSub: t('subscription.oneTime', lang),
      icon: Infinity,
    },
  ];
}

// ──────────────────────────────────────────────────────────────
// Demo timer hook
// ──────────────────────────────────────────────────────────────

function useDemoTimer() {
  const { user } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [tick, setTick] = useState(0);

  const calculateTimeLeft = useCallback(() => {
    const expiresAt = (user as Record<string, unknown> | null)?.demoExpiresAt as
      | string
      | undefined;

    if (!expiresAt) return null;

    const now = Date.now();
    const end = new Date(expiresAt).getTime();
    const diff = end - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      totalMs: diff,
      expired: false,
    };
  }, [user]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  void tick;
  return calculateTimeLeft();
}

// ──────────────────────────────────────────────────────────────
// Helper: plan name translation
// ──────────────────────────────────────────────────────────────

function getPlanLabel(plan: string, lang: Language): string {
  const keyMap: Record<string, string> = {
    demo: 'subscription.demoPlan',
    monthly: 'subscription.monthly',
    quarterly: 'subscription.quarterly',
    yearly: 'subscription.yearly',
    lifetime: 'subscription.lifetime',
  };
  return t(keyMap[plan] ?? plan, lang);
}

function getStatusBadge(status: string, lang: Language) {
  switch (status) {
    case 'active':
      return (
        <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
          {t('common.active', lang)}
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="destructive">
          {t('subscription.expired', lang)}
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          {t('subscription.cancelled', lang)}
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// ──────────────────────────────────────────────────────────────
// Skeleton loader
// ──────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-7 w-48" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export function SubscriptionPage() {
  const { user, updateUser } = useAuthStore();
  const { language } = useAppStore();
  const lang = language;

  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog states
  const [confirmPlan, setConfirmPlan] = useState<PricingPlanConfig | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const demoTimer = useDemoTimer();
  const hasDemoExpiry = !!((user as Record<string, unknown> | null)?.demoExpiresAt);
  const hasPaidPlan = !!((user as Record<string, unknown> | null)?.planName) && (user as Record<string, unknown> | null)?.planName !== 'demo' && (user as Record<string, unknown> | null)?.planName !== 'none';
  const isDemoUser = hasDemoExpiry && !hasPaidPlan;
  const isDemoActive = isDemoUser && demoTimer !== null && !demoTimer.expired;
  const isUrgentDemo = demoTimer !== null && !demoTimer.expired && demoTimer.totalMs < 24 * 60 * 60 * 1000;

  const pricingPlans = getPricingPlans(lang);
  const currentPlanId = subscription?.plan ?? (isDemoUser ? 'demo' : null);

  // ── Fetch subscription data ──
  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/subscriptions', {
        headers: { 'x-user-id': user.id },
      });

      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      setSubscription(data.subscription ?? null);
      setPayments(data.payments ?? []);
    } catch {
      // If API fails, use user data as fallback
      const userRecord = user as Record<string, unknown>;
      if (userRecord.planName && userRecord.planName !== 'none') {
        setSubscription({
          id: 'fallback',
          userId: user.id,
          plan: userRecord.planName as SubscriptionData['plan'],
          status: (userRecord.planStatus as SubscriptionData['status']) ?? 'active',
          startsAt: user.createdAt,
          expiresAt: null,
          autoRenew: true,
          pricePaid: null,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Payment simulation ──
  const handleSubscribe = async (planId: string) => {
    if (!user?.id || isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ plan: planId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Payment failed');
      }

      toast.success(data.message ?? t('common.success', lang));

      // Update user store immediately (clear demoExpiresAt so banner disappears)
      updateUser({ planName: planId, planStatus: 'active', demoExpiresAt: undefined });

      // Use API response directly for immediate UI update
      if (data.subscription) {
        setSubscription({
          id: data.subscription.id,
          userId: data.subscription.userId,
          plan: data.subscription.plan,
          status: data.subscription.status,
          startsAt: data.subscription.startsAt,
          expiresAt: data.subscription.expiresAt,
          autoRenew: data.subscription.autoRenew,
          pricePaid: data.subscription.pricePaid,
        });
      }

      // Also refresh payments list
      try {
        const refreshRes = await fetch('/api/subscriptions', {
          headers: { 'x-user-id': user.id },
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setPayments(refreshData.payments ?? []);
        }
      } catch {
        // Non-critical: payments list refresh failed
      }
      setConfirmPlan(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error', lang));
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Cancel subscription ──
  const handleCancel = async () => {
    if (!user?.id || isProcessing) return;
    setIsProcessing(true);

    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Cancellation failed');
      }

      toast.success(data.message ?? t('subscription.cancelled', lang));
      updateUser({ planName: 'none', planStatus: 'cancelled' });
      await fetchSubscription();
      setShowCancelDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('common.error', lang));
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Format date ──
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(
        lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US',
        { day: 'numeric', month: 'short', year: 'numeric' },
      );
    } catch {
      return dateStr;
    }
  };

  // ── Render ──

  if (isLoading) {
    return <PageSkeleton />;
  }

  const hasActiveSubscription = subscription && subscription.status === 'active' && subscription.plan !== 'demo';

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Crown className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('subscription.title', lang)}</h2>
            <p className="text-sm text-muted-foreground">{t('subscription.manageSubscription', lang)}</p>
          </div>
        </div>
      </div>

      {/* ── Demo Countdown Banner ── */}
      {isDemoActive && demoTimer && (
        <Card
          className={`overflow-hidden border-2 transition-all ${
            isUrgentDemo
              ? 'border-red-300 bg-gradient-to-r from-red-50 to-orange-50 dark:border-red-800 dark:from-red-950/50 dark:to-orange-950/50'
              : 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50'
          }`}
        >
          <CardContent className="p-0">
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-12 shrink-0 items-center justify-center rounded-full ${
                    isUrgentDemo
                      ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300'
                  }`}
                >
                  <Clock className="size-6" />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isUrgentDemo
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-emerald-900 dark:text-emerald-100'
                    }`}
                  >
                    {t('subscription.demoPlan', lang)} —{' '}
                    <span className="text-xs font-normal opacity-70">{t('subscription.demoDescription', lang)}</span>
                  </p>
                  {/* Large countdown display */}
                  <div className="mt-1 flex items-center gap-1.5">
                    {[
                      { value: demoTimer.days, label: t('dashboard.days', lang) },
                      { value: String(demoTimer.hours).padStart(2, '0'), label: t('dashboard.hours', lang) },
                      { value: String(demoTimer.minutes).padStart(2, '0'), label: t('dashboard.minutes', lang) },
                      { value: String(demoTimer.seconds).padStart(2, '0'), label: 's' },
                    ].map((item, idx) => (
                      <React.Fragment key={idx}>
                        <div
                          className={`flex flex-col items-center rounded-lg px-2 py-1 min-w-[3rem] ${
                            isUrgentDemo
                              ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              : 'bg-white/80 text-emerald-700 dark:bg-white/10 dark:text-emerald-300'
                          }`}
                        >
                          <span className="text-xl font-bold tabular-nums leading-tight">{item.value}</span>
                          <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.label}</span>
                        </div>
                        {idx < 3 && (
                          <span
                            className={`text-lg font-bold ${
                              isUrgentDemo ? 'text-red-400' : 'text-emerald-400'
                            }`}
                          >
                            :
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setConfirmPlan(pricingPlans[1])}
                className={`shrink-0 text-white ${
                  isUrgentDemo
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                }`}
              >
                {t('subscription.upgrade', lang)}
                <ArrowRight className="size-4" />
              </Button>
            </div>

            {/* Progress bar showing demo usage */}
            {demoTimer.totalMs > 0 && (
              <div className="px-4 pb-3">
                <Progress
                  value={Math.max(0, Math.min(100, ((7 * 24 * 60 * 60 * 1000 - demoTimer.totalMs) / (7 * 24 * 60 * 60 * 1000)) * 100))}
                  className={`h-1.5 ${isUrgentDemo ? '[&>div]:bg-red-500' : '[&>div]:bg-emerald-500'}`}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Current Plan Section ── */}
      {subscription && subscription.plan !== 'demo' && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg">{t('subscription.currentPlan', lang)}</CardTitle>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-950">
                  {getPlanLabel(subscription.plan, lang)}
                </Badge>
                {getStatusBadge(subscription.status, lang)}
              </div>
              {hasActiveSubscription && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-300"
                  onClick={() => setShowCancelDialog(true)}
                >
                  <X className="size-3.5" />
                  {t('subscription.cancelSubscription', lang)}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Plan start date */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <CalendarDays className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscription.startDate', lang)}
                  </p>
                  <p className="text-sm font-semibold">{formatDate(subscription.startsAt)}</p>
                </div>
              </div>

              {/* Expiration date */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <Clock className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {subscription.plan === 'lifetime'
                      ? t('subscription.forever', lang)
                      : t('subscription.expires', lang)}
                  </p>
                  <p className="text-sm font-semibold">
                    {subscription.plan === 'lifetime'
                      ? '∞'
                      : subscription.expiresAt
                        ? formatDate(subscription.expiresAt)
                        : '—'}
                  </p>
                </div>
              </div>

              {/* Auto-renew status */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <RefreshCcw className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscription.autoRenew', lang)}
                  </p>
                  <p className="text-sm font-semibold">
                    {subscription.autoRenew
                      ? t('subscription.enabled', lang)
                      : t('subscription.disabled', lang)}
                  </p>
                </div>
              </div>

              {/* Price paid */}
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <CreditCard className="size-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t('subscription.paid', lang)}
                  </p>
                  <p className="text-sm font-semibold">
                    {subscription.pricePaid ? `$${subscription.pricePaid}` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Features list */}
            {PLAN_FEATURES[subscription.plan] && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {t('subscription.features', lang)}:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PLAN_FEATURES[subscription.plan].map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    >
                      <Check className="size-3" />
                      {t(feat, lang)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Demo Plan Info Card (no active paid subscription) ── */}
      {!hasActiveSubscription && !isDemoActive && (
        <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
              <Sparkles className="size-7" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                {t('subscription.demoDescription', lang)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('subscription.selectPlanDesc', lang)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pricing Cards Section ── */}
      <div>
        <div className="mb-4 flex items-center gap-2">
          <h3 className="text-lg font-semibold">{t('landing.pricing', lang)}</h3>
          <Separator className="flex-1" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pricingPlans.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            const Icon = plan.icon;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-hidden transition-all hover:shadow-lg ${
                  plan.popular
                    ? 'border-emerald-300 ring-2 ring-emerald-500/20 dark:border-emerald-700'
                    : isCurrent
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30'
                      : 'hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute right-0 top-0">
                    <div className="bg-emerald-600 px-3 py-1 text-xs font-semibold text-white rounded-bl-lg">
                      {t('landing.pricingPopular', lang)}
                    </div>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Icon className="size-4" />
                    </div>
                    <CardTitle className="text-base">{getPlanLabel(plan.id, lang)}</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-0">{plan.periodSub}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Price */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.periodLabel}</span>
                    {plan.id !== 'lifetime' && (
                      <span className="text-sm text-muted-foreground">{t('subscription.perMonth', lang)}</span>
                    )}
                  </div>

                  {/* Save badge */}
                  {plan.savePercent && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {t('subscription.savePercent', lang, { percent: plan.savePercent })}
                    </Badge>
                  )}

                  <Separator />

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">{t('subscription.features', lang)}:</p>
                    <ul className="space-y-1.5">
                      {PLAN_FEATURES[plan.id]?.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                          <span>{t(feat, lang)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  {isCurrent && (
                    <Button className="w-full" variant="outline" disabled>
                      <Check className="size-4" />
                      {t('subscription.currentPlanBtn', lang)}
                    </Button>
                  )}
                  {!isCurrent && (
                    <Button
                      className={`w-full text-white ${
                        plan.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                          : 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600'
                      }`}
                      onClick={() => setConfirmPlan(plan)}
                    >
                      {t('subscription.selectBtn', lang)}
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Payment History ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="size-4 text-muted-foreground" />
            {t('subscription.paymentHistory', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                <CreditCard className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">{t('common.noData', lang)}</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Check className="size-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{getPlanLabel(payment.plan, lang)}</p>
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            payment.status === 'completed'
                              ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300'
                              : ''
                          }`}
                        >
                          {payment.status === 'completed'
                            ? t('subscription.paid', lang)
                            : payment.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums">${payment.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Payment Confirmation Dialog ── */}
      <Dialog open={!!confirmPlan} onOpenChange={(open) => !open && setConfirmPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-emerald-600" />
              {t('subscription.paymentConfirm', lang)}
            </DialogTitle>
            <DialogDescription>
              {t('subscription.paymentConfirmDesc', lang)}
            </DialogDescription>
          </DialogHeader>

          {confirmPlan && (
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('subscription.plan', lang)}</span>
                <span className="font-semibold">{getPlanLabel(confirmPlan.id, lang)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('subscription.amount', lang)}</span>
                <span className="text-xl font-bold text-emerald-600">${confirmPlan.price}</span>
              </div>
              {confirmPlan.periodSub && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('subscription.period', lang)}</span>
                    <span className="text-sm">{confirmPlan.periodSub}</span>
                  </div>
                </>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PLAN_FEATURES[confirmPlan.id]?.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    <Check className="size-2.5" />
                    {t(feat, lang)}
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setConfirmPlan(null)} disabled={isProcessing}>
              {t('common.cancel', lang)}
            </Button>
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              onClick={() => confirmPlan && handleSubscribe(confirmPlan.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="size-4" />
              )}
              {isProcessing
                ? t('common.loading', lang)
                : `${t('subscription.pay', lang)} $${confirmPlan?.price ?? 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Subscription Alert Dialog ── */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500" />
              {t('subscription.cancelSubscription', lang)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscription.cancelConfirmDesc', lang)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>{t('common.cancel', lang)}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <X className="size-4" />
              )}
              {t('subscription.cancelSubscription', lang)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SubscriptionPage;
