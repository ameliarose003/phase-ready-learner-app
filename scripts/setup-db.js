import { createDatabase } from '../src/lib/server/postgres.js';
import { setupDatabase, testConnection } from '../src/lib/server/setup.js';

const db = createDatabase(process.env, process.env.NODE_ENV !== 'production');

try {
	await testConnection(db);
	await setupDatabase(db);
	console.info('Database setup complete. User roles, phases, lessons, and learner progress are ready. No accounts were created.');
} catch {
	// Database driver errors can contain connection details or row values.
	console.error('Database setup failed. Check DB_URL, database access, and schema compatibility.');
	process.exitCode = 1;
} finally {
	await db.close();
}
