import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

// ──────────────────────────────────────────────────────────────
// Ensure .z-ai-config exists (required by z-ai-web-dev-sdk)
// Same logic as /api/ai-assistant — writes to /tmp on Vercel
// ──────────────────────────────────────────────────────────────

function ensureZaiConfig(): string | null {
  const configEnv = process.env.Z_AI_CONFIG;
  if (!configEnv) {
    console.warn('[support] Z_AI_CONFIG env var is not set');
    return null;
  }

  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(configEnv);
  } catch {
    console.error('[support] Z_AI_CONFIG is not valid JSON');
    return null;
  }

  // Try local cwd first (works in development)
  const localPath = path.join(process.cwd(), '.z-ai-config');
  if (fs.existsSync(localPath)) return localPath;

  try {
    fs.writeFileSync(localPath, configEnv, 'utf-8');
    return localPath;
  } catch {
    // cwd is read-only (Vercel) — try /tmp
  }

  // Try /tmp (works on Vercel / serverless)
  const tmpDir = os.tmpdir();
  const tmpPath = path.join(tmpDir, '.z-ai-config');

  try {
    if (fs.existsSync(tmpPath)) {
      const existing = fs.readFileSync(tmpPath, 'utf-8');
      if (existing === configEnv) return tmpDir;
    }
    fs.writeFileSync(tmpPath, configEnv, 'utf-8');
    console.log('[support] Written .z-ai-config to /tmp');
    return tmpDir;
  } catch (writeErr) {
    console.error('[support] Failed to write .z-ai-config to /tmp:', writeErr);
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// Support-specific system prompt
// ──────────────────────────────────────────────────────────────

function buildSupportSystemPrompt(language?: string): string {
  const langMap: Record<string, string> = {
    ru: 'Russian',
    en: 'English',
    tr: 'Turkish',
  };
  const lang = langMap[language || 'ru'] || 'Russian';

  return `You are a 24/7 customer support AI assistant for AgentBot — an all-in-one AI agent platform for business automation. You are a senior technical support specialist.

YOUR ROLE:
- Help users troubleshoot technical issues with bots, widgets, and integrations
- Guide users through setup processes (widget installation, bot configuration, calendar setup)
- Answer billing and subscription questions
- Provide step-by-step solutions in a clear, structured format

GUIDELINES:
- ALWAYS respond in the EXACT SAME LANGUAGE as the user's message (${lang})
- Be CONCISE but THOROUGH — use numbered steps when solving problems
- For common issues:
  * Widget not working → check embed code, browser console (F12), CORS, ad-blockers, bot published status
  * Bot not responding → check API keys, bot status (must be "Active"), system prompt, bot type
  * Booking/calendar → check calendar config, working days, time slots, buffer minutes
  * Billing/subscription → explain 5 plans (Demo free 7 days, Monthly $29, Quarterly $74, Yearly $244, Lifetime $499)
  * Integration (Telegram/WhatsApp) → check tokens, webhooks, bot permissions
  * Account issues → check if user is blocked, verify login credentials, password reset link
  * Analytics not showing → check if tracking is enabled, demo limits (analytics on paid plans only)
- Use formatting: numbered lists, **bold** for key terms, code blocks for code snippets
- If you cannot solve the problem, suggest contacting human support via email
- NEVER say you are an AI or language model — you are the AgentBot support assistant

Current user language: ${lang}`;
}

// ──────────────────────────────────────────────────────────────
// POST /api/support
// ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // ── Step 1: Ensure config file exists ──
    const configDir = ensureZaiConfig();

    // ── Step 2: Initialize SDK ──
    let zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;

    if (configDir) {
      const originalHome = process.env.HOME;
      if (configDir !== process.cwd()) {
        process.env.HOME = configDir;
      }

      try {
        const ZAI = (await import('z-ai-web-dev-sdk')).default;
        zai = await ZAI.create();
        console.log('[support] SDK initialized successfully');
      } catch (sdkErr) {
        console.error('[support] SDK create() failed:', sdkErr);
      } finally {
        if (originalHome !== undefined) {
          process.env.HOME = originalHome;
        }
      }
    }

    // ── Step 3: If SDK available, use real AI with retry ──
    if (zai) {
      const systemPrompt = buildSupportSystemPrompt(language);

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

          console.warn(`[support] Empty response on attempt ${attempt}`);
        } catch (chatErr) {
          console.error(`[support] Chat completion failed (attempt ${attempt}/2):`, chatErr);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
      }
    }

    // ── Step 4: Offline fallback ──
    console.warn('[support] SDK unavailable, using offline fallback');
    const offlineResponse = getSupportOfflineResponse(message, language);
    return NextResponse.json({ response: offlineResponse });

  } catch (error) {
    console.error('[support] Unhandled error:', error);
    return NextResponse.json({ error: 'AI support service unavailable' }, { status: 503 });
  }
}

// ──────────────────────────────────────────────────────────────
// Smart offline fallback (trilingual, topic-based)
// ──────────────────────────────────────────────────────────────

function getSupportOfflineResponse(message: string, language?: string): string {
  const lang = language || 'ru';
  const lower = message.toLowerCase();
  const isRussian = /[а-яё]/i.test(message);
  const isTurkish = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  if (isRussian || lang === 'ru') {
    return getRussianSupportResponse(lower);
  }

  if (isTurkish || lang === 'tr') {
    return getTurkishSupportResponse(lower);
  }

  return getEnglishSupportResponse(lower);
}

function getRussianSupportResponse(lower: string): string {
  // Widget issues
  if (lower.includes('виджет') || lower.includes('не отображ') || lower.includes('не появл')) {
    return 'Для решения проблем с виджетом:\n\n1. Проверьте, что код встраивания установлен перед закрывающим тегом </body>\n2. Откройте консоль браузера (F12) — проверьте наличие ошибок\n3. Убедитесь, что AdBlock и другие блокировщики не мешают\n4. Проверьте статус бота — должен быть «Активен»\n5. Если используете фреймворк (React, Vue), проверьте CSP-заголовки\n\nЕсли проблема остаётся — напишите подробности.';
  }
  // Bot not responding
  if ((lower.includes('бот') || lower.includes('агент')) && (lower.includes('не отвеч') || lower.includes('ошибк') || lower.includes('не работ'))) {
    return 'Если бот не отвечает:\n\n1. Проверьте статус бота в «Мои боты» — должен быть «Активен»\n2. Убедитесь, что тип бота «ИИ-агент» (для умных ответов)\n3. Проверьте системный промпт на шаге 3 конструктора\n4. Убедитесь, что ниша и шаблон выбраны корректно\n5. Попробуйте пересоздать бота\n\nДля диагностики напишите нам.';
  }
  // Calendar/booking
  if (lower.includes('запис') || lower.includes('календар') || lower.includes('расписан')) {
    return 'Настройка календаря онлайн-записи:\n\n1. В конструкторе перейдите к шагу 6 «Календарь»\n2. Выберите рабочие дни (пн-пт и т.д.)\n3. Установите время начала и окончания работы\n4. Настройте длительность слота (30/60/90 мин)\n5. Укажите буфер между записями (мин)\n\nКлиенты смогут записываться через чат-виджет 24/7.';
  }
  // Pricing
  if (lower.includes('цен') || lower.includes('тариф') || lower.includes('подписк') || lower.includes('опл') || lower.includes('стоим')) {
    return 'AgentBot предлагает 5 тарифов:\n\n• Демо — бесплатно, 7 дней, 1 бот\n• Месячный — $29/мес\n• Квартальный — $74/3 мес (скидка 15%)\n• Годовой — $244/год (скидка 30%)\n• Пожизненный — $499 (единоразово)\n\nПерейдите в раздел «Подписка» для выбора и оплаты.';
  }
  // Telegram/WhatsApp
  if (lower.includes('telegram') || lower.includes('whatsapp') || lower.includes('мессенджер') || lower.includes('канал')) {
    return 'Подключение Telegram/WhatsApp:\n\n1. В настройках бота найдите раздел «Интеграции»\n2. Для Telegram: создайте бота через @BotFather, вставьте токен\n3. Для WhatsApp: подключите через WhatsApp Business API\n4. Все диалоги будут в едином кабинете\n\nМультиканальность доступна на платных тарифах.';
  }
  // Password/account issues
  if (lower.includes('пароль') || lower.includes('войти') || lower.includes('забыл') || lower.includes('вход') || lower.includes('логин')) {
    return 'Если не можете войти в аккаунт:\n\n1. Используйте кнопку «Забыли пароль?» на странице входа\n2. Введите ваш email — придёт ссылка для сброса пароля\n3. Ссылка действует 1 час\n4. Если письмо не приходит — проверьте папку «Спам»\n\nДля смены пароля в личном кабинете: «Настройки» → «Аккаунт» → «Сменить пароль».';
  }
  // Analytics
  if (lower.includes('аналитик') || lower.includes('статист') || lower.includes('отчёт') || lower.includes('график')) {
    return 'Аналитика доступна на платных тарифах (кроме демо).\n\nЧто показывает:\n• Количество диалогов и визитов\n• Записи через виджет\n• Конверсия (визиты → записи)\n• Периоды: день, неделя, месяц\n\nЭкспорт в CSV и PDF. Для детальной аналитики перейдите на платный тариф.';
  }

  return 'Спасибо за обращение! Вот частые решения:\n\n• Виджет → проверьте код встраивания и консоль (F12)\n• Бот не отвечает → проверьте статус «Активен» и промпт\n• Записи → настройте календарь (шаг 6 конструктора)\n• Тарифы → раздел «Подписка» (5 планов от $0 до $499)\n• Пароль → «Забыли пароль?» на странице входа\n\nОпишите проблему подробнее, и я постараюсь помочь!';
}

function getTurkishSupportResponse(lower: string): string {
  if (lower.includes('widget') || lower.includes('görünm') || lower.includes('ekl')) {
    return 'Widget sorunları için:\n\n1. Gömme kodunun </body> etiketinden önce olduğundan emin olun\n2. Tarayıcı konsolunu (F12) kontrol edin\n3. AdBlock gibi engelleyicileri devre dışı bırakın\n4. Bot durumunun "Aktif" olduğunu kontrol edin\n\nSorun devam ederse detaylı bilgi gönderin.';
  }
  if ((lower.includes('bot') || lower.includes('ajan')) && (lower.includes('yanıt') || lower.includes('hatası') || lower.includes('çalışmıyor'))) {
    return 'Bot yanıt vermiyorsa:\n\n1. "Botlarım" bölümünde bot durumunu kontrol edin — "Aktif" olmalı\n2. Bot türünün "AI Ajanı" olduğundan emin olun\n3. Sistem komutunu 3. adımda kontrol edin\n4. Botu yeniden oluşturmayı deneyin';
  }
  if (lower.includes('randevu') || lower.includes('takvim') || lower.includes('plan')) {
    return 'Online randevu takvimi kurulumu:\n\n1. Bot İnşa Edici\'de 6. adıma gidin\n2. Çalışma günlerini seçin\n3. Başlangıç ve bitiş saatlerini ayarlayın\n4. Slot süresini belirleyin (30/60/90 dakika)\n5. Randevular arası tampon süresini girin';
  }
  if (lower.includes('fiyat') || lower.includes('plan') || lower.includes('abonelik') || lower.includes('ödeme')) {
    return 'AgentBot 5 plan sunar:\n\n• Demo — ücretsiz, 7 gün, 1 bot\n• Aylık — $29/ay\n• 3 Aylık — $74/3 ay (%15 indirim)\n• Yıllık — $244/yıl (%30 indirim)\n• Ömür Boyu — $499 (bir kerelik)\n\n"Abonelik" sayfasından seçebilirsiniz.';
  }
  if (lower.includes('parola') || lower.includes('şifre') || lower.includes('giriş')) {
    return 'Hesabınıza giriş yapamıyorsanız:\n\n1. Giriş sayfasında "Şifremi Unuttum" bağlantısına tıklayın\n2. E-posta adresinizi girin — şifre sıfırlama bağlantısı gelecek\n3. Bağlantı 1 saat geçerlidir\n4. "Ayarlar" → "Hesap" → "Şifre Değiştir" ile de değiştirebilirsiniz';
  }

  return 'Destek için teşekkürler! Yaygın çözümler:\n\n• Widget → gömme kodunu ve konsolu (F12) kontrol edin\n• Bot yanıt vermiyor → durumu ve sistem komutunu kontrol edin\n• Randevu → inşa edicide takvimi yapılandırın (adım 6)\n• Planlar → "Abonelik" sayfası (5 plan, $0 - $499)\n• Şifre → giriş sayfasında "Şifremi Unuttum"\n\nSorununuzu detaylı açıklayın, yardımcı olmaya çalışacağım!';
}

function getEnglishSupportResponse(lower: string): string {
  if (lower.includes('widget') || lower.includes('embed') || lower.includes('not show') || lower.includes('not display')) {
    return 'Widget troubleshooting:\n\n1. Ensure embed code is placed before the closing </body> tag\n2. Open browser console (F12) and check for errors\n3. Disable AdBlock and similar extensions\n4. Verify bot status is "Active"\n5. If using a framework (React, Vue), check CSP headers\n\nIf the issue persists, please share the details.';
  }
  if ((lower.includes('bot') || lower.includes('agent')) && (lower.includes('not respond') || lower.includes('error') || lower.includes('not work'))) {
    return 'If the bot is not responding:\n\n1. Check bot status in "My Bots" — must be "Active"\n2. Ensure bot type is "AI Agent" (for intelligent responses)\n3. Check the system prompt in builder step 3\n4. Verify niche and template are configured correctly\n5. Try recreating the bot';
  }
  if (lower.includes('book') || lower.includes('calendar') || lower.includes('schedule')) {
    return 'Online booking calendar setup:\n\n1. Go to builder step 6 "Calendar"\n2. Select working days (Mon-Fri, etc.)\n3. Set start and end working hours\n4. Configure slot duration (30/60/90 min)\n5. Set buffer between bookings\n\nClients can book 24/7 through the chat widget.';
  }
  if (lower.includes('price') || lower.includes('plan') || lower.includes('subscription') || lower.includes('cost') || lower.includes('pay')) {
    return 'AgentBot offers 5 plans:\n\n• Demo — Free, 7 days, 1 bot\n• Monthly — $29/mo\n• Quarterly — $74/3 mo (15% off)\n• Yearly — $244/yr (30% off)\n• Lifetime — $499 (one-time)\n\nVisit "Subscription" page to choose and pay.';
  }
  if (lower.includes('password') || lower.includes('login') || lower.includes('sign in') || lower.includes('forgot')) {
    return 'If you cannot sign in:\n\n1. Use "Forgot Password?" link on the login page\n2. Enter your email — a reset link will be sent\n3. The link is valid for 1 hour\n4. Check spam folder if email doesn\'t arrive\n\nTo change password: "Settings" → "Account" → "Change Password"';
  }

  return 'Thank you for contacting support! Common solutions:\n\n• Widget not working → check embed code and browser console (F12)\n• Bot not responding → check status "Active" and system prompt\n• Bookings → configure calendar in builder (step 6)\n• Plans → "Subscription" page (5 plans from $0 to $499)\n• Password → "Forgot Password?" on login page\n\nPlease describe your issue in detail and I\'ll help!';
}
