import { removeLesson } from '#lib/server/controllers/lessons.js';
import type { RequestHandler } from './$types';
export const POST: RequestHandler = removeLesson;

