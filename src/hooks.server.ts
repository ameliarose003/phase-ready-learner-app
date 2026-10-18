import type { Handle } from '@sveltejs/kit/hooks';
import { error } from '@sveltejs/kit';
import { globalMiddleware } from '#lib/server/middleware/global.js';
import { createFlash } from '#lib/server/middleware/flash.js';
import { requireRole } from '#lib/server/middleware/auth.js';
import { restoreSession } from '#lib/server/sessions.js';

export const handle: Handle = async ({ event, resolve }) => {
	globalMiddleware(event);
	event.locals.flash = createFlash(event);
	try { await restoreSession(event); }
	catch { error(503, 'Unable to verify your session. Please try again shortly.'); }
	// Protect admin pages, form actions, and endpoints before they run.
	// Route IDs are canonical, so encoded URLs and route groups cannot bypass this check.
	const routePath = event.route.id?.replace(/\/\([^/]+\)/g, '') ?? event.url.pathname;
	if (routePath === '/admin' || routePath.startsWith('/admin/')) {
		await requireRole('admin')(event);
	}
	const response = await resolve(event);
	if (event.locals.session) response.headers.set('cache-control', 'private, no-store');
	return response;
};
