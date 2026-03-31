import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ──────────────────────────────────────────────────────────────
// Ensure .z-ai-config exists (required by z-ai-web-dev-sdk)
//
// IMPORTANT: On Vercel the filesystem is READ-ONLY (except /tmp).
// We write the config to /tmp/.z-ai-config and temporarily set
// HOME=/tmp so the SDK can find it.
// ──────────────────────────────────────────────────────────────

function ensureZaiConfig(): string | null {
  const configEnv = process.env.Z_AI_CONFIG;

  // Validate JSON early
  if (!configEnv) {
    console.warn('[ai-assistant] Z_AI_CONFIG env var is not set');
    return null;
  }

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(configEnv);
  } catch {
    console.error('[ai-assistant] Z_AI_CONFIG is not valid JSON');
    return null;
  }

  // ── Try local cwd first (works in development) ──
  const localPath = path.join(process.cwd(), '.z-ai-config');
  if (fs.existsSync(localPath)) return localPath;

  try {
    fs.writeFileSync(localPath, configEnv, 'utf-8');
    console.log('[ai-assistant] Written .z-ai-config to cwd');
    return localPath;
  } catch {
    // cwd is read-only (Vercel) — that's fine, try /tmp
  }

  // ── Try /tmp (works on Vercel / serverless) ──
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, '.z-ai-config');

  // Write only if not already there or content differs
  try {
    if (fs.existsSync(tmpPath)) {
      const existing = fs.readFileSync(tmpPath, 'utf-8');
      if (existing === configEnv) return tmpDir; // already written
    }
    fs.writeFileSync(tmpPath, configEnv, 'utf-8');
    console.log('[ai-assistant] Written .z-ai-config to /tmp');
    return tmpDir;
  } catch (writeErr) {
    console.error('[ai-assistant] Failed to write .z-ai-config to /tmp:', writeErr);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Comprehensive system prompt — elite AI specialist
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
• Always try to help — even with non-platform questions, give a useful answer and suggest relevant platform features

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

    // ── Step 1: Ensure config file exists ──
    const configDir = ensureZaiConfig();

    // ── Step 2: Initialize SDK ──
    let zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;

    if (configDir) {
      // On Vercel, override HOME so SDK finds .z-ai-config in /tmp
      const originalHome = process.env.HOME;
      if (configDir !== process.cwd()) {
        process.env.HOME = configDir;
      }

      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        zai = await ZAI.create();
        console.log('[ai-assistant] SDK initialized successfully');
      } catch (sdkErr) {
        console.error('[ai-assistant] SDK create() failed:', sdkErr);
      } finally {
        // Restore HOME
        if (originalHome !== undefined) {
          process.env.HOME = originalHome;
        }
      }
    }

    // ── Step 3: If SDK available, use real AI with retry ──
    if (zai) {
      const systemPrompt = buildSystemPrompt(context);

      const messages = [
        { role: 'assistant' as const, content: systemPrompt },
        ...(history || []),
        { role: 'user' as const, content: message },
      ];

      // Retry up to 2 times
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const completion = await zai.chat.completions.create({
            messages,
            thinking: { type: 'disabled' },
          });

          const response = completion.choices[0]?.message?.content;

          if (response && response.trim().length > 0) {
            return NextResponse.json({ response: response.trim() });
          }

          console.warn(`[ai-assistant] Empty response on attempt ${attempt}`);
        } catch (chatErr) {
          console.error(`[ai-assistant] Chat completion failed (attempt ${attempt}/2):`, chatErr);
          if (attempt < 2) {
            // Brief pause before retry
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    }

    // ── Step 4: Offline fallback ──
    console.warn('[ai-assistant] SDK unavailable, using offline fallback');
    const offlineResponse = getSmartOfflineResponse(message, context);
    return NextResponse.json({ response: offlineResponse });

  } catch (error) {
    console.error('[ai-assistant] Unhandled error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}

// ──────────────────────────────────────────────────────────────
// Smart offline responses — covers 20+ topic areas
// This is a SAFETY NET — the real AI should handle everything
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string, _context?: string): string {
  const lower = message.toLowerCase();

  // Detect language
  const isRussian = /[а-яё]/i.test(message);
  const isTurkish = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  // ══════════════════════════════════════════
  // RUSSIAN RESPONSES
  // ══════════════════════════════════════════
  if (isRussian) {
    return getRussianOfflineResponse(lower);
  }

  // ══════════════════════════════════════════
  // TURKISH RESPONSES
  // ══════════════════════════════════════════
  if (isTurkish) {
    return getTurkishOfflineResponse(lower);
  }

  // ══════════════════════════════════════════
  // ENGLISH RESPONSES (default)
  // ══════════════════════════════════════════
  return getEnglishOfflineResponse(lower);
}

// ──────────────────────────────────────────────────────────────
// Russian offline responses
// ──────────────────────────────────────────────────────────────

function getRussianOfflineResponse(lower: string): string {
  // Bot creation
  if (lower.includes('бот') || lower.includes('создат') || lower.includes('агент') || lower.includes('конструктор')) {
    return 'Перейдите в раздел «Мои боты» → «Создать бота». Выберите тип (ИИ-агент рекомендуется), укажите нишу и настройте за 6 шагов. Демо даёт 1 бота бесплатно на 7 дней.';
  }
  // Widget / embed
  if (lower.includes('виджет') || lower.includes('встав') || lower.includes('сайт') || lower.includes('код') || lower.includes('embed')) {
    return 'Для встраивания виджета: 1) Опубликуйте бота. 2) В списке ботов нажмите «Код встраивания». 3) Вставьте код перед </body> на вашем сайте. Виджет появится в правом нижнем углу.';
  }
  // Pricing / subscription
  if (lower.includes('цен') || lower.includes('тариф') || lower.includes('подписк') || lower.includes('plan') || lower.includes('опл') || lower.includes('стоим')) {
    return 'AgentBot предлагает 5 тарифов: Демо (бесплатно, 7 дней), Месячный ($29), Квартальный ($74, -15%), Годовой ($244, -30%), Пожизненный ($499). Перейдите в раздел «Подписка».';
  }
  // Booking / calendar
  if (lower.includes('запис') || lower.includes('календар') || lower.includes('расписан') || lower.includes('брон') || lower.includes('приём')) {
    return 'Онлайн-запись настраивается в конструкторе бота, шаг 6 «Календарь». Укажите рабочие дни, время, длительность слота и буфер. Клиенты смогут записываться через виджет 24/7.';
  }
  // Clients / leads / sales
  if (lower.includes('клиент') || lower.includes('лид') || lower.includes('продаж') || lower.includes('привлечь') || lower.includes('маркетинг')) {
    return 'Для привлечения клиентов: 1) Включите сбор контактов в настройках бота. 2) Используйте Email-кампании в разделе AI-агент. 3) Включите онлайн-запись. 4) Настройте приветственные письма новым клиентам.';
  }
  // Telegram / WhatsApp
  if (lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('канал') || lower.includes('мессенджер')) {
    return 'Мультиканальность доступна на платных тарифах. Подключите Telegram/WhatsApp в настройках бота — все диалоги в едином кабинете.';
  }
  // Help / support
  if (lower.includes('помощь') || lower.includes('поддержк') || lower.includes('проблем') || lower.includes('ошибк') || lower.includes('не работ')) {
    return 'Используйте раздел «Поддержка 24/7» — опишите проблему и получите пошаговое решение от AI. Также есть раздел «Помощь» с FAQ по всем функциям.';
  }
  // Analytics / stats
  if (lower.includes('аналитик') || lower.includes('статист') || lower.includes('отчёт') || lower.includes('метрик')) {
    return 'Раздел «Статистика» показывает диалоги, визиты, записи и конверсию за любой период. Экспорт в CSV и PDF доступен. Подробная аналитика — на платных тарифах.';
  }
  // AI agent features
  if (lower.includes('письм') || lower.includes('email') || lower.includes('email') || lower.includes('рассылк')) {
    return 'Email-кампании доступны в разделе «AI-агент». Создавайте приветственные письма, напоминания о записях, промо-рассылки. 5 готовых шаблонов + свои.';
  }
  if (lower.includes('звон') || lower.includes('звонок') || lower.includes('call') || lower.includes('скрипт')) {
    return 'Функция звонков клиентам доступна в разделе «AI-агент». Настройте скрипт звонка, укажите номер клиента и запустите звонок. AI озвучит текст скрипта.';
  }
  // Demo / trial
  if (lower.includes('демо') || lower.includes('бесплатн') || lower.includes('пробн') || lower.includes('тест')) {
    return 'Демо-период — 7 дней полного доступа бесплатно. Можно создать 1 бота, 1 нишу, 1 услугу. После — выберите платный тариф для продолжения работы.';
  }
  // Settings
  if (lower.includes('настройк') || lower.includes('профил') || lower.includes('аккаунт') || lower.includes('пароль')) {
    return 'Настройки профиля, языка, темы и уведомлений — в разделе «Настройки». Там же смена пароля и управление аккаунтом.';
  }
  // FAQ
  if (lower.includes('частый') || lower.includes('вопрос') || lower.includes('faq') || lower.includes('ссс')) {
    return 'Раздел «Помощь» содержит FAQ по всем функциям платформы: создание ботов, виджеты, запись, тарифы, интеграции. Также доступен AI-чат «Поддержка 24/7».';
  }
  // Template
  if (lower.includes('шаблон') || lower.includes('ниш') || lower.includes('салон') || lower.includes('клин') || lower.includes('ресторан')) {
    return 'В конструкторе бота (шаг 2) доступны шаблоны по нишам: салон красоты, медицина, ресторан, недвижимость, образование, фитнес, консалтинг, e-commerce. Шаблон автоматически настроит поведение бота.';
  }
  // Greeting / behavior
  if (lower.includes('приветств') || lower.includes('поведен') || lower.includes('ответ') || lower.includes('тональн')) {
    return 'Приветственное сообщение и поведение настраиваются в конструкторе бота, шаг 3. Выберите тон (дружелюбный, профессиональный, формальный) и напишите системный промпт для AI.';
  }
  // Multi-bot
  if (lower.includes('нескольк') || lower.includes('много') || lower.includes('второй') || lower.includes('дополн')) {
    return 'На платных тарифах можно создавать неограниченное количество ботов. В демо-режиме доступен 1 бот. Создавайте отдельных ботов для разных задач и каналов.';
  }
  // Delete / edit bot
  if (lower.includes('удалит') || lower.includes('редактир') || lower.includes('изменит')) {
    return 'В разделе «Мои боты» нажмите на три точки в карточке бота → «Настроить» (редактирование) или «Удалить». Редактирование позволяет изменить имя, нишу, приветствие и стиль.';
  }
  // Admin
  if (lower.includes('админ') || lower.includes('управлен')) {
    return 'Панель администратора доступна для пользователей с ролью admin. В ней: управление пользователями, аналитика платформы, логи и коды встраивания.';
  }

  // Default Russian — helpful and guiding, never robotic
  return 'Я помогу вам разобраться! Опишите ваш вопрос подробнее, и я постараюсь помочь. Основные разделы: «Мои боты» — создание и управление ботами, «AI-агент» — кампании и звонки, «Подписка» — тарифы, «Помощь» — FAQ, «Поддержка 24/7» — чат с AI.';
}

// ──────────────────────────────────────────────────────────────
// Turkish offline responses
// ──────────────────────────────────────────────────────────────

function getTurkishOfflineResponse(lower: string): string {
  if (lower.includes('bot') || lower.includes('oluştur') || lower.includes('ajan') || lower.includes('kur')) {
    return 'AI ajan oluşturmak için: «Botlarım» → «Bot oluştur» bölümüne gidin. Tür (AI ajan önerilir), iş alanını seçin ve 6 adımda yapılandırın. Demo planında 1 ücretsiz bot.';
  }
  if (lower.includes('fiyat') || lower.includes('plan') || lower.includes('abonelik') || lower.includes('ücret') || lower.includes('ödeme')) {
    return 'AgentBot 5 plan sunar: Demo (ücretsiz, 7 gün), Aylık ($29), 3 Aylık ($74, %15 indirim), Yıllık ($244, %30 indirim), Ömür Boyu ($499). «Abonelik» sayfasından seçebilirsiniz.';
  }
  if (lower.includes('widget') || lower.includes('ekl') || lower.includes('site') || lower.includes('kod')) {
    return 'Widget eklemek için: 1) Botu yayınlayın. 2) Bot listesinde «Gömme Kodu» nu kopyalayın. 3) Sitenizin </body> etiketinden önce yapıştırın. Widget sağ alt köşede görünecektir.';
  }
  if (lower.includes('randevu') || lower.includes('takvim') || lower.includes('takdi') || lower.includes('rezerv')) {
    return 'Online randevu sistemi Bot İnşa Edici\'nin 6. adımında «Takvim» bölümünde ayarlanır. Çalışma günleri, saatler, slot süresi ve arabellek süresini belirleyin.';
  }
  if (lower.includes('müşteri') || lower.includes('potansiyel') || lower.includes('satış') || lower.includes('yeni')) {
    return 'Müşteri çekmek için: 1) Bot ayarlarında iletişim toplamayı etkinleştirin. 2) AI ajan bölümünde e-posta kampanyaları kullanın. 3) Online randevuyu açın. 4) Hoş geldin e-postaları ayarlayın.';
  }
  if (lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('kanal')) {
    return 'Çoklu kanal ücretli planlarda mevcuttur. Bot ayarlarında Telegram/WhatsApp bağlayın — tüm konuşmalar tek panelde.';
  }
  if (lower.includes('destek') || lower.includes('sorun') || lower.includes('yardım') || lower.includes('hata')) {
    return '«7/24 Destek» bölümünde AI destek uzmanıyla konuşabilirsiniz. Sorununuzu açıklayın, adım adım çözüm alın. Ayrıca «Yardım» sayfasında SSS bulunmaktadır.';
  }
  if (lower.includes('analitik') || lower.includes('istatistik') || lower.includes('rapor')) {
    return '«Analitik» sayfası her dönem için konuşmalar, ziyaretler, randevular ve dönüşüm oranlarını gösterir. CSV ve PDF dışa aktarma mevcuttur.';
  }
  if (lower.includes('demo') || lower.includes('ücretsiz') || lower.includes('deneme')) {
    return 'Demo süresi 7 gün tam erişim ücretsizdir. 1 bot, 1 niş, 1 hizmet oluşturabilirsiniz. Sonra ücretli plan seçerek devam edebilirsiniz.';
  }
  if (lower.includes('şablon') || lower.includes('niş') || lower.includes('salon') || lower.includes('klinik')) {
    return 'Bot İnşa Edici\'nin 2. adımında niş şablonları mevcuttur: güzellik salonu, tıp, restoran, emlak, eğitim, fitness, danışmanlık, e-ticaret.';
  }

  return 'Yardım etmek isterim! Sorunuzu daha detaylı açıklayın. Ana bölümler: «Botlarım» — bot oluşturma, «AI Ajanı» — kampanyalar, «Abonelik» — planlar, «Yardım» — SSS, «7/24 Destek» — AI sohbet.';
}

// ──────────────────────────────────────────────────────────────
// English offline responses (default)
// ──────────────────────────────────────────────────────────────

function getEnglishOfflineResponse(lower: string): string {
  // Bot creation
  if (lower.includes('bot') || lower.includes('create') || lower.includes('agent') || lower.includes('build') || lower.includes('make')) {
    return 'Go to "My Bots" → "Create Bot". Choose AI Agent type (recommended), select your business niche, and configure in 6 steps. Demo plan allows 1 free bot for 7 days.';
  }
  // Widget / embed
  if (lower.includes('widget') || lower.includes('embed') || lower.includes('website') || lower.includes('code') || lower.includes('install') || lower.includes('integrat')) {
    return 'To embed the widget: 1) Publish your bot. 2) Click "Embed Code" in the bot list and copy. 3) Paste before </body> on your website. The widget appears in the bottom-right corner.';
  }
  // Pricing
  if (lower.includes('price') || lower.includes('plan') || lower.includes('subscription') || lower.includes('cost') || lower.includes('pay') || lower.includes('fee')) {
    return 'AgentBot offers 5 plans: Demo (free, 7 days), Monthly ($29), Quarterly ($74, 15% off), Yearly ($244, 30% off), Lifetime ($499). Visit "Subscription" page to choose.';
  }
  // Booking
  if (lower.includes('book') || lower.includes('calendar') || lower.includes('appointment') || lower.includes('schedule') || lower.includes('reserv')) {
    return 'Online booking is configured in the Bot Builder, Step 6 "Calendar". Set working days, hours, slot duration, and buffer between bookings. Clients can book 24/7 through the widget.';
  }
  // Clients / leads
  if (lower.includes('client') || lower.includes('lead') || lower.includes('sale') || lower.includes('customer') || lower.includes('market')) {
    return 'To attract clients: 1) Enable contact collection in bot settings. 2) Use Email Campaigns in the AI Agent section. 3) Enable AI booking on your site. 4) Set up automatic welcome emails for new clients.';
  }
  // Telegram / WhatsApp
  if (lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('channel') || lower.includes('messeng')) {
    return 'Multi-channel is available on paid plans. Connect Telegram/WhatsApp in bot settings — all conversations in one unified dashboard.';
  }
  // Help / support
  if (lower.includes('help') || lower.includes('support') || lower.includes('issue') || lower.includes('problem') || lower.includes('error') || lower.includes('not work')) {
    return 'Use the "24/7 Support" section — describe your problem and get step-by-step solutions from AI. There\'s also a "Help" page with FAQ for all features.';
  }
  // Analytics
  if (lower.includes('analyt') || lower.includes('stat') || lower.includes('report') || lower.includes('metric')) {
    return 'The "Analytics" page shows conversations, visitors, bookings, and conversion rates for any period. CSV and PDF export available. Detailed analytics on paid plans.';
  }
  // Email campaigns
  if (lower.includes('email') || lower.includes('campaign') || lower.includes('newsletter') || lower.includes('mail')) {
    return 'Email campaigns are in the "AI Agent" section. Create welcome emails, booking reminders, promos. 5 ready-made templates + custom ones.';
  }
  // Calls
  if (lower.includes('call') || lower.includes('phone') || lower.includes('script') || lower.includes('dial')) {
    return 'Client calls are available in the "AI Agent" section. Set up a call script, specify the client number, and launch the call. AI will voice the script.';
  }
  // Demo / trial
  if (lower.includes('demo') || lower.includes('free') || lower.includes('trial') || lower.includes('test')) {
    return 'Demo period — 7 days of full access free. You can create 1 bot, 1 niche, 1 service. After that, choose a paid plan to continue.';
  }
  // Settings
  if (lower.includes('setting') || lower.includes('profile') || lower.includes('account') || lower.includes('password')) {
    return 'Profile, language, theme and notification settings are in "Settings". Password change and account management are also there.';
  }
  // Templates
  if (lower.includes('template') || lower.includes('niche') || lower.includes('salon') || lower.includes('clinic') || lower.includes('restaurant') || lower.includes('real estate')) {
    return 'Bot Builder Step 2 has niche templates: beauty salon, medical, restaurant, real estate, education, fitness, consulting, e-commerce. The template auto-configures your bot.';
  }
  // Greeting / behavior
  if (lower.includes('greeting') || lower.includes('behavior') || lower.includes('tone') || lower.includes('personality')) {
    return 'Greeting and behavior are configured in Bot Builder, Step 3. Choose a tone (friendly, professional, formal) and write a system prompt for the AI.';
  }
  // Multiple bots
  if (lower.includes('multi') || lower.includes('second') || lower.includes('another') || lower.includes('extra')) {
    return 'Paid plans allow unlimited bots. Demo allows 1 bot. Create separate bots for different tasks and channels.';
  }
  // Edit / delete
  if (lower.includes('delete') || lower.includes('edit') || lower.includes('modify') || lower.includes('change')) {
    return 'In "My Bots", click the three dots on a bot card → "Configure" (edit) or "Delete". Editing lets you change name, niche, greeting and style.';
  }
  // FAQ
  if (lower.includes('faq') || lower.includes('question') || lower.includes('common')) {
    return 'The "Help" section has FAQ covering all features: bot creation, widgets, booking, pricing, integrations. Also try the "24/7 Support" AI chat.';
  }

  // Default English — helpful, never robotic
  return 'I\'d love to help! Please describe your question in more detail and I\'ll do my best. Key sections: "My Bots" — create & manage bots, "AI Agent" — campaigns & calls, "Subscription" — plans, "Help" — FAQ, "24/7 Support" — AI chat.';
}
