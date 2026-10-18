import { createHash, randomBytes } from 'node:crypto';
import { dev } from '$app/env';
import type { RequestEvent } from '@sveltejs/kit';
import db from './db.js';

export type CurrentUser = { id: number; name: string; email: string; role_name: string };
export type Session = { id: string; expiresAt: Date };
export const SESSION_COOKIE = 'phase_ready_session';
const cookieOptions = { path: '/', httpOnly: true, sameSite: 'lax' as const, secure: !dev };

function tokenHash(token: string) {
	return createHash('sha256').update(token).digest('hex');
}

/** Load current roles from the database instead of trusting role data in a cookie. */
export async function restoreSession(event: RequestEvent) {
	const token = event.cookies.get(SESSION_COOKIE);
	if (!token) return;
	if (!/^[a-f0-9]{64}$/.test(token)) {
		event.cookies.delete(SESSION_COOKIE, cookieOptions);
		return;
	}
	const result = await db.query(
		`SELECT sessions.id AS session_id, sessions.expires_at,
		        users.id, users.name, users.email, roles.role_name
		 FROM sessions
		 LEFT JOIN users ON users.id = sessions.user_id
		 LEFT JOIN roles ON roles.id = users.role_id
		 WHERE sessions.id = $1 AND sessions.expires_at > CURRENT_TIMESTAMP`,
		[tokenHash(token)]
	);
	const row = result.rows[0];
	if (!row) {
		event.cookies.delete(SESSION_COOKIE, cookieOptions);
		return;
	}
	event.locals.session = { id: row.session_id, expiresAt: row.expires_at };
	event.locals.currentUser = row.id && row.role_name
		? { id: row.id, name: row.name, email: row.email, role_name: row.role_name }
		: null;
	event.locals.isLoggedIn = event.locals.currentUser !== null;
}

/** Call with a user ID only after verifying credentials. A null user creates a guest session for flash messages. */
export async function startSession(event: RequestEvent, userId: number | null = null): Promise<Session> {
	if (userId !== null && (!Number.isInteger(userId) || userId < 1 || userId > 2147483647)) {
		throw new Error('A valid user ID is required to start a login session.');
	}
	const token = randomBytes(32).toString('hex');
	const id = tokenHash(token);
	const expiresAt = new Date(Date.now() + (userId === null ? 15 * 60 : 30 * 24 * 60 * 60) * 1000);
	const user = await db.transaction(async (client): Promise<CurrentUser | null> => {
		let currentUser: CurrentUser | null = null;
		if (userId !== null) {
			const result = await client.query(
				`SELECT users.id, users.name, users.email, roles.role_name
				 FROM users INNER JOIN roles ON roles.id = users.role_id WHERE users.id = $1`, [userId]
			);
			const row = result.rows[0];
			if (!row) throw new Error('Cannot start a session for a missing user.');
			currentUser = { id: row.id, name: row.name, email: row.email, role_name: row.role_name };
		}
		await client.query('DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP');
		await client.query('INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)', [id, userId, expiresAt]);
		// Rotate the token after login so an earlier guest session cannot be reused.
		if (event.locals.session) await client.query('DELETE FROM sessions WHERE id = $1', [event.locals.session.id]);
		return currentUser;
	});
	event.cookies.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
	event.locals.session = { id, expiresAt };
	event.locals.currentUser = user;
	event.locals.isLoggedIn = user !== null;
	return event.locals.session;
}

/** Call from a POST logout action, not a GET page load. */
export async function endSession(event: RequestEvent) {
	try {
		if (event.locals.session) await db.query('DELETE FROM sessions WHERE id = $1', [event.locals.session.id]);
	} finally {
		// Clear this browser's session even if revocation fails. The error still
		// propagates, so callers do not report successful server-side revocation.
		event.cookies.delete(SESSION_COOKIE, cookieOptions);
		event.locals.session = null;
		event.locals.currentUser = null;
		event.locals.isLoggedIn = false;
	}
}
