import { managePhases, writePhase } from '#lib/server/controllers/phases.js';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = managePhases;
export const actions: Actions = { create: (event) => writePhase(event), update: (event) => writePhase(event, true) };

