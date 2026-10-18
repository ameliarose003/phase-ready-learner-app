import { createDatabase } from '../src/lib/server/postgres.js';
import { normalizeEmail } from '../src/lib/server/forms/user-validation.js';

const db = createDatabase(process.env);
try {
	if (!process.argv[2]) throw new Error('Provide an email address.');
	const email = normalizeEmail(process.argv[2]);
	const result = await db.query(`
		UPDATE users SET role_id = (SELECT id FROM roles WHERE role_name = 'admin'),
		updated_at = CURRENT_TIMESTAMP WHERE LOWER(email) = $1 RETURNING id`, [email]);
	if (!result.rowCount) throw new Error('Account not found.');
	console.info('Admin access granted to the selected account.');
} catch {
	console.error('Unable to grant admin access. Run database setup first and provide the email of an existing account.');
	process.exitCode = 1;
} finally { await db.close(); }
