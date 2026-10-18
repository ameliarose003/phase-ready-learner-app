import { error, fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getAllPhases, getPhaseById, savePhase, updatePhase } from '../phases/phases.js';
import { getAllLessons } from '../lessons/lessons.js';
import { requireLogin, requireRole } from '../middleware/auth.js';
import { getUserById } from '../forms/registration.js';
import { getLearnerLessons } from '../lessons/progress.js';
import { validateFields, integer, text } from '../middleware/validation/shared.js';
import { validateLessonTitle, validateDisplayOrder } from '../lessons/lesson-validation.js';
import { database, formFailure, routeId, safeValues } from './shared.js';

export async function listPhases() {
	return { phases: await database(getAllPhases) };
}

export async function readPhase(event: RequestEvent) {
	const id = routeId(event.params.id);
	const [phase, lessons] = await database(() => Promise.all([getPhaseById(id), getAllLessons(id)]));
	if (!phase) error(404, 'Phase not found.');
	return { phase, lessons };
}

async function accountDashboard(event: RequestEvent) {
	const currentUser = await requireLogin(event);
	const [account, phases] = await database(() => Promise.all([getUserById(currentUser.id), getAllPhases()]));
	if (!account) error(404, 'Account not found.');
	const createdAt = new Date(account.created_at);
	return {
		user: { id: account.id, name: account.name, email: account.email, role_name: account.role_name },
		accountCreated: {
			datetime: createdAt.toISOString(),
			// Format once on the server for consistent display across SSR and hydration.
			label: new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'America/Chicago' }).format(createdAt)
		},
		phases
	};
}

export async function dashboard(event: RequestEvent) {
	const viewer = await requireLogin(event);
	if (viewer.role_name === 'admin') redirect(303, '/admin');
	const [account, lessons] = await Promise.all([
		accountDashboard(event), database(() => getLearnerLessons(viewer.id))
	]);
	const completedLessons = lessons.filter((lesson) => lesson.completed_at !== null);
	const unfinished = lessons.filter((lesson) => lesson.completed_at === null);
	const recent = unfinished.filter((lesson) => lesson.last_opened_at !== null)
		.sort((a, b) => new Date(b.last_opened_at!).getTime() - new Date(a.last_opened_at!).getTime());
	return {
		...account, completedLessons,
		nextLesson: recent[0] ?? unfinished[0] ?? null,
		totalLessons: lessons.length,
		progressPercent: lessons.length ? Math.round(completedLessons.length / lessons.length * 100) : 0,
		phaseProgress: account.phases.map((phase) => ({
			...phase,
			total: lessons.filter((lesson) => lesson.phase_id === phase.id).length,
			completed: completedLessons.filter((lesson) => lesson.phase_id === phase.id).length
		}))
	};
}

export async function adminDashboard(event: RequestEvent) {
	await requireRole('admin')(event);
	return accountDashboard(event);
}

export async function managePhases(event: RequestEvent) {
	await requireRole('admin')(event);
	return listPhases();
}

export async function writePhase(event: RequestEvent, updating = false) {
	await requireRole('admin')(event);
	const data = await event.request.formData();
	const values = safeValues(data, ['title', 'overview', 'displayOrder', 'id']);
	const checked = validateFields(data, {
		title: (value) => validateLessonTitle(text(value, 'Title')),
		overview: (value) => text(value ?? '', 'Overview').trim(),
		displayOrder: (value) => validateDisplayOrder(integer(value, 'Display order', 0)),
		id: (value) => updating ? routeId(text(value, 'Phase ID')) : null
	});
	if (!checked.success) return fail(400, { errors: checked.errors, values });
	let saved;
	try { saved = updating ? await updatePhase(checked.data.id!, checked.data) : await savePhase(checked.data); }
	catch (cause) { return formFailure(cause, values, 'title'); }
	if (!saved) error(404, 'Phase not found.');
	await event.locals.flash('success', updating ? 'Phase updated.' : 'Phase created.');
	redirect(303, '/admin/phases');
}
