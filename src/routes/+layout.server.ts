import type { LayoutServerLoad } from './$types';
import { isPublicGuide } from '#lib/public-routes.js';
import { emptyFlash } from '#lib/server/middleware/flash.js';

export const load: LayoutServerLoad = async ({ locals, url, depends }) => {
	depends('app:session');
	const publicGuide = isPublicGuide(url.pathname);
	return {
		currentYear: locals.currentYear,
		NODE_ENV: locals.NODE_ENV,
		isLoggedIn: locals.isLoggedIn,
		currentUser: locals.currentUser,
		// Reading the URL here also makes this data refresh on navigation.
		pathname: url.pathname,
		queryParams: publicGuide ? {} : Object.fromEntries(url.searchParams),
		flashMessages: publicGuide ? emptyFlash() : await locals.flash(),
		publicGuide
	};
};
