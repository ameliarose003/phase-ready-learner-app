import type { Handler, Loader } from '../http.js';
import { adminDashboard } from '#lib/server/controllers/phases.js';
export const load: Loader = adminDashboard;

