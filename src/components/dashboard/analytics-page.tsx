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
  Phone,
  Mail,
  Clock,
  Search,
  ExternalLink,
  X,
  ChevronRight,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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

interface ConversationItem {
  id: string;
  botId: string;
  botName: string;
  visitorName: string;
  source: string;
  status: string;
  messageCount: number;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentItem {
  id: string;
  botId: string;
  botName: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  service?: string;
  date: string;
  duration: number;
  status: string;
  createdAt: string;
}

interface LeadItem {
  id: string;
  botId: string;
  botName?: string;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  message?: string;
  source?: string;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  messageType: string;
  createdAt: string;
}

interface ChatConversation {
  id: string;
  visitorName: string;
  source: string;
  status: string;
  createdAt: string;
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

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-60" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
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
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState('today');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Dialog list state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convSearch, setConvSearch] = useState('');
  const [convDebug, setConvDebug] = useState<string | null>(null);

  // Appointments list state
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [aptLoading, setAptLoading] = useState(false);

  // Leads list state
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');

  // Chat history state
  const [selectedConv, setSelectedConv] = useState<ConversationItem | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatConv, setChatConv] = useState<ChatConversation | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Fetch chat messages for a conversation ──
  const openChatHistory = useCallback(async (conv: ConversationItem) => {
    if (!user?.id) return;
    setSelectedConv(conv);
    setChatLoading(true);
    setChatMessages([]);
    setChatConv(null);
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages?_t=${Date.now()}`, {
        headers: { 'x-user-id': user.id },
        cache: 'no-store',
      });
      console.log(`[Analytics] Fetching chat messages for conv=${conv.id.slice(0, 8)}, status=${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`[Analytics] Chat response: conv=${!!data.conversation}, msgs=${data.messages?.length}`);
        setChatConv(data.conversation || null);
        setChatMessages(data.messages || []);
      } else {
        console.error('[Analytics] Chat messages fetch error:', res.status, await res.text().catch(() => ''));
      }
    } catch (err) {
      console.error('[Analytics] Chat messages fetch error:', err);
    } finally {
      setChatLoading(false);
    }
  }, [user?.id]);

  // Scroll to bottom when messages load
  useEffect(() => {
    if (chatMessages.length > 0 && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatLoading]);

  const label = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  // ── Fetch analytics stats ──
  const fetchAnalytics = useCallback(async (showLoader = true) => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?range=${range}&_t=${Date.now()}`, {
        headers: { 'x-user-id': user.id },
        cache: 'no-store',
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

  // ── Fetch conversations list ──
  const fetchConversations = useCallback(async () => {
    if (!user?.id) {
      console.warn('[Analytics] fetchConversations skipped: no user.id');
      return;
    }
    setConvLoading(true);
    try {
      const res = await fetch(`/api/conversations?_t=${Date.now()}`, {
        headers: { 'x-user-id': user.id },
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error(`[Analytics] Conversations API returned ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data.conversations) ? data.conversations : [];
      setConversations(items);
      console.log(`[Analytics] Loaded ${items.length} conversations (user=${user.id.slice(0, 8)})`);

      // If empty, run diagnostics to find the root cause
      if (items.length === 0) {
        try {
          const debugRes = await fetch('/api/debug/conversations', {
            headers: { 'x-user-id': user.id },
          });
          if (debugRes.ok) {
            const debugData = await debugRes.json();
            const debugMsg = `Bots: ${debugData.botsCount} | Conv: ${debugData.totalConversations} | Apt: ${debugData.totalAppointments} | Leads: ${debugData.totalLeads}`;
            console.log('[Analytics Debug]', debugData);
            setConvDebug(debugMsg);
            if (debugData.recentConversations?.length > 0) {
              setConvDebug(prev => prev + ` | Recent: ${debugData.recentConversations.map((c: { visitorName: string; source: string; status: string }) => `${c.visitorName}(${c.source}/${c.status})`).join(', ')}`);
            }
          } else {
            const errText = await debugRes.text().catch(() => 'unknown error');
            setConvDebug(`Debug API error: ${debugRes.status} ${errText}`);
          }
        } catch (debugErr) {
          console.error('[Analytics] Debug fetch error:', debugErr);
        }
      } else {
        setConvDebug(null);
      }
    } catch (err) {
      console.error('[Analytics] Conversations fetch error:', err);
      setConversations([]);
    } finally {
      setConvLoading(false);
    }
  }, [user?.id]);

  // ── Fetch appointments list ──
  const fetchAppointments = useCallback(async () => {
    if (!user?.id) {
      console.warn('[Analytics] fetchAppointments skipped: no user.id');
      return;
    }
    setAptLoading(true);
    try {
      const res = await fetch(`/api/bookings?_t=${Date.now()}`, {
        headers: { 'x-user-id': user.id },
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error(`[Analytics] Appointments API returned ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data.appointments) ? data.appointments : [];
      setAppointments(items);
      console.log(`[Analytics] Loaded ${items.length} appointments (user=${user.id.slice(0, 8)})`);
    } catch (err) {
      console.error('[Analytics] Appointments fetch error:', err);
      setAppointments([]);
    } finally {
      setAptLoading(false);
    }
  }, [user?.id]);

  // ── Fetch leads list ──
  const fetchLeads = useCallback(async () => {
    if (!user?.id) {
      console.warn('[Analytics] fetchLeads skipped: no user.id');
      return;
    }
    setLeadsLoading(true);
    try {
      const res = await fetch(`/api/leads?_t=${Date.now()}`, {
        headers: { 'x-user-id': user.id },
        cache: 'no-store',
      });
      if (!res.ok) {
        console.error(`[Analytics] Leads API returned ${res.status}`);
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const items = Array.isArray(data.leads) ? data.leads : [];
      setLeads(items);
      console.log(`[Analytics] Loaded ${items.length} leads (user=${user.id.slice(0, 8)})`);
    } catch (err) {
      console.error('[Analytics] Leads fetch error:', err);
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  }, [user?.id]);

  // ── Refresh all data ──
  const refreshAll = useCallback(() => {
    fetchAnalytics(true);
    fetchConversations();
    fetchAppointments();
    fetchLeads();
  }, [fetchAnalytics, fetchConversations, fetchAppointments, fetchLeads]);

  // Fetch on mount and when range changes
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Fetch lists on mount
  useEffect(() => {
    if (user?.id) {
      fetchConversations();
      fetchAppointments();
      fetchLeads();
    }
  }, [user?.id, fetchConversations, fetchAppointments, fetchLeads]);

  // Auto-refresh every 30 seconds (only when page is visible)
  useEffect(() => {
    refreshTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(false);
        fetchConversations();
        fetchAppointments();
        fetchLeads();
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [fetchAnalytics, fetchConversations, fetchAppointments, fetchLeads]);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalytics(false);
        fetchConversations();
        fetchAppointments();
        fetchLeads();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAnalytics, fetchConversations, fetchAppointments, fetchLeads]);

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

  // Format date/time for list items
  const formatDateTime = useCallback((isoStr: string) => {
    const d = new Date(isoStr);
    const locale = language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US';
    const dateStr = d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    return `${dateStr}, ${timeStr}`;
  }, [language]);

  const formatDate = useCallback((isoStr: string) => {
    const d = new Date(isoStr);
    const locale = language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US';
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  }, [language]);

  const formatTime = useCallback((isoStr: string) => {
    const d = new Date(isoStr);
    const locale = language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US';
    return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }, [language]);

  // Filter conversations by search
  const filteredConversations = conversations.filter((c) => {
    if (!convSearch.trim()) return true;
    const q = convSearch.toLowerCase();
    return (
      (c.visitorName || '').toLowerCase().includes(q) ||
      (c.botName || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  });

  // Filter leads by search
  const filteredLeads = leads.filter((l) => {
    if (!leadsSearch.trim()) return true;
    const q = leadsSearch.toLowerCase();
    return (
      (l.visitorName || '').toLowerCase().includes(q) ||
      (l.visitorPhone || '').toLowerCase().includes(q) ||
      (l.visitorEmail || '').toLowerCase().includes(q) ||
      (l.message || '').toLowerCase().includes(q)
    );
  });

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
  const hasAnyData = (stats?.activeBots ?? 0) > 0 ||
    (stats?.conversationsToday ?? 0) > 0 ||
    (stats?.appointmentsToday ?? 0) > 0 ||
    (stats?.leadsToday ?? 0) > 0 ||
    (data?.totalConversations ?? 0) > 0 ||
    (data?.totalAppointments ?? 0) > 0;

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
            onClick={refreshAll}
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

      {/* ── Tabs: Overview / Dialogs / Appointments / Leads ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            <BarChart3 className="size-3.5 mr-1.5 hidden sm:inline-block" />
            {label('Обзор', 'Overview', 'Genel')}
          </TabsTrigger>
          <TabsTrigger value="dialogs" className="text-xs sm:text-sm">
            <MessageSquare className="size-3.5 mr-1.5 hidden sm:inline-block" />
            {label('Диалоги', 'Dialogs', 'Görüşmeler')}
            {conversations.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {conversations.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs sm:text-sm">
            <CalendarCheck className="size-3.5 mr-1.5 hidden sm:inline-block" />
            {label('Записи', 'Bookings', 'Randevular')}
            {appointments.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {appointments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-xs sm:text-sm">
            <Users className="size-3.5 mr-1.5 hidden sm:inline-block" />
            {label('Лиды', 'Leads', 'Adaylar')}
            {leads.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 h-4">
                {leads.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: Overview                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="overview" className="flex flex-col gap-6 mt-4">
          {/* Chart */}
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-base">
                {label('График за 14 дней', '14-day chart', '14 günlük grafik')}
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
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
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
                        name={label('Лиды', 'Leads', 'Adaylar')}
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

          {/* Total stats summary */}
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


        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: Dialogs                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="dialogs" className="flex flex-col gap-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={label('Поиск по диалогам...', 'Search dialogs...', 'Görüşme ara...')}
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Refresh button */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {label(
                `${filteredConversations.length} из ${conversations.length} диалогов`,
                `${filteredConversations.length} of ${conversations.length} dialogs`,
                `${conversations.length} görüşmeden ${filteredConversations.length}`
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchConversations}
              disabled={convLoading}
              className="gap-1.5 text-xs"
            >
              {convLoading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {label('Обновить', 'Refresh', 'Yenile')}
            </Button>
          </div>

          {convLoading && conversations.length === 0 ? (
            <ListSkeleton />
          ) : filteredConversations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <MessageSquare className="size-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {convSearch
                    ? label('Ничего не найдено', 'Nothing found', 'Hiçbir şey bulunamadı')
                    : label(
                        'Диалогов пока нет. Они появятся после общения клиентов с виджетом.',
                        'No dialogs yet. They will appear after clients interact with the widget.',
                        'Henüz görüşme yok. Müşteriler widget ile etkileşime girdiğinde görünecektir.'
                      )
                  }
                </p>
                {convDebug && !convSearch && (
                  <p className="text-[10px] text-muted-foreground/50 font-mono max-w-md break-all">{convDebug}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-2">
              {filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="transition-all hover:shadow-sm cursor-pointer hover:bg-accent/50 group"
                  onClick={() => openChatHistory(conv)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                        <MessageSquare className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{conv.visitorName}</p>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {conv.botName}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 ${
                              conv.status === 'active'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'border-muted'
                            }`}
                          >
                            {conv.status === 'active' ? label('Активен', 'Active', 'Aktif') : conv.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {conv.lastMessage}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {conv.messageCount} {label('сообщ.', 'msgs', 'msj')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatDateTime(conv.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ExternalLink className="size-3" />
                            {conv.source}
                          </span>
                          <ChevronRight className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: Appointments                                        */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="appointments" className="flex flex-col gap-4 mt-4">
          {/* Refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {label(
                `Всего записей: ${appointments.length}`,
                `Total bookings: ${appointments.length}`,
                `Toplam randevu: ${appointments.length}`
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAppointments}
              disabled={aptLoading}
              className="gap-1.5 text-xs"
            >
              {aptLoading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {label('Обновить', 'Refresh', 'Yenile')}
            </Button>
          </div>

          {aptLoading && appointments.length === 0 ? (
            <ListSkeleton />
          ) : appointments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <CalendarCheck className="size-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {label(
                    'Записей пока нет. Клиенты могут записаться через виджет бота.',
                    'No appointments yet. Clients can book through the bot widget.',
                    'Henüz randevu yok. Müşteriler bot widgetı üzerinden randevu alabilir.'
                  )}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-2">
              {appointments.map((apt) => {
                const statusConfig: Record<string, { label: string; className: string }> = {
                  confirmed: {
                    label: label('Подтверждена', 'Confirmed', 'Onaylandı'),
                    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
                  },
                  pending: {
                    label: label('Ожидает', 'Pending', 'Beklemede'),
                    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                  },
                  cancelled: {
                    label: label('Отменена', 'Cancelled', 'İptal edildi'),
                    className: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
                  },
                  completed: {
                    label: label('Завершена', 'Completed', 'Tamamlandı'),
                    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                  },
                };
                const status = statusConfig[apt.status] ?? statusConfig.pending;

                return (
                  <Card key={apt.id} className="transition-shadow hover:shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                          <CalendarCheck className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold truncate">{apt.visitorName}</p>
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {apt.botName}
                            </Badge>
                            <Badge className={`text-[10px] px-1.5 py-0 border-0 ${status.className}`}>
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <Clock className="size-3" />
                              {formatDate(apt.date)} &middot; {formatTime(apt.date)}
                              {apt.duration ? ` (${apt.duration} ${label('мин.', 'min', 'dk')})` : ''}
                            </span>
                            {apt.service && (
                              <span>{apt.service}</span>
                            )}
                            {apt.visitorPhone && (
                              <span className="flex items-center gap-1.5">
                                <Phone className="size-3" />
                                {apt.visitorPhone}
                              </span>
                            )}
                            {apt.visitorEmail && (
                              <span className="flex items-center gap-1.5">
                                <Mail className="size-3" />
                                {apt.visitorEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: Leads                                              */}
        {/* ═══════════════════════════════════════════════════════ */}
        <TabsContent value="leads" className="flex flex-col gap-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={label('Поиск по лидам...', 'Search leads...', 'Aday ara...')}
              value={leadsSearch}
              onChange={(e) => setLeadsSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {label(
                `${filteredLeads.length} из ${leads.length} лидов`,
                `${filteredLeads.length} of ${leads.length} leads`,
                `${leads.length} adaydan ${filteredLeads.length}`
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLeads}
              disabled={leadsLoading}
              className="gap-1.5 text-xs"
            >
              {leadsLoading ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
              {label('Обновить', 'Refresh', 'Yenile')}
            </Button>
          </div>

          {leadsLoading && leads.length === 0 ? (
            <ListSkeleton />
          ) : filteredLeads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <Users className="size-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {leadsSearch
                    ? label('Ничего не найдено', 'Nothing found', 'Hiçbir şey bulunamadı')
                    : label(
                        'Лидов пока нет. Они появляются когда клиенты оставляют контакты.',
                        'No leads yet. They appear when clients leave their contact info.',
                        'Henüz aday yok. Müşteriler iletişim bilgilerini bıraktığında görünecektir.'
                      )
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="max-h-[600px] overflow-y-auto flex flex-col gap-2">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="transition-shadow hover:shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                        <Users className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold truncate">{lead.visitorName || label('Клиент', 'Client', 'Müşteri')}</p>
                          {lead.botName && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {lead.botName}
                            </Badge>
                          )}
                          <Badge
                            variant="outline"
                            className={`text-[10px] px-1.5 py-0 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`}
                          >
                            {lead.status === 'new' ? label('Новый', 'New', 'Yeni') : lead.status}
                          </Badge>
                          {lead.source && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {lead.source}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
                          {lead.visitorPhone && (
                            <span className="flex items-center gap-1.5">
                              <Phone className="size-3" />
                              {lead.visitorPhone}
                            </span>
                          )}
                          {lead.visitorEmail && (
                            <span className="flex items-center gap-1.5">
                              <Mail className="size-3" />
                              {lead.visitorEmail}
                            </span>
                          )}
                          {lead.message && (
                            <p className="mt-1 text-xs text-muted-foreground/80 line-clamp-2 italic">
                              &ldquo;{lead.message}&rdquo;
                            </p>
                          )}
                          <span className="flex items-center gap-1.5 mt-1">
                            <Clock className="size-3" />
                            {formatDateTime(lead.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* Sheet: Chat History                                       */}
      {/* ═══════════════════════════════════════════════════════ */}
      <Sheet open={!!selectedConv} onOpenChange={(open) => { if (!open) setSelectedConv(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-[520px] p-0 flex flex-col">
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                <MessageSquare className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base truncate">
                  {selectedConv?.visitorName || chatConv?.visitorName || label('Клиент', 'Client', 'Müşteri')}
                </SheetTitle>
                <SheetDescription className="text-xs flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                    {selectedConv?.botName}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      (selectedConv?.status || chatConv?.status) === 'active'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-muted'
                    }`
                  }
                  >
                    {(selectedConv?.status || chatConv?.status) === 'active' ? label('Активен', 'Active', 'Aktif') : (selectedConv?.status || chatConv?.status)}
                  </Badge>
                  {chatConv?.createdAt && (
                    <span className="text-muted-foreground">
                      {formatDateTime(chatConv.createdAt)}
                    </span>
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Messages area */}
          <div className="flex-1 min-h-0 overflow-hidden relative">
            {chatLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {label('Загрузка сообщений...', 'Loading messages...', 'Mesajlar yükleniyor...')}
                </p>
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6">
                <MessageSquare className="size-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  {label('Сообщений нет', 'No messages', 'Mesaj yok')}
                </p>
              </div>
            ) : (
              <div className="absolute inset-0 overflow-y-auto">
                <div className="flex flex-col gap-3 p-5">
                  {/* Date separator */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {chatConv?.createdAt
                        ? new Date(chatConv.createdAt).toLocaleDateString(
                            language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )
                        : ''}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {chatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    const isSystem = msg.role === 'system';
                    const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
                    const showAvatar = !prevMsg || prevMsg.role !== msg.role;

                    // Group timestamp: show only if > 2 min gap from previous
                    const showTime = !prevMsg ||
                      Math.abs(new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) > 120_000;

                    if (isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {msg.content}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.id} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} ${showTime ? 'mt-3' : ''}`}>
                        {/* Avatar */}
                        {showAvatar && (
                          <div className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold mt-0.5 ${
                            isUser
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                          }`}>
                            {isUser
                              ? (selectedConv?.visitorName?.[0]?.toUpperCase() || 'K')
                              : <Bot className="size-3.5" />}
                          </div>
                        )}
                        {!showAvatar && <div className="w-7 shrink-0" />}

                        {/* Bubble */}
                        <div className={`max-w-[80%] ${showAvatar ? '' : ''}`}>
                          <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                            isUser
                              ? 'bg-emerald-600 text-white dark:bg-emerald-500 rounded-tr-md'
                              : 'bg-muted rounded-tl-md'
                          }`}>
                            {msg.content}
                          </div>
                          {showTime && (
                            <p className={`text-[10px] text-muted-foreground mt-1 ${isUser ? 'text-right mr-1' : 'ml-1'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString(
                                language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US',
                                { hour: '2-digit', minute: '2-digit' }
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-5 py-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">
                {label(
                  `${chatMessages.length} сообщений`,
                  `${chatMessages.length} messages`,
                  `${chatMessages.length} mesaj`
                )}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConv(null)}
                className="gap-1.5 text-xs"
              >
                <X className="size-3.5" />
                {label('Закрыть', 'Close', 'Kapat')}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AnalyticsPage;
