import { immutable, assets, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { isPublicGuide } from '../lib/public-routes.js';

const CACHE = `phase-ready-guides-${version}`;
const urls = [...new Set([
	...immutable.map((file) => file.path), ...assets.map((file) => file.path),
	...prerendered.map((page) => page.path)
])];
const worker = /** @type {ServiceWorkerGlobalScope} */ (/** @type {unknown} */ (self));

worker.addEventListener('install', (event) => {
	// A failed download prevents activation, preserving the previous complete version.
	event.waitUntil((async () => {
		const cache = await caches.open(CACHE);
		await cache.addAll(urls);
	})());
	// Let existing tabs finish with their current version; do not force skipWaiting.
});

worker.addEventListener('activate', (event) => {
	event.waitUntil((async () => {
		await worker.clients.claim();
		for (const key of await caches.keys()) {
			if (key.startsWith('phase-ready-guides-') && key !== CACHE) await caches.delete(key);
		}
	})());
});

worker.addEventListener('message', (event) => {
	if (event.data?.type !== 'VERIFY_OFFLINE') return;
	event.waitUntil((async () => {
		const cache = await caches.open(CACHE);
		const ready = urls.length > 0 && (await Promise.all(urls.map((url) => cache.match(url)))).every(Boolean);
		event.ports[0]?.postMessage({ ready, version, pages: prerendered.filter((page) => isPublicGuide(page.path)).length });
	})());
});

worker.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== worker.location.origin) return;
	// Full page navigation makes offline HTML sufficient; no account HTML, API
	// responses, videos, or arbitrary runtime responses are written into this cache.
	if (url.search || (!urls.includes(url.pathname) && !isPublicGuide(url.pathname))) return;
	event.respondWith((async () => {
		const cache = await caches.open(CACHE);
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
		return fetch(event.request);
	})());
});
