import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const zai = await ZAI.create();

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
    console.error('AI Assistant error:', error);
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 });
  }
}
