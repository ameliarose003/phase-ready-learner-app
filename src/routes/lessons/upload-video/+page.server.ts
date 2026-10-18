import { loadLessonForm, writeLesson } from '#lib/server/controllers/lessons.js';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = loadLessonForm;
export const actions: Actions = { default: writeLesson };

