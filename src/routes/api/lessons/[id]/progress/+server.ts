import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireRole } from '#lib/server/middleware/auth.js';
import { database, routeId } from '#lib/server/controllers/shared.js';
import { getLessonById } from '#lib/server/lessons/lessons.js';
import { isLessonComplete, openLesson, setLessonCompletion } from '#lib/server/lessons/progress.js';

const headers = { 'cache-control': 'private, no-store' };

export const GET: RequestHandler = async (event) => {
	const viewer = await requireRole('user')(event);
	const id = routeId(event.params.id);
	if (!await database(() => getLessonById(id))) error(404, 'Lesson not found.');
	return json({ completed: await database(() => isLessonComplete(viewer.id, id)) }, { headers });
};

export const POST: RequestHandler = async (event) => {
	// JSON requests need an explicit same-origin check in addition to form CSRF protection.
	if (event.request.headers.get('origin') !== event.url.origin) error(403, 'Invalid origin.');
	const viewer = await requireRole('user')(event);
	const id = routeId(event.params.id);
	if (!await database(() => getLessonById(id))) error(404, 'Lesson not found.');
	const body = await event.request.json().catch(() => error(400, 'Invalid JSON.'));
	if (body?.userId !== viewer.id) error(409, 'The signed-in account changed. Reload before synchronizing.');
	if (!body || typeof body !== 'object' || (body.opened !== true && typeof body.completed !== 'boolean')) {
		error(400, 'Provide a completion state or an opened event.');
	}
	if ('completed' in body && typeof body.completed !== 'boolean') error(400, 'Completion must be true or false.');
	if (body.opened === true) await database(() => openLesson(viewer.id, id));
	if (typeof body.completed === 'boolean') await database(() => setLessonCompletion(viewer.id, id, body.completed));
	return json({ completed: await database(() => isLessonComplete(viewer.id, id)) }, { headers });
};
