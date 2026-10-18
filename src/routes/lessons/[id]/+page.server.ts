import { readLesson, completeLesson } from '#lib/server/controllers/lessons.js';
import type { PageServerLoad, Actions } from './$types';
export const load: PageServerLoad = readLesson;
export const actions: Actions = {
	complete: (event) => completeLesson(event, true),
	reopen: (event) => completeLesson(event, false)
};

