import { readPhase } from '#lib/server/controllers/phases.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = readPhase;

