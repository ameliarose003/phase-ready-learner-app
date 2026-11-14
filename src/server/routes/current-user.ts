import type { Handler, Loader } from '../http.js';
import { json } from "../http.js";
export const GET: Handler = ({ locals }) => json({ loggedIn: locals.isLoggedIn, user: locals.currentUser }, { headers: { 'cache-control': 'private, no-store' } });

