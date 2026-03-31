import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, history, language } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

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
