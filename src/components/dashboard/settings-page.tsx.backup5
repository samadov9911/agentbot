'use client';

import React, { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import {
  User as UserIcon,
  Lock,
  Bell,
  ShieldAlert,
  Save,
  Trash2,
  Globe,
  Sun,
  Moon,
  Loader2,
  Mail,
  Bot,
  BarChart3,
  Megaphone,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/stores';
import { t, languageNames, languageFlags, allLanguages } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import type { AppPage } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';

// ──────────────────────────────────────────────────────────────
// Helper: get initials from name
// ──────────────────────────────────────────────────────────────
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

// ──────────────────────────────────────────────────────────────
// Settings Page
// ──────────────────────────────────────────────────────────────
export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  // Hydration guard
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ── Profile state ──
  const [profileName, setProfileName] = useState('');
  const [profileCompany, setProfileCompany] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // ── Password state ──
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  // ── Notifications state ──
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    botActivityAlerts: true,
    weeklyReports: false,
    marketingEmails: false,
  });
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  // ── Delete state ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // ── Theme ──
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  // Sync from user on mount
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfileCompany(user.company || '');
      if (user.language) {
        setLanguage(user.language as Language);
      }
    }
    // Detect current theme
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light' || stored === 'system') {
      setTheme(stored);
    }
  }, [user]);

  // ── Profile save ──
  const handleSaveProfile = useCallback(async () => {
    setProfileSaving(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 800));
      updateUser({ name: profileName, company: profileCompany });
      toast.success(t('settings.changesSaved', language));
    } catch {
      toast.error(t('common.error', language));
    } finally {
      setProfileSaving(false);
    }
  }, [profileName, profileCompany, updateUser, language]);

  // ── Password change ──
  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Заполните все поля пароля');
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('auth.weakPassword', language));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.passwordsNoMatch', language));
      return;
    }
    setPasswordSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Пароль успешно изменён');
    } catch {
      toast.error('Не удалось сменить пароль');
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, language]);

  // ── Language change ──
  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      updateUser({ language: lang });
    },
    [setLanguage, updateUser]
  );

  // ── Theme toggle ──
  const handleThemeChange = useCallback((newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, []);

  // ── Notifications save ──
  const handleSaveNotifications = useCallback(async () => {
    setNotificationsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success(t('settings.changesSaved', language));
    } catch {
      toast.error(t('common.error', language));
    } finally {
      setNotificationsSaving(false);
    }
  }, [language]);

  // ── Delete account ──
  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success('Аккаунт удалён');
      // In a real app, call logout and redirect
    } catch {
      toast.error('Не удалось удалить аккаунт');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  }, [deleteConfirmText]);

  if (!mounted || !user) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[500px] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title', language)}</h1>
        <p className="text-muted-foreground">
          Управляйте профилем, аккаунтом и настройками уведомлений
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5">
            <UserIcon className="size-4" />
            <span className="hidden sm:inline">{t('settings.profile', language)}</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-1.5">
            <Lock className="size-4" />
            <span className="hidden sm:inline">{t('settings.account', language)}</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="size-4" />
            <span className="hidden sm:inline">{t('settings.notifications', language)}</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="gap-1.5 text-destructive">
            <ShieldAlert className="size-4" />
            <span className="hidden sm:inline">Опасная зона</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="size-5 text-emerald-600" />
                {t('settings.profile', language)}
              </CardTitle>
              <CardDescription>
                Обновите вашу личную информацию
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar + basic info */}
              <div className="flex flex-col items-start gap-6 sm:flex-row">
                <Avatar className="size-20 shrink-0 border-2 border-emerald-200 dark:border-emerald-800">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || ''} className="size-full rounded-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-emerald-100 text-xl font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="settings-name">{t('settings.name', language)}</Label>
                      <Input
                        id="settings-name"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="settings-email">{t('settings.email', language)}</Label>
                      <Input
                        id="settings-email"
                        value={user.email}
                        disabled
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-company">{t('settings.company', language)}</Label>
                    <Input
                      id="settings-company"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                      placeholder="Моя компания"
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {profileSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {t('settings.saveChanges', language)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Account Tab ── */}
        <TabsContent value="account" className="space-y-6">
          {/* Change Password */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="size-5 text-emerald-600" />
                {t('settings.changePassword', language)}
              </CardTitle>
              <CardDescription>
                Обновите пароль для вашей учетной записи
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Текущий пароль</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Новый пароль</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Минимум 8 символов"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('auth.confirmPassword', language)}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Подтвердите новый пароль"
                  />
                </div>
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">{t('auth.passwordsNoMatch', language)}</p>
              )}
              {newPassword && newPassword.length < 8 && (
                <p className="text-sm text-destructive">{t('auth.weakPassword', language)}</p>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {passwordSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Lock className="mr-2 size-4" />
                  )}
                  Сменить пароль
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5 text-emerald-600" />
                {t('settings.language', language)}
              </CardTitle>
              <CardDescription>
                Выберите язык интерфейса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {allLanguages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ${
                      language === lang
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-muted bg-background'
                    }`}
                  >
                    <span className="text-lg">{languageFlags[lang]}</span>
                    <span>{languageNames[lang]}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon className="size-5 text-emerald-600" />
                ) : (
                  <Sun className="size-5 text-emerald-600" />
                )}
                {t('settings.theme', language)}
              </CardTitle>
              <CardDescription>
                Настройте внешний вид интерфейса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light', label: 'Светлая', icon: Sun },
                  { value: 'dark', label: 'Тёмная', icon: Moon },
                  { value: 'system', label: 'Системная', icon: MonitorIcon },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 text-sm font-medium transition-all hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 ${
                      theme === value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'border-muted bg-background'
                    }`}
                  >
                    <Icon className="size-5" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Notifications Tab ── */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-emerald-600" />
                {t('settings.notifications', language)}
              </CardTitle>
              <CardDescription>
                Настройте, какие уведомления вы хотите получать
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {/* Email notifications */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <Mail className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Email уведомления</p>
                      <p className="text-xs text-muted-foreground">Получайте важные обновления по email</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                {/* Bot activity alerts */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/50">
                      <Bot className="size-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Активность ботов</p>
                      <p className="text-xs text-muted-foreground">Оповещения при нестандартной активности</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.botActivityAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, botActivityAlerts: checked }))
                    }
                  />
                </div>

                {/* Weekly reports */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                      <BarChart3 className="size-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Еженедельные отчёты</p>
                      <p className="text-xs text-muted-foreground">Сводка активности за неделю</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>

                {/* Marketing emails */}
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/50">
                      <Megaphone className="size-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Маркетинговые рассылки</p>
                      <p className="text-xs text-muted-foreground">Новости, обновления и специальные предложения</p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>
              </div>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={notificationsSaving}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {notificationsSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  {t('settings.saveChanges', language)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Danger Zone Tab ── */}
        <TabsContent value="danger">
          <Card className="border-destructive/50">
            <CardHeader className="text-destructive">
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-5" />
                Опасная зона
              </CardTitle>
              <CardDescription className="text-destructive/70">
                Эти действия необратимы. Пожалуйста, будьте осторожны.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 dark:bg-destructive/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-destructive">
                      {t('settings.deleteAccount', language)}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Удалите ваш аккаунт и все связанные данные навсегда. Это действие нельзя отменить.
                    </p>
                  </div>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="shrink-0">
                        <Trash2 className="mr-2 size-4" />
                        {t('settings.deleteAccount', language)}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <ShieldAlert className="size-5 text-destructive" />
                          Вы уверены?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>
                              Это действие навсегда удалит ваш аккаунт, всех ботов, диалоги,
                              настройки подписки и другие данные. Это действие нельзя отменить.
                            </p>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                Введите <Badge variant="destructive">DELETE</Badge> для подтверждения:
                              </p>
                              <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="border-destructive/50 focus-visible:ring-destructive/30"
                              />
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                          {t('common.cancel', language)}
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText !== 'DELETE' || deleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleting ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : (
                            <Trash2 className="mr-2 size-4" />
                          )}
                          {t('settings.deleteAccount', language)}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Simple Monitor icon for "system" theme
function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </svg>
  );
}

export default SettingsPage;
