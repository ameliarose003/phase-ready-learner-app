/** @param {import('pg').PoolClient} client */
export default async function setupCourseDatabaseTables(client) {
	await client.query(`
		CREATE TABLE IF NOT EXISTS phases (
			id SERIAL PRIMARY KEY,
			title VARCHAR(225) NOT NULL CHECK (BTRIM(title) <> ''),
			overview TEXT NOT NULL DEFAULT '',
			slug VARCHAR(225) UNIQUE NOT NULL CHECK (BTRIM(slug) <> ''),
			display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await client.query(`
		CREATE TABLE IF NOT EXISTS lessons (
			id SERIAL PRIMARY KEY,
			phase_id INTEGER NOT NULL REFERENCES phases(id) ON DELETE RESTRICT,
			title VARCHAR(225) NOT NULL CHECK (BTRIM(title) <> ''),
			description TEXT NOT NULL CHECK (BTRIM(description) <> ''),
			content TEXT NOT NULL CHECK (BTRIM(content) <> ''),
			video_url TEXT,
			slug VARCHAR(225) NOT NULL CHECK (BTRIM(slug) <> ''),
			display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
			created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			UNIQUE (phase_id, slug)
		)
	`);

	// CREATE TABLE IF NOT EXISTS does not change tables already created.
	// This also upgrades existing lessons without removing their content.
	await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS video_url TEXT');
	await client.query(`
		CREATE TABLE IF NOT EXISTS lesson_progress (
			user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
			started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			last_opened_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
			completed_at TIMESTAMPTZ,
			PRIMARY KEY (user_id, lesson_id)
		)
	`);

	await client.query(`
		CREATE INDEX IF NOT EXISTS lessons_phase_order_idx
		ON lessons (phase_id, display_order, id)
	`);
}
