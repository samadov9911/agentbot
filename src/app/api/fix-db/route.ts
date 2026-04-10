import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const COLUMNS = [
  { col: '"emailFrom"', type: 'TEXT' },
  { col: '"vapiApiKey"', type: 'TEXT' },
  { col: '"vapiPhoneId"', type: 'TEXT' },
  { col: '"vapiPhone"', type: 'TEXT' },
];

export async function POST() {
  const results: string[] = [];
  
  try {
    for (const { col, type } of COLUMNS) {
      try {
        await db.$executeRawUnsafe(
          `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS ${col} ${type};`
        );
        results.push(`OK: ${col} added`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`ERR ${col}: ${msg}`);
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error), results }, { status: 500 });
  }
}
