import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zai = await ZAI.create();
    } catch {
      // ZAI SDK not available — return offline response
      const offlineResponse = getSupportOfflineResponse(message, language);
      return NextResponse.json({ response: offlineResponse });
    }

    const langMap: Record<string, string> = {
      ru: 'Russian',
      en: 'English',
      tr: 'Turkish',
    };
    const lang = langMap[language] || 'Russian';

    const systemPrompt = `You are a 24/7 customer support AI assistant for AgentBot — an AI agent platform for business automation.

Your role:
- Help users troubleshoot technical issues with their bots, widgets, and integrations
- Guide users through setup processes (widget installation, bot configuration, calendar setup)
- Answer billing and subscription questions
- Provide step-by-step solutions in a clear, structured format

Guidelines:
- ALWAYS respond in the same language as the user's message (${lang})
- Be concise but thorough — provide numbered steps when solving problems
- If the issue is about:
  * Widget not working → check embed code, browser console, CORS, ad-blockers
  * Bot not responding → check API keys, bot status, system prompt
  * Booking/calendar → check calendar configuration, working days, time slots
  * Billing/subscription → direct to subscription page, explain plans
  * Integration (Telegram/WhatsApp) → check tokens, webhooks, bot permissions
- Use formatting: numbered lists, bold text for key terms, code blocks for code snippets
- If you cannot solve the problem, suggest contacting human support

Current user language: ${lang}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(history || []),
      { role: 'user' as const, content: message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Support AI error:', error);
    return NextResponse.json({ error: 'AI support service unavailable' }, { status: 503 });
  }
}

function getSupportOfflineResponse(message: string, language?: string): string {
  const lang = language || 'ru';
  const lower = message.toLowerCase();

  if (lang === 'ru' || /[а-яё]/i.test(message)) {
    if (lower.includes('виджет') || lower.includes('не работ')) {
      return 'Для решения проблем с виджетом:\n\n1. Проверьте, что код встраивания установлен перед закрывающим тегом </body>\n2. Откройте консоль браузера (F12) на наличие ошибок\n3. Убедитесь, что нет блокировщиков рекламы (AdBlock и т.д.)\n4. Проверьте, что бот опубликован (статус «Активен»)\n5. Если используете фреймворк, проверьте CSP-заголовки\n\nЕсли проблема остаётся — напишите нам подробности.';
    }
    if (lower.includes('бот') && (lower.includes('не отвеч') || lower.includes('ошибк'))) {
      return 'Если бот не отвечает:\n\n1. Проверьте статус бота в разделе «Мои боты» — должен быть «Активен»\n2. Проверьте системный промпт на шаге 3 конструктора\n3. Убедитесь, что тип бота выбран правильно (AI для интеллектуальных ответов)\n4. Попробуйте пересоздать бота или сбросить черновик\n\nДля более детальной диагностики напишите нам.';
    }
    if (lower.includes('запис') || lower.includes('календар')) {
      return 'Настройка календаря:\n\n1. В конструкторе перейдите к шагу 6 «Календарь»\n2. Выберите рабочие дни\n3. Установите время начала и окончания работы\n4. Настройте длительность слота (30/45/60/90 мин)\n5. Укажите буфер между записями\n\nКлиенты смогут записываться через чат-виджет бота.';
    }
    return 'Спасибо за обращение! В данный момент поддержка работает в ограниченном режиме. Частые решения:\n\n• Виджет не работает → проверьте код встраивания и консоль браузера\n• Бот не отвечает → проверьте статус и системный промпт\n• Записи → настройте календарь в конструкторе (шаг 6)\n• Тарифы → раздел «Подписка» в личном кабинете\n\nЕсли проблема не решена — попробуйте позже или напишите на почту.';
  }

  if (lang === 'tr') {
    return 'Şu anda destek sınırlı modda çalışıyor. Yaygın çözümler:\n\n• Widget çalışmıyor → embed kodunu ve tarayıcı konsolunu kontrol edin\n• Bot yanıt vermiyor → bot durumunu ve sistem istemini kontrol edin\n• Randevu → oluşturucuda (adım 6) takvimi yapılandırın\n• Planlar → kontrol panelinde «Abonelik» bölümüne gidin';
  }

  return "Thank you for contacting support! We're currently in limited mode. Common solutions:\n\n• Widget not working → check embed code and browser console\n• Bot not responding → check status and system prompt\n• Bookings → configure calendar in builder (step 6)\n• Plans → visit 'Subscription' in your dashboard\n\nIf unresolved, please try again later or contact us via email.";
}
