'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useAppStore } from '@/stores';
import { t, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Lock, Loader2, Eye, EyeOff, ArrowLeft, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';

export function ResetPasswordForm() {
  const lang = useAppStore((s) => s.language) as Language;
  const setPage = useAppStore((s) => s.setPage);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenParams, setTokenParams] = useState<{
    email: string;
    token: string;
    expires: string;
    sig: string;
  } | null>(null);

  // Read token params from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const token = params.get('token');
    const expires = params.get('expires');
    const sig = params.get('sig');

    if (email && token && expires && sig) {
      setTokenParams({ email, token, expires, sig });
    } else {
      setError(
        lang === 'ru'
          ? 'Недействительная ссылка. Запросите новую.'
          : lang === 'en'
            ? 'Invalid link. Please request a new one.'
            : 'Geçersiz bağlantı. Yenisini isteyin.',
      );
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!tokenParams) return;

    if (newPassword.length < 8) {
      setError(lang === 'ru' ? 'Пароль должен быть не менее 8 символов' : 'Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(lang === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: tokenParams.email,
          token: tokenParams.token,
          expires: tokenParams.expires,
          sig: tokenParams.sig,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error', lang));
        return;
      }

      setIsSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 py-12">
      <Card className="w-full max-w-md border-emerald-100 shadow-lg shadow-emerald-100/40">
        <CardHeader className="flex flex-col items-center gap-2 pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-200">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-emerald-700">
              {t('common.appName', lang)}
            </h1>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {lang === 'ru' ? 'Новый пароль' : lang === 'en' ? 'New Password' : 'Yeni Şifre'}
          </h2>
          {!tokenParams && !isSuccess && (
            <p className="text-sm text-muted-foreground">
              {error}
            </p>
          )}
        </CardHeader>

        <CardContent className="pt-4">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {lang === 'ru'
                    ? 'Пароль успешно изменён!'
                    : lang === 'en'
                      ? 'Password changed successfully!'
                      : 'Şifre başarıyla değiştirildi!'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ru'
                    ? 'Теперь вы можете войти с новым паролем.'
                    : lang === 'en'
                      ? 'You can now sign in with your new password.'
                      : 'Artık yeni şifrenizle giriş yapabilirsiniz.'}
                </p>
              </div>
            </div>
          ) : tokenParams ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {lang === 'ru' ? 'Новый пароль' : lang === 'en' ? 'New password' : 'Yeni şifre'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9 pr-10 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  {t('auth.confirmPassword', lang)}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-200/50 transition-all"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading', lang)}
                  </>
                ) : (
                  lang === 'ru'
                    ? 'Изменить пароль'
                    : lang === 'en'
                      ? 'Change password'
                      : 'Şifreyi değiştir'
                )}
              </Button>
            </form>
          ) : null}
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <button
            type="button"
            onClick={() => setPage('login')}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('auth.login', lang)}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
}
