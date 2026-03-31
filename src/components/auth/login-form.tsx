'use client';

import { useState, type FormEvent } from 'react';
import { useAuthStore, useAppStore } from '@/stores';
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
import { Bot, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';

export function LoginForm() {
  const lang = useAppStore((s) => s.language) as Language;
  const setPage = useAppStore((s) => s.setPage);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('auth.email', lang) + ' is required');
      return;
    }
    if (!password) {
      setError(t('auth.password', lang) + ' is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error', lang));
        return;
      }

      // Merge demo/subscription data into user
      const userData = { ...data.user };
      if (data.demoPeriod?.expiresAt) {
        userData.demoExpiresAt = data.demoPeriod.expiresAt;
      }
      if (data.subscription) {
        userData.planName = data.subscription.plan;
        userData.planStatus = data.subscription.status;
      }
      useAuthStore.getState().login(userData, data.token);
      useAppStore.getState().setPage('dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    console.log('[LoginForm] Forgot password clicked for:', email || '(empty)');
  };

  const handleSwitchToRegister = () => {
    setPage('register');
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
          <p className="text-sm text-muted-foreground">
            {t('common.appTagline', lang)}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {t('auth.login', lang)}
          </h2>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="login-email">
                {t('auth.email', lang)}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">
                  {t('auth.password', lang)}
                </Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  {t('auth.forgotPassword', lang)}
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 pr-10 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                  disabled={isLoading}
                  autoComplete="current-password"
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
                t('auth.loginButton', lang)
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            {t('auth.noAccount', lang)}{' '}
            <button
              type="button"
              onClick={handleSwitchToRegister}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              {t('auth.register', lang)}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
