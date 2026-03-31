import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let zai: Awaited<ReturnType<typeof import('z-ai-web-dev-sdk').default.create>> | null = null;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      zai = await ZAI.create();
    } catch {
      // ZAI SDK not available (e.g. no .z-ai-config on Vercel) — return offline response
      const offlineResponse = getOfflineResponse(message, context);
      return NextResponse.json({ response: offlineResponse });
    }

    const systemPrompt = `You are an AI assistant inside the AgentBot platform dashboard — an AI agent platform for business.

Your role:
- Help users navigate the platform and set up their AI bots
- Act as a knowledgeable business automation consultant
- Recommend bot types and templates based on the user's business niche
- Help with widget integration and configuration
- Advise on customer engagement strategies
${context ? `\nContext: ${context}` : ''}

Rules:
- Always be concise, helpful and professional
- Speak the SAME LANGUAGE as the user (Russian, English or Turkish)
- When asked about business automation, suggest relevant AgentBot features
- If asked about things outside the platform, politely redirect`;

    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
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
    console.error('AI Assistant error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}

function getOfflineResponse(message: string, context?: string): string {
  const lower = message.toLowerCase();

  // Detect language
  const isRussian = /[а-яё]/i.test(message);
  const isTurkish = /[çğıöşüÇĞİÖŞÜ]/i.test(message);

  if (isRussian) {
    if (lower.includes('бот') || lower.includes('создат') || lower.includes('агент')) {
      return 'Чтобы создать ИИ-агента, перейдите в раздел «Мои боты» → «Создать бота». Выберите тип (ИИ, Rule-based, Hybrid), настройте сферу деятельности, поведение и внешний вид. Конструктор проведёт вас через все шаги. Если у вас демо-план, вы можете создать одного бота бесплатно.';
    }
    if (lower.includes('виджет') || lower.includes('встав') || lower.includes('сайт')) {
      return 'Для интеграции виджета на ваш сайт: 1) Создайте и опубликуйте бота. 2) В списке ботов нажмите «Код встраивания» и скопируйте код. 3) Вставьте этот код перед закрывающим тегом </body> на каждой странице вашего сайта. Виджет появится в правом нижнем углу.';
    }
    if (lower.includes('цен') || lower.includes('тариф') || lower.includes('подписк') || lower.includes('plan')) {
      return 'AgentBot предлагает несколько тарифных планов: Демо (бесплатно, 7 дней, 1 бот), а также платные планы с расширенными возможностями. Подробности смотрите на странице «Подписка» в личном кабинете.';
    }
    if (lower.includes('запис') || lower.includes('календар') || lower.includes('расписан')) {
      return 'Функция онлайн-записи доступна в конструкторе бота на шаге 6 «Календарь». Настройте рабочие дни, время, длительность слота и буфер между записями. Клиенты смогут записываться прямо в чат-виджете бота.';
    }
    return 'Здравствуйте! Я — AI-помощник AgentBot. Сейчас я работаю в офлайн-режиме и не могу генерировать индивидуальные ответы. Для справки: используйте конструктор ботов для создания ИИ-агента, раздел «Подписка» для управления тарифом, и раздел «Помощь» для FAQ. Если у вас возникли проблемы — перейдите в раздел «Поддержка 24/7».';
  }

  if (isTurkish) {
    if (lower.includes('bot') || lower.includes('oluştur') || lower.includes('ajan')) {
      return 'Bir AI ajanı oluşturmak için: «Botlarım» → «Bot oluştur» bölümüne gidin. Bot türünü (AI, Rule-based, Hybrid), iş alanını, davranışı ve görünümü yapılandırın. Demo planında bir adet ücretsiz bot oluşturabilirsiniz.';
    }
    return 'Merhaba! Ben AgentBot AI asistanıyım. Şu anda çevrimdışı modda çalışıyorum. Bot oluşturmak için bot oluşturucuyu kullanabilir, «Abonelik» bölümünden planlarınızı yönetebilir ve «Yardım» bölümünden SSS\'yi inceleyebilirsiniz.';
  }

  // English fallback
  if (lower.includes('bot') || lower.includes('create') || lower.includes('agent')) {
    return 'To create an AI agent, go to "My Bots" → "Create Bot". Choose a type (AI, Rule-based, Hybrid), configure your niche, behavior, and appearance. The builder will guide you through each step. Demo plan allows 1 free bot.';
  }
  if (lower.includes('widget') || lower.includes('embed') || lower.includes('website') || lower.includes('site')) {
    return 'To embed the widget on your website: 1) Create and publish a bot. 2) Click "Embed Code" in the bot list and copy the code. 3) Paste it before the closing </body> tag on your website pages.';
  }
  if (lower.includes('price') || lower.includes('plan') || lower.includes('subscription')) {
    return 'AgentBot offers several plans: Demo (free, 7 days, 1 bot) and paid plans with extended features. Visit the "Subscription" page in your dashboard for details.';
  }
  return "Hello! I'm the AgentBot AI assistant. I'm currently in offline mode and can't generate custom responses. For help: use the Bot Builder to create AI agents, the Subscription page to manage your plan, and the Help page for FAQ. If you have issues, visit the 24/7 Support section.";
}
