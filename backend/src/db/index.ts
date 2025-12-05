import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Create connection pool
// SSL is required for Render PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_POOL_MAX || '100', 10), // Increased to 100 for high concurrency (was 50)
  min: parseInt(process.env.DB_POOL_MIN || '10', 10), // Increased minimum to 10 (was 5)
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Increased from 2s to 5s for better reliability
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  },
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Log pool configuration on startup (INFO level)
if (process.env.LOG_LEVEL !== '0' && process.env.LOG_LEVEL !== '1') {
  console.log('[DB Pool] Configuration:', {
    max: pool.options.max,
    min: pool.options.min,
  });
}

// Monitor pool health periodically (every 60 seconds) - only in DEBUG/TRACE mode
if (process.env.NODE_ENV !== 'test' && (process.env.LOG_LEVEL === '3' || process.env.LOG_LEVEL === '4')) {
  setInterval(() => {
    console.log('[DB Pool] Stats:', {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    });
  }, 60000);
}

/**
 * Execute a query with the connection pool
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    
    // Only log slow queries (> 100ms) or in trace mode
    if (duration > 100) {
      console.warn('[DB] Slow query', { duration, rows: res.rowCount, query: text.substring(0, 100) });
    } else if (process.env.LOG_LEVEL === '4') {
      // Only log all queries in TRACE mode
      console.log('[DB] Query', { duration, rows: res.rowCount });
    }
    
    return res;
  } catch (error) {
    console.error('[DB] Query error', { text, error });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Execute a function within a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the pool (for graceful shutdown)
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default {
  query,
  getClient,
  transaction,
  closePool,
};
