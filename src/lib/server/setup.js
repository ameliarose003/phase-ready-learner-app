import setupUsersDatabaseTables from './users-db-setup.js';
import setupCourseDatabaseTables from './course-db-setup.js';

/** @param {...string} strings */
export const createSlug = (...strings) =>
	strings
		.filter((value) => typeof value === 'string' && value)
		.join(' ')
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')
		.replace(/-+/g, '-')
		.replace(/^-|-$/g, '');

// The database is passed in so the CLI can run without SvelteKit's virtual
// environment modules. Run setup explicitly, never during page requests.
/** @param {ReturnType<import('./postgres.js').createDatabase>} db */
export async function setupDatabase(db) {
	await db.transaction(async (client) => {
		await setupUsersDatabaseTables(client);
		await setupCourseDatabaseTables(client);
	});
	return true;
}

/** @param {ReturnType<import('./postgres.js').createDatabase>} db */
export async function testConnection(db) {
	await db.query('SELECT NOW() AS current_time');
	return true;
}
