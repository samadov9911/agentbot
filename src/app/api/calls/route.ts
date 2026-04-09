import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── Vapi API helper ──
async function vapiRequest(
  apiKey: string,
  endpoint: string,
  options: RequestInit = {}
) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://api.vapi.ai${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    throw new Error(`Vapi API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

// ── Call type prompts ──
function getCallPrompt(callType: string, taskDescription: string, companyName: string, language: string) {
  const lang = language === 'en' ? 'English' : language === 'tr' ? 'Turkish' : 'Russian';

  const basePrompt = `You are a professional AI assistant calling on behalf of "${companyName}". `;
  const speakIn = lang === 'Russian' ? 'You MUST speak in Russian.' : lang === 'Turkish' ? 'You MUST speak in Turkish.' : 'You MUST speak in English.';

  const typePrompts: Record<string, string> = {
    confirmation: `Your task: Confirm the client's upcoming appointment. Ask if the time is still convenient. If they need to reschedule, offer alternatives. Be polite and brief.`,
    reminder: `Your task: Remind the client about their upcoming appointment. Mention the date, time, and service. Ask if they have any questions. Be friendly and helpful.`,
    follow_up: `Your task: Follow up with the client after their recent service. Ask if they were satisfied. Offer to book their next appointment. Be warm and professional.`,
    custom: `Your task: ${taskDescription}`,
  };

  return basePrompt + speakIn + '\n\n' + (typePrompts[callType] || typePrompts.custom);
}

function getFirstMessage(callType: string, companyName: string, language: string) {
  const messages: Record<string, Record<string, string>> = {
    confirmation: {
      ru: `Здравствуйте! Это автоматический звонок от "${companyName}". Я звоню, чтобы подтвердить вашу запись. Вам удобно говорить?`,
      en: `Hello! This is an automated call from "${companyName}". I'm calling to confirm your appointment. Is this a good time to talk?`,
      tr: `Merhaba! Bu "${companyName}" adına otomatik bir arama. Randevunuzu onaylamak için arıyorum. Konuşmak için uygun musunuz?`,
    },
    reminder: {
      ru: `Здравствуйте! Это автоматический звонок от "${companyName}". Напоминаю о вашей предстоящей записи.`,
      en: `Hello! This is an automated call from "${companyName}". I'm calling to remind you about your upcoming appointment.`,
      tr: `Merhaba! Bu "${companyName}" adına otomatik bir arama. Yaklaşan randevunuz hakkında hatırlatma yapmak istiyorum.`,
    },
    follow_up: {
      ru: `Здравствуйте! Это автоматический звонок от "${companyName}". Я хочу узнать, как прошла ваша недавняя процедура. Вам всё понравилось?`,
      en: `Hello! This is an automated call from "${companyName}". I'd like to check in about your recent visit. How was your experience?`,
      tr: `Merhaba! Bu "${companyName}" adına otomatik bir arama. Son ziyaretiniz hakkında bilgi almak istiyorum. Deneyiminiz nasıldı?`,
    },
    custom: {
      ru: `Здравствуйте! Это автоматический звонок от "${companyName}".`,
      en: `Hello! This is an automated call from "${companyName}".`,
      tr: `Merhaba! Bu "${companyName}" adına otomatik bir arama.`,
    },
  };

  const lang = language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru';
  return messages[callType]?.[lang] || messages.custom?.[lang] || `Hello! This is "${companyName}".`;
}

// ── POST: Initiate a real Vapi call ──
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientPhone, callType, taskDescription, language } = body;

    if (!clientPhone) {
      return NextResponse.json({ error: 'clientPhone is required' }, { status: 400 });
    }

    // Fetch user's Vapi settings
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { vapiApiKey: true, vapiPhoneId: true, vapiPhone: true, company: true, name: true },
    });

    if (!user?.vapiApiKey || !user?.vapiPhoneId) {
      return NextResponse.json(
        { error: 'VAPI_NOT_CONFIGURED', message: 'Vapi не настроен' },
        { status: 400 }
      );
    }

    const companyName = user.company || user.name || 'Company';

    // Format phone numbers (ensure E.164 format)
    const formatPhone = (phone: string) => {
      let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
      if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;
      return cleaned;
    };

    const formattedClientPhone = formatPhone(clientPhone);
    const systemPrompt = getCallPrompt(callType || 'custom', taskDescription, companyName, language || 'ru');
    const firstMessage = getFirstMessage(callType || 'custom', companyName, language || 'ru');

    // Create the Vapi call
    const vapiPayload = {
      assistant: {
        firstMessage,
        model: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          systemPrompt,
          temperature: 0.7,
          maxTokens: 200,
        },
        voice: {
          provider: '11labs',
          voiceId: 'rachel', // Natural female voice
        },
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2',
          language: language === 'tr' ? 'tr' : language === 'en' ? 'en' : 'ru',
        },
      },
      customer: {
        number: formattedClientPhone,
      },
      phoneNumberId: user.vapiPhoneId,
    };

    // Add server URL for webhook
    const serverUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VAPI_SERVER_URL || '';
    if (serverUrl) {
      (vapiPayload.assistant as Record<string, unknown>).server = {
        url: `${serverUrl}/api/vapi/webhook`,
        secret: process.env.VAPI_WEBHOOK_SECRET || 'agentbot-webhook',
      };
    }

    let vapiCall: Record<string, unknown>;
    try {
      vapiCall = await vapiRequest(
        user.vapiApiKey,
        '/call/phone',
        { method: 'POST', body: JSON.stringify(vapiPayload) }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown Vapi error';
      console.error('Vapi call creation error:', errorMessage);

      // Create a failed call log
      const callLog = await db.callLog.create({
        data: {
          userId,
          clientPhone: formattedClientPhone,
          companyPhone: user.vapiPhone || user.vapiPhoneId || '',
          taskDescription: taskDescription || callType || '',
          script: systemPrompt,
          callType: callType || 'custom',
          status: 'failed',
          duration: 0,
        },
      });

      return NextResponse.json({
        success: false,
        error: 'VAPI_CALL_FAILED',
        message: errorMessage,
        callLog: {
          id: callLog.id,
          status: callLog.status,
          clientPhone: callLog.clientPhone,
          companyPhone: callLog.companyPhone,
          taskDescription: callLog.taskDescription,
          callType: callLog.callType,
          duration: callLog.duration,
          transcript: [],
          aiSummary: `Ошибка создания звонка: ${errorMessage}`,
          createdAt: callLog.createdAt.toISOString(),
        },
      });
    }

    const vapiCallId = (vapiCall as Record<string, string>).id || '';

    // Save call log to database
    const callLog = await db.callLog.create({
      data: {
        userId,
        clientPhone: formattedClientPhone,
        companyPhone: user.vapiPhone || user.vapiPhoneId || '',
        taskDescription: taskDescription || callType || '',
        script: systemPrompt,
        callType: callType || 'custom',
        status: 'queued',
        vapiCallId: vapiCallId || null,
        duration: 0,
      },
    });

    return NextResponse.json({
      success: true,
      callLog: {
        id: callLog.id,
        clientPhone: callLog.clientPhone,
        companyPhone: callLog.companyPhone,
        taskDescription: callLog.taskDescription,
        callType: callLog.callType,
        status: callLog.status,
        duration: callLog.duration,
        transcript: [],
        aiSummary: '',
        vapiCallId,
        createdAt: callLog.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Calls POST error:', error);
    return NextResponse.json({ error: 'Failed to execute call' }, { status: 500 });
  }
}

// ── GET: List call logs or get specific call ──
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('id');

    if (callId) {
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
          callType: callLog.callType,
          script: callLog.script,
          status: callLog.status,
          duration: callLog.duration,
          transcript,
          aiSummary: callLog.aiSummary,
          vapiCallId: callLog.vapiCallId,
          cost: callLog.cost,
          createdAt: callLog.createdAt.toISOString(),
        },
      });
    }

    const callLogs = await db.callLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      callLogs: callLogs.map((cl) => ({
        id: cl.id,
        clientPhone: cl.clientPhone,
        companyPhone: cl.companyPhone,
        taskDescription: cl.taskDescription,
        callType: cl.callType,
        status: cl.status,
        duration: cl.duration,
        aiSummary: cl.aiSummary,
        vapiCallId: cl.vapiCallId,
        cost: cl.cost,
        createdAt: cl.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Calls GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch calls' }, { status: 500 });
  }
}
