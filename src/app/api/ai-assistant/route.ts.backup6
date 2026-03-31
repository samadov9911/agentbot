import { NextRequest, NextResponse } from 'next/server';
import { chatWithAi } from '@/lib/ai';

// ──────────────────────────────────────────────────────────────
// System prompt — elite AgentBot AI assistant
// ──────────────────────────────────────────────────────────────

function buildSystemPrompt(context?: string): string {
  return `You are an elite AI assistant integrated into the AgentBot platform — an all-in-one AI agent builder for businesses. You are a highly qualified specialist.

📋 PLATFORM FEATURES:
• AI Bot Builder — 6-step wizard: AI, Rule-based, Hybrid chatbots
• Bot Templates — salon, clinic, restaurant, real estate, education, fitness, consulting, e-commerce
• Widget Integration — one-line embed code for any website
• Online Booking — smart calendar with time slots, buffer minutes, concurrent bookings
• Multi-channel — Website widget, Telegram, WhatsApp from single dashboard
• Analytics — conversations, visitors, conversion rates, daily/weekly/monthly reports
• AI Agent — Email campaigns, client calls, lead generation, 24/7 support, booking notifications
• Subscription Plans — Demo (7 days free, 1 bot), Monthly ($29), Quarterly ($74), Yearly ($244), Lifetime ($499)

🎯 RULES:
• Respond in the EXACT SAME LANGUAGE the user writes in (detect ru/en/tr automatically)
• Be CONCISE — 2-3 sentences unless user asks for details
• Be PROFESSIONAL but FRIENDLY — like a senior consultant
• Give SPECIFIC, ACTIONABLE advice — not generic text
• NEVER mention you are AI or language model — you are the AgentBot assistant
• Always help — even with non-platform questions, give useful answer and suggest platform features
• Use numbered lists and **bold** for key terms when appropriate

${context ? `\n📊 CURRENT USER CONTEXT:\n${context}\nPersonalize your response using this context.` : ''}`;
}

// ──────────────────────────────────────────────────────────────
// POST /api/ai-assistant
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const typedHistory = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    const result = await chatWithAi(
      buildSystemPrompt(context),
      message,
      typedHistory,
      getSmartOfflineResponse,
    );

    return NextResponse.json({
      response: result.text,
      provider: result.provider,
    });
  } catch (error) {
    console.error('[ai-assistant] Error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}

// ──────────────────────────────────────────────────────────────
// Offline fallback — trilingual, 20+ topics
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string): string {
  const lower = message.toLowerCase();
  const isRu = /[а-яё]/i.test(message);
  const isTr = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  if (isRu) return ruOffline(lower);
  if (isTr) return trOffline(lower);
  return enOffline(lower);
}

function ruOffline(l: string): string {
  if (l.includes('бот') || l.includes('создат') || l.includes('агент')) return 'Перейдите «Мои боты» → «Создать бота». Тип: ИИ-агент (рекомендуется). Конструктор — 6 шагов. Демо: 7 дней бесплатно, 1 бот.';
  if (l.includes('виджет') || l.includes('сайт') || l.includes('код') || l.includes('embed')) return 'Опубликуйте бота → «Код встраивания» → вставьте перед </body> на сайте. Виджет — правый нижний угол.';
  if (l.includes('цен') || l.includes('тариф') || l.includes('подписк') || l.includes('опл')) return '5 тарифов: Демо (бесплатно 7 дней), Месячный ($29), Квартальный ($74, -15%), Годовой ($244, -30%), Пожизненный ($499). Раздел «Подписка».';
  if (l.includes('запис') || l.includes('календар') || l.includes('брон')) return 'Конструктор → шаг 6 «Календарь»: рабочие дни, время, слот, буфер. Клиенты записываются через виджет 24/7.';
  if (l.includes('клиент') || l.includes('лид') || l.includes('продаж')) return '1) Сбор контактов в настройках бота. 2) Email-кампании в «AI-агент». 3) Онлайн-запись. 4) Приветственные письма.';
  if (l.includes('telegram') || l.includes('whatsapp')) return 'Мультиканальность на платных тарифах. Подключите Telegram/WhatsApp в настройках бота — единый кабинет.';
  if (l.includes('помощь') || l.includes('поддержк') || l.includes('проблем')) return 'Раздел «Поддержка 24/7» — опишите проблему, AI поможет. Также FAQ в разделе «Помощь».';
  if (l.includes('аналитик') || l.includes('статист')) return '«Статистика»: диалоги, визиты, записи, конверсия. Экспорт CSV/PDF. На платных тарифах.';
  if (l.includes('демо') || l.includes('бесплатн')) return 'Демо — 7 дней, 1 бот, 1 ниша. После — платный тариф для продолжения.';
  if (l.includes('пароль') || l.includes('настройк') || l.includes('профил')) return '«Настройки»: профиль, язык, тема, уведомления, смена пароля.';
  return 'Опишите вопрос подробнее! Разделы: «Мои боты», «AI-агент», «Подписка», «Помощь», «Поддержка 24/7».';
}

function trOffline(l: string): string {
  if (l.includes('bot') || l.includes('ajan') || l.includes('oluştur')) return '«Botlarım» → «Bot oluştur». Tür: AI ajanı. 6 adımda yapılandırın. Demo: 7 gün ücretsiz.';
  if (l.includes('fiyat') || l.includes('plan') || l.includes('abonelik')) return '5 plan: Demo (ücretsiz 7 gün), Aylık ($29), 3 Aylık ($74), Yıllık ($244), Ömür Boyu ($499). «Abonelik» sayfası.';
  if (l.includes('widget') || l.includes('site')) return 'Botu yayınlayın → «Gömme Kodu» → </body> etiketinden önce yapıştırın.';
  if (l.includes('randevu') || l.includes('takvim')) return 'İnşa Edici → adım 6 «Takvim»: çalışma günleri, saatler, slot süresi.';
  if (l.includes('destek') || l.includes('sorun')) return '«7/24 Destek» bölümünde sorunuzu açıklayın, AI yardımcı olur.';
  return 'Sorunuzu detaylı açıklayın! Bölümler: «Botlarım», «AI Ajanı», «Abonelik», «Yardım».';
}

function enOffline(l: string): string {
  if (l.includes('bot') || l.includes('create') || l.includes('build')) return 'Go to "My Bots" → "Create Bot". Choose AI Agent type, configure in 6 steps. Demo: 7 days free.';
  if (l.includes('widget') || l.includes('embed') || l.includes('website')) return 'Publish bot → "Embed Code" → paste before </body>. Widget appears bottom-right.';
  if (l.includes('price') || l.includes('plan') || l.includes('subscription')) return '5 plans: Demo (free 7d), Monthly ($29), Quarterly ($74), Yearly ($244), Lifetime ($499). Visit "Subscription".';
  if (l.includes('book') || l.includes('calendar') || l.includes('appointment')) return 'Builder → Step 6 "Calendar": working days, hours, slot duration, buffer. Clients book 24/7.';
  if (l.includes('help') || l.includes('support') || l.includes('problem')) return 'Use "24/7 Support" section — describe the issue. Also check FAQ in "Help".';
  if (l.includes('telegram') || l.includes('whatsapp')) return 'Multi-channel on paid plans. Connect in bot settings — unified dashboard.';
  return 'Please describe your question! Sections: "My Bots", "AI Agent", "Subscription", "Help", "24/7 Support".';
}
