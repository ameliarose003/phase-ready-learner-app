import { readLesson } from '#lib/server/controllers/lessons.js';
import { getAllLessons } from '#lib/server/lessons/lessons.js';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = readLesson;
export const prerender = true;
export const entries = async () => (await getAllLessons()).map((lesson) => ({ id: String(lesson.id) }));

