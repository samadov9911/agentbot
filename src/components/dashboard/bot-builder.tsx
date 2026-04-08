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
// Niche-specific knowledge base for system prompts
// ──────────────────────────────────────────────────────────────

type BotTypeKey = 'ai' | 'rule-based' | 'hybrid';

const NICHE_KNOWLEDGE: Record<string, Record<string, string>> = {
  salon: {
    ru: `Ты работаешь в сфере красоты (салон/барбершоп). Ты знаешь:
- Услуги: стрижки мужские/женские, окрашивание, укладка, маникюр, педикюр, брови, ресницы, массаж
- Бронирование: клиент может записаться на конкретную дату и время через вас
- Цены: ориентируйся на прайс-лист, если клиент спрашивает
- Частые вопросы: сколько длится окрашивание, как подготовиться к процедуре, есть ли скидки для новых клиентов
- Проблемы: аллергия на краску, неудачная стрижка — предложи записать на коррекцию`,
    en: `You work in the beauty industry (salon/barbershop). You know:
- Services: men's/women's haircuts, coloring, styling, manicure, pedicure, brows, lashes, massage
- Booking: clients can book a specific date and time through you
- Pricing: refer to the price list when clients ask
- Common questions: how long does coloring take, how to prepare for a procedure, new client discounts
- Issues: hair dye allergies, bad haircut — offer to book a correction`,
    tr: `Güzellik sektöründe çalışıyorsunuz (salon/berber). Şunları biliyorsunuz:
- Hizmetler: erkek/kadın saç kesimi, boyama, fön, manikür, pedikür, kaş, kirpik, masaj
- Randevu: müşteriler sizin aracılığınızla belirli bir tarih ve saat için rezervasyon yapabilir
- Fiyatlar: müşteriler sorduğunda fiyat listesine yönlendirin
- Sık sorulan sorular: boyama ne kadar sürer, işleme nasıl hazırlanılır, yeni müşteri indirimleri
- Sorunlar: saç boyası alerjisi, kötü saç kesimi — düzeltme için randevu teklif edin`,
  },
  medical: {
    ru: `Ты работаешь в медицинской сфере (клиника/стоматология). Ты знаешь:
- Запись на приём к врачу, консультации
- Виды приёмов: первичный, повторный, онлайн-консультация
- Страхование: уточняй, есть ли полис ОМС/ДМС у пациента
- Частые вопросы: какие документы нужны, как подготовиться к анализам, сроки готовности результатов
- ВАЖНО: ты НЕ ставишь диагнозы и НЕ назначаешь лечение — направляй к врачу`,
    en: `You work in the medical field (clinic/dentistry). You know:
- Booking appointments with doctors, consultations
- Appointment types: initial, follow-up, online consultation
- Insurance: check if the patient has health insurance
- Common questions: what documents are needed, how to prepare for tests, result turnaround times
- IMPORTANT: you do NOT diagnose or prescribe treatment — refer to a doctor`,
    tr: `Tıbbi alanda çalışıyorsunuz (klinik/diş hekimi). Şunları biliyorsunuz:
- Doktor randevuları, konsültasyonlar
- Randevu türleri: ilk, takip, online konsültasyon
- Sigorta: hastanın sağlık sigortası olup olmadığını kontrol edin
- Sık sorulan sorular: hangi belgeler gerekli, testlere nasıl hazırlanılır, sonuç süreleri
- ÖNEMLİ: tanı koymaz ve tedavi önermezsiniz — bir doktora yönlendirin`,
  },
  restaurant: {
    ru: `Ты работаешь в ресторане/кафе. Ты знаешь:
- Меню: завтраки, бизнес-ланчи, основное меню, десерты, напитки
- Бронирование столов: количество гостей, дата, время, предпочтения
- Доставка: условия, минимальный заказ, время доставки, зона покрытия
- Частые вопросы: есть ли вегетарианские блюда, парковка, живая музыка, детское меню
- Аллергии: всегда уточняй у клиента пищевую аллергию`,
    en: `You work in a restaurant/cafe. You know:
- Menu: breakfasts, business lunches, main menu, desserts, drinks
- Table reservations: number of guests, date, time, preferences
- Delivery: conditions, minimum order, delivery time, coverage area
- Common questions: vegetarian options, parking, live music, kids menu
- Allergies: always check for food allergies with the customer`,
    tr: `Bir restoranda/kafede çalışıyorsunuz. Şunları biliyorsunuz:
- Menü: kahvaltılar, iş öğle yemekleri, ana menü, tatlılar, içecekler
- Masa rezervasyonu: misafir sayısı, tarih, saat, tercihler
- Teslimat: koşullar, minimum sipariş, teslimat süresi, kapsam alanı
- Sık sorulan sorular: vejetaryen seçenekler, otopark, canlı müzik, çocuk menüsü
- Alerjiler: müşteriden her zaman gıda alerjilerini sorun`,
  },
  'real-estate': {
    ru: `Ты работаешь в сфере недвижимости (агентство/застройщик). Ты знаешь:
- Типы объектов: квартиры, дома, коммерческая недвижимость, участки
- Услуги: подбор, показ, оформление сделки, ипотечное консультирование
- Частые вопросы: цены в районе, наличие рядом школ/детских садов, транспортная доступность
- Бронирование: можно записать на показ объекта на конкретную дату и время
- Формат: вежливый, но решительный — помогай клиенту принять решение`,
    en: `You work in real estate (agency/developer). You know:
- Property types: apartments, houses, commercial properties, land plots
- Services: selection, viewing, transaction processing, mortgage consulting
- Common questions: prices in the area, nearby schools/kindergartens, transport accessibility
- Booking: can schedule a property viewing for a specific date and time
- Style: polite but decisive — help the client make a decision`,
    tr: `Gayrimenkul sektöründe çalışıyorsunuz (ajans/geliştirici). Şunları biliyorsunuz:
- Gayrimenkul türleri: daireler, evler, ticari mülkler, arsalar
- Hizmetler: seçim, gösterim, işlem süreçleri, ipotek danışmanlığı
- Sık sorulan sorular: bölgedeki fiyatlar, yakınlardaki okullar/kreşler, ulaşım kolaylığı
- Rezervasyon: belirli bir tarih ve saat için gayrimenkul gösterimi ayarlayabilirsiniz
- Stil: nazik ama kararlı — müşterinin karar vermesine yardım edin`,
  },
  education: {
    ru: `Ты работаешь в сфере образования (курсы/школа/репетитор). Ты знаешь:
- Направления: языки, программирование, подготовка к экзаменам, дизайн, маркетинг
- Формат: индивидуальные и групповые занятия, онлайн и офлайн
- Расписание: группы по дням недели, время занятий, длительность курса
- Частые вопросы: цены, пробный урок, сертификат, преподаватели
- Запись: можно записаться на пробный урок или консультацию`,
    en: `You work in education (courses/school/tutoring). You know:
- Subjects: languages, programming, exam prep, design, marketing
- Format: individual and group classes, online and offline
- Schedule: weekly groups, class times, course duration
- Common questions: pricing, trial lesson, certificates, instructors
- Booking: can sign up for a trial lesson or consultation`,
    tr: `Eğitim sektöründe çalışıyorsunuz (kurslar/okul/özel ders). Şunları biliyorsunuz:
- Konular: diller, programlama, sınav hazırlığı, tasarım, pazarlama
- Format: birebir ve grup dersleri, online ve çevrimiçi
- Program: haftalık gruplar, ders saatleri, kurs süresi
- Sık sorulan sorular: fiyatlar, deneme dersi, sertifika, eğitmenler
- Kayıt: deneme dersi veya danışmanlık için kayıt yaptırılabilir`,
  },
  fitness: {
    ru: `Ты работаешь в фитнес-сфере (зал/студия). Ты знаешь:
- Услуги: персональные тренировки, групповые программы, йога, пилатес, кроссфит
- Абонементы: месячные, квартальные, годовые, разовые посещения
- Расписание: группы по времени, запись на персональную тренировку
- Частые вопросы: расписание групп, цены, тренеры, что нужно для первой тренировки
- Мотивация: поддерживай клиента, напоминай о тренировках`,
    en: `You work in fitness (gym/studio). You know:
- Services: personal training, group programs, yoga, pilates, crossfit
- Memberships: monthly, quarterly, annual, single visits
- Schedule: groups by time, booking personal training
- Common questions: group schedule, pricing, trainers, what to bring for first workout
- Motivation: encourage the client, remind about workouts`,
    tr: `Fitness sektöründe çalışıyorsunuz (salon/stüdyo). Şunları biliyorsunuz:
- Hizmetler: kişisel antrenman, grup programları, yoga, pilates, crossfit
- Üyelikler: aylık, üç aylık, yıllık, tek seans
- Program: zamanına göre gruplar, kişisel antrenman randevusu
- Sık sorulan sorular: grup programı, fiyatlar, antrenörler, ilk antrenman için ne gerekli
- Motivasyon: müşteriyi teşvik edin, antrenmanları hatırlatın`,
  },
  consulting: {
    ru: `Ты работаешь в сфере консалтинга (бизнес/юридический/финансовый). Ты знаешь:
- Услуги: бизнес-консультации, юридическая помощь, бухгалтерия, аудит
- Формат: первичная бесплатная консультация, платные сессии, пакетные услуги
- Частые вопросы: цены, сроки, как проходит консультация, какие документы приготовить
- Запись: можно записать на первичную консультацию
- Стиль: строго профессиональный, без лишних эмоций`,
    en: `You work in consulting (business/legal/financial). You know:
- Services: business consulting, legal assistance, accounting, audit
- Format: initial free consultation, paid sessions, package deals
- Common questions: pricing, timelines, how consultations work, what documents to prepare
- Booking: can schedule an initial consultation
- Style: strictly professional, no unnecessary emotions`,
    tr: `Danışmanlık sektöründe çalışıyorsunuz (iş/hukuki/finansal). Şunları biliyorsunuz:
- Hizmetler: iş danışmanlığı, hukuki yardım, muhasebe, denetim
- Format: ilk ücretsiz danışmanlık, ücretli seanslar, paket hizmetler
- Sık sorulan sorular: fiyatlar, süreler, danışmanlık nasıl işler, hangi belgeler hazırlanmalı
- Kayıt: ilk danışmanlık için randevu ayarlanabilir
- Stil: kesinlikle profesyonel, gereksiz duygusuz`,
  },
  ecommerce: {
    ru: `Ты работаешь в интернет-магазине. Ты знаешь:
- Каталог товаров, цены, наличие на складе
- Доставка: сроки, стоимость, способы (курьер, пункт выдачи, почта)
- Возврат и обмен: условия, сроки
- Частые вопросы: статус заказа, трекинг-номер, оплата (карта, наличные, СБП)
- Акции: скидки, промокоды, распродажа
- Проблемы: доставка задерживается, товар не подошёл — помоги оформить возврат`,
    en: `You work in an online store. You know:
- Product catalog, prices, stock availability
- Delivery: timeframes, costs, methods (courier, pickup point, mail)
- Returns and exchanges: conditions, timeframes
- Common questions: order status, tracking number, payment methods (card, cash, SBP)
- Promotions: discounts, promo codes, sales
- Issues: delayed delivery, wrong product — help process a return`,
    tr: `Bir çevrimiçi mağazada çalışıyorsunuz. Şunları biliyorsunuz:
- Ürün kataloğu, fiyatlar, stok durumu
- Teslimat: süreler, maliyetler, yöntemler (kurye, teslim noktası, posta)
- İade ve değişim: koşullar, süreler
- Sık sorulan sorular: sipariş durumu, takip numarası, ödeme yöntemleri
- Promosyonlar: indirimler, promosyon kodları, indirimler
- Sorunlar: gecikmiş teslimat, yanlış ürün — iade sürecine yardım edin`,
  },
};

const NICHE_RULES_TEMPLATES: Record<string, Record<string, { question: string; answer: string }[]>> = {
  salon: {
    ru: [
      { question: 'Какие услуги вы предоставляете?', answer: 'Мы предоставляем широкий спектр услуг: стрижки, окрашивание, укладку, маникюр, педикюр, уход за бровями и ресницами. Подскажите, какая услуга вас интересует?' },
      { question: 'Сколько стоит стрижка?', answer: 'Стоимость стрижки зависит от мастера и сложности. Женская стрижка — от 1500₽, мужская — от 800₽. Для точной цены запишитесь на консультацию.' },
      { question: 'Как записаться?', answer: 'Вы можете записаться прямо здесь! Напишите удобную дату и время, и я подберу для вас свободное окно.' },
      { question: 'Есть ли скидки?', answer: 'Да! При первом посещении скидка 15%. Также действуют скидки при записи на несколько услуг одновременно.' },
    ],
    en: [
      { question: 'What services do you offer?', answer: 'We offer a wide range of services: haircuts, coloring, styling, manicure, pedicure, brow and lash care. Which service are you interested in?' },
      { question: 'How much does a haircut cost?', answer: 'Prices depend on the stylist and complexity. Women\'s haircut from $30, men\'s from $15. Book a consultation for an exact quote.' },
      { question: 'How do I book an appointment?', answer: 'You can book right here! Tell me your preferred date and time, and I\'ll find an available slot for you.' },
      { question: 'Do you have any discounts?', answer: 'Yes! First visit gets 15% off. We also offer discounts when booking multiple services together.' },
    ],
    tr: [
      { question: 'Hangi hizmetleri sunuyorsunuz?', answer: 'Geniş bir yelpazede hizmet sunuyoruz: saç kesimi, boyama, fön, manikür, pedikür, kaş ve kirpik bakımı. Hangi hizmet ilginizi çekiyor?' },
      { question: 'Saç kesimi ne kadar?', answer: 'Fiyatlar uzmana ve karmaşıklığa bağlıdır. Kadın saç kesimi 500₺\'den, erkek saç kesimi 300₺\'den başlar. Kesin fiyat için konsültasyon randevusu alın.' },
      { question: 'Randevu nasıl alabilirim?', answer: 'Buradan doğrudan randevu alabilirsiniz! Uygun tarih ve saati söyleyin, boş bir saat bulayım.' },
      { question: 'İndiriminiz var mı?', answer: 'Evet! İlk ziyarette %15 indirim. Birden fazla hizmet birlikte alındığında da indirim uygulanıyor.' },
    ],
  },
  medical: {
    ru: [
      { question: 'Как записаться к врачу?', answer: 'Напишите, к какому врачу и на какую дату вам нужно записаться. Я проверю свободное время и предложу варианты.' },
      { question: 'Какие документы нужны?', answer: 'Для первого приёма необходим паспорт и полис ОМС (если есть). Для повторного визита — только паспорт.' },
      { question: 'Вы работаете по ОМС?', answer: 'Да, мы принимаем пациентов как по ОМС, так и по коммерческой основе. Уточните у меня наличие свободных мест по ОМС.' },
      { question: 'Как подготовиться к анализам?', answer: 'Обычно анализы сдаются натощак. Не ешьте 8-12 часов перед сдачей. Пить воду можно. Специфическую подготовку уточнит врач.' },
    ],
    en: [
      { question: 'How do I book a doctor?', answer: 'Tell me which doctor and what date you need. I\'ll check availability and suggest options.' },
      { question: 'What documents do I need?', answer: 'For the first visit, bring your ID and insurance card (if applicable). For follow-ups, just your ID.' },
      { question: 'Do you accept insurance?', answer: 'Yes, we accept both insured and private patients. Ask me about available insurance-covered slots.' },
      { question: 'How to prepare for lab tests?', answer: 'Tests are usually done fasting. Don\'t eat 8-12 hours before. Drinking water is fine. Your doctor will specify any special preparation.' },
    ],
    tr: [
      { question: 'Doktora nasıl randevu alabilirim?', answer: 'Hangi doktora ve hangi tarihe randevu almak istediğinizi söyleyin. Uygun saatleri kontrol edip seçenekler sunayım.' },
      { question: 'Hangi belgeler gerekli?', answer: 'İlk ziyaret için kimlik ve sigorta kartı (varsa) gereklidir. Takip ziyaretleri için sadece kimlik yeterli.' },
      { question: 'Sigorta kabul ediyor musunuz?', answer: 'Evet, hem sigortalı hem de özel hastaları kabul ediyoruz. Sigorta kapsamındaki müsaitlik durumlarını sorabilirsiniz.' },
      { question: 'Laboratuvar testlerine nasıl hazırlanmalı?', answer: 'Testler genellikle aç karnına yapılır. Test öncesi 8-12 saat yemeyin. Su içebilirsiniz. Doktor özel hazırlık belirtecektir.' },
    ],
  },
  restaurant: {
    ru: [
      { question: 'Как забронировать столик?', answer: 'Скажите, на какое число, время и сколько гостей ожидается. Я подберу для вас лучший столик!' },
      { question: 'Есть ли доставка?', answer: 'Да, мы доставляем! Минимальный заказ 1000₽. Доставка занимает 45-60 минут. Сделать заказ можно прямо здесь.' },
      { question: 'Есть ли вегетарианские блюда?', answer: 'Да, у нас есть специальное вегетарианское меню. Могу порекомендовать несколько позиций. Есть ли у вас аллергия?' },
      { question: 'Какие способы оплаты?', answer: 'Мы принимаем наличные, банковские карты и СБП. Оплату можно произвести при получении или при оформлении заказа.' },
    ],
    en: [
      { question: 'How to reserve a table?', answer: 'Tell me the date, time, and number of guests. I\'ll find the best table for you!' },
      { question: 'Do you deliver?', answer: 'Yes, we do! Minimum order is $15. Delivery takes 45-60 minutes. You can order right here.' },
      { question: 'Do you have vegetarian options?', answer: 'Yes, we have a special vegetarian menu. I can recommend some dishes. Do you have any allergies?' },
      { question: 'What payment methods do you accept?', answer: 'We accept cash, bank cards, and mobile payments. You can pay on delivery or when placing an order.' },
    ],
    tr: [
      { question: 'Masa nasıl rezerve edebilirim?', answer: 'Tarih, saat ve misafir sayısını söyleyin. Size en iyi masayı bulayım!' },
      { question: 'Teslimat yapıyor musunuz?', answer: 'Evet! Minimum sipariş 200₺. Teslimat 45-60 dakika sürer. Buradan sipariş verebilirsiniz.' },
      { question: 'Vejetaryen seçenekleriniz var mı?', answer: 'Evet, özel vejetaryen menümüz var. Birkaç yemek önerebilirim. Herhangi bir alerjiniz var mı?' },
      { question: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', answer: 'Nakit, banka kartları ve mobil ödeme kabul ediyoruz. Teslimatta veya sipariş sırasında ödeme yapabilirsiniz.' },
    ],
  },
  'real-estate': {
    ru: [
      { question: 'Какие объекты у вас есть?', answer: 'У нас большой выбор: квартиры, дома, коммерческая недвижимость. Какой тип и в каком районе вас интересует?' },
      { question: 'Как записаться на показ?', answer: 'Напишите удобную дату и время — я организую показ объекта. Несколько объектов можно посмотреть за одну поездку.' },
      { question: 'Помогаете ли с ипотекой?', answer: 'Да! У нас есть партнёры-банки с льготными условиями. Запишитесь на бесплатную консультацию по ипотеке.' },
    ],
    en: [
      { question: 'What properties do you have?', answer: 'We have a wide selection: apartments, houses, commercial properties. What type and area are you interested in?' },
      { question: 'How to schedule a viewing?', answer: 'Tell me a convenient date and time — I\'ll arrange a property viewing. You can see multiple properties in one trip.' },
      { question: 'Do you help with mortgages?', answer: 'Yes! We partner with banks offering preferential terms. Book a free mortgage consultation.' },
    ],
    tr: [
      { question: 'Hangi mülkleriniz var?', answer: 'Geniş bir seçeneğimiz var: daireler, evler, ticari mülkler. Hangi tip ve bölge ilginizi çekiyor?' },
      { question: 'Gösterim için nasıl randevu alabilirim?', answer: 'Uygun tarih ve saati söyleyin — gayrimenkul gösterimi ayarlayayım. Bir seferde birden fazla mülk görebilirsiniz.' },
      { question: 'İpotek konusunda yardımcı oluyor musunuz?', answer: 'Evet! Özel koşullar sunan bankalarla işbirliği yapıyoruz. Ücretsiz ipotek danışmanlığı için randevu alın.' },
    ],
  },
  education: {
    ru: [
      { question: 'Какие курсы есть?', answer: 'У нас есть курсы по программированию, дизайну, маркетингу, иностранным языкам. Какое направление вас интересует?' },
      { question: 'Можно записаться на пробный урок?', answer: 'Конечно! Запишитесь прямо здесь — пробный урок бесплатный. Какое направление вам ближе?' },
      { question: 'Выдаёте ли вы сертификат?', answer: 'Да, после окончания курса вы получаете сертификат. Он признаётся работодателями-партнёрами.' },
    ],
    en: [
      { question: 'What courses do you offer?', answer: 'We offer courses in programming, design, marketing, and foreign languages. Which field interests you?' },
      { question: 'Can I book a trial lesson?', answer: 'Of course! Book right here — trial lessons are free. Which field are you most interested in?' },
      { question: 'Do you provide certificates?', answer: 'Yes, you receive a certificate upon course completion. It\'s recognized by our partner employers.' },
    ],
    tr: [
      { question: 'Hangi kurslarınız var?', answer: 'Programlama, tasarım, pazarlama ve yabancı diller kurslarımız var. Hangi alan ilginizi çekiyor?' },
      { question: 'Deneme dersine kayıt olabilir miyim?', answer: 'Elbette! Buradan kaydolun — deneme dersleri ücretsiz. Hangi alan size daha yakın?' },
      { question: 'Sertifika veriyor musunuz?', answer: 'Evet, kurs tamamlandıktan sonra sertifika alırsınız. İş ortağı işverenler tarafından tanınır.' },
    ],
  },
  fitness: {
    ru: [
      { question: 'Какие абонементы есть?', answer: 'У нас месячные (от 3000₽), квартальные (от 8000₽) и годовые (от 25000₽) абонементы. Также есть разовые посещения за 500₽.' },
      { question: 'Какое расписание групп?', answer: 'Расписание зависит от дня недели. У нас йога, пилатес, кроссфит и танцы. Какое направление интересует?' },
      { question: 'Есть ли персональный тренер?', answer: 'Да! Персональная тренировка — от 2000₽ за занятие. Запишитесь на пробную тренировку!' },
    ],
    en: [
      { question: 'What memberships do you have?', answer: 'Monthly (from $50), quarterly (from $120), and annual (from $400). Single visits are also available for $10.' },
      { question: 'What\'s the group schedule?', answer: 'The schedule varies by day. We offer yoga, pilates, crossfit, and dance classes. What are you interested in?' },
      { question: 'Do you have personal trainers?', answer: 'Yes! Personal training starts at $35 per session. Book a trial session!' },
    ],
    tr: [
      { question: 'Hangi üyelikleriniz var?', answer: 'Aylık (1000₺\'den), üç aylık (2500₺\'den) ve yıllık (8000₺\'den) üyeliklerimiz var. Tek seans da 200₺.' },
      { question: 'Grup programı nasıl?', answer: 'Program güne göre değişir. Yoga, pilates, crossfit ve dans derslerimiz var. Ne ilginizi çekiyor?' },
      { question: 'Kişisel antrenör var mı?', answer: 'Evet! Kişisel antrenman seans başına 700₺\'den başlar. Deneme antrenmanı için randevu alın!' },
    ],
  },
  consulting: {
    ru: [
      { question: 'Какие услуги вы оказываете?', answer: 'Мы предоставляем бизнес-консультации, юридическую помощь, бухгалтерские и аудиторские услуги. Какой вопрос вас интересует?' },
      { question: 'Сколько стоит консультация?', answer: 'Первичная консультация — бесплатная (30 минут). Далее — от 5000₽/час в зависимости от тематики.' },
      { question: 'Как записаться на консультацию?', answer: 'Напишите удобную дату и кратко опишите вашу ситуацию. Я подберу подходящего специалиста и время.' },
    ],
    en: [
      { question: 'What services do you provide?', answer: 'We offer business consulting, legal assistance, accounting, and audit services. What question do you have?' },
      { question: 'How much does a consultation cost?', answer: 'Initial consultation is free (30 minutes). After that, from $80/hour depending on the topic.' },
      { question: 'How to book a consultation?', answer: 'Tell me your preferred date and briefly describe your situation. I\'ll find the right specialist and time.' },
    ],
    tr: [
      { question: 'Hangi hizmetleri sunuyorsunuz?', answer: 'İş danışmanlığı, hukuki yardım, muhasebe ve denetim hizmetleri sunuyoruz. Hangi sorunuz var?' },
      { question: 'Danışmanlık ne kadar?', answer: 'İlk danışmanlık ücretsiz (30 dakika). Sonrasında konuya göre saat 1500₺\'den başlar.' },
      { question: 'Danışmanlık için nasıl randevu alabilirim?', answer: 'Uygun tarihinizi ve durumunuzu kısaca açıklayın. Uygun uzman ve saat bulayım.' },
    ],
  },
  ecommerce: {
    ru: [
      { question: 'Как оформить заказ?', answer: 'Расскажите, какой товар вас интересует. Я проверю наличие и оформлю заказ. Доставка 2-5 дней.' },
      { question: 'Как узнать статус заказа?', answer: 'Напишите номер вашего заказа, и я проверю статус. Обычно доступно: принят, в обработке, отправлен, доставлен.' },
      { question: 'Можно ли вернуть товар?', answer: 'Да, возврат в течение 14 дней при сохранении упаковки и товарного вида. Помогу оформить возврат.' },
    ],
    en: [
      { question: 'How to place an order?', answer: 'Tell me which product you\'re interested in. I\'ll check availability and place the order. Delivery takes 2-5 days.' },
      { question: 'How to check order status?', answer: 'Share your order number and I\'ll check the status. Typical stages: received, processing, shipped, delivered.' },
      { question: 'Can I return a product?', answer: 'Yes, returns within 14 days if packaging and condition are preserved. I can help process a return.' },
    ],
    tr: [
      { question: 'Sipariş nasıl verilir?', answer: 'Hangi ürün ilginizi çektiğini söyleyin. Stok durumunu kontrol edip siparişi oluşturayım. Teslimat 2-5 gün.' },
      { question: 'Sipariş durumunu nasıl öğrenebilirim?', answer: 'Sipariş numaranızı paylaşın, durumu kontrol edeyim. Tipik aşamalar: alındı, hazırlanıyor, kargoya verildi, teslim edildi.' },
      { question: 'Ürün iade edilebilir mi?', answer: 'Evet, ambalaj ve ürün durumu korunarak 14 gün içinde iade yapılabilir. İade sürecine yardım edebilirim.' },
    ],
  },
};

// ──────────────────────────────────────────────────────────────
// buildNicheAwarePrompt — generates comprehensive system prompts
// ──────────────────────────────────────────────────────────────

function buildNicheAwarePrompt(
  personality: string,
  niche: string,
  botType: BotTypeKey,
  language: 'ru' | 'en' | 'tr',
  tone: string,
  companyName: string,
  botName: string,
): string {
  const lang = language;
  const personalityBase = AI_PERSONALITIES[personality]?.[lang] || AI_PERSONALITIES[personality]?.ru || '';
  const nicheKnowledge = NICHE_KNOWLEDGE[niche]?.[lang] || NICHE_KNOWLEDGE[niche]?.ru || '';

  const companyInfo = companyName
    ? lang === 'ru'
      ? `Ты представляешь компанию «${companyName}».`
      : lang === 'en'
        ? `You represent the company "${companyName}".`
        : `"${companyName}" şirketini temsil ediyorsun.`
    : '';

  const botNameInfo = botName
    ? lang === 'ru'
      ? `Твоё имя: ${botName}.`
      : lang === 'en'
        ? `Your name is ${botName}.`
        : `Adın ${botName}.`
    : '';

  const toneMap: Record<string, Record<string, string>> = {
    formal: {
      ru: 'Общайся формально и уважительно.',
      en: 'Communicate formally and respectfully.',
      tr: 'Resmi ve saygılı bir şekilde iletişim kur.',
    },
    friendly: {
      ru: 'Общайся дружелюбно и тёplo.',
      en: 'Communicate in a warm, friendly manner.',
      tr: 'Sıcak ve dost canlı bir şekilde iletişim kur.',
    },
    professional: {
      ru: 'Общайся профессионально, чётко и по делу.',
      en: 'Communicate professionally, clearly and to the point.',
      tr: 'Profesyonel, net ve konuya odaklı iletişim kur.',
    },
  };

  const toneInstruction = toneMap[tone]?.[lang] || toneMap.friendly[lang];

  let botTypeInstruction = '';
  if (botType === 'ai') {
    botTypeInstruction =
      lang === 'ru'
        ? 'Ты обладаешь полной свободой ответов — отвечай естественно, креативно и полезно на основе своих знаний.'
        : lang === 'en'
          ? 'You have full creative autonomy — respond naturally, creatively, and helpfully based on your knowledge.'
          : 'Tam yaratıcı özgürlüğe sahipsin — bilgilerin temelinde doğal, yaratıcı ve yardımcı şekilde yanıt ver.';
  } else if (botType === 'rule-based') {
    botTypeInstruction =
      lang === 'ru'
        ? 'Строго следуй заданным правилам ответов (FAQ). Если вопрос не совпадает ни с одним правилом — вежливо скажи, что не знаешь ответ, и предложи связаться с оператором.'
        : lang === 'en'
          ? 'Strictly follow the provided FAQ response rules. If the question doesn\'t match any rule, politely say you don\'t know and suggest contacting an operator.'
          : 'Sağlanan FAQ yanıt kurallarına sıkı sıkıya uyun. Soru hiçbir kurala uymuyorsa, nazikçe bilmediğinizi söyleyin ve operatörle iletişim kurmayı önerin.';
  } else if (botType === 'hybrid') {
    botTypeInstruction =
      lang === 'ru'
        ? 'СНАЧАЛА проверь вопрос по правилам FAQ. Если точного совпадения нет — используй свои знания для ответа. Всегда старайся помочь.'
        : lang === 'en'
          ? 'FIRST check the question against the FAQ rules. If there\'s no exact match — use your knowledge to respond. Always try to help.'
          : 'ÖNCE soruyu FAQ kurallarına göre kontrol et. Kesin eşleşme yoksa — bilgilerinle yanıt ver. Her zaman yardım etmeye çalış.';
  }

  const greetingNote = lang === 'ru'
    ? 'Начни разговор с приветственного сообщения.'
    : lang === 'en'
      ? 'Start the conversation with a greeting message.'
      : 'Konuşmaya karşılama mesajı ile başla.';

  const parts = [
    personalityBase,
    companyInfo,
    botNameInfo,
    nicheKnowledge,
    '',
    `## Правила общения:`,
    `- ${toneInstruction}`,
    `- ${botTypeInstruction}`,
    `- ${greetingNote}`,
    lang === 'ru'
      ? '- Отвечай кратко (1-3 предложения), не повторяй вопрос пользователя.'
      : lang === 'en'
        ? '- Respond briefly (1-3 sentences), do not repeat the user\'s question.'
        : '- Kısa yanıt ver (1-3 cümle), kullanıcının sorusunu tekrarlama.',
  ].filter(Boolean);

  return parts.join('\n\n');
}

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

function compressImage(dataUrl: string, maxWidth: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

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
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          try {
            const compressed = await compressImage(reader.result, 200, 0.7);
            updateDraftBot({ avatar: compressed });
          } catch {
            // Fallback: save original if compression fails
            updateDraftBot({ avatar: reader.result });
          }
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

// ──────────────────────────────────────────────────────────────
// Niche-aware auto-personality and greeting mapping
// ──────────────────────────────────────────────────────────────

const NICHE_PERSONALITY_MAP: Record<string, string> = {
  salon: 'friendly',
  medical: 'professional',
  restaurant: 'friendly',
  'real-estate': 'sales',
  education: 'support',
  fitness: 'friendly',
  consulting: 'professional',
  ecommerce: 'sales',
  other: 'friendly',
};

const NICHE_GREETINGS: Record<string, Record<string, string>> = {
  salon: {
    ru: 'Здравствуйте! 👋 Добро пожаловать в наш салон красоты. Чем могу помочь? Записать на стрижку или расскажу об услугах.',
    en: 'Hello! 👋 Welcome to our beauty salon. How can I help? Book a haircut or I\'ll tell you about our services.',
    tr: 'Merhaba! 👋 Güzellik salonumuza hoş geldiniz. Size nasıl yardımcı olabilirim? Saç kesimi için randevu alabilir veya hizmetlerimizi anlatabilirim.',
  },
  medical: {
    ru: 'Здравствуйте! 👋 Медицинский центр к вашим услугам. Записать к врачу или ответить на вопросы по приёму?',
    en: 'Hello! 👋 Our medical center is at your service. Book a doctor or answer questions about your visit?',
    tr: 'Merhaba! 👋 Tıbbi merkezimiz hizmetinizdedir. Doktora randevu alabilir veya ziyaretinizle ilgili soruları yanıtlayabilirim.',
  },
  restaurant: {
    ru: 'Здравствуйте! 👋 Рады видеть вас! Бронировать столик, заказать доставку или подскажу меню?',
    en: 'Hello! 👋 Glad to see you! Reserve a table, order delivery, or let me show you the menu?',
    tr: 'Merhaba! 👋 Sizi görmekten mutluluk! Masa rezervasyonu, teslimat siparişi veya menüyü göstereyim mi?',
  },
  'real-estate': {
    ru: 'Здравствуйте! 👋 Ищете недвижимость? Подскажу доступные объекты или запишу на показ!',
    en: 'Hello! 👋 Looking for a property? I can show available listings or schedule a viewing!',
    tr: 'Merhaba! 👋 Gayrimenkul mü arıyorsunuz? Mevcut listeleri gösterebilir veya gösterim için randevu ayarlayabilirim!',
  },
  education: {
    ru: 'Здравствуйте! 👋 Добро пожаловать! Рассказать о курсах или записать на пробный урок?',
    en: 'Hello! 👋 Welcome! Tell you about our courses or book a trial lesson?',
    tr: 'Merhaba! 👋 Hoş geldiniz! Kurslarımızı anlatayım mı veya deneme dersi için randevu alayım mı?',
  },
  fitness: {
    ru: 'Привет! 💪 Готовы к тренировке? Подскажу расписание, абонементы или запишу на занятие!',
    en: 'Hi! 💪 Ready for a workout? I can help with the schedule, memberships, or book a class!',
    tr: "Merhaba! 💪 Antrenman'a hazır mısınız? Program, üyelikler hakkında bilgi verebilir veya ders için randevu ayarlayabilirim!",
  },
  consulting: {
    ru: 'Здравствуйте! 👋 Чем могу помочь? Записать на консультацию или рассказать об услугах.',
    en: 'Hello! 👋 How can I help? Book a consultation or tell you about our services.',
    tr: 'Merhaba! 👋 Size nasıl yardımcı olabilirim? Danışmanlık için randevu alabilir veya hizmetlerimizi anlatabilirim.',
  },
  ecommerce: {
    ru: 'Здравствуйте! 👋 Добро пожаловать в наш магазин! Помочь с выбором, оформить заказ или уточнить доставку?',
    en: 'Hello! 👋 Welcome to our store! Help with a choice, place an order, or check delivery?',
    tr: 'Merhaba! 👋 Mağazamıza hoş geldiniz! Seçim, sipariş veya teslimat konusunda yardımcı olmamı ister misiniz?',
  },
};

function Step3Behavior({ language }: { language: 'ru' | 'en' | 'tr' }) {
  const { draftBot, updateDraftBot, updateConfig, updateWorkingHours } = useBotBuilderStore();
  const { config } = draftBot;

  // ── Auto-generate system prompt and greeting when entering Step 3 ──
  useEffect(() => {
    const { niche, type, name } = draftBot;
    // Only auto-generate for AI/hybrid bots when system prompt is empty
    if ((type === 'ai' || type === 'hybrid') && !config.systemPrompt && niche) {
      const personality = NICHE_PERSONALITY_MAP[niche] || 'friendly';
      const prompt = buildNicheAwarePrompt(
        personality,
        niche,
        type,
        language,
        config.tone,
        draftBot.appearance.companyName,
        name,
      );
      const greetingUpdates: Record<string, string> = {
        systemPrompt: prompt,
        aiPersonality: personality,
      };
      // Auto-generate greeting if empty
      if (!config.greeting && NICHE_GREETINGS[niche]) {
        greetingUpdates.greeting = NICHE_GREETINGS[niche][language] || NICHE_GREETINGS[niche].ru;
      }
      updateConfig(greetingUpdates);
    }
    // Also auto-generate greeting for rule-based bots if empty
    if (type === 'rule-based' && !config.greeting && niche && NICHE_GREETINGS[niche]) {
      updateConfig({ greeting: NICHE_GREETINGS[niche][language] || NICHE_GREETINGS[niche].ru });
    }
  }, []);

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

          {/* Personality Presets — AI bots */}
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
                      const prompt = buildNicheAwarePrompt(
                        preset.key,
                        draftBot.niche,
                        draftBot.type,
                        language,
                        config.tone,
                        draftBot.appearance.companyName,
                        draftBot.name,
                      );
                      updateConfig({
                        aiPersonality: preset.key,
                        systemPrompt: prompt,
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
              {draftBot.niche && (
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? `✨ Пресеты адаптированы под нишу «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}»`
                    : language === 'en'
                      ? `✨ Presets adapted for the "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" niche`
                      : `✨ Presetler "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" nişine uyarlandı`}
                </p>
              )}
            </div>
          )}

          {/* Hybrid bots: FAQ-first + AI personality */}
          {draftBot.type === 'hybrid' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <GitMerge className="size-4 text-violet-500" />
                {language === 'ru'
                  ? 'Гибридный режим: FAQ + AI'
                  : language === 'en'
                    ? 'Hybrid mode: FAQ + AI'
                    : 'Hibrit mod: FAQ + AI'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ru'
                  ? 'Бот сначала ищет ответ в FAQ. Если совпадения нет — AI отвечает самостоятельно.'
                  : language === 'en'
                    ? 'The bot first checks FAQ for a match. If no match is found, AI responds independently.'
                    : 'Bot önce FAQ\'da eşleşme arar. Eşleşme yoksa AI bağımsız olarak yanıt verir.'}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PERSONALITY_PRESETS.map((preset) => (
                  <Card
                    key={preset.key}
                    className={`cursor-pointer transition-all hover:shadow-sm ${
                      config.aiPersonality === preset.key
                        ? 'border-violet-500 ring-2 ring-violet-500/20 bg-violet-50/50 dark:bg-violet-950/20'
                        : 'hover:border-muted-foreground/30'
                    }`}
                    onClick={() => {
                      const prompt = buildNicheAwarePrompt(
                        preset.key,
                        draftBot.niche,
                        draftBot.type,
                        language,
                        config.tone,
                        draftBot.appearance.companyName,
                        draftBot.name,
                      );
                      updateConfig({
                        aiPersonality: preset.key,
                        systemPrompt: prompt,
                      });
                    }}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <span className="text-xl">{preset.emoji}</span>
                      <span className="text-sm font-medium">{preset.label[language] || preset.label.ru}</span>
                      {config.aiPersonality === preset.key && (
                        <Check className="size-4 text-violet-600 dark:text-violet-400 ml-auto shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              {draftBot.niche && (
                <p className="text-xs text-muted-foreground">
                  {language === 'ru'
                    ? `✨ Пресеты адаптированы под нишу «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}» (режим: сначала FAQ, затем AI)`
                    : language === 'en'
                      ? `✨ Presets adapted for the "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" niche (mode: FAQ first, then AI)`
                      : `✨ Presetler "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" nişine uyarlandı (mod: önce FAQ, sonra AI)`}
                </p>
              )}
            </div>
          )}

          {/* Rule-based bots: Response Rules instead of personality presets */}
          {draftBot.type === 'rule-based' && (
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Code2 className="size-4 text-amber-500" />
                {language === 'ru'
                  ? 'Правила ответов'
                  : language === 'en'
                    ? 'Response Rules'
                    : 'Yanıt Kuralları'}
              </Label>
              <p className="text-xs text-muted-foreground">
                {language === 'ru'
                  ? 'Для ботов на правилах персональность настраивается через FAQ. Выберите нишу (шаг 2), чтобы получить готовые правила ответов.'
                  : language === 'en'
                    ? 'For rule-based bots, personality is configured through FAQ. Select a niche (step 2) to get pre-filled response rules.'
                    : 'Kural tabanlı botlar için kişilik FAQ üzerinden yapılandırılır. Hazır yanıt kuralları için niş seçin (adım 2).'}
              </p>
              {draftBot.niche && NICHE_RULES_TEMPLATES[draftBot.niche] && (
                <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                        {language === 'ru'
                          ? `📋 Готовые правила для «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}»`
                          : language === 'en'
                            ? `📋 Pre-filled rules for "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}"`
                            : `📋 "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" için hazır kurallar`}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => {
                          const rules = NICHE_RULES_TEMPLATES[draftBot.niche]?.[language] || NICHE_RULES_TEMPLATES[draftBot.niche]?.ru || [];
                          updateConfig({ faq: rules });
                          toast.success(
                            language === 'ru'
                              ? 'Правила ответов загружены в FAQ'
                              : language === 'en'
                                ? 'Response rules loaded into FAQ'
                                : 'Yanıt kuralları FAQ\'ya yüklendi'
                          );
                        }}
                      >
                        <Zap className="size-3" />
                        {language === 'ru'
                          ? 'Загрузить в FAQ'
                          : language === 'en'
                            ? 'Load to FAQ'
                            : "FAQ'ya yükle"}
                      </Button>
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {(NICHE_RULES_TEMPLATES[draftBot.niche]?.[language] || NICHE_RULES_TEMPLATES[draftBot.niche]?.ru || []).map((rule, i) => (
                        <div key={i} className="rounded-lg border bg-background p-2.5">
                          <p className="text-xs font-medium text-foreground">Q: {rule.question}</p>
                          <p className="text-xs text-muted-foreground mt-1">A: {rule.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              {!draftBot.niche && (
                <p className="text-xs text-muted-foreground italic">
                  {language === 'ru'
                    ? '← Выберите нишу на шаге 2, чтобы увидеть готовые правила'
                    : language === 'en'
                      ? '← Select a niche in step 2 to see pre-filled rules'
                      : '← Hazır kuralları görmek için adım 2\'de niş seçin'}
                </p>
              )}
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
  const botType = draftBot.type;
  const { features, faq, services } = draftBot.config;

  // ── Auto-set feature defaults when bot type changes ──
  const lastAutoSetType = useRef<string | null>(null);

  useEffect(() => {
    if (lastAutoSetType.current === botType) return;
    lastAutoSetType.current = botType;

    if (botType === 'ai') {
      updateFeatures({ booking: false, services: true, faq: false, operatorTransfer: false, contactCollection: false });
      updateConfig({
        aiCapabilities: { autoQA: true, intentRecognition: true, leadCapture: true, personalization: true, operatorEscalation: false },
      });
    } else if (botType === 'rule-based') {
      updateFeatures({ booking: true, services: true, faq: true, operatorTransfer: false, contactCollection: true });
    } else if (botType === 'hybrid') {
      updateFeatures({ booking: true, services: true, faq: true, operatorTransfer: false, contactCollection: false });
      updateConfig({
        aiCapabilities: { autoQA: true, intentRecognition: false, leadCapture: true, personalization: false, operatorEscalation: false },
      });
    }
  }, [botType]);

  // ── Auto-load FAQ from niche template for rule-based bots on first mount ──
  const faqAutoLoadedRef = useRef(false);
  useEffect(() => {
    if (faqAutoLoadedRef.current) return;
    if (botType === 'rule-based' && draftBot.niche && faq.length === 0) {
      const rules = NICHE_RULES_TEMPLATES[draftBot.niche]?.[language] || NICHE_RULES_TEMPLATES[draftBot.niche]?.ru || [];
      if (rules.length > 0) {
        updateConfig({ faq: rules });
        faqAutoLoadedRef.current = true;
      }
    }
  }, [botType, draftBot.niche, faq.length]);

  // ── Toggle helpers ──
  const toggleFeature = useCallback(
    (key: string, value: boolean) => {
      updateFeatures({ [key]: value } as Record<string, boolean>);
    },
    [updateFeatures]
  );

  const toggleAiCapability = useCallback(
    (key: string, value: boolean) => {
      updateConfig({
        aiCapabilities: { ...draftBot.config.aiCapabilities, [key]: value },
      });
    },
    [updateConfig, draftBot.config.aiCapabilities]
  );

  // ── FAQ management ──
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

  // ── Services management ──
  const [serviceName, setServiceName] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDuration, setServiceDuration] = useState('');

  const addServiceItem = useCallback(() => {
    if (serviceName.trim() && servicePrice) {
      updateConfig({
        services: [
          ...services,
          { name: serviceName.trim(), price: parseFloat(servicePrice) || 0, duration: parseInt(serviceDuration) || 60, description: '' },
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

  // ── Color theme per bot type ──
  const themeColors = {
    ai: {
      border: 'border-emerald-200 dark:border-emerald-800',
      bg: 'bg-emerald-50/30 dark:bg-emerald-950/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      accentIcon: 'text-emerald-500',
      noteBorder: 'border-emerald-200 dark:border-emerald-800',
      noteBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      noteText: 'text-emerald-800 dark:text-emerald-200',
      badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    'rule-based': {
      border: 'border-amber-200 dark:border-amber-800',
      bg: 'bg-amber-50/30 dark:bg-amber-950/20',
      iconBg: 'bg-amber-100 dark:bg-amber-950',
      iconColor: 'text-amber-600 dark:text-amber-400',
      accentIcon: 'text-amber-500',
      noteBorder: 'border-amber-200 dark:border-amber-800',
      noteBg: 'bg-amber-50 dark:bg-amber-950/30',
      noteText: 'text-amber-800 dark:text-amber-200',
      badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
      btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
    },
    hybrid: {
      border: 'border-violet-200 dark:border-violet-800',
      bg: 'bg-violet-50/30 dark:bg-violet-950/20',
      iconBg: 'bg-violet-100 dark:bg-violet-950',
      iconColor: 'text-violet-600 dark:text-violet-400',
      accentIcon: 'text-violet-500',
      noteBorder: 'border-violet-200 dark:border-violet-800',
      noteBg: 'bg-violet-50 dark:bg-violet-950/30',
      noteText: 'text-violet-800 dark:text-violet-200',
      badge: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
      btnClass: 'bg-violet-600 hover:bg-violet-700 text-white',
    },
  };

  const tc = themeColors[botType];

  // ── Feature descriptions (trilingual) ──
  const aiCapDescriptions: Record<string, Record<string, string>> = {
    autoQA: {
      ru: 'AI отвечает на все вопросы автоматически',
      en: 'AI answers all questions automatically',
      tr: 'AI tüm soruları otomatik olarak yanıtlar',
    },
    intentRecognition: {
      ru: 'AI распознаёт намерения клиента',
      en: 'AI recognizes customer intent',
      tr: 'AI müşteri niyetini tanır',
    },
    leadCapture: {
      ru: 'AI собирает имя и телефон в разговоре',
      en: 'AI collects name and phone during conversation',
      tr: 'AI sohbet sırasında ad ve telefon toplar',
    },
    personalization: {
      ru: 'AI запоминает контекст беседы',
      en: 'AI remembers conversation context',
      tr: 'AI görüşme bağlamını hatırlar',
    },
    operatorEscalation: {
      ru: 'Переключение на живого оператора при сложных вопросах',
      en: 'Switch to live operator for complex questions',
      tr: 'Karmaşık sorularda canlı operatöre geçiş',
    },
  };

  const ruleFeatureDescriptions: Record<string, Record<string, string>> = {
    faq: {
      ru: 'Ответы по заранее заданным вопросам и ответам',
      en: 'Answers based on pre-configured Q&A',
      tr: 'Önceden yapılandırılmış soru ve cevaplara göre yanıtlar',
    },
    services: {
      ru: 'Показ списка услуг с ценами',
      en: 'Display list of services with prices',
      tr: 'Fiyatlarla hizmet listesi göster',
    },
    booking: {
      ru: 'Онлайн-запись на услуги',
      en: 'Online booking for services',
      tr: 'Hizmetler için çevrimiçi randevu',
    },
    contactCollection: {
      ru: 'Сбор контактов клиента',
      en: 'Collect customer contacts',
      tr: 'Müşteri iletişim bilgileri toplama',
    },
    operatorTransfer: {
      ru: 'Перевод на оператора',
      en: 'Transfer to operator',
      tr: 'Operatöre aktarım',
    },
  };

  const hybridFeatureDescriptions: Record<string, Record<string, string>> = {
    faq: {
      ru: 'Сначала проверяет FAQ, потом AI',
      en: 'Checks FAQ first, then AI',
      tr: 'Önce FAQ\'yi kontrol eder, sonra AI',
    },
    services: {
      ru: 'Показ списка услуг с ценами',
      en: 'Display list of services with prices',
      tr: 'Fiyatlarla hizmet listesi göster',
    },
    booking: {
      ru: 'Онлайн-запись на услуги',
      en: 'Online booking for services',
      tr: 'Hizmetler için çevrimiçi randevu',
    },
    operatorTransfer: {
      ru: 'Перевод на оператора при сложных вопросах',
      en: 'Transfer to operator for complex questions',
      tr: 'Karmaşık sorularda operatöre aktarım',
    },
  };

  // ── Determine which features to display per type ──
  const showAiCapabilities = botType === 'ai' || botType === 'hybrid';
  const showRegularFeatures = botType === 'rule-based' || botType === 'hybrid';
  const showFaqEditor = botType !== 'ai' && features.faq;
  const showServicesEditor = botType === 'ai' ? true : features.services;

  // For AI bots show all 5 capabilities; for hybrid show 3 key ones
  const visibleAiCaps = botType === 'ai'
    ? AI_CAPABILITIES_CONFIG
    : AI_CAPABILITIES_CONFIG.filter((c) => ['autoQA', 'leadCapture', 'operatorEscalation'].includes(c.key));

  // For rule-based: faq, services, booking, contactCollection, operatorTransfer
  // For hybrid: faq, services, booking, operatorTransfer
  const regularFeatureKeys = botType === 'rule-based'
    ? ['faq', 'services', 'booking', 'contactCollection', 'operatorTransfer']
    : ['faq', 'services', 'booking', 'operatorTransfer'];

  // Trilingual section header descriptions
  const sectionSubtitles: Record<string, Record<string, string>> = {
    ai: {
      ru: 'Настройте AI-возможности вашего агента',
      en: 'Configure your AI agent capabilities',
      tr: 'AI ajan yeteneklerinizi yapılandırın',
    },
    'rule-based': {
      ru: 'Настройте функции чат-бота',
      en: 'Configure chatbot features',
      tr: 'Chatbot özelliklerini yapılandırın',
    },
    hybrid: {
      ru: 'Настройте гибридные функции — FAQ + AI',
      en: 'Configure hybrid features — FAQ + AI',
      tr: 'Hibrit özellikleri yapılandırın — FAQ + AI',
    },
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">{t('botBuilder.step4Title', language)}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {sectionSubtitles[botType]?.[language] || sectionSubtitles[botType]?.ru}
        </p>
      </div>

      {/* ─── Contextual banner per type + niche ─── */}
      {draftBot.niche && (
        <div className={`flex items-start gap-2 rounded-lg border ${tc.noteBorder} ${tc.noteBg} px-3 py-2.5`}>
          {botType === 'ai' && <Brain className={`size-4 shrink-0 mt-0.5 ${tc.accentIcon}`} />}
          {botType === 'rule-based' && <Code2 className={`size-4 shrink-0 mt-0.5 ${tc.accentIcon}`} />}
          {botType === 'hybrid' && <GitMerge className={`size-4 shrink-0 mt-0.5 ${tc.accentIcon}`} />}
          <p className={`text-xs ${tc.noteText}`}>
            {botType === 'ai' && (
              <>
                {language === 'ru'
                  ? `AI-агент для ниши «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}» отвечает на все вопросы самостоятельно, используя знания ниши. Услуги можно добавить вручную.`
                  : language === 'en'
                    ? `AI agent for the "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" niche answers all questions autonomously using niche knowledge. Services can be added manually.`
                    : `"${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" nişi için AI ajan tüm soruları niş bilgilerini kullanarak bağımsız olarak yanıtlar. Hizmetler manuel olarak eklenebilir.`}
              </>
            )}
            {botType === 'rule-based' && (
              <>
                {language === 'ru'
                  ? `Бот для ниши «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}» отвечает строго по загруженным FAQ. Готовые вопросы уже загружены — отредактируйте их под ваш бизнес.`
                  : language === 'en'
                    ? `Bot for the "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" niche responds strictly from loaded FAQ. Pre-filled questions are already loaded — edit them for your business.`
                    : `"${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" nişi için bot yalnızca yüklenen FAQ'dan yanıt verir. Hazır sorular zaten yüklendi — işletmenize göre düzenleyin.`}
              </>
            )}
            {botType === 'hybrid' && (
              <>
                {language === 'ru'
                  ? `Гибридный бот для ниши «${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}» — сначала ищет ответ в FAQ, затем AI. Настройте оба компонента.`
                  : language === 'en'
                    ? `Hybrid bot for the "${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" niche — checks FAQ first, then AI. Configure both components.`
                    : `"${t(`botBuilder.${draftBot.niche === 'real-estate' ? 'realEstate' : draftBot.niche}`, language)}" nişi için hibrit bot — önce FAQ'yi kontrol eder, sonra AI. Her iki bileşeni de yapılandırın.`}
              </>
            )}
          </p>
        </div>
      )}

      {/* ─── AI Capabilities (AI & Hybrid) ─── */}
      {showAiCapabilities && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className={`size-4 ${tc.accentIcon}`} />
            <Label className="text-sm font-semibold">
              {language === 'ru' ? 'AI Возможности' : language === 'en' ? 'AI Capabilities' : 'AI Yetenekleri'}
            </Label>
            {botType === 'hybrid' && (
              <Badge variant="outline" className={tc.badge}>
                {language === 'ru' ? 'Дополнение' : language === 'en' ? 'Supplement' : 'Ek'}
              </Badge>
            )}
          </div>
          {visibleAiCaps.map((cap) => {
            const Icon = cap.icon;
            const isEnabled = draftBot.config.aiCapabilities[cap.key];
            const desc = aiCapDescriptions[cap.key]?.[language] || aiCapDescriptions[cap.key]?.ru;
            return (
              <Card
                key={cap.key}
                className={`transition-all ${isEnabled ? `${tc.border} ${tc.bg}` : ''}`}
              >
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${isEnabled ? tc.iconBg : 'bg-muted'}`}>
                        <Icon className={`size-4 ${isEnabled ? tc.iconColor : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-sm font-medium">{cap.labelKey[language] || cap.labelKey.ru}</span>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleAiCapability(cap.key, checked)}
                    />
                  </div>
                  {desc && (
                    <p className="text-xs text-muted-foreground pl-12">{desc}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Separator between AI caps and regular features for hybrid */}
      {botType === 'hybrid' && showAiCapabilities && showRegularFeatures && <Separator />}

      {/* ─── Regular Feature Toggles (Rule-based & Hybrid) ─── */}
      {showRegularFeatures && (
        <div className="space-y-3">
          {botType === 'hybrid' && (
            <div className="flex items-center gap-2">
              <Sparkles className={`size-4 ${tc.accentIcon}`} />
              <Label className="text-sm font-semibold">
                {language === 'ru' ? 'Функции' : language === 'en' ? 'Features' : 'Özellikler'}
              </Label>
            </div>
          )}
          {regularFeatureKeys.map((fKey) => {
            const featureDef = FEATURES_CONFIG.find((f) => f.key === fKey);
            if (!featureDef) return null;
            const Icon = featureDef.icon;
            const isEnabled = features[fKey as keyof typeof features] as boolean;
            const descriptions = botType === 'rule-based' ? ruleFeatureDescriptions : hybridFeatureDescriptions;
            const desc = descriptions[fKey]?.[language] || descriptions[fKey]?.ru;
            return (
              <Card
                key={fKey}
                className={`transition-all ${isEnabled ? `${tc.border} ${tc.bg}` : ''}`}
              >
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${isEnabled ? tc.iconBg : 'bg-muted'}`}>
                        <Icon className={`size-4 ${isEnabled ? tc.iconColor : 'text-muted-foreground'}`} />
                      </div>
                      <span className="text-sm font-medium">{t(`botBuilder.${featureDef.labelKey}`, language)}</span>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleFeature(fKey, checked)}
                    />
                  </div>
                  {desc && (
                    <p className="text-xs text-muted-foreground pl-12">{desc}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── FAQ Editor (Rule-based & Hybrid only) ─── */}
      {showFaqEditor && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <HelpCircle className={`size-4 ${tc.accentIcon}`} />
            {language === 'ru' ? 'FAQ — Вопросы и ответы' : language === 'en' ? 'FAQ — Questions & Answers' : 'FAQ — Sorular ve Cevaplar'}
          </Label>

          {/* Add FAQ Form */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <Input
                value={faqQuestion}
                onChange={(e) => setFaqQuestion(e.target.value)}
                placeholder={language === 'ru' ? 'Вопрос клиента...' : language === 'en' ? 'Customer question...' : 'Müşteri sorusu...'}
                className="h-9"
              />
              <Textarea
                value={faqAnswer}
                onChange={(e) => setFaqAnswer(e.target.value)}
                placeholder={language === 'ru' ? 'Ответ бота...' : language === 'en' ? 'Bot answer...' : 'Bot yanıtı...'}
                className="min-h-[60px] resize-y"
              />
              <Button
                type="button"
                onClick={addFaqItem}
                disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                size="sm"
                className={tc.btnClass}
              >
                <Plus className="size-4 mr-1" />
                {language === 'ru' ? 'Добавить' : language === 'en' ? 'Add' : 'Ekle'}
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
              {language === 'ru'
                ? 'Пока нет вопросов. Добавьте первый FAQ.'
                : language === 'en'
                  ? 'No questions yet. Add the first FAQ item.'
                  : 'Henüz soru yok. İlk FAQ öğesini ekleyin.'}
            </p>
          )}
        </div>
      )}

      {/* ─── Services Editor (all types — always for AI, toggle-gated for others) ─── */}
      {showServicesEditor && (
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Scissors className={`size-4 ${botType === 'ai' ? 'text-emerald-500' : botType === 'rule-based' ? 'text-amber-500' : 'text-violet-500'}`} />
            {language === 'ru' ? 'Услуги и цены' : language === 'en' ? 'Services & Pricing' : 'Hizmetler ve Fiyatlar'}
          </Label>

          {/* Add Service Form */}
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <Input
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder={language === 'ru' ? 'Название услуги...' : language === 'en' ? 'Service name...' : 'Hizmet adı...'}
                className="h-9"
              />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Цена (₽)' : language === 'en' ? 'Price' : 'Fiyat'}
                  </Label>
                  <Input
                    type="number"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    placeholder="1000"
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Длительность (мин.)' : language === 'en' ? 'Duration (min)' : 'Süre (dk)'}
                  </Label>
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
                className={tc.btnClass}
              >
                <Plus className="size-4 mr-1" />
                {language === 'ru' ? 'Добавить' : language === 'en' ? 'Add' : 'Ekle'}
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
                        {item.price}₽ · {item.duration} {language === 'ru' ? 'мин.' : language === 'en' ? 'min.' : 'dk.'}
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
              {language === 'ru'
                ? 'Пока нет услуг. Добавьте первую.'
                : language === 'en'
                  ? 'No services yet. Add the first one.'
                  : 'Henüz hizmet yok. İlk hizmeti ekleyin.'}
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
            // Auto-set selectedBotId if user has bots but none is selected
            // This ensures conversations from dashboard preview are saved to DB
            if (bots.length > 0 && !useAppStore.getState().selectedBotId) {
              useAppStore.getState().setSelectedBot(bots[0].id);
            }
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

      const data = await res.json();
      // Persist the new bot ID so the preview can use it for saving conversations
      if (data.bot?.id) {
        useAppStore.getState().setSelectedBot(data.bot.id);
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
