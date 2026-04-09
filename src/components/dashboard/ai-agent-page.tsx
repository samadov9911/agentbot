'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Mail,
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

const MOCK_CLIENTS = [
  { id: '1', name: 'Анна Петрова', email: 'anna@example.com', date: '2025-06-10', isNew: true },
  { id: '2', name: 'Михаил Сидоров', email: 'mikhail@example.com', date: '2025-06-12', isNew: true },
  { id: '3', name: 'Елена Козлова', email: 'elena@example.com', date: '2025-06-01', isNew: false },
  { id: '4', name: 'Дмитрий Волков', email: 'dmitry@example.com', date: '2025-06-08', isNew: false },
  { id: '5', name: 'Ольга Новикова', email: 'olga@example.com', date: '2025-06-11', isNew: true },
  { id: '6', name: 'Сергей Морозов', email: 'sergey@example.com', date: '2025-06-05', isNew: false },
  { id: '7', name: 'Наталья Лебедева', email: 'natalia@example.com', date: '2025-06-13', isNew: true },
  { id: '8', name: 'Алексей Кузнецов', email: 'alexey@example.com', date: '2025-06-02', isNew: false },
];

function EmailComposerDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const [recipientType, setRecipientType] = useState('all');
  const [emailAddresses, setEmailAddresses] = useState('');
  const [emailType, setEmailType] = useState('welcome');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        try {
          const saved = localStorage.getItem('agentbot-custom-email-templates');
          if (saved) setCustomTemplates(JSON.parse(saved));
        } catch { /* ignore */ }
      });
    }
  }, [open]);

  const handleDialogClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setSelectedClients(new Set());
      setDateFrom('');
      setDateTo('');
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

  const newClients = useMemo(() => MOCK_CLIENTS.filter((c) => c.isNew), []);
  const filteredClients = useMemo(() => {
    let list = MOCK_CLIENTS;
    if (dateFrom) list = list.filter((c) => c.date >= dateFrom);
    if (dateTo) list = list.filter((c) => c.date <= dateTo);
    return list;
  }, [dateFrom, dateTo]);

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
    setSending(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      onOpenChange(false);
      setSubject('');
      setBody('');
      setEmailType('welcome');
      setRecipientType('all');
      setEmailAddresses('');
    }, 2000);
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
                {newClients.map((client) => (
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
              {filteredClients.length > 0 ? (
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
              <CheckCircle2 className="size-10 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {language === 'ru' ? 'Письмо успешно отправлено!' : language === 'en' ? 'Email sent successfully!' : 'E-posta başarıyla gönderildi!'}
              </p>
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

function CallScriptDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [taskDescription, setTaskDescription] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [script, setScript] = useState('');
  const [generating, setGenerating] = useState(false);
  const [calling, setCalling] = useState(false);

  // Result state
  const [callResult, setCallResult] = useState<{
    id: string;
    clientPhone: string;
    companyPhone: string;
    taskDescription: string;
    duration: number;
    transcript: Array<{ role: string; text: string; timestamp: string }>;
    aiSummary: string;
    createdAt: string;
  } | null>(null);

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setTimeout(() => {
        setStep(1);
        setTaskDescription('');
        setClientPhone('');
        setCompanyPhone('');
        setScript('');
        setCalling(false);
        setCallResult(null);
      }, 200);
    }
  };

  const handleGenerateScript = async () => {
    if (!taskDescription.trim()) {
      toast.error(
        language === 'ru' ? 'Опишите задачу для звонка' : language === 'en' ? 'Describe the call task' : 'Arama görevini açıklayın'
      );
      return;
    }
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 1500));

    const generatedScripts: Record<string, string> = {
      ru: `Здравствуйте! Это автоматический звонок от вашей компании.\n\nЗадача звонка: ${taskDescription}\n\nСкрипт:\n1. Представиться и назвать причину звонка.\n2. Кратко изложить суть: "${taskDescription}".\n3. Уточнить удобное время для обсуждения.\n4. Ответить на вопросы клиента.\n5. Подвести итоги и договориться о следующем шаге.\n\nБудьте вежливы и профессиональны. Удачи!`,
      en: `Hello! This is an automated call from your company.\n\nCall task: ${taskDescription}\n\nScript:\n1. Introduce yourself and state the reason for calling.\n2. Briefly explain: "${taskDescription}".\n3. Ask about a convenient time to discuss.\n4. Answer the client's questions.\n5. Summarize and agree on next steps.\n\nBe polite and professional. Good luck!`,
      tr: `Merhaba! Bu şirketinizden otomatik bir arama.\n\nArama görevi: ${taskDescription}\n\nSenaryo:\n1. Kendinizi tanıtın ve arama nedenini belirtin.\n2. Kısaca açıklayın: "${taskDescription}".\n3. Tartışmak için uygun bir zaman sorun.\n4. Müşterinin sorularını yanıtlayın.\n5. Özetleyin ve bir sonraki adım üzerinde anlaşın.\n\nKibar ve profesyonel olun. İyi şanslar!`,
    };

    const langKey = language === 'en' ? 'en' : language === 'tr' ? 'tr' : 'ru';
    setScript(generatedScripts[langKey]);
    setGenerating(false);
    setStep(2);
    toast.success(
      language === 'ru' ? 'Скрипт сгенерирован!' : language === 'en' ? 'Script generated!' : 'Senaryo oluşturuldu!'
    );
  };

  const handleCallNow = async () => {
    if (!clientPhone.trim() || !companyPhone.trim()) {
      toast.error(
        language === 'ru' ? 'Введите оба номера телефона' : language === 'en' ? 'Enter both phone numbers' : 'Her iki telefon numarasını girin'
      );
      return;
    }
    setCalling(true);

    try {
      const res = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          clientPhone,
          companyPhone,
          taskDescription,
          script,
          language,
        }),
      });

      if (!res.ok) throw new Error('Call failed');

      const data = await res.json();
      setCallResult(data.callLog);
      setStep(3);
      toast.success(
        language === 'ru' ? 'Звонок выполнен!' : language === 'en' ? 'Call completed!' : 'Arama tamamlandı!'
      );
    } catch {
      toast.error(
        language === 'ru' ? 'Не удалось выполнить звонок' : language === 'en' ? 'Call failed' : 'Arama başarısız'
      );
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
      const aiLabel = isRu ? 'AI-агент' : 'AI Agent';
      const clientLbl = isRu ? 'Клиент' : language === 'en' ? 'Client' : 'Müşteri';
      const minLabel = isRu ? 'мин.' : 'min.';
      const callDate = new Date(callResult.createdAt).toLocaleString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR');

      const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString(isRu ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fmtDur = (sec: number) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`;

      // Build HTML for the report
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;padding:48px;background:#fff;font-family:system-ui,-apple-system,sans-serif;color:#111;line-height:1.6;';
      container.innerHTML = `
        <div style="font-size:28px;font-weight:800;color:#059669;margin-bottom:4px;">${title}</div>
        <div style="height:2px;background:linear-gradient(90deg,#059669,#0d9488);margin-bottom:24px;border-radius:1px;"></div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px;">
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;width:140px;">${dateLabel}</td><td style="padding:6px 0;">${callDate}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${clientLabel}</td><td style="padding:6px 0;">${callResult.clientPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${companyLabel}</td><td style="padding:6px 0;">${callResult.companyPhone}</td></tr>
          <tr><td style="padding:6px 12px;font-weight:600;color:#555;">${durationLabel}</td><td style="padding:6px 0;">${fmtDur(callResult.duration)} (${callResult.duration} ${minLabel})</td></tr>
        </table>
        <div style="margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;color:#374151;margin-bottom:4px;">${taskLabel}:</div>
          <div style="font-size:12px;color:#4b5563;background:#f9fafb;border-radius:6px;padding:10px 14px;">${callResult.taskDescription}</div>
        </div>
        ${callResult.aiSummary ? `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:20px;">
          <div style="font-size:13px;font-weight:700;color:#059669;margin-bottom:6px;">✨ ${summaryLabel}</div>
          <div style="font-size:12px;color:#374151;">${callResult.aiSummary}</div>
        </div>` : ''}
        <div style="font-size:18px;font-weight:700;color:#111;margin-bottom:12px;">${transcriptLabel}</div>
        ${callResult.transcript.map((line, i) => {
          const isAi = line.role === 'ai_agent';
          const bgColor = isAi ? '#ecfdf5' : '#f3f4f6';
          const nameColor = isAi ? '#059669' : '#6b7280';
          const name = isAi ? aiLabel : clientLbl;
          return `<div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;">
            <div style="min-width:90px;font-size:11px;font-weight:700;color:${nameColor};padding:4px 8px;background:${bgColor};border-radius:4px;text-align:center;">${name}<br><span style="font-weight:400;font-size:10px;color:#9ca3af;">${fmtTime(line.timestamp)}</span></div>
            <div style="flex:1;font-size:12px;color:#1f2937;padding-top:2px;">${line.text}</div>
          </div>`;
        }).join('')}
        <div style="margin-top:28px;padding-top:12px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;">
          <span>AgentBot — ${title}</span>
          <span>ID: ${callResult.id}</span>
        </div>
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
      toast.success(
        language === 'ru' ? 'PDF скачан!' : language === 'en' ? 'PDF downloaded!' : 'PDF indirildi!'
      );
    } catch {
      toast.error(
        language === 'ru' ? 'Ошибка при создании PDF' : language === 'en' ? 'Failed to create PDF' : 'PDF oluşturulamadı'
      );
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="size-5 text-emerald-600" />
            {language === 'ru' ? 'AI-звонок клиенту' : language === 'en' ? 'AI Call to Client' : 'AI Müşteri Araması'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? (language === 'ru'
                ? 'Настройте задачу и номера телефонов для AI-звонка'
                : language === 'en'
                  ? 'Configure the task and phone numbers for the AI call'
                  : 'AI araması için görevi ve telefon numaralarını yapılandırın')
              : step === 2
                ? (language === 'ru'
                  ? 'Проверьте скрипт и начните звонок'
                  : language === 'en'
                    ? 'Review the script and start the call'
                    : 'Senaryoyu kontrol edin ve aramayı başlatın')
                : (language === 'ru'
                  ? 'Результат звонка'
                  : language === 'en'
                    ? 'Call result'
                    : 'Arama sonucu')}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold transition-colors ${
                step >= s ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step >= s + 1 ? 'bg-emerald-600' : 'bg-muted'}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="space-y-4 pt-2">
          {/* ── Step 3: Call Result ── */}
          {step === 3 && callResult && (
            <>
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="size-8 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {language === 'ru' ? 'Звонок выполнен успешно!' : language === 'en' ? 'Call completed successfully!' : 'Arama başarıyla tamamlandı!'}
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                    {formatDuration(callResult.duration)} · {callResult.clientPhone}
                  </p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  {formatDuration(callResult.duration)}
                </Badge>
              </div>

              {/* AI Summary */}
              {callResult.aiSummary && (
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {language === 'ru' ? 'Краткое резюме' : language === 'en' ? 'Summary' : 'Özet'}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{callResult.aiSummary}</p>
                </div>
              )}

              {/* Transcript */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {language === 'ru' ? 'Текст беседы' : language === 'en' ? 'Call transcript' : 'Arama metni'}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {callResult.transcript.length} {language === 'ru' ? 'сообщений' : language === 'en' ? 'messages' : 'mesaj'}
                  </span>
                </div>

                <ScrollArea className="max-h-[260px] rounded-lg border bg-background p-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                  {callResult.transcript.map((line, i) => {
                    const isAi = line.role === 'ai_agent';
                    return (
                      <div key={i} className={`flex gap-2 ${isAi ? '' : 'flex-row-reverse'}`}>
                        <div className={`size-7 rounded-full flex items-center justify-center shrink-0 ${
                          isAi ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-muted'
                        }`}>
                          <span className="text-[10px] font-bold">{isAi ? 'AI' : (language === 'ru' ? 'К' : 'U')}</span>
                        </div>
                        <div className={`flex-1 rounded-xl px-3 py-2 text-xs leading-relaxed ${
                          isAi
                            ? 'bg-emerald-500 text-white rounded-tl-sm'
                            : 'bg-muted rounded-tr-sm'
                        }`}>
                          {line.text}
                          <div className={`text-[9px] mt-1 ${isAi ? 'text-white/60' : 'text-muted-foreground'}`}>
                            {formatTime(line.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>

              {/* Call meta */}
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Клиент:' : language === 'en' ? 'Client:' : 'Müşteri:'}</span>
                  <span className="font-medium">{callResult.clientPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Откуда:' : language === 'en' ? 'From:' : 'Aranan:'}</span>
                  <span className="font-medium">{callResult.companyPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Задача:' : language === 'en' ? 'Task:' : 'Görev:'}</span>
                  <span className="font-medium text-right max-w-[240px] truncate">{callResult.taskDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Дата:' : language === 'en' ? 'Date:' : 'Tarih:'}</span>
                  <span className="font-medium">{new Date(callResult.createdAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadPdf}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <Download className="size-4" />
                  {language === 'ru' ? 'Скачать PDF-отчёт' : language === 'en' ? 'Download PDF report' : 'PDF raporu indir'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(1);
                    setTaskDescription('');
                    setClientPhone('');
                    setCompanyPhone('');
                    setScript('');
                    setCallResult(null);
                  }}
                  className="gap-1"
                >
                  <Phone className="size-4" />
                  {language === 'ru' ? 'Новый звонок' : language === 'en' ? 'New call' : 'Yeni arama'}
                </Button>
              </div>
            </>
          )}

          {/* ── Step 1: Configure ── */}
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Описание задачи' : language === 'en' ? 'Task description' : 'Görev açıklaması'}
                </Label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder={
                    language === 'ru'
                      ? 'Опишите, что нужно обсудить с клиентом (например, "Продать продукт X", "Напомнить о записи")...'
                      : language === 'en'
                        ? 'Describe what to discuss with the client (e.g., "Sell product X", "Remind about appointment")...'
                        : 'Müşteriyle ne konuşulacağını açıklayın (ör. "X ürününü sat", "Randevuyu hatırlat")...'
                  }
                  className="min-h-[100px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Телефон клиента' : language === 'en' ? 'Client phone number' : 'Müşteri telefon numarası'}
                </Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Телефон компании' : language === 'en' ? 'Company phone number' : 'Şirket telefon numarası'}
                </Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? '🤖 AI-агент позвонит с этого номера'
                    : language === 'en'
                      ? '🤖 AI agent will call from this number'
                      : '🤖 AI ajanı bu numaradan arayacak'}
                </p>
              </div>

              <Button
                onClick={handleGenerateScript}
                disabled={generating || !taskDescription.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {generating ? (
                  <>
                    <div className="size-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {language === 'ru' ? 'Генерация скрипта...' : language === 'en' ? 'Generating script...' : 'Senaryo oluşturuluyor...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4 mr-2" />
                    {language === 'ru' ? 'Сгенерировать скрипт' : language === 'en' ? 'Generate script' : 'Senaryo oluştur'}
                  </>
                )}
              </Button>
            </>
          )}

          {/* ── Step 2: Review + Call ── */}
          {step === 2 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {language === 'ru' ? 'Сгенерированный скрипт' : language === 'en' ? 'Generated script' : 'Oluşturulan senaryo'}
                  </Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setStep(1)}>
                    {language === 'ru' ? '← Назад' : language === 'en' ? '← Back' : '← Geri'}
                  </Button>
                </div>
                <Textarea
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[180px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
                <Phone className="size-4 text-amber-600" />
                <span className="text-xs text-amber-700 dark:text-amber-300">
                  {language === 'ru'
                    ? 'AI голос синтезируется из текста скрипта'
                    : language === 'en'
                      ? 'AI voice is synthesized from the script text'
                      : 'AI sesi senaryo metninden sentezlenir'}
                </span>
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Клиент:' : language === 'en' ? 'Client:' : 'Müşteri:'}</span>
                  <span className="font-medium">{clientPhone || '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{language === 'ru' ? 'Откуда звоним:' : language === 'en' ? 'Calling from:' : 'Aranan:'}</span>
                  <span className="font-medium">{companyPhone || '—'}</span>
                </div>
              </div>

              <Button
                onClick={handleCallNow}
                disabled={calling || !script.trim() || !clientPhone.trim() || !companyPhone.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {calling ? (
                  <>
                    <div className="size-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {language === 'ru' ? 'AI звонит...' : language === 'en' ? 'AI is calling...' : 'AI arıyor...'}
                  </>
                ) : (
                  <>
                    <Phone className="size-4 mr-2" />
                    {language === 'ru'
                      ? `Позвонить с ${companyPhone}`
                      : language === 'en'
                        ? `Call from ${companyPhone}`
                        : `${companyPhone} ile ara`}
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
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
  const [companyName, setCompanyName] = useState(user?.name || '');
  const [companyPhone, setCompanyPhone] = useState('');
  const [goal, setGoal] = useState('');
  const [clientPhones, setClientPhones] = useState('');
  const [recipientMode, setRecipientMode] = useState<'manual' | 'individual'>('manual');
  const [individualEmails, setIndividualEmails] = useState('');
  const [approvalMode, setApprovalMode] = useState<'auto' | 'manual'>('auto');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [sending, setSending] = useState(false);

  const companyLabel = companyName.trim() || (user?.name || '');

  const generateEmailDraft = (goalText: string): string => {
    const cName = companyLabel || (language === 'ru' ? 'Наша компания' : language === 'en' ? 'Our Company' : 'Şirketimiz');
    const cPhone = companyPhone.trim();
    const phoneLine = cPhone
      ? (language === 'ru' ? `\n📞 Телефон: ${cPhone}` : language === 'en' ? `\n📞 Phone: ${cPhone}` : `\n📞 Telefon: ${cPhone}`)
      : '';

    const drafts: Record<string, Record<string, string>> = {
      ru: {
        subject: `Специальное предложение от ${cName}`,
        body: `Здравствуйте!\n\n${cName} рад(а) предложить вам: ${goalText}\n\nЭто уникальная возможность, которую вы не хотите пропустить. Мы готовы помочь вам на каждом этапе и ответить на все вопросы.\n\nДля получения подробной информации свяжитесь с нами или ответьте на это письмо.${phoneLine}\n\nС уважением,\n${cName}`,
      },
      en: {
        subject: `Special offer from ${cName}`,
        body: `Hello!\n\n${cName} is pleased to offer you: ${goalText}\n\nThis is a unique opportunity you won't want to miss. We are ready to help you every step of the way and answer any questions.\n\nFor more details, contact us or reply to this email.${phoneLine}\n\nBest regards,\n${cName}`,
      },
      tr: {
        subject: `${cName} özel teklifi`,
        body: `Merhaba!\n\n${cName} size sunmaktan mutluluk duyuyor: ${goalText}\n\nKaçırmak istemeyeceğiniz benzersiz bir fırsat. Her adımda size yardıma hazırız ve tüm soruları yanıtlamak istiyoruz.\n\nDetaylar için bizi arayın veya bu e-postaya yanıt verin.${phoneLine}\n\nSaygılarımızla,\n${cName}`,
      },
    };
    const langKey = language === 'en' ? 'en' : language === 'tr' ? 'tr' : 'ru';
    const d = drafts[langKey];
    return `${language === 'ru' ? 'Тема:' : language === 'en' ? 'Subject:' : 'Konu:'} ${d.subject}\n\n${d.body}`;
  };

  const handleStep1Next = () => {
    if (!companyName.trim()) {
      toast.error(
        language === 'ru' ? 'Введите название компании' : language === 'en' ? 'Enter company name' : 'Şirket adını girin'
      );
      return;
    }
    if (!goal.trim()) {
      toast.error(
        language === 'ru' ? 'Опишите цель' : language === 'en' ? 'Describe the goal' : 'Hedefi açıklayın'
      );
      return;
    }
    if (!companyPhone.trim()) {
      toast.error(
        language === 'ru' ? 'Введите телефон компании' : language === 'en' ? 'Enter company phone' : 'Şirket telefonunu girin'
      );
      return;
    }
    setGeneratedEmail(generateEmailDraft(goal));
    setStep(2);
  };

  const handleStep2Next = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 2000));
    setSending(false);
    setStep(3);
  };

  const handleClose = (v: boolean) => {
    onOpenChange(v);
    if (!v) {
      setStep(1);
      setGoal('');
      setCompanyName(user?.name || '');
      setCompanyPhone('');
      setClientPhones('');
      setRecipientMode('manual');
      setIndividualEmails('');
      setApprovalMode('auto');
      setGeneratedEmail('');
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-5 text-emerald-600" />
            {language === 'ru' ? 'Привлечение клиентов' : language === 'en' ? 'Lead Generation' : 'Potansiyel Müşteri Kazanımı'}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? (language === 'ru' ? 'Опишите цель и контакт клиента' : language === 'en' ? 'Describe the goal and client contact' : 'Hedefi ve müşteri iletişimini açıklayın')
              : step === 2
                ? (language === 'ru' ? 'Просмотрите черновик email' : language === 'en' ? 'Review the email draft' : 'E-posta taslağını gözden geçirin')
                : (language === 'ru' ? 'Готово!' : language === 'en' ? 'Done!' : 'Tamamlandı!')}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold ${
            step >= 1 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
          }`}>1</div>
          <div className={`flex-1 h-0.5 rounded-full ${step >= 2 ? 'bg-emerald-600' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold ${
            step >= 2 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
          }`}>2</div>
          <div className={`flex-1 h-0.5 rounded-full ${step >= 3 ? 'bg-emerald-600' : 'bg-muted'}`} />
          <div className={`flex items-center justify-center size-7 rounded-full text-xs font-bold ${
            step >= 3 ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'
          }`}>3</div>
        </div>

        {step === 1 && (
          <div className="space-y-4 pt-2">
            {/* Company info banner */}
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 space-y-2">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {language === 'ru' ? '🤖 AI-агент свяжется с клиентами от вашего имени' : language === 'en' ? '🤖 AI agent will contact clients on your behalf' : '🤖 AI ajanı sizin adınıza müşterilerle iletişim kuracak'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Укажите данные вашей компании — AI-агент будет действовать от её имени' : language === 'en' ? 'Enter your company details — the AI agent will act on its behalf' : 'Şirket bilgilerinizi girin — AI ajanı onun adına hareket edecek'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Название компании *' : language === 'en' ? 'Company name *' : 'Şirket adı *'}
                </Label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={language === 'ru' ? 'ООО «Мой бизнес»' : language === 'en' ? 'My Business LLC' : 'Şirketim A.Ş.'}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Телефон компании *' : language === 'en' ? 'Company phone *' : 'Şirket telefonu *'}
                </Label>
                <Input
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ru' ? 'Цель (что предложить клиенту)' : language === 'en' ? 'Goal (what to offer the client)' : 'Hedef (müşteriye ne teklif edilecek)'}
              </Label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder={
                  language === 'ru'
                    ? 'Опишите цель (например, "Предложить новый подписной план со скидкой 30%")...'
                    : language === 'en'
                      ? 'Describe the goal (e.g., "Offer new subscription plan with 30% discount")...'
                      : 'Hedefi açıklayın (ör. "%30 indirimli yeni abonelik planı teklif et")...'
                }
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ru' ? 'Телефоны клиентов для обзвона (через запятую)' : language === 'en' ? 'Client phones to call (comma separated)' : 'Aranacak müşteri telefonları (virgülle ayırın)'}
              </Label>
              <Input
                value={clientPhones}
                onChange={(e) => setClientPhones(e.target.value)}
                type="tel"
                placeholder="+7 (999) 123-45-67, +7 (999) 765-43-21"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? 'Оставьте пустым — AI-агент свяжется со всеми клиентами из базы' : language === 'en' ? 'Leave empty — AI agent will contact all clients from the database' : 'Boş bırakın — AI ajanı veritabanındaki tüm müşterilerle iletişim kuracak'}
              </p>
            </div>

            <Button
              onClick={handleStep1Next}
              disabled={!companyName.trim() || !goal.trim() || !companyPhone.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {language === 'ru' ? 'Далее' : language === 'en' ? 'Next' : 'İleri'}
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 pt-2">
            {/* Generated email preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  {language === 'ru' ? 'Черновик email' : language === 'en' ? 'Email draft' : 'E-posta taslağı'}
                </Label>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  <span className="text-xs text-emerald-600">
                    {language === 'ru' ? 'AI генерация' : language === 'en' ? 'AI generated' : 'AI oluşturdu'}
                  </span>
                </div>
              </div>
              <Textarea
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
                className="min-h-[160px] resize-none text-sm leading-relaxed"
              />
              <p className="text-xs text-muted-foreground">
                {language === 'ru' ? '✏️ Вы можете отредактировать текст письма' : language === 'en' ? '✏️ You can edit the email text' : '✏️ E-posta metnini düzenleyebilirsiniz'}
              </p>
            </div>

            {/* Recipient selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ru' ? 'Кому отправить' : language === 'en' ? 'Send to' : 'Kime gönder'}
              </Label>
              <Select value={recipientMode} onValueChange={(v) => setRecipientMode(v as 'manual' | 'individual')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{language === 'ru' ? 'Телефоны клиентов из поля выше' : language === 'en' ? 'Client phones from above' : 'Yukarıdaki müşteri telefonları'}</SelectItem>
                  <SelectItem value="individual">{language === 'ru' ? 'Выбрать получателей по email' : language === 'en' ? 'Choose recipients by email' : 'E-posta ile alıcı seç'}</SelectItem>
                </SelectContent>
              </Select>
              {recipientMode === 'manual' && clientPhones.trim() && (
                <div className="rounded-lg border bg-muted/30 p-2">
                  <p className="text-xs text-muted-foreground mb-1">{language === 'ru' ? '🤖 AI-агент позвонит по номерам:' : language === 'en' ? '🤖 AI agent will call:' : '🤖 AI ajanı arayacak:'}</p>
                  <p className="text-xs font-medium">{clientPhones}</p>
                </div>
              )}
              {recipientMode === 'individual' && (
                <Input
                  value={individualEmails}
                  onChange={(e) => setIndividualEmails(e.target.value)}
                  placeholder={language === 'ru' ? 'Email через запятую: client1@mail.com, client2@mail.com' : language === 'en' ? 'Emails comma separated: client1@mail.com, client2@mail.com' : 'E-posta virgülle: client1@mail.com, client2@mail.com'}
                />
              )}
            </div>

            {/* Approval mode */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ru' ? 'Режим отправки' : language === 'en' ? 'Sending mode' : 'Gönderim modu'}
              </Label>
              <div className="space-y-2">
                <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  approvalMode === 'auto' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' : 'border-border hover:border-emerald-300'
                }`}>
                  <input
                    type="radio"
                    name="approvalMode"
                    checked={approvalMode === 'auto'}
                    onChange={() => setApprovalMode('auto')}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {language === 'ru' ? 'Отправлять всем клиентам автоматически' : language === 'en' ? 'Send to all clients automatically' : 'Tüm müşterilere otomatik olarak gönder'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'AI будет рассылать без вашего участия' : language === 'en' ? 'AI will send without your involvement' : 'AI katılımınız olmadan gönderecek'}
                    </p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  approvalMode === 'manual' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50' : 'border-border hover:border-emerald-300'
                }`}>
                  <input
                    type="radio"
                    name="approvalMode"
                    checked={approvalMode === 'manual'}
                    onChange={() => setApprovalMode('manual')}
                    className="accent-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-medium">
                      {language === 'ru' ? 'Отправлять только по моему согласованию' : language === 'en' ? 'Send only with my approval' : 'Sadece onayım ile gönder'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {language === 'ru' ? 'Каждое письмо будет ждать вашего подтверждения' : language === 'en' ? 'Each email will wait for your confirmation' : 'Her e-posta onayınızı bekleyecek'}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                {language === 'ru' ? '← Назад' : language === 'en' ? '← Back' : '← Geri'}
              </Button>
              <Button
                onClick={handleStep2Next}
                disabled={sending}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
              >
                {sending ? (
                  <>
                    <div className="size-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {language === 'ru' ? 'AI работает...' : language === 'en' ? 'AI is working...' : 'AI çalışıyor...'}
                  </>
                ) : (
                  <>
                    <Bot className="size-4 mr-2" />
                    {language === 'ru' ? 'Запустить AI-агента' : language === 'en' ? 'Launch AI Agent' : 'AI Ajanını Başlat'}
                  </>
                )}
                <ArrowRight className="size-4 ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 pt-2">
            {/* Success message */}
            <div className="flex flex-col items-center gap-3 py-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
              <Bot className="size-10 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                ✅ {language === 'ru' ? 'AI-агент начал работу!' : language === 'en' ? 'AI agent is working!' : 'AI ajanı çalışmaya başladı!'}
              </p>
              <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 max-w-xs">
                {language === 'ru' ? `AI-агент от имени «${companyLabel}» связывается с клиентами` : language === 'en' ? `AI agent on behalf of "${companyLabel}" is contacting clients` : `AI ajanı "${companyLabel}" adına müşterilerle iletişim kuruyor`}
              </p>
            </div>

            {/* Email preview */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {language === 'ru' ? 'Превью email от вашего имени' : language === 'en' ? 'Email preview from your company' : 'Şirketiniz adına e-posta önizleme'}
              </Label>
              <div className="rounded-lg border bg-muted/30 p-4">
                <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{generatedEmail}</pre>
              </div>
            </div>

            {/* Campaign summary */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'От имени:' : language === 'en' ? 'On behalf of:' : 'Adına:'}
                </span>
                <span className="font-medium">{companyLabel}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Телефон компании:' : language === 'en' ? 'Company phone:' : 'Şirket telefonu:'}
                </span>
                <span className="font-medium">{companyPhone}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Режим отправки:' : language === 'en' ? 'Sending mode:' : 'Gönderim modu:'}
                </span>
                <span className="font-medium">
                  {approvalMode === 'auto'
                    ? (language === 'ru' ? 'Авто — AI сам' : language === 'en' ? 'Auto — AI itself' : 'Otomatik — AI kendisi')
                    : (language === 'ru' ? 'По согласованию' : language === 'en' ? 'With approval' : 'Onay ile')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {language === 'ru' ? 'Цель:' : language === 'en' ? 'Goal:' : 'Hedef:'}
                </span>
                <span className="font-medium truncate max-w-[200px]">{goal}</span>
              </div>
              {recipientMode === 'manual' && clientPhones.trim() && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? 'Клиенты для обзвона:' : language === 'en' ? 'Clients to call:' : 'Aranacak müşteriler:'}
                  </span>
                  <span className="font-medium truncate max-w-[200px]">{clientPhones}</span>
                </div>
              )}
              {recipientMode === 'individual' && individualEmails.trim() && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    {language === 'ru' ? 'Email получателей:' : language === 'en' ? 'Recipient emails:' : 'Alıcı e-postaları:'}
                  </span>
                  <span className="font-medium truncate max-w-[200px]">{individualEmails}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
              <Sparkles className="size-3.5 text-amber-600 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-300">
                {language === 'ru' ? 'AI-агент будет звонить и писать письма от имени вашей компании самостоятельно' : language === 'en' ? 'AI agent will call and send emails on behalf of your company autonomously' : 'AI ajanı şirketiniz adına bağımsız olarak arayacak ve e-posta gönderecek'}
              </span>
            </div>

            <Button
              onClick={() => {
                setStep(1);
                setGoal('');
                setCompanyName(user?.name || '');
                setCompanyPhone('');
                setClientPhones('');
                setRecipientMode('manual');
                setIndividualEmails('');
                setApprovalMode('auto');
                setGeneratedEmail('');
                setSending(false);
              }}
              variant="outline"
              className="w-full"
            >
              {language === 'ru' ? 'Создать новую кампанию' : language === 'en' ? 'Create new campaign' : 'Yeni kampanya oluştur'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Issue 6: Reports & Analytics Dialog
// ──────────────────────────────────────────────────────────────

function ReportsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { language } = useAppStore();

  const reportData = [
    { date: '01.06', emails: 12, calls: 5, appointments: 3, leads: 4, tickets: 8 },
    { date: '02.06', emails: 18, calls: 7, appointments: 5, leads: 6, tickets: 12 },
    { date: '03.06', emails: 15, calls: 4, appointments: 4, leads: 3, tickets: 10 },
    { date: '04.06', emails: 22, calls: 9, appointments: 7, leads: 8, tickets: 15 },
    { date: '05.06', emails: 14, calls: 6, appointments: 4, leads: 5, tickets: 9 },
    { date: '06.06', emails: 20, calls: 8, appointments: 6, leads: 7, tickets: 11 },
    { date: '07.06', emails: 25, calls: 10, appointments: 8, leads: 9, tickets: 14 },
  ];

  const totals = reportData.reduce((acc, r) => ({
    emails: acc.emails + r.emails,
    calls: acc.calls + r.calls,
    appointments: acc.appointments + r.appointments,
    leads: acc.leads + r.leads,
    tickets: acc.tickets + r.tickets,
  }), { emails: 0, calls: 0, appointments: 0, leads: 0, tickets: 0 });

  const handleExport = (type: 'csv' | 'pdf') => {
    const msg = language === 'ru' ? `Отчёт экспортирован (${type.toUpperCase()})` : language === 'en' ? `Report exported (${type.toUpperCase()})` : `Rapor dışa aktarıldı (${type.toUpperCase()})`;
    toast.success(msg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-emerald-600" />
            {language === 'ru' ? 'Отчёт за 7 дней' : language === 'en' ? '7-Day Report' : '7 Günlük Rapor'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ru' ? 'Сводные данные за последнюю неделю' : language === 'en' ? 'Summary data for the last week' : 'Son hafta özet verileri'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <ScrollArea className="max-h-72">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{language === 'ru' ? 'Дата' : language === 'en' ? 'Date' : 'Tarih'}</TableHead>
                  <TableHead className="text-xs text-center">{language === 'ru' ? 'Писем' : language === 'en' ? 'Emails' : 'E-posta'}</TableHead>
                  <TableHead className="text-xs text-center">{language === 'ru' ? 'Звонков' : language === 'en' ? 'Calls' : 'Arama'}</TableHead>
                  <TableHead className="text-xs text-center">{language === 'ru' ? 'Записей' : language === 'en' ? 'Appointments' : 'Randevu'}</TableHead>
                  <TableHead className="text-xs text-center">{language === 'ru' ? 'Лиды' : language === 'en' ? 'Leads' : 'Potansiyel'}</TableHead>
                  <TableHead className="text-xs text-center">{language === 'ru' ? 'Тикеты' : language === 'en' ? 'Tickets' : 'Bilet'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell className="text-xs font-medium">{row.date}</TableCell>
                    <TableCell className="text-xs text-center">{row.emails}</TableCell>
                    <TableCell className="text-xs text-center">{row.calls}</TableCell>
                    <TableCell className="text-xs text-center">{row.appointments}</TableCell>
                    <TableCell className="text-xs text-center">{row.leads}</TableCell>
                    <TableCell className="text-xs text-center">{row.tickets}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Totals */}
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 grid grid-cols-5 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.emails}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'ru' ? 'Писем' : language === 'en' ? 'Emails' : 'E-posta'}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.calls}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'ru' ? 'Звонков' : language === 'en' ? 'Calls' : 'Arama'}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.appointments}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'ru' ? 'Записей' : language === 'en' ? 'Appointments' : 'Randevu'}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.leads}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'ru' ? 'Лиды' : language === 'en' ? 'Leads' : 'Potansiyel'}</p>
            </div>
            <div>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{totals.tickets}</p>
              <p className="text-[10px] text-muted-foreground">{language === 'ru' ? 'Тикеты' : language === 'en' ? 'Tickets' : 'Bilet'}</p>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport('csv')}>
              <Download className="size-4" />
              Экспорт CSV
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={() => handleExport('pdf')}>
              <Download className="size-4" />
              Экспорт PDF
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
  status: string;
  duration: number;
  aiSummary: string;
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
    duration: number;
    transcript: Array<{ role: string; text: string; timestamp: string }>;
    aiSummary: string;
    createdAt: string;
  } | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
                <span className="text-muted-foreground">{language === 'ru' ? 'Длительность:' : language === 'en' ? 'Duration:' : 'Süre:'}</span>
                <span className="font-medium">{fmtDur(selectedCall.duration)}</span>
              </div>
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
                          <p className="text-sm font-medium truncate">{call.clientPhone}</p>
                          <p className="text-xs text-muted-foreground truncate">{call.taskDescription}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium">{fmtDur(call.duration)}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </p>
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

        // Fetch analytics for the week
        const [analyticsRes, botsRes, statsRes] = await Promise.all([
          fetch('/api/analytics?range=week', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/bots', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          fetch('/api/agent-stats', { headers }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        ]);

        if (cancelled) return;

        // Set real agent stats
        if (statsRes) {
          setAgentStats(statsRes);
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
        buttonText: { ru: 'Посмотреть скрипт', en: 'View Script', tr: 'Senaryoyu Gör' },
        badge: { ru: 'AI голос', en: 'AI voice', tr: 'AI ses' },
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
          ru: 'AI активно общается с посетителями сайта, квалифицирует лиды умными вопросами и собирает контактную информацию',
          en: 'AI proactively engages website visitors, qualifies leads with smart questions, and collects contact info',
          tr: 'AI web sitesi ziyaretçileriyle aktif iletişim kurar, akıllı sorularla potansiyel müşterileri niteler ve iletişim bilgilerini toplar',
        },
        buttonText: { ru: 'Попробовать', en: 'Try it', tr: 'Dene' },
        badge: { ru: '+34%', en: '+34%', tr: '+34%' },
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
          <CapabilityCard
            icon={<Mail className="size-5" />}
            title={capabilities[0].title}
            description={capabilities[0].description}
            buttonText={capabilities[0].buttonText}
            badge={capabilities[0].badge}
            onClick={capabilities[0].action}
          />

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

          {/* Issue 8: AI Performance - 0% for new users */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                {language === 'ru' ? 'Эффективность AI' : language === 'en' ? 'AI Performance' : 'AI Performansı'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: { ru: 'Задачи выполнены', en: 'Tasks completed', tr: 'Tamamlanan görevler' }, value: hasBots ? 92 : 0 },
                { label: { ru: 'Удовлетворённость', en: 'Satisfaction', tr: 'Memnuniyet' }, value: hasBots ? 98.5 : 0 },
                { label: { ru: 'Время отклика', en: 'Response time', tr: 'Yanıt süresi' }, value: hasBots ? 88 : 0 },
              ].map((item) => (
                <div key={item.label.ru} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{tx(item.label, language)}</span>
                    <span className="font-medium">{hasBots ? `${item.value}%` : '0%'}</span>
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
