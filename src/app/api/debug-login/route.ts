import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const steps: string[] = [];
  
  try {
    steps.push('1-start');
    
    const body = await request.json();
    steps.push('2-body-parsed');
    
    const { email, password } = body;
    steps.push('3-extracted-fields');
    
    const user = await db.user.findUnique({ where: { email } });
    steps.push(`4-user-found:${!!user}`);
    
    if (!user || !user.passwordHash) {
      steps.push('5-no-user-or-hash');
      return NextResponse.json({ steps, error: 'Invalid email or password' }, { status: 401 });
    }
    
    steps.push('6-about-to-verify');
    
    const isValid = await verifyPassword(password, user.passwordHash);
    steps.push(`7-verified:${isValid}`);
    
    const token = generateToken();
    steps.push('8-token-generated');
    
    return NextResponse.json({ steps, success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    return NextResponse.json({ 
      steps, 
      error: msg, 
      stack: stack?.substring(0, 500),
    }, { status: 500 });
  }
}
