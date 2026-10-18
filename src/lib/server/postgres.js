import { Pool } from 'pg';

// Shared by SvelteKit and the standalone setup command. No connection is opened
// until the first query, so building the UI does not require a database.
/** @param {{ DB_URL?: string, ENABLE_SQL_LOGGING?: string }} env */
export function createDatabase(env, development = false) {
	/** @type {Pool | undefined} */
	let pool;

	function getPool() {
		if (!env.DB_URL) throw new Error('Set DB_URL before connecting to the database.');
		if (!pool) {
			const url = new URL(env.DB_URL);
			pool = new Pool({
				connectionString: env.DB_URL,
				// Render's external endpoint requires TLS, including when its copied
				// connection URL has no sslmode query parameter.
				ssl: url.hostname.endsWith('.render.com') && !url.searchParams.has('sslmode')
					? { rejectUnauthorized: true } : undefined,
				connectionTimeoutMillis: 5000,
				// For hosted databases, use the provider's recommended TLS settings
				// in DB_URL. Certificate verification is never disabled here.
			});
			pool.on('error', () => console.error('An idle database connection failed.'));
		}
		return pool;
	}

	/** @param {string} text @param {unknown[]} [params] */
	async function query(text, params) {
		const start = Date.now();
		const result = await getPool().query(text, params);
		if (development && env.ENABLE_SQL_LOGGING === 'true') {
			// Do not log SQL or parameters: they may contain personal data.
			console.info('Database query', { duration: Date.now() - start, rows: result.rowCount });
		}
		return result;
	}

	/**
	 * @template T
	 * @param {(client: import('pg').PoolClient) => Promise<T>} callback
	 */
	async function transaction(callback) {
		const client = await getPool().connect();
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

	async function close() {
		if (pool) {
			await pool.end();
			pool = undefined;
		}
	}

	return { query, transaction, close };
}
