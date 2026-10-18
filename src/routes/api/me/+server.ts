import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ locals }) => json({ loggedIn: locals.isLoggedIn, user: locals.currentUser }, { headers: { 'cache-control': 'private, no-store' } });

