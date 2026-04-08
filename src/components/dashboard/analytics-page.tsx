'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  MessageSquare,
  CalendarCheck,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
  AlertCircle,
  Bot,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ChartDataPoint {
  date: string;
  conversations: number;
  appointments: number;
  leads: number;
}

interface ActivityItem {
  id: string;
  message: string;
  timestamp: string;
  createdAt?: string;
  type: string;
}

interface AnalyticsData {
  stats: {
    activeBots: number;
    conversationsToday: number;
    appointmentsToday: number;
    leadsToday: number;
  };
  totalConversations: number;
  totalAppointments: number;
  chartData: ChartDataPoint[];
  activity: ActivityItem[];
  lastUpdated?: string;
}

// Auto-refresh interval: 30 seconds
const REFRESH_INTERVAL_MS = 30_000;

// ──────────────────────────────────────────────────────────────
// Skeleton
// ──────────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
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
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Analytics Page
// ──────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { user } = useAuthStore();
  const { language, setPage } = useAppStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  const fetchAnalytics = useCallback(async (showLoader = true) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?range=${range}`, {
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      setData(result);
      if (result.lastUpdated) {
        setLastUpdated(result.lastUpdated);
      } else {
        setLastUpdated(new Date().toISOString());
      }
    } catch (err) {
      console.error('[Analytics] Fetch error:', err);
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, range]);

  // Fetch on mount and when range changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Auto-refresh every 30 seconds (only when page is visible)
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(false);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [fetchAnalytics]);

  // Refresh when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAnalytics]);

  // Format last updated time
  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return null;
    const d = new Date(lastUpdated);
    return d.toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [lastUpdated, language]);

  if (isLoading) return <AnalyticsSkeleton />;

  // ── Error state ──
  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">
                {label('Аналитика', 'Analytics', 'Analitik')}
              </h2>
              <p className="text-xs text-muted-foreground">
                {label('Статистика вашего бота', 'Your bot statistics', 'Bot istatistikleriniz')}
              </p>
            </div>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center">
            <AlertCircle className="size-10 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {label('Ошибка загрузки данных', 'Failed to load data', 'Veri yüklenemedi')}
              </p>
              <p className="mt-1 text-xs text-red-600/70 dark:text-red-500/70">
                {error}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAnalytics(true)}
              className="gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              {label('Повторить', 'Retry', 'Tekrar dene')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats;
  const chartData = data?.chartData ?? [];
  const activity = data?.activity ?? [];
  const hasAnyData = (stats?.activeBots ?? 0) > 0 ||
    (stats?.conversationsToday ?? 0) > 0 ||
    (stats?.appointmentsToday ?? 0) > 0 ||
    (stats?.leadsToday ?? 0) > 0 ||
    (data?.totalConversations ?? 0) > 0 ||
    (data?.totalAppointments ?? 0) > 0 ||
    activity.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {label('Аналитика', 'Analytics', 'Analitik')}
            </h2>
            <p className="text-xs text-muted-foreground">
              {label('Статистика вашего бота', 'Your bot statistics', 'Bot istatistikleriniz')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">{label('Сегодня', 'Today', 'Bugün')}</SelectItem>
              <SelectItem value="week">{label('Неделя', 'This week', 'Bu hafta')}</SelectItem>
              <SelectItem value="month">{label('Месяц', 'This month', 'Bu ay')}</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => fetchAnalytics(true)}
            disabled={isLoading}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Last updated indicator */}
      {lastUpdated && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className={`size-1.5 rounded-full ${isLoading ? 'bg-amber-400' : 'bg-emerald-400'}`} />
          {label('Обновлено', 'Updated', 'Güncellendi')}: {formatLastUpdated()}
        </div>
      )}

      {/* ── Empty state: no bots at all ── */}
      {!hasAnyData && (stats?.activeBots ?? 0) === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Bot className="size-7" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {label('У вас пока нет ботов', "You don't have any bots yet", 'Henüz botunuz yok')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                {label(
                  'Создайте первого бота, чтобы начать получать статистику',
                  'Create your first bot to start seeing statistics',
                  'İstatistik görmeye başlamak için ilk botunuzu oluşturun'
                )}
              </p>
            </div>
            <Button size="sm" onClick={() => setPage('bot-builder')} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Bot className="size-4" />
              {label('Создать бота', 'Create bot', 'Bot oluştur')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <TrendingUp className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label('Активные боты', 'Active bots', 'Aktif botlar')}
                </p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats?.activeBots ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <MessageSquare className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label('Диалоги', 'Conversations', 'Görüşmeler')}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats?.conversationsToday ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <CalendarCheck className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label('Записи', 'Appointments', 'Randevular')}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats?.appointmentsToday ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Users className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {label('Лиды', 'Leads', 'Müşteri adayları')}
                </p>
                <p className="text-2xl font-bold tabular-nums">
                  {stats?.leadsToday ?? 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Chart ── */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {label('График за 7 дней', '7-day chart', '7 günlük grafik')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {chartData.length > 0 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 11 }} />
                  <YAxis className="text-xs" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px' }}
                    formatter={(value: string) =>
                      label(value, value, value)
                    }
                  />
                  <Bar
                    dataKey="conversations"
                    name={label('Диалоги', 'Conversations', 'Görüşmeler')}
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="appointments"
                    name={label('Записи', 'Appointments', 'Randevular')}
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="leads"
                    name={label('Лиды', 'Leads', 'Müşteri adayları')}
                    fill="#8b5cf6"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <BarChart3 className="size-10 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                {label('Нет данных за этот период', 'No data for this period', 'Bu dönem için veri yok')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Total stats summary (below chart) ── */}
      {(data?.totalConversations ?? 0) > 0 || (data?.totalAppointments ?? 0) > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900">
            <CardContent className="p-4 flex items-center gap-3">
              <MessageSquare className="size-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {label('Всего диалогов', 'Total conversations', 'Toplam görüşme')}
                </p>
                <p className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {data?.totalConversations ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900">
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarCheck className="size-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {label('Всего записей', 'Total appointments', 'Toplam randevu')}
                </p>
                <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {data?.totalAppointments ?? 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* ── Recent Activity ── */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle className="text-base">
            {label('Последняя активность', 'Recent activity', 'Son etkinlikler')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {stats?.activeBots
                  ? label(
                      'Активность появится после взаимодействия с виджетом',
                      'Activity will appear after widget interactions',
                      'Widget etkileşimlerinden sonra aktivite görünecektir'
                    )
                  : label('Нет активности', 'No activity', 'Etkinlik yok')
                }
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="flex flex-col gap-1">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        item.type === 'conversation'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : item.type === 'appointment'
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                            : 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400'
                      }`}
                    >
                      {item.type === 'conversation' ? (
                        <MessageSquare className="size-3.5" />
                      ) : item.type === 'appointment' ? (
                        <CalendarCheck className="size-3.5" />
                      ) : (
                        <Users className="size-3.5" />
                      )}
                    </div>
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
    </div>
  );
}

export default AnalyticsPage;
