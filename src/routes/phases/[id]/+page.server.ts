import { readPhase } from '#lib/server/controllers/phases.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = readPhase;
export const prerender = true;
export const entries = async () => (await listPublishedPhases()).map((phase) => ({ id: String(phase.id) }));
import { getAllPhases as listPublishedPhases } from '#lib/server/phases/phases.js';

