import { createDatabase } from '../src/lib/server/postgres.js';
import { setupDatabase, testConnection } from '../src/lib/server/setup.js';

const db = createDatabase(process.env, process.env.NODE_ENV !== 'production');
let stage = 'connection';

try {
	await testConnection(db);
	stage = 'table creation';
	await setupDatabase(db);
	console.info('Database setup complete. User roles, phases, lessons, and learner progress are ready. No accounts were created.');
} catch (cause) {
	// Database driver errors can contain connection details or row values.
	console.error(`Database setup failed during ${stage}.`);
	const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : '';
	const hints = {
		ENOTFOUND: 'The database host could not be found. Check that your local .env uses the new External Database URL.',
		ECONNREFUSED: 'The database refused the connection. Check its status and connection settings in Render.',
		ETIMEDOUT: 'The database connection timed out. Check database availability and allowed external IP addresses.',
		'28P01': 'The database rejected the credentials. Copy the current connection URL from Render again.',
		'3D000': 'The database name was not found. Copy the connection URL from the new database.',
		'42501': 'The database account does not have permission to create the required tables.',
		CERT_HAS_EXPIRED: 'The TLS certificate has expired. Check your system clock and database TLS configuration.',
		DEPTH_ZERO_SELF_SIGNED_CERT: 'The TLS certificate could not be verified. Check the database connection endpoint and TLS configuration.'
	};
	if (!process.env.DB_URL) console.error('Set DB_URL in the project .env file before running setup.');
	else if (Object.hasOwn(hints, code)) console.error(hints[/** @type {keyof typeof hints} */ (code)]);
	else if (cause instanceof Error && /Connection terminated|timeout/i.test(cause.message)) {
		console.error('The database connection ended before setup could finish. Verify that .env uses the new External Database URL and that the database is available.');
	} else console.error('Check DB_URL, database access, and schema compatibility.');
	process.exitCode = 1;
} finally {
	await db.close();
}
