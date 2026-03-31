import { NextRequest, NextResponse } from 'next/server';
import { chatWithAi } from '@/lib/ai';

// ──────────────────────────────────────────────────────────────
// System prompt — SENIOR technical support engineer
// ──────────────────────────────────────────────────────────────

function buildSupportPrompt(language?: string): string {
  const langMap: Record<string, string> = { ru: 'Russian', en: 'English', tr: 'Turkish' };
  const lang = langMap[language || 'ru'] || 'Russian';

  return `You are a senior technical support engineer for AgentBot — an AI agent SaaS platform. You have 8+ years of experience in web development, chatbot systems, API integrations, and SaaS platforms. You solve problems systematically and NEVER give up.

## YOUR APPROACH:
1. **Diagnose first** — Ask clarifying questions to understand the exact issue before giving solutions. Don't guess.
   - "What exactly happens when you try to do X?"
   - "Can you share a screenshot or the exact error message?"
   - "Which browser/OS are you using?"
   - "When did this start happening?"

2. **Solve step by step** — Provide numbered, sequential troubleshooting steps. Start with the most likely cause.

3. **Explain WHY** — Don't just say "do this". Explain why it fixes the issue so the user learns.

4. **Follow up** — After each solution, ask "Did this help?" or "Is the issue resolved?"

5. **Escalate when needed** — If the issue seems complex, suggest:
   - Checking browser console (F12)
   - Clearing cache/cookies
   - Trying a different browser
   - Contacting human support with specific details

## TROUBLESHOOTING KNOWLEDGE BASE:

**Widget Issues:**
- Embed code must be before </body> tag
- Check browser console (F12) for JavaScript errors
- AdBlock/uBlock can block chatbot scripts
- CORS errors → check Content-Security-Policy headers
- If widget loads but doesn't respond → bot might be inactive
- React/Vue/Next.js: use useEffect + dynamic script loading
- WordPress: use Custom HTML widget or plugin
- Shopify: add to theme.liquid before </body>
- Wix/Tilda: use "Embed Code" or "Custom HTML" element

**Bot Not Responding:**
- Check bot status in dashboard → must be "Active"
- AI Agent type requires valid AI configuration
- System prompt too short → bot won't know how to respond
- Rate limiting → too many messages per minute
- Check if API quota is exhausted
- Bot might be paused or in maintenance mode

**Booking/Calendar:**
- Calendar must have working days and hours configured
- Time slots must be valid (end > start)
- Buffer minutes prevent back-to-back bookings
- Client sees bot's calendar, not the business calendar
- Timezone issues → check bot timezone setting

**Account/Login:**
- "Forgot Password" sends a time-limited reset link (1 hour)
- Check spam/junk folder for reset emails
- Account can be blocked by admin (isActive: false)
- Clear browser cache and cookies if login is stuck
- Try incognito/private browsing mode

**Analytics:**
- Available on paid plans only (not Demo)
- Tracking code must be active on the website
- Data updates every 5 minutes
- Check date range filter
- Export: CSV and PDF available

**Email Campaigns:**
- Require valid email configuration (SMTP or API)
- Check email templates for required variables
- Unsubscribe links are required (anti-spam)
- Daily sending limits apply
- Check "Sent" folder for delivery status

**Telegram Integration:**
- Need bot token from @BotFather
- Webhook URL must be set correctly
- Bot must be started by user (/start command)
- Check if bot has required permissions

**WhatsApp Integration:**
- Requires WhatsApp Business API account
- Phone number must be verified
- Template messages need Meta approval
- Check webhook endpoint configuration

## COMMUNICATION STYLE:
- Language: ALWAYS respond in ${lang}
- Tone: Patient, thorough, professional but friendly
- Format: Numbered steps, **bold** for key terms, code blocks for code
- If you fix the issue, confirm and ask if they need help with anything else
- If you can't fix it, clearly explain what to try next
- NEVER say you're AI or a language model
- NEVER use ## or ### markdown headers`;
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
// Offline fallback
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string, language?: string): string {
  const l = message.toLowerCase();
  const isRu = /[а-яё]/i.test(message);
  const isTr = /[çğıöşüÇĞİÖŞÜ]/i.test(message);
  const lang = language || 'ru';

  if (isRu || lang === 'ru') return ruOffline(l);
  if (isTr || lang === 'tr') return trOffline(l);
  return enOffline(l);
}

function ruOffline(l: string): string {
  if (l.includes('виджет') || l.includes('не отображ') || l.includes('не появл'))
    return 'Давайте диагностируем:\n1. Код встраивания вставлен перед </body>?\n2. Откройте консоль (F12) — есть красные ошибки?\n3. AdBlock отключён?\n4. Бот опубликован (статус «Активен»)?\n\nКакой именно сайт? Это WordPress, React, Tilda?';
  if ((l.includes('бот') || l.includes('агент')) && (l.includes('не отвеч') || l.includes('ошибк') || l.includes('не работ')))
    return 'Что именно происходит?\n1. Бот не отображается?\n2. Отображается, но не отвечает на сообщения?\n3. Пишет ошибку?\n\nПроверьте: «Мои боты» → статус должен быть «Активен».';
  if (l.includes('пароль') || l.includes('войти') || l.includes('забыл'))
    return 'Для сброса пароля:\n1. Нажмите «Забыли пароль?» на странице входа\n2. Введите ваш email\n3. Проверьте почту (и папку «Спам»)\n4. Ссылка действует 1 час\n\nНе приходит письмо? Какая у вас почта?';
  if (l.includes('цен') || l.includes('тариф') || l.includes('подписк'))
    return 'Доступные тарифы:\n• Демо — бесплатно 7 дней\n• Месячный — $29/мес\n• Квартальный — $74 (-15%)\n• Годовой — $244 (-30%)\n• Пожизненный — $499\n\nХотите узнать, какой тариф лучше для вас?';
  return 'Опишите проблему подробнее:\n- Что именно происходит?\n- Когда это началось?\n- На каком браузере?\n\nЯ помогу разобраться!';
}

function trOffline(l: string): string {
  if (l.includes('widget') || l.includes('görünm'))
    return 'Tanı yapalım:\n1. Kod </body> etiketinden önce mi?\n2. Tarayıcı konsolu (F12) hata var mı?\n3. Bot durumu "Aktif" mi?\n\nHangi siteyi kullanıyorsunuz?';
  if (l.includes('parola') || l.includes('giriş'))
    return 'Şifre sıfırlama:\n1. Giriş sayfasında "Şifremi Unuttum"\n2. E-posta girin\n3. Gelen bağlantıya tıklayın (1 saat geçerli)\n\nSpam klasörünü kontrol edin.';
  return 'Sorunu detaylı açıklayın:\n- Ne oluyor?\n- Ne zaman başladı?\n- Hangi tarayıcı?\n\nYardımcı olacağım!';
}

function enOffline(l: string): string {
  if (l.includes('widget') || l.includes('not show') || l.includes('embed'))
    return "Let's diagnose:\n1. Is embed code before </body>?\n2. Check browser console (F12) — any red errors?\n3. AdBlock disabled?\n4. Bot status \"Active\" in dashboard?\n\nWhich website platform are you using?";
  if (l.includes('password') || l.includes('login') || l.includes('forgot'))
    return 'To reset password:\n1. Click "Forgot Password?" on login page\n2. Enter your email\n3. Check inbox (and spam folder)\n4. Link is valid for 1 hour\n\nNot receiving the email? What email provider are you using?';
  return 'Please describe the issue in detail:\n- What exactly happens?\n- When did it start?\n- Which browser?\n\nI\'ll help troubleshoot!';
}
