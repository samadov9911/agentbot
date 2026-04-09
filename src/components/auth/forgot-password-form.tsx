'use client';

import { useState, type FormEvent } from 'react';
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
import { Bot, Mail, Loader2, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const lang = useAppStore((s) => s.language) as Language;
  const setPage = useAppStore((s) => s.setPage);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError(t('auth.email', lang) + ' is required');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('common.error', lang));
        return;
      }

      setIsSent(true);
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
            {lang === 'ru' ? 'Сброс пароля' : lang === 'en' ? 'Reset Password' : 'Şifre Sıfırlama'}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {lang === 'ru'
              ? 'Введите email, и мы отправим вам ссылку для сброса пароля'
              : lang === 'en'
                ? 'Enter your email and we\'ll send you a password reset link'
                : 'E-posta adresinizi girin, size sıfırlama bağlantısı göndereceğiz'}
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {isSent ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {lang === 'ru'
                    ? 'Письмо отправлено!'
                    : lang === 'en'
                      ? 'Email sent!'
                      : 'E-posta gönderildi!'}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {lang === 'ru'
                    ? 'Если аккаунт с таким email существует, вы получите письмо со ссылкой для сброса пароля. Проверьте также папку Спам.'
                    : lang === 'en'
                      ? 'If an account with this email exists, you will receive a password reset link. Also check your Spam folder.'
                      : 'Bu e-posta ile bir hesap varsa, sıfırlama bağlantısı alacaksınız. Spam klasörünüzü de kontrol edin.'}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="forgot-email">
                  {t('auth.email', lang)}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="forgot-email"
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
                  lang === 'ru'
                    ? 'Отправить ссылку'
                    : lang === 'en'
                      ? 'Send reset link'
                      : 'Bağlantı gönder'
                )}
              </Button>
            </form>
          )}
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
