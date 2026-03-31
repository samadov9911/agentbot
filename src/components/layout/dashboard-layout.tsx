'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useTheme } from 'next-themes';
import {
  Bot,
  LayoutDashboard,
  Wrench,
  BarChart3,
  Settings,
  CreditCard,
  HelpCircle,
  Shield,
  LogOut,
  Moon,
  Sun,
  Bell,
  Menu,
  User,
  ChevronDown,
  PanelLeft,
  Brain,
  CalendarDays,
  Headset,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t, allLanguages, type Language } from '@/lib/i18n';
import type { AppPage } from '@/types';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

// ──────────────────────────────────────────────────────────────
// Navigation configuration
// ──────────────────────────────────────────────────────────────

interface NavItem {
  page: AppPage;
  labelKey: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', labelKey: 'dashboard.title', icon: LayoutDashboard },
  { page: 'bots', labelKey: 'bots.title', icon: Bot },
  { page: 'bot-builder', labelKey: 'botBuilder.title', icon: Wrench },
  { page: 'analytics', labelKey: 'analytics.title', icon: BarChart3 },
  { page: 'ai-agent', labelKey: 'aiAgent.title', icon: Brain },
  { page: 'bookings', labelKey: 'bookings.title', icon: CalendarDays },
  { page: 'support', labelKey: 'support.title', icon: Headset },
  { page: 'settings', labelKey: 'settings.title', icon: Settings },
  { page: 'subscription', labelKey: 'subscription.title', icon: CreditCard },
  { page: 'help', labelKey: 'help.title', icon: HelpCircle },
];

const ADMIN_ITEM: NavItem = {
  page: 'admin',
  labelKey: 'admin.title',
  icon: Shield,
};

// ──────────────────────────────────────────────────────────────
// Page title map for header display
// ──────────────────────────────────────────────────────────────

const PAGE_TITLE_KEYS: Partial<Record<AppPage, string>> = {
  dashboard: 'dashboard.title',
  bots: 'bots.title',
  'bot-builder': 'botBuilder.title',
  analytics: 'analytics.title',
  'ai-agent': 'aiAgent.title',
  bookings: 'bookings.title',
  settings: 'settings.title',
  support: 'support.title',
  subscription: 'subscription.title',
  help: 'help.title',
  admin: 'admin.title',
  'admin-users': 'admin.users',
  'admin-analytics': 'admin.analytics',
  'admin-logs': 'admin.logs',
  'admin-embed': 'admin.embedCodes',
};

// ──────────────────────────────────────────────────────────────
// Demo timer hook
// ──────────────────────────────────────────────────────────────

function useDemoTimer() {
  const { user } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateTimeLeft = useCallback(() => {
    // Look for a demoExpiresAt field (set during login / demo activation)
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

  // Use a tick counter to force re-renders every minute
  const [tick, setTick] = useState(0);

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

  // tick drives re-evaluation — suppress unused warning
  void tick;

  return calculateTimeLeft();
}

// ──────────────────────────────────────────────────────────────
// Logo component
// ──────────────────────────────────────────────────────────────

function Logo() {
  const { state } = useSidebar();

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
        <Bot className="size-4" />
      </div>
      <span
        className={`text-base font-bold tracking-tight whitespace-nowrap transition-opacity duration-200 ${
          state === 'collapsed' ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
        }`}
      >
        <span className="text-emerald-600 dark:text-emerald-400">Agent</span>
        <span className="text-sidebar-foreground">Bot</span>
      </span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sidebar nav (shared between desktop sidebar and mobile sheet)
// ──────────────────────────────────────────────────────────────

function SidebarNav({ collapsed = false }: { collapsed?: boolean }) {
  const { currentPage, setPage, language } = useAppStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const renderNavItem = (item: NavItem) => {
    const isActive = currentPage === item.page;
    const Icon = item.icon;
    const label = t(item.labelKey, language);

    return (
      <SidebarMenuItem key={item.page}>
        <SidebarMenuButton
          isActive={isActive}
          onClick={() => setPage(item.page)}
          tooltip={collapsed ? label : undefined}
          className={
            isActive
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900'
              : ''
          }
        >
          <Icon className="size-4" />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <>
      <SidebarGroup>
        <SidebarMenu>
          {NAV_ITEMS.map(renderNavItem)}
        </SidebarMenu>
      </SidebarGroup>

      {isAdmin && (
        <>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarMenu>
              {renderNavItem(ADMIN_ITEM)}
            </SidebarMenu>
          </SidebarGroup>
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Desktop sidebar
// ──────────────────────────────────────────────────────────────

function DashboardSidebar() {
  const { user, logout } = useAuthStore();
  const { language } = useAppStore();
  const { state } = useSidebar();
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  const userName = user?.name ?? user?.email ?? t('common.name', language);

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader>
        <Logo />
      </SidebarHeader>

      <SidebarContent>
        <SidebarNav collapsed={state === 'collapsed'} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="size-8 shrink-0">
                <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col transition-opacity duration-200 overflow-hidden ${
                  state === 'collapsed'
                    ? 'opacity-0 w-0'
                    : 'opacity-100'
                }`}
              >
                <span className="text-sm font-medium truncate">
                  {userName}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </div>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip={state === 'collapsed' ? 'Logout' : undefined}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

// ──────────────────────────────────────────────────────────────
// Mobile sidebar (Sheet-based)
// ──────────────────────────────────────────────────────────────

function MobileSidebar() {
  const { user, logout } = useAuthStore();
  const { language } = useAppStore();
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  const userName = user?.name ?? user?.email ?? t('common.name', language);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Toggle navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
          {/* Logo */}
          <div className="flex items-center gap-2 px-4 py-4">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Bot className="size-4" />
            </div>
            <span className="text-base font-bold tracking-tight">
              <span className="text-emerald-600 dark:text-emerald-400">Agent</span>
              <span>Bot</span>
            </span>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-2">
            <ul className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <MobileNavItem key={item.page} item={item} />
              ))}
              {user?.role === 'admin' && (
                <>
                  <Separator className="my-1 bg-sidebar-border" />
                  <MobileNavItem item={ADMIN_ITEM} />
                </>
              )}
            </ul>
          </nav>

          <Separator className="bg-sidebar-border" />

          {/* Footer */}
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900 dark:text-emerald-300">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm font-medium truncate">{userName}</span>
              <span className="text-xs text-muted-foreground truncate">
                {user?.email}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-muted-foreground hover:text-destructive shrink-0"
            >
              <LogOut className="size-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ──────────────────────────────────────────────────────────────
// Mobile nav item (extracted to avoid hooks-in-callback issue)
// ──────────────────────────────────────────────────────────────

function MobileNavItem({ item }: { item: NavItem }) {
  const { currentPage, setPage, language } = useAppStore();
  const isActive = currentPage === item.page;
  const Icon = item.icon;
  const label = t(item.labelKey, language);

  return (
    <li>
      <button
        onClick={() => setPage(item.page)}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        }`}
      >
        <Icon className="size-4 shrink-0" />
        <span>{label}</span>
      </button>
    </li>
  );
}

// ──────────────────────────────────────────────────────────────
// Language switcher
// ──────────────────────────────────────────────────────────────

function LanguageSwitcher() {
  const { language, setLanguage } = useAppStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-8 px-2">
          <span className="text-xs font-bold uppercase">{language}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {allLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`gap-2 ${language === lang ? 'bg-accent' : ''}`}
          >
            <span className="text-xs font-bold uppercase">{lang}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ──────────────────────────────────────────────────────────────
// Theme toggle
// ──────────────────────────────────────────────────────────────

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-8">
        <Sun className="size-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

// ──────────────────────────────────────────────────────────────
// User dropdown
// ──────────────────────────────────────────────────────────────

function UserDropdown() {
  const { user, logout } = useAuthStore();
  const { setPage, language } = useAppStore();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'U';

  const userName = user?.name ?? t('common.name', language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 gap-2 pl-2 pr-1">
          <span className="hidden text-sm font-medium truncate max-w-[120px] md:inline-block">
            {userName}
          </span>
          <Avatar className="size-7">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs font-semibold dark:bg-emerald-900 dark:text-emerald-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="size-3 text-muted-foreground hidden md:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setPage('settings')} className="gap-2">
          <User className="size-4" />
          {t('settings.profile', language)}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setPage('settings')} className="gap-2">
          <Settings className="size-4" />
          {t('common.settings', language)}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={logout}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ──────────────────────────────────────────────────────────────
// Demo timer badge
// ──────────────────────────────────────────────────────────────

function DemoTimerBadge() {
  const demoTimer = useDemoTimer();
  const { language } = useAppStore();

  if (!demoTimer) return null;

  const { days, hours, minutes, expired } = demoTimer;

  if (expired) return null;

  const isUrgent = days < 1;

  return (
    <Badge
      variant={isUrgent ? 'destructive' : 'outline'}
      className={`gap-1 text-xs font-medium ${
        isUrgent
          ? 'border-destructive/50 bg-destructive/10 text-destructive dark:bg-destructive/20'
          : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      }`}
    >
      <span className="hidden sm:inline">Demo:</span>
      <span className="font-semibold tabular-nums">
        {days}{t('dashboard.days', language)}{' '}
        {String(hours).padStart(2, '0')}{t('dashboard.hours', language)}{' '}
        {String(minutes).padStart(2, '0')}{t('dashboard.minutes', language)}
      </span>
    </Badge>
  );
}

// ──────────────────────────────────────────────────────────────
// Notification Bell
// ──────────────────────────────────────────────────────────────

function NotificationBell() {
  const { setPage } = useAppStore();
  const [notifList, setNotifList] = useState([
    { id: 1, title: 'Добро пожаловать!', desc: 'Ваш демо-период активирован на 7 дней', time: 'Только что', read: false, icon: '🎉' },
    { id: 2, title: 'Создайте первого бота', desc: 'Используйте конструктор для создания AI-агента', time: '1 мин назад', read: false, icon: '🤖' },
    { id: 3, title: 'Подсказка', desc: 'Настройте виджет и вставьте код на свой сайт', time: '5 мин назад', read: true, icon: '💡' },
  ]);
  const [open, setOpen] = useState(false);

  const unreadCount = notifList.filter((n) => !n.read).length;

  const handleNotificationClick = (n: (typeof notifList)[number]) => {
    setNotifList((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)),
    );

    // Navigate based on notification type
    if (n.title === 'Создайте первого бота') {
      setPage('bot-builder');
    } else if (n.title === 'Подсказка') {
      setPage('help');
    }

    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 size-4 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="text-sm font-semibold">Уведомления</h4>
          <Badge variant="secondary" className="text-xs">{unreadCount} новых</Badge>
        </div>
        <ScrollArea className="max-h-80">
          <div className="flex flex-col">
            {notifList.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                  !n.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                }`}
                onClick={() => handleNotificationClick(n)}
              >
                <span className="text-lg mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{n.desc}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{n.time}</p>
                </div>
                {!n.read && <span className="size-2 mt-1.5 rounded-full bg-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="border-t px-4 py-2">
          <button
            className="w-full text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 py-1"
            onClick={() => { setPage('help'); setOpen(false); }}
          >
            Показать все уведомления
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ──────────────────────────────────────────────────────────────
// Header
// ──────────────────────────────────────────────────────────────

function DashboardHeader() {
  const { currentPage, language } = useAppStore();

  const pageTitle = useMemo(() => {
    const key = PAGE_TITLE_KEYS[currentPage];
    return key ? t(key, language) : 'AgentBot';
  }, [currentPage, language]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile menu trigger */}
      <MobileSidebar />

      {/* Desktop sidebar trigger */}
      <SidebarTrigger className="-ml-1 hidden md:flex" />

      {/* Page title */}
      <h1 className="text-lg font-semibold tracking-tight truncate">
        {pageTitle}
      </h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">
        {/* Demo timer */}
        <DemoTimerBadge />

        {/* Notification bell */}
        <NotificationBell />

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Theme toggle */}
        <ThemeToggle />

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        {/* User dropdown */}
        <UserDropdown />
      </div>
    </header>
  );
}

// ──────────────────────────────────────────────────────────────
// Main layout
// ──────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: React.ReactNode;
  floatingWidget?: React.ReactNode;
}

export function DashboardLayout({ children, floatingWidget }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </div>
      </SidebarInset>
      {/* Floating widgets must be outside SidebarInset to avoid
          transform breaking position:fixed on the widget */}
      {floatingWidget}
    </SidebarProvider>
  );
}

export default DashboardLayout;
