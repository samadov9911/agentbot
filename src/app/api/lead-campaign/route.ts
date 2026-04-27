import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

// ── POST: Launch a lead generation campaign ──
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      goal,                // Campaign goal / offer description
      recipientMode,       // 'all' | 'phones' | 'emails'
      clientPhones,        // string — comma-separated phone numbers
      clientEmails,        // string[] — email addresses
      channels,            // { email: boolean, call: boolean }
      language,            // 'ru' | 'en' | 'tr'
    } = body;

    if (!goal || !goal.trim()) {
      return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
    }

    if (!channels?.email && !channels?.call) {
      return NextResponse.json(
        { error: 'At least one channel (email or call) must be selected' },
        { status: 400 }
      );
    }

    // Fetch user data + bot for company info
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        company: true,
        emailFrom: true,
        vapiApiKey: true,
        vapiPhoneId: true,
        vapiPhone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const companyName = user.company || user.name || 'Company';
    const companyPhone = user.vapiPhone || '';

    // Build email list
    let emailRecipients: string[] = [];

    if (channels.email) {
      if (recipientMode === 'all') {
        // Fetch all leads with emails from user's bots
        const userBots = await db.bot.findMany({
          where: { userId, deletedAt: null },
          select: { id: true },
        });
        const botIds = userBots.map((b) => b.id);

        if (botIds.length > 0) {
          const leads = await db.lead.findMany({
            where: {
              botId: { in: botIds },
              visitorEmail: { not: null },
            },
            select: { visitorEmail: true },
            take: 500,
          });
          emailRecipients = leads
            .map((l) => l.visitorEmail)
            .filter((e): e is string => !!e);
        }
      } else if (recipientMode === 'emails' && Array.isArray(clientEmails)) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailRecipients = clientEmails.filter((e: string) => emailRegex.test(e.trim()));
      } else if (recipientMode === 'phones' && Array.isArray(clientPhones)) {
        // For phone mode, also look up emails from leads matching those phones
        const userBots = await db.bot.findMany({
          where: { userId, deletedAt: null },
          select: { id: true },
        });
        const botIds = userBots.map((b) => b.id);

        if (botIds.length > 0) {
          const cleanedPhones = clientPhones.map((p: string) =>
            p.replace(/[\s\-\(\)\.]/g, '')
          );
          const leads = await db.lead.findMany({
            where: {
              botId: { in: botIds },
              visitorEmail: { not: null },
              visitorPhone: { in: cleanedPhones },
            },
            select: { visitorEmail: true },
          });
          emailRecipients = leads
            .map((l) => l.visitorEmail)
            .filter((e): e is string => !!e);
        }
      }
    }

    // Build phone list
    let phoneRecipients: string[] = [];

    if (channels.call) {
      if (recipientMode === 'phones' && Array.isArray(clientPhones) && clientPhones.length > 0) {
        phoneRecipients = clientPhones;
      } else if (recipientMode === 'all') {
        // Fetch all leads with phones
        const userBots = await db.bot.findMany({
          where: { userId, deletedAt: null },
          select: { id: true },
        });
        const botIds = userBots.map((b) => b.id);

        if (botIds.length > 0) {
          const leads = await db.lead.findMany({
            where: {
              botId: { in: botIds },
              visitorPhone: { not: null },
            },
            select: { visitorPhone: true },
            take: 500,
          });
          phoneRecipients = leads
            .map((l) => l.visitorPhone)
            .filter((p): p is string => !!p);
        }
      } else if (recipientMode === 'emails') {
        // Look up phones for given emails
        const userBots = await db.bot.findMany({
          where: { userId, deletedAt: null },
          select: { id: true },
        });
        const botIds = userBots.map((b) => b.id);

        if (botIds.length > 0) {
          const leads = await db.lead.findMany({
            where: {
              botId: { in: botIds },
              visitorPhone: { not: null },
              visitorEmail: { in: clientEmails.map((e: string) => e.trim()) },
            },
            select: { visitorPhone: true },
          });
          phoneRecipients = leads
            .map((l) => l.visitorPhone)
            .filter((p): p is string => !!p);
        }
      }
    }

    // Results tracker
    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      emailsTotal: emailRecipients.length,
      callsInitiated: 0,
      callsFailed: 0,
      callsTotal: phoneRecipients.length,
      errors: [] as string[],
      vapiNotConfigured: false,
      emailNotConfigured: false,
    };

    const lang = language === 'en' ? 'en' : language === 'tr' ? 'tr' : 'ru';

    // ── Channel 1: Send Emails ──
    if (channels.email && emailRecipients.length > 0) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        results.emailNotConfigured = true;
        results.errors.push('RESEND_API_KEY not configured');
        results.emailsFailed = emailRecipients.length;
      } else {
        const fromAddress = user.emailFrom || process.env.EMAIL_FROM || 'onboarding@resend.dev';

        // Build subject and body based on language
        const emailContent = buildCampaignEmail(companyName, companyPhone, goal, lang);

        const resend = new Resend(apiKey);

        // Send in batches of 10
        for (let i = 0; i < emailRecipients.length; i += 10) {
          const batch = emailRecipients.slice(i, i + 10);
          const sendResults = await Promise.allSettled(
            batch.map((email: string) =>
              resend.emails.send({
                from: fromAddress,
                to: [email.trim()],
                subject: emailContent.subject,
                html: emailContent.html,
              })
            )
          );

          for (let j = 0; j < sendResults.length; j++) {
            const result = sendResults[j];
            const recipient = batch[j].trim();

            if (result.status === 'fulfilled') {
              const { data, error } = result.value;
              if (error) {
                results.emailsFailed++;
                results.errors.push(`${recipient}: ${String(error.message || error)}`);
              } else {
                results.emailsSent++;
              }
            } else {
              results.emailsFailed++;
              results.errors.push(`${recipient}: ${String(result.reason)}`);
            }
          }
        }
      }
    }

    // ── Channel 2: Initiate Calls ──
    if (channels.call && phoneRecipients.length > 0) {
      if (!user.vapiApiKey || !user.vapiPhoneId) {
        results.vapiNotConfigured = true;
        results.errors.push(lang === 'ru'
          ? 'Vapi не настроен. Настройте API ключ и номер телефона в разделе "Звонки клиентам".'
          : lang === 'en'
            ? 'Vapi not configured. Set up API key and phone number in "Client Calls" section.'
            : 'Vapi yapılandırılmadı. "Müşteri Aramaları" bölümünde API anahtarını ve telefon numarasını ayarlayın.');
        results.callsFailed = phoneRecipients.length;
      } else {
        // Build call prompt
        const speakIn = lang === 'en' ? 'English' : lang === 'tr' ? 'Turkish' : 'Russian';
        const systemPrompt = buildCallPrompt(companyName, goal, speakIn);
        const firstMessage = buildFirstMessage(companyName, goal, lang);

        for (const phone of phoneRecipients) {
          try {
            let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
            if (!cleaned.startsWith('+')) cleaned = '+' + cleaned;

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
                  voiceId: 'rachel',
                },
                transcriber: {
                  provider: 'deepgram',
                  model: 'nova-2',
                  language: lang === 'tr' ? 'tr' : lang === 'en' ? 'en' : 'ru',
                },
              },
              customer: {
                number: cleaned,
              },
              phoneNumberId: user.vapiPhoneId,
            };

            // Add webhook
            const serverUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VAPI_SERVER_URL || '';
            if (serverUrl) {
              (vapiPayload.assistant as Record<string, unknown>).server = {
                url: `${serverUrl}/api/vapi/webhook`,
                secret: process.env.VAPI_WEBHOOK_SECRET || 'agentbot-webhook',
              };
            }

            const vapiCall = await vapiRequest(
              user.vapiApiKey,
              '/call/phone',
              { method: 'POST', body: JSON.stringify(vapiPayload) }
            );

            const vapiCallId = (vapiCall as Record<string, string>).id || '';

            // Save call log
            await db.callLog.create({
              data: {
                userId,
                clientPhone: cleaned,
                companyPhone: companyPhone || user.vapiPhoneId || '',
                taskDescription: goal,
                script: systemPrompt,
                callType: 'lead_campaign',
                status: 'queued',
                vapiCallId: vapiCallId || null,
                duration: 0,
              },
            });

            results.callsInitiated++;
          } catch (err) {
            results.callsFailed++;
            const errMsg = err instanceof Error ? err.message : 'Call failed';
            results.errors.push(`${phone}: ${errMsg}`);
          }
        }
      }
    }

    // Save campaign to analytics
    try {
      await db.analyticsEvent.create({
        data: {
          userId,
          eventType: 'lead_campaign',
          metadata: JSON.stringify({
            goal,
            channels,
            recipientMode,
            ...results,
          }),
        },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({
      success: results.emailsSent > 0 || results.callsInitiated > 0,
      companyName,
      companyPhone,
      ...results,
    });
  } catch (error) {
    console.error('POST /api/lead-campaign error:', error);
    return NextResponse.json({ error: 'Campaign failed' }, { status: 500 });
  }
}

// ── Build email content for campaign ──
function buildCampaignEmail(
  companyName: string,
  companyPhone: string,
  goal: string,
  lang: string
): { subject: string; html: string } {
  const phoneLine = companyPhone
    ? `<p style="margin:0 0 8px;font-size:14px;color:#52525b;">📞 ${lang === 'ru' ? 'Телефон' : lang === 'en' ? 'Phone' : 'Telefon'}: ${escapeHtml(companyPhone)}</p>`
    : '';

  const content: Record<string, { subject: string; body: string }> = {
    ru: {
      subject: `Специальное предложение от ${companyName}`,
      body: `Здравствуйте!\n\n${companyName} рада предложить вам: ${goal}\n\nЭто уникальная возможность, которую вы не хотите пропустить. Мы готовы помочь вам на каждом этапе.\n\nДля получения подробной информации свяжитесь с нами или ответьте на это письмо.\n\nС уважением,\n${companyName}`,
    },
    en: {
      subject: `Special offer from ${companyName}`,
      body: `Hello!\n\n${companyName} is pleased to offer you: ${goal}\n\nThis is a unique opportunity you won't want to miss. We are ready to help you every step of the way.\n\nFor more details, contact us or reply to this email.\n\nBest regards,\n${companyName}`,
    },
    tr: {
      subject: `${companyName} özel teklifi`,
      body: `Merhaba!\n\n${companyName} size sunmaktan mutluluk duyuyor: ${goal}\n\nKaçırmak istemeyeceğiniz benzersiz bir fırsat. Her adımda size yardıma hazırız.\n\nDetaylar için bizi arayın veya bu e-postaya yanıt verin.\n\nSaygılarımızla,\n${companyName}`,
    },
  };

  const c = content[lang] || content.ru;
  const paragraphs = c.body
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => `<p style="margin:0 0 12px;font-size:15px;color:#18181b;line-height:1.6;">${escapeHtml(line)}</p>`)
    .join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding:32px 24px;">
              ${paragraphs}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px 24px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#18181b;">${escapeHtml(companyName)}</p>
              ${phoneLine}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: c.subject, html };
}

// ── Build call prompt for campaign ──
function buildCallPrompt(companyName: string, goal: string, speakIn: string): string {
  return `You are a professional AI assistant calling on behalf of "${companyName}". You MUST speak in ${speakIn}.

Your task: Contact the client with the following offer: ${goal}

Be polite, concise, and professional. Ask if they are interested. If they have questions, answer them. If they agree, summarize what was discussed. If they decline, thank them politely and end the call.`;
}

// ── Build first message for campaign call ──
function buildFirstMessage(companyName: string, goal: string, lang: string): string {
  const messages: Record<string, string> = {
    ru: `Здравствуйте! Это автоматический звонок от "${companyName}". Мы хотим предложить вам: ${goal}. Вам удобно сейчас говорить?`,
    en: `Hello! This is an automated call from "${companyName}". We'd like to offer you: ${goal}. Is this a good time to talk?`,
    tr: `Merhaba! Bu "${companyName}" adına otomatik bir arama. Size sunmak istiyoruz: ${goal}. Konuşmak için uygun musunuz?`,
  };
  return messages[lang] || messages.ru;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
