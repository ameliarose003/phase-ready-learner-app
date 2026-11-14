import type { Handler, Loader } from '../http.js';
import { listUsers } from '#lib/server/controllers/accounts.js';
export const load: Loader = listUsers;

