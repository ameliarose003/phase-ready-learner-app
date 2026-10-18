import { guestOnly, signup } from '#lib/server/controllers/accounts.js';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = guestOnly;
export const actions: Actions = { default: signup };

