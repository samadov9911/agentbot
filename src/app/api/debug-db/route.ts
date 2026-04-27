import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test 1: Raw SQL query
    const result = await db.$queryRawUnsafe<{ id: string; email: string }[]>('SELECT "id", "email" FROM "User" LIMIT 1');
    
    // Test 2: Prisma findMany
    const users = await db.user.findMany({ select: { id: true, email: true }, take: 1 });
    
    // Test 3: Prisma findUnique
    const user = await db.user.findFirst({ select: { id: true, email: true } });

    return NextResponse.json({
      rawSQL: result,
      findMany: users,
      findFirst: user,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
