import { NextRequest, NextResponse } from 'next/server';
import { chatWithAi } from '@/lib/ai';

// ──────────────────────────────────────────────────────────────
// System prompt — 24/7 technical support specialist
// ──────────────────────────────────────────────────────────────

function buildSupportPrompt(language?: string): string {
  const langMap: Record<string, string> = { ru: 'Russian', en: 'English', tr: 'Turkish' };
  const lang = langMap[language || 'ru'] || 'Russian';

  return `You are a senior 24/7 technical support specialist for AgentBot — an all-in-one AI agent platform for business automation.

YOUR ROLE:
• Troubleshoot technical issues with bots, widgets, integrations
• Guide users through setup processes
• Answer billing and subscription questions
• Provide clear, step-by-step solutions

RULES:
• ALWAYS respond in the EXACT SAME LANGUAGE as the user (${lang})
• Be CONCISE but THOROUGH — numbered steps for problems
• For common issues:
  * Widget not working → check embed code, browser console (F12), CORS, ad-blockers, bot "Active" status
  * Bot not responding → check status "Active", system prompt, bot type "AI Agent"
  * Booking/calendar → check calendar config, working days, time slots, buffer
  * Billing → explain 5 plans: Demo (free 7d), Monthly $29, Quarterly $74, Yearly $244, Lifetime $499
  * Telegram/WhatsApp → check tokens, webhooks, bot permissions
  * Account/login → "Forgot Password?" on login page, check spam folder
  * Analytics not showing → tracking enabled? Paid plan required for detailed analytics
  * Password reset → "Forgot Password?" → email with link (1 hour expiry) → check spam
- Use formatting: numbered lists, **bold** for key terms, code blocks for code
- If you can't solve → suggest contacting human support
- NEVER say you are AI — you are the AgentBot support assistant`;
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

    const typedHistory = (history || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
      content: m.content,
    }));

    const result = await chatWithAi(
      buildSupportPrompt(language),
      message,
      typedHistory,
      (msg) => getSmartOfflineResponse(msg, language),
    );

    return NextResponse.json({
      response: result.text,
      provider: result.provider,
    });
  } catch (error) {
    console.error('[support] Error:', error);
    return NextResponse.json({ error: 'AI support service unavailable' }, { status: 503 });
  }
}

// ──────────────────────────────────────────────────────────────
// Offline fallback — trilingual, topic-based
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string, language?: string): string {
  const lower = message.toLowerCase();
  const isRu = /[а-яё]/i.test(message);
  const isTr = /[çğıöşüÇĞİÖŞÜ]/i.test(message);
  const lang = language || 'ru';

  if (isRu || lang === 'ru') return ruOffline(lower);
  if (isTr || lang === 'tr') return trOffline(lower);
  return enOffline(lower);
}

function ruOffline(l: string): string {
  if (l.includes('виджет') || l.includes('не отображ') || l.includes('не появл'))
    return 'Проблемы с виджетом:\n1. Код перед </body>?\n2. Консоль браузера (F12) — есть ошибки?\n3. AdBlock отключён?\n4. Бот «Активен»?\n5. CSP-заголовки проверены?';
  if ((l.includes('бот') || l.includes('агент')) && (l.includes('не отвеч') || l.includes('ошибк')))
    return 'Бот не отвечает:\n1. Статус «Активен» в «Мои боты»?\n2. Тип: «ИИ-агент»?\n3. Системный промпт заполнен (шаг 3)?\n4. Пересоздайте бота.';
  if (l.includes('запис') || l.includes('календар'))
    return 'Конструктор → шаг 6 «Календарь»: рабочие дни, время, слот, буфер. Запись через виджет 24/7.';
  if (l.includes('цен') || l.includes('тариф') || l.includes('подписк'))
    return '5 тарифов: Демо (бесплатно 7д), Месячный $29, Квартальный $74, Годовой $244, Пожизненный $499. → «Подписка»';
  if (l.includes('пароль') || l.includes('войти') || l.includes('забыл'))
    return '«Забыли пароль?» на странице входа → ссылка на email (1 час). Проверьте папку «Спам». Смена: «Настройки» → «Аккаунт».';
  if (l.includes('telegram') || l.includes('whatsapp'))
    return 'Настройки бота → «Интеграции» → токен от @BotFather (Telegram) или WhatsApp Business API. Платные тарифы.';
  if (l.includes('аналитик') || l.includes('статист'))
    return 'Аналитика — на платных тарифах. Диалоги, визиты, записи, конверсия. Экспорт CSV/PDF. → «Статистика»';
  return 'Частые решения:\n• Виджет → код + F12\n• Бот → статус + промпт\n• Записи → календарь (шаг 6)\n• Тарифы → «Подписка»\n• Пароль → «Забыли пароль?»\n\nОпишите проблему подробнее!';
}

function trOffline(l: string): string {
  if (l.includes('widget') || l.includes('görünm'))
    return 'Widget sorunu:\n1. Kod </body> etiketinden önce mi?\n2. Tarayıcı konsolu (F12) kontrol edin\n3. AdBlock devre dışı?\n4. Bot durumu "Aktif" mi?';
  if ((l.includes('bot') || l.includes('ajan')) && (l.includes('yanıt') || l.includes('hatası')))
    return 'Bot yanıt vermiyor:\n1. Durum "Aktif" mi?\n2. Tür "AI Ajanı" mı?\n3. Sistem komutu (adım 3) dolu mu?\n4. Botu yeniden oluşturun.';
  if (l.includes('fiyat') || l.includes('plan'))
    return '5 plan: Demo (ücretsiz 7g), Aylık $29, 3 Aylık $74, Yıllık $244, Ömür Boyu $499. → "Abonelik"';
  if (l.includes('parola') || l.includes('giriş'))
    return 'Giriş sayfasında "Şifremi Unuttum" → e-posta bağlantısı (1 saat). Spam klasörünü kontrol edin.';
  return 'Yaygın çözümler:\n• Widget → kod + F12\n• Bot → durum + komut\n• Randevu → takvim (adım 6)\n• Planlar → "Abonelik"\n\nSorunuzu detaylı açıklayın!';
}

function enOffline(l: string): string {
  if (l.includes('widget') || l.includes('not show') || l.includes('embed'))
    return 'Widget troubleshooting:\n1. Code before </body>?\n2. Browser console (F12) — any errors?\n3. AdBlock disabled?\n4. Bot status "Active"?\n5. CSP headers checked?';
  if ((l.includes('bot') || l.includes('agent')) && (l.includes('not respond') || l.includes('error')))
    return 'Bot not responding:\n1. Status "Active" in "My Bots"?\n2. Type: "AI Agent"?\n3. System prompt filled (step 3)?\n4. Try recreating the bot.';
  if (l.includes('price') || l.includes('plan') || l.includes('subscription'))
    return '5 plans: Demo (free 7d), Monthly $29, Quarterly $74, Yearly $244, Lifetime $499. → "Subscription"';
  if (l.includes('password') || l.includes('login') || l.includes('forgot'))
    return '"Forgot Password?" on login page → email link (1 hour). Check spam folder. Change: "Settings" → "Account".';
  return 'Common solutions:\n• Widget → code + F12\n• Bot → status + prompt\n• Bookings → calendar (step 6)\n• Plans → "Subscription"\n\nPlease describe your issue in detail!';
}
