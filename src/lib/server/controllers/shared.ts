import { error, fail } from '@sveltejs/kit';

export function routeId(raw: string | undefined) {
	if (!raw || !/^\d+$/.test(raw)) error(404, 'Not found.');
	const id = Number(raw);
	if (!Number.isInteger(id) || id < 1 || id > 2147483647) error(404, 'Not found.');
	return id;
}

export async function database<T>(operation: () => Promise<T>): Promise<T> {
	try { return await operation(); }
	catch { error(503, 'The database is unavailable. Please try again shortly.'); }
}

export function safeValues(data: FormData, fields: string[]) {
	return Object.fromEntries(fields.map((field) => [field, typeof data.get(field) === 'string' ? String(data.get(field)) : '']));
}

export function formFailure(cause: unknown, values: Record<string, string>, duplicateField: string) {
	const code = typeof cause === 'object' && cause !== null && 'code' in cause ? cause.code : undefined;
	if (code === '23505') return fail(409, { errors: { [duplicateField]: 'That value is already in use.' }, values });
	if (code === '23503') return fail(400, { errors: { phaseId: 'Choose an existing phase.' }, values });
	return fail(503, { errors: { form: 'Unable to save right now. Please try again shortly.' }, values });
}
