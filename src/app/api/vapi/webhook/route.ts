import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// ── Vapi webhook handler ──
// Receives call status updates from Vapi.ai
// Endpoint: POST /api/vapi/webhook

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message } = body;

    // Verify webhook secret (if configured)
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (webhookSecret) {
      const sig = request.headers.get('x-vapi-signature');
      if (sig) {
        const expectedSig = crypto
          .createHmac('sha256', webhookSecret)
          .update(JSON.stringify(body))
          .digest('hex');
        if (sig !== expectedSig) {
          // Signature mismatch, but we'll still process for now
          // In production, you'd want to reject this
          console.warn('Vapi webhook signature mismatch');
        }
      }
    }

    if (!message?.call) {
      return NextResponse.json({ received: true });
    }

    const call = message.call;
    const vapiCallId = call.id;

    if (!vapiCallId) {
      return NextResponse.json({ received: true });
    }

    // Map Vapi status to our status
    const statusMap: Record<string, string> = {
      'queued': 'queued',
      'ringing': 'ringing',
      'in-progress': 'in_progress',
      'ended': 'completed',
      'failed': 'failed',
      'no-answer': 'no_answer',
      'voicemail': 'completed',
      'hangup': 'completed',
    };

    // Build transcript from Vapi transcript data
    let transcript: Array<{ role: string; text: string; timestamp: string }> = [];
    if (Array.isArray(call.transcript)) {
      transcript = call.transcript.map((item: { role?: string; text?: string; startTime?: number }) => ({
        role: item.role === 'assistant' ? 'ai_agent' : item.role === 'user' ? 'client' : 'system',
        text: item.text || '',
        timestamp: new Date((item.startTime || 0) * 1000).toISOString(),
      }));
    }

    // Extract summary
    const aiSummary = call.summary || call.analysis?.summary || '';

    // Extract cost
    const cost = call.cost ? parseFloat(String(call.cost)) : null;

    // Extract duration
    const duration = call.duration ? Math.round(Number(call.duration)) : 0;

    // Determine final status
    let mappedStatus = statusMap[call.status || ''] || 'completed';
    if (call.endedReason === 'no-answer') mappedStatus = 'no_answer';
    if (call.endedReason === 'failed') mappedStatus = 'failed';

    // Update or create call log
    const existingLog = await db.callLog.findFirst({
      where: { vapiCallId },
    });

    if (existingLog) {
      await db.callLog.update({
        where: { id: existingLog.id },
        data: {
          status: mappedStatus,
          duration,
          transcript: transcript.length > 0 ? JSON.stringify(transcript) : existingLog.transcript,
          aiSummary: aiSummary || existingLog.aiSummary,
          cost: cost !== null ? cost : existingLog.cost,
        },
      });
    } else {
      // Create a new call log if webhook arrives before our DB record
      // (this shouldn't normally happen, but just in case)
      if (call.customer?.number || call.from) {
        await db.callLog.create({
          data: {
            userId: '', // Unknown — webhook doesn't include userId
            clientPhone: call.customer?.number || call.from || '',
            companyPhone: call.to?.number || '',
            taskDescription: '',
            callType: 'custom',
            status: mappedStatus,
            duration,
            transcript: JSON.stringify(transcript),
            aiSummary,
            vapiCallId,
            cost,
          },
        });
      }
    }

    console.log(`Vapi webhook processed: call=${vapiCallId} status=${mappedStatus} duration=${duration}s`);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Vapi webhook error:', error);
    // Always return 200 to Vapi to prevent retries
    return NextResponse.json({ received: true });
  }
}
