import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAllLessons } from '#lib/server/lessons/lessons.js';
import { getAllPhases } from '#lib/server/phases/phases.js';

export const prerender = true;
export const GET: RequestHandler = async () => {
	const [phases, lessons] = await Promise.all([getAllPhases(), getAllLessons()]);
	return json({
		// HTML is the offline content format; do not duplicate raw Markdown or account data.
		pages: ['/', '/phases', '/lessons', ...phases.map((phase) => `/phases/${phase.id}`),
			...lessons.map((lesson) => `/lessons/${lesson.id}`)],
		lessons: lessons.map(({ id, title, phase_id }) => ({ id, title, phase_id }))
	});
};
