const dev = import.meta.env.DEV;
import type { RequestEvent } from "../../../server/http.js";

export function globalMiddleware({ locals, url }: RequestEvent) {
	locals.currentYear = new Date().getFullYear();
	locals.NODE_ENV = dev ? 'development' : 'production';
	locals.queryParams = Object.fromEntries(url.searchParams);
	locals.session = null;
	locals.currentUser = null;
	locals.isLoggedIn = false;
}

// Vue components import their styles directly.
