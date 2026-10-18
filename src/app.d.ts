// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: import('./lib/server/sessions.js').Session | null;
			currentUser: import('./lib/server/sessions.js').CurrentUser | null;
			isLoggedIn: boolean;
			currentYear: number;
			NODE_ENV: 'development' | 'production';
			queryParams: Record<string, string>;
			flash: ReturnType<typeof import('./lib/server/middleware/flash.js').createFlash>;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
