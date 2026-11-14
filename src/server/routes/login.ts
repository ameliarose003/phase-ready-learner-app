import type { Handler, Loader } from '../http.js';
import { guestOnly, login } from '#lib/server/controllers/accounts.js';
export const load: Loader = guestOnly;
export const actions: Record<string, Handler> = { default: login };

