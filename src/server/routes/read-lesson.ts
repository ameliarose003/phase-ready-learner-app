import type { Handler, Loader } from '../http.js';
import { readLesson, completeLesson } from '#lib/server/controllers/lessons.js';
export const load: Loader = readLesson;
export const actions: Record<string, Handler> = {
	complete: (event) => completeLesson(event, true),
	reopen: (event) => completeLesson(event, false)
};

