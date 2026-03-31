import { NextResponse } from 'next/server';
import { isAiAvailable } from '@/lib/ai';

export async function GET() {
  return NextResponse.json({
    available: isAiAvailable(),
    provider: isAiAvailable() ? 'gemini' : 'offline',
  });
}
