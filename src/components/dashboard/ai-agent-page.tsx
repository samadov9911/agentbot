'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Mail,
  AtSign,
  Phone,
  BellRing,
  Users,
  MessageCircle,
  BarChart3,
  Send,
  Clock,
  CheckCircle2,
  Zap,
  TrendingUp,
  Star,
  FileText,
  CalendarDays,
  ArrowRight,
  X,
  Save,
  ChevronDown,
  Play,
  Download,
  Bot,
  Settings,
  KeyRound,
  PhoneCall,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ──────────────────────────────────────────────────────────────
// Types & Mock Data
// ──────────────────────────────────────────────────────────────

interface ActivityItem {
  id: number;
  icon: React.ReactNode;
  text: { ru: string; en: string; tr: string };
  time: string;
  color: string;
}

const MOCK_ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    icon: <Mail className="size-4" />,
    text: { ru: 'Отправлено 12 напоминаний о записях', en: 'Sent 12 appointment reminders', tr: '12 randevu hatırlatması gönderildi' },
    time: '10 мин назад',
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-950',
  },
  {
    id: 2,
    icon: <FileText className="size-4" />,
    text: { ru: 'Написано приветственное письмо новому клиенту', en: 'Wrote welcome email to new client', tr: 'Yeni müşteriye hoş geldin e-postası yazıldı' },
    time: '25 мин назад',
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: 3,
    icon: <CheckCircle2 className="size-4" />,
    text: { ru: 'Подтверждена запись на 14:00', en: 'Confirmed appointment for 14:00', tr: '14:00 randevusu onaylandı' },
    time: '1 ч назад',
    color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950',
  },
  {
    id: 4,
    icon: <Phone className="size-4" />,
    text: { ru: 'Выполнен звонок-напоминание клиенту', en: 'Made reminder call to client', tr: 'Müşteriye hatırlatma çağrısı yapıldı' },
    time: '2 ч назад',
    color: 'text-amber-500 bg-amber-100 dark:bg-amber-950',
  },
  {
    id: 5,
    icon: <Users className="size-4" />,
    text: { ru: 'Новый лид из чат-бота на сайте', en: 'New lead captured from website chatbot', tr: 'Web sitesi sohbet botundan yeni potansiyel müşteri' },
    time: '3 ч назад',
    color: 'text-violet-500 bg-violet-100 dark:bg-violet-950',
  },
  {
    id: 6,
    icon: <MessageCircle className="size-4" />,
    text: { ru: 'Отвечено на 8 вопросов клиентов', en: 'Answered 8 customer questions', tr: '8 müşteri sorusu yanıtlandı' },
    time: '4 ч назад',
    color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950',
  },
  {
    id: 7,
    icon: <BarChart3 className="size-4" />,
    text: { ru: 'Еженедельный отчёт сформирован', en: 'Weekly report generated', tr: 'Haftalık rapor oluşturuldu' },
    time: '6 ч назад',
    color: 'text-orange-500 bg-orange-100 dark:bg-orange-950',
  },
  {
    id: 8,
    icon: <Star className="size-4" />,
    text: { ru: 'Поздравление с днём рождения отправлено', en: 'Birthday greeting sent', tr: 'Doğum günü tebriği gönderildi' },
    time: 'Вчера',
    color: 'text-pink-500 bg-pink-100 dark:bg-pink-950',
  },
];

const EMAIL_TEMPLATES = [
  { id: 'welcome', icon: '👋', label: { ru: 'Приветствие', en: 'Welcome', tr: 'Hoş Geldin' } },
  { id: 'reminder', icon: '📅', label: { ru: 'Напоминание', en: 'Reminder', tr: 'Hatırlatma' } },
  { id: 'promo', icon: '🎉', label: { ru: 'Акция', en: 'Promotion', tr: 'Kampanya' } },
  { id: 'birthday', icon: '🎂', label: { ru: 'День рождения', en: 'Birthday', tr: 'Doğum Günü' } },
  { id: 'followup', icon: '🔄', label: { ru: 'Follow-up', en: 'Follow-up', tr: 'Takip' } },
  { id: 'custom', icon: '✏️', label: { ru: 'Свой шаблон', en: 'Custom', tr: 'Özel' } },
];

// ──────────────────────────────────────────────────────────────
// i18n helper
// ──────────────────────────────────────────────────────────────

function tx(obj: { ru: string; en: string; tr: string }, lang: string): string {
  return (obj as Record<string, string>)[lang] ?? obj.ru;
}

// ──────────────────────────────────────────────────────────────
// Capability Card
// ──────────────────────────────────────────────────────────────

interface CapabilityCardProps {
  icon: React.ReactNode;
  title: { ru: string; en: string; tr: string };
  description: { ru: string; en: string; tr: string };
  buttonText: { ru: string; en: string; tr: string };
  badge?: { ru: string; en: string; tr: string };
  badgeColor?: string;
  onClick?: () => void;
  children?: React.ReactNode;
}

function CapabilityCard({
  icon,
  title,
  description,
  buttonText,
  badge,
  badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  onClick,
  children,
}: CapabilityCardProps) {
  const { language } = useAppStore();

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
              {icon}
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold leading-tight">
                {tx(title, language)}
              </CardTitle>
              {badge && (
                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${badgeColor}`}>
                  {tx(badge, language)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {tx(description, language)}
        </p>
        {children}
        <Button
          onClick={onClick}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all duration-200"
          size="sm"
        >
          {tx(buttonText, language)}
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 1: Email Composer Dialog (individual recipients + custom template)
// ──────────────────────────────────────────────────────────────

interface CustomTemplate {
  subject: string;
  body: string;
  savedAt: string;
}

interface ClientItem {
  id: string;
  name: string;
  email: string;
  date: string;
  isNew: boolean;
}

function EmailComposerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [recipientType, setRecipientType] = useState('all');
  const [emailAddresses, setEmailAddresses] = useState('');
  const [emailType, setEmailType] = useState('welcome');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; errors?: string[]; domainNotVerified?: boolean; unverifiedDomain?: string } | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Sender email (from user settings) ──
  const [emailFrom, setEmailFrom] = useState('');
  const [emailFromLoaded, setEmailFromLoaded] = useState(false);
  const [savingEmailFrom, setSavingEmailFrom] = useState(false);

  // ── Real client data from DB ──
  const [allClients, setAllClients] = useState<ClientItem[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);

  // Fetch real clients when dialog opens
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;

    const headers = { 'x-user-id': user.id };

    fetch('/api/email-clients', { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { clients: ClientItem[] } | []) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? [] : data.clients ?? [];
        setAllClients(list);
        setClientsLoaded(true);
      })
      .catch(() => {});

    // Load user's sender email from settings
    fetch('/api/user-settings', { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setEmailFrom(data.emailFrom || '');
        setEmailFromLoaded(true);
      })
      .catch(() => {});

    // Also load custom templates from localStorage
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem('agentbot-custom-email-templates');
        if (saved) setCustomTemplates(JSON.parse(saved));
      } catch { /* ignore */ }
    });

    return () => { cancelled = true; };
  }, [open, user?.id]);

  // Refetch when date range changes (for the "by date" filter)
  useEffect(() => {
    if (!open || !user?.id || recipientType !== 'specific') return;
    if (!dateFrom && !dateTo) {
      // No date filter — use cached allClients
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', dateFrom);
    if (dateTo) params.set('to', dateTo);

    fetch(`/api/email-clients?${params}`, { headers: { 'x-user-id': user.id } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data: { clients: ClientItem[] } | []) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? [] : data.clients ?? [];
        setAllClients(list);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [open, user?.id, recipientType, dateFrom, dateTo]);

  const handleDialogClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setSelectedClients(new Set());
      setDateFrom('');
      setDateTo('');
      setAllClients([]);
      setClientsLoaded(false);
      setEmailFromLoaded(false);
      setSendResult(null);
      setSent(false);
    }
  };

  const toggleClient = (id: string) => {
    setSelectedClients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllClients = (clientIds: string[]) => {
    setSelectedClients((prev) => {
      const allSelected = clientIds.every((id) => prev.has(id));
      if (allSelected) return new Set();
      return new Set(clientIds);
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const newClients = useMemo(() => allClients.filter((c) => c.isNew), [allClients]);
  const filteredClients = useMemo(() => {
    // When date filter is active, allClients is already server-filtered
    return allClients;
  }, [allClients]);

  const emailTemplates: Record<string, { subject: { ru: string; en: string; tr: string }; body: { ru: string; en: string; tr: string } }> = {
    welcome: {
      subject: { ru: 'Добро пожаловать в наш салон!', en: 'Welcome to our salon!', tr: 'Salonumuza hoş geldiniz!' },
      body: {
        ru: 'Уважаемый(ая) клиент!\n\nРады приветствовать вас в нашем салоне красоты. Мы хотим предложить вам специальные условия на первое посещение — скидка 20% на любую услугу!\n\nЗапишитесь онлайн через наш сайт или напишите нам в чат.\n\nС уважением,\nКоманда AgentBot Beauty',
        en: 'Dear Client!\n\nWe are happy to welcome you to our beauty salon. We would like to offer you special conditions for your first visit — 20% off any service!\n\nBook online through our website or chat with us.\n\nBest regards,\nAgentBot Beauty Team',
        tr: 'Sayın Müşterimiz!\n\nGüzellik salonumuza hoş geldiniz. İlk ziyaretiniz için özel koşullar sunmak istiyoruz — herhangi bir hizmette %20 indirim!\n\nWeb sitemizden çevrimiçi randevu alın veya bize sohbet yazın.\n\nSaygılarımızla,\nAgentBot Beauty Ekibi',
      },
    },
    reminder: {
      subject: { ru: 'Напоминание о вашей записи', en: 'Appointment Reminder', tr: 'Randevu Hatırlatması' },
      body: {
        ru: 'Здравствуйте!\n\nНапоминаем, что у вас записана услуга на завтра в 15:00.\n\nПожалуйста, сообщите нам, если вам нужно перенести запись.\n\nДо встречи!',
        en: 'Hello!\n\nThis is a reminder that you have an appointment scheduled for tomorrow at 3:00 PM.\n\nPlease let us know if you need to reschedule.\n\nSee you soon!',
        tr: 'Merhaba!\n\nYarın saat 15:00\'te planlanmış bir randevunuz olduğunu hatırlatıyoruz.\n\nRandevunuzu ertelemeniz gerekirse lütfen bize bildirin.\n\nGörüşmek üzere!',
      },
    },
    promo: {
      subject: { ru: 'Специальное предложение только для вас!', en: 'Special offer just for you!', tr: 'Sadece sizin için özel teklif!' },
      body: {
        ru: 'Дорогой клиент!\n\nТолько до конца недели — комбо «Стрижка + Окрашивание» по специальной цене.\n\nНе упустите возможность сэкономить!\n\nЗапишитесь прямо сейчас.',
        en: 'Dear client!\n\nUntil the end of the week only — "Haircut + Coloring" combo at a special price.\n\nDon\'t miss this opportunity to save!\n\nBook now.',
        tr: 'Değerli müşterimiz!\n\nBu hafta sonuna kadar sadece — "Saç Kesimi + Boyama" kombosu özel fiyatla.\n\nTasarruf fırsatını kaçırmayın!\n\nŞimdi randevu alın.',
      },
    },
    birthday: {
      subject: { ru: 'С днём рождения! 🎂', en: 'Happy Birthday! 🎂', tr: 'Mutlu Yıllar! 🎂' },
      body: {
        ru: 'Поздравляем с днём рождения! 🎉\n\nВ честь вашего праздника дарим вам скидку 30% на любую услугу в течение месяца.\n\nЖелаем здоровья и красоты!',
        en: 'Happy Birthday! 🎉\n\nTo celebrate, we\'re giving you 30% off any service this month.\n\nWishing you health and beauty!',
        tr: 'Mutlu yıllar! 🎉\n\nKutlamanız onuruna, bu ay herhangi bir hizmette %30 indirim hediye ediyoruz.\n\nSağlık ve güzellik dileriz!',
      },
    },
    custom: {
      subject: { ru: '', en: '', tr: '' },
      body: { ru: '', en: '', tr: '' },
    },
  };

  const handleTemplateSelect = (type: string) => {
    setEmailType(type);
    if (type === 'custom') {
      setSubject('');
      setBody('');
      return;
    }
    const tpl = emailTemplates[type];
    if (tpl) {
      setSubject(tpl.subject[language as keyof typeof tpl.subject] || tpl.subject.ru);
      setBody(tpl.body[language as keyof typeof tpl.body] || tpl.body.ru);
    }
  };

  const handleSaveTemplate = () => {
    if (!subject.trim()) return;
    const newTpl: CustomTemplate = { subject: subject.trim(), body: body.trim(), savedAt: new Date().toLocaleString() };
    const updated = [newTpl, ...customTemplates.filter((t) => t.subject !== newTpl.subject)].slice(0, 10);
    setCustomTemplates(updated);
    localStorage.setItem('agentbot-custom-email-templates', JSON.stringify(updated));
    toast.success(language === 'ru' ? 'Шаблон сохранён!' : language === 'en' ? 'Template saved!' : 'Şablon kaydedildi!');
  };

  const handleLoadCustomTemplate = (tpl: CustomTemplate) => {
    setEmailType('custom');
    setSubject(tpl.subject);
    setBody(tpl.body);
  };

  const handleSend = async () => {
    if (!user?.id || !subject.trim() || !body.trim()) return;

    // Build recipient list based on type
    let recipients: string[] = [];

    if (recipientType === 'individual') {
      // Manual email addresses
      recipients = emailAddresses
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e.length > 0);
    } else if (recipientType === 'new') {
      // Selected new clients
      recipients = newClients
        .filter((c) => selectedClients.has(c.id) && c.email)
        .map((c) => c.email);
    } else if (recipientType === 'specific') {
      // Selected filtered clients
      recipients = filteredClients
        .filter((c) => selectedClients.has(c.id) && c.email)
        .map((c) => c.email);
    } else {
      // All clients with emails
      recipients = allClients.filter((c) => c.email).map((c) => c.email);
    }

    if (recipients.length === 0) {
      toast.error(
        language === 'ru' ? 'Нет получателей с email' : language === 'en' ? 'No recipients with email' : 'E-postası olan alıcı yok',
      );
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/send-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          recipients,
          subject: subject.trim(),
          body: body.trim(),
          fromEmail: emailFrom.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        setSending(false);
        return;
      }

      setSendResult({ sent: data.sent, failed: data.failed, errors: data.errors, domainNotVerified: data.domainNotVerified, unverifiedDomain: data.unverifiedDomain });
      setSending(false);
      setSent(true);

      // Show domain verification error prominently
      if (data.domainNotVerified) {
        const domain = data.unverifiedDomain || '?';
        toast.error(
          language === 'ru'
            ? `Домен ${domain} не верифицирован в Resend`
            : language === 'en'
              ? `Domain ${domain} is not verified in Resend`
              : `${domain} alan adı Resend'de doğrulanmadı`,
          { duration: 8000 },
        );
      } else if (data.sent > 0) {
        toast.success(
          language === 'ru'
            ? `Отправлено ${data.sent} писем`
            : language === 'en'
              ? `${data.sent} emails sent`
              : `${data.sent} e-posta gönderildi`,
        );
      }
      if (data.failed > 0) {
        toast.error(
          language === 'ru'
            ? `${data.failed} писем не доставлено`
            : language === 'en'
              ? `${data.failed} emails failed`
              : `${data.failed} e-posta başarısız`,
        );
      }
    } catch {
      toast.error(language === 'ru' ? 'Ошибка отправки' : language === 'en' ? 'Send error' : 'Gönderme hatası');
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5 text-emerald-600" />
            {language === 'ru' ? 'Написать письмо' : language === 'en' ? 'Compose Email' : 'E-posta Yaz'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru'
              ? 'AI составит персонализированное письмо для ваших клиентов'
              : language === 'en'
                ? 'AI will compose a personalized email for your clients'
                : 'AI müşterileriniz için kişiselleştirilmiş bir e-posta yazacak'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Recipient type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'ru' ? 'Получатели' : language === 'en' ? 'Recipients' : 'Alıcılar'}
            </label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {language === 'ru' ? 'Все клиенты' : language === 'en' ? 'All clients' : 'Tüm müşteriler'}
                </SelectItem>
                <SelectItem value="new">
                  {language === 'ru' ? 'Новые клиенты' : language === 'en' ? 'New clients' : 'Yeni müşteriler'}
                </SelectItem>
                <SelectItem value="specific">
                  {language === 'ru' ? 'По дате записи' : language === 'en' ? 'By booking date' : 'Randevu tarihine göre'}
                </SelectItem>
                <SelectItem value="individual">
                  {language === 'ru' ? 'Отдельные адреса' : language === 'en' ? 'Individual addresses' : 'Bireysel adresler'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Individual email input */}
          {recipientType === 'individual' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ru' ? 'Email адреса (через запятую)' : language === 'en' ? 'Email addresses (comma separated)' : 'E-posta adresleri (virgülle ayırın)'}
              </label>
              <Input
                value={emailAddresses}
                onChange={(e) => setEmailAddresses(e.target.value)}
                placeholder={language === 'ru' ? 'user@example.com, client@mail.com' : language === 'en' ? 'user@example.com, client@mail.com' : 'user@example.com, client@mail.com'}
              />
            </div>
          )}

          {/* New clients checklist */}
          {recipientType === 'new' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {language === 'ru' ? 'Новые клиенты' : language === 'en' ? 'New clients' : 'Yeni müşteriler'}
                  </label>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {language === 'ru' ? 'Выбрано:' : language === 'en' ? 'Selected:' : 'Seçilen:'} {selectedClients.size}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => toggleAllClients(newClients.map((c) => c.id))}
                >
                  {newClients.every((c) => selectedClients.has(c.id))
                    ? (language === 'ru' ? 'Снять все' : language === 'en' ? 'Deselect All' : 'Tümünü Kaldır')
                    : (language === 'ru' ? 'Выбрать все' : language === 'en' ? 'Select All' : 'Tümünü Seç')}
                </Button>
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                {!clientsLoaded && allClients.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {language === 'ru' ? 'Загрузка...' : language === 'en' ? 'Loading...' : 'Yükleniyor...'}
                  </div>
                ) : newClients.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                    {language === 'ru' ? 'Нет новых клиентов с email' : language === 'en' ? 'No new clients with email' : 'E-postası olan yeni müşteri yok'}
                  </div>
                ) : (
                  newClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(client.date)}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Specific clients by date range */}
          {recipientType === 'specific' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ru' ? 'Фильтр по дате записи' : language === 'en' ? 'Filter by booking date' : 'Randevu tarihine göre filtrele'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'С' : language === 'en' ? 'From' : 'Başlangıç'}
                  </Label>
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'По' : language === 'en' ? 'To' : 'Bitiş'}
                  </Label>
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">
                    {language === 'ru' ? 'Клиенты' : language === 'en' ? 'Clients' : 'Müşteriler'}
                  </label>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {language === 'ru' ? 'Выбрано:' : language === 'en' ? 'Selected:' : 'Seçilen:'} {selectedClients.size} / {filteredClients.length}
                  </Badge>
                </div>
                {filteredClients.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => toggleAllClients(filteredClients.map((c) => c.id))}
                  >
                    {filteredClients.every((c) => selectedClients.has(c.id))
                      ? (language === 'ru' ? 'Снять все' : language === 'en' ? 'Deselect All' : 'Tümünü Kaldır')
                      : (language === 'ru' ? 'Выбрать все' : language === 'en' ? 'Select All' : 'Tümünü Seç')}
                  </Button>
                )}
              </div>
              {!clientsLoaded && allClients.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Загрузка...' : language === 'en' ? 'Loading...' : 'Yükleniyor...'}
                  </p>
                </div>
              ) : filteredClients.length > 0 ? (
                <div className="max-h-48 overflow-y-auto rounded-lg border divide-y">
                  {filteredClients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedClients.has(client.id)}
                        onCheckedChange={() => toggleClient(client.id)}
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(client.date)}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 px-4 py-6 text-center">
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Нет клиентов за выбранный период' : language === 'en' ? 'No clients found for this date range' : 'Bu tarih aralığında müşteri bulunamadı'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Saved custom templates dropdown (Issue 1) */}
          {customTemplates.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'ru' ? 'Сохранённые шаблоны' : language === 'en' ? 'Saved templates' : 'Kaydedilmiş şablonlar'}
              </label>
              <Select onValueChange={(val) => {
                const idx = parseInt(val);
                if (customTemplates[idx]) handleLoadCustomTemplate(customTemplates[idx]);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ru' ? 'Выберите шаблон...' : language === 'en' ? 'Select template...' : 'Şablon seçin...'} />
                </SelectTrigger>
                <SelectContent>
                  {customTemplates.map((tpl, idx) => (
                    <SelectItem key={idx} value={String(idx)}>{tpl.subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Sender email ("От кого") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <AtSign className="size-3.5 text-emerald-600" />
                {language === 'ru' ? 'От кого' : language === 'en' ? 'From' : 'Kimden'}
              </label>
              {emailFrom.trim() && (
                <span className="text-[10px] text-emerald-600 font-medium">
                  ✓ {language === 'ru' ? 'Ваш email' : language === 'en' ? 'Your email' : 'E-postanız'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={emailFrom}
                onChange={(e) => setEmailFrom(e.target.value)}
                placeholder={language === 'ru'
                  ? 'info@mycompany.com'
                  : language === 'en'
                    ? 'info@mycompany.com'
                    : 'info@sirketim.com'}
                className="flex-1"
                type="email"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!user?.id) return;
                  setSavingEmailFrom(true);
                  try {
                    const res = await fetch('/api/user-settings', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                      body: JSON.stringify({ emailFrom: emailFrom.trim() || null }),
                    });
                    if (res.ok) {
                      toast.success(language === 'ru'
                        ? 'Email отправителя сохранён'
                        : language === 'en'
                          ? 'Sender email saved'
                          : 'Gönderici e-postası kaydedildi');
                    }
                  } catch { /* ignore */ }
                  setSavingEmailFrom(false);
                }}
                disabled={savingEmailFrom}
                className="shrink-0"
              >
                {savingEmailFrom
                  ? (language === 'ru' ? '...' : language === 'en' ? '...' : '...')
                  : <Save className="size-3.5" />}
              </Button>
            </div>
            {!emailFrom.trim() && emailFromLoaded && (
              <p className="text-[11px] text-muted-foreground leading-snug">
                {language === 'ru'
                  ? 'По умолчанию письма отправляются от onboarding@resend.dev. Укажите свой email для отправки от имени компании.'
                  : language === 'en'
                    ? 'By default emails are sent from onboarding@resend.dev. Enter your email to send on behalf of your company.'
                    : 'Varsayılan olarak e-postalar onboarding@resend.dev adresinden gönderilir. Şirketiniz adına göndermek için e-posta girin.'}
              </p>
            )}
            {emailFrom.trim() && emailFromLoaded && (
              <p className="text-[11px] text-emerald-600/80 leading-snug">
                {language === 'ru'
                  ? 'Для корректной работы убедитесь, что этот домен верифицирован в Resend Dashboard.'
                  : language === 'en'
                    ? 'Make sure this domain is verified in Resend Dashboard for reliable delivery.'
                    : 'Güvenilir teslimat için bu alan adının Resend Dashboard\'da doğrulandığından emin olun.'}
              </p>
            )}
          </div>

          {/* Email template gallery with custom (Issue 1) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'ru' ? 'Тип письма' : language === 'en' ? 'Email type' : 'E-posta türü'}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {EMAIL_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateSelect(tpl.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 ${
                    emailType === tpl.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 shadow-sm shadow-emerald-500/10'
                      : 'border-border'
                  }`}
                >
                  <span className="text-base">{tpl.icon}</span>
                  <span className="text-[10px] font-medium leading-tight">{tx(tpl.label, language)}</span>
                </button>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              {sendResult && sendResult.domainNotVerified ? (
                <div className="w-full max-w-sm space-y-3">
                  <div className="flex justify-center">
                    <div className="size-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
                      <X className="size-5 text-red-500" />
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300 text-center">
                    {language === 'ru'
                      ? `Домен не верифицирован`
                      : language === 'en'
                        ? 'Domain not verified'
                        : 'Alan adı doğrulanmadı'}
                  </p>
                  <div className="rounded-lg bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-800 p-3 space-y-2">
                    <p className="text-xs text-red-700 dark:text-red-300">
                      {language === 'ru'
                        ? `Домен «${sendResult.unverifiedDomain || '?'}» не привязан к вашему аккаунту Resend. Письма нельзя отправлять от этого адреса.`
                        : language === 'en'
                          ? `Domain "${sendResult.unverifiedDomain || '?'}" is not linked to your Resend account. Emails cannot be sent from this address.`
                          : `"${sendResult.unverifiedDomain || '?'}" alan adı Resend hesabınıza bağlı değil.`}
                    </p>
                    <div className="border-t border-red-100 dark:border-red-800 pt-2 space-y-1.5">
                      <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                        {language === 'ru' ? 'Как исправить:' : language === 'en' ? 'How to fix:' : 'Nasıl düzeltilir:'}
                      </p>
                      <ol className="text-[11px] text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>
                          {language === 'ru'
                            ? 'Откройте '
                            : language === 'en'
                              ? 'Open '
                              : 'Açın '}
                          <span className="font-mono text-[11px] text-red-600 dark:text-red-400">resend.com/domains</span>
                        </li>
                        <li>
                          {language === 'ru'
                            ? 'Нажмите «Add Domain» и введите ваш домен'
                            : language === 'en'
                              ? 'Click "Add Domain" and enter your domain'
                              : '"Add Domain" tıklayın ve alan adınızı girin'}
                        </li>
                        <li>
                          {language === 'ru'
                            ? 'Добавьте DNS-записи (SPF, DKIM) у вашего регистратора'
                            : language === 'en'
                              ? 'Add DNS records (SPF, DKIM) at your registrar'
                              : 'Kayıt kuruluşunuzda DNS kayıtlarını (SPF, DKIM) ekleyin'}
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : sendResult && sendResult.failed === 0 ? (
                <CheckCircle2 className="size-10 text-emerald-500" />
              ) : (
                <CheckCircle2 className="size-10 text-amber-500" />
              )}
              {!sendResult?.domainNotVerified && (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  {sendResult
                    ? language === 'ru'
                      ? `Отправлено: ${sendResult.sent} ${sendResult.sent === 1 ? 'письмо' : sendResult.sent < 5 ? 'письма' : 'писем'}`
                      : language === 'en'
                        ? `${sendResult.sent} email${sendResult.sent === 1 ? '' : 's'} sent`
                        : `${sendResult.sent} e-posta gönderildi`
                    : (language === 'ru' ? 'Письмо отправлено!' : language === 'en' ? 'Email sent!' : 'E-posta gönderildi!')}
                </p>
              )}
              {sendResult && sendResult.failed > 0 && (
                <div className="w-full max-w-sm space-y-2 mt-1">
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {language === 'ru'
                      ? `${sendResult.failed} не доставлено`
                      : language === 'en'
                        ? `${sendResult.failed} failed`
                        : `${sendResult.failed} başarısız`}
                  </p>
                  {sendResult.errors && sendResult.errors.length > 0 && (
                    <div className="max-h-24 overflow-y-auto rounded-md bg-white dark:bg-zinc-900 p-2">
                      {sendResult.errors.map((err, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground truncate">{err}</p>
                      ))}
                    </div>
                  )}
                  {sendResult && sendResult.failed > 0 && !sendResult.domainNotVerified && (
                    <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 text-center">
                      {language === 'ru'
                        ? 'Проверьте правильность email-адресов получателей'
                        : language === 'en'
                          ? 'Check that recipient email addresses are correct'
                          : 'Alıcı e-posta adreslerinin doğru olduğunu kontrol edin'}
                    </p>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSent(false);
                  setSendResult(null);
                }}
              >
                {language === 'ru' ? 'Написать ещё' : language === 'en' ? 'Write another' : 'Başka yaz'}
              </Button>
            </div>
          ) : (
            <>
              {/* Subject + Save template button (Issue 1) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    {language === 'ru' ? 'Тема письма' : language === 'en' ? 'Subject' : 'Konu'}
                  </label>
                  <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleSaveTemplate} disabled={!subject.trim()}>
                    <Save className="size-3" />
                    {language === 'ru' ? 'Сохранить шаблон' : language === 'en' ? 'Save template' : 'Şablonu kaydet'}
                  </Button>
                </div>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={language === 'ru' ? 'Введите тему...' : language === 'en' ? 'Enter subject...' : 'Konu girin...'}
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {language === 'ru' ? 'Текст письма' : language === 'en' ? 'Body' : 'İçerik'}
                </label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    language === 'ru'
                      ? 'AI сгенерирует текст на основе выбранного шаблона...'
                      : language === 'en'
                        ? 'AI will generate text based on selected template...'
                        : 'AI seçilen şablona göre metin oluşturacak...'
                  }
                  className="min-h-[140px] resize-none"
                />
              </div>

              {/* AI badge */}
              <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 px-3 py-2">
                <Sparkles className="size-4 text-emerald-600" />
                <span className="text-xs text-emerald-700 dark:text-emerald-300">
                  {language === 'ru'
                    ? 'AI автоматически персонализирует письмо для каждого клиента'
                    : language === 'en'
                      ? 'AI automatically personalizes the email for each client'
                      : 'AI e-postayı her müşteri için otomatik olarak kişiselleştirir'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <Button
                  onClick={handleSend}
                  disabled={sending || !subject || !body}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  {sending ? (
                    <>
                      <div className="size-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      {language === 'ru' ? 'Отправка...' : language === 'en' ? 'Sending...' : 'Gönderiliyor...'}
                    </>
                  ) : (
                    <>
                      <Send className="size-4 mr-2" />
                      {language === 'ru' ? 'Отправить' : language === 'en' ? 'Send' : 'Gönder'}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 2: Call Script Dialog — AI agent calls from company phone
// ──────────────────────────────────────────────────────────────

// ──────────────────────────────────────────────────────────────
// Vapi Settings Dialog — configure API key & phone number
// ──────────────────────────────────────────────────────────────

type PhoneMode = 'buy' | 'own';

function VapiSettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [apiKey, setApiKey] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMask, setCurrentMask] = useState('');
  const [phoneMode, setPhoneMode] = useState<PhoneMode>('buy');

  useEffect(() => {
    if (open && user?.id) {
      setLoading(true);
      fetch('/api/vapi/settings', { headers: { 'x-user-id': user.id } })
        .then((r) => r.json())
        .then((data) => {
          setPhoneId(data.vapiPhoneId || '');
          setPhoneNumber(data.vapiPhone || '');
          setCurrentMask(data.apiKeyMasked || '');
          setApiKey(''); // Don't populate API key for security
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open, user?.id]);

  const handleSave = async () => {
    if (!phoneId.trim()) {
      toast.error(language === 'ru' ? 'Введите ID номера телефона Vapi' : 'Enter Vapi phone number ID');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        vapiPhoneId: phoneId.trim(),
        vapiPhone: phoneNumber.trim(),
      };
      if (apiKey.trim()) {
        payload.vapiApiKey = apiKey.trim();
      }

      const res = await fetch('/api/vapi/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': user?.id || '' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'INVALID_API_KEY') {
          toast.error(language === 'ru' ? '❌ Неверный API ключ Vapi. Проверьте и попробуйте снова.' : '❌ Invalid Vapi API key. Please check and try again.');
          return;
        }
        throw new Error('Save failed');
      }

      toast.success(language === 'ru' ? '✅ Настройки Vapi сохранены!' : '✅ Vapi settings saved!');
      setApiKey('');
      // Refresh mask
      const settingsRes = await fetch('/api/vapi/settings', { headers: { 'x-user-id': user.id! } });
      const settingsData = await settingsRes.json();
      setCurrentMask(settingsData.apiKeyMasked || '');
    } catch {
      toast.error(language === 'ru' ? 'Ошибка сохранения настроек' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(language === 'ru' ? 'Удалить настройки Vapi?' : 'Delete Vapi settings?')) return;
    try {
      await fetch('/api/vapi/settings', {
        method: 'DELETE',
        headers: { 'x-user-id': user?.id || '' },
      });
      setApiKey('');
      setPhoneId('');
      setPhoneNumber('');
      setCurrentMask('');
      toast.success(language === 'ru' ? 'Настройки Vapi удалены' : 'Vapi settings deleted');
    } catch {
      toast.error(language === 'ru' ? 'Ошибка удаления' : 'Delete failed');
    }
  };

  const t = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="size-5 text-emerald-600" />
            {t('Настройка Vapi.ai', 'Vapi.ai Setup', 'Vapi.ai Yapılandırması')}
          </DialogTitle>
          <DialogDescription>
            {t(
              'Подключите свой аккаунт Vapi.ai для реальных AI-звонков',
              'Connect your Vapi.ai account for real AI calls',
              'Gerçek AI aramaları için Vapi.ai hesabınızı bağlayın'
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Step 1: Common — API Key */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-muted-foreground" />
                {t('API ключ Vapi', 'Vapi API Key', 'Vapi API Anahtarı')}
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={currentMask || 'vapi_...'}
              />
              {currentMask && (
                <p className="text-[11px] text-muted-foreground">
                  {t('Текущий ключ: ', 'Current key: ', 'Mevcut anahtar: ')}<code className="bg-muted px-1 rounded">{currentMask}</code>
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {apiKey ? t('Оставьте пустым, чтобы не менять', 'Leave empty to keep current', 'Mevcut korumak için boş bırakın') : ''}
              </p>
            </div>

            {/* Step 2: Phone mode selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('📞 Номер для звонков', '📞 Phone number for calls', '📞 Arama telefon numarası')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {/* Buy new number */}
                <button
                  type="button"
                  onClick={() => setPhoneMode('buy')}
                  className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                    phoneMode === 'buy'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🛒</span>
                    <span className="text-xs font-semibold">
                      {t('Купить номер', 'Buy a number', 'Numara satın al')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {t(
                      'Новый номер напрямую в Vapi (~$1/мес)',
                      'New number directly in Vapi (~$1/mo)',
                      'Vapi\'de yeni numara (~$1/ay)'
                    )}
                  </p>
                </button>

                {/* Use existing number */}
                <button
                  type="button"
                  onClick={() => setPhoneMode('own')}
                  className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                    phoneMode === 'own'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">🏢</span>
                    <span className="text-xs font-semibold">
                      {t('Свой номер', 'My number', 'Kendi numaram')}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {t(
                      'Подключить корпоративный номер через Twilio/Vonage',
                      'Connect corporate number via Twilio/Vonage',
                      'Twilio/Vonage üzerinden kurumsal numarayı bağlayın'
                    )}
                  </p>
                </button>
              </div>
            </div>

            {/* Buy mode instructions */}
            {phoneMode === 'buy' && (
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  {t('📋 Как купить номер:', '📋 How to buy:', '📋 Nasıl satın alınır:')}
                </p>
                <ol className="text-[11px] text-emerald-600 dark:text-emerald-400 space-y-1 pl-4 list-decimal">
                  <li>{t('Зарегистрируйтесь на', 'Sign up on', 'Kaydolun')} <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="underline font-medium">vapi.ai</a></li>
                  <li>{t('Получите API ключ в разделе Dashboard → API Keys', 'Get your API key from Dashboard → API Keys', 'Dashboard → API Keys bölümünden API anahtarınızı alın')}</li>
                  <li>{t('Перейдите в раздел Phone Numbers → Buy Number', 'Go to Phone Numbers → Buy Number', 'Phone Numbers → Buy Number bölümüne gidin')}</li>
                  <li>{t('Выберите страну и купите номер', 'Choose a country and buy a number', 'Bir ülke seçin ve numara satın alın')}</li>
                  <li>{t('Скопируйте Phone Number ID и вставьте ниже', 'Copy the Phone Number ID and paste below', 'Phone Number ID\'sini kopyalayıp aşağıya yapıştırın')}</li>
                </ol>
              </div>
            )}

            {/* Own number mode instructions */}
            {phoneMode === 'own' && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {t('📋 Как подключить свой корпоративный номер:', '📋 How to connect your corporate number:', '📋 Kurumsal numaranızı nasıl bağlarsınız:')}
                </p>
                <ol className="text-[11px] text-blue-600 dark:text-blue-400 space-y-1 pl-4 list-decimal">
                  <li>{t('Зарегистрируйтесь на', 'Sign up on', 'Kaydolun')} <a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="underline font-medium">vapi.ai</a></li>
                  <li>{t('Получите API ключ в Dashboard → API Keys', 'Get your API key from Dashboard → API Keys', 'Dashboard → API Keys bölümünden API anahtarınızı alın')}</li>
                  <li>{t('Если номер от Twilio: подключите Twilio аккаунт в разделе Providers', 'If number is from Twilio: connect Twilio account in Providers', 'Numara Twilio\'dan: Providers bölümünde Twilio hesabını bağlayın')}</li>
                  <li>{t('Если номер от Vonage: подключите Vonage аккаунт в разделе Providers', 'If number is from Vonage: connect Vonage account in Providers', 'Numara Vonage\'dan: Providers bölümünde Vonage hesabını bağlayın')}</li>
                  <li>{t('После подключения номер появится в Phone Numbers — скопируйте его ID', 'After connecting, the number appears in Phone Numbers — copy its ID', 'Bağlandıktan sonra numara Phone Numbers\'da görünür — ID\'sini kopyalayın')}</li>
                </ol>
                <div className="mt-2 rounded-md bg-blue-100 dark:bg-blue-950/50 p-2">
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
                    {t(
                      '💡 Если у вас нет Twilio/Vonage аккаунта, вы можете зарегистрироваться бесплатно и перенести свой существующий номер (port-in). Затраты: только плата Vapi за минуты разговора.',
                      '💡 If you don\'t have a Twilio/Vonage account, you can register for free and port your existing number. Costs: only Vapi per-minute charges.',
                      '💡 Twilio/Vonage hesabınız yoksa, ücretsiz kayıt olabilir ve mevcut numaranızı taşıyabilirsiniz. Maliyet: yalnızca Vapi dakika ücreti.'
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* Phone ID (common for both modes) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Phone className="size-3.5 text-muted-foreground" />
                {t('ID номера телефона в Vapi', 'Phone Number ID in Vapi', 'Vapi\'deki Telefon Numarası ID')}
              </Label>
              <Input
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                placeholder={phoneMode === 'own'
                  ? t('ID номера после подключения (vapi-phone-...)', 'Number ID after connecting (vapi-phone-...)', 'Bağlandıktan sonraki numara ID (vapi-phone-...)')
                  : t('ID купленного номера (vapi-phone-...)', 'ID of purchased number (vapi-phone-...)', 'Satın alınan numaranın ID (vapi-phone-...)')
                }
              />
              <p className="text-[10px] text-muted-foreground">
                {t(
                  'Этот ID указан в разделе Phone Numbers вашего аккаунта Vapi',
                  'This ID is listed in the Phone Numbers section of your Vapi account',
                  'Bu ID Vapi hesabınızın Phone Numbers bölümünde listelenir'
                )}
              </p>
            </div>

            {/* Phone Number (for display) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <PhoneCall className="size-3.5 text-muted-foreground" />
                {t('Номер телефона (для отображения клиенту)', 'Phone Number (shown to client)', 'Telefon Numarası (müşteriye görünür)')}
              </Label>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('+7 (___) ___-__-__', '+1 (___) ___-____', '+90 (___) ___-____')}
                type="tel"
              />
              <p className="text-[11px] text-muted-foreground">
                {t(
                  'Клиент увидит этот номер при входящем звонке от AI-агента',
                  'Client will see this number when AI agent calls',
                  'AI ajan aradığında müşteri bu numarayı görecektir'
                )}
              </p>
            </div>

            {/* Summary card */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Режим:', 'Mode:', 'Mod:')}</span>
                <span className="font-medium">
                  {phoneMode === 'buy'
                    ? t('Новый номер в Vapi', 'New number in Vapi', 'Vapi\'de yeni numara')
                    : t('Свой корпоративный номер', 'Own corporate number', 'Kendi kurumsal numaram')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('Затраты:', 'Costs:', 'Maliyet:')}</span>
                <span className="font-medium">
                  {phoneMode === 'buy'
                    ? t('Номер ~$1/мес + минуты звонка', 'Number ~$1/mo + call minutes', 'Numara ~$1/ay + arama dakikaları')
                    : t('Только минуты звонка через Vapi', 'Only call minutes via Vapi', 'Yalnızca Vapi üzerinden arama dakikaları')}
                </span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saving || (!apiKey && !phoneId)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {t('Сохранить', 'Save', 'Kaydet')}
              </Button>
              {currentMask && (
                <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 gap-1">
                  <X className="size-4" />
                  {t('Удалить', 'Delete', 'Sil')}
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Call Script Dialog — real Vapi.ai integration
// ──────────────────────────────────────────────────────────────

const CALL_TYPES = [
  {
    id: 'confirmation',
    icon: '✅',
    label: { ru: 'Подтверждение записи', en: 'Appointment Confirmation', tr: 'Randevu Onayı' },
    desc: { ru: 'Позвонить клиенту для подтверждения записи', en: 'Call client to confirm their appointment', tr: 'Müşteriyi arayarak randevusunu onaylayın' },
  },
  {
    id: 'reminder',
    icon: '🔔',
    label: { ru: 'Напоминание о визите', en: 'Visit Reminder', tr: 'Ziyaret Hatırlatması' },
    desc: { ru: 'Напомнить клиенту о предстоящей записи', en: 'Remind client about their upcoming appointment', tr: 'Müşteriyi yaklaşan randevusu hakkında bilgilendirin' },
  },
  {
    id: 'follow_up',
    icon: '📞',
    label: { ru: 'Последующий контакт', en: 'Follow-up Call', tr: 'Takip Araması' },
    desc: { ru: 'Связаться с клиентом после обслуживания', en: 'Contact client after their service', tr: 'Hizmet sonrası müşteriyle iletişime geçin' },
  },
  {
    id: 'custom',
    icon: '✏️',
    label: { ru: 'Другое', en: 'Custom', tr: 'Özel' },
    desc: { ru: 'Своё описание задачи для звонка', en: 'Custom call task description', tr: 'Özel arama görev açıklaması' },
  },
] as const;

type CallStep = 'configure' | 'calling' | 'result';

function CallScriptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<CallStep>('configure');
  const [callType, setCallType] = useState('confirmation');
  const [taskDescription, setTaskDescription] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [calling, setCalling] = useState(false);

  // Vapi settings state
  const [vapiConfigured, setVapiConfigured] = useState(false);
  const [vapiPhone, setVapiPhone] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Result state
  const [callResult, setCallResult] = useState<{
    id: string;
    clientPhone: string;
    companyPhone: string;
    taskDescription: string;
    callType: string;
    status: string;
    duration: number;
    transcript: Array<{ role: string; text: string; timestamp: string }>;
    aiSummary: string;
    createdAt: string;
  } | null>(null);

  const t = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  // Load Vapi settings on open
  useEffect(() => {
    if (open && user?.id) {
      fetch('/api/vapi/settings', { headers: { 'x-user-id': user.id } })
        .then((r) => r.json())
        .then((data) => {
          setVapiConfigured(data.configured);
          setVapiPhone(data.vapiPhone || '');
        })
        .catch(() => {});
    }
  }, [open, user?.id]);

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setStep('configure');
        setCallType('confirmation');
        setTaskDescription('');
        setClientPhone('');
        setCalling(false);
        setCallResult(null);
      }, 200);
    }
  };

  const handleStartCall = async () => {
    if (!clientPhone.trim()) {
      toast.error(t('Введите номер телефона клиента', 'Enter client phone number', 'Müşteri telefon numarasını girin'));
      return;
    }

    if (!vapiConfigured) {
      toast.error(t('Сначала настройте Vapi', 'Configure Vapi first', 'Önce Vapi\'yi yapılandırın'));
      return;
    }

    setCalling(true);
    setStep('calling');

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          clientPhone,
          callType,
          taskDescription,
          language,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'VAPI_NOT_CONFIGURED') {
          setStep('configure');
          toast.error(t('Vapi не настроен. Настройте в разделе настроек.', 'Vapi not configured. Please set up in settings.', 'Vapi yapılandırılmamış. Lütfen ayarlardan yapılandırın.'));
        } else {
          setCallResult(data.callLog || null);
          setStep('result');
          toast.error(t('Ошибка звонка', 'Call error', 'Arama hatası'));
        }
        return;
      }

      setCallResult(data.callLog);
      setStep('result');

      if (data.success) {
        toast.success(t(
          '🚀 Звонок инициирован! AI связывается с клиентом...',
          '🚀 Call initiated! AI is connecting to the client...',
          '🚀 Arama başlatıldı! AI müşteriyle bağlantı kuruyor...'
        ));
      }
    } catch {
      toast.error(t('Не удалось инициировать звонок', 'Failed to initiate call', 'Arama başlatılamadı'));
      setStep('configure');
    } finally {
      setCalling(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!callResult) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');
      const isRu = language === 'ru';
      const title = isRu ? 'Отчёт о звонке AI-агента' : language === 'en' ? 'AI Agent Call Report' : 'AI Ajan Arama Raporu';
      const dateLabel = isRu ? 'Дата' : language === 'en' ? 'Date' : 'Tarih';
      const clientLabel = isRu ? 'Клиент' : language === 'en' ? 'Client' : 'Müşteri';
      const companyLabel = isRu ? 'Откуда звонили' : language === 'en' ? 'Called from' : 'Aranan';
      const taskLabel = isRu ? 'Задача звонка' : language === 'en' ? 'Call task' : 'Arama görevi';
      const durationLabel = isRu ? 'Длительность' : language === 'en' ? 'Duration' : 'Süre';
      const summaryLabel = isRu ? 'Краткое резюме' : language === 'en' ? 'Summary' : 'Özet';
      const transcriptLabel = isRu ? 'Текст беседы' : language === 'en' ? 'Call transcript' : 'Arama metni';
      const aiLbl = isRu ? 'AI-агент' : 'AI Agent';
      const clientLbl = isRu ? 'Клиент' : language === 'en' ? 'Client' : 'Müşteri';
      const minLabel = isRu ? 'мин.' : 'min.';
      const callDate = new Date(callResult.createdAt).toLocaleString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR');
      const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;
      const callTypeNames: Record<string, string> = { confirmation: isRu ? 'Подтверждение записи' : 'Appointment Confirmation', reminder: isRu ? 'Напоминание' : 'Reminder', follow_up: isRu ? 'Последующий контакт' : 'Follow-up', custom: isRu ? 'Другое' : 'Custom' };

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:48px;background:#fff;font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6;';
      container.innerHTML = `
        <div style="font-size:28px;font-weight:800;color:#059669;margin-bottom:4px;">${title}</div>
        <div style="height:2px;background:linear-gradient(90deg,#059669,#0d9488);margin-bottom:24px;border-radius:1px;"></div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;width:160px;">${dateLabel}</td><td style="padding:6px 0;">${callDate}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${isRu ? 'Тип звонка' : 'Call Type'}</td><td style="padding:6px 0;">${callTypeNames[callResult.callType] || callResult.callType}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${clientLabel}</td><td style="padding:6px 0;">${callResult.clientPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${companyLabel}</td><td style="padding:6px 0;">${callResult.companyPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${durationLabel}</td><td style="padding:6px 0;">${fmtDur(callResult.duration)} (${callResult.duration} ${minLabel})</td></tr>
        </table>
        ${callResult.taskDescription ? `<div style="margin-bottom:16px;"><div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:4px;">${taskLabel}:</div><div style="font-size:12px;color:#4b5563;background:#f9fafb;border-radius:6px;padding:10px 14px;">${callResult.taskDescription}</div></div>` : ''}
        ${callResult.aiSummary ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;font-weight:700;color:#059669;margin-bottom:6px;">✨ ${summaryLabel}</div><div style="font-size:12px;color:#374151;">${callResult.aiSummary}</div></div>` : ''}
        ${callResult.transcript.length > 0 ? `
        <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px;">${transcriptLabel}</div>
        ${callResult.transcript.map((line) => {
          const isAi = line.role === 'ai_agent';
          const bgColor = isAi ? '#ecfdf5' : '#f3f4f6';
          const nameColor = isAi ? '#059669' : '#6b7280';
          const name = isAi ? aiLbl : clientLbl;
          return `<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;"><div style="min-width:90px;font-size:11px;font-weight:700;color:${nameColor};padding:4px 8px;background:${bgColor};border-radius:4px;text-align:center;">${name}<br><span style="font-weight:400;font-size:10px;color:#9ca3af;">${fmtTime(line.timestamp)}</span></div><div style="flex:1;font-size:12px;color:#1f2937;padding-top:2px;">${line.text}</div></div>`;
        }).join('')}` : `
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:13px;color:#92400e;">${isRu ? 'Транскрипция будет доступна после завершения звонка через Vapi webhook.' : 'Transcript will be available after the call ends via Vapi webhook.'}</p>
        </div>`}
        <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;"><span>AgentBot — ${title}</span><span>ID: ${callResult.id}</span></div>
      `;
      document.body.appendChild(container);
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const doc = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      doc.save(`call-report-${callResult.id}.pdf`);
      toast.success(t('PDF скачан!', 'PDF downloaded!', 'PDF indirildi!'));
    } catch {
      toast.error(t('Ошибка при создании PDF', 'Failed to create PDF', 'PDF oluşturulamadı'));
    }
  };

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formatDuration = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  const statusLabel = (status: string) => {
    const labels: Record<string, Record<string, string>> = {
      queued: { ru: '⏳ В очереди', en: '⏳ Queued', tr: '⏳ Sıraya alındı' },
      ringing: { ru: '📞 Звонит...', en: '📞 Ringing...', tr: '📞 Çalıyor...' },
      in_progress: { ru: '🎙️ Разговор...', en: '🎙️ In progress...', tr: '🎙️ Devam ediyor...' },
      completed: { ru: '✅ Завершён', en: '✅ Completed', tr: '✅ Tamamlandı' },
      failed: { ru: '❌ Ошибка', en: '❌ Failed', tr: '❌ Başarısız' },
      no_answer: { ru: '🔕 Нет ответа', en: '🔕 No answer', tr: '🔕 Cevap yok' },
    };
    return labels[status]?.[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru'] || status;
  };

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      queued: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      ringing: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      in_progress: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
      no_answer: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
      {/* Vapi Settings Dialog */}
      <VapiSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="size-5 text-emerald-600" />
              {t('AI-звонок клиенту', 'AI Call to Client', 'AI Müşteri Araması')}
            </DialogTitle>
            <DialogDescription>
              {step === 'configure'
                ? t('Выберите тип звонка и введите номер клиента', 'Choose call type and enter client number', 'Arama türünü seçin ve müşteri numarasını girin')
                : step === 'calling'
                  ? t('AI связывается с клиентом...', 'AI is connecting to the client...', 'AI müşteriyle bağlantı kuruyor...')
                  : t('Результат звонка', 'Call result', 'Arama sonucu')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* ── Step: Configure ── */}
            {step === 'configure' && (
              <>
                {/* Vapi status bar */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {vapiConfigured ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600">
                          Vapi {t('подключён', 'connected', 'bağlı')}
                          {vapiPhone && <span className="text-muted-foreground font-normal"> ({vapiPhone})</span>}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="size-4 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">
                          {t('Vapi не настроен', 'Vapi not configured', 'Vapi yapılandırılmamış')}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setSettingsOpen(true)}
                  >
                    <Settings className="size-3.5" />
                    {t('Настройки', 'Settings', 'Ayarlar')}
                  </Button>
                </div>

                {/* Call type selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('Тип звонка', 'Call Type', 'Arama Türü')}
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {CALL_TYPES.map((ct) => (
                      <button
                        key={ct.id}
                        onClick={() => {
                          setCallType(ct.id);
                          // Pre-fill task description based on type
                          if (ct.id !== 'custom') {
                            const descs: Record<string, Record<string, string>> = {
                              confirmation: { ru: 'Подтвердить запись клиента', en: 'Confirm client appointment', tr: 'Müşteri randevusunu onayla' },
                              reminder: { ru: 'Напомнить о предстоящей записи', en: 'Remind about upcoming appointment', tr: 'Yaklaşan randevuyu hatırlat' },
                              follow_up: { ru: 'Узнать впечатление после обслуживания', en: 'Check satisfaction after service', tr: 'Hizmet sonrası memnuniyeti öğren' },
                            };
                            setTaskDescription(descs[ct.id]?.[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru'] || '');
                          }
                        }}
                        className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                          callType === ct.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                            : 'border-border hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{ct.icon}</span>
                          <span className="text-xs font-semibold leading-tight">{ct.label[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru']}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{ct.desc[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru']}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom task description */}
                {callType === 'custom' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {t('Описание задачи', 'Task description', 'Görev açıklaması')}
                    </Label>
                    <Textarea
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder={t(
                        'Опишите, что AI должен сказать клиенту...',
                        'Describe what AI should say to the client...',
                        'AI\'nın müşteriye ne söylemesi gerektiğini açıklayın...'
                      )}
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                )}

                {/* Client phone */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t('Телефон клиента', 'Client phone number', 'Müşteri telefon numarası')}
                  </Label>
                  <Input
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                    type="tel"
                  />
                </div>

                {/* Call info */}
                {vapiPhone && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('Звонок от:', 'Calling from:', 'Aranan:')}</span>
                      <span className="font-medium">{vapiPhone}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t('Клиент:', 'Client:', 'Müşteri:')}</span>
                      <span className="font-medium">{clientPhone || t('Не указан', 'Not set', 'Belirtilmemiş')}</span>
                    </div>
                  </div>
                )}

                {/* Call button */}
                <Button
                  onClick={handleStartCall}
                  disabled={calling || !clientPhone.trim() || !vapiConfigured}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                >
                  {calling ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      {t('Инициализация звонка...', 'Initiating call...', 'Arama başlatılıyor...')}
                    </>
                  ) : !vapiConfigured ? (
                    <>
                      <Settings className="size-4 mr-2" />
                      {t('Сначала настройте Vapi', 'Configure Vapi first', 'Önce Vapi\'yi yapılandırın')}
                    </>
                  ) : (
                    <>
                      <Phone className="size-4 mr-2" />
                      {t('Позвонить', 'Make Call', 'Ara')}
                    </>
                  )}
                </Button>

                {!vapiConfigured && (
                  <div className="text-center">
                    <Button variant="link" className="text-xs gap-1 text-emerald-600" onClick={() => setSettingsOpen(true)}>
                      <Settings className="size-3.5" />
                      {t('Открыть настройки Vapi', 'Open Vapi settings', 'Vapi ayarlarını aç')}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* ── Step: Calling (in progress) ── */}
            {step === 'calling' && (
              <div className="flex flex-col items-center gap-6 py-8">
                <div className="relative">
                  <div className="size-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <Phone className="size-8 text-emerald-600 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-30" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold">{t('🤖 AI связывается с клиентом...', '🤖 AI is connecting to the client...', '🤖 AI müşteriyle bağlantı kuruyor...')}</p>
                  <p className="text-xs text-muted-foreground">{clientPhone}</p>
                </div>
                <div className="w-full space-y-3">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                    {t('Звонок обрабатывается через Vapi.ai', 'Call is being processed via Vapi.ai', 'Arama Vapi.ai üzerinden işleniyor')}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    {t(
                      'Результаты звонка (транскрипция, резюме) появятся после завершения через webhook Vapi.',
                      'Call results (transcript, summary) will appear after completion via Vapi webhook.',
                      'Arama sonuçları (transkript, özet) Vapi webhook üzerinden tamamlandıktan sonra görünecektir.'
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep('configure');
                    setCallResult(null);
                  }}
                  className="gap-1"
                >
                  {t('← Назад', '← Back', '← Geri')}
                </Button>
              </div>
            )}

            {/* ── Step: Result ── */}
            {step === 'result' && callResult && (
              <>
                {/* Status banner */}
                <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                  callResult.status === 'completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                    : callResult.status === 'failed'
                      ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800'
                      : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800'
                }`}>
                  {callResult.status === 'completed' ? (
                    <CheckCircle2 className="size-8 text-emerald-500 shrink-0" />
                  ) : callResult.status === 'failed' ? (
                    <AlertTriangle className="size-8 text-red-500 shrink-0" />
                  ) : (
                    <Phone className="size-8 text-amber-500 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">
                      {statusLabel(callResult.status)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {callResult.clientPhone}
                      {callResult.duration > 0 && ` · ${formatDuration(callResult.duration)}`}
                    </p>
                  </div>
                  <Badge className={statusColor(callResult.status)}>
                    {statusLabel(callResult.status)}
                  </Badge>
                </div>

                {/* AI Summary */}
                {callResult.aiSummary && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-amber-500" />
                      <span className="text-xs font-semibold text-muted-foreground">{t('Краткое резюме', 'Summary', 'Özet')}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{callResult.aiSummary}</p>
                  </div>
                )}

                {/* Transcript */}
                {callResult.transcript.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">{t('Текст беседы', 'Call transcript', 'Arama metni')}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {callResult.transcript.length} {t('сообщений', 'messages', 'mesaj')}
                      </span>
                    </div>
                    <ScrollArea className="max-h-[260px] rounded-lg border bg-background p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                      {callResult.transcript.map((line, i) => {
                        const isAi = line.role === 'ai_agent';
                        return (
                          <div key={i} className={`flex gap-2 ${isAi ? '' : 'flex-row-reverse'}`}>
                            <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-muted'}`}>
                              <span className="text-[10px] font-bold">{isAi ? 'AI' : (language === 'ru' ? 'К' : 'U')}</span>
                            </div>
                            <div className={`flex-1 rounded-xl px-3 py-2 text-xs leading-relaxed ${isAi ? 'bg-emerald-500 text-white rounded-tl-sm' : 'bg-muted rounded-tr-sm'}`}>
                              {line.text}
                              <div className={`text-[9px] mt-1 ${isAi ? 'text-white/60' : 'text-muted-foreground'}`}>{formatTime(line.timestamp)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </ScrollArea>
                  </div>
                )}

                {/* Pending transcript notice */}
                {!callResult.aiSummary && callResult.transcript.length === 0 && (callResult.status === 'queued' || callResult.status === 'ringing' || callResult.status === 'in_progress') && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <div className="size-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                        {t('Звонок в процессе', 'Call in progress', 'Arama devam ediyor')}
                      </p>
                      <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                        {t('Транскрипция и резюме появятся автоматически после завершения. Откройте историю звонков позже.', 'Transcript and summary will appear automatically after completion. Check call history later.', 'Transkript ve özet tamamlandıktan sonra otomatik olarak görünecektir. Daha sonra arama geçmişini kontrol edin.')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Call meta */}
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Клиент:', 'Client:', 'Müşteri:')}</span>
                    <span className="font-medium">{callResult.clientPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Откуда:', 'From:', 'Aranan:')}</span>
                    <span className="font-medium">{callResult.companyPhone || vapiPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Тип:', 'Type:', 'Tür:')}</span>
                    <span className="font-medium">{CALL_TYPES.find(ct => ct.id === callResult.callType)?.label[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru'] || callResult.callType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Дата:', 'Date:', 'Tarih:')}</span>
                    <span className="font-medium">{new Date(callResult.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button onClick={handleDownloadPdf} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <Download className="size-4" />
                    {t('Скачать PDF', 'Download PDF', 'PDF indir')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStep('configure');
                      setCallResult(null);
                      setClientPhone('');
                    }}
                    className="gap-1"
                  >
                    <Phone className="size-4" />
                    {t('Новый звонок', 'New call', 'Yeni arama')}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 3: Booking Notifications Dialog
// ──────────────────────────────────────────────────────────────

function BookingNotificationsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const [notifs, setNotifs] = useState({ booking: true, reminder24h: true, reminder1h: true, cancelation: false });

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        try {
          const saved = localStorage.getItem('agentbot-notification-settings');
          if (saved) setNotifs(JSON.parse(saved));
        } catch { /* ignore */ }
      });
    }
  }, [open]);

  const handleSave = () => {
    localStorage.setItem('agentbot-notification-settings', JSON.stringify(notifs));
    toast.success(language === 'ru' ? 'Настройки сохранены!' : language === 'en' ? 'Settings saved!' : 'Ayarlar kaydedildi!');
    onOpenChange(false);
  };

  const toggleMap = [
    { key: 'booking' as const, icon: <CalendarDays className="size-3.5" />, label: { ru: 'При записи клиента', en: 'On client booking', tr: 'Müşteri randevusunda' } },
    { key: 'reminder24h' as const, icon: <Clock className="size-3.5" />, label: { ru: 'Напоминание за 24 часа', en: '24h reminder', tr: '24 saat hatırlatma' } },
    { key: 'reminder1h' as const, icon: <Clock className="size-3.5" />, label: { ru: 'Напоминание за 1 час', en: '1h reminder', tr: '1 saat hatırlatma' } },
    { key: 'cancelation' as const, icon: <X className="size-3.5" />, label: { ru: 'Отмена записи', en: 'Cancellation alert', tr: 'Randevu iptali' } },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BellRing className="size-5 text-emerald-600" />
            {language === 'ru' ? 'Настройка уведомлений' : language === 'en' ? 'Configure Notifications' : 'Bildirimleri Yapılandır'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' ? 'Включите/выключите типы уведомлений' : language === 'en' ? 'Toggle notification types' : 'Bildirim türlerini açıp kapatın'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-3">
            {toggleMap.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600">{item.icon}</span>
                  <span className="text-sm">{tx(item.label, language)}</span>
                </div>
                <Switch
                  checked={notifs[item.key]}
                  onCheckedChange={(checked) => setNotifs((prev) => ({ ...prev, [item.key]: checked }))}
                  className="data-[state=checked]:bg-emerald-600"
                />
              </div>
            ))}
          </div>
          <Button onClick={handleSave} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
            {language === 'ru' ? 'Сохранить' : language === 'en' ? 'Save' : 'Kaydet'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 4: Lead Generation Dialog — 3-step goal/contacts form
// ──────────────────────────────────────────────────────────────


function LeadGenerationDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState('');
  const [clientPhones, setClientPhones] = useState('');
  const [clientEmails, setClientEmails] = useState('');
  const [recipientMode, setRecipientMode] = useState<'all' | 'phones' | 'emails'>('all');
  const [channels, setChannels] = useState({ email: true, call: false });
  const [sending, setSending] = useState(false);

  // Company data loaded from DB
  const [companyName, setCompanyName] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [vapiConfigured, setVapiConfigured] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Campaign results
  const [campaignResult, setCampaignResult] = useState<{
    emailsSent: number;
    emailsFailed: number;
    emailsTotal: number;
    callsInitiated: number;
    callsFailed: number;
    callsTotal: number;
    errors: string[];
    vapiNotConfigured: boolean;
    emailNotConfigured: boolean;
    companyName: string;
    companyPhone: string;
  } | null>(null);

  const t = (ru: string, en: string, tr: string) =>
    language === 'ru' ? ru : language === 'en' ? en : tr;

  // Load company data from DB on open
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;

    const headers = { 'x-user-id': user.id };

    Promise.all([
      fetch('/api/user-settings', { headers })
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null),
      fetch('/api/vapi/settings', { headers })
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null),
    ]).then(([settings, vapiSettings]) => {
      if (cancelled) return;

      if (settings) {
        setCompanyName(settings.company || settings.name || '');
        setSenderEmail(settings.emailFrom || '');
      }
      if (vapiSettings) {
        setVapiConfigured(vapiSettings.configured);
        setCompanyPhone(vapiSettings.vapiPhone || '');
      }
      setSettingsLoaded(true);
    });

    return () => { cancelled = true; };
  }, [open, user?.id]);

  const handleStep1Next = () => {
    if (!companyName.trim()) {
      toast.error(t('Укажите название компании в профиле', 'Set company name in profile', 'Profilde şirket adını belirtin'));
      return;
    }
    if (!goal.trim()) {
      toast.error(t('Опишите цель кампании', 'Describe the campaign goal', 'Kampanya hedefini açıklayın'));
      return;
    }
    if (channels.call && !vapiConfigured) {
      toast.error(t('Сначала настройте Vapi в разделе "Звонки клиентам"', 'Set up Vapi in "Client Calls" section first', 'Önce "Müşteri Aramaları" bölümünde Vapi\'yi yapılandırın'));
      return;
    }
    if (channels.email && !channels.call && recipientMode === 'phones' && !clientEmails.trim()) {
      toast.error(t('Укажите email получателей', 'Specify recipient emails', 'Alıcı e-postalarını belirtin'));
      return;
    }
    if (channels.call && !channels.email && recipientMode === 'emails' && !clientPhones.trim()) {
      toast.error(t('Укажите телефоны получателей', 'Specify recipient phones', 'Alıcı telefonlarını belirtin'));
      return;
    }
    setStep(2);
  };

  const handleLaunch = async () => {
    setSending(true);
    try {
      const phoneList = clientPhones.trim()
        ? clientPhones.split(',').map((p) => p.trim()).filter(Boolean)
        : [];
      const emailList = clientEmails.trim()
        ? clientEmails.split(',').map((e) => e.trim()).filter(Boolean)
        : [];

      const res = await fetch('/api/lead-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          goal: goal.trim(),
          recipientMode,
          clientPhones: phoneList,
          clientEmails: emailList,
          channels,
          language: language || 'ru',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || t('Ошибка запуска кампании', 'Campaign launch failed', 'Kampanya başlatılamadı'));
        setSending(false);
        return;
      }

      setCampaignResult(data);
      setStep(3);

      if (data.emailsSent > 0 || data.callsInitiated > 0) {
        toast.success(
          t(
            `Кампания запущена! Отправлено: ${data.emailsSent} писем, ${data.callsInitiated} звонков`,
            `Campaign launched! Sent: ${data.emailsSent} emails, ${data.callsInitiated} calls`,
            `Kampanya başlatıldı! Gönderilen: ${data.emailsSent} e-posta, ${data.callsInitiated} arama`
          )
        );
      }
      if (data.vapiNotConfigured) {
        toast.error(t('Vapi не настроен — звонки не отправлены', 'Vapi not configured — calls not sent', 'Vapi yapılandırılmadı — aramalar gönderilmedi'));
      }
    } catch {
      toast.error(t('Ошибка запуска кампании', 'Campaign launch failed', 'Kampanya başlatılamadı'));
    } finally {
      setSending(false);
    }
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setStep(1);
      setGoal('');
      setClientPhones('');
      setClientEmails('');
      setRecipientMode('all');
      setChannels({ email: true, call: false });
      setSending(false);
      setCampaignResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-emerald-600" />
            {t('Привлечение клиентов', 'Lead Generation', 'Potansiyel Müşteri Kazanımı')}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? t('Настройте кампанию и укажите клиентов', 'Configure the campaign and specify clients', 'Kampanyayı yapılandırın ve müşterileri belirtin')
              : step === 2
                ? t('Подтвердите параметры кампании', 'Confirm campaign parameters', 'Kampanya parametrelerini onaylayın')
                : t('Результат кампании', 'Campaign results', 'Kampanya sonuçları')}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              {s > 1 && (
                <div className={`flex-1 h-0.5 rounded-full ${step >= s ? 'bg-emerald-600' : 'bg-muted'}`} />
              )}
              <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold shrink-0 ${
                step >= s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>{s}</div>
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Configure */}
        {step === 1 && (
          <div className="space-y-4 pt-2">
            {/* Company info card from DB */}
            {settingsLoaded && (
              <div className="rounded-lg border bg-emerald-50/50 dark:bg-emerald-950/30 p-3 space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="size-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    {t('AI-агент свяжется с клиентами от вашего имени', 'AI agent will contact clients on your behalf', 'AI ajanı sizin adınıza müşterilerle iletişim kuracak')}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('Компания:', 'Company:', 'Şirket:')}</span>
                    <span className="font-medium">{companyName || user?.name || t('Не указано', 'Not set', 'Belirtilmedi')}</span>
                  </div>
                  {senderEmail && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Email:', 'Email:', 'E-posta:')}</span>
                      <span className="font-medium truncate max-w-[200px]">{senderEmail}</span>
                    </div>
                  )}
                  {companyPhone && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('Телефон:', 'Phone:', 'Telefon:')}</span>
                      <span className="font-medium">{companyPhone}</span>
                    </div>
                  )}
                  {!companyName && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-snug">
                      {t('Укажите название компании в настройках профиля', 'Set company name in profile settings', 'Profil ayarlarında şirket adını belirtin')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Goal */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('Что предложить клиентам? *', 'What to offer clients? *', 'Müşterilere ne teklif edilecek? *')}
              </Label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={
                  t('Опишите предложение (например, "Скидка 30% на первое посещение до конца месяца")...', 'Describe the offer (e.g., "30% off first visit until end of month")...', 'Teklifi açıklayın (ör. "Ay sonuna kadar ilk ziyarette %30 indirim")...')
                }
                className="min-h-[90px] resize-none"
              />
            </div>

            {/* Channels */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('Каналы связи', 'Communication channels', 'İletişim kanalları')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannels((c) => ({ ...c, email: !c.email }))}
                  className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                    channels.email
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="size-4 text-emerald-600" />
                    <span className="text-xs font-semibold">{t('Email-рассылка', 'Email campaign', 'E-posta kampanyası')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {senderEmail
                      ? `From: ${senderEmail}`
                      : t('Через Resend', 'Via Resend', 'Resend ile')}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setChannels((c) => ({ ...c, call: !c.call }))}
                  className={`text-left rounded-lg border p-3 transition-all duration-200 ${
                    channels.call
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                      : 'border-border hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="size-4 text-emerald-600" />
                    <span className="text-xs font-semibold">{t('AI-звонки', 'AI calls', 'AI aramaları')}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {vapiConfigured
                      ? t(`Через Vapi: ${companyPhone || 'настроен'}`, `Via Vapi: ${companyPhone || 'configured'}`, `Vapi ile: ${companyPhone || 'yapılandırıldı'}`)
                      : t('Нужно настроить Vapi', 'Vapi setup required', 'Vapi yapılandırması gerekli')}
                  </p>
                </button>
              </div>
              {channels.call && !vapiConfigured && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2">
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    {t('Для AI-звонков сначала настройте Vapi.ai в карточке "Звонки клиентам"', 'For AI calls, first set up Vapi.ai in the "Client Calls" card', 'AI aramaları için önce "Müşteri Aramaları" kartında Vapi.ai\'yi yapılandırın')}
                  </p>
                </div>
              )}
            </div>

            {/* Recipients */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t('Получатели', 'Recipients', 'Alıcılar')}
              </Label>
              <Select value={recipientMode} onValueChange={(v) => setRecipientMode(v as 'all' | 'phones' | 'emails')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('Все клиенты из базы', 'All clients from database', 'Veritabanındaki tüm müşteriler')}</SelectItem>
                  <SelectItem value="phones">{t('Указать телефоны вручную', 'Enter phones manually', 'Telefonları manuel girin')}</SelectItem>
                  <SelectItem value="emails">{t('Указать email вручную', 'Enter emails manually', 'E-postaları manuel girin')}</SelectItem>
                </SelectContent>
              </Select>

              {recipientMode === 'phones' && (
                <div className="space-y-1.5">
                  <Input
                    value={clientPhones}
                    onChange={(e) => setClientPhones(e.target.value)}
                    type="tel"
                    placeholder="+7 (999) 123-45-67, +7 (999) 765-43-21"
                  />
                  <p className="text-[11px] text-muted-foreground">{t('Несколько номеров через запятую', 'Multiple numbers comma-separated', 'Birden fazla numara virgülle ayırın')}</p>
                </div>
              )}
              {recipientMode === 'emails' && (
                <div className="space-y-1.5">
                  <Input
                    value={clientEmails}
                    onChange={(e) => setClientEmails(e.target.value)}
                    type="email"
                    placeholder="client1@mail.com, client2@mail.com"
                  />
                  <p className="text-[11px] text-muted-foreground">{t('Несколько адресов через запятую', 'Multiple addresses comma-separated', 'Birden fazla adres virgülle ayırın')}</p>
                </div>
              )}
              {recipientMode === 'all' && (
                <p className="text-[11px] text-muted-foreground">
                  {t('AI-агент свяжется со всеми клиентами из базы данных лидов', 'AI agent will contact all clients from the leads database', 'AI ajanı veritabanındaki tüm müşterilerle iletişim kuracak')}
                </p>
              )}
            </div>

            <Button
              onClick={handleStep1Next}
              disabled={!companyName.trim() || !goal.trim() || (!channels.email && !channels.call)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {t('Далее', 'Next', 'İleri')}
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="size-4 text-emerald-600" />
                <span className="text-xs font-semibold">{t('Параметры кампании', 'Campaign parameters', 'Kampanya parametreleri')}</span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('От имени:', 'On behalf of:', 'Adına:')}</span>
                  <span className="font-medium">{companyName}</span>
                </div>
                {companyPhone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Телефон:', 'Phone:', 'Telefon:')}</span>
                    <span className="font-medium">{companyPhone}</span>
                  </div>
                )}
                {senderEmail && channels.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('Email:', 'Email:', 'E-posta:')}</span>
                    <span className="font-medium truncate max-w-[200px]">{senderEmail}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Цель:', 'Goal:', 'Hedef:')}</span>
                  <span className="font-medium text-right max-w-[260px] leading-snug">{goal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Каналы:', 'Channels:', 'Kanallar:')}</span>
                  <span className="font-medium">
                    {(channels.email ? 'Email' : '') + (channels.email && channels.call ? ' + ' : '') + (channels.call ? t('Звонки', 'Calls', 'Aramalar') : '')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('Получатели:', 'Recipients:', 'Alıcılar:')}</span>
                  <span className="font-medium">
                    {recipientMode === 'all'
                      ? t('Все клиенты', 'All clients', 'Tüm müşteriler')
                      : recipientMode === 'phones'
                        ? `${clientPhones.split(',').filter(Boolean).length} ${t('номер(ов)', 'number(s)', 'numara')}`
                        : `${clientEmails.split(',').filter(Boolean).length} email`}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
              <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
                {t(
                  'AI-агент начнёт реальные действия: отправку писем и/или звонки клиентам от имени вашей компании.',
                  'AI agent will start real actions: sending emails and/or calling clients on behalf of your company.',
                  'AI ajanı gerçek eylemlere başlayacak: şirketiniz adına e-posta gönderme ve/veya müşteri arama.'
                )}
              </span>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                {t('Назад', 'Back', 'Geri')}
              </Button>
              <Button
                onClick={handleLaunch}
                disabled={sending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {sending ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    {t('Запуск...', 'Launching...', 'Başlatılıyor...')}
                  </>
                ) : (
                  <>
                    <Bot className="size-4 mr-2" />
                    {t('Запустить AI-агента', 'Launch AI Agent', 'AI Ajanını Başlat')}
                  </>
                )}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {step === 3 && campaignResult && (
          <div className="space-y-4 pt-2">
            <div className={`flex flex-col items-center gap-3 py-5 rounded-lg ${
              campaignResult.emailsSent > 0 || campaignResult.callsInitiated > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/50'
                : 'bg-red-50 dark:bg-red-950/50'
            }`}>
              {(campaignResult.emailsSent > 0 || campaignResult.callsInitiated > 0) ? (
                <>
                  <CheckCircle2 className="size-10 text-emerald-500" />
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {t('Кампания запущена!', 'Campaign launched!', 'Kампания başlatıldı!')}
                  </p>
                </>
              ) : (
                <>
                  <AlertTriangle className="size-10 text-red-500" />
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                    {t('Не удалось запустить', 'Failed to launch', 'Başlatılamadı')}
                  </p>
                </>
              )}
              <p className="text-xs text-center text-muted-foreground max-w-xs">
                {t(
                  `AI-агент от имени "${campaignResult.companyName}" связывается с клиентами`,
                  `AI agent on behalf of "${campaignResult.companyName}" is contacting clients`,
                  `AI ajanı "${campaignResult.companyName}" adına müşterilerle iletişim kuruyor`
                )}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {channels.email && (
                <div className="rounded-lg border bg-muted/30 p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Mail className="size-3.5" />
                    {t('Email', 'Email', 'E-posta')}
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{campaignResult.emailsSent}</p>
                  <p className="text-[10px] text-muted-foreground">{t('отправлено', 'sent', 'gönderildi')}</p>
                  {campaignResult.emailsFailed > 0 && (
                    <p className="text-[10px] text-red-500">{campaignResult.emailsFailed} {t('ошибок', 'failed', 'başarısız')}</p>
                  )}
                </div>
              )}
              {channels.call && (
                <div className="rounded-lg border bg-muted/30 p-3 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="size-3.5" />
                    {t('Звонки', 'Calls', 'Aramalar')}
                  </div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{campaignResult.callsInitiated}</p>
                  <p className="text-[10px] text-muted-foreground">{t('инициировано', 'initiated', 'başlatıldı')}</p>
                  {campaignResult.callsFailed > 0 && (
                    <p className="text-[10px] text-red-500">{campaignResult.callsFailed} {t('ошибок', 'failed', 'başarısız')}</p>
                  )}
                </div>
              )}
            </div>

            {campaignResult.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 space-y-1.5">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">{t('Ошибки:', 'Errors:', 'Hatalar:')}</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {campaignResult.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-[11px] text-red-600 dark:text-red-400 leading-snug">{err}</p>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleClose}
              variant="outline"
              className="w-full"
            >
              {t('Закрыть', 'Close', 'Kapat')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 6: Reports & Analytics Dialog (REAL data from /api/reports)
// ──────────────────────────────────────────────────────────────

interface ReportDay {
  date: string;
  label: string;
  emails: number;
  calls: number;
  appointments: number;
  leads: number;
  conversations: number;
}

interface ReportTotals {
  emails: number;
  calls: number;
  appointments: number;
  leads: number;
  conversations: number;
}

function ReportsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState<ReportDay[]>([]);
  const [totals, setTotals] = useState<ReportTotals>({ emails: 0, calls: 0, appointments: 0, leads: 0, conversations: 0 });

  // Fetch real data when dialog opens
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);
      try {
        const res = await fetch('/api/reports', { headers: { 'x-user-id': user.id } });
        if (!res.ok) throw new Error('Failed to fetch reports');
        const data = await res.json();
        if (!cancelled) {
          setDailyData(data.dailyData || []);
          setTotals(data.totals || { emails: 0, calls: 0, appointments: 0, leads: 0, conversations: 0 });
        }
      } catch (err) {
        console.error('[ReportsDialog] fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReports();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  // Real CSV export
  const handleExportCSV = () => {
    if (dailyData.length === 0) return;

    const headers = {
      ru: ['Дата', 'Писем', 'Звонков', 'Записей', 'Лиды', 'Диалоги'],
      en: ['Date', 'Emails', 'Calls', 'Appointments', 'Leads', 'Conversations'],
      tr: ['Tarih', 'E-posta', 'Arama', 'Randevu', 'Potansiyel', 'Diyalog'],
    };
    const h = headers[language as keyof typeof headers] || headers.en;

    const rows = dailyData.map((r) => [r.label, r.emails, r.calls, r.appointments, r.leads, r.conversations]);
    // Add totals row
    rows.push(['—', totals.emails, totals.calls, totals.appointments, totals.leads, totals.conversations]);

    const csvContent = [h.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    const msg = language === 'ru' ? 'CSV-отчёт загружен' : language === 'en' ? 'CSV report downloaded' : 'CSV raporu indirildi';
    toast.success(msg);
  };

  const lbl = (ru: string, en: string, tr: string) => language === 'ru' ? ru : language === 'en' ? en : tr;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-emerald-600" />
            {lbl('Отчёт за 7 дней', '7-Day Report', '7 Günlük Rapor')}
          </DialogTitle>
          <DialogDescription>
            {lbl('Реальные данные за последнюю неделю', 'Real data for the last week', 'Son hafta gerçek veriler')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : dailyData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
              <BarChart3 className="size-10 opacity-30" />
              <p className="text-sm">{lbl('Данных за эту неделю пока нет', 'No data for this week yet', 'Bu hafta için henüz veri yok')}</p>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-72">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{lbl('Дата', 'Date', 'Tarih')}</TableHead>
                      <TableHead className="text-xs text-center">{lbl('Писем', 'Emails', 'E-posta')}</TableHead>
                      <TableHead className="text-xs text-center">{lbl('Звонков', 'Calls', 'Arama')}</TableHead>
                      <TableHead className="text-xs text-center">{lbl('Записей', 'Appointments', 'Randevu')}</TableHead>
                      <TableHead className="text-xs text-center">{lbl('Лиды', 'Leads', 'Potansiyel')}</TableHead>
                      <TableHead className="text-xs text-center">{lbl('Диалоги', 'Conversations', 'Diyalog')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyData.map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="text-xs font-medium">{row.label}</TableCell>
                        <TableCell className="text-xs text-center">{row.emails}</TableCell>
                        <TableCell className="text-xs text-center">{row.calls}</TableCell>
                        <TableCell className="text-xs text-center">{row.appointments}</TableCell>
                        <TableCell className="text-xs text-center">{row.leads}</TableCell>
                        <TableCell className="text-xs text-center">{row.conversations}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {/* Totals */}
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 grid grid-cols-5 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.emails}</p>
                  <p className="text-[10px] text-muted-foreground">{lbl('Писем', 'Emails', 'E-posta')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.calls}</p>
                  <p className="text-[10px] text-muted-foreground">{lbl('Звонков', 'Calls', 'Arama')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.appointments}</p>
                  <p className="text-[10px] text-muted-foreground">{lbl('Записей', 'Appointments', 'Randevu')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.leads}</p>
                  <p className="text-[10px] text-muted-foreground">{lbl('Лиды', 'Leads', 'Potansiyel')}</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.conversations}</p>
                  <p className="text-[10px] text-muted-foreground">{lbl('Диалоги', 'Conversations', 'Diyalog')}</p>
                </div>
              </div>
            </>
          )}

          {/* Export buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={handleExportCSV} disabled={loading || dailyData.length === 0}>
              <Download className="size-4" />
              {lbl('Экспорт CSV', 'Export CSV', 'CSV Dışa Aktar')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 7: Activity Detail Dialog
// ──────────────────────────────────────────────────────────────

function ActivityDetailDialog({ open, onOpenChange, activity }: { open: boolean; onOpenChange: (o: boolean) => void; activity: ActivityItem | null }) {
  const { language } = useAppStore();
  if (!activity) return null;

  const handleNavigate = (page: 'bookings' | 'analytics') => {
    useAppStore.getState().setPage(page);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <div className={`flex size-8 items-center justify-center rounded-lg ${activity.color}`}>
              {activity.icon}
            </div>
            {language === 'ru' ? 'Детали действия' : language === 'en' ? 'Action details' : 'İşlem detayları'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-sm leading-relaxed">{tx(activity.text, language)}</p>
            <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleNavigate('bookings')}>
              <CalendarDays className="size-3.5" />
              {language === 'ru' ? 'Перейти к записям' : language === 'en' ? 'Go to bookings' : 'Randevulara git'}
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1" onClick={() => handleNavigate('analytics')}>
              <BarChart3 className="size-3.5" />
              {language === 'ru' ? 'Перейти к статистике' : language === 'en' ? 'Go to analytics' : 'Analitiğe git'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Call History Dialog — list past calls, view transcript, re-download PDF
// ──────────────────────────────────────────────────────────────

interface CallLogItem {
  id: string;
  clientPhone: string;
  companyPhone: string;
  taskDescription: string;
  callType: string;
  status: string;
  duration: number;
  aiSummary: string;
  vapiCallId?: string;
  cost?: number;
  createdAt: string;
}

function CallHistoryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLogItem | null>(null);
  const [callDetail, setCallDetail] = useState<{
    id: string;
    clientPhone: string;
    companyPhone: string;
    taskDescription: string;
    callType: string;
    status: string;
    duration: number;
    transcript: Array<{ role: string; text: string; timestamp: string }>;
    aiSummary: string;
    cost?: number;
    createdAt: string;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const callTypeNames: Record<string, Record<string, string>> = {
    confirmation: { ru: 'Подтверждение', en: 'Confirmation', tr: 'Onay' },
    reminder: { ru: 'Напоминание', en: 'Reminder', tr: 'Hatırlatma' },
    follow_up: { ru: 'Последующий', en: 'Follow-up', tr: 'Takip' },
    custom: { ru: 'Другое', en: 'Custom', tr: 'Özel' },
  };

  const statusInfo: Record<string, { label: Record<string, string>; color: string }> = {
    queued: { label: { ru: 'В очереди', en: 'Queued', tr: 'Sıraya alındı' }, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    ringing: { label: { ru: 'Звонит', en: 'Ringing', tr: 'Çalıyor' }, color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    in_progress: { label: { ru: 'Разговор', en: 'In progress', tr: 'Devam ediyor' }, color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
    completed: { label: { ru: 'Завершён', en: 'Completed', tr: 'Tamamlandı' }, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    failed: { label: { ru: 'Ошибка', en: 'Failed', tr: 'Başarısız' }, color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
    no_answer: { label: { ru: 'Нет ответа', en: 'No answer', tr: 'Cevap yok' }, color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  };

  const getCallTypeName = (ct: string) => callTypeNames[ct]?.[language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru'] || ct;
  const getStatusInfo = (st: string) => statusInfo[st] || { label: { ru: st, en: st, tr: st }, color: 'bg-muted text-muted-foreground' };
  const langKey = language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru';

  useEffect(() => {
    if (open && user?.id) {
      setLoading(true);
      fetch('/api/calls', {
        headers: { 'x-user-id': user.id },
      })
        .then((r) => r.json())
        .then((data) => setCallLogs(data.callLogs || []))
        .catch(() => setCallLogs([]))
        .finally(() => setLoading(false));
    }
  }, [open, user?.id]);

  const handleViewCall = async (call: CallLogItem) => {
    setSelectedCall(call);
    try {
      const res = await fetch(`/api/calls?id=${call.id}`, {
        headers: { 'x-user-id': user?.id || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setCallDetail(data.callLog);
      }
    } catch {
      // ignore
    }
  };

  const handleCloseDetail = () => {
    setCallDetail(null);
    setSelectedCall(null);
  };

  const handleDownloadPdf = async () => {
    const data = callDetail || (selectedCall ? {
      id: selectedCall.id,
      clientPhone: selectedCall.clientPhone,
      companyPhone: selectedCall.companyPhone,
      taskDescription: selectedCall.taskDescription,
      duration: selectedCall.duration,
      transcript: [] as Array<{ role: string; text: string; timestamp: string }>,
      aiSummary: selectedCall.aiSummary,
      createdAt: selectedCall.createdAt,
    } : null);

    if (!data) return;
    setDownloadingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const isRu = language === 'ru';
      const title = isRu ? 'Отчёт о звонке AI-агента' : language === 'en' ? 'AI Agent Call Report' : 'AI Ajan Arama Raporu';
      const dateLabel = isRu ? 'Дата' : language === 'en' ? 'Date' : 'Tarih';
      const clientLabel = isRu ? 'Клиент' : language === 'en' ? 'Client' : 'Müşteri';
      const companyLabel = isRu ? 'Откуда звонили' : language === 'en' ? 'Called from' : 'Aranan';
      const taskLabel = isRu ? 'Задача звонка' : language === 'en' ? 'Call task' : 'Arama görevi';
      const durationLabel = isRu ? 'Длительность' : language === 'en' ? 'Duration' : 'Süre';
      const summaryLabel = isRu ? 'Краткое резюме' : language === 'en' ? 'Summary' : 'Özet';
      const transcriptLabel = isRu ? 'Текст беседы' : language === 'en' ? 'Call transcript' : 'Arama metni';
      const aiLabel = isRu ? 'AI-агент' : 'AI Agent';
      const clientLbl = isRu ? 'Клиент' : language === 'en' ? 'Client' : 'Müşteri';
      const minLabel = isRu ? 'мин.' : 'min.';
      const callDate = new Date(data.createdAt).toLocaleString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR');
      const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:48px;background:#fff;font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6;';
      container.innerHTML = `
        <div style="font-size:28px;font-weight:800;color:#059669;margin-bottom:4px;">${title}</div>
        <div style="height:2px;background:linear-gradient(90deg,#059669,#0d9488);margin-bottom:24px;border-radius:1px;"></div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;width:140px;">${dateLabel}</td><td style="padding:6px 0;">${callDate}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${clientLabel}</td><td style="padding:6px 0;">${data.clientPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${companyLabel}</td><td style="padding:6px 0;">${data.companyPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${durationLabel}</td><td style="padding:6px 0;">${fmtDur(data.duration)} (${data.duration} ${minLabel})</td></tr>
        </table>
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:4px;">${taskLabel}:</div>
          <div style="font-size:12px;color:#4b5563;background:#f9fafb;border-radius:6px;padding:10px 14px;">${data.taskDescription}</div>
        </div>
        ${data.aiSummary ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;"><div style="font-size:13px;font-weight:700;color:#059669;margin-bottom:6px;">✨ ${summaryLabel}</div><div style="font-size:12px;color:#374151;">${data.aiSummary}</div></div>` : ''}
        ${data.transcript.length > 0 ? `
        <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px;">${transcriptLabel}</div>
        ${data.transcript.map((line) => {
          const isAi = line.role === 'ai_agent';
          const bgColor = isAi ? '#ecfdf5' : '#f3f4f6';
          const nameColor = isAi ? '#059669' : '#6b7280';
          const name = isAi ? aiLabel : clientLbl;
          return `<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;"><div style="min-width:90px;font-size:11px;font-weight:700;color:${nameColor};padding:4px 8px;background:${bgColor};border-radius:4px;text-align:center;">${name}<br><span style="font-weight:400;font-size:10px;color:#9ca3af;">${fmtTime(line.timestamp)}</span></div><div style="flex:1;font-size:12px;color:#1f2937;padding-top:2px;">${line.text}</div></div>`;
        }).join('')}` : ''}
        <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;"><span>AgentBot — ${title}</span><span>ID: ${data.id}</span></div>
      `;
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const doc = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position -= pageHeight;
        doc.addPage();
        doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      doc.save(`call-report-${data.id}.pdf`);
      toast.success(language === 'ru' ? 'PDF скачан!' : language === 'en' ? 'PDF downloaded!' : 'PDF indirildi!');
    } catch {
      toast.error(language === 'ru' ? 'Ошибка при создании PDF' : language === 'en' ? 'Failed to create PDF' : 'PDF oluşturulamadı');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

  // ── Detail view ──
  if (selectedCall) {
    return (
      <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) handleCloseDetail(); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleCloseDetail}>
                ← {language === 'ru' ? 'Назад' : language === 'en' ? 'Back' : 'Geri'}
              </Button>
            </div>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="size-5 text-emerald-600" />
              {language === 'ru' ? 'Результат звонка' : language === 'en' ? 'Call Result' : 'Arama Sonucu'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {callDetail?.aiSummary && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-3.5 text-amber-500" />
                  <span className="text-xs font-semibold text-muted-foreground">
                    {language === 'ru' ? 'Краткое резюме' : language === 'en' ? 'Summary' : 'Özet'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{callDetail.aiSummary}</p>
              </div>
            )}

            {callDetail && callDetail.transcript.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {language === 'ru' ? 'Текст беседы' : language === 'en' ? 'Call transcript' : 'Arama metni'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {callDetail.transcript.length} {language === 'ru' ? 'сообщений' : language === 'en' ? 'messages' : 'mesaj'}
                  </span>
                </div>
                <ScrollArea className="max-h-[300px] rounded-lg border bg-background p-3 space-y-3">
                  {callDetail.transcript.map((line, i) => {
                    const isAi = line.role === 'ai_agent';
                    return (
                      <div key={i} className={`flex gap-2 ${isAi ? '' : 'flex-row-reverse'}`}>
                        <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${isAi ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-muted'}`}>
                          <span className="text-[10px] font-bold">{isAi ? 'AI' : (language === 'ru' ? 'К' : 'U')}</span>
                        </div>
                        <div className={`flex-1 rounded-xl px-3 py-2 text-xs leading-relaxed ${isAi ? 'bg-emerald-500 text-white rounded-tl-sm' : 'bg-muted rounded-tr-sm'}`}>
                          {line.text}
                          <div className={`text-[9px] mt-1 ${isAi ? 'text-white/60' : 'text-muted-foreground'}`}>
                            {new Date(line.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>
            )}

            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Клиент:' : language === 'en' ? 'Client:' : 'Müşteri:'}</span>
                <span className="font-medium">{selectedCall.clientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Откуда:' : language === 'en' ? 'From:' : 'Aranan:'}</span>
                <span className="font-medium">{selectedCall.companyPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Тип:' : language === 'en' ? 'Type:' : 'Tür:'}</span>
                <span className="font-medium">{getCallTypeName(selectedCall.callType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Статус:' : language === 'en' ? 'Status:' : 'Durum:'}</span>
                <Badge className={`text-[9px] px-1.5 py-0 h-4 ${getStatusInfo(selectedCall.status).color}`}>
                  {getStatusInfo(selectedCall.status).label[langKey]}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Длительность:' : language === 'en' ? 'Duration:' : 'Süre:'}</span>
                <span className="font-medium">{selectedCall.duration > 0 ? fmtDur(selectedCall.duration) : '—'}</span>
              </div>
              {selectedCall.cost != null && selectedCall.cost > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Стоимость:' : language === 'en' ? 'Cost:' : 'Maliyet:'}</span>
                  <span className="font-medium text-emerald-600">${selectedCall.cost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">{language === 'ru' ? 'Дата:' : language === 'en' ? 'Date:' : 'Tarih:'}</span>
                <span className="font-medium">{new Date(selectedCall.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <Button onClick={handleDownloadPdf} disabled={downloadingPdf} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {downloadingPdf ? <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Download className="size-4" />}
              {language === 'ru' ? 'Скачать PDF-отчёт' : language === 'en' ? 'Download PDF report' : 'PDF raporu indir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── List view ──
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-emerald-600" />
            {language === 'ru' ? 'История звонков' : language === 'en' ? 'Call History' : 'Arama Geçmişi'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' ? 'Все выполненные AI-звонки с результатами' : language === 'en' ? 'All completed AI calls with results' : 'Sonuçlarıyla tüm tamamlanan AI aramaları'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          ) : callLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 rounded-lg bg-muted/30">
              <Phone className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Звонков пока не было' : language === 'en' ? 'No calls yet' : 'Henüz arama yok'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                {language === 'ru' ? 'Сделайте первый звонок через раздел «Звонки клиентам»' : language === 'en' ? 'Make your first call from the "Client Calls" section' : 'İlk aramanızı "Müşteri Çağrıları" bölümünden yapın'}
              </p>
            </div>
          ) : (
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-2">
                {callLogs.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => handleViewCall(call)}
                    className="w-full text-left rounded-lg border p-3 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 shrink-0">
                          <Phone className="size-3.5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{call.clientPhone}</p>
                            <Badge className={`text-[9px] px-1.5 py-0 h-4 ${getStatusInfo(call.status).color}`}>
                              {getStatusInfo(call.status).label[langKey]}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {getCallTypeName(call.callType)}{call.taskDescription ? ` · ${call.taskDescription}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">{call.duration > 0 ? fmtDur(call.duration) : '—'}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </p>
                        {call.cost != null && call.cost > 0 && (
                          <p className="text-[10px] text-emerald-600 font-medium">${call.cost.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    {call.aiSummary && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1 pl-[42px]">{call.aiSummary}</p>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Main AI Agent Page
// ──────────────────────────────────────────────────────────────

export function AiAgentPage() {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [callHistoryOpen, setCallHistoryOpen] = useState(false);
  const [bookingNotifOpen, setBookingNotifOpen] = useState(false);
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>(MOCK_ACTIVITIES);
  const [agentEnabled, setAgentEnabled] = useState(true);

  // ── Real agent stats from DB ──
  const [agentStats, setAgentStats] = useState<{
    tasksToday: number;
    totalMessages: number;
    confirmedBookings: number;
    lastActivity: string | null;
  } | null>(null);

  // ── AI Performance metrics from /api/reports ──
  const [aiPerformance, setAiPerformance] = useState<{
    tasksCompleted: number;
    satisfaction: number;
    avgResponseSeconds: number | null;
  } | null>(null);

  // ── User's configured sender email ──
  const [userEmailFrom, setUserEmailFrom] = useState<string | null>(null);

  /** Format an ISO timestamp into a human-readable relative string like "2 мин назад" */
  function formatTimeAgo(iso: string | null, lang: string): string {
    if (!iso) return lang === 'ru' ? 'Нет данных' : lang === 'en' ? 'No data' : 'Veri yok';
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return lang === 'ru' ? 'только что' : lang === 'en' ? 'just now' : 'şimdi';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) {
      const unit = lang === 'ru' ? 'мин назад' : lang === 'en' ? `${diffMin === 1 ? 'min' : 'mins'} ago` : 'dk önce';
      return `${diffMin} ${unit}`;
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      const unit = lang === 'ru' ? 'ч назад' : lang === 'en' ? `${diffHr === 1 ? 'hour' : 'hours'} ago` : 'saat önce';
      return `${diffHr} ${unit}`;
    }
    const diffDay = Math.floor(diffHr / 24);
    const unit = lang === 'ru' ? 'дн назад' : lang === 'en' ? `${diffDay === 1 ? 'day' : 'days'} ago` : 'gün önce';
    return `${diffDay} ${unit}`;
  }

  const [notifications, setNotifications] = useState({
    booking: true,
    reminder24h: true,
    reminder1h: true,
    cancelation: false,
  });

  // Issue 8: Check if user has bots
  const hasBots = (user?.role === 'admin' || user?.role === 'user') ?? false;

  // Fetch real activity data on mount
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function fetchActivityData() {
      try {
        const headers = { 'x-user-id': user.id };

        // Fetch analytics for the week + AI performance
        const [analyticsRes, botsRes, statsRes, settingsRes, reportsRes] = await Promise.all([
          fetch('/api/analytics?range=week', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/bots', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/agent-stats', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/user-settings', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/reports', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (cancelled) return;

        // Set real agent stats
        if (statsRes) {
          setAgentStats(statsRes);
        }

        // Set AI performance metrics
        if (reportsRes?.performance) {
          setAiPerformance(reportsRes.performance);
        }

        // Set user's configured sender email
        if (settingsRes?.emailFrom) {
          setUserEmailFrom(settingsRes.emailFrom);
        }

        const realItems: ActivityItem[] = [];
        let idCounter = 1;

        // Add bot events
        if (botsRes?.bots && botsRes.bots.length > 0) {
          botsRes.bots.forEach((bot: { name: string; isActive: boolean; createdAt: string }) => {
            realItems.push({
              id: idCounter++,
              icon: <Bot className="size-4" />,
              text: {
                ru: `Бот «${bot.name}» ${bot.isActive ? 'активен' : 'отключён'}`,
                en: `Bot "${bot.name}" ${bot.isActive ? 'is active' : 'is inactive'}`,
                tr: `Bot "${bot.name}" ${bot.isActive ? 'aktif' : 'devre dışı'}`,
              },
              time: new Date(bot.createdAt).toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR'),
              color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950',
            });
          });
        }

        // Add conversation events
        if (analyticsRes && analyticsRes.totalConversations > 0) {
          realItems.push({
            id: idCounter++,
            icon: <MessageCircle className="size-4" />,
            text: {
              ru: `${analyticsRes.totalConversations} диалогов за неделю`,
              en: `${analyticsRes.totalConversations} conversation${analyticsRes.totalConversations > 1 ? 's' : ''} this week`,
              tr: `Bu hafta ${analyticsRes.totalConversations} görüşme`,
            },
            time: '7 ' + (language === 'ru' ? 'дней' : language === 'en' ? 'days' : 'gün'),
            color: 'text-cyan-500 bg-cyan-100 dark:bg-cyan-950',
          });
        }

        // Add appointment events
        if (analyticsRes && analyticsRes.totalAppointments > 0) {
          realItems.push({
            id: idCounter++,
            icon: <CheckCircle2 className="size-4" />,
            text: {
              ru: `${analyticsRes.totalAppointments} записей за неделю`,
              en: `${analyticsRes.totalAppointments} appointment${analyticsRes.totalAppointments > 1 ? 's' : ''} this week`,
              tr: `Bu hafta ${analyticsRes.totalAppointments} randevu`,
            },
            time: '7 ' + (language === 'ru' ? 'дней' : language === 'en' ? 'days' : 'gün'),
            color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950',
          });
        }

        // Add visitor events
        if (analyticsRes && analyticsRes.totalVisitors > 0) {
          realItems.push({
            id: idCounter++,
            icon: <Users className="size-4" />,
            text: {
              ru: `${analyticsRes.totalVisitors} посетителей за неделю`,
              en: `${analyticsRes.totalVisitors} visitor${analyticsRes.totalVisitors > 1 ? 's' : ''} this week`,
              tr: `Bu hafta ${analyticsRes.totalVisitors} ziyaretçi`,
            },
            time: '7 ' + (language === 'ru' ? 'дней' : language === 'en' ? 'days' : 'gün'),
            color: 'text-violet-500 bg-violet-100 dark:bg-violet-950',
          });
        }

        if (realItems.length > 0) {
          setActivities(realItems);
        } else {
          // No real data — show empty message
          setActivities([]);
        }
      } catch {
        // On API failure, keep MOCK_ACTIVITIES as fallback
        setActivities(MOCK_ACTIVITIES);
      }
    }

    fetchActivityData();
    return () => { cancelled = true; };
  }, [user?.id, language]);

  const capabilities = useMemo(
    () => [
      {
        key: 'email',
        icon: <Mail className="size-5" />,
        title: { ru: 'Письма и рассылки', en: 'Email & Newsletters', tr: 'E-posta ve Bültenler' },
        description: {
          ru: 'AI пишет персонализированные письма клиентам: поздравления с днём рождения, напоминания о записях, промо-акции',
          en: 'AI writes personalized emails to clients: birthday greetings, appointment reminders, promotional campaigns',
          tr: 'AI müşterilere kişiselleştirilmiş e-postalar yazar: doğum günü tebrikleri, randevu hatırlatmaları, promosyonlar',
        },
        buttonText: { ru: 'Написать письмо', en: 'Compose Email', tr: 'E-posta Yaz' },
        badge: { ru: '6 шаблонов', en: '6 templates', tr: '6 şablon' },
        action: () => setEmailDialogOpen(true),
      },
      {
        key: 'calls',
        icon: <Phone className="size-5" />,
        title: { ru: 'Звонки клиентам', en: 'Client Calls', tr: 'Müşteri Çağrıları' },
        description: {
          ru: 'AI инициирует звонки для подтверждения записей, напоминания о визитах и последующего контакта после обслуживания',
          en: 'AI initiates calls to confirm appointments, remind about visits, and follow up after service',
          tr: 'AI randevu onayı, ziyaret hatırlatması ve hizmet sonrası takip için aramalar başlatır',
        },
        buttonText: { ru: 'Позвонить', en: 'Make Call', tr: 'Ara' },
        badge: { ru: 'Vapi.ai', en: 'Vapi.ai', tr: 'Vapi.ai' },
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        action: () => setCallDialogOpen(true),
      },
      {
        key: 'bookings',
        icon: <BellRing className="size-5" />,
        title: { ru: 'Уведомления о записях', en: 'Booking Notifications', tr: 'Randevu Bildirimleri' },
        description: {
          ru: 'Автоматические уведомления при записи клиента, напоминания за 24ч и 1ч, оповещения об отменах',
          en: 'Automatic notifications on client booking, reminders 24h and 1h before, cancellation alerts',
          tr: 'Müşteri randevusu, 24 saat ve 1 saat önce hatırlatmalar, iptal uyarıları için otomatik bildirimler',
        },
        buttonText: { ru: 'Настроить', en: 'Configure', tr: 'Yapılandır' },
        badge: { ru: 'Авто', en: 'Auto', tr: 'Otomatik' },
        action: () => setBookingNotifOpen(true),
      },
      {
        key: 'leads',
        icon: <Users className="size-5" />,
        title: { ru: 'Привлечение клиентов', en: 'Lead Generation', tr: 'Potansiyel Müşteri Kazanımı' },
        description: {
          ru: 'AI-агент массово связывается с клиентами от вашего имени: рассылает email и/или совершает звонки с персонализированным предложением',
          en: 'AI agent contacts clients on your behalf at scale: sends personalized emails and/or makes AI phone calls',
          tr: 'AI ajanı şirketiniz adına toplu olarak müşterilerle iletişim kurar: kişiselleştirilmiş e-posta ve/veya AI telefon aramaları yapar',
        },
        buttonText: { ru: 'Запустить', en: 'Launch', tr: 'Başlat' },
        badge: { ru: 'Email + Звонки', en: 'Email + Calls', tr: 'E-posta + Arama' },
        badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
        action: () => setLeadDialogOpen(true),
      },
      {
        key: 'analytics',
        icon: <BarChart3 className="size-5" />,
        title: { ru: 'Отчёты и аналитика', en: 'Reports & Analytics', tr: 'Raporlar ve Analitik' },
        description: {
          ru: 'Еженедельные сводные отчёты, тренды удовлетворённости клиентов, прогнозы выручки, экспорт в PDF и CSV',
          en: 'Daily/weekly summary reports, client satisfaction trends, revenue forecasts, PDF & CSV export',
          tr: 'Günlük/haftalık özet raporlar, müşteri memnuniyeti trendleri, gelir tahminleri, PDF ve CSV dışa aktarma',
        },
        buttonText: { ru: 'Посмотреть', en: 'View', tr: 'Görüntüle' },
        badge: { ru: 'Экспорт', en: 'Export', tr: 'Dışa Aktar' },
        badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
        action: () => setReportsDialogOpen(true),
      },
    ],
    [language]
  );

  return (
    <div className="space-y-6">
      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 md:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="size-6 text-emerald-200" />
              <Badge className="bg-white/20 text-white border-0 text-xs backdrop-blur-sm">
                AI-Powered
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {language === 'ru'
                ? 'AI-агент — ваш виртуальный сотрудник'
                : language === 'en'
                  ? 'AI Agent — your virtual employee'
                  : 'AI Ajanı — sanal çalışkanız'}
            </h1>
            <p className="text-emerald-100 text-sm md:text-base leading-relaxed max-w-xl">
              {language === 'ru'
                ? 'Автоматизируйте рутинные задачи: письма, звонки, уведомления, привлечение клиентов и аналитику. AI работает 24/7, не болеет и не просит повышения.'
                : language === 'en'
                  ? 'Automate routine tasks: emails, calls, notifications, lead generation, and analytics. AI works 24/7, never gets sick, and never asks for a raise.'
                  : 'Rutin görevleri otomatikleştirin: e-postalar, aramalar, bildirimler, müşteri kazanımı ve analitik. AI 7/24 çalışır, hastalanmaz ve zam talep etmez.'}
            </p>
          </div>

          {/* Status Card */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white shrink-0 w-full md:w-64">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-200">
                  {language === 'ru' ? 'Статус агента' : language === 'en' ? 'Agent Status' : 'Ajan Durumu'}
                </span>
                <div className={`flex items-center gap-1.5 text-xs font-medium ${agentEnabled ? 'text-emerald-200' : 'text-red-200'}`}>
                  <div className={`size-2 rounded-full ${agentEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                  {agentEnabled
                    ? language === 'ru' ? 'Активен' : language === 'en' ? 'Active' : 'Aktif'
                    : language === 'ru' ? 'Выключен' : language === 'en' ? 'Off' : 'Kapalı'}
                </div>
              </div>
              <Separator className="bg-white/20" />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200">
                    {language === 'ru' ? 'Задач сегодня' : language === 'en' ? 'Tasks today' : 'Bugünkü görevler'}
                  </span>
                  <span className="font-semibold">{agentStats?.tasksToday ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200">
                    {language === 'ru' ? 'Сообщений' : language === 'en' ? 'Messages' : 'Mesajlar'}
                  </span>
                  <span className="font-semibold">{agentStats?.totalMessages ?? 0}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-200">
                    {language === 'ru' ? 'Записей подтверждено' : language === 'en' ? 'Appointments confirmed' : 'Onaylanan randevular'}
                  </span>
                  <span className="font-semibold">{agentStats?.confirmedBookings ?? 0}</span>
                </div>
              </div>
              <Separator className="bg-white/20" />
              <div className="flex items-center gap-2 text-xs text-emerald-200">
                <Clock className="size-3" />
                <span>
                  {language === 'ru' ? 'Последняя активность: ' : language === 'en' ? 'Last activity: ' : 'Son aktivite: '}
                  {formatTimeAgo(agentStats?.lastActivity ?? null, language)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── AI Agent Toggle ── */}
      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <Zap className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {language === 'ru' ? 'AI-агент' : language === 'en' ? 'AI Agent' : 'AI Ajanı'}
              </p>
              <p className="text-xs text-muted-foreground">
                {agentEnabled
                  ? language === 'ru' ? 'Все автоматические задачи активны' : language === 'en' ? 'All automated tasks are active' : 'Tüm otomatik görevler aktif'
                  : language === 'ru' ? 'Автоматические задачи приостановлены' : language === 'en' ? 'Automated tasks are paused' : 'Otomatik görevler duraklatıldı'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={agentEnabled ? 'default' : 'secondary'} className={agentEnabled ? 'bg-emerald-600 text-white' : ''}>
              {agentEnabled
                ? language === 'ru' ? 'Включён' : language === 'en' ? 'Enabled' : 'Etkin'
                : language === 'ru' ? 'Выключен' : language === 'en' ? 'Disabled' : 'Devre Dışı'}
            </Badge>
            <Switch checked={agentEnabled} onCheckedChange={setAgentEnabled} className="data-[state=checked]:bg-emerald-600" />
          </div>
        </CardContent>
      </Card>

      {/* ── Capabilities Grid ── */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="size-5 text-emerald-600" />
          {language === 'ru' ? 'Возможности AI-агента' : language === 'en' ? 'AI Agent Capabilities' : 'AI Ajan Yetenekleri'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="space-y-2">
            <CapabilityCard
              icon={<Mail className="size-5" />}
              title={capabilities[0].title}
              description={capabilities[0].description}
              buttonText={capabilities[0].buttonText}
              badge={capabilities[0].badge}
              onClick={capabilities[0].action}
            />
            {userEmailFrom && (
              <div className="flex items-center gap-1.5 px-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <AtSign className="size-3" />
                <span className="truncate">{userEmailFrom}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <CapabilityCard
              icon={<Phone className="size-5" />}
              title={capabilities[1].title}
              description={capabilities[1].description}
              buttonText={capabilities[1].buttonText}
              badge={capabilities[1].badge}
              badgeColor={capabilities[1].badgeColor}
              onClick={capabilities[1].action}
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-xs text-muted-foreground hover:text-emerald-600"
              onClick={() => setCallHistoryOpen(true)}
            >
              <Clock className="size-3.5" />
              {language === 'ru' ? 'История звонков' : language === 'en' ? 'Call history' : 'Arama geçmişi'}
            </Button>
          </div>

          <CapabilityCard
            icon={<BellRing className="size-5" />}
            title={capabilities[2].title}
            description={capabilities[2].description}
            buttonText={capabilities[2].buttonText}
            badge={capabilities[2].badge}
            onClick={capabilities[2].action}
          >
            <div className="space-y-2">
              {[
                { key: 'booking' as const, icon: <CalendarDays className="size-3.5" />, label: { ru: 'При записи клиента', en: 'On client booking', tr: 'Müşteri randevusunda' } },
                { key: 'reminder24h' as const, icon: <Clock className="size-3.5" />, label: { ru: 'За 24 часа', en: '24h before', tr: '24 saat önce' } },
                { key: 'reminder1h' as const, icon: <Clock className="size-3.5" />, label: { ru: 'За 1 час', en: '1h before', tr: '1 saat önce' } },
                { key: 'cancelation' as const, icon: <X className="size-3.5" />, label: { ru: 'При отмене', en: 'On cancellation', tr: 'İptal durumunda' } },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-emerald-600">{item.icon}</span>
                    <span>{tx(item.label, language)}</span>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                    className="data-[state=checked]:bg-emerald-600 scale-90"
                  />
                </div>
              ))}
            </div>
          </CapabilityCard>

          <CapabilityCard
            icon={<Users className="size-5" />}
            title={capabilities[3].title}
            description={capabilities[3].description}
            buttonText={capabilities[3].buttonText}
            badge={capabilities[3].badge}
            badgeColor={capabilities[3].badgeColor}
            onClick={capabilities[3].action}
          />

          <CapabilityCard
            icon={<BarChart3 className="size-5" />}
            title={capabilities[4].title}
            description={capabilities[4].description}
            buttonText={capabilities[4].buttonText}
            badge={capabilities[4].badge}
            badgeColor={capabilities[4].badgeColor}
            onClick={capabilities[4].action}
          >
            <div className="space-y-2">
              {[
                { icon: <FileText className="size-3.5" />, label: { ru: 'Еженедельный отчёт', en: 'Weekly report', tr: 'Haftalık rapor' }, time: { ru: 'Понедельник', en: 'Monday', tr: 'Pazartesi' } },
                { icon: <TrendingUp className="size-3.5" />, label: { ru: 'Тренд удовлетворённости', en: 'Satisfaction trend', tr: 'Memnuniyet trendi' }, time: { ru: 'Авто', en: 'Auto', tr: 'Otomatik' } },
                { icon: <BarChart3 className="size-3.5" />, label: { ru: 'Прогноз выручки', en: 'Revenue forecast', tr: 'Gelir tahmini' }, time: { ru: 'Ежемесячно', en: 'Monthly', tr: 'Aylık' } },
              ].map((item) => (
                <div key={item.time.ru} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="text-emerald-600">{item.icon}</span>
                    <span>{tx(item.label, language)}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{tx(item.time, language)}</Badge>
                </div>
              ))}
            </div>
          </CapabilityCard>
        </div>
      </div>

      {/* ── Bottom Section: Activity Feed + Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Issue 7: Clickable Activity Feed */}
        <Card className="lg:col-span-2 border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Zap className="size-4 text-emerald-600" />
                {language === 'ru' ? 'Лента активности AI' : language === 'en' ? 'AI Activity Feed' : 'AI Aktivite Akışı'}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {activities.length}{' '}
                {language === 'ru' ? 'действий' : language === 'en' ? 'actions' : 'işlem'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-96">
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <Zap className="size-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {language === 'ru'
                      ? 'Пока нет активности. Создайте бота и дождитесь первого визита.'
                      : language === 'en'
                        ? 'No activity yet. Create a bot and wait for the first visitor.'
                        : 'Henüz aktivite yok. Bir bot oluşturun ve ilk ziyaretçiyi bekleyin.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    className="w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => setSelectedActivity(activity)}
                  >
                    <div className={`flex size-9 items-center justify-center rounded-lg shrink-0 ${activity.color}`}>
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug">{tx(activity.text, language)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                    </div>
                    <ChevronDown className="size-3.5 text-muted-foreground rotate-[-90deg]" />
                  </button>
                ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Issue 8: Stats Panel - realistic for new/existing users */}
        <div className="space-y-4">
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-600" />
                {language === 'ru' ? 'Статистика за сегодня' : language === 'en' ? "Today's Stats" : 'Bugünün İstatistikleri'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasBots ? (
                /* Issue 8: New user state */
                <div className="space-y-3">
                  <div className="flex flex-col items-center gap-2 py-4 rounded-lg bg-muted/30">
                    <Bot className="size-8 text-muted-foreground" />
                    <p className="text-xs text-center text-muted-foreground">
                      {language === 'ru'
                        ? 'Создайте первого AI-агента, чтобы увидеть метрики'
                        : language === 'en'
                          ? 'Create your first AI agent to see metrics'
                          : 'Metrikleri görmek için ilk AI ajanınızı oluşturun'}
                    </p>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => useAppStore.getState().setPage('bot-builder')}
                    >
                      {language === 'ru' ? 'Начать работу' : language === 'en' ? 'Get Started' : 'Başla'}
                    </Button>
                  </div>
                  {[
                    { label: { ru: 'Писем отправлено', en: 'Emails sent', tr: 'Gönderilen e-posta' }, value: '0' },
                    { label: { ru: 'Звонков выполнено', en: 'Calls made', tr: 'Yapılan aramalar' }, value: '0' },
                    { label: { ru: 'Новых лидов', en: 'New leads', tr: 'Yeni potansiyel müşteri' }, value: '0' },
                  ].map((stat) => (
                    <div key={stat.value + stat.label.ru} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tx(stat.label, language)}</span>
                      <span className="font-medium text-muted-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                /* Existing user with bots — real data from API */
                [
                  { icon: <Mail className="size-4" />, label: { ru: 'Писем отправлено', en: 'Emails sent', tr: 'Gönderilen e-posta' }, value: agentStats?.emailsSent ?? 0 },
                  { icon: <Phone className="size-4" />, label: { ru: 'Звонков выполнено', en: 'Calls made', tr: 'Yapılan aramalar' }, value: agentStats?.callsMade ?? 0 },
                  { icon: <Users className="size-4" />, label: { ru: 'Новых лидов', en: 'New leads', tr: 'Yeni potansiyel müşteri' }, value: agentStats?.newLeads ?? 0 },
                  { icon: <MessageCircle className="size-4" />, label: { ru: 'Диалогов обработано', en: 'Conversations', tr: 'İşlenen diyaloglar' }, value: agentStats?.conversationsProcessed ?? 0 },
                ].map((stat) => (
                  <div key={stat.label.ru} className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 shrink-0">
                      {stat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-muted-foreground">{tx(stat.label, language)}</span>
                      <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* AI Performance - real data from /api/reports */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {language === 'ru' ? 'Эффективность AI' : language === 'en' ? 'AI Performance' : 'AI Performansı'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: { ru: 'Задачи выполнены', en: 'Tasks completed', tr: 'Tamamlanan görevler' },
                  value: aiPerformance?.tasksCompleted ?? 0,
                  display: aiPerformance ? `${aiPerformance.tasksCompleted}%` : '0%',
                },
                {
                  label: { ru: 'Удовлетворённость', en: 'Satisfaction', tr: 'Memnuniyet' },
                  value: aiPerformance?.satisfaction ?? 0,
                  display: aiPerformance ? `${aiPerformance.satisfaction}%` : '0%',
                },
                {
                  label: { ru: 'Время отклика', en: 'Response time', tr: 'Yanıt süresi' },
                  value: aiPerformance?.avgResponseSeconds != null ? Math.max(0, 100 - Math.min(100, Math.round((aiPerformance.avgResponseSeconds / 10) * 100))) : 0,
                  display: aiPerformance?.avgResponseSeconds != null
                    ? (aiPerformance.avgResponseSeconds < 60
                        ? `${Math.round(aiPerformance.avgResponseSeconds)}${language === 'ru' ? ' сек' : language === 'en' ? 's' : 'sn'}`
                        : `${Math.round(aiPerformance.avgResponseSeconds / 60)}${language === 'ru' ? ' мин' : language === 'en' ? ' min' : ' dk'}`)
                    : (language === 'ru' ? 'Нет данных' : language === 'en' ? 'No data' : 'Veri yok'),
                },
              ].map((item) => (
                <div key={item.label.ru} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tx(item.label, language)}</span>
                    <span className="font-medium">{item.display}</span>
                  </div>
                  <Progress value={item.value} className="h-2 [&>[data-slot=indicator]]:bg-emerald-600" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── All Dialogs ── */}
      <EmailComposerDialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen} />
      <CallScriptDialog open={callDialogOpen} onOpenChange={setCallDialogOpen} />
      <CallHistoryDialog open={callHistoryOpen} onOpenChange={setCallHistoryOpen} />
      <BookingNotificationsDialog open={bookingNotifOpen} onOpenChange={setBookingNotifOpen} />
      <LeadGenerationDialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen} />
      <ReportsDialog open={reportsDialogOpen} onOpenChange={setReportsDialogOpen} />
      <ActivityDetailDialog
        open={!!selectedActivity}
        onOpenChange={(v) => { if (!v) setSelectedActivity(null); }}
        activity={selectedActivity}
      />
    </div>
  );
}

export default AiAgentPage;
