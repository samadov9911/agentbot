import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { chatWithAi } from '@/lib/ai';

// ── POST: Execute an AI call, generate transcript + summary, save to DB ──

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientPhone, companyPhone, taskDescription, script, language } = body;

    if (!clientPhone || !companyPhone || !taskDescription) {
      return NextResponse.json({ error: 'clientPhone, companyPhone and taskDescription are required' }, { status: 400 });
    }

    const lang = language === 'en' ? 'English' : language === 'tr' ? 'Turkish' : 'Russian';

    // ── 1. Generate call transcript via AI ──
    const transcriptPrompt = `You are a call simulator. Generate a realistic phone conversation between an AI agent and a client.

Language: ${lang}
Task: ${taskDescription}
${script ? `Reference script:\n${script}` : ''}

Rules:
- Generate 8-14 dialogue lines (back and forth between AI agent and client)
- The AI agent calls the client from company phone ${companyPhone} to ${clientPhone}
- The AI agent should try to accomplish the task: "${taskDescription}"
- The client may ask questions, show interest, or be hesitant — be realistic
- Include greetings, main discussion, and closing
- Each line should be 1-3 sentences max
- Return ONLY a JSON array, no markdown, no explanation. Format:
[{"role":"ai_agent","text":"..."},{"role":"client","text":"..."},...]`;

    const transcriptResult = await chatWithAi(
      transcriptPrompt,
      lang === 'Russian' ? 'Сгенерируй диалог' : lang === 'English' ? 'Generate the dialog' : 'Diyaloğu oluştur',
    );

    let rawTranscript = transcriptResult.text || '';
    // Strip markdown fences if present
    rawTranscript = rawTranscript.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let dialogLines: Array<{ role: string; text: string; timestamp: string }>;
    try {
      dialogLines = JSON.parse(rawTranscript);
    } catch {
      // Fallback: create a basic transcript
      const texts: Record<string, Record<string, string[]>> = {
        Russian: {
          ai: [
            'Здравствуйте! Это автоматический звонок.',
            'Отлично! Хочу обсудить с вами вопрос, связанный с нашей услугой. Вам удобно?',
            `Дело в следующем: ${taskDescription}. Это будет полезно для вас. Хотите записаться?`,
            'Конечно! Если будут вопросы — обращайтесь. Хорошего дня!',
          ],
          client: [
            'Да, слушаю вас.',
            'Да, конечно, расскажите подробнее.',
            'Звучит интересно. Давайте подумаем.',
            'Спасибо, до свидания!',
          ],
        },
        English: {
          ai: [
            'Hello! This is an automated call.',
            'Great! I want to discuss something related to our service. Is that convenient for you?',
            `Here is the thing: ${taskDescription}. It would be beneficial for you. Would you like to sign up?`,
            'Of course! If you have questions, feel free to reach out. Have a great day!',
          ],
          client: [
            'Yes, go ahead.',
            'Yes of course, tell me more.',
            'Sounds interesting. Let me think about it.',
            'Thank you, goodbye!',
          ],
        },
        Turkish: {
          ai: [
            'Merhaba! Bu otomatik bir arama.',
            'Harika! Hizmetimizle ilgili bir konuyu görüşmek istiyorum. Size uygun mu?',
            `Şu durum var: ${taskDescription}. Bu sizin için faydalı olacak. Kayıt olmak ister misiniz?`,
            'Tabii ki! Sorularınız olursa ulaşabilirsiniz. İyi günler!',
          ],
          client: [
            'Evet, dinliyorum.',
            'Evet tabii, daha fazla anlatın.',
            'İlginç geliyor. Düşüneyim.',
            'Teşekkürler, hoşça kalın!',
          ],
        },
      };

      const t = texts[lang] || texts.English;
      dialogLines = [
        { role: 'ai_agent', text: t.ai[0], timestamp: new Date().toISOString() },
        { role: 'client', text: t.client[0], timestamp: new Date(Date.now() + 3000).toISOString() },
        { role: 'ai_agent', text: t.ai[1], timestamp: new Date(Date.now() + 8000).toISOString() },
        { role: 'client', text: t.client[1], timestamp: new Date(Date.now() + 15000).toISOString() },
        { role: 'ai_agent', text: t.ai[2], timestamp: new Date(Date.now() + 22000).toISOString() },
        { role: 'client', text: t.client[2], timestamp: new Date(Date.now() + 30000).toISOString() },
        { role: 'ai_agent', text: t.ai[3], timestamp: new Date(Date.now() + 38000).toISOString() },
        { role: 'client', text: t.client[3], timestamp: new Date(Date.now() + 42000).toISOString() },
      ];
    }

    // Ensure each line has a timestamp
    const baseTime = Date.now();
    dialogLines = dialogLines.map((line, i) => ({
      role: line.role || 'ai_agent',
      text: line.text || '',
      timestamp: new Date(baseTime + i * 5000).toISOString(),
    }));

    // Simulate call duration (5-10 seconds per dialog line)
    const durationSec = Math.max(30, dialogLines.length * 6 + Math.floor(Math.random() * 20));

    // ── 2. Generate short AI summary ──
    const summaryPrompt = `Summarize the following phone call in 2-3 concise sentences. Include the outcome.

Call task: ${taskDescription}
Dialog:
${dialogLines.map(l => `[${l.role === 'ai_agent' ? 'AI' : 'Client'}]: ${l.text}`).join('\n')}

Language of summary: ${lang}
Return ONLY the summary text, no extra formatting.`;

    const summaryResult = await chatWithAi(
      'You are a concise call summary writer. Be brief and factual.',
      summaryPrompt,
    );

    const aiSummary = summaryResult.text || '';

    // ── 3. Save to database ──
    const callLog = await db.callLog.create({
      data: {
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId,
        clientPhone,
        companyPhone,
        taskDescription,
        script: script || '',
        status: 'completed',
        duration: durationSec,
        transcript: JSON.stringify(dialogLines),
        aiSummary,
      },
    });

    return NextResponse.json({
      success: true,
      callLog: {
        id: callLog.id,
        clientPhone: callLog.clientPhone,
        companyPhone: callLog.companyPhone,
        taskDescription: callLog.taskDescription,
        script: callLog.script,
        status: callLog.status,
        duration: callLog.duration,
        transcript: dialogLines,
        aiSummary: callLog.aiSummary,
        createdAt: callLog.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Calls POST error:', error);
    return NextResponse.json({ error: 'Failed to execute call' }, { status: 500 });
  }
}

// ── GET: List call logs for user ──

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('id');

    if (callId) {
      // Return specific call log
      const callLog = await db.callLog.findFirst({
        where: { id: callId, userId },
      });

      if (!callLog) {
        return NextResponse.json({ error: 'Call not found' }, { status: 404 });
      }

      let transcript: Array<{ role: string; text: string; timestamp: string }> = [];
      try {
        transcript = JSON.parse(callLog.transcript || '[]');
      } catch {
        transcript = [];
      }

      return NextResponse.json({
        callLog: {
          id: callLog.id,
          clientPhone: callLog.clientPhone,
          companyPhone: callLog.companyPhone,
          taskDescription: callLog.taskDescription,
          script: callLog.script,
          status: callLog.status,
          duration: callLog.duration,
          transcript,
          aiSummary: callLog.aiSummary,
          createdAt: callLog.createdAt.toISOString(),
        },
      });
    }

    // Return all call logs
    const callLogs = await db.callLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      callLogs: callLogs.map(cl => ({
        id: cl.id,
        clientPhone: cl.clientPhone,
        companyPhone: cl.companyPhone,
        taskDescription: cl.taskDescription,
        status: cl.status,
        duration: cl.duration,
        aiSummary: cl.aiSummary,
        createdAt: cl.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Calls GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
