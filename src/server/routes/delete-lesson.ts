import type { Handler, Loader } from '../http.js';
import { removeLesson } from '#lib/server/controllers/lessons.js';
export const POST: Handler = removeLesson;

