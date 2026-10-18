import { listLessons } from '#lib/server/controllers/lessons.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = listLessons;

