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
  CheckCircle2,
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
  {
    question: 'Как быстро можно настроить бота?',
    answer:
      'Вы можете создать и запустить первого AI-бота менее чем за 10 минут. Наш пошаговый конструктор проведёт вас через весь процесс — от выбора типа бота до настройки внешнего вида виджета.',
  },
  {
    question: 'Нужны ли навыки программирования?',
    answer:
      'Программирование не требуется! АгентБот предоставляет визуальный конструктор с готовыми шаблонами для разных ниш. Просто вставьте одну строку кода на свой сайт для активации виджета.',
  },
  {
    question: 'Можно попробовать перед покупкой?',
    answer:
      'Конечно! Каждый новый аккаунт получает 7 дней бесплатного пробного периода с полным доступом ко всем функциям. Кредитная карта не требуется. После окончания пробного периода вы можете выбрать подходящий тариф.',
  },
  {
    question: 'Какие каналы поддерживаются?',
    answer:
      'Ваш бот работает на сайте, в Telegram и WhatsApp одновременно — всё управляется из единого кабинета. Скоро появятся новые каналы: Instagram, VK и другие.',
  },
  {
    question: 'Можно ли отменить подписку в любое время?',
    answer:
      'Да, вы можете отменить подписку в любой момент. Никаких долгосрочных контрактов или скрытых платежей. Ваши данные остаются доступными даже после отмены.',
  },
  {
    question: 'Как работает AI-запись?',
    answer:
      'Бот интегрируется с вашим календарём, предлагает клиентам свободные слоты и автоматически подтверждает записи. Вы задаёте правила — дни, время, длительность слота, а AI делает всё остальное.',
  },
  {
    question: 'Как интегрировать виджет на сайт?',
    answer:
      'После создания бота перейдите в раздел "Мои боты", нажмите "Код для встраивания" и скопируйте сгенерированный скрипт. Вставьте его перед закрывающим тегом </body> на всех страницах вашего сайта.',
  },
  {
    question: 'Безопасны ли данные моих клиентов?',
    answer:
      'Да, все данные передаются по защищённому HTTPS-протоколу и хранятся на защищённых серверах. Мы соблюдаем требования GDPR и не передаём данные третьим лицам.',
  },
];

// ──────────────────────────────────────────────────────────────
// Getting Started Steps
// ──────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    title: 'Зарегистрируйтесь',
    description: 'Создайте аккаунт и получите 7 дней бесплатного доступа ко всем функциям платформы.',
    icon: Rocket,
    color: 'emerald',
  },
  {
    step: 2,
    title: 'Создайте бота',
    description: 'Используйте конструктор ботов, выберите тип, нишу и настройте поведение с помощью шаблонов.',
    icon: Wrench,
    color: 'teal',
  },
  {
    step: 3,
    title: 'Настройте виджет',
    description: 'Выберите цвета, позицию, добавьте приветствие и FAQ — настройте внешний вид под ваш бренд.',
    icon: Settings,
    color: 'amber',
  },
  {
    step: 4,
    title: 'Внедрите и запускайте',
    description: 'Скопируйте код виджета и вставьте на сайт. Бот начнёт общаться с клиентами 24/7.',
    icon: Sparkles,
    color: 'violet',
  },
];

// ──────────────────────────────────────────────────────────────
// Quick Links
// ──────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  {
    title: 'Конструктор ботов',
    description: 'Создайте нового AI-агента с помощью пошагового мастера',
    icon: Bot,
    page: 'bot-builder' as AppPage,
    badge: 'Популярное',
    color: 'emerald',
  },
  {
    title: 'Аналитика',
    description: 'Просмотрите статистику диалогов, конверсий и активности',
    icon: BarChart3,
    page: 'analytics' as AppPage,
    badge: null,
    color: 'teal',
  },
  {
    title: 'Подписка',
    description: 'Управляйте тарифом, просмотрите историю платежей',
    icon: CreditCard,
    page: 'subscription' as AppPage,
    badge: null,
    color: 'amber',
  },
];

// ──────────────────────────────────────────────────────────────
// Documentation Links
// ──────────────────────────────────────────────────────────────
const DOC_LINKS = [
  {
    title: 'API документация',
    description: 'Подробное описание REST API для интеграции с вашими системами',
    icon: Code2,
    color: 'emerald',
  },
  {
    title: 'Руководства по интеграции',
    description: 'Пошаговые инструкции для CRM, ERP и других систем',
    icon: Plug,
    color: 'teal',
  },
  {
    title: 'Настройка виджета',
    description: 'Встраивание чат-виджета на любой сайт за минуту',
    icon: LayoutTemplate,
    color: 'amber',
  },
  {
    title: 'Настройка Telegram',
    description: 'Подключите Telegram-бота для общения с клиентами',
    icon: MessageSquare,
    color: 'violet',
  },
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

const DOC_LINK_MAP: Record<string, DocPageId> = {
  'API документация': 'api',
  'Руководства по интеграции': 'integration',
  'Настройка виджета': 'widget',
  'Настройка Telegram': 'telegram',
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
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [faqSearch]);

  // ── Documentation overlay ──
  const [activeDocPage, setActiveDocPage] = useState<DocPageId | null>(null);

  const handleOpenDoc = useCallback((title: string) => {
    setActiveDocPage(DOC_LINK_MAP[title] || null);
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
      toast.error('Заполните все поля');
      return;
    }
    setContactSending(true);
    try {
      // Mock API call
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setContactMessage('');
      toast.success('Сообщение отправлено! Мы свяжемся с вами в ближайшее время.');
    } catch {
      toast.error('Не удалось отправить сообщение. Попробуйте ещё раз.');
    } finally {
      setContactSending(false);
    }
  }, [contactName, contactEmail, contactMessage]);

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
          Найдите ответы на вопросы, изучите документацию или свяжитесь с нами
        </p>
      </div>

      {/* ── Getting Started Guide ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <BookOpen className="size-5 text-emerald-600" />
          {t('help.gettingStarted', language)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ step, title, description, icon: Icon, color }) => {
            const colors = COLOR_MAP[color];
            return (
              <Card key={step} className="relative overflow-hidden transition-shadow hover:shadow-md">
                <div className="absolute right-3 top-3">
                  <Badge variant="outline" className="text-xs font-bold text-muted-foreground">
                    {step}
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  <div className={`mb-4 flex size-12 items-center justify-center rounded-xl ${colors.bg}`}>
                    <Icon className={`size-6 ${colors.icon}`} />
                  </div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{description}</p>
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
            Перейти к конструктору ботов
          </Button>
        </div>
      </section>

      <Separator />

      {/* ── FAQ Section ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <HelpCircle className="size-5 text-emerald-600" />
          Часто задаваемые вопросы
        </h2>
        <Card>
          <CardHeader className="pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Поиск по вопросам..."
                className="pl-10"
              />
            </div>
            {faqSearch && (
              <p className="mt-2 text-sm text-muted-foreground">
                Найдено: {filteredFaqs.length} {filteredFaqs.length === 1 ? 'результат' : 'результатов'}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((item, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  По запросу &laquo;{faqSearch}&raquo; ничего не найдено
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
          Быстрые переходы
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map(({ title, description, icon: Icon, page, badge, color }) => {
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
                    {badge && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                        {badge}
                      </Badge>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold">{title}</h3>
                  <p className="mb-4 text-sm text-muted-foreground">{description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                  >
                    Перейти
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
            <CardTitle>Свяжитесь с нами</CardTitle>
            <CardDescription>
              Не нашли ответ? Напишите нам, и мы поможем в течение 24 часов.
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
                  placeholder="Ваше имя"
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
              <Label htmlFor="contact-message">Сообщение</Label>
              <Textarea
                id="contact-message"
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Опишите ваш вопрос или проблему..."
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
          Документация
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {DOC_LINKS.map(({ title, description, icon: Icon, color }) => {
            const colors = COLOR_MAP[color];
            return (
              <Card
                key={title}
                className="group cursor-pointer transition-all hover:shadow-md"
                onClick={() => handleOpenDoc(title)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                      <Icon className={`size-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{title}</h3>
                        <ExternalLink className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="text-sm text-muted-foreground">{description}</p>
                      <Button variant="ghost" size="sm" className="mt-2 -ml-2 h-7 px-2 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                        <BookOpen className="mr-1.5 size-3.5" />
                        Читать документацию
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
