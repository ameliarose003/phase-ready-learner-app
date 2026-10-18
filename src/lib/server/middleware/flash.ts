import type { RequestEvent } from '@sveltejs/kit';
import db from '../db.js';
import { startSession } from '../sessions.js';

export type FlashType = 'success' | 'error' | 'warning' | 'info';
export type FlashMessages = Record<FlashType, string[]>;
export const emptyFlash = (): FlashMessages => ({ success: [], error: [], warning: [], info: [] });

export function createFlash(event: RequestEvent) {
	let starting: ReturnType<typeof startSession> | undefined;

	async function flash(): Promise<FlashMessages>;
	async function flash(type: FlashType): Promise<string[]>;
	async function flash(type: FlashType, message: string): Promise<void>;
	async function flash(type?: FlashType, message?: string): Promise<FlashMessages | string[] | void> {
		if (type !== undefined && !Object.hasOwn(emptyFlash(), type)) throw new Error('Invalid flash type.');
		if (message !== undefined && (typeof message !== 'string' || !message.trim() || message.length > 500)) {
			throw new Error('Flash messages must contain between 1 and 500 characters.');
		}
		if (message !== undefined && !type) throw new Error('A flash type is required.');
		if (!event.locals.session) {
			if (message === undefined) return type ? [] : emptyFlash();
			// One lazy guest session per request, even if setters run concurrently.
			starting ??= startSession(event);
			await starting;
		}
		const sessionId = event.locals.session!.id;
		return db.transaction(async (client) => {
			// Row locking prevents concurrent requests from losing or consuming a message twice.
			const result = await client.query(
				'SELECT flash FROM sessions WHERE id = $1 AND expires_at > CURRENT_TIMESTAMP FOR UPDATE', [sessionId]
			);
			if (!result.rows[0]) return type ? [] : emptyFlash();
			const messages: FlashMessages = { ...emptyFlash(), ...result.rows[0].flash };
			let retrieved: FlashMessages | string[] | undefined;
			if (message !== undefined && type) {
				messages[type] = [...messages[type], message].slice(-10);
			} else if (type) {
				retrieved = messages[type];
				messages[type] = [];
			} else {
				retrieved = { ...messages };
				Object.assign(messages, emptyFlash());
			}
			await client.query('UPDATE sessions SET flash = $1::jsonb WHERE id = $2', [JSON.stringify(messages), sessionId]);
			return retrieved;
		});
	}
	return flash;
}
