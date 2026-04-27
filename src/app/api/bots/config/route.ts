import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCached, setConfigCache, invalidateConfigCache } from '@/lib/config-cache';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const embedCode = searchParams.get('embedCode');

    if (!embedCode) {
      return NextResponse.json(
        { error: 'embedCode query parameter is required' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    // Check cache first (short TTL — 30s)
    const cached = getCached(embedCode);
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS },
      });
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
        updatedAt: true,
        userId: true,
      },
    });

    if (!bot) {
      return NextResponse.json(
        { error: 'Bot not found or inactive' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Verify bot owner account is active (not deleted/blocked)
    const botOwner = await db.user.findUnique({
      where: { id: bot.userId },
      select: { id: true, isActive: true, deletedAt: true },
    });
    if (!botOwner || !botOwner.isActive || botOwner.deletedAt) {
      invalidateConfigCache(embedCode);
      return NextResponse.json(
        { error: 'Bot unavailable — owner account is inactive' },
        { status: 410, headers: NO_CACHE_HEADERS }
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
        updatedAt: bot.updatedAt?.toISOString(),
        config: parsedConfig,
        appearance: parsedAppearance,
      },
    };

    // Cache the result (short TTL)
    setConfigCache(embedCode, responseData);

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...NO_CACHE_HEADERS },
    });
  } catch (error) {
    console.error('Bot config API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
