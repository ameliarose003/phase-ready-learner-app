import type { Handler, Loader } from '../http.js';
import { managePhases, writePhase } from '#lib/server/controllers/phases.js';
export const load: Loader = managePhases;
export const actions: Record<string, Handler> = { create: (event) => writePhase(event), update: (event) => writePhase(event, true) };

