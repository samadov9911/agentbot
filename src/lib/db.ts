import { PrismaClient } from '@prisma/client'

// ──────────────────────────────────────────────────────────────
// Supabase PgBouncer compatibility
// PgBouncer does NOT support named prepared statements.
// We append pgbouncer=true to the connection URL to disable them.
// ──────────────────────────────────────────────────────────────

function getDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // For Supabase Connection Pooler, disable prepared statements
  if (url.includes('supabase.com') || url.includes('pooler')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}pgbouncer=true`;
  }

  return url;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
