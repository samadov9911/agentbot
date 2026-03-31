import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ──────────────────────────────────────────────────────────────
// Supabase PgBouncer compatibility
// PgBouncer does NOT support named prepared statements.
// We monkey-patch pool.query() to strip the `name` parameter.
// ──────────────────────────────────────────────────────────────

function createPoolAndAdapter() {
  const connectionString = process.env.DATABASE_URL || '';

  if (!connectionString.startsWith('postgresql://') && !connectionString.startsWith('postgres://')) {
    return { pool: null, adapter: null };
  }

  const pool = new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 10_000,
  });

  // Monkey-patch: remove 'name' from query options for PgBouncer
  const origQuery = pool.query.bind(pool);
  (pool as any).query = (...args: any[]) => {
    if (
      args.length > 1 &&
      args[1] &&
      typeof args[1] === 'object' &&
      'name' in args[1]
    ) {
      const opts = { ...args[1] };
      delete opts.name;
      return origQuery(args[0], opts);
    }
    return origQuery(...args);
  };

  const adapter = new PrismaPg(pool);
  return { pool, adapter };
}

const { adapter } = createPoolAndAdapter();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient(
    adapter
      ? { adapter, log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] }
      : { log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] },
  )

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
