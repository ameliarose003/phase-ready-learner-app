import bcrypt from 'bcrypt';
import db from '../db.js';
import { normalizeEmail, validateLoginPassword } from './user-validation.js';

// This record includes a password hash for verification. Keep it on the server;
// never return the whole record from a load function or form action.
/** @param {string} email */
export async function findUserByEmail(email) {
	const result = await db.query(
		`SELECT users.id, users.name, users.email, users.password,
		        users.created_at, roles.role_name
		 FROM users
		 INNER JOIN roles ON users.role_id = roles.id
		 WHERE LOWER(users.email) = $1
		 LIMIT 1`,
		[normalizeEmail(email)]
	);
	return result.rows[0] ?? null;
}

/** @param {string} plainPassword @param {string} hashedPassword */
export async function verifyPassword(plainPassword, hashedPassword) {
	if (typeof hashedPassword !== 'string' || !hashedPassword) return false;
	try { validateLoginPassword(plainPassword); } catch { return false; }

	// Do not trim passwords or enforce the new-account minimum here: older
	// accounts may have shorter passwords that still need to be verified.
	return await bcrypt.compare(plainPassword, hashedPassword);
}
