import { removeAccount } from '#lib/server/controllers/accounts.js';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = removeAccount;

