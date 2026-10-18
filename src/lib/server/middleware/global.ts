import { dev } from '$app/env';
import type { RequestEvent } from '@sveltejs/kit';

export function globalMiddleware({ locals, url }: RequestEvent) {
	locals.currentYear = new Date().getFullYear();
	locals.NODE_ENV = dev ? 'development' : 'production';
	locals.queryParams = Object.fromEntries(url.searchParams);
	locals.session = null;
	locals.currentUser = null;
	locals.isLoggedIn = false;
}

// Svelte components use CSS imports and <svelte:head> for styles/scripts.
// There is no Express HTML-asset queue to copy into the rendered page.
