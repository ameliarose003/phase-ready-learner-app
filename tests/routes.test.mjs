import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcrypt';
import { createServer } from 'vite';
import { setupDatabase } from '../src/lib/server/setup.js';

let postgres, driver, server, base, adminId, learnerId, phaseId, lessonId;
const admin = new Map();
const learner = new Map();
const testKey = Symbol.for('phase-ready-isolated-route-tests');
const password = 'A test passphrase 123!';
const secret = 'PRIVATE_COURSE_BODY';

const adapt = (client) => ({
	async query(sql, params = []) {
		const result = await client.query(sql, params);
		// PGlite reports zero affected rows for SELECT; node-postgres reports
		// the selected row count. Preserve both read and write semantics.
		return { ...result, rowCount: result.affectedRows || result.rows.length };
	}
});

async function visit(path, { jar = new Map(), method = 'GET', data } = {}) {
	const headers = { accept: 'text/html', origin: base };
	if (jar.size) headers.cookie = [...jar].map(([key, value]) => key + '=' + value).join('; ');
	const response = await fetch(base + path, {
		method, headers, redirect: 'manual',
		body: data === undefined ? undefined : data instanceof FormData ? data : new URLSearchParams(data)
	});
	for (const cookie of response.headers.getSetCookie()) {
		const [pair] = cookie.split(';');
		const separator = pair.indexOf('=');
		const name = pair.slice(0, separator);
		const value = pair.slice(separator + 1);
		if (!value || /max-age=0/i.test(cookie)) jar.delete(name);
		else jar.set(name, value);
	}
	return response;
}

async function signIn(email, jar) {
	const result = await visit('/login', { method: 'POST', jar, data: { email, password } });
	assert.equal(result.status, 303, await result.text());
	assert.equal(result.headers.get('location'), email === 'admin@example.com' ? '/admin' : '/dashboard');
}

before(async () => {
	postgres = new PGlite();
	driver = {
		...adapt(postgres),
		transaction: (callback) => postgres.transaction((client) => callback(adapt(client))),
		close: async () => {}
	};
	await setupDatabase(driver);
	await setupDatabase(driver); // Exercise the actual rerunnable schema, not a SQL double.
	const hash = await bcrypt.hash(password, 4);
	for (const [name, email, role] of [['Admin', 'admin@example.com', 'admin'], ['Learner', 'learner@example.com', 'user'], ['Throttled', 'throttled@example.com', 'user']]) {
		const result = await driver.query("INSERT INTO users (name, email, password, role_id, created_at) SELECT $1, $2, $3, id, '2025-03-16T01:30:00Z'::timestamptz FROM roles WHERE role_name = $4 RETURNING id", [name, email, hash, role]);
		if (role === 'admin') adminId = result.rows[0].id;
		if (name === 'Learner') learnerId = result.rows[0].id;
	}
	phaseId = (await driver.query("INSERT INTO phases (title, overview, slug) VALUES ('Water phase', 'Public phase overview', 'water') RETURNING id")).rows[0].id;
	lessonId = (await driver.query("INSERT INTO lessons (phase_id, title, description, content, slug, video_url) VALUES ($1, 'First water lesson', 'Public lesson overview', $2, 'first-water', 'https://example.com/private.mp4') RETURNING id", [phaseId, '# Heading\n\n' + secret + '\n<script>alert(1)</script>'])).rows[0].id;
	globalThis[testKey] = driver;
	server = await createServer({
		plugins: [{ name: 'isolated-route-test-database', enforce: 'pre', load(id) {
			if (id.replaceAll('\\', '/').endsWith('/src/lib/server/db.js')) return 'export default globalThis[Symbol.for("phase-ready-isolated-route-tests")];';
		} }],
		server: { host: '127.0.0.1', port: 0, hmr: false }
	});
	await server.listen();
	base = 'http://127.0.0.1:' + server.httpServer.address().port;
	await signIn('admin@example.com', admin);
	await signIn('learner@example.com', learner);
}, { timeout: 120000 });

after(async () => {
	if (server) await server.close();
	if (postgres) await postgres.close();
	delete globalThis[testKey];
});

test('public pages and API work without exposing lesson content or credentials', async () => {
	for (const path of ['/', '/signup', '/login', '/phases', '/phases/' + phaseId, '/lessons']) {
		const response = await visit(path);
		assert.equal(response.status, 200, path + ': ' + await response.clone().text());
		const body = await response.text();
		assert.ok(!body.includes(secret), path);
		assert.ok(!body.includes('private.mp4'), path);
		assert.ok(!body.includes('$2b$'), path);
	}
	const me = await visit('/api/me');
	assert.deepEqual(await me.json(), { loggedIn: false, user: null });
	assert.match(me.headers.get('cache-control'), /no-store/);
});

test('lesson pages guide learners and reserve editing controls for admins', async () => {
	const publicList = await (await visit('/lessons')).text();
	assert.match(publicList, /Log in to take this lesson/);
	assert.match(publicList, /href="\/signup"/);
	assert.ok(!publicList.includes('Delete lesson'));
	const learnerList = await (await visit('/lessons', { jar: learner })).text();
	assert.match(learnerList, /Start lesson/);
	assert.ok(!learnerList.includes('Delete lesson'));
	assert.ok(!learnerList.includes('href="/lessons/upload-video"'));
	assert.ok(!learnerList.includes(secret));
	assert.ok(!learnerList.includes('private.mp4'));
	const adminList = await (await visit('/lessons', { jar: admin })).text();
	assert.match(adminList, /Add a lesson/);
	assert.match(adminList, /Delete lesson/);
	const lesson = await (await visit('/lessons/' + lessonId, { jar: learner })).text();
	assert.ok(lesson.includes(secret));
	assert.match(lesson, /<video controls/);
	assert.match(lesson, /href="\/lessons">Return to all lessons/);
	const editor = await (await visit('/lessons/' + lessonId + '/edit', { jar: admin })).text();
	assert.match(editor, /href="\/lessons">Cancel/);
	assert.match(editor, /name="contentFile"/);
	assert.match(editor, /name="video_url"/);
});

test('all protected original routes have working page equivalents', async () => {
	for (const path of ['/admin', '/logout', '/users', '/users/' + learnerId + '/edit', '/users/' + learnerId + '/update', '/lessons/upload-video', '/lessons/' + lessonId, '/lessons/' + lessonId + '/edit', '/lessons/' + lessonId + '/update', '/admin/phases']) {
		const response = await visit(path, { jar: admin });
		assert.equal(response.status, 200, path + ': ' + await response.text());
	}
	const me = await (await visit('/api/me', { jar: admin })).json();
	assert.equal(me.user.id, adminId);
	assert.ok(!('password' in me.user));
});

test('dashboard shows account details and dates, supports logout, and gates admin controls', async () => {
	const body = await (await visit('/dashboard', { jar: learner })).text();
	assert.match(body, /learner@example.com/);
	assert.match(body, /Account created/);
	assert.match(body, /March 15, 2025/);
	assert.match(body, /datetime="2025-03-16T01:30:00.000Z"/);
	assert.ok(body.includes('href="/users/' + learnerId + '/edit"'));
	assert.match(body, /<form method="POST" action="\/logout">/);
	for (const path of ['/users', '/lessons/upload-video', '/admin/phases']) assert.ok(!body.includes('href="' + path + '"'));
	const adminBody = await (await visit('/admin', { jar: admin })).text();
	for (const path of ['/users', '/lessons/upload-video', '/admin/phases']) assert.ok(adminBody.includes('href="' + path + '"'));
	assert.ok(!body.includes('$2b$'));
	const redirect = await visit('/dashboard', { jar: admin });
	assert.equal(redirect.status, 303);
	assert.equal(redirect.headers.get('location'), '/admin');
	assert.equal((await visit('/admin', { jar: learner })).status, 403);
});

test('learners resume unfinished lessons, save completion across sessions, and can undo it', async () => {
	await driver.query('DELETE FROM lesson_progress WHERE user_id = $1', [learnerId]);
	const extra = [];
	for (const [title, order] of [['Earlier unvisited lesson', 1], ['Most recently opened lesson', 2]]) {
		extra.push((await driver.query("INSERT INTO lessons (phase_id, title, description, content, slug, display_order) VALUES ($1, $2, 'Overview', 'Lesson body', $3, $4) RETURNING id", [phaseId, title, 'progress-' + order, order])).rows[0].id);
	}
	try {
		let body = await (await visit('/dashboard', { jar: learner })).text();
		assert.match(body, /0 of 3 lessons completed/);
		assert.ok(body.includes('href="/lessons/' + lessonId + '">Start lesson'));
		await visit('/lessons/' + extra[1], { jar: learner });
		body = await (await visit('/dashboard', { jar: learner })).text();
		assert.ok(body.includes('href="/lessons/' + extra[1] + '">Continue lesson'));
		const complete = '/lessons/' + extra[1] + '?/complete';
		assert.equal((await visit(complete, { jar: learner, method: 'POST', data: { user_id: String(adminId) } })).status, 303);
		const saved = (await driver.query('SELECT completed_at FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2', [learnerId, extra[1]])).rows[0].completed_at;
		assert.ok(saved);
		assert.equal((await driver.query('SELECT * FROM lesson_progress WHERE user_id <> $1', [learnerId])).rowCount, 0);
		await visit(complete, { jar: learner, method: 'POST', data: {} });
		assert.equal(new Date((await driver.query('SELECT completed_at FROM lesson_progress WHERE user_id = $1 AND lesson_id = $2', [learnerId, extra[1]])).rows[0].completed_at).getTime(), new Date(saved).getTime());
		const freshSession = new Map();
		await signIn('learner@example.com', freshSession);
		body = await (await visit('/dashboard', { jar: freshSession })).text();
		assert.match(body, /1 of 3 lessons completed · 33%/);
		assert.match(body, /Review lesson/);
		assert.ok(body.includes('href="/lessons/' + lessonId + '">Start lesson'));
		for (const id of [lessonId, extra[0]]) await visit('/lessons/' + id + '?/complete', { jar: learner, method: 'POST', data: {} });
		body = await (await visit('/dashboard', { jar: learner })).text();
		assert.match(body, /3 of 3 lessons completed · 100%/);
		assert.match(body, /completed every lesson/);
		assert.equal((await visit('/lessons/' + lessonId + '?/reopen', { jar: learner, method: 'POST', data: {} })).status, 303);
		assert.match(await (await visit('/dashboard', { jar: learner })).text(), /2 of 3 lessons completed · 67%/);
		assert.match(await (await visit('/lessons/' + lessonId, { jar: learner })).text(), /Mark lesson complete/);
		assert.equal((await visit('/lessons/999999?/complete', { jar: learner, method: 'POST', data: {} })).status, 404);
		assert.equal((await visit(complete, { jar: admin, method: 'POST', data: {} })).status, 403);
		assert.equal((await visit(complete, { method: 'POST', data: {} })).status, 303);
	} finally {
		for (const id of extra) await driver.query('DELETE FROM lessons WHERE id = $1', [id]);
		assert.equal((await driver.query('SELECT * FROM lesson_progress WHERE lesson_id = ANY($1::integer[])', [extra])).rowCount, 0);
		await driver.query('DELETE FROM lesson_progress WHERE user_id = $1', [learnerId]);
	}
});

test('login form links to signup, retains email on errors, and accepts valid legacy passwords', async () => {
	const form = await (await visit('/login')).text();
	assert.match(form, /<dialog[^>]*class="[^"]*login-dialog/);
	assert.match(form, /aria-labelledby="login-title"/);
	assert.match(form, /aria-label="Close login"/);
	assert.ok(!form.includes('class="portal-header"'));
	assert.match(form, /<form method="POST" action="\/login"/);
	assert.match(form, /href="\/signup"/);
	const passwordInput = form.match(/<input[^>]*name="password"[^>]*>/)[0];
	assert.match(passwordInput, /autocomplete="current-password"/);
	assert.ok(!/minlength|pattern/.test(passwordInput));
	const invalid = await visit('/login', { method: 'POST', data: { email: 'learner@example.com', password: 'IncorrectSecret!' } });
	assert.equal(invalid.status, 400);
	const invalidBody = await invalid.text();
	assert.match(invalidBody, /value="learner@example.com"/);
	assert.match(invalidBody, /class="[^"]*login-dialog/);
	assert.ok(!invalidBody.includes('IncorrectSecret!'));
	const hash = await bcrypt.hash('short', 4);
	await driver.query("INSERT INTO users (name, email, password, role_id) SELECT 'Legacy learner', 'legacy@example.com', $1, id FROM roles WHERE role_name = 'user'", [hash]);
	const jar = new Map();
	const response = await visit('/login', { jar, method: 'POST', data: { email: 'legacy@example.com', password: 'short' } });
	assert.equal(response.status, 303);
	assert.equal(response.headers.get('location'), '/dashboard');
	assert.equal((await (await visit('/api/me', { jar })).json()).loggedIn, true);
});

test('signup validates confirmations, saves a bcrypt hash, assigns learner, and shows flash once', async () => {
	const jar = new Map();
	const input = { name: 'New learner', email: ' NEW@example.com ', confirmEmail: 'new@example.com', password, confirmPassword: password, role_name: 'admin' };
	const invalid = await visit('/signup', { method: 'POST', jar, data: { ...input, confirmPassword: 'different' } });
	assert.equal(invalid.status, 400);
	assert.ok(!(await invalid.text()).includes(password));
	const response = await visit('/signup', { method: 'POST', jar, data: input });
	assert.equal(response.status, 303, await response.text());
	assert.equal(response.headers.get('location'), '/login');
	const row = (await driver.query('SELECT users.*, roles.role_name FROM users JOIN roles ON roles.id = users.role_id WHERE email = $1', ['new@example.com'])).rows[0];
	assert.equal(row.role_name, 'user');
	assert.equal(await bcrypt.compare(password, row.password), true);
	assert.match(await (await visit('/login', { jar })).text(), /Account created/);
	assert.ok(!(await (await visit('/login', { jar })).text()).includes('Account created'));
	assert.equal((await visit('/signup', { method: 'POST', data: input })).status, 409);
	await signIn('new@example.com', jar);
	assert.equal((await (await visit('/api/me', { jar })).json()).loggedIn, true);
});

test('anonymous requests redirect and learners cannot administer or edit another account', async () => {
	for (const path of ['/dashboard', '/lessons/' + lessonId]) {
		const response = await visit(path);
		assert.equal(response.status, 303);
		assert.equal(response.headers.get('location'), '/login');
	}
	for (const path of ['/users', '/admin/phases', '/lessons/upload-video', '/users/' + adminId + '/edit']) {
		assert.equal((await visit(path, { jar: learner })).status, 403, path);
	}
	for (const path of ['/users/' + adminId + '/update', '/users/' + adminId + '/delete', '/lessons/' + lessonId + '/update', '/lessons/' + lessonId + '/delete']) {
		assert.equal((await visit(path, { jar: learner, method: 'POST', data: {} })).status, 403, path);
	}
	assert.equal((await visit('/%61dmin/phases', { jar: learner })).status, 403);
});

test('account updates check ownership and prevent self-promotion', async () => {
	const path = '/users/' + learnerId + '/update';
	assert.equal((await visit(path, { jar: learner, method: 'POST', data: { name: 'Learner', email: 'learner@example.com', role_name: 'admin' } })).status, 400);
	const response = await visit(path, { jar: learner, method: 'POST', data: { name: 'Updated learner', email: ' LEARNER@example.com ' } });
	assert.equal(response.status, 303, await response.text());
	const me = await (await visit('/api/me', { jar: learner })).json();
	assert.equal(me.user.name, 'Updated learner');
	assert.equal(me.user.role_name, 'user');
	assert.equal((await visit('/users/not-an-id/edit', { jar: admin })).status, 404);
	assert.equal((await visit('/users/999999/edit', { jar: admin })).status, 404);
});

test('account forms keep own roles read-only and allow admins to edit other roles', async () => {
	const ownAdmin = await (await visit('/users/' + adminId + '/edit', { jar: admin })).text();
	assert.ok(!ownAdmin.includes('name="role_name"'));
	assert.match(ownAdmin, /Role:<\/strong> Admin/);
	assert.match(ownAdmin, /href="\/users">Cancel/);
	const ownLearner = await (await visit('/users/' + learnerId + '/edit', { jar: learner })).text();
	assert.ok(!ownLearner.includes('name="role_name"'));
	assert.match(ownLearner, /href="\/dashboard">Cancel/);
	const otherAccount = await (await visit('/users/' + learnerId + '/edit', { jar: admin })).text();
	assert.match(otherAccount, /<select name="role_name"/);
	assert.equal((await visit('/users/' + adminId + '/update', {
		jar: admin, method: 'POST', data: { name: 'Admin', email: 'admin@example.com', role_name: 'user' }
	})).status, 400);
	assert.equal((await (await visit('/api/me', { jar: admin })).json()).user.role_name, 'admin');
	assert.equal((await visit('/users/' + adminId + '/update', {
		jar: admin, method: 'POST', data: { name: 'Admin', email: 'admin@example.com' }
	})).status, 303);
	assert.equal((await (await visit('/api/me', { jar: admin })).json()).user.role_name, 'admin');
});

test('admins create and edit phases, then create, read, update and delete Markdown lessons', async () => {
	let response = await visit('/admin/phases?/create', { jar: admin, method: 'POST', data: { title: 'New phase', overview: 'A public overview', displayOrder: '4' } });
	assert.equal(response.status, 303, await response.text());
	const phase = (await driver.query("SELECT * FROM phases WHERE slug = 'new-phase'")).rows[0];
	response = await visit('/admin/phases?/update', { jar: admin, method: 'POST', data: { id: String(phase.id), title: 'Edited phase', overview: 'Updated overview', displayOrder: '5' } });
	assert.equal(response.status, 303, await response.text());
	const data = new FormData();
	for (const [field, value] of Object.entries({ phaseId: String(phase.id), title: 'Uploaded lesson', description: 'Preview text', content: '', video_url: 'https://example.com/new.mp4', displayOrder: '1' })) data.set(field, value);
	data.set('contentFile', new Blob(['# Uploaded heading\n\n' + secret + '\n<script>alert(1)</script>'], { type: 'text/markdown' }), 'lesson.md');
	response = await visit('/lessons/upload-video', { jar: admin, method: 'POST', data });
	assert.equal(response.status, 303, await response.text());
	assert.equal(response.headers.get('location'), '/lessons/upload-video');
	const id = (await driver.query("SELECT id FROM lessons WHERE phase_id = $1 AND title = 'Uploaded lesson'", [phase.id])).rows[0].id;
	const body = await (await visit('/lessons/' + id, { jar: learner })).text();
	assert.match(body, /<h1>Uploaded heading<\/h1>/);
	assert.ok(body.includes(secret));
	assert.ok(!body.includes('<script>alert(1)</script>'));
	assert.ok(!body.includes('\\u003Cscript'));
	response = await visit('/lessons/' + id + '/update', { jar: admin, method: 'POST', data: { phaseId: String(phase.id), title: 'Edited lesson', description: 'Edited overview', content: '# Edited body', video_url: '', displayOrder: '2' } });
	assert.equal(response.status, 303, await response.text());
	assert.equal(response.headers.get('location'), '/lessons/' + id + '/edit');
	assert.equal((await driver.query('SELECT video_url FROM lessons WHERE id = $1', [id])).rows[0].video_url, null);
	response = await visit('/lessons/' + id + '/delete', { jar: admin, method: 'POST', data: {} });
	assert.equal(response.status, 303);
	assert.equal((await visit('/lessons/' + id, { jar: learner })).status, 404);
});

test('invalid lesson submissions preserve safe fields and make no database changes', async () => {
	const invalid = { phaseId: String(phaseId), title: 'Invalid video', description: 'Preview', content: 'Body', video_url: 'javascript:alert(1)', displayOrder: '0' };
	assert.equal((await visit('/lessons/upload-video', { jar: admin, method: 'POST', data: invalid })).status, 400);
	assert.equal((await driver.query("SELECT COUNT(*) FROM lessons WHERE title = 'Invalid video'")).rows[0].count, 0);
	assert.equal((await visit('/lessons/not-an-id', { jar: learner })).status, 404);
	const data = new FormData();
	for (const [key, value] of Object.entries({ ...invalid, video_url: '' })) data.set(key, value);
	data.set('contentFile', new Blob(['text']), 'wrong.txt');
	assert.equal((await visit('/lessons/upload-video', { jar: admin, method: 'POST', data })).status, 400);
});

test('lesson title checks handle duplicates, unchanged edits, and moves between phases', async () => {
	const original = (await driver.query('SELECT * FROM lessons WHERE id = $1', [lessonId])).rows[0];
	const input = { phaseId: String(phaseId), title: original.title, description: original.description,
		content: original.content, video_url: original.video_url, displayOrder: String(original.display_order) };
	const duplicate = await visit('/lessons/upload-video', { jar: admin, method: 'POST', data: { ...input, title: ' FIRST WATER LESSON ' } });
	assert.equal(duplicate.status, 409);
	assert.match(await duplicate.text(), /A lesson with this title already exists in this phase/);
	const unchanged = await visit('/lessons/' + lessonId + '/update', { jar: admin, method: 'POST', data: input });
	assert.equal(unchanged.status, 303);
	assert.equal(unchanged.headers.get('location'), '/lessons/' + lessonId + '/edit');
	// The fixture has a custom legacy slug; saving normalizes it before this collision check.
	const collision = await visit('/lessons/upload-video', { jar: admin, method: 'POST', data: { ...input, title: original.title + '!' } });
	assert.equal(collision.status, 409);
	assert.match(await collision.text(), /already uses this title or its URL slug/);
	const secondPhase = (await driver.query("INSERT INTO phases (title, slug) VALUES ('Second title test phase', 'second-title-test') RETURNING id")).rows[0].id;
	const copy = await visit('/lessons/upload-video', { jar: admin, method: 'POST', data: { ...input, phaseId: String(secondPhase) } });
	assert.equal(copy.status, 303);
	const move = await visit('/lessons/' + lessonId + '/update', { jar: admin, method: 'POST', data: { ...input, phaseId: String(secondPhase) } });
	assert.equal(move.status, 409);
	assert.equal((await driver.query('SELECT phase_id FROM lessons WHERE id = $1', [lessonId])).rows[0].phase_id, phaseId);
	assert.equal((await visit('/lessons/999999/update', { jar: admin, method: 'POST', data: input })).status, 404);
});

test('concurrent lesson submissions save one record and return a useful duplicate error', async () => {
	const input = { phaseId: String(phaseId), title: 'Concurrent title test', description: 'Overview', content: '# Body', video_url: '', displayOrder: '0' };
	const responses = await Promise.all([1, 2].map(() => visit('/lessons/upload-video', { jar: admin, method: 'POST', data: input })));
	assert.deepEqual(responses.map(response => response.status).sort(), [303, 409]);
	const rows = (await driver.query('SELECT id FROM lessons WHERE phase_id = $1 AND title = $2', [phaseId, input.title])).rows;
	assert.equal(rows.length, 1);
});

test('legacy podcast routes redirect to their lesson equivalents and preserve POST methods', async () => {
	for (const suffix of ['', '/upload-video', '/' + lessonId + '/edit', '/' + lessonId + '/update', '/' + lessonId + '/delete']) {
		const response = await visit('/podcasts' + suffix, { jar: admin });
		assert.equal(response.status, 307, suffix);
		assert.equal(response.headers.get('location'), '/lessons' + suffix);
	}
	const posted = await visit('/podcasts/' + lessonId + '/update', { jar: admin, method: 'POST', data: {} });
	assert.equal(posted.status, 307);
});

test('admin account deletion removes its sessions and GET logout never logs a user out', async () => {
	const hash = await bcrypt.hash(password, 4);
	const victimId = (await driver.query("INSERT INTO users (name, email, password, role_id) SELECT 'Victim', 'victim@example.com', $1, id FROM roles WHERE role_name = 'user' RETURNING id", [hash])).rows[0].id;
	const victim = new Map();
	await signIn('victim@example.com', victim);
	assert.equal((await visit('/users/' + victimId + '/update', { jar: admin, method: 'POST', data: { name: 'Victim', email: 'victim@example.com', role_name: 'admin' } })).status, 303);
	assert.equal((await (await visit('/api/me', { jar: victim })).json()).user.role_name, 'admin');
	assert.equal((await visit('/logout', { jar: victim })).status, 200);
	assert.equal((await (await visit('/api/me', { jar: victim })).json()).loggedIn, true);
	const response = await visit('/users/' + victimId + '/delete', { jar: admin, method: 'POST', data: {} });
	assert.equal(response.status, 303);
	assert.equal((await (await visit('/api/me', { jar: victim })).json()).loggedIn, false);
	const jar = new Map();
	await signIn('learner@example.com', jar);
	const loggedOut = await visit('/logout', { jar, method: 'POST', data: {} });
	assert.equal(loggedOut.status, 303);
	assert.equal(loggedOut.headers.get('location'), '/');
	assert.equal((await (await visit('/api/me', { jar })).json()).loggedIn, false);
});

test('admins cannot delete their own account through the UI or a direct POST', async () => {
	const html = await (await visit('/users', { jar: admin })).text();
	assert.ok(!html.includes('action="/users/' + adminId + '/delete"'));
	const response = await visit('/users/' + adminId + '/delete', { jar: admin, method: 'POST', data: {} });
	assert.equal(response.status, 403);
	assert.equal((await driver.query('SELECT id FROM users WHERE id = $1', [adminId])).rowCount, 1);
	assert.equal((await (await visit('/api/me', { jar: admin })).json()).loggedIn, true);
});

test('logout reports a failed revocation and still clears the browser cookie', async () => {
	const jar = new Map();
	await signIn('learner@example.com', jar);
	const original = driver.query;
	driver.query = async (sql, values) => {
		if (sql === 'DELETE FROM sessions WHERE id = $1') throw new Error('Revocation unavailable');
		return original(sql, values);
	};
	try {
		const response = await visit('/logout', { jar, method: 'POST', data: {} });
		assert.equal(response.status, 503);
		assert.equal(jar.has('phase_ready_session'), false);
	} finally { driver.query = original; }
	assert.equal((await (await visit('/api/me', { jar })).json()).loggedIn, false);
});

test('login errors remain generic and repeated attempts are throttled in PostgreSQL', async () => {
	for (let i = 0; i < 10; i++) {
		const response = await visit('/login', { method: 'POST', data: { email: 'throttled@example.com', password: 'wrong password' } });
		assert.equal(response.status, 400);
		assert.match(await response.text(), /Email or password is incorrect/);
	}
	assert.equal((await visit('/login', { method: 'POST', data: { email: 'throttled@example.com', password } })).status, 429);
});

test('database failures show a useful error instead of silently returning an empty course', async () => {
	const original = driver.query;
	driver.query = async () => { throw new Error('Database unavailable'); };
	try {
		assert.equal((await visit('/phases')).status, 503);
		assert.equal((await visit('/dashboard')).status, 303);
		assert.equal((await visit('/dashboard', { jar: learner })).status, 503);
	}
	finally { driver.query = original; }
});
