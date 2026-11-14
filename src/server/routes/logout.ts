import type { Handler, Loader } from '../http.js';
import { redirect } from "../http.js";
import { logout } from '#lib/server/controllers/accounts.js';
export const load: Loader = ({ locals }) => { if (!locals.currentUser) redirect(303, '/login'); return {}; };
export const actions: Record<string, Handler> = { default: logout };

