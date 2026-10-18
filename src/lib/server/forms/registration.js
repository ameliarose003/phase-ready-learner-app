import bcrypt from 'bcrypt';
import db from '../db.js';
import { normalizeEmail, validateName, validateUserId, validateNewPassword, validateRole } from './user-validation.js';

/** @param {string} plainPassword */
export async function hashPassword(plainPassword) {
	// bcrypt ignores bytes beyond 72, so reject overlong input rather than
	// silently accepting passwords whose endings have no effect.
	validateNewPassword(plainPassword);
	return await bcrypt.hash(plainPassword, 12);
}

/** @param {string} email */
export async function emailExists(email) {
	const result = await db.query(
		'SELECT EXISTS (SELECT 1 FROM users WHERE LOWER(email) = $1) AS exists',
		[normalizeEmail(email)]
	);
	return Boolean(result.rows[0].exists);
}

/** @param {string} name @param {string} email @param {string} password */
export async function saveUser(name, email, password) {
	const normalizedName = validateName(name);
	const normalizedEmail = normalizeEmail(email);
	const hashedPassword = await hashPassword(password);
	// Public registration always assigns the learner role by name, regardless
	// of its numeric ID. No role supplied by a signup form can grant admin access.
	const result = await db.query(
		`INSERT INTO users (name, email, password, role_id)
		 SELECT $1, $2, $3, roles.id FROM roles WHERE role_name = 'user'
		 RETURNING id, name, email, created_at, updated_at`,
		[normalizedName, normalizedEmail, hashedPassword]
	);
	if (!result.rows[0]) throw new Error('Learner role is missing. Run npm run db:setup.');
	return result.rows[0];
}

// Account-management functions require authorization in their calling server
// routes. These database helpers do not establish or check login sessions.
export async function getAllUsers() {
	const result = await db.query(`
		SELECT id, name, email, created_at, updated_at FROM users
		ORDER BY created_at DESC, id DESC
	`);
	return result.rows;
}

/** @param {number} id */
export async function getUserById(id) {
	validateUserId(id);
	const result = await db.query(
		`SELECT users.id, users.name, users.email, users.created_at,
		        users.updated_at, roles.role_name
		 FROM users INNER JOIN roles ON users.role_id = roles.id
		 WHERE users.id = $1`,
		[id]
	);
	return result.rows[0] ?? null;
}

/**
 * Omit role_name to preserve the user's role. Only an authorized admin may
 * provide a role change; never forward an unchecked profile form's role field.
 * @param {number} id
 * @param {string} name
 * @param {string} email
 * @param {'user' | 'admin' | null} [role_name]
 */
export async function updateUser(id, name, email, role_name = null) {
	validateUserId(id);
	const normalizedName = validateName(name);
	const normalizedEmail = normalizeEmail(email);
	if (role_name !== null) validateRole(role_name);
	const result = await db.query(
		`UPDATE users
		 SET name = $1, email = $2,
		     role_id = CASE WHEN $3::text IS NULL THEN users.role_id
		         ELSE (SELECT id FROM roles WHERE role_name = $3) END,
		     updated_at = CURRENT_TIMESTAMP
		 WHERE id = $4
		 RETURNING id, name, email, role_id, updated_at`,
		[normalizedName, normalizedEmail, role_name, id]
	);
	return result.rows[0] ?? null;
}

/** @param {number} id */
export async function deleteUser(id) {
	validateUserId(id);
	const result = await db.query('DELETE FROM users WHERE id = $1', [id]);
	return (result.rowCount ?? 0) > 0;
}

// Query errors deliberately propagate. A connection failure must not look like
// an available email, an empty user list, or an incorrect login. Unique email
// constraints handle concurrent signups even if emailExists was checked first.
