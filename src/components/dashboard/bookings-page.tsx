'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  User,
  Users,
  Phone,
  Mail,
  CalendarCheck,
  CalendarX,
  Loader2,
  RefreshCcw,
  Link2,
  Database,
} from 'lucide-react';

import { useAuthStore, useAppStore } from '@/stores';
import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

interface BotOption {
  id: string;
  name: string;
  niche: string | null;
  config: string; // JSON
}

interface TimeSlot {
  time: string;
  available: boolean;
  bookedBy: string | null;
  currentBookings?: number;
  maxConcurrent?: number;
}

interface SlotData {
  date: string;
  slots: TimeSlot[];
}

interface AppointmentItem {
  id: string;
  botId: string;
  visitorName: string;
  visitorPhone: string;
  visitorEmail?: string;
  service?: string;
  date: string;
  duration: number;
  status: string;
}

interface CalendarConfig {
  days: number[];
  startTime: string;
  endTime: string;
  slotDuration: number;
  bufferMinutes: number;
}

interface CalendarSyncConfig {
  type: 'platform' | 'external';
  externalUrl?: string;
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function parseCalendarConfig(configJson: string): CalendarConfig | null {
  try {
    const raw = JSON.parse(configJson);
    const cal = raw.calendarConfig;
    if (cal && cal.startTime && cal.endTime && cal.slotDuration) {
      return cal as CalendarConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function parseCalendarSync(configJson: string): CalendarSyncConfig | null {
  try {
    const raw = JSON.parse(configJson);
    const sync = raw.calendarSync;
    if (sync && (sync.type === 'platform' || sync.type === 'external')) {
      return sync as CalendarSyncConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function parseMaxConcurrent(configJson: string): number {
  try {
    const raw = JSON.parse(configJson);
    const cal = raw.calendarConfig;
    if (cal && typeof cal.maxConcurrentBookings === 'number' && cal.maxConcurrentBookings >= 1) {
      return cal.maxConcurrentBookings;
    }
    return 1;
  } catch {
    return 1;
  }
}

function parseServices(configJson: string): { name: string; price: number; duration: number }[] {
  try {
    const raw = JSON.parse(configJson);
    return Array.isArray(raw.services) ? raw.services : [];
  } catch {
    return [];
  }
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function getDayOfWeek(d: Date): number {
  const dow = d.getDay(); // 0=Sun, 1=Mon...
  return dow === 0 ? 7 : dow; // Convert to 1=Mon ... 7=Sun
}

// ──────────────────────────────────────────────────────────────
// Custom Mini Calendar Component
// ──────────────────────────────────────────────────────────────

function MiniCalendar({
  currentMonth,
  selectedDate,
  workingDays,
  today,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: {
  currentMonth: Date;
  selectedDate: string | null;
  workingDays: number[];
  today: string;
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}) {
  const language = useAppStore((s) => s.language);

  const dayNames: string[] = (() => {
    const names: Record<string, string[]> = {
      ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
    };
    return names[language] ?? names.ru;
  })();

  const monthNames: Record<string, string[]> = {
    ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    tr: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'],
  };

  const monthLabel = `${monthNames[language]?.[currentMonth.getMonth()] ?? currentMonth.getMonth()} ${currentMonth.getFullYear()}`;

  // Build calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // startOffset: Monday=0, Tuesday=1 ... Sunday=6
  const startOffset = (getDayOfWeek(firstDay) - 1) % 7;

  const cells: { date: string; day: number; isCurrentMonth: boolean }[] = [];
  // Previous month padding
  for (let i = startOffset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: formatDateStr(d), day: d.getDate(), isCurrentMonth: false });
  }
  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    cells.push({ date: formatDateStr(date), day: d, isCurrentMonth: true });
  }
  // Next month padding
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    cells.push({ date: formatDateStr(date), day: d, isCurrentMonth: false });
  }

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div className="space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrevMonth} className="size-8">
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <Button variant="ghost" size="icon" onClick={onNextMonth} className="size-8">
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Day names header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayNames.map((name) => (
          <div key={name} className="text-[11px] font-medium text-muted-foreground py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dow = getDayOfWeek(new Date(cell.date + 'T12:00:00'));
          const isWorkingDay = workingDays.includes(dow);
          const isToday = cell.date === today;
          const isSelected = cell.date === selectedDate;
          const isPast = cell.date < today;

          return (
            <button
              key={cell.date}
              disabled={!cell.isCurrentMonth || !isWorkingDay || isPast}
              onClick={() => onSelectDate(cell.date)}
              className={`
                relative flex items-center justify-center rounded-md text-sm transition-all
                ${!cell.isCurrentMonth || !isWorkingDay || isPast
                  ? 'text-muted-foreground/30 cursor-default'
                  : 'hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 cursor-pointer'
                }
                ${isSelected
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 hover:text-white dark:bg-emerald-500'
                  : ''
                }
                ${isToday && !isSelected
                  ? 'ring-1 ring-emerald-400 dark:ring-emerald-600 font-semibold'
                  : ''
                }
              `}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Slot Grid Component
// ──────────────────────────────────────────────────────────────

function SlotsGrid({
  slots,
  onSelectSlot,
  language,
}: {
  slots: TimeSlot[];
  onSelectSlot: (time: string) => void;
  language: string;
}) {
  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
        <CalendarX className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t('bookings.noSlots', language)}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
      {slots.map((slot) => (
        <button
          key={slot.time}
          disabled={!slot.available}
          onClick={() => slot.available && onSelectSlot(slot.time)}
          className={`
            flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-center transition-all
            ${slot.available
              ? 'border-emerald-200 bg-white hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-sm cursor-pointer dark:border-emerald-800 dark:bg-slate-900 dark:hover:border-emerald-600 dark:hover:bg-emerald-950'
              : 'border-muted bg-muted/40 cursor-default dark:bg-slate-900/40'
            }
          `}
        >
          <span className={`text-sm font-semibold tabular-nums ${slot.available ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground/50 line-through'}`}>
            {slot.time}
          </span>
          {slot.available ? (
            slot.maxConcurrent && slot.maxConcurrent > 1 ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {(slot.currentBookings ?? 0)}/{slot.maxConcurrent}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">
                {t('bookings.available', language)}
              </span>
            )
          ) : slot.maxConcurrent && slot.maxConcurrent > 1 ? (
            <span className="text-[10px] text-muted-foreground">
              {slot.currentBookings ?? 0}/{slot.maxConcurrent}
            </span>
          ) : slot.bookedBy ? (
            <span className="text-[10px] text-muted-foreground truncate max-w-full">
              {slot.bookedBy}
            </span>
          ) : (
            <span className="text-[10px] text-muted-foreground">
              {t('bookings.booked', language)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Appointment Card Component
// ──────────────────────────────────────────────────────────────

function AppointmentCard({
  appointment,
  language,
}: {
  appointment: AppointmentItem;
  language: string;
}) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    confirmed: { label: t('bookings.confirmed', language), variant: 'default', className: 'bg-emerald-600 text-white' },
    pending: { label: t('bookings.pending', language), variant: 'outline', className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    cancelled: { label: t('bookings.cancelled', language), variant: 'secondary', className: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
    completed: { label: t('bookings.completed', language), variant: 'secondary', className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  };

  const status = statusConfig[appointment.status] ?? statusConfig.pending;
  const appDate = new Date(appointment.date);
  const timeStr = appDate.toLocaleTimeString(language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = appDate.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' });

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <CalendarCheck className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate">{appointment.visitorName}</p>
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {dateStr} &middot; {timeStr}
          {appointment.service ? ` &middot; ${appointment.service}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">{appointment.visitorPhone}</p>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Calendar Sync Settings Dialog
// ──────────────────────────────────────────────────────────────

function CalendarSyncDialog({
  open,
  onClose,
  botId,
  botName,
  currentSync,
  language,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  botId: string;
  botName: string;
  currentSync: CalendarSyncConfig | null;
  language: string;
  onSave: (sync: CalendarSyncConfig) => void;
}) {
  const { user } = useAuthStore();
  const [syncType, setSyncType] = useState<'platform' | 'external'>(currentSync?.type ?? 'platform');
  const [externalUrl, setExternalUrl] = useState(currentSync?.externalUrl ?? '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSyncType(currentSync?.type ?? 'platform');
      setExternalUrl(currentSync?.externalUrl ?? '');
    }
  }, [open, currentSync]);

  const handleSave = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const calendarSync: CalendarSyncConfig = {
        type: syncType,
        ...(syncType === 'external' ? { externalUrl: externalUrl.trim() } : {}),
      };
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({ botId, calendarSync }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(
          language === 'ru' ? 'Настройки синхронизации сохранены' :
          language === 'tr' ? 'Senkronizasyon ayarları kaydedildi' :
          'Calendar sync settings saved'
        );
        onSave(data.calendarSync);
        onClose();
      } else {
        toast.error(data.error || (language === 'ru' ? 'Ошибка сохранения' : 'Save failed'));
      }
    } catch {
      toast.error(language === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCcw className="size-5 text-emerald-600" />
            {language === 'ru' ? 'Настройка синхронизации календаря' :
             language === 'tr' ? 'Takvim Senkronizasyonu' :
             'Calendar Sync Settings'}
          </DialogTitle>
          <DialogDescription>
            {botName}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Sync mode selector */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">
              {language === 'ru' ? 'Режим синхронизации' :
               language === 'tr' ? 'Senkronizasyon Modu' :
               'Sync Mode'}
            </Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setSyncType('platform')}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  syncType === 'platform'
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50'
                    : 'border-muted hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  syncType === 'platform'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Database className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {language === 'ru' ? 'Через платформу АгентБот' :
                     language === 'tr' ? 'AgentBot Platformu Üzerinden' :
                     'Via AgentBot Platform'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru'
                      ? 'Все записи через личный кабинет на этой платформе'
                      : language === 'tr'
                        ? 'Tüm randevular bu platformdaki kişisel panel üzerinden'
                        : 'All bookings through the personal cabinet on this platform'}
                  </p>
                </div>
                {syncType === 'platform' && <Check className="size-4 text-emerald-600 ml-auto shrink-0" />}
              </button>

              <button
                type="button"
                onClick={() => setSyncType('external')}
                className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                  syncType === 'external'
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/50'
                    : 'border-muted hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
              >
                <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  syncType === 'external'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Link2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {language === 'ru' ? 'Внешний календарь' :
                     language === 'tr' ? 'Dış Takvim' :
                     'External Calendar'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru'
                      ? 'Синхронизация с вашей базой данных / Google Calendar'
                      : language === 'tr'
                        ? 'Veritabanınız / Google Takvim ile senkronizasyon'
                        : 'Sync with your database / Google Calendar'}
                  </p>
                </div>
                {syncType === 'external' && <Check className="size-4 text-emerald-600 ml-auto shrink-0" />}
              </button>
            </div>
          </div>

          {/* External URL input */}
          {syncType === 'external' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {language === 'ru' ? 'URL внешнего календаря' :
                 language === 'tr' ? 'Dış Takvim URL\'si' :
                 'External Calendar URL'}
              </Label>
              <Input
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder={language === 'ru'
                  ? 'https://calendar.google.com/...'
                  : 'https://calendar.google.com/...'}
                type="url"
              />
              <p className="text-[11px] text-muted-foreground">
                {language === 'ru'
                  ? 'Введите ссылку на ваш внешний календарь (Google Calendar, iCal и т.д.)'
                  : language === 'tr'
                    ? 'Dış takvim bağlantınızı girin (Google Takvim, iCal vb.)'
                    : 'Enter your external calendar link (Google Calendar, iCal, etc.)'}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t('common.cancel', language)}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || (syncType === 'external' && !externalUrl.trim())}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {t('common.save', language)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Booking Dialog Component
// ──────────────────────────────────────────────────────────────

function BookingDialog({
  open,
  onClose,
  botId,
  date,
  time,
  services,
  language,
}: {
  open: boolean;
  onClose: () => void;
  botId: string;
  date: string;
  time: string;
  services: { name: string; price: number; duration: number }[];
  language: string;
}) {
  const { user } = useAuthStore();
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setVisitorName('');
      setVisitorPhone('');
      setVisitorEmail('');
      setSelectedService('');
      setResult(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!visitorName.trim() || !visitorPhone.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id ?? '',
        },
        body: JSON.stringify({
          botId,
          visitorName: visitorName.trim(),
          visitorPhone: visitorPhone.trim(),
          visitorEmail: visitorEmail.trim() || undefined,
          service: selectedService || undefined,
          date,
          time,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: t('bookings.bookingSuccess', language) });
      } else {
        setResult({ success: false, message: data.error || t('bookings.bookingFailed', language) });
      }
    } catch {
      setResult({ success: false, message: t('bookings.bookingFailed', language) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString(
    language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                {result.success ? (
                  <Check className="size-7 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <X className="size-7 text-red-500" />
                )}
              </div>
              <DialogTitle className="text-center">
                {result.success ? t('bookings.bookingSuccess', language) : t('bookings.bookingFailed', language)}
              </DialogTitle>
              <DialogDescription className="text-center">
                {result.message}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center">
              <Button onClick={onClose} variant="outline">
                {t('common.close', language)}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarCheck className="size-5 text-emerald-600" />
                {t('bookings.bookAppointment', language)}
              </DialogTitle>
              <DialogDescription>
                {t('bookings.bookingFor', language)} {dateFormatted}, {time}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <User className="size-3" />
                  {t('bookings.visitorName', language)} *
                </Label>
                <Input
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder={t('bookings.visitorName', language)}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Phone className="size-3" />
                  {t('bookings.visitorPhone', language)} *
                </Label>
                <Input
                  value={visitorPhone}
                  onChange={(e) => setVisitorPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium">
                  <Mail className="size-3" />
                  {t('bookings.visitorEmail', language)}
                </Label>
                <Input
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="email@example.com"
                  type="email"
                />
              </div>

              {services.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">
                    {t('bookings.service', language)}
                  </Label>
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('bookings.selectService', language)} />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((svc) => (
                        <SelectItem key={svc.name} value={svc.name}>
                          {svc.name} — ${svc.price} ({svc.duration} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={onClose}>
                {t('bookings.cancelBtn', language)}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!visitorName.trim() || !visitorPhone.trim() || isSubmitting}
                className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {t('bookings.confirmBooking', language)}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Bookings Page Component
// ──────────────────────────────────────────────────────────────

export function BookingsPage() {
  const { user } = useAuthStore();
  const { language, setPage } = useAppStore();

  // Data state
  const [bots, setBots] = useState<BotOption[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayStr = useMemo(() => formatDateStr(new Date()), []);

  // Slots state
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  // Appointments state
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Booking dialog
  const [bookingDialog, setBookingDialog] = useState<{
    open: boolean;
    time: string;
  }>({ open: false, time: '' });

  // Calendar sync dialog
  const [syncDialog, setSyncDialog] = useState(false);
  const [botSyncConfigs, setBotSyncConfigs] = useState<Record<string, CalendarSyncConfig | null>>({});

  // Get current sync config for selected bot
  const currentSync = useMemo(() => {
    return selectedBotId ? (botSyncConfigs[selectedBotId] ?? null) : null;
  }, [selectedBotId, botSyncConfigs]);

  // ── Fetch bots ──
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    async function fetchBots() {
      try {
        const res = await fetch('/api/bots', {
          headers: { 'x-user-id': user.id },
        });
        if (!res.ok) throw new Error('Failed to fetch bots');
        const data = await res.json();
        const list: BotOption[] = (data.bots ?? []).map((b: Record<string, unknown>) => ({
          id: b.id as string,
          name: b.name as string,
          niche: b.niche as string | null,
          config: b.config as string,
        }));
        setBots(list);
        // Parse sync configs for all bots
        const syncMap: Record<string, CalendarSyncConfig | null> = {};
        for (const bot of list) {
          syncMap[bot.id] = parseCalendarSync(bot.config);
        }
        setBotSyncConfigs(syncMap);
        // Auto-select first bot
        if (list.length > 0 && !selectedBotId) {
          setSelectedBotId(list[0].id);
        }
      } catch {
        setBots([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBots();
  }, [user?.id, selectedBotId]);

  // ── Get working days from selected bot ──
  useEffect(() => {
    const bot = bots.find((b) => b.id === selectedBotId);
    if (bot) {
      const calCfg = parseCalendarConfig(bot.config);
      setWorkingDays(calCfg?.days ?? [1, 2, 3, 4, 5]);
    } else {
      setWorkingDays([1, 2, 3, 4, 5]);
    }
  }, [selectedBotId, bots]);

  // ── Fetch slots when bot + date selected ──
  useEffect(() => {
    if (!selectedBotId || !selectedDate) {
      setSlots([]);
      return;
    }

    async function fetchSlots() {
      setSlotsLoading(true);
      try {
        const params = new URLSearchParams({ botId: selectedBotId, date: selectedDate });
        const res = await fetch(`/api/bookings?${params}`, {
          headers: { 'x-user-id': user?.id ?? '' },
        });
        if (!res.ok) throw new Error('Failed');
        const data: SlotData = await res.json();
        setSlots(data.slots ?? []);
      } catch {
        setSlots([]);
      } finally {
        setSlotsLoading(false);
      }
    }

    fetchSlots();
  }, [selectedBotId, selectedDate, user?.id]);

  // ── Fetch upcoming appointments when bot selected ──
  useEffect(() => {
    if (!selectedBotId) {
      setAppointments([]);
      return;
    }

    async function fetchAppointments() {
      setAppointmentsLoading(true);
      try {
        const params = new URLSearchParams({ botId: selectedBotId });
        const res = await fetch(`/api/bookings?${params}`, {
          headers: { 'x-user-id': user?.id ?? '' },
        });
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setAppointments(data.appointments ?? []);
      } catch {
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    }

    fetchAppointments();
  }, [selectedBotId, user?.id]);

  // ── Handlers ──
  const handleSelectSlot = useCallback((time: string) => {
    setBookingDialog({ open: true, time });
  }, []);

  const handleCloseBooking = useCallback(() => {
    setBookingDialog({ open: false, time: '' });
    // Refresh slots after successful booking
    if (selectedBotId && selectedDate) {
      const params = new URLSearchParams({ botId: selectedBotId, date: selectedDate });
      fetch(`/api/bookings?${params}`, {
        headers: { 'x-user-id': user?.id ?? '' },
      })
        .then((res) => res.json())
        .then((data: SlotData) => setSlots(data.slots ?? []))
        .catch(() => {});
      // Also refresh appointments
      fetch(`/api/bookings?botId=${selectedBotId}`, {
        headers: { 'x-user-id': user?.id ?? '' },
      })
        .then((res) => res.json())
        .then((data) => setAppointments(data.appointments ?? []))
        .catch(() => {});
    }
  }, [selectedBotId, selectedDate, user?.id]);

  // Get services for selected bot
  const currentServices = useMemo(() => {
    const bot = bots.find((b) => b.id === selectedBotId);
    if (!bot) return [];
    return parseServices(bot.config);
  }, [selectedBotId, bots]);

  const selectedBot = bots.find((b) => b.id === selectedBotId);

  // Get max concurrent bookings for selected bot
  const maxConcurrent = useMemo(() => {
    const bot = bots.find((b) => b.id === selectedBotId);
    if (!bot) return 1;
    return parseMaxConcurrent(bot.config);
  }, [selectedBotId, bots]);

  // ── Render ──

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <CalendarDays className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              {t('bookings.title', language)}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                {selectedBot ? selectedBot.name : t('bookings.selectBot', language)}
              </p>
              {maxConcurrent > 1 && (
                <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 text-[10px] px-1.5 py-0">
                  <Users className="size-3 mr-0.5" />
                  {maxConcurrent}x
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Bot Selector */}
        {bots.length > 0 && (
          <Select value={selectedBotId ?? ''} onValueChange={(v) => { setSelectedBotId(v); setSelectedDate(null); }}>
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t('bookings.selectBot', language)} />
            </SelectTrigger>
            <SelectContent>
              {bots.map((bot) => (
                <SelectItem key={bot.id} value={bot.id}>
                  {bot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* ── No bots message ── */}
      {bots.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <CalendarDays className="size-12 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('bookings.noBots', language)}</p>
            <Button
              variant="outline"
              onClick={() => setPage('bot-builder')}
              className="mt-2"
            >
              {t('dashboard.createBot', language)}
            </Button>
          </CardContent>
        </Card>
      )}

      {bots.length > 0 && selectedBot && (
        <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <RefreshCcw className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {language === 'ru' ? 'Синхронизация календаря' :
                     language === 'tr' ? 'Takvim Senkronizasyonu' :
                     'Calendar Synchronization'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {language === 'ru'
                      ? 'Когда клиенты записываются через чат-бот / AI-агент'
                      : language === 'tr'
                        ? 'Müşteriler chatbot / AI ajan aracılığıyla randevu aldığında'
                        : 'When clients book via chatbot / AI agent'}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSyncDialog(true)}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950"
              >
                {t('common.settings', language)}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 rounded-lg bg-white/60 dark:bg-slate-900/40 p-3">
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                currentSync?.type === 'external'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                  : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
              }`}>
                {currentSync?.type === 'external' ? <Link2 className="size-5" /> : <Database className="size-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">
                    {currentSync?.type === 'external'
                      ? (language === 'ru' ? 'Внешний календарь' : language === 'tr' ? 'Dış Takvim' : 'External Calendar')
                      : (language === 'ru' ? 'Через платформу АгентБот' : language === 'tr' ? 'AgentBot Platformu' : 'Via AgentBot Platform')}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      currentSync?.type === 'external'
                        ? 'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300'
                        : 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {currentSync?.type === 'external'
                      ? (language === 'ru' ? 'Внешняя БД' : language === 'tr' ? 'Dış Veritabanı' : 'External DB')
                      : (language === 'ru' ? 'Платформа' : language === 'tr' ? 'Platform' : 'Platform')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentSync?.type === 'external'
                    ? (language === 'ru'
                      ? `Синхронизация с: ${currentSync.externalUrl}`
                      : language === 'tr'
                        ? `Senkron: ${currentSync.externalUrl}`
                        : `Synced with: ${currentSync.externalUrl}`)
                    : (language === 'ru'
                      ? 'Все записи координируются через личный кабинет на платформе АгентБот'
                      : language === 'tr'
                        ? 'Tüm randevular AgentBot platformundaki kişisel panel üzerinden koordine edilir'
                        : 'All bookings are coordinated through the personal cabinet on the AgentBot platform')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {bots.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── Left: Calendar ── */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="size-4 text-muted-foreground" />
                {t('bookings.pickDate', language)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <MiniCalendar
                currentMonth={calendarMonth}
                selectedDate={selectedDate}
                workingDays={workingDays}
                today={todayStr}
                onSelectDate={setSelectedDate}
                onPrevMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                onNextMonth={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              />
            </CardContent>
          </Card>

          {/* ── Right: Slots + Appointments ── */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {/* ── Slots Card ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Clock className="size-4 text-muted-foreground" />
                  {t('bookings.availableSlots', language)}
                  {selectedDate && (
                    <Badge variant="outline" className="ml-2 font-normal">
                      {new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                        language === 'ru' ? 'ru-RU' : language === 'tr' ? 'tr-TR' : 'en-US',
                        { day: 'numeric', month: 'short' }
                      )}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {!selectedDate ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                    <CalendarDays className="size-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {t('bookings.pickDate', language)}
                    </p>
                  </div>
                ) : slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <SlotsGrid
                    slots={slots}
                    onSelectSlot={handleSelectSlot}
                    language={language}
                  />
                )}
              </CardContent>
            </Card>

            {/* ── Upcoming Appointments Card ── */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarCheck className="size-4 text-muted-foreground" />
                  {t('bookings.upcomingAppointments', language)}
                  {!appointmentsLoading && (
                    <Badge variant="secondary" className="ml-1 tabular-nums">
                      {appointments.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {appointmentsLoading ? (
                  <div className="flex flex-col gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 rounded-lg" />
                    ))}
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                    <CalendarCheck className="size-10 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">
                      {t('bookings.noAppointments', language)}
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="max-h-96">
                    <div className="flex flex-col gap-2">
                      {appointments.map((apt) => (
                        <AppointmentCard key={apt.id} appointment={apt} language={language} />
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── Booking Dialog ── */}
      {selectedBotId && selectedDate && bookingDialog.open && (
        <BookingDialog
          open={bookingDialog.open}
          onClose={handleCloseBooking}
          botId={selectedBotId}
          date={selectedDate}
          time={bookingDialog.time}
          services={currentServices}
          language={language}
        />
      )}

      {/* ── Calendar Sync Dialog ── */}
      {selectedBot && (
        <CalendarSyncDialog
          open={syncDialog}
          onClose={() => setSyncDialog(false)}
          botId={selectedBot.id}
          botName={selectedBot.name}
          currentSync={currentSync}
          language={language}
          onSave={(sync) => {
            setBotSyncConfigs((prev) => ({ ...prev, [selectedBotId]: sync }));
          }}
        />
      )}
    </div>
  );
}

export default BookingsPage;
