import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ── GET: Fetch user's Vapi settings ──
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        vapiApiKey: true,
        vapiPhoneId: true,
        vapiPhone: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      configured: !!(user.vapiApiKey && user.vapiPhoneId),
      vapiPhoneId: user.vapiPhoneId || '',
      vapiPhone: user.vapiPhone || '',
      // Return masked API key for security (show only last 8 chars)
      apiKeyMasked: user.vapiApiKey
        ? `••••••••${user.vapiApiKey.slice(-8)}`
        : '',
      hasApiKey: !!user.vapiApiKey,
    });
  } catch (error) {
    console.error('Vapi settings GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// ── POST: Save user's Vapi settings ──
export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vapiApiKey, vapiPhoneId, vapiPhone } = body;

    // Validate Vapi API key by making a test request
    if (vapiApiKey) {
      try {
        const testRes = await fetch('https://api.vapi.ai/assistant', {
          headers: {
            Authorization: `Bearer ${vapiApiKey}`,
          },
        });

        if (testRes.status === 401) {
          return NextResponse.json(
            { error: 'INVALID_API_KEY', message: 'Неверный API ключ Vapi' },
            { status: 400 }
          );
        }
        // 200 or other codes mean the key is valid
      } catch {
        return NextResponse.json(
          { error: 'VAPI_UNREACHABLE', message: 'Не удалось подключиться к Vapi' },
          { status: 503 }
        );
      }
    }

    // Update user settings
    await db.user.update({
      where: { id: userId },
      data: {
        ...(vapiApiKey !== undefined ? { vapiApiKey } : {}),
        ...(vapiPhoneId !== undefined ? { vapiPhoneId } : {}),
        ...(vapiPhone !== undefined ? { vapiPhone } : {}),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vapi settings POST error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

// ── DELETE: Clear Vapi settings ──
export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await db.user.update({
      where: { id: userId },
      data: {
        vapiApiKey: null,
        vapiPhoneId: null,
        vapiPhone: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vapi settings DELETE error:', error);
    return NextResponse.json({ error: 'Failed to clear settings' }, { status: 500 });
  }
}
