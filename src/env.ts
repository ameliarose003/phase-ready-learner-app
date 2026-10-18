import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	// Optional while working on the UI. The database client requires DB_URL
	// when a server route actually queries the database.
	DB_URL: { schema: (value) => value ?? '' },
	ENABLE_SQL_LOGGING: { schema: (value) => value ?? 'false' }
});
