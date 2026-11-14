import type { Handler, Loader } from '../http.js';
import { loadLessonForm, writeLesson } from '#lib/server/controllers/lessons.js';
export const load: Loader = loadLessonForm;
export const actions: Record<string, Handler> = { default: writeLesson };

