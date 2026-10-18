import { loadAccount, editAccount } from '#lib/server/controllers/accounts.js';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = loadAccount;
export const actions: Actions = { default: editAccount };

