<script lang="ts">
	import type { LayoutProps } from './$types';
	import SiteShell from '#lib/SiteShell.svelte';
	import './portal.css';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { sessionUser } from '#lib/session.js';
	import OfflineStatus from '#lib/OfflineStatus.svelte';

	let { children, data }: LayoutProps = $props();
	let requestVersion = 0;
	afterNavigate(() => {
		const version = ++requestVersion;
		sessionUser.set(data.publicGuide ? null : data.currentUser);
		if (data.publicGuide) {
			fetch('/api/me', { cache: 'no-store' }).then(async (response) => {
				if (!response.ok) return;
				const account = await response.json();
				if (version === requestVersion) sessionUser.set(account.user);
			}).catch(() => { /* Public reading remains available without authentication. */ });
		}
	});
	let shellData = $derived({ ...data, pathname: page.url.pathname,
		currentUser: data.publicGuide ? $sessionUser : data.currentUser,
		isLoggedIn: data.publicGuide ? $sessionUser !== null : data.isLoggedIn });
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
	<link rel="manifest" href="/manifest.webmanifest" />
	<meta name="theme-color" content="#183c46" />
</svelte:head>

{#each Object.entries(data.flashMessages) as [type, messages]}
	{#each messages as message}
		<div class="flash-message" class:error={type === 'error'} role={type === 'error' ? 'alert' : 'status'}>
			<strong>{type}:</strong> {message}
		</div>
	{/each}
{/each}

<SiteShell data={shellData}>
	{#if data.publicGuide}<OfflineStatus />{/if}
	{@render children()}
</SiteShell>

<style>
	.flash-message { padding: 1rem; background: #e4f0f2; color: #183c46; font-family: system-ui, sans-serif; }
	.flash-message strong { text-transform: capitalize; }
	.flash-message.error { background: #f7e5df; color: #752e29; }
</style>
