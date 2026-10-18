import { createHash } from 'node:crypto';
import type { RequestEvent } from '@sveltejs/kit';
import db from '../db.js';

export async function authAttemptAllowed(event: RequestEvent, email: string, action: 'login' | 'signup') {
	const address = event.getClientAddress();
	await db.query("DELETE FROM auth_attempts WHERE window_started < CURRENT_TIMESTAMP - INTERVAL '1 day'");
	const counts = await Promise.all([`email:${email}`, `ip:${address}`].map(async (scope) => {
		const key = createHash('sha256').update(`${action}:${scope}`).digest('hex');
		const result = await db.query(`
			INSERT INTO auth_attempts (key, attempts) VALUES ($1, 1)
			ON CONFLICT (key) DO UPDATE SET
			 attempts = CASE WHEN auth_attempts.window_started < CURRENT_TIMESTAMP - INTERVAL '15 minutes'
			     THEN 1 ELSE auth_attempts.attempts + 1 END,
			 window_started = CASE WHEN auth_attempts.window_started < CURRENT_TIMESTAMP - INTERVAL '15 minutes'
			     THEN CURRENT_TIMESTAMP ELSE auth_attempts.window_started END
			RETURNING attempts`, [key]);
		return Number(result.rows[0].attempts);
	}));
	return counts[0] <= 10 && counts[1] <= 40;
}
