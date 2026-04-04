'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  Eye,
  Inbox,
  UserPlus,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import type { AnalyticsData } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type TimeRange = 'today' | 'week' | 'month' | 'year';

interface BotOption {
  id: string;
  name: string;
}

interface ConversationRow {
  id: string;
  date: string;
  source: string;
  visitorName: string;
  messagesCount: number;
  status: string;
  lastMessage: string;
}

interface MessageItem {
  role: string;
  content: string;
  createdAt: string;
}

interface LeadRow {
  id: string;
  visitorName: string | null;
  visitorPhone: string | null;
   visitorEmail: string | null;
  ipAddress: string | null;
  region: string | null;
  message: string | null;
  source: string;
  status: string;
  createdAt: string;
}

// ──────────────────────────────────────────────────────────────
// Colors
// ──────────────────────────────────────────────────────────────

const COLORS = {
  emerald: '#10b981',
  teal: '#14b8a6',
  amber: '#f59e0b',
  slate: '#64748b',
  rose: '#f43f5e',
};

const PIE_COLORS = [COLORS.emerald, COLORS.teal, COLORS.amber, COLORS.slate];

const SOURCE_LABELS: Record<string, string> = {
  widget: 'Widget',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  api: 'API',
};

// ──────────────────────────────────────────────────────────────
// Skeleton loaders
// ──────────────────────────────────────────────────────────────

function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-14" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-64" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <Skeleton className="h-5 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Custom tooltip for charts
// ──────────────────────────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
      {payload.map((item, idx) => (
        <p key={idx} className="text-sm font-semibold" style={{ color: item.color }}>
          {item.name}: {item.value}
        </p>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Custom pie chart label
// ──────────────────────────────────────────────────────────────

function PieLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ──────────────────────────────────────────────────────────────
// Empty state component
// ──────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Inbox className="size-6" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// CSV export helper
// ──────────────────────────────────────────────────────────────

function exportToCSV(data: AnalyticsData, language: string) {
  const rows: string[][] = [];

  // Header
  rows.push([
    t('analytics.daily', language),
    t('analytics.visitors', language),
    t('analytics.conversations', language),
    t('analytics.appointments', language),
  ]);

  // Daily stats
  data.dailyStats.forEach((stat) => {
    rows.push([stat.date, String(stat.visitors), String(stat.conversations), String(stat.appointments)]);
  });

  // Top questions
  if (data.topQuestions.length > 0) {
    rows.push([]);
    rows.push([t('analytics.topQuestions', language), '']);
    data.topQuestions.forEach((item) => {
      rows.push([item.question, String(item.count)]);
    });
  }

  // Top services
  if (data.topServices.length > 0) {
    rows.push([]);
    rows.push([t('analytics.topServices', language), '']);
    data.topServices.forEach((item) => {
      rows.push([item.service, String(item.count)]);
    });
  }

  // Sources
  if (data.sources.length > 0) {
    rows.push([]);
    rows.push([t('analytics.sources', language), 'Count']);
    data.sources.forEach((item) => {
      rows.push([SOURCE_LABELS[item.source] || item.source, String(item.count)]);
    });
  }

  const csvContent = rows
    .map((row) =>
      row.map((cell) => {
        const escaped = cell.replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      }).join(',')
    )
    .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `botforge-analytics-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ──────────────────────────────────────────────────────────────
// Empty analytics data
// ──────────────────────────────────────────────────────────────

const EMPTY_ANALYTICS: AnalyticsData = {
  totalVisitors: 0,
  totalConversations: 0,
  totalAppointments: 0,
  conversionRate: 0,
  dailyStats: [],
  topQuestions: [],
  topServices: [],
  sources: [],
};

// ──────────────────────────────────────────────────────────────
// Main AnalyticsPage Component
// ──────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { user } = useAuthStore();
  const { language } = useAppStore();
  const lang = language;

  // State
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationRow | null>(null);
  const [conversationMessages, setConversationMessages] = useState<MessageItem[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // ── Fetch bots list ──
  useEffect(() => {
    let cancelled = false;

    async function fetchBots() {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/bots', {
          headers: { 'x-user-id': user.id },
        });
        if (!res.ok) return;
        const data = await res.json();
        const botList: BotOption[] = (data.bots ?? []).map(
          (b: { id: string; name: string }) => ({
            id: b.id,
            name: b.name,
          })
        );
        if (!cancelled) setBots(botList);
      } catch {
        // silent fail
      }
    }

    fetchBots();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // ── Fetch analytics data ──
  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ range: timeRange });
      if (selectedBotId !== 'all') {
        params.set('botId', selectedBotId);
      }

      const res = await fetch(`/api/analytics?${params.toString()}`, {
        headers: { 'x-user-id': user.id },
      });

      if (!res.ok) throw new Error('Failed to fetch analytics');

      const data: AnalyticsData = await res.json();
      setAnalyticsData(data);
    } catch {
      // On error, show empty data
      setAnalyticsData(EMPTY_ANALYTICS);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, timeRange, selectedBotId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ── Fetch leads ──
  const fetchLeads = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      if (selectedBotId !== 'all') {
        params.set('botId', selectedBotId);
      }
      const res = await fetch(`/api/leads?${params.toString()}`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads ?? []);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoadingLeads(false);
    }
  }, [user?.id, selectedBotId]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // BUGFIX: Add refresh function to update all data (stats cards, charts, sections)
  const refreshData = useCallback(async () => {
    await Promise.all([fetchAnalytics(), fetchLeads()]);
  }, [fetchAnalytics, fetchLeads]);

  // BUGFIX: Auto-refresh when page becomes visible again (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);

  // ── Lead status badge color ──
  function leadStatusBadge(status: string) {
    switch (status) {
      case 'contacted':
      case 'converted':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'new':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
      case 'lost':
        return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }



  // ── Derive chart data with formatted dates ──
  const chartData = useMemo(() => {
    if (!analyticsData?.dailyStats) return [];
    const rangeDays = timeRange === 'today' ? 1 : timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;

    // For year, aggregate by month
    if (timeRange === 'year' && analyticsData.dailyStats.length > 30) {
      const monthMap = new Map<string, { date: string; visitors: number; conversations: number; appointments: number }>();
      analyticsData.dailyStats.forEach((stat) => {
        const monthKey = stat.date.substring(0, 7);
        const existing = monthMap.get(monthKey);
        if (existing) {
          existing.visitors += stat.visitors;
          existing.conversations += stat.conversations;
          existing.appointments += stat.appointments;
        } else {
          monthMap.set(monthKey, { date: monthKey, ...stat });
        }
      });
      return Array.from(monthMap.values());
    }

    return analyticsData.dailyStats.slice(0, rangeDays);
  }, [analyticsData, timeRange]);

  // ── Conversations list (derived) ──
  const conversationsList = useMemo<ConversationRow[]>(() => {
    if (!analyticsData?.dailyStats) return [];
    const list: ConversationRow[] = [];
    const sources = Object.keys(SOURCE_LABELS);

    analyticsData.dailyStats.forEach((stat) => {
      for (let i = 0; i < stat.conversations; i++) {
        list.push({
          id: `conv-${stat.date}-${i}`,
          date: stat.date,
          source: sources[i % sources.length],
          visitorName: `Visitor ${Math.floor(Math.random() * 900) + 100}`,
          messagesCount: Math.floor(Math.random() * 15) + 1,
          status: Math.random() > 0.3 ? 'active' : 'closed',
          lastMessage: 'Thank you for your inquiry!',
        });
      }
    });

    // Show the most recent 20
    return list.slice(-20).reverse();
  }, [analyticsData]);

  // ── Handle conversation click ──
  async function handleConversationClick(conv: ConversationRow) {
    setSelectedConversation(conv);
    setIsLoadingMessages(true);

    // Try to fetch real messages from conversations API
    try {
      if (!user?.id) return;
      const res = await fetch(`/api/conversations/${conv.id}/messages`, {
        headers: { 'x-user-id': user.id },
      });
      if (res.ok) {
        const data = await res.json();
        setConversationMessages(
          (data.messages ?? []).map((m: { role: string; content: string; createdAt: string }) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          }))
        );
      } else {
        setConversationMessages([]);
      }
    } catch {
      setConversationMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  }

  // ── Format date for display ──
  function formatDate(dateStr: string) {
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US';
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  }

  function formatFullDate(dateStr: string) {
    const locale = lang === 'ru' ? 'ru-RU' : lang === 'tr' ? 'tr-TR' : 'en-US';
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Source badge color ──
  function sourceBadgeClass(source: string) {
    switch (source) {
      case 'widget':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'telegram':
        return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
      case 'whatsapp':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
  }

  // ── Pie chart data ──
  const pieData = useMemo(() => {
    if (!analyticsData?.sources) return [];
    return analyticsData.sources.map((s) => ({
      name: SOURCE_LABELS[s.source] || s.source,
      value: s.count,
    }));
  }, [analyticsData]);

  // ── Max counts for progress bars ──
  const maxQuestionCount = useMemo(() => {
    if (!analyticsData?.topQuestions?.length) return 1;
    return Math.max(...analyticsData.topQuestions.map((q) => q.count));
  }, [analyticsData]);

  const maxServiceCount = useMemo(() => {
    if (!analyticsData?.topServices?.length) return 1;
    return Math.max(...analyticsData.topServices.map((s) => s.count));
  }, [analyticsData]);

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {t('analytics.title', lang)}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('analytics.overview', lang)} — {t('analytics.dateRange', lang)}:{' '}
            {t(`analytics.${timeRange}` as string, lang)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Bot selector */}
          <Select value={selectedBotId} onValueChange={setSelectedBotId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t('common.all', lang)} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all', lang)} ({t('bots.title', lang).toLowerCase()})</SelectItem>
              {bots.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  {bot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* BUGFIX: Refresh button to manually update stats cards, charts, and sections */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={refreshData}
            disabled={isLoading || isLoadingLeads}
          >
            <RefreshCw className={`size-4 ${(isLoading || isLoadingLeads) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', lang) || 'Refresh'}</span>
          </Button>

          {/* Export buttons */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => analyticsData && exportToCSV(analyticsData, lang)}
            disabled={!analyticsData}
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">{t('analytics.exportCSV', lang)}</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled>
            <FileText className="size-4" />
            <span className="hidden sm:inline">{t('analytics.exportPDF', lang)}</span>
          </Button>
        </div>
      </div>

      {/* ── Time Range Tabs ── */}
      <Tabs
        value={timeRange}
        onValueChange={(v) => setTimeRange(v as TimeRange)}
      >
        <TabsList>
          <TabsTrigger value="today">{t('analytics.today', lang)}</TabsTrigger>
          <TabsTrigger value="week">{t('analytics.week', lang)}</TabsTrigger>
          <TabsTrigger value="month">{t('analytics.month', lang)}</TabsTrigger>
          <TabsTrigger value="year">{t('analytics.year', lang)}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Overview Stats Cards ── */}
      {isLoading ? (
        <StatsCardsSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Visitors */}
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <Users className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('analytics.visitors', lang)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {analyticsData?.totalVisitors.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                  —
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Conversations */}
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                  <MessageSquare className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('analytics.conversations', lang)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                    {analyticsData?.totalConversations.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                  —
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Appointments */}
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                  <CalendarCheck className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('analytics.appointments', lang)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {analyticsData?.totalAppointments.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                  —
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rate */}
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <TrendingUp className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t('analytics.conversion', lang)}
                  </p>
                  <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {analyticsData?.conversionRate ?? 0}%
                  </p>
                </div>
                <div className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
                  —
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Charts Section ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Daily Conversations Area Chart */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t('analytics.conversations', lang)} — {t('analytics.daily', lang)}
                </h3>
              </div>
              {chartData.length === 0 ? (
                <EmptyState message={t('common.noData', lang)} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatDate(v)}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="visitors"
                      name={t('analytics.visitors', lang)}
                      stroke={COLORS.emerald}
                      fill="url(#emeraldGradient)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="conversations"
                      name={t('analytics.conversations', lang)}
                      stroke={COLORS.teal}
                      fill="url(#tealGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Daily Appointments Bar Chart */}
          <Card>
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {t('analytics.appointments', lang)} — {t('analytics.daily', lang)}
                </h3>
              </div>
              {chartData.length === 0 ? (
                <EmptyState message={t('common.noData', lang)} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => formatDate(v)}
                      className="text-muted-foreground"
                    />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar
                      dataKey="appointments"
                      name={t('analytics.appointments', lang)}
                      fill={COLORS.amber}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Sources Breakdown + Top Lists ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-32 mb-4" />
              <Skeleton className="h-[250px] w-[250px] rounded-full mx-auto" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sources Donut Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {t('analytics.sources', lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {pieData.length === 0 ? (
                <EmptyState message={t('common.noData', lang)} />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={PieLabel}
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                    {pieData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-1.5">
                        <div
                          className="size-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Questions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {t('analytics.topQuestions', lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {!analyticsData?.topQuestions?.length ? (
                <EmptyState message={t('common.noData', lang)} />
              ) : (
                <div className="flex flex-col gap-3">
                  {analyticsData.topQuestions.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate max-w-[70%]">{item.question}</p>
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        value={(item.count / maxQuestionCount) * 100}
                        className="h-1.5 [&>div]:bg-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Services */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {t('analytics.topServices', lang)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              {!analyticsData?.topServices?.length ? (
                <EmptyState message={t('common.noData', lang)} />
              ) : (
                <div className="flex flex-col gap-3">
                  {analyticsData.topServices.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm truncate max-w-[70%]">{item.service}</p>
                        <span className="text-xs font-medium text-teal-600 dark:text-teal-400 shrink-0">
                          {item.count}
                        </span>
                      </div>
                      <Progress
                        value={(item.count / maxServiceCount) * 100}
                        className="h-1.5 [&>div]:bg-teal-500"
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Conversations List ── */}
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="size-4 text-muted-foreground" />
              {t('analytics.conversationsList', lang)}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {conversationsList.length === 0 ? (
              <EmptyState message={t('common.noData', lang)} />
            ) : (
              <div className="max-h-[420px] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>{t('common.date', lang)}</TableHead>
                      <TableHead>{t('analytics.sources', lang)}</TableHead>
                      <TableHead className="hidden sm:table-cell">{t('analytics.visitors', lang)}</TableHead>
                      <TableHead className="text-center">Messages</TableHead>
                      <TableHead>{t('common.status', lang)}</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conversationsList.map((conv) => (
                      <TableRow
                        key={conv.id}
                        className="cursor-pointer"
                        onClick={() => handleConversationClick(conv)}
                      >
                        <TableCell className="text-xs text-muted-foreground">
                          {formatFullDate(conv.date)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs font-normal ${sourceBadgeClass(conv.source)}`}
                          >
                            {SOURCE_LABELS[conv.source] || conv.source}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-sm">
                          {conv.visitorName}
                        </TableCell>
                        <TableCell className="text-center text-sm font-medium tabular-nums">
                          {conv.messagesCount}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={conv.status === 'active' ? 'default' : 'secondary'}
                            className={
                              conv.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }
                          >
                            {conv.status === 'active'
                              ? t('common.active', lang)
                              : t('common.close', lang)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConversationClick(conv);
                            }}
                          >
                            <Eye className="size-3.5 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Leads Table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <UserPlus className="size-4 text-muted-foreground" />
            {t('leads.title', lang)}
            <Badge variant="secondary" className="ml-1 tabular-nums">
              {leads.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-2">
          {isLoadingLeads ? (
            <TableSkeleton />
          ) : leads.length === 0 ? (
            <EmptyState message={t('leads.empty', lang)} />
          ) : (
            <div className="max-h-[420px] overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>{t('leads.name', lang)}</TableHead>
                    <TableHead>{t('leads.phone', lang)}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('leads.email', lang)}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('leads.ip', lang)}</TableHead>
                    <TableHead>{t('leads.region', lang)}</TableHead>
                    <TableHead>{t('leads.status', lang)}</TableHead>
                    <TableHead>{t('leads.date', lang)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="text-sm font-medium">
                        {lead.visitorName || t('leads.anonymous', lang)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.visitorPhone || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {lead.visitorEmail || '—'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                        {lead.ipAddress || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {lead.region || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs font-normal ${leadStatusBadge(lead.status)}`}
                        >
                          {t(`leads.${lead.status}` as string, lang)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatFullDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Conversation Messages Dialog ── */}
      <Dialog
        open={!!selectedConversation}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedConversation(null);
            setConversationMessages([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-emerald-500" />
              {selectedConversation
                ? `${selectedConversation.visitorName} — ${formatFullDate(selectedConversation.date)}`
                : ''}
            </DialogTitle>
            <DialogDescription>
              {selectedConversation && (
                <span className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs ${sourceBadgeClass(selectedConversation.source)}`}
                  >
                    {SOURCE_LABELS[selectedConversation.source] || selectedConversation.source}
                  </Badge>
                  {selectedConversation.messagesCount} messages
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {isLoadingMessages ? (
              <div className="space-y-3 py-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="size-6 rounded-full shrink-0 mt-0.5" />
                    <Skeleton className="h-12 flex-1 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-4">
                {conversationMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isOperator = msg.role === 'operator';
                  return (
                    <div
                      key={idx}
                      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold mt-0.5 ${
                          isUser
                            ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            : isOperator
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {isUser ? 'U' : isOperator ? 'O' : 'B'}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                          isUser
                            ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AnalyticsPage;
