import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateEmbedCode, generateCuid } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bots = await db.bot.findMany({
      where: { userId, deletedAt: null },
      include: {
        _count: { select: { conversations: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      bots: bots.map(bot => ({
        id: bot.id,
        name: bot.name,
        type: bot.type,
        niche: bot.niche,
        avatar: bot.avatar,
        config: bot.config,
        appearance: bot.appearance,
        isActive: bot.isActive,
        embedCode: bot.embedCode,
        publishedAt: bot.publishedAt?.toISOString(),
        conversationsCount: bot._count.conversations,
        createdAt: bot.createdAt.toISOString(),
        updatedAt: bot.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Bots GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── Demo limits check ──
    const userRecord = await db.user.findUnique({
      where: { id: userId },
      include: { subscriptions: { take: 1, orderBy: { createdAt: 'desc' } }, demoPeriod: true },
    });
    const planName = userRecord?.planName || userRecord?.subscriptions?.[0]?.plan || 'demo';
    const demoPeriod = userRecord?.demoPeriod;
    const isDemoPlan = planName === 'demo' || planName === 'none' || !planName;
    const demoActive = demoPeriod?.isActive && demoPeriod.expiresAt && new Date(demoPeriod.expiresAt) > new Date();
    const isExpiredDemo = isDemoPlan && !demoActive;

    if (isExpiredDemo) {
      return NextResponse.json({
        error: 'Демо-период истёк. Для создания ботов выберите платный план. / Demo period expired. Please choose a paid plan. / Demo süresi doldu. Lütfen ücretli bir plan seçin.',
        code: 'DEMO_EXPIRED',
      }, { status: 403 });
    }

    if (isDemoPlan && demoActive) {
      // Count existing bots
      const existingBotCount = await db.bot.count({ where: { userId, deletedAt: null } });
      if (existingBotCount >= 1) {
        return NextResponse.json({
          error: 'В демо-версии можно создать только 1 бота. / In demo version you can create only 1 bot. / Demo sürümünde yalnızca 1 bot oluşturabilirsiniz.',
          code: 'DEMO_BOT_LIMIT',
        }, { status: 403 });
      }
    }

    const body = await request.json();
    const { name, type, niche, avatar, config, appearance } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // ── Demo service limit: max 1 service ──
    let finalConfig = config || {};
    if (isDemoPlan && demoActive) {
      const cfg = finalConfig as Record<string, unknown>;
      const services = cfg.services as unknown[] | undefined;
      if (services && Array.isArray(services) && services.length > 1) {
        finalConfig = { ...cfg, services: [services[0]] };
      }
    }

    const embedCode = `bf_${generateEmbedCode()}`;

    const bot = await db.bot.create({
      data: {
        id: generateCuid(),
        userId,
        name,
        type,
        niche: niche || null,
        avatar: avatar || null,
        config: JSON.stringify(finalConfig),
        appearance: JSON.stringify(appearance || {}),
        embedCode,
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ bot: { id: bot.id, name: bot.name, embedCode: bot.embedCode } });
  } catch (error) {
    console.error('Bots POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, niche, greeting, style, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingBot = await db.bot.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existingBot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Parse existing config
    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(existingBot.config || '{}');
    } catch {
      config = {};
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (niche !== undefined) updateData.niche = niche || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (greeting !== undefined || style !== undefined) {
      if (greeting !== undefined) config.greeting = greeting;
      if (style !== undefined) config.tone = style;
      updateData.config = JSON.stringify(config);
    }

    const updated = await db.bot.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, bot: updated });
  } catch (error) {
    console.error('Bots PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const botId = searchParams.get('id');
    if (!botId) {
      return NextResponse.json({ error: 'Bot ID is required' }, { status: 400 });
    }

    await db.bot.update({
      where: { id: botId, userId },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bots DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
