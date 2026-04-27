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
    if (!user) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: profileName,
          company: profileCompany,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('common.error', language));
        return;
      }
      updateUser({ name: profileName, company: profileCompany });
      toast.success(t('settings.changesSaved', language));
    } catch {
      toast.error(t('common.error', language));
    } finally {
      setProfileSaving(false);
    }
  }, [user, profileName, profileCompany, updateUser, language]);

  // ── Password change ──
  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillPasswordFields', language));
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
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t('common.error', language));
        return;
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.passwordChanged', language));
    } catch {
      toast.error(t('settings.passwordFailed', language));
    } finally {
      setPasswordSaving(false);
    }
  }, [currentPassword, newPassword, confirmPassword, user, language]);

  // ── Language change ──
  const handleLanguageChange = useCallback(
    (lang: Language) => {
      setLanguage(lang);
      updateUser({ language: lang });
      // Save language to DB in background
      if (user) {
        fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
          },
          body: JSON.stringify({ language: lang }),
        }).catch(() => {
          // Silent fail — language is still saved in localStorage/Zustand
        });
      }
    },
    [setLanguage, updateUser, user]
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
    if (!user?.id) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'x-user-id': user.id },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Request failed' }));
        toast.error(t('settings.accountDeleteFailed', language), {
          description: (errData as Record<string, string>).error,
        });
        setDeleting(false);
        setDeleteDialogOpen(false);
        setDeleteConfirmText('');
        return;
      }
      toast.success(t('settings.accountDeleted', language));
      // Log out and redirect to landing
      const { logout } = useAuthStore.getState();
      logout();
      const { setPage } = useAppStore.getState();
      setPage('landing');
    } catch {
      toast.error(t('settings.accountDeleteFailed', language));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText('');
    }
  }, [deleteConfirmText, user?.id]);

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
          {t('settings.subtitle', language)}
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
            <span className="hidden sm:inline">{t('settings.dangerZone', language)}</span>
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
                {t('settings.updateProfile', language)}
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
                        placeholder={t('settings.namePlaceholder', language)}
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
                      <p className="text-xs text-muted-foreground">{t('settings.emailHint', language)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-company">{t('settings.company', language)}</Label>
                    <Input
                      id="settings-company"
                      value={profileCompany}
                      onChange={(e) => setProfileCompany(e.target.value)}
                      placeholder={t('settings.companyPlaceholder', language)}
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
                {t('settings.passwordSection', language)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('settings.currentPassword', language)}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder', language)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">{t('settings.newPassword', language)}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('settings.newPasswordPlaceholder', language)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">{t('auth.confirmPassword', language)}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('settings.confirmNewPassword', language)}
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
                  {t('settings.changePassword', language)}
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
                {t('settings.languageDesc', language)}
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
                {t('settings.themeDesc', language)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'light' as const, label: t('settings.light', language), icon: Sun },
                  { value: 'dark' as const, label: t('settings.dark', language), icon: Moon },
                  { value: 'system' as const, label: t('settings.system', language), icon: MonitorIcon },
                ]).map(({ value, label, icon: Icon }) => (
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
                {t('settings.notificationsDesc', language)}
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
                      <p className="text-sm font-medium">{t('settings.emailNotifications', language)}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.emailNotificationsDesc', language)}</p>
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
                      <p className="text-sm font-medium">{t('settings.botActivity', language)}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.botActivityDesc', language)}</p>
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
                      <p className="text-sm font-medium">{t('settings.weeklyReports', language)}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.weeklyReportsDesc', language)}</p>
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
                      <p className="text-sm font-medium">{t('settings.marketingEmails', language)}</p>
                      <p className="text-xs text-muted-foreground">{t('settings.marketingEmailsDesc', language)}</p>
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
                {t('settings.dangerZone', language)}
              </CardTitle>
              <CardDescription className="text-destructive/70">
                {t('settings.dangerZoneDesc', language)}
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
                      {t('settings.deleteAccountDesc', language)}
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
                          {t('settings.areYouSure', language)}
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <p>
                              {t('settings.deleteConfirmDesc', language)}
                            </p>
                            <div className="space-y-2">
                              <p className="text-sm font-medium">
                                {t('settings.typeToDeleteBefore', language)}{' '}
                                <Badge variant="destructive">DELETE</Badge>{' '}
                                {t('settings.typeToDeleteAfter', language)}
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
