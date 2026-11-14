import type { Handler, Loader } from '../http.js';
import { listLessons } from '#lib/server/controllers/lessons.js';
export const load: Loader = listLessons;

