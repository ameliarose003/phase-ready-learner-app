import type { Handler, Loader } from '../http.js';
import { listPhases } from '#lib/server/controllers/phases.js';
export const load: Loader = listPhases;

