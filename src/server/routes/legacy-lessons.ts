import type { Handler, Loader } from '../http.js';
import { legacyLessonRedirect } from '#lib/server/controllers/lessons.js';
export const GET: Handler = legacyLessonRedirect;
export const POST: Handler = legacyLessonRedirect;

