'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Headset, Send, Bot, User, Sparkles, ChevronDown, CheckCircle2, Trash2, Copy, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

// ──────────────────────────────────────────────────────────────
// FAQ data (trilingual)
// ──────────────────────────────────────────────────────────────

const FAQ_DATA = [
  {
    id: 'faq-widget',
    question: {
      ru: 'Как установить виджет на сайт?',
      en: 'How to install widget on website?',
      tr: 'Widget\'ı web sitesine nasıl kurarım?',
    },
    answer: {
      ru: '1. Откройте раздел «Мои боты» и выберите нужного бота\n2. Нажмите «Код для встраивания» и скопируйте код\n3. Вставьте скопированный код перед закрывающим тегом `</body>` на вашем сайте\n4. Обновите страницу — виджет появится в правом нижнем углу\n\nЕсли виджет не отображается:\n• Проверьте консоль браузера на наличие ошибок\n• Убедитесь, что код вставлен корректно\n• Проверьте, не блокирует ли AdBlock скрипт',
      en: '1. Open "My Bots" section and select your bot\n2. Click "Embed Code" and copy the code\n3. Paste the code before the closing `</body>` tag on your website\n4. Refresh the page — the widget will appear in the bottom-right corner\n\nIf the widget doesn\'t show:\n• Check browser console for errors\n• Make sure the code is pasted correctly\n• Verify that AdBlock is not blocking the script',
      tr: '1. "Botlarım" bölümünü açın ve botunuzu seçin\n2. "Gömme Kodu" na tıklayın ve kodu kopyalayın\n3. Kodu web sitenizde `</body>` etiketinden önce yapıştırın\n4. Sayfayı yenileyin — widget sağ alt köşede görünecek\n\nWidget görünmüyorsa:\n• Tarayıcı konsolunda hataları kontrol edin\n• Kodun doğru yapıştırıldığından emin olun\n• AdBlock\'un betiği engellemediğini doğrulayın',
    },
  },
  {
    id: 'faq-notifications',
    question: {
      ru: 'Как настроить уведомления?',
      en: 'How to configure notifications?',
      tr: 'Bildirimleri nasıl yapılandırırım?',
    },
    answer: {
      ru: 'Настройки уведомлений доступны на странице AI-агента:\n\n1. Перейдите в раздел «AI-агент»\n2. Найдите карту «Уведомления о записи»\n3. Включите нужные уведомления:\n   • При записи клиента\n   • Напоминание за 24 часа\n   • Напоминание за 1 час\n   • При отмене записи\n4. Нажмите «Сохранить»\n\nУведомления отправляются автоматически через ваш подключённый канал (Telegram, WhatsApp, виджет).',
      en: 'Notification settings are available on the AI Agent page:\n\n1. Go to the "AI Agent" section\n2. Find the "Booking Notifications" card\n3. Enable the notifications you need:\n   • On client booking\n   • 24-hour reminder\n   • 1-hour reminder\n   • Cancellation alert\n4. Click "Save"\n\nNotifications are sent automatically through your connected channel (Telegram, WhatsApp, widget).',
      tr: 'Bildirim ayarları AI Ajanı sayfasında mevcuttur:\n\n1. "AI Ajanı" bölümüne gidin\n2. "Randevu Bildirimleri" kartını bulun\n3. İhtiyacınız olan bildirimleri etkinleştirin:\n   • Müşteri randevusunda\n   • 24 saat hatırlatma\n   • 1 saat hatırlatma\n   • Randevu iptalinde\n4. "Kaydet" e tıklayın\n\nBildirimler bağlı kanalınız (Telegram, WhatsApp, widget) üzerinden otomatik olarak gönderilir.',
    },
  },
  {
    id: 'faq-plan',
    question: {
      ru: 'Как изменить тариф?',
      en: 'How to change plan?',
      tr: 'Planı nasıl değiştiririm?',
    },
    answer: {
      ru: 'Чтобы изменить тариф:\n\n1. Перейдите в раздел «Подписка» в боковом меню\n2. Выберите новый тариф (Помесячный, Квартальный, Годовой или Навсегда)\n3. Нажмите «Оплатить» для активации\n4. Демо-период будет заменён на выбранный план\n\nПри переходе на более дорогой тариф баланс пересчитывается автоматически.\nПри отмене — доступ сохраняется до конца оплаченного периода.',
      en: 'To change your plan:\n\n1. Go to the "Subscription" section in the sidebar\n2. Select a new plan (Monthly, Quarterly, Yearly, or Lifetime)\n3. Click "Pay" to activate\n4. The demo period will be replaced with your chosen plan\n\nWhen upgrading, the balance is recalculated automatically.\nWhen cancelling, access remains until the end of the paid period.',
      tr: 'Planınızı değiştirmek için:\n\n1. Kenar çubuğundaki "Abonelik" bölümüne gidin\n2. Yeni bir plan seçin (Aylık, 3 Aylık, Yıllık veya Ömür Boyu)\n3. Etkinleştirmek için "Ödeme Yap" a tıklayın\n4. Demo süresi seçtiğiniz planla değiştirilecektir\n\nYükseltme yaparken bakiye otomatik olarak yeniden hesaplanır.\nİptal durumunda, ödenen dönemin sonuna kadar erişim korunur.',
    },
  },
  {
    id: 'faq-export',
    question: {
      ru: 'Как экспортировать данные?',
      en: 'How to export data?',
      tr: 'Verileri nasıl dışa aktarırım?',
    },
    answer: {
      ru: 'Доступные способы экспорта:\n\n**Аналитика:**\n• Перейдите в «Статистика»\n• Нажмите «Экспорт CSV» или «Экспорт PDF»\n\n**Записи:**\n• Перейдите в «Записи»\n• Данные можно скопировать из таблицы\n\n**Настройки бота:**\n• В конструкторе ботов есть кнопка сохранения шаблона\n\nДля массового экспорта или API-доступа обратитесь к администратору.',
      en: 'Available export methods:\n\n**Analytics:**\n• Go to "Analytics"\n• Click "Export CSV" or "Export PDF"\n\n**Bookings:**\n• Go to "Bookings"\n• Data can be copied from the table\n\n**Bot settings:**\n• The bot builder has a template save option\n\nFor bulk export or API access, contact the administrator.',
      tr: 'Kullanılabilir dışa aktarma yöntemleri:\n\n**Analitik:**\n• "Analitik" bölümüne gidin\n• "CSV Dışa Aktar" veya "PDF Dışa Aktar" a tıklayın\n\n**Randevular:**\n• "Randevular" bölümüne gidin\n• Veriler tablodan kopyalanabilir\n\n**Bot ayarları:**\n• Bot oluşturucuda şablon kaydetme seçeneği vardır\n\nToplu dışa aktarma veya API erişimi için yönetici ile iletişime geçin.',
    },
  },
  {
    id: 'faq-bot-config',
    question: {
      ru: 'Как настроить чат-бота?',
      en: 'How to configure a chatbot?',
      tr: 'Chatbot\'u nasıl yapılandırırım?',
    },
    answer: {
      ru: 'Для настройки чат-бота:\n\n1. Откройте «Конструктор ботов»\n2. Выберите тип (AI-агент, Правильный бот, Гибрид)\n3. Настройте нишу и шаблон\n4. В «Поведение» укажите системный промпт и тон общения\n5. В «Функционал» включите нужные возможности\n6. Настройте внешний вид виджета\n7. Опубликуйте бота\n\nСовет: AI-агент автоматически ведёт диалоги, не требует настройки сценариев.',
      en: 'To configure a chatbot:\n\n1. Open "Bot Builder"\n2. Select a type (AI Agent, Rule-based, Hybrid)\n3. Configure niche and template\n4. In "Behavior" set the system prompt and communication tone\n5. In "Features" enable the capabilities you need\n6. Customize widget appearance\n7. Publish the bot\n\nTip: AI Agent automatically handles conversations without requiring scenario setup.',
      tr: 'Chatbot yapılandırmak için:\n\n1. "Bot İnşa Edici" yi açın\n2. Bir tür seçin (AI Ajanı, Kural Tabanlı, Hibrit)\n3. Niş ve şablonu yapılandırın\n4. "Davranış" bölümünde sistem komutunu ve iletişim tonunu ayarlayın\n5. "Özellikler" bölümünde ihtiyacınız olan yetenekleri etkinleştirin\n6. Widget görünümünü özelleştirin\n7. Botu yayınlayın\n\nİpucu: AI Ajanı senaryo kurulumu gerektirmeden otomatik olarak diyalogları yönetir.',
    },
  },
];

// ──────────────────────────────────────────────────────────────
// Support Page Component
// ──────────────────────────────────────────────────────────────

export function SupportPage() {
  const { language } = useAppStore();
  const lang = language as 'ru' | 'en' | 'tr';

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Check AI status on mount
  useEffect(() => {
    fetch('/api/ai-status')
      .then((r) => r.json())
      .then((data) => setAiProvider(data.provider || 'offline'))
      .catch(() => setAiProvider('offline'));
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isSending]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Send message handler
  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);

    try {
      const history = messages.map((m) => ({
        role: m.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: m.content,
      }));

      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          language: lang,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: data.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      toast.error(t('common.error', lang));
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, messages, lang]);

  // Handle keyboard submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Copy solution to clipboard
  const handleCopy = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success(t('support.copied', lang));
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error(t('common.error', lang));
    }
  };

  // Clear chat
  const handleClear = () => {
    setMessages([]);
    toast.success(t('support.clearChat', lang));
  };

  // FAQ click — add as user message and auto-respond
  const handleFaqClick = (faq: (typeof FAQ_DATA)[number]) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: faq.question[lang],
      timestamp: Date.now(),
    };

    const aiMessage: ChatMessage = {
      id: `ai-${Date.now() + 1}`,
      role: 'ai',
      content: faq.answer[lang],
      timestamp: Date.now() + 1,
    };

    setMessages((prev) => [...prev, userMessage, aiMessage]);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* ── Header Card ── */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-500 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Headset className="size-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
                {t('support.headerTitle', lang)}
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30 backdrop-blur-sm text-xs">
                  <span className="mr-1.5 inline-block size-2 rounded-full bg-emerald-300 animate-pulse" />
                  Online
                </Badge>
              </h2>
              <p className="text-emerald-100 mt-1 text-sm md:text-base">
                {t('support.headerDesc', lang)}
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-white/80 text-sm">
              <Sparkles className="size-4" />
              <span>{aiProvider === 'gemini' ? 'Powered by Gemini AI' : 'AI-powered'}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Main Grid: Chat + Input ── */}
      <div className="grid gap-6">
        {/* Problem Input */}
        <Card className="shadow-sm">
          <CardContent className="p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">
                    {t('support.problemLabel', lang)}
                  </label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('support.categoryAll', lang)}</SelectItem>
                      <SelectItem value="technical">{t('support.categoryTechnical', lang)}</SelectItem>
                      <SelectItem value="account">{t('support.categoryAccount', lang)}</SelectItem>
                      <SelectItem value="billing">{t('support.categoryBilling', lang)}</SelectItem>
                      <SelectItem value="integration">{t('support.categoryIntegration', lang)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('support.problemPlaceholder', lang)}
                  className="min-h-[100px] resize-none border-emerald-200 focus-visible:ring-emerald-500 dark:border-emerald-800"
                  disabled={isSending}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!inputText.trim() || isSending}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-[100px] sm:h-auto px-6"
              >
                {isSending ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('support.sending', lang)}
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    {t('support.sendBtn', lang)}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chat History */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bot className="size-4 text-emerald-600" />
              {t('support.solutionTitle', lang)}
              {messages.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-1">
                  {messages.filter((m) => m.role === 'ai').length}
                </Badge>
              )}
            </CardTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-destructive gap-1.5 h-8 text-xs"
              >
                <Trash2 className="size-3.5" />
                {t('support.clearChat', lang)}
              </Button>
            )}
          </CardHeader>
          <Separator />
          <CardContent className="p-4 md:p-6">
            <ScrollArea className="max-h-96 pr-2">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                  <div className="size-16 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4">
                    <Bot className="size-8 text-emerald-400" />
                  </div>
                  <p className="text-sm text-center">{t('support.noMessages', lang)}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'ai' && (
                        <div className="shrink-0 mt-0.5">
                          <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      )}
                      <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-first' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                            msg.role === 'user'
                              ? 'bg-emerald-600 text-white rounded-br-md'
                              : 'bg-muted text-foreground rounded-bl-md'
                          }`}
                        >
                          {msg.content}
                        </div>
                        {msg.role === 'ai' && (
                          <div className="flex items-center gap-2 mt-1.5 ml-1">
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-emerald-600 transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <CheckCircle2 className="size-3 text-emerald-500" />
                                  {t('support.copied', lang)}
                                </>
                              ) : (
                                <>
                                  <Copy className="size-3" />
                                  {t('support.copySolution', lang)}
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      {msg.role === 'user' && (
                        <div className="shrink-0 mt-0.5">
                          <div className="size-8 rounded-full bg-emerald-600 flex items-center justify-center">
                            <User className="size-4 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex gap-3 justify-start">
                      <div className="size-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                        <Bot className="size-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── FAQ Section ── */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-600" />
              {t('support.faqTitle', lang)}
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 md:p-6">
            <Accordion type="single" collapsible className="w-full">
              {FAQ_DATA.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline hover:text-emerald-600 transition-colors text-left py-3">
                    <span className="flex items-center gap-2 pr-2">
                      <ArrowRight className="size-3.5 text-emerald-500 shrink-0" />
                      {faq.question[lang]}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line pb-3 pl-6">
                    {faq.answer[lang]}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
