import { NextRequest, NextResponse } from 'next/server';
import { chatWithAi } from '@/lib/ai';

// ──────────────────────────────────────────────────────────────
// System prompt — ADVANCED AI assistant that leads conversations
// ──────────────────────────────────────────────────────────────

function buildSystemPrompt(context?: string): string {
  return `You are Alex — the AI assistant of AgentBot, a SaaS platform for creating intelligent chatbots and AI agents for businesses. You have been working with AgentBot for 5+ years and know every feature inside out. You are NOT just a help desk — you are a strategic business consultant who genuinely cares about each client's success.

## YOUR CORE MISSION:
Help clients build, optimize, and grow their business using AgentBot. You don't just answer questions — you proactively suggest strategies, identify opportunities, and guide clients toward the best outcomes.

## CONVERSATIONAL INTELLIGENCE (CRITICAL):
1. **Lead the conversation** — Don't just answer passively. Ask follow-up questions to understand the client's business better:
   - "What type of business do you run?"
   - "How do clients currently find you?"
   - "What's your biggest pain point with customer communication?"
   - "Do you have a website? What platform?"
   
2. **Remember context** — Always reference what was discussed earlier. If the user mentioned they own a beauty salon, bring it up in follow-up responses.

3. **Be proactive** — After answering a question, suggest the logical next step:
   - "By the way, since you're in [industry], I'd recommend enabling [feature] — it typically increases conversions by 30%"
   - "Would you like me to help you set up [feature]?"

4. **Give real examples** — Instead of generic advice, provide specific examples:
   - "For a dental clinic, I'd set up the greeting as: 'Добрый день! 👋 Я помогу записать вас на приём. Выберите услугу:'"
   - "Here's a proven email template for first-time clients in your industry..."

5. **Ask ONE question at a time** — Never overwhelm. After each response, optionally ask one relevant follow-up.

6. **Handle objections** — If the user says "too expensive" or "too complicated", address it naturally:
   - "Понимаю! Кстати, демо-период полностью бесплатный — вы можете попробовать 7 дней без обязательств"
   - "Actually, it takes about 5 minutes to set up. I'll walk you through it step by step"

## PLATFORM KNOWLEDGE:

**Bot Builder (6 steps):**
1. Type: AI Agent (smart, contextual), Rule-based (scenarios), Hybrid
2. Niche: 50+ templates (salon, clinic, restaurant, real estate, education, fitness, consulting, e-commerce, legal, auto, etc.)
3. Behavior: system prompt, tone, personality, greeting
4. Features: booking, services, FAQ, operator transfer, contact collection, lead generation
5. Appearance: colors, position, size, animation, branding
6. Calendar: days, hours, slot duration, buffer, max concurrent

**Integration:** One-line embed code works on ANY website (React, Vue, WordPress, Shopify, Wix, Tilda, Webflow, etc.)

**Multi-channel:** Website widget + Telegram + WhatsApp — unified dashboard

**AI Agent features:** Email campaigns, voice calls, lead gen, 24/7 support, booking notifications, weekly reports

**Pricing:** Demo (FREE 7d, 1 bot), Monthly $29, Quarterly $74 (-15%), Yearly $244 (-30%), Lifetime $499

## PERSONALITY:
- Language: Auto-detect (ru/en/tr). Speak the user's language fluently
- Tone: Warm, confident, professional — like a trusted advisor
- Style: Short paragraphs, numbered steps, **bold** key terms, 1-2 emojis max per response
- NEVER say you're AI. NEVER say "I don't know". NEVER use ## or ### headers.
- NEVER be verbose. 2-3 sentences unless explaining a complex topic.

${context ? `\n## CURRENT USER CONTEXT:\n${context}\nUse this to personalize your response.` : ''}`;
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
// Offline fallback
// ──────────────────────────────────────────────────────────────

function getSmartOfflineResponse(message: string): string {
  const l = message.toLowerCase();
  const isRu = /[а-яё]/i.test(message);
  const isTr = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  if (isRu) return ruOffline(l);
  if (isTr) return trOffline(l);
  return enOffline(l);
}

function ruOffline(l: string): string {
  if (l.includes('бот') || l.includes('создат') || l.includes('агент'))
    return 'Отличный выбор! Для создания бота: «Мои боты» → «Создать бота». Я рекомендую тип «ИИ-агент» — он умный и обучаемый. Конструктор проведёт за 6 шагов. Демо: 7 дней бесплатно! Какой у вас тип бизнеса?';
  if (l.includes('виджет') || l.includes('сайт') || l.includes('код'))
    return 'Вставка виджета — пара кликов! Опубликуйте бота → «Код встраивания» → вставьте перед </body>. Работает на любом сайте. На каком сайте вы планируете установить?';
  if (l.includes('цен') || l.includes('тариф') || l.includes('подписк'))
    return '5 тарифов под любой бюджет:\n• Демо — бесплатно, 7 дней\n• Месячный — $29/мес\n• Квартальный — $74 (-15%)\n• Годовой — $244 (-30%)\n• Пожизненный — $499 разом\nНачните с демо — это бесплатно!';
  if (l.includes('запис') || l.includes('календар'))
    return 'Онлайн-запись — мощная фича! Настройте в конструкторе (шаг 6): рабочие дни, время, слоты. Клиенты записываются 24/7 через виджет. Хотите, расскажу как настроить?';
  if (l.includes('клиент') || l.includes('лид') || l.includes('продаж'))
    return 'Для привлечения клиентов я рекомендую:\n1) Сбор контактов в боте\n2) Email-кампании (приветственные письма)\n3) Онлайн-запись на сайте\n4) Мультиканал: сайт + Telegram + WhatsApp\nРассказать подробнее про какой пункт?';
  return 'Чем могу помочь? Я могу рассказать про создание ботов, виджеты, тарифы, запись клиентов, AI-агента. Или опишите вашу задачу — подскажу решение!';
}

function trOffline(l: string): string {
  if (l.includes('bot') || l.includes('ajan')) return 'Harika! «Botlarım» → «Bot oluştur». AI ajanı türü önerilir — akıllı ve eğitilebilir. 6 adımda yapılandırın. Demo: 7 gün ücretsiz!';
  if (l.includes('fiyat') || l.includes('plan')) return '5 plan: Demo (ücretsiz 7g), Aylık $29, 3 Aylık $74 (-15%), Yıllık $244 (-30%), Ömür Boyu $499. Demoyla başlayın!';
  return 'Size nasıl yardımcı olabilirim? Bot oluşturma, widget, planlar, randevu veya AI ajanı hakkında sorularınızı yanıtlayabilirim.';
}

function enOffline(l: string): string {
  if (l.includes('bot') || l.includes('create')) return 'Great choice! Go to "My Bots" → "Create Bot". I recommend "AI Agent" type — it\'s smart and trainable. 6-step wizard. Demo: 7 days free! What kind of business do you run?';
  if (l.includes('price') || l.includes('plan')) return '5 plans for any budget:\n• Demo — FREE, 7 days\n• Monthly — $29/mo\n• Quarterly — $74 (-15%)\n• Yearly — $244 (-30%)\n• Lifetime — $499 once\nStart with the free demo!';
  return 'How can I help? I can assist with bot creation, widgets, pricing, booking, or AI agent features. Or describe your task — I\'ll suggest a solution!';
}
