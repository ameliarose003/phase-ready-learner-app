import type { Handler, Loader } from '../http.js';
import { dashboard } from '#lib/server/controllers/phases.js';
export const load: Loader = dashboard;

