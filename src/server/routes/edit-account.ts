import type { Handler, Loader } from '../http.js';
import { loadAccount, editAccount } from '#lib/server/controllers/accounts.js';
export const load: Loader = loadAccount;
export const actions: Record<string, Handler> = { default: editAccount };

