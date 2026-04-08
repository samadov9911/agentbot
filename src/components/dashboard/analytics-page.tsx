'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  MessageSquare,
  CalendarCheck,
  Users,
  TrendingUp,
  RefreshCw,
  Loader2,
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
  activity: Array<{
    id: string;
    message: string;
    timestamp: string;
    type: string;
  }>;
}

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
  const { language } = useAppStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState('today');

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/analytics?range=${range}`, {
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const result = await res.json();
      setData(result);
    } catch {
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) return <AnalyticsSkeleton />;

  const stats = data?.stats;
  const chartData = data?.chartData ?? [];
  const activity = data?.activity ?? [];

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
            onClick={fetchAnalytics}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Chart */}
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
                {label('Нет данных', 'No data', 'Veri yok')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
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
                {label('Нет активности', 'No activity', 'Etkinlik yok')}
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <div className="flex flex-col gap-1">
                {activity.slice(0, 10).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        item.type === 'conversation'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                      }`}
                    >
                      {item.type === 'conversation' ? (
                        <MessageSquare className="size-3.5" />
                      ) : (
                        <CalendarCheck className="size-3.5" />
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
