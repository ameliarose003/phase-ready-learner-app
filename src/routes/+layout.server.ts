import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, depends }) => {
	depends('app:session');
	return {
		currentYear: locals.currentYear,
		NODE_ENV: locals.NODE_ENV,
		isLoggedIn: locals.isLoggedIn,
		currentUser: locals.currentUser,
		// Reading the URL here also makes this data refresh on navigation.
		pathname: url.pathname,
		queryParams: Object.fromEntries(url.searchParams),
		flashMessages: await locals.flash()
	};
};
