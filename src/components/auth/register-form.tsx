'use client';

import { useState, useMemo, type FormEvent } from 'react';
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
import {
  Bot,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Sparkles,
  User,
  Building2,
  CheckCircle2,
  Circle,
} from 'lucide-react';

interface PasswordStrength {
  label: string;
  color: string;
  bgColor: string;
  score: number;
}

function getPasswordStrength(password: string): PasswordStrength {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1)
    return { label: 'Weak', color: 'text-red-500', bgColor: 'bg-red-500', score: 1 };
  if (score === 2)
    return { label: 'Fair', color: 'text-amber-500', bgColor: 'bg-amber-500', score: 2 };
  if (score === 3)
    return { label: 'Good', color: 'text-yellow-500', bgColor: 'bg-yellow-500', score: 3 };
  if (score === 4)
    return { label: 'Strong', color: 'text-emerald-500', bgColor: 'bg-emerald-500', score: 4 };
  return { label: 'Very Strong', color: 'text-teal-500', bgColor: 'bg-teal-500', score: 5 };
}

export function RegisterForm() {
  const lang = useAppStore((s) => s.language) as Language;
  const setPage = useAppStore((s) => s.setPage);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError(t('auth.email', lang) + ' is required');
      return;
    }

    if (password.length < 8) {
      setError(t('auth.weakPassword', lang));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordsNoMatch', lang));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: name.trim() || undefined,
          company: company.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error', lang));
        return;
      }

      setSuccess(t('auth.registerSuccess', lang));
      const userData = { ...data.user };
      if (data.demoExpiresAt) {
        userData.demoExpiresAt = data.demoExpiresAt;
        userData.planName = 'demo';
        userData.planStatus = 'active';
      }
      useAuthStore.getState().login(userData, data.token);
      useAppStore.getState().setPage('dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchToLogin = () => {
    setPage('login');
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
            {t('auth.register', lang)}
          </h2>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {/* Name (optional) */}
            <div className="space-y-2">
              <Label htmlFor="register-name">
                <span className="flex items-center gap-1.5">
                  {t('auth.name', lang)}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="register-email">
                {t('auth.email', lang)}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-email"
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="register-password">
                {t('auth.password', lang)}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          level <= passwordStrength.score
                            ? passwordStrength.bgColor
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="register-confirm-password">
                {t('auth.confirmPassword', lang)}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-9 pr-10 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30 ${
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? 'border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/30'
                      : confirmPassword.length > 0 && password === confirmPassword
                        ? 'border-emerald-300 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30'
                        : ''
                  }`}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword.length > 0 && password === confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <Circle className="h-3 w-3" />
                  {t('auth.passwordsNoMatch', lang)}
                </p>
              )}
            </div>

            {/* Company (optional) */}
            <div className="space-y-2">
              <Label htmlFor="register-company">
                <span className="flex items-center gap-1.5">
                  {t('auth.company', lang)}
                  <span className="text-xs font-normal text-muted-foreground">
                    (optional)
                  </span>
                </span>
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="register-company"
                  type="text"
                  placeholder="Acme Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="pl-9 focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                  disabled={isLoading}
                  autoComplete="organization"
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
                t('auth.registerButton', lang)
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <p className="text-sm text-muted-foreground">
            {t('auth.hasAccount', lang)}{' '}
            <button
              type="button"
              onClick={handleSwitchToLogin}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              {t('auth.login', lang)}
            </button>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
