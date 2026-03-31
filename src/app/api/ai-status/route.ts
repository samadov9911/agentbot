import { NextResponse } from 'next/server';
import { getAiProviders, isAiAvailable } from '@/lib/ai';

export async function GET() {
  return NextResponse.json({
    available: isAiAvailable(),
    providers: getAiProviders(),
  });
}
