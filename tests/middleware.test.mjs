import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { after, before, beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let server, db, originalQuery, originalTransaction, middleware, sessions, auth, layout;
let stored, users, statements;
const digest = (token) => createHash('sha256').update(token).digest('hex');
const blank = () => ({ success: [], error: [], warning: [], info: [] });

// A database double exercises the hook and helpers without touching Render.
// It does not validate PostgreSQL syntax or replace a database integration test.
async function query(text, values = []) {
	const sql = text.replace(/\s+/g, ' ').trim();
	statements.push({ sql, values });
	const result = (rows) => ({ rows, rowCount: rows.length });
	if (sql.startsWith('SELECT sessions.id AS session_id')) {
		assert.match(sql, /sessions.expires_at > CURRENT_TIMESTAMP/);
		const session = stored.get(values[0]);
		if (!session || session.expires_at <= new Date()) return result([]);
		return result([{ session_id: values[0], expires_at: session.expires_at, ...users.get(session.user_id) }]);
	}
	if (sql.startsWith('SELECT users.id')) return result(users.has(values[0]) ? [users.get(values[0])] : []);
	if (sql.startsWith('INSERT INTO sessions')) {
		stored.set(values[0], { user_id: values[1], expires_at: values[2], flash: blank() });
		return result([]);
	}
	if (sql === 'DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP') {
		for (const [id, session] of stored) if (session.expires_at <= new Date()) stored.delete(id);
		return result([]);
	}
	if (sql === 'DELETE FROM sessions WHERE id = $1') {
		stored.delete(values[0]);
		return result([]);
	}
	if (sql.startsWith('SELECT flash FROM sessions')) {
		assert.match(sql, /FOR UPDATE$/);
		const session = stored.get(values[0]);
		return result(session && session.expires_at > new Date() ? [{ flash: structuredClone(session.flash) }] : []);
	}
	if (sql.startsWith('UPDATE sessions SET flash')) {
		stored.get(values[1]).flash = JSON.parse(values[0]);
		return result([]);
	}
	throw new Error(`Unexpected database operation: ${sql}`);
}

function event(path = '/', token) {
	const jar = new Map(token ? [[sessions.SESSION_COOKIE, token]] : []);
	return {
		url: new URL(path, 'http://localhost'),
		route: { id: new URL(path, 'http://localhost').pathname },
		locals: {},
		cookies: {
			get: (name) => jar.get(name),
			set: (name, value, options) => { jar.set(name, value); jar.set(`${name}:options`, options); },
			delete: (name) => jar.delete(name)
		}
	};
}

async function initialize(request) {
	await middleware.handle({ event: request, resolve: async () => new Response('OK') });
	return request;
}

before(async () => {
	server = await createServer({ server: { middlewareMode: true, hmr: false } });
	({ default: db } = await server.ssrLoadModule('/src/lib/server/db.js'));
	originalQuery = db.query;
	originalTransaction = db.transaction;
	db.query = query;
	db.transaction = (callback) => callback({ query });
	middleware = await server.ssrLoadModule('/src/hooks.server.ts');
	sessions = await server.ssrLoadModule('/src/lib/server/sessions.ts');
	auth = await server.ssrLoadModule('/src/lib/server/middleware/auth.ts');
	layout = await server.ssrLoadModule('/src/routes/+layout.server.ts');
});

beforeEach(() => {
	stored = new Map();
	users = new Map([
		[5, { id: 5, name: 'Learner', email: 'learner@example.com', role_name: 'user', password: 'DO_NOT_EXPOSE' }],
		[9, { id: 9, name: 'Admin', email: 'admin@example.com', role_name: 'admin', password: 'DO_NOT_EXPOSE' }]
	]);
	statements = [];
});

after(async () => {
	if (db) { db.query = originalQuery; db.transaction = originalTransaction; await db.close(); }
	if (server) await server.close();
});

test('anonymous requests and global layout data work without database access', async () => {
	const request = await initialize(event('/?search=water'));
	const data = await layout.load({ ...request, depends: () => {} });
	assert.equal(data.currentUser, null);
	assert.equal(data.isLoggedIn, false);
	assert.equal(data.queryParams.search, 'water');
	assert.equal(data.currentYear, new Date().getFullYear());
	assert.deepEqual(data.flashMessages, blank());
	assert.equal(statements.length, 0);
	assert.ok(!('session' in data));
});

test('malformed, unknown, and expired tokens cannot authenticate', async () => {
	const malformed = await initialize(event('/', 'user=9;role=admin'));
	assert.equal(malformed.locals.currentUser, null);
	assert.equal(malformed.cookies.get(sessions.SESSION_COOKIE), undefined);
	assert.equal(statements.length, 0);
	const token = 'a'.repeat(64);
	stored.set(digest(token), { user_id: 9, expires_at: new Date(0), flash: blank() });
	const expired = await initialize(event('/', token));
	assert.equal(expired.locals.currentUser, null);
	assert.equal(expired.cookies.get(sessions.SESSION_COOKIE), undefined);
	stored.clear();
	assert.equal((await initialize(event('/', token))).locals.currentUser, null);
});

test('sessions hash tokens, restore current roles, and exclude password data', async () => {
	const request = await initialize(event());
	await sessions.startSession(request, 9);
	const token = request.cookies.get(sessions.SESSION_COOKIE);
	assert.match(token, /^[a-f0-9]{64}$/);
	assert.equal(stored.has(token), false);
	assert.equal(stored.has(digest(token)), true);
	assert.equal(request.locals.session.id, digest(token));
	assert.ok(!('password' in request.locals.currentUser));
	assert.equal(request.cookies.get(`${sessions.SESSION_COOKIE}:options`).httpOnly, true);
	assert.equal(request.cookies.get(`${sessions.SESSION_COOKIE}:options`).sameSite, 'lax');
	users.get(9).role_name = 'user';
	const next = await initialize(event('/', token));
	assert.equal(next.locals.currentUser.role_name, 'user');
	assert.ok(!('password' in next.locals.currentUser));
	await assert.rejects(auth.requireRole('admin')(next), (error) => error.status === 403);
});

test('login rotation revokes the guest token and logout revokes the login token', async () => {
	const request = await initialize(event());
	await request.locals.flash('info', 'Guest message');
	const guestToken = request.cookies.get(sessions.SESSION_COOKIE);
	await sessions.startSession(request, 5);
	assert.equal(stored.has(digest(guestToken)), false);
	const loginToken = request.cookies.get(sessions.SESSION_COOKIE);
	assert.notEqual(loginToken, guestToken);
	assert.equal(request.locals.isLoggedIn, true);
	await sessions.endSession(request);
	assert.equal(stored.has(digest(loginToken)), false);
	assert.equal(request.cookies.get(sessions.SESSION_COOKIE), undefined);
	assert.equal(request.locals.currentUser, null);
});

test('flash messages survive a redirect and are consumed by type or all at once', async () => {
	const request = await initialize(event());
	await request.locals.flash('success', 'Saved lesson');
	await request.locals.flash('info', 'Next step');
	const next = await initialize(event('/', request.cookies.get(sessions.SESSION_COOKIE)));
	assert.deepEqual(await next.locals.flash('success'), ['Saved lesson']);
	assert.deepEqual(await next.locals.flash('success'), []);
	assert.deepEqual(await next.locals.flash(), { ...blank(), info: ['Next step'] });
	assert.deepEqual(await next.locals.flash(), blank());
	const other = await initialize(event());
	assert.deepEqual(await other.locals.flash(), blank());
});

test('logout clears browser state but propagates database revocation failure', async () => {
	const request = await initialize(event());
	await sessions.startSession(request, 9);
	const sessionId = request.locals.session.id;
	const previous = db.query;
	db.query = async () => { throw new Error('Revocation unavailable'); };
	try {
		await assert.rejects(sessions.endSession(request), /Revocation unavailable/);
		assert.equal(request.cookies.get(sessions.SESSION_COOKIE), undefined);
		assert.equal(request.locals.currentUser, null);
		assert.equal(request.locals.session, null);
		assert.equal(request.locals.isLoggedIn, false);
		assert.equal(stored.has(sessionId), true);
	} finally { db.query = previous; }
});

test('flash input is validated, bounded, and separate requests cannot share it', async () => {
	const request = await initialize(event());
	await assert.rejects(request.locals.flash('bad', 'Message'), /Invalid flash type/);
	await assert.rejects(request.locals.flash('error', 'x'.repeat(501)), /500 characters/);
	assert.equal(stored.size, 0);
	for (let i = 0; i < 11; i++) await request.locals.flash('info', `Message ${i}`);
	const messages = await request.locals.flash('info');
	assert.equal(messages.length, 10);
	assert.equal(messages[0], 'Message 1');
});

test('guards redirect anonymous users, reject learners, and allow admins on POSTs too', async () => {
	const request = event('/admin/lessons');
	request.request = new Request(request.url, { method: 'POST' });
	await assert.rejects(initialize(request), (error) => error.status === 303 && error.location === '/login');
	const next = await initialize(event('/', request.cookies.get(sessions.SESSION_COOKIE)));
	assert.deepEqual(await next.locals.flash('error'), ['You must be logged in to access this page.']);
	await sessions.startSession(next, 5);
	const learner = event('/admin/lessons', next.cookies.get(sessions.SESSION_COOKIE));
	await assert.rejects(initialize(learner), (error) => error.status === 403);
	await sessions.startSession(next, 9);
	const admin = await initialize(event('/admin/lessons', next.cookies.get(sessions.SESSION_COOKIE)));
	assert.equal(admin.locals.currentUser.id, 9);
});

test('database outages fail closed rather than granting access', async () => {
	const previous = db.query;
	db.query = async () => { throw new Error('Unavailable'); };
	try {
		await assert.rejects(initialize(event('/admin', 'b'.repeat(64))), (error) => error.status === 503);
	} finally { db.query = previous; }
});

test('canonical admin route IDs protect encoded URLs and route groups', async () => {
	const request = await initialize(event());
	await sessions.startSession(request, 5);
	const encoded = event('/%61dmin/lessons', request.cookies.get(sessions.SESSION_COOKIE));
	encoded.route.id = '/(dashboard)/admin/lessons';
	await assert.rejects(initialize(encoded), (error) => error.status === 403);
});
