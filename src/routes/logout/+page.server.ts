import { redirect } from '@sveltejs/kit';
import { logout } from '#lib/server/controllers/accounts.js';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) => { if (!locals.currentUser) redirect(303, '/login'); return {}; };
export const actions: Actions = { default: logout };

