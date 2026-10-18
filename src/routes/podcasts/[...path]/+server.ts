import { legacyLessonRedirect } from '#lib/server/controllers/lessons.js';
import type { RequestHandler } from './$types';
export const GET: RequestHandler = legacyLessonRedirect;
export const POST: RequestHandler = legacyLessonRedirect;

