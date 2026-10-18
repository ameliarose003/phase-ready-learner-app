import { error, fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { requireLogin, requireRole } from '../middleware/auth.js';
import { lessonValidation } from '../middleware/validation/lessons.js';
import { titleExists, getAllLessons, getLessonById, saveLesson, updateLesson, deleteLesson } from '../lessons/lessons.js';
import { getAllPhases } from '../phases/phases.js';
import { openLesson, isLessonComplete, setLessonCompletion } from '../lessons/progress.js';
import { database, formFailure, routeId, safeValues } from './shared.js';

export async function listLessons() {
	const [lessons, phases] = await database(() => Promise.all([getAllLessons(), getAllPhases()]));
	return { lessons, phases };
}

export async function readLesson(event: RequestEvent) {
	const viewer = await requireLogin(event);
	const id = routeId(event.params.id);
	const lesson = await database(() => getLessonById(id));
	if (!lesson) error(404, 'Lesson not found.');
	const lessonHtml = sanitizeHtml(marked.parse(lesson.content, { async: false }), {
		allowedTags: [...sanitizeHtml.defaults.allowedTags, 'h1', 'h2'],
		allowedAttributes: { a: ['href', 'title'], code: ['class'] },
		allowedSchemes: ['http', 'https', 'mailto']
	});
	// Readers need sanitized HTML, not a second copy of raw Markdown in page data.
	const { content: _content, ...metadata } = lesson;
	let completed = false;
	if (viewer.role_name === 'user') {
		await database(() => openLesson(viewer.id, id));
		completed = await database(() => isLessonComplete(viewer.id, id));
	}
	return { lesson: metadata, lessonHtml, completed };
}

export async function completeLesson(event: RequestEvent, complete: boolean) {
	const viewer = await requireRole('user')(event);
	const id = routeId(event.params.id);
	if (!await database(() => setLessonCompletion(viewer.id, id, complete))) error(404, 'Lesson not found.');
	redirect(303, `/lessons/${id}`);
}

export async function loadLessonForm(event: RequestEvent) {
	await requireRole('admin')(event);
	const id = event.params.id === undefined ? null : routeId(event.params.id);
	const [phases, lesson] = await database(() => Promise.all([
		getAllPhases(), id === null ? Promise.resolve(null) : getLessonById(id)
	]));
	if (id !== null && !lesson) error(404, 'Lesson not found.');
	return { phases, lesson };
}

export async function writeLesson(event: RequestEvent) {
	await requireRole('admin')(event);
	const id = event.params.id === undefined ? null : routeId(event.params.id);
	if (id !== null && !await database(() => getLessonById(id))) error(404, 'Lesson not found.');
	const data = await event.request.formData();
	const file = data.get('contentFile');
	const values = () => safeValues(data, ['phaseId', 'title', 'description', 'content', 'video_url', 'displayOrder']);
	if (data.getAll('contentFile').length > 1) return fail(400, { errors: { contentFile: 'Choose only one Markdown file.' }, values: values() });
	if (file && typeof file !== 'string' && file.size > 0) {
		if (!file.name.toLowerCase().endsWith('.md') || file.size > 256 * 1024) {
			return fail(400, { errors: { contentFile: 'Choose a .md file no larger than 256 KB.' }, values: values() });
		}
		data.set('content', await file.text());
	}
	const checked = lessonValidation(data);
	if (!checked.success) return fail(400, { errors: checked.errors, values: values() });
	let saved;
	try {
		if (await titleExists(checked.data.title, checked.data.phaseId, id)) {
			return fail(409, { errors: { title: 'A lesson with this title already exists in this phase.' }, values: values() });
		}
		saved = id === null ? await saveLesson(checked.data) : await updateLesson(id, checked.data);
	} catch (cause) {
		// Availability checks are advisory. The unique phase/slug constraint
		// remains authoritative when simultaneous submissions race to save.
		if (typeof cause === 'object' && cause !== null && 'code' in cause && cause.code === '23505') {
			return fail(409, { errors: { title: 'Another lesson in this phase already uses this title or its URL slug.' }, values: values() });
		}
		return formFailure(cause, values(), 'title');
	}
	if (!saved) error(404, 'Lesson not found.');
	await event.locals.flash('success', id === null ? 'Lesson created.' : 'Lesson updated.');
	redirect(303, id === null ? '/lessons/upload-video' : `/lessons/${id}/edit`);
}

export async function removeLesson(event: RequestEvent) {
	await requireRole('admin')(event);
	const id = routeId(event.params.id);
	if (!await database(() => deleteLesson(id))) error(404, 'Lesson not found.');
	await event.locals.flash('success', 'Lesson deleted.');
	return redirect(303, '/lessons');
}

export function legacyLessonRedirect(event: RequestEvent) {
	return redirect(307, `/lessons${event.params.path ? `/${event.params.path}` : ''}${event.url.search}`);
}
