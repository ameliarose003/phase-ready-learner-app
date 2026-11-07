export type Progress = { key: string; owner: string; lessonId: number; completed: boolean; pending: boolean; revision: string };

function openDatabase(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('phase-ready', 1);
		request.onupgradeneeded = () => request.result.createObjectStore('progress', { keyPath: 'key' });
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

async function store<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await openDatabase();
	return new Promise((resolve, reject) => {
		const transaction = db.transaction('progress', mode);
		const request = operation(transaction.objectStore('progress'));
		transaction.oncomplete = () => { db.close(); resolve(request.result); };
		transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error('Local storage failed.')); };
	});
}

export const readProgress = (owner: string, lessonId: number): Promise<Progress | undefined> =>
	store('readonly', (store) => store.get(`${owner}:${lessonId}`));

export async function saveProgress(owner: string, lessonId: number, completed: boolean, pending: boolean) {
	const record: Progress = { key: `${owner}:${lessonId}`, owner, lessonId, completed, pending, revision: crypto.randomUUID() };
	await store('readwrite', (store) => store.put(record));
	return record;
}

export async function progressRequest(userId: number, lessonId: number, data: { completed?: boolean; opened?: boolean }) {
	const response = await fetch(`/api/lessons/${lessonId}/progress`, {
		method: 'POST', headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ ...data, userId }), redirect: 'error', cache: 'no-store'
	});
	if (!response.ok) throw new Error('Progress could not be synchronized.');
	return response.json() as Promise<{ completed: boolean }>;
}

export async function syncProgress(userId: number) {
	const response = await fetch('/api/me', { cache: 'no-store' });
	if (!response.ok || (await response.json()).user?.id !== userId) throw new Error('Sign in to the same account to sync.');
	const owner = String(userId);
	const records: Progress[] = await store('readonly', (store) => store.getAll());
	for (const record of records.filter((record) => record.owner === owner && record.pending)) {
		try { await progressRequest(userId, record.lessonId, { completed: record.completed }); }
		catch { continue; }
		const db = await openDatabase();
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction('progress', 'readwrite');
			const records = transaction.objectStore('progress');
			const request = records.get(record.key);
			request.onsuccess = () => {
				if (request.result?.revision === record.revision) records.put({ ...record, pending: false });
			};
			transaction.oncomplete = () => { db.close(); resolve(); };
			transaction.onerror = transaction.onabort = () => { db.close(); reject(transaction.error); };
		});
	}
}
