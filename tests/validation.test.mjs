import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let server, forms, lessons, model, registration, login, db, originalQuery;
const signup = {
	name: ' Li ', email: ' Learner@Example.com ', confirmEmail: 'learner@example.com',
	password: '  a long passphrase  ', confirmPassword: '  a long passphrase  '
};
const lesson = {
	phaseId: '2', title: ' Water basics ', description: ' Public overview ',
	content: '# Full lesson', video_url: ' https://example.com/water.mp4 ', displayOrder: '3'
};
const formData = (values) => {
	const data = new FormData();
	for (const [field, value] of Object.entries(values)) data.append(field, value);
	return data;
};

before(async () => {
	server = await createServer({ server: { middlewareMode: true, hmr: false } });
	forms = await server.ssrLoadModule('/src/lib/server/middleware/validation/forms.ts');
	lessons = await server.ssrLoadModule('/src/lib/server/middleware/validation/lessons.ts');
	model = await server.ssrLoadModule('/src/lib/server/lessons/lessons.js');
	registration = await server.ssrLoadModule('/src/lib/server/forms/registration.js');
	login = await server.ssrLoadModule('/src/lib/server/forms/login.js');
	({ default: db } = await server.ssrLoadModule('/src/lib/server/db.js'));
	originalQuery = db.query;
	db.query = async () => { throw new Error('Unexpected database access'); };
});

after(async () => {
	if (db) { db.query = originalQuery; await db.close(); }
	if (server) await server.close();
});

test('signup normalizes confirmations consistently, preserves passwords, and strips role input', () => {
	const result = forms.registrationValidation(formData({ ...signup, role_name: 'admin' }));
	assert.equal(result.success, true);
	assert.deepEqual(result.data, { name: 'Li', email: 'learner@example.com', password: signup.password });
	assert.ok(!('role_name' in result.data));
	assert.ok(!('confirmPassword' in result.data));
});

test('confirmation errors identify their fields and never echo password values', () => {
	const result = forms.registrationValidation({ ...signup, confirmEmail: 'other@example.com', confirmPassword: 'incorrect' });
	assert.equal(result.success, false);
	assert.equal(result.data, null);
	assert.deepEqual(Object.keys(result.errors).sort(), ['confirmEmail', 'confirmPassword']);
	assert.ok(!JSON.stringify(result).includes(signup.password));
});

test('missing fields, repeated form keys, and uploaded files produce field errors', () => {
	assert.equal(forms.registrationValidation({}).success, false);
	const duplicate = formData(signup);
	duplicate.append('email', 'attacker@example.com');
	assert.match(forms.registrationValidation(duplicate).errors.email, /only once/);
	const upload = formData(signup);
	upload.set('name', new Blob(['Name']), 'name.txt');
	assert.match(forms.registrationValidation(upload).errors.name, /must be text/);
});

test('password rules match hashing, including UTF-8 byte limits and legacy login', async () => {
	for (const password of ['short', 'x'.repeat(73), '😀'.repeat(19)]) {
		assert.equal(forms.registrationValidation({ ...signup, password, confirmPassword: password }).success, false);
		await assert.rejects(registration.hashPassword(password));
	}
	assert.equal(forms.loginValidation({ email: signup.email, password: 'short' }).success, true);
	assert.equal(forms.loginValidation({ email: signup.email, password: '' }).success, false);
	assert.equal(forms.loginValidation({ email: signup.email, password: 'x'.repeat(73) }).success, false);
	assert.equal(await login.verifyPassword('x'.repeat(73), 'invalid-hash'), false);
});

test('profile validation preserves roles by default and gates role changes explicitly', () => {
	const profile = { name: 'Li', email: ' LI@Example.com ' };
	assert.deepEqual(forms.updateAccountValidation(profile).data, { name: 'Li', email: 'li@example.com', role_name: null });
	assert.equal(forms.updateAccountValidation({ ...profile, role_name: 'admin' }).success, false);
	assert.equal(forms.updateAccountValidation({ ...profile, role_name: 'admin' }, { allowRoleChange: true }).data.role_name, 'admin');
	assert.equal(forms.updateAccountValidation({ ...profile, role_name: 'owner' }, { allowRoleChange: true }).success, false);
});

test('browser lesson fields become database-ready numbers and trimmed text', () => {
	const result = lessons.lessonValidation(formData(lesson));
	assert.equal(result.success, true);
	assert.deepEqual(result.data, {
		phaseId: 2, title: 'Water basics', description: 'Public overview', content: '# Full lesson',
		video_url: 'https://example.com/water.mp4', displayOrder: 3
	});
	const textOnly = lessons.lessonValidation({ ...lesson, video_url: '', displayOrder: '' });
	assert.equal(textOnly.success, true);
	assert.equal(textOnly.data.video_url, null);
	assert.equal(textOnly.data.displayOrder, 0);
});

test('lesson validation rejects ambiguous numbers, empty Markdown, and unsupported video protocols', () => {
	for (const phaseId of ['', '0', '1.5', '1e2', '0x10', '-1', '2147483648', [], true]) {
		assert.equal(lessons.lessonValidation({ ...lesson, phaseId }).success, false, String(phaseId));
	}
	for (const video_url of ['not a URL', 'javascript:alert(1)', 'https:example.com', 'ftp://example.com/video']) {
		assert.ok(lessons.lessonValidation({ ...lesson, video_url }).errors.video_url);
	}
	assert.ok(lessons.lessonValidation({ ...lesson, content: ' ' }).errors.content);
	assert.ok(lessons.lessonValidation({ ...lesson, title: '!!!' }).errors.title);
	assert.ok(lessons.lessonValidation({ ...lesson, displayOrder: '-1' }).errors.displayOrder);
});

test('form and database models enforce the same lesson limits before querying', async () => {
	const parsed = lessons.lessonValidation(lesson).data;
	for (const change of [{ title: 'x'.repeat(226) }, { video_url: 'file:///video.mp4' }, { content: ' ' }, { displayOrder: -1 }]) {
		assert.equal(lessons.lessonValidation({ ...lesson, ...change }).success, false);
		await assert.rejects(model.saveLesson({ ...parsed, ...change }), (error) => !error.message.includes('Unexpected database'));
		await assert.rejects(model.updateLesson(1, { ...parsed, ...change }), (error) => !error.message.includes('Unexpected database'));
	}
});
