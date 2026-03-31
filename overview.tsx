'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  MessageSquare,
  CalendarCheck,
  CreditCard,
  Plus,
  BarChart3,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface BotSummary {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  conversationsCount: number;
}

interface DashboardStats {
  activeBots: number;
  conversationsToday: number;
  appointmentsToday: number;
  planName: string;
  planStatus: string;
}

interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  type: 'conversation' | 'appointment' | 'bot' | 'system';
}

// ──────────────────────────────────────────────────────────────
// Empty state when no bots
// ──────────────────────────────────────────────────────────────

const EMPTY_ACTIVITY: ActivityItem[] = [
  {
    id: 'welcome',
    message: 'Добро пожаловать в AgentBot! Создайте своего первого ИИ агента.',
    timestamp: '',
    type: 'system',
  },
];

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
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      expired: false,
    };
  }, [user]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60_000);

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
// Activity icon helper
// ──────────────────────────────────────────────────────────────

function ActivityIcon({ type }: { type: ActivityItem['type'] }) {
  switch (type) {
    case 'conversation':
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
          <MessageSquare className="size-3.5" />
        </div>
      );
    case 'appointment':
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
          <CalendarCheck className="size-3.5" />
        </div>
      );
    case 'bot':
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <Bot className="size-3.5" />
        </div>
      );
    default:
      return (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <Sparkles className="size-3.5" />
        </div>
      );
  }
}

// ──────────────────────────────────────────────────────────────
// Skeleton loaders
// ──────────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="size-5 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <Card>
      <CardHeader className="pb-0">
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-52" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Overview Component
// ──────────────────────────────────────────────────────────────

export function DashboardOverview() {
  const { user } = useAuthStore();
  const { language, setPage } = useAppStore();

  const [bots, setBots] = useState<BotSummary[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const demoTimer = useDemoTimer();
  const isDemoActive = demoTimer !== null && !demoTimer.expired;

  // ── Fetch bots on mount ──
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboardData() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/bots', {
          headers: { 'x-user-id': user.id },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch bots');
        }

        const data = await response.json();
        const botList: BotSummary[] = (data.bots ?? []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          name: b.name as string,
          type: b.type as string,
          isActive: b.isActive as boolean,
          conversationsCount: (b.conversationsCount as number) ?? 0,
        }));

        if (cancelled) return;

        setBots(botList);

        // Compute stats from bots
        const activeBots = botList.filter((b) => b.isActive).length;
        const conversationsToday = botList.reduce((sum, b) => sum + b.conversationsCount, 0);

        const userRecord = user as Record<string, unknown>;
        const planName = (userRecord.demoExpiresAt ? 'Demo' : userRecord.planName ?? 'Free') as string;
        const planStatus = userRecord.demoExpiresAt ? 'demo' : (userRecord.planStatus ?? 'inactive') as string;

        setStats({
          activeBots,
          conversationsToday,
          appointmentsToday: 0,
          planName,
          planStatus,
        });

        // Show empty activity for new users
        setActivity([]);
      } catch {
        setStats({
          activeBots: 0,
          conversationsToday: 0,
          appointmentsToday: 0,
          planName: 'Demo',
          planStatus: 'demo',
        });
        setActivity([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Derived values ──
  const userName = user?.name ?? user?.email ?? 'User';
  const formattedDate = new Date().toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const planBadgeVariant = stats?.planStatus === 'active'
    ? 'default'
    : stats?.planStatus === 'demo'
      ? 'outline'
      : 'secondary';

  const planBadgeClass = stats?.planStatus === 'demo'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
    : stats?.planStatus === 'active'
      ? 'bg-emerald-600 text-white'
      : '';

  // ── Quick Actions ──
  const quickActions = [
    {
      id: 'create-bot',
      label: t('dashboard.createBot', language),
      description: t('dashboard.noBots', language),
      icon: Plus,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      page: 'bot-builder' as const,
    },
    {
      id: 'view-stats',
      label: t('dashboard.viewStats', language),
      description: t('analytics.conversations', language),
      icon: BarChart3,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
      page: 'analytics' as const,
    },
    {
      id: 'manage-sub',
      label: t('subscription.manageSubscription', language),
      description: t('dashboard.upgradePrompt', language),
      icon: CreditCard,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      page: 'subscription' as const,
    },
  ];

  // ── Render ──

  return (
    <div className="flex flex-col gap-6">
      {/* ── Welcome Section ── */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {t('dashboard.welcome', language)}, {userName}!
        </h2>
        <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
      </div>

      {/* ── Demo Banner ── */}
      {isDemoActive && demoTimer && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-teal-950/50">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  {t('dashboard.demoExpires', language)}{' '}
                  <span className="font-bold tabular-nums">
                    {demoTimer.days}{t('dashboard.days', language)}{' '}
                    {String(demoTimer.hours).padStart(2, '0')}{t('dashboard.hours', language)}{' '}
                    {String(demoTimer.minutes).padStart(2, '0')}{t('dashboard.minutes', language)}
                  </span>
                </p>
                <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70">
                  {t('dashboard.upgradePrompt', language)}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setPage('subscription')}
              className="bg-emerald-600 text-white hover:bg-emerald-700 shrink-0 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {t('subscription.upgrade', language)}
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Stats Cards ── */}
      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Active Bots */}
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Bot className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('dashboard.activeBots', language)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {stats?.activeBots ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversations Today */}
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <MessageSquare className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('dashboard.totalConversations', language)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.conversationsToday ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appointments Today */}
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <CalendarCheck className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('dashboard.appointments', language)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums">
                    {stats?.appointmentsToday ?? 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Status */}
          <Card className="group transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <CreditCard className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('dashboard.subscriptionStatus', language)}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-bold truncate">
                      {stats?.planName ?? 'Free'}
                    </p>
                    <Badge variant={planBadgeVariant} className={planBadgeClass}>
                      {stats?.planStatus === 'active'
                        ? t('common.active', language)
                        : stats?.planStatus === 'demo'
                          ? 'Demo'
                          : t('common.inactive', language)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Quick Actions ── */}
      {isLoading ? (
        <QuickActionsSkeleton />
      ) : (
        <div>
          <h3 className="mb-3 text-base font-semibold tracking-tight">
            {t('dashboard.quickActions', language)}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Card
                  key={action.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800"
                  onClick={() => setPage(action.page)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${action.iconBg}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{action.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.description}
                        </p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Recent Activity ── */}
      {isLoading ? (
        <ActivitySkeleton />
      ) : (
        <Card>
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-muted-foreground" />
              {t('dashboard.recentActivity', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2">
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <Clock className="size-6" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('common.noData', language)}
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  {activity.slice(0, 5).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <ActivityIcon type={item.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{item.message}</p>
                        <p className="text-xs text-muted-foreground">{item.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardOverview;
