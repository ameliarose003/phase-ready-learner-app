import { listUsers } from '#lib/server/controllers/accounts.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = listUsers;

