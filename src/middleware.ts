import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Middleware
 * Allows the AgentBot widget (embedded on external websites) to communicate
 * with the API routes on agentbot-one.vercel.app.
 *
 * Critical routes:
 * - GET  /api/bots/config       → widget fetches bot configuration
 * - POST /api/bot-demo-chat     → widget sends user messages to AI
 * - POST /api/bot-demo-chat     → widget receives AI responses
 *
 * Without this middleware, the browser blocks all cross-origin fetch() calls
 * from external sites due to the Same-Origin Policy.
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-id, x-forwarded-for, x-real-ip',
  'Access-Control-Max-Age': '86400', // 24 hours — browser caches preflight response
};

export function middleware(request: NextRequest) {
  // Handle CORS preflight (OPTIONS) requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  // For all other requests, attach CORS headers to the response
  const response = NextResponse.next();
  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    // Apply CORS to all API routes
    '/api/:path*',
  ],
};
