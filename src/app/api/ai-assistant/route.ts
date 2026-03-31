import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ──────────────────────────────────────────────────────────────
// Ensure .z-ai-config exists (required by z-ai-web-dev-sdk)
// On Vercel the file doesn't exist in the deployment,
// so we create it from the Z_AI_CONFIG env variable.
// ──────────────────────────────────────────────────────────────────────

function ensureZaiConfig(): boolean {
  // Check if config already exists in cwd
  const configPath = path.join(process.cwd(), '.z-ai-config');
  if (fs.existsSync(configPath)) return true;

  // Try to create from environment variable
  const configEnv = process.env.Z_AI_CONFIG;
  if (!configEnv) {
    console.warn('[ai-assistant] Z_AI_CONFIG env var not set and .z-ai-config not found');
    return false;
  }

  try {
    // Validate it's valid JSON
    JSON.parse(configEnv);
    fs.writeFileSync(configPath, configEnv, 'utf-8');
    console.log('[ai-assistant] Created .z-ai-config from Z_AI_CONFIG env var');
    return true;
  } catch {
    console.error('[ai-assistant] Z_AI_CONFIG env var contains invalid JSON');
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// Comprehensive system prompt for a highly qualified AI specialist
// ──────────────────────────────────────────────────────────────

function buildSystemPrompt(context?: string): string {
  return `You are an elite AI assistant integrated into the AgentBot platform — an all-in-one AI agent builder for businesses. You are a highly qualified specialist with deep expertise in:

📋 CORE PLATFORM FEATURES:
• AI Bot Builder — 6-step wizard to create AI, Rule-based, and Hybrid chatbots for any business niche
• Bot Templates — Pre-built configurations for salons, clinics, restaurants, real estate, education, fitness, consulting, e-commerce
• Widget Integration — One-line embed code to add chatbot to any website
• Online Booking System — Smart calendar with time slots, buffer minutes, concurrent bookings
• Multi-channel — Website widget, Telegram, WhatsApp from a single dashboard
• Analytics — Conversation stats, visitor tracking, conversion rates, daily/weekly/monthly reports
• AI Agent Capabilities — Email campaigns, client calls, lead generation, 24/7 support, booking notifications, reports
• Subscription Plans — Demo (7 days free), Monthly ($29), Quarterly ($74), Yearly ($244), Lifetime ($499)
• Demo Limits — 1 bot, 1 niche, 1 service during demo period

🎯 YOUR BEHAVIOR:
• Be CONCISE — maximum 2-3 sentences per response unless the user asks for a detailed explanation
• Be PROFESSIONAL but FRIENDLY — like a senior consultant who genuinely wants to help
• Speak the EXACT SAME LANGUAGE as the user — detect Russian, English, or Turkish automatically
• Provide SPECIFIC, ACTIONABLE advice — not generic responses
• When the user asks about something outside the platform, briefly answer and redirect back to AgentBot features
• NEVER mention you are an AI or language model — you are the AgentBot assistant

💡 EXAMPLE RESPONSES:
User: "Как создать бота?" → "Перейдите в раздел «Мои боты» → «Создать бота». Выберите тип (ИИ-агент рекомендуется), нишу бизнеса, настройте приветствие и поведение. Конструктор проведёт вас за 6 шагов. При регистрации вы получаете 7 дней демо."
User: "How to get more clients?" → "Here's a strategy: 1) Create an AI bot with lead capture enabled. 2) Embed the widget on your website. 3) Use the Email Campaigns feature to send welcome emails. 4) Enable booking notifications to reduce no-shows. Check the AI Agent section for these tools."
User: "Fiyatlar nedir?" → "AgentBot 4 plan sunar: Demo (ücretsiz, 7 gün), Aylık ($29), 3 Aylık ($74, %15 indirim), Yıllık ($244, %30 indirim), Ömür Boyu ($499). «Abonelik» sayfasından seçebilirsiniz."

${context ? `\n📊 CURRENT USER CONTEXT:\n${context}\nUse this context to personalize your response.` : ''}`;
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

    // ── Step 1: Initialize SDK ──
    const configExists = ensureZaiConfig();

    let zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;

    if (configExists) {
      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        zai = await ZAI.create();
      } catch (sdkErr) {
        console.error('[ai-assistant] SDK create() failed despite config existing:', sdkErr);
      }
    }

    // ── Step 2: If SDK available, use real AI ──
    if (zai) {
      const systemPrompt = buildSystemPrompt(context);

      const messages = [
        { role: 'assistant' as const, content: systemPrompt },
        ...(history || []),
        { role: 'user' as const, content: message },
      ];

      try {
        const completion = await zai.chat.completions.create({
          messages,
          thinking: { type: 'disabled' },
        });

        const response = completion.choices[0]?.message?.content || 'Извините, не удалось сгенерировать ответ. Попробуйте ещё раз.';

        return NextResponse.json({ response });
      } catch (chatErr) {
        console.error('[ai-assistant] Chat completion failed:', chatErr);
        // Fall through to offline response
      }
    }

    // ── Step 3: Offline fallback with smart responses ──
    const offlineResponse = getSmartOfflineResponse(message, context);
    return NextResponse.json({ response: offlineResponse });

  } catch (error) {
    console.error('[ai-assistant] Unhandled error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}

// ──────────────────────────────────────────────────────────────
// Smart offline responses — covers most common questions
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string, context?: string): string {
  const lower = message.toLowerCase();

  // Detect language
  const isRussian = /[а-яё]/i.test(message);
  const isTurkish = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  // ── RUSSIAN RESPONSES ──
  if (isRussian) {
    if (lower.includes('бот') || lower.includes('создат') || lower.includes('агент') || lower.includes('конструктор')) {
      return 'Перейдите в раздел «Мои боты» → «Создать бота». Выберите тип (ИИ-агент рекомендуется для умных диалогов), укажите нишу бизнеса и настройте поведение за 6 шагов. Демо-план позволяет создать 1 бота бесплатно на 7 дней.';
    }
    if (lower.includes('виджет') || lower.includes('встав') || lower.includes('сайт') || lower.includes('код')) {
      return 'Для встраивания виджета: 1) Опубликуйте бота. 2) В списке ботов нажмите «Код встраивания» и скопируйте. 3) Вставьте код перед </body> на вашем сайте. Виджет появится в правом нижнем углу.';
    }
    if (lower.includes('цен') || lower.includes('тариф') || lower.includes('подписк') || lower.includes('plan') || lower.includes('опл')) {
      return 'AgentBot предлагает 5 тарифов: Демо (бесплатно, 7 дней), Месячный ($29), Квартальный ($74, скидка 15%), Годовой ($244, скидка 30%), Пожизненный ($499). Перейдите в раздел «Подписка» для выбора.';
    }
    if (lower.includes('запис') || lower.includes('календар') || lower.includes('расписан') || lower.includes('брон')) {
      return 'Функция онлайн-записи настраивается в конструкторе бота на шаге 6 «Календарь». Укажите рабочие дни, время, длительность слота и буфер между записями.';
    }
    if (lower.includes('клиент') || lower.includes('лид') || lower.includes('продаж') || lower.includes('привлечь')) {
      return 'Для привлечения клиентов: 1) Включите сбор контактов в настройках бота. 2) Используйте Email-кампании в разделе AI-агент. 3) Включите AI-запись на сайте. 4) Настройте автоматические приветственные письма новым клиентам.';
    }
    if (lower.includes('telegram') || lower.includes('whatsapp')) {
      return 'Мультиканальность доступна на платных тарифах. После подключения Telegram/WhatsApp в настройках бота, все диалоги будут отображаться в едином кабинете.';
    }
    if (lower.includes('помощь') || lower.includes('поддержк') || lower.includes('проблем')) {
      return 'Раздел «Поддержка 24/7» — это AI-чат со специалистом техподдержки. Опишите вашу проблему и получите пошаговое решение. Также есть раздел «Помощь» с FAQ по всем функциям платформы.';
    }
    if (lower.includes('аналитик') || lower.includes('статист') || lower.includes('отчёт')) {
      return 'Раздел «Статистика» показывает диалоги, визиты, записи и конверсию за любой период. Экспорт доступен в CSV и PDF. Подробная аналитика доступна на платных тарифах.';
    }
    return 'Здравствуйте! Я AI-помощник AgentBot. Сейчас я работаю в ограниченном режиме. Для полной поддержки используйте раздел «Поддержка 24/7». Основные разделы: «Мои боты» — управление ботами, «Подписка» — тарифы, «Помощь» — FAQ.';
  }

  // ── TURKISH RESPONSES ──
  if (isTurkish) {
    if (lower.includes('bot') || lower.includes('oluştur') || lower.includes('ajan') || lower.includes('kur')) {
      return 'AI ajan oluşturmak için: «Botlarım» → «Bot oluştur» bölümüne gidin. Tür (AI ajan önerilir), iş alanını seçin ve 6 adımda yapılandırın. Demo planında 1 ücretsiz bot.';
    }
    if (lower.includes('fiyat') || lower.includes('plan') || lower.includes('abonelik') || lower.includes('ücret')) {
      return 'AgentBot 5 plan sunar: Demo (ücretsiz, 7 gün), Aylık ($29), 3 Aylık ($74, %15 indirim), Yıllık ($244, %30 indirim), Ömür Boyu ($499). «Abonelik» sayfasından seçebilirsiniz.';
    }
    return 'Merhaba! Ben AgentBot AI asistanıyım. Şu anda sınırlı modda çalışıyorum. Tam destek için «7/24 Destek» bölümünü kullanın. Ana bölümler: «Botlarım» — bot yönetimi, «Abonelik» — planlar, «Yardım» — SSS.';
  }

  // ── ENGLISH RESPONSES ──
  if (lower.includes('bot') || lower.includes('create') || lower.includes('agent') || lower.includes('build')) {
    return 'Go to "My Bots" → "Create Bot". Choose AI Agent type (recommended for smart conversations), select your business niche, and configure in 6 steps. Demo plan allows 1 free bot for 7 days.';
  }
  if (lower.includes('widget') || lower.includes('embed') || lower.includes('website') || lower.includes('code')) {
    return 'To embed the widget: 1) Publish your bot. 2) Click "Embed Code" in the bot list and copy. 3) Paste before </body> on your website. The widget appears in the bottom-right corner.';
  }
  if (lower.includes('price') || lower.includes('plan') || lower.includes('subscription') || lower.includes('cost')) {
    return 'AgentBot offers 5 plans: Demo (free, 7 days), Monthly ($29), Quarterly ($74, 15% off), Yearly ($244, 30% off), Lifetime ($499). Visit "Subscription" page to choose.';
  }
  if (lower.includes('book') || lower.includes('calendar') || lower.includes('appointment') || lower.includes('schedule')) {
    return 'Online booking is configured in the Bot Builder, Step 6 "Calendar". Set working days, hours, slot duration, and buffer between bookings.';
  }
  if (lower.includes('client') || lower.includes('lead') || lower.includes('sale') || lower.includes('customer')) {
    return 'To attract clients: 1) Enable contact collection in bot settings. 2) Use Email Campaigns in the AI Agent section. 3) Enable AI booking on your site. 4) Set up automatic welcome emails for new clients.';
  }
  if (lower.includes('telegram') || lower.includes('whatsapp')) {
    return 'Multi-channel is available on paid plans. After connecting Telegram/WhatsApp in bot settings, all conversations appear in the unified dashboard.';
  }
  if (lower.includes('help') || lower.includes('support') || lower.includes('issue') || lower.includes('problem')) {
    return 'The "24/7 Support" section has an AI chat with a support specialist. Describe your issue for step-by-step solutions. There\'s also a "Help" page with FAQ for all features.';
  }
  if (lower.includes('analyt') || lower.includes('stat') || lower.includes('report')) {
    return 'The "Analytics" page shows conversations, visitors, bookings, and conversion rates for any period. CSV and PDF export available. Detailed analytics on paid plans.';
  }
  return "Hello! I'm the AgentBot AI assistant. I'm currently in limited mode. For full support, use the \"24/7 Support\" section. Key sections: \"My Bots\" — bot management, \"Subscription\" — plans, \"Help\" — FAQ.";
}
