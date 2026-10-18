// Use the same transaction client for all setup statements. Any failure rolls
// back the entire setup instead of leaving a partially initialized database.
/** @param {import('pg').PoolClient} client */
export default async function setupUsersDatabaseTables(client) {
	await client.query(`
		CREATE TABLE IF NOT EXISTS roles (
			id SERIAL PRIMARY KEY,
			role_name VARCHAR(50) UNIQUE NOT NULL,
			role_description TEXT,
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await client.query(`
		INSERT INTO roles (role_name, role_description) VALUES
			('user', 'Learner with access to course content'),
			('admin', 'Administrator who manages course phases and content')
		ON CONFLICT (role_name) DO NOTHING
	`);

	await client.query(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			name VARCHAR(225) NOT NULL,
			email VARCHAR(225) UNIQUE NOT NULL,
			password VARCHAR(225) NOT NULL,
			role_id INTEGER REFERENCES roles(id),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	// Retain support for the original users table, which had no role_id.
	await client.query(`
		ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(id)
	`);
	const { rows } = await client.query("SELECT id FROM roles WHERE role_name = 'user'");
	await client.query('UPDATE users SET role_id = $1 WHERE role_id IS NULL', [rows[0].id]);
	await client.query('ALTER TABLE users ALTER COLUMN role_id SET NOT NULL');

	// Keep emails unique even when users capitalize them differently.
	await client.query('CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_key ON users (LOWER(email))');
	await client.query(`
		CREATE TABLE IF NOT EXISTS sessions (
			id CHAR(64) PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			expires_at TIMESTAMPTZ NOT NULL,
			flash JSONB NOT NULL DEFAULT '{"success":[],"error":[],"warning":[],"info":[]}'::jsonb
		)
	`);
	await client.query('CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at)');
	await client.query(`
		CREATE TABLE IF NOT EXISTS auth_attempts (
			key CHAR(64) PRIMARY KEY,
			attempts INTEGER NOT NULL,
			window_started TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);
	await client.query('CREATE INDEX IF NOT EXISTS auth_attempts_window_idx ON auth_attempts (window_started)');
	// Accounts are created by the future registration flow, never with a shared
	// default password. Store a password hash, never the original password.
}
