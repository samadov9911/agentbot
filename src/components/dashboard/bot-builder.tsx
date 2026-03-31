'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Bot,
  Code2,
  GitMerge,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquare,
  CalendarCheck,
  Phone,
  UserPlus,
  Users,
  Scissors,
  HelpCircle,
  Palette,
  LayoutTemplate,
  Calendar,
  Eye,
  Plus,
  Minus,
  Trash2,
  Loader2,
  GripVertical,
  AlertTriangle,
  X,
  Brain,
  Zap,
  Target,
  UserCheck,
  ArrowRightLeft,
  Lock,
  Crown,
  Camera,
} from 'lucide-react';
import { toast } from 'sonner';

import { useBotBuilderStore, useAppStore, useAuthStore } from '@/stores';
import { t } from '@/lib/i18n';
import type { BotTemplate } from '@/types';
import { LiveChatPreview } from '@/components/dashboard/live-chat-preview';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${diffMin} мин. назад`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} ч. назад`;

  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────

const STEPS = [
  { key: 'step1Title', icon: Bot },
  { key: 'step2Title', icon: LayoutTemplate },
  { key: 'step3Title', icon: MessageSquare },
  { key: 'step4Title', icon: Sparkles },
  { key: 'step5Title', icon: Palette },
  { key: 'step6Title', icon: Calendar },
] as const;

const DAYS_OF_WEEK = [
  { value: 1, label: 'Пн', labelEn: 'Mon' },
  { value: 2, label: 'Вт', labelEn: 'Tue' },
  { value: 3, label: 'Ср', labelEn: 'Wed' },
  { value: 4, label: 'Чт', labelEn: 'Thu' },
  { value: 5, label: 'Пт', labelEn: 'Fri' },
  { value: 6, label: 'Сб', labelEn: 'Sat' },
  { value: 7, label: 'Вс', labelEn: 'Sun' },
];

const NICHES = [
  { value: 'salon', icon: '💇', key: 'salon' },
  { value: 'medical', icon: '🏥', key: 'medical' },
  { value: 'restaurant', icon: '🍽️', key: 'restaurant' },
  { value: 'real-estate', icon: '🏠', key: 'realEstate' },
  { value: 'education', icon: '📚', key: 'education' },
  { value: 'fitness', icon: '💪', key: 'fitness' },
  { value: 'consulting', icon: '💼', key: 'consulting' },
  { value: 'ecommerce', icon: '🛒', key: 'ecommerce' },
  { value: 'other', icon: '⚙️', key: 'other' },
] as const;

const BOT_TYPES = [
  {
    value: 'ai' as const,
    key: 'typeAi',
    descKey: 'typeAiDesc',
    icon: Bot,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    value: 'rule-based' as const,
    key: 'typeRule',
    descKey: 'typeRuleDesc',
    icon: Code2,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  },
  {
    value: 'hybrid' as const,
    key: 'typeHybrid',
    descKey: 'typeHybridDesc',
    icon: GitMerge,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400',
  },
];

const FEATURES_CONFIG = [
  { key: 'booking', labelKey: 'featureBooking', icon: CalendarCheck, color: 'text-emerald-500' },
  { key: 'services', labelKey: 'featureServices', icon: Scissors, color: 'text-blue-500' },
  { key: 'faq', labelKey: 'featureFaq', icon: HelpCircle, color: 'text-amber-500' },
  { key: 'operatorTransfer', labelKey: 'featureOperator', icon: Phone, color: 'text-violet-500' },
  { key: 'contactCollection', labelKey: 'featureContacts', icon: UserPlus, color: 'text-rose-500' },
] as const;

const AI_PERSONALITIES: Record<string, Record<string, string>> = {
  friendly: {
    ru: 'Ты дружелюбный помощник. Общайся неформально, используй эмодзи, будь полезным и заботливым. Представляйся коротко и привлекательно.',
    en: 'You are a friendly assistant. Communicate informally, use emojis, be helpful and caring. Introduce yourself briefly and engagingly.',
    tr: 'Dost canlı bir asistanısın. Resmi olmayan şekilde iletişim kur, emoji kullan, yardımsever ve nazik ol. Kendini kısaca ve çekici şekilde tanıt.',
  },
  professional: {
    ru: 'Ты профессиональный бизнес-консультант. Отвечай чётко и по делу. Используй деловой стиль без лишних эмоций. Предлагай решения.',
    en: 'You are a professional business consultant. Answer clearly and to the point. Use business style without unnecessary emotions. Suggest solutions.',
    tr: 'Profesyonel bir iş danışmanısın. Açık ve net cevap ver. Gereksiz duygusuz iş stili kullan. Çözümler öner.',
  },
  support: {
    ru: 'Ты техническая поддержка. Помогай решать проблемы пользователей. Будь терпеливым, объясняйте пошагово. Если не можете помочь — предложите связаться с инженером.',
    en: 'You are technical support. Help users solve problems. Be patient, explain step by step. If you cannot help, suggest contacting an engineer.',
    tr: 'Teknik desteksün. Kullanıcıların sorunlarını çözmesine yardım et. Sabırlı ol, adım adım açıkla. Yardımcı olamazsanız bir mühendisle iletişim kurmayı öner.',
  },
  sales: {
    ru: 'Ты продажник. Выявляй потребности клиента, предлагайте подходящие услуги, мягко направляйте к записи. Будьте убедительны, но не навязчивы.',
    en: 'You are a sales agent. Identify customer needs, suggest suitable services, gently guide to booking. Be persuasive but not pushy.',
    tr: 'Bir satış temsilcisisiniz. Müşteri ihtiyaçlarını belirleyin, uygun hizmetler önerin, randevuya yumuşakça yönlendir. İkna edici ama ısrarcı olmayın.',
  },
};

const PERSONALITY_PRESETS = [
  { key: 'friendly', emoji: '😊', label: { ru: 'Дружелюбный помощник', en: 'Friendly helper', tr: 'Dost canlı yardımcı' } },
  { key: 'professional', emoji: '💼', label: { ru: 'Профессиональный консультант', en: 'Professional consultant', tr: 'Profesyonel danışman' } },
  { key: 'support', emoji: '🔧', label: { ru: 'Техническая поддержка', en: 'Tech support', tr: 'Teknik destek' } },
  { key: 'sales', emoji: '💰', label: { ru: 'Продажник', en: 'Sales agent', tr: 'Satış temsilcisi' } },
];

const AI_CAPABILITIES_CONFIG = [
  { key: 'autoQA' as const, icon: MessageSquare, labelKey: { ru: 'Автоматические ответы на вопросы', en: 'Automatic Q&A', tr: 'Otomatik soru-cevap' } },
  { key: 'intentRecognition' as const, icon: Target, labelKey: { ru: 'Распознавание намерений', en: 'Intent recognition', tr: 'Niyet tanıma' } },
  { key: 'leadCapture' as const, icon: UserCheck, labelKey: { ru: 'Сбор контактов', en: 'Lead capture', tr: 'Potansiyel müşteri yakalama' } },
  { key: 'personalization' as const, icon: UserPlus, labelKey: { ru: 'Персонализация общения', en: 'Conversation personalization', tr: 'Kişiselleştirilmiş iletişim' } },
  { key: 'operatorEscalation' as const, icon: ArrowRightLeft, labelKey: { ru: 'Передача оператору', en: 'Operator escalation', tr: 'Operatöre devir' } },
];

const SLOT_DURATIONS = [30, 45, 60, 90];
const BUFFER_TIMES = [0, 5, 10, 15, 30];

// ──────────────────────────────────────────────────────────────
// Step Indicator
// ──────────────────────────────────────────────────────────────

function StepIndicator({ currentStep, language }: { currentStep: number; language: 'ru' | 'en' | 'tr' }) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <div className="hidden h-0.5 flex-1 mx-2 sm:block">
                  <div
                    className={`h-full rounded-full transition-colors ${
                      isCompleted ? 'bg-emerald-500' : 'bg-muted'
                    }`}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => {}}
                className={`flex flex-col items-center gap-1.5 min-w-[56px] transition-all ${
                  isActive
                    ? 'scale-105'
                    : isCompleted
                      ? 'cursor-default'
                      : 'opacity-60 cursor-default'
                }`}
              >
                <div
                  className={`flex size-9 items-center justify-center rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900'
                      : isCompleted
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-muted-foreground/30 bg-background text-muted-foreground'
                  }`}
                >
                  {isCompleted ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <span
                  className={`text-[10px] font-medium whitespace-nowrap ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isCompleted
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                  }`}
                >
                  {t(`botBuilder.${step.key}`, language)}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 1: Bot Type Selection
// ──────────────────────────────────────────────────────────────

const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

function Step1BotType({ language }: { language: 'ru' | 'en' | 'tr' }) {
  const { draftBot, updateDraftBot } = useBotBuilderStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_AVATAR_SIZE) {
        toast.error(
          language === 'ru'
            ? 'Файл слишком большой. Максимальный размер: 2 МБ'
            : language === 'en'
              ? 'File is too large. Maximum size: 2 MB'
              : 'Dosya çok büyük. Maksimum boyut: 2 MB'
        );
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          updateDraftBot({ avatar: reader.result });
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [language, updateDraftBot]
  );

  const handleRemoveAvatar = useCallback(() => {
    updateDraftBot({ avatar: '' });
  }, [updateDraftBot]);

  const avatarUploadLabel =
    language === 'ru'
      ? 'Загрузить фото'
      : language === 'en'
        ? 'Upload photo'
        : 'Fotoğraf yükle';

  const avatarRemoveLabel =
    language === 'ru'
      ? 'Удалить'
      : language === 'en'
        ? 'Remove'
        : 'Kaldır';

  const avatarHint =
    language === 'ru'
      ? 'Фото для вашего бота (макс. 2 МБ)'
      : language === 'en'
        ? 'Photo for your bot (max 2 MB)'
        : 'Botunuz için fotoğraf (maks 2 MB)';

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step1Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Выберите тип бота для вашего бизнеса
        </p>
      </div>
      <RadioGroup
        value={draftBot.type}
        onValueChange={(val) => updateDraftBot({ type: val as 'ai' | 'rule-based' | 'hybrid' })}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {BOT_TYPES.map((botType) => {
          const Icon = botType.icon;
          const isSelected = draftBot.type === botType.value;
          return (
            <Label
              key={botType.value}
              htmlFor={`type-${botType.value}`}
              className="cursor-pointer"
            >
              <Card
                className={`relative transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                    : 'hover:border-muted-foreground/30'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <RadioGroupItem value={botType.value} id={`type-${botType.value}`} className="sr-only" />
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${botType.color}`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{t(`botBuilder.${botType.key}`, language)}</p>
                        {isSelected && (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <Check className="size-3" />
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {t(`botBuilder.${botType.descKey}`, language)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>

      <Separator />

      {/* Avatar Upload Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {language === 'ru'
            ? 'Аватар бота'
            : language === 'en'
              ? 'Bot Avatar'
              : 'Bot Avatarı'}
        </Label>
        <p className="text-xs text-muted-foreground">{avatarHint}</p>

        <div className="flex items-center gap-4">
          <div className="relative group">
            {draftBot.avatar && draftBot.avatar.startsWith('data:') ? (
              <>
                <div className="size-[120px] rounded-full overflow-hidden border-2 border-emerald-300 dark:border-emerald-700 shadow-md">
                  <img
                    src={draftBot.avatar}
                    alt="Bot avatar"
                    className="size-full object-cover"
                  />
                </div>
                {/* Remove overlay */}
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={avatarRemoveLabel}
                >
                  <div className="flex flex-col items-center gap-1">
                    <X className="size-6 text-white" />
                    <span className="text-[10px] text-white font-medium">{avatarRemoveLabel}</span>
                  </div>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-[120px] rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-emerald-400 dark:hover:border-emerald-600 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer bg-muted/20"
              >
                <Camera className="size-6 text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground">{avatarUploadLabel}</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 w-fit"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="size-4" />
              {avatarUploadLabel}
            </Button>
            {draftBot.avatar && draftBot.avatar.startsWith('data:') && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-2 w-fit text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleRemoveAvatar}
              >
                <Trash2 className="size-3.5" />
                {avatarRemoveLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 2: Niche / Template Selection
// ──────────────────────────────────────────────────────────────

function Step2Niche({ language, nicheLocked }: { language: 'ru' | 'en' | 'tr'; nicheLocked: boolean }) {
  const { draftBot, updateDraftBot, updateConfig, updateAppearance } = useBotBuilderStore();
  const [loadingNiche, setLoadingNiche] = useState<string | null>(null);
  const [templatePreview, setTemplatePreview] = useState<BotTemplate | null>(null);

  const handleNicheSelect = useCallback(
    async (niche: string) => {
      updateDraftBot({ niche });
      setLoadingNiche(niche);
      setTemplatePreview(null);

      try {
        const res = await fetch(`/api/templates?niche=${niche}`);
        if (res.ok) {
          const data = await res.json();
          const tmpl = data.template as BotTemplate | null;
          setTemplatePreview(tmpl);

          if (tmpl) {
            if (tmpl.greeting) {
              updateConfig({ greeting: tmpl.greeting });
            }
            if (tmpl.faq && tmpl.faq.length > 0) {
              updateConfig({ faq: tmpl.faq });
            }
            if (tmpl.colors) {
              updateAppearance({
                primaryColor: tmpl.colors.primary || draftBot.appearance.primaryColor,
                secondaryColor: tmpl.colors.secondary || draftBot.appearance.secondaryColor,
              });
            }
          }
        }
      } catch {
        // Silently fail - template preview is optional
      } finally {
        setLoadingNiche(null);
      }
    },
    [draftBot.appearance.primaryColor, draftBot.appearance.secondaryColor, updateAppearance, updateConfig, updateDraftBot]
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step2Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('botBuilder.selectNiche', language)}
        </p>
      </div>

      {nicheLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
          <Lock className="size-4 shrink-0 text-amber-500" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            {language === 'ru'
              ? 'В демо-версии можно выбрать только 1 сферу. Для смены сферы удалите текущего бота.'
              : language === 'en'
                ? 'In demo version you can only choose 1 niche. Delete your current bot to change niche.'
                : 'Demo sürümünde yalnızca 1 niş seçebilirsiniz. Niş değiştirmek için mevcut botu silin.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {NICHES.map((niche) => {
          const isSelected = draftBot.niche === niche.value;
          const isLoading = loadingNiche === niche.value;
          const isLocked = nicheLocked && !isSelected;
          return (
            <Card
              key={niche.value}
              className={`transition-all ${
                isLocked
                  ? 'opacity-50 cursor-not-allowed'
                  : `cursor-pointer hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                        : 'hover:border-muted-foreground/30'
                    }`
              }`}
              onClick={() => !isLocked && handleNicheSelect(niche.value)}
            >
              <CardContent className="flex flex-col items-center gap-2 p-4">
                <span className="text-2xl">{niche.icon}</span>
                <span className="text-xs font-medium text-center">{t(`botBuilder.${niche.key}`, language)}</span>
                {isLoading && <Loader2 className="size-3 animate-spin text-emerald-500" />}
                {isSelected && !isLoading && (
                  <Check className="size-4 text-emerald-500" />
                )}
                {isLocked && <Lock className="size-3 text-muted-foreground" />}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Template Preview */}
      {templatePreview && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="size-4 text-emerald-500" />
              {t('botBuilder.preview', language)} — {templatePreview.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            {templatePreview.greeting && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Приветствие:</p>
                <p className="text-sm bg-background rounded-lg p-3 border">
                  {templatePreview.greeting}
                </p>
              </div>
            )}
            {templatePreview.faq && templatePreview.faq.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">FAQ ({templatePreview.faq.length}):</p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {templatePreview.faq.slice(0, 3).map((item, i) => (
                    <div key={i} className="text-xs bg-background rounded-lg p-2 border">
                      <span className="font-medium">{item.question}</span>
                    </div>
                  ))}
                  {templatePreview.faq.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center">...и ещё {templatePreview.faq.length - 3}</p>
                  )}
                </div>
              </div>
            )}
            {templatePreview.colors && (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Цвета:</p>
                <div className="flex gap-1">
                  <div
                    className="size-5 rounded-full border"
                    style={{ backgroundColor: templatePreview.colors.primary }}
                  />
                  <div
                    className="size-5 rounded-full border"
                    style={{ backgroundColor: templatePreview.colors.secondary }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 3: Behavior Settings
// ──────────────────────────────────────────────────────────────

function Step3Behavior({ language }: { language: 'ru' | 'en' | 'tr' }) {
  const { draftBot, updateDraftBot, updateConfig, updateWorkingHours } = useBotBuilderStore();
  const { config } = draftBot;

  const toggleDay = useCallback(
    (day: number) => {
      const currentDays = config.workingHours.days;
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort();
      updateWorkingHours({ days: newDays });
    },
    [config.workingHours.days, updateWorkingHours]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step3Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Настройте поведение и ответы бота
        </p>
      </div>

      {/* Bot Name */}
      <div className="space-y-2">
        <Label htmlFor="bot-name" className="text-sm font-medium">
          {t('botBuilder.botName', language)}
        </Label>
        <Input
          id="bot-name"
          value={draftBot.name}
          onChange={(e) => updateDraftBot({ name: e.target.value })}
          placeholder="Например: Алиса"
          className="max-w-md"
        />
      </div>

      <Separator />

      {/* Greeting Message */}
      <div className="space-y-2">
        <Label htmlFor="greeting" className="text-sm font-medium">
          {t('botBuilder.greeting', language)}
        </Label>
        <Textarea
          id="greeting"
          value={config.greeting}
          onChange={(e) => updateConfig({ greeting: e.target.value })}
          placeholder={t('botBuilder.greetingPlaceholder', language)}
          className="min-h-[100px] resize-y"
        />
        <div className="flex flex-wrap gap-2">
          {['{user_name}', '{company_name}', '{bot_name}'].map((variable) => (
            <Badge
              key={variable}
              variant="outline"
              className="cursor-pointer hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-950 dark:hover:text-emerald-300 transition-colors text-xs"
              onClick={() => updateConfig({ greeting: config.greeting + variable })}
            >
              {variable}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Tone Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">{t('botBuilder.tone', language)}</Label>
        <RadioGroup
          value={config.tone}
          onValueChange={(val) => updateConfig({ tone: val as 'formal' | 'friendly' | 'professional' })}
          className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            { value: 'formal', key: 'toneFormal', emoji: '🎩' },
            { value: 'friendly', key: 'toneFriendly', emoji: '😊' },
            { value: 'professional', key: 'toneProfessional', emoji: '💼' },
          ].map((tone) => (
            <Label key={tone.value} htmlFor={`tone-${tone.value}`} className="cursor-pointer">
              <Card
                className={`transition-all hover:shadow-sm ${
                  config.tone === tone.value
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'hover:border-muted-foreground/30'
                }`}
              >
                <CardContent className="flex items-center gap-3 p-3">
                  <RadioGroupItem value={tone.value} id={`tone-${tone.value}`} />
                  <span className="text-lg">{tone.emoji}</span>
                  <span className="text-sm font-medium">{t(`botBuilder.${tone.key}`, language)}</span>
                </CardContent>
              </Card>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Working Hours */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm font-medium">{t('botBuilder.workingHours', language)}</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('botBuilder.outsideHours', language)}
            </p>
          </div>
          <Switch
            checked={config.workingHours.enabled}
            onCheckedChange={(checked) => updateWorkingHours({ enabled: checked })}
          />
        </div>

        {config.workingHours.enabled && (
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-4">
              {/* Day checkboxes */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Рабочие дни</p>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`flex size-9 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                        config.workingHours.days.includes(day.value)
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                          : 'border-muted hover:border-emerald-300 text-muted-foreground'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time pickers */}
              <div className="flex items-center gap-3">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-muted-foreground">Начало</Label>
                  <Input
                    type="time"
                    value={config.workingHours.startTime}
                    onChange={(e) => updateWorkingHours({ startTime: e.target.value })}
                    className="h-9"
                  />
                </div>
                <span className="text-muted-foreground pt-5">—</span>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs text-muted-foreground">Конец</Label>
                  <Input
                    type="time"
                    value={config.workingHours.endTime}
                    onChange={(e) => updateWorkingHours({ endTime: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Separator />

      {/* System Prompt (for AI bots) */}
      {(draftBot.type === 'ai' || draftBot.type === 'hybrid') && (
        <div className="space-y-4">
          {/* AI System Prompt — larger and more prominent */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-emerald-500" />
              <Label htmlFor="system-prompt" className="text-sm font-semibold">
                {t('botBuilder.systemPrompt', language)}
              </Label>
            </div>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              placeholder={t('botBuilder.systemPromptPlaceholder', language)}
              className="min-h-[180px] resize-y text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {language === 'ru'
                ? 'Опишите, как бот должен отвечать на вопросы клиентов, его характер и правила'
                : language === 'en'
                  ? 'Describe how the bot should answer customer questions, its personality and rules'
                  : 'Botun müşteri sorularını nasıl yanıtlaması gerektiğini, karakterini ve kurallarını tanımlayın'}
            </p>
          </div>

          {/* Personality Presets */}
          {draftBot.type === 'ai' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                {language === 'ru'
                  ? 'Тон и персональность'
                  : language === 'en'
                    ? 'Tone & Personality'
                    : 'Ton ve Kişilik'}
              </Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PERSONALITY_PRESETS.map((preset) => (
                  <Card
                    key={preset.key}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      config.aiPersonality === preset.key
                        ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => {
                      updateConfig({
                        aiPersonality: preset.key,
                        systemPrompt: AI_PERSONALITIES[preset.key][language] || AI_PERSONALITIES[preset.key].ru,
                      });
                    }}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <span className="text-xl">{preset.emoji}</span>
                      <span className="text-sm font-medium">{preset.label[language] || preset.label.ru}</span>
                      {config.aiPersonality === preset.key && (
                        <Check className="size-4 text-emerald-600 dark:text-emerald-400 ml-auto shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 4: Features Toggle
// ──────────────────────────────────────────────────────────────

function Step4Features({ language, isDemoUser }: { language: 'ru' | 'en' | 'tr'; isDemoUser: boolean }) {
  const { draftBot, updateFeatures, updateConfig } = useBotBuilderStore();
  const { features, faq, services } = draftBot.config;

  const toggleFeature = useCallback(
    (key: string, value: boolean) => {
      updateFeatures({ [key]: value } as Record<string, boolean>);
    },
    [updateFeatures]
  );

  // FAQ management
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  const addFaqItem = useCallback(() => {
    if (faqQuestion.trim() && faqAnswer.trim()) {
      updateConfig({ faq: [...faq, { question: faqQuestion.trim(), answer: faqAnswer.trim() }] });
      setFaqQuestion('');
      setFaqAnswer('');
    }
  }, [faq, faqAnswer, faqQuestion, updateConfig]);

  const removeFaqItem = useCallback(
    (index: number) => {
      updateConfig({ faq: faq.filter((_, i) => i !== index) });
    },
    [faq, updateConfig]
  );

  // Services management
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const addServiceItem = useCallback(() => {
    if (serviceName.trim() && servicePrice) {
      updateConfig({
        services: [
          ...services,
          {
            name: serviceName.trim(),
            price: parseFloat(servicePrice) || 0,
            duration: parseInt(serviceDuration) || 60,
            description: '',
          },
        ],
      });
      setServiceName('');
      setServicePrice('');
      setServiceDuration('');
    }
  }, [serviceName, servicePrice, serviceDuration, services, updateConfig]);

  const removeServiceItem = useCallback(
    (index: number) => {
      updateConfig({ services: services.filter((_, i) => i !== index) });
    },
    [services, updateConfig]
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step4Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Включите нужные функции для вашего бота
        </p>
      </div>

      {/* Feature Toggles */}
      <div className="space-y-3">
        {FEATURES_CONFIG.map((feature) => {
          const Icon = feature.icon;
          const isEnabled = features[feature.key as keyof typeof features] as boolean;
          return (
            <Card
              key={feature.key}
              className={`transition-all ${isEnabled ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20' : ''}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${isEnabled ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-muted'}`}>
                    <Icon className={`size-4 ${isEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                  </div>
                  <span className="text-sm font-medium">{t(`botBuilder.${feature.labelKey}`, language)}</span>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => toggleFeature(feature.key, checked)}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* AI Capabilities (for AI bot type) */}
      {draftBot.type === 'ai' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-amber-500" />
            <Label className="text-sm font-semibold">
              {language === 'ru'
                ? 'AI Возможности'
                : language === 'en'
                  ? 'AI Capabilities'
                  : 'AI Yetenekleri'}
            </Label>
          </div>
          {AI_CAPABILITIES_CONFIG.map((cap) => {
            const Icon = cap.icon;
            const isEnabled = draftBot.config.aiCapabilities[cap.key];
            return (
              <Card
                key={cap.key}
                className={`transition-all ${
                  isEnabled
                    ? 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/20'
                    : ''
                }`}
              >
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-9 items-center justify-center rounded-lg ${
                        isEnabled ? 'bg-amber-100 dark:bg-amber-950' : 'bg-muted'
                      }`}
                    >
                      <Icon
                        className={`size-4 ${
                          isEnabled
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {cap.labelKey[language] || cap.labelKey.ru}
                    </span>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={(checked) =>
                      updateConfig({
                        aiCapabilities: {
                          ...draftBot.config.aiCapabilities,
                          [cap.key]: checked,
                        },
                      })
                    }
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Separator />

      {/* FAQ Editor */}
      {features.faq && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <HelpCircle className="size-4 text-amber-500" />
            FAQ — Вопросы и ответы
          </Label>

          {/* Add FAQ Form */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder="Вопрос клиента..."
                className="h-9"
              />
              <Textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder="Ответ бота..."
                className="min-h-[60px] resize-y"
              />
              <Button
                type="button"
                onClick={addFaqItem}
                disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="size-4 mr-1" />
                Добавить
              </Button>
            </CardContent>
          </Card>

          {/* FAQ List */}
          {faq.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {faq.map((item, index) => (
                <Card key={index} className="group">
                  <CardContent className="flex items-start gap-3 p-3">
                    <GripVertical className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.question}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.answer}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFaqItem(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {faq.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Пока нет вопросов. Добавьте первый FAQ.
            </p>
          )}
        </div>
      )}

      {/* Services Editor */}
      {features.services && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Scissors className="size-4 text-blue-500" />
            Услуги и цены
          </Label>

          {/* Add Service Form */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <Input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="Название услуги..."
                className="h-9"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Цена (₽)</Label>
                  <Input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="1000"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Длительность (мин.)</Label>
                  <Input
                    type="number"
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    placeholder="60"
                    className="h-9"
                  />
                </div>
              </div>
              {isDemoUser && services.length >= 1 && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/30">
                  <Lock className="size-3.5 shrink-0 text-amber-500" />
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    {language === 'ru'
                      ? 'В демо-версии доступна только 1 услуга'
                      : language === 'en'
                        ? 'Only 1 service available in demo version'
                        : 'Demo sürümünde yalnızca 1 hizmet kullanılabilir'}
                  </p>
                </div>
              )}
              <Button
                type="button"
                onClick={addServiceItem}
                disabled={!serviceName.trim() || !servicePrice || (isDemoUser && services.length >= 1)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="size-4 mr-1" />
                Добавить
              </Button>
            </CardContent>
          </Card>

          {/* Services List */}
          {services.length > 0 && (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {services.map((item, index) => (
                <Card key={index} className="group">
                  <CardContent className="flex items-center gap-3 p-3">
                    <GripVertical className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.price}₽ · {item.duration} мин.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeServiceItem(index)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {services.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Пока нет услуг. Добавьте первую.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 5: Appearance
// ──────────────────────────────────────────────────────────────

function Step5Appearance({ language }: { language: 'ru' | 'en' | 'tr' }) {
  const { draftBot, updateAppearance } = useBotBuilderStore();
  const { appearance, config } = draftBot;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Settings */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold">{t('botBuilder.step5Title', language)}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('botBuilder.appearance', language)}
          </p>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">{t('botBuilder.colors', language)}</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">{t('botBuilder.primaryColor', language)}</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={appearance.primaryColor}
                    onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                    className="size-10 p-0.5 cursor-pointer rounded-lg border"
                  />
                </div>
                <Input
                  value={appearance.primaryColor}
                  onChange={(e) => updateAppearance({ primaryColor: e.target.value })}
                  className="h-9 flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Дополнительный цвет</Label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="color"
                    value={appearance.secondaryColor}
                    onChange={(e) => updateAppearance({ secondaryColor: e.target.value })}
                    className="size-10 p-0.5 cursor-pointer rounded-lg border"
                  />
                </div>
                <Input
                  value={appearance.secondaryColor}
                  onChange={(e) => updateAppearance({ secondaryColor: e.target.value })}
                  className="h-9 flex-1 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Position */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('botBuilder.position', language)}</Label>
          <Select
            value={appearance.position}
            onValueChange={(val) => updateAppearance({ position: val as 'bottom-right' | 'bottom-left' | 'inline' })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">{t('botBuilder.bottomRight', language)}</SelectItem>
              <SelectItem value="bottom-left">{t('botBuilder.bottomLeft', language)}</SelectItem>
              <SelectItem value="inline">Встроенный</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Button Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Размер кнопки</Label>
          <RadioGroup
            value={appearance.buttonSize}
            onValueChange={(val) => updateAppearance({ buttonSize: val as 'small' | 'medium' | 'large' })}
            className="flex gap-3"
          >
            {[
              { value: 'small', label: 'Маленький', size: 'size-6' },
              { value: 'medium', label: 'Средний', size: 'size-8' },
              { value: 'large', label: 'Большой', size: 'size-10' },
            ].map((size) => (
              <Label key={size.value} htmlFor={`btn-${size.value}`} className="cursor-pointer">
                <Card
                  className={`px-3 py-2 transition-all ${
                    appearance.buttonSize === size.value
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'hover:border-muted-foreground/30'
                  }`}
                >
                  <CardContent className="flex items-center gap-2 p-0">
                    <RadioGroupItem value={size.value} id={`btn-${size.value}`} />
                    <div
                      className="rounded-full"
                      style={{ width: size.value === 'small' ? 24 : size.value === 'medium' ? 32 : 40, height: size.value === 'small' ? 24 : size.value === 'medium' ? 32 : 40, backgroundColor: appearance.primaryColor }}
                    />
                    <span className="text-xs">{size.label}</span>
                  </CardContent>
                </Card>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Animation Style */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Стиль анимации</Label>
          <Tabs
            value={appearance.animation}
            onValueChange={(val) => updateAppearance({ animation: val as 'fade' | 'slide' | 'bounce' })}
          >
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="fade" className="text-xs">Fade</TabsTrigger>
              <TabsTrigger value="slide" className="text-xs">Slide</TabsTrigger>
              <TabsTrigger value="bounce" className="text-xs">Bounce</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="company-name" className="text-sm font-medium">Название компании</Label>
          <Input
            id="company-name"
            value={appearance.companyName}
            onChange={(e) => updateAppearance({ companyName: e.target.value })}
            placeholder="Название вашей компании"
            className="max-w-md h-9"
          />
        </div>
      </div>

      {/* Interactive Live Chat Preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-emerald-500" />
          <Label className="text-sm font-medium">{t('botBuilder.livePreview', language)}</Label>
        </div>
        <LiveChatPreview />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Step 6: Calendar Settings
// ──────────────────────────────────────────────────────────────

function Step6Calendar({ language }: { language: 'ru' | 'en' | 'tr' }) {
  const { draftBot, updateCalendarConfig } = useBotBuilderStore();
  const { calendarConfig } = draftBot;

  const toggleDay = useCallback(
    (day: number) => {
      const currentDays = calendarConfig.days;
      const newDays = currentDays.includes(day)
        ? currentDays.filter((d) => d !== day)
        : [...currentDays, day].sort();
      updateCalendarConfig({ days: newDays });
    },
    [calendarConfig.days, updateCalendarConfig]
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step6Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t('botBuilder.calendarSettings', language)}
        </p>
      </div>

      {/* Available Days */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('botBuilder.availableDays', language)}</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => toggleDay(day.value)}
              className={`flex size-10 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                calendarConfig.days.includes(day.value)
                  ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                  : 'border-muted hover:border-emerald-300 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Начало работы</Label>
          <Input
            type="time"
            value={calendarConfig.startTime}
            onChange={(e) => updateCalendarConfig({ startTime: e.target.value })}
            className="h-10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Конец работы</Label>
          <Input
            type="time"
            value={calendarConfig.endTime}
            onChange={(e) => updateCalendarConfig({ endTime: e.target.value })}
            className="h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Slot Duration */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('botBuilder.slotDuration', language)}</Label>
        <Tabs
          value={String(calendarConfig.slotDuration)}
          onValueChange={(val) => updateCalendarConfig({ slotDuration: parseInt(val) })}
        >
          <TabsList className="grid w-full grid-cols-4 h-10">
            {SLOT_DURATIONS.map((duration) => (
              <TabsTrigger key={duration} value={String(duration)} className="text-sm">
                {duration} мин.
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Buffer Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t('botBuilder.bufferTime', language)}</Label>
        <Tabs
          value={String(calendarConfig.bufferMinutes)}
          onValueChange={(val) => updateCalendarConfig({ bufferMinutes: parseInt(val) })}
        >
          <TabsList className="grid w-full grid-cols-5 h-10">
            {BUFFER_TIMES.map((buffer) => (
              <TabsTrigger key={buffer} value={String(buffer)} className="text-sm">
                {buffer === 0 ? 'Нет' : `${buffer} мин.`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Max Concurrent Bookings */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-violet-500" />
          <Label className="text-sm font-medium">
            {language === 'ru'
              ? 'Одновременные записи на один слот'
              : language === 'en'
                ? 'Concurrent bookings per slot'
                : 'Aynı slotta eşzamanlı randevular'}
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          {language === 'ru'
            ? 'Сколько клиентов могут записаться на одно и то же время? Например, если у вас несколько кабинетов или специалистов, можно принять нескольких клиентов одновременно.'
            : language === 'en'
              ? 'How many clients can book the same time slot? For example, if you have multiple offices or specialists, you can accept several clients at the same time.'
              : 'Aynı zaman dilimine kaç müşteri randevu alabilir? Örneğin, birden fazla ofisiniz veya uzmanınız varsa, aynı anda birden fazla müşteri kabul edebilirsiniz.'}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg border bg-background px-4 py-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums w-8 text-center">
              {calendarConfig.maxConcurrentBookings || 1}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() =>
                updateCalendarConfig({
                  maxConcurrentBookings: Math.min(20, calendarConfig.maxConcurrentBookings + 1),
                })
              }
            >
              <Plus className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              disabled={(calendarConfig.maxConcurrentBookings || 1) <= 1}
              onClick={() =>
                updateCalendarConfig({
                  maxConcurrentBookings: Math.max(1, (calendarConfig.maxConcurrentBookings || 1) - 1),
                })
              }
            >
              <Minus className="size-4" />
            </Button>
          </div>
          <div className="ml-2 flex flex-wrap gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateCalendarConfig({ maxConcurrentBookings: n })}
                className={`flex size-8 items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                  (calendarConfig.maxConcurrentBookings || 1) === n
                    ? 'border-violet-500 bg-violet-500 text-white shadow-sm'
                    : 'border-muted hover:border-violet-300 text-muted-foreground hover:bg-violet-50 dark:hover:bg-violet-950'
                }`}
              >
                {n}
              </button>
            ))}
            {(calendarConfig.maxConcurrentBookings || 1) > 5 && (
              <div className="flex size-8 items-center justify-center rounded-lg border border-violet-500 bg-violet-100 text-violet-700 text-xs font-bold dark:bg-violet-950 dark:text-violet-300">
                {calendarConfig.maxConcurrentBookings || 1}
              </div>
            )}
          </div>
        </div>
        {(calendarConfig.maxConcurrentBookings || 1) > 1 && (
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium">
            {language === 'ru'
              ? `✓ До ${calendarConfig.maxConcurrentBookings || 1} клиентов одновременно на каждый временной слот`
              : language === 'en'
                ? `✓ Up to ${calendarConfig.maxConcurrentBookings || 1} clients simultaneously per time slot`
                : `✓ Her zaman dilimi için aynı anda en fazla ${calendarConfig.maxConcurrentBookings || 1} müşteri`}
          </p>
        )}
      </div>

      <Separator />

      {/* Summary */}
      <Card className="bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {language === 'ru' ? 'Итого' : language === 'en' ? 'Summary' : 'Özet'}
            </span>
          </div>
          <div className="space-y-1 text-sm text-emerald-900/80 dark:text-emerald-100/80">
            <p>
              {language === 'ru' ? 'Дни' : language === 'en' ? 'Days' : 'Günler'}:{' '}
              {calendarConfig.days.length > 0
                ? calendarConfig.days.map((d) => DAYS_OF_WEEK.find((dw) => dw.value === d)?.label).join(', ')
                : language === 'ru' ? 'Не выбраны' : language === 'en' ? 'None' : 'Seçilmedi'}
            </p>
            <p>
              {language === 'ru' ? 'Время' : language === 'en' ? 'Time' : 'Saat'}: {calendarConfig.startTime} — {calendarConfig.endTime}
            </p>
            <p>
              {language === 'ru' ? 'Слот' : language === 'en' ? 'Slot' : 'Slot'}: {calendarConfig.slotDuration}{' '}
              {language === 'ru' ? 'мин.' : language === 'en' ? 'min' : 'dk'}
              , {language === 'ru' ? 'буфер' : language === 'en' ? 'buffer' : 'arabellek'}:{' '}
              {calendarConfig.bufferMinutes === 0
                ? language === 'ru' ? 'нет' : language === 'en' ? 'none' : 'yok'
                : `${calendarConfig.bufferMinutes} ${language === 'ru' ? 'мин.' : language === 'en' ? 'min' : 'dk'}`}
            </p>
            <p className={calendarConfig.maxConcurrentBookings > 1 ? 'font-semibold text-violet-700 dark:text-violet-300' : ''}>
              {language === 'ru'
                ? 'Одновременные записи'
                : language === 'en'
                  ? 'Concurrent bookings'
                  : 'Eşzamanlı randevular'}:{' '}
              {calendarConfig.maxConcurrentBookings || 1}{' '}
              {language === 'ru'
                ? (calendarConfig.maxConcurrentBookings || 1) === 1 ? 'клиент на слот' : 'клиентов на слот'
                : language === 'en'
                  ? (calendarConfig.maxConcurrentBookings || 1) === 1 ? 'client per slot' : 'clients per slot'
                  : (calendarConfig.maxConcurrentBookings || 1) === 1 ? 'müşteri/slot' : 'müşteri/slot'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────

export function BotBuilderPage() {
  const { language } = useAppStore();
  const { user } = useAuthStore();
  const {
    currentStep,
    draftBot,
    setStep,
    resetDraft,
    lastSaved,
    setLastSaved,
  } = useBotBuilderStore();

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [existingBotsCount, setExistingBotsCount] = useState(0);
  const [hasPublishedBot, setHasPublishedBot] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(false);

  // ── Demo status helpers ──
  const isDemoUser = !!(
    user?.demoExpiresAt &&
    (!user?.planName || user.planName === 'demo' || user.planName === 'none')
  );
  const isDemoExpired = isDemoUser && new Date(user.demoExpiresAt) < new Date();
  const isDemoActive = isDemoUser && !isDemoExpired;
  const hasReachedBotLimit = isDemoActive && existingBotsCount >= 1;

  // ── Fetch existing bots count on mount ──
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    async function fetchBotCount() {
      try {
        const res = await fetch('/api/bots', { headers: { 'x-user-id': user.id } });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) {
            const bots = data.bots || [];
            setExistingBotsCount(bots.length);
            setHasPublishedBot(bots.some((b: { publishedAt?: string }) => !!b.publishedAt));
          }
        }
      } catch { /* ignore */ }
    }
    fetchBotCount();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ── Detect existing draft on mount ──
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const hasDraft = draftBot.name.trim() !== '' || draftBot.niche !== '';
      if (hasDraft) {
        setShowDraftBanner(true);
      }
    }
  }, [draftBot.name, draftBot.niche]);

  // ── Auto-save every 30 seconds ──
  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }
    autoSaveRef.current = setInterval(() => {
      const hasContent = draftBot.name.trim() !== '' || draftBot.niche !== '';
      if (hasContent) {
        const now = Date.now();
        setLastSaved(now);
        setSaveMessage(`Черновик сохранён ${formatTimestamp(now)}`);
        setTimeout(() => setSaveMessage(null), 3000);
      }
    }, 30000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
        autoSaveRef.current = null;
      }
    };
  }, [draftBot.name, draftBot.niche, setLastSaved]);

  // ── Draft banner handlers ──
  const handleContinueDraft = useCallback(() => {
    setShowDraftBanner(false);
  }, []);

  const handleCancelDraft = useCallback(() => {
    resetDraft();
    setShowDraftBanner(false);
  }, [resetDraft]);

  // ── Validation ──
  const validateStep = useCallback((): boolean => {
    switch (currentStep) {
      case 0:
        // At least type must be selected (always selected by default)
        return true;
      case 1:
        // Niche is optional
        return true;
      case 2:
        // Name is required
        if (!draftBot.name.trim()) return false;
        return true;
      default:
        return true;
    }
  }, [currentStep, draftBot.name]);

  // ── Navigation ──
  const goNext = useCallback(() => {
    if (validateStep()) {
      setStep(currentStep + 1);
    }
  }, [currentStep, setStep, validateStep]);

  const goPrev = useCallback(() => {
    setStep(currentStep - 1);
  }, [currentStep, setStep]);

  // ── Publish ──
  const handlePublish = useCallback(async () => {
    if (!user?.id || !draftBot.name.trim()) return;
    if (isDemoExpired || hasReachedBotLimit) return;

    setIsPublishing(true);
    setPublishError(null);

    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          name: draftBot.name,
          type: draftBot.type,
          niche: draftBot.niche || null,
          avatar: draftBot.avatar || null,
          config: {
            ...draftBot.config,
            calendarConfig: draftBot.calendarConfig,
          },
          appearance: draftBot.appearance,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error || 'Failed to publish bot';
        setPublishError(errMsg);
        return;
      }

      resetDraft();
      setExistingBotsCount(1);
      useAppStore.getState().setPage('bots');
    } catch {
      setPublishError(
        language === 'ru'
          ? 'Не удалось опубликовать бота. Попробуйте ещё раз.'
          : language === 'en'
            ? 'Failed to publish bot. Please try again.'
            : 'Bot yayınlanamadı. Lütfen tekrar deneyin.'
      );
    } finally {
      setIsPublishing(false);
    }
  }, [user, draftBot, resetDraft]);

  // ── Step name error display ──
  const showNameError = currentStep === 2;

  // ── Draft detection flag ──
  const hasActiveDraft = draftBot.name.trim() !== '' || draftBot.niche !== '';

  return (
    <div className="flex flex-col gap-4">
      {/* Demo Expired Banner */}
      {isDemoExpired && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-4 dark:border-destructive/30">
          <div className="flex items-center gap-3 min-w-0">
            <Crown className="size-5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {language === 'ru'
                  ? 'Демо-период истёк'
                  : language === 'en'
                    ? 'Demo period expired'
                    : 'Demo süresi doldu'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'ru'
                  ? 'Для создания ботов выберите платный план'
                  : language === 'en'
                    ? 'Please choose a paid plan to create bots'
                    : 'Bot oluşturmak için lütfen ücretli bir plan seçin'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1"
            onClick={() => useAppStore.getState().setPage('subscription')}
          >
            <Crown className="size-4" />
            {language === 'ru' ? 'Тарифы' : language === 'en' ? 'Plans' : 'Planlar'}
          </Button>
        </div>
      )}

      {/* Demo Bot Limit Warning */}
      {isDemoActive && hasReachedBotLimit && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="size-5 shrink-0 text-amber-500" />
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              {language === 'ru'
                ? 'В демо-версии можно создать только 1 бота'
                : language === 'en'
                  ? 'In demo version you can create only 1 bot'
                  : 'Demo sürümünde yalnızca 1 bot oluşturabilirsiniz'}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50 shrink-0 gap-1"
            onClick={() => useAppStore.getState().setPage('subscription')}
          >
            <Crown className="size-3.5" />
            {language === 'ru' ? 'Улучшить план' : language === 'en' ? 'Upgrade plan' : 'Planı yükselt'}
          </Button>
        </div>
      )}

      {/* Draft Banner */}
      {showDraftBanner && hasActiveDraft && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-3 min-w-0">
            <AlertTriangle className="size-5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                У вас есть незавершённый черновик
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 truncate">
                {draftBot.name || 'Без имени'}{draftBot.niche ? ` · ${draftBot.niche}` : ''}
                {lastSaved && ` · Сохранён ${formatTimestamp(lastSaved)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
              onClick={handleContinueDraft}
            >
              Продолжить
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-amber-700 hover:text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
              onClick={handleCancelDraft}
            >
              <X className="size-3.5" />
              Отменить
            </Button>
          </div>
        </div>
      )}

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} language={language} />

      {/* Auto-save indicator with timestamp */}
      {lastSaved && hasActiveDraft && !showDraftBanner && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3" />
          Сохранено {formatTimestamp(lastSaved)}
        </div>
      )}

      {/* Auto-save toast */}
      {saveMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <Check className="size-4" />
          {saveMessage}
        </div>
      )}

      {/* Step Content */}
      <div className="min-h-[480px]">
        {currentStep === 0 && <Step1BotType language={language} />}
        {currentStep === 1 && <Step2Niche language={language} nicheLocked={isDemoActive && hasPublishedBot} />}
        {currentStep === 2 && <Step3Behavior language={language} />}
        {currentStep === 3 && <Step4Features language={language} isDemoUser={isDemoActive} />}
        {currentStep === 4 && <Step5Appearance language={language} />}
        {currentStep === 5 && <Step6Calendar language={language} />}
      </div>

      {/* Name validation hint */}
      {showNameError && !draftBot.name.trim() && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span>⚠</span> Укажите имя бота для продолжения
        </p>
      )}

      {/* Publish Error */}
      {publishError && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-3">
            <p className="text-sm text-destructive">{publishError}</p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Separator />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={goPrev}
              className="gap-1"
            >
              <ChevronLeft className="size-4" />
              {t('common.back', language)}
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={resetDraft}
            className="text-muted-foreground gap-1"
          >
            {t('botBuilder.saveDraft', language)}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {currentStep < 5 ? (
            <Button
              onClick={goNext}
              disabled={!validateStep()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
            >
              {t('common.next', language)}
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handlePublish}
              disabled={!draftBot.name.trim() || isPublishing || isDemoExpired || hasReachedBotLimit}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 min-w-[140px]"
            >
              {isPublishing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              {t('botBuilder.publish', language)}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BotBuilderPage;
