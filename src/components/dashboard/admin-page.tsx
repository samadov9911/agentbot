'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  DollarSign,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Eye,
  UserCog,
  Ban,
  ShieldCheck,
  BarChart3,
  Clock,
  Plus,
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
  plan: string;
  status: 'active' | 'blocked' | 'inactive';
  botsCount: number;
  createdAt: string;
}

interface AdminLog {
  id: string;
  timestamp: string;
  adminEmail: string;
  actionType: 'create' | 'update' | 'delete' | 'block' | 'unblock' | 'login' | 'export';
  details: string;
}

interface EmbedCode {
  id: string;
  code: string;
  botName: string;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsed: string;
}

interface TopBot {
  id: string;
  name: string;
  conversations: number;
  niche: string;
  owner: string;
}

// ──────────────────────────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────────────────────────

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', name: 'Александр Иванов', email: 'alex@salon.ru', company: 'Beauty Salon', plan: 'yearly', status: 'active', botsCount: 3, createdAt: '2024-08-15' },
  { id: 'u2', name: 'Мария Петрова', email: 'maria@clinic.ru', company: 'MedClinic Pro', plan: 'quarterly', status: 'active', botsCount: 1, createdAt: '2024-09-01' },
  { id: 'u3', name: 'Дмитрий Козлов', email: 'dmitry@rest.ru', company: 'Bistro Cafe', plan: 'monthly', status: 'active', botsCount: 2, createdAt: '2024-09-20' },
  { id: 'u4', name: 'Елена Сидорова', email: 'elena@fit.ru', company: 'FitLife Studio', plan: 'yearly', status: 'active', botsCount: 1, createdAt: '2024-10-05' },
  { id: 'u5', name: 'Олег Новиков', email: 'oleg@realty.ru', company: 'NovaRealty', plan: 'lifetime', status: 'active', botsCount: 5, createdAt: '2024-07-01' },
  { id: 'u6', name: 'Анна Козлова', email: 'anna@edu.ru', company: 'EduCenter', plan: 'demo', status: 'active', botsCount: 0, createdAt: '2024-11-01' },
  { id: 'u7', name: 'Игорь Волков', email: 'igor@consult.ru', company: 'BizConsult', plan: 'quarterly', status: 'blocked', botsCount: 2, createdAt: '2024-06-15' },
  { id: 'u8', name: 'Наталья Морозова', email: 'nat@ecom.ru', company: 'ShopMaster', plan: 'monthly', status: 'active', botsCount: 1, createdAt: '2024-10-20' },
  { id: 'u9', name: 'Павел Лебедев', email: 'pavel@tech.ru', company: 'TechSupport AI', plan: 'yearly', status: 'active', botsCount: 4, createdAt: '2024-05-10' },
  { id: 'u10', name: 'Ольга Федорова', email: 'olga@beauty.ru', company: 'Style Studio', plan: 'monthly', status: 'inactive', botsCount: 1, createdAt: '2024-08-25' },
  { id: 'u11', name: 'Сергей Николаев', email: 'sergey@food.ru', company: 'FoodDelivery', plan: 'quarterly', status: 'active', botsCount: 2, createdAt: '2024-09-12' },
  { id: 'u12', name: 'Виктория Попова', email: 'vika@law.ru', company: 'LegalBot', plan: 'yearly', status: 'active', botsCount: 3, createdAt: '2024-07-20' },
];

const MOCK_LOGS: AdminLog[] = [
  { id: 'l1', timestamp: '2024-11-15 14:32:01', adminEmail: 'admin@botforge.ai', actionType: 'create', details: 'Создан новый план "Enterprise" для пользователя sergey@food.ru' },
  { id: 'l2', timestamp: '2024-11-15 13:18:45', adminEmail: 'admin@botforge.ai', actionType: 'block', details: 'Пользователь igor@consult.ru заблокирован за нарушение ToS' },
  { id: 'l3', timestamp: '2024-11-15 11:05:22', adminEmail: 'ops@botforge.ai', actionType: 'update', details: 'Обновлены лимиты для плана "quarterly": диалоги +500' },
  { id: 'l4', timestamp: '2024-11-14 18:45:10', adminEmail: 'admin@botforge.ai', actionType: 'delete', details: 'Удалён бот "TestBot" пользователя anna@edu.ru (неактивен 30 дней)' },
  { id: 'l5', timestamp: '2024-11-14 16:22:33', adminEmail: 'ops@botforge.ai', actionType: 'export', details: 'Экспортирован отчёт по аналитике за октябрь 2024 (CSV)' },
  { id: 'l6', timestamp: '2024-11-14 14:10:55', adminEmail: 'admin@botforge.ai', actionType: 'create', details: 'Создана новая системная роль "moderator" с правами чтения' },
  { id: 'l7', timestamp: '2024-11-14 10:30:18', adminEmail: 'admin@botforge.ai', actionType: 'unblock', details: 'Пользователь olga@beauty.ru разблокирован после верификации' },
  { id: 'l8', timestamp: '2024-11-13 22:15:40', adminEmail: 'ops@botforge.ai', actionType: 'update', details: 'Обновлены настройки AI-модели для всех демо-пользователей' },
  { id: 'l9', timestamp: '2024-11-13 17:45:02', adminEmail: 'admin@botforge.ai', actionType: 'login', details: 'Успешный вход в админ-панель с IP 192.168.1.45' },
  { id: 'l10', timestamp: '2024-11-13 15:20:11', adminEmail: 'admin@botforge.ai', actionType: 'delete', details: 'Удалён аккаунт spam@temp.ru — спам-активность' },
  { id: 'l11', timestamp: '2024-11-13 12:05:33', adminEmail: 'ops@botforge.ai', actionType: 'create', details: 'Создан промокод "LAUNCH2024" — скидка 30% на годовой план' },
  { id: 'l12', timestamp: '2024-11-12 19:40:58', adminEmail: 'admin@botforge.ai', actionType: 'update', details: 'Обновлены тарифы: Lifetime $499 → $399 (Black Friday)' },
  { id: 'l13', timestamp: '2024-11-12 14:25:07', adminEmail: 'admin@botforge.ai', actionType: 'block', details: 'Заблокировано 3 аккаунта за массовую регистрацию с одного IP' },
  { id: 'l14', timestamp: '2024-11-12 09:15:22', adminEmail: 'ops@botforge.ai', actionType: 'export', details: 'Экспортирован список пользователей с истёкшей подпиской (12 записей)' },
  { id: 'l15', timestamp: '2024-11-11 21:30:45', adminEmail: 'admin@botforge.ai', actionType: 'create', details: 'Включена двухфакторная аутентификация для всех админов' },
];

const MOCK_EMBED_CODES: EmbedCode[] = [
  { id: 'e1', code: 'bf_a8x2k9m3', botName: 'Салон Ассистент', status: 'active', createdAt: '2024-09-15', lastUsed: '2024-11-14' },
  { id: 'e2', code: 'bf_b4j7n1p5', botName: 'MedClinic Bot', status: 'active', createdAt: '2024-10-01', lastUsed: '2024-11-15' },
  { id: 'e3', code: 'bf_c2m9q8r6', botName: 'Bistro Helper', status: 'active', createdAt: '2024-10-10', lastUsed: '2024-11-13' },
  { id: 'e4', code: 'bf_d6v3w2t4', botName: 'FitLife Coach', status: 'revoked', createdAt: '2024-08-20', lastUsed: '2024-10-05' },
  { id: 'e5', code: 'bf_e1h7y5u8', botName: 'NovaRealty Bot', status: 'active', createdAt: '2024-07-15', lastUsed: '2024-11-15' },
  { id: 'e6', code: 'bf_f9k2l3i1', botName: 'ShopMaster AI', status: 'expired', createdAt: '2024-06-01', lastUsed: '2024-08-30' },
  { id: 'e7', code: 'bf_g5n8o7p2', botName: 'TechSupport Bot', status: 'active', createdAt: '2024-09-25', lastUsed: '2024-11-14' },
  { id: 'e8', code: 'bf_h3q6r5s9', botName: 'LegalBot Pro', status: 'active', createdAt: '2024-10-15', lastUsed: '2024-11-15' },
  { id: 'e9', code: 'bf_i7t4u3v1', botName: 'FoodDelivery Bot', status: 'active', createdAt: '2024-10-20', lastUsed: '2024-11-12' },
  { id: 'e10', code: 'bf_j1w8x7y6', botName: 'EduCenter Bot', status: 'revoked', createdAt: '2024-11-01', lastUsed: '2024-11-08' },
];

const MOCK_TOP_BOTS: TopBot[] = [
  { id: 'b1', name: 'Салон Ассистент', conversations: 1842, niche: 'Салон красоты', owner: 'Александр Иванов' },
  { id: 'b2', name: 'NovaRealty Bot', conversations: 1567, niche: 'Недвижимость', owner: 'Олег Новиков' },
  { id: 'b3', name: 'TechSupport Bot', conversations: 1345, niche: 'Консалтинг', owner: 'Павел Лебедев' },
  { id: 'b4', name: 'LegalBot Pro', conversations: 1123, niche: 'Консалтинг', owner: 'Виктория Попова' },
  { id: 'b5', name: 'MedClinic Bot', conversations: 987, niche: 'Медицина', owner: 'Мария Петрова' },
  { id: 'b6', name: 'Bistro Helper', conversations: 856, niche: 'Ресторан', owner: 'Дмитрий Козлов' },
  { id: 'b7', name: 'FoodDelivery Bot', conversations: 734, niche: 'E-commerce', owner: 'Сергей Николаев' },
  { id: 'b8', name: 'FitLife Coach', conversations: 612, niche: 'Фитнес', owner: 'Елена Сидорова' },
];

const MOCK_MONTHLY_SIGNUPS = [
  { month: 'Май', count: 28 },
  { month: 'Июн', count: 35 },
  { month: 'Июл', count: 42 },
  { month: 'Авг', count: 51 },
  { month: 'Сен', count: 68 },
  { month: 'Окт', count: 79 },
  { month: 'Ноя', count: 94 },
];

const PLAN_DISTRIBUTION = [
  { name: 'Demo', count: 340, color: '#64748b' },
  { name: 'Monthly', count: 180, color: '#14b8a6' },
  { name: 'Quarterly', count: 120, color: '#f59e0b' },
  { name: 'Yearly', count: 85, color: '#10b981' },
  { name: 'Lifetime', count: 25, color: '#059669' },
];

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
// Action type badge helper
// ──────────────────────────────────────────────────────────────

function actionBadgeClass(actionType: string) {
  switch (actionType) {
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

function embedStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">Active</Badge>;
    case 'revoked':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-100">Revoked</Badge>;
    case 'expired':
      return <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100">Expired</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function planBadge(plan: string) {
  switch (plan) {
    case 'demo':
      return <Badge variant="secondary" className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">Demo</Badge>;
    case 'monthly':
      return <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 hover:bg-teal-100">Monthly</Badge>;
    case 'quarterly':
      return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 hover:bg-amber-100">Quarterly</Badge>;
    case 'yearly':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">Yearly</Badge>;
    case 'lifetime':
      return <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 hover:bg-violet-100">Lifetime</Badge>;
    default:
      return <Badge variant="secondary">{plan}</Badge>;
  }
}

function userStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100">{t('common.active', 'ru')}</Badge>;
    case 'blocked':
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 hover:bg-red-100">Заблокирован</Badge>;
    case 'inactive':
      return <Badge variant="secondary">{t('common.inactive', 'ru')}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
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
  const stats = useMemo(() => [
    {
      label: t('admin.totalUsers', lang),
      value: '750',
      change: { value: 12.5, isPositive: true },
      icon: Users,
      bgColor: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: t('admin.activeUsers', lang),
      value: '624',
      change: { value: 8.3, isPositive: true },
      icon: Activity,
      bgColor: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
      textColor: 'text-teal-600 dark:text-teal-400',
    },
    {
      label: t('admin.mrr', lang),
      value: '$18,420',
      change: { value: 15.2, isPositive: true },
      icon: DollarSign,
      bgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
      textColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      label: t('admin.churnRate', lang),
      value: '3.2%',
      change: { value: 1.1, isPositive: false },
      icon: TrendingDown,
      bgColor: 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400',
      textColor: 'text-rose-600 dark:text-rose-400',
    },
  ], [lang]);

  const quickLinks = useMemo(() => [
    { id: 'admin-users' as AdminTab, label: t('admin.users', lang), description: 'Управление пользователями, блокировка, имперсонация', icon: Users, count: 750 },
    { id: 'admin-analytics' as AdminTab, label: t('admin.analytics', lang), description: 'MRR, ARR, аналитика регистраций, топ ботов', icon: BarChart3, count: null },
    { id: 'admin-logs' as AdminTab, label: t('admin.logs', lang), description: 'Журнал действий администраторов', icon: FileText, count: 15 },
    { id: 'admin-embed' as AdminTab, label: t('admin.embedCodes', lang), description: 'Управление кодами внедрения виджетов', icon: Code2, count: 10 },
  ], [lang]);

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
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${stat.change.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {stat.change.isPositive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                    {stat.change.value}%
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
            Быстрый доступ
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
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>(MOCK_USERS);
  const perPage = 6;

  const filteredUsers = useMemo(() => {
    let result = users;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }
    if (planFilter !== 'all') {
      result = result.filter((u) => u.plan === planFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((u) => u.status === statusFilter);
    }
    return result;
  }, [users, search, planFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / perPage);
  const paginatedUsers = filteredUsers.slice((page - 1) * perPage, page * perPage);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handlePageChange = useCallback((p: number) => setPage(p), []);

  const handlePlanFilterChange = useCallback((value: string) => {
    setPlanFilter(value);
    setPage(1);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleBlockToggle = useCallback((userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'blocked' ? 'active' : 'blocked' }
          : u
      )
    );
    setBlockingId(null);
  }, []);

  const handleImpersonate = useCallback((userId: string) => {
    setImpersonating(userId);
    setTimeout(() => setImpersonating(null), 2000);
  }, []);

  return (
    <div className="flex flex-col gap-4">
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
            <Select value={planFilter} onValueChange={handlePlanFilterChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder={t('subscription.title', lang)} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all', lang)}</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="lifetime">Lifetime</SelectItem>
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
                <SelectItem value="blocked">Заблокирован</SelectItem>
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
                  <TableHead className="hidden lg:table-cell">Компания</TableHead>
                  <TableHead>{t('subscription.title', lang)}</TableHead>
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
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground md:hidden truncate">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{user.company}</TableCell>
                      <TableCell>{planBadge(user.plan)}</TableCell>
                      <TableCell>{userStatusBadge(user.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{user.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => setSelectedUser(user)}
                            title="Подробнее"
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleImpersonate(user.id)}
                            disabled={impersonating === user.id}
                            title={t('admin.impersonate', lang)}
                          >
                            <UserCog className={`size-4 ${impersonating === user.id ? 'text-emerald-500' : ''}`} />
                          </Button>
                          {user.status !== 'blocked' ? (
                            <AlertDialog open={blockingId === user.id} onOpenChange={(open) => setBlockingId(open ? user.id : null)}>
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
                                    Вы уверены, что хотите заблокировать пользователя <span className="font-semibold">{user.name}</span> ({user.email})? Пользователь потеряет доступ к своей учётной записи.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel', lang)}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleBlockToggle(user.id)}
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
                              onClick={() => handleBlockToggle(user.id)}
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
            {(page - 1) * perPage + 1}–{Math.min(page * perPage, filteredUsers.length)} из {filteredUsers.length}
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
            <DialogTitle>Подробности пользователя</DialogTitle>
            <DialogDescription>Полная информация об учётной записи</DialogDescription>
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
                  <p className="text-muted-foreground">Компания</p>
                  <p className="font-medium">{selectedUser.company}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">План</p>
                  {planBadge(selectedUser.plan)}
                </div>
                <div>
                  <p className="text-muted-foreground">Статус</p>
                  {userStatusBadge(selectedUser.status)}
                </div>
                <div>
                  <p className="text-muted-foreground">Боты</p>
                  <p className="font-medium">{selectedUser.botsCount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Дата регистрации</p>
                  <p className="font-medium">{selectedUser.createdAt}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">ID</p>
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
  const maxSignups = Math.max(...MOCK_MONTHLY_SIGNUPS.map((m) => m.count));
  const totalPlanUsers = PLAN_DISTRIBUTION.reduce((s, p) => s + p.count, 0);
  const maxBotConvs = Math.max(...MOCK_TOP_BOTS.map((b) => b.conversations));

  return (
    <div className="flex flex-col gap-6">
      {/* MRR / ARR Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <DollarSign className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">{t('admin.mrr', lang)}</p>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">$18,420</p>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                15.2%
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
                <p className="text-2xl font-bold tabular-nums text-teal-600 dark:text-teal-400">$221,040</p>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                18.7%
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
                <p className="text-xs font-medium text-muted-foreground">Новые за месяц</p>
                <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">94</p>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                19.0%
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
                <p className="text-xs font-medium text-muted-foreground">Всего ботов</p>
                <p className="text-2xl font-bold tabular-nums text-violet-600 dark:text-violet-400">1,247</p>
              </div>
              <div className="flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowUpRight className="size-3" />
                12.3%
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Signups Bar Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="size-4 text-emerald-600 dark:text-emerald-400" />
              Ежемесячные регистрации
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex items-end gap-3 h-[220px]">
              {MOCK_MONTHLY_SIGNUPS.map((item) => (
                <div key={item.month} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                    {item.count}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-emerald-500 transition-all duration-500 dark:bg-emerald-600"
                    style={{ height: `${(item.count / maxSignups) * 170}px` }}
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{item.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="size-4 text-emerald-600 dark:text-emerald-400" />
              Распределение по планам
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="flex flex-col gap-4">
              {PLAN_DISTRIBUTION.map((plan) => {
                const percentage = ((plan.count / totalPlanUsers) * 100).toFixed(1);
                return (
                  <div key={plan.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                        <span className="text-sm font-medium">{plan.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm tabular-nums text-muted-foreground">{plan.count}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">({percentage}%)</span>
                      </div>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${(plan.count / totalPlanUsers) * 100}%`,
                          backgroundColor: plan.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Bots */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
            Топ ботов по количеству диалогов
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col gap-3">
            {MOCK_TOP_BOTS.map((bot, idx) => (
              <div key={bot.id} className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  idx < 3 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{bot.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{bot.niche} • {bot.owner}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {bot.conversations.toLocaleString()}
                  </span>
                  <div className="hidden sm:block h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(bot.conversations / maxBotConvs) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Logs Tab
// ──────────────────────────────────────────────────────────────

const LOG_ACTION_TYPES = ['all', 'create', 'update', 'delete', 'block', 'unblock', 'login', 'export'];

function LogsTab({ lang }: { lang: string }) {
  const [actionFilter, setActionFilter] = useState('all');

  const filteredLogs = useMemo(() => {
    if (actionFilter === 'all') return MOCK_LOGS;
    return MOCK_LOGS.filter((l) => l.actionType === actionFilter);
  }, [actionFilter]);

  return (
    <div className="flex flex-col gap-4">
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
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors">
                    <div className="mt-0.5 shrink-0">
                      {log.actionType === 'create' ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : log.actionType === 'update' || log.actionType === 'export' || log.actionType === 'unblock' ? (
                        <RefreshCw className="size-4 text-amber-500" />
                      ) : log.actionType === 'login' ? (
                        <Shield className="size-4 text-violet-500" />
                      ) : (
                        <XCircle className="size-4 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[11px] px-1.5 py-0 border-0 ${actionBadgeClass(log.actionType)}`}>
                          {actionLabel(log.actionType)}
                        </Badge>
                        <span className="text-xs font-medium text-muted-foreground">{log.adminEmail}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{log.details}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {log.timestamp.split(' ')[1]}
                    </span>
                  </div>
                ))
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
  const [codes, setCodes] = useState<EmbedCode[]>(MOCK_EMBED_CODES);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRevoke = useCallback((codeId: string) => {
    setCodes((prev) => prev.map((c) => (c.id === codeId ? { ...c, status: 'revoked' as const } : c)));
    setRevokeId(null);
  }, []);

  const handleCopy = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(`<script src="https://botforge.ai/widget/${code}.js"></script>`).catch(() => {
      // fallback
    });
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const newCode: EmbedCode = {
        id: `e${codes.length + 1}`,
        code: `bf_${Math.random().toString(36).substring(2, 9)}`,
        botName: 'New Bot',
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0],
        lastUsed: '-',
      };
      setCodes((prev) => [newCode, ...prev]);
      setIsGenerating(false);
    }, 1200);
  }, [codes.length]);

  const activeCount = codes.filter((c) => c.status === 'active').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Code2 className="size-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-sm font-semibold">{t('admin.embedCodes', lang)}</p>
                <p className="text-xs text-muted-foreground">
                  {codes.length} всего • {activeCount} активных
                </p>
              </div>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isGenerating ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {t('admin.generateCode', lang)}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Embed Codes Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Код</TableHead>
                  <TableHead>Бот</TableHead>
                  <TableHead>{t('common.status', lang)}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('common.date', lang)}</TableHead>
                  <TableHead className="hidden md:table-cell">Последнее использование</TableHead>
                  <TableHead className="text-right">{t('common.actions', lang)}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      {t('common.noData', lang)}
                    </TableCell>
                  </TableRow>
                ) : (
                  codes.map((code) => (
                    <TableRow key={code.id} className="group">
                      <TableCell>
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono text-foreground">
                          {code.code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Bot className="size-4 text-muted-foreground" />
                          <span className="text-sm">{code.botName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{embedStatusBadge(code.status)}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{code.createdAt}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{code.lastUsed}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleCopy(code.code, code.id)}
                            title={t('common.copy', lang)}
                          >
                            {copiedId === code.id ? (
                              <CheckCircle2 className="size-4 text-emerald-500" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                          {code.status === 'active' && (
                            <AlertDialog open={revokeId === code.id} onOpenChange={(open) => setRevokeId(open ? code.id : null)}>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-red-500" />
                                    {t('admin.revokeCode', lang)}
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите отозвать код <code className="font-mono bg-muted rounded px-1">{code.code}</code>? Виджет перестанет работать на сайте пользователя.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common.cancel', lang)}</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => handleRevoke(code.id)}
                                  >
                                    {t('admin.revokeCode', lang)}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
  const [isLoading, setIsLoading] = useState(true);
  const [localTab, setLocalTab] = useState<AdminTab | null>(null);

  // Derive the active admin tab from store page or local override
  const activeTab: AdminTab = localTab ?? (currentPage as AdminTab) ?? 'admin';

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

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
            Управление платформой AgentBot
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
      {isLoading ? (
        activeTab === 'admin' ? (
          <OverviewSkeleton />
        ) : activeTab === 'admin-users' ? (
          <UsersTableSkeleton />
        ) : (
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-5 w-48 mb-4" />
                  <Skeleton className="h-[300px] w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        <>
          {activeTab === 'admin' && <OverviewTab lang={lang} onNavigate={handleTabChange} />}
          {activeTab === 'admin-users' && <UsersTab lang={lang} />}
          {activeTab === 'admin-analytics' && <AnalyticsTab lang={lang} />}
          {activeTab === 'admin-logs' && <LogsTab lang={lang} />}
          {activeTab === 'admin-embed' && <EmbedCodesTab lang={lang} />}
        </>
      )}
    </div>
  );
}

export default AdminPage;
