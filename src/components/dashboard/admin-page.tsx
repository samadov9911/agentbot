'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Eye,
  UserCog,
  Ban,
  ShieldCheck,
  BarChart3,
  Clock,
  Trash2,
  Copy,
  Bot,
  Activity,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Code2,
  RefreshCw,
  LayoutDashboard,
  FileText,
  Shield,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string;
  isActive: boolean;
  botsCount: number;
  createdAt: string;
}

interface AdminLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  activeSubscriptions: number;
  totalBots: number;
  totalConversations: number;
  totalAppointments: number;
  mrr: number;
  arr: number;
}

interface EmbedCodeBot {
  id: string;
  name: string;
  type: string;
  niche: string | null;
  isActive: boolean;
  ownerName: string;
  ownerEmail: string;
}

interface EmbedCodeRecord {
  id: string;
  code: string;
  botId: string;
  isActive: boolean;
  createdBy: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  bot: EmbedCodeBot | null;
}

// ──────────────────────────────────────────────────────────────
// Tab definitions
// ──────────────────────────────────────────────────────────────

type AdminTab = 'admin' | 'admin-users' | 'admin-analytics' | 'admin-logs' | 'admin-embed';

const TAB_ITEMS: { id: AdminTab; labelKey: string; icon: React.ElementType }[] = [
  { id: 'admin', labelKey: 'admin.title', icon: LayoutDashboard },
  { id: 'admin-users', labelKey: 'admin.users', icon: Users },
  { id: 'admin-analytics', labelKey: 'admin.analytics', icon: BarChart3 },
  { id: 'admin-logs', labelKey: 'admin.logs', icon: FileText },
  { id: 'admin-embed', labelKey: 'admin.embedCodes', icon: Code2 },
];

// ──────────────────────────────────────────────────────────────
// API fetch helper
// ──────────────────────────────────────────────────────────────

async function fetchAdminData<T>(section: string, userId: string): Promise<T> {
  const res = await fetch(`/api/admin?section=${section}`, {
    headers: { 'x-user-id': userId },
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────────────────────────────
// Action type badge helper
// ──────────────────────────────────────────────────────────────

function actionBadgeClass(action: string) {
  switch (action) {
    case 'create':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
    case 'update':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
    case 'delete':
    case 'block':
      return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
    case 'unblock':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300';
    case 'login':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300';
    case 'export':
      return 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
}

function actionLabel(actionType: string) {
  const labels: Record<string, string> = {
    create: 'Создание',
    update: 'Обновление',
    delete: 'Удаление',
    block: 'Блокировка',
    unblock: 'Разблокировка',
    login: 'Вход',
    export: 'Экспорт',
  };
  return labels[actionType] ?? actionType;
}

function embedStatusBadge(isActive: boolean, lang: string) {
  if (isActive) {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">{t('common.active', lang)}</Badge>;
  }
  return <Badge variant="secondary">{t('common.inactive', lang)}</Badge>;
}

function userStatusBadge(isActive: boolean, lang: string) {
  if (isActive) {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">{t('common.active', lang)}</Badge>;
  }
  return <Badge variant="secondary">{t('common.inactive', lang)}</Badge>;
}

function roleBadge(role: string) {
  switch (role) {
    case 'admin':
      return <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-100">Admin</Badge>;
    case 'user':
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">User</Badge>;
    default:
      return <Badge variant="secondary">{role}</Badge>;
  }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ──────────────────────────────────────────────────────────────
// Skeleton Loaders
// ──────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-5 w-48 mb-6" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-full max-w-sm" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────────────────────────

function OverviewTab({ lang, onNavigate }: { lang: string; onNavigate: (tab: AdminTab) => void }) {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [userCount, setUserCount] = useState<number>(0);
  const [logCount, setLogCount] = useState<number>(0);
  const [embedCodeCount, setEmbedCodeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function load() {
      try {
        const [analyticsData, usersData, logsData, embedData] = await Promise.all([
          fetchAdminData<{ totalUsers: number; activeUsers: number; activeSubscriptions: number; totalBots: number; totalConversations: number; totalAppointments: number; mrr: number; arr: number }>('analytics', user.id),
          fetchAdminData<{ users: AdminUser[] }>('users', user.id),
          fetchAdminData<{ logs: AdminLog[] }>('logs', user.id),
          fetchAdminData<{ embedCodes: EmbedCodeRecord[] }>('embed', user.id),
        ]);
        if (!cancelled) {
          setAnalytics(analyticsData);
          setUserCount(usersData.users.length);
          setLogCount(logsData.logs.length);
          setEmbedCodeCount(embedData.embedCodes.length);
        }
      } catch (err) {
        console.error('Failed to load overview data:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const stats = useMemo(() => {
    const a = analytics;
    return [
      {
        label: t('admin.totalUsers', lang),
        value: a ? String(a.totalUsers) : '0',
        icon: Users,
        bgColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
        textColor: 'text-emerald-600 dark:text-emerald-400',
      },
      {
        label: t('admin.activeUsers', lang),
        value: a ? String(a.activeUsers) : '0',
        icon: Activity,
        bgColor: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
        textColor: 'text-teal-600 dark:text-teal-400',
      },
      {
        label: t('admin.mrr', lang),
        value: a ? `$${a.mrr.toLocaleString()}` : '$0',
        icon: DollarSign,
        bgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
        textColor: 'text-amber-600 dark:text-amber-400',
      },
      {
        label: t('admin.totalBots', lang),
        value: a ? String(a.totalBots) : '0',
        icon: Bot,
        bgColor: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
        textColor: 'text-violet-600 dark:text-violet-400',
      },
    ];
  }, [analytics, lang]);

  const quickLinks = useMemo(() => [
    { id: 'admin-users' as AdminTab, label: t('admin.users', lang), description: t('admin.userManagementDesc', lang), icon: Users, count: userCount },
    { id: 'admin-analytics' as AdminTab, label: t('admin.analytics', lang), description: t('admin.analyticsStatsDesc', lang), icon: BarChart3, count: null },
    { id: 'admin-logs' as AdminTab, label: t('admin.logs', lang), description: t('admin.activityLogDesc', lang), icon: FileText, count: logCount },
    { id: 'admin-embed' as AdminTab, label: t('admin.embedCodes', lang), description: t('admin.embedManagementDesc', lang), icon: Code2, count: embedCodeCount },
  ], [lang, userCount, logCount, embedCodeCount]);

  if (isLoading) return <OverviewSkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${stat.textColor}`}>{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            {t('admin.quickAccess', lang)}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className="group flex flex-col gap-3 rounded-lg border p-4 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm dark:hover:border-emerald-800 dark:hover:bg-emerald-950/20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900 transition-colors">
                      <Icon className="size-4" />
                    </div>
                    {link.count !== null && (
                      <Badge variant="secondary" className="text-xs tabular-nums">{link.count}</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{link.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{link.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Users Management Tab
// ──────────────────────────────────────────────────────────────

function UsersTab({ lang }: { lang: string }) {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const perPage = 6;

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadUsers() {
      try {
        const data = await fetchAdminData<{ users: AdminUser[] }>('users', user.id);
        if (!cancelled) setUsers(data.users);
      } catch (err) {
        if (!cancelled) setError(t('admin.failedUsers', lang));
        console.error('Failed to load users:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadUsers();
    return () => { cancelled = true; };
  }, [user?.id]);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        result = result.filter((u) => u.isActive);
      } else if (statusFilter === 'inactive') {
        result = result.filter((u) => !u.isActive);
      }
    }
    return result;
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  const handleRoleFilterChange = useCallback((value: string) => {
    setRoleFilter(value);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleBlockToggle = useCallback(async (userId: string, currentIsActive: boolean) => {
    if (!user?.id) return;
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          action: currentIsActive ? 'block_user' : 'unblock_user',
          targetUserId: userId,
          details: { action: currentIsActive ? 'block' : 'unblock' },
        }),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isActive: !currentIsActive } : u
        )
      );
      setBlockingId(null);
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, isActive: !currentIsActive } : prev);
      }
    } catch (err) {
      console.error('Failed to toggle block:', err);
    }
  }, [user?.id, selectedUser]);

  const handleImpersonate = useCallback((userId: string) => {
    setImpersonating(userId);
    setTimeout(() => setImpersonating(null), 2000);
  }, []);

  if (isLoading) return <UsersTableSkeleton />;

  return (
    <div className="flex flex-col gap-4">
      {/* Error banner */}
      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`${t('common.search', lang)}...`}
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('admin.role', lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', lang)}</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('common.status', lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', lang)}</SelectItem>
                <SelectItem value="active">{t('common.active', lang)}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive', lang)}</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-10 px-3 shrink-0 tabular-nums">
              {filteredUsers.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[250px]">{t('common.name', lang)}</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">{t('admin.company', lang)}</TableHead>
                  <TableHead>{t('admin.role', lang)}</TableHead>
                  <TableHead>{t('common.status', lang)}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('common.date', lang)}</TableHead>
                  <TableHead className="text-right">{t('common.actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      {t('common.noData', lang)}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((u) => (
                    <TableRow key={u.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {getInitials(u.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden truncate">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{u.company || '—'}</TableCell>
                      <TableCell>{roleBadge(u.role)}</TableCell>
                      <TableCell>{userStatusBadge(u.isActive, lang)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setSelectedUser(u)}
                            title={t('admin.details', lang)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleImpersonate(u.id)}
                            disabled={impersonating === u.id}
                            title={t('admin.impersonate', lang)}
                          >
                            <UserCog className={`size-4 ${impersonating === u.id ? 'text-emerald-500' : ''}`} />
                          </Button>
                          {u.isActive ? (
                            <AlertDialog open={blockingId === u.id} onOpenChange={(open) => setBlockingId(open ? u.id : null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                  <Ban className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-red-500" />
                                    {t('admin.blockUser', lang)}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('admin.blockConfirm', lang, { email: u.email })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel', lang)}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleBlockToggle(u.id, u.isActive)}
                                  >
                                    {t('admin.blockUser', lang)}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => handleBlockToggle(u.id, u.isActive)}
                              title={t('admin.unblockUser', lang)}
                            >
                              <ShieldCheck className="size-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredUsers.length)} {t('admin.of', lang)} {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? 'default' : 'outline'}
                size="icon"
                className="size-8"
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </Button>
            )).slice(
              Math.max(0, page - 3),
              Math.min(totalPages, page + 2)
            )}
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* User Details Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('admin.userDetails', lang)}</DialogTitle>
            <DialogDescription>{t('admin.userDetailsDesc', lang)}</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-sm font-semibold">
                    {getInitials(selectedUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('admin.company', lang)}</p>
                  <p className="font-medium">{selectedUser.company || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('admin.role', lang)}</p>
                  {roleBadge(selectedUser.role)}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('common.status', lang)}</p>
                  {userStatusBadge(selectedUser.isActive, lang)}
                </div>
                <div>
                  <p className="text-muted-foreground">{t('bots.title', lang)}</p>
                  <p className="font-medium">{selectedUser.botsCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t('admin.registrationDate', lang)}</p>
                  <p className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString('ru-RU')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">{t('admin.id', lang)}</p>
                  <p className="font-mono text-xs text-muted-foreground bg-muted rounded px-2 py-1 inline-block">{selectedUser.id}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Platform Analytics Tab
// ──────────────────────────────────────────────────────────────

function AnalyticsTab({ lang }: { lang: string }) {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadAnalytics() {
      try {
        const data = await fetchAdminData<AnalyticsData>('analytics', user.id);
        if (!cancelled) setAnalytics(data);
      } catch (err) {
        if (!cancelled) setError(t('admin.failedAnalytics', lang));
        console.error('Failed to load analytics:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadAnalytics();
    return () => { cancelled = true; };
  }, [user?.id]);

  const a = analytics;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 rounded-lg" /></CardContent></Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-[260px] w-full rounded-lg" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* MRR / ARR / Users / Bots Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <DollarSign className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.mrr', lang)}</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  ${a ? a.mrr.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
                <TrendingUp className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.arr', lang)}</p>
                <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">
                  ${a ? a.arr.toLocaleString() : '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Users className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.totalUsers', lang)}</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {a ? a.totalUsers : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Bot className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.totalBots', lang)}</p>
                <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">
                  {a ? a.totalBots : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Platform Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              Статистика платформы
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-4">
              {[
                { label: t('admin.activeUsers', lang), value: a?.activeUsers ?? 0, color: '#10b981' },
                { label: 'Активные подписки', value: a?.activeSubscriptions ?? 0, color: '#14b8a6' },
                { label: 'Всего диалогов', value: a?.totalConversations ?? 0, color: '#f59e0b' },
                { label: 'Всего записей', value: a?.totalAppointments ?? 0, color: '#8b5cf6' },
              ].map((item) => {
                const maxValue = Math.max(a?.totalUsers ?? 1, a?.totalConversations ?? 1, a?.totalAppointments ?? 1, 1);
                return (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">{item.value}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* MRR & Subscriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
              Финансовые показатели
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-6">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground mb-1">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  ${a ? a.mrr.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Annual: ${a ? a.arr.toLocaleString() : '0'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Подписки</p>
                  <p className="text-2xl font-bold tabular-nums">{a?.activeSubscriptions ?? 0}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Диалоги</p>
                  <p className="text-2xl font-bold tabular-nums">{a?.totalConversations ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Logs Tab
// ──────────────────────────────────────────────────────────────

const LOG_ACTION_TYPES = ['all', 'create', 'update', 'delete', 'block', 'unblock', 'login', 'export'];

function LogsTab({ lang }: { lang: string }) {
  const { user } = useAuthStore();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [actionFilter, setActionFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function loadLogs() {
      try {
        const data = await fetchAdminData<{ logs: AdminLog[] }>('logs', user.id);
        if (!cancelled) setLogs(data.logs);
      } catch (err) {
        if (!cancelled) setError('Не удалось загрузить журналы');
        console.error('Failed to load logs:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadLogs();
    return () => { cancelled = true; };
  }, [user?.id]);

  const filteredLogs = useMemo(() => {
    if (actionFilter === 'all') return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card><CardContent className="p-4"><Skeleton className="h-10 w-64" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-[400px] w-full rounded-lg" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('admin.logs', lang)}</span>
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t('common.type', lang)} />
              </SelectTrigger>
              <SelectContent>
                {LOG_ACTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? t('common.all', lang) : actionLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-10 px-3 shrink-0 tabular-nums">
              {filteredLogs.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="max-h-[600px]">
            <div className="divide-y">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12">
                  <FileText className="size-8 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">{t('common.noData', lang)}</p>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const logDate = new Date(log.createdAt);
                  const timeStr = logDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                      <div className="mt-0.5 shrink-0">
                        {log.action === 'create' ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : log.action === 'update' || log.action === 'export' || log.action === 'unblock' ? (
                          <RefreshCw className="size-4 text-amber-500" />
                        ) : log.action === 'login' ? (
                          <Shield className="size-4 text-violet-500" />
                        ) : (
                          <XCircle className="size-4 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[11px] px-1.5 py-0 border-0 ${actionBadgeClass(log.action)}`}>
                            {actionLabel(log.action)}
                          </Badge>
                          <span className="text-xs font-medium text-muted-foreground">{log.adminEmail}</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">{log.details}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {timeStr}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Embed Codes Tab
// ──────────────────────────────────────────────────────────────

function EmbedCodesTab({ lang }: { lang: string }) {
  const { user } = useAuthStore();
  const [embedCodes, setEmbedCodes] = useState<EmbedCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadEmbedCodes = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await fetchAdminData<{ embedCodes: EmbedCodeRecord[] }>('embed', user.id);
      setEmbedCodes(data.embedCodes);
    } catch (err) {
      setError('Не удалось загрузить коды внедрения');
      console.error('Failed to load embed codes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadEmbedCodes();
  }, [loadEmbedCodes]);

  const filteredCodes = useMemo(() => {
    let result = embedCodes;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ec) =>
          ec.code.toLowerCase().includes(q) ||
          ec.bot?.name.toLowerCase().includes(q) ||
          ec.bot?.ownerName.toLowerCase().includes(q) ||
          ec.bot?.ownerEmail.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') {
      result = result.filter((ec) => ec.isActive);
    } else if (statusFilter === 'inactive') {
      result = result.filter((ec) => !ec.isActive);
    }
    return result;
  }, [embedCodes, search, statusFilter]);

  const handleCopy = useCallback(async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleRevoke = useCallback(async (embedCodeId: string) => {
    if (!user?.id) return;
    setProcessingId(embedCodeId);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          action: 'revoke_embed_code',
          embedCodeId,
          details: { action: 'revoke_embed_code', embedCodeId },
        }),
      });
      if (res.ok) {
        // Remove from list — revoked codes are no longer returned by API
        setEmbedCodes((prev) => prev.filter((ec) => ec.id !== embedCodeId));
      }
    } catch (err) {
      console.error('Failed to revoke embed code:', err);
    } finally {
      setProcessingId(null);
    }
  }, [user?.id]);

  const handleActivate = useCallback(async (embedCodeId: string) => {
    if (!user?.id) return;
    setProcessingId(embedCodeId);
    try {
      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          action: 'activate_embed_code',
          embedCodeId,
          details: { action: 'activate_embed_code', embedCodeId },
        }),
      });
      setEmbedCodes((prev) =>
        prev.map((ec) =>
          ec.id === embedCodeId
            ? { ...ec, isActive: true, revokedAt: null }
            : ec
        )
      );
    } catch (err) {
      console.error('Failed to activate embed code:', err);
    } finally {
      setProcessingId(null);
    }
  }, [user?.id]);

  const handleRegenerate = useCallback(async (embedCodeId: string) => {
    if (!user?.id) return;
    setProcessingId(embedCodeId);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
        body: JSON.stringify({
          action: 'regenerate_embed_code',
          embedCodeId,
          details: { action: 'regenerate_embed_code', embedCodeId },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.code) {
        setEmbedCodes((prev) =>
          prev.map((ec) =>
            ec.id === embedCodeId
              ? { ...ec, code: data.data.code, isActive: true, revokedAt: null }
              : ec
          )
        );
      }
    } catch (err) {
      console.error('Failed to regenerate embed code:', err);
    } finally {
      setProcessingId(null);
    }
  }, [user?.id]);

  const activeCount = embedCodes.filter((ec) => ec.isActive).length;
  const inactiveCount = embedCodes.filter((ec) => !ec.isActive).length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Card><CardContent className="p-4"><Skeleton className="h-12 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Error banner */}
      {error && (
        <Card className="border-red-200 dark:border-red-900">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="size-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Code2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.totalEmbedCodes', lang) || 'Всего кодов'}</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{embedCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.activeEmbedCodes', lang) || 'Активных'}</p>
                <p className="text-2xl font-bold tabular-nums text-sky-600 dark:text-sky-400">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <XCircle className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.inactiveEmbedCodes', lang) || 'Неактивных'}</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{inactiveCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`${t('common.search', lang)}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('common.status', lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', lang)}</SelectItem>
                <SelectItem value="active">{t('common.active', lang)}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive', lang)}</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="h-10 px-3 shrink-0 tabular-nums">
              {filteredCodes.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="min-w-[140px]">{t('admin.embedCode', lang) || 'Код'}</TableHead>
                  <TableHead>{t('admin.botName', lang) || 'Бот'}</TableHead>
                  <TableHead className="hidden md:table-cell">{t('admin.owner', lang) || 'Владелец'}</TableHead>
                  <TableHead>{t('common.status', lang)}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('common.date', lang)}</TableHead>
                  <TableHead className="text-right">{t('common.actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                          <Code2 className="size-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">{search || statusFilter !== 'all' ? (t('common.noResults', lang) || 'Ничего не найдено') : (t('admin.noEmbedCodes', lang) || 'Кодов внедрения пока нет')}</p>
                        <p className="text-xs text-muted-foreground/70 text-center max-w-sm">
                          {search || statusFilter !== 'all'
                            ? (t('admin.tryDifferentSearch', lang) || 'Попробуйте изменить параметры поиска')
                            : (t('admin.embedCodesEmptyDesc', lang) || 'Коды внедрения появляются при создании и публикации ботов')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCodes.map((ec) => (
                    <TableRow key={ec.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono bg-muted px-2 py-1 rounded select-all">
                            {ec.code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0"
                            onClick={() => handleCopy(ec.code, ec.id)}
                            title={t('common.copy', lang) || 'Копировать'}
                          >
                            {copiedId === ec.id ? (
                              <CheckCircle2 className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium truncate max-w-[180px]">{ec.bot?.name || '—'}</span>
                          {ec.bot?.niche && (
                            <span className="text-xs text-muted-foreground">{ec.bot.niche}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm text-muted-foreground truncate max-w-[180px]">{ec.bot?.ownerName || '—'}</span>
                          <span className="text-xs text-muted-foreground/70">{ec.bot?.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{embedStatusBadge(ec.isActive, lang)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(ec.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                disabled={processingId === ec.id}
                                title={t('admin.revokeCode', lang)}
                              >
                                <Ban className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <AlertTriangle className="size-5 text-red-500" />
                                  {t('admin.revokeCode', lang)}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Вы уверены, что хотите отозвать код <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{ec.code}</code>? Виджет перестанет работать на сайте.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel', lang)}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleRevoke(ec.id)}
                                >
                                  {t('admin.revokeCode', lang)}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                                disabled={processingId === ec.id}
                                title="Перегенерировать код"
                              >
                                <RefreshCw className={`size-4 ${processingId === ec.id ? 'animate-spin' : ''}`} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2">
                                  <RefreshCw className="size-5 text-amber-500" />
                                  Перегенерировать код
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Будет сгенерирован новый код для виджета. Старый код <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{ec.code}</code> перестанет работать. Это действие нельзя отменить.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t('common.cancel', lang)}</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-amber-600 hover:bg-amber-700"
                                  onClick={() => handleRegenerate(ec.id)}
                                >
                                  Перегенерировать
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main AdminPage Component
// ──────────────────────────────────────────────────────────────

export function AdminPage() {
  const { user } = useAuthStore();
  const { currentPage, language, setPage } = useAppStore();
  const lang = language;
  const [localTab, setLocalTab] = useState<AdminTab | null>(null);

  // Derive the active admin tab from store page or local override
  const activeTab: AdminTab = localTab ?? (currentPage as AdminTab) ?? 'admin';

  const handleTabChange = useCallback((tab: AdminTab) => {
    // For embed codes (not in AppPage), use local state
    if (tab === 'admin-embed') {
      setLocalTab(tab);
    } else {
      setLocalTab(null);
      setPage(tab as 'admin' | 'admin-users' | 'admin-analytics' | 'admin-logs');
    }
  }, [setPage]);

  // Admin check
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
          <AlertTriangle className="size-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold">Доступ запрещён</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          У вас нет прав для доступа к панели администратора. Обратитесь к суперпользователю.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="size-6 text-emerald-600 dark:text-emerald-400" />
            {t('admin.title', lang)}
          </h2>
          <p className="text-sm text-muted-foreground">
            Управление платформой АгентБот
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="rounded-lg border bg-muted/30 p-1">
        <div className="flex items-center gap-1 overflow-x-auto">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                <span className="hidden sm:inline">{t(tab.labelKey, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <>
        {activeTab === 'admin' && <OverviewTab lang={lang} onNavigate={handleTabChange} />}
        {activeTab === 'admin-users' && <UsersTab lang={lang} />}
        {activeTab === 'admin-analytics' && <AnalyticsTab lang={lang} />}
        {activeTab === 'admin-logs' && <LogsTab lang={lang} />}
        {activeTab === 'admin-embed' && <EmbedCodesTab lang={lang} />}
      </>
    </div>
  );
}

export default AdminPage;
