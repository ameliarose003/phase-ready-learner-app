<script lang="ts">
	import type { LayoutProps } from './$types';
	import SiteShell from '#lib/SiteShell.svelte';
	import './portal.css';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</svelte:head>

{#each Object.entries(data.flashMessages) as [type, messages]}
	{#each messages as message}
		<div class="flash-message" class:error={type === 'error'} role={type === 'error' ? 'alert' : 'status'}>
			<strong>{type}:</strong> {message}
		</div>
	{/each}
{/each}

<SiteShell {data}>
	{@render children()}
</SiteShell>

<style>
	.flash-message { padding: 1rem; background: #e4f0f2; color: #183c46; font-family: system-ui, sans-serif; }
	.flash-message strong { text-transform: capitalize; }
	.flash-message.error { background: #f7e5df; color: #752e29; }
</style>
