'use client';

import { useState, type FormEvent } from 'react';
import { useAppStore } from '@/stores';
import { t, type Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bot, Mail, Lock, Eye, EyeOff, Loader2, Sparkles, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';

export function ForgotPasswordForm() {
  const lang = useAppStore((s) => s.language) as Language;
  const setPage = useAppStore((s) => s.setPage);

  // Step 1: Enter email
  // Step 2: Enter code + new password
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(lang === 'ru' ? 'Введите email' : 'Enter your email');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setCodeSent(true);
      setStep('code');
      // If email service not configured, pre-fill the code from response
      if (data.code) {
        setCode(data.code);
      }
    } catch {
      setError(lang === 'ru' ? 'Ошибка сети. Попробуйте ещё раз.' : 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code || code.length !== 6) {
      setError(lang === 'ru' ? 'Введите 6-значный код' : 'Enter 6-digit code');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError(lang === 'ru' ? 'Пароль минимум 8 символов' : 'Password must be at least 8 characters');
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
        body: JSON.stringify({ email: email.trim(), code, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSuccess(true);
    } catch {
      setError(lang === 'ru' ? 'Ошибка сети. Попробуйте ещё раз.' : 'Network error. Please try again.');
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
            {step === 'email'
              ? (lang === 'ru' ? 'Восстановление пароля' : lang === 'tr' ? 'Şifre Sıfırlama' : 'Reset Password')
              : (lang === 'ru' ? 'Введите код' : lang === 'tr' ? 'Kodu Girin' : 'Enter Code')}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {step === 'email'
              ? (lang === 'ru' ? 'Мы отправим код подтверждения на ваш email' : lang === 'tr' ? 'Onay kodunu e-posta adresinize göndereceğiz' : 'We\'ll send a verification code to your email')
              : (lang === 'ru' ? `Код отправлен на ${email}` : lang === 'tr' ? `${email} adresine kod gönderildi` : `Code sent to ${email}`)}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-emerald-500" />
              <p className="text-sm text-center text-emerald-700 font-medium">
                {lang === 'ru' ? 'Пароль успешно изменён!' : lang === 'tr' ? 'Şifre başarıyla sıfırlandı!' : 'Password has been reset successfully!'}
              </p>
              <Button
                onClick={() => setPage('login')}
                className="mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
              >
                {lang === 'ru' ? 'Войти' : lang === 'tr' ? 'Giriş Yap' : 'Back to Login'}
              </Button>
            </div>
          ) : step === 'email' ? (
            /* Step 1: Enter email */
            <form onSubmit={handleRequestCode} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-email">
                  {t('auth.email', lang)}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
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
                  <>{lang === 'ru' ? 'Отправить код' : lang === 'tr' ? 'Kod Gönder' : 'Send Code'}</>
                )}
              </Button>

              <button
                type="button"
                onClick={() => setPage('login')}
                className="flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {lang === 'ru' ? 'Назад к входу' : lang === 'tr' ? 'Girişe Dön' : 'Back to Login'}
              </button>
            </form>
          ) : (
            /* Step 2: Enter code + new password */
            <form onSubmit={handleResetPassword} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reset-code">
                  {lang === 'ru' ? 'Код подтверждения' : lang === 'tr' ? 'Onay Kodu' : 'Verification Code'}
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="pl-9 text-center text-lg tracking-[0.5em] font-mono focus-visible:border-emerald-400 focus-visible:ring-emerald-400/30"
                    disabled={isLoading}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === 'ru' ? 'Код из 6 цифр, действует 15 минут' : lang === 'tr' ? '6 haneli kod, 15 dakika geçerli' : '6-digit code, valid for 15 minutes'}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-password">
                  {lang === 'ru' ? 'Новый пароль' : lang === 'tr' ? 'Yeni Şifre' : 'New Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
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
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm">
                  {lang === 'ru' ? 'Подтвердите пароль' : lang === 'tr' ? 'Şifre Tekrar' : 'Confirm Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-confirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={lang === 'ru' ? 'Повторите пароль' : lang === 'tr' ? 'Şifre tekrar' : 'Repeat password'}
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
                  <>{lang === 'ru' ? 'Сбросить пароль' : lang === 'tr' ? 'Şifreyi Sıfırla' : 'Reset Password'}</>
                )}
              </Button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setStep('email'); setError(null); setCodeSent(false); }}
                  className="flex-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
                >
                  {lang === 'ru' ? 'Изменить email' : lang === 'tr' ? 'E-posta Değiştir' : 'Change email'}
                </button>
                <span className="text-muted-foreground">|</span>
                <button
                  type="button"
                  onClick={() => setPage('login')}
                  className="flex-1 text-sm text-muted-foreground hover:text-foreground transition-colors text-center py-2"
                >
                  {lang === 'ru' ? 'Назад к входу' : lang === 'tr' ? 'Girişe Dön' : 'Back to Login'}
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
