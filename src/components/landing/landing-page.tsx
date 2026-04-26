'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { useAppStore } from '@/stores';
import { t, allLanguages, type Language } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Calendar,
  MessageSquare,
  BarChart3,
  Layout,
  Code,
  Zap,
  Shield,
  Clock,
  Globe,
  ArrowRight,
  Check,
  Moon,
  Sun,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';

// ─── Section IDs for smooth scrolling ───────────────────────────────
const SECTIONS = {
  features: 'features',
  howItWorks: 'how-it-works',
  pricing: 'pricing',
  faq: 'faq',
} as const;

// ─── Feature data ───────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Bot,
    titleKey: 'landing.feature1Title',
    descKey: 'landing.feature1Desc',
  },
  {
    icon: Calendar,
    titleKey: 'landing.feature2Title',
    descKey: 'landing.feature2Desc',
  },
  {
    icon: MessageSquare,
    titleKey: 'landing.feature3Title',
    descKey: 'landing.feature3Desc',
  },
  {
    icon: BarChart3,
    titleKey: 'landing.feature4Title',
    descKey: 'landing.feature4Desc',
  },
  {
    icon: Layout,
    titleKey: 'landing.feature5Title',
    descKey: 'landing.feature5Desc',
  },
  {
    icon: Code,
    titleKey: 'landing.feature6Title',
    descKey: 'landing.feature6Desc',
  },
] as const;

// ─── How It Works steps ─────────────────────────────────────────────
const STEPS = [
  { num: 1, textKey: 'landing.step1' },
  { num: 2, textKey: 'landing.step2' },
  { num: 3, textKey: 'landing.step3' },
  { num: 4, textKey: 'landing.step4' },
] as const;

// ─── Pricing plans ──────────────────────────────────────────────────
const PLANS = [
  {
    id: 'monthly',
    nameKey: 'subscription.monthly',
    priceKey: 'landing.pricingMonthlyPrice',
    periodKey: 'landing.pricingPerMonth',
    billingKey: null,
    savePercent: null,
    badge: null,
    features: [
      'landing.pricingFeatureBasic',
      'landing.pricingFeatureConversations',
      'landing.pricingFeatureBasicAnalytics',
      'landing.pricingFeatureWebsite',
    ],
  },
  {
    id: 'quarterly',
    nameKey: 'subscription.quarterly',
    priceKey: 'landing.pricingQuarterlyPrice',
    periodKey: 'landing.pricingPerMonth',
    billingKey: 'landing.pricingBilledQuarterly',
    savePercent: 15,
    badge: 'popular' as const,
    features: [
      'landing.pricingFeatureUnlimitedBots',
      'landing.pricingFeatureUnlimitedConv',
      'landing.pricingFeatureFullAnalytics',
      'landing.pricingFeatureAllChannels',
      'landing.pricingFeatureBooking',
      'landing.pricingFeatureTemplates',
    ],
  },
  {
    id: 'yearly',
    nameKey: 'subscription.yearly',
    priceKey: 'landing.pricingYearlyPrice',
    periodKey: 'landing.pricingPerMonth',
    billingKey: 'landing.pricingBilledYearly',
    savePercent: 30,
    badge: null,
    features: [
      'landing.pricingFeatureUnlimitedBots',
      'landing.pricingFeatureUnlimitedConv',
      'landing.pricingFeatureFullAnalytics',
      'landing.pricingFeatureAllChannels',
      'landing.pricingFeatureBooking',
      'landing.pricingFeatureTemplates',
      'landing.pricingFeatureApi',
      'landing.pricingFeaturePriority',
    ],
  },
  {
    id: 'lifetime',
    nameKey: 'subscription.lifetime',
    priceKey: 'landing.pricingLifetimePrice',
    periodKey: null,
    billingKey: 'landing.pricingOneTime',
    savePercent: null,
    badge: null,
    features: [
      'landing.pricingFeatureUnlimitedBots',
      'landing.pricingFeatureUnlimitedConv',
      'landing.pricingFeatureFullAnalytics',
      'landing.pricingFeatureAllChannels',
      'landing.pricingFeatureBooking',
      'landing.pricingFeatureTemplates',
      'landing.pricingFeatureApi',
      'landing.pricingFeaturePriority',
      'landing.pricingFeatureWhiteLabel',
      'landing.pricingFeatureCustom',
      'landing.pricingFeatureDedicated',
    ],
  },
] as const;

// ─── FAQ data ───────────────────────────────────────────────────────
const FAQS = [
  { qKey: 'landing.faq1q', aKey: 'landing.faq1a' },
  { qKey: 'landing.faq2q', aKey: 'landing.faq2a' },
  { qKey: 'landing.faq3q', aKey: 'landing.faq3a' },
  { qKey: 'landing.faq4q', aKey: 'landing.faq4a' },
  { qKey: 'landing.faq5q', aKey: 'landing.faq5a' },
  { qKey: 'landing.faq6q', aKey: 'landing.faq6a' },
] as const;

// ─── Stat items ─────────────────────────────────────────────────────
const STATS = [
  { valueKey: 'landing.statsBotsValue', labelKey: 'landing.statsBots' },
  { valueKey: 'landing.statsUptimeValue', labelKey: 'landing.statsUptime' },
  { valueKey: 'landing.statsSupportValue', labelKey: 'landing.statsSupport' },
] as const;

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
export default function LandingPage() {
  const { language, setLanguage, setPage } = useAppStore();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avoid hydration mismatch — client-only after mount
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const scrollTo = useCallback((id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleGetStarted = useCallback(() => {
    useAppStore.getState().setPage('register');
  }, []);

  const handleSignIn = useCallback(() => {
    useAppStore.getState().setPage('login');
  }, []);

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-16" />
      </div>
    );
  }

  const lang = language;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ──────────── HEADER / NAVBAR ──────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              {lang === 'ru' ? 'АгентБот' : 'AgentBot'}
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: t('landing.navFeatures', lang), id: SECTIONS.features },
              { label: t('landing.navHowItWorks', lang), id: SECTIONS.howItWorks },
              { label: t('landing.navPricing', lang), id: SECTIONS.pricing },
              { label: t('landing.navFaq', lang), id: SECTIONS.faq },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="hidden items-center gap-1 sm:flex">
              {allLanguages.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`flex h-8 items-center gap-1 rounded-md px-2 text-sm transition-colors ${
                    language === l
                      ? 'bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="uppercase text-sm font-semibold">{l}</span>
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Desktop Auth Buttons */}
            <div className="hidden items-center gap-2 md:flex">
              <Button variant="ghost" size="sm" onClick={handleSignIn}>
                {t('landing.signIn', lang)}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleGetStarted}
              >
                {t('landing.getStarted', lang)}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/40 bg-background md:hidden">
            <div className="space-y-1 px-4 py-3">
              {/* Mobile Nav Links */}
              {[
                { label: t('landing.navFeatures', lang), id: SECTIONS.features },
                { label: t('landing.navHowItWorks', lang), id: SECTIONS.howItWorks },
                { label: t('landing.navPricing', lang), id: SECTIONS.pricing },
                { label: t('landing.navFaq', lang), id: SECTIONS.faq },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </button>
              ))}

              {/* Mobile Language Switcher */}
              <div className="flex items-center gap-1 px-3 pt-2">
                {allLanguages.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLanguage(l)}
                    className={`flex h-8 items-center gap-1 rounded-md px-2 text-sm transition-colors ${
                      language === l
                        ? 'bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="uppercase text-sm font-semibold">{l}</span>
                  </button>
                ))}
              </div>

              {/* Mobile Auth Buttons */}
              <div className="flex items-center gap-2 px-3 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={handleSignIn}
                >
                  {t('landing.signIn', lang)}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleGetStarted}
                >
                  {t('landing.getStarted', lang)}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ──────────── HERO SECTION ──────────── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-teal-500/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: Text Content */}
            <div className="max-w-2xl lg:max-w-none">
              <Badge
                variant="secondary"
                className="mb-6 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
              >
                <Zap className="mr-1 h-3 w-3" />
                {t('landing.ctaSub', lang)}
              </Badge>

              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                {t('landing.hero', lang)}
              </h1>

              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                {t('landing.heroSub', lang)}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  className="h-12 bg-emerald-600 px-8 text-base font-semibold text-white hover:bg-emerald-700"
                  onClick={handleGetStarted}
                >
                  {t('landing.cta', lang)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-base"
                  onClick={() => scrollTo(SECTIONS.howItWorks)}
                >
                  {t('landing.navHowItWorks', lang)}
                </Button>
              </div>
            </div>

            {/* Right: Hero Illustration (gradient + emoji pattern) */}
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 shadow-2xl">
                {/* Chat bubble pattern overlay */}
                <div className="absolute inset-0 flex flex-col items-start justify-center gap-4 p-8">
                  {/* Bot message bubble */}
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/20 px-5 py-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                      👋 {lang === 'ru' ? 'Здравствуйте! Чем могу помочь?' : lang === 'tr' ? 'Merhaba! Size nasıl yardımcı olabilirim?' : 'Hello! How can I help you?'}
                    </p>
                  </div>
                  {/* User message bubble */}
                  <div className="ml-auto max-w-[75%] rounded-2xl rounded-tr-sm bg-white/30 px-5 py-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                      {lang === 'ru' ? '📅 Хочу записаться на пятницу' : lang === 'tr' ? '📅 Cuma günü randevu almak istiyorum' : '📅 I want to book an appointment for Friday'}
                    </p>
                  </div>
                  {/* Bot reply bubble */}
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/20 px-5 py-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                      ✅ {lang === 'ru' ? 'Отлично! Свободные слоты: 10:00, 14:00, 16:30' : lang === 'tr' ? 'Harika! Müsait saatler: 10:00, 14:00, 16:30' : 'Great! Available slots: 10:00, 14:00, 16:30'}
                    </p>
                  </div>
                  {/* User reply */}
                  <div className="ml-auto max-w-[60%] rounded-2xl rounded-tr-sm bg-white/30 px-5 py-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                      14:00 ✨
                    </p>
                  </div>
                  {/* Bot confirmation */}
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-white/20 px-5 py-3 backdrop-blur-sm">
                    <p className="text-sm font-medium text-white">
                      🎉 {lang === 'ru' ? 'Готово! Ждём вас в пятницу в 14:00' : lang === 'tr' ? 'Tamamlandı! Cuma 14:00\'te sizi bekliyoruz' : 'Done! See you Friday at 14:00'}
                    </p>
                  </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-6 -right-6 h-24 w-24 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-sm" />
                <div className="absolute -left-4 -top-4 h-16 w-16 rounded-xl border-2 border-white/20 bg-white/10 backdrop-blur-sm" />
              </div>

              {/* Floating stat cards */}
              <div className="absolute -left-4 top-8 hidden rounded-xl border border-border/50 bg-card p-3 shadow-lg sm:block dark:bg-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                    <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{lang === 'ru' ? 'АгентБот' : 'AgentBot'}</p>
                    <p className="text-sm font-semibold">AI Powered</p>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 hidden rounded-xl border border-border/50 bg-card p-3 shadow-lg sm:block dark:bg-card">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                    <Globe className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      {lang === 'ru' ? 'Каналы' : 'Channels'}
                    </p>
                    <p className="text-sm font-semibold">3+</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-3 gap-4 rounded-2xl border border-border/50 bg-card p-6 sm:p-8 lg:mt-20">
            {STATS.map((stat) => (
              <div key={stat.labelKey} className="text-center">
                <p className="text-2xl font-extrabold text-emerald-600 sm:text-3xl dark:text-emerald-400">
                  {t(stat.valueKey, lang)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(stat.labelKey, lang)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES SECTION ──────────── */}
      <section
        id={SECTIONS.features}
        className="border-t border-border/40 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.features', lang)}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('landing.heroSub', lang)}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {FEATURES.map((feature) => (
              <Card
                key={feature.titleKey}
                className="group relative overflow-hidden border-border/50 transition-all duration-300 hover:border-emerald-200 hover:shadow-lg dark:hover:border-emerald-800"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:bg-emerald-900/40 dark:text-emerald-400 dark:group-hover:bg-emerald-600 dark:group-hover:text-white">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">
                    {t(feature.titleKey, lang)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey, lang)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── HOW IT WORKS SECTION ──────────── */}
      <section id={SECTIONS.howItWorks} className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.howItWorks', lang)}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('landing.ctaSub', lang)}
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, idx) => (
              <div key={step.num} className="relative text-center">
                {/* Connector line */}
                {idx < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-10 hidden h-0.5 w-full bg-gradient-to-r from-emerald-300 to-emerald-100 lg:block dark:from-emerald-700 dark:to-emerald-900" />
                )}

                {/* Step number circle */}
                <div className="relative mx-auto mb-5 flex h-20 w-20 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-900/30" />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-lg font-bold text-white shadow-lg shadow-emerald-600/25">
                    {step.num}
                  </div>
                </div>

                <h3 className="text-base font-semibold leading-relaxed">
                  {t(step.textKey, lang)}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── PRICING SECTION ──────────── */}
      <section
        id={SECTIONS.pricing}
        className="border-t border-border/40 bg-muted/30 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.pricing', lang)}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('landing.pricingSubtitle', lang)}
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <Card
                key={plan.id}
                className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg ${
                  plan.badge === 'popular'
                    ? 'border-2 border-emerald-500 shadow-emerald-500/10'
                    : 'border-border/50'
                }`}
              >
                {/* Popular Badge */}
                {plan.badge === 'popular' && (
                  <div className="absolute -right-8 top-4 rotate-45">
                    <Badge className="bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                      {t('landing.pricingPopular', lang)}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    {t(plan.nameKey, lang)}
                  </CardTitle>
                  {plan.savePercent && (
                    <Badge
                      variant="secondary"
                      className="mt-1 w-fit border-emerald-200 bg-emerald-50 text-xs text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                      {t('subscription.savePercent', lang, {
                        percent: plan.savePercent,
                      })}
                    </Badge>
                  )}
                  <div className="mt-3">
                    <span className="text-4xl font-extrabold">
                      {t(plan.priceKey, lang)}
                    </span>
                    {plan.periodKey && (
                      <span className="text-sm text-muted-foreground">
                        {t(plan.periodKey, lang)}
                      </span>
                    )}
                  </div>
                  {plan.billingKey && (
                    <CardDescription className="mt-1">
                      {t(plan.billingKey, lang)}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-2.5">
                    {plan.features.map((fKey) => (
                      <li key={fKey} className="flex items-start gap-2.5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm text-muted-foreground">
                          {t(fKey, lang)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      plan.badge === 'popular'
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : ''
                    }`}
                    variant={plan.badge === 'popular' ? 'default' : 'outline'}
                    onClick={handleGetStarted}
                  >
                    {t('landing.pricingGetStarted', lang)}
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FAQ SECTION ──────────── */}
      <section id={SECTIONS.faq} className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.faq', lang)}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t('landing.pricingSubtitle', lang)}
            </p>
          </div>

          <div className="mt-12">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left text-base font-semibold">
                    {t(faq.qKey, lang)}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {t(faq.aKey, lang)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ──────────── CTA SECTION ──────────── */}
      <section className="border-t border-border/40 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 px-6 py-16 text-center shadow-xl sm:px-16 sm:py-20">
            {/* Decorative circles */}
            <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {t('landing.cta', lang)}
              </h2>
              <p className="mt-4 text-lg text-emerald-100">
                {t('landing.ctaSub', lang)}
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 bg-white px-8 text-base font-semibold text-emerald-700 hover:bg-emerald-50"
                  onClick={handleGetStarted}
                >
                  {t('landing.getStarted', lang)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 border-white/30 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
                  onClick={handleSignIn}
                >
                  {t('landing.signIn', lang)}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t border-border/40 bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">
                  {lang === 'ru' ? 'АгентБот' : 'AgentBot'}
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t('landing.footerDesc', lang)}
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('landing.features', lang)}
              </h3>
              <ul className="space-y-2.5">
                {[
                  { label: t('landing.navFeatures', lang), id: SECTIONS.features },
                  { label: t('landing.navHowItWorks', lang), id: SECTIONS.howItWorks },
                  { label: t('landing.navPricing', lang), id: SECTIONS.pricing },
                ].map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollTo(item.id)}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('common.settings', lang)}
              </h3>
              <ul className="space-y-2.5">
                <li>
                  <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t('landing.footerPrivacy', lang)}
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t('landing.footerTerms', lang)}
                  </button>
                </li>
                <li>
                  <button className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {t('landing.footerContact', lang)}
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacts */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Контакты' : lang === 'tr' ? 'İletişim' : 'Contact'}
              </h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'ru' ? 'mahdi9911@mail.ru' : lang === 'tr' ? 'boyazidwork@gmail.com' : 'ulugbeksamadov95@gmail.com'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'ru' ? '+7 927 784 50 45' : lang === 'tr' ? '+905 343 94 05 67' : '+1 732 581 00 43'}</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'ru' ? 'Москва, Россия' : lang === 'tr' ? 'Türkiye, Istanbul' : 'USA, Denver'}</span>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {lang === 'ru' ? 'Социальные сети' : 'Social'}
              </h3>
              <div className="flex gap-3">
                {/* Telegram */}
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:hover:border-emerald-800 dark:hover:text-emerald-400">
                  <MessageSquare className="h-4 w-4" />
                </button>
                {/* Twitter / X */}
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:hover:border-emerald-800 dark:hover:text-emerald-400">
                  <Globe className="h-4 w-4" />
                </button>
                {/* GitHub */}
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/50 text-muted-foreground transition-colors hover:border-emerald-200 hover:text-emerald-600 dark:hover:border-emerald-800 dark:hover:text-emerald-400">
                  <Code className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-8 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {lang === 'ru' ? 'АгентБот' : 'AgentBot'}.{' '}
              {t('landing.footerRights', lang)}
            </p>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-muted-foreground">
                {t('landing.statsUptimeValue', lang)}{' '}
                {t('landing.statsUptime', lang).toLowerCase()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
