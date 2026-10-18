import { error, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function requireLogin(event: RequestEvent) {
	if (event.locals.currentUser) return event.locals.currentUser;
	try { await event.locals.flash('error', 'You must be logged in to access this page.'); }
	catch { /* A failed notification must not prevent the login redirect. */ }
	redirect(303, '/login');
}

export function requireRole(roleName: 'user' | 'admin') {
	return async (event: RequestEvent) => {
		const user = await requireLogin(event);
		if (user.role_name !== roleName) error(403, 'You do not have permission to access this page.');
		return user;
	};
}
