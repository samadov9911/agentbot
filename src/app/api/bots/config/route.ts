import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// In-memory cache: embedCode -> { data, timestamp }
const configCache = new Map<string, { data: Record<string, unknown>; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached(embedCode: string): Record<string, unknown> | null {
  const entry = configCache.get(embedCode);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    configCache.delete(embedCode);
    return null;
  }
  return entry.data;
}

function setCache(embedCode: string, data: Record<string, unknown>) {
  configCache.set(embedCode, { data, timestamp: Date.now() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const embedCode = searchParams.get('embedCode');

    if (!embedCode) {
      return NextResponse.json(
        { error: 'embedCode query parameter is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cached = getCached(embedCode);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Look up bot by embedCode
    const bot = await db.bot.findFirst({
      where: {
        embedCode,
        isActive: true,
        deletedAt: null,
        publishedAt: { not: null },
      },
      select: {
        id: true,
        name: true,
        type: true,
        niche: true,
        avatar: true,
        config: true,
        appearance: true,
        embedCode: true,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404 }
      );
    }

    // Parse config and appearance from JSON strings
    let parsedConfig: Record<string, unknown> = {};
    let parsedAppearance: Record<string, unknown> = {};

    try {
      parsedConfig = typeof bot.config === 'string'
        ? JSON.parse(bot.config)
        : (bot.config as Record<string, unknown>) ?? {};
    } catch {
      parsedConfig = {};
    }

    try {
      parsedAppearance = typeof bot.appearance === 'string'
        ? JSON.parse(bot.appearance)
        : (bot.appearance as Record<string, unknown>) ?? {};
    } catch {
      parsedAppearance = {};
    }

    const responseData = {
      bot: {
        id: bot.id,
        name: bot.name,
        type: bot.type,
        niche: bot.niche,
        avatar: bot.avatar,
        embedCode: bot.embedCode,
        config: parsedConfig,
        appearance: parsedAppearance,
      },
    };

    // Cache the result
    setCache(embedCode, responseData);

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Bot config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
