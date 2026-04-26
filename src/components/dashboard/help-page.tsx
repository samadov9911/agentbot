'use client';

import React, { useState, useMemo, useCallback, useSyncExternalStore } from 'react';
import { DocumentationOverlay, type DocPageId } from '@/components/dashboard/documentation-pages';
import {
  Bot,
  Wrench,
  Code2,
  BarChart3,
  CreditCard,
  ArrowRight,
  Search,
  Send,
  Loader2,
  BookOpen,
  Plug,
  LayoutTemplate,
  MessageSquare,
  Sparkles,
  Rocket,
  Settings,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import type { AppPage } from '@/types';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';

// ──────────────────────────────────────────────────────────────
// FAQ Data
// ──────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  { qKey: 'help.faqQ1', aKey: 'help.faqA1' },
  { qKey: 'help.faqQ2', aKey: 'help.faqA2' },
  { qKey: 'help.faqQ3', aKey: 'help.faqA3' },
  { qKey: 'help.faqQ4', aKey: 'help.faqA4' },
  { qKey: 'help.faqQ5', aKey: 'help.faqA5' },
  { qKey: 'help.faqQ6', aKey: 'help.faqA6' },
  { qKey: 'help.faqQ7', aKey: 'help.faqA7' },
  { qKey: 'help.faqQ8', aKey: 'help.faqA8' },
];

// ──────────────────────────────────────────────────────────────
// Getting Started Steps
// ──────────────────────────────────────────────────────────────
const STEPS = [
  { num: 1, titleKey: 'help.step1Title', descKey: 'help.step1Desc', icon: Rocket, color: 'emerald' },
  { num: 2, titleKey: 'help.step2Title', descKey: 'help.step2Desc', icon: Wrench, color: 'teal' },
  { num: 3, titleKey: 'help.step3Title', descKey: 'help.step3Desc', icon: Settings, color: 'amber' },
  { num: 4, titleKey: 'help.step4Title', descKey: 'help.step4Desc', icon: Sparkles, color: 'violet' },
];

// ──────────────────────────────────────────────────────────────
// Quick Links
// ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { titleKey: 'help.quickLinkBuilder', descKey: 'help.quickLinkBuilderDesc', icon: Bot, page: 'bot-builder' as AppPage, badgeKey: 'help.popular', color: 'emerald' },
  { titleKey: 'help.quickLinkAnalytics', descKey: 'help.quickLinkAnalyticsDesc', icon: BarChart3, page: 'analytics' as AppPage, badge: null, color: 'teal' },
  { titleKey: 'help.quickLinkSubscription', descKey: 'help.quickLinkSubscriptionDesc', icon: CreditCard, page: 'subscription' as AppPage, badge: null, color: 'amber' },
];

// ──────────────────────────────────────────────────────────────
// Documentation Links
// ──────────────────────────────────────────────────────────────
const DOC_LINKS = [
  { titleKey: 'help.docApiTitle', descKey: 'help.docApiDesc', icon: Code2, color: 'emerald' },
  { titleKey: 'help.docIntegrationTitle', descKey: 'help.docIntegrationDesc', icon: Plug, color: 'teal' },
  { titleKey: 'help.docWidgetTitle', descKey: 'help.docWidgetDesc', icon: LayoutTemplate, color: 'amber' },
  { titleKey: 'help.docTelegramTitle', descKey: 'help.docTelegramDesc', icon: MessageSquare, color: 'violet' },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/50',
    icon: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  teal: {
    bg: 'bg-teal-100 dark:bg-teal-900/50',
    icon: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-900/50',
    icon: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  violet: {
    bg: 'bg-violet-100 dark:bg-violet-900/50',
    icon: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
  },
};

const DOC_LINK_MAP: Record<number, DocPageId> = {
  0: 'api',
  1: 'integration',
  2: 'widget',
  3: 'telegram',
};

// ──────────────────────────────────────────────────────────────
// Help Page
// ──────────────────────────────────────────────────────────────
export function HelpPage() {
  const language = useAppStore((s) => s.language);
  const user = useAuthStore((s) => s.user);
  const setPage = useAppStore((s) => s.setPage);

  // Hydration guard
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // ── FAQ search ──
  const [faqSearch, setFaqSearch] = useState('');

  const filteredFaqs = useMemo(() => {
    const query = faqSearch.toLowerCase().trim();
    if (!query) return FAQ_ITEMS;
    return FAQ_ITEMS.filter(
      (item) =>
        t(item.qKey, language).toLowerCase().includes(query) ||
        t(item.aKey, language).toLowerCase().includes(query)
    );
  }, [faqSearch, language]);

  // ── Documentation overlay ──
  const [activeDocPage, setActiveDocPage] = useState<DocPageId | null>(null);

  const handleOpenDoc = useCallback((index: number) => {
    setActiveDocPage(DOC_LINK_MAP[index] || null);
  }, []);

  const handleCloseDoc = useCallback(() => {
    setActiveDocPage(null);
  }, []);

  // ── Contact form ──
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);

  // Pre-fill from user
  React.useEffect(() => {
    if (user) {
      setContactName(user.name || '');
      setContactEmail(user.email);
    }
  }, [user]);

  const handleContactSubmit = useCallback(async () => {
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      toast.error(t('help.fillFields', language));
      return;
    }
    setContactSending(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setContactMessage('');
      toast.success(t('help.messageSent', language));
    } catch {
      toast.error(t('help.messageFailed', language));
    } finally {
      setContactSending(false);
    }
  }, [contactName, contactEmail, contactMessage, language]);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-[500px] animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  // Show documentation overlay if active
  if (activeDocPage) {
    return <DocumentationOverlay pageId={activeDocPage} onBack={handleCloseDoc} />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('help.title', language)}</h1>
        <p className="text-muted-foreground">
          {t('help.subtitle', language)}
        </p>
      </div>

      {/* ── Getting Started Guide ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5 text-emerald-600" />
          {t('help.gettingStarted', language)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ num, titleKey, descKey, icon: Icon, color }) => {
            const colors = COLOR_MAP[color];
            return (
              <Card key={num} className="relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="absolute right-3 top-3">
                  <Badge variant="outline" className="text-xs font-bold text-muted-foreground">
                    {num}
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${colors.bg}`}>
                    <Icon className={`size-6 ${colors.icon}`} />
                  </div>
                  <h3 className="mb-1 font-semibold">{t(titleKey, language)}</h3>
                  <p className="text-sm text-muted-foreground">{t(descKey, language)}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => setPage('bot-builder')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Rocket className="mr-2 size-4" />
            {t('help.goToBotBuilder', language)}
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── FAQ Section ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="size-5 text-emerald-600" />
          {t('help.faqSection', language)}
        </h2>
        <Card>
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder={t('help.searchPlaceholder', language)}
                className="pl-10"
              />
            </div>
            {faqSearch && (
              <p className="mt-2 text-sm text-muted-foreground">
                {t('help.foundResults', language, { count: filteredFaqs.length })}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {t(item.qKey, language)}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {t(item.aKey, language)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  {t('help.noSearchResults', language, { query: faqSearch })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Quick Links ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="size-5 text-emerald-600" />
          {t('help.quickLinks', language)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ titleKey, descKey, icon: Icon, page, badgeKey, color }) => {
            const colors = COLOR_MAP[color];
            return (
              <Card
                key={page}
                className="group cursor-pointer transition-all hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-800"
                onClick={() => setPage(page)}
              >
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={`flex size-11 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`size-5 ${colors.icon}`} />
                    </div>
                    {badgeKey && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {t(badgeKey, language)}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold">{t(titleKey, language)}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{t(descKey, language)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    {t('help.goTo', language)}
                    <ArrowRight className="ml-2 size-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* ── Contact Support ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Send className="size-5 text-emerald-600" />
          {t('help.contactSupport', language)}
        </h2>
        <Card>
          <CardHeader>
            <CardTitle>{t('help.contactTitle', language)}</CardTitle>
            <CardDescription>
              {t('help.contactDesc', language)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">{t('settings.name', language)}</Label>
                <Input
                  id="contact-name"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder={t('help.yourName', language)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">{t('settings.email', language)}</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-message">{t('help.message', language)}</Label>
              <Textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder={t('help.messagePlaceholder', language)}
                rows={5}
                className="resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleContactSubmit}
                disabled={
                  contactSending ||
                  !contactName.trim() ||
                  !contactEmail.trim() ||
                  !contactMessage.trim()
                }
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {contactSending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {t('common.send', language)}
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      {/* ── Documentation Links ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5 text-emerald-600" />
          {t('help.documentation', language)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_LINKS.map(({ titleKey, descKey, icon: Icon, color }, index) => {
            const colors = COLOR_MAP[color];
            return (
              <Card
                key={index}
                className="group cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleOpenDoc(index)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`size-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{t(titleKey, language)}</h3>
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground">{t(descKey, language)}</p>
                      <Button variant="ghost" size="sm" className="mt-2 -ml-2 h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                        <BookOpen className="mr-1.5 size-3.5" />
                        {t('help.readDocs', language)}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export default HelpPage;
