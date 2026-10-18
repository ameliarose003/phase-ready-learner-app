import bcrypt from 'bcrypt';
import { error, fail, redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { findUserByEmail, verifyPassword } from '../forms/login.js';
import { saveUser, getAllUsers, getUserById, updateUser, deleteUser } from '../forms/registration.js';
import { registrationValidation, loginValidation, updateAccountValidation } from '../middleware/validation/forms.js';
import { requireLogin, requireRole } from '../middleware/auth.js';
import { startSession, endSession } from '../sessions.js';
import { authAttemptAllowed } from './auth-rate-limit.js';
import { database, routeId, safeValues, formFailure } from './shared.js';

let dummyHash: Promise<string> | undefined;

export function guestOnly(event: RequestEvent) {
	if (event.locals.currentUser) redirect(303, event.locals.currentUser.role_name === 'admin' ? '/admin' : '/dashboard');
	return {};
}

export async function signup(event: RequestEvent) {
	guestOnly(event);
	const data = await event.request.formData();
	const values = safeValues(data, ['name', 'email', 'confirmEmail']);
	const checked = registrationValidation(data);
	if (!checked.success) return fail(400, { errors: checked.errors, values });
	try {
		if (!await authAttemptAllowed(event, checked.data.email, 'signup')) return fail(429, { errors: { form: 'Too many attempts. Try again in 15 minutes.' }, values });
		await saveUser(checked.data.name, checked.data.email, checked.data.password);
	} catch (cause) { return formFailure(cause, values, 'email'); }
	await event.locals.flash('success', 'Account created. You can now log in.');
	redirect(303, '/login');
}

export async function login(event: RequestEvent) {
	guestOnly(event);
	const data = await event.request.formData();
	const values = safeValues(data, ['email']);
	const checked = loginValidation(data);
	if (!checked.success) return fail(400, { errors: checked.errors, values });
	try {
		if (!await authAttemptAllowed(event, checked.data.email, 'login')) return fail(429, { errors: { form: 'Too many attempts. Try again in 15 minutes.' }, values });
		const user = await findUserByEmail(checked.data.email);
		const storedHash = user?.password ?? await (dummyHash ??= bcrypt.hash('phase-ready-login-timing-placeholder', 12));
		const matches = await verifyPassword(checked.data.password, storedHash);
		if (!user || !matches) return fail(400, { errors: { form: 'Email or password is incorrect.' }, values });
		await startSession(event, user.id);
	} catch { return fail(503, { errors: { form: 'Unable to log in right now. Please try again shortly.' }, values }); }
	await event.locals.flash('success', 'You are logged in.');
	redirect(303, event.locals.currentUser?.role_name === 'admin' ? '/admin' : '/dashboard');
}

export async function logout(event: RequestEvent) {
	await database(() => endSession(event));
	// Logging out must succeed without creating another database session for a message.
	redirect(303, '/');
}

export async function listUsers(event: RequestEvent) {
	await requireRole('admin')(event);
	return { users: await database(getAllUsers) };
}

async function editableAccount(event: RequestEvent) {
	const viewer = await requireLogin(event);
	const id = routeId(event.params.id);
	if (viewer.id !== id && viewer.role_name !== 'admin') error(403, 'You may only edit your own account.');
	return { viewer, id };
}

export async function loadAccount(event: RequestEvent) {
	const { viewer, id } = await editableAccount(event);
	const user = await database(() => getUserById(id));
	if (!user) error(404, 'Account not found.');
	return {
		user,
		canEditRole: viewer.role_name === 'admin' && viewer.id !== id,
		cancelHref: viewer.role_name === 'admin' ? '/users' : '/dashboard'
	};
}

export async function editAccount(event: RequestEvent) {
	const { viewer, id } = await editableAccount(event);
	const data = await event.request.formData();
	const values = safeValues(data, ['name', 'email', 'role_name']);
	const checked = updateAccountValidation(data, { allowRoleChange: viewer.role_name === 'admin' && viewer.id !== id });
	if (!checked.success) return fail(400, { errors: checked.errors, values });
	let updated;
	try { updated = await updateUser(id, checked.data.name, checked.data.email, checked.data.role_name); }
	catch (cause) { return formFailure(cause, values, 'email'); }
	if (!updated) error(404, 'Account not found.');
	if (viewer.id === id) {
		const fresh = await database(() => getUserById(id));
		event.locals.currentUser = fresh ? { id: fresh.id, name: fresh.name, email: fresh.email, role_name: fresh.role_name } : null;
		event.locals.isLoggedIn = event.locals.currentUser !== null;
	}
	await event.locals.flash('success', 'Account updated.');
	redirect(303, `/users/${id}/edit`);
}

export async function removeAccount(event: RequestEvent) {
	const viewer = await requireRole('admin')(event);
	const id = routeId(event.params.id);
	if (viewer.id === id) error(403, 'You cannot delete your own account.');
	if (!await database(() => deleteUser(id))) error(404, 'Account not found.');
	await event.locals.flash('success', 'Account deleted.');
	return redirect(303, '/users');
}
