import type { Handler, Loader } from '../http.js';
import { removeAccount } from '#lib/server/controllers/accounts.js';
export const POST: Handler = removeAccount;

